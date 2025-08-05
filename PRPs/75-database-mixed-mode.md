# PRP: 資料庫混合模式實作

## 概述
將現有的即時編輯表格改為混合模式：表格為唯讀檢視，編輯使用表單，批量操作使用 CSV 匯入/匯出。保持現有 UI 外觀不變。

## 目標
1. 簡化資料同步邏輯，移除複雜的草稿系統
2. 提升使用者體驗的可預測性
3. 保持現有的 Notion 風格 UI
4. 利用已有的表單和 CSV 元件

## 現有架構分析

### 相關檔案
- **表格元件**: `/src/components/database/notion/NotionTable.tsx`
- **草稿系統**: `/src/hooks/useNotionDraftSystem.ts` (將被簡化)
- **表單元件**: `/src/components/forms/CustomerForm.tsx` (已存在)
- **編輯 Modal**: `/src/screens/modals/EditCustomerModal.tsx` (已存在)
- **CSV 匯入**: `/src/components/input/CSVUploader.tsx` (已存在)
- **匯出功能**: `/src/components/database/ExportOptions.tsx` (已存在)
- **主畫面**: `/src/screens/database/DatabaseScreen.tsx`

### 現有模式參考
```typescript
// 目前的編輯 Modal 使用方式 (EditCustomerModal.tsx)
navigation.navigate('EditCustomer', { customerId });

// 目前的表單驗證 (CustomerForm.tsx)
useForm<CustomerFormData>({
  resolver: zodResolver(CustomerFormSchema),
  defaultValues: initialData
});

// CSV 匯入使用方式
<CSVUploader 
  dataType="customer"
  onComplete={(customers) => {...}}
/>
```

## 實作計畫

### 階段一：修改 NotionTable 為唯讀模式

1. **移除編輯功能** (`/src/components/database/notion/NotionTable.tsx`)
   ```typescript
   // 移除或註解這些 props
   // onCellUpdate?: (rowId: string, columnKey: string, value: any) => void;
   
   // 修改 TableCell 為唯讀
   const TableCell = ({ value, column, rowId }) => {
     // 移除 onClick 和編輯邏輯
     return (
       <div className="notion-table-cell">
         {/* 只顯示值，不處理編輯 */}
         {renderCellValue(value, column)}
       </div>
     );
   };
   ```

2. **加入列操作按鈕**
   ```typescript
   // 在每列最後加入操作欄
   const actionColumn = {
     id: '_actions',
     title: '',
     width: 100,
     render: (row) => (
       <View style={styles.rowActions}>
         <TouchableOpacity onPress={() => handleEdit(row.id)}>
           <Icon name="edit" size={16} />
         </TouchableOpacity>
         <TouchableOpacity onPress={() => handleDelete(row.id)}>
           <Icon name="trash" size={16} />
         </TouchableOpacity>
       </View>
     )
   };
   ```

### 階段二：整合編輯表單

1. **修改 DatabaseScreen.tsx**
   ```typescript
   // 處理編輯按鈕點擊
   const handleEdit = useCallback((customerId: string) => {
     navigation.navigate('EditCustomer', { customerId });
   }, [navigation]);
   
   // 處理新增按鈕
   const handleAddNew = useCallback(() => {
     navigation.navigate('CreateCustomerModal', { mode: 'form' });
   }, [navigation]);
   ```

2. **確保 Modal 正確關閉後重新載入資料**
   ```typescript
   // 在 EditCustomerModal 成功後
   const handleSave = async () => {
     await updateCustomer(customerId, formData);
     showToast('success', '客戶資料已更新');
     navigation.goBack();
     // 資料會透過 Firebase 訂閱自動更新
   };
   ```

### 階段三：加入批量操作

1. **在工具列加入匯入/匯出按鈕**
   ```typescript
   const DatabaseToolbar = () => (
     <View style={styles.toolbar}>
       <SearchBar {...searchProps} />
       <View style={styles.toolbarActions}>
         <TouchableOpacity onPress={handleImport}>
           <Icon name="upload" /> 匯入 CSV
         </TouchableOpacity>
         <TouchableOpacity onPress={handleExport}>
           <Icon name="download" /> 匯出
         </TouchableOpacity>
       </View>
     </View>
   );
   ```

2. **實作匯入/匯出邏輯**
   ```typescript
   const [showImportModal, setShowImportModal] = useState(false);
   const [showExportModal, setShowExportModal] = useState(false);
   
   const handleImport = () => setShowImportModal(true);
   const handleExport = () => setShowExportModal(true);
   ```

### 階段四：簡化同步邏輯

1. **移除 useNotionDraftSystem 的使用**
   ```typescript
   // DatabaseScreen.tsx - 移除草稿系統
   // 直接使用 store 的資料
   const { customers, isLoading } = useCustomerStore();
   
   // 不再需要 draftData
   const currentData = {
     data: customers,
     loading: isLoading
   };
   ```

2. **移除同步相關的 UI 元件**
   - 保留 SyncStatusIndicator 但簡化為只顯示載入狀態

## 錯誤處理

1. **表單驗證錯誤**: 使用現有的 Zod schema 驗證
2. **網路錯誤**: 在 Modal 中顯示錯誤訊息
3. **CSV 匯入錯誤**: 使用 CSVUploader 的內建錯誤處理

## 測試策略

1. **功能測試**
   - 確認表格為唯讀
   - 測試編輯 Modal 開啟/關閉
   - 測試資料更新後的重新載入
   - 測試 CSV 匯入/匯出

2. **UI 測試**
   - 確認 Notion 風格保持不變
   - 確認操作按鈕的位置和樣式
   - 確認 Modal 的顯示效果

## 驗證檢查點

```bash
# 語法檢查
npm run lint

# 類型檢查  
npm run type-check

# 執行測試
npm run test

# 建置檢查
npm run web:build
```

## 實作順序

1. ✅ 修改 NotionTable 為唯讀 (移除 onCellUpdate 處理)
2. ✅ 加入列操作按鈕 (編輯/刪除)
3. ✅ 整合現有的 EditCustomerModal
4. ✅ 加入匯入/匯出按鈕到工具列
5. ✅ 整合 CSVUploader 和 ExportOptions
6. ✅ 移除 useNotionDraftSystem 使用
7. ✅ 簡化同步狀態顯示
8. ✅ 測試所有功能
9. ✅ 清理未使用的程式碼

## 注意事項

1. **保持 UI 一致性**: 不要改變表格的視覺設計
2. **利用現有元件**: 不要重新發明輪子
3. **漸進式修改**: 一次修改一個功能，確保穩定
4. **保留必要功能**: 搜尋、排序、篩選等功能要保留

## 預期結果

- 資料同步邏輯大幅簡化
- 使用者操作更直覺（明確的編輯/儲存流程）
- 減少同步相關的 bug
- 保持原有的 Notion 風格 UI

---

**信心指數**: 9/10

這個 PRP 利用了大量現有元件，只需要修改互動邏輯而不是重寫功能，實作風險較低。