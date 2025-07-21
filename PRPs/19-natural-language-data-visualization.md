# PRP-19: 自然語言資料視覺化系統

## 專案摘要

實作一個功能，讓用戶可以用自然語言描述想要查看的資料和統計，系統將自動：
1. 理解用戶意圖並轉換為資料查詢
2. 從 Firebase 資料庫抓取相關資料
3. 自動選擇合適的圖表類型
4. 生成互動式視覺化圖表

## 核心功能需求

### 1. 自然語言查詢介面
- 在首頁新增「智能分析」入口
- 支援文字輸入和語音輸入（利用現有語音功能）
- 查詢歷史記錄功能（儲存完整查詢，不是對話）
- **澄清專用介面**：僅用於 AI 收集必要資訊

### 2. AI 查詢理解引擎
- 解析自然語言意圖
- 識別查詢的實體（客戶、紀錄、任務、時間範圍等）
- 轉換為結構化查詢參數
- 建議最適合的圖表類型
- **最小化澄清機制**：
  - 一次性收集所有缺失資訊
  - 提供預設選項減少往返
  - 使用結構化表單而非自由對話
  - 澄清完成後直接生成圖表

### 3. 資料查詢與處理
- 基於現有的跨資料庫查詢函式
- 支援多維度資料聚合
- 時間序列分析
- 動態計算統計指標

### 4. 智能圖表生成
- 自動選擇圖表類型（長條圖、折線圖、圓餅圖、散點圖等）
- 響應式設計適配不同螢幕
- 支援圖表互動（縮放、篩選、詳細資訊）
- 匯出功能（圖片、資料）

### 5. 查詢範例與澄清流程

**直接執行的查詢**：
- "顯示本月每個業務員的客戶拜訪次數"
- "比較上季度和這季度的任務完成率"
- "最近30天的會議時長趨勢"

**需要澄清的查詢（一次性表單）**：
```
用戶："顯示業績"

系統顯示澄清表單：
┌─────────────────────────────┐
│ 請選擇您要查看的業績指標：     │
│ ○ 客戶拜訪次數              │
│ ● 新增客戶數量              │
│ ○ 任務完成率                │
│ ○ 會議時長統計              │
│                            │
│ 時間範圍：                   │
│ ○ 本週  ● 本月  ○ 本季      │
│                            │
│ [確認查詢]                  │
└─────────────────────────────┘
```

**澄清原則**：
1. 最多一次澄清往返
2. 提供智能預設值
3. 使用表單而非開放式問答
4. 澄清後立即執行，不再詢問

## 技術架構

### 前端實作
```typescript
// 1. 新增類型定義 - src/types/data-visualization.ts
interface NLQuery {
  id: string;
  query: string;
  timestamp: Date;
  userId: string;
  finalQuery?: string;  // 澄清後的完整查詢
  chartId?: string;     // 生成的圖表 ID
}

interface QueryInterpretation {
  entities: {
    dataType: 'customers' | 'records' | 'tasks' | 'aiUsage';
    metrics: string[];
    dimensions: string[];
    filters: Record<string, any>;
    timeRange?: { start: Date; end: Date };
  };
  suggestedChartType: ChartType;
  confidence: number;
  clarificationNeeded?: ClarificationRequest;
}

interface ClarificationRequest {
  fields: {
    name: string;
    type: 'select' | 'multiselect' | 'dateRange';
    options?: Array<{
      value: string;
      label: string;
      default?: boolean;
    }>;
    defaultValue?: any;
  }[];
}

// 簡化的查詢狀態（無對話歷史）
interface QuerySession {
  queryId: string;
  originalQuery: string;
  interpretation?: QueryInterpretation;
  clarificationForm?: ClarificationRequest;
  finalParameters?: any;
}

interface ChartData {
  type: ChartType;
  data: any[];
  config: ChartConfig;
  metadata: {
    title: string;
    description: string;
    generatedAt: Date;
  };
}

// 2. 圖表元件 - src/components/charts/
// 使用 Victory Native 實作各種圖表
```

### AI 整合 - 支援多模型選擇

#### 選項 1：Google Gemini 2.0 Flash（推薦 - 成本效益最佳）
```typescript
// 使用 Gemini API - src/services/api/gemini-integration.ts
import { GoogleGenAI, FunctionCallingConfigMode } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// 優化的查詢解析（最小化 token 使用）
export const interpretDataQueryWithGemini = async (
  query: string,
  userContext: UserContext,
  clarificationResponse?: any  // 如果是澄清回應，直接傳入結構化資料
): Promise<QueryInterpretation> => {
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
          description: '需要計算的指標'
        },
        dimensions: {
          type: 'array',
          items: { type: 'string' },
          description: '分組維度'
        },
        filters: {
          type: 'object',
          description: '篩選條件'
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
                  type: { type: 'string', enum: ['select', 'multiselect', 'dateRange'] },
                  options: { type: 'array' },
                  defaultValue: { type: 'any' }
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

  // 如果是澄清回應，直接合併參數
  if (clarificationResponse) {
    const mergedQuery = `${query} ${Object.entries(clarificationResponse)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ')}`;
    query = mergedQuery;
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-001',
    contents: `
      分析用戶的資料查詢需求，轉換為結構化查詢參數。
      
      查詢：${query}
      用戶角色：${userContext.role}
      
      資料類型：
      - customers: 客戶資料
      - records: 會議/通話紀錄
      - tasks: 任務
      - aiUsage: AI使用統計
      
      重要原則：
      1. 如果查詢不明確，在 clarificationNeeded 中列出需要的資訊
      2. 為每個需要澄清的欄位提供合理的預設值
      3. 時間範圍預設為本月
      4. 盡量一次性收集所有需要的資訊
    `,
    config: {
      toolConfig: {
        functionCallingConfig: {
          mode: FunctionCallingConfigMode.ANY,
          allowedFunctionNames: ['interpretDataQuery']
        }
      },
      tools: [{ functionDeclarations: [queryInterpretationFunction] }]
    }
  });
  
  const functionCall = response.functionCalls?.[0];
  if (!functionCall) {
    throw new Error('無法解析查詢');
  }
  
  return {
    entities: functionCall.args,
    confidence: 0.9 // Gemini 通常表現良好
  };
};

// 成本優勢：
// - Gemini 2.0 Flash: $0.075/百萬 input tokens（比 GPT-4 便宜 40 倍）
// - 支援 1M token 上下文（vs GPT-4 的 128K）
// - 250+ tokens/秒的生成速度
// - 免費層級：每天 1,500 次請求
```

#### 選項 2：OpenAI GPT-4（備選）
```typescript
// 原有 GPT-4 實作 - src/services/api/ai-integration.ts
export const interpretDataQuery = async (
  query: string,
  userContext: UserContext
): Promise<QueryInterpretation> => {
  // 使用 GPT-4 with function calling
  const prompt = `
    分析用戶的資料查詢需求，識別：
    1. 查詢的資料類型（客戶/紀錄/任務/AI使用）
    2. 需要的指標（計數/總和/平均等）
    3. 分組維度（時間/團隊/用戶等）
    4. 篩選條件
    5. 建議的圖表類型
    
    用戶查詢：${query}
    
    資料庫結構：
    ${DATABASE_SCHEMA}
  `;
  
  // Function calling 定義查詢結構
  return await callOpenAI(prompt, { functions: [querySchema] });
};
```

### 資料查詢層
```typescript
// 新增智能查詢服務 - src/services/firebase/intelligent-queries.ts
export const executeVisualizationQuery = async (
  interpretation: QueryInterpretation,
  userId: string
): Promise<any[]> => {
  // 根據解析結果執行查詢
  // 利用現有的 cross-db-queries 函式
  // 新增動態聚合功能
};
```

### 查詢狀態管理層
```typescript
// 簡化的查詢狀態管理 - src/stores/queryStore.ts
interface QueryStore {
  currentSession: QuerySession | null;
  queryHistory: NLQuery[];  // 只儲存成功的查詢
  
  // 開始新查詢
  startQuery: (query: string) => void;
  
  // 處理 AI 回應
  handleInterpretation: (interpretation: QueryInterpretation) => void;
  
  // 提交澄清表單
  submitClarification: (formData: any) => void;
  
  // 儲存成功的查詢
  saveSuccessfulQuery: (finalQuery: string, chartId: string) => void;
}

// 澄清表單元件 - src/components/DataVisualization/ClarificationForm.tsx
export const ClarificationForm: React.FC<{
  fields: ClarificationRequest['fields'];
  onSubmit: (data: any) => void;
}> = ({ fields, onSubmit }) => {
  const [formData, setFormData] = useState(() => {
    // 初始化預設值
    return fields.reduce((acc, field) => ({
      ...acc,
      [field.name]: field.defaultValue || 
        field.options?.find(o => o.default)?.value ||
        field.options?.[0]?.value
    }), {});
  });

  return (
    <View style={styles.formContainer}>
      <Text style={styles.title}>請提供以下資訊以生成圖表：</Text>
      
      {fields.map(field => (
        <View key={field.name} style={styles.field}>
          <Text style={styles.label}>{field.name}：</Text>
          
          {field.type === 'select' && (
            <RadioGroup
              value={formData[field.name]}
              onChange={(value) => setFormData({...formData, [field.name]: value})}
              options={field.options || []}
            />
          )}
          
          {field.type === 'dateRange' && (
            <DateRangePicker
              value={formData[field.name]}
              onChange={(value) => setFormData({...formData, [field.name]: value})}
              presets={['本週', '本月', '本季', '自訂']}
            />
          )}
        </View>
      ))}
      
      <Button
        title="生成圖表"
        onPress={() => onSubmit(formData)}
        style={styles.submitButton}
      />
    </View>
  );
};

// 主查詢介面 - src/components/DataVisualization/QueryInterface.tsx
export const QueryInterface: React.FC = () => {
  const [query, setQuery] = useState('');
  const { currentSession, startQuery, submitClarification } = useQueryStore();
  
  return (
    <View style={styles.container}>
      {/* 查詢輸入 */}
      {!currentSession && (
        <QueryInput
          value={query}
          onChange={setQuery}
          onSubmit={() => startQuery(query)}
          placeholder="詢問您想查看的資料..."
        />
      )}
      
      {/* 澄清表單 */}
      {currentSession?.clarificationForm && (
        <ClarificationForm
          fields={currentSession.clarificationForm.fields}
          onSubmit={submitClarification}
        />
      )}
      
      {/* 圖表顯示 */}
      {currentSession?.finalParameters && (
        <ChartDisplay parameters={currentSession.finalParameters} />
      )}
      
      {/* 快速查詢建議 */}
      <QuickQuerySuggestions />
    </View>
  );
};
```

## 實作步驟

### 第一階段：基礎架構（2天）
1. **設置圖表庫**
   - 安裝 Victory Native 及相依套件
   - 建立基礎圖表元件庫
   - 實作響應式圖表容器

2. **建立資料視覺化類型系統**
   - 定義所有必要的 TypeScript 介面
   - 建立圖表配置系統
   - 實作圖表類型選擇邏輯

### 第二階段：AI 查詢理解（2天）
3. **實作自然語言解析**
   - 擴展 AI 整合服務
   - 實作 Function Calling 結構
   - 建立查詢意圖分類器

4. **查詢轉換引擎**
   - 實體識別（NER）
   - 時間範圍解析
   - 指標和維度映射

### 第三階段：資料處理（2天）
5. **智能查詢執行器**
   - 動態查詢建構器
   - 資料聚合處理器
   - 快取機制實作

6. **資料轉換層**
   - 原始資料到圖表資料轉換
   - 統計計算（平均、百分比等）
   - 資料格式標準化

### 第四階段：UI 整合（2天）
7. **澄清專用介面**
   - 結構化表單元件
   - 單選/多選/日期範圍選擇器
   - 預設值自動填充
   - 一鍵提交機制

8. **圖表展示與互動**
   - 圖表渲染元件
   - 互動功能（縮放、篩選）
   - 匯出功能實作
   - 新查詢按鈕（重置狀態）

9. **查詢優化**
   - 快速查詢範本
   - 查詢歷史（只顯示成功的）
   - 常用查詢收藏

### 第五階段：優化與測試（1天）
10. **效能優化**
    - 查詢結果快取（15分鐘有效期）
    - 圖表渲染優化
    - 載入狀態處理
    - 最小化 API 呼叫

11. **完整測試**
    - 各種查詢場景測試
    - 澄清流程測試
    - 圖表正確性驗證
    - Token 使用量監控

## 關鍵實作參考

### 現有可複用程式碼
1. **AI 整合模式**：`src/services/api/ai-integration.ts`
2. **資料查詢函式**：`src/services/firebase/cross-db-queries.ts`
3. **語音輸入功能**：`src/services/ai/speech-to-text.ts`
4. **狀態管理模式**：`src/stores/dashboardStore.ts`

### 外部資源
1. **Victory Native 文件**：https://formidable.com/open-source/victory/docs/native/
2. **Gemini Function Calling 指南**：https://ai.google.dev/gemini-api/docs/function-calling
3. **Gemini TypeScript SDK**：https://github.com/googleapis/js-genai
4. **GPT-4 Function Calling**：https://platform.openai.com/docs/guides/function-calling
5. **自然語言轉 SQL 最佳實踐**：https://www.kdnuggets.com/leveraging-gpt-models-to-transform-natural-language-to-sql-queries

## 注意事項

### 安全性考量
- 所有查詢必須遵守現有權限系統
- 防止 SQL 注入式的查詢攻擊
- 敏感資料過濾

### 效能與成本考量
- 實作查詢結果快取（15分鐘）
- 限制單次查詢的資料量
- 使用分頁載入大量資料
- **Token 優化策略**：
  - 不傳送對話歷史，只傳當前查詢
  - 澄清時使用結構化資料而非自然語言
  - 快取常見查詢的解析結果
  - 使用 Gemini Flash 降低成本

### 使用者體驗
- 提供查詢建議和快速範本
- 清楚的錯誤訊息和引導
- 查詢處理進度顯示
- 結構化澄清降低學習曲線
- 一次性收集資訊避免多次往返

## 驗證檢查點

### 語法和程式碼品質
```bash
# TypeScript 編譯檢查
npm run typecheck

# 程式碼格式檢查
npm run lint

# 單元測試
npm test
```

### 功能驗證
1. ✅ 自然語言查詢正確解析
2. ✅ 對話上下文保持準確
3. ✅ 澄清流程運作正常
4. ✅ 資料查詢結果準確
5. ✅ 圖表類型選擇合理
6. ✅ 圖表顯示正確
7. ✅ 互動功能正常
8. ✅ 權限控制有效

### 整合測試案例
```typescript
// 測試案例範例
describe('自然語言資料視覺化', () => {
  test('基本查詢：本月客戶數量', async () => {
    const query = "顯示這個月的新客戶數量";
    const result = await processNLQuery(query, mockUser);
    expect(result.chartType).toBe('bar');
    expect(result.data).toHaveLength(/* 本月天數 */);
  });

  test('複雜查詢：團隊績效比較', async () => {
    const query = "比較各團隊上季度的任務完成率";
    const result = await processNLQuery(query, mockUser);
    expect(result.chartType).toBe('grouped-bar');
    expect(result.data[0]).toHaveProperty('teamName');
    expect(result.data[0]).toHaveProperty('completionRate');
  });

  test('澄清流程：結構化表單', async () => {
    // 第一次查詢
    const result1 = await processNLQuery("顯示業績", mockUser);
    expect(result1.clarificationNeeded).toBeTruthy();
    expect(result1.clarificationNeeded.fields).toHaveLength(2); // 指標和時間
    
    // 提交澄清表單
    const clarificationData = {
      metric: '新增客戶數量',
      timeRange: '本月'
    };
    const result2 = await processNLQuery("顯示業績", mockUser, clarificationData);
    expect(result2.chartType).toBe('bar');
    expect(result2.clarificationNeeded).toBeFalsy();
  });
});
```

## 相依套件安裝
```bash
# 圖表庫
npm install victory-native react-native-svg

# 如果使用 Expo
expo install react-native-svg

# Gemini API SDK（如果選擇使用 Gemini）
npm install @google/genai

# 開發相依
npm install --save-dev @types/victory
```

## AI 模型選擇建議

### 成本比較（每百萬 tokens）
| 模型 | Input 成本 | Output 成本 | 上下文長度 | 速度 |
|------|------------|-------------|------------|------|
| Gemini 2.0 Flash | $0.075 | $0.30 | 1M tokens | 250+ tokens/秒 |
| GPT-4o | $2.50 | $10.00 | 128K tokens | ~100 tokens/秒 |
| GPT-4o Mini | $0.15 | $0.60 | 128K tokens | ~150 tokens/秒 |

### 建議
- **開發和測試階段**：使用 Gemini 2.0 Flash 免費層級（每天 1,500 次請求）
- **生產環境**：Gemini 2.0 Flash 提供最佳成本效益
- **複雜查詢**：可保留 GPT-4 作為備選，處理特別複雜的自然語言理解

## 預期成果

1. **用戶價值**
   - 無需學習複雜的查詢語法
   - 快速獲得資料洞察
   - 最少互動步驟完成查詢

2. **商業價值**
   - 提升資料利用率
   - 加速決策過程
   - 控制 API 成本

3. **技術成就**
   - 高效的 NLP 整合
   - 智能資料視覺化
   - Token 使用最佳化

## 實作信心評分：9/10

**評分理由**：
- ✅ 現有 AI 整合基礎完善
- ✅ 資料查詢架構成熟
- ✅ Victory Native 文件詳細
- ✅ Gemini API 成本效益極佳
- ✅ 對話式設計提升使用體驗
- ⚠️ 圖表效能優化需要迭代調整

## 下一步行動

1. 確認 Victory Native 與現有 Expo 版本相容性
2. 設計詳細的 UI/UX 流程
3. 準備測試資料集
4. 開始第一階段實作