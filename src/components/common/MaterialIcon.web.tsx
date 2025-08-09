import React from 'react';
import { ViewStyle } from 'react-native';
import * as MaterialIconsWeb from './icons/material';

interface MaterialIconProps {
  name: string | any;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

// Material Icons 名稱映射表
const iconMap: Record<string, React.ComponentType<any>> = {
  // Basic
  'add': MaterialIconsWeb.AddIcon,
  'add-circle': MaterialIconsWeb.AddCircleIcon,
  'add-circle-outline': MaterialIconsWeb.AddCircleIcon, // Use filled as fallback
  
  // Navigation
  'arrow-back': MaterialIconsWeb.ArrowBackIcon,
  'arrow-drop-down': MaterialIconsWeb.ArrowDropDownIcon,
  'arrow-forward': MaterialIconsWeb.ArrowForwardIcon,
  'chevron-right': MaterialIconsWeb.ChevronRightIcon,
  
  // Auto & Features
  'auto-awesome': MaterialIconsWeb.AutoAwesomeIcon,
  
  // Status
  'check-circle': MaterialIconsWeb.CheckCircleIcon,
  'error': MaterialIconsWeb.ErrorIcon,
  'info': MaterialIconsWeb.InfoIcon,
  'info-outline': MaterialIconsWeb.InfoOutlineIcon,
  'warning': MaterialIconsWeb.WarningIcon,
  
  // Actions
  'close': MaterialIconsWeb.CloseIcon,
  'cloud-upload': MaterialIconsWeb.CloudUploadIcon,
  'delete': MaterialIconsWeb.DeleteIcon,
  'file-upload': MaterialIconsWeb.FileUploadIcon,
  'refresh': MaterialIconsWeb.RefreshIcon,
  
  // Files
  'insert-drive-file': MaterialIconsWeb.InsertDriveFileIcon,
  
  // Links & Connections
  'link': MaterialIconsWeb.LinkIcon,
  'link-off': MaterialIconsWeb.LinkOffIcon,
  'merge-type': MaterialIconsWeb.MergeTypeIcon,
  'swap-horiz': MaterialIconsWeb.SwapHorizIcon,
  'sync': MaterialIconsWeb.SyncIcon,
  
  // UI Elements
  'lightbulb-outline': MaterialIconsWeb.LightbulbOutlineIcon,
  'preview': MaterialIconsWeb.PreviewIcon,
  'table-chart': MaterialIconsWeb.TableChartIcon,
  
  // Additional compatibility mappings
  'merge': MaterialIconsWeb.MergeTypeIcon, // Alias
  'swap': MaterialIconsWeb.SwapHorizIcon, // Alias
  'sync-alt': MaterialIconsWeb.SyncIcon, // Alias
  'visibility': MaterialIconsWeb.PreviewIcon, // Alias
  'cloud': MaterialIconsWeb.CloudUploadIcon, // Alias
  'upload': MaterialIconsWeb.FileUploadIcon, // Alias
  'upload-file': MaterialIconsWeb.FileUploadIcon, // Alias
  'auto-fix': MaterialIconsWeb.AutoAwesomeIcon, // Alias
  'star': MaterialIconsWeb.AutoAwesomeIcon, // Fallback
  'speed': MaterialIconsWeb.SyncIcon, // Fallback
  'cleaning-services': MaterialIconsWeb.RefreshIcon, // Fallback
};

export const MaterialIcon: React.FC<MaterialIconProps> = ({ name, size = 24, color = '#000', style }) => {
  // Handle dynamic icon names
  const iconName = typeof name === 'string' ? name : String(name);
  const IconComponent = iconMap[iconName];
  
  if (!IconComponent) {
    // Fallback to info icon for unknown icons
    if (process.env.NODE_ENV === 'development') {
      console.warn(`MaterialIcon "${iconName}" not found in web icons, using fallback`);
    }
    return <MaterialIconsWeb.InfoOutlineIcon size={size} color={color} style={style} />;
  }
  
  return <IconComponent size={size} color={color} style={style} />;
};

export type { MaterialIconProps };