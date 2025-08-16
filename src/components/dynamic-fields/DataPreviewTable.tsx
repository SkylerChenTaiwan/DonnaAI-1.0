/**
 * DataPreviewTable - 動態資料預覽表格元件
 * 支援雙模式顯示（表格/卡片）、分頁、排序和錯誤高亮
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Platform, ListRenderItem } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import {
  AdaptiveView,
  AdaptiveText,
  AdaptiveButton,
  AdaptiveInput,
  AdaptiveSelect,
  type AdaptiveViewProps,
} from '@/components/adaptive';
import { withAlpha } from '@/utils/colors';
import { DynamicFieldConfig, ValidationError } from '@/types/dynamic-field-mapping';

interface DataPreviewTableProps {
  data: Record<string, unknown>[];
  fields: DynamicFieldConfig[];
  errors: ValidationError[];
  loading?: boolean;
  viewMode?: 'table' | 'cards' | 'auto';
  pageSize?: number;
  sortable?: boolean;
  searchable?: boolean;
  onRowSelect?: (indices: number[]) => void;
  onCellEdit?: (rowIndex: number, fieldKey: string, value: unknown) => void;
  style?: AdaptiveViewProps['style'];
}

interface SortConfig {
  field: string | null;
  direction: 'asc' | 'desc';
}

interface TableRowData {
  index: number;
  data: Record<string, unknown>;
  errors: ValidationError[];
  isSelected: boolean;
}

export const DataPreviewTable: React.FC<DataPreviewTableProps> = ({
  data,
  fields,
  errors,
  loading = false,
  viewMode = 'auto',
  pageSize = 50,
  sortable = true,
  searchable = true,
  onRowSelect,
  onCellEdit,
  style,
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: null, direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [actualViewMode, setActualViewMode] = useState<'table' | 'cards'>(
    viewMode === 'auto' ? (Platform.OS === 'web' ? 'table' : 'cards') : viewMode
  );

  const flashListRef = useRef<FlashList<TableRowData>>(null);

  /**
   * 計算實際顯示模式
   */
  React.useEffect(() => {
    if (viewMode === 'auto') {
      setActualViewMode(Platform.OS === 'web' ? 'table' : 'cards');
    } else {
      setActualViewMode(viewMode);
    }
  }, [viewMode]);

  /**
   * 篩選和搜尋資料
   */
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;

    const searchLower = searchTerm.toLowerCase();
    return data.filter((row, index) => {
      // 搜尋所有可見欄位的值
      return fields.some(field => {
        const value = row[field.fieldKey];
        if (value == null) return false;
        return String(value).toLowerCase().includes(searchLower);
      });
    });
  }, [data, fields, searchTerm]);

  /**
   * 排序資料
   */
  const sortedData = useMemo(() => {
    if (!sortConfig.field) return filteredData;

    const sorted = [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.field!];
      const bVal = b[sortConfig.field!];

      // 處理 null/undefined
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      // 根據資料類型排序
      const field = fields.find(f => f.fieldKey === sortConfig.field);
      if (field) {
        switch (field.dataType) {
          case 'number':
          case 'currency':
          case 'percentage':
            const numA = Number(aVal) || 0;
            const numB = Number(bVal) || 0;
            return sortConfig.direction === 'asc' ? numA - numB : numB - numA;

          case 'date':
          case 'datetime':
            const dateA = new Date(aVal as string).getTime() || 0;
            const dateB = new Date(bVal as string).getTime() || 0;
            return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;

          case 'boolean':
            const boolA = Boolean(aVal);
            const boolB = Boolean(bVal);
            return sortConfig.direction === 'asc' 
              ? (boolA === boolB ? 0 : boolA ? 1 : -1)
              : (boolA === boolB ? 0 : boolA ? -1 : 1);

          default:
            // 文字排序
            const strA = String(aVal).toLowerCase();
            const strB = String(bVal).toLowerCase();
            return sortConfig.direction === 'asc' 
              ? strA.localeCompare(strB)
              : strB.localeCompare(strA);
        }
      }

      // 預設字串排序
      const strA = String(aVal).toLowerCase();
      const strB = String(bVal).toLowerCase();
      return sortConfig.direction === 'asc' 
        ? strA.localeCompare(strB)
        : strB.localeCompare(strA);
    });

    return sorted;
  }, [filteredData, sortConfig, fields]);

  /**
   * 分頁資料
   */
  const pagedData = useMemo(() => {
    const startIndex = currentPage * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedData.slice(startIndex, endIndex).map((row, localIndex) => {
      const globalIndex = startIndex + localIndex;
      const rowErrors = errors.filter(error => error.recordIndex === globalIndex);
      
      return {
        index: globalIndex,
        data: row,
        errors: rowErrors,
        isSelected: selectedRows.has(globalIndex),
      };
    });
  }, [sortedData, currentPage, pageSize, errors, selectedRows]);

  /**
   * 總頁數
   */
  const totalPages = Math.ceil(sortedData.length / pageSize);

  /**
   * 處理排序
   */
  const handleSort = useCallback((fieldKey: string) => {
    if (!sortable) return;

    setSortConfig(prev => ({
      field: fieldKey,
      direction: prev.field === fieldKey && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, [sortable]);

  /**
   * 處理行選擇
   */
  const handleRowSelect = useCallback((index: number, selected: boolean) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(index);
      } else {
        newSet.delete(index);
      }
      
      onRowSelect?.(Array.from(newSet));
      return newSet;
    });
  }, [onRowSelect]);

  /**
   * 全選/反選
   */
  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      const allIndices = new Set(pagedData.map(row => row.index));
      setSelectedRows(allIndices);
      onRowSelect?.(Array.from(allIndices));
    } else {
      setSelectedRows(new Set());
      onRowSelect?.([]);
    }
  }, [pagedData, onRowSelect]);

  /**
   * 格式化欄位值顯示
   */
  const formatFieldValue = useCallback((field: DynamicFieldConfig, value: unknown): string => {
    if (value == null) return '-';

    try {
      switch (field.dataType) {
        case 'date':
          return new Date(value as string).toLocaleDateString();
        case 'datetime':
          return new Date(value as string).toLocaleString();
        case 'boolean':
          return value ? '是' : '否';
        case 'currency':
          return `$${Number(value).toLocaleString()}`;
        case 'percentage':
          return `${Number(value)}%`;
        case 'json':
        case 'array':
          return JSON.stringify(value);
        default:
          return String(value);
      }
    } catch {
      return String(value);
    }
  }, []);

  /**
   * 檢查儲存格是否有錯誤
   */
  const getCellError = useCallback((rowIndex: number, fieldKey: string): ValidationError | null => {
    return errors.find(error => 
      error.recordIndex === rowIndex && error.field === fieldKey
    ) || null;
  }, [errors]);

  /**
   * 渲染表格標題（Web only）
   */
  const renderTableHeader = () => {
    if (actualViewMode !== 'table') return null;

    return (
      <AdaptiveView style={{
        flexDirection: 'row',
        backgroundColor: '#F2F2F7',
        borderBottomWidth: 2,
        borderBottomColor: '#E3E1DC',
        paddingVertical: 12,
        paddingHorizontal: 8,
      }}>
        {/* 選擇欄 */}
        {onRowSelect && (
          <AdaptiveView style={{ width: 50, alignItems: 'center' }}>
            <AdaptiveButton
              onPress={() => handleSelectAll(selectedRows.size === 0)}
              style={{ padding: 4 }}
            >
              <AdaptiveText style={{ fontSize: 14 }}>
                {selectedRows.size === pagedData.length && pagedData.length > 0 ? '☑' : '☐'}
              </AdaptiveText>
            </AdaptiveButton>
          </AdaptiveView>
        )}

        {/* 索引欄 */}
        <AdaptiveView style={{ width: 60, paddingHorizontal: 8 }}>
          <AdaptiveText style={{ fontWeight: '600', fontSize: 12, color: '#8E8E93' }}>
            #
          </AdaptiveText>
        </AdaptiveView>

        {/* 資料欄位 */}
        {fields.map((field) => (
          <AdaptiveView key={field.fieldKey} style={{ flex: 1, paddingHorizontal: 8, minWidth: 120 }}>
            <AdaptiveButton
              onPress={() => handleSort(field.fieldKey)}
              disabled={!sortable}
              style={{ alignItems: 'flex-start' }}
            >
              <AdaptiveView style={{ flexDirection: 'row', alignItems: 'center' }}>
                <AdaptiveText style={{ 
                  fontWeight: '600', 
                  fontSize: 12, 
                  color: '#1C1C1E',
                  marginRight: 4,
                }}>
                  {field.displayName}
                </AdaptiveText>
                {sortable && sortConfig.field === field.fieldKey && (
                  <AdaptiveText style={{ fontSize: 10, color: '#007AFF' }}>
                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                  </AdaptiveText>
                )}
              </AdaptiveView>
              <AdaptiveText style={{ fontSize: 10, color: '#8E8E93' }}>
                {field.dataType}
              </AdaptiveText>
            </AdaptiveButton>
          </AdaptiveView>
        ))}
      </AdaptiveView>
    );
  };

  /**
   * 渲染表格行
   */
  const renderTableRow: ListRenderItem<TableRowData> = useCallback(({ item }) => {
    const hasErrors = item.errors.length > 0;

    if (actualViewMode === 'table') {
      // Web 表格行
      return (
        <AdaptiveView style={{
          flexDirection: 'row',
          backgroundColor: item.isSelected 
            ? withAlpha('#007AFF', 0.1)
            : hasErrors 
              ? withAlpha('#FF3B30', 0.05)
              : '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#E3E1DC',
          paddingVertical: 8,
          paddingHorizontal: 8,
          minHeight: 44,
        }}>
          {/* 選擇欄 */}
          {onRowSelect && (
            <AdaptiveView style={{ width: 50, alignItems: 'center', justifyContent: 'center' }}>
              <AdaptiveButton
                onPress={() => handleRowSelect(item.index, !item.isSelected)}
                style={{ padding: 4 }}
              >
                <AdaptiveText style={{ fontSize: 14 }}>
                  {item.isSelected ? '☑' : '☐'}
                </AdaptiveText>
              </AdaptiveButton>
            </AdaptiveView>
          )}

          {/* 索引欄 */}
          <AdaptiveView style={{ width: 60, paddingHorizontal: 8, justifyContent: 'center' }}>
            <AdaptiveText style={{ fontSize: 12, color: '#8E8E93' }}>
              {item.index + 1}
            </AdaptiveText>
          </AdaptiveView>

          {/* 資料欄位 */}
          {fields.map((field) => {
            const value = item.data[field.fieldKey];
            const cellError = getCellError(item.index, field.fieldKey);
            
            return (
              <AdaptiveView 
                key={field.fieldKey} 
                style={{ 
                  flex: 1, 
                  paddingHorizontal: 8, 
                  justifyContent: 'center',
                  minWidth: 120,
                  backgroundColor: cellError ? withAlpha('#FF3B30', 0.1) : 'transparent',
                  borderRadius: cellError ? 4 : 0,
                }}
              >
                <AdaptiveText 
                  style={{ 
                    fontSize: 12, 
                    color: cellError ? '#FF3B30' : '#1C1C1E',
                    fontWeight: cellError ? '600' : '400',
                  }}
                  numberOfLines={2}
                >
                  {formatFieldValue(field, value)}
                </AdaptiveText>
                {cellError && (
                  <AdaptiveText style={{ fontSize: 10, color: '#FF3B30', marginTop: 2 }}>
                    {cellError.message}
                  </AdaptiveText>
                )}
              </AdaptiveView>
            );
          })}
        </AdaptiveView>
      );
    } else {
      // Mobile 卡片視圖
      return (
        <AdaptiveView style={{
          backgroundColor: item.isSelected 
            ? withAlpha('#007AFF', 0.1)
            : hasErrors 
              ? withAlpha('#FF3B30', 0.05)
              : '#FFFFFF',
          marginHorizontal: 16,
          marginVertical: 6,
          padding: 16,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: item.isSelected 
            ? '#007AFF' 
            : hasErrors 
              ? '#FF3B30'
              : '#E3E1DC',
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 2,
        }}>
          {/* 標題行 */}
          <AdaptiveView style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <AdaptiveText style={{ fontSize: 16, fontWeight: '600', color: '#1C1C1E' }}>
              記錄 #{item.index + 1}
            </AdaptiveText>
            <AdaptiveView style={{ flexDirection: 'row', alignItems: 'center' }}>
              {hasErrors && (
                <AdaptiveText style={{ fontSize: 12, color: '#FF3B30', fontWeight: '600', marginRight: 8 }}>
                  {item.errors.length} 個錯誤
                </AdaptiveText>
              )}
              {onRowSelect && (
                <AdaptiveButton
                  onPress={() => handleRowSelect(item.index, !item.isSelected)}
                  style={{ padding: 4 }}
                >
                  <AdaptiveText style={{ fontSize: 16 }}>
                    {item.isSelected ? '☑' : '☐'}
                  </AdaptiveText>
                </AdaptiveButton>
              )}
            </AdaptiveView>
          </AdaptiveView>

          {/* 欄位資料 */}
          <AdaptiveView style={{ gap: 8 }}>
            {fields.slice(0, 6).map((field) => { // 只顯示前 6 個欄位避免卡片太長
              const value = item.data[field.fieldKey];
              const cellError = getCellError(item.index, field.fieldKey);
              
              return (
                <AdaptiveView key={field.fieldKey} style={{ flexDirection: 'row' }}>
                  <AdaptiveText style={{ 
                    width: 100, 
                    fontSize: 12, 
                    color: '#8E8E93', 
                    fontWeight: '500' 
                  }}>
                    {field.displayName}:
                  </AdaptiveText>
                  <AdaptiveView style={{ flex: 1 }}>
                    <AdaptiveText style={{ 
                      fontSize: 12, 
                      color: cellError ? '#FF3B30' : '#1C1C1E',
                      fontWeight: cellError ? '600' : '400',
                    }}>
                      {formatFieldValue(field, value)}
                    </AdaptiveText>
                    {cellError && (
                      <AdaptiveText style={{ fontSize: 10, color: '#FF3B30', marginTop: 2 }}>
                        ❌ {cellError.message}
                      </AdaptiveText>
                    )}
                  </AdaptiveView>
                </AdaptiveView>
              );
            })}
            
            {fields.length > 6 && (
              <AdaptiveText style={{ fontSize: 12, color: '#8E8E93', fontStyle: 'italic', textAlign: 'center', marginTop: 4 }}>
                ... 還有 {fields.length - 6} 個欄位
              </AdaptiveText>
            )}
          </AdaptiveView>
        </AdaptiveView>
      );
    }
  }, [actualViewMode, onRowSelect, handleRowSelect, fields, formatFieldValue, getCellError]);

  return (
    <AdaptiveView style={[{ flex: 1 }, style]}>
      {/* 工具列 */}
      <AdaptiveView style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E3E1DC',
        gap: 12,
      }}>
        {/* 搜尋 */}
        {searchable && (
          <AdaptiveInput
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="搜尋資料..."
            style={{
              flex: 1,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderWidth: 1,
              borderColor: '#E3E1DC',
              borderRadius: 8,
              fontSize: 14,
            }}
          />
        )}

        {/* 視圖切換 */}
        <AdaptiveSelect
          value={actualViewMode}
          onValueChange={(value) => setActualViewMode(value as 'table' | 'cards')}
          options={[
            { label: '表格', value: 'table' },
            { label: '卡片', value: 'cards' },
          ]}
          style={{ minWidth: 80 }}
        />

        {/* 每頁筆數 */}
        <AdaptiveSelect
          value={pageSize.toString()}
          onValueChange={(value) => {
            const newPageSize = parseInt(value);
            setCurrentPage(0); // 重置到第一頁
          }}
          options={[
            { label: '25', value: '25' },
            { label: '50', value: '50' },
            { label: '100', value: '100' },
          ]}
          style={{ minWidth: 60 }}
        />
      </AdaptiveView>

      {/* 資料統計 */}
      <AdaptiveView style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#F2F2F7',
      }}>
        <AdaptiveText style={{ fontSize: 12, color: '#8E8E93' }}>
          顯示 {currentPage * pageSize + 1}-{Math.min((currentPage + 1) * pageSize, sortedData.length)} / {sortedData.length} 筆記錄
          {filteredData.length !== data.length && ` (已篩選 ${data.length} 筆)`}
        </AdaptiveText>
        
        {errors.length > 0 && (
          <AdaptiveText style={{ fontSize: 12, color: '#FF3B30', fontWeight: '600' }}>
            {errors.length} 個驗證錯誤
          </AdaptiveText>
        )}
      </AdaptiveView>

      {/* 表格標題 */}
      {renderTableHeader()}

      {/* 資料列表 */}
      {loading ? (
        <AdaptiveView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <AdaptiveText style={{ color: '#8E8E93' }}>載入中...</AdaptiveText>
        </AdaptiveView>
      ) : pagedData.length === 0 ? (
        <AdaptiveView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <AdaptiveText style={{ fontSize: 16, color: '#8E8E93', textAlign: 'center' }}>
            {searchTerm ? '沒有符合搜尋條件的資料' : '沒有資料'}
          </AdaptiveText>
        </AdaptiveView>
      ) : (
        <FlashList
          ref={flashListRef}
          data={pagedData}
          renderItem={renderTableRow}
          keyExtractor={(item) => `row-${item.index}`}
          estimatedItemSize={actualViewMode === 'table' ? 44 : 180}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={actualViewMode === 'cards' ? { paddingBottom: 16 } : undefined}
        />
      )}

      {/* 分頁控制 */}
      {totalPages > 1 && (
        <AdaptiveView style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 16,
          borderTopWidth: 1,
          borderTopColor: '#E3E1DC',
        }}>
          <AdaptiveButton
            onPress={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            style={{
              backgroundColor: currentPage === 0 ? '#8E8E93' : '#007AFF',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 6,
            }}
          >
            <AdaptiveText style={{ color: '#FFFFFF', fontSize: 14 }}>上一頁</AdaptiveText>
          </AdaptiveButton>

          <AdaptiveText style={{ fontSize: 14, color: '#1C1C1E' }}>
            第 {currentPage + 1} / {totalPages} 頁
          </AdaptiveText>

          <AdaptiveButton
            onPress={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage === totalPages - 1}
            style={{
              backgroundColor: currentPage === totalPages - 1 ? '#8E8E93' : '#007AFF',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 6,
            }}
          >
            <AdaptiveText style={{ color: '#FFFFFF', fontSize: 14 }}>下一頁</AdaptiveText>
          </AdaptiveButton>
        </AdaptiveView>
      )}
    </AdaptiveView>
  );
};

export default DataPreviewTable;