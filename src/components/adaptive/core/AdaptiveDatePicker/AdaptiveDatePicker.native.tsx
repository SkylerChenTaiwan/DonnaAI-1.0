/**
 * AdaptiveDatePicker Native 實作
 * 使用 React Native DateTimePicker
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcon } from '@/components/common/MaterialIcon';
import { AdaptiveDatePickerProps, DEFAULT_COLORS, formatDate } from './AdaptiveDatePicker.types';

export const AdaptiveDatePicker: React.FC<AdaptiveDatePickerProps> = ({
  value = null,
  onDateChange,
  mode = 'date',
  minimumDate,
  maximumDate,
  placeholder = '選擇日期',
  format,
  disabled = false,
  variant = 'filled',
  accessibilityLabel,
  testID,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(value || new Date());
  
  const handlePress = () => {
    if (!disabled) {
      setShowPicker(true);
    }
  };
  
  const handleChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (selectedDate) {
        onDateChange?.(selectedDate);
      }
    } else {
      setTempDate(selectedDate || tempDate);
    }
  };
  
  const handleConfirm = () => {
    onDateChange?.(tempDate);
    setShowPicker(false);
  };
  
  const handleCancel = () => {
    setTempDate(value || new Date());
    setShowPicker(false);
  };
  
  // 格式化顯示文字
  const displayValue = value ? formatDate(value, format || (
    mode === 'time' ? 'HH:mm' :
    mode === 'datetime' ? 'YYYY-MM-DD HH:mm' :
    'YYYY-MM-DD'
  )) : '';
  
  const renderPicker = () => {
    if (Platform.OS === 'ios') {
      return (
        <Modal
          visible={showPicker}
          transparent
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={handleCancel}>
                  <Text style={styles.modalButton}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleConfirm}>
                  <Text style={[styles.modalButton, styles.confirmButton]}>確定</Text>
                </TouchableOpacity>
              </View>
              
              <DateTimePicker
                value={tempDate}
                mode={mode as any}
                display="spinner"
                onChange={handleChange}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                locale="zh-TW"
              />
            </View>
          </View>
        </Modal>
      );
    } else {
      // Android
      return showPicker ? (
        <DateTimePicker
          value={value || new Date()}
          mode={mode as any}
          display="default"
          onChange={handleChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      ) : null;
    }
  };
  
  return (
    <>
      <TouchableOpacity
        style={[
          styles.container,
          variant === 'filled' && styles.filledContainer,
          variant === 'outlined' && styles.outlinedContainer,
          disabled && styles.disabledContainer,
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
        disabled={disabled}
        testID={testID}
        accessibilityLabel={accessibilityLabel || '日期選擇器'}
        accessibilityRole="button"
      >
        <Text
          style={[
            styles.text,
            !value && styles.placeholder,
          ]}
        >
          {displayValue || placeholder}
        </Text>
        
        <MaterialIcon
          name={mode === 'time' ? 'time' : 'calendar'}
          size={20}
          color={DEFAULT_COLORS.primary}
        />
      </TouchableOpacity>
      
      {renderPicker()}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  filledContainer: {
    backgroundColor: DEFAULT_COLORS.background,
  },
  outlinedContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: DEFAULT_COLORS.border,
  },
  disabledContainer: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    color: DEFAULT_COLORS.text,
  },
  placeholder: {
    color: DEFAULT_COLORS.placeholder,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: DEFAULT_COLORS.border,
  },
  modalButton: {
    fontSize: 16,
    color: DEFAULT_COLORS.text,
  },
  confirmButton: {
    color: DEFAULT_COLORS.primary,
    fontWeight: '600',
  },
});