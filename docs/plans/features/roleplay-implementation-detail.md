# RolePlay 實作架構詳解

## 系統整體流程圖

```
使用者輸入
    ↓
[1. 快速過濾器] → 明顯情況直接處理（30%）
    ↓
[2. 對話壓縮器] → 壓縮歷史對話成關鍵資訊
    ↓
[3. 狀態分析器] → GPT-3.5 判斷客戶心理狀態
    ↓
[4. 快取檢查器] → 檢查是否有類似回應可用
    ↓
[5. 回應生成器] → GPT-3.5 生成自然回應
    ↓
客戶回應 + 教學提示
```

## 詳細實作步驟

### 1. 對話管理器（核心控制器）

```typescript
class RolePlayManager {
  private conversationHistory: Message[] = [];
  private customerState: CustomerState = 'INITIAL';
  private customerPersona: Persona;
  private responseCache: ResponseCache;
  
  async handleUserInput(userInput: string): Promise<DialogueResponse> {
    // Step 1: 快速過濾（省錢）
    const quickResponse = this.quickFilter(userInput);
    if (quickResponse) {
      return quickResponse;
    }
    
    // Step 2: 壓縮對話歷史（減少 token）
    const compressedContext = this.compressHistory();
    
    // Step 3: AI 分析狀態（GPT-3.5）
    const stateAnalysis = await this.analyzeState(
      userInput, 
      compressedContext
    );
    
    // Step 4: 檢查快取
    const cachedResponse = await this.checkCache(
      userInput, 
      stateAnalysis.state
    );
    
    if (cachedResponse) {
      // Step 4.1: 用 AI 改寫避免重複
      return await this.rewriteResponse(cachedResponse);
    }
    
    // Step 5: 生成新回應（GPT-3.5）
    const response = await this.generateResponse(
      userInput,
      stateAnalysis,
      compressedContext
    );
    
    // Step 6: 更新狀態和歷史
    this.updateState(stateAnalysis.state);
    this.saveToHistory(userInput, response);
    this.cacheResponse(userInput, response);
    
    return response;
  }
```

### 2. 快速過濾器（處理明顯情況）

```typescript
quickFilter(input: string): DialogueResponse | null {
  const lowerInput = input.toLowerCase();
  
  // 超級明顯的情況不需要 AI
  const obviousCases = {
    // 剛開始就問價格 = 一定是防備狀態
    earlyPriceAsk: {
      condition: () => 
        this.conversationHistory.length < 3 && 
        this.containsPrice(lowerInput),
      response: "我們先了解一下你們的需求，價格有很多方案。",
      state: "DEFENSIVE"
    },
    
    // 說要結束 = 結束狀態
    endingSignals: {
      condition: () => 
        lowerInput.includes("下次再聊") || 
        lowerInput.includes("我還有事"),
      response: "好的，我留個資料給您，有需要再聯繫。",
      state: "ENDING"
    },
    
    // 明確表示興趣
    clearInterest: {
      condition: () =>
        lowerInput.includes("很有興趣") ||
        lowerInput.includes("想要詳細了解"),
      response: "太好了！我可以先了解一下你們目前的作業流程嗎？",
      state: "INTERESTED"
    }
  };
  
  // 檢查是否符合任何明顯情況
  for (const [key, rule] of Object.entries(obviousCases)) {
    if (rule.condition()) {
      this.customerState = rule.state;
      return {
        text: rule.response,
        state: rule.state,
        source: 'quick-filter'
      };
    }
  }
  
  return null;
}
```

### 3. 對話壓縮器（省 Token）

```typescript
compressHistory(): CompressedContext {
  // 不要傳整個對話歷史給 AI！
  
  return {
    // 1. 數值化指標（超省 token）
    metrics: {
      turnCount: this.conversationHistory.length,
      trustLevel: this.calculateTrustLevel(),  // 0-10
      priceAsked: this.hasPriceBeenAsked(),
      painPointsRevealed: this.countPainPoints(),
      minutesElapsed: this.getElapsedTime()
    },
    
    // 2. 關鍵事件（只記重要的）
    keyEvents: [
      "客戶提到預算有限",
      "擔心系統太複雜", 
      "提到之前失敗經驗"
    ].filter(event => this.detectEvent(event)),
    
    // 3. 最近對話（只要最後 2-3 輪）
    recentDialogue: this.conversationHistory.slice(-4).map(msg => 
      `${msg.role}: ${this.truncate(msg.content, 50)}`
    ),
    
    // 4. 客戶重要資訊
    customerInfo: {
      industry: this.customerPersona.industry,
      companySize: this.customerPersona.size,
      currentState: this.customerState
    }
  };
}

// 壓縮後從 2000 tokens → 200 tokens！
```

### 4. AI 狀態分析（精簡 Prompt）

```typescript
async analyzeState(
  userInput: string, 
  context: CompressedContext
): Promise<StateAnalysis> {
  
  // 超精簡的 prompt（省錢關鍵）
  const prompt = `
角色：${context.customerInfo.industry}的客戶
對話回合：${context.metrics.turnCount}
信任度：${context.metrics.trustLevel}/10
關鍵事件：${context.keyEvents.join('、') || '無'}

最近對話：
${context.recentDialogue.join('\n')}

業務新輸入：${userInput}

請分析：
1. 客戶心理狀態（防備/好奇/擔憂/考慮/拒絕）
2. 狀態信心度（0-1）
3. 一句話說明原因

回應格式：
{
  "state": "狀態",
  "confidence": 0.8,
  "reason": "因為..."
}`;

  // 用便宜的 GPT-3.5
  const response = await callGPT35Turbo(prompt, {
    temperature: 0.3,  // 降低隨機性
    max_tokens: 100    // 限制回應長度
  });
  
  return JSON.parse(response);
}
```

### 5. 智慧快取系統

```typescript
class ResponseCache {
  private cache: Map<string, CachedResponse[]> = new Map();
  
  async findSimilar(
    input: string, 
    state: string
  ): Promise<string | null> {
    
    // 用簡單的關鍵詞匹配（未來可升級成向量搜尋）
    const stateCache = this.cache.get(state) || [];
    
    for (const cached of stateCache) {
      const similarity = this.calculateSimilarity(
        input, 
        cached.input
      );
      
      if (similarity > 0.8) {
        // 找到相似的！但不能直接用
        return cached.response;
      }
    }
    
    return null;
  }
  
  // 改寫快取回應避免重複
  async rewriteResponse(
    original: string,
    context: any
  ): Promise<string> {
    
    const prompt = `
請將下面的話換個方式說，保持意思相同：
原話：${original}
要求：
1. 用詞不同但意思一樣
2. 保持${context.state}的語氣
3. 20-30 字

新說法：`;

    // 超快速的改寫（便宜）
    return await callGPT35Turbo(prompt, {
      temperature: 0.7,
      max_tokens: 50
    });
  }
}
```

### 6. 回應生成器（半結構化）

```typescript
async generateResponse(
  userInput: string,
  stateAnalysis: StateAnalysis,
  context: CompressedContext
): Promise<DialogueResponse> {
  
  // 根據狀態選擇引導框架
  const stateGuidance = {
    DEFENSIVE: {
      mood: "保持距離、不想透露太多",
      patterns: ["我們要再評估", "這個...不太確定", "要問問看"],
      avoid: ["立即同意", "透露預算", "表現熱情"]
    },
    INTERESTED: {
      mood: "好奇但謹慎",
      patterns: ["這功能怎麼做到的", "其他客戶的經驗", "可以試用嗎"],
      avoid: ["直接答應", "完全信任"]
    },
    CONCERNED: {
      mood: "擔心和疑慮",
      patterns: ["但是會不會", "我擔心的是", "萬一...怎麼辦"],
      avoid: ["忽視風險", "太樂觀"]
    }
  };
  
  const guidance = stateGuidance[stateAnalysis.state];
  
  const prompt = `
你是${context.customerInfo.industry}公司的採購主管。
目前心情：${guidance.mood}
可用句式：${guidance.patterns.join('、')}
避免：${guidance.avoid.join('、')}

背景：
- 對話${context.metrics.turnCount}回合
- 信任度${context.metrics.trustLevel}/10
${context.keyEvents.length > 0 ? `- 發生過：${context.keyEvents.join('、')}` : ''}

業務剛說：${userInput}

請用1-2句話回應，表現出${stateAnalysis.state}狀態的特徵。
記住：真實客戶不會太配合。`;

  const response = await callGPT35Turbo(prompt, {
    temperature: 0.8,  // 一點隨機性
    max_tokens: 100
  });
  
  return {
    text: response,
    state: stateAnalysis.state,
    confidence: stateAnalysis.confidence,
    source: 'ai-generated'
  };
}
```

### 7. 成本計算實例

```typescript
// 每次 API 呼叫的實際成本
const apiCosts = {
  stateAnalysis: {
    model: "gpt-3.5-turbo",
    inputTokens: 300,   // 精簡的 prompt
    outputTokens: 50,   // JSON 回應
    cost: 300 * 0.0015 / 1000 + 50 * 0.002 / 1000 = $0.00055
  },
  
  responseGeneration: {
    model: "gpt-3.5-turbo", 
    inputTokens: 400,
    outputTokens: 80,
    cost: 400 * 0.0015 / 1000 + 80 * 0.002 / 1000 = $0.00076
  },
  
  cacheRewrite: {
    model: "gpt-3.5-turbo",
    inputTokens: 100,
    outputTokens: 40,
    cost: 100 * 0.0015 / 1000 + 40 * 0.002 / 1000 = $0.00023
  }
};

// 平均每回合成本
const averageCostPerTurn = 
  0.3 * 0 +           // 30% 快速過濾（免費）
  0.5 * 0.00131 +     // 50% 完整流程
  0.2 * 0.00023;      // 20% 快取改寫
  
// = $0.00070 每回合
// = $0.014 每場練習（20回合）
// = $140 每月（1000人練10次）✅
```

## 關鍵實作要點

1. **分層處理**：簡單情況不用 AI
2. **壓縮是關鍵**：2000 → 200 tokens
3. **GPT-3.5 夠用**：不要用 GPT-4
4. **快取很重要**：相似問題重複用
5. **引導但不限制**：半結構化 prompt

這樣的架構既**真實**又**便宜**！