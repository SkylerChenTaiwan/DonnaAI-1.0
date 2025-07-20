/**
 * 測試資料生成器配置
 */

export const config = {
  // 預設值
  defaults: {
    email: 'admin@donnaai.ai',
    customerCount: 20,
    recordsPerCustomer: 5,
    taskCount: 30
  },
  
  // 批次處理設定
  batch: {
    size: 500, // Firestore 批次操作限制
    progressInterval: 10 // 每處理幾筆顯示進度
  },
  
  // Firebase 專案設定（從環境變數讀取）
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || 
               process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    apiKey: process.env.FIREBASE_API_KEY || 
            process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || 
                process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 
                   process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || 
                       process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID || 
           process.env.EXPO_PUBLIC_FIREBASE_APP_ID
  },
  
  // 資料生成設定
  generation: {
    // 客戶資料
    customer: {
      tagOptions: ['重要客戶', '潛在客戶', '新客戶', 'VIP', '長期客戶', '大型企業', '中小企業'],
      industryOptions: ['科技業', '製造業', '服務業', '金融業', '零售業', '生技醫療', '傳統產業', '電子商務', '教育產業'],
      companySizeOptions: ['1-10人', '11-50人', '51-200人', '201-500人', '500人以上']
    },
    
    // 紀錄資料
    record: {
      types: ['meeting', 'call', 'note', 'other'] as const,
      statuses: ['draft', 'processing', 'completed'] as const
    },
    
    // 任務資料
    task: {
      types: ['scheduled', 'unscheduled', 'pending'] as const,
      priorities: ['low', 'medium', 'high', 'urgent'] as const,
      statuses: ['todo', 'in_progress', 'completed', 'cancelled'] as const
    }
  }
};