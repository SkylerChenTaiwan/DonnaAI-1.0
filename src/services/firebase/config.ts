/**
 * Firebase 配置和初始化
 */

import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getAuth, connectAuthEmulator, getReactNativePersistence } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { environmentManager, getFirebaseConfig } from '../../config/environment';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 從環境管理器取得 Firebase 配置
const firebaseConfig = getFirebaseConfig();

// 驗證配置
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('Firebase 配置不完整，請檢查環境變數設定');
  throw new Error('Firebase 配置錯誤');
}

// 只在尚未初始化時初始化 Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// 使用 initializeAuth 並設定 React Native 的持久化
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (error) {
  // 如果已經初始化過，使用 getAuth
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// 在開發環境連接到模擬器
const env = environmentManager.getConfig();
if (env.firebaseEmulators.enabled && !auth.config?.apiKey?.includes('demo-project')) {
  // 只在非 demo 專案時連接模擬器（避免重複連接錯誤）
  try {
    connectAuthEmulator(auth, env.firebaseEmulators.authUrl, { disableWarnings: true });
    connectFirestoreEmulator(db, env.firebaseEmulators.firestoreHost, env.firebaseEmulators.firestorePort);
    connectFunctionsEmulator(functions, env.firebaseEmulators.functionsHost, env.firebaseEmulators.functionsPort);
    
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

export default app;