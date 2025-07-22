# PRP-22: UI 調整 - 語音優先介面

## 概述
根據使用者回饋，調整應用程式的 UI 設計，使其更符合業務人員的實際使用習慣。主要聚焦於：
1. 將語音輸入作為主要的任務建立方式
2. 簡化首頁，專注於任務管理和客戶互動
3. 優化整體使用流程，減少不必要的操作步驟

## 背景與動機
目前的介面設計有以下問題：
- 新增任務需要透過中央「+」按鈕，再選擇「新增任務」，步驟過多
- 語音輸入功能不夠突出，需要切換標籤才能使用
- 首頁資訊過多，統計卡片和快速操作佔據太多空間
- 缺乏快速查看和更新任務狀態的功能
- 最新活動不夠實用，應該顯示近期接觸的客戶

## 目標
1. **提升語音輸入的可及性**：讓語音輸入成為最快速、最直覺的任務建立方式
2. **簡化首頁介面**：移除不必要的元件，專注於核心功能
3. **優化任務管理**：在首頁直接顯示任務列表，支援快速更新狀態
4. **改善客戶追蹤**：顯示近期接觸的客戶，方便後續跟進

## 技術規格

### 1. 導航結構調整
**現況**：Home | Database | + | Tools | Settings

**調整後**：Home | **Task** | Database | Tools | Settings

- 移除中央的「+」按鈕
- 新增「Task」標籤，點擊直接進入語音輸入介面
- Task 標籤應使用麥克風圖標

### 2. 新增任務頁面改造
基於現有的 `CreateRecordModal` 模式實作：

```typescript
// 路由參數
type CreateTaskModalParams = {
  mode?: 'voice' | 'text';  // 預設 'voice'
  customerId?: string;
}

// 預設進入語音模式
const mode = route.params?.mode || 'voice';
```

**語音輸入介面要求**：
- 移除底部的「重置」和「創建任務」按鈕
- 錄音介面應填滿整個頁面（參考 SimplifiedAudioInput）
- 頂部顯示小連結「使用文字輸入 →」切換模式
- 使用全螢幕的錄音按鈕設計

### 3. 首頁（EnhancedDashboard）調整

**移除元件**：
```typescript
// 移除統計卡片區塊
// statsCards.map((card) => ...)

// 移除快速操作區塊  
// quickActions.map((action) => ...)
```

**新增任務列表區塊**：
```typescript
interface TaskListSection {
  overdueTask: Task[];      // 過期任務
  todayTasks: Task[];       // 當日任務
  onTaskComplete: (taskId: string) => void;
}
```

**新增近期客戶區塊**：
```typescript
interface RecentCustomersSection {
  customers: Customer[];    // 按最後互動時間排序
  onCustomerPress: (customerId: string) => void;
}
```

### 4. 元件實作細節

#### 4.1 SimplifiedVoiceTaskInput 元件
基於 `SimplifiedAudioInput` 改造：

```typescript
export const SimplifiedVoiceTaskInput: React.FC<{
  onTaskCreated: (task: Task) => void;
}> = ({ onTaskCreated }) => {
  // 全螢幕錄音介面
  // 自動語音轉任務
  // 完成後直接建立任務
};
```

#### 4.2 TaskListItem 元件
```typescript
export const TaskListItem: React.FC<{
  task: Task;
  onStatusToggle: () => void;
}> = ({ task, onStatusToggle }) => {
  return (
    <View style={styles.taskItem}>
      <Checkbox 
        value={task.status === 'completed'}
        onValueChange={onStatusToggle}
      />
      <View style={styles.taskContent}>
        <Text style={styles.taskTitle}>{task.title}</Text>
        <Text style={styles.taskDue}>{formatDueDate(task.dueDate)}</Text>
      </View>
    </View>
  );
};
```

## 實作步驟

### 第一階段：導航結構調整
1. 修改 `MainTabNavigator.tsx`：
   - 移除 `AddAction` 標籤
   - 新增 `Task` 標籤（使用 mic 圖標）
   - 調整標籤順序
   - 移除 `ActionPopover` 相關程式碼

2. 建立新的 `CreateTaskScreen.tsx`：
   - 不是 Modal，而是 Tab Screen
   - 預設顯示語音輸入介面
   - 支援切換到文字輸入

### 第二階段：語音輸入介面優化
1. 建立 `SimplifiedVoiceTaskInput.tsx`：
   - 基於 `SimplifiedAudioInput` 改造
   - 移除底部按鈕
   - 擴大錄音按鈕區域
   - 整合語音轉任務功能

2. 修改任務建立流程：
   - 語音錄製完成後自動處理
   - 顯示識別結果供確認
   - 一鍵建立任務

### 第三階段：首頁簡化
1. 修改 `EnhancedDashboard.tsx`：
   - 移除統計卡片區塊
   - 移除快速操作區塊
   - 保留使用者資訊卡片

2. 新增任務列表區塊：
   - 建立 `TaskListSection` 元件
   - 整合任務查詢邏輯
   - 實作狀態更新功能

3. 新增近期客戶區塊：
   - 建立 `RecentCustomersSection` 元件
   - 查詢最近互動的客戶
   - 支援快速導航到客戶詳情

### 第四階段：整合與優化
1. 更新相關的 navigation types
2. 調整 store 邏輯支援快速任務更新
3. 測試各種使用流程
4. 優化動畫和過渡效果

## 現有程式碼參考

### 導航實作參考
- `/src/navigation/MainTabNavigator.tsx` - 主要標籤導航器
- `/src/types/navigation.ts` - 導航類型定義

### 語音輸入參考
- `/src/screens/modals/CreateRecordModal.tsx` - 模式切換實作
- `/src/components/input/SimplifiedAudioInput.tsx` - 簡化錄音介面
- `/src/components/input/VoiceTaskInput.tsx` - 語音轉任務邏輯

### 首頁參考
- `/src/screens/dashboard/EnhancedDashboard.tsx` - 當前首頁實作
- `/src/stores/taskStore.ts` - 任務狀態管理
- `/src/stores/customerStore.ts` - 客戶狀態管理

## 注意事項

1. **保持一致性**：新的 UI 元件應遵循現有的設計系統
2. **效能考量**：任務列表需要優化查詢和渲染效能
3. **錯誤處理**：語音識別失敗時的優雅降級
4. **無障礙設計**：確保所有互動元素都有適當的標籤
5. **資料同步**：任務狀態更新需要即時同步到 Firebase

## 驗證標準

```bash
# 執行 TypeScript 檢查
npm run typecheck

# 執行 lint 檢查  
npm run lint

# 在模擬器測試
npm run ios
npm run android
```

## 成功指標
1. 從開啟應用到開始錄音的點擊次數減少到 1 次
2. 任務狀態更新可在首頁直接完成
3. 語音輸入介面填滿整個螢幕，提供更好的視覺反饋
4. 首頁載入速度提升（移除了統計計算）
5. 使用者可快速找到最近接觸的客戶

## 風險評估
- **中風險**：導航結構改變可能影響既有使用者習慣
- **低風險**：移除功能可能有使用者需要（可在設定中提供選項）
- **中風險**：語音識別依賴網路，離線時需要備案

## 實作優先順序
1. **P0**：新增 Task 標籤和語音輸入頁面
2. **P0**：優化語音輸入介面（全螢幕設計）
3. **P1**：首頁任務列表實作
4. **P1**：移除統計卡片和快速操作
5. **P2**：近期客戶列表實作
6. **P3**：動畫和過渡效果優化

---

**評分：8/10**
- 明確的實作步驟和程式碼參考
- 基於現有架構，降低實作風險
- 考慮了效能和使用者體驗
- 提供了具體的驗證標準