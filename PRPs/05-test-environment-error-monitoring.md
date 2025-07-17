# 05-test-environment-error-monitoring

## Goal
建立完整的測試環境與錯誤監控系統，讓開發者能即時看到錯誤、使用者能輕鬆回報問題，並支援開發與測試階段的協作需求。

## Why
- **開發效率**：快速定位和修復錯誤，減少調試時間
- **協作優化**：讓開發者能即時看到測試者遇到的問題
- **品質保證**：確保每個功能都能正確運作並捕捉異常情況
- **用戶體驗**：在生產環境提供優雅的錯誤處理，避免應用崩潰

## What
建立包含以下功能的測試環境：

### 🔧 環境配置系統
1. **環境變數管理**：開發/測試/生產環境分離
2. **Firebase 配置**：安全的 API keys 管理
3. **開發工具整合**：React Native DevTools 支援

### 🚨 錯誤監控功能
1. **全域錯誤邊界**：捕捉所有組件錯誤
2. **錯誤詳情顯示**：開發模式下的友善錯誤介面
3. **錯誤日誌系統**：本地存儲 + 遠端回報

### 🛠️ 開發者工具
1. **增強開發選單**：搖晃手勢 + 自定義功能
2. **錯誤分享功能**：一鍵複製/分享錯誤報告
3. **狀態檢查工具**：查看應用當前狀態

### Success Criteria
- [ ] 執行 `npm start` 能成功啟動並連接 Firebase
- [ ] 錯誤發生時顯示詳細資訊和堆疊追蹤
- [ ] 搖晃設備能開啟開發者選單
- [ ] 錯誤報告能一鍵複製或分享
- [ ] 開發/生產環境配置正確分離
- [ ] 支援 Expo Go 和開發版本測試

## All Needed Context

### Documentation & References
```yaml
# 環境變數配置
- url: https://docs.expo.dev/guides/environment-variables/
  why: Expo 官方環境變數指南，使用 EXPO_PUBLIC_ 前綴
  critical: 不要在 EXPO_PUBLIC_ 變數中存儲敏感資訊

- url: https://docs.expo.dev/guides/using-firebase/
  why: Firebase 與 Expo 整合的官方指南
  section: 環境配置部分

# 錯誤處理
- url: https://react-native-error-boundary.js.org/
  why: react-native-error-boundary 套件文檔
  critical: 2.0.0 版本，最活躍維護的錯誤邊界解決方案

- url: https://docs.expo.dev/router/error-handling/
  why: Expo Router 內建錯誤處理功能
  pattern: ErrorBoundary 組件導出模式

# 開發工具
- url: https://docs.expo.dev/debugging/tools/
  why: React Native DevTools 使用指南
  critical: 按 j 鍵開啟，取代舊版 Chrome DevTools

# 現有程式碼參考
- file: src/services/firebase/config.ts
  why: 現有 Firebase 配置模式，已支援環境變數
  pattern: Constants.expoConfig?.extra 和 process.env 結合使用

- file: src/screens/auth/LoginScreen.tsx
  why: 現有錯誤處理模式參考
  pattern: try-catch + 錯誤狀態 + Alert 顯示

- file: App.tsx
  why: 應用程式入口，需要包裝錯誤邊界
```

### Current Codebase Tree (關鍵部分)
```bash
src/
├── App.tsx                    # 應用入口（需要包裝錯誤邊界）
├── services/
│   └── firebase/
│       └── config.ts         # Firebase 配置（已支援環境變數）
├── screens/                  # 各種頁面（需要錯誤處理）
└── components/              # 元件庫
```

### Desired Codebase Tree
```bash
src/
├── App.tsx                    # 包裝 ErrorBoundary
├── config/
│   ├── environment.ts         # 新增：環境配置管理
│   └── constants.ts           # 新增：應用常數
├── services/
│   ├── error/
│   │   ├── ErrorBoundary.tsx  # 新增：全域錯誤邊界
│   │   ├── ErrorLogger.ts     # 新增：錯誤日誌服務
│   │   └── ErrorReporter.tsx  # 新增：錯誤報告元件
│   └── firebase/
│       └── config.ts          # 更新：改善環境配置
├── components/
│   └── developer/
│       ├── DeveloperMenu.tsx  # 新增：開發者選單
│       ├── ErrorDisplay.tsx   # 新增：錯誤顯示元件
│       └── StateInspector.tsx # 新增：狀態檢查工具
└── utils/
    └── errorHelpers.ts        # 新增：錯誤處理輔助函數
.env                          # 新增：環境變數檔案
.env.example                  # 新增：環境變數範例
```

### User Requirements
執行此 PRP 時需要使用者提供：

1. **Firebase 配置資訊**
   ```bash
   # 需要提供以下資訊（可從 Firebase Console 取得）
   EXPO_PUBLIC_FIREBASE_API_KEY=
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
   EXPO_PUBLIC_FIREBASE_APP_ID=
   ```

2. **測試步驟**
   - 安裝 Expo Go App（iOS/Android）
   - 執行 `npm start` 後掃描 QR Code
   - 測試各項功能並回報問題

### Known Gotchas & Library Quirks
```typescript
// CRITICAL: React Native Error Boundaries 限制
// 不會捕捉：事件處理器錯誤、非同步錯誤、原生錯誤
// 需要額外的 try-catch 處理這些情況

// CRITICAL: Expo Go 開發模式行為
// 即使有錯誤邊界，紅屏錯誤仍會顯示
// 這是預期行為，生產版本不會出現

// CRITICAL: 環境變數安全性
// EXPO_PUBLIC_ 前綴的變數會暴露在客戶端
// 敏感資訊應使用後端 API 或 Firebase Functions

// CRITICAL: Firebase 模擬器連接
// 開發環境會自動連接本地模擬器
// 如果模擬器未啟動，會顯示警告但不影響運作
```

## Design Specification

### 🎨 錯誤顯示介面設計

#### 開發模式錯誤畫面
```yaml
Layout:
  - 背景: 半透明黑色遮罩
  - 主容器: 白色圓角卡片，佔螢幕 90%
  
Header:
  - 圖標: 紅色警告圖標
  - 標題: "發生錯誤" (24px, 粗體)
  - 時間戳記: 灰色小字

Error Details:
  - 錯誤訊息: 16px 黑色文字
  - 堆疊追蹤: 等寬字體，可捲動區域
  - 檔案位置: 可點擊的藍色連結

Actions:
  - 重試按鈕: 主要藍色按鈕
  - 複製錯誤: 次要按鈕
  - 分享報告: 圖標按鈕
  - 關閉: 右上角 X 按鈕
```

#### 開發者選單設計
```yaml
Trigger:
  - 搖晃手勢（物理設備）
  - 三指長按（備用）
  - 終端機按 m 鍵（模擬器）

Menu Items:
  - 重新載入: 刷新應用
  - 檢查狀態: 查看 Store 狀態
  - 清除快取: 清理本地資料
  - 切換環境: 開發/測試/生產
  - 錯誤日誌: 查看歷史錯誤
  - 效能監控: FPS 和記憶體
  - 網路檢查: API 連接狀態
```

## Implementation Blueprint

### Data Models and Structure
```typescript
// src/types/error.ts
export interface ErrorReport {
  id: string;
  timestamp: Date;
  error: {
    message: string;
    stack?: string;
    componentStack?: string;
  };
  context: {
    userId?: string;
    screen?: string;
    action?: string;
    deviceInfo?: DeviceInfo;
  };
  handled: boolean;
}

export interface DeviceInfo {
  platform: 'ios' | 'android' | 'web';
  version: string;
  model?: string;
  isDevice: boolean;
}

// src/types/environment.ts
export type Environment = 'development' | 'staging' | 'production';

export interface EnvironmentConfig {
  name: Environment;
  apiUrl: string;
  enableDevTools: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}
```

### 按順序完成的任務清單

```yaml
Task 1: 建立環境配置系統
CREATE .env.example:
  - 提供所有必要環境變數的範例
  - 包含清楚的註釋說明

CREATE src/config/environment.ts:
  - IMPLEMENT 環境變數驗證
  - PROVIDE 型別安全的配置存取
  - SUPPORT 多環境切換

UPDATE src/services/firebase/config.ts:
  - INTEGRATE 新的環境配置系統
  - ADD 配置驗證和錯誤提示
  - PRESERVE 現有功能

Task 2: 實作錯誤邊界系統
CREATE src/services/error/ErrorBoundary.tsx:
  - EXTEND React.Component 實作錯誤邊界
  - IMPLEMENT getDerivedStateFromError
  - ADD componentDidCatch 錯誤日誌
  - RENDER 友善的錯誤介面

CREATE src/services/error/ErrorLogger.ts:
  - IMPLEMENT 錯誤日誌收集
  - ADD AsyncStorage 本地存儲
  - PROVIDE 錯誤歷史查詢
  - INTEGRATE Firebase Crashlytics（如可用）

Task 3: 建立錯誤顯示元件
CREATE src/components/developer/ErrorDisplay.tsx:
  - DESIGN 美觀的錯誤顯示介面
  - ADD 錯誤詳情展開/收合
  - IMPLEMENT 複製功能
  - ADD 分享錯誤報告

CREATE src/services/error/ErrorReporter.tsx:
  - IMPLEMENT 錯誤格式化
  - ADD Clipboard 複製支援
  - INTEGRATE Share API
  - FORMAT 錯誤為 Markdown

Task 4: 開發者工具實作
CREATE src/components/developer/DeveloperMenu.tsx:
  - IMPLEMENT 搖晃手勢偵測
  - ADD Modal 選單介面
  - INTEGRATE 各種開發功能
  - SUPPORT 自定義擴展

CREATE src/components/developer/StateInspector.tsx:
  - DISPLAY Zustand store 狀態
  - ADD 搜尋和過濾功能
  - IMPLEMENT JSON 美化顯示
  - SUPPORT 狀態匯出

Task 5: 整合錯誤處理輔助工具
CREATE src/utils/errorHelpers.ts:
  - IMPLEMENT 錯誤分類函數
  - ADD 錯誤訊息本地化
  - PROVIDE 錯誤恢復建議
  - FORMAT 錯誤堆疊美化

Task 6: 更新 App.tsx 整合所有功能
UPDATE App.tsx:
  - WRAP 應用於 ErrorBoundary
  - INITIALIZE 錯誤日誌系統
  - REGISTER 開發者工具
  - SETUP 環境配置

Task 7: 建立測試輔助腳本
CREATE scripts/test-error.js:
  - PROVIDE 錯誤測試案例
  - SIMULATE 各種錯誤情況
  - VERIFY 錯誤捕捉功能
```

### Per Task Pseudocode

```typescript
// Task 1: 環境配置系統
// src/config/environment.ts
class EnvironmentManager {
  private static instance: EnvironmentManager;
  private config: EnvironmentConfig;
  
  constructor() {
    this.validateEnvironment();
    this.config = this.loadConfiguration();
  }
  
  validateEnvironment() {
    const required = [
      'EXPO_PUBLIC_FIREBASE_API_KEY',
      'EXPO_PUBLIC_FIREBASE_PROJECT_ID'
    ];
    
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(`Missing environment variables: ${missing.join(', ')}`);
    }
  }
  
  loadConfiguration(): EnvironmentConfig {
    const env = process.env.EXPO_PUBLIC_ENV || 'development';
    return {
      name: env as Environment,
      apiUrl: this.getApiUrl(env),
      enableDevTools: env !== 'production',
      logLevel: env === 'production' ? 'error' : 'debug'
    };
  }
}

// Task 2: 錯誤邊界實作
// src/services/error/ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  state = {
    hasError: false,
    error: null,
    errorInfo: null,
    errorId: null
  };
  
  static getDerivedStateFromError(error: Error) {
    const errorId = generateErrorId();
    ErrorLogger.logError(error, { errorId });
    
    return {
      hasError: true,
      error,
      errorId
    };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 記錄元件堆疊
    this.setState({ errorInfo });
    
    // 開發模式顯示詳細錯誤
    if (__DEV__) {
      console.error('Error caught by boundary:', error, errorInfo);
    }
  }
  
  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };
  
  render() {
    if (this.state.hasError) {
      return (
        <ErrorDisplay
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorId={this.state.errorId}
          onReset={this.handleReset}
        />
      );
    }
    
    return this.props.children;
  }
}

// Task 4: 開發者選單
// src/components/developer/DeveloperMenu.tsx
function DeveloperMenu() {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    // 搖晃偵測
    const subscription = DeviceMotion.addListener(({ acceleration }) => {
      const threshold = 2.5;
      if (Math.abs(acceleration.x) > threshold || 
          Math.abs(acceleration.y) > threshold || 
          Math.abs(acceleration.z) > threshold) {
        setVisible(true);
      }
    });
    
    return () => subscription.remove();
  }, []);
  
  const menuItems = [
    { 
      title: '重新載入', 
      icon: 'refresh', 
      action: () => Updates.reloadAsync() 
    },
    { 
      title: '檢查狀態', 
      icon: 'information', 
      action: () => navigation.navigate('StateInspector') 
    },
    { 
      title: '錯誤日誌', 
      icon: 'bug', 
      action: () => navigation.navigate('ErrorLogs') 
    },
    // ... 更多選項
  ];
  
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.menu}>
          <Text style={styles.title}>開發者選單</Text>
          {menuItems.map(item => (
            <TouchableOpacity key={item.title} onPress={item.action}>
              <View style={styles.menuItem}>
                <Ionicons name={item.icon} size={24} />
                <Text>{item.title}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
}
```

### Integration Points
```yaml
APP_ENTRY:
  - modify: App.tsx
  - wrap: ErrorBoundary component
  - initialize: ErrorLogger service
  - register: DeveloperMenu (if __DEV__)

FIREBASE:
  - update: src/services/firebase/config.ts
  - integrate: Environment configuration
  - add: Error tracking initialization

NAVIGATION:
  - add: Developer routes (StateInspector, ErrorLogs)
  - protect: Development-only screens

STORES:
  - enhance: All Zustand stores
  - add: Error state tracking
  - integrate: State inspection
```

## Validation Loop

### Level 1: Environment Setup
```bash
# 建立 .env 檔案並填入 Firebase 配置
cp .env.example .env
# 編輯 .env 填入實際的 Firebase keys

# 驗證環境變數載入
npm start
# 預期：看到 "Environment loaded: development" 日誌
```

### Level 2: Error Boundary Testing
```bash
# 執行錯誤測試腳本
node scripts/test-error.js

# 測試案例：
# 1. 組件渲染錯誤 - 應顯示錯誤邊界
# 2. 事件處理錯誤 - 應在 console 顯示
# 3. 非同步錯誤 - 應被 Promise handler 捕捉
# 4. 網路錯誤 - 應顯示友善提示
```

### Level 3: Developer Tools
```bash
# 在實體設備或模擬器測試
npm start

# 測試開發者選單：
# 1. 搖晃設備 - 應彈出選單
# 2. 點擊「檢查狀態」- 應顯示 Store 內容
# 3. 點擊「錯誤日誌」- 應顯示歷史錯誤
# 4. 製造錯誤 - 應能複製和分享錯誤報告
```

### Level 4: Integration Test
```bash
# 完整流程測試
npm start

# 測試清單：
# 1. 登入流程 - 錯誤顯示正確
# 2. 資料載入 - 網路錯誤處理
# 3. 表單提交 - 驗證錯誤顯示
# 4. 錯誤恢復 - 重試功能正常
```

## User Setup Instructions

執行此 PRP 前，請完成以下設定：

### 1. 準備 Firebase 配置
```bash
# 從 Firebase Console 取得配置資訊
# 前往：https://console.firebase.google.com
# 選擇專案 > 專案設定 > 您的應用程式
# 複製配置物件中的值
```

### 2. 建立環境變數檔案
```bash
# 在專案根目錄建立 .env 檔案
# 填入以下內容（替換為您的實際值）：

EXPO_PUBLIC_FIREBASE_API_KEY=你的_API_KEY
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=你的專案.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=你的專案ID
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=你的專案.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=你的_SENDER_ID
EXPO_PUBLIC_FIREBASE_APP_ID=你的_APP_ID

# 可選：開發環境設定
EXPO_PUBLIC_ENV=development
EXPO_PUBLIC_DEBUG=true
```

### 3. 測試準備
```bash
# 安裝 Expo Go（如果還沒安裝）
# iOS: App Store 搜尋 "Expo Go"
# Android: Google Play 搜尋 "Expo Go"

# 確保手機和電腦在同一網路
# 準備好掃描 QR Code
```

## Final Validation Checklist
- [ ] 環境變數正確載入，Firebase 連接成功
- [ ] 錯誤發生時顯示友善的錯誤介面
- [ ] 開發模式顯示詳細錯誤資訊和堆疊
- [ ] 錯誤報告可以複製到剪貼簿
- [ ] 搖晃設備能開啟開發者選單
- [ ] 狀態檢查工具正常顯示 Store 內容
- [ ] 錯誤日誌正確記錄和顯示
- [ ] 生產環境不顯示敏感資訊
- [ ] 所有功能在 Expo Go 中正常運作

---

## Anti-Patterns to Avoid
- ❌ 不要在 EXPO_PUBLIC_ 變數中存放 API secrets
- ❌ 不要在生產環境顯示詳細錯誤堆疊
- ❌ 不要忽略非同步錯誤處理
- ❌ 不要在錯誤訊息中暴露使用者敏感資訊
- ❌ 不要依賴只在開發環境可用的功能
- ❌ 不要忘記測試錯誤恢復流程

## 實作信心評分
**8/10** - 此 PRP 包含完整的錯誤處理和測試環境配置，並提供清楚的使用者設定指引。主要的不確定性在於使用者的 Firebase 配置是否正確，但已提供詳細的設定說明和驗證步驟。