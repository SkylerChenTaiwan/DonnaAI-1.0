# AI 客戶狀態機架構設計

## 核心概念：雙 AI 協作系統

### 1. 系統架構

```typescript
interface RolePlaySystem {
  // AI-1: 狀態分析器（宏觀）
  stateAnalyzer: {
    input: ConversationHistory,
    output: CurrentState & StateTransition
  },
  
  // AI-2: 對話生成器（微觀）
  dialogueGenerator: {
    input: UserMessage & CurrentState & CharacterProfile,
    output: CustomerResponse
  },
  
  // 狀態庫
  stateLibrary: StateDefinition[]
}
```

### 2. 狀態庫設計

```typescript
interface StateDefinition {
  id: string,
  name: string,
  description: string,
  
  // 進入此狀態的觸發條件
  triggers: {
    salesBehavior?: string[],     // 業務的特定行為
    keywords?: string[],          // 關鍵詞
    duration?: number,            // 對話持續時間
    previousStates?: string[],    // 前置狀態
  },
  
  // 在此狀態下的行為特徵
  behaviors: {
    openness: number,             // 開放程度 0-10
    patience: number,             // 耐心程度 0-10
    trust: number,                // 信任程度 0-10
    defensiveness: number,        // 防禦心理 0-10
    
    // 對話特徵
    responsePatterns: string[],   // 典型回應
    bodyLanguage: string[],       // 肢體語言描述
    hiddenThoughts: string[],     // 內心想法
    
    // 行為傾向
    tendencies: {
      changeTopic: number,        // 轉移話題機率
      askQuestions: number,       // 反問機率
      revealInfo: number,         // 透露資訊機率
      showImpatience: number,     // 顯示不耐煩機率
    }
  },
  
  // 可能的狀態轉換
  transitions: {
    targetState: string,
    condition: string,
    probability: number,
  }[]
}
```

### 3. 狀態庫範例

```javascript
const stateLibrary = [
  {
    id: "initial_defensive",
    name: "初始防備",
    description: "客戶剛見面，保持禮貌但有距離",
    
    triggers: {
      salesBehavior: ["開場白", "第一次見面"],
      duration: 0
    },
    
    behaviors: {
      openness: 3,
      patience: 6,
      trust: 2,
      defensiveness: 8,
      
      responsePatterns: [
        "我們現在的系統還可以",
        "你先說說看吧",
        "我時間不多，大概講一下就好"
      ],
      
      hiddenThoughts: [
        "又是來推銷的",
        "希望不要浪費太多時間",
        "看看他要說什麼"
      ],
      
      tendencies: {
        changeTopic: 0.3,
        askQuestions: 0.2,
        revealInfo: 0.1,
        showImpatience: 0.4
      }
    },
    
    transitions: [
      {
        targetState: "curious_but_cautious",
        condition: "業務展現專業且問對問題",
        probability: 0.6
      },
      {
        targetState: "impatient_dismissive", 
        condition: "業務急著推銷產品",
        probability: 0.8
      }
    ]
  },
  
  {
    id: "curious_but_cautious",
    name: "謹慎的興趣",
    description: "開始有興趣但仍保持謹慎",
    
    behaviors: {
      openness: 5,
      patience: 7,
      trust: 4,
      defensiveness: 6,
      
      responsePatterns: [
        "這個聽起來不錯，但是...",
        "我們之前也看過類似的",
        "具體是怎麼做到的？"
      ],
      
      hiddenThoughts: [
        "好像有點道理",
        "但不知道適不適合我們",
        "價格應該不便宜吧"
      ]
    }
  },
  
  {
    id: "impatient_dismissive",
    name: "不耐煩想結束",
    description: "覺得浪費時間，想快點結束",
    
    behaviors: {
      openness: 1,
      patience: 2,
      trust: 1,
      defensiveness: 9,
      
      responsePatterns: [
        "好的我知道了",
        "你留個資料吧",
        "我們內部討論看看",
        "不好意思我等下有會議"
      ],
      
      hiddenThoughts: [
        "怎麼還不結束",
        "又是那一套",
        "找個理由打發他"
      ]
    }
  },
  
  {
    id: "price_sensitive_shock",
    name: "價格震驚",
    description: "聽到價格後的震驚反應",
    
    triggers: {
      keywords: ["價格", "費用", "報價"],
    },
    
    behaviors: {
      openness: 2,
      patience: 4,
      trust: 3,
      defensiveness: 8,
      
      responsePatterns: [
        "這麼貴？",
        "我們預算沒有這麼多",
        "比我想像中貴很多",
        "這個價格包含什麼？"
      ],
      
      hiddenThoughts: [
        "超出預算太多了",
        "老闆一定不會同意",
        "是不是該結束了"
      ]
    }
  }
]
```

### 4. 狀態分析器 (AI-1) 的工作

```javascript
const stateAnalyzerPrompt = `
你是一個對話狀態分析器。根據以下對話歷史，分析客戶當前的心理狀態。

對話歷史：
${conversationHistory}

可選狀態：
${stateLibrary.map(s => `${s.id}: ${s.description}`)}

請分析：
1. 客戶當前最可能的狀態是什麼？
2. 是什麼觸發了這個狀態？
3. 客戶可能的下一個狀態是什麼？
4. 給對話AI的具體指導

輸出格式：
{
  currentState: "state_id",
  confidence: 0.8,
  triggers: ["觸發因素"],
  possibleTransitions: ["可能轉換的狀態"],
  guidance: "對話AI應該注意什麼"
}
`;
```

### 5. 對話生成器 (AI-2) 的工作

```javascript
const dialogueGeneratorPrompt = `
你是${customerProfile.name}，${customerProfile.background}

當前心理狀態：${currentState.name}
狀態說明：${currentState.description}

你的行為特徵：
- 開放程度：${currentState.behaviors.openness}/10
- 耐心程度：${currentState.behaviors.patience}/10
- 信任程度：${currentState.behaviors.trust}/10
- 防禦心理：${currentState.behaviors.defensiveness}/10

典型回應模式：
${currentState.behaviors.responsePatterns.join('\n')}

內心想法（不要說出來，但影響你的回應）：
${currentState.behaviors.hiddenThoughts.join('\n')}

行為傾向：
- 轉移話題機率：${currentState.behaviors.tendencies.changeTopic}
- 反問機率：${currentState.behaviors.tendencies.askQuestions}

業務剛說：${userMessage}

請根據你的當前狀態回應。記住：
1. 保持角色一致性
2. 根據狀態調整開放程度
3. 不要太配合，真實客戶不會這麼好說話
`;
```

### 6. 狀態轉換邏輯

```typescript
class StateTransitionEngine {
  analyzeTransition(
    currentState: StateDefinition,
    conversationHistory: Message[],
    salesBehavior: AnalyzedBehavior
  ): StateTransition {
    
    // 檢查每個可能的轉換
    for (const transition of currentState.transitions) {
      if (this.checkCondition(transition.condition, salesBehavior)) {
        // 根據機率決定是否轉換
        if (Math.random() < transition.probability) {
          return {
            newState: transition.targetState,
            reason: transition.condition
          };
        }
      }
    }
    
    // 檢查全局觸發條件
    return this.checkGlobalTriggers(conversationHistory);
  }
  
  checkCondition(condition: string, behavior: AnalyzedBehavior): boolean {
    // 規則引擎判斷條件是否滿足
    switch(condition) {
      case "業務展現專業且問對問題":
        return behavior.questionQuality > 7 && 
               behavior.listeningScore > 8;
               
      case "業務急著推銷產品":
        return behavior.productMentionCount > 2 &&
               behavior.needsExplorationScore < 5;
    }
  }
}
```

### 7. 實時狀態顯示（給練習者看）

```typescript
interface StateDisplay {
  // 客戶狀態儀表板
  customerMood: {
    icon: "😊" | "😐" | "😕" | "😤",
    description: "客戶現在有點不耐煩",
    level: 3/10
  },
  
  // 隱藏想法提示
  innerThought: {
    text: "客戶心想：他到底要講多久...",
    visibility: "練習模式可見"
  },
  
  // 狀態轉換預警
  stateWarning: {
    message: "注意！客戶快要失去耐心了",
    suggestion: "試著問一個開放式問題"
  }
}
```

### 8. 狀態庫的建立方法

**資料來源**：
1. **真實對話錄音分析**
   - 標記客戶情緒轉折點
   - 記錄觸發原因
   - 整理典型回應

2. **業務經驗訪談**
   - 「客戶說這句話時通常在想什麼？」
   - 「什麼行為會讓客戶防備？」
   - 「客戶真正的拒絕訊號是什麼？」

3. **失敗案例解析**
   - 對話在哪裡開始走下坡？
   - 客戶的轉折點是什麼？
   - 可以觀察到的預兆？

### 9. 優勢

1. **真實性**：基於實際觀察的狀態轉換
2. **可預測性**：業務可以學習辨識狀態
3. **可擴展性**：持續新增狀態和規則
4. **教學價值**：明確顯示客戶心理變化

### 10. 實施步驟

1. **Phase 1**: 建立 10-15 個核心狀態
2. **Phase 2**: 收集真實對話驗證狀態
3. **Phase 3**: 優化狀態轉換規則
4. **Phase 4**: 加入產業特定狀態

這樣的雙 AI + 狀態機制，可以產生更真實、更有教學價值的客戶對話！