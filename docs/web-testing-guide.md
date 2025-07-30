# DonnaAI Web 平台測試指南

## 概述
本指南說明如何測試 DonnaAI 的 Web 版本，包括開發測試和生產部署測試。

## 開發測試

### 1. 啟動 Web 開發模式

由於 Expo SDK 53 的 HMR 問題，建議使用導出模式：

```bash
# 方式一：建置並啟動本地伺服器（推薦）
npm run web:dev

# 方式二：使用 Expo 開發模式（可能有 HMR 問題）
npm run web

# 方式三：只建置不啟動伺服器
npm run web:build
npm run web:preview
```

### 2. 功能測試檢查清單

#### 基本功能
- [ ] 登入/註冊功能
- [ ] Firebase 認證（電子郵件/密碼）
- [ ] 用戶資料顯示和更新
- [ ] 導航功能（底部導航欄）

#### 資料操作
- [ ] 客戶列表顯示
- [ ] 新增/編輯/刪除客戶
- [ ] 任務管理功能
- [ ] 資料匯出（CSV/JSON）

#### Web 特定功能
- [ ] 音訊錄製（使用 Web Audio API）
- [ ] 通知權限請求和顯示
- [ ] 檔案上傳和下載
- [ ] 響應式設計（桌面/平板/手機）

#### 瀏覽器相容性
- [ ] Chrome 90+
- [ ] Safari 14+
- [ ] Firefox 88+
- [ ] Edge 90+

### 3. 開發者工具檢查

#### Console 檢查
```javascript
// 檢查 Web 平台檢測
console.log('Platform:', Platform.OS); // 應該顯示 'web'

// 檢查功能支援
import { checkWebFeatures } from '@/utils/web-detector';
console.log('Web Features:', checkWebFeatures());

// 檢查 Firebase 初始化
console.log('Firebase Auth:', getFirebaseAuth());
```

#### Network 檢查
- Firebase API 請求正常
- 資源載入無 404 錯誤
- CORS 設定正確

#### Performance 檢查
- 首次載入時間 < 3秒
- 互動回應時間 < 100ms
- Lighthouse 分數 > 90

## 生產測試

### 1. 建置生產版本

```bash
# 建置生產版本
npm run web:build

# 本地測試生產版本
cd dist-web
npx serve -s
```

### 2. 部署前檢查

#### 環境變數
- 確認 `.env.production` 設定正確
- Firebase 配置指向生產環境
- API 端點正確

#### 資源優化
- 圖片已壓縮
- JavaScript 已最小化
- CSS 已優化

#### 安全檢查
- HTTPS 強制啟用
- CSP 標頭設定
- 敏感資訊未暴露

### 3. 部署到 Firebase Hosting

```bash
# 初始化 Firebase Hosting（首次）
firebase init hosting

# 部署
firebase deploy --only hosting

# 預覽部署
firebase hosting:channel:deploy preview
```

## 測試案例

### 音訊錄製測試
```javascript
// 測試麥克風權限
const hasPermission = await requestMicrophonePermission();
console.log('麥克風權限:', hasPermission);

// 測試錄音功能
const { recording } = await createRecording();
// 等待幾秒
await recording.stopAndUnloadAsync();
const uri = await recording.getURI();
console.log('錄音檔案 URI:', uri);
```

### 通知測試
```javascript
// 測試通知權限
const permission = await requestNotificationPermission();
console.log('通知權限:', permission);

// 測試顯示通知
if (permission) {
  await Notifications.presentNotificationAsync({
    title: '測試通知',
    body: '這是一個測試通知',
  });
}
```

### 檔案操作測試
```javascript
// 測試檔案下載
await downloadFile('test.txt', 'Hello World', 'text/plain');

// 測試檔案上傳
const file = await uploadFile();
console.log('上傳的檔案:', file);
```

## 常見問題排查

### 1. Metro Bundler 無限重載
**問題**：Web 版本不斷重新編譯
**解決**：使用 `npm run web:dev` 而非 `npm run web`

### 2. Firebase 認證失敗
**問題**：登入時出現錯誤
**檢查**：
- Firebase 配置是否正確
- 網域是否已加入 Firebase 授權網域

### 3. 音訊錄製無法使用
**問題**：無法取得麥克風權限
**檢查**：
- 是否使用 HTTPS（或 localhost）
- 瀏覽器是否支援 MediaRecorder API

### 4. 通知無法顯示
**問題**：通知權限請求失敗
**檢查**：
- 瀏覽器通知設定
- 是否在安全上下文（HTTPS）

### 5. 響應式設計問題
**問題**：桌面版顯示異常
**檢查**：
- 使用開發者工具的響應式模式測試
- 檢查 `webStyles` 是否正確應用

## 效能優化建議

### 1. 減少初始載入
- 使用動態導入（lazy loading）
- 優化圖片資源
- 啟用 Gzip 壓縮

### 2. 改善互動性能
- 使用 React.memo 優化重新渲染
- 實作虛擬滾動（大列表）
- 優化狀態管理

### 3. PWA 功能
- 實作 Service Worker
- 添加離線支援
- 優化快取策略

## 監控和分析

### 1. 錯誤追蹤
```javascript
// 設定 Sentry（如果使用）
if (Platform.OS === 'web') {
  Sentry.init({
    dsn: 'YOUR_SENTRY_DSN',
    environment: 'web',
  });
}
```

### 2. 使用分析
- Firebase Analytics
- Google Analytics
- 自訂事件追蹤

### 3. 效能監控
- Web Vitals 監測
- Firebase Performance
- 自訂效能指標

## 部署檢查清單

- [ ] 所有測試案例通過
- [ ] 瀏覽器相容性測試完成
- [ ] 響應式設計驗證
- [ ] 效能指標達標
- [ ] 安全檢查通過
- [ ] 錯誤監控設定
- [ ] 備份和回滾計畫
- [ ] 文件更新完成

---

更新日期：2025-07-30