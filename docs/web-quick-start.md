# DonnaAI Web 快速開始指南

## 在 Port 3002 運行 Web 版本

DonnaAI Web 版本已配置為在 port 3002 運行，避免與其他開發工具的 port 衝突。

### 快速開始

1. **建置並啟動 Web 伺服器**
   ```bash
   npm run web:dev
   ```
   或使用專用命令：
   ```bash
   npm run web:3002
   ```

2. **打開瀏覽器**
   訪問 [http://localhost:3002](http://localhost:3002)

### 可用腳本

- `npm run web:dev` - 建置並在 port 3002 啟動開發伺服器
- `npm run web:3002` - 同 web:dev（為了清晰而設的別名）
- `npm run web:build` - 只建置不啟動伺服器
- `npm run web:preview` - 在 port 3002 啟動已建置的檔案（快速預覽）
- `npm run web:clean` - 清理建置檔案

### 開發流程

1. **首次運行或有程式碼變更**
   ```bash
   npm run web:dev
   ```
   這會建置最新的程式碼並啟動伺服器。

2. **快速重啟（無程式碼變更）**
   ```bash
   npm run web:preview
   ```
   直接啟動之前建置的檔案，速度更快。

3. **清理並重建**
   ```bash
   npm run web:clean
   npm run web:dev
   ```

### 注意事項

- Web 版本使用靜態檔案伺服器，沒有熱重載（HMR）功能
- 修改程式碼後需要重新執行 `npm run web:dev` 來看到更新
- 伺服器會持續運行，使用 `Ctrl+C` 停止

### Port 衝突處理

如果 port 3002 被佔用，會看到錯誤訊息。解決方法：

1. 找出佔用 port 的程序：
   ```bash
   lsof -i :3002
   ```

2. 停止該程序或選擇其他 port

---
更新日期：2025-07-30