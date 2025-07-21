/**
 * Excel 式可編輯資料表格元件
 * 支援行內編輯、欄位類型處理、批次儲存
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ScrollView,
  Alert,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { EditableCell } from './EditableCell';
import { SearchBar } from './SearchBar';
import { useTableData } from '@/hooks/useTableData';
import { TableProps, TableData, TableColumn } from '@/types/table';

interface EditableTableColumn extends TableColumn {
  editable?: boolean;
  validator?: (value: any) => string | null; // 返回錯誤訊息或 null
  formatter?: (value: any) => any; // 格式化值
}

interface EditableTableProps extends Omit<TableProps, 'columns'> {
  columns: EditableTableColumn[];
  onSave?: (changes: Array<{ id: string; field: string; value: any }>) => Promise<void>;
  onRowSave?: (id: string, changes: Record<string, any>) => Promise<void>;
  saveMode?: 'batch' | 'realtime'; // 批次儲存或即時儲存
  showSaveButton?: boolean;
  readOnly?: boolean;
}

interface CellEdit {
  id: string;
  field: string;
  value: any;
  originalValue: any;
  isValid: boolean;
  error?: string;
}

export const EditableDataTable: React.FC<EditableTableProps> = ({
  data,
  columns,
  searchable = true,
  selectable = false,
  showCheckboxes = false,
  onSelect,
  onRowPress,
  refreshing = false,
  onRefresh,
  filters = [],
  sortConfig: externalSortConfig,
  onSave,
  onRowSave,
  saveMode = 'batch',
  showSaveButton = true,
  readOnly = false,
}) => {
  const [editingCell, setEditingCell] = useState<string | null>(null); // "id:field"
  const [pendingChanges, setPendingChanges] = useState<Map<string, CellEdit>>(new Map());
  const [isSaving, setIsSaving] = useState(false);
  
  const {
    data: processedData,
    searchQuery,
    sortConfig,
    selectedItems,
    handleSearch,
    handleSort,
    toggleSelection,
    selectAll,
    clearSelection,
  } = useTableData(data, useMemo(() => ({ 
    filters,
    initialSortKey: externalSortConfig?.key,
    initialSortDirection: externalSortConfig?.direction,
  }), [JSON.stringify(filters), externalSortConfig?.key, externalSortConfig?.direction]));

  // 處理選擇變更
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  
  React.useEffect(() => {
    if (onSelectRef.current) {
      onSelectRef.current(Array.from(selectedItems));
    }
  }, [selectedItems]);

  // 開始編輯儲存格
  const startEditing = useCallback((itemId: string, field: string) => {
    if (readOnly) return;
    
    const column = columns.find(col => col.key === field);
    if (!column?.editable) return;
    
    setEditingCell(`${itemId}:${field}`);
  }, [columns, readOnly]);

  // 完成編輯
  const finishEditing = useCallback((itemId: string, field: string, newValue: any) => {
    const item = processedData.find(d => d.id === itemId);
    if (!item) return;

    const column = columns.find(col => col.key === field);
    if (!column) return;

    const originalValue = item[field];
    const changeKey = `${itemId}:${field}`;
    
    // 如果值沒有改變，直接結束編輯
    if (newValue === originalValue) {
      setEditingCell(null);
      return;
    }

    // 格式化值
    const formattedValue = column.formatter ? column.formatter(newValue) : newValue;

    // 驗證值
    let error: string | undefined;
    let isValid = true;
    if (column.validator) {
      const validationError = column.validator(formattedValue);
      if (validationError) {
        error = validationError;
        isValid = false;
      }
    }

    // 建立編輯記錄
    const edit: CellEdit = {
      id: itemId,
      field,
      value: formattedValue,
      originalValue,
      isValid,
      error,
    };

    // 更新待儲存變更
    const newChanges = new Map(pendingChanges);
    if (newValue === originalValue || newValue === '') {
      // 如果恢復原值或空值，移除變更
      newChanges.delete(changeKey);
    } else {
      newChanges.set(changeKey, edit);
    }
    setPendingChanges(newChanges);
    setEditingCell(null);

    // 即時儲存模式
    if (saveMode === 'realtime' && isValid && onRowSave) {
      handleRealtimeSave(itemId, field, formattedValue);
    }
  }, [processedData, columns, pendingChanges, saveMode, onRowSave]);

  // 即時儲存
  const handleRealtimeSave = useCallback(async (itemId: string, field: string, value: any) => {
    try {
      setIsSaving(true);
      await onRowSave?.(itemId, { [field]: value });
      
      // 移除已儲存的變更
      const changeKey = `${itemId}:${field}`;
      const newChanges = new Map(pendingChanges);
      newChanges.delete(changeKey);
      setPendingChanges(newChanges);
    } catch (error) {
      console.error('即時儲存失敗:', error);
      Alert.alert('儲存失敗', '無法儲存變更，請稍後再試');
    } finally {
      setIsSaving(false);
    }
  }, [pendingChanges, onRowSave]);

  // 批次儲存
  const handleBatchSave = useCallback(async () => {
    if (!onSave || pendingChanges.size === 0) return;

    // 檢查是否所有變更都有效
    const invalidChanges = Array.from(pendingChanges.values()).filter(change => !change.isValid);
    if (invalidChanges.length > 0) {
      Alert.alert('驗證錯誤', `有 ${invalidChanges.length} 個欄位包含無效資料，請先修正後再儲存`);
      return;
    }

    try {
      setIsSaving(true);
      
      const changes = Array.from(pendingChanges.values()).map(change => ({
        id: change.id,
        field: change.field,
        value: change.value,
      }));

      await onSave(changes);
      setPendingChanges(new Map()); // 清除所有待儲存變更
      Alert.alert('儲存成功', `已成功儲存 ${changes.length} 個變更`);
    } catch (error) {
      console.error('批次儲存失敗:', error);
      Alert.alert('儲存失敗', '無法儲存變更，請稍後再試');
    } finally {
      setIsSaving(false);
    }
  }, [onSave, pendingChanges]);

  // 放棄變更
  const discardChanges = useCallback(() => {
    Alert.alert(
      '放棄變更',
      `確定要放棄 ${pendingChanges.size} 個未儲存的變更嗎？`,
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '放棄', 
          style: 'destructive',
          onPress: () => {
            setPendingChanges(new Map());
            setEditingCell(null);
          }
        },
      ]
    );
  }, [pendingChanges.size]);

  // 取得儲存格的顯示值（包含未儲存變更）
  const getCellValue = useCallback((item: TableData, field: string) => {
    const changeKey = `${item.id}:${field}`;
    const change = pendingChanges.get(changeKey);
    return change ? change.value : item[field];
  }, [pendingChanges]);

  // 檢查儲存格是否有錯誤
  const getCellError = useCallback((item: TableData, field: string) => {
    const changeKey = `${item.id}:${field}`;
    const change = pendingChanges.get(changeKey);
    return change?.error;
  }, [pendingChanges]);

  // 檢查儲存格是否有變更
  const isCellChanged = useCallback((item: TableData, field: string) => {
    const changeKey = `${item.id}:${field}`;
    return pendingChanges.has(changeKey);
  }, [pendingChanges]);

  // 渲染表頭
  const renderHeader = () => (
    <View style={styles.header}>
      {selectable && showCheckboxes && (
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => {
            if (selectedItems.size === processedData.length) {
              clearSelection();
            } else {
              selectAll();
            }
          }}
        >
          <Ionicons
            name={
              selectedItems.size === processedData.length && processedData.length > 0
                ? 'checkbox'
                : selectedItems.size > 0
                ? 'square'
                : 'square-outline'
            }
            size={20}
            color="#1A1A1A"
          />
        </TouchableOpacity>
      )}
      {columns.map((column) => (
        <TouchableOpacity
          key={column.key}
          style={[
            styles.headerCell, 
            column.width ? { width: column.width } : { flex: 1 }
          ]}
          onPress={() => column.sortable !== false && handleSort(column.key)}
          disabled={column.sortable === false}
          activeOpacity={column.sortable !== false ? 0.7 : 1}
        >
          <Text style={[
            styles.headerText,
            column.editable && styles.editableHeaderText
          ]}>
            {column.title}
            {column.editable && !readOnly && (
              <Text style={styles.editableIndicator}> ✏️</Text>
            )}
          </Text>
          {column.sortable !== false && (
            <Ionicons
              name={
                sortConfig.key === column.key
                  ? sortConfig.direction === 'asc'
                    ? 'chevron-up'
                    : 'chevron-down'
                  : 'chevron-expand'
              }
              size={14}
              color={sortConfig.key === column.key ? '#1A1A1A' : '#999999'}
            />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  // 渲染行
  const renderItem = useCallback(
    ({ item }: { item: TableData }) => {
      return (
        <View
          style={[
            styles.row,
            selectedItems.has(item.id) && styles.selectedRow,
          ]}
        >
          {selectable && showCheckboxes && (
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => toggleSelection(item.id)}
            >
              <Ionicons
                name={selectedItems.has(item.id) ? 'checkbox' : 'square-outline'}
                size={20}
                color="#1A1A1A"
              />
            </TouchableOpacity>
          )}
          {columns.map((column) => {
            const isEditing = editingCell === `${item.id}:${column.key}`;
            const cellValue = getCellValue(item, column.key);
            const cellError = getCellError(item, column.key);
            const isChanged = isCellChanged(item, column.key);
            
            return (
              <View
                key={column.key}
                style={[
                  styles.cell, 
                  column.width ? { width: column.width } : { flex: 1 },
                  isChanged && styles.changedCell,
                  cellError && styles.errorCell,
                ]}
              >
                {column.editable && !readOnly ? (
                  <EditableCell
                    value={cellValue}
                    isEditing={isEditing}
                    error={cellError}
                    onStartEdit={() => startEditing(item.id, column.key)}
                    onFinishEdit={(newValue) => finishEditing(item.id, column.key, newValue)}
                    onPress={!isEditing && onRowPress ? () => onRowPress(item) : undefined}
                    render={column.render}
                    item={item}
                  />
                ) : (
                  <TouchableOpacity
                    style={styles.cellContent}
                    onPress={onRowPress ? () => onRowPress(item) : undefined}
                    disabled={!onRowPress}
                    activeOpacity={onRowPress ? 0.7 : 1}
                  >
                    {column.render ? (
                      column.render(cellValue, item)
                    ) : (
                      <Text style={styles.cellText} numberOfLines={1}>
                        {cellValue || '-'}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      );
    },
    [
      columns, 
      selectedItems, 
      selectable, 
      showCheckboxes, 
      toggleSelection, 
      onRowPress,
      editingCell,
      getCellValue,
      getCellError,
      isCellChanged,
      startEditing,
      finishEditing,
      readOnly,
    ]
  );

  return (
    <View style={styles.container}>
      {/* 儲存控制列 */}
      {saveMode === 'batch' && showSaveButton && pendingChanges.size > 0 && (
        <View style={styles.saveBar}>
          <Text style={styles.saveBarText}>
            {pendingChanges.size} 個未儲存的變更
          </Text>
          <View style={styles.saveBarButtons}>
            <TouchableOpacity
              style={[styles.saveBarButton, styles.discardButton]}
              onPress={discardChanges}
              activeOpacity={0.7}
            >
              <Text style={styles.discardButtonText}>放棄</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBarButton, styles.saveButton]}
              onPress={handleBatchSave}
              disabled={isSaving}
              activeOpacity={0.7}
            >
              <Text style={styles.saveButtonText}>
                {isSaving ? '儲存中...' : '儲存'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 搜尋列 */}
      {searchable && (
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={handleSearch}
            placeholder="搜尋資料..."
          />
        </View>
      )}

      {/* 表格 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <View style={styles.tableContainer}>
          {renderHeader()}
          <FlashList
            data={processedData}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            estimatedItemSize={60}
            extraData={{ 
              selectable, 
              showCheckboxes, 
              editingCell, 
              pendingChanges: pendingChanges.size 
            }}
            refreshControl={
              onRefresh ? (
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              ) : undefined
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>沒有找到資料</Text>
              </View>
            }
          />
        </View>
      </ScrollView>

      {/* 即時儲存指示器 */}
      {saveMode === 'realtime' && isSaving && (
        <View style={styles.savingIndicator}>
          <Text style={styles.savingText}>儲存中...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  saveBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FFEAA7',
  },
  saveBarText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#856404',
  },
  saveBarButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  saveBarButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  discardButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#DC3545',
  },
  discardButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#DC3545',
  },
  saveButton: {
    backgroundColor: '#28A745',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E3E1DC',
  },
  tableContainer: {
    minWidth: '100%',
  },
  header: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E3E1DC',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    minWidth: 120,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7A7A7A',
  },
  editableHeaderText: {
    color: '#1A1A1A',
  },
  editableIndicator: {
    fontSize: 12,
  },
  row: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingVertical: 4,
    paddingHorizontal: 16,
    minHeight: 60,
    alignItems: 'center',
  },
  selectedRow: {
    backgroundColor: '#F0F0F0',
  },
  cell: {
    justifyContent: 'center',
    minWidth: 120,
    paddingVertical: 8,
  },
  changedCell: {
    backgroundColor: '#E8F4FD',
  },
  errorCell: {
    backgroundColor: '#FFE5E5',
  },
  cellContent: {
    flex: 1,
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  checkboxContainer: {
    width: 40,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#7A7A7A',
  },
  savingIndicator: {
    position: 'absolute',
    top: 100,
    right: 20,
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  savingText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
});