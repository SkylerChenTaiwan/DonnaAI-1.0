const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// 支援 Firebase Web SDK
config.resolver.sourceExts.push('cjs');

module.exports = config;