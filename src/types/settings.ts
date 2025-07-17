/**
 * 設定相關型別定義
 */

export interface SettingSection {
  id: string;
  title: string;
  items: SettingItem[];
}

export interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  type: 'switch' | 'select' | 'navigation' | 'action';
  value?: any;
  options?: { label: string; value: any }[];
  action?: () => void;
  icon?: string;
}