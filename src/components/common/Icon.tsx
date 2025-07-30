/**
 * 統一的 Icon 元件
 * 自動根據平台選擇適當的實作方式
 * - Web: 使用 ion-icon web components
 * - Native: 使用 @expo/vector-icons
 */

import React from 'react';
import { Platform, ViewStyle } from 'react-native';
import { Ionicons as RNIonicons } from '@expo/vector-icons';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

/**
 * Web 端使用 ion-icon web component
 * 注意：需要在 HTML 中引入 Ionicons Web Components
 */
const WebIcon: React.FC<IconProps> = ({ name, size = 24, color = '#000', style }) => {
  // 轉換 icon 名稱格式（React Native 到 Ionicons Web）
  // 移除 -outline 和 -sharp 後綴，因為 Web Components 版本處理方式不同
  const webIconName = name
    .replace(/-outline$/, '')
    .replace(/-sharp$/, '');
  
  // Web Components 使用內聯樣式
  const iconStyle = {
    fontSize: `${size}px`,
    color,
    display: 'inline-block',
    verticalAlign: 'middle',
    ...(style as any),
  };
  
  // TypeScript 需要特殊處理自定義元素
  return React.createElement('ion-icon', {
    name: webIconName,
    style: iconStyle,
  });
};

/**
 * 統一的 Icon 元件
 * 自動根據平台選擇實作
 */
export const Icon: React.FC<IconProps> = (props) => {
  if (Platform.OS === 'web') {
    return <WebIcon {...props} />;
  }
  
  // Native 平台使用原生的 Ionicons
  return <RNIonicons {...props} />;
};

// 匯出類型供外部使用
export type { IconProps };