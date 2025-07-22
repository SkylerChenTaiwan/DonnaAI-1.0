export default {
  expo: {
    name: "DonnaAI",
    slug: "donnaai",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.donnaai.app",
      buildNumber: "1.0.0",
      infoPlist: {
        UIBackgroundModes: ["audio"],
        NSMicrophoneUsageDescription: "此應用需要錄音權限來記錄會議內容，協助您進行會議記錄和智能分析。",
        NSCameraUsageDescription: "此應用需要相機權限來拍攝會議相關照片。"
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.donnaai.app",
      versionCode: 1,
      permissions: [
        "android.permission.RECORD_AUDIO",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.INTERNET",
        "android.permission.VIBRATE",
        "android.permission.RECEIVE_BOOT_COMPLETED",
        "android.permission.WAKE_LOCK"
      ]
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro"
    },
    plugins: [
      "expo-font",
      "expo-splash-screen",
      "expo-av",
      ["expo-notifications", {
        icon: "./assets/notification-icon.png",
        color: "#2563eb"
      }]
    ],
    extra: {
      // 使用 process.env 來讀取環境變數
      // Expo 會自動處理 EXPO_PUBLIC_ 前綴的環境變數
      firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
      env: process.env.EXPO_PUBLIC_ENV || 'development',
      debug: process.env.EXPO_PUBLIC_DEBUG === 'true'
    },
    scheme: "donnaai",
    description: "DonnaAI - 您的 AI 業務助理平台，提供會議記錄、客戶管理、智能分析等功能。"
  }
};