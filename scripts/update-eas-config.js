#!/usr/bin/env node

/**
 * 更新 EAS 和 App 配置檔案
 * 使用方式: node scripts/update-eas-config.js
 */

const fs = require('fs');
const path = require('path');

// 需要更新的配置
const CONFIG_TO_UPDATE = {
  // EAS 專案 ID - 從 eas project:info 取得
  EAS_PROJECT_ID: 'your-eas-project-id',
  
  // Apple 憑證資訊 - 從 Apple Developer 帳號取得
  APPLE_ID: 'your-apple-id@example.com',
  ASC_APP_ID: 'your-app-store-connect-app-id',
  APPLE_TEAM_ID: 'your-apple-team-id',
  
  // Firebase 配置 - 從 Firebase Console 取得
  FIREBASE_API_KEY: 'your_production_api_key_here',
  FIREBASE_MESSAGING_SENDER_ID: 'your_production_sender_id',
  FIREBASE_APP_ID: 'your_production_app_id'
};

console.log('🔧 EAS 配置更新工具');
console.log('=====================================');
console.log('請先編輯此檔案，填入實際的配置值：');
console.log('- EAS_PROJECT_ID: 從 eas project:info 取得');
console.log('- APPLE_ID: 您的 Apple Developer 帳號');
console.log('- ASC_APP_ID: 從 App Store Connect 取得');
console.log('- APPLE_TEAM_ID: 從 Apple Developer 帳號取得');
console.log('- Firebase 配置: 從 Firebase Console 取得');
console.log('=====================================\n');

// 檢查是否已更新配置
if (CONFIG_TO_UPDATE.EAS_PROJECT_ID === 'your-eas-project-id') {
  console.error('❌ 請先編輯此檔案，填入實際的配置值！');
  console.log('\n編輯檔案: scripts/update-eas-config.js');
  process.exit(1);
}

// 更新 app.config.js
function updateAppConfig() {
  const appConfigPath = path.join(__dirname, '..', 'app.config.js');
  let content = fs.readFileSync(appConfigPath, 'utf8');
  
  // 更新 EAS Project ID
  content = content.replace(
    /projectId:\s*"[^"]*"/,
    `projectId: "${CONFIG_TO_UPDATE.EAS_PROJECT_ID}"`
  );
  
  fs.writeFileSync(appConfigPath, content);
  console.log('✅ 已更新 app.config.js - EAS Project ID');
}

// 更新 eas.json
function updateEasJson() {
  const easJsonPath = path.join(__dirname, '..', 'eas.json');
  const easConfig = JSON.parse(fs.readFileSync(easJsonPath, 'utf8'));
  
  // 更新 submit 配置
  easConfig.submit.production.ios = {
    appleId: CONFIG_TO_UPDATE.APPLE_ID,
    ascAppId: CONFIG_TO_UPDATE.ASC_APP_ID,
    appleTeamId: CONFIG_TO_UPDATE.APPLE_TEAM_ID
  };
  
  fs.writeFileSync(easJsonPath, JSON.stringify(easConfig, null, 2));
  console.log('✅ 已更新 eas.json - Apple 憑證資訊');
}

// 更新 .env.production
function updateEnvProduction() {
  const envPath = path.join(__dirname, '..', '.env.production');
  let content = fs.readFileSync(envPath, 'utf8');
  
  // 更新 Firebase 配置
  content = content.replace(
    /EXPO_PUBLIC_FIREBASE_API_KEY=.*/,
    `EXPO_PUBLIC_FIREBASE_API_KEY=${CONFIG_TO_UPDATE.FIREBASE_API_KEY}`
  );
  content = content.replace(
    /EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=.*/,
    `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${CONFIG_TO_UPDATE.FIREBASE_MESSAGING_SENDER_ID}`
  );
  content = content.replace(
    /EXPO_PUBLIC_FIREBASE_APP_ID=.*/,
    `EXPO_PUBLIC_FIREBASE_APP_ID=${CONFIG_TO_UPDATE.FIREBASE_APP_ID}`
  );
  
  fs.writeFileSync(envPath, content);
  console.log('✅ 已更新 .env.production - Firebase 配置');
}

// 執行更新
try {
  updateAppConfig();
  updateEasJson();
  updateEnvProduction();
  
  console.log('\n🎉 所有配置檔案已更新完成！');
  console.log('\n下一步：');
  console.log('1. 確認 GoogleService-Info.plist 是生產版本');
  console.log('2. 執行測試帳號建立腳本');
  console.log('3. 開始建置 iOS 生產版本');
} catch (error) {
  console.error('❌ 更新過程中發生錯誤:', error.message);
  process.exit(1);
}