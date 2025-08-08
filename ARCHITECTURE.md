# 業務管理平台 - 技術架構建議

## 核心技術棧選擇（Firebase 版本）

### 前端框架
```json
{
  "framework": "Expo + React Native",
  "language": "TypeScript",
  "ui_library": "NativeBase",
  "reasoning": "完美支援跨平台，NativeBase 可以輕鬆定制 Notion 風格，TypeScript 確保大型專案的可維護性"
}
```

### Web 平台樣式系統 ⚠️ 重要
```typescript
{
  "style_system": "React Native Web + 內聯樣式",
  "global_css": "NotionDatabaseV4.css (需限制作用域)",
  "best_practice": "Web 平台使用原生 HTML 元素 + 內聯樣式",
  "common_issues": {
    "css_conflicts": "全域 CSS 會覆蓋 React Native Web 樣式",
    "solution": "使用內聯樣式或原生 HTML 元素",
    "docs": "參考 /docs/WEB-STYLE-SYSTEM.md"
  }
}
```

### 狀態管理與資料處理
```typescript
// 推薦的技術組合（Firebase 優化版）
{
  "state_management": "Zustand",                    // 輕量、TypeScript 友好
  "backend": "Firebase (Firestore + Auth + Storage + Functions)",
  "real_time": "Firestore Real-time Listeners",    // 即時數據同步
  "form_handling": "React Hook Form + Zod",        // 性能最佳的表單處理
  "navigation": "React Navigation v6",             // 成熟的導航解決方案
  "charts": "Victory Native",                      // 跨平台圖表庫
  "audio": "Expo AV + Firebase Storage",           // 音頻錄製和儲存
  "offline": "Firebase Offline Persistence",       // 離線支援
  "search": "Firebase + 客戶端過濾 (或整合 Algolia)" // 搜尋功能
}
```

### Firebase 服務配置
```typescript
{
  "authentication": "Firebase Auth",               // 多種登入方式
  "database": "Firestore",                        // NoSQL 文檔資料庫
  "storage": "Firebase Storage",                  // 檔案儲存（音頻檔案）
  "functions": "Cloud Functions",                 // AI 處理的無伺服器函數
  "hosting": "Firebase Hosting",                  // Web 版本託管
  "analytics": "Firebase Analytics",              // 使用者行為分析
  "crashlytics": "Firebase Crashlytics",          // 錯誤監控
  "performance": "Firebase Performance",          // 性能監控
  
  "ai_integration": {
    "primary": "Claude API (via Cloud Functions)", // 透過 Cloud Functions 呼叫
    "speech_to_text": "Google Cloud Speech API",   // Google 的中文語音識別
    "fallback": "OpenAI API"                       // 備用 AI 服務
  }
}
```

## 專案資料夾結構

```
business-ai-platform/
├── .claude/                      # Context Engineering 配置
│   ├── commands/
│   │   ├── generate-prp.md
│   │   └── execute-prp.md
│   └── settings.local.json
├── PRPs/                         # 產品需求提示
│   ├── templates/
│   └── [具體功能的PRP檔案]
├── examples/                     # 程式碼範例
│   ├── ai-integration/
│   ├── responsive-layout/
│   └── supabase-integration/
├── src/
│   ├── components/
│   │   ├── common/              # 通用組件
│   │   │   ├── Layout/
│   │   │   ├── LoadingSpinner/
│   │   │   └── ErrorBoundary/
│   │   ├── business/            # 業務功能組件
│   │   │   ├── MeetingRecorder/
│   │   │   ├── CustomerCard/
│   │   │   └── AIAnalysisPanel/
│   │   ├── analytics/           # 分析功能組件
│   │   │   ├── QueryInterface/
│   │   │   ├── ChartRenderer/
│   │   │   └── ReportExporter/
│   │   └── tools/               # 工具相關組件
│   │       ├── ToolCatalog/
│   │       └── ToolLauncher/
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   ├── dashboard/
│   │   │   ├── SalespersonDashboard.tsx
│   │   │   └── ManagerDashboard.tsx
│   │   ├── meetings/
│   │   │   ├── MeetingListScreen.tsx
│   │   │   ├── MeetingRecordScreen.tsx
│   │   │   └── MeetingAnalysisScreen.tsx
│   │   ├── analytics/
│   │   │   ├── AnalyticsScreen.tsx
│   │   │   └── ReportsScreen.tsx
│   │   └── tools/
│   │       ├── ToolsScreen.tsx
│   │       └── ToolDetailScreen.tsx
│   ├── services/
│   │   ├── firebase/            # Firebase 服務層
│   │   │   ├── auth.ts         # 認證服務
│   │   │   ├── firestore.ts    # Firestore 資料庫操作
│   │   │   ├── storage.ts      # Firebase Storage 檔案處理
│   │   │   ├── functions.ts    # Cloud Functions 調用
│   │   │   └── config.ts       # Firebase 配置
│   │   ├── ai/
│   │   │   ├── claude.ts       # Claude API 整合
│   │   │   ├── speechToText.ts # 語音轉文字
│   │   │   └── dataExtraction.ts # AI 數據提取
│   │   └── audio/
│   │       ├── recorder.ts     # 音頻錄製
│   │       └── player.ts       # 音頻播放
│   ├── stores/
│   │   ├── authStore.ts        # 認證狀態管理
│   │   ├── customersStore.ts   # 客戶數據管理（含 Firestore 實時同步）
│   │   ├── meetingsStore.ts    # 會議數據管理
│   │   ├── analyticsStore.ts   # 分析數據管理
│   │   └── appStore.ts         # 全局應用狀態
│   ├── types/
│   │   ├── firebase.ts         # Firebase 相關類型
│   │   ├── business.ts         # 業務邏輯類型
│   │   ├── user.ts            # 用戶相關類型
│   │   └── analytics.ts       # 分析相關類型
│   ├── utils/
│   │   ├── dateUtils.ts
│   │   ├── audioUtils.ts
│   │   ├── firebaseUtils.ts    # Firebase 工具函數
│   │   └── validationSchemas.ts
│   ├── theme/
│   │   ├── index.ts
│   │   ├── colors.ts
│   │   ├── fonts.ts
│   │   └── components.ts
│   ├── navigation/
│   │   ├── AppNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   └── TabNavigator.tsx
│   └── hooks/
│       ├── useAuth.ts          # Firebase Auth hooks
│       ├── useFirestore.ts     # Firestore 操作 hooks
│       ├── useRealtimeData.ts  # 實時數據 hooks
│       ├── useAudioRecording.ts
│       └── useAIAnalysis.ts
├── assets/
│   ├── icons/
│   ├── images/
│   └── sounds/
├── CLAUDE.md
├── INITIAL.md
├── app.json
├── package.json
└── README.md
```

## Notion 風格 NativeBase 主題配置

```typescript
// theme/index.ts
import { extendTheme } from 'native-base';

const notionTheme = extendTheme({
  colors: {
    // Notion 色彩系統
    primary: {
      50: '#f0f9ff',
      500: '#2563eb',  // Notion 藍
      600: '#1d4ed8',
      700: '#1e40af',
    },
    gray: {
      50: '#f9fafb',   // Notion 淺灰背景
      100: '#f3f4f6',
      200: '#e5e7eb',
      500: '#6b7280',
      700: '#374151',
      900: '#111827',  // Notion 深色文字
    },
    success: {
      500: '#10b981',  // Notion 綠色
    },
    warning: {
      500: '#f59e0b',  // Notion 橙色
    },
  },
  fonts: {
    heading: 'Inter',
    body: 'Inter',
    mono: 'SF Mono',
  },
  fontSizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
  },
  components: {
    Button: {
      baseStyle: {
        borderRadius: 8,
        _text: {
          fontWeight: '500',
        },
      },
      variants: {
        solid: {
          bg: 'primary.500',
          _pressed: { bg: 'primary.600' },
        },
        ghost: {
          bg: 'transparent',
          _pressed: { bg: 'gray.100' },
        },
      },
    },
    Input: {
      baseStyle: {
        borderRadius: 8,
        borderColor: 'gray.200',
        _focus: {
          borderColor: 'primary.500',
          bg: 'white',
        },
      },
    },
    Card: {
      baseStyle: {
        borderRadius: 12,
        shadow: 1,
        bg: 'white',
        borderWidth: 1,
        borderColor: 'gray.100',
      },
    },
  },
});

export default notionTheme;
```

## 核心依賴包清單（Firebase 版本）

```json
{
  "dependencies": {
    // React Native 核心
    "@react-navigation/native": "^6.1.0",
    "@react-navigation/native-stack": "^6.9.0",
    "@react-navigation/bottom-tabs": "^6.5.0",
    
    // UI 庫
    "native-base": "^3.4.0",
    "react-native-svg": "^13.4.0",
    
    // 狀態管理
    "zustand": "^4.4.0",
    
    // 表單處理
    "react-hook-form": "^7.45.0",
    "zod": "^3.21.0",
    "@hookform/resolvers": "^3.1.0",
    
    // 圖表
    "victory-native": "^36.6.0",
    
    // 音頻處理
    "expo-av": "~13.4.0",
    "expo-speech": "~11.3.0",
    "expo-file-system": "~15.4.0",
    
    // 通知
    "expo-notifications": "~0.20.0",
    
    // Firebase 整合
    "firebase": "^10.3.0",
    "@react-native-firebase/app": "^18.3.0",
    "@react-native-firebase/auth": "^18.3.0",
    "@react-native-firebase/firestore": "^18.3.0",
    "@react-native-firebase/storage": "^18.3.0",
    "@react-native-firebase/functions": "^18.3.0",
    "@react-native-firebase/analytics": "^18.3.0",
    
    // Firebase Web (for Expo Web)
    "firebase/compat/app": "^10.3.0",
    "firebase/compat/auth": "^10.3.0",
    "firebase/compat/firestore": "^10.3.0",
    
    // 其他工具
    "react-native-url-polyfill": "^2.0.0",
    "date-fns": "^2.30.0",
    "react-native-uuid": "^2.0.1"
  },
  "devDependencies": {
    "@types/react": "~18.2.0",
    "@types/react-native": "~0.72.0",
    "typescript": "^5.1.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "prettier": "^3.0.0"
  }
}
```

## Firebase 專案設定步驟

### 1. Firebase 控制台設定
```bash
# 安裝 Firebase CLI
npm install -g firebase-tools

# 登入 Firebase
firebase login

# 在 Firebase 控制台創建新專案
# 1. 前往 https://console.firebase.google.com/
# 2. 點擊 "Add project"
# 3. 輸入專案名稱：business-ai-platform
# 4. 啟用 Google Analytics（可選）
# 5. 建立專案

# 初始化 Firebase 專案
firebase init
```

### 2. Firebase 配置檔案
```typescript
// src/services/firebase/config.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "business-ai-platform.firebaseapp.com",
  projectId: "business-ai-platform",
  storageBucket: "business-ai-platform.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 初始化服務
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

export default app;
```

### 3. Expo 配置（Firebase 整合）
```json
// app.json
{
  "expo": {
    "name": "業務AI平台",
    "slug": "business-ai-platform",
    "platforms": ["ios", "android", "web"],
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "web": {
      "bundler": "metro",
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-av",
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#2563eb"
        }
      ],
      "@react-native-firebase/app",
      "@react-native-firebase/auth",
      "@react-native-firebase/firestore"
    ],
    "extra": {
      "eas": {
        "projectId": "your-eas-project-id"
      }
    }
  }
}
```

## 開發環境設定建議

### 4. Cloud Functions 設定（AI 處理）
```typescript
// functions/src/index.ts
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { initializeApp } from 'firebase-admin/app';
import axios from 'axios';

initializeApp();

// 當會議文檔創建時，處理音頻轉文字
export const processAudioTranscription = onDocumentCreated(
  'meetings/{meetingId}',
  async (event) => {
    const meeting = event.data?.data();
    if (!meeting.audioFileUrl) return;

    try {
      // 使用 Google Cloud Speech API 進行語音轉文字
      const transcription = await transcribeAudio(meeting.audioFileUrl);
      
      // 更新會議文檔
      await getFirestore()
        .collection('meetings')
        .doc(event.params.meetingId)
        .update({
          transcription,
          status: 'transcribed',
          updatedAt: new Date()
        });
      
    } catch (error) {
      console.error('Transcription error:', error);
    }
  }
);

// 當轉錄完成時，進行 AI 分析
export const analyzeMeetingContent = onDocumentUpdated(
  'meetings/{meetingId}',
  async (event) => {
    const newData = event.data?.after.data();
    const oldData = event.data?.before.data();
    
    // 只有當轉錄文字新增時才進行分析
    if (!newData.transcription || oldData.transcription) return;

    try {
      // 呼叫 Claude API 進行會議分析
      const analysis = await analyzeWithClaude(newData.transcription);
      
      // 更新會議文檔
      await getFirestore()
        .collection('meetings')
        .doc(event.params.meetingId)
        .update({
          aiAnalysis: analysis,
          status: 'analyzed',
          updatedAt: new Date()
        });
      
      // 如果分析中有客戶資訊，更新客戶文檔
      if (analysis.customerUpdates) {
        await updateCustomerData(newData.customerId, analysis.customerUpdates);
      }
      
    } catch (error) {
      console.error('AI Analysis error:', error);
    }
  }
);

// Claude API 分析函數
async function analyzeWithClaude(transcription: string) {
  const response = await axios.post('https://api.anthropic.com/v1/messages', {
    model: 'claude-3-sonnet-20240229',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `
        請分析以下業務會議記錄，提取重要資訊並以 JSON 格式回傳：
        
        會議記錄：
        ${transcription}
        
        請提取：
        1. 會議摘要
        2. 客戶關鍵需求
        3. 行動項目
        4. 客戶情緒分析
        5. 建議下次會議重點
        
        回傳格式：
        {
          "summary": "會議摘要",
          "customerNeeds": ["需求1", "需求2"],
          "actionItems": ["行動1", "行動2"],
          "sentiment": "positive/neutral/negative",
          "nextMeetingFocus": ["重點1", "重點2"],
          "customerUpdates": {
            "company": "公司名稱",
            "industry": "產業",
            "contactPerson": "聯絡人",
            "budget": "預算範圍"
          }
        }
      `
    }],
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.CLAUDE_API_KEY
    }
  });

  return JSON.parse(response.data.content[0].text);
}
```

### 5. TypeScript 配置
```json
// tsconfig.json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/screens/*": ["src/screens/*"],
      "@/services/*": ["src/services/*"],
      "@/types/*": ["src/types/*"],
      "@/firebase/*": ["src/services/firebase/*"]
    }
  }
}
```

### 6. ESLint 配置
```json
// .eslintrc.js
module.exports = {
  extends: [
    'expo',
    '@typescript-eslint/recommended',
    'prettier'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    'prefer-const': 'error',
    'no-console': 'warn'
  }
};
```

### 7. Firebase Security Rules
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 用戶資料權限
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 客戶資料權限
    match /customers/{customerId} {
      allow read: if request.auth != null && (
        resource.data.salespersonId == request.auth.uid ||
        isManagerOfTeam(request.auth.uid, resource.data.teamId)
      );
      allow create, update: if request.auth != null && 
        request.resource.data.salespersonId == request.auth.uid;
      allow delete: if request.auth != null && 
        resource.data.salespersonId == request.auth.uid;
    }
    
    // 會議資料權限
    match /meetings/{meetingId} {
      allow read: if request.auth != null && (
        resource.data.salespersonId == request.auth.uid ||
        isManagerOfTeam(request.auth.uid, resource.data.teamId)
      );
      allow create, update: if request.auth != null && 
        request.resource.data.salespersonId == request.auth.uid;
    }
    
    // 任務權限
    match /tasks/{taskId} {
      allow read: if request.auth != null && (
        resource.data.assigneeId == request.auth.uid ||
        isManagerOfTeam(request.auth.uid, resource.data.teamId)
      );
      allow create, update: if request.auth != null;
    }
    
    // 行程權限
    match /schedules/{scheduleId} {
      allow read, write: if request.auth != null && (
        resource.data.userId == request.auth.uid ||
        isManagerOfTeam(request.auth.uid, resource.data.teamId)
      );
    }
    
    // 輔助函數：檢查用戶是否為團隊主管
    function isManagerOfTeam(userId, teamId) {
      let userDoc = get(/databases/$(database)/documents/users/$(userId));
      return userDoc.data.role == 'manager' && userDoc.data.teamId == teamId;
    }
  }
}
```

## 下一步建議

### 階段一：基礎設定 (第1週)
1. **建立 Expo + TypeScript 專案**
   ```bash
   npx create-expo-app@latest business-ai-platform --template blank-typescript
   cd business-ai-platform
   ```

2. **設定 Firebase 專案**
   - 在 Firebase Console 建立專案
   - 啟用 Authentication, Firestore, Storage, Functions
   - 下載配置文件並設定

3. **安裝核心依賴包**
   ```bash
   npm install firebase native-base react-native-svg zustand
   npx expo install expo-av expo-notifications
   ```

4. **建立基礎專案結構**
   - 按照上面的資料夾結構組織程式碼
   - 設定 TypeScript 路徑映射
   - 配置 ESLint 和 Prettier

### 階段二：認證與數據層 (第2週)
1. **實作 Firebase 認證**
   - 設定 email/password 登入
   - 實作角色權限系統
   - 建立 useAuth hook

2. **設計 Firestore 資料結構**
   - 建立用戶、客戶、會議等 collection
   - 設定 Security Rules
   - 實作基礎 CRUD 操作

3. **建立 Zustand 狀態管理**
   - 整合 Firebase 實時監聽
   - 實作離線支援
   - 建立錯誤處理機制

### 階段三：核心功能 MVP (第3-4週)
1. **會議錄音功能**
   - 實作音頻錄製和播放
   - 上傳到 Firebase Storage
   - 基礎的會議列表和詳情頁面

2. **AI 分析功能**
   - 設定 Cloud Functions
   - 整合 Claude API 進行會議分析
   - 實作分析結果的實時更新

3. **客戶資料管理**
   - 客戶列表和詳情頁面
   - 關聯數據的導航功能
   - 搜尋和篩選功能

### 階段四：進階功能 (第5-6週)
1. **分析儀表板**
   - 主管端的數據查詢介面
   - 圖表和報表功能
   - 匯出功能

2. **業務工具平台**
   - 工具目錄頁面
   - WebApp 整合功能
   - 工具使用統計

3. **完善 UI/UX**
   - 實作 Notion 風格主題
   - 響應式設計優化
   - 跨平台測試和調整

## 🚀 立即開始

**你現在可以按照以下步驟開始：**

1. **克隆 Context Engineering 模板並重新命名**
2. **將這些 Firebase 版本的配置文件放入專案**
3. **選擇先實作會議錄音功能**
4. **使用以下命令開始開發：**
   ```bash
   /generate-prp INITIAL.md  # 生成第一個功能的 PRP
   /execute-prp PRPs/meeting-recorder.md  # 開始實作
   ```

Firebase 的優勢在於你可以專注在業務邏輯上，而不用擔心後端的複雜設定。社群資源豐富，遇到問題很容易找到解答！

你想先從哪個階段開始？我建議先完成基礎設定，然後立即開始實作第一個核心功能！