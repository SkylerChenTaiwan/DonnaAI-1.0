/**
 * 通用表單欄位組件 - 支援多種輸入類型
 */

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Platform, Modal, Button } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

export interface FormFieldProps {
  // 支援兩種格式以保持向後相容
  config?: {
    name: string;
    label: string;
    type: string;
    required?: boolean;
    placeholder?: string;
    options?: Array<{ label: string; value: string }>;
  };
  // 舊的 props 格式
  label?: string;
  type?: 'text' | 'date' | 'select' | 'multiline' | 'textarea';
  value?: any;
  onChange?: (value: any) => void;
  onChangeText?: (text: string) => void;
  onDateChange?: (date: Date) => void;
  onValueChange?: (value: string) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
  minHeight?: number;
}

export const FormField: React.FC<FormFieldProps> = (props) => {
  // 判斷是使用新格式還是舊格式
  const isNewFormat = !!props.config;
  
  // 從 props 中提取值，支援兩種格式
  const label = isNewFormat ? props.config?.label : props.label;
  const type = isNewFormat ? props.config?.type : props.type || 'text';
  const required = isNewFormat ? props.config?.required : props.required || false;
  const placeholder = isNewFormat ? props.config?.placeholder : props.placeholder;
  const value = props.value;
  const onChange = props.onChange || props.onChangeText;
  const onDateChange = props.onDateChange;
  const onValueChange = props.onValueChange;
  const error = props.error;
  const disabled = props.disabled || false;
  const minHeight = props.minHeight;
  const options = isNewFormat ? props.config?.options : props.options || [];
  
  // 日期選擇器的狀態
  const [showDatePicker, setShowDatePicker] = useState(false);
  // 下拉選單的狀態
  const [showPicker, setShowPicker] = useState(false);
  
  // 處理日期選擇器變更
  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'set' && selectedDate && onDateChange) {
      onDateChange(selectedDate);
    }
    if (Platform.OS === 'ios') {
      // iOS 不會自動關閉，需要手動處理
    }
  };
  
  // iOS 日期選擇器的確認處理
  const handleIOSDateConfirm = () => {
    setShowDatePicker(false);
  };

  // 格式化日期顯示
  const formatDate = (date: Date | undefined) => {
    if (!date) return '';
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // 根據類型渲染不同的輸入元件
  const renderInput = () => {
    switch (type) {
      case 'date':
        return (
          <>
            <TouchableOpacity
              style={[styles.input, styles.dateInput, error && styles.inputError]}
              onPress={() => setShowDatePicker(true)}
              disabled={disabled}
            >
              <Text style={[styles.dateText, !value && styles.placeholderText]}>
                {value ? formatDate(value) : placeholder || '選擇日期'}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#7A7A7A" />
            </TouchableOpacity>
            
            {showDatePicker && Platform.OS === 'android' && (
              <DateTimePicker
                value={value || new Date()}
                mode="date"
                display="default"
                onChange={handleDateChange}
                locale="zh-TW"
              />
            )}
            
            {showDatePicker && Platform.OS === 'ios' && (
              <Modal
                transparent={true}
                animationType="slide"
                visible={showDatePicker}
                onRequestClose={() => setShowDatePicker(false)}
              >
                <View style={styles.modalContainer}>
                  <View style={styles.datePickerContainer}>
                    <View style={styles.datePickerHeader}>
                      <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                        <Text style={styles.cancelButton}>取消</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleIOSDateConfirm}>
                        <Text style={styles.confirmButton}>確定</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={value || new Date()}
                      mode="date"
                      display="spinner"
                      onChange={handleDateChange}
                      locale="zh-TW"
                    />
                  </View>
                </View>
              </Modal>
            )}
          </>
        );
        
      case 'select':
        // 找出當前選中的選項
        const selectedOption = options.find(opt => opt.value === value);
        
        return (
          <>
            <TouchableOpacity
              style={[styles.input, styles.selectInput, error && styles.inputError]}
              onPress={() => setShowPicker(true)}
              disabled={disabled}
            >
              <Text style={[styles.selectText, !value && styles.placeholderText]}>
                {selectedOption?.label || placeholder || '請選擇'}
              </Text>
              <Ionicons name="chevron-down-outline" size={20} color="#7A7A7A" />
            </TouchableOpacity>
            
            {Platform.OS === 'ios' ? (
              <Modal
                transparent={true}
                animationType="slide"
                visible={showPicker}
                onRequestClose={() => setShowPicker(false)}
              >
                <View style={styles.modalContainer}>
                  <View style={styles.pickerModalContainer}>
                    <View style={styles.pickerHeader}>
                      <TouchableOpacity onPress={() => setShowPicker(false)}>
                        <Text style={styles.cancelButton}>取消</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setShowPicker(false)}>
                        <Text style={styles.confirmButton}>確定</Text>
                      </TouchableOpacity>
                    </View>
                    <Picker
                      selectedValue={value}
                      onValueChange={onValueChange}
                      style={styles.modalPicker}
                    >
                      <Picker.Item label={placeholder || '請選擇'} value="" />
                      {options.map((option, index) => (
                        <Picker.Item 
                          key={index} 
                          label={option.label} 
                          value={option.value} 
                        />
                      ))}
                    </Picker>
                  </View>
                </View>
              </Modal>
            ) : (
              showPicker && (
                <View style={[styles.input, styles.pickerContainer, error && styles.inputError]}>
                  <Picker
                    selectedValue={value}
                    onValueChange={(newValue) => {
                      onValueChange?.(newValue);
                      setShowPicker(false);
                    }}
                    style={styles.picker}
                  >
                    <Picker.Item label={placeholder || '請選擇'} value="" />
                    {options.map((option, index) => (
                      <Picker.Item 
                        key={index} 
                        label={option.label} 
                        value={option.value} 
                      />
                    ))}
                  </Picker>
                </View>
              )
            )}
          </>
        );
        
      case 'textarea':
      case 'multiline':
        return (
          <TextInput
            style={[
              styles.input,
              minHeight ? { height: minHeight } : styles.textarea,
              error && styles.inputError,
            ]}
            value={value || ''}
            onChangeText={onChange}
            placeholder={placeholder}
            placeholderTextColor="#C7C7CC"
            multiline={true}
            editable={!disabled}
          />
        );
        
      default:
        return (
          <TextInput
            style={[styles.input, error && styles.inputError]}
            value={value || ''}
            onChangeText={onChange}
            placeholder={placeholder}
            placeholderTextColor="#C7C7CC"
            editable={!disabled}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.requiredStar}> *</Text>}
        </Text>
      )}
      
      {renderInput()}
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  requiredStar: {
    color: '#DC2626',
  },
  textarea: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E3E1DC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    marginTop: 4,
  },
  // 日期選擇器樣式
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  placeholderText: {
    color: '#C7C7CC',
  },
  // 下拉選單樣式
  pickerContainer: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  picker: {
    height: 50,
  },
  // Modal 樣式
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent', // 移除黑色遮罩
  },
  datePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E3E1DC',
  },
  cancelButton: {
    fontSize: 16,
    color: '#7A7A7A',
  },
  confirmButton: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  // 下拉選單樣式
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  pickerModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E3E1DC',
  },
  modalPicker: {
    height: 200,
  },
});