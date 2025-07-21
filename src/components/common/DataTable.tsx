/**
 * 資料表格元件
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { SearchBar } from './SearchBar';
import { useTableData } from '@/hooks/useTableData';
import { TableProps, TableData } from '@/types/table';

export const DataTable = ({
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
}: TableProps) => {
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
  } = useTableData(data, React.useMemo(() => ({ 
    filters,
    initialSortKey: externalSortConfig?.key,
    initialSortDirection: externalSortConfig?.direction,
  }), [JSON.stringify(filters), externalSortConfig?.key, externalSortConfig?.direction]));

  // 處理選擇變更 - 使用 useRef 避免 onSelect 依賴
  const onSelectRef = React.useRef(onSelect);
  onSelectRef.current = onSelect;
  
  React.useEffect(() => {
    if (onSelectRef.current) {
      onSelectRef.current(Array.from(selectedItems));
    }
  }, [selectedItems]);

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
            color="#007AFF"
          />
        </TouchableOpacity>
      )}
      {columns.map((column) => (
        <TouchableOpacity
          key={column.key}
          style={[styles.headerCell, column.width ? { width: column.width } : { flex: 1 }]}
          onPress={() => column.sortable && handleSort(column.key)}
          disabled={!column.sortable}
        >
          <Text style={styles.headerText}>{column.title}</Text>
          {column.sortable && sortConfig.key === column.key && (
            <Ionicons
              name={
                sortConfig.direction === 'asc'
                  ? 'chevron-up'
                  : 'chevron-down'
              }
              size={16}
              color="#007AFF"
            />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  // 渲染行
  const renderItem = useCallback(
    ({ item }: { item: TableData }) => {
      // 在多選模式下，整行都是可點擊的
      console.log('🔍 renderItem:', { 
        itemId: item.id, 
        selectable, 
        showCheckboxes,
        shouldShowCheckbox: selectable && showCheckboxes 
      });
      if (selectable && showCheckboxes) {
        return (
          <TouchableOpacity
            style={[
              styles.row,
              selectedItems.has(item.id) && styles.selectedRow,
            ]}
            onPress={() => toggleSelection(item.id)}
            activeOpacity={0.7}
          >
            <View style={styles.checkboxContainer}>
              <Ionicons
                name={selectedItems.has(item.id) ? 'checkbox' : 'square-outline'}
                size={20}
                color="#007AFF"
              />
            </View>
            {columns.map((column) => (
              <View
                key={column.key}
                style={[styles.cell, column.width ? { width: column.width } : { flex: 1 }]}
              >
                {column.render ? (
                  column.render(item[column.key], item)
                ) : (
                  <Text style={styles.cellText} numberOfLines={1}>
                    {item[column.key] || '-'}
                  </Text>
                )}
              </View>
            ))}
          </TouchableOpacity>
        );
      }
      
      // 非多選模式下，點擊行會觸發 onRowPress
      return (
        <TouchableOpacity
          style={[
            styles.row,
            selectedItems.has(item.id) && styles.selectedRow,
          ]}
          onPress={() => onRowPress && onRowPress(item)}
          activeOpacity={0.7}
        >
          {columns.map((column) => (
            <View
              key={column.key}
              style={[styles.cell, column.width ? { width: column.width } : { flex: 1 }]}
            >
              {column.render ? (
                column.render(item[column.key], item)
              ) : (
                <Text style={styles.cellText} numberOfLines={1}>
                  {item[column.key] || '-'}
                </Text>
              )}
            </View>
          ))}
        </TouchableOpacity>
      );
    },
    [columns, selectedItems, selectable, showCheckboxes, toggleSelection, onRowPress]
  );

  return (
    <View style={styles.container}>
      {searchable && (
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={handleSearch}
            placeholder="搜尋資料..."
          />
        </View>
      )}
      {renderHeader()}
      <FlashList
        data={processedData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        estimatedItemSize={60}
        extraData={{ selectable, showCheckboxes }}
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  header: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  row: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 60,
    alignItems: 'center',
  },
  selectedRow: {
    backgroundColor: '#F2F2F7',
  },
  cell: {
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 16,
    color: '#1C1C1E',
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
    color: '#8E8E93',
  },
});