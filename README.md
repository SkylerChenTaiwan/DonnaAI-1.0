# DonnaAI - AI 業務助理平台

DonnaAI 是一個專為業務團隊設計的智能 AI 助理平台，提供會議記錄、客戶管理、智能分析等功能。

## 🚀 功能特色

### 核心功能
- **AI 會議記錄** - 自動錄音轉文字，擷取重點並同步 CRM
- **智能報表查詢** - 主管用自然語言即時查詢業務數據
- **業務工具平台** - 產業特定工具的 WebApp 集合
- **客戶資料導入** - 支援從現有 CRM 系統或 CSV 檔案批量導入

### 技術特色
- **跨平台支援** - iOS、Android、Web 一站式解決方案
- **樹狀權限系統** - 支援複雜的組織架構和權限管理
- **即時資料同步** - Firebase 實時資料庫確保資料一致性
- **類 Notion 介面** - 直觀的資料管理介面

## 🛠 技術架構

### 前端技術
- **Expo** - 跨平台應用程式開發框架
- **React Native** - 原生行動應用程式開發
- **TypeScript** - 型別安全的 JavaScript
- **Zustand** - 輕量級狀態管理
- **React Navigation** - 導航管理

### 後端服務
- **Firebase Auth** - 使用者認證和授權
- **Firestore** - 即時 NoSQL 資料庫
- **Firebase Storage** - 檔案存儲（會議錄音等）
- **Cloud Functions** - 伺服器端邏輯處理

### AI 整合
- **Claude API** - 自然語言處理和分析
- **Google Cloud Speech-to-Text** - 語音轉文字
- **OpenAI API** - 智能摘要和洞察

## 📁 專案結構

```
DonnaAI-1.0/
├── src/
│   ├── components/         # 可重用 UI 元件
│   │   ├── common/        # 通用元件
│   │   └── auth/          # 認證相關元件
│   ├── screens/           # 畫面元件
│   │   ├── auth/          # 登入/註冊畫面
│   │   ├── dashboard/     # 儀表板畫面
│   │   ├── customers/     # 客戶管理畫面
│   │   └── meetings/      # 會議記錄畫面
│   ├── services/          # 外部服務整合
│   │   └── firebase/      # Firebase 服務
│   ├── stores/            # Zustand 狀態管理
│   ├── types/             # TypeScript 型別定義
│   ├── navigation/        # 導航配置
│   └── utils/             # 輔助函數
├── assets/                # 圖片和其他資產
├── firebase.json          # Firebase 配置
├── firestore.rules        # Firestore 安全規則
└── .env.example          # 環境變數模板
```

## 🚦 開始使用

### 環境需求
- Node.js 18+
- Expo CLI
- Firebase 專案

### 安裝步驟

1. **複製專案**
   ```bash
   git clone https://github.com/your-org/DonnaAI-1.0.git
   cd DonnaAI-1.0
   ```

2. **安裝相依套件**
   ```bash
   npm install
   ```

3. **設定環境變數**
   ```bash
   cp .env.example .env
   # 編輯 .env 檔案，填入您的 Firebase 和 AI API 金鑰
   ```

4. **Firebase 專案設定**
   - 在 Firebase Console 建立新專案
   - 啟用 Authentication (Email/Password)
   - 建立 Firestore 資料庫
   - 下載 Firebase 配置並更新環境變數

5. **啟動開發伺服器**
   ```bash
   npm start
   ```

### 開發命令

```bash
# 啟動開發伺服器
npm start

# 在 iOS 模擬器執行
npm run ios

# 在 Android 模擬器執行
npm run android

# 在網頁瀏覽器執行
npm run web

# TypeScript 型別檢查
npm run type-check

# ESLint 程式碼檢查
npm run lint

# Prettier 程式碼格式化
npm run format
```

## 🔐 環境變數設定

複製 `.env.example` 為 `.env` 並填入以下資訊：

```env
# Firebase 配置
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdefg

# AI API 金鑰
OPENAI_API_KEY=your-openai-api-key
CLAUDE_API_KEY=your-claude-api-key
GOOGLE_CLOUD_SPEECH_API_KEY=your-google-speech-api-key
```

## 👥 使用者角色

### 業務員 (Salesperson)
- 記錄會議和客戶互動
- 查看分配的客戶資料
- 使用 AI 轉錄和摘要功能

### 主管 (Manager)
- 查看團隊成員績效
- 管理客戶分配
- 取得 AI 智能洞察和建議

### 管理員 (Admin)
- 管理組織設定和使用者
- 查看系統使用統計
- 控制 AI 配額和計費

## 🧪 測試

```bash
# 執行單元測試
npm test

# 執行測試覆蓋率報告
npm run test:coverage
```

## 📦 建置和部署

```bash
# 建置 Web 版本
npm run build:web

# 建置 iOS 應用程式 (需要 Mac)
expo build:ios

# 建置 Android 應用程式
expo build:android
```

## 🤝 貢獻指南

1. Fork 此專案
2. 建立功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 📄 授權條款

此專案採用 MIT 授權條款 - 詳見 [LICENSE](LICENSE) 檔案

## 📞 聯絡我們

- 專案連結：[https://github.com/your-org/DonnaAI-1.0](https://github.com/your-org/DonnaAI-1.0)
- 問題回報：[https://github.com/your-org/DonnaAI-1.0/issues](https://github.com/your-org/DonnaAI-1.0/issues)

---

⭐ 如果這個專案對您有幫助，請給我們一個星星！