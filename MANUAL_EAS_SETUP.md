# 🚨 手動 EAS 設定步驟

## 立即執行以下命令：

### 1. 確認 EAS 初始化
在終端機執行：
```bash
eas init
```

當出現提示時：
- "Would you like to create a project for @skylerchent/donnaai?" → 輸入 **Y**
- 如果詢問是否覆蓋現有 ID → 輸入 **Y**

### 2. 取得專案 ID
```bash
eas project:info
```

複製顯示的 Project ID（格式：xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx）

### 3. 恢復原始配置並更新
```bash
# 恢復原始配置
mv app.config.js app.config.minimal.js
mv app.config.original.js app.config.js

# 編輯 app.config.js
# 找到第 90 行，更新 projectId
```

### 4. 快速更新方法
如果您已經有 Project ID，可以直接執行：
```bash
# 替換下面的 YOUR-PROJECT-ID 為實際的 ID
sed -i '' 's/your-eas-project-id/YOUR-PROJECT-ID/g' app.config.js
```

## 如果仍有問題

### 方案 A：從 Expo 網站取得
1. 訪問 https://expo.dev
2. 登入您的帳號 (skylerchent)
3. 查看您的專案列表
4. 如果有 donnaai 專案，複製其 ID
5. 如果沒有，點擊 "New Project" 建立

### 方案 B：使用 Expo 網站建立的 ID
在 app.config.js 中直接更新：
```javascript
eas: {
  projectId: "從網站複製的ID"
}
```

## ⚠️ 重要提醒
- Firebase 插件錯誤不會影響實際建置
- EAS 建置時會正確處理所有插件
- 只要有正確的 Project ID 就可以繼續

---

完成後，請告訴我您的 Project ID，我會幫您更新所有相關檔案。