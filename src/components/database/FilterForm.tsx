/**
 * 篩選表單元件
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
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
  endsWith: '結尾是',
};

export const FilterForm: React.FC<FilterFormProps> = ({
  condition,
  columns,
  tabType,
  onChange,
  onRemove,
}) => {
  const [operator, setOperator] = useState<FilterOperator>('contains');

  // 只顯示可篩選的欄位
  const filterableColumns = columns.filter(col => col.filterable !== false);

  // 根據欄位類型決定可用的運算子
  const getOperatorsForColumn = (columnKey: string): FilterOperator[] => {
    // 這裡可以根據不同欄位類型返回不同的運算子
    // 例如：數字類型可以有 greater, less 等
    return ['equals', 'contains', 'startsWith', 'endsWith'];
  };

  const handleColumnChange = (columnKey: string) => {
    const column = columns.find(col => col.key === columnKey);
    if (column) {
      onChange({
        ...condition,
        key: columnKey,
        label: column.title,
      });
    }
  };

  const handleValueChange = (value: string) => {
    console.log('🔍 FilterForm - 值改變:', { 
      columnKey: condition.key, 
      oldValue: condition.value, 
      newValue: value 
    });
    onChange({
      ...condition,
      value,
    });
  };

  // 根據不同的 tabType 和欄位提供預設選項
  const getPresetOptions = (columnKey: string): string[] => {
    if (tabType === 'tasks' && columnKey === 'status') {
      return ['todo', 'completed'];
    }
    if (tabType === 'records' && columnKey === 'type') {
      return ['meeting', 'call'];
    }
    return [];
  };

  const presetOptions = getPresetOptions(condition.key);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>篩選條件</Text>
        <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
          <Ionicons name="trash-outline" size={20} color="#A94438" />
        </TouchableOpacity>
      </View>

      {/* 欄位選擇 */}
      <View style={styles.pickerContainer}>
        <Text style={styles.label}>欄位</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={condition.key}
            onValueChange={handleColumnChange}
            style={styles.picker}
          >
            {filterableColumns.map(column => (
              <Picker.Item
                key={column.key}
                label={column.title}
                value={column.key}
              />
            ))}
          </Picker>
        </View>
      </View>

      {/* 運算子選擇 */}
      <View style={styles.pickerContainer}>
        <Text style={styles.label}>條件</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={operator}
            onValueChange={setOperator}
            style={styles.picker}
          >
            {getOperatorsForColumn(condition.key).map(op => (
              <Picker.Item
                key={op}
                label={operatorLabels[op]}
                value={op}
              />
            ))}
          </Picker>
        </View>
      </View>

      {/* 值輸入 */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>值</Text>
        {presetOptions.length > 0 ? (
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={condition.value}
              onValueChange={handleValueChange}
              style={styles.picker}
            >
              <Picker.Item label="請選擇" value="" />
              {presetOptions.map(option => {
                let label = option;
                if (tabType === 'tasks' && condition.key === 'status') {
                  label = {
                    todo: '待開始',
                    completed: '已完成',
                  }[option] || option;
                } else if (tabType === 'records' && condition.key === 'type') {
                  label = option === 'meeting' ? '會議' : '通話';
                }
                return (
                  <Picker.Item key={option} label={label} value={option} />
                );
              })}
            </Picker>
          </View>
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
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  removeButton: {
    padding: 4,
  },
  pickerContainer: {
    marginBottom: 12,
  },
  inputContainer: {
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7A7A7A',
    marginBottom: 8,
  },
  pickerWrapper: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 44,
  },
  input: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A1A',
    minHeight: 44,
  },
});