/**
 * Firebase Web SDK 客戶端配置
 * 用於 Web 應用的客戶端 Firebase 操作
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

// Firebase 配置介面
interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// 從環境變數讀取 Firebase 配置
function getFirebaseClientConfig(): FirebaseClientConfig {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  // 檢查必要的配置
  const missingConfig = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingConfig.length > 0) {
    throw new Error(
      `Missing Firebase client configuration: ${missingConfig.join(', ')}. ` +
      'Please check your environment variables.'
    );
  }

  return config as FirebaseClientConfig;
}

// 初始化 Firebase 應用（客戶端）
function initializeFirebaseClient() {
  // 避免重複初始化
  if (getApps().length > 0) {
    return getApp();
  }

  const config = getFirebaseClientConfig();
  return initializeApp(config);
}

// 初始化 Firebase 客戶端應用
const firebaseClientApp = initializeFirebaseClient();

// 初始化各種服務
export const auth = getAuth(firebaseClientApp);
export const db = getFirestore(firebaseClientApp);
export const storage = getStorage(firebaseClientApp);
export const functions = getFunctions(firebaseClientApp);

// 開發環境模擬器連接
if (process.env.NODE_ENV === 'development') {
  const isEmulatorConnected = {
    auth: false,
    firestore: false,
    storage: false,
    functions: false,
  };

  // Firebase Auth 模擬器
  if (!isEmulatorConnected.auth) {
    try {
      connectAuthEmulator(auth, 'http://localhost:9099');
      isEmulatorConnected.auth = true;
      console.log('🔥 Connected to Firebase Auth Emulator');
    } catch (error) {
      console.warn('Failed to connect to Auth emulator:', error);
    }
  }

  // Firestore 模擬器
  if (!isEmulatorConnected.firestore) {
    try {
      connectFirestoreEmulator(db, 'localhost', 8080);
      isEmulatorConnected.firestore = true;
      console.log('🔥 Connected to Firestore Emulator');
    } catch (error) {
      console.warn('Failed to connect to Firestore emulator:', error);
    }
  }

  // Storage 模擬器
  if (!isEmulatorConnected.storage) {
    try {
      connectStorageEmulator(storage, 'localhost', 9199);
      isEmulatorConnected.storage = true;
      console.log('🔥 Connected to Firebase Storage Emulator');
    } catch (error) {
      console.warn('Failed to connect to Storage emulator:', error);
    }
  }

  // Functions 模擬器
  if (!isEmulatorConnected.functions) {
    try {
      connectFunctionsEmulator(functions, 'localhost', 5001);
      isEmulatorConnected.functions = true;
      console.log('🔥 Connected to Firebase Functions Emulator');
    } catch (error) {
      console.warn('Failed to connect to Functions emulator:', error);
    }
  }
}

// 匯出預設應用
export default firebaseClientApp;