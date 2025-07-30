# PRP-55: Web 伺服器 Port 3002 設定

## 概述
設置 DonnaAI Web 版本在 port 3002 運行，提供便捷的開發和測試環境。

## 背景
- 當前 Web 開發腳本使用預設 port（serve 預設 3000）
- 用戶需要在特定的 port 3002 運行
- 現有 Web 平台支援已完整實作（PRP-54）

## 目標
建立簡單直接的方式讓 Web 版本在 port 3002 運行，支援開發和生產模式。

## 為什麼需要這個功能
- **開發便利性**：固定的 port 方便開發和測試
- **避免衝突**：port 3002 避免與其他常見開發工具衝突
- **一致性**：團隊成員都使用相同的 port 設定

## 實作需求

### 使用者可見行為
1. 執行 `npm run web:3002` 即可在 port 3002 啟動 Web 伺服器
2. 瀏覽器訪問 `http://localhost:3002` 可看到應用程式
3. 支援開發模式（自動建置）和生產模式（預建置）

### 技術需求
1. 修改 package.json 添加新的腳本
2. 保留現有腳本的相容性
3. 支援快速重啟和調試

## 實作藍圖

### 任務清單

#### 任務 1：更新 package.json 腳本
修改 package.json 添加 port 3002 專用腳本：

```json
// 在 scripts 區段添加：
"web:3002": "npm run web:build && cd dist-web && npx serve -l 3002",
"web:3002:dev": "concurrently \"npm run web:build -- --watch\" \"wait-on dist-web/index.html && cd dist-web && npx serve -l 3002\"",
"web:dev": "expo export --platform web --output-dir dist-web && cd dist-web && npx serve -l 3002"
```

#### 任務 2：安裝必要的開發依賴（如果需要）
如果要支援自動重建，需要安裝：
```bash
npm install --save-dev concurrently wait-on
```

#### 任務 3：建立開發指南
更新或建立簡單的開發指南說明如何使用。

### 現有參考

#### 當前 Web 腳本（package.json）
```json
"web": "expo start --web",
"web:dev": "expo export --platform web --output-dir dist-web && cd dist-web && npx serve",
"web:build": "expo export --platform web --output-dir dist-web",
"web:preview": "cd dist-web && npx serve",
```

#### serve 命令選項
- `-l <port>` 或 `-p <port>`：指定 port
- `-o`：自動開啟瀏覽器
- `-C`：啟用 CORS
- `-s`：單頁應用程式模式

### 實作細節

#### 選項 1：簡單方案（推薦）
直接修改現有的 `web:dev` 腳本加上 port 參數：
```json
"web:dev": "expo export --platform web --output-dir dist-web && cd dist-web && npx serve -l 3002"
```

#### 選項 2：添加專用腳本
保留原有腳本，新增專門的 3002 腳本：
```json
"web:3002": "expo export --platform web --output-dir dist-web && cd dist-web && npx serve -l 3002",
"web:3002:quick": "cd dist-web && npx serve -l 3002"
```

#### 選項 3：使用環境變數
創建更靈活的方案：
```json
"web:serve": "cd dist-web && npx serve -l ${PORT:-3002}"
```

## 驗證步驟

### 1. 建置和啟動測試
```bash
# 執行新腳本
npm run web:3002

# 檢查輸出應該顯示
# Serving at http://localhost:3002
```

### 2. 瀏覽器測試
```bash
# 在瀏覽器訪問
open http://localhost:3002

# 應該看到 DonnaAI 應用程式正常運行
```

### 3. Port 佔用測試
```bash
# 檢查 port 是否被佔用
lsof -i :3002

# 如果被佔用，應該顯示錯誤訊息
```

## 實作順序

1. **更新 package.json**
   - 修改 `web:dev` 腳本添加 `-l 3002`
   - 可選：添加 `web:3002` 別名

2. **測試驗證**
   - 執行 `npm run web:dev`
   - 確認在 port 3002 正常運行

3. **文件更新**（可選）
   - 更新 README.md 或開發文件
   - 說明新的 port 設定

## 成功標準
- [ ] 執行腳本後 Web 伺服器在 port 3002 啟動
- [ ] 瀏覽器可以訪問 http://localhost:3002
- [ ] 應用程式功能正常運作
- [ ] 終端顯示正確的 port 資訊

## 已知限制和解決方案

### Expo Web 開發模式
- Expo 的 `expo start --web` 預設使用 port 19006，難以更改
- 解決方案：使用靜態伺服器（serve）提供已建置的檔案

### 自動重建
- 當前方案需要手動重新執行建置
- 未來可考慮添加檔案監視功能

## 參考資源
- [serve NPM 文檔](https://www.npmjs.com/package/serve)
- [Expo Web 文檔](https://docs.expo.dev/workflow/web/)
- 現有 Web 實作：PRPs/54v-web-platform-implementation.md

## 風險評估
- **低風險**：只是修改啟動腳本，不影響應用程式邏輯
- **無破壞性**：保留現有腳本，向後相容

---
**實作複雜度**：簡單
**預估時間**：5-10 分鐘
**置信度評分**：10/10

這是一個簡單直接的配置變更，主要是添加 port 參數到現有命令。