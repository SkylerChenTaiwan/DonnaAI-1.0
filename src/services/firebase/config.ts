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
if (typeof global !== 'undefined') {
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
    // 使用 initializeAuth 並設定 React Native 的持久化
    auth = initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
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