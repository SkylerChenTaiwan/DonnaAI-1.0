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

/**
 * 使用者設定資料結構
 */
export interface UserSettings {
  // 通知設定
  notifications: {
    enabled: boolean;
    lastUpdated?: Date;
  };
  
  // 音效設定
  sounds: {
    enabled: boolean;
    volume?: number; // 0-1
  };
  
  // 元資料
  version: string;
  lastSynced?: Date;
}

/**
 * 設定服務介面
 */
export interface SettingsService {
  loadSettings(): Promise<UserSettings>;
  saveSettings(settings: Partial<UserSettings>): Promise<void>;
  syncWithFirebase(): Promise<void>;
  resetToDefaults(): Promise<void>;
}