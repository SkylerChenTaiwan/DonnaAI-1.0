# RolePlay 成本優化方案

## 成本分析

### 原始架構成本（雙 AI 全程運作）

```typescript
// 每次對話
const costPerTurn = {
  stateAnalyzer: {
    model: "GPT-4",
    tokens: ~1500,  // 分析對話歷史+狀態庫
    cost: ~$0.045
  },
  dialogueGenerator: {
    model: "GPT-4", 
    tokens: ~1000,  // 生成回應
    cost: ~$0.03
  },
  totalPerTurn: ~$0.075
}

// 一場 20 回合的練習
const sessionCost = $0.075 * 20 = $1.5

// 如果 1000 個業務，每人每月練習 10 次
const monthlyCost = $1.5 * 10 * 1000 = $15,000 😱
```

## 成本優化策略

### 1. 混合模型策略

```typescript
const optimizedArchitecture = {
  // 狀態分析：用輕量級模型
  stateAnalyzer: {
    model: "GPT-3.5-turbo",  // 或 Claude Haiku
    tokens: ~500,            // 簡化的分析
    cost: ~$0.0005
  },
  
  // 對話生成：只在關鍵時刻用 GPT-4
  dialogueGenerator: {
    normal: {
      model: "GPT-3.5-turbo",
      cost: ~$0.001
    },
    critical: {  // 關鍵教學時刻
      model: "GPT-4",
      cost: ~$0.03
    }
  }
}

// 優化後成本降低 95%
const optimizedCost = ~$0.0015 * 20 = $0.03 per session
```

### 2. 狀態機簡化版

```typescript
// 方案A：規則引擎 + AI
class HybridStateEngine {
  // 80% 用規則判斷（幾乎免費）
  analyzeByRules(input: string): StateResult | null {
    // 簡單關鍵詞匹配
    if (input.includes("多少錢") || input.includes("價格")) {
      return { state: "price_sensitive", confidence: 0.9 };
    }
    
    // 對話長度觸發
    if (conversationTurns > 15 && !hasShownProgress) {
      return { state: "impatient", confidence: 0.8 };
    }
    
    return null; // 複雜情況才用 AI
  }
  
  // 20% 真的需要 AI 分析
  async analyzeByAI(input: string): Promise<StateResult> {
    // 只在規則無法判斷時使用
  }
}
```

### 3. 預設腳本 + 動態調整

```typescript
// 80% 的對話其實是可預測的
const scriptedResponses = {
  "greeting": {
    patterns: ["你好", "早安", "初次見面"],
    responses: [
      "你好，請坐。你們是做什麼的？",
      "嗯，我時間不多，簡單說吧"
    ],
    variations: ["tone", "patience"]  // 小變化即可
  },
  
  "price_inquiry": {
    patterns: ["多少錢", "價格", "費用"],
    responses: [
      state => {
        if (state.trust < 5) return "這個等一下再說";
        if (state.interest < 7) return "價格？你們能做什麼？";
        return "大概什麼價位？";
      }
    ]
  }
}

// 只有 20% 需要 AI 生成
const needsAI = !findScriptedResponse(input);
```

### 4. 離線批次生成

```typescript
// 預先生成常見情境對話
class DialoguePreGenerator {
  // 離線時生成對話樹
  async generateOffline() {
    const scenarios = [
      "初次拜訪-防備型客戶",
      "初次拜訪-友善型客戶", 
      "報價階段-預算充足",
      "報價階段-預算有限"
    ];
    
    // 用 GPT-4 高品質生成
    // 儲存成對話模板
    // 線上時只需要微調
  }
}

// 使用時
const response = await adjustTemplate(preGenerated, currentContext);
// 成本降低 90%
```

### 5. 智能快取

```typescript
class ResponseCache {
  // 相似問題用相似回答
  findSimilar(input: string): CachedResponse | null {
    // 向量相似度搜尋
    const similar = this.vectorSearch(input);
    if (similar.score > 0.9) {
      // 微調後使用
      return this.adjustResponse(similar.response);
    }
  }
  
  // 學習模式：成功的對話存起來
  saveGoodDialogue(dialogue: Dialogue) {
    if (dialogue.score > 8) {
      this.cache.add(dialogue);
    }
  }
}
```

### 6. 漸進式架構

```typescript
// MVP：最簡單的版本
const mvpArchitecture = {
  v1: {
    name: "規則基礎版",
    stateEngine: "rule-based",
    dialogue: "templates + GPT-3.5",
    costPerSession: "$0.01"
  },
  
  v2: {
    name: "智能混合版", 
    stateEngine: "rules + GPT-3.5 fallback",
    dialogue: "smart templates + AI",
    costPerSession: "$0.05"
  },
  
  v3: {
    name: "完整智能版",
    stateEngine: "full AI analysis",
    dialogue: "dynamic AI generation",
    costPerSession: "$0.50"
  }
}
```

### 7. 成本控制機制

```typescript
interface CostController {
  // 每用戶預算控制
  userBudget: {
    daily: 10,     // 10次 AI 呼叫
    monthly: 200   // 每月上限
  },
  
  // 智能降級
  degradeGracefully(budgetRemaining: number) {
    if (budgetRemaining < 20%) {
      return "switch-to-templates";
    }
    if (budgetRemaining < 50%) {
      return "reduce-ai-frequency";
    }
  },
  
  // 價值導向使用
  priorityMode: {
    high: "關鍵教學時刻",    // 用 GPT-4
    medium: "一般對話",      // 用 GPT-3.5
    low: "例行回應"          // 用模板
  }
}
```

## 推薦的成本優化實作路徑

### Phase 1：MVP (成本極低)
- 10 個預設客戶類型
- 規則基礎的狀態判斷
- 模板回應 + 隨機變化
- **成本：~$0.001/session**

### Phase 2：智能增強
- 規則 + AI 備援
- 關鍵時刻 AI 介入
- 學習最佳對話模式
- **成本：~$0.01/session**

### Phase 3：完整版
- 選擇性啟用完整 AI
- VIP 用戶 / 付費功能
- **成本：~$0.10/session**

## 結論

1. **不需要一開始就用最貴的方案**
2. **80/20 法則**：80% 的對話可以用便宜方案處理
3. **漸進式升級**：先驗證價值，再增加成本
4. **混合架構**：規則 + 模板 + AI 的組合
5. **智能降級**：根據預算自動調整品質

**建議從 Phase 1 開始**，即使是簡單版本，只要狀態設計得好，也能提供很好的練習價值！