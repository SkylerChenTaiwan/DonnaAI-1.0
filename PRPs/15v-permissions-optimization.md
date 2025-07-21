# PRP-15: 權限系統優化實作

## 概述
實作查詢層級權限優化，解決目前資料載入時的 N+1 查詢問題。當前系統在載入客戶、紀錄、任務列表時，對每個項目都進行個別權限檢查，導致大量 Firebase 查詢（20 個項目 = 60+ 次查詢），嚴重影響效能。

## 目標
1. **短期**：實作 permissions-v2.ts 的查詢層級權限系統
2. **中期**：強化 Firebase Security Rules 作為安全層
3. **長期**：規劃 Firebase Custom Claims 整合

## 技術背景

### 問題根源
- 目前的權限檢查架構在 `getCustomers`, `getRecords`, `getTasks` 中使用逐一檢查
- 每個資料項目都會調用 `canViewX` 函數，導致 3 次查詢（資料本身、使用者、團隊）
- `onSnapshot` 訂閱會在資料變更時重新觸發所有權限檢查
- 從詳細頁返回列表時會觸發大量 "Cannot read property 'indexOf' of undefined" 錯誤

### 現有程式碼參考
- `/src/services/firebase/permissions.ts` - 目前的權限系統
- `/src/services/firebase/permissions-v2.ts` - 已建立的優化版本（帶快取）
- `/src/services/firebase/customers-v2.ts` - 優化客戶服務範例
- `/src/services/firebase/customers.ts` - 需要優化的原始版本
- `/src/services/firebase/records.ts` - 需要優化
- `/src/services/firebase/tasks.ts` - 需要優化
- `/firestore.rules` - Firebase Security Rules（已有良好的輔助函數）

## 實作藍圖

### 階段 1：實作查詢層級權限（短期）

```typescript
// 偽代碼展示優化策略
// 原本：N+1 查詢
for (const doc of snapshot.docs) {
  const hasPermission = await canViewCustomer(userId, doc.id); // 3 次查詢
  if (hasPermission) customers.push(doc);
}

// 優化後：單一查詢
const permissionContext = await getUserPermissionContext(user); // 快取
const q = query(collection(db, 'customers'), ...buildQueryConstraints(permissionContext));
const snapshot = await getDocs(q); // 1 次查詢
```

### 階段 2：更新 Firebase Security Rules（中期）

利用現有的輔助函數強化安全規則：
- `isTeamMember(teamId)`
- `isOrgAdmin()`
- `isOrgMember(orgId)`

### 階段 3：Firebase Custom Claims（長期）

規劃將使用者角色和團隊資訊存入 Custom Claims，進一步優化權限檢查。

## 實作任務

### 1. 建立優化的服務層
- [x] 建立 `permissions-v2.ts`（已完成）
- [x] 建立 `customers-v2.ts` 範例（已完成）
- [ ] 建立 `records-v2.ts`
- [ ] 建立 `tasks-v2.ts`
- [ ] 建立統一的批量權限檢查服務

### 2. 更新 Store 層
- [ ] 更新 `customerStore.ts` 使用新的服務
- [ ] 更新 `recordStore.ts` 使用新的服務
- [ ] 更新 `taskStore.ts` 使用新的服務
- [ ] 確保向後相容性

### 3. 優化資料載入流程
- [ ] 實作智能快取機制
- [ ] 優化訂閱邏輯，避免重複載入
- [ ] 處理權限變更時的快取失效

### 4. 測試與驗證
- [ ] 單元測試新的權限服務
- [ ] 整合測試資料載入效能
- [ ] 驗證權限正確性

### 5. 文檔更新
- [ ] 更新架構文檔
- [ ] 建立遷移指南
- [ ] 記錄效能改善指標

## 程式碼範例

### records-v2.ts 實作範例
```typescript
import { getUserPermissionContext, buildQueryConstraints } from './permissions-v2';

export async function getRecordsOptimized(
  user: User,
  filter?: RecordFilter
): Promise<RecordDoc[]> {
  const permissionContext = await getUserPermissionContext(user);
  let q = query(collection(getFirebaseDb(), 'records'));
  
  // 權限過濾
  const constraints = buildQueryConstraints(permissionContext, 'records');
  constraints.forEach(([field, op, value]) => {
    q = query(q, where(field as string, op as any, value));
  });
  
  // 其他過濾條件...
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RecordDoc));
}
```

### Store 更新範例
```typescript
// customerStore.ts
import { getCustomersOptimized } from '@/services/firebase/customers-v2';

// 在 fetchCustomers action 中
fetchCustomers: async (user: User) => {
  set({ isLoading: true, error: null });
  try {
    const customers = await getCustomersOptimized(user, get().filters);
    set({ customers, isLoading: false });
  } catch (error) {
    set({ error: error.message, isLoading: false });
  }
}
```

## 驗證門檻

### 語法和風格檢查
```bash
# TypeScript 編譯檢查
npm run type-check

# ESLint 檢查
npm run lint

# 格式化檢查
npm run format:check
```

### 單元測試
```bash
# 執行權限相關測試
npm test -- permissions
npm test -- customers-v2
npm test -- records-v2
npm test -- tasks-v2
```

### 效能測試
```typescript
// 測試腳本：比較優化前後的查詢次數
const startTime = Date.now();
const queryCount = { before: 0, after: 0 };

// 測試原版
await getCustomers(userId, teamId); // 監控 Firebase 查詢次數

// 測試優化版
await getCustomersOptimized(user); // 監控 Firebase 查詢次數

console.log('查詢次數減少:', queryCount.before - queryCount.after);
console.log('效能提升:', (endTime - startTime) + 'ms');
```

### 權限正確性驗證
```typescript
// 確保優化後的查詢結果與原版一致
const originalResults = await getCustomers(userId, teamId);
const optimizedResults = await getCustomersOptimized(user);
expect(optimizedResults).toEqual(originalResults);
```

## 注意事項

### 安全考量
- 確保查詢層級過濾不會洩漏未授權資料
- 保留關鍵操作的個別權限檢查（如更新、刪除）
- Firebase Security Rules 作為最後防線

### 效能優化
- 權限快取 TTL 設為 5 分鐘
- 監控快取命中率
- 處理權限變更時的快取失效

### 向後相容
- 保留原有 API 介面
- 逐步遷移，避免破壞性變更
- 提供功能開關（feature flag）

## 外部資源
- [Firebase Security Rules 最佳實踐](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Custom Claims 指南](https://firebase.google.com/docs/auth/admin/custom-claims)
- [Firestore 查詢優化](https://firebase.google.com/docs/firestore/query-data/queries)
- [Zustand 狀態管理](https://github.com/pmndrs/zustand)

## 成功指標
- 載入 20 筆資料的查詢次數從 60+ 降至 2-3 次
- 列表載入時間改善 80% 以上
- 消除 "Cannot read property 'indexOf' of undefined" 錯誤
- 保持資料安全性和權限正確性

## 執行順序
1. 完成 records-v2.ts 和 tasks-v2.ts 實作
2. 建立測試案例，確保權限正確性
3. 更新 Store 層使用新服務
4. 在開發環境測試效能改善
5. 逐步部署到生產環境
6. 監控效能指標和錯誤率

---

**信心評分**: 9/10

此 PRP 提供了完整的實作路徑，包含現有程式碼參考、詳細的實作範例、測試策略，以及清晰的執行步驟。由於已經有 permissions-v2.ts 和 customers-v2.ts 的實作基礎，其餘部分的實作應該能夠順利完成。