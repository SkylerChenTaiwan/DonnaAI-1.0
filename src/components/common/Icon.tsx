/**
 * 統一的 Icon 元件
 * 支援 Native 和 Web 平台
 */

import React from 'react';
import { Platform, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Ionicons 的所有可用圖標名稱類型
type IoniconsGlyphNames = keyof typeof Ionicons.glyphMap;

interface IconProps {
  name: IoniconsGlyphNames | string;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

// Ionicons 4.5.10 的 Unicode 對應表
const iconUnicodeMap: Record<string, string> = {
  'add': '\uf101',
  'add-circle': '\uf101',
  'add-circle-outline': '\uf158',
  'arrow-back': '\uf106',
  'arrow-down': '\uf107',
  'arrow-forward': '\uf10b',
  'arrow-up': '\uf112',
  'calendar': '\uf117',
  'calendar-outline': '\uf116',
  'call': '\uf118',
  'camera': '\uf119',
  'checkmark': '\uf121',
  'checkmark-circle': '\uf120',
  'checkmark-circle-outline': '\uf375',
  'chevron-back': '\uf124',
  'chevron-down': '\uf123',
  'chevron-forward': '\uf125',
  'chevron-up': '\uf126',
  'close': '\uf129',
  'close-circle': '\uf128',
  'close-circle-outline': '\uf36d',
  'cloud-upload': '\uf13b',
  'copy': '\uf13f',
  'create': '\uf2bf',
  'document': '\uf14f',
  'download': '\uf14d',
  'ellipsis-horizontal': '\uf350',
  'ellipsis-vertical': '\uf355',
  'eye': '\uf16f',
  'filter': '\uf172',
  'folder': '\uf180',
  'folder-open': '\uf180',
  'help-circle': '\uf142',
  'home': '\uf144',
  'information-circle': '\uf14a',
  'link': '\uf1fe',
  'list': '\uf201',
  'lock-closed': '\uf200',
  'log-out': '\uf203',
  'mail': '\uf20b',
  'menu': '\uf20c',
  'more': '\uf214',
  'open': '\uf216',
  'people': '\uf21b',
  'person': '\uf213',
  'person-add': '\uf211',
  'person-circle': '\uf213',
  'refresh': '\uf21c',
  'remove': '\uf229',
  'save': '\uf22e',
  'search': '\uf21f',
  'settings': '\uf2ad',
  'share': '\uf211',
  'star': '\uf24e',
  'star-outline': '\uf24d',
  'sync': '\uf25e',
  'time': '\uf250',
  'trash': '\uf252',
  'warning': '\uf267',
  // Material Icons 兼容
  'business': '\uf1a4',
  'description': '\uf14f',
  'dashboard': '\uf11b',
  'group': '\uf21b',
  'visibility': '\uf16f',
};

/**
 * 統一的 Icon 元件
 * Native 使用 @expo/vector-icons，Web 使用 CSS 字體
 */
export const Icon: React.FC<IconProps> = (props) => {
  const { name, size = 24, color = '#000', style } = props;
  const iconName = typeof name === 'string' ? name : String(name);
  
  // Web 平台使用 HTML 元素直接渲染
  if (Platform.OS === 'web') {
    // 嘗試獲取 Unicode，如果沒有則使用預設值
    const unicode = iconUnicodeMap[iconName] || iconUnicodeMap['help-circle'] || '\uf142';
    
    return (
      <span
        className="icon"
        style={{
          fontFamily: 'Ionicons, Material Icons, sans-serif',
          fontSize: size,
          color: color,
          display: 'inline-block',
          lineHeight: 1,
          fontWeight: 'normal',
          fontStyle: 'normal',
          letterSpacing: 'normal',
          textTransform: 'none',
          whiteSpace: 'nowrap',
          wordWrap: 'normal',
          direction: 'ltr',
          WebkitFontSmoothing: 'antialiased',
          textRendering: 'optimizeLegibility',
          MozOsxFontSmoothing: 'grayscale',
          fontFeatureSettings: 'liga',
          ...(style as any),
        }}
        aria-hidden="true"
      >
        {unicode}
      </span>
    );
  }
  
  // Native 平台使用 Ionicons
  return <Ionicons {...props} name={iconName as IoniconsGlyphNames} />;
};

// 匯出類型供外部使用
export type { IconProps };