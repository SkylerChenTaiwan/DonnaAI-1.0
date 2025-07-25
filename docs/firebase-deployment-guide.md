# Firebase Firestore 規則部署指南

## 問題描述
Super Admin 無法存取組織資料，出現權限錯誤。

## 根本原因
1. Firestore 安全規則尚未部署到 Firebase
2. Firebase Auth Token 可能沒有包含自定義聲明（custom claims）

## 解決步驟

### 步驟 1：部署簡化版規則（立即解決）

在 Firebase Console 中：
1. 進入 **Firestore Database**
2. 點擊 **Rules** 標籤
3. 將 `firestore-simple.rules` 的內容貼上
4. 點擊 **Publish**

### 步驟 2：使用 Firebase CLI 部署（推薦）

```bash
# 安裝 Firebase CLI（如果尚未安裝）
npm install -g firebase-tools

# 登入 Firebase
firebase login

# 初始化專案（如果尚未初始化）
firebase init firestore

# 部署規則
firebase deploy --only firestore:rules
```

### 步驟 3：設定自定義聲明（長期解決方案）

需要在 Firebase Functions 或後端設定用戶的自定義聲明：

```javascript
// 設定 Super Admin 的自定義聲明
await admin.auth().setCustomUserClaims(uid, {
  role: 'system-admin'
});
```

## 規則說明

### 簡化版規則（firestore-simple.rules）
- 允許所有已登入用戶讀取組織資料
- 只有 Super Admin 可以寫入組織資料
- 適合開發環境使用

### 完整版規則（firestore.rules）
- 更嚴格的權限控制
- 區分不同角色的權限
- 適合生產環境使用

## 驗證步驟

1. 部署規則後，重新整理應用程式
2. 檢查 Console 輸出的用戶資訊
3. 確認組織列表可以正常載入

## 注意事項

- 規則變更可能需要幾分鐘才能生效
- 確保 Firebase 專案設定正確
- 檢查用戶的角色是否正確設定為 'system-admin'