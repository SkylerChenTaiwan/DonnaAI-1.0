/**
 * Google Gemini API 整合服務
 * 處理自然語言查詢解析為結構化資料查詢
 */

import { GoogleGenAI, FunctionCallingConfigMode } from '@google/genai';
import {
  QueryInterpretation,
  ClarificationRequest,
  GeminiQueryRequest,
  GeminiQueryResponse
} from '../../types/data-visualization';
import { UserContext } from '../../types/auth';

// Gemini API 配置
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-2.0-flash-001';

// 初始化 Gemini AI 客戶端
const genAI = new GoogleGenAI(GEMINI_API_KEY);

/**
 * 使用 Gemini 解析自然語言查詢
 * 最小化 token 使用，支援澄清機制
 */
export async function interpretDataQueryWithGemini(
  query: string,
  userContext: UserContext,
  clarificationResponse?: any
): Promise<QueryInterpretation> {
  try {
    // 如果是澄清回應，直接合併參數
    if (clarificationResponse) {
      const mergedQuery = `${query} ${Object.entries(clarificationResponse)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ')}`;
      query = mergedQuery;
    }

    // 定義函數宣告（JSON Schema）
    const queryInterpretationFunction = {
      name: 'interpretDataQuery',
      description: '解析自然語言查詢為結構化資料查詢參數',
      parametersJsonSchema: {
        type: 'object',
        properties: {
          dataType: {
            type: 'string',
            enum: ['customers', 'records', 'tasks', 'aiUsage'],
            description: '查詢的資料類型'
          },
          metrics: {
            type: 'array',
            items: { type: 'string' },
            description: '需要計算的指標（如：count, sum, average）'
          },
          dimensions: {
            type: 'array',
            items: { type: 'string' },
            description: '分組維度（如：user, team, time, status）'
          },
          filters: {
            type: 'object',
            description: '篩選條件',
            properties: {
              userId: { type: 'string' },
              teamId: { type: 'string' },
              status: { type: 'string' },
              type: { type: 'string' },
              priority: { type: 'string' }
            }
          },
          timeRange: {
            type: 'object',
            properties: {
              start: { type: 'string', format: 'date' },
              end: { type: 'string', format: 'date' }
            },
            description: '時間範圍'
          },
          suggestedChartType: {
            type: 'string',
            enum: ['bar', 'line', 'pie', 'scatter', 'grouped-bar', 'stacked-bar'],
            description: '建議的圖表類型'
          },
          clarificationNeeded: {
            type: 'object',
            properties: {
              fields: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    label: { type: 'string' },
                    type: { 
                      type: 'string', 
                      enum: ['select', 'multiselect', 'dateRange'] 
                    },
                    options: { 
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          value: { type: 'string' },
                          label: { type: 'string' },
                          default: { type: 'boolean' }
                        }
                      }
                    },
                    defaultValue: { type: 'string' },
                    required: { type: 'boolean' }
                  }
                }
              }
            },
            description: '需要澄清的欄位（盡量提供預設值）'
          }
        },
        required: ['dataType', 'metrics', 'suggestedChartType']
      }
    };

    // 準備系統提示
    const systemPrompt = `
分析用戶的資料查詢需求，轉換為結構化查詢參數。

資料類型說明：
- customers: 客戶資料（姓名、公司、標籤、最後聯絡日期、下次跟進日期）
- records: 會議/通話紀錄（標題、類型、時長、參與者、AI摘要、行動項目）
- tasks: 任務（標題、描述、狀態、優先級、截止日期、負責人）
- aiUsage: AI使用統計（處理分鐘數、信心分數、使用的功能）

可用指標：
- count: 計數
- sum: 總和（適用於數值欄位如時長、分鐘數）
- average: 平均值
- percentage: 百分比（如完成率）

可用維度：
- time: 時間維度（日、週、月）
- user: 用戶/業務員維度
- team: 團隊維度
- status: 狀態維度（如任務狀態）
- type: 類型維度（如紀錄類型）
- priority: 優先級維度

圖表選擇原則：
- bar: 比較不同類別的數值
- line: 顯示趨勢變化
- pie: 顯示比例分佈
- grouped-bar: 多組數據比較
- stacked-bar: 顯示組成部分

重要原則：
1. 如果查詢不明確，在 clarificationNeeded 中列出需要的資訊
2. 為每個需要澄清的欄位提供合理的預設值
3. 時間範圍預設為本月
4. 盡量一次性收集所有需要的資訊
5. 根據用戶角色過濾可存取的資料
`;

    // 建立 Gemini 模型實例
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      systemInstruction: systemPrompt
    });

    // 準備用戶查詢內容
    const userPrompt = `
查詢：${query}
用戶角色：${userContext.role}
可存取團隊：${userContext.teamIds?.join(', ') || '全部'}

請分析這個查詢並轉換為結構化參數。如果資訊不足，提供澄清表單。
`;

    // 呼叫 Gemini API
    const response = await model.generateContent({
      contents: [{ parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: 0.3,  // 較低溫度以獲得一致結果
        topK: 1,
        topP: 0.8,
        maxOutputTokens: 1024
      },
      tools: [{
        functionDeclarations: [queryInterpretationFunction]
      }],
      toolConfig: {
        functionCallingConfig: {
          mode: FunctionCallingConfigMode.ANY,
          allowedFunctionNames: ['interpretDataQuery']
        }
      }
    });

    // 解析回應
    const result = response.response;
    const functionCall = result.candidates?.[0]?.content?.parts?.[0]?.functionCall;
    
    if (!functionCall || functionCall.name !== 'interpretDataQuery') {
      throw new Error('無法解析查詢，請重新描述您的需求');
    }

    const args = functionCall.args as any;
    
    // 構建解析結果
    const interpretation: QueryInterpretation = {
      entities: {
        dataType: args.dataType,
        metrics: args.metrics || [],
        dimensions: args.dimensions || [],
        filters: args.filters || {},
        timeRange: args.timeRange ? {
          start: new Date(args.timeRange.start),
          end: new Date(args.timeRange.end)
        } : undefined
      },
      suggestedChartType: args.suggestedChartType,
      confidence: 0.9,  // Gemini 通常表現良好
      clarificationNeeded: args.clarificationNeeded
    };

    return interpretation;
  } catch (error) {
    console.error('Gemini API 錯誤:', error);
    throw new Error('查詢解析失敗，請稍後再試');
  }
}

/**
 * 驗證 Gemini API 是否可用
 */
export async function validateGeminiAPI(): Promise<boolean> {
  if (!GEMINI_API_KEY) {
    console.error('未設定 GEMINI_API_KEY');
    return false;
  }

  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const result = await model.generateContent('測試連線');
    return !!result.response;
  } catch (error) {
    console.error('Gemini API 驗證失敗:', error);
    return false;
  }
}

/**
 * 生成查詢摘要（用於儲存查詢歷史）
 */
export async function generateQuerySummary(
  interpretation: QueryInterpretation
): Promise<string> {
  const { entities, suggestedChartType } = interpretation;
  
  // 簡單組合摘要，不需要呼叫 API
  const dataTypeMap = {
    customers: '客戶',
    records: '紀錄',
    tasks: '任務',
    aiUsage: 'AI使用'
  };

  const chartTypeMap = {
    bar: '長條圖',
    line: '折線圖',
    pie: '圓餅圖',
    scatter: '散點圖',
    'grouped-bar': '分組長條圖',
    'stacked-bar': '堆疊長條圖'
  };

  const timeRangeStr = entities.timeRange ? 
    `${entities.timeRange.start.toLocaleDateString()} 至 ${entities.timeRange.end.toLocaleDateString()}` : 
    '全部時間';

  return `${dataTypeMap[entities.dataType]}的${entities.metrics.join('、')}${chartTypeMap[suggestedChartType]} (${timeRangeStr})`;
}

/**
 * 快取管理
 */
const interpretationCache = new Map<string, {
  interpretation: QueryInterpretation;
  timestamp: number;
}>();

const CACHE_DURATION = 15 * 60 * 1000; // 15分鐘

/**
 * 獲取快取的解析結果
 */
export function getCachedInterpretation(query: string): QueryInterpretation | null {
  const cached = interpretationCache.get(query);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.interpretation;
  }
  interpretationCache.delete(query);
  return null;
}

/**
 * 儲存解析結果到快取
 */
export function cacheInterpretation(query: string, interpretation: QueryInterpretation): void {
  interpretationCache.set(query, {
    interpretation,
    timestamp: Date.now()
  });
}

/**
 * 清理過期快取
 */
export function cleanupCache(): void {
  const now = Date.now();
  for (const [key, value] of interpretationCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      interpretationCache.delete(key);
    }
  }
}