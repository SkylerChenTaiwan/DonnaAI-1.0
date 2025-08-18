# Firebase 開發指南

## 🔐 Firebase 安全規則管理

### 新增集合規則
- **新增集合時必須同步更新 Firestore 規則** - 任何新的集合都需要在 `firestore.rules` 中定義相應的權限
- **開發時先在 Firebase 模擬器測試** - 使用 `firebase emulators:start` 在本地測試規則，避免部署後才發現權限問題

### 規則部署檢查清單
1. 確認所有新集合都有對應的 match 規則
2. 測試 Super Admin、組織管理員、一般用戶的權限
3. 確保沒有過度開放的權限（避免 `allow read, write: if true`）

### 常見權限錯誤排查
- `Missing or insufficient permissions` - 檢查是否有遺漏的集合規則
- 確認用戶角色是否正確設定
- 檢查規則中的函數邏輯是否正確

## 🛠️ 開發工具

### Firebase 模擬器
```bash
firebase emulators:start
```

### 權限測試腳本
```bash
npm run test:firebase-rules
```

### 部署檢查
```bash
firebase deploy --only firestore:rules
```

## 📋 最佳實踐

### 安全規則編寫
- 使用函數封裝複雜邏輯
- 明確定義各角色權限
- 避免使用 `true` 作為權限條件

### 集合結構設計
- 遵循 NoSQL 最佳實踐
- 考慮查詢效能
- 合理使用子集合和文件引用