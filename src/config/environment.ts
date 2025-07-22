/**
 * 環境配置管理系統
 * 負責驗證和管理應用程式的環境變數
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * 支援的環境類型
 */
export type Environment = 'development' | 'staging' | 'production';

/**
 * 環境配置介面
 */
export interface EnvironmentConfig {
  name: Environment;
  apiUrl: string;
  enableDevTools: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  firebaseEmulators: {
    enabled: boolean;
    authUrl: string;
    firestoreHost: string;
    firestorePort: number;
    functionsHost: string;
    functionsPort: number;
  };
}

/**
 * 環境管理器
 * 單例模式確保環境配置的一致性
 */
class EnvironmentManager {
  private static instance: EnvironmentManager;
  private config: EnvironmentConfig;
  
  private constructor() {
    this.validateEnvironment();
    this.config = this.loadConfiguration();
  }
  
  /**
   * 取得環境管理器實例
   */
  static getInstance(): EnvironmentManager {
    if (!EnvironmentManager.instance) {
      EnvironmentManager.instance = new EnvironmentManager();
    }
    return EnvironmentManager.instance;
  }
  
  /**
   * 驗證必要的環境變數
   * @throws {Error} 如果缺少必要的環境變數
   */
  private validateEnvironment(): void {
    // 檢查 Firebase 配置（使用轉換後的鍵名）
    const firebaseKeys = [
      'firebaseApiKey',
      'firebaseProjectId',
      'firebaseAuthDomain',
      'firebaseAppId'
    ];
    
    const missing = firebaseKeys.filter(key => {
      const value = Constants.expoConfig?.extra?.[key];
      return !value || value === '';
    });
    
    if (missing.length > 0) {
      const errorMsg = `缺少必要的 Firebase 配置: ${missing.join(', ')}\n請檢查 app.config.js 和 .env 檔案是否正確設定。`;
      
      // 在開發環境顯示詳細錯誤
      if (__DEV__) {
        console.error(errorMsg);
        console.log('目前的配置:', Constants.expoConfig?.extra);
      }
      
      throw new Error(errorMsg);
    }
  }
  
  /**
   * 載入環境配置
   */
  private loadConfiguration(): EnvironmentConfig {
    // 從 Constants.expoConfig.extra 讀取環境變數
    const env = (Constants.expoConfig?.extra?.env || 'development') as Environment;
    
    const isDebug = Constants.expoConfig?.extra?.debug === 'true' || 
                   Constants.expoConfig?.extra?.debug === true;
    
    // 根據環境設定 API URL
    const apiUrls: Record<Environment, string> = {
      development: 'http://localhost:5001',
      staging: 'https://staging-api.donna-ai.com',
      production: 'https://api.donna-ai.com'
    };
    
    return {
      name: env,
      apiUrl: apiUrls[env],
      enableDevTools: env !== 'production' || isDebug,
      logLevel: this.getLogLevel(env),
      firebaseEmulators: {
        enabled: false, // 暫時停用模擬器，直接使用真實 Firebase
        authUrl: Platform.OS === 'ios' ? 'http://10.1.1.142:9099' : 'http://localhost:9099',
        firestoreHost: Platform.OS === 'ios' ? '10.1.1.142' : 'localhost',
        firestorePort: 8080,
        functionsHost: Platform.OS === 'ios' ? '10.1.1.142' : 'localhost',
        functionsPort: 5001
      }
    };
  }
  
  /**
   * 根據環境取得日誌等級
   */
  private getLogLevel(env: Environment): EnvironmentConfig['logLevel'] {
    switch (env) {
      case 'production':
        return 'error';
      case 'staging':
        return 'warn';
      case 'development':
      default:
        return 'debug';
    }
  }
  
  /**
   * 取得目前的環境配置
   */
  getConfig(): EnvironmentConfig {
    return this.config;
  }
  
  /**
   * 取得 Firebase 配置
   */
  getFirebaseConfig() {
    // 優先從 Constants.expoConfig.extra 讀取，如果沒有則使用 process.env 作為備用
    const config = {
      apiKey: Constants.expoConfig?.extra?.firebaseApiKey || 
              process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain || 
                  process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: Constants.expoConfig?.extra?.firebaseProjectId || 
                 process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket || 
                     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId || 
                        process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: Constants.expoConfig?.extra?.firebaseAppId || 
             process.env.EXPO_PUBLIC_FIREBASE_APP_ID
    };

    // 檢查配置是否完整
    if (!config.apiKey || !config.projectId) {
      console.error('Firebase 配置不完整');
      console.error('Constants.expoConfig.extra:', Constants.expoConfig?.extra);
      console.error('process.env:', {
        apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ? '***' : 'missing',
        projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'missing'
      });
    }

    return config;
  }
  
  /**
   * 檢查是否為開發環境
   */
  isDevelopment(): boolean {
    return this.config.name === 'development';
  }
  
  /**
   * 檢查是否為生產環境
   */
  isProduction(): boolean {
    return this.config.name === 'production';
  }
  
  /**
   * 檢查是否啟用開發工具
   */
  isDevToolsEnabled(): boolean {
    return this.config.enableDevTools;
  }
  
  /**
   * 取得環境資訊摘要（用於除錯）
   */
  getSummary(): string {
    return `
環境配置摘要：
- 環境名稱: ${this.config.name}
- API URL: ${this.config.apiUrl}
- 開發工具: ${this.config.enableDevTools ? '已啟用' : '已停用'}
- 日誌等級: ${this.config.logLevel}
- Firebase 模擬器: ${this.config.firebaseEmulators.enabled ? '已啟用' : '已停用'}
`.trim();
  }
}

// 匯出單例實例
export const environmentManager = EnvironmentManager.getInstance();

// 匯出便利函數
export const getEnvironment = () => environmentManager.getConfig();
export const isDevelopment = () => environmentManager.isDevelopment();
export const isProduction = () => environmentManager.isProduction();
export const getFirebaseConfig = () => environmentManager.getFirebaseConfig();

// 在開發環境輸出配置摘要
if (__DEV__) {
  console.log('🔧 環境配置已載入:');
  console.log(environmentManager.getSummary());
}