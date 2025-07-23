const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// 支援 Firebase Web SDK
config.resolver.sourceExts.push('cjs');

// 修復 Firebase Auth 與 Expo SDK 53 的相容性問題
config.resolver.unstable_enablePackageExports = false;

// 禁用 Web 版的 Fast Refresh 以避免無限重載
if (process.env.EXPO_PUBLIC_PLATFORM === 'web') {
  config.server = {
    ...config.server,
    reloadOnStart: false,
    hmr: false,
  };
}

// 確保支援所有圖片格式
config.resolver.assetExts = [...(config.resolver.assetExts || []), 'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'];

module.exports = config;