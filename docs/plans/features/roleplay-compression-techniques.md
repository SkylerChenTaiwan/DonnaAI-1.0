# 對話壓縮技術詳解

## 為什麼要壓縮？

Token 成本計算：
- GPT-3.5: $0.0015/1K input tokens
- 20輪對話 ≈ 2000-3000 tokens
- 不壓縮：每次分析都要 $0.003-0.0045

## 壓縮技術實作

### 1. 原始對話 vs 壓縮後

#### 原始對話歷史（2000+ tokens）
```typescript
const rawHistory = [
  { role: "業務", content: "陳總您好，我是 DonnaAI 的業務代表王小明，很高興有機會拜訪您。聽說貴公司最近在評估 CRM 系統？" },
  { role: "客戶", content: "對啊，我們現在客戶資料都是用 Excel 在管理，但是越來越亂了。不過我們之前也看過幾套系統，都覺得太複雜了。" },
  { role: "業務", content: "我了解您的困擾。請問現在用 Excel 管理遇到什麼具體的問題呢？" },
  { role: "客戶", content: "主要是業務各自管理自己的檔案，資料都分散在不同地方。有時候同一個客戶，不同業務都在聯繫，很尷尬。而且要做報表的時候，要花很多時間整合。" },
  { role: "業務", content: "確實，資料分散會造成很多問題。那請問貴公司現在有多少位業務同仁呢？" },
  { role: "客戶", content: "大概 20 幾個業務吧，公司總共 200 多人。" },
  // ... 還有 15 輪對話
];
```

#### 壓縮後（200-300 tokens）
```typescript
const compressedContext = {
  // 1. 數值化摘要（極度精簡）
  metrics: {
    turns: 20,
    elapsed: 15, // 分鐘
    trust: 6,     // 0-10 評分
    interest: 7,  // 0-10 評分
    resistance: 4 // 0-10 評分
  },
  
  // 2. 關鍵資訊萃取（只保留重要的）
  keyInfo: {
    company: "200人製造業",
    currentSolution: "Excel",
    users: "20業務",
    mainPain: ["資料分散", "重複聯繫", "報表麻煩"],
    concerns: ["太複雜", "之前失敗"],
    budget: "未透露",
    decision: "需老闆同意"
  },
  
  // 3. 關鍵事件標記（布林值超省）
  events: {
    mentionedBudget: false,
    askedForDemo: true,
    expressedUrgency: false,
    mentionedCompetitor: true,
    showedResistance: true
  },
  
  // 4. 最近3輪對話（只保留核心）
  recentTurns: [
    "業：可安排試用",
    "客：要培訓多久",
    "業：半天即可"
  ],
  
  // 5. 客戶情緒軌跡（數字陣列）
  emotionPath: [3, 3, 5, 6, 7, 6, 4, 5, 6] // 每2-3輪記錄一次
};
```

### 2. 壓縮技術詳解

#### A. 對話摘要技術
```typescript
class DialogueSummarizer {
  // 將多句話壓縮成關鍵點
  summarizeTurn(salesInput: string, customerResponse: string): KeyPoint {
    // 原始：業務128字 + 客戶95字 = 223字
    // 壓縮成：
    return {
      salesAction: "詢問痛點",        // 8字
      customerReveal: "資料分散",      // 4字
      sentiment: "neutral",           // 7字
      importance: "high"              // 4字
    };
    // 壓縮比：223字 → 23字（10%）
  }
  
  // 批次摘要多輪對話
  batchSummarize(history: Dialogue[]): Summary {
    const points = [];
    
    // 每3-5輪做一次摘要
    for (let i = 0; i < history.length; i += 4) {
      const chunk = history.slice(i, i + 4);
      points.push(this.extractKeyPoints(chunk));
    }
    
    return {
      journey: points,
      totalTokens: this.countTokens(points) // 通常 < 200
    };
  }
}
```

#### B. 關鍵詞提取
```typescript
class KeywordExtractor {
  // 預定義重要關鍵詞
  private importantKeywords = {
    budget: ["預算", "價格", "費用", "多少錢"],
    pain: ["問題", "困擾", "麻煩", "困難"],
    urgency: ["急", "趕快", "馬上", "立即"],
    competitor: ["其他廠商", "比較", "評估"],
    decision: ["老闆", "主管", "決定", "核准"]
  };
  
  extract(text: string): ExtractedInfo {
    const found = {};
    
    // 掃描關鍵詞
    for (const [category, keywords] of Object.entries(this.importantKeywords)) {
      found[category] = keywords.some(kw => text.includes(kw));
    }
    
    // 提取數字
    const numbers = this.extractNumbers(text);
    
    return {
      flags: found,        // 布林值超省空間
      values: numbers,     // 保留重要數字
      summary: this.generateMicroSummary(text, found)
    };
  }
  
  // 微摘要：一句話說重點
  generateMicroSummary(text: string, flags: any): string {
    if (flags.budget) return "詢問價格";
    if (flags.pain) return `痛點:${this.extractPainPoint(text)}`;
    if (flags.urgency) return "表達急迫";
    return "一般對話";
  }
}
```

#### C. 情緒數值化
```typescript
class EmotionQuantifier {
  // 將情緒轉成數字（超省token）
  quantify(customerResponse: string): EmotionMetrics {
    return {
      openness: this.measureOpenness(customerResponse),      // 0-10
      resistance: this.measureResistance(customerResponse),  // 0-10  
      interest: this.measureInterest(customerResponse),      // 0-10
      trust: this.measureTrust(customerResponse),           // 0-10
    };
  }
  
  // 用簡單規則評分
  measureOpenness(text: string): number {
    let score = 5; // 基準分
    
    // 正向訊號
    if (text.includes("詳細") || text.includes("了解")) score += 2;
    if (text.includes("?")) score += 1; // 有提問
    
    // 負向訊號
    if (text.includes("不用") || text.includes("沒興趣")) score -= 3;
    if (text.length < 20) score -= 1; // 回應很短
    
    return Math.max(0, Math.min(10, score));
  }
}
```

### 3. 智慧壓縮策略

#### A. 重要性分級
```typescript
class ImportanceFilter {
  // 不是所有對話都一樣重要
  classifyImportance(turn: DialogueTurn): 'critical' | 'important' | 'normal' | 'trivial' {
    const { sales, customer } = turn;
    
    // 關鍵時刻（必須保留詳細）
    if (customer.includes("預算") || customer.includes("價格")) {
      return 'critical';
    }
    
    // 重要資訊（保留摘要）
    if (customer.includes("問題") || customer.includes("需求")) {
      return 'important';
    }
    
    // 一般對話（只留標記）
    if (sales.includes("了解") || sales.includes("請問")) {
      return 'normal';
    }
    
    // 社交對話（可忽略）
    if (sales.includes("天氣") || customer.includes("謝謝")) {
      return 'trivial';
    }
  }
  
  // 根據重要性決定保留多少
  compress(turn: DialogueTurn, importance: string): CompressedTurn {
    switch(importance) {
      case 'critical':
        // 保留 50% 內容
        return {
          type: 'critical',
          sales: this.summarize(turn.sales, 0.5),
          customer: this.summarize(turn.customer, 0.5),
          fullContext: this.extractContext(turn)
        };
        
      case 'important':
        // 保留 20% 內容
        return {
          type: 'important',
          summary: this.extractKeyPoint(turn),
          emotion: this.quantifyEmotion(turn)
        };
        
      case 'normal':
        // 只留標記
        return {
          type: 'normal',
          tag: this.generateTag(turn) // 如："詢問需求"
        };
        
      case 'trivial':
        // 直接忽略
        return null;
    }
  }
}
```

#### B. 滑動視窗壓縮
```typescript
class SlidingWindowCompressor {
  // 越舊的對話壓得越兇
  compressWithDecay(history: Dialogue[]): CompressedHistory {
    const compressed = [];
    const now = Date.now();
    
    history.forEach((turn, index) => {
      const age = history.length - index; // 對話年齡
      
      if (age <= 3) {
        // 最近3輪：保留原文
        compressed.push({
          ...turn,
          compression: 'none'
        });
      } else if (age <= 10) {
        // 4-10輪：中度壓縮
        compressed.push({
          summary: this.mediumCompress(turn),
          keywords: this.extractKeywords(turn),
          compression: 'medium'
        });
      } else {
        // 超過10輪：高度壓縮
        compressed.push({
          tag: this.generateTag(turn),
          sentiment: this.getSentiment(turn),
          compression: 'high'
        });
      }
    });
    
    return compressed;
  }
}
```

### 4. 實際壓縮範例

#### 壓縮前（單輪對話）
```
業務：「陳總，我了解您提到的資料分散問題確實很困擾。我們的系統可以將所有客戶資料集中管理，每個業務都可以即時看到最新的客戶狀態，避免重複聯繫的尷尬。而且系統會自動記錄所有的互動歷史，您覺得這樣的功能對貴公司有幫助嗎？」（95字）

客戶：「聽起來是不錯，但是我比較擔心的是，我們的業務年紀都比較大，之前導入新系統的時候，大家都學得很辛苦，最後還是回去用 Excel。你們的系統會不會很複雜？需要培訓多久？」（79字）

總計：174字
```

#### 壓縮後
```json
{
  "turn": 8,
  "summary": "介紹集中管理|擔心複雜",
  "salesPoint": "資料集中",
  "customerConcern": "年長員工學習",
  "keywords": ["培訓", "複雜", "Excel"],
  "emotion": { "interest": 6, "worry": 8 },
  "importance": "high"
}
// 約 30 字（壓縮率 83%）
```

### 5. 壓縮效益總結

| 壓縮技術 | 壓縮率 | 資訊保留度 | 適用場景 |
|---------|--------|-----------|---------|
| 數值化情緒 | 95% | 70% | 情緒追蹤 |
| 關鍵詞提取 | 90% | 60% | 快速分析 |
| 分級壓縮 | 80% | 85% | 完整分析 |
| 滑動視窗 | 85% | 75% | 長對話 |

**最終效果**：
- 2000 tokens → 200 tokens
- 成本降低 90%
- 保留 80% 關鍵資訊
- AI 依然能準確判斷狀態