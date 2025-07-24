# Firebase Collection 名稱分析報告

## 執行日期
2025-01-24

## 問題摘要
需要確認 Firebase 查詢中實際使用的 collection 名稱，以及是否與索引定義匹配。

## 分析結果

### 1. 實際使用的 Collection 名稱
在 `src/services/firebase/managerActions.ts` 中，所有相關的 Firebase 查詢都使用 **`savedReports`** collection：

- 第 216 行：`addDoc(collection(db, 'savedReports'), reportData)` - 保存報表
- 第 293 行：`query(collection(db, 'savedReports'), ...myReportsConstraints)` - 查詢我的報表
- 第 319 行：`query(collection(db, 'savedReports'), ...publicReportsConstraints)` - 查詢公開報表

### 2. Firebase 索引配置
在 `firestore.indexes.json` 中，索引定義使用的 collection 名稱也是 **`savedReports`**：

- 第 120-131 行：`savedReports` collection 的 `createdBy` + `createdAt` 索引
- 第 134-145 行：`savedReports` collection 的 `isPublic` + `createdAt` 索引
- 第 148-162 行：`savedReports` collection 的 `createdBy` + `teamId` + `createdAt` 索引
- 第 165-181 行：`savedReports` collection 的 `isPublic` + `teamId` + `createdAt` 索引

### 3. 錯誤文檔中的混淆
在 `docs/error-reports/2025-01-24-saved-reports-permission-error.md` 中，示例代碼使用了錯誤的 collection 名稱 `reports`，但這只是文檔中的錯誤，實際代碼中並未使用。

## 結論

**Collection 名稱是一致的**：
- 實際代碼使用：`savedReports`
- 索引配置使用：`savedReports`
- 組件引用使用：`savedReports`（通過 `getSavedReports` 函數）

因此，權限錯誤不是由於 collection 名稱不匹配造成的。問題應該是：

1. **索引尚未部署**：雖然索引配置文件正確，但可能尚未部署到 Firebase
2. **權限規則問題**：Firestore 安全規則可能限制了對 `savedReports` collection 的訪問
3. **複合查詢索引缺失**：當查詢包含 `teamId` 條件時，需要特定的複合索引

## 建議的下一步行動

1. **部署索引**：
   ```bash
   firebase deploy --only firestore:indexes
   ```

2. **檢查 Firestore 安全規則**：
   查看 `firestore.rules` 文件，確認 `savedReports` collection 的讀寫權限

3. **查看 Firebase Console**：
   - 確認索引是否已成功創建
   - 查看具體的錯誤訊息，可能會提供缺失索引的直接連結

4. **測試不同的查詢組合**：
   - 測試不帶 `teamId` 的查詢是否正常
   - 測試只查詢自己的報表（不包含公開報表）是否正常