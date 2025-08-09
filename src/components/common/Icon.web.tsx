import React from 'react';
import { ViewStyle } from 'react-native';
import * as IoniconsWeb from './icons/ionicons';

interface IconProps {
  name: string | any;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

// 圖標名稱映射表
const iconMap: Record<string, React.ComponentType<any>> = {
  // Basic icons
  'add': IoniconsWeb.AddIcon,
  'add-circle': IoniconsWeb.AddCircleIcon,
  'add-circle-outline': IoniconsWeb.AddCircleOutlineIcon,
  'alert-circle': IoniconsWeb.AlertCircleIcon,
  'alert-circle-outline': IoniconsWeb.AlertCircleOutlineIcon,
  
  // Navigation
  'arrow-back': IoniconsWeb.ArrowBackIcon,
  'arrow-forward': IoniconsWeb.ArrowForwardIcon,
  'chevron-back': IoniconsWeb.ChevronBackIcon,
  'chevron-down': IoniconsWeb.ChevronDownIcon,
  'chevron-down-outline': IoniconsWeb.ChevronDownIcon,
  'chevron-forward': IoniconsWeb.ChevronForwardIcon,
  'chevron-right': IoniconsWeb.ChevronForwardIcon, // Alias
  
  // Actions
  'bookmark-outline': IoniconsWeb.BookmarkOutlineIcon,
  'bulb': IoniconsWeb.BulbIcon,
  'bulb-outline': IoniconsWeb.BulbOutlineIcon,
  'business': IoniconsWeb.BusinessIcon,
  'business-outline': IoniconsWeb.BusinessIcon, // Use filled as fallback
  
  // Calendar & Time
  'calendar': IoniconsWeb.CalendarIcon,
  'calendar-outline': IoniconsWeb.CalendarOutlineIcon,
  'time-outline': IoniconsWeb.CalendarOutlineIcon, // Fallback
  
  // Communication
  'call-outline': IoniconsWeb.CallOutlineIcon,
  'mail-outline': IoniconsWeb.MailOutlineIcon,
  'megaphone': IoniconsWeb.MegaphoneIcon,
  'megaphone-outline': IoniconsWeb.MegaphoneOutlineIcon,
  'mic': IoniconsWeb.MicIcon,
  
  // Checks & Status
  'checkmark': IoniconsWeb.CheckmarkIcon,
  'checkmark-circle': IoniconsWeb.CheckmarkCircleIcon,
  'checkmark-circle-outline': IoniconsWeb.CheckmarkCircleOutlineIcon,
  'checkmark-done-outline': IoniconsWeb.CheckmarkDoneOutlineIcon,
  'checkmark-square': IoniconsWeb.CheckmarkSquareIcon,
  'checkbox': IoniconsWeb.CheckmarkSquareIcon, // Alias
  'square-outline': IoniconsWeb.SquareOutlineIcon,
  
  // Close & Remove
  'close': IoniconsWeb.CloseIcon,
  'close-circle': IoniconsWeb.CloseCircleIcon,
  'close-circle-outline': IoniconsWeb.CloseCircleOutlineIcon,
  'remove': IoniconsWeb.RemoveIcon,
  
  // Files & Data
  'cloud-upload': IoniconsWeb.CloudUploadIcon,
  'cloud-upload-outline': IoniconsWeb.CloudUploadOutlineIcon,
  'copy-outline': IoniconsWeb.CopyOutlineIcon,
  'database': IoniconsWeb.DatabaseIcon,
  'database-outline': IoniconsWeb.DatabaseIcon, // Use filled as fallback
  'document-text': IoniconsWeb.DocumentTextOutlineIcon, // Use outline as fallback
  'document-text-outline': IoniconsWeb.DocumentTextOutlineIcon,
  'document-outline': IoniconsWeb.DocumentTextOutlineIcon, // Alias
  'download': IoniconsWeb.DownloadOutlineIcon, // Use outline as fallback
  'download-outline': IoniconsWeb.DownloadOutlineIcon,
  'folder-open': IoniconsWeb.FolderOpenOutlineIcon, // Use outline as fallback
  'folder-open-outline': IoniconsWeb.FolderOpenOutlineIcon,
  
  // Edit & Settings
  'create-outline': IoniconsWeb.CreateOutlineIcon,
  'pencil': IoniconsWeb.PencilIcon,
  'settings-outline': IoniconsWeb.SettingsOutlineIcon,
  'construct-outline': IoniconsWeb.SettingsOutlineIcon, // Fallback
  'options': IoniconsWeb.SettingsOutlineIcon, // Fallback
  
  // Filter & Search
  'filter': IoniconsWeb.FilterIcon,
  'filter-outline': IoniconsWeb.FilterOutlineIcon,
  'search': IoniconsWeb.SearchIcon,
  'search-outline': IoniconsWeb.SearchOutlineIcon,
  
  // Help & Info
  'help-circle-outline': IoniconsWeb.HelpCircleOutlineIcon,
  'information-circle': IoniconsWeb.InformationCircleIcon,
  'information-circle-outline': IoniconsWeb.InformationCircleOutlineIcon,
  
  // Media
  'pause': IoniconsWeb.PauseIcon,
  'play': IoniconsWeb.PlayIcon,
  'stop': IoniconsWeb.StopIcon,
  
  // People
  'people': IoniconsWeb.PeopleIcon,
  'people-outline': IoniconsWeb.PeopleOutlineIcon,
  'person': IoniconsWeb.PersonIcon,
  'person-add': IoniconsWeb.PersonAddIcon,
  'person-add-outline': IoniconsWeb.PersonAddOutlineIcon,
  'person-circle': IoniconsWeb.PersonCircleIcon,
  'person-outline': IoniconsWeb.PersonIcon, // Use filled as fallback
  
  // Misc
  'flag': IoniconsWeb.FlagIcon,
  'git-branch-outline': IoniconsWeb.GitBranchOutlineIcon,
  'git-compare-outline': IoniconsWeb.GitCompareOutlineIcon,
  'lock-closed': IoniconsWeb.LockClosedIcon,
  'open-outline': IoniconsWeb.OpenOutlineIcon,
  'refresh': IoniconsWeb.RefreshIcon,
  'refresh-outline': IoniconsWeb.RefreshIcon, // Use filled as fallback
  'trash-outline': IoniconsWeb.TrashOutlineIcon,
  'warning': IoniconsWeb.WarningIcon,
  'warning-outline': IoniconsWeb.WarningOutlineIcon,
  
  // Additional aliases for compatibility
  'list': IoniconsWeb.FilterIcon, // Fallback
  'sparkles': IoniconsWeb.BulbIcon, // Fallback
  'analytics-outline': IoniconsWeb.DatabaseIcon, // Fallback
  'bar-chart-outline': IoniconsWeb.DatabaseIcon, // Fallback
  'card-outline': IoniconsWeb.DocumentTextOutlineIcon, // Fallback
  'file-tray-outline': IoniconsWeb.FolderOpenOutlineIcon, // Fallback
  'gift-outline': IoniconsWeb.BulbIcon, // Fallback
  'key-outline': IoniconsWeb.LockClosedIcon, // Fallback
  'receipt-outline': IoniconsWeb.DocumentTextOutlineIcon, // Fallback
  'reorder-three': IoniconsWeb.FilterIcon, // Fallback
  'swap-vertical': IoniconsWeb.ArrowForwardIcon, // Fallback
};

export const Icon: React.FC<IconProps> = ({ name, size = 24, color = '#000', style }) => {
  // Handle dynamic icon names
  const iconName = typeof name === 'string' ? name : String(name);
  const IconComponent = iconMap[iconName];
  
  if (!IconComponent) {
    // Fallback to help circle for unknown icons
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Icon "${iconName}" not found in web icons, using fallback`);
    }
    return <IoniconsWeb.HelpCircleOutlineIcon size={size} color={color} style={style} />;
  }
  
  return <IconComponent size={size} color={color} style={style} />;
};

export type { IconProps };