/**
 * 篩選器 Modal 元件
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView } from 'react-native';
import { Icon } from '@/components/common/Icon';
import { AdaptiveModal } from '@/components/adaptive';
import { TableColumn } from '@/types/table';
import { FilterCondition } from './FilterBadge';
import { FilterForm } from '../database/FilterFormV2';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  columns: TableColumn[];
  filters: FilterCondition[];
  onApply: (filters: FilterCondition[]) => void;
  tabType: 'customers' | 'records' | 'tasks';
}

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  columns,
  filters,
  onApply,
  tabType }) => {
  const [conditions, setConditions] = useState<FilterCondition[]>(filters || []);

  // 同步外部篩選條件
  useEffect(() => {
    setConditions(filters || []);
  }, [filters]);

  const handleAddCondition = () => {
    // 找出第一個可篩選的欄位
    const filterableColumns = columns.filter(col => col.filterable !== false);
    if (filterableColumns.length === 0) return;

    const newCondition: FilterCondition = {
      key: filterableColumns[0].key,
      label: filterableColumns[0].title,
      value: '' };
    setConditions([...(conditions || []), newCondition]);
  };

  const handleUpdateCondition = (index: number, condition: FilterCondition) => {
    const newConditions = [...(conditions || [])];
    newConditions[index] = condition;
    setConditions(newConditions);
  };

  const handleRemoveCondition = (index: number) => {
    setConditions((conditions || []).filter((_, i) => i !== index));
  };

  const handleApply = () => {
    // 過濾掉空值條件
    const validConditions = (conditions || []).filter(c => c.value && c.value.trim() !== '');
    onApply(validConditions);
    onClose();
  };

  const handleClear = () => {
    setConditions([]);
    onApply([]);
    onClose();
  };

  return (
    <AdaptiveModal
      visible={visible}
      onClose={onClose}
      title="篩選"
      size="large"
      animationType="slide"
      presentationStyle="pageSheet"
      primaryButton={{
        title: '套用',
        onPress: handleApply
      }}
      secondaryButton={{
        title: '取消',
        onPress: onClose
      }}
    >
      <View style={styles.modalContent}>
        <ScrollView style={styles.content}>
          {/* 篩選條件列表 */}
          {(conditions || []).map((condition, index) => (
            <FilterForm
              key={index}
              condition={condition}
              columns={columns}
              tabType={tabType}
              onChange={(newCondition) => handleUpdateCondition(index, newCondition)}
              onRemove={() => handleRemoveCondition(index)}
            />
          ))}

          {/* 新增條件按鈕 */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddCondition}
            activeOpacity={0.7}
          >
            <Icon name="add-circle-outline" size={24} color="#1A1A1A" />
            <Text style={styles.addButtonText}>新增篩選條件</Text>
          </TouchableOpacity>

          {/* 清除全部按鈕 */}
          {conditions.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClear}
              activeOpacity={0.7}
            >
              <Text style={styles.clearButtonText}>清除所有篩選</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </AdaptiveModal>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    flex: 1,
    backgroundColor: '#F0F0F0' },
  content: {
    flex: 1,
    padding: 16 },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    gap: 8 },
  addButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A' },
  clearButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#A94438',
    borderRadius: 12,
    padding: 16,
    marginTop: 12 },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF' } });