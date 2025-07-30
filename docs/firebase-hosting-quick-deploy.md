# Firebase Hosting 快速部署指南

## 🚀 快速開始

DonnaAI Web 版本已成功部署到 Firebase Hosting！

### 當前部署資訊
- **開發環境 URL**: https://donnaai-5e601.web.app
- **Firebase 專案**: donnaai-5e601
- **最後部署時間**: 2025-07-30

## 📝 部署步驟（3分鐘完成）

### 1. 建置 Web 版本
```bash
npm run web:build
```

### 2. 部署到 Firebase Hosting
```bash
firebase deploy --only hosting
```

### 3. 驗證部署
訪問 https://donnaai-5e601.web.app 確認部署成功

## 🔄 更新部署

當有程式碼更新時：

```bash
# 一鍵建置並部署
npm run web:build && firebase deploy --only hosting
```

## 🏭 切換到生產環境

### 1. 切換 Firebase 專案
```bash
firebase use donnaai-production
```

### 2. 部署到生產環境
```bash
npm run web:build && firebase deploy --only hosting
```

### 3. 生產環境 URL
部署後會顯示生產環境的 URL（通常是 https://donnaai-production.web.app）

## 📊 查看部署狀態

### 查看部署歷史
```bash
firebase hosting:releases:list
```

### 查看當前專案
```bash
firebase use
```

### 查看所有專案
```bash
firebase projects:list
```

## 🛠️ 常用命令

| 命令 | 說明 |
|------|------|
| `npm run web:build` | 建置 Web 版本 |
| `firebase deploy --only hosting` | 部署到 Firebase Hosting |
| `firebase use [project-id]` | 切換 Firebase 專案 |
| `firebase hosting:channel:deploy preview` | 建立預覽頻道 |

## 🚨 注意事項

1. **確保登入 Firebase**
   ```bash
   firebase login
   ```

2. **檢查當前專案**
   部署前務必確認目前使用的是正確的 Firebase 專案

3. **建置完成再部署**
   確保 `dist-web` 目錄有最新的建置檔案

## 🔍 疑難排解

### 部署失敗
- 檢查是否有正確的權限
- 確認 `firebase.json` 配置正確
- 確保 `dist-web` 目錄存在

### 404 錯誤
- 確認 `firebase.json` 中的 rewrites 規則
- 檢查 `index.html` 是否存在

### 權限錯誤
```bash
# 重新登入
firebase logout
firebase login
```

## 📋 快速檢查清單

- [x] Firebase CLI 已安裝
- [x] 已登入 Firebase
- [x] firebase.json 已配置
- [x] 正確的 Firebase 專案已選擇
- [x] Web 版本已建置
- [x] 部署成功

---

更新日期：2025-07-30