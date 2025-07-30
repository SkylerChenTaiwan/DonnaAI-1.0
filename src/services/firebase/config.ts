/**
 * Firebase 配置和初始化
 */

import { Platform } from 'react-native';
import { FirebaseApp, initializeApp, getApps } from 'firebase/app';
import { Auth, initializeAuth, getAuth, connectAuthEmulator, getReactNativePersistence } from 'firebase/auth';
import { Firestore, getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { FirebaseStorage, getStorage } from 'firebase/storage';
import { Functions, getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { environmentManager, getFirebaseConfig } from '../../config/environment';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 完整的環境 polyfill，確保 Firebase SDK 識別為 React Native
// 只在非 Web 平台執行 polyfill
if (Platform.OS !== 'web' && typeof global !== 'undefined') {
  // @ts-ignore
  global.self = global;
  // @ts-ignore
  global.window = global;
  // @ts-ignore
  global.navigator = {
    userAgent: 'ReactNative',
    product: 'ReactNative',
    platform: 'ReactNative',
    appName: 'Netscape',
    appVersion: '5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
    vendor: 'Apple Computer, Inc.',
    vendorSub: ''
  };
  // @ts-ignore
  // 檢查 location 是否可寫，避免 Hermes 引擎錯誤
  if (!global.location || Object.getOwnPropertyDescriptor(global, 'location')?.configurable !== false) {
    try {
      global.location = {
        href: 'http://localhost',
        protocol: 'http:',
        host: 'localhost',
        hostname: 'localhost',
        port: '',
        pathname: '/',
        search: '',
        hash: ''
      };
    } catch (e) {
      // 在 Hermes 中，location 可能是只讀的，忽略錯誤
      console.warn('無法設定 global.location (Hermes 引擎限制):', e.message);
    }
  }
}

// 延遲初始化的實例
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let functions: Functions | null = null;

// 標記是否已連接模擬器
let emulatorsConnected = false;

/**
 * 初始化 Firebase App（如果尚未初始化）
 */
const initializeFirebaseApp = (): FirebaseApp => {
  if (app) return app;

  console.log('🔥 開始初始化 Firebase...');
  console.log('Platform.OS:', Platform.OS);
  console.log('__DEV__:', __DEV__);
  console.log('navigator.product:', typeof navigator !== 'undefined' ? navigator.product : 'undefined');
  console.log('global.navigator:', typeof global !== 'undefined' && global.navigator ? global.navigator : 'undefined');

  // 從環境管理器取得 Firebase 配置
  const firebaseConfig = getFirebaseConfig();
  
  console.log('Firebase 配置:', {
    ...firebaseConfig,
    apiKey: firebaseConfig.apiKey ? '***' + firebaseConfig.apiKey.slice(-4) : 'missing'
  });
  
  // 驗證配置
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error('Firebase 配置不完整，請檢查環境變數設定');
    console.error('完整配置:', firebaseConfig);
    throw new Error('Firebase 配置錯誤');
  }

  // 只在尚未初始化時初始化 Firebase
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  
  console.log('✅ Firebase 初始化成功');
  
  return app;
};

/**
 * 取得 Firebase Auth 實例（延遲初始化）
 */
export const getFirebaseAuth = (): Auth => {
  if (auth) return auth;
  
  const firebaseApp = initializeFirebaseApp();
  
  try {
    if (Platform.OS === 'web') {
      // Web 平台使用預設的瀏覽器持久化
      auth = getAuth(firebaseApp);
    } else {
      // React Native 平台使用 AsyncStorage 持久化
      auth = initializeAuth(firebaseApp, {
        persistence: getReactNativePersistence(AsyncStorage)
      });
    }
  } catch (error) {
    // 如果已經初始化過，使用 getAuth
    auth = getAuth(firebaseApp);
  }
  
  // 連接模擬器（如果需要且尚未連接）
  connectEmulators();
  
  return auth;
};

/**
 * 取得 Firestore 實例（延遲初始化）
 */
export const getFirebaseDb = (): Firestore => {
  if (db) return db;
  
  const firebaseApp = initializeFirebaseApp();
  db = getFirestore(firebaseApp);
  
  // 在 Web 平台上配置 Firestore 以避免 QUIC 協議問題
  if (Platform.OS === 'web') {
    // 強制使用長輪詢而非 WebChannel
    // 這可以避免 QUIC 協議錯誤
    const settings = {
      experimentalForceLongPolling: true,
      cacheSizeBytes: 50 * 1024 * 1024 // 50 MB
    };
    
    try {
      // @ts-ignore - 設定可能不在類型定義中
      db.settings(settings);
    } catch (error) {
      console.warn('無法設定 Firestore 設定:', error);
    }
  }
  
  // 連接模擬器（如果需要且尚未連接）
  connectEmulators();
  
  return db;
};

/**
 * 取得 Storage 實例（延遲初始化）
 */
export const getFirebaseStorage = (): FirebaseStorage => {
  if (storage) return storage;
  
  const firebaseApp = initializeFirebaseApp();
  storage = getStorage(firebaseApp);
  
  return storage;
};

/**
 * 取得 Functions 實例（延遲初始化）
 */
export const getFirebaseFunctions = (): Functions => {
  if (functions) return functions;
  
  const firebaseApp = initializeFirebaseApp();
  functions = getFunctions(firebaseApp);
  
  // 連接模擬器（如果需要且尚未連接）
  connectEmulators();
  
  return functions;
};

/**
 * 連接到 Firebase 模擬器（如果在開發環境）
 */
const connectEmulators = () => {
  if (emulatorsConnected) return;
  
  const env = environmentManager.getConfig();
  
  if (env.firebaseEmulators.enabled && auth && !auth.config?.apiKey?.includes('demo-project')) {
    try {
      if (auth) {
        connectAuthEmulator(auth, env.firebaseEmulators.authUrl, { disableWarnings: true });
      }
      if (db) {
        connectFirestoreEmulator(db, env.firebaseEmulators.firestoreHost, env.firebaseEmulators.firestorePort);
      }
      if (functions) {
        connectFunctionsEmulator(functions, env.firebaseEmulators.functionsHost, env.firebaseEmulators.functionsPort);
      }
      
      emulatorsConnected = true;
      
      if (__DEV__) {
        console.log('✅ Firebase 模擬器已連接');
      }
    } catch (error) {
      // 忽略重複連接錯誤
      if (__DEV__) {
        console.warn('⚠️ Firebase 模擬器連接狀態:', error);
      }
    }
  }
};

// 導出 getter 函數已在上面定義處完成，無需重複導出