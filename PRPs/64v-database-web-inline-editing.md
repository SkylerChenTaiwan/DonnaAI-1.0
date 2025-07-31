# PRP-64: 資料庫 Web 內聯編輯改進

## 概述
將資料庫介面從 App 風格（Modal 彈出式）改為 Web 風格（內聯編輯），使介面更符合 Notion 的 2024/2025 設計理念。主要改進包括：直接在表格中新增列、使用小型 Popover 取代 Modal、縮小工具列按鈕，並修復多選和排序功能。

## 背景與問題分析

### 現有問題
1. **App 風格的 Modal 介面**
   - 新增資料時彈出全螢幕 Modal，需要逐格填寫
   - 篩選和排序功能使用大型 Modal
   - 不符合 Web 使用習慣

2. **功能故障**
   - 多選按鈕無反應
   - 排序按鈕無反應

3. **介面冗餘**
   - 頂部的客戶/紀錄/任務分頁與側邊欄重複
   - 工具列按鈕過大

### 設計參考
根據 Notion 2024 設計模式研究：
- **Progressive Disclosure**: 懸停時才顯示控制項
- **Inline Editing**: 直接點擊儲存格進行編輯
- **Small Popovers**: 使用小型浮動卡片而非全螢幕 Modal
- **Minimalist Toolbar**: 精簡的工具列設計

## 技術方案

### 1. 通用 Popover 組件

創建一個可重用的 Popover 組件，支援定位、動畫和點擊外部關閉：

```typescript
// src/components/common/Popover.tsx
import React, { useRef, useState, useEffect } from 'react';
import { 
  View, 
  Modal, 
  TouchableWithoutFeedback,
  Animated,
  Platform,
  Dimensions
} from 'react-native';

interface PopoverProps {
  visible: boolean;
  onClose: () => void;
  anchor: React.RefObject<any>;
  children: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  offset?: { x: number; y: number };
  showArrow?: boolean;
}

export const Popover: React.FC<PopoverProps> = ({
  visible,
  onClose,
  anchor,
  children,
  placement = 'auto',
  offset = { x: 0, y: 8 },
  showArrow = true,
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible && anchor.current) {
      anchor.current.measureInWindow((x, y, width, height) => {
        // 計算 Popover 位置
        const windowDimensions = Dimensions.get('window');
        let popX = x;
        let popY = y + height + offset.y;

        // 自動調整位置避免超出視窗
        if (placement === 'auto') {
          // 實作自動定位邏輯
        }

        setPosition({ x: popX, y: popY });
      });
    }

    // 動畫
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (Platform.OS === 'web') {
    // Web 平台使用 CSS 定位
    return visible ? (
      <div
        style={{
          position: 'fixed',
          zIndex: 1000,
          left: position.x,
          top: position.y,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'transparent',
          }} />
        </TouchableWithoutFeedback>
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }}
        >
          {children}
        </Animated.View>
      </div>
    ) : null;
  }

  // Native 實作...
};
```

### 2. 內聯新增列功能

修改 NotionStyleTableV2 以支援內聯新增：

```typescript
// 在 NotionStyleTableV2.tsx 中添加
const [isAddingRow, setIsAddingRow] = useState(false);
const [newRowData, setNewRowData] = useState<Record<string, any>>({});

const handleInlineAdd = () => {
  setIsAddingRow(true);
  // 創建空白行資料結構
  const emptyRow = columns.reduce((acc, col) => {
    acc[col.key] = '';
    return acc;
  }, {});
  setNewRowData(emptyRow);
};

const handleSaveNewRow = async () => {
  try {
    await onAddRow(newRowData);
    setIsAddingRow(false);
    setNewRowData({});
  } catch (error) {
    // 處理錯誤
  }
};

// 在表格末尾渲染新增列
{isAddingRow && (
  <View style={styles.newRow}>
    {columns.map((column) => (
      <EditableCell
        key={column.key}
        value={newRowData[column.key]}
        isEditing={true}
        onFinishEdit={(value) => {
          setNewRowData({ ...newRowData, [column.key]: value });
        }}
        inputType={getInputTypeForColumn(column)}
      />
    ))}
    <TouchableOpacity onPress={handleSaveNewRow}>
      <Icon name="checkmark" size={20} color="#4CAF50" />
    </TouchableOpacity>
  </View>
)}
```

### 3. 篩選 Popover 組件

```typescript
// src/components/database/FilterPopover.tsx
export const FilterPopover: React.FC<FilterPopoverProps> = ({
  visible,
  onClose,
  anchor,
  columns,
  filters,
  onApply,
}) => {
  const [conditions, setConditions] = useState(filters);

  return (
    <Popover
      visible={visible}
      onClose={onClose}
      anchor={anchor}
      placement="bottom"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>篩選條件</Text>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={20} color="#666" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content}>
          {conditions.map((condition, index) => (
            <FilterConditionRow
              key={index}
              condition={condition}
              columns={columns}
              onChange={(newCondition) => {
                const newConditions = [...conditions];
                newConditions[index] = newCondition;
                setConditions(newConditions);
              }}
              onDelete={() => {
                setConditions(conditions.filter((_, i) => i !== index));
              }}
            />
          ))}
          
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              setConditions([...conditions, createEmptyCondition()]);
            }}
          >
            <Icon name="add" size={16} color="#666" />
            <Text style={styles.addButtonText}>新增進階篩選</Text>
          </TouchableOpacity>
        </ScrollView>
        
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setConditions([])}
          >
            <Text style={styles.clearButtonText}>清除</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => {
              onApply(conditions);
              onClose();
            }}
          >
            <Text style={styles.applyButtonText}>套用</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Popover>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    width: 320,
    maxHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9e9e7',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#37352f',
  },
  // ... 其他樣式
});
```

### 4. 修復多選和排序功能

在 DatabaseScreen.tsx 中添加缺失的處理函數：

```typescript
// 添加多選切換按鈕到工具列
const handleMultiSelectToggle = () => {
  setMultiSelectMode(!multiSelectMode);
  if (multiSelectMode) {
    setSelectedItems([]);
  }
};

// 修復排序功能
const handleSortMenuOpen = (anchor: any) => {
  setSortAnchor(anchor);
  setShowSortPopover(true);
};

// 更新 DatabaseToolbar 調用
<DatabaseToolbar
  onFilter={() => setShowFilterPopover(true)}
  onSort={handleSortMenuOpen}
  onMultiSelect={handleMultiSelectToggle}
  multiSelectMode={multiSelectMode}
  hasActiveFilters={activeFilters.length > 0}
  hasActiveSort={currentSort !== null}
/>
```

### 5. 移除頂部分頁導航

```typescript
// 在 DatabaseScreen.tsx 中
// 移除或條件渲染 Tab 導航
{!isDesktop && (
  <View style={styles.tabContainer}>
    {/* 保留給行動版 */}
  </View>
)}
```

### 6. 縮小工具列按鈕

```typescript
// 更新 DatabaseToolbar 樣式
const styles = StyleSheet.create({
  toolButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    // 移除 responsive，使用固定小尺寸
  },
  toolbarText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  toolbar: {
    minHeight: 36, // 減小高度
    paddingVertical: 6,
  },
});
```

## 實施步驟

### 第一階段：基礎組件（Day 1）
1. ✅ 創建通用 Popover 組件
2. ✅ 測試 Popover 在 Web 和 Native 的兼容性
3. ✅ 實作基本動畫和定位邏輯

### 第二階段：內聯編輯（Day 2）
1. ✅ 修改 NotionStyleTableV2 支援內聯新增
2. ✅ 整合 EditableCell 組件
3. ✅ 實作保存和取消邏輯

### 第三階段：Popover 化（Day 3）
1. ✅ 創建 FilterPopover 組件
2. ✅ 創建 SortPopover 組件
3. ✅ 替換現有 Modal

### 第四階段：修復和優化（Day 4）
1. ✅ 修復多選功能
2. ✅ 修復排序功能
3. ✅ 移除頂部分頁（桌面版）
4. ✅ 調整工具列樣式

## 驗證標準

### 功能測試
```bash
# 執行測試
npm test -- --testPathPattern=database

# E2E 測試（如果有）
npm run test:e2e
```

### 手動測試清單
- [ ] 內聯新增列功能正常
- [ ] 篩選 Popover 正確顯示和定位
- [ ] 排序 Popover 正常工作
- [ ] 多選模式可以切換
- [ ] 批量操作功能正常
- [ ] 桌面版無頂部分頁
- [ ] 工具列按鈕尺寸適當
- [ ] 點擊外部關閉 Popover

### 性能指標
- Popover 開啟延遲 < 100ms
- 內聯編輯響應時間 < 50ms
- 無記憶體洩漏

## 風險評估

### 潛在風險
1. **Popover 定位問題** - 在不同螢幕尺寸可能出現定位偏差
2. **鍵盤事件衝突** - 內聯編輯時的鍵盤快捷鍵處理
3. **數據同步** - 內聯編輯的即時保存可能影響性能

### 緩解措施
1. 使用 `measureInWindow` 和視窗邊界檢測
2. 編輯模式時暫時禁用全局快捷鍵
3. 實作防抖動和樂觀更新

## 參考資源

### 內部檔案
- `/src/components/common/EditableCell.tsx` - 現有可編輯儲存格
- `/src/components/common/ActionPopover.tsx` - 現有 Popover 實作參考
- `/src/components/database/NotionStyleTableV2.tsx` - 表格組件
- `/src/components/database/DatabaseToolbar.tsx` - 工具列組件

### 外部文檔
- [Notion 2024 設計模式](https://medium.com/@yolu.x0918/a-breakdown-of-notion-how-ui-design-pattern-facilitates-autonomy-cleanness-and-organization-84f918e1fa48)
- [React Native Web Popover 實作](https://github.com/MonchiLin/react-native-dropdown)
- [Tamagui Popover 組件](https://tamagui.dev/ui/popover)

## 成功標準

1. **使用體驗提升** - 操作流程更符合 Web 使用習慣
2. **介面簡潔** - 移除冗餘元素，保持 Notion 風格的極簡主義
3. **功能完整** - 所有原有功能正常運作
4. **性能優化** - 響應速度提升，無卡頓

## 實作信心評分：8/10

扣分原因：
- Popover 在 React Native Web 的兼容性可能需要調整（-1）
- 內聯編輯的狀態管理較複雜（-1）

加分原因：
- 已有 EditableCell 和 ActionPopover 可參考（+1）
- 設計模式清晰，實作路徑明確（+1）