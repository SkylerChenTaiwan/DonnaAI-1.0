# AI 業務訓練系統 - RolePlay 功能設計

## 核心概念

使用 AI 模擬真實客戶，讓業務人員進行沙盤推演練習，並提供即時回饋和指導。

## 實現方案

### 1. 多層次 System Prompt 架構

```typescript
interface RolePlaySystem {
  // 基礎層：定義 AI 角色
  basePrompt: {
    role: "客戶" | "觀察教練" | "雙重角色",
    personality: string,      // 客戶性格特徵
    background: string,       // 客戶背景資訊
    painPoints: string[],     // 客戶痛點
    objections: string[],     // 常見異議
  },
  
  // 情境層：特定業務場景
  scenarioPrompt: {
    industry: string,         // 產業別
    dealSize: string,         // 交易規模
    decisionProcess: string,  // 決策流程
    competitors: string[],    // 競爭對手
  },
  
  // 教練層：評估和指導
  coachingPrompt: {
    evaluationCriteria: string[],  // 評估標準
    teachingPoints: string[],      // 教學重點
    feedbackStyle: string,         // 回饋風格
  }
}
```

### 2. 對話流程設計

#### A. 雙模式運作

**練習模式**
- AI 純粹扮演客戶角色
- 真實模擬客戶反應
- 不會主動給提示

**指導模式**
- AI 在對話中穿插指導
- 提供即時建議
- 點出可改進之處

#### B. 智能難度調整

```typescript
// 根據業務表現動態調整難度
const difficultyLevels = {
  beginner: {
    objectionFrequency: "低",
    complexityLevel: "簡單直接的問題",
    patienceLevel: "高容錯",
  },
  intermediate: {
    objectionFrequency: "中",
    complexityLevel: "需要深入解釋",
    patienceLevel: "一般",
  },
  advanced: {
    objectionFrequency: "高",
    complexityLevel: "複雜技術和商業問題",
    patienceLevel: "低容錯，容易失去興趣",
  }
}
```

### 3. 實時分析與回饋

#### A. 對話分析引擎

```typescript
interface ConversationAnalyzer {
  // 即時分析
  analyzeResponse(userInput: string): {
    effectiveness: number,      // 回應有效性
    missed_opportunities: string[], // 錯失的機會
    good_points: string[],      // 做得好的地方
    suggestions: string[],      // 改進建議
  }
  
  // 階段性總結
  stageReview(): {
    rapport_building: number,   // 建立關係
    needs_discovery: number,    // 需求探索
    objection_handling: number, // 異議處理
    closing_attempt: number,    // 成交嘗試
  }
}
```

#### B. 教學介入機制

1. **溫和提示**（練習不中斷）
   - 在 UI 邊欄顯示提示
   - 不打斷對話流程

2. **暫停指導**（中斷練習）
   - 發現重大錯誤時暫停
   - 解釋問題並給出建議
   - 可選擇重試或繼續

3. **事後檢討**
   - 完整對話記錄
   - 逐句分析和建議
   - 最佳實踐範例

### 4. 技術實現

#### A. API 選擇與配置

**主要模型：GPT-4 或 Claude**
- 強大的角色扮演能力
- 理解複雜商業情境
- 可維持一致性格

**輔助模型：GPT-3.5**
- 用於實時分析
- 快速回應
- 成本效益

#### B. Prompt 工程技巧

```typescript
const systemPrompt = `
你是一位 ${industry} 產業的 ${position}，正在評估新的解決方案。

【角色設定】
- 個性：${personality}（如：謹慎、重視數據、追求 CP 值）
- 痛點：${painPoints.join(', ')}
- 預算考量：${budgetConcern}
- 決策因素：${decisionFactors}

【行為準則】
1. 保持角色一致性，不要突然改變立場
2. 根據業務的表現調整配合度：
   - 如果業務沒有探索需求，保持封閉
   - 如果業務展現專業，逐漸開放
   - 如果感受到壓力，表現出抗拒
3. 適時提出符合角色的異議和擔憂

【對話階段】
- 開場：保持禮貌但有距離感
- 需求探索：根據問題品質決定透露多少資訊
- 方案討論：提出實際的技術和商業問題
- 議價階段：展現價格敏感度

記住：你的目標是幫助業務練習，但要真實模擬客戶行為。
`;
```

#### C. 記憶管理

```typescript
interface TrainingMemory {
  // 單次對話記憶
  sessionContext: {
    mentioned_competitors: string[],
    revealed_needs: string[],
    commitments_made: string[],
    trust_level: number,
  },
  
  // 跨對話學習記錄
  learnerProfile: {
    common_mistakes: string[],
    strengths: string[],
    improvement_areas: string[],
    practice_history: Session[],
  }
}
```

### 5. UI/UX 設計

#### A. 對話介面
- 類似聊天介面
- 客戶頭像和資料卡片
- 即時提示區域（可收合）
- 情緒指標（客戶滿意度）

#### B. 控制面板
- 場景選擇（產業/情境）
- 難度調整
- 模式切換（練習/指導）
- 暫停/繼續按鈕

#### C. 分析儀表板
- 對話時間軸
- 關鍵時刻標記
- 表現評分
- 改進建議清單

### 6. 進階功能

#### A. 情境庫
- 預設常見銷售情境
- 產業別客製化
- 社群分享機制

#### B. 多人演練
- 團隊銷售模擬
- 主管旁聽模式
- 協同練習

#### C. 成長追蹤
- 個人進步曲線
- 弱點分析
- 訓練計畫建議

### 7. 實施步驟

1. **MVP 版本**
   - 單一客戶角色
   - 基本對話功能
   - 簡單評分機制

2. **進階版本**
   - 多種客戶類型
   - 即時指導功能
   - 詳細分析報告

3. **完整版本**
   - 情境編輯器
   - 團隊功能
   - AI 教練系統

## 預期效益

1. **隨時可練習** - 不受資深業務時間限制
2. **客製化訓練** - 針對個人弱點加強
3. **安全環境** - 失敗成本低，可大膽嘗試
4. **數據驅動** - 量化追蹤進步幅度
5. **知識傳承** - 將最佳實踐編碼到系統中