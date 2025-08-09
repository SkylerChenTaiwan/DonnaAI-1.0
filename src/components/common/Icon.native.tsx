/**
 * Icon 元件 - Native 平台實現
 * 使用 @expo/vector-icons
 */

import React from 'react';
import { ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Ionicons 的所有可用圖標名稱類型
type IoniconsGlyphNames = keyof typeof Ionicons.glyphMap;

export interface IconProps {
  name: IoniconsGlyphNames | string;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

/**
 * Native 平台的 Icon 元件
 * 使用 @expo/vector-icons
 */
export const Icon: React.FC<IconProps> = (props) => {
  // 確保 name 是字串類型
  const iconName = typeof props.name === 'string' ? props.name : String(props.name);
  
  return <Ionicons {...props} name={iconName as IoniconsGlyphNames} />;
};