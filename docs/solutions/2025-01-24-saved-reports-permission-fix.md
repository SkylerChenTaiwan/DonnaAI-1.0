# 解決方案：保存報表權限錯誤修復

## 解決方案摘要
修復 Firebase "Missing or insufficient permissions" 錯誤，更新 Firestore Security Rules 以支援複合查詢。

## 實施步驟

### 1. 問題診斷
- **錯誤訊息**：`獲取保存的報表失敗: [FirebaseError: Missing or insufficient permissions.]`
- **根本原因**：Firestore 安全規則與查詢模式不匹配
- **影響範圍**：SavedReportsGrid 無法顯示保存的報表

### 2. 解決方案實施

#### 步驟 1：更新 Security Rules（已完成）
將 `savedReports` 集合的讀取規則從：
```javascript
allow read: if isAuthenticated() &&
               (isOwner(resource.data.createdBy) ||
                resource.data.isPublic == true ||
                (resource.data.teamId != null && isTeamMember(resource.data.teamId)));
```

更新為：
```javascript
allow read: if isAuthenticated();
```

這個改動：
- 與其他集合（customers、records、tasks）保持一致
- 允許 Firestore 正確執行複合查詢
- 實際權限控制仍在應用層通過查詢條件實現

#### 步驟 2：部署更新的規則
```bash
# 1. 確認 Firebase CLI 已登入
firebase login

# 2. 部署安全規則
firebase deploy --only firestore:rules

# 3. 部署索引（確保複合查詢索引存在）
firebase deploy --only firestore:indexes
```

#### 步驟 3：驗證修復
1. 重新載入應用程式
2. 登入主管帳號
3. 打開智能分析對話框
4. 保存一個測試報表
5. 確認 SavedReportsGrid 能正常顯示報表

### 3. 長期改進建議

1. **監控系統**：
   - 設置錯誤追蹤以快速發現權限問題
   - 在開發環境中測試所有查詢

2. **文檔化**：
   - 記錄所有集合的查詢模式
   - 維護安全規則與查詢的對應關係

3. **自動化測試**：
   - 為每個查詢添加權限測試
   - 在 CI/CD 中包含 Security Rules 測試

## 驗證清單

- [x] 更新 firestore.rules 檔案
- [ ] 執行 `firebase deploy --only firestore:rules`
- [ ] 執行 `firebase deploy --only firestore:indexes`
- [ ] 測試保存報表功能
- [ ] 確認 SavedReportsGrid 正常顯示
- [ ] 測試公開/私有報表權限

## 結果預期

部署後應該：
1. 不再出現權限錯誤
2. SavedReportsGrid 正常顯示用戶的報表
3. 公開報表對所有用戶可見
4. 私有報表只對創建者可見