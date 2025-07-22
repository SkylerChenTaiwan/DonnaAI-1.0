// 測試 Firebase 初始化問題
console.log('===== Firebase 初始化測試 =====');

// 測試環境變數
console.log('環境變數測試:');
console.log('EXPO_PUBLIC_FIREBASE_API_KEY:', process.env.EXPO_PUBLIC_FIREBASE_API_KEY);
console.log('NODE_ENV:', process.env.NODE_ENV);

// 測試 dotenv
try {
  require('dotenv').config();
  console.log('dotenv 載入成功');
  console.log('載入後 EXPO_PUBLIC_FIREBASE_API_KEY:', process.env.EXPO_PUBLIC_FIREBASE_API_KEY);
} catch (e) {
  console.error('dotenv 載入失敗:', e);
}

// 測試 Firebase 初始化
try {
  const { initializeApp, getApps } = require('firebase/app');
  
  const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyAxEU8MuVZdZqXd6dDpBYL6Iu-TRD3vblI",
    authDomain: "donnaai-5e601.firebaseapp.com",
    projectId: "donnaai-5e601",
    storageBucket: "donnaai-5e601.firebasestorage.app",
    messagingSenderId: "748876929238",
    appId: "1:748876929238:web:fbbe5fd030a68765ea9177"
  };
  
  console.log('\nFirebase 配置:', firebaseConfig);
  
  if (getApps().length === 0) {
    const app = initializeApp(firebaseConfig);
    console.log('Firebase 初始化成功');
  } else {
    console.log('Firebase 已經初始化');
  }
  
} catch (e) {
  console.error('Firebase 初始化失敗:', e.message);
  console.error('錯誤堆疊:', e.stack);
}

console.log('\n===== 測試結束 =====');