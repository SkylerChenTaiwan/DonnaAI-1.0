# DonnaAI 測試資料生成器

這個工具用於為 DonnaAI 應用程式產生真實的測試資料。

## 功能特色

- 🧑‍💼 建立管理員使用者（admin@donnaai.ai）
- 👥 產生客戶資料（包含豐富的自訂欄位）
- 📋 建立會議、通話、筆記等紀錄
- ✅ 產生各種狀態和優先級的任務
- 🧹 提供清理功能移除測試資料
- 📊 資料之間有正確的關聯關係

## 設定步驟

### 1. 取得 Firebase 服務帳號金鑰

1. 前往 [Firebase Console](https://console.firebase.google.com)
2. 選擇你的專案
3. 進入「專案設定」>「服務帳戶」
4. 點擊「產生新的私密金鑰」
5. 下載 JSON 檔案

### 2. 放置服務帳號金鑰

將下載的 JSON 檔案重新命名為 `service-account-key.json`，可以放在以下位置之一：
- `scripts/seed-data/service-account-key.json`
- 專案根目錄的 `service-account-key.json`

⚠️ **重要**：服務帳號金鑰已加入 `.gitignore`，不會被提交到版本控制。

### 3. 設定環境變數（選擇性）

如果你偏好使用環境變數，可以設定：
```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

## 使用方式

### 建立測試資料

使用預設值（20個客戶、每個客戶5筆紀錄、30個任務）：
```bash
npm run seed
```

### 自訂參數

```bash
npm run seed -- --customers 50 --records 10 --tasks 100
```

### 指定使用者

```bash
npm run seed -- --email admin@donnaai.ai
```

### 清理測試資料

```bash
npm run seed:clean
```

或

```bash
npm run seed -- --clean
```

### 模擬執行（不實際寫入）

```bash
npm run seed -- --dry-run
```

## 參數說明

| 參數 | 說明 | 預設值 |
|------|------|--------|
| `--email <email>` | 指定使用者信箱 | admin@donnaai.ai |
| `--customers <n>` | 客戶數量 | 20 |
| `--records <n>` | 每個客戶的紀錄數量 | 5 |
| `--tasks <n>` | 任務數量 | 30 |
| `--clean` | 清理測試資料 | false |
| `--dry-run` | 模擬執行 | false |

## 產生的資料內容

### 客戶資料
- 真實的台灣公司名稱和聯絡資訊
- 自訂欄位：產業別、公司規模、預算、決策者等
- 標籤分類：重要客戶、潛在客戶、VIP等

### 紀錄資料
- 類型：會議、通話、筆記、其他
- 包含 AI 摘要和行動項目
- 關聯到對應的客戶

### 任務資料
- 各種優先級和狀態
- 部分關聯到客戶
- 真實的業務相關任務內容

## 開發指南

### 專案結構
```
scripts/seed-data/
├── index.ts           # 主程式入口
├── config.ts          # 配置設定
├── generators/        # 資料生成器
│   ├── customers.ts   # 客戶資料生成
│   ├── records.ts     # 紀錄資料生成
│   └── tasks.ts       # 任務資料生成
└── utils/            # 工具函數
    ├── firebase.ts    # Firebase 連接
    └── user.ts        # 使用者管理
```

### 編譯 TypeScript

```bash
npm run seed:build
```

### 新增資料類型

1. 在 `generators/` 目錄下建立新的生成器
2. 實作資料產生邏輯
3. 在 `index.ts` 中加入呼叫

## 注意事項

1. **權限**：確保服務帳號有 Firestore 的讀寫權限
2. **批次限制**：Firestore 批次操作最多 500 個
3. **效能**：大量資料可能需要較長時間，請耐心等待
4. **清理**：清理功能只會刪除由此工具建立的資料

## 疑難排解

### 找不到服務帳號金鑰
- 確認檔案名稱為 `service-account-key.json`
- 確認檔案位置正確
- 檢查環境變數設定

### 權限錯誤
- 確認服務帳號有正確的權限
- 在 Firebase Console 檢查 Firestore 規則

### TypeScript 錯誤
- 執行 `npm install` 確保所有依賴已安裝
- 執行 `npm run seed:build` 編譯 TypeScript