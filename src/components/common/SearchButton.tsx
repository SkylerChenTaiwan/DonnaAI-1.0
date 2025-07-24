/**
 * 搜索按鈕組件
 * 用於主管模式導航欄，提供數據分析功能入口
 */

import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Platform,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignSystem } from '@/theme/designSystem';

interface SearchButtonProps {
  onPress: () => void;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export const SearchButton: React.FC<SearchButtonProps> = ({
  onPress,
  size = 'medium',
  style,
  disabled = false,
  accessibilityLabel = '搜索',
}) => {
  const sizeStyles = {
    small: {
      width: 36,
      height: 36,
      iconSize: 18,
    },
    medium: {
      width: 44,
      height: 44,
      iconSize: 20,
    },
    large: {
      width: 52,
      height: 52,
      iconSize: 24,
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          width: currentSize.width,
          height: currentSize.height,
        },
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
    >
      <Ionicons 
        name="search" 
        size={currentSize.iconSize} 
        color={DesignSystem.colors.text.inverse} 
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 999, // 完全圓形
    backgroundColor: DesignSystem.colors.gray[700], // #404040 深灰色以保持辨識度
    alignItems: 'center',
    justifyContent: 'center',
    // 陰影效果 - 較輕以配合灰色調
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  disabled: {
    backgroundColor: DesignSystem.colors.gray[400], // #A3A3A3
    opacity: 0.7,
  },
});