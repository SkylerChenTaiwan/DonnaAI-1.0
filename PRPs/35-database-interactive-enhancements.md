# PRP-35: 資料庫互動功能增強

## Goal
實現資料庫和人事管理頁面的完整互動功能，包括編輯狀態視覺回饋、即時儲存機制、動態表單生成、權限檢查和使用者建立功能，同時修正編輯模式的視覺問題，提升整體使用體驗和功能完整性。

## Why
- **功能完整性問題**: 現有按鈕缺乏實際功能，影響使用者體驗
- **視覺回饋不足**: 編輯狀態缺乏明確的視覺指示
- **權限管理需求**: 確保只有授權使用者能執行敏感操作
- **工作流程中斷**: 使用者無法完成新增記錄和管理下屬的基本任務
- **儲存流程冗餘**: 批次儲存模式需要額外步驟，影響編輯效率
- **編輯視覺問題**: 編輯模式會改變儲存格寬度，造成佈局跳動

## What
實現六個核心功能增強：
1. 編輯按鈕互動時顯示橘色背景，提供清晰的視覺回饋
2. 優化新增記錄按鈕尺寸，並實現動態表單生成功能
3. 實現人事頁面新增下屬功能，包含權限檢查和使用者建立流程
4. 統一所有資料庫頁面的互動體驗
5. 改為即時儲存模式，編輯完成後立即儲存，移除批次儲存按鈕
6. 修正編輯模式儲存格寬度變化問題，保持表格佈局穩定

### Success Criteria
- [ ] 所有資料庫的編輯按鈕在按下時顯示橘色背景
- [ ] 新增記錄按鈕高度減半（從現在的44px減至22px），寬度與表格一致
- [ ] 點擊新增記錄按鈕彈出動態生成的表單，基於資料庫欄位定義
- [ ] 人事頁面「新增下屬」按鈕實現完整的使用者建立流程
- [ ] 權限檢查：無權限使用者看到適當的錯誤提示
- [ ] 所有表單支援驗證、儲存和錯誤處理
- [ ] 新建記錄成功後自動重新整理列表
- [ ] 編輯儲存格後按下確認（✓）立即儲存，無需額外點擊儲存按鈕
- [ ] 編輯模式不改變儲存格寬度，表格佈局保持穩定

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- file: /Users/skyler/coding/DonnaAI-1.0/src/components/common/EditableCell.tsx
  why: 現有編輯狀態實現，需要加入橘色按下狀態

- file: /Users/skyler/coding/DonnaAI-1.0/src/components/common/AddRowButton.tsx  
  why: 需要調整高度並加入點擊功能

- file: /Users/skyler/coding/DonnaAI-1.0/src/components/common/EditableDataTable.tsx
  why: 表格欄位定義，用於動態表單生成，包含儲存模式設定

- file: /Users/skyler/coding/DonnaAI-1.0/src/screens/database/DatabaseScreen.tsx
  why: 資料庫頁面實現，需要切換儲存模式從batch到realtime

- file: /Users/skyler/coding/DonnaAI-1.0/src/screens/personnel/TableView.tsx
  why: 人事頁面「新增下屬」按鈕實現

- file: /Users/skyler/coding/DonnaAI-1.0/src/services/firebase/auth.ts
  why: 使用者建立服務，包含 Firebase Auth 和 Firestore 操作

- file: /Users/skyler/coding/DonnaAI-1.0/src/services/firebase/permissions.ts
  why: 權限檢查服務，特別是 isManagerOfTeam 和 isOrgAdmin

- file: /Users/skyler/coding/DonnaAI-1.0/src/components/forms/FormField.tsx
  why: 動態表單欄位元件，支援多種輸入類型

- file: /Users/skyler/coding/DonnaAI-1.0/src/screens/modals/CreateTaskModal.tsx
  why: Modal 實現模式，使用 React Navigation

- file: /Users/skyler/coding/DonnaAI-1.0/src/theme/colors.ts
  why: 橘色系統定義和按鈕顏色配置

- url: https://docs.expo.dev/versions/latest/sdk/modal/
  why: React Native Modal 元件文檔

- url: https://reactnavigation.org/docs/modal/
  why: React Navigation Modal 實現模式

- url: https://firebase.google.com/docs/auth/web/manage-users
  why: Firebase Auth 使用者管理 API
```

### Current Issue Analysis
```typescript
// 問題 1: EditableCell 缺乏橘色按下狀態
// 位置: EditableCell.tsx line 175-178
<TouchableOpacity
  style={[styles.cellContainer, error && styles.cellError]}
  onPress={disabled ? onPress : onStartEdit}
  activeOpacity={disabled ? 1 : 0.7}  // 只有透明度變化，缺乏顏色回饋
>

// 問題 2: AddRowButton 高度過高且無功能
// 位置: AddRowButton.tsx line 76
minHeight: 44, // 需要減半至 22
// onPress 回調存在但未實現實際功能

// 問題 3: 表格欄位定義與表單生成脫節
// 位置: DatabaseScreen.tsx - 欄位定義存在但未用於表單生成
const customerColumns: TableColumn[] = [
  { key: 'name', title: '姓名', sortable: true },
  { key: 'company', title: '公司', sortable: true },
  // 需要映射到表單欄位
];

// 問題 4: 人事頁面按鈕無功能
// 位置: TableView.tsx line 155-160
<TouchableOpacity style={styles.addButton} onPress={() => {
  console.log('新增下屬功能暫未實現');  // 僅有 console.log
}}>

// 問題 5: 批次儲存模式需要額外步驟
// 位置: DatabaseScreen.tsx line 800
saveMode="batch"  // 使用批次儲存，產生額外的儲存按鈕步驟
// EditableDataTable.tsx line 427-452
{saveMode === 'batch' && showSaveButton && pendingChanges.size > 0 && (
  <View style={styles.saveBar}>  // 黃色儲存提示條
    <Text>1 個未儲存的變更</Text>
    <TouchableOpacity onPress={handleBatchSave}>
      <Text>儲存</Text>
    </TouchableOpacity>
  </View>
)}

// 問題 6: 編輯模式改變儲存格寬度
// 位置: EditableCell.tsx line 206-213
floatingEditContainer: {
  position: 'absolute',
  top: -8,
  left: -8,
  right: -60,  // 預留操作按鈕空間，影響寬度
  zIndex: 1000,
  // 絕對定位脫離文檔流，造成佈局跳動
}
```

### Desired Codebase Changes
```bash
# 需要修改的檔案:
src/components/common/EditableCell.tsx       # 加入橘色按下狀態
src/components/common/AddRowButton.tsx       # 調整高度，加入功能回調
src/components/database/AddRecordModal.tsx   # 新建：動態表單Modal
src/components/personnel/AddUserModal.tsx    # 新建：新增使用者Modal
src/screens/database/DatabaseScreen.tsx     # 整合新增功能
src/screens/personnel/TableView.tsx         # 整合新增下屬功能
src/utils/formGenerator.ts                  # 新建：表格轉表單工具
```

### Known Gotchas & Current Implementation Details
```typescript
// CRITICAL: 專案使用 React Navigation 的 modal 模式
// 位置: CreateTaskModal.tsx - 使用 navigation.navigate('CreateTaskModal')
// 而非傳統的 Modal 元件

// CRITICAL: 權限系統使用快取機制
// 位置: permissions.ts - 5分鐘 TTL，需要考慮快取失效

// GOTCHA: 表格欄位類型需要映射到表單輸入類型
// text -> TextInput, date -> DatePicker, select -> Picker

// GOTCHA: Firebase 使用者建立需要同時處理
// 1. Firebase Auth (createUserWithEmailAndPassword)
// 2. Firestore users collection
// 3. 組織和團隊關聯

// CRITICAL: EditableCell 使用絕對定位的漂浮編輯框
// 橘色狀態需要應用到正確的容器，不能影響定位

// GOTCHA: AddRowButton 支援 left/center alignment
// 高度調整不能破壞現有的對齊邏輯

// CRITICAL: 儲存模式切換需要考慮現有邏輯
// 位置: EditableDataTable - saveMode prop 影響多個元件行為
// 批次模式: 顯示儲存條、累積變更、批次提交
// 即時模式: 每次編輯後立即儲存、顯示小型儲存指示器

// GOTCHA: 漂浮編輯框的絕對定位問題
// 使用 position: 'absolute' 會脫離文檔流
// right: -60 會影響父容器的計算寬度
// 需要確保編輯框不影響表格佈局
```

## Implementation Blueprint

### Data Models and Structure
```typescript
// 表單欄位映射配置
interface FormFieldConfig {
  key: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'date' | 'select' | 'textarea';
  required: boolean;
  placeholder?: string;
  options?: string[]; // for select type
  validation?: (value: string) => string | null;
}

// 新增記錄Modal Props
interface AddRecordModalProps {
  visible: boolean;
  tableType: 'customers' | 'records' | 'tasks';
  columns: TableColumn[];
  onClose: () => void;
  onSubmit: (data: Record<string, any>) => Promise<void>;
}

// 新增使用者Modal Props  
interface AddUserModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (userData: {
    email: string;
    name: string;
    role: 'salesperson' | 'manager';
    teamId?: string;
  }) => Promise<void>;
}
```

### List of Tasks to Complete (In Order)
```yaml
Task 1 - 實現編輯按鈕橘色按下狀態:
  MODIFY src/components/common/EditableCell.tsx:
    - FIND TouchableOpacity 在 line 170-178
    - ADD 新的按下狀態樣式 pressedCellContainer
    - IMPORT colors.orange 和 colors.orangeBackground
    - IMPLEMENT onPressIn/onPressOut 狀態管理
    - PRESERVE 現有的錯誤狀態和 disabled 邏輯

Task 2 - 調整新增記錄按鈕高度:
  MODIFY src/components/common/AddRowButton.tsx:
    - FIND minHeight: 44 在 styles.addButton
    - CHANGE minHeight 從 44 到 22
    - ENSURE paddingVertical 相應調整保持視覺平衡
    - PRESERVE 所有現有的 alignment 和 showGuideIcon 功能

Task 3 - 切換至即時儲存模式:
  MODIFY src/screens/database/DatabaseScreen.tsx:
    - FIND saveMode="batch" 在 line 800
    - CHANGE 從 "batch" 到 "realtime"
    - ENSURE 所有三個 EditableDataTable 使用即時儲存
    - VERIFY onSave 回調正確處理即時儲存

Task 4 - 修正編輯模式儲存格寬度問題:
  MODIFY src/components/common/EditableCell.tsx:
    - MODIFY floatingEditContainer 樣式
    - REMOVE right: -60 避免影響父容器寬度
    - ADJUST 漂浮編輯框定位策略
    - ENSURE 操作按鈕仍然可見且不被遮擋
    - PRESERVE 現有的視覺層次和 z-index

Task 5 - 建立表格轉表單工具:
  CREATE src/utils/formGenerator.ts:
    - IMPLEMENT columnToFormField 轉換函數
    - SUPPORT 常見欄位類型映射 (name->text, email->email, date->date)
    - INCLUDE 預設驗證規則 (email格式, 必填欄位)
    - HANDLE 特殊欄位類型 (select, textarea)

Task 6 - 建立動態新增記錄Modal:
  CREATE src/components/database/AddRecordModal.tsx:
    - MIRROR 模式來自 CreateTaskModal.tsx
    - USE React Navigation modal 模式
    - INTEGRATE FormField 元件動態渲染
    - IMPLEMENT 表單驗證和提交邏輯
    - HANDLE 載入狀態和錯誤提示

Task 7 - 建立新增使用者Modal:
  CREATE src/components/personnel/AddUserModal.tsx:
    - MIRROR 模式來自 AddRecordModal.tsx
    - INCLUDE 使用者特定欄位 (email, name, role)
    - INTEGRATE 權限檢查邏輯
    - IMPLEMENT Firebase Auth 和 Firestore 建立流程
    - HANDLE 權限錯誤和建立失敗情況

Task 8 - 整合資料庫頁面新增功能:
  MODIFY src/screens/database/DatabaseScreen.tsx:
    - ADD AddRecordModal 狀態管理
    - IMPLEMENT onAddRow 回調函數  
    - CONNECT 表格欄位定義到 Modal
    - ENSURE 新增成功後重新整理列表

Task 9 - 整合人事頁面新增下屬功能:
  MODIFY src/screens/personnel/TableView.tsx:
    - REPLACE console.log 在 addButton onPress
    - ADD AddUserModal 狀態管理
    - IMPLEMENT 權限檢查在按鈕點擊時
    - SHOW 權限錯誤Alert或Modal狀態
    - HANDLE 新增成功後重新整理團隊列表

Task 10 - 更新 EditableDataTable 整合:
  MODIFY src/components/common/EditableDataTable.tsx:
    - CONNECT AddRowButton onPress 到父元件回調
    - ENSURE 所有使用 EditableDataTable 的地方支援新增功能
    - MAINTAIN 向後相容性與現有 API
    - REMOVE 批次儲存相關的UI元素（儲存條）
```

### Per Task Implementation Details

```typescript
// Task 1 - 橘色按下狀態實現
const EditableCell = ({ ... }) => {
  const [isPressed, setIsPressed] = useState(false);
  
  return (
    <TouchableOpacity
      style={[
        styles.cellContainer,
        error && styles.cellError,
        isPressed && styles.pressedCellContainer  // 新增
      ]}
      onPressIn={() => setIsPressed(true)}        // 新增
      onPressOut={() => setIsPressed(false)}      // 新增
      onPress={disabled ? onPress : onStartEdit}
    >
  );
};

const styles = StyleSheet.create({
  pressedCellContainer: {
    backgroundColor: colors.orangeBackground,  // 橘色背景
    borderRadius: 4,
  },
});

// Task 3 - 切換至即時儲存模式
// DatabaseScreen.tsx
<EditableDataTable
  data={filteredData}
  columns={columns}
  onSave={handleSave}
  saveMode="realtime"  // 改為即時儲存
  showSaveButton={false}  // 不顯示儲存按鈕
  // ... 其他 props
/>

// Task 4 - 修正編輯模式寬度問題
const styles = StyleSheet.create({
  floatingEditContainer: {
    position: 'absolute',
    top: -8,
    left: -8,
    width: '100%',  // 使用固定寬度而非 right: -60
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
  },
  floatingActions: {
    position: 'absolute',
    right: -50,  // 將按鈕定位在編輯框外部
    flexDirection: 'row',
    gap: 4,
  },
});

// Task 5 - 表格轉表單工具
export const columnToFormField = (column: TableColumn): FormFieldConfig => {
  const fieldType = inferFieldType(column.key, column.title);
  return {
    key: column.key,
    label: column.title,
    type: fieldType,
    required: isRequiredField(column.key),
    placeholder: generatePlaceholder(column.title, fieldType),
    validation: createValidator(fieldType, column.key),
  };
};

// Task 6 - Modal 實現模式
const AddRecordModal = ({ tableType, columns, onSubmit }) => {
  const formFields = useMemo(() => 
    columns.map(columnToFormField), [columns]
  );
  
  const handleSubmit = async (formData: Record<string, any>) => {
    try {
      setLoading(true);
      await onSubmit(formData);
      navigation.goBack(); // 關閉 modal
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
};
```

### Integration Points
```yaml
NAVIGATION:
  - add: AddRecordModal 和 AddUserModal 到 navigation stack
  - pattern: modal presentation style
  
PERMISSIONS:
  - check: isManagerOfTeam() 在新增下屬時
  - check: canCreateRecords() 在新增記錄時
  - fallback: 顯示適當的錯誤訊息
  
FIREBASE:
  - integrate: 現有的 createUser 服務
  - integrate: 現有的 createCustomer/Record/Task 服務
  - ensure: 錯誤處理和重試邏輯
  
STYLING:
  - use: 現有的 colors.orange 系統
  - maintain: 設計系統一致性
  - ensure: 無障礙性 (minimum touch targets)
```

## Validation Loop

### Level 1: Visual Validation
```bash
# 手動視覺檢查步驟:
npm start

# 測試檢查項目:
# 1. 資料庫頁面 - 點擊編輯按鈕是否顯示橘色背景
# 2. 新增記錄按鈕 - 高度是否減半，寬度是否與表格一致
# 3. 點擊新增記錄按鈕 - 是否彈出對應的表單Modal
# 4. 人事頁面 - 點擊新增下屬是否有權限檢查和表單

# 權限測試:
# 1. 以 salesperson 身分登入，點擊新增下屬應顯示權限錯誤
# 2. 以 manager 身分登入，點擊新增下屬應顯示表單
```

### Level 2: Functionality Testing
```bash
# 功能性測試:
# 1. 表單驗證 - 提交空表單應顯示錯誤
# 2. 表單提交 - 填寫正確資料應成功建立記錄
# 3. 列表更新 - 新增成功後應自動重新整理列表
# 4. 錯誤處理 - 網路錯誤應顯示適當訊息

# Modal 測試:
# 1. Modal 開啟/關閉功能正常
# 2. 返回鍵或點擊外部能正確關閉
# 3. 載入狀態正確顯示
```

### Level 3: Code Quality
```bash
# 執行代碼檢查:
npm run lint                    # ESLint 風格檢查
npm run type-check             # TypeScript 類型檢查

# 預期結果: 無錯誤，所有新元件符合專案標準

# 執行現有測試:
npm run test                   # 確保沒有破壞現有功能
```

## Final Validation Checklist
- [ ] 編輯按鈕在所有資料庫頁面都有橘色按下效果
- [ ] 新增記錄按鈕高度22px，寬度與表格一致
- [ ] 新增記錄功能完整：表單生成、驗證、提交、列表更新
- [ ] 新增下屬功能完整：權限檢查、使用者建立、錯誤處理
- [ ] 所有Modal使用一致的設計語言
- [ ] 權限檢查正確運作，無權限時顯示清楚訊息
- [ ] 錯誤處理完善，網路問題或驗證錯誤都有適當回饋
- [ ] 無障礙性符合標準，觸控目標足夠大
- [ ] 不破壞現有功能和API相容性
- [ ] 編輯完成後按下✓立即儲存，不再顯示批次儲存條
- [ ] 編輯模式不改變儲存格寬度，表格佈局保持穩定
- [ ] 即時儲存模式正常運作，顯示小型儲存指示器

---

## Anti-Patterns to Avoid
- ❌ 不要使用硬編碼的表單欄位 - 必須從表格定義動態生成
- ❌ 不要忽略權限檢查 - 每個敏感操作都需要驗證
- ❌ 不要使用傳統Modal元件 - 使用React Navigation的modal模式
- ❌ 不要忽略載入和錯誤狀態 - 使用者需要清楚的回饋
- ❌ 不要破壞現有的EditableCell漂浮編輯框 - 橘色狀態不能影響定位
- ❌ 不要讓按鈕高度調整影響觸控目標 - 確保仍符合無障礙標準
- ❌ 不要保留批次儲存相關的UI元素 - 即時儲存不需要儲存條
- ❌ 不要使用會影響父容器的絕對定位 - 使用固定寬度而非負值right
- ❌ 不要忽略即時儲存的錯誤處理 - 網路失敗時需要適當回饋

## Quality Score: 9/10
**信心等級**: 極高信心。所有必要的模式和服務都已存在於專案中，主要是整合和擴展現有功能。儲存模式切換和寬度修正都是簡單的配置更改。最大挑戰是動態表單生成的正確實現和權限系統的整合，但都有清楚的實現路徑和參考範例。新增的即時儲存和寬度修正使整體實現更加簡潔高效。