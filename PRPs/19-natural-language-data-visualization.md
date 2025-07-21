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
- 查詢歷史記錄功能
- **對話式介面**：支援多輪對話和澄清

### 2. AI 查詢理解引擎
- 解析自然語言意圖
- 識別查詢的實體（客戶、紀錄、任務、時間範圍等）
- 轉換為結構化查詢參數
- 建議最適合的圖表類型
- **對話管理**：
  - 識別不明確或缺失的資訊
  - 生成澄清問題
  - 維護對話上下文
  - 支援查詢修正和細化

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

### 5. 查詢範例與對話流程
**簡單查詢**：
- "顯示本月每個業務員的客戶拜訪次數"
- "比較上季度和這季度的任務完成率"

**需要澄清的查詢**：
- 用戶："顯示業績"
- AI："請問您想查看哪方面的業績？我可以顯示：
  1. 各業務員的客戶拜訪次數
  2. 新增客戶數量
  3. 任務完成率
  4. 會議時長統計"
- 用戶："第2個，看這個月的"
- AI：[生成本月新增客戶數量圖表]

**逐步細化查詢**：
- 用戶："分析團隊表現"
- AI："我為您生成了各團隊本月的綜合表現圖表。您想深入了解特定指標嗎？"
- 用戶："只看銷售團隊的詳細數據"
- AI：[調整圖表只顯示銷售團隊詳細資料]

## 技術架構

### 前端實作
```typescript
// 1. 新增類型定義 - src/types/data-visualization.ts
interface NLQuery {
  id: string;
  query: string;
  timestamp: Date;
  userId: string;
  conversationId: string;  // 對話串 ID
  parentQueryId?: string;  // 上一個查詢 ID
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
  needsClarification?: {
    reason: string;
    suggestions: string[];
    missingInfo?: string[];
  };
}

interface ConversationContext {
  conversationId: string;
  queries: NLQuery[];
  interpretations: QueryInterpretation[];
  currentChart?: ChartData;
  clarificationState?: {
    waitingFor: string;
    options: string[];
  };
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

// 對話式查詢解析
export const interpretDataQueryWithGemini = async (
  query: string,
  userContext: UserContext,
  conversationContext?: ConversationContext
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
        }
      },
      required: ['dataType', 'metrics', 'suggestedChartType']
    }
  };

  // 建構對話歷史
  const conversationHistory = conversationContext ? 
    conversationContext.queries.map((q, i) => ({
      role: 'user',
      content: q.query
    })).concat(
      conversationContext.interpretations.map((interp, i) => ({
        role: 'assistant',
        content: interp.needsClarification ? 
          `需要澄清：${interp.needsClarification.reason}` : 
          `已理解查詢：${JSON.stringify(interp.entities)}`
      }))
    ) : [];

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-001',
    contents: `
      分析用戶的資料查詢需求，轉換為結構化查詢參數。
      
      當前查詢：${query}
      用戶角色：${userContext.role}
      可存取團隊：${userContext.teamIds.join(', ')}
      
      ${conversationHistory.length > 0 ? `對話歷史：
      ${conversationHistory.map(h => `${h.role}: ${h.content}`).join('\n')}` : ''}
      
      ${conversationContext?.currentChart ? `
      目前顯示的圖表：
      - 類型：${conversationContext.currentChart.type}
      - 資料：${conversationContext.currentChart.metadata.title}
      ` : ''}
      
      資料庫包含：
      - customers: 客戶資料（姓名、公司、標籤、最後聯絡日期）
      - records: 紀錄（會議、通話、筆記，包含時間、時長、AI摘要）
      - tasks: 任務（標題、狀態、優先級、截止日期）
      - aiUsage: AI使用統計（處理分鐘數、信心分數）
      
      如果查詢不明確或缺少必要資訊，請在 needsClarification 中說明並提供建議。
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

### 對話管理層
```typescript
// 對話狀態管理 - src/stores/conversationStore.ts
interface ConversationStore {
  conversations: Map<string, ConversationContext>;
  currentConversationId: string | null;
  
  // 開始新對話
  startConversation: () => string;
  
  // 添加查詢到對話
  addQuery: (conversationId: string, query: string) => void;
  
  // 更新解析結果
  updateInterpretation: (
    conversationId: string, 
    interpretation: QueryInterpretation
  ) => void;
  
  // 處理澄清回應
  handleClarification: (
    conversationId: string,
    clarificationResponse: string
  ) => void;
  
  // 更新當前圖表
  updateChart: (conversationId: string, chart: ChartData) => void;
  
  // 清理過期對話
  cleanupOldConversations: () => void;
}

// UI 元件 - src/components/DataVisualization/ConversationInterface.tsx
export const ConversationInterface: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const { currentConversation, sendQuery } = useConversation();
  
  return (
    <View style={styles.container}>
      {/* 對話歷史 */}
      <ScrollView style={styles.chatHistory}>
        {currentConversation?.queries.map((query, index) => (
          <View key={query.id}>
            <UserMessage text={query.query} />
            {currentConversation.interpretations[index]?.needsClarification ? (
              <ClarificationMessage 
                clarification={currentConversation.interpretations[index].needsClarification}
                onSelect={(option) => handleClarification(option)}
              />
            ) : (
              <ChartMessage chart={currentConversation.currentChart} />
            )}
          </View>
        ))}
      </ScrollView>
      
      {/* 輸入區域 */}
      <InputArea 
        value={inputText}
        onChangeText={setInputText}
        onSubmit={() => sendQuery(inputText)}
        placeholder="詢問資料相關問題..."
      />
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

### 第四階段：UI 整合（3天）
7. **對話式查詢介面**
   - 聊天式 UI 元件
   - 訊息氣泡（用戶/AI/圖表）
   - 澄清選項介面
   - 查詢歷史管理

8. **圖表展示與互動**
   - 圖表渲染元件
   - 互動功能（縮放、篩選）
   - 圖表編輯和調整
   - 匯出功能實作

9. **對話流程優化**
   - 快速建議按鈕
   - 上下文相關提示
   - 錯誤恢復機制

### 第五階段：優化與測試（1天）
10. **效能優化**
    - 查詢結果快取
    - 圖表渲染優化
    - 載入狀態處理
    - 對話歷史管理

11. **完整測試**
    - 各種查詢場景測試
    - 對話流程測試
    - 圖表正確性驗證
    - 錯誤處理測試

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

### 效能考量
- 實作查詢結果快取（15分鐘）
- 限制單次查詢的資料量
- 使用分頁載入大量資料

### 使用者體驗
- 提供查詢建議和自動完成
- 清楚的錯誤訊息和引導
- 查詢處理進度顯示
- 對話式互動降低學習曲線
- 保留對話上下文避免重複輸入

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

  test('對話式查詢：需要澄清', async () => {
    const conversation = await startConversation();
    const result1 = await processNLQuery("顯示業績", mockUser, conversation);
    expect(result1.needsClarification).toBeTruthy();
    expect(result1.needsClarification.suggestions).toContain('客戶拜訪次數');
    
    const result2 = await processNLQuery("第2個選項", mockUser, conversation);
    expect(result2.chartType).toBeDefined();
    expect(result2.needsClarification).toBeFalsy();
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
   - 互動式探索資料

2. **商業價值**
   - 提升資料利用率
   - 加速決策過程
   - 差異化競爭優勢

3. **技術成就**
   - 先進的 NLP 整合
   - 智能資料視覺化
   - 可擴展的架構設計

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