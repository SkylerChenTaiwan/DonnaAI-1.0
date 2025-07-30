const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// 支援 Firebase Web SDK
config.resolver.sourceExts.push('cjs');

// 修復 Firebase Auth 與 Expo SDK 53 的相容性問題
// React Native 0.79 預設啟用的 package.json exports 功能與 Firebase SDK 不相容
config.resolver.unstable_enablePackageExports = false;

// 確保支援所有圖片格式
config.resolver.assetExts = [...(config.resolver.assetExts || []), 'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'];

// Web 平台優化配置
// 指定模組解析欄位順序，優先使用 react-native，其次是 browser，最後是 main
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// 簡化配置以確保正常啟動
// 快取配置暫時移除，避免配置問題

// 除錯用：列出所有支援的資源副檔名
// 註解掉以避免 Web 版無限重載
// console.log('Metro Config - Asset Extensions:', config.resolver.assetExts);
// console.log('Metro Config - Source Extensions:', config.resolver.sourceExts);

module.exports = config;