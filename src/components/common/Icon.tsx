/**
 * 統一的 Icon 元件
 * 所有平台都使用 @expo/vector-icons
 * Web 平台透過改進的 Metro 配置處理字體載入
 */

import React from 'react';
import { ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

/**
 * 統一的 Icon 元件
 * 所有平台都使用相同的 Ionicons 實作
 */
export const Icon: React.FC<IconProps> = (props) => {
  return <Ionicons {...props} />;
};

// 匯出類型供外部使用
export type { IconProps };