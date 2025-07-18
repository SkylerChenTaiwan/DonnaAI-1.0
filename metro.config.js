const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// 支援 Firebase Web SDK
config.resolver.sourceExts.push('cjs');

// 修復 Firebase Auth 與 Expo SDK 53 的相容性問題
// React Native 0.79 預設啟用的 package.json exports 功能與 Firebase SDK 不相容
config.resolver.unstable_enablePackageExports = false;

module.exports = config;