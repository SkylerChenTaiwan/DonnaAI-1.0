/**
 * Material Icon 元件
 * 支援 Native 和 Web 平台
 */

import React from 'react';
import { ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

// MaterialIcons 的圖標名稱類型
type MaterialIconNames = keyof typeof MaterialIcons.glyphMap;

interface MaterialIconProps {
  name: MaterialIconNames | string;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

/**
 * Material Icon 元件
 * 使用 @expo/vector-icons，依賴 CDN 載入字體（Web 平台）
 */
export const MaterialIcon: React.FC<MaterialIconProps> = (props) => {
  const iconName = typeof props.name === 'string' ? props.name : String(props.name);
  
  return <MaterialIcons {...props} name={iconName as MaterialIconNames} />;
};

// 匯出類型供外部使用
export type { MaterialIconProps };