import * as dotenv from 'dotenv';
import * as path from 'path';

// 載入生產環境變數
dotenv.config({ path: path.join(__dirname, '..', '.env.production') });

console.log('🔍 檢查 Firebase 配置...\n');

const requiredVars = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID'
];

let allValid = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (!value || value.includes('your_') || value.includes('_here')) {
    console.log(`❌ ${varName}: 尚未設定或仍是預設值`);
    allValid = false;
  } else {
    console.log(`✅ ${varName}: 已設定 (${value.substring(0, 10)}...)`);
  }
});

console.log('\n' + '='.repeat(50));

if (allValid) {
  console.log('✅ 所有 Firebase 配置都已正確設定！');
  
  // 顯示 Firebase 配置物件
  console.log('\n📱 Firebase 配置物件：');
  console.log({
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY?.substring(0, 20) + '...',
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID?.substring(0, 30) + '...'
  });
} else {
  console.log('❌ 請先完成 Firebase 配置設定');
  console.log('\n📝 設定步驟：');
  console.log('1. 前往 https://console.firebase.google.com/project/donnaai-production/settings/general');
  console.log('2. 找到 Web 應用程式配置');
  console.log('3. 複製配置值到 .env.production');
}