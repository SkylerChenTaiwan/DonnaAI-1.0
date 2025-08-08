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

// Material Icons 名稱映射表
const materialIconNameMap: Record<string, string> = {
  // 常用圖標
  'add': 'add',
  'arrow-back': 'arrow_back',
  'arrow-forward': 'arrow_forward',
  'business': 'business',
  'check': 'check',
  'check-circle': 'check_circle',
  'chevron-left': 'chevron_left',
  'chevron-right': 'chevron_right',
  'close': 'close',
  'dashboard': 'dashboard',
  'delete': 'delete',
  'description': 'description',
  'done': 'done',
  'edit': 'edit',
  'error': 'error',
  'folder': 'folder',
  'group': 'group',
  'help': 'help',
  'home': 'home',
  'info': 'info',
  'link': 'link',
  'logout': 'logout',
  'menu': 'menu',
  'more-vert': 'more_vert',
  'people': 'people',
  'person': 'person',
  'person-add': 'person_add',
  'refresh': 'refresh',
  'search': 'search',
  'settings': 'settings',
  'star': 'star',
  'visibility': 'visibility',
  'warning': 'warning',
  // 智能匯入相關
  'upload-file': 'upload_file',
  'cloud-upload': 'cloud_upload',
  'file-copy': 'file_copy',
  'file_upload': 'file_upload',
  'table-chart': 'table_chart',
  'schema': 'schema',
  'merge-type': 'merge_type',
  'sync': 'sync',
  'auto-fix-high': 'auto_fix_high',
  'psychology': 'psychology',
  'smart-toy': 'smart_toy',
  'hourglass-empty': 'hourglass_empty',
  'cleaning-services': 'cleaning_services',
};

/**
 * Material Icon 元件
 * Native 使用 @expo/vector-icons，Web 使用 CSS 字體
 */
export const MaterialIcon: React.FC<MaterialIconProps> = (props) => {
  const { name, size = 24, color = '#000', style } = props;
  const iconName = typeof name === 'string' ? name : String(name);
  
  // Web 平台使用 Material Icons 字體類名方式
  if (Platform.OS === 'web') {
    // 獲取對應的圖標名稱
    const materialIconName = materialIconNameMap[iconName] || iconName || 'help';
    
    return (
      <span
        className="material-icons"
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
          fontFeatureSettings: 'liga',
          userSelect: 'none',
          ...(style as any),
        }}
        aria-hidden="true"
      >
        {materialIconName}
      </span>
    );
  }
  
  // Native 平台使用 MaterialIcons
  return <MaterialIcons {...props} name={iconName as MaterialIconNames} />;
};

// 匯出類型供外部使用
export type { MaterialIconProps };