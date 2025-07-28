# Firebase Authentication Error Analysis Report

**日期**: 2025-07-28  
**錯誤**: `FirebaseError: Firebase: Error (auth/invalid-credential)`  
**症狀**: 之前可以登入的帳號現在無法登入

## 根本原因分析

### 1. 問題識別
- 使用者無法使用原本可登入的帳號進行登入
- 錯誤代碼為 `auth/invalid-credential`
- 此錯誤發生在最近的程式碼變更之後

### 2. 根本原因
在 `roleplayService.ts` 中，我們初始化了第二個 Firebase App 實例（production）來使用生產環境的 Cloud Functions：

```typescript
const productionApp = getApps().find(app => app.name === 'production') || 
                     initializeApp(productionConfig, 'production');
```

這導致了 Firebase Auth 的混淆，因為：
1. 主應用程式使用開發環境配置 (donnaai-5e601)
2. RolePlay 服務創建了第二個應用程式實例使用生產環境配置 (donnaai-production)
3. 當多個 Firebase App 實例存在時，認證可能會使用錯誤的實例

### 3. 影響範圍
- 所有使用 Firebase Authentication 的功能
- 用戶無法登入應用程式
- 可能影響其他 Firebase 服務（Firestore、Storage 等）

## 解決方案

### 方案 1：移除第二個 Firebase App 實例（推薦）
**優點**：
- 徹底解決多實例問題
- 維持單一 Firebase 配置
- 簡單直接

**缺點**：
- RolePlay 功能暫時無法使用（需等待開發環境升級到 Blaze）

**實施步驟**：
1. 移除 `roleplayService.ts` 中的生產環境配置
2. 恢復使用 `getFirebaseFunctions()` 
3. 在開發環境升級到 Blaze 之前，暫時停用 RolePlay 功能

### 方案 2：正確隔離 Firebase App 實例
**優點**：
- RolePlay 功能可以繼續運作
- 不影響其他功能

**缺點**：
- 實現複雜度高
- 可能有其他未預見的問題

**實施步驟**：
1. 確保生產環境 App 只用於 Functions 調用
2. 不要在生產環境 App 上初始化 Auth
3. 明確指定所有 Firebase 服務使用的 App 實例

### 方案 3：使用 Firebase Auth Custom Token
**優點**：
- 允許跨專案認證
- 安全且靈活

**缺點**：
- 需要後端實現
- 實施時間較長

## 建議採用方案

**短期**：採用方案 1，移除第二個 Firebase App 實例，暫時停用 RolePlay 功能直到開發環境升級。

**長期**：升級開發環境到 Blaze 計畫，統一使用相同環境的 Firebase 服務。

## 預防措施

1. **避免多重 Firebase App 實例**：除非絕對必要，應避免在同一應用程式中初始化多個 Firebase App
2. **環境一致性**：確保所有 Firebase 服務使用相同的環境配置
3. **測試覆蓋**：添加整合測試確保認證功能正常運作
4. **文檔記錄**：記錄任何跨環境的特殊配置

## 相關檔案
- `/src/services/roleplay/roleplayService.ts` - 包含問題代碼
- `/src/services/firebase/auth.ts` - 認證服務實現
- `/src/config/environment.ts` - 環境配置