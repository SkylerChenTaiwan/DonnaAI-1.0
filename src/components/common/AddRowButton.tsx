/**
 * 新增資料列按鈕元件
 * 用於在編輯模式下快速新增資料記錄
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle } from 'react-native';
import { Icon } from '@/components/common/Icon';
import { colors } from '@/theme/colors';

interface AddRowButtonProps {
  onPress: () => void;
  isVisible: boolean;
  style?: ViewStyle;
  buttonText?: string;
  disabled?: boolean;
  alignment?: 'left' | 'center';
  showGuideIcon?: boolean;
}

export const AddRowButton: React.FC<AddRowButtonProps> = ({
  onPress,
  isVisible,
  style,
  buttonText = '新增記錄',
  disabled = false,
  alignment = 'center',
  showGuideIcon = false }) => {
  if (!isVisible) return null;

  return (
    <View style={[
      styles.container, 
      alignment === 'left' && styles.leftAligned,
      style
    ]}>
      <TouchableOpacity
        style={[
          styles.addButton,
          disabled && styles.addButtonDisabled,
        ]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
        testID="add-row-button"
      >
        <View style={styles.buttonContent}>
          {showGuideIcon && alignment === 'left' && (
            <Icon 
              name="chevron-forward" 
              size={16} 
              color={disabled ? colors.textTertiary : colors.textSecondary} 
            />
          )}
          <Icon 
            name="add" 
            size={20} 
            color={disabled ? colors.textTertiary : colors.textSecondary} 
          />
          <Text style={[
            styles.addButtonText,
            disabled && styles.addButtonTextDisabled,
          ]}>
            {buttonText}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.background },
  leftAligned: {
    alignItems: 'flex-start' },
  addButton: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    minHeight: 22, // 高度減半
    justifyContent: 'center',
    alignItems: 'center' },
  addButtonDisabled: {
    backgroundColor: colors.backgroundSecondary,
    borderColor: colors.border,
    opacity: 0.6 },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 4, // 調整垂直內邊距以配合新高度
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary },
  addButtonTextDisabled: {
    color: colors.textTertiary } });