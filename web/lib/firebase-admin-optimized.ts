/**
 * 優化的 Firebase Admin SDK 配置
 * 使用 Next.js 模組快取和延遲初始化
 */

import { App, initializeApp, getApps, cert } from 'firebase-admin/app';
import { Auth, getAuth } from 'firebase-admin/auth';
import { Firestore, getFirestore } from 'firebase-admin/firestore';
import { Storage, getStorage } from 'firebase-admin/storage';
import { envConfig } from './env-config';

// 快取的服務實例
let cachedApp: App | null = null;
let cachedAuth: Auth | null = null;
let cachedDb: Firestore | null = null;
let cachedStorage: Storage | null = null;

// 初始化狀態
let initializationPromise: Promise<App> | null = null;

/**
 * 取得或初始化 Firebase Admin App
 * 使用雙重檢查鎖定模式確保單例
 */
async function getOrInitializeApp(): Promise<App> {
  // 快速路徑：已經初始化
  if (cachedApp) {
    return cachedApp;
  }

  // 如果正在初始化，等待完成
  if (initializationPromise) {
    return initializationPromise;
  }

  // 開始初始化
  initializationPromise = initializeFirebaseApp();
  
  try {
    cachedApp = await initializationPromise;
    return cachedApp;
  } finally {
    initializationPromise = null;
  }
}

/**
 * 初始化 Firebase Admin App
 */
async function initializeFirebaseApp(): Promise<App> {
  // 檢查是否已有應用程式實例
  const apps = getApps();
  if (apps.length > 0) {
    return apps[0]!;
  }

  // 取得配置
  const config = envConfig.getFirebaseAdminConfig();

  // 初始化應用程式
  const app = initializeApp({
    credential: cert({
      projectId: config.projectId,
      clientEmail: config.clientEmail,
      privateKey: config.privateKey,
    }),
    projectId: config.projectId,
    storageBucket: `${config.projectId}.appspot.com`,
  });

  console.log('✅ Firebase Admin SDK initialized');
  return app;
}

/**
 * 取得 Auth 服務
 */
export async function getAdminAuth(): Promise<Auth> {
  if (cachedAuth) {
    return cachedAuth;
  }

  const app = await getOrInitializeApp();
  cachedAuth = getAuth(app);
  return cachedAuth;
}

/**
 * 取得 Firestore 服務
 */
export async function getAdminFirestore(): Promise<Firestore> {
  if (cachedDb) {
    return cachedDb;
  }

  const app = await getOrInitializeApp();
  cachedDb = getFirestore(app);
  
  // 設定 Firestore 設定
  cachedDb.settings({
    ignoreUndefinedProperties: true,
    timestampsInSnapshots: true,
  });
  
  return cachedDb;
}

/**
 * 取得 Storage 服務
 */
export async function getAdminStorage(): Promise<Storage> {
  if (cachedStorage) {
    return cachedStorage;
  }

  const app = await getOrInitializeApp();
  cachedStorage = getStorage(app);
  return cachedStorage;
}

/**
 * 優化的服務存取器
 * 提供同步存取（如果已初始化）或非同步初始化
 */
export class FirebaseAdminServices {
  private static authPromise: Promise<Auth> | null = null;
  private static firestorePromise: Promise<Firestore> | null = null;
  private static storagePromise: Promise<Storage> | null = null;

  /**
   * 取得 Auth 服務（優化版本）
   */
  static get auth(): Promise<Auth> {
    if (!this.authPromise) {
      this.authPromise = getAdminAuth();
    }
    return this.authPromise;
  }

  /**
   * 取得 Firestore 服務（優化版本）
   */
  static get firestore(): Promise<Firestore> {
    if (!this.firestorePromise) {
      this.firestorePromise = getAdminFirestore();
    }
    return this.firestorePromise;
  }

  /**
   * 取得 Storage 服務（優化版本）
   */
  static get storage(): Promise<Storage> {
    if (!this.storagePromise) {
      this.storagePromise = getAdminStorage();
    }
    return this.storagePromise;
  }

  /**
   * 預熱服務（在應用程式啟動時調用）
   */
  static async warmup(): Promise<void> {
    console.log('🔥 Warming up Firebase Admin services...');
    
    await Promise.all([
      this.auth,
      this.firestore,
      this.storage,
    ]);
    
    console.log('✅ Firebase Admin services ready');
  }

  /**
   * 健康檢查
   */
  static async healthCheck(): Promise<{
    healthy: boolean;
    services: {
      auth: boolean;
      firestore: boolean;
      storage: boolean;
    };
  }> {
    const results = {
      auth: false,
      firestore: false,
      storage: false,
    };

    try {
      // 測試 Auth
      const auth = await this.auth;
      await auth.getUser('health-check').catch(() => null);
      results.auth = true;
    } catch {
      // Auth service unhealthy
    }

    try {
      // 測試 Firestore
      const firestore = await this.firestore;
      await firestore.collection('health-check').limit(1).get();
      results.firestore = true;
    } catch {
      // Firestore service unhealthy
    }

    try {
      // 測試 Storage
      const storage = await this.storage;
      storage.bucket(); // Just check if bucket is accessible
      results.storage = true;
    } catch {
      // Storage service unhealthy
    }

    return {
      healthy: results.auth && results.firestore && results.storage,
      services: results,
    };
  }

  /**
   * 清理快取（主要用於測試）
   */
  static clearCache(): void {
    cachedApp = null;
    cachedAuth = null;
    cachedDb = null;
    cachedStorage = null;
    this.authPromise = null;
    this.firestorePromise = null;
    this.storagePromise = null;
  }
}

// 在非測試環境自動預熱服務
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
  // 使用 setImmediate 避免阻塞初始化
  setImmediate(() => {
    FirebaseAdminServices.warmup().catch(error => {
      console.error('Failed to warmup Firebase Admin services:', error);
    });
  });
}

// 匯出便利函數
export const firebaseAdmin = {
  get auth() {
    return FirebaseAdminServices.auth;
  },
  get firestore() {
    return FirebaseAdminServices.firestore;
  },
  get storage() {
    return FirebaseAdminServices.storage;
  },
  warmup: () => FirebaseAdminServices.warmup(),
  healthCheck: () => FirebaseAdminServices.healthCheck(),
};

// 匯出型別
export type { App, Auth, Firestore, Storage };