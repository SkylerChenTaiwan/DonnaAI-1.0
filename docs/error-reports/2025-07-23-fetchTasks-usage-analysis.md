# fetchTasks 函數使用分析報告

## 報告日期
2025-07-23

## 問題描述
需要檢查程式碼庫中所有 `fetchTasks` 函數的調用，特別是尋找可能傳遞 `organizationId` 作為參數的情況。

## 函數定義分析

### 當前函數簽名
位置：`/src/stores/taskStore.ts`
```typescript
fetchTasks: (userOrUserId: User | string, filter?: TaskFilter) => Promise<void>
```

### TaskFilter 介面定義
位置：`/src/types/task.ts`
```typescript
export interface TaskFilter {
  type?: TaskType | TaskType[];
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority | TaskPriority[];
  assigneeId?: string;
  assignerId?: string;
  customerIds?: string[];
  teamId?: string;
  source?: TaskSource | TaskSource[];
  dateFrom?: Date;
  dateTo?: Date;
}
```

**重要發現**：`TaskFilter` 介面中**沒有** `organizationId` 欄位。

## 所有 fetchTasks 調用分析

### 1. TaskListSection.tsx
位置：`/src/components/dashboard/TaskListSection.tsx`

**調用 1（第 94 行）**：
```typescript
await fetchTasks(userId, { teamId }).finally(() => setLoading(false));
```
- 只傳遞 `teamId`，沒有 `organizationId`

**調用 2（第 103 行）**：
```typescript
await fetchTasks(userId, { teamId });
```
- 只傳遞 `teamId`，沒有 `organizationId`

**調用 3（第 129 行）**：
```typescript
await fetchTasks(userId, { teamId }); // 重新載入以更新列表
```
- 只傳遞 `teamId`，沒有 `organizationId`

### 2. EnhancedDashboardV2.tsx
位置：`/src/screens/dashboard/EnhancedDashboardV2.tsx`

**調用 1（第 60-62 行）**：
```typescript
fetchTasks(authUser.uid, { 
  organizationId: currentOrganization.id, 
  teamId: currentTeam.id 
})
```
- **問題發現**：嘗試傳遞 `organizationId`，但 `TaskFilter` 不支援此欄位

**調用 2（第 86-88 行）**：
```typescript
fetchTasks(authUser.uid, { 
  organizationId: currentOrganization.id, 
  teamId: currentTeam.id 
})
```
- **問題發現**：同樣嘗試傳遞 `organizationId`

### 3. taskStore.ts
位置：`/src/stores/taskStore.ts`

**調用 1（第 303 行）**：
```typescript
await get().fetchTasks(tempUser);
```
- 傳遞完整的 User 物件，沒有 filter

**調用 2（第 313 行）**：
```typescript
await get().fetchTasks(userOrUserId);
```
- 傳遞 User 物件，沒有 filter

### 4. DatabaseScreen.tsx
位置：`/src/screens/database/DatabaseScreen.tsx`

**調用 1（第 100 行）**：
```typescript
useTaskStore.getState().fetchTasks(user);
```
- 傳遞 User 物件，沒有 filter

**調用 2（第 433 行）**：
```typescript
await useTaskStore.getState().fetchTasks(user);
```
- 傳遞 User 物件，沒有 filter

**調用 3（第 536 行）**：
```typescript
await useTaskStore.getState().fetchTasks(user);
```
- 傳遞 User 物件，沒有 filter

**調用 4（第 642 行）**：
```typescript
await useTaskStore.getState().fetchTasks(user);
```
- 傳遞 User 物件，沒有 filter

## 根本原因分析

1. **TypeScript 類型不匹配**：`EnhancedDashboardV2.tsx` 中的兩處調用嘗試傳遞 `organizationId` 給 `fetchTasks`，但 `TaskFilter` 介面不包含此欄位。

2. **設計不一致**：雖然任務系統需要 `organizationId` 來進行正確的資料過濾，但當前的 `TaskFilter` 介面設計沒有包含這個重要欄位。

3. **潛在的資料過濾問題**：即使傳遞了 `organizationId`，由於 TypeScript 類型定義不包含此欄位，該參數會被忽略，可能導致資料過濾不正確。

## 影響評估

### 嚴重程度：中等

### 受影響的功能
1. Dashboard 頁面的任務列表顯示
2. 跨組織的任務資料隔離
3. 任務篩選功能的完整性

### 潛在風險
1. 可能顯示錯誤組織的任務資料
2. TypeScript 編譯警告（如果啟用嚴格模式）
3. 運行時行為與預期不符

## 解決方案建議

### 方案一：更新 TaskFilter 介面（推薦）
**優點**：
- 符合實際業務需求
- 統一所有任務查詢的行為
- TypeScript 類型安全

**實施步驟**：
1. 在 `TaskFilter` 介面中新增 `organizationId?: string` 欄位
2. 更新 `getTasksOptimized` 函數以處理 `organizationId` 過濾
3. 確保所有相關的 API 端點支援組織過濾

### 方案二：使用 User 物件進行過濾
**優點**：
- 不需要修改介面
- User 物件已包含 organizationId

**缺點**：
- 需要修改 `EnhancedDashboardV2.tsx` 的調用方式
- 可能需要重構相關邏輯

### 方案三：移除 organizationId 參數
**優點**：
- 快速修復 TypeScript 錯誤
- 最小化改動

**缺點**：
- 可能無法正確過濾跨組織資料
- 不符合業務邏輯需求

## 建議的後續行動

1. 與團隊確認任務系統是否需要支援跨組織過濾
2. 如果需要，實施方案一以確保類型安全和功能完整性
3. 審查所有任務相關的 API 端點，確保後端支援組織過濾
4. 更新相關測試案例以覆蓋新的過濾邏輯

## 相關檔案
- `/src/stores/taskStore.ts`
- `/src/types/task.ts`
- `/src/screens/dashboard/EnhancedDashboardV2.tsx`
- `/src/components/dashboard/TaskListSection.tsx`
- `/src/screens/database/DatabaseScreen.tsx`