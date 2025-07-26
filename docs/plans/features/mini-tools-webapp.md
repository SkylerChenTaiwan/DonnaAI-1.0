# 小工具 WebApp 架構設計

## 概述
在現有的小工具頁面中嵌入 WebApp，讓每個工具可以有完整的網頁應用功能。

## 架構方案

### 1. 使用 React Native WebView
- 每個工具可以載入本地或遠端的 WebApp
- 支援與原生應用的雙向通訊
- 可以共享認證和資料

### 2. 目錄結構
```
src/
├── screens/tools/
│   ├── ToolsScreen.tsx          # 工具列表頁
│   └── WebAppContainer.tsx      # WebView 容器
├── webapps/                     # WebApp 資源目錄
│   ├── shared/                  # 共用資源
│   │   ├── styles/
│   │   └── utils/
│   └── apps/                    # 各個 WebApp
│       ├── calculator/          # 範例：計算器
│       │   ├── index.html
│       │   ├── app.js
│       │   └── styles.css
│       └── voice-recorder/      # 範例：語音記錄
```

### 3. WebApp 開發模式

#### A. 內嵌模式（建議優先採用）
- WebApp 檔案存放在專案內
- 使用 React Native 的 `require` 載入 HTML
- 優點：離線可用、載入快速、容易部署

#### B. 遠端模式
- WebApp 部署在外部伺服器
- 透過 URL 載入
- 優點：可獨立更新、容易擴展

### 4. 通訊橋接

建立 JavaScript Bridge 讓 WebApp 可以：
- 存取原生功能（相機、定位、儲存等）
- 讀寫 Firebase 資料
- 使用現有的認證狀態
- 呼叫原生 UI 元件

### 5. 第一個 WebApp 建議

**銷售計算器** - 簡單實用，可展示核心功能：
- 佣金計算
- 折扣計算
- 報價產生
- 結果可儲存到資料庫

## 實作步驟

1. 安裝 WebView 套件
2. 建立 WebAppContainer 元件
3. 實作 JavaScript Bridge
4. 開發銷售計算器 WebApp
5. 整合到工具列表

## 技術選擇

- **WebView**: react-native-webview
- **樣式框架**: 使用與主應用一致的設計語言
- **資料通訊**: postMessage API
- **狀態管理**: 可選用 localStorage 或與主應用同步

## 安全考量

- 限制 WebView 的權限
- 驗證所有來自 WebApp 的訊息
- 使用 CSP (Content Security Policy)
- 只允許載入信任的內容