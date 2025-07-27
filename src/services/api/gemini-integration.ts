/**
 * Google Gemini API 整合服務
 * 處理自然語言查詢解析為結構化資料查詢
 * 支援 AI RolePlay 訓練系統
 */

// @ts-ignore - 套件類型定義問題
import { GoogleGenAI, FunctionCallingConfigMode } from '@google/genai';
import {
  QueryInterpretation,
  ClarificationRequest,
  GeminiQueryRequest,
  GeminiQueryResponse
} from '../../types/data-visualization';
import { UserContext } from '../../types/auth';
import {
  StateType,
  DialogueOptions,
  AIResponse,
  PromptVariables,
  RolePlayError
} from '../../types/roleplay';

// Gemini API 配置
const GEMINI_MODEL = 'gemini-2.0-flash-001';
const GEMINI_FLASH_MODEL = 'gemini-1.5-flash';
const GEMINI_PRO_MODEL = 'gemini-1.5-pro';

// 注意：Gemini AI 現在透過 Cloud Functions 呼叫，不再需要前端 API Key

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
    const model = getGeminiClient().getGenerativeModel({
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
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
  if (!apiKey) {
    console.error('未設定 GEMINI_API_KEY');
    return false;
  }

  try {
    const model = getGeminiClient().getGenerativeModel({ model: GEMINI_MODEL });
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
  for (const [key, value] of Array.from(interpretationCache.entries())) {
    if (now - value.timestamp > CACHE_DURATION) {
      interpretationCache.delete(key);
    }
  }
}

// ===== RolePlay 系統擴展功能 =====

/**
 * RolePlay 系統的快取管理
 */
const roleplayCache = new Map<string, {
  response: AIResponse;
  timestamp: number;
}>();

const ROLEPLAY_CACHE_DURATION = 30 * 60 * 1000; // 30分鐘（RolePlay 對話較長）

/**
 * 分析客戶心理狀態
 * 使用 Function Calling 確保結構化輸出
 */
export async function analyzeCustomerState(
  prompt: string,
  useAdvancedModel: boolean = false
): Promise<{
  state: StateType;
  confidence: number;
  reason: string;
  suggestedResponse?: string;
}> {
  try {
    const stateAnalysisFunction = {
      name: 'analyzeCustomerState',
      description: '分析客戶心理狀態',
      parametersJsonSchema: {
        type: 'object',
        properties: {
          state: {
            type: 'string',
            enum: Object.values(StateType),
            description: '客戶當前心理狀態'
          },
          confidence: {
            type: 'number',
            minimum: 0,
            maximum: 1,
            description: '分析信心度 0-1'
          },
          reason: {
            type: 'string',
            description: '狀態判斷原因'
          },
          suggestedResponse: {
            type: 'string',
            description: '建議的回應策略'
          }
        },
        required: ['state', 'confidence', 'reason']
      }
    };

    const model = getGeminiClient().getGenerativeModel({
      model: useAdvancedModel ? GEMINI_PRO_MODEL : GEMINI_FLASH_MODEL,
      systemInstruction: '你是一個銷售心理分析專家，專門分析客戶在銷售對話中的心理狀態。'
    });

    const response = await model.generateContent({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.8,      // 角色扮演需要變化性
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 500   // Gemini 用字元計價，可以大方一點
      },
      tools: [{
        functionDeclarations: [stateAnalysisFunction]
      }],
      toolConfig: {
        functionCallingConfig: {
          mode: FunctionCallingConfigMode.ANY,
          allowedFunctionNames: ['analyzeCustomerState']
        }
      }
    });

    const result = response.response;
    const functionCall = result.candidates?.[0]?.content?.parts?.[0]?.functionCall;
    
    if (!functionCall || functionCall.name !== 'analyzeCustomerState') {
      throw new RolePlayError('無法分析客戶狀態', 'STATE_ANALYSIS_FAILED');
    }

    return functionCall.args as any;
  } catch (error) {
    console.error('狀態分析錯誤:', error);
    throw new RolePlayError(
      '狀態分析失敗',
      'STATE_ANALYSIS_ERROR',
      error
    );
  }
}

/**
 * 生成客戶回應
 * 支援快速版和完整版
 */
export async function generateCustomerResponse(
  prompt: string,
  options: {
    useAdvancedModel?: boolean;
    quickMode?: boolean;
    maxOutputTokens?: number;
  } = {}
): Promise<string> {
  try {
    const {
      useAdvancedModel = false,
      quickMode = false,
      maxOutputTokens = quickMode ? 150 : 500
    } = options;

    // 檢查快取
    const cacheKey = `response:${quickMode}:${prompt.substring(0, 100)}`;
    const cached = roleplayCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < ROLEPLAY_CACHE_DURATION) {
      // 如果找到快取，使用 rewrite 功能變化回應
      return await rewriteResponse(cached.response.customerResponse, quickMode);
    }

    const model = getGeminiClient().getGenerativeModel({
      model: useAdvancedModel ? GEMINI_PRO_MODEL : GEMINI_FLASH_MODEL
    });

    const response = await model.generateContent({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.85,      // 角色扮演需要自然變化
        topK: 40,
        topP: 0.95,
        maxOutputTokens
      }
    });

    const text = response.response.text();
    
    // 儲存到快取
    roleplayCache.set(cacheKey, {
      response: { customerResponse: text, confidence: 0.9 } as AIResponse,
      timestamp: Date.now()
    });

    return text;
  } catch (error) {
    console.error('生成客戶回應錯誤:', error);
    throw new RolePlayError(
      '生成回應失敗',
      'RESPONSE_GENERATION_ERROR',
      error
    );
  }
}

/**
 * 重寫回應以避免重複
 * 使用 Flash 模型快速生成變化版本
 */
async function rewriteResponse(original: string, quickMode: boolean): Promise<string> {
  try {
    const model = getGeminiClient().getGenerativeModel({
      model: GEMINI_FLASH_MODEL  // 總是使用 Flash 進行重寫（便宜）
    });

    const prompt = quickMode 
      ? `用不同的方式說這句話（保持簡短）：${original}`
      : `換個方式表達以下內容，保持相同的語氣和意思：${original}`;

    const response = await model.generateContent({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: quickMode ? 100 : 300
      }
    });

    return response.response.text();
  } catch (error) {
    // 如果重寫失敗，返回原始回應
    console.warn('重寫回應失敗，使用原始回應:', error);
    return original;
  }
}

/**
 * RolePlay 對話處理主函數
 * 整合狀態分析和回應生成
 */
export async function processRolePlayDialogue(
  options: DialogueOptions & {
    systemPrompt: string;
    stateAnalysisPrompt: string;
    currentState: StateType;
  }
): Promise<AIResponse> {
  try {
    const { useAdvancedModel = false } = options;

    // 步驟 1: 分析狀態（可能需要 Pro 模型）
    const stateAnalysis = await analyzeCustomerState(
      options.stateAnalysisPrompt,
      useAdvancedModel
    );

    // 步驟 2: 生成客戶回應
    const customerResponse = await generateCustomerResponse(
      options.systemPrompt,
      {
        useAdvancedModel,
        quickMode: stateAnalysis.confidence > 0.8  // 高信心度時使用快速模式
      }
    );

    // 步驟 3: 生成提示（如果啟用）
    let hint: string | undefined;
    if (options.enableHints) {
      hint = stateAnalysis.suggestedResponse;
    }

    return {
      customerResponse,
      stateChange: stateAnalysis.state !== options.currentState ? {
        from: options.currentState,
        to: stateAnalysis.state,
        reason: stateAnalysis.reason
      } : undefined,
      hint,
      confidence: stateAnalysis.confidence
    };
  } catch (error) {
    console.error('RolePlay 對話處理錯誤:', error);
    throw new RolePlayError(
      '對話處理失敗',
      'DIALOGUE_PROCESSING_ERROR',
      error
    );
  }
}

/**
 * 批量處理提示生成
 * 用於生成多個客戶原型的初始提示
 */
export async function batchGeneratePrompts(
  templates: Array<{
    template: string;
    variables: PromptVariables;
  }>,
  useAdvancedModel: boolean = false
): Promise<string[]> {
  try {
    const model = getGeminiClient().getGenerativeModel({
      model: useAdvancedModel ? GEMINI_PRO_MODEL : GEMINI_FLASH_MODEL
    });

    // 批量處理，減少 API 呼叫
    const batchPrompt = templates.map((t, i) => {
      let prompt = t.template;
      for (const [key, value] of Object.entries(t.variables)) {
        prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      }
      return `[提示 ${i + 1}]\n${prompt}`;
    }).join('\n\n---\n\n');

    const response = await model.generateContent({
      contents: [{ parts: [{ text: `請為每個提示生成適當的回應：\n\n${batchPrompt}` }] }],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 2000  // 批量處理需要更多輸出
      }
    });

    // 解析批量回應
    const text = response.response.text();
    return text.split(/\[提示 \d+\]/).filter(s => s.trim()).map(s => s.trim());
  } catch (error) {
    console.error('批量生成提示錯誤:', error);
    throw new RolePlayError(
      '批量生成失敗',
      'BATCH_GENERATION_ERROR',
      error
    );
  }
}

/**
 * 清理 RolePlay 快取
 */
export function cleanupRolePlayCache(): void {
  const now = Date.now();
  for (const [key, value] of Array.from(roleplayCache.entries())) {
    if (now - value.timestamp > ROLEPLAY_CACHE_DURATION) {
      roleplayCache.delete(key);
    }
  }
}

/**
 * 獲取 RolePlay 快取統計
 */
export function getRolePlayCacheStats(): {
  size: number;
  hitRate: number;
  oldestEntry: Date | null;
} {
  const entries = Array.from(roleplayCache.values());
  return {
    size: roleplayCache.size,
    hitRate: 0, // 需要額外追蹤命中率
    oldestEntry: entries.length > 0 
      ? new Date(Math.min(...entries.map(e => e.timestamp)))
      : null
  };
}