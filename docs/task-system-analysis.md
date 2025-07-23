# 任務系統架構分析報告

## 概覽
本報告詳細分析 DonnaAI 專案中的任務管理系統，包含資料模型、狀態管理、UI 元件和 Firebase 整合。

## 核心檔案清單

### 1. 資料模型與類型定義
- **`/src/types/task.ts`**
  - 定義了完整的任務資料結構和相關類型
  - 主要類型：
    - `TaskType`: 任務類型（scheduled | unscheduled | pending）
    - `TaskPriority`: 優先級（low | medium | high | urgent）
    - `TaskStatus`: 狀態（todo | in_progress | completed | cancelled）
    - `TaskSource`: 來源（manual | ai_extracted | calendar_sync）
    - `TaskDoc`: 完整的任務文件結構
    - `TaskFilter`: 任務查詢過濾器介面
    - `TaskStats`: 任務統計資料介面

### 2. 狀態管理
- **`/src/stores/taskStore.ts`**
  - 使用 Zustand 實作的任務狀態管理
  - 提供的功能：
    - CRUD 操作（建立、讀取、更新、刪除）
    - 批次操作支援
    - 即時訂閱功能
    - 任務統計
    - 過濾器管理
    - AI 整合（從 AI 建立任務）

### 3. Firebase 服務層
- **`/src/services/firebase/tasks.ts`**
  - 基礎的 Firebase 任務操作
  - 原始版本的任務服務

- **`/src/services/firebase/tasks-v2.ts`**
  - 優化版本的任務服務
  - 改進特點：
    - 查詢層級權限管理
    - 避免 N+1 查詢問題
    - 批次操作支援
    - 更好的效能優化

### 4. UI 元件

#### 任務列表元件
- **`/src/components/dashboard/TaskListSection.tsx`**
  - 主要的任務列表顯示元件
  - 功能特點：
    - 分組顯示（過期任務、今日任務、待辦任務）
    - 狀態切換（點擊完成/取消完成）
    - 下拉重新整理
    - 優先級顏色標示
    - 空狀態處理

#### 任務表單元件
- **`/src/components/forms/TaskForm.tsx`**
  - 任務建立/編輯表單
  - 支援文字和語音輸入
  - 包含優先級和狀態選擇

#### 任務模態視窗
- **`/src/screens/modals/CreateTaskModal.tsx`**
  - 建立新任務的模態視窗
  
- **`/src/screens/modals/EditTaskModal.tsx`**
  - 編輯現有任務的模態視窗

#### 任務詳情頁面
- **`/src/screens/database/TaskDetailScreen.tsx`**
  - 顯示單一任務的詳細資訊
  - 支援狀態切換
  - 顯示關聯客戶資訊

### 5. AI 整合
- **`/src/services/ai/voice-to-task.ts`**
  - 語音轉任務功能
  - 使用 AI 解析語音內容並建立任務

- **`/src/components/input/SimplifiedVoiceTaskInput.tsx`**
  - 簡化的語音任務輸入元件

## 現有過濾功能分析

### 1. TaskFilter 介面（定義於 task.ts）
```typescript
export interface TaskFilter {
  type?: TaskType | TaskType[];           // 任務類型過濾
  status?: TaskStatus | TaskStatus[];     // 狀態過濾
  priority?: TaskPriority | TaskPriority[]; // 優先級過濾
  assigneeId?: string;                    // 負責人過濾
  assignerId?: string;                    // 指派人過濾
  customerIds?: string[];                 // 客戶過濾
  teamId?: string;                        // 團隊過濾
  source?: TaskSource | TaskSource[];     // 來源過濾
  dateFrom?: Date;                        // 開始日期
  dateTo?: Date;                          // 結束日期
  overdue?: boolean;                      // 是否過期
  hasSchedule?: boolean;                  // 是否有排程
}
```

### 2. 在 TaskStore 中的過濾實作
- `setFilter()`: 設定過濾條件
- `clearFilter()`: 清除過濾條件
- `fetchTasks()`: 支援傳入過濾條件參數
- `subscribeToTasks()`: 即時訂閱支援過濾

### 3. 在 UI 中的過濾實作
目前的 UI 元件（如 TaskListSection）主要使用硬編碼的過濾邏輯：
- 過濾當前用戶的任務
- 分組顯示（過期、今日、待辦）
- 排除已完成任務

**注意：目前沒有發現獨立的過濾器 UI 元件**

## 關鍵發現

1. **完整的資料模型**：任務系統有完善的類型定義和資料結構
2. **強大的狀態管理**：使用 Zustand 實作，支援即時更新和批次操作
3. **Firebase 整合**：有兩個版本的服務層，v2 版本有更好的效能優化
4. **缺少過濾器 UI**：雖然後端支援豐富的過濾功能，但前端缺少對應的過濾器 UI 元件
5. **AI 功能整合**：支援語音輸入和 AI 解析建立任務

## 建議改進項目

1. **建立過濾器 UI 元件**
   - 實作一個通用的任務過濾器元件
   - 支援所有 TaskFilter 介面定義的過濾選項
   - 可重用於不同的任務列表頁面

2. **增強任務列表功能**
   - 加入排序功能
   - 支援自訂分組方式
   - 批次操作 UI

3. **改進狀態管理**
   - 考慮加入快取機制
   - 優化大量任務的渲染效能

4. **統一服務層**
   - 考慮完全遷移到 tasks-v2.ts
   - 移除舊版本以避免混淆