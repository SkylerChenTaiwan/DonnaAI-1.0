name: "DonnaAI 基礎架構設置 - Expo + Firebase + 認證系統"
description: |

## 目的
為 DonnaAI 業務 AI 助理平台建立基礎架構，包含 Expo 專案初始化、Firebase 配置，以及樹狀認證系統。

## 核心原則
1. **情境為王**：包含所有必要的文件、範例和注意事項
2. **驗證循環**：提供 AI 可執行並修正的測試/檢查
3. **資訊密集**：使用程式碼庫中的關鍵字和模式
4. **漸進式成功**：從簡單開始，驗證後再強化
5. **全域規則**：確保遵循 CLAUDE.md 中的所有規則

---

## Goal
建立 DonnaAI 的生產就緒基礎架構，使用 Expo + React Native + TypeScript + Firebase，包含：
- 跨平台應用程式（iOS/Android/Web）使用 Expo
- Firebase 後端服務（Auth、Firestore、Storage、Functions）
- 樹狀階層權限系統
- CRM 資料密集型 UI 使用 Tamagui + React Table
- TypeScript 確保型別安全
- Zustand 狀態管理搭配 Firestore 即時同步
- 多檢視模式（表格、看板、日曆、列表）

## Why
- **商業價值**：讓業務團隊專注於溝通/策略而非行政工作
- **使用者影響**：為 200+ 初期使用者減少 70% 的行政負擔
- **整合**：為 AI 會議記錄、分析儀表板、業務工具奠定基礎
- **解決問題**：手動資料輸入、複雜報表、分散的業務工具

## What
一個跨平台業務應用程式，具備：
- 安全認證與角色權限（業務員/主管/管理員）
- 樹狀組織權限結構
- 即時資料同步
- 離線優先架構
- CRM 專業介面（類似 Notion Database、Airtable）
- 支援大量資料的高效能渲染

### Success Criteria
- [ ] Expo 專案在 iOS/Android/Web 上執行
- [ ] Firebase Auth 支援 email/password 登入
- [ ] Firestore 連接並設定 Security Rules
- [ ] 樹狀權限系統正常運作
- [ ] Tamagui UI 框架整合完成
- [ ] 資料表格元件可排序、篩選、編輯
- [ ] TypeScript 嚴格模式無錯誤
- [ ] 基本導航結構就位

## All Needed Context

### Documentation & References
```yaml
# 必讀 - 在您的情境視窗中包含這些
- url: https://docs.expo.dev/get-started/create-a-new-app/
  why: 官方 Expo 設置指南與 TypeScript 模板
  
- url: https://docs.expo.dev/guides/using-firebase/
  why: Firebase 與 Expo 整合 - 對 Web 相容性至關重要
  
- url: https://firebase.google.com/docs/firestore/security/rules-structure
  why: 樹狀權限的 Security Rules
  
- url: https://tamagui.dev/docs/intro/installation
  why: Tamagui 設置和商務 UI 主題
  
- url: https://tanstack.com/table/latest/docs/introduction
  why: React Table 實現 CRM 資料表格功能
  
- url: https://github.com/pmndrs/zustand
  why: 狀態管理設置和 Firebase 整合模式
  
- url: https://reactnavigation.org/docs/getting-started
  why: 多平台應用程式的導航結構

- docfile: ARCHITECTURE.md
  why: 完整的技術架構和資料夾結構

- docfile: INITIAL.md
  why: 功能需求和商業邏輯
```

### Current Codebase Structure
```bash
DonnaAI-1.0/
├── ARCHITECTURE.md      # 技術規格
├── CLAUDE.md           # AI 開發指南  
├── INITIAL.md          # 專案需求
├── TASK.md             # 任務追蹤
├── PRPs/               # 產品需求提示
└── use-cases/          # 範例實作
```

### Desired Codebase Structure
```bash
DonnaAI-1.0/
├── src/
│   ├── components/     # 可重用 UI 元件
│   │   ├── common/     # Layout、LoadingSpinner、ErrorBoundary
│   │   ├── auth/       # LoginForm、RoleSelector
│   │   └── data/       # DataTable、DataView、ViewSwitcher
│   ├── screens/        # 畫面元件
│   │   ├── auth/       # LoginScreen、RegisterScreen
│   │   └── dashboard/  # SalespersonDashboard、ManagerDashboard
│   ├── services/       # 外部服務整合
│   │   ├── firebase/   # config.ts、auth.ts、firestore.ts
│   │   └── api/        # API 抽象層
│   ├── stores/         # Zustand stores
│   │   ├── authStore.ts
│   │   └── appStore.ts
│   ├── types/          # TypeScript 型別定義
│   │   ├── user.ts     # User、Role、Organization 型別
│   │   └── firebase.ts # Firestore 文件型別
│   ├── navigation/     # 導航配置
│   │   └── AppNavigator.tsx
│   ├── theme/          # Notion 風格主題
│   │   └── index.ts
│   └── utils/          # 輔助函數
├── assets/             # 圖片、字型、圖示
├── app.json           # Expo 配置
├── firebase.json      # Firebase 配置
├── .env.example       # 環境變數模板
└── package.json       # 相依套件
```

### Known Gotchas & Library Quirks
```typescript
// 重要：Firebase JS SDK 可與 Expo 搭配但需要特殊設置
// 使用 Firebase JS SDK（非 React Native Firebase）以確保 Expo 相容性
// 範例：import { initializeApp } from 'firebase/app' 而非 @react-native-firebase/app

// 重要：Tamagui 需要特殊的配置步驟
// 必須安裝 @tamagui/config 和設置 tamagui.config.ts
// Web 需要額外的 webpack 配置

// 重要：React Table 在 React Native 需要自建表格元件
// @tanstack/react-table 只提供邏輯，UI 需要自己實作

// 重要：大量資料渲染使用 FlashList 替代 FlatList
// 可提升 10x 效能，特別是長列表

// 重要：Expo Web 需要特定的 metro.config.js 來支援 Firebase
// 參見：https://github.com/expo/expo/issues/17270

// 重要：TypeScript 路徑需要同時配置 tsconfig 和 babel.config.js
// Expo 不支援開箱即用的 tsconfig 路徑

// 重要：Zustand + Firebase 即時同步需要謹慎處理取消訂閱
// 如果監聽器沒有正確清理會造成記憶體洩漏
```

## Implementation Blueprint

### Data Models and Structure

```typescript
// types/user.ts - 核心使用者和組織型別
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'salesperson' | 'manager' | 'admin';
  organizationId: string;
  teamIds: string[]; // 可屬於多個團隊
  managedTeamIds?: string[]; // 管理的團隊
  createdAt: Date;
  lastLoginAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  subscriptionPlan: 'trial' | 'basic' | 'enterprise';
  aiMinutesQuota: number; // 每月 AI 處理分鐘數
  aiMinutesUsed: number;
  createdAt: Date;
}

export interface Team {
  id: string;
  name: string;
  organizationId: string;
  parentTeamId?: string; // 用於樹狀結構
  managerIds: string[];
  memberIds: string[];
}

// types/firebase.ts - Firestore 文件型別
export interface FirestoreDoc {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export interface CustomerDoc extends FirestoreDoc {
  name: string;
  company: string;
  email?: string;
  phone?: string;
  assignedTo: string; // 業務員 ID
  teamId: string;
  notes?: string;
}
```

### List of Tasks to Complete

```yaml
任務 1：初始化 Expo 專案與 TypeScript
建立專案根目錄：
  - 執行：npx create-expo-app@latest DonnaAI --template blank-typescript
  - 驗證：使用 npx expo start 執行應用程式
  - 測試：在網頁瀏覽器、iOS 模擬器、Android 模擬器中開啟

任務 2：安裝核心相依套件
修改 package.json：
  - 新增相依套件：
    - firebase: ^10.7.0
    - tamagui: ^1.79.0
    - @tamagui/config: ^1.79.0
    - @tanstack/react-table: ^8.11.0
    - @shopify/flash-list: ^1.6.0
    - zustand: ^4.4.0
    - react-navigation 套件
    - react-hook-form: ^7.48.0
    - zod: ^3.22.0
    - victory-native: ^36.6.0
    - react-native-draggable-flatlist: ^4.0.0
  - 執行：npm install
  - 執行：npx expo install react-native-svg react-native-safe-area-context react-native-reanimated

任務 3：配置 Firebase 專案
建立 firebase.json：
  - 新增 Firestore 索引
  - 新增 Security rules
建立 .env.example：
  - 新增 Firebase 配置金鑰模板
  - 新增 API 金鑰占位符
建立 src/services/firebase/config.ts：
  - 設置 Firebase 初始化
  - 處理 Web/Native 平台差異

任務 4：設置 Tamagui 與 CRM UI 元件
建立 tamagui.config.ts：
  - 設置 Tamagui 主題配置
  - 定義商務風格的設計令牌
建立 src/components/data/DataTable.tsx：
  - 實作 React Table 的表格元件
  - 支援排序、篩選、行內編輯
建立 src/components/data/ViewSwitcher.tsx：
  - 實作多檢視模式切換
修改 App.tsx：
  - 使用 TamaguiProvider 包裝
  - 配置主題

任務 5：實作認證服務
建立 src/services/firebase/auth.ts：
  - 實作 signIn、signUp、signOut
  - 新增角色型認證
  - 處理認證狀態持久化
建立 src/stores/authStore.ts：
  - 設置 Zustand store 管理認證狀態
  - 整合 Firebase 認證監聽器
  - 新增使用者檔案管理

任務 6：設置樹狀權限
建立 src/services/firebase/permissions.ts：
  - 實作 isManagerOfTeam 函數
  - 新增階層權限檢查
  - 建立權限輔助函數
建立 firestore.rules：
  - 新增 ARCHITECTURE.md 中的 Security Rules
  - 在 Firebase 控制台測試規則

任務 7：建立認證畫面
建立 src/screens/auth/LoginScreen.tsx：
  - 使用 Notion 風格表單設計
  - 整合 authStore
  - 使用 react-hook-form + zod 新增表單驗證
建立 src/screens/auth/RegisterScreen.tsx：
  - 實作組織設置流程
  - 新增角色選擇
  - 處理初始團隊建立

任務 8：設置導航結構
建立 src/navigation/AppNavigator.tsx：
  - 設置已認證/未認證堆疊
  - 新增角色型導航
  - 為 Web 配置深層連結
建立 src/navigation/TabNavigator.tsx：
  - 為主要區塊新增底部標籤
  - 實作角色特定標籤

任務 9：建立儀表板畫面
建立 src/screens/dashboard/SalespersonDashboard.tsx：
  - 新增會議記錄占位符
  - 顯示客戶清單預覽
  - 新增快速操作
建立 src/screens/dashboard/ManagerDashboard.tsx：
  - 新增團隊概覽
  - 顯示分析預覽
  - 新增團隊管理選項

任務 10：設置開發環境
建立 .env.example：
  - 記錄所有必需的環境變數
建立 README.md：
  - 新增設置說明
  - 包含 Firebase 專案設置指南
  - 新增開發工作流程
修改 app.json：
  - 配置應用程式名稱、bundle ID
  - 新增 Firebase 插件配置
  - 設置通知圖示
```

### Task Implementation Details

```typescript
// 任務 3：Firebase 配置
// src/services/firebase/config.ts
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import Constants from 'expo-constants';

const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey || process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain,
  projectId: Constants.expoConfig?.extra?.firebaseProjectId,
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket,
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId,
  appId: Constants.expoConfig?.extra?.firebaseAppId,
};

// 只在尚未初始化時初始化 Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// 在開發環境連接到模擬器
if (__DEV__) {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectFunctionsEmulator(functions, 'localhost', 5001);
}

// 任務 5：使用 Zustand 的認證 Store
// src/stores/authStore.ts
import { create } from 'zustand';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/services/firebase/config';
import { User } from '@/types/user';

interface AuthState {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  
  // 動作
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  initializeAuth: () => () => void; // 返回取消訂閱函數
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  firebaseUser: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
  
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  
  initializeAuth: () => {
    // 訂閱認證狀態變更
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      set({ firebaseUser, isLoading: true });
      
      if (firebaseUser) {
        try {
          // 從 Firestore 取得使用者檔案
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            set({ 
              user: userData, 
              isAuthenticated: true, 
              isLoading: false,
              error: null 
            });
          } else {
            // 已認證但沒有檔案
            set({ 
              user: null, 
              isAuthenticated: false, 
              isLoading: false,
              error: '找不到使用者檔案' 
            });
          }
        } catch (error) {
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false,
            error: error.message 
          });
        }
      } else {
        // 未認證
        set({ 
          user: null, 
          isAuthenticated: false, 
          isLoading: false,
          error: null 
        });
      }
    });
    
    return unsubscribe;
  },
}));
```

### Integration Points
```yaml
FIREBASE：
  - 專案：在控制台建立新的 Firebase 專案
  - 認證：啟用 Email/Password 認證
  - firestore：在生產模式建立資料庫
  - storage：為之後的音訊檔案儲存啟用
  - functions：為 AI 處理初始化
  
EXPO：
  - app.json：配置 Firebase 插件
  - eas.json：為 EAS Build 設置（原生建置）
  - metro.config.js：為 Firebase Web 支援配置
  
導航：
  - 深層連結：為 Web URLs 配置
  - 標籤導航：不同角色的不同標籤
  - 堆疊導航：認證流程 vs 主應用程式
```

## Validation Loop

### Level 1: Syntax & Style
```bash
# TypeScript 編譯檢查
npx tsc --noEmit

# ESLint 檢查（設置後）
npm run lint

# Prettier 格式檢查
npm run format:check

# 預期：無錯誤。如有錯誤，閱讀並修正 TypeScript/ESLint 錯誤
```

### Level 2: Component Testing
```bash
# 先安裝測試相依套件
npm install --save-dev @testing-library/react-native jest-expo jest @types/jest

# 為認證 store 建立測試
# src/stores/__tests__/authStore.test.ts
```

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useAuthStore } from '../authStore';

describe('AuthStore', () => {
  it('應該以預設狀態初始化', () => {
    const { result } = renderHook(() => useAuthStore());
    
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(true);
  });
  
  it('應該設置使用者並更新認證狀態', () => {
    const { result } = renderHook(() => useAuthStore());
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      name: '測試使用者',
      role: 'salesperson' as const,
      organizationId: 'org123',
      teamIds: ['team1'],
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };
    
    act(() => {
      result.current.setUser(mockUser);
    });
    
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });
});
```

### Level 3: Integration Testing
```bash
# 啟動 Expo 開發伺服器
npx expo start

# Web 測試
# 1. 按 'w' 在網頁瀏覽器開啟
# 2. 檢查控制台是否有錯誤
# 3. 驗證登入畫面出現

# iOS 測試（僅限 Mac）
# 1. 按 'i' 開啟 iOS 模擬器
# 2. 驗證應用程式載入無崩潰

# Android 測試  
# 1. 按 'a' 開啟 Android 模擬器
# 2. 驗證應用程式載入無崩潰

# 測試 Firebase 連接
# 1. 檢查瀏覽器控制台的 Firebase 初始化
# 2. 嘗試建立測試帳號
# 3. 驗證 Firestore 建立使用者文件
```

### Level 4: Firebase Security Rules Testing
```javascript
// 在 Firebase 控制台規則測試區測試
// 測試 1：使用者可以讀取自己的檔案
// 模擬： 
//   - 認證：uid = "user123"
//   - 操作：get
//   - 路徑：/users/user123
// 預期：允許

// 測試 2：使用者無法讀取他人檔案  
// 模擬：
//   - 認證：uid = "user123"
//   - 操作：get
//   - 路徑：/users/other456
// 預期：拒絕

// 測試 3：主管可以讀取團隊成員
// 模擬：
//   - 認證：uid = "manager123", token.role = "manager"
//   - 操作：get
//   - 路徑：/users/member456（其中 member456.teamId 在主管的團隊中）
// 預期：允許
```

## Final Validation Checklist
- [ ] Expo 應用程式在 Web 上執行：`npx expo start --web`
- [ ] Expo 應用程式在 iOS 上執行：`npx expo start --ios`
- [ ] Expo 應用程式在 Android 上執行：`npx expo start --android`
- [ ] TypeScript 無錯誤：`npx tsc --noEmit`
- [ ] Firebase Auth 運作：可以建立帳號並登入
- [ ] Firestore 已連接：註冊時建立使用者文件
- [ ] 導航運作：認證流程正確重定向
- [ ] Tamagui 主題已套用：UI 符合商務風格
- [ ] 資料表格功能：可排序、篩選、編輯
- [ ] 多檢視模式：表格/看板/列表切換正常
- [ ] 樹狀權限：主管可以看到團隊成員
- [ ] 環境變數：.env.example 記錄所有變數

---

## Anti-Patterns to Avoid
- ❌ 不要使用 @react-native-firebase 套件（與 Expo Go 不相容）
- ❌ 不要跳過開發環境的 Firebase 模擬器設置
- ❌ 不要硬編碼 Firebase 配置值
- ❌ 不要建立扁平權限結構（必須是階層式）
- ❌ 不要跳過 TypeScript 嚴格模式
- ❌ 不要使用同步儲存來存放認證令牌
- ❌ 不要忘記處理離線狀態
- ❌ 不要跳過 Security Rules 測試

## Common Issues & Solutions

### Issue: Firebase not connecting on Web
```javascript
// 解決方案：新增到 metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push('cjs');
module.exports = config;
```

### Issue: Tamagui setup in Expo
```javascript
// 解決方案：在 babel.config.js 加入
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        '@tamagui/babel-plugin',
        {
          components: ['tamagui'],
          config: './tamagui.config.ts'
        }
      ]
    ]
  };
};
```

### Issue: TypeScript path aliases not working
```json
// 解決方案：安裝 babel-plugin-module-resolver
// babel.config.js
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module-resolver', {
        alias: {
          '@': './src',
          '@components': './src/components',
          '@screens': './src/screens',
          '@services': './src/services',
          '@stores': './src/stores',
          '@types': './src/types',
        }
      }]
    ]
  };
};
```

## Next Steps After Foundation
1. 使用 expo-av 實作會議錄音功能
2. 透過 Cloud Functions 新增 AI 轉錄
3. 使用 Victory Native 建立分析儀表板
4. 建立業務工具市集
5. 新增推播通知
6. 實作離線同步
7. 新增 CSV 匯入功能
8. 設置訂閱計費

---

## Confidence Score: 8.5/10

### Why 8.5?
- ✅ 提供完整的文件連結
- ✅ 清晰的實作藍圖與程式碼範例
- ✅ 多層級的驗證步驟
- ✅ 常見問題已記錄
- ✅ 漸進式實作方法
- ⚠️ Firebase + Expo 設置複雜性扣分
- ⚠️ 樹狀權限可能需要迭代

這個 PRP 提供了一次性成功實作 DonnaAI 基礎架構所需的所有內容，並有適當的驗證關卡確保成功。