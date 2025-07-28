// 取得應用程式變體（development 或 production）
const APP_VARIANT = process.env.EXPO_PUBLIC_APP_VARIANT || 'development';

console.log('📱 app.config.js 載入中...');
console.log('🎯 應用程式變體:', APP_VARIANT);

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
      bundleIdentifier: "com.skylerchen.donnaai",
      buildNumber: "1.0.0",
      googleServicesFile: `./config/firebase/${APP_VARIANT}/GoogleService-Info.plist`,
      infoPlist: {
        UIBackgroundModes: ["audio"],
        NSMicrophoneUsageDescription: "DonnaAI 需要您的錄音權限來記錄會議音訊，並透過 AI 技術自動轉換為文字筆記。您的錄音將安全儲存且僅在您主動使用錄音功能時才會存取麥克風。",
        NSCameraUsageDescription: "DonnaAI 需要相機權限來拍攝會議相關照片和掃描名片資料。您的照片將安全儲存且僅在您主動使用相機功能時才會存取相機。",
        NSPhotoLibraryUsageDescription: "DonnaAI 需要相簿權限來選取會議相關照片。您的照片將安全處理且不會未經同意分享給第三方。",
        ITSAppUsesNonExemptEncryption: false
      },
      config: {
        usesNonExemptEncryption: false
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.skylerchen.donnaai",
      googleServicesFile: `./config/firebase/${APP_VARIANT}/google-services.json`,
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
      }],
      "@react-native-firebase/app",
      "@react-native-firebase/auth",
      "@react-native-firebase/crashlytics",
      ["expo-build-properties", {
        "ios": {
          "useFrameworks": "static"
        }
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
      appVariant: APP_VARIANT,
      debug: process.env.EXPO_PUBLIC_DEBUG === 'true',
      eas: {
        projectId: "b31bfd36-13ff-4557-918a-bb0009da7828"
      }
    },
    scheme: "donnaai",
    description: "DonnaAI - 您的 AI 業務助理平台，提供會議記錄、客戶管理、智能分析等功能。"
  }
};