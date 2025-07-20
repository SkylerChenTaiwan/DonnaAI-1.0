# Firebase 離線錯誤分析報告

## 錯誤概述
發生日期：2025-07-20
錯誤類型：Firebase 連線錯誤

## 錯誤詳情

### 錯誤 1：Firestore 網路連線失敗
```
@firebase/firestore: Firestore (10.14.1): Could not reach Cloud Firestore backend. 
Connection failed 1 times. Most recent error: FirebaseError: [code=unknown]: 
Fetching auth token failed: Firebase: Error (auth/network-request-failed).
```

### 錯誤 2：載入使用者檔案失敗
```
載入使用者檔案時發生錯誤: FirebaseError: Failed to get document because the client is offline.
```

## 根本原因分析

這兩個錯誤都是由於 Firebase 無法連接到後端服務所導致：

1. **網路連線問題**：Firebase Auth 無法取得認證 token (auth/network-request-failed)
2. **離線模式**：由於無法連線，Firestore 進入離線模式，導致無法讀取文件

### 可能的原因：
1. **Firebase 模擬器未啟動**：開發環境配置使用 Firebase 模擬器，但模擬器可能未運行
2. **網路配置錯誤**：iOS 模擬器可能無法訪問本機的 Firebase 模擬器端點
3. **環境變數問題**：Firebase 配置可能不正確

## 解決方案選項

### 方案 1：啟動 Firebase 模擬器（推薦）
**優點**：
- 完全的本地開發環境
- 不需要網路連線
- 資料不會影響生產環境

**步驟**：
1. 安裝 Firebase CLI：`npm install -g firebase-tools`
2. 初始化模擬器：`firebase init emulators`
3. 啟動模擬器：`firebase emulators:start`

### 方案 2：暫時停用 Firebase 模擬器
**優點**：
- 快速解決問題
- 可以立即測試應用

**缺點**：
- 需要連接到真實的 Firebase 服務
- 可能影響生產資料

**步驟**：
修改 `src/config/environment.ts` 中的 `firebaseEmulators.enabled` 為 false

### 方案 3：修復 iOS 模擬器網路配置
**優點**：
- 保持使用模擬器
- 適合長期開發

**步驟**：
1. 確認 iOS 模擬器可以訪問主機網路
2. 使用正確的 IP 地址（10.1.1.142 或實際的本機 IP）

## 影響評估

### 當前影響：
- **嚴重度**：中等
- **功能影響**：
  - 無法登入/註冊
  - 無法載入使用者資料
  - 無法使用任何需要 Firebase 的功能

### 不修復的後果：
- 應用程式將持續在離線模式運行
- 所有需要後端的功能都無法使用
- 開發和測試工作受阻

## 建議行動

1. **立即行動**：啟動 Firebase 模擬器（方案 1）
2. **長期改進**：
   - 建立開發環境設置文檔
   - 添加環境檢查腳本
   - 改進錯誤處理，提供更友好的離線提示

## 相關檔案
- `/src/config/environment.ts` - 環境配置
- `/src/services/firebase/config.ts` - Firebase 初始化
- `/src/stores/authStore.ts` - 認證狀態管理