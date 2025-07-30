# PRP-54: Web 平台實作與相容性解決方案

## 概述
本 PRP 旨在實作 DonnaAI 的 Web 版本，解決 Expo SDK 53 的 Web 相容性問題，並建立可持續的 Web 開發流程。

## 背景與現況

### 已知問題
1. **Expo SDK 53 Web HMR 問題**
   - Metro bundler 在 Web 平台會無限重載
   - Fast Refresh 在 Web 平台未啟用
   - 社群已確認這是 SDK 53 的已知問題

2. **相容性挑戰**
   - Firebase SDK 需要特殊配置
   - 多個原生模組（expo-av、notifications）需要 Web 替代方案
   - ES Module 解析問題已透過 metro.config.js 部分解決

3. **Expo SDK 54 狀態**
   - 預計 2025 年夏末（8-9月）發布
   - 目前未提及 Web HMR 修復

## 實作策略

### 第一階段：基礎 Web 支援

#### 1.1 環境配置優化
```javascript
// metro.config.js 已有配置
config.resolver.sourceExts.push('cjs');
config.resolver.unstable_enablePackageExports = false;

// 新增 Web 特定配置
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
```

#### 1.2 Platform-specific 程式碼重構
- 使用 Platform.select() 處理平台差異
- 為 Web 建立替代實作
- 確保所有功能在 Web 上有合理的降級方案

### 第二階段：功能適配

#### 2.1 音訊功能 (expo-av 替代)
```typescript
// Web 音訊錄製使用 Web Audio API
interface WebAudioRecorder {
  startRecording(): Promise<void>;
  stopRecording(): Promise<Blob>;
  getRecordingStatus(): RecordingStatus;
}
```

#### 2.2 通知功能 (expo-notifications 替代)
```typescript
// Web 使用瀏覽器 Notification API
interface WebNotificationService {
  requestPermission(): Promise<NotificationPermission>;
  showNotification(title: string, options: NotificationOptions): void;
}
```

#### 2.3 檔案系統 (expo-file-system 替代)
```typescript
// Web 使用 File API 和 IndexedDB
interface WebFileSystem {
  saveFile(data: Blob, filename: string): Promise<void>;
  readFile(filename: string): Promise<Blob>;
  deleteFile(filename: string): Promise<void>;
}
```

### 第三階段：開發流程建立

#### 3.1 開發模式（無 HMR）
```bash
# 開發時使用 --no-dev 避免 HMR 問題
npx expo start --web --no-dev

# 或使用導出後在本地伺服器測試
npx expo export --platform web --output-dir dist-web
cd dist-web && python3 -m http.server 8000
```

#### 3.2 自動化建置腳本
```json
// package.json
{
  "scripts": {
    "web:dev": "expo export --platform web --output-dir dist-web && cd dist-web && npx serve",
    "web:build": "expo export --platform web --output-dir dist-web",
    "web:preview": "cd dist-web && npx serve"
  }
}
```

### 第四階段：生產部署

#### 4.1 建置優化
- 使用 `expo export` 產生靜態檔案
- 配置適當的快取策略
- 實作 Service Worker 支援離線功能

#### 4.2 部署選項
1. **Firebase Hosting**（推薦）
   ```bash
   firebase init hosting
   firebase deploy --only hosting
   ```

2. **Vercel/Netlify**
   - 直接部署 dist-web 目錄
   - 配置重寫規則支援 SPA 路由

## 實作任務清單

### 基礎設置
- [ ] 更新 metro.config.js 加入 Web 優化配置
- [ ] 建立 Web 專用的 polyfills
- [ ] 設置 Web 開發腳本

### 功能適配
- [ ] 實作 WebAudioRecorder 替代 expo-av
- [ ] 實作 WebNotificationService 替代 expo-notifications  
- [ ] 實作 WebFileSystem 替代 expo-file-system
- [ ] 優化 Firebase Web SDK 使用

### UI/UX 調整
- [ ] 調整響應式設計支援桌面瀏覽器
- [ ] 優化觸控/滑鼠互動差異
- [ ] 實作鍵盤快捷鍵

### 測試與品質
- [ ] 建立 Web 平台測試套件
- [ ] 跨瀏覽器相容性測試
- [ ] 效能優化與監控

### 部署準備
- [ ] 配置 Firebase Hosting
- [ ] 設置 CI/CD 自動部署
- [ ] 建立監控與錯誤追蹤

## 技術實作細節

### 1. 平台檢測增強
```typescript
// src/utils/web-detector.ts
export const isWebPlatform = () => Platform.OS === 'web';
export const isMobileWeb = () => {
  if (!isWebPlatform()) return false;
  return /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
};
```

### 2. 條件引入模組
```typescript
// src/services/audio/index.ts
export const AudioService = Platform.select({
  web: () => import('./web/WebAudioService'),
  default: () => import('./native/NativeAudioService'),
})();
```

### 3. Web 特定樣式
```typescript
// src/styles/web.ts
export const webStyles = StyleSheet.create({
  container: {
    ...Platform.select({
      web: {
        maxWidth: 1200,
        marginHorizontal: 'auto',
      },
      default: {},
    }),
  },
});
```

## 驗證檢查點

### 功能驗證
```bash
# 測試音訊錄製
npm run web:dev
# 測試通知功能
# 測試檔案上傳/下載
# 測試 Firebase 功能
```

### 相容性測試
- Chrome 90+
- Safari 14+
- Firefox 88+
- Edge 90+

### 效能基準
- 首次載入時間 < 3秒
- 互動延遲 < 100ms
- Lighthouse 分數 > 90

## 風險與緩解措施

### 風險 1：功能差異
- **風險**：某些原生功能無法在 Web 完整實現
- **緩解**：提供清晰的功能對照表，Web 版明確標示限制

### 風險 2：開發體驗
- **風險**：無 HMR 導致開發效率降低
- **緩解**：使用自動化腳本和快速重建流程

### 風險 3：維護成本
- **風險**：需要維護兩套程式碼
- **緩解**：最大化共用程式碼，最小化平台特定程式碼

## 時程估算
- 基礎設置：1天
- 功能適配：3天
- UI/UX 調整：2天
- 測試與優化：2天
- 部署設置：1天

總計：約 9 個工作天

## 成功標準
1. Web 版本可成功建置並運行
2. 核心功能（登入、資料查看、基本操作）正常運作
3. 響應式設計支援手機和桌面瀏覽器
4. 部署到生產環境並可公開訪問

## 參考資源
- [Expo Web Documentation](https://docs.expo.dev/workflow/web/)
- [Metro Web Configuration](https://metrobundler.dev/docs/configuration/)
- [React Native Web](https://necolas.github.io/react-native-web/)
- [Firebase Web SDK](https://firebase.google.com/docs/web/setup)

## 長期規劃

### Expo SDK 54 升級評估
- 追蹤 SDK 54 的 Web 改進
- 評估升級時機和影響
- 準備升級計畫

### 獨立 Web 應用考慮
- 如果 Expo Web 限制過多，考慮使用 Next.js 建立獨立 Web 版
- 共享業務邏輯但使用不同 UI 層
- 評估成本效益

---
PRP 置信度評分：8/10

評分理由：
- 研究充分，了解所有已知問題
- 提供明確的實作路徑和替代方案
- 考慮了開發流程和部署策略
- 包含風險評估和緩解措施
- 扣分項：Web HMR 問題需要變通方案，可能影響開發體驗