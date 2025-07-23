# PRP-19: 任務系統簡化 - 二元狀態與過濾邏輯優化

## 📋 總覽
簡化任務系統，將狀態改為僅有「完成」和「未完成」兩種，移除進度追蹤和時間資訊欄位，並優化首頁任務過濾邏輯。

## 🎯 目標
1. 簡化任務狀態為二元系統（完成/未完成）
2. 移除進度追蹤和時間資訊顯示
3. 確保首頁和詳情頁都能直接標記任務完成
4. 優化首頁過濾邏輯：顯示無日期、過去日期、今天的任務，隱藏未來任務

## 📚 相關檔案參考

### 資料結構定義
- `/src/types/task.ts` - 任務類型定義（第15行 TaskStatus）
- `/src/stores/taskStore.ts` - 狀態管理（第104-128行 toggleTaskStatus）

### UI 元件
- `/src/components/dashboard/TaskListSection.tsx` - 首頁任務列表（第130-201行過濾邏輯）
- `/src/screens/database/TaskDetailScreen.tsx` - 任務詳情頁（第47-73行狀態切換）

### Firebase 服務
- `/src/services/firebase/tasks-v2.ts` - 任務資料庫操作
- `/src/services/firebase/tasks.ts` - 基礎任務服務

## 🔍 現況分析

### 目前狀態系統
```typescript
// 現有四種狀態
export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled';
```

### 目前問題
1. **狀態過於複雜**：四種狀態對簡單任務管理來說太多
2. **進度追蹤冗餘**：有專門的進度條顯示（0%、50%、100%）
3. **時間資訊過多**：顯示建立時間、更新時間、完成時間
4. **首頁勾選限制**：雖然有 checkbox，但功能受限
5. **過濾邏輯不符需求**：目前顯示所有待辦任務，包括未來的

## 💡 實作方案

### 1. 簡化狀態定義
將 TaskStatus 簡化為：
```typescript
export type TaskStatus = 'todo' | 'completed';
```

### 2. 更新狀態切換邏輯
- 首頁：保持現有的 toggleTaskStatus，但移除 cancelled 和 in_progress
- 詳情頁：改為簡單的完成/未完成切換

### 3. 移除不必要的 UI 元素
- TaskDetailScreen：移除進度追蹤區塊（第222-240行）
- TaskDetailScreen：移除時間資訊區塊（第242-267行）
- 保留到期日顯示（這是任務管理的必要資訊）

### 4. 優化首頁過濾邏輯
修改 TaskListSection 的 getTaskSections 方法：
```typescript
// 過濾邏輯：
// 1. 沒有截止日期的任務
// 2. 截止日期在過去的任務（包含過期）
// 3. 截止日期是今天的任務
// 排除：截止日期在未來的任務
```

### 5. 確保勾選功能正常
- 首頁已有 checkbox 功能，確保能正常運作
- 詳情頁改為顯示 checkbox 而非狀態按鈕

## 📝 實作步驟

### 步驟 1：更新資料類型
1. 修改 `/src/types/task.ts` 中的 TaskStatus 定義
2. 更新相關的類型檢查和預設值

### 步驟 2：簡化狀態管理
1. 更新 `/src/stores/taskStore.ts` 中的狀態切換邏輯
2. 移除 in_progress 和 cancelled 相關代碼

### 步驟 3：優化首頁列表
1. 修改 `/src/components/dashboard/TaskListSection.tsx` 的過濾邏輯
2. 調整任務分組邏輯，排除未來任務
3. 確保 checkbox 功能正常

### 步驟 4：簡化詳情頁
1. 修改 `/src/screens/database/TaskDetailScreen.tsx`
2. 移除進度追蹤區塊
3. 移除時間資訊區塊
4. 將狀態按鈕改為 checkbox

### 步驟 5：更新其他相關元件
1. 檢查並更新 CreateTaskModal 和 EditTaskModal
2. 確保新建任務預設為 'todo' 狀態
3. 移除狀態選擇器中的多餘選項

## 🧪 測試驗證

### 功能測試
```bash
# 執行測試
npm test

# 手動測試項目：
1. 首頁任務列表只顯示符合條件的任務
2. 首頁 checkbox 可以正常切換任務狀態
3. 詳情頁可以標記任務完成
4. 新建任務預設為未完成狀態
5. 編輯任務時狀態選項正確
```

### 驗證檢查點
- [ ] TaskStatus 類型已簡化為兩種狀態
- [ ] 所有狀態切換邏輯已更新
- [ ] 進度追蹤 UI 已移除
- [ ] 時間資訊 UI 已移除
- [ ] 首頁過濾邏輯符合需求
- [ ] 首頁和詳情頁都能標記完成

## ⚠️ 注意事項

### 資料遷移考量
- 現有的 'in_progress' 任務應視為 'todo'
- 現有的 'cancelled' 任務可視為 'completed' 或保持不變
- 建議在更新前備份資料

### 相容性問題
- Firebase 中的現有資料需要處理
- 確保不會因為狀態值改變而導致查詢失敗

### UI 一致性
- 確保所有顯示任務狀態的地方都已更新
- 檢查是否有其他依賴狀態的功能

## 🔗 參考資源
- [React Native Checkbox 文件](https://reactnative.dev/docs/checkbox)
- [Firebase Firestore 查詢文件](https://firebase.google.com/docs/firestore/query-data/queries)
- [Zustand 狀態管理文件](https://github.com/pmndrs/zustand)

## 📊 實作信心評分
**評分：9/10**

高信心度原因：
1. 變更範圍明確且集中
2. 現有代碼結構清晰
3. 主要是簡化而非新增功能
4. 測試覆蓋度高

風險因素：
- 需要處理現有資料的遷移
- 可能有未發現的依賴項