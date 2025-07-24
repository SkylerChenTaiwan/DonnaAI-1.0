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
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'text';
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
          color={variant === 'primary' 
            ? DesignSystem.colors.text.inverse 
            : DesignSystem.colors.primary
          } 
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
    borderRadius: DesignSystem.borderRadius.button,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    // 無陰影 - 扁平化設計
    ...DesignSystem.shadows.none,
  },
  
  // 變體樣式
  primary: {
    backgroundColor: DesignSystem.colors.button.primary.default,
  },
  secondary: {
    backgroundColor: DesignSystem.colors.button.secondary.default,
    borderWidth: 0,
  },
  outline: {
    backgroundColor: DesignSystem.colors.button.outline.background,
    borderWidth: 1,
    borderColor: DesignSystem.colors.button.outline.border,
  },
  ghost: {
    backgroundColor: DesignSystem.colors.button.ghost.background,
    borderWidth: 0,
  },
  text: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  
  // 尺寸樣式 - 更緊湊
  small: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  medium: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  large: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  
  // 停用狀態
  disabled: {
    opacity: 0.5,
  },
  
  // 文字樣式
  text: {
    fontWeight: '500', // 從 600 改為 500
  },
  primaryText: {
    color: DesignSystem.colors.text.inverse,
  },
  secondaryText: {
    color: DesignSystem.colors.primary,
  },
  outlineText: {
    color: DesignSystem.colors.primary,
  },
  ghostText: {
    color: DesignSystem.colors.primary,
  },
  textText: {
    color: DesignSystem.colors.button.text.color,
    fontWeight: '400',
    textDecorationLine: 'underline',
    textDecorationStyle: 'solid',
    textDecorationColor: DesignSystem.colors.button.text.underline,
  },
  
  // 尺寸文字
  smallText: {
    fontSize: 13,
  },
  mediumText: {
    fontSize: 14,
  },
  largeText: {
    fontSize: 16,
  },
  
  disabledText: {
    color: DesignSystem.colors.text.disabled,
  },
});