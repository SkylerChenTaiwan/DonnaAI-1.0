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
import { Icon } from '@/components/common/Icon';
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
      width: 32,
      height: 32,
      iconSize: 16,
    },
    medium: {
      width: 40,
      height: 40,
      iconSize: 18,
    },
    large: {
      width: 48,
      height: 48,
      iconSize: 22,
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
      <Icon 
        name="search" 
        size={currentSize.iconSize} 
        color={DesignSystem.colors.text.inverse} 
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: DesignSystem.borderRadius.full, // 完全圓形
    backgroundColor: DesignSystem.colors.button.primary.default, // 使用新的主按鈕顏色
    alignItems: 'center',
    justifyContent: 'center',
    // 無陰影 - 扁平化設計
    ...DesignSystem.shadows.none,
  },
  disabled: {
    backgroundColor: DesignSystem.colors.gray[400], // #A3A3A3
    opacity: 0.5,
  },
});