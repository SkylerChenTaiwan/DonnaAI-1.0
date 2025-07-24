# Firebase 權限錯誤分析報告

## 錯誤資訊
```
ERROR 獲取團隊成員失敗: [FirebaseError: Missing or insufficient permissions.]
```

## 根本原因分析

### 1. Firebase Security Rules 限制
根據 `firestore.rules` 第 62-63 行：
```javascript
allow read: if isOwner(userId) || 
               (isAuthenticated() && isOrgMember(resource.data.organizationId));
```

這表示用戶只能讀取：
- 自己的資料 (`isOwner`)
- 同組織的其他用戶資料 (`isOrgMember`)

### 2. 查詢執行順序問題
Firebase 在執行查詢時會：
1. 先檢查是否有權限讀取整個 `users` 集合
2. 再應用 where 條件過濾

由於規則是針對單個文檔的，而不是集合級別的，所以會出現權限錯誤。

### 3. 當前查詢邏輯
```javascript
where('teamIds', 'array-contains', currentTeam.id)
```
這個查詢會嘗試掃描所有用戶文檔，包括其他組織的用戶。

## 解決方案

### 方案 A：複合查詢（已實施）
```javascript
where('organizationId', '==', user.organizationId),
where('teamIds', 'array-contains', currentTeam.id)
```
優點：符合現有 Security Rules
缺點：如果用戶沒有 organizationId 會失敗

### 方案 B：修改 Security Rules
在 Firebase Console 中修改規則，允許基於團隊的查詢：
```javascript
match /users/{userId} {
  allow read: if isOwner(userId) || 
                 (isAuthenticated() && isOrgMember(resource.data.organizationId)) ||
                 (isAuthenticated() && 
                  request.auth.uid in get(/databases/$(database)/documents/teams/$(resource.data.teamIds[0])).data.memberIds);
}
```

### 方案 C：使用 Cloud Function
創建一個 Cloud Function 來處理團隊成員查詢，繞過客戶端權限限制。

## 建議

1. **短期**：使用方案 A（已實施），確保所有用戶都有 organizationId
2. **長期**：考慮實施方案 C，提供更靈活的查詢能力
3. **監控**：添加錯誤日誌追蹤，了解哪些用戶遇到此問題

## 預防措施

1. 在用戶註冊時確保設置 organizationId
2. 添加資料完整性檢查
3. 在查詢前驗證必要欄位存在
4. 考慮使用子集合結構（如 `/teams/{teamId}/members`）來簡化權限管理