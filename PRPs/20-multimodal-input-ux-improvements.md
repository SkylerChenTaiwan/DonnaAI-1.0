# PRP-20: 多模態輸入系統 UX 改進

## Goal
改進多模態輸入系統的使用者體驗，讓主要和次要輸入方式有明顯區別，並確保每次開啟 + 按鈕介面時都重置到初始狀態，不記憶使用者的上次選擇。

## Why
- **簡化操作流程**: 減少點擊次數，讓使用者更快速地進入主要輸入方式
- **清晰的優先級**: 明確區分主要和次要輸入方式，引導使用者使用最合適的方法
- **一致的體驗**: 每次開啟都是全新的開始，避免使用者困惑於系統記住了什麼狀態
- **提升效率**: 大多數使用者使用主要輸入方式，直接顯示可節省時間

## What
修改現有的多模態輸入系統，實現以下改進：

### 主要改進項目：
1. **直接顯示主要輸入方式**
   - 點擊「客戶」後直接開啟表格填寫模式
   - 點擊「紀錄」後直接開啟語音錄製模式
   - 點擊「任務」後直接開啟語音輸入模式

2. **次要輸入方式作為連結**
   - 在主要輸入介面中添加切換連結
   - 客戶表格中添加「改用 CSV 匯入」連結
   - 紀錄錄音中添加「改用文字輸入」連結
   - 任務語音中添加「改用表格填寫」連結

3. **移除狀態記憶**
   - ActionPopover 每次關閉後重置所有狀態
   - 不記憶使用者上次的選擇
   - 每次開啟都從初始狀態開始

### Success Criteria
- [x] 點擊 + 按鈕選擇「客戶」後直接開啟表格填寫介面
- [x] 點擊 + 按鈕選擇「紀錄」後直接開啟語音錄製介面
- [x] 點擊 + 按鈕選擇「任務」後直接開啟語音輸入介面
- [x] 每個主要輸入介面都有明顯的連結可切換到次要方式
- [x] ActionPopover 關閉時清除所有內部狀態
- [x] 連結切換流暢，使用者體驗一致
- [x] 保持現有功能完整性，只改變流程

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- file: src/components/common/ActionPopover.tsx
  why: 需要修改兩階段選擇流程為直接導航
  
- file: src/screens/modals/CreateCustomerModal.tsx  
  why: 需要添加切換到 CSV 匯入的連結
  
- file: src/screens/modals/CreateRecordModal.tsx
  why: 需要添加切換到文字輸入的連結
  
- file: src/screens/modals/CreateTaskModal.tsx
  why: 需要添加切換到表格填寫的連結
  
- file: src/navigation/MainTabNavigator.tsx
  why: 了解 + 按鈕如何調用 ActionPopover
  
- file: src/navigation/types.ts
  why: 了解路由參數的類型定義
```

### Current Codebase tree
```bash
src/
├── components/
│   ├── common/
│   │   ├── ActionPopover.tsx          # 兩階段選擇介面
│   │   └── Button.tsx
│   ├── forms/
│   │   ├── CustomerForm.tsx
│   │   ├── RecordForm.tsx
│   │   └── TaskForm.tsx
│   └── input/
│       ├── CSVUploader.tsx
│       ├── AudioInput.tsx
│       └── VoiceTaskInput.tsx
├── screens/modals/
│   ├── CreateCustomerModal.tsx        # 支援表格/CSV 切換
│   ├── CreateRecordModal.tsx          # 支援語音/文字切換
│   └── CreateTaskModal.tsx            # 支援語音/表格切換
└── navigation/
    ├── MainTabNavigator.tsx           # 底部導航列
    └── types.ts                       # 路由類型定義
```

### Desired Codebase tree with files to be added and responsibility of file
```bash
src/
├── components/
│   ├── common/
│   │   ├── ActionPopover.tsx          # 修改：簡化為單階段選擇
│   │   └── ModeSwitch.tsx             # 新增：模式切換連結組件
│   └── modals/
│       └── InputMethodLink.tsx        # 新增：統一的輸入方式切換連結
└── screens/modals/
    ├── CreateCustomerModal.tsx        # 修改：移除標籤，添加連結
    ├── CreateRecordModal.tsx          # 修改：移除標籤，添加連結
    └── CreateTaskModal.tsx            # 修改：移除標籤，添加連結
```

### Known Gotchas & Library Quirks
```typescript
// CRITICAL: React Navigation 參數傳遞
// 當前系統使用 route.params.mode 來決定初始顯示模式
// 需要確保默認值正確設定

// CRITICAL: Modal 狀態管理
// Modal 組件使用內部 useState 來追踪當前模式
// 需要移除這個狀態，改為透過導航參數控制

// CRITICAL: ActionPopover 狀態重置
// 目前使用 selectedAction state 來追踪兩階段選擇
// 需要在 onClose 時確保重置這個狀態

// CRITICAL: 路由參數類型
// 確保 TypeScript 類型定義正確，避免編譯錯誤
```

## Implementation Blueprint

### Data models and structure

```typescript
// src/components/modals/InputMethodLink.tsx
interface InputMethodLinkProps {
  currentMode: string;
  targetMode: string;
  targetLabel: string;
  onSwitch: () => void;
}

// 更新路由參數類型
type CreateModalParams = {
  mode?: string;
  // 確保所有 Modal 都支援 mode 參數
}
```

### List of tasks to be completed in the order they should be completed

```yaml
Task 1: 建立通用的輸入方式切換連結組件
CREATE src/components/modals/InputMethodLink.tsx:
  - 創建統一的切換連結組件
  - 支援自定義文字和圖標
  - 統一的樣式和交互設計
  - 包含切換動畫效果

Task 2: 修改 ActionPopover 實現直接導航
MODIFY src/components/common/ActionPopover.tsx:
  - 移除兩階段選擇邏輯 (selectedAction state)
  - 修改 handleActionSelect 直接導航到對應 Modal
  - 為每個資料類型設定預設輸入方式
  - 在 onClose 時重置所有狀態
  - 簡化 UI 只顯示資料類型選擇

Task 3: 更新 CreateCustomerModal 介面
MODIFY src/screens/modals/CreateCustomerModal.tsx:
  - 移除頂部的模式切換標籤
  - 設定預設顯示表格填寫模式
  - 在表格上方添加 InputMethodLink 組件
  - 連結文字：「改用 CSV 批量匯入 →」
  - 點擊連結時重新導航並傳遞 mode='csv'

Task 4: 更新 CreateRecordModal 介面
MODIFY src/screens/modals/CreateRecordModal.tsx:
  - 移除頂部的模式切換標籤
  - 設定預設顯示語音錄製模式
  - 在錄音介面上方添加 InputMethodLink 組件
  - 連結文字：「改用文字輸入 →」
  - 點擊連結時重新導航並傳遞 mode='text'

Task 5: 更新 CreateTaskModal 介面
MODIFY src/screens/modals/CreateTaskModal.tsx:
  - 移除頂部的模式切換標籤
  - 設定預設顯示語音輸入模式
  - 在語音介面上方添加 InputMethodLink 組件
  - 連結文字：「改用表格填寫 →」
  - 點擊連結時重新導航並傳遞 mode='form'

Task 6: 優化連結切換體驗
UPDATE 所有 Modal 組件:
  - 確保切換時保持平滑過渡
  - 處理切換時的 loading 狀態
  - 保持一致的動畫效果
  - 測試往返切換的流暢性

Task 7: 處理邊緣情況和錯誤
ADD 錯誤處理:
  - 處理無效的 mode 參數
  - 確保默認值總是正確
  - 添加適當的 TypeScript 類型保護
  - 處理快速切換的情況
```

### Per task pseudocode

```typescript
// Task 1: InputMethodLink 組件
const InputMethodLink: React.FC<InputMethodLinkProps> = ({
  targetLabel,
  onSwitch
}) => {
  return (
    <TouchableOpacity 
      style={styles.switchLink}
      onPress={onSwitch}
    >
      <Text style={styles.switchText}>{targetLabel}</Text>
      <Ionicons name="arrow-forward" size={16} color="#FF6B35" />
    </TouchableOpacity>
  );
};

// Task 2: 修改 ActionPopover
const handleActionSelect = useCallback((action: Action) => {
  // 直接導航，不再有第二階段選擇
  onClose(); // 立即關閉 Popover
  
  switch (action.type) {
    case 'customer':
      navigation.navigate('CreateCustomerModal', { mode: 'form' });
      break;
    case 'record':
      navigation.navigate('CreateRecordModal', { mode: 'audio' });
      break;
    case 'task':
      navigation.navigate('CreateTaskModal', { mode: 'voice' });
      break;
  }
}, [navigation, onClose]);

// 確保關閉時重置狀態
useEffect(() => {
  if (!visible) {
    // 重置任何內部狀態
    setSelectedAction(null);
  }
}, [visible]);

// Task 3: 更新 CreateCustomerModal
const CreateCustomerModal = () => {
  const route = useRoute();
  const navigation = useNavigation();
  
  // 從路由獲取模式，默認為表格
  const mode = route.params?.mode || 'form';
  
  const switchToCSV = () => {
    // 重新導航到同一個 Modal，但使用不同模式
    navigation.setParams({ mode: 'csv' });
  };
  
  const switchToForm = () => {
    navigation.setParams({ mode: 'form' });
  };
  
  return (
    <Layout>
      <Header title="新增客戶" />
      
      {mode === 'form' ? (
        <>
          <InputMethodLink
            targetLabel="改用 CSV 批量匯入 →"
            onSwitch={switchToCSV}
          />
          <CustomerForm />
        </>
      ) : (
        <>
          <InputMethodLink
            targetLabel="改用表格填寫 →"
            onSwitch={switchToForm}
          />
          <CSVUploader />
        </>
      )}
    </Layout>
  );
};
```

### Integration Points
```yaml
NAVIGATION:
  - 更新路由參數傳遞邏輯
  - 確保 Modal 能接收和處理 mode 參數
  - 處理參數變化時的重新渲染

UI/UX:
  - 統一切換連結的視覺設計
  - 保持與現有 UI 風格一致
  - 添加適當的過渡動畫

STATE_MANAGEMENT:
  - 移除 Modal 內部的模式狀態
  - 依賴路由參數作為唯一真相來源
  - 確保狀態不會意外持久化
```

## Validation Loop

### Level 1: Syntax & Style  
```bash
# 執行 TypeScript 編譯檢查
npm run type-check

# 執行 ESLint 檢查
npm run lint

# 預期：無錯誤，如有錯誤需修復後繼續
```

### Level 2: Component Tests
```typescript
// 測試 ActionPopover 直接導航
describe('ActionPopover', () => {
  test('點擊客戶直接導航到表格模式', () => {
    const mockNavigate = jest.fn();
    const { getByText } = render(
      <ActionPopover visible={true} onClose={jest.fn()} />
    );
    
    fireEvent.press(getByText('客戶'));
    
    expect(mockNavigate).toHaveBeenCalledWith(
      'CreateCustomerModal', 
      { mode: 'form' }
    );
  });
  
  test('關閉時重置所有狀態', () => {
    const { rerender } = render(
      <ActionPopover visible={true} onClose={jest.fn()} />
    );
    
    // 關閉 Popover
    rerender(<ActionPopover visible={false} onClose={jest.fn()} />);
    
    // 重新開啟應該是全新狀態
    rerender(<ActionPopover visible={true} onClose={jest.fn()} />);
    
    // 驗證沒有殘留狀態
  });
});

// 測試 Modal 切換功能
describe('CreateCustomerModal', () => {
  test('顯示切換到 CSV 的連結', () => {
    const { getByText } = render(<CreateCustomerModal />);
    
    expect(getByText('改用 CSV 批量匯入 →')).toBeTruthy();
  });
  
  test('點擊連結切換到 CSV 模式', () => {
    const { getByText, queryByTestId } = render(<CreateCustomerModal />);
    
    fireEvent.press(getByText('改用 CSV 批量匯入 →'));
    
    expect(queryByTestId('csv-uploader')).toBeTruthy();
    expect(queryByTestId('customer-form')).toBeFalsy();
  });
});
```

### Level 3: Integration Test
```bash
# 啟動開發伺服器
npm start

# 手動測試流程：
# 1. 點擊 + 按鈕
# 2. 選擇「客戶」- 應直接開啟表格填寫
# 3. 點擊「改用 CSV 批量匯入」- 應切換到 CSV 介面
# 4. 關閉 Modal
# 5. 再次點擊 + 按鈕 - 應重置到初始狀態
# 6. 重複測試「紀錄」和「任務」功能

# 預期：所有切換流暢，無狀態殘留
```

## Final validation Checklist
- [ ] 所有測試通過：`npm test`
- [ ] 無 TypeScript 錯誤：`npm run type-check`
- [ ] 無 ESLint 警告：`npm run lint`
- [ ] 點擊資料類型直接進入主要輸入方式
- [ ] 切換連結正常運作
- [ ] ActionPopover 每次都從初始狀態開始
- [ ] 沒有意外的狀態持久化
- [ ] UI 過渡動畫流暢
- [ ] 保持所有現有功能正常運作

---

## Anti-Patterns to Avoid
- ❌ 不要在 Modal 內部儲存模式狀態
- ❌ 不要在 ActionPopover 中保留選擇記憶
- ❌ 不要使用 AsyncStorage 儲存臨時選擇
- ❌ 不要破壞現有的功能
- ❌ 不要忽略 TypeScript 類型錯誤
- ❌ 不要讓切換造成數據丟失

## PRP 信心評分
**評分: 9.0/10**

這個 PRP 具有非常高的實作成功信心，因為：
- ✅ 改動範圍明確且集中
- ✅ 不涉及複雜的狀態管理
- ✅ 基於現有的成熟組件
- ✅ 有清晰的實作步驟
- ✅ 風險低，主要是 UI 層面的調整

小幅扣分原因：
- ⚠️ 需要確保所有邊緣情況都被處理
- ⚠️ 切換動畫可能需要微調以達到最佳體驗