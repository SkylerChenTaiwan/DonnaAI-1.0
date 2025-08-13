/**
 * 篩選 Popover 元件
 * 使用小型浮動卡片取代全螢幕 Modal
 */

import React, { useState, useRef, useEffect } from 'react';
import { View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform  } from 'react-native';
import {
  AdaptiveInput
} from '@/components/adaptive';
import { Icon } from '@/components/common/Icon';
import { Popover } from '@/components/common/Popover';
import { TableColumn } from '@/types/table';
import { FilterCondition } from '@/components/common/FilterBadge';

interface FilterPopoverProps {
  visible: boolean;
  onClose: () => void;
  anchor: React.RefObject<any>;
  columns: TableColumn[];
  filters: FilterCondition[];
  onApply: (filters: FilterCondition[]) => void;
}

interface FilterConditionRowProps {
  condition: FilterCondition;
  columns: TableColumn[];
  onChange: (condition: FilterCondition) => void;
  onDelete: () => void;
}

const FilterConditionRow: React.FC<FilterConditionRowProps> = ({
  condition,
  columns,
  onChange,
  onDelete }) => {
  const filterableColumns = columns.filter(col => col.filterable !== false);

  return (
    <View style={styles.conditionRow}>
      {/* 欄位選擇 */}
      <TouchableOpacity
        style={styles.fieldSelector}
        onPress={() => {
          // 在實際應用中，這裡可以顯示一個下拉選單
          const currentIndex = filterableColumns.findIndex(col => col.key === condition.key);
          const nextIndex = (currentIndex + 1) % filterableColumns.length;
          const nextColumn = filterableColumns[nextIndex];
          onChange({
            ...condition,
            key: nextColumn.key,
            label: nextColumn.title });
        }}
      >
        <Text style={styles.fieldText}>{condition.label}</Text>
        <Icon name="chevron-down" size={14} color="#666" />
      </TouchableOpacity>

      {/* 條件輸入 */}
      <AdaptiveInput
        style={styles.conditionInput}
        value={condition.value}
        onChangeText={(text) => onChange({ ...condition, value: text })}
        placeholder="輸入篩選值"
        placeholderTextColor="#999"
      />

      {/* 刪除按鈕 */}
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={onDelete}
        activeOpacity={0.7}
      >
        <Icon name="close" size={16} color="#666" />
      </TouchableOpacity>
    </View>
  );
};

// 建立空白條件的輔助函數
const createEmptyCondition = (columns: TableColumn[]): FilterCondition => {
  const filterableColumns = columns.filter(col => col.filterable !== false);
  if (filterableColumns.length === 0) {
    return { key: '', label: '', value: '' };
  }
  return {
    key: filterableColumns[0].key,
    label: filterableColumns[0].title,
    value: '' };
};

export const FilterPopover: React.FC<FilterPopoverProps> = ({
  visible,
  onClose,
  anchor,
  columns,
  filters,
  onApply }) => {
  const [conditions, setConditions] = useState<FilterCondition[]>(filters);

  useEffect(() => {
    setConditions(filters);
  }, [filters]);

  const handleAddCondition = () => {
    setConditions([...conditions, createEmptyCondition(columns)]);
  };

  const handleUpdateCondition = (index: number, condition: FilterCondition) => {
    const newConditions = [...conditions];
    newConditions[index] = condition;
    setConditions(newConditions);
  };

  const handleDeleteCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const handleApply = () => {
    // 過濾掉空值條件
    const validConditions = conditions.filter(c => c.value && c.value.trim() !== '');
    onApply(validConditions);
    onClose();
  };

  const handleClear = () => {
    setConditions([]);
  };

  return (
    <Popover
      visible={visible}
      onClose={onClose}
      anchor={anchor}
      placement="bottom"
      minWidth={320}
      maxHeight={400}
    >
      <View style={styles.container}>
        {/* 標題區 */}
        <View style={styles.header}>
          <Text style={styles.title}>篩選條件</Text>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <Icon name="close" size={20} color="#666" />
          </TouchableOpacity>
        </View>
        
        {/* 條件列表 */}
        <View style={styles.content}>
          {conditions.map((condition, index) => (
            <FilterConditionRow
              key={index}
              condition={condition}
              columns={columns}
              onChange={(newCondition) => handleUpdateCondition(index, newCondition)}
              onDelete={() => handleDeleteCondition(index)}
            />
          ))}
          
          {/* 新增條件按鈕 */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddCondition}
            activeOpacity={0.7}
          >
            <Icon name="add" size={16} color="#666" />
            <Text style={styles.addButtonText}>新增進階篩選</Text>
          </TouchableOpacity>
        </View>
        
        {/* 底部操作區 */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClear}
            activeOpacity={0.7}
            disabled={conditions.length === 0}
          >
            <Text style={StyleSheet.flatten([
              styles.clearButtonText,
              conditions.length === 0 && styles.disabledText
            ])}>清除</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.applyButton}
            onPress={handleApply}
            activeOpacity={0.7}
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
    maxHeight: 400 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9e9e7' },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#37352f' },
  content: {
    padding: 16 },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8 },
  fieldSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f6f3',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 100,
    gap: 4 },
  fieldText: {
    fontSize: 14,
    color: '#37352f',
    fontWeight: '500' },
  conditionInput: {
    flex: 1,
    backgroundColor: '#f7f6f3',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#37352f',
    ...Platform.select({
      web: {
        outlineWidth: 0 } }) },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f7f6f3',
    alignItems: 'center',
    justifyContent: 'center' },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 4,
    alignSelf: 'flex-start' },
  addButtonText: {
    fontSize: 14,
    color: '#666' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9e9e7' },
  clearButton: {
    paddingHorizontal: 16,
    paddingVertical: 8 },
  clearButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500' },
  applyButton: {
    backgroundColor: '#2383e2',
    borderRadius: 6,
    paddingHorizontal: 20,
    paddingVertical: 8 },
  applyButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600' },
  disabledText: {
    opacity: 0.4 } });