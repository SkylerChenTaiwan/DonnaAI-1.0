/**
 * Notion 風格資料表格組件
 * 特色：始終顯示表格結構，即使無資料也會顯示表頭和新增按鈕
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Pressable,
  Platform } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Icon } from '@/components/common/Icon';
import { TableColumn, TableData } from '@/types/table';
import { responsive, webOnly } from '@/styles/web';

interface NotionStyleTableProps {
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

export const NotionStyleTable: React.FC<NotionStyleTableProps> = ({
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
  onSort }) => {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  // 顏色系統 - 基於 Notion 的亮色主題
  const colors = {
    background: '#fff',
    sidebar: '#f9f8f7',
    border: '#eeeeec',
    shimmer: 'rgba(227,226,224,0.5)',
    text: '#37352f',
    textSecondary: '#787774',
    hover: 'rgba(55, 53, 47, 0.08)',
    selected: 'rgba(35, 131, 226, 0.14)',
    primaryAccent: '#FF6B6B' };

  const toggleSelection = useCallback((itemId: string) => {
    if (!onSelect) return;
    
    const newSelection = selectedItems.includes(itemId)
      ? selectedItems.filter(id => id !== itemId)
      : [...selectedItems, itemId];
    
    onSelect(newSelection);
  }, [selectedItems, onSelect]);

  const selectAll = useCallback(() => {
    if (!onSelect) return;
    onSelect(data.map(item => item.id));
  }, [data, onSelect]);

  const clearSelection = useCallback(() => {
    if (!onSelect) return;
    onSelect([]);
  }, [onSelect]);

  // 渲染表頭
  const renderHeader = () => (
    <View style={StyleSheet.flatten([styles.tableHeader, { borderBottomColor: colors.border }])}>
      {multiSelectMode && (
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => {
            if (selectedItems.length === data.length && data.length > 0) {
              clearSelection();
            } else {
              selectAll();
            }
          }}
        >
          <Icon
            name={
              selectedItems.length === data.length && data.length > 0
                ? 'checkbox'
                : selectedItems.length > 0
                ? 'remove'
                : 'square-outline'
            }
            size={20}
            color={colors.text}
          />
        </TouchableOpacity>
      )}
      {columns.map((column) => (
        <TouchableOpacity
          key={column.key}
          style={StyleSheet.flatten([
            styles.headerCell,
            column.width ? { width: column.width } : { flex: 1 }
          ])}
          onPress={() => column.sortable && onSort && onSort(column.key)}
          disabled={!column.sortable || !onSort}
          activeOpacity={0.7}
        >
          <Text style={StyleSheet.flatten([styles.headerText, { color: colors.textSecondary }])}>
            {column.title}
          </Text>
          {column.sortable && sortConfig && (
            <Icon
              name={
                sortConfig.key === column.key
                  ? sortConfig.direction === 'asc'
                    ? 'arrow-up'
                    : 'arrow-down'
                  : 'swap-vertical'
              }
              size={12}
              color={sortConfig.key === column.key ? colors.text : colors.textSecondary}
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
          <Icon name="add" size={16} color={colors.textSecondary} />
          <Text style={StyleSheet.flatten([styles.addColumnText, { color: colors.textSecondary }])}>
            新增屬性
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // 渲染新增第一筆資料按鈕
  const renderAddFirstRow = () => (
    <TouchableOpacity 
      style={StyleSheet.flatten([styles.addFirstRow, { backgroundColor: colors.background }])} 
      onPress={onAddRow}
      activeOpacity={0.7}
    >
      <Icon name="add" size={20} color={colors.primaryAccent} />
      <Text style={StyleSheet.flatten([styles.addFirstRowText, { color: colors.textSecondary }])}>
        新增第一筆資料
      </Text>
    </TouchableOpacity>
  );

  // 渲染新增按鈕（資料存在時）
  const renderAddRow = () => (
    <TouchableOpacity 
      style={StyleSheet.flatten([styles.addRow, { backgroundColor: colors.background }])} 
      onPress={onAddRow}
      activeOpacity={0.7}
    >
      <Icon name="add" size={16} color={colors.textSecondary} />
      <Text style={StyleSheet.flatten([styles.addRowText, { color: colors.textSecondary }])}>
        新增
      </Text>
    </TouchableOpacity>
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
            { 
              backgroundColor: isSelected ? colors.selected : colors.background,
              borderBottomColor: colors.border },
            Platform.OS === 'web' && isHovered && !isSelected && { backgroundColor: colors.hover },
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
          {multiSelectMode && (
            <View style={styles.checkboxContainer}>
              <Icon
                name={isSelected ? 'checkbox' : 'square-outline'}
                size={20}
                color={colors.text}
              />
            </View>
          )}
          {columns.map((column) => (
            <View
              key={column.key}
              style={StyleSheet.flatten([
                styles.tableCell,
                column.width ? { width: column.width } : { flex: 1 }
              ])}
            >
              {column.render ? (
                column.render(item[column.key], item)
              ) : (
                <Text style={StyleSheet.flatten([styles.cellText, { color: colors.text }])} numberOfLines={1}>
                  {item[column.key] || '-'}
                </Text>
              )}
            </View>
          ))}
        </Pressable>
      );
    },
    [columns, selectedItems, multiSelectMode, colors, hoveredRow, toggleSelection, onRowPress]
  );

  return (
    <View style={StyleSheet.flatten([styles.tableContainer, { backgroundColor: colors.background }])}>
      {renderHeader()}
      {data.length === 0 && !loading ? (
        renderAddFirstRow()
      ) : (
        <FlashList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          estimatedItemSize={60}
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            ) : undefined
          }
          ListFooterComponent={renderAddRow()}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  tableContainer: {
    flex: 1,
    borderRadius: 0,
    overflow: 'hidden' },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    minHeight: responsive({ mobile: 40, tablet: 42, desktop: 44 }),
    paddingHorizontal: responsive({ mobile: 8, tablet: 12, desktop: 16 }),
    alignItems: 'center' },
  headerCell: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsive({ mobile: 6, tablet: 8, desktop: 10 }),
    paddingVertical: responsive({ mobile: 6, tablet: 8, desktop: 10 }),
    gap: 4 },
  headerText: {
    fontSize: responsive({ mobile: 12, tablet: 13, desktop: 14 }),
    fontWeight: '500' },
  checkboxContainer: {
    width: responsive({ mobile: 32, tablet: 36, desktop: 40 }),
    minWidth: responsive({ mobile: 32, tablet: 36, desktop: 40 }),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: responsive({ mobile: 8, tablet: 10, desktop: 12 }) },
  addColumnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsive({ mobile: 10, tablet: 12, desktop: 16 }),
    paddingVertical: responsive({ mobile: 6, tablet: 8, desktop: 10 }),
    gap: 4,
    ...webOnly({
      cursor: 'pointer',
      transition: 'opacity 0.2s ease',
      ':hover': {
        opacity: 0.7 } }) },
  addColumnText: {
    fontSize: responsive({ mobile: 12, tablet: 13, desktop: 14 }) },
  addFirstRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: responsive({ mobile: 12, tablet: 14, desktop: 16 }),
    paddingHorizontal: responsive({ mobile: 8, tablet: 12, desktop: 16 }),
    minHeight: responsive({ mobile: 48, tablet: 52, desktop: 56 }),
    ...webOnly({
      cursor: 'pointer',
      transition: 'background-color 0.2s ease' }) },
  addFirstRowText: {
    marginLeft: responsive({ mobile: 6, tablet: 8, desktop: 10 }),
    fontSize: responsive({ mobile: 14, tablet: 15, desktop: 16 }) },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    minHeight: responsive({ mobile: 48, tablet: 52, desktop: 56 }),
    paddingHorizontal: responsive({ mobile: 8, tablet: 12, desktop: 16 }),
    alignItems: 'center',
    ...webOnly({
      cursor: 'pointer',
      transition: 'background-color 0.2s ease' }) },
  tableCell: {
    justifyContent: 'center',
    paddingHorizontal: responsive({ mobile: 6, tablet: 8, desktop: 10 }),
    paddingVertical: responsive({ mobile: 8, tablet: 10, desktop: 12 }) },
  cellText: {
    fontSize: responsive({ mobile: 14, tablet: 15, desktop: 16 }) },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: responsive({ mobile: 10, tablet: 12, desktop: 14 }),
    paddingHorizontal: responsive({ mobile: 8, tablet: 12, desktop: 16 }),
    minHeight: responsive({ mobile: 44, tablet: 48, desktop: 52 }),
    ...webOnly({
      cursor: 'pointer',
      transition: 'opacity 0.2s ease',
      ':hover': {
        opacity: 0.7 } }) },
  addRowText: {
    marginLeft: responsive({ mobile: 4, tablet: 6, desktop: 8 }),
    fontSize: responsive({ mobile: 14, tablet: 15, desktop: 16 }) } });