/**
 * Notion 風格資料表格組件 V2 - 更貼近 Notion 2024/2025 的設計
 * 特色：極簡主義、更精緻的空狀態、更細緻的互動
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Pressable,
  Platform,
  ScrollView,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Icon } from '@/components/common/Icon';
import { TableColumn, TableData } from '@/types/table';
import { responsive } from '@/styles/web';

interface NotionStyleTableV2Props {
  data: TableData[];
  columns: TableColumn[];
  onAddRow: () => void;
  onAddColumn?: () => void;
  onRowPress?: (item: TableData) => void;
  multiSelectMode?: boolean;
  selectedItems?: string[];
  onSelect?: (selectedIds: string[]) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  loading?: boolean;
  sortConfig?: {
    key: string | null;
    direction: 'asc' | 'desc';
  };
  onSort?: (key: string) => void;
}

export const NotionStyleTableV2: React.FC<NotionStyleTableV2Props> = ({
  data,
  columns,
  onAddRow,
  onAddColumn,
  onRowPress,
  multiSelectMode = false,
  selectedItems = [],
  onSelect,
  refreshing = false,
  onRefresh,
  loading = false,
  sortConfig,
  onSort,
}) => {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [hoveredAddNew, setHoveredAddNew] = useState(false);

  const toggleSelection = useCallback((itemId: string) => {
    if (!onSelect) return;
    
    const newSelection = selectedItems.includes(itemId)
      ? selectedItems.filter(id => id !== itemId)
      : [...selectedItems, itemId];
    
    onSelect(newSelection);
  }, [selectedItems, onSelect]);

  // 渲染表頭
  const renderHeader = () => (
    <View style={styles.tableHeader}>
      {/* 多選模式的核取方塊欄 */}
      {multiSelectMode && (
        <View style={styles.checkboxColumn}>
          <TouchableOpacity
            style={styles.headerCheckbox}
            onPress={() => {
              if (selectedItems.length === data.length && data.length > 0) {
                onSelect?.([]);
              } else {
                onSelect?.(data.map(item => item.id));
              }
            }}
          >
            <View style={[
              styles.checkbox,
              selectedItems.length === data.length && data.length > 0 && styles.checkboxChecked,
              selectedItems.length > 0 && selectedItems.length < data.length && styles.checkboxIndeterminate,
            ]}>
              {selectedItems.length === data.length && data.length > 0 && (
                <Icon name="checkmark" size={14} color="#fff" />
              )}
              {selectedItems.length > 0 && selectedItems.length < data.length && (
                <View style={styles.indeterminateLine} />
              )}
            </View>
          </TouchableOpacity>
        </View>
      )}
      
      {/* 欄位標題 */}
      {columns.map((column, index) => (
        <TouchableOpacity
          key={column.key}
          style={[
            styles.headerCell,
            index === 0 && !multiSelectMode && styles.firstHeaderCell,
            column.width ? { width: column.width } : { flex: 1 }
          ]}
          onPress={() => column.sortable && onSort && onSort(column.key)}
          disabled={!column.sortable || !onSort}
          activeOpacity={0.7}
        >
          <Text style={styles.headerText}>{column.title}</Text>
          {column.sortable && sortConfig && sortConfig.key === column.key && (
            <Icon
              name={sortConfig.direction === 'asc' ? 'arrow-up' : 'arrow-down'}
              size={14}
              color="#37352f"
              style={styles.sortIcon}
            />
          )}
        </TouchableOpacity>
      ))}
      
      {/* 新增欄位按鈕 */}
      {onAddColumn && (
        <TouchableOpacity 
          style={styles.addColumnButton} 
          onPress={onAddColumn}
          activeOpacity={0.7}
        >
          <Icon name="add" size={16} color="#37352f" />
        </TouchableOpacity>
      )}
    </View>
  );

  // 渲染空狀態（Notion 2024/2025 風格）
  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <TouchableOpacity 
        style={[
          styles.addNewButton,
          hoveredAddNew && styles.addNewButtonHovered
        ]}
        onPress={onAddRow}
        activeOpacity={0.8}
        onPressIn={() => setHoveredAddNew(true)}
        onPressOut={() => setHoveredAddNew(false)}
      >
        <Icon name="add" size={20} color="#91918e" />
        <Text style={styles.addNewText}>新頁面</Text>
      </TouchableOpacity>
      
      {/* 極簡的提示文字 */}
      <Text style={styles.emptyHintText}>
        按 Enter 鍵快速新增
      </Text>
    </View>
  );

  // 渲染資料行
  const renderItem = useCallback(
    ({ item }: { item: TableData }) => {
      const isSelected = selectedItems.includes(item.id);
      const isHovered = hoveredRow === item.id;

      return (
        <Pressable
          style={[
            styles.tableRow,
            isHovered && styles.tableRowHovered,
            isSelected && styles.tableRowSelected,
          ]}
          onPress={() => {
            if (multiSelectMode) {
              toggleSelection(item.id);
            } else if (onRowPress) {
              onRowPress(item);
            }
          }}
          onHoverIn={() => Platform.OS === 'web' && setHoveredRow(item.id)}
          onHoverOut={() => Platform.OS === 'web' && setHoveredRow(null)}
        >
          {/* 多選核取方塊 */}
          {multiSelectMode && (
            <View style={styles.checkboxColumn}>
              <View style={[
                styles.checkbox,
                isSelected && styles.checkboxChecked,
              ]}>
                {isSelected && (
                  <Icon name="checkmark" size={14} color="#fff" />
                )}
              </View>
            </View>
          )}
          
          {/* 資料欄位 */}
          {columns.map((column, index) => (
            <View
              key={column.key}
              style={[
                styles.tableCell,
                index === 0 && !multiSelectMode && styles.firstTableCell,
                column.width ? { width: column.width } : { flex: 1 }
              ]}
            >
              {column.render ? (
                column.render(item[column.key], item)
              ) : (
                <Text style={styles.cellText} numberOfLines={1}>
                  {item[column.key] || ''}
                </Text>
              )}
            </View>
          ))}
        </Pressable>
      );
    },
    [columns, selectedItems, multiSelectMode, hoveredRow, toggleSelection, onRowPress]
  );

  // 渲染底部新增按鈕
  const renderFooter = () => (
    <TouchableOpacity 
      style={styles.footerAddButton}
      onPress={onAddRow}
      activeOpacity={0.7}
    >
      <Icon name="add" size={16} color="#91918e" />
      <Text style={styles.footerAddText}>新增</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* 表頭始終顯示 */}
      {renderHeader()}
      
      {/* 內容區域 */}
      {data.length === 0 && !loading ? (
        renderEmptyState()
      ) : (
        <FlashList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          estimatedItemSize={44}
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            ) : undefined
          }
          ListFooterComponent={renderFooter()}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  
  // 表頭樣式
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e9e9e7',
    backgroundColor: '#ffffff',
    minHeight: 42,
    alignItems: 'center',
  },
  
  headerCell: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  firstHeaderCell: {
    paddingLeft: 16,
  },
  
  headerText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#787774',
    marginRight: 4,
  },
  
  sortIcon: {
    marginLeft: 2,
  },
  
  // 核取方塊樣式
  checkboxColumn: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  headerCheckbox: {
    padding: 4,
  },
  
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: '#e9e9e7',
    borderRadius: 3,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  checkboxChecked: {
    backgroundColor: '#2383e2',
    borderColor: '#2383e2',
  },
  
  checkboxIndeterminate: {
    backgroundColor: '#2383e2',
    borderColor: '#2383e2',
  },
  
  indeterminateLine: {
    width: 8,
    height: 2,
    backgroundColor: '#ffffff',
  },
  
  // 新增欄位按鈕
  addColumnButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    borderRadius: 3,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  
  // 空狀態樣式
  emptyStateContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 3,
    gap: 6,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'background-color 0.1s ease',
      },
    }),
  },
  
  addNewButtonHovered: {
    backgroundColor: '#f7f6f3',
  },
  
  addNewText: {
    fontSize: 14,
    color: '#91918e',
  },
  
  emptyHintText: {
    fontSize: 12,
    color: '#b4b3af',
    marginTop: 4,
    marginLeft: 42,
  },
  
  // 表格行樣式
  listContent: {
    paddingBottom: 1,
  },
  
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e9e9e7',
    minHeight: 44,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'background-color 0.1s ease',
      },
    }),
  },
  
  tableRowHovered: {
    backgroundColor: '#f7f6f3',
  },
  
  tableRowSelected: {
    backgroundColor: '#e3f2fd',
  },
  
  tableCell: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  
  firstTableCell: {
    paddingLeft: 16,
  },
  
  cellText: {
    fontSize: 14,
    color: '#37352f',
  },
  
  // 底部新增按鈕
  footerAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 16,
    gap: 6,
    minHeight: 44,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  
  footerAddText: {
    fontSize: 14,
    color: '#91918e',
  },
});