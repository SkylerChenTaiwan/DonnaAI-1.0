/**
 * 篩選表單元件 V2 - 改善的版本
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform } from 'react-native';
import { Icon } from '@/components/common/Icon';
import { TableColumn } from '@/types/table';
import { FilterCondition } from '@/components/common/FilterBadge';

interface FilterFormProps {
  condition: FilterCondition;
  columns: TableColumn[];
  tabType: 'customers' | 'records' | 'tasks';
  onChange: (condition: FilterCondition) => void;
  onRemove: () => void;
}

type FilterOperator = 'equals' | 'contains' | 'startsWith' | 'endsWith';

const operatorLabels: Record<FilterOperator, string> = {
  equals: '等於',
  contains: '包含',
  startsWith: '開頭是',
  endsWith: '結尾是' };

export const FilterForm: React.FC<FilterFormProps> = ({
  condition,
  columns,
  tabType,
  onChange,
  onRemove }) => {
  // 只顯示可篩選的欄位
  const filterableColumns = columns.filter(col => col.filterable !== false);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [showOperatorPicker, setShowOperatorPicker] = useState(false);
  const [showValuePicker, setShowValuePicker] = useState(false);
  const [operator, setOperator] = useState<FilterOperator>((condition as any).operator || 'contains');

  const handleColumnChange = (columnKey: string) => {
    const column = columns.find(col => col.key === columnKey);
    if (column) {
      onChange({
        ...condition,
        key: columnKey,
        label: column.title,
        value: '', // 重置值
      });
    }
    setShowColumnPicker(false);
  };

  const handleValueChange = (value: string) => {
    onChange({
      ...condition,
      value,
      operator } as any);
  };

  const handleOperatorChange = (newOperator: FilterOperator) => {
    setOperator(newOperator);
    setShowOperatorPicker(false);
    onChange({
      ...condition,
      operator: newOperator } as any);
  };

  // 根據不同的 tabType 和欄位提供預設選項
  const getPresetOptions = (columnKey: string): { value: string; label: string }[] => {
    if (tabType === 'tasks' && columnKey === 'status') {
      return [
        { value: 'todo', label: '待開始' },
        { value: 'completed', label: '已完成' },
      ];
    }
    if (tabType === 'records' && columnKey === 'type') {
      return [
        { value: 'meeting', label: '會議' },
        { value: 'call', label: '通話' },
      ];
    }
    return [];
  };

  const presetOptions = getPresetOptions(condition.key);
  const selectedColumn = columns.find(col => col.key === condition.key);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>篩選條件</Text>
        <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
          <Icon name="trash-outline" size={20} color="#A94438" />
        </TouchableOpacity>
      </View>

      {/* 欄位選擇 */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>欄位</Text>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => setShowColumnPicker(!showColumnPicker)}
        >
          <Text style={styles.selectButtonText}>
            {selectedColumn?.title || '請選擇欄位'}
          </Text>
          <Icon name="chevron-down" size={20} color="#7A7A7A" />
        </TouchableOpacity>
        
        {showColumnPicker && (
          <View style={styles.pickerOptions}>
            {filterableColumns.map(column => (
              <TouchableOpacity
                key={column.key}
                style={styles.pickerOption}
                onPress={() => handleColumnChange(column.key)}
              >
                <Text 
                  style={[
                    styles.pickerOptionText,
                    condition.key === column.key && styles.pickerOptionTextSelected
                  ]}
                >
                  {column.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* 條件選擇 */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>條件</Text>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => setShowOperatorPicker(!showOperatorPicker)}
        >
          <Text style={styles.selectButtonText}>
            {operatorLabels[operator]}
          </Text>
          <Icon name="chevron-down" size={20} color="#7A7A7A" />
        </TouchableOpacity>
        
        {showOperatorPicker && (
          <View style={styles.pickerOptions}>
            {Object.entries(operatorLabels).map(([op, label]) => (
              <TouchableOpacity
                key={op}
                style={styles.pickerOption}
                onPress={() => handleOperatorChange(op as FilterOperator)}
              >
                <Text 
                  style={[
                    styles.pickerOptionText,
                    operator === op && styles.pickerOptionTextSelected
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* 值輸入 */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>值</Text>
        {presetOptions.length > 0 ? (
          <>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowValuePicker(!showValuePicker)}
            >
              <Text style={styles.selectButtonText}>
                {presetOptions.find(opt => opt.value === condition.value)?.label || '請選擇'}
              </Text>
              <Icon name="chevron-down" size={20} color="#7A7A7A" />
            </TouchableOpacity>
            
            {showValuePicker && (
              <View style={styles.pickerOptions}>
                {presetOptions.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.pickerOption}
                    onPress={() => {
                      handleValueChange(option.value);
                      setShowValuePicker(false);
                    }}
                  >
                    <Text 
                      style={[
                        styles.pickerOptionText,
                        condition.value === option.value && styles.pickerOptionTextSelected
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        ) : (
          <TextInput
            style={styles.input}
            value={condition.value || ''}
            onChangeText={handleValueChange}
            placeholder="輸入篩選值"
            placeholderTextColor="#7A7A7A"
            autoCapitalize="none"
            autoCorrect={false}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16 },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A' },
  removeButton: {
    padding: 4 },
  fieldGroup: {
    marginBottom: 16 },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7A7A7A',
    marginBottom: 8 },
  selectButton: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between' },
  selectButtonText: {
    fontSize: 16,
    color: '#1A1A1A' },
  pickerOptions: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#E5E5E5' },
  pickerOption: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0' },
  pickerOptionText: {
    fontSize: 16,
    color: '#1A1A1A' },
  pickerOptionTextSelected: {
    color: '#1A1A1A',
    fontWeight: '600' },
  fixedField: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12 },
  fixedFieldText: {
    fontSize: 16,
    color: '#7A7A7A' },
  input: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A1A',
    minHeight: 44 } });