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
import { EditableCell } from '@/components/common/EditableCell';
import { TableColumn, TableData } from '@/types/table';
import { responsive } from '@/styles/web';

interface NotionStyleTableV2Props {
  data: TableData[];
  columns: TableColumn[];
  onAddRow: (rowData?: Record<string, any>) => void | Promise<void>;
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
  onUpdateCell?: (rowId: string, columnKey: string, value: any) => void | Promise<void>;
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
  onUpdateCell,
}) => {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [hoveredAddNew, setHoveredAddNew] = useState(false);
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [newRowData, setNewRowData] = useState<Record<string, any>>({});
  const [editingCell, setEditingCell] = useState<{ rowId: string; columnKey: string } | null>(null);

  const toggleSelection = useCallback((itemId: string) => {
    if (!onSelect) return;
    
    const newSelection = selectedItems.includes(itemId)
      ? selectedItems.filter(id => id !== itemId)
      : [...selectedItems, itemId];
    
    onSelect(newSelection);
  }, [selectedItems, onSelect]);

  // 處理內聯新增列
  const handleInlineAdd = () => {
    setIsAddingRow(true);
    // 創建空白行資料結構
    const emptyRow = columns.reduce((acc, col) => {
      acc[col.key] = '';
      return acc;
    }, {} as Record<string, any>);
    setNewRowData(emptyRow);
  };

  // 儲存新列
  const handleSaveNewRow = async () => {
    try {
      await onAddRow(newRowData);
      setIsAddingRow(false);
      setNewRowData({});
    } catch (error) {
      console.error('Failed to add row:', error);
    }
  };

  // 取消新增列
  const handleCancelNewRow = () => {
    setIsAddingRow(false);
    setNewRowData({});
  };

  // 處理儲存格編輯
  const handleCellEdit = async (rowId: string, columnKey: string, value: any) => {
    if (onUpdateCell) {
      try {
        await onUpdateCell(rowId, columnKey, value);
      } catch (error) {
        console.error('Failed to update cell:', error);
      }
    }
    setEditingCell(null);
  };

  // 根據欄位類型取得輸入類型
  const getInputTypeForColumn = (column: TableColumn): 'text' | 'number' | 'email' | 'phone' | 'multiline' => {
    // 可以根據欄位的 key 或其他屬性來決定輸入類型
    if (column.key.includes('email')) return 'email';
    if (column.key.includes('phone')) return 'phone';
    if (column.key.includes('amount') || column.key.includes('price')) return 'number';
    if (column.key.includes('note') || column.key.includes('description')) return 'multiline';
    return 'text';
  };

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
          {columns.map((column, index) => {
            const isEditing = editingCell?.rowId === item.id && editingCell?.columnKey === column.key;
            
            return (
              <View
                key={column.key}
                style={[
                  styles.tableCell,
                  index === 0 && !multiSelectMode && styles.firstTableCell,
                  column.width ? { width: column.width } : { flex: 1 }
                ]}
              >
                <EditableCell
                  value={item[column.key]}
                  isEditing={isEditing}
                  onStartEdit={() => setEditingCell({ rowId: item.id, columnKey: column.key })}
                  onFinishEdit={(value) => handleCellEdit(item.id, column.key, value)}
                  render={column.render}
                  item={item}
                  inputType={getInputTypeForColumn(column)}
                  disabled={!onUpdateCell || multiSelectMode}
                />
              </View>
            );
          })}
        </Pressable>
      );
    },
    [columns, selectedItems, multiSelectMode, hoveredRow, toggleSelection, onRowPress, editingCell, handleCellEdit, onUpdateCell, getInputTypeForColumn]
  );

  // 渲染內聯新增列
  const renderNewRow = () => {
    if (!isAddingRow) return null;

    return (
      <View style={[styles.tableRow, styles.newRow]}>
        {/* 多選模式的空格 */}
        {multiSelectMode && <View style={styles.checkboxColumn} />}
        
        {/* 可編輯欄位 */}
        {columns.map((column, index) => (
          <View
            key={column.key}
            style={[
              styles.tableCell,
              index === 0 && !multiSelectMode && styles.firstTableCell,
              column.width ? { width: column.width } : { flex: 1 }
            ]}
          >
            <EditableCell
              value={newRowData[column.key]}
              isEditing={true}
              onStartEdit={() => {}}
              onFinishEdit={(value) => {
                setNewRowData({ ...newRowData, [column.key]: value });
              }}
              inputType={getInputTypeForColumn(column)}
              placeholder={`輸入${column.title}`}
            />
          </View>
        ))}
        
        {/* 操作按鈕 */}
        <View style={styles.newRowActions}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveNewRow}
            activeOpacity={0.7}
          >
            <Icon name="checkmark" size={20} color="#4CAF50" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelNewRow}
            activeOpacity={0.7}
          >
            <Icon name="close" size={20} color="#DC3545" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // 渲染底部新增按鈕
  const renderFooter = () => (
    <TouchableOpacity 
      style={styles.footerAddButton}
      onPress={handleInlineAdd}
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
          ListFooterComponent={
            <>
              {renderNewRow()}
              {renderFooter()}
            </>
          }
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
  
  // 新增列樣式
  newRow: {
    backgroundColor: '#f7f6f3',
    borderBottomWidth: 2,
    borderBottomColor: '#2383e2',
  },
  
  newRowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  
  saveButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  cancelButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(220, 53, 69, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});