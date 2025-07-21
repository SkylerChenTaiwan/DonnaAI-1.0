/**
 * 批量編輯表單元件
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

interface BatchEditField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'switch' | 'tags';
  options?: { label: string; value: string }[];
  placeholder?: string;
}

interface BatchEditFormProps {
  fields: BatchEditField[];
  selectedCount: number;
  onSubmit: (updates: Record<string, any>) => void;
  onCancel: () => void;
  tabType: 'customers' | 'records' | 'tasks';
}

export const BatchEditForm: React.FC<BatchEditFormProps> = ({
  fields,
  selectedCount,
  onSubmit,
  onCancel,
  tabType,
}) => {
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  const [values, setValues] = useState<Record<string, any>>({});

  const toggleField = (fieldKey: string) => {
    const newSelected = new Set(selectedFields);
    if (newSelected.has(fieldKey)) {
      newSelected.delete(fieldKey);
      const newValues = { ...values };
      delete newValues[fieldKey];
      setValues(newValues);
    } else {
      newSelected.add(fieldKey);
    }
    setSelectedFields(newSelected);
  };

  const updateValue = (fieldKey: string, value: any) => {
    setValues({
      ...values,
      [fieldKey]: value,
    });
  };

  const handleSubmit = () => {
    if (selectedFields.size === 0) {
      Alert.alert('提示', '請至少選擇一個欄位進行編輯');
      return;
    }

    // 只提交選中的欄位
    const updates: Record<string, any> = {};
    selectedFields.forEach((fieldKey) => {
      if (values[fieldKey] !== undefined) {
        updates[fieldKey] = values[fieldKey];
      }
    });

    Alert.alert(
      '確認批量編輯',
      `即將對 ${selectedCount} 個項目進行編輯，此操作無法撤銷。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '確定',
          style: 'destructive',
          onPress: () => onSubmit(updates),
        },
      ]
    );
  };

  const renderFieldInput = (field: BatchEditField) => {
    const isSelected = selectedFields.has(field.key);
    const value = values[field.key];

    switch (field.type) {
      case 'text':
        return (
          <TextInput
            style={[styles.textInput, !isSelected && styles.disabledInput]}
            value={value || ''}
            onChangeText={(text) => updateValue(field.key, text)}
            placeholder={field.placeholder || `輸入${field.label}`}
            placeholderTextColor="#8E8E93"
            editable={isSelected}
          />
        );

      case 'select':
        return (
          <View style={[styles.pickerWrapper, !isSelected && styles.disabledInput]}>
            <Picker
              selectedValue={value || ''}
              onValueChange={(itemValue) => updateValue(field.key, itemValue)}
              enabled={isSelected}
              style={styles.picker}
            >
              <Picker.Item label={`選擇${field.label}`} value="" />
              {field.options?.map((option) => (
                <Picker.Item
                  key={option.value}
                  label={option.label}
                  value={option.value}
                />
              ))}
            </Picker>
          </View>
        );

      case 'switch':
        return (
          <Switch
            value={value || false}
            onValueChange={(val) => updateValue(field.key, val)}
            disabled={!isSelected}
            trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
          />
        );

      case 'tags':
        return (
          <TextInput
            style={[styles.textInput, !isSelected && styles.disabledInput]}
            value={value || ''}
            onChangeText={(text) => updateValue(field.key, text)}
            placeholder="輸入標籤，以逗號分隔"
            placeholderTextColor="#8E8E93"
            editable={isSelected}
          />
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* 標頭 */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>批量編輯</Text>
          <Text style={styles.subtitle}>
            編輯 {selectedCount} 個{' '}
            {tabType === 'customers' ? '客戶' : tabType === 'records' ? '紀錄' : '任務'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onCancel}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={24} color="#8E8E93" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.instruction}>選擇要編輯的欄位：</Text>

        {fields.map((field) => (
          <View key={field.key} style={styles.fieldItem}>
            <TouchableOpacity
              style={styles.fieldHeader}
              onPress={() => toggleField(field.key)}
              activeOpacity={0.7}
            >
              <View style={styles.checkbox}>
                {selectedFields.has(field.key) && (
                  <Ionicons name="checkmark" size={16} color="#007AFF" />
                )}
              </View>
              <Text style={styles.fieldLabel}>{field.label}</Text>
            </TouchableOpacity>
            
            <View style={styles.fieldInputContainer}>
              {renderFieldInput(field)}
            </View>
          </View>
        ))}

        {/* 預覽區域 */}
        {selectedFields.size > 0 && (
          <View style={styles.previewSection}>
            <Text style={styles.previewTitle}>變更預覽</Text>
            {Array.from(selectedFields).map((fieldKey) => {
              const field = fields.find((f) => f.key === fieldKey);
              const value = values[fieldKey];
              if (!field || value === undefined) return null;
              
              return (
                <View key={fieldKey} style={styles.previewItem}>
                  <Text style={styles.previewLabel}>{field.label}:</Text>
                  <Text style={styles.previewValue}>
                    {field.type === 'switch'
                      ? value ? '是' : '否'
                      : value || '(空白)'}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* 底部按鈕 */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelButtonText}>取消</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.submitButton]}
          onPress={handleSubmit}
          activeOpacity={0.7}
        >
          <Text style={styles.submitButtonText}>套用變更</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerContent: {
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  instruction: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
  },
  fieldItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  fieldInputContainer: {
    paddingLeft: 34,
  },
  textInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1C1C1E',
  },
  disabledInput: {
    opacity: 0.5,
  },
  pickerWrapper: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 44,
  },
  previewSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  previewItem: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  previewLabel: {
    fontSize: 14,
    color: '#8E8E93',
    width: 100,
  },
  previewValue: {
    fontSize: 14,
    color: '#1C1C1E',
    flex: 1,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F2F2F7',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});