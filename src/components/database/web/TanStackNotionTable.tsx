/**
 * TanStack Table 實作的 Notion 風格資料庫表格
 */

import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { flexRender } from '@tanstack/react-table';
import { TanStackTableProps, TableData } from '../shared/tableTypes';
import { useNotionTable } from './hooks/useNotionTable';
import { useNotionColumns } from './hooks/useNotionColumns';
import { NotionTableCell } from './NotionTableCell';
import { NotionCheckbox } from './NotionCheckbox';
import { generateColumnsByType, convertToTanStackColumns } from '../shared/tableUtils';
import { TableColumn } from '@/types/table';
import { Icon } from '@/components/common/Icon';

export const TanStackNotionTable: React.FC<TanStackTableProps> = ({
  data,
  columns: propColumns,
  onAddRow,
  onUpdateCell,
  onColumnsReorder,
  onRowPress,
  multiSelectMode = false,
  selectedItems = [],
  onSelect,
  refreshing = false,
  onRefresh,
  loading = false,
  sortConfig,
  onSort,
  enableColumnDrag = false,
}) => {
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [newRowData, setNewRowData] = useState<Record<string, any>>({});

  // 判斷資料類型
  const dataType = useMemo(() => {
    if (!data.length) return 'customers'; // 預設
    
    // 檢查資料結構判斷類型
    if (data[0].hasOwnProperty('company')) return 'customers';
    if (data[0].hasOwnProperty('customerName')) return 'records';
    if (data[0].hasOwnProperty('assignee')) return 'tasks';
    
    return 'customers';
  }, [data]);

  // 生成欄位定義 - 使用傳入的 columns 參數
  const generatedColumns = useNotionColumns({
    onUpdateCell,
    onColumnsReorder,
    activeTab: dataType,
    includeSelectColumn: multiSelectMode,
  });

  // 使用傳入的 columns，如果沒有則使用生成的
  const baseColumns = propColumns && propColumns.length > 0 
    ? convertToTanStackColumns(propColumns, onUpdateCell)
    : generatedColumns.filter(col => col.id !== 'select'); // 移除自動生成的選擇列
  
  // 手動添加選擇列（如果需要）
  const columns = useMemo(() => {
    const result = [...baseColumns];
    
    if (multiSelectMode) {
      result.unshift({
        id: 'select',
        header: ({ table }) => (
          <NotionCheckbox
            checked={table.getIsAllRowsSelected()}
            indeterminate={table.getIsSomeRowsSelected()}
            onChange={(checked) => table.toggleAllRowsSelected(checked)}
          />
        ),
        cell: ({ row }) => (
          <NotionCheckbox
            checked={row.getIsSelected()}
            onChange={(checked) => row.toggleSelected(checked)}
          />
        ),
        size: 40,
        enableSorting: false,
      });
    }
    
    return result;
  }, [baseColumns, multiSelectMode]);
  
  console.log('🔍 TanStackNotionTable columns 調試:', {
    propColumns: propColumns?.length || 0,
    generatedColumns: generatedColumns.length,
    finalColumns: columns.length,
    dataType,
    multiSelectMode
  });

  // 建立表格實例
  const { table, selectedRows, setSelectedRows } = useNotionTable({
    data,
    columns,
    enableRowSelection: multiSelectMode,
  });

  // 同步選擇狀態
  React.useEffect(() => {
    if (onSelect && multiSelectMode) {
      const selected = Object.keys(selectedRows).filter(id => selectedRows[id]);
      onSelect(selected);
    }
  }, [selectedRows, onSelect, multiSelectMode]);

  // 處理新增行
  const handleAddRow = useCallback(async () => {
    if (!onAddRow) return;
    
    try {
      setIsAddingRow(true);
      
      // 如果是內聯新增模式且有資料
      if (Object.keys(newRowData).length > 0) {
        await onAddRow(newRowData);
        setNewRowData({});
        setIsAddingRow(false);
      } else {
        // 調用父組件的新增邏輯
        await onAddRow();
        setIsAddingRow(false);
      }
    } catch (error) {
      console.error('新增行失敗:', error);
      setIsAddingRow(false);
    }
  }, [onAddRow, newRowData]);

  // 處理新增行的儲存格變更
  const handleNewRowCellChange = useCallback((columnKey: string, value: any) => {
    setNewRowData(prev => ({
      ...prev,
      [columnKey]: value,
    }));
  }, []);

  // 取消新增行
  const handleCancelAddRow = useCallback(() => {
    setIsAddingRow(false);
    setNewRowData({});
  }, []);

  // 確認新增行
  const handleConfirmAddRow = useCallback(async () => {
    if (Object.keys(newRowData).length === 0) {
      setIsAddingRow(false);
      return;
    }
    
    try {
      if (onAddRow) {
        await onAddRow(newRowData);
      }
      setNewRowData({});
      setIsAddingRow(false);
    } catch (error) {
      console.error('確認新增行失敗:', error);
    }
  }, [newRowData, onAddRow]);

  // 渲染表頭
  const renderHeader = () => (
    <View style={styles.tableHeader}>
      {table.getHeaderGroups().map((headerGroup) => (
        <View key={headerGroup.id} style={styles.headerRow}>
          {headerGroup.headers.map((header) => {
            const column = header.column;
            const canSort = column.getCanSort();
            const sorted = column.getIsSorted();

            return (
              <TouchableOpacity
                key={header.id}
                style={[
                  styles.headerCell,
                  { width: header.getSize() || 'auto' }
                ]}
                onPress={() => {
                  if (canSort && onSort) {
                    onSort(column.id);
                  } else if (canSort) {
                    column.toggleSorting();
                  }
                }}
                disabled={!canSort}
                activeOpacity={canSort ? 0.7 : 1}
              >
                <View style={styles.headerContent}>
                  <Text style={styles.headerText}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </Text>
                  {canSort && (
                    <View style={styles.sortIcon}>
                      {sorted === 'asc' && (
                        <Icon name="chevron-up-outline" size={16} color="#666" />
                      )}
                      {sorted === 'desc' && (
                        <Icon name="chevron-down-outline" size={16} color="#666" />
                      )}
                      {!sorted && (
                        <Icon name="swap-vertical-outline" size={16} color="#ccc" />
                      )}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );

  // 渲染資料行
  const renderRows = () => (
    <View style={styles.tableBody}>
      {table.getRowModel().rows.map((row) => {
        const isSelected = multiSelectMode && selectedItems.includes(row.original.id);
        
        return (
          <TouchableOpacity
            key={row.id}
            style={[
              styles.tableRow,
              isSelected && styles.selectedRow,
            ]}
            onPress={() => {
              if (multiSelectMode) {
                row.toggleSelected();
              } else if (onRowPress) {
                onRowPress(row.original);
              }
            }}
            activeOpacity={0.7}
          >
            {row.getVisibleCells().map((cell) => (
              <View
                key={cell.id}
                style={[
                  styles.tableCell,
                  { width: cell.column.getSize() || 'auto' }
                ]}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </View>
            ))}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // 渲染新增行
  const renderAddRow = () => {
    if (!onAddRow) return null;

    return (
      <View style={styles.addRowContainer}>
        {isAddingRow ? (
          <View style={styles.addingRow}>
            {table.getHeaderGroups()[0]?.headers.map((header) => {
              const columnId = header.column.id;
              
              // 跳過選擇列
              if (columnId === 'select') {
                return (
                  <View
                    key={columnId}
                    style={[
                      styles.addRowCell,
                      { width: header.getSize() || 40 }
                    ]}
                  />
                );
              }

              return (
                <View
                  key={columnId}
                  style={[
                    styles.addRowCell,
                    { width: header.getSize() || 150 }
                  ]}
                >
                  <NotionTableCell
                    value={newRowData[columnId] || ''}
                    onChange={(value) => handleNewRowCellChange(columnId, value)}
                    placeholder={`輸入${header.column.columnDef.header}`}
                    type="text"
                  />
                </View>
              );
            })}
            <View style={styles.addRowActions}>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConfirmAddRow}
                activeOpacity={0.7}
              >
                <Icon name="checkmark-outline" size={16} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelAddRow}
                activeOpacity={0.7}
              >
                <Icon name="close-outline" size={16} color="#666" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addRowButton}
            onPress={() => setIsAddingRow(true)}
            activeOpacity={0.7}
          >
            <Icon name="add-outline" size={18} color="#666" />
            <Text style={styles.addRowText}>新增頁面</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // 空狀態
  if (!data.length && !loading) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyContent}>
          <Icon name="document-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>沒有資料</Text>
          <Text style={styles.emptySubtitle}>點選「新增頁面」開始建立第一筆資料</Text>
          {renderAddRow()}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.table}>
          {renderHeader()}
          {renderRows()}
          {renderAddRow()}
        </View>
      </ScrollView>
      
      {refreshing && (
        <View style={styles.refreshIndicator}>
          <Text style={styles.refreshText}>重新載入中...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  table: {
    minWidth: '100%',
  },
  
  // 表頭樣式
  tableHeader: {
    backgroundColor: '#f7f6f3',
    borderBottomWidth: 1,
    borderBottomColor: '#e9e9e7',
  },
  headerRow: {
    flexDirection: 'row',
    minHeight: 40,
  },
  headerCell: {
    minWidth: 120,
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: '#e9e9e7',
    justifyContent: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#37352f',
    flex: 1,
  },
  sortIcon: {
    marginLeft: 4,
  },
  
  // 表格內容樣式
  tableBody: {
    backgroundColor: '#ffffff',
  },
  tableRow: {
    flexDirection: 'row',
    minHeight: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1ef',
    alignItems: 'center',
  },
  selectedRow: {
    backgroundColor: '#e8f4f8',
  },
  tableCell: {
    minWidth: 120,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRightWidth: 1,
    borderRightColor: '#f1f1ef',
    justifyContent: 'center',
  },
  
  // 新增行樣式
  addRowContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1ef',
  },
  addRowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
    opacity: 0.6,
  },
  addRowText: {
    fontSize: 14,
    color: '#666',
  },
  addingRow: {
    flexDirection: 'row',
    minHeight: 40,
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  addRowCell: {
    minWidth: 120,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRightWidth: 1,
    borderRightColor: '#f1f1ef',
  },
  addRowActions: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    gap: 8,
  },
  confirmButton: {
    backgroundColor: '#0f7b0f',
    borderRadius: 4,
    padding: 4,
  },
  cancelButton: {
    backgroundColor: '#f1f1ef',
    borderRadius: 4,
    padding: 4,
  },
  
  // 空狀態樣式
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  emptyContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#37352f',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#787774',
    textAlign: 'center',
    marginBottom: 24,
  },
  
  // 重新載入指示器
  refreshIndicator: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  refreshText: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f7f6f3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
});