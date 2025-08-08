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

// Ionicons 名稱映射 - 將 Ionicons v5 名稱映射到 v4 類名
const iconNameMap: Record<string, string> = {
  // 常用圖標映射
  'add': 'ion-md-add',
  'add-circle': 'ion-md-add-circle',
  'add-circle-outline': 'ion-md-add-circle-outline',
  'arrow-back': 'ion-md-arrow-back',
  'arrow-down': 'ion-md-arrow-down',
  'arrow-forward': 'ion-md-arrow-forward',
  'arrow-up': 'ion-md-arrow-up',
  'calendar': 'ion-md-calendar',
  'calendar-outline': 'ion-ios-calendar-outline',
  'call': 'ion-md-call',
  'camera': 'ion-md-camera',
  'checkmark': 'ion-md-checkmark',
  'checkmark-circle': 'ion-md-checkmark-circle',
  'checkmark-circle-outline': 'ion-md-checkmark-circle-outline',
  'chevron-back': 'ion-ios-arrow-back',
  'chevron-down': 'ion-ios-arrow-down',
  'chevron-forward': 'ion-ios-arrow-forward',
  'chevron-up': 'ion-ios-arrow-up',
  'close': 'ion-md-close',
  'close-circle': 'ion-md-close-circle',
  'close-circle-outline': 'ion-md-close-circle-outline',
  'cloud-upload': 'ion-md-cloud-upload',
  'copy': 'ion-md-copy',
  'create': 'ion-md-create',
  'document': 'ion-md-document',
  'download': 'ion-md-download',
  'ellipsis-horizontal': 'ion-md-more',
  'ellipsis-vertical': 'ion-md-more',
  'eye': 'ion-md-eye',
  'filter': 'ion-md-funnel',
  'folder': 'ion-md-folder',
  'folder-open': 'ion-md-folder-open',
  'help-circle': 'ion-md-help-circle',
  'home': 'ion-md-home',
  'information-circle': 'ion-md-information-circle',
  'link': 'ion-md-link',
  'list': 'ion-md-list',
  'lock-closed': 'ion-md-lock',
  'log-out': 'ion-md-log-out',
  'mail': 'ion-md-mail',
  'menu': 'ion-md-menu',
  'more': 'ion-md-more',
  'open': 'ion-md-open',
  'people': 'ion-md-people',
  'people-outline': 'ion-ios-people-outline',
  'person': 'ion-md-person',
  'person-add': 'ion-md-person-add',
  'person-circle': 'ion-md-contact',
  'refresh': 'ion-md-refresh',
  'remove': 'ion-md-remove',
  'save': 'ion-md-save',
  'search': 'ion-md-search',
  'settings': 'ion-md-settings',
  'share': 'ion-md-share',
  'star': 'ion-md-star',
  'star-outline': 'ion-md-star-outline',
  'sync': 'ion-md-sync',
  'time': 'ion-md-time',
  'time-outline': 'ion-ios-time-outline',
  'trash': 'ion-md-trash',
  'warning': 'ion-md-warning',
  // Material Icons 兼容
  'business': 'ion-md-business',
  'description': 'ion-md-document',
  'dashboard': 'ion-md-speedometer',
  'group': 'ion-md-people',
  'visibility': 'ion-md-eye',
};

/**
 * 統一的 Icon 元件
 * Native 使用 @expo/vector-icons，Web 使用 CSS 字體
 */
export const Icon: React.FC<IconProps> = (props) => {
  const { name, size = 24, color = '#000', style } = props;
  const iconName = typeof name === 'string' ? name : String(name);
  
  // Web 平台使用 HTML 元素與類名渲染
  if (Platform.OS === 'web') {
    // 獲取對應的類名，如果沒有則使用預設值
    const className = iconNameMap[iconName] || `ion-md-${iconName}` || 'ion-md-help-circle';
    
    return (
      <i
        className={className}
        style={{
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
          ...(style as any),
        }}
        aria-hidden="true"
      />
    );
  }
  
  // Native 平台使用 Ionicons
  return <Ionicons {...props} name={iconName as IoniconsGlyphNames} />;
};

// 匯出類型供外部使用
export type { IconProps };