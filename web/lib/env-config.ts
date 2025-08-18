/**
 * 改進的環境變數配置系統
 * 支援延遲初始化、型別安全、環境切換
 */

import { z } from 'zod';

// 環境變數 Schema 定義
const envSchema = z.object({
  // Node 環境
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // Firebase Admin SDK (Server-side)
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().email(),
  FIREBASE_PRIVATE_KEY: z.string().min(1),
  
  // Firebase Web SDK (Client-side)
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1),
  
  // 應用程式配置
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  
  // 安全配置 (可選)
  JWT_SECRET: z.string().optional(),
  SESSION_SECRET: z.string().optional(),
  
  // API Keys (可選)
  CLAUDE_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  
  // 資料庫 (可選)
  DATABASE_URL: z.string().url().optional(),
  
  // Email (可選)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().regex(/^\d+$/).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  
  // 監控 (可選)
  VERCEL_ANALYTICS_ID: z.string().optional(),
  SENTRY_DSN: z.string().url().optional(),
  
  // 速率限制 (可選)
  RATE_LIMIT_MAX_REQUESTS: z.string().regex(/^\d+$/).default('100'),
  RATE_LIMIT_WINDOW_MS: z.string().regex(/^\d+$/).default('900000'),
  
  // Feature Flags
  NEXT_PUBLIC_ENABLE_ANALYTICS: z.enum(['true', 'false']).default('false'),
  NEXT_PUBLIC_ENABLE_DEBUG: z.enum(['true', 'false']).default('false'),
  NEXT_PUBLIC_ENABLE_EXPERIMENTAL: z.enum(['true', 'false']).default('false'),
});

// 推斷型別
type EnvConfig = z.infer<typeof envSchema>;

// 環境配置類別
class EnvironmentConfig {
  private static instance: EnvironmentConfig | null = null;
  private config: EnvConfig | null = null;
  private initialized = false;
  private validationErrors: z.ZodError | null = null;

  private constructor() {}

  // 取得單例實例
  static getInstance(): EnvironmentConfig {
    if (!EnvironmentConfig.instance) {
      EnvironmentConfig.instance = new EnvironmentConfig();
    }
    return EnvironmentConfig.instance;
  }

  // 初始化環境變數
  initialize(customEnv?: Record<string, string | undefined>): void {
    if (this.initialized && !customEnv) {
      return;
    }

    const env = customEnv || process.env;
    
    try {
      // 處理 Firebase Private Key 的換行符
      const processedEnv = {
        ...env,
        FIREBASE_PRIVATE_KEY: env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      };

      // 驗證環境變數
      this.config = envSchema.parse(processedEnv);
      this.initialized = true;
      this.validationErrors = null;

      // 開發環境記錄
      if (this.isDevelopment()) {
        this.logConfiguration();
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.validationErrors = error;
        this.handleValidationErrors(error);
      } else {
        throw error;
      }
    }
  }

  // 處理驗證錯誤
  private handleValidationErrors(error: z.ZodError): void {
    const missingVars = error.errors
      .filter(err => err.code === 'invalid_type' && err.received === 'undefined')
      .map(err => err.path.join('.'));

    const invalidVars = error.errors
      .filter(err => err.code !== 'invalid_type' || err.received !== 'undefined')
      .map(err => ({
        path: err.path.join('.'),
        message: err.message,
      }));

    console.error('\n❌ 環境變數配置錯誤:\n');

    if (missingVars.length > 0) {
      console.error('缺少必要的環境變數:');
      missingVars.forEach(v => console.error(`  - ${v}`));
    }

    if (invalidVars.length > 0) {
      console.error('\n無效的環境變數:');
      invalidVars.forEach(v => console.error(`  - ${v.path}: ${v.message}`));
    }

    console.error('\n請檢查 .env.local 檔案或環境變數設定。\n');

    // 生產環境直接拋出錯誤
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Environment configuration failed');
    }
    
    // 開發環境允許繼續，但功能受限
    console.warn('⚠️  在開發環境中繼續運行，但功能可能受限\n');
  }

  // 記錄配置資訊
  private logConfiguration(): void {
    if (!this.config) return;

    console.log('\n📋 環境配置資訊:');
    console.log(`   環境: ${this.config.NODE_ENV}`);
    console.log(`   應用程式 URL: ${this.config.NEXT_PUBLIC_APP_URL}`);
    console.log(`   Firebase 專案: ${this.config.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`);
    console.log(`   分析: ${this.config.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true' ? '啟用' : '停用'}`);
    console.log(`   除錯: ${this.config.NEXT_PUBLIC_ENABLE_DEBUG === 'true' ? '啟用' : '停用'}`);
    console.log('');
  }

  // 取得配置
  getConfig(): EnvConfig {
    if (!this.initialized) {
      this.initialize();
    }

    if (!this.config) {
      throw new Error('Environment configuration not available');
    }

    return this.config;
  }

  // 取得特定配置值
  get<K extends keyof EnvConfig>(key: K): EnvConfig[K] {
    const config = this.getConfig();
    return config[key];
  }

  // 環境檢查方法
  isDevelopment(): boolean {
    return this.get('NODE_ENV') === 'development';
  }

  isProduction(): boolean {
    return this.get('NODE_ENV') === 'production';
  }

  isTest(): boolean {
    return this.get('NODE_ENV') === 'test';
  }

  // Feature Flag 檢查
  isAnalyticsEnabled(): boolean {
    return this.get('NEXT_PUBLIC_ENABLE_ANALYTICS') === 'true';
  }

  isDebugEnabled(): boolean {
    return this.get('NEXT_PUBLIC_ENABLE_DEBUG') === 'true';
  }

  isExperimentalEnabled(): boolean {
    return this.get('NEXT_PUBLIC_ENABLE_EXPERIMENTAL') === 'true';
  }

  // 取得 Firebase 配置
  getFirebaseAdminConfig() {
    const config = this.getConfig();
    return {
      projectId: config.FIREBASE_PROJECT_ID,
      clientEmail: config.FIREBASE_CLIENT_EMAIL,
      privateKey: config.FIREBASE_PRIVATE_KEY,
    };
  }

  getFirebaseClientConfig() {
    const config = this.getConfig();
    return {
      apiKey: config.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: config.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: config.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: config.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: config.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: config.NEXT_PUBLIC_FIREBASE_APP_ID,
    };
  }

  // 取得速率限制配置
  getRateLimitConfig() {
    const config = this.getConfig();
    return {
      maxRequests: parseInt(config.RATE_LIMIT_MAX_REQUESTS),
      windowMs: parseInt(config.RATE_LIMIT_WINDOW_MS),
    };
  }

  // 取得安全的公開配置（不包含敏感資訊）
  getPublicConfig() {
    const config = this.getConfig();
    return {
      environment: config.NODE_ENV,
      appUrl: config.NEXT_PUBLIC_APP_URL,
      firebase: {
        projectId: config.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        authDomain: config.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      },
      features: {
        analytics: config.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
        debug: config.NEXT_PUBLIC_ENABLE_DEBUG === 'true',
        experimental: config.NEXT_PUBLIC_ENABLE_EXPERIMENTAL === 'true',
      },
    };
  }

  // 驗證配置完整性
  validateConfig(): { valid: boolean; errors?: string[] } {
    if (this.validationErrors) {
      return {
        valid: false,
        errors: this.validationErrors.errors.map(e => e.message),
      };
    }

    if (!this.config) {
      return {
        valid: false,
        errors: ['Configuration not initialized'],
      };
    }

    // 額外的業務邏輯驗證
    const errors: string[] = [];

    // 檢查 Firebase Project ID 一致性
    if (this.config.FIREBASE_PROJECT_ID !== this.config.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      errors.push('Firebase project IDs do not match between server and client configs');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  // 重置配置（主要用於測試）
  reset(): void {
    this.config = null;
    this.initialized = false;
    this.validationErrors = null;
  }
}

// 匯出單例實例
export const envConfig = EnvironmentConfig.getInstance();

// 匯出型別
export type { EnvConfig };

// 便利函數
export const getEnv = <K extends keyof EnvConfig>(key: K): EnvConfig[K] => {
  return envConfig.get(key);
};

export const isDevelopment = () => envConfig.isDevelopment();
export const isProduction = () => envConfig.isProduction();
export const isTest = () => envConfig.isTest();

// 自動初始化（只在伺服器端）
if (typeof window === 'undefined') {
  envConfig.initialize();
}