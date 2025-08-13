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
  Alert } from 'react-native';
import { Icon } from '@/components/common/Icon';
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
  tabType }) => {
  const [values, setValues] = useState<Record<string, any>>({});
  const [showPreview, setShowPreview] = useState(false);

  const updateValue = (fieldKey: string, value: any) => {
    setValues({
      ...values,
      [fieldKey]: value });
  };

  // 檢查是否有任何修改
  const hasChanges = Object.keys(values).some(key => values[key] !== undefined && values[key] !== '');

  const handleSave = () => {
    if (!hasChanges) {
      Alert.alert('提示', '請至少修改一個欄位');
      return;
    }
    setShowPreview(true);
  };

  const handleConfirmSubmit = () => {
    // 只提交有值的欄位
    const updates: Record<string, any> = {};
    Object.keys(values).forEach((key) => {
      if (values[key] !== undefined && values[key] !== '') {
        updates[key] = values[key];
      }
    });
    
    onSubmit(updates);
    setShowPreview(false);
  };

  const renderFieldInput = (field: BatchEditField) => {
    const value = values[field.key];

    switch (field.type) {
      case 'text':
        return (
          <TextInput
            style={styles.textInput}
            value={value || ''}
            onChangeText={(text) => updateValue(field.key, text)}
            placeholder={field.placeholder || `輸入${field.label}`}
            placeholderTextColor="#7A7A7A"
          />
        );

      case 'select':
        return (
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={value || ''}
              onValueChange={(itemValue) => updateValue(field.key, itemValue)}
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
            trackColor={{ false: '#E3E1DC', true: '#1A1A1A' }}
          />
        );

      case 'tags':
        return (
          <TextInput
            style={styles.textInput}
            value={value || ''}
            onChangeText={(text) => updateValue(field.key, text)}
            placeholder="輸入標籤，以逗號分隔"
            placeholderTextColor="#7A7A7A"
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
        <View style={styles.headerActions}>
          {(hasChanges || showPreview) && (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={showPreview ? handleConfirmSubmit : handleSave}
              activeOpacity={0.7}
            >
              <Icon name="checkmark" size={18} color="#F7F6F3" />
              <Text style={styles.saveButtonText}>{showPreview ? '確認' : '儲存'}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onCancel}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="close" size={24} color="#7A7A7A" />
          </TouchableOpacity>
        </View>
      </View>

      {!showPreview ? (
        <ScrollView style={styles.content}>
          <Text style={styles.instruction}>修改要變更的欄位（留空則不變更）：</Text>

          {fields.map((field) => (
            <View key={field.key} style={styles.fieldItem}>
              <Text style={styles.fieldLabel}>{field.label}</Text>
              <View style={styles.fieldInputContainer}>
                {renderFieldInput(field)}
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <ScrollView style={styles.content}>
          <View style={styles.previewSection}>
            <Text style={styles.previewTitle}>確認變更</Text>
            <Text style={styles.previewSubtitle}>
              以下變更將套用到 {selectedCount} 個項目：
            </Text>
            
            {Object.keys(values).map((fieldKey) => {
              const field = fields.find((f) => f.key === fieldKey);
              const value = values[fieldKey];
              if (!field || value === undefined || value === '') return null;
              
              return (
                <View key={fieldKey} style={styles.previewItem}>
                  <Text style={styles.previewLabel}>{field.label}:</Text>
                  <Text style={styles.previewValue}>
                    {field.type === 'switch'
                      ? value ? '是' : '否'
                      : field.type === 'select'
                      ? field.options?.find(opt => opt.value === value)?.label || value
                      : value}
                  </Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* 底部按鈕 */}
      <View style={styles.footer}>
        {!showPreview ? (
          <TouchableOpacity
            style={StyleSheet.flatten([styles.button, styles.cancelButton])}
            onPress={onCancel}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>取消</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={StyleSheet.flatten([styles.button, styles.cancelButton])}
              onPress={() => setShowPreview(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>返回</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={StyleSheet.flatten([styles.button, styles.submitButton])}
              onPress={handleConfirmSubmit}
              activeOpacity={0.7}
            >
              <Text style={styles.submitButtonText}>確認變更</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0' },
  header: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E3E1DC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between' },
  headerContent: {
    flex: 1 },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12 },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1A1A1A',
    borderRadius: 18 },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F7F6F3' },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center' },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4 },
  subtitle: {
    fontSize: 14,
    color: '#7A7A7A' },
  content: {
    flex: 1,
    padding: 16 },
  instruction: {
    fontSize: 14,
    color: '#7A7A7A',
    marginBottom: 16 },
  fieldItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16 },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8 },
  fieldInputContainer: {
    // 移除左邊距
  },
  textInput: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A1A' },
  previewSubtitle: {
    fontSize: 14,
    color: '#7A7A7A',
    marginBottom: 16 },
  pickerWrapper: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    overflow: 'hidden' },
  picker: {
    height: 44 },
  previewSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 24 },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12 },
  previewItem: {
    flexDirection: 'row',
    paddingVertical: 8 },
  previewLabel: {
    fontSize: 14,
    color: '#7A7A7A',
    width: 100 },
  previewValue: {
    fontSize: 14,
    color: '#1A1A1A',
    flex: 1,
    fontWeight: '500' },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E3E1DC',
    gap: 12 },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center' },
  cancelButton: {
    backgroundColor: '#F0F0F0' },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A' },
  submitButton: {
    backgroundColor: '#1A1A1A' },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F7F6F3' } });