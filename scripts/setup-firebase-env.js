#!/usr/bin/env node

/**
 * Firebase 環境配置管理腳本
 * 用於在建置時自動切換 Firebase 配置檔案
 */

const fs = require('fs');
const path = require('path');

// 取得環境變數
const APP_VARIANT = process.env.EXPO_PUBLIC_APP_VARIANT || 'development';

console.log(`🔧 設定 Firebase 環境: ${APP_VARIANT}`);

// 定義來源和目標路徑
const configPaths = {
  android: {
    source: `config/firebase/${APP_VARIANT}/google-services.json`,
    target: 'google-services.json'
  },
  ios: {
    source: `config/firebase/${APP_VARIANT}/GoogleService-Info.plist`,
    target: 'GoogleService-Info.plist'
  }
};

// 複製配置檔案
function copyConfigFile(platform) {
  const { source, target } = configPaths[platform];
  const sourcePath = path.join(__dirname, '..', source);
  const targetPath = path.join(__dirname, '..', target);
  
  if (!fs.existsSync(sourcePath)) {
    console.error(`❌ 找不到 ${platform} 配置檔案: ${sourcePath}`);
    console.log(`請確保已將 Firebase 配置檔案放在正確位置`);
    return false;
  }
  
  try {
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`✅ 已複製 ${platform} 配置: ${source} → ${target}`);
    return true;
  } catch (error) {
    console.error(`❌ 複製 ${platform} 配置失敗:`, error);
    return false;
  }
}

// 執行複製
let success = true;
success = copyConfigFile('android') && success;
success = copyConfigFile('ios') && success;

if (!success) {
  console.error('\n❌ Firebase 環境設定失敗');
  process.exit(1);
} else {
  console.log('\n✅ Firebase 環境設定完成');
}