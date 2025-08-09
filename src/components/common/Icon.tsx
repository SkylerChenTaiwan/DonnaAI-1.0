/**
 * 統一的 Icon 元件
 * 支援 Native 和 Web 平台
 */

import React from 'react';
import { Platform, ViewStyle } from 'react-native';

// Platform-specific imports
let IconImplementation: React.FC<any>;
let IconProps: any;

if (Platform.OS === 'web') {
  // Web platform - use SVG icons
  const WebIcon = require('./Icon.web');
  IconImplementation = WebIcon.Icon;
  IconProps = WebIcon.IconProps;
} else {
  // Native platforms - use @expo/vector-icons
  const { Ionicons } = require('@expo/vector-icons');
  
  // Ionicons 的所有可用圖標名稱類型
  type IoniconsGlyphNames = keyof typeof Ionicons.glyphMap;
  
  interface NativeIconProps {
    name: IoniconsGlyphNames | string;
    size?: number;
    color?: string;
    style?: ViewStyle;
  }
  
  IconImplementation = (props: NativeIconProps) => {
    // 確保 name 是字串類型
    const iconName = typeof props.name === 'string' ? props.name : String(props.name);
    return <Ionicons {...props} name={iconName as IoniconsGlyphNames} />;
  };
  
  IconProps = {} as NativeIconProps;
}

/**
 * 統一的 Icon 元件
 * Web 平台使用 SVG，Native 平台使用 @expo/vector-icons
 */
export const Icon = IconImplementation;

// 匯出類型供外部使用
export type { IconProps };