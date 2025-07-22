# PRP-24: 修復任務建立介面和驗證問題

## 目標
修復任務建立流程中的三個主要問題：
1. 移除重複的語音/文字輸入切換標籤
2. 實作適當的表單控件（日期選擇器、下拉選單）
3. 修復「已排程任務必須指定時間」的驗證錯誤

## 背景與問題分析

### 現有問題
1. **重複的切換介面**：CreateTaskModal 已經有語音/文字切換，但 TaskForm 內部又有一個標籤切換
2. **表單輸入不友善**：所有欄位都是文字輸入，包括日期和選項類型
3. **任務類型錯誤**：預設建立 'scheduled' 類型但不提供 scheduledAt 欄位

### 相關檔案
- `/src/screens/modals/CreateTaskModal.tsx` - 主要的任務建立 Modal
- `/src/components/forms/TaskForm.tsx` - 任務表單元件
- `/src/components/forms/FormField.tsx` - 表單欄位元件
- `/src/services/firebase/tasks.ts` - 任務建立邏輯和驗證
- `/src/types/task.ts` - 任務類型定義

## 實作計畫

### 階段 1: 移除重複的標籤導航

#### 1.1 修改 TaskForm 元件
```typescript
// TaskForm.tsx - 移除內部的標籤切換
// 新增 prop 來控制是否顯示切換選項
interface TaskFormProps {
  // ... existing props
  hideInputToggle?: boolean; // 新增
}

// 在 render 中條件渲染切換連結
{!hideInputToggle && (
  <TouchableOpacity onPress={switchToVoice}>
    {/* 切換連結 */}
  </TouchableOpacity>
)}
```

#### 1.2 更新 CreateTaskModal
```typescript
// CreateTaskModal.tsx
<TaskForm 
  ref={formRef}
  onSubmit={handleFormSubmit}
  hideInputToggle={true} // 隱藏內部切換
  // ... other props
/>
```

### 階段 2: 實作適當的表單控件

#### 2.1 擴展 FormField 元件支援不同輸入類型
```typescript
// FormField.tsx
interface FormFieldProps {
  // ... existing props
  type?: 'text' | 'date' | 'select' | 'multiline';
  options?: Array<{ label: string; value: string }>;
  onDateChange?: (date: Date) => void;
}

// 根據 type 渲染不同控件
const renderInput = () => {
  switch (type) {
    case 'date':
      return <DateTimePicker ... />;
    case 'select':
      return <Picker ... />;
    case 'multiline':
      return <TextInput multiline ... />;
    default:
      return <TextInput ... />;
  }
};
```

#### 2.2 安裝必要的依賴
```bash
# 日期選擇器
expo install @react-native-community/datetimepicker

# 下拉選單（如果需要）
expo install @react-native-picker/picker
```

#### 2.3 更新 TaskForm 使用新的控件
```typescript
// TaskForm.tsx
<FormField
  label="截止日期"
  name="dueDate"
  type="date"
  control={control}
  placeholder="選擇截止日期"
/>

<FormField
  label="優先級"
  name="priority"
  type="select"
  control={control}
  options={[
    { label: '低', value: '低' },
    { label: '中', value: '中' },
    { label: '高', value: '高' },
  ]}
/>

<FormField
  label="狀態"
  name="status"
  type="select"
  control={control}
  options={[
    { label: '待辦', value: '待辦' },
    { label: '進行中', value: '進行中' },
    { label: '已完成', value: '已完成' },
  ]}
/>
```

### 階段 3: 修復任務類型驗證

#### 3.1 更新預設任務類型
```typescript
// CreateTaskModal.tsx - 第 71 行
const taskData: TaskCreateRequest = {
  title: data.title,
  description: data.description || '',
  type: 'unscheduled', // 改為 unscheduled 作為預設
  // ... rest of the data
};
```

#### 3.2 新增任務類型選擇（可選）
```typescript
// TaskForm.tsx - 新增任務類型欄位
<FormField
  label="任務類型"
  name="taskType"
  type="select"
  control={control}
  options={[
    { label: '一次性任務', value: 'unscheduled' },
    { label: '排程任務', value: 'scheduled' },
    { label: '待定任務', value: 'pending' },
  ]}
/>

// 如果選擇 scheduled，顯示時間選擇器
{watch('taskType') === 'scheduled' && (
  <FormField
    label="排程時間"
    name="scheduledAt"
    type="datetime"
    control={control}
    required
  />
)}
```

### 階段 4: 優化表單驗證

#### 4.1 更新表單 Schema
```typescript
// form-schemas.ts
export const taskFormSchema = z.object({
  title: z.string().min(1, '請輸入任務標題'),
  description: z.string().optional(),
  taskType: z.enum(['scheduled', 'unscheduled', 'pending']).default('unscheduled'),
  priority: z.enum(['低', '中', '高']).default('中'),
  status: z.enum(['待辦', '進行中', '已完成']).default('待辦'),
  dueDate: z.date().optional(),
  scheduledAt: z.date().optional(),
  // ... other fields
}).refine((data) => {
  // 如果是 scheduled 類型，必須有 scheduledAt
  if (data.taskType === 'scheduled' && !data.scheduledAt) {
    return false;
  }
  return true;
}, {
  message: '排程任務必須指定時間',
  path: ['scheduledAt'],
});
```

## 測試計畫

### 單元測試
```typescript
// TaskForm.test.tsx
describe('TaskForm', () => {
  it('should hide input toggle when hideInputToggle is true', () => {
    const { queryByText } = render(<TaskForm hideInputToggle={true} />);
    expect(queryByText('改用語音輸入')).toBeNull();
  });

  it('should render date picker for dueDate field', () => {
    // 測試日期選擇器
  });

  it('should render select for priority field', () => {
    // 測試下拉選單
  });
});
```

### 整合測試
1. 測試從 CreateTaskModal 建立任務的完整流程
2. 確認各種輸入類型都能正常工作
3. 驗證不同任務類型的建立

## 實作順序
1. **階段 1**：移除重複標籤（30 分鐘）
2. **階段 2**：實作表單控件（2 小時）
3. **階段 3**：修復驗證邏輯（1 小時）
4. **階段 4**：優化和測試（1 小時）

## 驗證檢查點

### 編譯和類型檢查
```bash
# TypeScript 檢查
npm run type-check

# ESLint 檢查
npm run lint
```

### 功能驗證
1. ✅ CreateTaskModal 中只有一個語音/文字切換
2. ✅ 日期欄位顯示日期選擇器
3. ✅ 優先級和狀態顯示下拉選單
4. ✅ 可以成功建立各種類型的任務
5. ✅ 表單驗證正確運作

## 注意事項
1. **日期格式**：確保日期選擇器返回的格式與 Firebase Timestamp 相容
2. **樣式一致性**：新控件要符合現有的 Notion 風格設計
3. **無障礙性**：確保所有控件都有適當的標籤和提示
4. **錯誤處理**：顯示清楚的錯誤訊息

## 參考資源
- [React Native DateTimePicker 文檔](https://github.com/react-native-datetimepicker/datetimepicker)
- [React Native Picker 文檔](https://github.com/react-native-picker/picker)
- 現有表單範例：`/src/components/forms/CustomerForm.tsx`

## 成功標準
- 使用者可以輕鬆填寫所有表單欄位
- 沒有重複或混淆的介面元素
- 可以成功建立各種類型的任務
- 表單驗證提供清晰的錯誤提示

**實作信心分數：8/10**
- 扣分原因：需要整合第三方日期選擇器元件，可能有樣式調整需求