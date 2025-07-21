# 錯誤分析報告：紀錄標籤顯示 0 筆資料

**日期**: 2025-01-21
**問題描述**: DatabaseScreen 中的紀錄 (records) 標籤顯示 0 筆資料，但客戶顯示 20 筆，任務顯示 30 筆

## 根本原因分析

### 1. 資料流程追蹤

```
DatabaseScreen.tsx (line 98)
  ↓
useRecordStore.getState().fetchRecords(user.id)  // 只傳遞 user.id 字串
  ↓
recordStore.ts fetchRecords() (lines 98-112)
  ↓ 建立臨時 User 物件，但關鍵欄位為空：
  - organizationId: ''  // 空字串
  - teamIds: []        // 空陣列
  ↓
records-v2.ts getRecordsOptimized()
  ↓
permissions-v2.ts buildQueryConstraints() (line 91)
  ↓ 
產生查詢條件: where('teamId', 'in', [])  // 空陣列導致查詢結果為空！
```

### 2. 問題核心

當 `fetchRecords` 被呼叫時只傳遞了 `user.id` (字串)，而不是完整的 User 物件。這導致在建立臨時 User 物件時，關鍵的權限欄位（`teamIds` 和 `organizationId`）都是空的。

對於 'salesperson' 角色，權限系統會加入 `where('teamId', 'in', context.teamIds)` 的查詢條件。當 `teamIds` 是空陣列時，Firestore 的 `in` 查詢不會返回任何結果。

### 3. 為什麼客戶和任務正常？

檢查 `DatabaseScreen.tsx` 發現：
- 客戶：`fetchCustomers(user.id, user.teamIds?.[0] || '')` - 有傳遞 teamId
- 任務：可能使用不同的權限邏輯或查詢方式

## 解決方案選項

### 方案 A：修正 DatabaseScreen 中的呼叫方式（推薦）
**優點**：
- 最小改動
- 符合現有架構設計
- 保持一致性

**實作**：
```typescript
// DatabaseScreen.tsx line 98
// 原本：
useRecordStore.getState().fetchRecords(user.id);

// 改為：
useRecordStore.getState().fetchRecords(user);
```

### 方案 B：修改 recordStore 的向後相容邏輯
**優點**：
- 不需要改動呼叫端
- 可以處理更多邊緣情況

**缺點**：
- 需要額外的資料查詢來取得完整 User 資訊
- 增加複雜度

**實作**：
在 recordStore.ts 的 fetchRecords 方法中，當收到字串時，需要從 authStore 取得完整的 user 物件。

### 方案 C：修改權限系統處理空 teamIds
**優點**：
- 防禦性程式設計

**缺點**：
- 可能導致安全問題
- 不符合業務邏輯（沒有團隊的使用者不應該看到任何紀錄）

## 影響評估

- **影響範圍**：僅影響紀錄列表的顯示
- **使用者影響**：使用者無法在資料庫頁面看到紀錄
- **資料完整性**：資料本身沒有問題，只是查詢邏輯問題
- **安全性**：現有權限系統運作正常，修正不會影響安全性

## 建議

採用**方案 A**，因為：
1. 改動最小，風險最低
2. 符合現有的架構設計（其他 Store 也期望收到完整的 User 物件）
3. 保持程式碼一致性
4. 不需要額外的資料查詢

## 測試計劃

修正後需要測試：
1. 紀錄列表是否正常顯示
2. 不同角色的權限是否正常運作
3. 其他功能是否受影響（如紀錄詳情、新增紀錄等）