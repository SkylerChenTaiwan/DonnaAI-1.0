# 錯誤分析報告：保存報表權限錯誤

## 錯誤描述
- **錯誤訊息**：`獲取保存的報表失敗: [FirebaseError: Missing or insufficient permissions.]`
- **發生時間**：2025-01-24
- **影響範圍**：SavedReportsGrid 組件無法顯示保存的報表

## 根本原因分析

### 1. 錯誤位置
```typescript
// 檔案：src/services/firebase/managerActions.ts
// 函數：getSavedReports (第 267-350 行)
// 錯誤捕獲：第 347 行
```

### 2. 問題詳情

#### Firebase 查詢結構
```typescript
// 查詢個人報表
query(
  collection(db, 'reports'),
  where('createdBy', '==', userId),
  orderBy('createdAt', 'desc'),
  limit(50)
)

// 查詢公開報表
query(
  collection(db, 'reports'),
  where('isPublic', '==', true),
  where('organizationId', '==', organizationId),
  orderBy('createdAt', 'desc'),
  limit(50)
)
```

#### 錯誤原因
1. **複合查詢索引缺失**：Firebase 需要為 `where + orderBy` 的組合建立索引
2. **索引已定義但未部署**：`firestore.indexes.json` 中已定義索引，但可能未部署到 Firebase

### 3. 相關檔案
- `/src/services/firebase/managerActions.ts` - 查詢邏輯
- `/src/components/manager/SavedReportsGrid.tsx` - 使用查詢的組件
- `/firestore.indexes.json` - 索引定義

## 解決方案

### 方案 1：部署 Firebase 索引（推薦）
**影響**：無需修改程式碼，最小風險
**步驟**：
```bash
# 1. 確認 Firebase CLI 已登入
firebase login

# 2. 部署索引
firebase deploy --only firestore:indexes

# 3. 等待索引建立完成（約 5-10 分鐘）
```

### 方案 2：簡化查詢邏輯
**影響**：需要修改程式碼，但可立即解決問題
**實作**：
```typescript
// 移除 orderBy，在客戶端排序
const personalQuery = query(
  collection(db, 'reports'),
  where('createdBy', '==', userId),
  limit(100)  // 增加限制以補償客戶端排序
);

// 獲取結果後在客戶端排序
const sortedReports = reports.sort((a, b) => 
  b.createdAt.toMillis() - a.createdAt.toMillis()
);
```

### 方案 3：改進錯誤處理
**影響**：提供更好的用戶體驗
**實作**：
```typescript
catch (error) {
  console.error('獲取保存的報表失敗:', error);
  
  // 檢查是否為索引錯誤
  if (error.code === 'failed-precondition' && 
      error.message.includes('index')) {
    toast.warning('系統正在建立索引，請稍後再試');
    return [];
  }
  
  toast.error('無法載入報表，請檢查網路連線');
  throw error;
}
```

## 驗證步驟

1. **檢查索引狀態**：
   ```bash
   firebase firestore:indexes
   ```

2. **測試查詢**：
   - 登入主管帳號
   - 訪問智能分析頁面
   - 檢查 SavedReportsGrid 是否正常顯示

3. **監控錯誤**：
   - 開啟瀏覽器開發者工具
   - 檢查 Console 是否還有權限錯誤

## 預防措施

1. **自動化索引部署**：
   - 在 CI/CD 中加入 `firebase deploy --only firestore:indexes`
   - 確保每次更新查詢時同步更新索引

2. **查詢最佳化**：
   - 避免過度複雜的複合查詢
   - 考慮使用 Collection Group 查詢

3. **錯誤監控**：
   - 實施更完善的錯誤追蹤
   - 為常見錯誤提供用戶友好的訊息

## 結論

此錯誤最可能是因為 Firebase 索引未部署。建議先執行方案 1，如果問題持續，再考慮方案 2 或 3。這是一個常見的 Firebase 開發問題，通過適當的索引配置即可解決。