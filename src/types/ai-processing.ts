/**
 * AI 處理相關型別定義
 */

import { Timestamp } from 'firebase/firestore';

// AI 模型類型
export type AIModel = 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3' | 'whisper' | 'custom';

// AI 處理任務類型
export type AITaskType = 'transcription' | 'summary' | 'field_extraction' | 'action_extraction' | 'sentiment_analysis';

// AI 處理請求
export interface AIProcessingRequest {
  id: string;
  taskType: AITaskType;
  model?: AIModel;                     // 指定使用的模型
  input: {
    audioUrl?: string;                 // 音訊檔案 URL
    text?: string;                     // 文字內容
    context?: Record<string, any>;     // 額外上下文
  };
  config?: {
    language?: string;                 // 語言設定
    maxTokens?: number;                // 最大 token 數
    temperature?: number;              // 生成溫度
    customPrompt?: string;             // 自訂提示
  };
  priority: 'low' | 'normal' | 'high';
  requestedBy: string;                 // 請求者 ID
  requestedAt: Timestamp;
  organizationId: string;
}

// AI 處理回應
export interface AIProcessingResponse {
  requestId: string;
  taskType: AITaskType;
  model: AIModel;
  output: {
    transcription?: string;            // 轉錄文字
    summary?: string;                  // 摘要
    extractedFields?: Record<string, any>; // 提取的欄位
    actionItems?: string[];            // 行動項目
    sentiment?: {                      // 情感分析
      score: number;                   // -1 到 1
      label: 'negative' | 'neutral' | 'positive';
    };
  };
  metadata: {
    processingTime: number;            // 處理時間（毫秒）
    tokensUsed: number;                // 使用的 token 數
    cost?: number;                     // 成本
    confidence?: number;               // 整體信心分數
  };
  processedAt: Timestamp;
  success: boolean;
  error?: string;
}

// AI 處理工作
export interface AIProcessingJob {
  id: string;
  request: AIProcessingRequest;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  response?: AIProcessingResponse;
  attempts: number;                    // 嘗試次數
  lastAttemptAt?: Timestamp;
  error?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// AI 處理配額
export interface AIProcessingQuota {
  organizationId: string;
  quotaType: 'minutes' | 'tokens' | 'requests';
  limit: number;                       // 配額上限
  used: number;                        // 已使用量
  period: 'daily' | 'weekly' | 'monthly';
  resetAt: Timestamp;                  // 配額重置時間
}

// AI 模型配置
export interface AIModelConfig {
  model: AIModel;
  endpoint?: string;                   // API 端點
  apiKey?: string;                     // API 金鑰（應加密儲存）
  defaultConfig?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  };
  costPerToken?: number;               // 每 token 成本
  rateLimit?: {                        // 速率限制
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
}

// AI 處理統計
export interface AIProcessingStats {
  organizationId: string;
  period: {
    start: Timestamp;
    end: Timestamp;
  };
  byTaskType: Record<AITaskType, {
    count: number;
    totalTime: number;
    totalTokens: number;
    totalCost: number;
    successRate: number;
  }>;
  byModel: Record<AIModel, {
    count: number;
    totalTokens: number;
    totalCost: number;
  }>;
  topUsers: Array<{
    userId: string;
    requestCount: number;
    tokensUsed: number;
  }>;
}

// Webhook 通知配置
export interface AIWebhookConfig {
  url: string;
  events: AITaskType[];                // 訂閱的事件類型
  secret?: string;                     // 驗證密鑰
  enabled: boolean;
  retryConfig?: {
    maxRetries: number;
    retryDelayMs: number;
  };
}