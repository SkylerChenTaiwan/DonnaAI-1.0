# 06-expo-sdk-upgrade-and-dependency-optimization

## Goal
升級 Expo SDK 至最新穩定版本並優化套件依賴，解決版本相容性問題，確保專案使用最新功能和安全更新，同時保持所有現有功能的穩定運作。

## Why
- **版本相容性**：目前 SDK 51 與已安裝套件版本不匹配，導致 Expo Go 無法正常運作
- **長期維護性**：使用最新 SDK 確保持續獲得安全更新和新功能支援
- **開發體驗**：新版 SDK 提供更好的效能、除錯工具和開發體驗
- **技術債務**：避免版本落後造成的累積性技術債務
- **生態系統同步**：與 React Native 生態系統最新發展保持同步

## What
執行 Expo SDK 的全面升級，從 SDK 51 升級至最新穩定版本，並同步優化所有相關依賴套件。

### 🎯 升級目標
1. **Expo SDK 升級**：從 51.0.0 升級至最新穩定版本 **SDK 53** (React Native 0.79, React 19)
2. **依賴優化**：修復所有套件版本不匹配問題
3. **新架構適配**：處理 SDK 53 預設啟用的 New Architecture
4. **Node.js 升級**：確保使用 Node 20+ (Node 18 已於 2025/4/30 EOL)
5. **功能驗證**：確保所有現有功能完整運作
6. **設定更新**：更新相關配置檔案和開發工具
7. **資產修復**：解決缺失的圖片資源問題

### Success Criteria
- [ ] Expo SDK 成功升級至目標版本
- [ ] 所有套件依賴版本相容
- [ ] Expo Go 和開發版本都能正常運作
- [ ] 音訊錄製功能完整正常
- [ ] Firebase 整合無問題
- [ ] 所有測試通過
- [ ] 應用程式效能無退化
- [ ] 錯誤監控系統正常運作

## All Needed Context

### Documentation & References
```yaml
# Expo SDK 升級指南
- url: https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/
  why: 官方 SDK 升級完整指南
  critical: 包含版本特定的 breaking changes

- url: https://expo.dev/changelog
  why: 各版本詳細變更記錄
  section: SDK 51 → 52 → 53 變更摘要

- url: https://docs.expo.dev/versions/latest/
  why: 最新版本 API 文件
  critical: 確認 API 相容性變更

# React Native 升級相關
- url: https://react-native-community.github.io/upgrade-helper/
  why: React Native 版本間差異比較工具
  pattern: 用於識別平台特定變更

# New Architecture 相關
- url: https://reactnative.dev/docs/the-new-architecture/landing-page
  why: 新架構理解和遷移指南
  critical: SDK 53 預設啟用新架構

# Firebase 相容性
- url: https://rnfirebase.io/
  why: React Native Firebase 整合指南
  critical: 可能需要從 Firebase JS SDK 遷移

# 套件相容性檢查
- url: https://reactnative.directory/
  why: React Native 套件相容性資料庫
  pattern: 檢查第三方套件新架構支援
```

### Current Codebase Analysis

#### **高風險檔案 - 需要重點測試**
```typescript
// 音訊相關 - expo-av 依賴
src/components/audio/AudioRecorder.tsx
src/services/offline-recording.ts
src/hooks/useAudioRecording.ts

// Firebase 整合
src/services/firebase/config.ts
src/services/firebase/auth.ts
src/services/firebase/firestore.ts

// 檔案系統操作 - expo-file-system 依賴
src/services/file-management.ts
src/utils/file-helpers.ts

// 通知服務 - expo-notifications 依賴
src/services/notifications.ts
src/hooks/useNotifications.ts

// 裝置功能 - expo-device, expo-network 依賴
src/utils/platform-detector.ts
src/services/sync-manager.ts

// 錯誤監控 - @sentry/react-native 依賴
src/services/error/ErrorLogger.ts
src/components/developer/ErrorDisplay.tsx
```

#### **設定檔案 - 需要更新**
```yaml
主要設定:
  - app.json: Expo 應用程式配置
  - package.json: 依賴管理
  - metro.config.js: 打包設定
  - babel.config.js: Babel 轉譯設定

平台設定:
  - ios/DonnaAI/Info.plist: iOS 特定設定
  - android/app/src/main/AndroidManifest.xml: Android 權限

測試設定:
  - jest.config.js: Jest 測試框架
  - vitest.config.ts: Vitest 測試設定
```

### Current Package Version Analysis
```typescript
// expo-doctor 檢測到的版本不匹配問題
當前問題套件:
{
  "@react-native-picker/picker": "2.11.1" → "2.7.5",
  "@sentry/react-native": "6.17.0" → "~5.24.3", 
  "@shopify/flash-list": "1.6.4" → "1.6.4" (實際已正確),
  "expo-av": "15.1.7" → "~14.0.7",
  "expo-device": "7.1.4" → "~6.0.2",
  "expo-file-system": "18.1.11" → "~17.0.1",
  "expo-network": "7.1.5" → "~6.0.1",
  "expo-notifications": "0.31.4" → "~0.28.19",
  "expo-sensors": "14.1.4" → "~13.0.9",
  "eslint-config-expo": "7.0.0" → "~7.1.2"
}

// 額外發現的問題:
{
  "@expo/config-plugins": "10.1.2" → "~8.0.0",
  "@types/react-native": "應移除" (RN 已包含類型定義),
  "缺失資產檔案": ["./assets/adaptive-icon.png", "./assets/splash.png"],
  "Xcode 相容性": "目前 16.4.0 → 需要 <=16.2.0 或升級 SDK"
}

// 核心版本
當前狀態:
{
  "expo": "~51.0.0",
  "react": "18.2.0",
  "react-native": "0.74.5"
}
```

### Known Gotchas & Critical Issues
```typescript
// CRITICAL: New Architecture 相容性
// SDK 53 預設啟用新架構，部分第三方套件可能不相容
// 需要檢查所有套件的新架構支援狀態

// CRITICAL: Audio Recording API 變更
// expo-av 在新版本可能有 breaking changes
// 特別注意 Audio.usePermissions() 和 Audio.Recording API

// CRITICAL: Firebase 整合變更
// 新版本可能建議遷移至 React Native Firebase
// 需要評估是否保持 Firebase JS SDK 或進行遷移

// WARNING: iOS/Android 版本要求提升
// 新版 SDK 可能要求更高的平台版本
// iOS: 13.4+ → 15.1+, Android: API 23+ → 24+

// WARNING: 打包時間增加
// 新架構可能導致首次打包時間顯著增加
// 需要調整 CI/CD 流水線超時設定

// INFO: 改進項目
// 新版本通常包含效能改進和新功能
// 可能獲得更好的錯誤訊息和除錯體驗
```

## Design Specification

### 🎨 升級策略設計

#### 分階段升級方法
```yaml
階段 1 - 準備與備份:
  - 建立升級專用分支
  - 完整測試當前功能
  - 記錄效能基準

階段 2 - 相容性修復:
  - 修復當前版本不匹配問題
  - 確保 SDK 51 環境穩定
  - 驗證所有功能正常

階段 3 - SDK 升級:
  - 執行 Expo SDK 升級
  - 更新相關設定檔案
  - 處理 breaking changes

階段 4 - 功能驗證:
  - 重點測試高風險功能
  - 完整回歸測試
  - 效能基準比較

階段 5 - 最佳化與部署:
  - 利用新功能優化程式碼
  - 更新文檔和開發指南
  - 準備生產部署
```

#### 風險管控設計
```yaml
高風險功能監控:
  - 音訊錄製: 錄音品質、權限處理、背景模式
  - 檔案系統: 讀寫操作、權限、快取管理
  - Firebase: 認證、資料庫、儲存、函數呼叫
  - 通知: 推送通知、權限、排程

回滾計劃:
  - Git 分支策略: feature/sdk-upgrade
  - 自動化測試閘門
  - 段階性部署驗證
  - 快速回滾機制
```

## Implementation Blueprint

### Data Models and Structure
```typescript
// 升級過程追蹤模型
interface UpgradeProgress {
  phase: 'preparation' | 'compatibility' | 'upgrade' | 'validation' | 'optimization';
  currentTask: string;
  completedTasks: string[];
  failedTasks: { task: string; error: string; timestamp: Date }[];
  testResults: TestResult[];
  performanceMetrics: PerformanceMetric[];
}

interface TestResult {
  category: 'unit' | 'integration' | 'e2e' | 'performance';
  testName: string;
  status: 'pass' | 'fail' | 'skip';
  duration: number;
  details?: string;
}

interface PerformanceMetric {
  metric: 'startup_time' | 'bundle_size' | 'memory_usage' | 'render_time';
  before: number;
  after: number;
  improvement: number;
  unit: string;
}

// 相容性檢查模型
interface PackageCompatibility {
  packageName: string;
  currentVersion: string;
  targetVersion: string;
  compatibility: 'compatible' | 'breaking' | 'deprecated' | 'unknown';
  migrationRequired: boolean;
  notes: string[];
}
```

### 按順序完成的任務清單

```yaml
Phase 1: 準備階段 (估計時間: 1-2 天)
BACKUP 當前狀態:
  - CREATE 專用升級分支 feature/sdk-upgrade
  - COMMIT 所有當前變更
  - TAG 當前穩定版本 v1.0.0-pre-upgrade

DOCUMENT 當前狀態:
  - RECORD 所有套件版本
  - CAPTURE 效能基準測試
  - BACKUP 重要設定檔案

PREPARE 測試環境:
  - RUN 完整測試套件驗證當前狀態
  - TEST 所有核心功能手動驗證
  - SETUP 自動化測試流水線

Phase 2: 相容性修復階段 (估計時間: 1-2 天)
FIX 當前版本不匹配:
  - EXECUTE npx expo install --fix
  - REMOVE @types/react-native (已包含在 RN 中)
  - CREATE missing assets (./assets/adaptive-icon.png, ./assets/splash.png)
  - VERIFY 所有套件版本相容
  - TEST Expo Go 連接正常

VALIDATE 修復結果:
  - RUN 完整測試套件
  - TEST 音訊錄製功能
  - TEST Firebase 整合
  - TEST 錯誤監控系統

CREATE 穩定基準:
  - COMMIT 相容性修復變更
  - TAG 版本 v1.0.0-sdk51-stable
  - DOCUMENT 修復過程和結果

Phase 3: SDK 升級階段 (估計時間: 2-3 天)
RESEARCH 目標版本:
  - CHECK 最新穩定 SDK 版本
  - REVIEW breaking changes 文檔
  - IDENTIFY 需要特別處理的變更

EXECUTE 升級:
  - RUN npx expo upgrade
  - UPDATE 相關設定檔案
  - RESOLVE 任何即時衝突

HANDLE breaking changes:
  - UPDATE deprecated API 使用
  - FIX 設定檔案格式變更
  - ADJUST 權限和原生設定

Phase 4: 功能驗證階段 (估計時間: 3-4 天)
CORE 功能測試:
  - TEST 音訊錄製完整流程
  - TEST 檔案系統操作
  - TEST 網路狀態檢測
  - TEST 通知推送功能

INTEGRATION 測試:
  - TEST Firebase 認證流程
  - TEST Firestore 資料操作
  - TEST 檔案上傳下載
  - TEST Cloud Functions 呼叫

REGRESSION 測試:
  - RUN 所有自動化測試
  - TEST 各平台相容性
  - TEST 效能無退化
  - TEST 錯誤監控正常

Phase 5: 最佳化階段 (估計時間: 1-2 天)
PERFORMANCE 優化:
  - OPTIMIZE 打包配置
  - LEVERAGE 新版本功能
  - IMPROVE 啟動速度

DOCUMENTATION 更新:
  - UPDATE 開發環境設定指南
  - UPDATE 部署流程文檔
  - UPDATE 疑難排解指南

DEPLOYMENT 準備:
  - PREPARE 生產環境設定
  - CREATE 部署檢查清單
  - SETUP 監控告警
```

### Per Task Pseudocode

```typescript
// Phase 1: 準備階段實作
class UpgradePreparation {
  async createUpgradeBranch() {
    // 建立專用分支
    await git.checkout('main');
    await git.pull('origin', 'main');
    await git.checkout('-b', 'feature/sdk-upgrade');
    
    // 記錄當前狀態
    const currentState = {
      packages: await this.getCurrentPackageVersions(),
      sdkVersion: await this.getCurrentSDKVersion(),
      testResults: await this.runTestSuite()
    };
    
    await this.saveStateSnapshot(currentState);
  }
  
  async capturePerformanceBaseline() {
    const metrics = {
      bundleSize: await this.measureBundleSize(),
      startupTime: await this.measureStartupTime(),
      memoryUsage: await this.measureMemoryUsage()
    };
    
    await this.savePerformanceBaseline(metrics);
  }
}

// Phase 2: 相容性修復實作
class CompatibilityFix {
  async fixCurrentVersionMismatches() {
    // 執行 Expo 修復命令
    const result = await exec('npx expo install --fix');
    if (result.exitCode !== 0) {
      throw new Error(`修復失敗: ${result.stderr}`);
    }
    
    // 驗證修復結果
    const verification = await this.verifyPackageCompatibility();
    if (!verification.isCompatible) {
      throw new Error(`相容性驗證失敗: ${verification.issues}`);
    }
    
    return verification;
  }
  
  async validateExpoGoConnection() {
    // 啟動 Expo 開發服務器
    const server = await this.startExpoDevServer();
    
    // 測試連接
    const connection = await this.testExpoGoConnection();
    if (!connection.success) {
      throw new Error(`Expo Go 連接失敗: ${connection.error}`);
    }
    
    return connection;
  }
}

// Phase 3: SDK 升級實作
class SDKUpgrade {
  async upgradeToLatestSDK() {
    // 檢查目標版本
    const latestVersion = await this.getLatestSDKVersion();
    const currentVersion = await this.getCurrentSDKVersion();
    
    console.log(`升級從 ${currentVersion} 到 ${latestVersion}`);
    
    // 執行升級
    const upgradeResult = await exec('npx expo upgrade');
    if (upgradeResult.exitCode !== 0) {
      throw new Error(`SDK 升級失敗: ${upgradeResult.stderr}`);
    }
    
    // 處理 breaking changes
    await this.handleBreakingChanges(currentVersion, latestVersion);
    
    return { from: currentVersion, to: latestVersion };
  }
  
  async handleBreakingChanges(fromVersion: string, toVersion: string) {
    const changes = await this.getBreakingChanges(fromVersion, toVersion);
    
    for (const change of changes) {
      switch (change.type) {
        case 'api_change':
          await this.updateAPIUsage(change);
          break;
        case 'config_change':
          await this.updateConfiguration(change);
          break;
        case 'permission_change':
          await this.updatePermissions(change);
          break;
      }
    }
  }
}

// Phase 4: 功能驗證實作
class FunctionalValidation {
  async validateAudioRecording() {
    // 測試音訊權限
    const permissions = await Audio.requestPermissionsAsync();
    if (permissions.status !== 'granted') {
      throw new Error('音訊權限測試失敗');
    }
    
    // 測試錄音功能
    const recording = new Audio.Recording();
    try {
      await recording.prepareToRecordAsync(AUDIO_CONFIG);
      await recording.startAsync();
      await new Promise(resolve => setTimeout(resolve, 1000));
      await recording.stopAndUnloadAsync();
    } catch (error) {
      throw new Error(`錄音功能測試失敗: ${error.message}`);
    }
    
    return { status: 'success', duration: 1000 };
  }
  
  async validateFirebaseIntegration() {
    const validations = [
      () => this.testAuthentication(),
      () => this.testFirestoreOperations(),
      () => this.testStorageOperations(),
      () => this.testCloudFunctions()
    ];
    
    const results = [];
    for (const validation of validations) {
      try {
        const result = await validation();
        results.push({ status: 'success', ...result });
      } catch (error) {
        results.push({ status: 'failed', error: error.message });
      }
    }
    
    return results;
  }
}

// Phase 5: 最佳化實作
class OptimizationPhase {
  async optimizeForNewSDK() {
    // 利用新版本功能優化
    await this.optimizeBundleConfiguration();
    await this.leverageNewPerformanceFeatures();
    await this.updateDevelopmentTools();
    
    // 效能比較
    const newMetrics = await this.measurePerformance();
    const baseline = await this.getPerformanceBaseline();
    
    return this.comparePerformance(baseline, newMetrics);
  }
  
  async prepareForProduction() {
    // 更新部署設定
    await this.updateDeploymentConfigs();
    
    // 設定監控
    await this.setupMonitoring();
    
    // 準備回滾計劃
    await this.prepareRollbackPlan();
    
    return { ready: true, timestamp: new Date() };
  }
}
```

### Integration Points
```yaml
TESTING_INTEGRATION:
  - enhance: 現有測試套件 (Jest + Vitest)
  - add: SDK 升級專用測試
  - verify: 跨平台相容性測試

FIREBASE_INTEGRATION:
  - maintain: 現有 Firebase JS SDK 整合
  - test: 模擬器連接穩定性
  - verify: 所有 Firebase 服務功能

ERROR_MONITORING:
  - update: Sentry 配置適應新版本
  - enhance: 錯誤監控覆蓋率
  - integrate: 升級過程錯誤追蹤

DEVELOPMENT_TOOLS:
  - update: 開發者選單功能
  - integrate: 新版 SDK 除錯工具
  - enhance: 效能監控功能
```

## Validation Loop

### Level 1: 相容性驗證
```bash
# 確認套件版本相容性和專案健康狀態
npx expo-doctor --verbose

# 檢查並修復版本不匹配
npx expo install --check
npx expo install --fix

# 檢查依賴完整性
npm ls --depth=0

# 確認 Node.js 版本 (需要 20+)
node --version

# 預期：
# - 所有套件版本相容，無警告
# - Node.js 20.x 或更高版本
# - 無缺失的資產檔案錯誤
```

### Level 2: 功能驗證
```bash
# 執行完整測試套件
npm run test
npm run test:jest
npm run test:coverage

# 類型檢查
npm run type-check

# 程式碼風格檢查
npm run lint

# 測試重點功能模組：
# 1. 音訊錄製 - src/tests/components/audio/AudioRecorder.test.tsx
# 2. Firebase 服務 - src/tests/services/firebase/*.test.ts  
# 3. 跨平台音訊 - src/tests/cross-platform/audio-recording.test.ts
# 4. 錯誤處理 - src/utils/errorHelpers.ts 相關功能

# 預期：所有測試通過，無類型錯誤，無 lint 警告
```

### Level 3: 平台相容性驗證
```bash
# iOS 測試
npx expo run:ios

# Android 測試  
npx expo run:android

# Expo Go 測試
npx expo start

# 測試清單：
# 1. 所有平台正常啟動
# 2. 核心功能在各平台運作正常
# 3. 權限處理正確
# 4. 效能表現符合預期
```

### Level 4: 效能驗證
```bash
# 打包大小檢查
npx expo export

# 啟動時間測試
npx expo start --no-dev --minify

# 測試指標：
# 1. 打包大小無顯著增加
# 2. 啟動時間無退化
# 3. 記憶體使用量穩定
# 4. 渲染效能良好
```

## User Setup Instructions

升級前請確保：

### 1. 環境準備
```bash
# 確認開發環境版本
node --version  # 建議 18.x 或更高
npm --version   # 建議 9.x 或更高
expo --version  # 確認 Expo CLI 最新版

# 更新開發工具
npm install -g @expo/cli@latest
```

### 2. 備份重要資料
```bash
# 備份當前分支
git add -A
git commit -m "備份：SDK 升級前的穩定狀態"
git tag v1.0.0-pre-upgrade

# 備份設定檔案
cp app.json app.json.backup
cp package.json package.json.backup
```

### 3. 準備測試環境
```bash
# 安裝測試依賴
npm install --no-save

# 確認測試正常運作
npm run test
```

## Final Validation Checklist
- [ ] Expo SDK 成功升級至目標版本
- [ ] 所有套件版本相容且無警告
- [ ] Expo Go 和開發版本都能正常連接和運作
- [ ] 音訊錄製功能完整測試通過
- [ ] Firebase 所有服務整合正常
- [ ] 檔案系統操作功能正常
- [ ] 通知推送功能測試通過
- [ ] 錯誤監控系統運作正常
- [ ] 自動化測試套件全部通過
- [ ] 效能指標無退化
- [ ] iOS 實機測試通過
- [ ] Android 實機測試通過
- [ ] 文檔和開發指南已更新

---

## Anti-Patterns to Avoid
- ❌ 不要一次跳躍多個主要版本
- ❌ 不要在生產環境直接升級
- ❌ 不要忽略 breaking changes 警告
- ❌ 不要跳過效能基準測試
- ❌ 不要忘記更新相關文檔
- ❌ 不要在升級過程中添加新功能

## Emergency Rollback Plan
```bash
# 快速回滾到升級前狀態
git reset --hard v1.0.0-pre-upgrade
npm install
npx expo start --clear

# 或回滾到相容性修復版本
git reset --hard v1.0.0-sdk51-stable
npm install
```

## 實作信心評分
**9.5/10** - 此 PRP 包含最新的 SDK 53 資訊、完整的升級策略、詳細的風險管控和分階段執行計劃。已透過 expo-doctor 實際檢測確認所有問題點，包含缺失資產、版本衝突、工具鏈相容性等。專案架構穩固，測試覆蓋完整，具備完整的回滾機制，升級成功率極高。唯一不確定性是新架構適配的工作量，但已制定充分的應對策略。