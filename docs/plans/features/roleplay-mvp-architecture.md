# RolePlay MVP 實作架構詳解

## MVP 核心概念：用最簡單的方式達到 80% 的效果

### 1. 整體架構圖

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   業務輸入      │────▶│   規則引擎       │────▶│  回應選擇器     │
│                 │     │ (State Machine)  │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │                          │
                               ▼                          ▼
                        ┌──────────────────┐     ┌─────────────────┐
                        │   狀態資料       │     │   回應模板庫    │
                        │  (JSON/DB)       │     │  (預設對話)     │
                        └──────────────────┘     └─────────────────┘
```

### 2. 核心元件解析

#### A. 客戶人設庫（靜態資料）

```typescript
// 10個預設的客戶原型
const customerPersonas = {
  "cautious_chen": {
    name: "謹慎的陳總",
    profile: {
      company_size: "200人",
      industry: "製造業",
      personality: "保守謹慎",
      budget_reality: "有錢但不想花",
      pain_points: ["效率低", "資料亂"],
      triggers: {
        trust_builders: ["同業案例", "試用"],
        red_flags: ["太貴", "太複雜", "急著成交"]
      }
    }
  },
  
  "tech_savvy_lin": {
    name: "科技通林經理",
    profile: {
      personality: "喜歡新技術但挑剔",
      // ...
    }
  }
  // ... 其他 8 種
}
```

#### B. 狀態定義（簡化版）

```typescript
// 只定義 5-7 個核心狀態
const customerStates = {
  "INITIAL": {
    name: "初次見面",
    openness: 3,
    responses: [
      "我們時間有限，你簡單說說看",
      "你們是做什麼的？", 
      "我們現在的系統還OK啦"
    ]
  },
  
  "INTERESTED": {
    name: "產生興趣",
    openness: 6,
    responses: [
      "這個功能好像不錯",
      "可以demo給我看嗎？",
      "你們其他客戶用得怎麼樣？"
    ]
  },
  
  "SKEPTICAL": {
    name: "疑慮期",
    openness: 4,
    responses: [
      "但是這個會不會太複雜？",
      "我們之前買過系統，都沒人用",
      "你們公司成立多久了？"
    ]
  },
  
  "PRICE_SHOCK": {
    name: "價格震驚",
    openness: 2,
    responses: [
      "這麼貴！",
      "超出我們預算太多了",
      "有沒有便宜一點的方案？"
    ]
  },
  
  "CLOSING": {
    name: "結束對話",
    openness: 5,
    responses: [
      "我再考慮看看",
      "你留個資料給我",
      "我們內部討論後再聯絡你"
    ]
  }
}
```

#### C. 規則引擎（簡單的 if-else）

```typescript
class SimpleStateEngine {
  currentState: string = "INITIAL";
  conversationTurns: number = 0;
  persona: CustomerPersona;
  
  // 根據輸入決定狀態轉換
  analyzeInput(userInput: string): StateTransition {
    const input = userInput.toLowerCase();
    this.conversationTurns++;
    
    // 規則1：價格相關
    if (this.containsPriceKeywords(input)) {
      if (this.currentState === "INTERESTED") {
        return { 
          newState: "PRICE_SHOCK",
          reason: "提到價格" 
        };
      }
    }
    
    // 規則2：展示興趣的關鍵詞
    if (this.containsInterestKeywords(input) && 
        this.currentState === "INITIAL") {
      return { 
        newState: "INTERESTED",
        reason: "問對問題了" 
      };
    }
    
    // 規則3：太急進的推銷
    if (this.detectPushySales(input)) {
      return { 
        newState: "SKEPTICAL",
        reason: "太急進" 
      };
    }
    
    // 規則4：對話太長
    if (this.conversationTurns > 15 && 
        !this.hasProgress) {
      return { 
        newState: "CLOSING",
        reason: "失去耐心" 
      };
    }
    
    // 保持原狀態
    return { newState: this.currentState };
  }
  
  // 關鍵詞檢測
  containsPriceKeywords(input: string): boolean {
    const keywords = ["價格", "多少錢", "費用", "報價", "成本"];
    return keywords.some(kw => input.includes(kw));
  }
  
  containsInterestKeywords(input: string): boolean {
    const keywords = [
      "怎麼幫助", "解決什麼問題", 
      "瞭解需求", "痛點", "困擾"
    ];
    return keywords.some(kw => input.includes(kw));
  }
}
```

#### D. 回應生成器（模板 + 變化）

```typescript
class ResponseGenerator {
  // 從模板中選擇 + 加入變化
  generateResponse(
    state: CustomerState,
    persona: CustomerPersona,
    context: ConversationContext
  ): string {
    
    // 1. 基礎回應選擇
    const templates = state.responses;
    let response = this.selectTemplate(templates, context);
    
    // 2. 人設化調整
    response = this.personalizeResponse(response, persona);
    
    // 3. 加入隨機元素
    response = this.addVariation(response);
    
    // 4. 情境裝飾（可選）
    response = this.addContextualElements(response, context);
    
    return response;
  }
  
  // 根據上下文選擇最適合的模板
  selectTemplate(templates: string[], context: Context): string {
    // 簡單邏輯：避免重複
    const unused = templates.filter(t => 
      !context.usedResponses.includes(t)
    );
    
    if (unused.length > 0) {
      return unused[Math.floor(Math.random() * unused.length)];
    }
    
    // 都用過了就隨機選
    return templates[Math.floor(Math.random() * templates.length)];
  }
  
  // 根據人設調整語氣
  personalizeResponse(response: string, persona: Persona): string {
    if (persona.personality === "急性子") {
      response = response.replace("我再考慮", "我很忙，下次再說");
    }
    
    if (persona.personality === "謹慎型") {
      response = response + " 我需要更多資料。";
    }
    
    return response;
  }
  
  // 加入變化避免機械感
  addVariation(response: string): string {
    const variations = {
      prefix: ["嗯...", "這個嘛...", "老實說，", ""],
      suffix: ["", "你懂我意思嗎？", "對吧？"],
      filler: ["其實", "說真的", "坦白講"]
    };
    
    // 30% 機率加前綴
    if (Math.random() < 0.3) {
      const prefix = variations.prefix[
        Math.floor(Math.random() * variations.prefix.length)
      ];
      response = prefix + response;
    }
    
    return response;
  }
}
```

### 3. 實際運作流程

```typescript
// 一個完整的對話回合
async function handleUserInput(input: string) {
  // 1. 狀態分析（純規則，超快）
  const stateResult = stateEngine.analyzeInput(input);
  
  // 2. 更新狀態
  if (stateResult.newState !== stateEngine.currentState) {
    console.log(`狀態轉換：${stateEngine.currentState} → ${stateResult.newState}`);
    stateEngine.currentState = stateResult.newState;
  }
  
  // 3. 生成回應（模板選擇）
  const response = responseGenerator.generateResponse(
    customerStates[stateEngine.currentState],
    currentPersona,
    conversationContext
  );
  
  // 4. 記錄與顯示
  conversationContext.addTurn(input, response);
  displayResponse(response);
  
  // 5. 教學提示（可選）
  if (shouldShowHint(stateResult)) {
    showTeachingHint(stateResult.reason);
  }
}
```

### 4. 資料結構範例

```json
// personas.json
{
  "personas": [
    {
      "id": "cautious_manufacturer",
      "name": "製造業陳總",
      "triggers": {
        "positive": ["同業案例", "成本節省", "簡單易用"],
        "negative": ["太技術", "需要培訓", "改變流程"]
      },
      "price_sensitivity": "high",
      "decision_speed": "slow"
    }
  ]
}

// dialogues.json
{
  "templates": {
    "INITIAL": {
      "greetings": [
        "你好，請坐。你們公司是做什麼的？",
        "我時間不多，有什麼事嗎？"
      ]
    },
    "PRICE_SHOCK": {
      "reactions": [
        "{price}！？我們一年的IT預算才{budget}",
        "這個價格...我要想想看"
      ]
    }
  }
}
```

### 5. MVP 的優點與限制

**優點：**
- ✅ 實作簡單（1-2 週可完成）
- ✅ 運行成本極低（幾乎免費）
- ✅ 反應速度快（無 API 延遲）
- ✅ 行為可預測（方便除錯）

**限制：**
- ❌ 對話變化有限
- ❌ 無法處理複雜情境
- ❌ 需要預先定義所有規則

### 6. 漸進升級路徑

```typescript
// MVP → 進階版
const upgradePath = {
  "MVP": {
    state: "Rule-based",
    response: "Templates",
    cost: "$0.001"
  },
  
  "MVP+": {
    state: "Rules + GPT-3.5 fallback",  // 無法判斷時用 AI
    response: "Templates + AI polish",    // AI 潤飾
    cost: "$0.01"
  },
  
  "Advanced": {
    state: "AI-powered analysis",
    response: "Dynamic generation",
    cost: "$0.10"
  }
}
```

## 總結

MVP 版本的核心理念：
1. **預設 80% 的情境** - 用規則處理常見狀況
2. **模板 + 變化** - 預寫對話但加入隨機性
3. **簡單但有效** - 雖然簡單但能提供練習價值
4. **快速驗證** - 先證明概念可行再投資升級

這樣的 MVP 一個工程師 1-2 週就能做出來，而且運行成本接近零！