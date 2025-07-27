# 錯誤分析報告：Gemini API Key 未設定

**日期**: 2025-01-27  
**錯誤類型**: 配置錯誤  
**嚴重程度**: 高（功能無法使用）

## 錯誤描述

當使用者點擊「AI 業務訓練」工具時，出現以下錯誤：
```
ERROR  狀態分析錯誤: [Error: Gemini API Key 未設定，請在 .env 中設定 EXPO_PUBLIC_GEMINI_API_KEY]
ERROR  對話處理錯誤: [RolePlayError: 狀態分析失敗]
```

## 根本原因分析

1. **環境變數未設定**：
   - `.env` 文件中缺少 `EXPO_PUBLIC_GEMINI_API_KEY` 設定
   - AI RolePlay 系統依賴 Gemini API 進行客戶狀態分析和對話生成

2. **錯誤處理機制**：
   - `src/services/api/gemini-integration.ts` 第 46 行會拋出錯誤
   - 系統返回 mock 客戶端，但仍會拋出錯誤訊息

3. **功能依賴**：
   - AI 業務訓練功能完全依賴 Gemini API
   - 沒有離線備用方案

## 解決方案

### 方案 1：設定 Gemini API Key（推薦）

1. 取得 API Key：
   - 前往 [Google AI Studio](https://makersuite.google.com/app/apikey)
   - 登入 Google 帳號
   - 點擊「Create API Key」
   - 複製生成的 API Key

2. 設定環境變數：
   ```bash
   # 編輯 .env 文件
   EXPO_PUBLIC_GEMINI_API_KEY=你的_API_KEY
   ```

3. 重新啟動開發伺服器：
   ```bash
   npm start -- --clear
   ```

### 方案 2：實作離線模式（備選）

如果暫時無法取得 API Key，可以實作簡單的離線模式：

```typescript
// 在 gemini-integration.ts 中加入離線模式
if (!apiKey) {
  return createOfflineClient(); // 返回預設回應的模擬客戶端
}
```

### 方案 3：使用條件渲染（臨時）

在工具列表中隱藏需要 API Key 的功能：

```typescript
// 在 ToolsScreen.tsx 中
const hasGeminiKey = !!process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const tools = [
  // ... 其他工具
  ...(hasGeminiKey ? [{
    id: '2',
    title: 'AI 業務訓練',
    // ...
  }] : [])
];
```

## 影響範圍

1. **AI 業務訓練**：完全無法使用
2. **自然語言資料查詢**：無法使用（同樣依賴 Gemini API）
3. **其他功能**：不受影響

## 預防措施

1. **環境變數驗證**：
   - 在應用啟動時檢查必要的環境變數
   - 提供清晰的錯誤訊息和設定指引

2. **功能降級**：
   - 實作基本的離線模式
   - 提供模擬資料供開發測試

3. **文件更新**：
   - 在 README.md 中加入環境變數設定說明
   - 在 .env.example 中包含所有必要的變數

## 建議優先級

1. **立即**：取得並設定 Gemini API Key
2. **短期**：改善錯誤訊息，提供設定指引
3. **長期**：實作離線模式或備用方案

## 相關檔案

- `/src/services/api/gemini-integration.ts` - Gemini API 整合
- `/src/screens/tools/WebAppContainer.tsx` - RolePlay 容器
- `/.env.example` - 環境變數範例（已更新）