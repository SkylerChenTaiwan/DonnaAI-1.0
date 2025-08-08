/**
 * Material Icon 元件
 * 支援 Native 和 Web 平台
 */

import React from 'react';
import { Platform, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

// MaterialIcons 的圖標名稱類型
type MaterialIconNames = keyof typeof MaterialIcons.glyphMap;

interface MaterialIconProps {
  name: MaterialIconNames | string;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

// Material Icons 的 Unicode 對應表
const materialIconUnicodeMap: Record<string, string> = {
  'add': '\ue145',
  'arrow-back': '\ue5c4',
  'arrow-forward': '\ue5c8',
  'business': '\ue0af',
  'check': '\ue5ca',
  'check-circle': '\ue86c',
  'chevron-left': '\ue5cb',
  'chevron-right': '\ue5cc',
  'close': '\ue5cd',
  'dashboard': '\ue871',
  'delete': '\ue872',
  'description': '\ue873',
  'done': '\ue876',
  'edit': '\ue3c9',
  'error': '\ue000',
  'folder': '\ue2c7',
  'group': '\ue7ef',
  'help': '\ue887',
  'home': '\ue88a',
  'info': '\ue88e',
  'link': '\ue157',
  'logout': '\ue879',
  'menu': '\ue5d2',
  'more-vert': '\ue5d4',
  'people': '\ue7fb',
  'person': '\ue7fd',
  'person-add': '\ue7fe',
  'refresh': '\ue5d5',
  'search': '\ue8b6',
  'settings': '\ue8b8',
  'star': '\ue838',
  'visibility': '\ue8f4',
  'warning': '\ue002',
  // 智能匯入相關
  'upload-file': '\ue9fc',
  'cloud-upload': '\ue2c3',
  'file-copy': '\ue173',
  'table-chart': '\ue265',
  'schema': '\ue265',
  'merge-type': '\ue252',
  'sync': '\ue627',
  'auto-fix-high': '\ue663',
  'psychology': '\ue8e5',
  'smart-toy': '\ue9e9',
};

/**
 * Material Icon 元件
 * Native 使用 @expo/vector-icons，Web 使用 CSS 字體
 */
export const MaterialIcon: React.FC<MaterialIconProps> = (props) => {
  const { name, size = 24, color = '#000', style } = props;
  const iconName = typeof name === 'string' ? name : String(name);
  
  // Web 平台使用 HTML 元素直接渲染
  if (Platform.OS === 'web') {
    // 嘗試獲取 Unicode，如果沒有則使用預設值
    const unicode = materialIconUnicodeMap[iconName] || materialIconUnicodeMap['help'] || '\ue887';
    
    return (
      <span
        className="material-icon"
        style={{
          fontFamily: 'Material Icons, MaterialIcons, sans-serif',
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
  
  // Native 平台使用 MaterialIcons
  return <MaterialIcons {...props} name={iconName as MaterialIconNames} />;
};

// 匯出類型供外部使用
export type { MaterialIconProps };