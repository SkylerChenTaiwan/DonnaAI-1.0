/**
 * Firebase 配置和初始化
 */

import { FirebaseApp, initializeApp, getApps } from 'firebase/app';
import { Auth, initializeAuth, getAuth, connectAuthEmulator, getReactNativePersistence } from 'firebase/auth';
import { Firestore, getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { FirebaseStorage, getStorage } from 'firebase/storage';
import { Functions, getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { environmentManager, getFirebaseConfig } from '../../config/environment';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  // 從環境管理器取得 Firebase 配置
  const firebaseConfig = getFirebaseConfig();
  
  // 驗證配置
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error('Firebase 配置不完整，請檢查環境變數設定');
    throw new Error('Firebase 配置錯誤');
  }

  // 只在尚未初始化時初始化 Firebase
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  
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

// 導出 getter 函數，讓使用者需要時才初始化
export { 
  getFirebaseAuth,
  getFirebaseDb,
  getFirebaseStorage,
  getFirebaseFunctions
};