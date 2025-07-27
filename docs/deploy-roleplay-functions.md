# 部署 RolePlay Cloud Functions 指南

## 背景說明

我們已經將 AI RolePlay 系統重構為使用 Cloud Functions，這樣可以：
- 保護 Gemini API Key 不暴露在前端
- 統一管理所有 AI 相關的邏輯
- 提供更好的錯誤處理和監控

## 部署步驟

### 1. 設定 Gemini API Key Secret

首先需要在 Firebase 中設定 Gemini API Key：

```bash
# 設定 Secret（會提示輸入 API Key）
firebase functions:secrets:set GEMINI_API_KEY

# 驗證 Secret 已設定
firebase functions:secrets:access GEMINI_API_KEY
```

### 2. 部署 Cloud Functions

```bash
# 部署所有 functions
firebase deploy --only functions

# 或只部署 RolePlay 相關的 functions
firebase deploy --only functions:analyzeCustomerState,functions:generateCustomerResponse,functions:processRolePlayDialogue,functions:getCoachAdvice
```

### 3. 授予 Functions 權限

Cloud Functions 需要權限來存取 Secrets：

```bash
# 列出所有 Secrets 的權限
firebase functions:secrets:get GEMINI_API_KEY

# 如果需要，授予權限給 Functions
firebase functions:secrets:grant GEMINI_API_KEY
```

### 4. 驗證部署

部署完成後，可以在 Firebase Console 中檢查：

1. 前往 [Firebase Console](https://console.firebase.google.com)
2. 選擇您的專案
3. 點擊「Functions」
4. 確認以下函數已部署：
   - `analyzeCustomerState`
   - `generateCustomerResponse`
   - `processRolePlayDialogue`
   - `getCoachAdvice`

### 5. 測試功能

1. 重新啟動應用程式
2. 進入「小工具」>「AI 業務訓練」
3. 選擇任一訓練對象
4. 開始對話測試

## 錯誤排查

### 如果出現「Permission denied」錯誤

```bash
# 確認用戶已登入
# Functions 需要認證才能呼叫
```

### 如果出現「Secret not found」錯誤

```bash
# 重新設定 Secret
firebase functions:secrets:set GEMINI_API_KEY

# 重新部署
firebase deploy --only functions
```

### 查看 Functions 日誌

```bash
# 查看所有 Functions 日誌
firebase functions:log

# 查看特定 Function 的日誌
firebase functions:log --only processRolePlayDialogue
```

## 成本考量

- Cloud Functions 有免費額度（每月 200 萬次呼叫）
- Gemini API 也有免費額度
- 建議設定預算警報避免意外費用

## 安全性說明

1. API Key 現在安全地儲存在 Firebase Secrets Manager
2. 只有經過認證的用戶可以呼叫 Functions
3. 所有 AI 處理都在後端進行，前端無法取得 API Key

## 後續維護

- 定期檢查 Functions 的錯誤日誌
- 監控 API 使用量
- 必要時調整 Functions 的記憶體和逾時設定