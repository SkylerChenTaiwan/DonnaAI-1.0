# 錯誤分析報告：任務顯示數量不正確

**日期**：2025-01-23  
**問題描述**：使用者報告有 16 個沒有日期的任務，但系統只顯示 3 個

## 根本原因分析

### 1. Firebase 查詢限制
根據 `/src/services/firebase/tasks-v2.ts` 的程式碼分析：

```typescript
// 訂閱查詢有 limit 限制
limit(50)  // 一般使用者每個查詢限制 50 筆
limit(100) // 管理員限制 100 筆
```

但這不是問題的原因，因為 16 個任務遠低於限制。

### 2. 權限過濾邏輯
系統根據使用者角色執行不同的查詢策略：

**一般使用者（salesperson）**：
- 查詢自己負責的任務（assigneeId）
- 查詢自己分派的任務（assignerId）  
- 查詢自己建立的任務（createdBy）

**管理員（admin）**：
- 查詢組織內所有任務

### 3. 日誌分析
根據控制台日誌：
```
✅ 獲取到 4 個任務（優化版）
Filter applied: { teamId: 'team001' }
Tasks breakdown:
- With due date: 1
- Without due date: 3
- In specified team: 4
```

Firebase 實際返回了 4 個任務，其中 3 個沒有日期，1 個有日期。

## 可能的原因

### 原因 1：任務權限不匹配
16 個任務中的大部分可能：
- 不是由 admin@donnaai.ai 負責（assigneeId 不匹配）
- 不是由 admin@donnaai.ai 分派（assignerId 不匹配）
- 不是由 admin@donnaai.ai 建立（createdBy 不匹配）

### 原因 2：團隊過濾
前端程式碼顯示有團隊過濾：
```typescript
fetchTasks(authUser.uid, { teamId: currentTeam.id })
```
可能那 16 個任務不在當前選擇的團隊（team001）中。

### 原因 3：使用者角色配置錯誤
如果 admin@donnaai.ai 在系統中不是真正的 admin 角色，而是一般使用者（salesperson），那麼就會套用更嚴格的權限過濾。

### 原因 4：資料不一致
可能存在資料完整性問題，如：
- 任務的 organizationId 不正確
- 任務缺少必要的權限欄位

## 解決方案

### 方案 1：驗證使用者角色（推薦）
確認 admin@donnaai.ai 的實際角色配置：

```typescript
// 在前端加入調試程式碼
console.log('Current user:', user);
console.log('User role:', user.role);
console.log('Permission context:', permissionContext);
```

### 方案 2：移除團隊過濾（臨時測試）
暫時移除團隊過濾以查看所有任務：

```typescript
// 修改 EnhancedDashboardV2.tsx
await fetchTasks(authUser.uid); // 移除 { teamId: currentTeam.id }
```

### 方案 3：直接查詢 Firebase（診斷用）
在 Firebase Console 中執行查詢來確認實際的任務數量：

```sql
-- 查詢所有沒有日期的任務
SELECT * FROM tasks 
WHERE dueDate IS NULL 
  AND organizationId = 'org001'
```

### 方案 4：增強日誌輸出
在 `tasks-v2.ts` 中增加更詳細的日誌：

```typescript
// 在 getTasksOptimized 函數中
console.log('User permission context:', permissionContext);
console.log('Queries executed:', {
  role: permissionContext.role,
  managedTeamIds: permissionContext.managedTeamIds,
  userId: user.id
});

// 在每個查詢後
console.log(`Query ${queryName} returned ${snapshot.docs.length} tasks`);
```

### 方案 5：實作管理員查看所有任務功能
如果使用者確實需要查看所有任務，可以：

1. 確保使用者角色為 admin
2. 新增一個「查看所有任務」的開關
3. 實作跨團隊任務查詢功能

## 建議執行順序

1. **立即執行**：方案 1 - 驗證使用者角色
2. **測試用**：方案 2 - 移除團隊過濾
3. **診斷用**：方案 3 - 直接查詢 Firebase
4. **長期改善**：方案 4 & 5 - 增強日誌和功能

## 影響評估

- **安全性**：確保權限系統正常運作，避免洩露其他使用者的任務
- **效能**：查詢優化已經實作，不會有效能問題
- **使用者體驗**：需要清楚顯示為什麼某些任務不可見

## 預防措施

1. 在 UI 上顯示當前的過濾條件
2. 顯示總任務數 vs 可見任務數
3. 為管理員提供「查看所有任務」的選項
4. 改善錯誤訊息，說明為什麼某些任務不可見