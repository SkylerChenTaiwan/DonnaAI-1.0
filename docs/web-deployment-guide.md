# DonnaAI Web 部署指南

## 概述
本指南說明如何將 DonnaAI Web 版本部署到 Firebase Hosting 或其他靜態網站託管服務。

## 前置要求

### 1. 安裝 Firebase CLI
```bash
npm install -g firebase-tools
```

### 2. 登入 Firebase
```bash
firebase login
```

### 3. 確認專案設定
```bash
firebase use --add
# 選擇您的 Firebase 專案
```

## 建置流程

### 1. 設定環境變數
確保 `.env.production` 包含正確的生產環境設定：

```env
EXPO_PUBLIC_ENV=production
EXPO_PUBLIC_FIREBASE_API_KEY=your-production-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-production-auth-domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-production-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-production-storage-bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-production-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-production-app-id
```

### 2. 建置 Web 版本
```bash
# 清理舊的建置檔案
npm run web:clean

# 建置生產版本
npm run web:build
```

### 3. 本地測試
```bash
# 在 dist-web 目錄啟動本地伺服器
npm run web:preview

# 或使用 Firebase 模擬器
firebase emulators:start --only hosting
```

## 部署到 Firebase Hosting

### 1. 初始化 Firebase Hosting（首次）
```bash
firebase init hosting
```

選項設定：
- Public directory: `dist-web`
- Configure as single-page app: `Yes`
- Set up automatic builds: `No`
- Overwrite index.html: `No`

### 2. 部署到生產環境
```bash
# 部署到生產環境
firebase deploy --only hosting

# 查看部署狀態
firebase hosting:sites
```

### 3. 預覽部署（可選）
```bash
# 建立預覽頻道
firebase hosting:channel:deploy preview --expires 7d

# 列出所有頻道
firebase hosting:channel:list
```

## 部署到其他平台

### Vercel
1. 安裝 Vercel CLI：
   ```bash
   npm i -g vercel
   ```

2. 部署：
   ```bash
   cd dist-web
   vercel
   ```

3. 設定重寫規則（vercel.json）：
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```

### Netlify
1. 安裝 Netlify CLI：
   ```bash
   npm i -g netlify-cli
   ```

2. 部署：
   ```bash
   netlify deploy --dir=dist-web --prod
   ```

3. 設定重寫規則（_redirects）：
   ```
   /*    /index.html   200
   ```

### GitHub Pages
1. 安裝 gh-pages：
   ```bash
   npm install --save-dev gh-pages
   ```

2. 添加部署腳本到 package.json：
   ```json
   "scripts": {
     "deploy:gh": "npm run web:build && gh-pages -d dist-web"
   }
   ```

3. 部署：
   ```bash
   npm run deploy:gh
   ```

## 部署後設定

### 1. 配置網域
在 Firebase Console 中：
1. 前往 Hosting 頁面
2. 點擊「新增自訂網域」
3. 按照指示設定 DNS 記錄

### 2. SSL 憑證
Firebase Hosting 自動提供 SSL 憑證。其他平台可能需要手動設定。

### 3. 設定 Firebase 授權網域
在 Firebase Console 中：
1. 前往 Authentication > 設定
2. 在「授權網域」中新增您的網域

### 4. 更新 CORS 設定
如果使用 Firebase Storage，更新 CORS 設定：

```json
[
  {
    "origin": ["https://your-domain.com"],
    "method": ["GET", "POST"],
    "maxAgeSeconds": 3600
  }
]
```

## 效能優化

### 1. 啟用 CDN
Firebase Hosting 自動使用全球 CDN。

### 2. 設定快取標頭
已在 `firebase.json` 中配置：
- 靜態資源：1年快取
- HTML：不快取
- 圖片：1天快取

### 3. 啟用 Gzip 壓縮
Firebase Hosting 自動壓縮文字檔案。

## 監控和維護

### 1. 查看使用情況
```bash
firebase hosting:usage
```

### 2. 查看部署歷史
```bash
firebase hosting:releases:list
```

### 3. 回滾到先前版本
```bash
firebase hosting:releases:rollback
```

### 4. 設定監控
- Firebase Performance Monitoring
- Google Analytics
- Sentry 錯誤追蹤

## 安全檢查清單

- [ ] 環境變數未包含敏感資訊
- [ ] API 金鑰已限制使用範圍
- [ ] HTTPS 已啟用
- [ ] CSP 標頭已設定
- [ ] XSS 防護已啟用
- [ ] 點擊劫持防護已啟用

## 故障排除

### 404 錯誤
確保 `firebase.json` 中有正確的重寫規則。

### CORS 錯誤
檢查 Firebase 專案設定中的授權網域。

### 認證失敗
確認生產環境的 Firebase 配置正確。

### 建置失敗
檢查 Node.js 版本和相依套件。

## 自動化部署（CI/CD）

### GitHub Actions
建立 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run web:build
        env:
          EXPO_PUBLIC_ENV: production
          # 其他環境變數
      
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
```

---

更新日期：2025-07-30