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
import { Icon } from '@/components/common/Icon';
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
  // 尺寸配置 - 更精緻的尺寸
  const sizeConfig = {
    sm: {
      button: 28,
      icon: 14,
      padding: 7,
    },
    md: {
      button: 36,
      icon: 18,
      padding: 9,
    },
    lg: {
      button: 44,
      icon: 22,
      padding: 11,
    },
  };

  const currentSize = sizeConfig[size];

  // 顏色配置 - 使用新的按鈕色彩系統
  const getColors = () => {
    const variantColors = {
      primary: {
        background: backgroundColor || DesignSystem.colors.button.primary.default,
        icon: iconColor || DesignSystem.colors.text.inverse,
      },
      secondary: {
        background: backgroundColor || DesignSystem.colors.button.secondary.default,
        icon: iconColor || DesignSystem.colors.primary,
      },
      ghost: {
        background: backgroundColor || DesignSystem.colors.button.ghost.background,
        icon: iconColor || DesignSystem.colors.primary,
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
        <Icon
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
    borderRadius: DesignSystem.borderRadius.button,
    alignItems: 'center',
    justifyContent: 'center',
    // 無陰影 - 扁平化設計
    ...DesignSystem.shadows.none,
  },
  secondaryBorder: {
    borderWidth: 0, // 次要按鈕不需要邊框
  },
  disabled: {
    opacity: 0.5,
  },
});