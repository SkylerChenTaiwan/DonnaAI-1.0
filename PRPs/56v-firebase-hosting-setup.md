# PRP-56: Firebase Hosting 設定與部署

## 概述
設定 DonnaAI Web 版本的 Firebase Hosting，實現雲端託管服務，讓用戶可以透過網址直接訪問應用程式。

## 背景
- Web 版本已經可以在本地 port 3002 運行（PRP-55）
- 需要將 Web 版本部署到雲端，方便用戶訪問
- Firebase 已經用於後端服務，Hosting 是自然的選擇

## 目標
1. 設定 Firebase Hosting 服務
2. 部署 Web 版本到 Firebase Hosting
3. 建立簡化的部署流程
4. 提供開發和生產環境的部署方案

## 為什麼需要這個功能
- **雲端訪問**：不需要本地運行即可使用 Web 版本
- **統一平台**：Firebase 提供完整的後端服務和託管
- **自動化部署**：簡化部署流程，提高開發效率
- **全球 CDN**：Firebase Hosting 自動提供全球加速

## 實作需求

### 使用者可見行為
1. 可以透過 https://donnaai-5e601.web.app 訪問開發版本
2. 未來可透過自訂網域訪問生產版本
3. 網站載入速度快，支援 PWA 功能

### 技術需求
1. Firebase Hosting 配置已在 firebase.json 中設定
2. 支援單頁應用程式（SPA）路由
3. 正確的快取策略
4. 安全標頭設定

## 實作藍圖

### 任務清單

#### 任務 1：確認 Firebase 設定 ✅
- Firebase CLI 已安裝並登入
- firebase.json 已正確配置 hosting 設定
- 確認有兩個 Firebase 專案（開發和生產）

#### 任務 2：建置 Web 版本 ✅
```bash
npm run web:build
```
- 產生 dist-web 目錄
- 包含所有必要的靜態檔案

#### 任務 3：部署到 Firebase Hosting ✅
```bash
firebase deploy --only hosting
```
- 成功部署到 donnaai-5e601.web.app
- 驗證網站可正常訪問

#### 任務 4：建立部署腳本 ✅
更新 package.json：
```json
"web:deploy": "npm run web:build && firebase deploy --only hosting",
"web:deploy:prod": "firebase use donnaai-production && npm run web:build && firebase deploy --only hosting"
```

#### 任務 5：建立部署文件 ✅
建立 firebase-hosting-quick-deploy.md 提供：
- 快速部署步驟
- 環境切換方法
- 常見問題解決

### 現有參考

#### Firebase 配置（firebase.json）
```json
{
  "hosting": {
    "public": "dist-web",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      // 快取和安全標頭設定
    ]
  }
}
```

#### Firebase 專案
- 開發環境：donnaai-5e601
- 生產環境：donnaai-production

## 驗證步驟

### 1. 部署驗證 ✅
```bash
curl -I https://donnaai-5e601.web.app
# 應返回 HTTP 200
```

### 2. 功能測試
- 訪問網站確認可正常載入
- 測試路由功能（SPA）
- 驗證 Firebase 服務連接

### 3. 效能檢查
- 使用 Chrome DevTools 檢查載入時間
- 確認靜態資源有正確快取

## 實作結果

### 完成項目
1. ✅ Firebase Hosting 成功設定
2. ✅ Web 版本已部署到 https://donnaai-5e601.web.app
3. ✅ 建立快速部署腳本（npm run web:deploy）
4. ✅ 建立部署文件

### 部署資訊
- **開發環境 URL**: https://donnaai-5e601.web.app
- **部署時間**: 2025-07-30
- **Firebase 專案**: donnaai-5e601

## 成功標準
- [x] Web 版本成功部署到 Firebase Hosting
- [x] 可透過公開 URL 訪問
- [x] 建立簡化的部署流程
- [x] 文件完整記錄部署步驟

## 下一步建議

### 生產環境部署
1. 切換到 donnaai-production 專案
2. 設定生產環境變數
3. 部署到生產環境 Hosting

### 自訂網域
1. 購買網域（如 app.donnaai.com）
2. 在 Firebase Console 設定自訂網域
3. 配置 DNS 記錄

### CI/CD 整合
1. 設定 GitHub Actions 自動部署
2. 配置環境分支策略
3. 自動化測試和部署流程

## 風險評估
- **低風險**：Firebase Hosting 是成熟的服務
- **注意事項**：確保不在前端暴露敏感資訊

---
**實作複雜度**：簡單
**實際完成時間**：15 分鐘
**狀態**：已完成 ✅