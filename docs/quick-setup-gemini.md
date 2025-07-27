# 快速設定 Gemini API Key

## 什麼是 Gemini API Key？

Gemini API Key 是用來存取 Google AI (Gemini) 服務的金鑰，與 Firebase API Key 是不同的服務。

- **Firebase API Key**：用於認證、資料庫、儲存等 Firebase 服務
- **Gemini API Key**：用於 AI 對話、自然語言處理等 AI 功能

## 快速設定步驟

### 1. 取得 Gemini API Key

1. 前往 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 使用 Google 帳號登入
3. 點擊「Create API Key」按鈕
4. 選擇現有的 Google Cloud 專案或建立新專案
5. 複製生成的 API Key

### 2. 設定環境變數

編輯 `.env` 文件（不是 `.env.production`）：

```bash
# 在 .env 文件最後加入這行
EXPO_PUBLIC_GEMINI_API_KEY=你的_Gemini_API_Key
```

### 3. 重新啟動開發伺服器

```bash
# 停止現有的伺服器 (Ctrl+C)
# 然後重新啟動並清除快取
npm start -- --clear
```

## 注意事項

1. **API Key 安全性**：
   - 不要將 API Key 提交到 Git
   - `.env` 文件應該在 `.gitignore` 中

2. **免費額度**：
   - Gemini API 有免費使用額度
   - 適合開發和測試使用

3. **環境分離**：
   - 開發環境使用 `.env`
   - 生產環境使用 `.env.production`
   - 可以使用相同或不同的 API Key

## 驗證設定

設定完成後，重新開啟「AI 業務訓練」工具，應該就能正常使用了。