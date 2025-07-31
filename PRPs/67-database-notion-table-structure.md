# PRP-67: 資料庫頁面 Notion 風格表格結構重建

## 概述
重建資料庫頁面的表格結構，使其完全符合 Notion 的設計風格。包括正確的表格佈局、欄位對齊、分隔線、核取方塊等元素。

## 背景與問題分析

### 現有問題對比

#### Notion 的表格設計：
1. **清晰的表格結構**
   - 標題列下方有淡灰色分隔線
   - 每個欄位有明確的寬度和對齊
   - 資料列之間沒有分隔線，但有 hover 效果

2. **核取方塊系統**
   - 每一列前面都有核取方塊（非多選模式也有）
   - 用於快速選取和操作

3. **頁面佈局**
   - 大標題在最上方（如「新資料庫」）
   - 工具列（視圖切換、篩選、排序）在標題下方
   - 表格主體佔據剩餘空間

4. **視覺層次**
   - 背景色 #F7F6F4（淺灰色）
   - 表格背景白色
   - 適當的內外邊距

#### 我們現在的問題：
1. 沒有表格結構感
2. 欄位看起來像獨立的項目
3. 缺少標題列的分隔線
4. 整體太過簡化，失去了表格的視覺結構

## 技術方案

### 1. 重建頁面結構

```typescript
// DatabaseScreen.tsx - 新的頁面結構
<Layout scrollable={false} backgroundColor="#F7F6F4">
  <View style={styles.pageContainer}>
    {/* 頁面標題 */}
    <View style={styles.pageHeader}>
      <Text style={styles.pageTitle}>新資料庫</Text>
      <View style={styles.pageActions}>
        {/* 分享、更多選項等 */}
      </View>
    </View>
    
    {/* 視圖切換和工具列 */}
    <View style={styles.viewToolbar}>
      <View style={styles.viewTabs}>
        <TouchableOpacity style={styles.viewTab}>
          <Icon name="grid" size={16} />
          <Text>表格</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.toolbarActions}>
        <SearchBar />
        <DatabaseToolbar />
      </View>
    </View>
    
    {/* 表格容器 */}
    <View style={styles.tableWrapper}>
      <NotionStyleTableV2 />
    </View>
  </View>
</Layout>
```

### 2. 修復表格結構

```typescript
// NotionStyleTableV2.tsx - 表格結構修復

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
    overflow: 'hidden',
  },
  
  // 表頭樣式 - 加回分隔線
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E9E9E7',
    backgroundColor: '#FFFFFF',
    minHeight: 36,
    alignItems: 'center',
  },
  
  headerCell: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  headerText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#787774',
  },
  
  // 表格行 - 保持簡潔但有 hover 效果
  tableRow: {
    flexDirection: 'row',
    minHeight: 36,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0, // 不要行分隔線
  },
  
  tableRowHovered: {
    backgroundColor: '#F7F6F3',
  },
  
  // 核取方塊欄 - 始終顯示
  checkboxColumn: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: '#DDDDDB',
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  
  // 內容欄位 - 確保對齊
  tableCell: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minHeight: 36,
    justifyContent: 'center',
  },
});
```

### 3. 始終顯示核取方塊列

```typescript
// 修改 renderItem 始終渲染核取方塊
const renderItem = ({ item }) => {
  return (
    <Pressable style={[styles.tableRow, isHovered && styles.tableRowHovered]}>
      {/* 始終顯示核取方塊 */}
      <View style={styles.checkboxColumn}>
        <TouchableOpacity
          style={[styles.checkbox, isSelected && styles.checkboxChecked]}
          onPress={() => toggleSelection(item.id)}
        >
          {isSelected && <Icon name="checkmark" size={12} color="#fff" />}
        </TouchableOpacity>
      </View>
      
      {/* 資料欄位 */}
      {columns.map((column) => (
        <View key={column.key} style={styles.tableCell}>
          {/* 內容 */}
        </View>
      ))}
    </Pressable>
  );
};
```

### 4. 新增列的輸入樣式

```typescript
// 內聯新增列時的樣式
const renderNewRow = () => {
  if (!isAddingRow) return null;
  
  return (
    <View style={styles.tableRow}>
      <View style={styles.checkboxColumn}>
        <View style={[styles.checkbox, styles.checkboxDisabled]} />
      </View>
      
      {columns.map((column, index) => (
        <View key={column.key} style={styles.tableCell}>
          <TextInput
            style={styles.inlineInput}
            placeholder={column.title}
            placeholderTextColor="#B4B3AF"
            value={newRowData[column.key]}
            onChangeText={(text) => setNewRowData({...newRowData, [column.key]: text})}
            autoFocus={index === 0}
          />
        </View>
      ))}
    </View>
  );
};

// 輸入框樣式
inlineInput: {
  fontSize: 14,
  color: '#37352F',
  padding: 0,
  margin: 0,
  borderWidth: 0,
  backgroundColor: 'transparent',
  outline: 'none',
}
```

### 5. 頁面樣式定義

```typescript
// DatabaseScreen.tsx 樣式
const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: '#F7F6F4',
  },
  
  pageHeader: {
    paddingHorizontal: 96,
    paddingTop: 45,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  pageTitle: {
    fontSize: 40,
    fontWeight: '700',
    color: '#37352F',
  },
  
  viewToolbar: {
    paddingHorizontal: 96,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  tableWrapper: {
    flex: 1,
    paddingHorizontal: 96,
    paddingBottom: 96,
  },
});
```

## 實施步驟

### 第一階段：頁面結構重建（1小時）
1. ✅ 調整 Layout 背景色
2. ✅ 重建頁面標題區域
3. ✅ 調整工具列位置
4. ✅ 設定正確的內外邊距

### 第二階段：表格結構修復（1小時）
1. ✅ 恢復表頭分隔線
2. ✅ 實作核取方塊列
3. ✅ 調整欄位對齊
4. ✅ 修復 hover 效果

### 第三階段：細節優化（30分鐘）
1. ✅ 調整字體大小和顏色
2. ✅ 優化間距
3. ✅ 確保響應式設計
4. ✅ 測試所有互動

## 驗證標準

### 視覺對比
- [ ] 表格有清晰的結構感
- [ ] 標題列有分隔線
- [ ] 每列都有核取方塊
- [ ] 背景色符合 Notion 風格
- [ ] 適當的內外邊距

### 功能測試
- [ ] 核取方塊可以點擊
- [ ] Hover 效果正常
- [ ] 內聯編輯正常工作
- [ ] 欄位拖動功能正常

## 參考資源

### Notion 設計規範
- 背景色：#F7F6F4
- 表格背景：#FFFFFF
- 邊框色：#E9E9E7
- 文字色：#37352F（主要）、#787774（次要）
- Hover 背景：#F7F6F3

### 間距規範
- 頁面左右邊距：96px（桌面版）
- 表格內邊距：8px
- 行高：36px

## 成功標準

1. **視覺一致性** - 與 Notion 的表格看起來一模一樣
2. **結構清晰** - 用戶一眼就能看出這是個表格
3. **互動自然** - 所有操作都符合預期
4. **響應式設計** - 在不同螢幕尺寸下都能正常顯示

## 實作信心評分：9/10

需求明確，有清晰的參考設計，實作難度不高。