#!/usr/bin/env node

/**
 * 診斷應用程式問題
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 DonnaAI 應用程式診斷');
console.log('========================\n');

// 檢查必要檔案
const requiredFiles = [
  'App.tsx',
  'src/navigation/AppNavigator.tsx',
  'src/stores/authStore.ts',
  'assets/icon.png',
  '.env'
];

console.log('📁 檢查必要檔案:');
requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
});

// 檢查環境變數
console.log('\n🔐 檢查環境變數:');
const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, 'utf8');
  const envVars = [
    'EXPO_PUBLIC_FIREBASE_API_KEY',
    'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
    'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'EXPO_PUBLIC_FIREBASE_APP_ID'
  ];
  
  envVars.forEach(varName => {
    const hasVar = envContent.includes(varName) && !envContent.includes(`${varName}=your_`);
    console.log(`  ${hasVar ? '✅' : '❌'} ${varName}`);
  });
} else {
  console.log('  ❌ .env 檔案不存在');
}

// 檢查 package.json
console.log('\n📦 檢查可能的問題套件:');
const packageJson = require('./package.json');
const problemPackages = [
  '@tanstack/react-table',
  'react-dom',
  'expo-updates'
];

problemPackages.forEach(pkg => {
  const installed = packageJson.dependencies?.[pkg] || packageJson.devDependencies?.[pkg];
  if (installed) {
    console.log(`  ⚠️  ${pkg} (${installed}) - 可能造成問題`);
  } else {
    console.log(`  ✅ ${pkg} - 未安裝`);
  }
});

// 檢查錯誤的 import
console.log('\n🔍 檢查可能的程式碼問題:');
const sourceFiles = [
  'src/components/developer/DeveloperMenu.tsx',
  'App.tsx',
  'src/navigation/AppNavigator.tsx'
];

sourceFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 檢查問題 imports
    if (content.includes('expo-updates')) {
      console.log(`  ⚠️  ${file} - 包含 expo-updates import`);
    }
    if (content.includes('@tanstack/react-table')) {
      console.log(`  ⚠️  ${file} - 包含 @tanstack/react-table import`);
    }
  }
});

console.log('\n💡 建議:');
console.log('1. 如果有 ❌ 的檔案，需要創建或修復');
console.log('2. 如果有 ⚠️  的套件，考慮移除');
console.log('3. 確保 Firebase 環境變數都已設定');
console.log('4. 執行 npm start 重新啟動應用程式');