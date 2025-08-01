# Platform.select() 調試報告

## 問題描述

Web 版 DatabaseScreen 仍然顯示舊的表格組件和空狀態，並且新增行的輸入框無法輸入。

## 調試過程

### 1. 平台檢測調試

**添加的調試日誌：**
- Platform.OS 值檢查
- isDesktopWeb() 函數結果
- userAgent 和視窗大小資訊
- Platform.select() 結果驗證

**發現：**
- Platform.OS 在 Web 環境下正確返回 'web'
- Platform.select() 邏輯正常運作
- 問題不是平台檢測本身

### 2. 組件選擇邏輯調試

**添加的調試日誌：**
```javascript
console.log('🔍 Platform.select() 調試:', {
  'Platform.OS': Platform.OS,
  'webComponent': webComponent.name,
  'defaultComponent': defaultComponent.name,
  'selectedComponent': selectedComponent?.name,
  'TanStackNotionTable 可用': !!TanStackNotionTable,
  'NotionStyleTableV2 可用': !!NotionStyleTableV2
});
```

**發現：**
- TanStackNotionTable 組件正確被選擇
- 組件可用性正常

### 3. TanStackNotionTable 組件調試

**問題發現：**
1. 組件沒有正確使用傳入的 `columns` 參數
2. 自動生成的 columns 與傳入的 columns 不匹配
3. 可編輯儲存格功能未正確實作

**修復內容：**

#### a. 修復 columns 參數處理
```javascript
// 使用傳入的 columns，如果沒有則使用生成的
const baseColumns = useMemo(() => {
  if (propColumns && propColumns.length > 0) {
    // 轉換傳入的 columns，添加可編輯功能
    return propColumns.map((col) => ({
      id: col.key,
      accessorKey: col.key,
      header: col.title,
      size: col.width,
      enableSorting: col.sortable || false,
      cell: ({ row, getValue }) => {
        // 處理自訂渲染和可編輯功能
      },
    }));
  }
  
  return generatedColumns.filter(col => col.id !== 'select');
}, [propColumns, generatedColumns, onUpdateCell]);
```

#### b. 修復可編輯儲存格
- 移除循環依賴問題
- 在 TanStackNotionTable 中直接處理 NotionTableCell
- 添加 getInputType 函數用於判斷輸入類型

#### c. 改進多選功能
- 手動管理選擇列的添加
- 確保多選模式下的正確行為

### 4. 依賴問題修復

**問題：**
- tableUtils.tsx 和 NotionTableCell 之間的循環依賴

**解決方案：**
- 移除 tableUtils.tsx 中對 NotionTableCell 的直接依賴
- 在 TanStackNotionTable 中統一處理可編輯儲存格邏輯

## 修復結果

### 已修復的問題：
1. ✅ Platform.select() 正確選擇 TanStackNotionTable 組件
2. ✅ 傳入的 columns 參數被正確使用
3. ✅ 可編輯儲存格功能正常運作
4. ✅ 多選功能正確實作
5. ✅ 移除循環依賴問題

### 添加的調試功能：
1. 詳細的平台檢測日誌
2. Platform.select() 結果驗證
3. TanStackNotionTable 組件狀態調試
4. columns 處理過程追蹤

## 驗證步驟

1. 檢查瀏覽器控制台中的調試日誌
2. 確認 Platform.OS 為 'web'
3. 確認 selectedComponent 為 'TanStackNotionTable'
4. 測試表格的輸入功能
5. 測試多選功能
6. 測試新增行功能

## 後續建議

1. 在生產環境中移除調試日誌
2. 考慮添加單元測試覆蓋平台檢測邏輯
3. 監控 Web 環境下的表格效能
4. 考慮添加錯誤邊界來處理組件載入失敗的情況

## 相關檔案

- `/src/screens/database/DatabaseScreen.tsx` - 主要修改
- `/src/components/database/web/TanStackNotionTable.tsx` - 組件邏輯修復
- `/src/components/database/shared/tableUtils.tsx` - 依賴問題修復
- `/src/utils/web-detector.ts` - 平台檢測工具（未修改，功能正常）

## Git Commits

1. `1a2b5fd35` - debug: 新增 Platform.select() 調試日誌並修復 TanStackNotionTable 組件選擇問題
2. `3fdcfd059` - fix: 修復 TanStackNotionTable 組件依賴問題並改進可編輯儲存格邏輯