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
  } = useTableData(data);

  // 處理選擇變更
  React.useEffect(() => {
    if (onSelect) {
      onSelect(Array.from(selectedItems));
    }
  }, [selectedItems, onSelect]);

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
              selectedItems.size === processedData.length
                ? 'checkbox'
                : selectedItems.size > 0
                ? 'square-outline'
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
          style={[styles.headerCell, { width: column.width }]}
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
    ({ item }: { item: TableData }) => (
      <TouchableOpacity
        style={[
          styles.row,
          selectedItems.has(item.id) && styles.selectedRow,
        ]}
        onPress={() => {
          if (selectable && showCheckboxes) {
            toggleSelection(item.id);
          } else if (onRowPress) {
            onRowPress(item);
          }
        }}
        activeOpacity={0.7}
      >
        {selectable && showCheckboxes && (
          <View style={styles.checkboxContainer}>
            <Ionicons
              name={
                selectedItems.has(item.id) ? 'checkbox' : 'square-outline'
              }
              size={20}
              color="#007AFF"
            />
          </View>
        )}
        {columns.map((column) => (
          <View
            key={column.key}
            style={[styles.cell, { width: column.width }]}
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
    ),
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
      {selectedItems.size > 0 && (
        <View style={styles.bulkActionsBar}>
          <Text style={styles.bulkActionsText}>
            已選擇 {selectedItems.size} 個項目
          </Text>
          <TouchableOpacity
            onPress={clearSelection}
            style={styles.bulkActionButton}
          >
            <Text style={styles.bulkActionButtonText}>取消選擇</Text>
          </TouchableOpacity>
        </View>
      )}
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
    flex: 1,
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
  },
  selectedRow: {
    backgroundColor: '#F2F2F7',
  },
  cell: {
    flex: 1,
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  checkboxContainer: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
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
  bulkActionsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    height: 60,
  },
  bulkActionsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bulkActionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  bulkActionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});