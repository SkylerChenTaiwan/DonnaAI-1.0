/**
 * 統一的 Icon 元件
 * 支援 Native 和 Web 平台
 */

import React from 'react';
import { Platform, ViewStyle, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Ionicons 的所有可用圖標名稱類型
type IoniconsGlyphNames = keyof typeof Ionicons.glyphMap;

interface IconProps {
  name: IoniconsGlyphNames | string;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

// SVG 圖標定義
const svgIcons: Record<string, string> = {
  // 基礎圖標
  'add': '<path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>',
  'add-circle': '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>',
  'arrow-back': '<path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>',
  'arrow-forward': '<path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>',
  'checkmark': '<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>',
  'checkmark-circle': '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>',
  'chevron-down': '<path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/>',
  'chevron-up': '<path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z"/>',
  'close': '<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>',
  'close-circle': '<path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>',
  'cloud-upload': '<path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>',
  'create': '<path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>',
  'document': '<path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>',
  'download': '<path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>',
  'eye': '<path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>',
  'filter': '<path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/>',
  'folder': '<path d="M10 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>',
  'help-circle': '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>',
  'home': '<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>',
  'information-circle': '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>',
  'list': '<path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>',
  'log-out': '<path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>',
  'mail': '<path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>',
  'menu': '<path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>',
  'more': '<path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>',
  'people': '<path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>',
  'people-outline': '<path d="M16.5 13c-1.2 0-3.07.34-4.5 1-1.43-.67-3.3-1-4.5-1C5.33 13 1 14.08 1 16.25V19h22v-2.75c0-2.17-4.33-3.25-6.5-3.25zm-4 4.5h-10v-1.25c0-.54 2.56-1.75 5-1.75s5 1.21 5 1.75v1.25zm9 0H14v-1.25c0-.46-.2-.86-.52-1.22.88-.3 1.96-.53 3.02-.53 2.44 0 5 1.21 5 1.75v1.25zM7.5 12c1.93 0 3.5-1.57 3.5-3.5S9.43 5 7.5 5 4 6.57 4 8.5 5.57 12 7.5 12zm0-5.5c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 5.5c1.93 0 3.5-1.57 3.5-3.5S18.43 5 16.5 5 13 6.57 13 8.5s1.57 3.5 3.5 3.5zm0-5.5c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"/>',
  'person': '<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>',
  'person-add': '<path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>',
  'refresh': '<path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>',
  'save': '<path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>',
  'search': '<path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>',
  'settings': '<path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>',
  'star': '<path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>',
  'star-outline': '<path d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z"/>',
  'sync': '<path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>',
  'time': '<path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>',
  'time-outline': '<path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>',
  'trash': '<path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>',
  'warning': '<path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>',
};

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
  
  // Web 平台使用 SVG 圖標
  if (Platform.OS === 'web') {
    // 獲取 SVG 路徑，如果沒有則使用預設的問號圖標
    const svgPath = svgIcons[iconName] || svgIcons['help-circle'];
    
    // 直接返回 SVG 元素（React Native Web 會處理）
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={color}
        style={{
          display: 'inline-block',
          verticalAlign: 'middle',
          ...(style as any),
        }}
        dangerouslySetInnerHTML={{ __html: svgPath }}
      />
    );
  }
  
  // Native 平台使用 Ionicons
  return <Ionicons {...props} name={iconName as IoniconsGlyphNames} />;
};

// 匯出類型供外部使用
export type { IconProps };