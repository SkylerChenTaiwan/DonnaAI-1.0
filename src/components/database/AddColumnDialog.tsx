/**
 * 新增欄位對話框組件
 * 支援多種欄位類型選擇
 */

import React, { useState } from 'react';
import {
  AdaptiveModal,
  AdaptiveInput
} from '@/components/adaptive';
import { View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform   } from 'react-native';
import { Icon } from '@/components/common/Icon';
import { responsive } from '@/styles/web';

export type ColumnType = 'text' | 'number' | 'date' | 'select' | 'multiSelect' | 
  'checkbox' | 'url' | 'email' | 'phone' | 'currency' | 'percentage' | 'rating';

export interface ColumnConfig {
  id: string;
  title: string;
  type: ColumnType;
  width?: number;
  required?: boolean;
  options?: string[]; // for select/multiSelect
  validation?: (value: any) => boolean;
  defaultValue?: any;
  format?: string; // for date, number formats
  max?: number; // for rating
  prefix?: string; // for currency
}

interface AddColumnDialogProps {
  isVisible: boolean;
  onClose: () => void;
  onAdd: (column: ColumnConfig) => void;
  existingColumns?: string[]; // 避免重複的欄位名稱
}

export const AddColumnDialog: React.FC<AddColumnDialogProps> = ({ 
  isVisible, 
  onClose, 
  onAdd,
  existingColumns = []
}) => {
  const [columnName, setColumnName] = useState('');
  const [columnType, setColumnType] = useState<ColumnType>('text');
  const [selectOptions, setSelectOptions] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [required, setRequired] = useState(false);
  const [defaultValue, setDefaultValue] = useState('');

  const columnTypes: Array<{
    type: ColumnType;
    icon: string;
    label: string;
    description: string;
  }> = [
    { type: 'text', icon: 'text', label: '文字', description: '單行或多行文字' },
    { type: 'number', icon: 'calculator', label: '數字', description: '整數或小數' },
    { type: 'date', icon: 'calendar', label: '日期', description: '日期和時間' },
    { type: 'select', icon: 'list', label: '單選', description: '從選項中選擇一個' },
    { type: 'multiSelect', icon: 'list', label: '多選', description: '從選項中選擇多個' },
    { type: 'checkbox', icon: 'checkbox', label: '核取方塊', description: '是/否選項' },
    { type: 'url', icon: 'link', label: '連結', description: '網址連結' },
    { type: 'email', icon: 'mail', label: '電子郵件', description: '電子郵件地址' },
    { type: 'phone', icon: 'call', label: '電話', description: '電話號碼' },
    { type: 'currency', icon: 'cash', label: '貨幣', description: '金額數值' },
    { type: 'percentage', icon: 'analytics', label: '百分比', description: '百分比數值' },
    { type: 'rating', icon: 'star', label: '評分', description: '星級評分' },
  ];

  const handleAdd = () => {
    const trimmedName = columnName.trim();
    
    // 驗證欄位名稱
    if (!trimmedName) {
      alert('請輸入欄位名稱');
      return;
    }
    
    if (existingColumns.includes(trimmedName)) {
      alert('此欄位名稱已存在');
      return;
    }

    // 處理選項類型的欄位
    let options: string[] | undefined;
    if (columnType === 'select' || columnType === 'multiSelect') {
      options = selectOptions
        .split('\n')
        .map(opt => opt.trim())
        .filter(opt => opt.length > 0);
      
      if (options.length === 0) {
        alert('請至少輸入一個選項');
        return;
      }
    }

    // 建立新欄位配置
    const newColumn: ColumnConfig = {
      id: trimmedName.toLowerCase().replace(/\s+/g, '_'),
      title: trimmedName,
      type: columnType,
      required,
      options,
      defaultValue: defaultValue || undefined };

    // 根據類型添加特定屬性
    switch (columnType) {
      case 'rating':
        newColumn.max = 5; // 預設 5 星評分
        break;
      case 'currency':
        newColumn.prefix = 'NT$'; // 預設新台幣
        break;
      case 'date':
        newColumn.format = 'YYYY-MM-DD';
        break;
    }

    onAdd(newColumn);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setColumnName('');
    setColumnType('text');
    setSelectOptions('');
    setShowAdvanced(false);
    setRequired(false);
    setDefaultValue('');
  };

  return (
    <AdaptiveModal 
      visible={isVisible} 
      transparent 
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={onClose}
        />
        <View style={styles.modalContent}>
          {/* 標題列 */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>新增屬性</Text>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* 屬性名稱輸入 */}
            <View style={styles.inputSection}>
              <Text style={styles.label}>屬性名稱</Text>
              <AdaptiveInput
                style={styles.input}
                placeholder="輸入屬性名稱"
                placeholderTextColor="#999"
                value={columnName}
                onChangeText={setColumnName}
                autoFocus
              />
            </View>

            {/* 屬性類型選擇 */}
            <View style={styles.inputSection}>
              <Text style={styles.label}>屬性類型</Text>
              <View style={styles.typeGrid}>
                {columnTypes.map(({ type, icon, label, description }) => (
                  <TouchableOpacity
                    key={type}
                    style={StyleSheet.flatten([
                      styles.typeButton,
                      columnType === type && styles.typeButtonActive
                    ])}
                    onPress={() => setColumnType(type)}
                    activeOpacity={0.7}
                  >
                    <Icon 
                      name={icon as any} 
                      size={24} 
                      color={columnType === type ? '#FF6B6B' : '#666'} 
                    />
                    <Text style={StyleSheet.flatten([
                      styles.typeLabel,
                      columnType === type && styles.typeLabelActive
                    ])}>
                      {label}
                    </Text>
                    <Text style={styles.typeDescription}>{description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 選項輸入（僅 select/multiSelect 顯示） */}
            {(columnType === 'select' || columnType === 'multiSelect') && (
              <View style={styles.inputSection}>
                <Text style={styles.label}>選項（每行一個）</Text>
                <AdaptiveInput
                  style={StyleSheet.flatten([styles.input, styles.textArea])}
                  placeholder="選項 1&#10;選項 2&#10;選項 3"
                  placeholderTextColor="#999"
                  value={selectOptions}
                  onChangeText={setSelectOptions}
                  multiline
                  numberOfLines={4}
                />
              </View>
            )}

            {/* 進階選項 */}
            <TouchableOpacity
              style={styles.advancedToggle}
              onPress={() => setShowAdvanced(!showAdvanced)}
              activeOpacity={0.7}
            >
              <Text style={styles.advancedToggleText}>進階選項</Text>
              <Icon 
                name={showAdvanced ? 'chevron-up' : 'chevron-down'} 
                size={16} 
                color="#666" 
              />
            </TouchableOpacity>

            {showAdvanced && (
              <View style={styles.advancedSection}>
                {/* 必填選項 */}
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setRequired(!required)}
                  activeOpacity={0.7}
                >
                  <Icon 
                    name={required ? 'checkbox' : 'square-outline'} 
                    size={20} 
                    color="#FF6B6B" 
                  />
                  <Text style={styles.checkboxLabel}>必填欄位</Text>
                </TouchableOpacity>

                {/* 預設值 */}
                <View style={styles.inputSection}>
                  <Text style={styles.label}>預設值</Text>
                  <AdaptiveInput
                    style={styles.input}
                    placeholder="輸入預設值"
                    placeholderTextColor="#999"
                    value={defaultValue}
                    onChangeText={setDefaultValue}
                  />
                </View>
              </View>
            )}
          </ScrollView>

          {/* 操作按鈕 */}
          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={StyleSheet.flatten([
                styles.confirmButton,
                !columnName.trim() && styles.confirmButtonDisabled
              ])}
              onPress={handleAdd}
              activeOpacity={0.7}
              disabled={!columnName.trim()}
            >
              <Text style={styles.confirmText}>新增</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </AdaptiveModal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center' },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modalContent: {
    width: '90%',
    maxWidth: responsive({ mobile: 400, tablet: 500, desktop: 600 }),
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: responsive({ mobile: 12, tablet: 14, desktop: 16 }),
    ...(Platform.OS === 'web' ? {} : { elevation: 10 }),
    shadowColor: '#000',
    ...(Platform.OS === 'web' ? {} : { ...(Platform.OS === 'web' ? {} : { shadowOffset: { width: 0, height: 4 } }) }),
    shadowOpacity: 0.3,
    shadowRadius: 12 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: responsive({ mobile: 20, tablet: 24, desktop: 28 }),
    paddingVertical: responsive({ mobile: 16, tablet: 18, desktop: 20 }),
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeec' },
  modalTitle: {
    fontSize: responsive({ mobile: 18, tablet: 20, desktop: 22 }),
    fontWeight: '600',
    color: '#37352f' },
  closeButton: {
    padding: responsive({ mobile: 4, tablet: 6, desktop: 8 }) },
  modalBody: {
    paddingHorizontal: responsive({ mobile: 20, tablet: 24, desktop: 28 }),
    paddingVertical: responsive({ mobile: 16, tablet: 18, desktop: 20 }) },
  inputSection: {
    marginBottom: responsive({ mobile: 20, tablet: 24, desktop: 28 }) },
  label: {
    fontSize: responsive({ mobile: 14, tablet: 15, desktop: 16 }),
    fontWeight: '500',
    color: '#37352f',
    marginBottom: responsive({ mobile: 8, tablet: 10, desktop: 12 }) },
  input: {
    borderWidth: 1,
    borderColor: '#eeeeec',
    borderRadius: responsive({ mobile: 6, tablet: 8, desktop: 8 }),
    paddingHorizontal: responsive({ mobile: 12, tablet: 14, desktop: 16 }),
    paddingVertical: responsive({ mobile: 10, tablet: 12, desktop: 14 }),
    fontSize: responsive({ mobile: 14, tablet: 15, desktop: 16 }),
    color: '#37352f' },
  textArea: {
    minHeight: responsive({ mobile: 80, tablet: 90, desktop: 100 }),
    textAlignVertical: 'top' },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: responsive({ mobile: 8, tablet: 10, desktop: 12 }) },
  typeButton: {
    width: responsive({ mobile: 100, tablet: 110, desktop: 120 }),
    paddingVertical: responsive({ mobile: 12, tablet: 14, desktop: 16 }),
    paddingHorizontal: responsive({ mobile: 10, tablet: 12, desktop: 14 }),
    borderRadius: responsive({ mobile: 8, tablet: 10, desktop: 12 }),
    borderWidth: 1,
    borderColor: '#eeeeec',
    alignItems: 'center',
    backgroundColor: '#f9f8f7' },
  typeButtonActive: {
    borderColor: '#FF6B6B',
    backgroundColor: 'rgba(255, 107, 107, 0.1)' },
  typeLabel: {
    fontSize: responsive({ mobile: 12, tablet: 13, desktop: 14 }),
    fontWeight: '500',
    color: '#666',
    marginTop: responsive({ mobile: 4, tablet: 5, desktop: 6 }) },
  typeLabelActive: {
    color: '#FF6B6B' },
  typeDescription: {
    fontSize: responsive({ mobile: 10, tablet: 11, desktop: 12 }),
    color: '#999',
    marginTop: responsive({ mobile: 2, tablet: 3, desktop: 4 }),
    textAlign: 'center' },
  advancedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: responsive({ mobile: 12, tablet: 14, desktop: 16 }),
    marginBottom: responsive({ mobile: 12, tablet: 14, desktop: 16 }) },
  advancedToggleText: {
    fontSize: responsive({ mobile: 14, tablet: 15, desktop: 16 }),
    color: '#666',
    fontWeight: '500' },
  advancedSection: {
    paddingBottom: responsive({ mobile: 12, tablet: 14, desktop: 16 }) },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsive({ mobile: 8, tablet: 10, desktop: 12 }),
    marginBottom: responsive({ mobile: 16, tablet: 18, desktop: 20 }) },
  checkboxLabel: {
    fontSize: responsive({ mobile: 14, tablet: 15, desktop: 16 }),
    color: '#37352f' },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: responsive({ mobile: 12, tablet: 14, desktop: 16 }),
    paddingHorizontal: responsive({ mobile: 20, tablet: 24, desktop: 28 }),
    paddingVertical: responsive({ mobile: 16, tablet: 18, desktop: 20 }),
    borderTopWidth: 1,
    borderTopColor: '#eeeeec' },
  cancelButton: {
    paddingHorizontal: responsive({ mobile: 20, tablet: 24, desktop: 28 }),
    paddingVertical: responsive({ mobile: 10, tablet: 12, desktop: 14 }),
    borderRadius: responsive({ mobile: 6, tablet: 8, desktop: 8 }),
    backgroundColor: '#f9f8f7' },
  cancelText: {
    fontSize: responsive({ mobile: 14, tablet: 15, desktop: 16 }),
    color: '#666',
    fontWeight: '500' },
  confirmButton: {
    paddingHorizontal: responsive({ mobile: 20, tablet: 24, desktop: 28 }),
    paddingVertical: responsive({ mobile: 10, tablet: 12, desktop: 14 }),
    borderRadius: responsive({ mobile: 6, tablet: 8, desktop: 8 }),
    backgroundColor: '#FF6B6B' },
  confirmButtonDisabled: {
    backgroundColor: '#ffb3b3' },
  confirmText: {
    fontSize: responsive({ mobile: 14, tablet: 15, desktop: 16 }),
    color: '#fff',
    fontWeight: '600' } });