/**
 * 通用圖標按鈕組件
 * 支援多種尺寸和灰階色彩變體
 */

import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Platform,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignSystem } from '@/theme/designSystem';

type IconName = keyof typeof Ionicons.glyphMap;

interface IconButtonProps {
  icon: IconName;
  onPress: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost';
  backgroundColor?: string;
  iconColor?: string;
  style?: ViewStyle;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  size = 'md',
  variant = 'primary',
  backgroundColor,
  iconColor,
  style,
  disabled = false,
  loading = false,
  accessibilityLabel,
}) => {
  // 尺寸配置
  const sizeConfig = {
    sm: {
      button: 32,
      icon: 16,
      padding: 8,
    },
    md: {
      button: 40,
      icon: 20,
      padding: 10,
    },
    lg: {
      button: 48,
      icon: 24,
      padding: 12,
    },
  };

  const currentSize = sizeConfig[size];

  // 顏色配置
  const getColors = () => {
    const variantColors = {
      primary: {
        background: backgroundColor || DesignSystem.colors.primary,
        icon: iconColor || DesignSystem.colors.text.inverse,
      },
      secondary: {
        background: backgroundColor || DesignSystem.colors.background.surface,
        icon: iconColor || DesignSystem.colors.text.primary,
      },
      ghost: {
        background: backgroundColor || 'transparent',
        icon: iconColor || DesignSystem.colors.text.primary,
      },
    };

    return variantColors[variant];
  };

  const colors = getColors();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          width: currentSize.button,
          height: currentSize.button,
          backgroundColor: colors.background,
        },
        variant === 'secondary' && styles.secondaryBorder,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={colors.icon} 
        />
      ) : (
        <Ionicons
          name={icon}
          size={currentSize.icon}
          color={disabled ? DesignSystem.colors.text.disabled : colors.icon}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: DesignSystem.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    // 陰影效果
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  secondaryBorder: {
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
  disabled: {
    opacity: 0.5,
  },
});