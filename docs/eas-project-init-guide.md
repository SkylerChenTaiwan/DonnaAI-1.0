# EAS 專案初始化指南

## 問題說明
當執行 `eas project:info` 時遇到 Firebase 插件錯誤是因為 EAS CLI 嘗試讀取 app.config.js，但 Firebase 插件在非建置環境中無法正確解析。

## 解決方案

### 步驟 1：在終端機執行 EAS 初始化

```bash
# 初始化新的 EAS 專案
eas init

# 當提示 "Project is already linked to a different ID: your-eas-project-id. Do you wish to overwrite it?" 時
# 輸入 Y 確認
```

### 步驟 2：取得專案 ID

初始化完成後，執行：
```bash
eas project:info
```

您會看到類似這樣的輸出：
```
Project ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Project name: donnaai
Owner: skylerchent
```

### 步驟 3：更新配置檔案

複製 Project ID，然後更新以下檔案：

1. **編輯 app.config.js**
   找到第 90 行：
   ```javascript
   eas: {
     projectId: "your-eas-project-id"
   }
   ```
   
   改為：
   ```javascript
   eas: {
     projectId: "您複製的-project-id"
   }
   ```

2. **更新 scripts/update-eas-config.js**
   在檔案開頭的 CONFIG_TO_UPDATE 中填入您的實際 Project ID。

## 常見問題

### Q: 如果已經有 EAS 專案怎麼辦？
A: 如果您之前已經建立過 EAS 專案，可以：
1. 在 https://expo.dev 登入查看您的專案
2. 找到專案 ID
3. 使用 `eas init --id [您的專案ID]` 連結

### Q: Firebase 插件錯誤怎麼處理？
A: 這個錯誤不會影響 EAS 建置。在實際建置時，EAS 會正確處理這些插件。

## 下一步
完成 EAS 專案初始化後，繼續執行 `/docs/ios-production-checklist.md` 中的其他步驟。