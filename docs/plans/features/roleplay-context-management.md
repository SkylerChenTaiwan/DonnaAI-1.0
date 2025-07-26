# 狀態機的上下文管理策略

## 核心概念：動態背景提醒

### 1. 為什麼背景需要動態提醒？

**客戶不會一直記得所有事**
```typescript
// 錯誤示範：客戶記得太多
"我們公司200人，年營收5億，主要痛點是..." // 太像背稿

// 真實情況：選擇性記憶
"我們公司...ㄟ多少人來著？大概兩百多吧" // 更真實
```

**背景在不同狀態下的顯著性不同**
```typescript
interface ContextRelevance {
  // 防備狀態：不會主動提及痛點
  defensive: {
    suppress: ["painPoints", "budget", "failures"],
    emphasize: ["busy", "currentSolution"]
  },
  
  // 感興趣狀態：開始透露真實需求
  interested: {
    suppress: ["competitors"], 
    emphasize: ["painPoints", "timeline"]
  },
  
  // 價格談判：預算變成焦點
  negotiating: {
    suppress: ["nice-to-have"],
    emphasize: ["budget", "ROI", "competitors"]
  }
}
```

### 2. 狀態機的上下文管理架構

```typescript
interface ContextManager {
  // 完整客戶資料
  fullProfile: CustomerProfile,
  
  // 根據當前狀態篩選相關背景
  getRelevantContext(currentState: State): ActiveContext {
    return {
      // 基礎資訊（一直記得）
      basic: this.selectBasicInfo(fullProfile),
      
      // 狀態相關資訊（選擇性記憶）
      stateSpecific: this.filterByState(fullProfile, currentState),
      
      // 對話歷史相關（剛提過的會記得）
      recentlyMentioned: this.getRecentContext(conversationHistory),
      
      // 遺忘或混淆的資訊
      forgotten: this.applyMemoryDecay(fullProfile, currentState)
    }
  }
}
```

### 3. 實際運作範例

```javascript
// 完整客戶背景
const customerProfile = {
  name: "陳總",
  company: "精準科技",
  employees: 200,
  revenue: "5億",
  currentSolution: "Excel + 自己開發的小系統",
  painPoints: [
    "資料分散",
    "報表要手動整理", 
    "業務離職會帶走客戶"
  ],
  budget: "年度IT預算100萬，但只想花30萬",
  pastFailures: "3年前買過SAP，沒人會用",
  decisionMaker: "要董事長同意",
  competitors: ["已經在看Salesforce", "HubSpot報價50萬"]
}

// 狀態機根據不同狀態，給對話AI不同的背景提醒

// 情境1：初始防備狀態
stateContext = {
  state: "defensive",
  activeMemory: {
    company: "精準科技",
    vague: ["人數大概一兩百", "營收...這個不方便透露"],
    emphasize: ["現在的Excel用得好好的", "很忙"],
    hidden: ["預算", "失敗經驗", "正在看其他家"]
  },
  instruction: "表現得像不想透露太多公司資訊"
}

// 情境2：開始感興趣
stateContext = {
  state: "interested", 
  activeMemory: {
    company: "精準科技，200人",
    reveal: ["其實報表整理很花時間", "之前有業務離職帶走大客戶"],
    stillHidden: ["預算真實數字", "SAP失敗經驗"],
    probe: ["你們的系統會不會很複雜？"]
  },
  instruction: "開始透露痛點，但對預算和過去失敗仍有保留"
}

// 情境3：聽到價格後
stateContext = {
  state: "priceShock",
  suddenlyRemember: {
    budget: "我們一年IT預算才100萬",
    failure: "之前買SAP花了200萬，結果...",
    competitor: "Salesforce好像也才40幾萬"
  },
  instruction: "用預算限制和過去失敗來壓價"
}
```

### 4. 記憶模糊化機制

```typescript
class MemoryFuzzifier {
  // 讓記憶更真實的模糊化
  applyRealism(fact: any, state: State): any {
    switch(state.memoryClarity) {
      case 'clear':
        return fact; // "我們有200人"
        
      case 'fuzzy':
        return this.makeFuzzy(fact); // "兩百...還是兩百多？"
        
      case 'wrong':
        return this.distort(fact); // "我們有300多人"（其實200）
        
      case 'forgotten':
        return null; // "這個...我要問一下"
    }
  }
  
  makeFuzzy(value: any): string {
    if (typeof value === 'number') {
      // 數字模糊化：200 -> "兩百左右"
      return `${this.roundToMagnitude(value)}左右`;
    }
    // 其他類型的模糊化...
  }
}
```

### 5. 背景資訊的觸發時機

```typescript
interface BackgroundTriggers {
  // 什麼時候會主動提起某些背景
  triggers: {
    "提到價格": ["預算限制", "過去採購失敗"],
    "展示功能": ["現有作法的痛點", "期望效果"],
    "要求承諾": ["決策流程", "老闆的想法"],
    "同業案例": ["競爭對手", "產業特殊需求"]
  },
  
  // 什麼時候會忘記或否認
  denialTriggers: {
    "被抓到矛盾": "我剛剛是說可能啦",
    "被追問預算": "這個數字我不確定",
    "被要求決定": "我沒有權限決定"
  }
}
```

### 6. 實作流程

```typescript
// 每輪對話的完整流程
async function processDialogue(userInput: string) {
  // 1. 狀態AI分析
  const stateAnalysis = await analyzeState({
    input: userInput,
    history: conversationHistory,
    fullProfile: customerProfile
  });
  
  // 2. 準備上下文
  const context = prepareContext({
    currentState: stateAnalysis.state,
    customerProfile: customerProfile,
    conversationHistory: conversationHistory,
    
    // 決定哪些背景要強調、隱藏、模糊
    filters: {
      emphasize: stateAnalysis.relevantBackground,
      hide: stateAnalysis.suppressedInfo,
      fuzzify: stateAnalysis.uncertainInfo
    }
  });
  
  // 3. 生成回應
  const response = await generateResponse({
    userInput: userInput,
    state: stateAnalysis.state,
    context: context,
    instructions: stateAnalysis.behaviorGuide
  });
  
  return response;
}
```

### 7. 教學價值

這種設計能教導業務：

1. **識別資訊透露的時機** - 客戶什麼時候會說真話
2. **理解心理防衛機制** - 為什麼客戶會隱藏資訊
3. **掌握對話節奏** - 什麼時候該深挖，什麼時候該退讓
4. **預測客戶反應** - 某些話題會觸發什麼反應

## 結論

狀態機不只管理對話狀態，更是：
- **記憶管理器** - 決定記得什麼、忘記什麼
- **資訊過濾器** - 根據心理狀態篩選會透露的資訊
- **真實性引擎** - 加入遺忘、混淆、否認等人性化元素

這樣才能創造出真正像人的客戶對話！