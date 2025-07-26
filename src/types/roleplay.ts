/**
 * RolePlay 系統類型定義
 * 定義 AI 業務訓練系統的所有相關介面
 */

// 客戶性格特徵
export interface PersonalityTraits {
  optimistic: number;      // 樂觀程度 0-10
  analytical: number;      // 分析傾向 0-10
  decisive: number;        // 決策速度 0-10
  skeptical: number;       // 懷疑程度 0-10
  friendly: number;        // 友善程度 0-10
  professional: number;    // 專業程度 0-10
  priceConscious: number;  // 價格敏感度 0-10
  innovative: number;      // 創新接受度 0-10
}

// 預算檔案
export interface BudgetProfile {
  range: {
    min: number;
    max: number;
  };
  flexibility: number;      // 預算彈性 0-10
  decisionPower: boolean;   // 是否有決策權
  approvalProcess: string;  // 審批流程描述
}

// 狀態轉換條件
export interface StateTransition {
  toState: StateType;
  condition: string;         // 轉換條件描述
  triggers: string[];        // 觸發關鍵字
  probability: number;       // 轉換機率 0-1
}

// 狀態類型枚舉
export enum StateType {
  INITIAL = 'INITIAL',                    // 初始接觸
  INTERESTED = 'INTERESTED',              // 產生興趣
  SKEPTICAL = 'SKEPTICAL',                // 懷疑觀望
  PRICE_SHOCK = 'PRICE_SHOCK',            // 價格震驚
  NEGOTIATING = 'NEGOTIATING',            // 討價還價
  TECHNICAL_REVIEW = 'TECHNICAL_REVIEW',  // 技術評估
  INTERNAL_DISCUSSION = 'INTERNAL_DISCUSSION', // 內部討論
  READY_TO_BUY = 'READY_TO_BUY',         // 準備購買
  OBJECTION = 'OBJECTION',                // 提出異議
  CLOSING = 'CLOSING',                    // 成交階段
  LOST = 'LOST',                          // 失去興趣
  WON = 'WON'                             // 成功成交
}

// 客戶原型定義
export interface CustomerPersona {
  id: string;
  name: string;
  profile: {
    industry: string;
    companySize: string;
    position: string;
    personality: PersonalityTraits;
    painPoints: string[];
    budget: BudgetProfile;
    decisionProcess: string;
  };
  triggers: {
    positive: string[];      // 正面觸發詞
    negative: string[];      // 負面觸發詞
  };
  initialState: StateType;   // 初始狀態
  difficulty: number;        // 難度等級 1-10
}

// 客戶當前狀態
export interface CustomerState {
  id: StateType;
  name: string;
  description: string;
  behaviors: {
    openness: number;       // 開放程度 0-10
    patience: number;       // 耐心程度 0-10
    trust: number;          // 信任程度 0-10
    defensiveness: number;  // 防禦心理 0-10
  };
  responsePatterns: string[]; // 典型回應模式
  transitions: StateTransition[];
  hiddenThoughts?: string[];  // 內心想法（不會說出來）
}

// 對話重要性等級
export enum ImportanceLevel {
  CRITICAL = 'critical',    // 關鍵對話
  IMPORTANT = 'important',  // 重要對話
  NORMAL = 'normal',        // 一般對話
  TRIVIAL = 'trivial'       // 瑣碎對話
}

// 壓縮後的對話記錄
export interface CompressedDialogue {
  turnNumber: number;
  summary: string;
  keyPoints: string[];
  emotionMetrics: {
    trust: number;
    interest: number;
    frustration: number;
    excitement: number;
  };
  importance: ImportanceLevel;
  timestamp: Date;
}

// 會話指標
export interface SessionMetrics {
  totalTurns: number;
  trustProgression: number[];
  stateChanges: Array<{
    from: StateType;
    to: StateType;
    turn: number;
    reason: string;
  }>;
  keyMoments: Array<{
    turn: number;
    event: string;
    impact: 'positive' | 'negative' | 'neutral';
  }>;
  finalOutcome?: 'won' | 'lost' | 'ongoing';
  score?: number;           // 表現分數 0-100
}

// 對話會話
export interface DialogueSession {
  sessionId: string;
  userId: string;
  persona: CustomerPersona;
  currentState: CustomerState;
  conversationHistory: CompressedDialogue[];
  metrics: SessionMetrics;
  startTime: Date;
  endTime?: Date;
  feedbackNotes?: string;   // 教練回饋
}

// 對話選項（用於 API 呼叫）
export interface DialogueOptions {
  sessionId: string;
  userInput: string;
  useAdvancedModel?: boolean;  // 是否使用 Gemini Pro
  enableHints?: boolean;        // 是否啟用即時提示
  compressionLevel?: 'none' | 'light' | 'aggressive';
}

// AI 回應結構
export interface AIResponse {
  customerResponse: string;     // 客戶回應
  stateChange?: {
    from: StateType;
    to: StateType;
    reason: string;
  };
  hint?: string;               // 給業務的提示
  internalThought?: string;    // 客戶內心想法（除錯用）
  confidence: number;          // AI 信心度 0-1
}

// 快取項目
export interface CacheItem {
  key: string;
  response: string;
  state: StateType;
  timestamp: Date;
  hitCount: number;
}

// 訓練進度
export interface TrainingProgress {
  userId: string;
  personaId: string;
  sessionsCompleted: number;
  averageScore: number;
  strengths: string[];
  weaknesses: string[];
  lastSessionDate: Date;
}

// Prompt 模板變數
export interface PromptVariables {
  [key: string]: string | number | boolean;
}

// Prompt 模板定義
export interface PromptTemplate {
  template: string;
  variables: string[];
  description?: string;
}

// RolePlay API 錯誤
export class RolePlayError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'RolePlayError';
  }
}

// 所有介面和類型都已經在定義時匯出，無需再次匯出