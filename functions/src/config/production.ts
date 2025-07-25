/**
 * Cloud Functions 生產環境配置
 */

export const productionConfig = {
  // 區域設定
  region: 'asia-east1',
  
  // 記憶體配置
  memory: {
    default: '1GiB',
    aiProcessing: '2GiB',
    batchProcessing: '4GiB'
  },
  
  // 逾時設定
  timeout: {
    default: 300,      // 5 分鐘
    aiProcessing: 540, // 9 分鐘
    batchJob: 900      // 15 分鐘
  },
  
  // 實例配置
  instances: {
    minInstances: 0,   // 節省成本
    maxInstances: 10   // 防止過度擴展
  },
  
  // CORS 設定
  corsOrigins: [
    'https://donnaai.app',
    'https://donnaai-production.web.app',
    'https://donnaai-production.firebaseapp.com'
  ],
  
  // AI 模型配置
  aiModels: {
    openai: {
      defaultModel: 'gpt-4',
      temperature: 0.7,
      maxTokens: 2000
    },
    claude: {
      defaultModel: 'claude-3-sonnet-20240229',
      temperature: 0.7,
      maxTokens: 2000
    },
    gemini: {
      defaultModel: 'gemini-pro',
      temperature: 0.7,
      maxTokens: 2000
    }
  },
  
  // 批次處理設定
  batchConfig: {
    maxBatchSize: 100,
    processingDelay: 1000 // 毫秒
  },
  
  // 錯誤重試設定
  retryConfig: {
    maxRetries: 3,
    backoffMultiplier: 2,
    initialDelay: 1000 // 毫秒
  }
};