/**
 * Material Icon 元件
 * 支援 Native 和 Web 平台
 */

import React from 'react';
import { Platform, ViewStyle } from 'react-native';

// Platform-specific imports
let MaterialIconImplementation: React.FC<any>;
let MaterialIconProps: any;

if (Platform.OS === 'web') {
  // Web platform - use SVG icons
  const WebMaterialIcon = require('./MaterialIcon.web');
  MaterialIconImplementation = WebMaterialIcon.MaterialIcon;
  MaterialIconProps = WebMaterialIcon.MaterialIconProps;
} else {
  // Native platforms - use @expo/vector-icons
  const { MaterialIcons } = require('@expo/vector-icons');
  
  // MaterialIcons 的圖標名稱類型
  type MaterialIconNames = keyof typeof MaterialIcons.glyphMap;
  
  interface NativeMaterialIconProps {
    name: MaterialIconNames | string;
    size?: number;
    color?: string;
    style?: ViewStyle;
  }
  
  MaterialIconImplementation = (props: NativeMaterialIconProps) => {
    const iconName = typeof props.name === 'string' ? props.name : String(props.name);
    return <MaterialIcons {...props} name={iconName as MaterialIconNames} />;
  };
  
  MaterialIconProps = {} as NativeMaterialIconProps;
}

/**
 * Material Icon 元件
 * Web 平台使用 SVG，Native 平台使用 @expo/vector-icons
 */
export const MaterialIcon = MaterialIconImplementation;

// 匯出類型供外部使用
export type { MaterialIconProps };