/**
 * 環境變數配置和驗證
 * 提供型別安全的環境變數存取
 */

// 必要的環境變數檢查
const requiredEnvVars = {
  // Firebase Admin SDK (Server-side)
  FIREBASE_PROJECT_ID: process.env['FIREBASE_PROJECT_ID'],
  FIREBASE_CLIENT_EMAIL: process.env['FIREBASE_CLIENT_EMAIL'],
  FIREBASE_PRIVATE_KEY: process.env['FIREBASE_PRIVATE_KEY'],
  
  // Firebase Web SDK (Client-side) - 這些會在客戶端使用
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env['NEXT_PUBLIC_FIREBASE_API_KEY'],
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'],
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env['NEXT_PUBLIC_FIREBASE_PROJECT_ID'],
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'],
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env['NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'],
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env['NEXT_PUBLIC_FIREBASE_APP_ID'],
} as const;

// 可選的環境變數
const optionalEnvVars = {
  NODE_ENV: process.env['NODE_ENV'] || 'development',
  NEXT_PUBLIC_APP_URL: process.env['NEXT_PUBLIC_APP_URL'] || 'http://localhost:3000',
  JWT_SECRET: process.env['JWT_SECRET'],
  SESSION_SECRET: process.env['SESSION_SECRET'],
  CLAUDE_API_KEY: process.env['CLAUDE_API_KEY'],
  OPENAI_API_KEY: process.env['OPENAI_API_KEY'],
  DATABASE_URL: process.env['DATABASE_URL'],
  SMTP_HOST: process.env['SMTP_HOST'],
  SMTP_PORT: process.env['SMTP_PORT'],
  SMTP_USER: process.env['SMTP_USER'],
  SMTP_PASS: process.env['SMTP_PASS'],
  VERCEL_ANALYTICS_ID: process.env['VERCEL_ANALYTICS_ID'],
  SENTRY_DSN: process.env['SENTRY_DSN'],
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100'),
  RATE_LIMIT_WINDOW_MS: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'),
} as const;

// Feature flags
const featureFlags = {
  ENABLE_ANALYTICS: process.env['NEXT_PUBLIC_ENABLE_ANALYTICS'] === 'true',
  ENABLE_DEBUG: process.env['NEXT_PUBLIC_ENABLE_DEBUG'] === 'true',
  ENABLE_EXPERIMENTAL_FEATURES: process.env['NEXT_PUBLIC_ENABLE_EXPERIMENTAL'] === 'true',
} as const;

// 環境變數驗證函數
function validateRequiredEnvVars(): void {
  const missingVars: string[] = [];
  
  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value || value.trim() === '') {
      missingVars.push(key);
    }
  }
  
  if (missingVars.length > 0) {
    const errorMessage = `
❌ 缺少必要的環境變數:
${missingVars.map(v => `  - ${v}`).join('\n')}

請複製 .env.example 到 .env.local 並填入正確的值。
或在部署平台設定相應的環境變數。
    `;
    
    console.error(errorMessage);
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    } else {
      console.warn('⚠️  在開發環境中繼續運行，但功能可能受限');
    }
  }
}

// 環境變數完整性檢查
function validateEnvIntegrity(): void {
  // 檢查 Firebase 配置一致性
  const serverProjectId = requiredEnvVars['FIREBASE_PROJECT_ID'];
  const clientProjectId = requiredEnvVars['NEXT_PUBLIC_FIREBASE_PROJECT_ID'];
  
  if (serverProjectId && clientProjectId && serverProjectId !== clientProjectId) {
    console.warn(
      '⚠️  Firebase 專案 ID 不一致：',
      `服務端: ${serverProjectId}, 客戶端: ${clientProjectId}`
    );
  }
  
  // 檢查 URL 格式
  const appUrl = optionalEnvVars['NEXT_PUBLIC_APP_URL'];
  if (appUrl && !appUrl.startsWith('http')) {
    console.warn('⚠️  APP_URL 應該包含協議 (http:// 或 https://)');
  }
  
  // 檢查數字型別的環境變數
  if (isNaN(optionalEnvVars['RATE_LIMIT_MAX_REQUESTS'])) {
    console.warn('⚠️  RATE_LIMIT_MAX_REQUESTS 應該是有效的數字');
  }
  
  if (isNaN(optionalEnvVars['RATE_LIMIT_WINDOW_MS'])) {
    console.warn('⚠️  RATE_LIMIT_WINDOW_MS 應該是有效的數字');
  }
}

// 獲取安全的環境變數配置（不包含敏感資訊）
export function getSafeEnvConfig() {
  return {
    NODE_ENV: optionalEnvVars['NODE_ENV'],
    APP_URL: optionalEnvVars['NEXT_PUBLIC_APP_URL'],
    FIREBASE_PROJECT_ID: requiredEnvVars['NEXT_PUBLIC_FIREBASE_PROJECT_ID'],
    FIREBASE_AUTH_DOMAIN: requiredEnvVars['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'],
    ENABLE_ANALYTICS: featureFlags['ENABLE_ANALYTICS'],
    ENABLE_DEBUG: featureFlags['ENABLE_DEBUG'],
  };
}

// 環境檢測函數
export const env = {
  isDevelopment: optionalEnvVars['NODE_ENV'] === 'development',
  isProduction: optionalEnvVars['NODE_ENV'] === 'production',
  isTest: optionalEnvVars['NODE_ENV'] === 'test',
} as const;

// 配置物件（型別安全）
export const config = {
  // Firebase 配置
  firebase: {
    // 服務端配置 (Admin SDK)
    admin: {
      projectId: requiredEnvVars['FIREBASE_PROJECT_ID']!,
      clientEmail: requiredEnvVars['FIREBASE_CLIENT_EMAIL']!,
      privateKey: requiredEnvVars['FIREBASE_PRIVATE_KEY']!,
    },
    // 客戶端配置 (Web SDK)
    client: {
      apiKey: requiredEnvVars['NEXT_PUBLIC_FIREBASE_API_KEY']!,
      authDomain: requiredEnvVars['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN']!,
      projectId: requiredEnvVars['NEXT_PUBLIC_FIREBASE_PROJECT_ID']!,
      storageBucket: requiredEnvVars['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET']!,
      messagingSenderId: requiredEnvVars['NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID']!,
      appId: requiredEnvVars['NEXT_PUBLIC_FIREBASE_APP_ID']!,
    },
  },
  
  // 應用程式配置
  app: {
    url: optionalEnvVars['NEXT_PUBLIC_APP_URL'],
    environment: optionalEnvVars['NODE_ENV'],
  },
  
  // 安全配置
  security: {
    jwtSecret: optionalEnvVars['JWT_SECRET'],
    sessionSecret: optionalEnvVars['SESSION_SECRET'],
  },
  
  // API 配置
  apis: {
    claude: optionalEnvVars['CLAUDE_API_KEY'],
    openai: optionalEnvVars['OPENAI_API_KEY'],
  },
  
  // 資料庫配置
  database: {
    url: optionalEnvVars['DATABASE_URL'],
  },
  
  // Email 配置
  email: {
    host: optionalEnvVars['SMTP_HOST'],
    port: optionalEnvVars['SMTP_PORT'],
    user: optionalEnvVars['SMTP_USER'],
    pass: optionalEnvVars['SMTP_PASS'],
  },
  
  // 監控配置
  monitoring: {
    analytics: optionalEnvVars['VERCEL_ANALYTICS_ID'],
    sentry: optionalEnvVars['SENTRY_DSN'],
  },
  
  // 速率限制配置
  rateLimit: {
    maxRequests: optionalEnvVars['RATE_LIMIT_MAX_REQUESTS'],
    windowMs: optionalEnvVars['RATE_LIMIT_WINDOW_MS'],
  },
  
  // Feature flags
  features: featureFlags,
} as const;

// 初始化函數
export function initializeEnv(): void {
  if (typeof window === 'undefined') {
    // 只在伺服器端執行驗證
    console.log('🔧 驗證環境變數配置...');
    validateRequiredEnvVars();
    validateEnvIntegrity();
    console.log('✅ 環境變數驗證完成');
  }
}

// 環境資訊輸出（開發用）
export function logEnvironmentInfo(): void {
  if (!env.isProduction && typeof window === 'undefined') {
    console.log('\n📋 環境配置資訊:');
    console.log(`   NODE_ENV: ${config.app.environment}`);
    console.log(`   APP_URL: ${config.app.url}`);
    console.log(`   Firebase Project: ${config.firebase.client.projectId}`);
    console.log(`   Analytics: ${config.features.ENABLE_ANALYTICS ? '啟用' : '停用'}`);
    console.log(`   Debug: ${config.features.ENABLE_DEBUG ? '啟用' : '停用'}`);
    console.log('');
  }
}

// 匯出環境變數（型別安全）
export type Config = typeof config;
export type FeatureFlags = typeof featureFlags;

// 自動初始化（在模組載入時）
if (typeof window === 'undefined') {
  initializeEnv();
  
  if (env.isDevelopment) {
    logEnvironmentInfo();
  }
}