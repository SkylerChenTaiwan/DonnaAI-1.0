import React from 'react';
import { ViewStyle } from 'react-native';
import * as IoniconsWeb from './icons/ionicons';

// 擴展 Window 介面以支援警告記錄
declare global {
  interface Window {
    _warnedIcons?: Set<string>;
  }
}

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
  'chevron-down-outline': IoniconsWeb.ChevronDownOutlineIcon,
  'chevron-forward': IoniconsWeb.ChevronForwardIcon,
  'chevron-right': IoniconsWeb.ChevronRightIcon,
  
  // Actions
  'bookmark-outline': IoniconsWeb.BookmarkOutlineIcon,
  'bulb': IoniconsWeb.BulbIcon,
  'bulb-outline': IoniconsWeb.BulbOutlineIcon,
  'business': IoniconsWeb.BusinessIcon,
  'business-outline': IoniconsWeb.BusinessOutlineIcon,
  
  // Calendar & Time
  'calendar': IoniconsWeb.CalendarIcon,
  'calendar-outline': IoniconsWeb.CalendarOutlineIcon,
  'time-outline': IoniconsWeb.TimeOutlineIcon,
  
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
  'checkbox': IoniconsWeb.CheckboxIcon,
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
  'database-outline': IoniconsWeb.DatabaseOutlineIcon,
  'document-text': IoniconsWeb.DocumentTextIcon,
  'document-text-outline': IoniconsWeb.DocumentTextOutlineIcon,
  'document-outline': IoniconsWeb.DocumentOutlineIcon,
  'download': IoniconsWeb.DownloadIcon,
  'download-outline': IoniconsWeb.DownloadOutlineIcon,
  'folder-open': IoniconsWeb.FolderOpenIcon,
  'folder-open-outline': IoniconsWeb.FolderOpenOutlineIcon,
  
  // Edit & Settings
  'create-outline': IoniconsWeb.CreateOutlineIcon,
  'pencil': IoniconsWeb.PencilIcon,
  'settings-outline': IoniconsWeb.SettingsOutlineIcon,
  'construct-outline': IoniconsWeb.ConstructOutlineIcon,
  'options': IoniconsWeb.OptionsIcon,
  
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
  'person-outline': IoniconsWeb.PersonOutlineIcon,
  
  // Media
  'play-circle-outline': IoniconsWeb.PlayCircleOutlineIcon || IoniconsWeb.PlayIcon,
  'pause-circle-outline': IoniconsWeb.PauseCircleOutlineIcon || IoniconsWeb.PauseIcon,
  
  // Misc
  'flag': IoniconsWeb.FlagIcon,
  'git-branch-outline': IoniconsWeb.GitBranchOutlineIcon,
  'git-compare-outline': IoniconsWeb.GitCompareOutlineIcon,
  'lock-closed': IoniconsWeb.LockClosedIcon,
  'open-outline': IoniconsWeb.OpenOutlineIcon,
  'refresh': IoniconsWeb.RefreshIcon,
  'refresh-outline': IoniconsWeb.RefreshOutlineIcon,
  'trash-outline': IoniconsWeb.TrashOutlineIcon,
  'warning': IoniconsWeb.WarningIcon,
  'warning-outline': IoniconsWeb.WarningOutlineIcon,
  
  // Additional icons (non-duplicates only)
  'analytics-outline': IoniconsWeb.AnalyticsOutlineIcon,
  'bar-chart-outline': IoniconsWeb.BarChartOutlineIcon,
  'build': IoniconsWeb.BuildIcon,
  'build-outline': IoniconsWeb.BuildOutlineIcon,
  'card-outline': IoniconsWeb.CardOutlineIcon,
  'file-tray-outline': IoniconsWeb.FileTrayOutlineIcon,
  'gift-outline': IoniconsWeb.GiftOutlineIcon,
  'key-outline': IoniconsWeb.KeyOutlineIcon,
  'list': IoniconsWeb.ListIcon,
  'people-circle': IoniconsWeb.PeopleCircleIcon,
  'people-circle-outline': IoniconsWeb.PeopleCircleOutlineIcon,
  'receipt-outline': IoniconsWeb.ReceiptOutlineIcon,
  'reorder-three': IoniconsWeb.ReorderThreeIcon,
  'sparkles': IoniconsWeb.SparklesIcon,
  'swap-vertical': IoniconsWeb.SwapVerticalIcon,
  'menu': IoniconsWeb.MenuIcon,
  'cash-outline': IoniconsWeb.CashOutlineIcon,
  'trending-down-outline': IoniconsWeb.TrendingDownOutlineIcon,
  'cloud-download-outline': IoniconsWeb.CloudDownloadOutlineIcon
};

export const Icon: React.FC<IconProps> = ({ name, size = 24, color = '#000', style }) => {
  // Handle dynamic icon names
  const iconName = typeof name === 'string' ? name : String(name);
  const IconComponent = iconMap[iconName];
  
  if (!IconComponent) {
    // Fallback to help circle for unknown icons - 只在開發環境且只記錄一次
    if (process.env.NODE_ENV === 'development') {
      // 使用 Set 來記錄已經警告過的圖標，避免重複警告
      if (!window._warnedIcons) {
        window._warnedIcons = new Set();
      }
      if (!window._warnedIcons.has(iconName)) {
        window._warnedIcons.add(iconName);
        console.warn(`Icon "${iconName}" not found in web icons, using fallback`);
      }
    }
    return <IoniconsWeb.HelpCircleOutlineIcon size={size} color={color} style={style} />;
  }
  
  return <IconComponent size={size} color={color} style={style} />;
};

export type { IconProps };