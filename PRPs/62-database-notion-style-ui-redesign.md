# PRP-62: 資料庫頁面 Notion 風格 UI/UX 重新設計

## 概述
將 DonnaAI 的資料庫頁面重新設計為類似 Notion 的 UI/UX 風格，提供更直觀、靈活且功能豐富的資料管理介面。

## 目標
1. 改善空白狀態的視覺呈現
2. 提供更直觀的資料結構展示
3. 增強用戶操作的引導性
4. 實現可自訂的欄位系統
5. 優化整體視覺層次和空間利用

## 現有問題分析

### 當前 DonnaAI 資料庫頁面的問題
1. **空白狀態過於空洞**
   - 只顯示「沒有找到資料」文字
   - 缺乏視覺引導和操作提示
   - 空間利用率低

2. **固定欄位結構**
   - 無法自訂欄位
   - 不同分頁使用相同欄位標題
   - 缺乏靈活性

3. **操作入口不明確**
   - 新增按鈕位置不夠突出
   - 缺乏快速操作指引

### Notion 的優勢設計
1. **表格結構始終可見**
   - 即使無資料也顯示欄位標題
   - 清晰的表格線條定義內容區域

2. **直覺的操作設計**
   - 「+ 新頁面」按鈕在表格第一行
   - 「+ 新增屬性」允許自訂欄位
   - 滑鼠懸停效果指引可點擊區域

3. **工具列整合**
   - 視圖切換、篩選、排序整合在內容區上方
   - 不佔用額外側邊空間

## 實作細節

### 1. 空白狀態改進
```typescript
// 空白狀態組件
interface EmptyStateProps {
  type: 'customers' | 'records' | 'tasks';
  onAdd: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ type, onAdd }) => {
  const getEmptyMessage = () => {
    switch (type) {
      case 'customers':
        return {
          icon: '👥',
          title: '開始建立您的客戶資料庫',
          description: '新增第一位客戶，開始管理您的業務關係',
          buttonText: '新增客戶'
        };
      case 'records':
        return {
          icon: '📝',
          title: '記錄您的第一次互動',
          description: '追蹤與客戶的每次接觸，建立完整的歷史記錄',
          buttonText: '新增紀錄'
        };
      case 'tasks':
        return {
          icon: '✓',
          title: '建立您的任務清單',
          description: '組織待辦事項，提高工作效率',
          buttonText: '新增任務'
        };
    }
  };

  const { icon, title, description, buttonText } = getEmptyMessage();

  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
      <TouchableOpacity style={styles.emptyButton} onPress={onAdd}>
        <Text style={styles.emptyButtonText}>{buttonText}</Text>
      </TouchableOpacity>
    </View>
  );
};
```

### 2. 表格結構持續顯示
```typescript
// 始終顯示表格結構
const DatabaseTable: React.FC<DatabaseTableProps> = ({ 
  data, 
  columns, 
  onAddRow,
  onAddColumn,
  ...props 
}) => {
  return (
    <View style={styles.tableContainer}>
      {/* 表格標題行 */}
      <View style={styles.tableHeader}>
        {columns.map((column, index) => (
          <View key={column.id} style={styles.headerCell}>
            <Text style={styles.headerText}>{column.title}</Text>
            {column.sortable && (
              <TouchableOpacity style={styles.sortButton}>
                <Ionicons name="arrow-down" size={12} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        ))}
        {/* 新增欄位按鈕 */}
        <TouchableOpacity style={styles.addColumnButton} onPress={onAddColumn}>
          <Ionicons name="add" size={16} color="#666" />
          <Text style={styles.addColumnText}>新增屬性</Text>
        </TouchableOpacity>
      </View>

      {/* 資料行或新增按鈕 */}
      {data.length === 0 ? (
        <TouchableOpacity style={styles.addFirstRow} onPress={onAddRow}>
          <Ionicons name="add" size={20} color="#FF6B6B" />
          <Text style={styles.addFirstRowText}>新增第一筆資料</Text>
        </TouchableOpacity>
      ) : (
        <>
          {data.map((row, index) => (
            <DataRow key={row.id} data={row} columns={columns} />
          ))}
          <TouchableOpacity style={styles.addRow} onPress={onAddRow}>
            <Ionicons name="add" size={16} color="#666" />
            <Text style={styles.addRowText}>新增</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};
```

### 3. 工具列整合
```typescript
// 整合的工具列
const DatabaseToolbar: React.FC<ToolbarProps> = ({ 
  onFilter, 
  onSort, 
  onViewChange,
  currentView 
}) => {
  return (
    <View style={styles.toolbar}>
      <View style={styles.toolbarLeft}>
        {/* 視圖切換 */}
        <TouchableOpacity style={styles.viewButton}>
          <Ionicons name="grid-outline" size={16} color="#666" />
          <Text style={styles.toolbarText}>表格</Text>
          <Ionicons name="chevron-down" size={12} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.toolbarRight}>
        {/* 搜尋 */}
        <TouchableOpacity style={styles.toolButton}>
          <Ionicons name="search" size={16} color="#666" />
          <Text style={styles.toolbarText}>搜尋</Text>
        </TouchableOpacity>

        {/* 篩選 */}
        <TouchableOpacity style={styles.toolButton} onPress={onFilter}>
          <Ionicons name="filter" size={16} color="#666" />
          <Text style={styles.toolbarText}>篩選</Text>
        </TouchableOpacity>

        {/* 排序 */}
        <TouchableOpacity style={styles.toolButton} onPress={onSort}>
          <Ionicons name="swap-vertical" size={16} color="#666" />
          <Text style={styles.toolbarText}>排序</Text>
        </TouchableOpacity>

        {/* 更多選項 */}
        <TouchableOpacity style={styles.toolButton}>
          <Ionicons name="ellipsis-horizontal" size={16} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );
};
```

### 4. 可自訂欄位系統
```typescript
// 欄位類型定義
interface ColumnType {
  id: string;
  title: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiSelect' | 'checkbox' | 'url' | 'email' | 'phone';
  width?: number;
  required?: boolean;
  options?: string[]; // for select/multiSelect
  validation?: (value: any) => boolean;
}

// 新增欄位對話框
const AddColumnDialog: React.FC<AddColumnDialogProps> = ({ 
  isVisible, 
  onClose, 
  onAdd 
}) => {
  const [columnName, setColumnName] = useState('');
  const [columnType, setColumnType] = useState<ColumnType['type']>('text');

  const columnTypes = [
    { type: 'text', icon: 'text', label: '文字' },
    { type: 'number', icon: 'calculator', label: '數字' },
    { type: 'date', icon: 'calendar', label: '日期' },
    { type: 'select', icon: 'list', label: '單選' },
    { type: 'multiSelect', icon: 'list', label: '多選' },
    { type: 'checkbox', icon: 'checkbox', label: '核取方塊' },
    { type: 'url', icon: 'link', label: '連結' },
    { type: 'email', icon: 'mail', label: '電子郵件' },
    { type: 'phone', icon: 'call', label: '電話' }
  ];

  return (
    <Modal visible={isVisible} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>新增屬性</Text>
          
          <TextInput
            style={styles.input}
            placeholder="屬性名稱"
            value={columnName}
            onChangeText={setColumnName}
          />

          <Text style={styles.label}>屬性類型</Text>
          <View style={styles.typeGrid}>
            {columnTypes.map(({ type, icon, label }) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeButton,
                  columnType === type && styles.typeButtonActive
                ]}
                onPress={() => setColumnType(type)}
              >
                <Ionicons name={icon} size={20} color={columnType === type ? '#FF6B6B' : '#666'} />
                <Text style={[
                  styles.typeLabel,
                  columnType === type && styles.typeLabelActive
                ]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.confirmButton}
              onPress={() => {
                onAdd({ title: columnName, type: columnType });
                onClose();
              }}
            >
              <Text style={styles.confirmText}>新增</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
```

### 5. 骨架屏載入狀態（參考 Notion）
```typescript
// 骨架屏組件
const SkeletonLoader: React.FC = () => {
  const fadeInDelays = [0, 1000, 2000, 3000, 4000]; // 漸進式顯示
  
  return (
    <View style={styles.skeletonContainer}>
      {/* 表格標題骨架 */}
      <View style={styles.skeletonHeader}>
        {[1, 2, 3, 4].map((_, index) => (
          <View 
            key={index} 
            style={[styles.skeletonCell, styles.shimmer]}
          />
        ))}
      </View>
      
      {/* 表格行骨架 */}
      {[1, 2, 3, 4, 5].map((_, rowIndex) => (
        <Animated.View 
          key={rowIndex}
          style={[
            styles.skeletonRow,
            {
              opacity: fadeInAnimation(fadeInDelays[rowIndex])
            }
          ]}
        >
          {[1, 2, 3, 4].map((_, colIndex) => (
            <View 
              key={colIndex}
              style={[styles.skeletonCell, styles.shimmer]}
            />
          ))}
        </Animated.View>
      ))}
    </View>
  );
};

// Shimmer 動畫效果
const ShimmerEffect: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  }, []);
  
  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });
  
  return (
    <View style={styles.shimmerContainer}>
      {children}
      <Animated.View
        style={[
          styles.shimmerGradient,
          { transform: [{ translateX }] }
        ]}
      />
    </View>
  );
};
```

### 6. 樣式定義（基於 Notion 設計系統）
```typescript
// 顏色系統
const colors = {
  light: {
    background: '#fff',
    sidebar: '#f9f8f7',
    border: '#eeeeec',
    shimmer: 'rgba(227,226,224,0.5)',
    text: '#37352f',
    textSecondary: '#787774',
    hover: 'rgba(55, 53, 47, 0.08)',
    selected: 'rgba(35, 131, 226, 0.14)',
  },
  dark: {
    background: '#191919',
    sidebar: '#202020',
    border: '#2a2a2a',
    shimmer: '#2f2f2f',
    text: '#ffffffcf',
    textSecondary: '#ffffff71',
    hover: 'rgba(255, 255, 255, 0.055)',
    selected: 'rgba(35, 131, 226, 0.3)',
  }
};

const styles = StyleSheet.create({
  // 表格容器
  tableContainer: {
    flex: 1,
    backgroundColor: colors.light.background,
    borderRadius: 0, // Notion 使用直角設計
    overflow: 'hidden',
  },

  // 表格標題（參考 Notion）
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
    minHeight: 36, // Notion 的標題高度
    paddingHorizontal: 8,
  },

  headerCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    minHeight: 36,
  },

  // 新增按鈕（Notion 風格）
  addFirstRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    minHeight: 36,
  },

  addFirstRowText: {
    marginLeft: 4,
    fontSize: 14,
    color: colors.light.textSecondary,
  },

  // 工具列
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.light.background,
    minHeight: 32,
  },

  toolButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 3,
    marginLeft: 4,
  },

  // 空白狀態
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },

  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.light.text,
    marginBottom: 8,
  },

  emptyDescription: {
    fontSize: 14,
    color: colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
    lineHeight: 20,
  },

  emptyButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 3,
  },

  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },

  // 骨架屏樣式
  skeletonContainer: {
    flex: 1,
    backgroundColor: colors.light.background,
  },

  skeletonHeader: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },

  skeletonRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },

  skeletonCell: {
    flex: 1,
    height: 10,
    backgroundColor: colors.light.shimmer,
    borderRadius: 10,
    marginHorizontal: 8,
  },

  shimmer: {
    overflow: 'hidden',
  },

  shimmerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    // React Native 使用 LinearGradient 組件實現漸變
  },

  // 懸停效果（Web 平台）
  ...(Platform.OS === 'web' && {
    'tableRow:hover': {
      backgroundColor: colors.light.hover,
    },
    'toolButton:hover': {
      backgroundColor: colors.light.hover,
    },
  }),
});
```

### 7. 互動細節優化

```typescript
// 行懸停效果
const TableRow: React.FC<RowProps> = ({ data, columns, onPress }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <Pressable
      style={({ pressed }) => [
        styles.tableRow,
        pressed && styles.tableRowPressed,
        isHovered && Platform.OS === 'web' && styles.tableRowHovered,
      ]}
      onPress={onPress}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
    >
      {columns.map((column) => (
        <View key={column.id} style={styles.tableCell}>
          <Text style={styles.cellText}>{data[column.id]}</Text>
        </View>
      ))}
    </Pressable>
  );
};

// 快捷鍵支援
const useKeyboardShortcuts = () => {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    
    const handleKeyPress = (e: KeyboardEvent) => {
      // Cmd/Ctrl + N: 新增行
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        handleAddRow();
      }
      // Cmd/Ctrl + K: 快速搜尋
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openQuickSearch();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);
};
```

## 實施步驟

### 第一階段：基礎改進（1-2天）
1. ✅ 實作新的空白狀態組件
2. ✅ 改進表格結構顯示
3. ✅ 整合工具列到內容區

### 第二階段：進階功能（2-3天）
4. ✅ 實作可自訂欄位系統
5. ✅ 新增欄位類型支援
6. ✅ 實作拖放排序功能

### 第三階段：優化與測試（1天）
7. ✅ 效能優化
8. ✅ 跨平台測試
9. ✅ 使用者體驗微調

## 預期成果

### 使用者體驗改善
1. **更清晰的視覺引導**
   - 用戶立即理解如何開始使用
   - 減少學習曲線

2. **更靈活的資料管理**
   - 可根據需求自訂欄位
   - 支援多種資料類型

3. **更高效的操作流程**
   - 快速新增和編輯資料
   - 批量操作支援

### 技術優勢
1. **模組化設計**
   - 可重用的組件
   - 易於維護和擴展

2. **效能優化**
   - 虛擬滾動支援大量資料
   - 優化的重新渲染邏輯

## 成功指標
1. **使用者參與度**
   - 新增資料的點擊率提升 50%
   - 平均停留時間增加 30%

2. **操作效率**
   - 完成任務時間減少 40%
   - 錯誤操作率降低 60%

3. **滿意度**
   - 使用者滿意度評分 > 4.5/5

## 風險與緩解
1. **風險**：現有使用者不適應新介面
   - **緩解**：提供介面導覽教學

2. **風險**：自訂欄位造成資料不一致
   - **緩解**：實作資料驗證和類型檢查

3. **風險**：效能問題
   - **緩解**：實作虛擬滾動和懶加載

## 技術實作要點（基於 Notion 原始碼分析）

### 載入優化
1. **骨架屏設計**
   - 使用 shimmer 動畫效果提升載入體驗
   - 漸進式顯示內容（fadeIn 動畫延遲）
   - 預設顯示表格結構

2. **顏色系統**
   - 完整的亮色/暗色主題支援
   - 使用 Notion 的精確顏色值
   - 統一的 hover 和 selected 狀態

3. **效能考量**
   - 虛擬滾動處理大量資料
   - 懶加載欄位配置
   - 優化重新渲染邏輯

### 平台差異處理
1. **Web 平台特性**
   - 滑鼠懸停效果
   - 快捷鍵支援
   - 可調整欄寬

2. **移動平台適配**
   - 觸控優化
   - 手勢操作
   - 響應式佈局

## 總結
通過深入分析 Notion 的設計系統和實作細節，結合 DonnaAI 的業務特性，打造一個既美觀又實用的資料庫管理介面。這個設計不僅提升視覺體驗，更重要的是改善使用者的工作效率和滿意度。