/**
 * 統一的 Icon 元件
 * 支援 Native 和 Web 平台
 */

import React from 'react';
import { ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Ionicons 的所有可用圖標名稱類型
type IoniconsGlyphNames = keyof typeof Ionicons.glyphMap;

interface IconProps {
  name: IoniconsGlyphNames | string;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

/**
 * 統一的 Icon 元件
 * 直接使用 @expo/vector-icons，依賴 CSS 載入字體
 */
export const Icon: React.FC<IconProps> = (props) => {
  // 確保 name 是字串類型
  const iconName = typeof props.name === 'string' ? props.name : String(props.name);
  
  return <Ionicons {...props} name={iconName as IoniconsGlyphNames} />;
};

// 匯出類型供外部使用
export type { IconProps };