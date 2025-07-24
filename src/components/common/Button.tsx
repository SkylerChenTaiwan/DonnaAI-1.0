/**
 * 通用按鈕元件
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import { DesignSystem } from '@/theme/designSystem';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
}

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ButtonProps) => {
  const buttonStyle = [
    styles.base,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
    style,
  ];

  const buttonTextStyle = [
    styles.text,
    styles[`${variant}Text` as keyof typeof styles],
    styles[`${size}Text` as keyof typeof styles],
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'primary' ? '#FFFFFF' : DesignSystem.colors.primary} 
          size="small" 
        />
      ) : (
        <Text style={buttonTextStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: DesignSystem.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    // 較輕的陰影以配合新的灰色調
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  
  // 變體樣式
  primary: {
    backgroundColor: DesignSystem.colors.primary, // #525252 - 新的中等灰色
  },
  secondary: {
    backgroundColor: DesignSystem.colors.gray[100], // #F5F5F5
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.default,
    // 移除陰影
    ...Platform.select({
      ios: {
        shadowOpacity: 0,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: DesignSystem.colors.primary,
    // 移除陰影
    ...Platform.select({
      ios: {
        shadowOpacity: 0,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  
  // 尺寸樣式
  small: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  medium: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  large: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  
  // 停用狀態
  disabled: {
    backgroundColor: DesignSystem.colors.gray[200], // #E5E5E5
    borderColor: DesignSystem.colors.gray[200],
    opacity: 0.7,
  },
  
  // 文字樣式
  text: {
    fontWeight: '600',
  },
  primaryText: {
    color: DesignSystem.colors.text.inverse, // #FFFFFF
  },
  secondaryText: {
    color: DesignSystem.colors.text.primary,
  },
  outlineText: {
    color: DesignSystem.colors.primary,
  },
  
  // 尺寸文字
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
  
  disabledText: {
    color: DesignSystem.colors.text.tertiary,
  },
});