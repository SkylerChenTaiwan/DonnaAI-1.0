/**
 * 設定管理 Hook
 * 提供使用者設定的狀態管理和操作方法
 */

import { useState, useEffect, useCallback } from 'react';
import { UserSettings } from '../types/settings';
import { settingsService } from '../services/settings';

interface UseSettingsReturn {
  settings: UserSettings | null;
  loading: boolean;
  error: Error | null;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  reloadSettings: () => Promise<void>;
}

/**
 * 使用者設定 Hook
 * 管理設定的載入、更新和同步
 */
export const useSettings = (): UseSettingsReturn => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * 載入設定
   */
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const loadedSettings = await settingsService.loadSettings();
      setSettings(loadedSettings);
    } catch (err) {
      console.error('載入設定失敗:', err);
      setError(err instanceof Error ? err : new Error('載入設定失敗'));
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 更新設定
   */
  const updateSettings = useCallback(async (updates: Partial<UserSettings>) => {
    try {
      setError(null);
      
      // 樂觀更新 UI
      if (settings) {
        const optimisticSettings = {
          ...settings,
          ...updates,
          lastSynced: new Date()
        };
        setSettings(optimisticSettings);
      }
      
      // 儲存到服務
      await settingsService.saveSettings(updates);
      
      // 重新載入以確保同步
      const updatedSettings = await settingsService.loadSettings();
      setSettings(updatedSettings);
    } catch (err) {
      console.error('更新設定失敗:', err);
      setError(err instanceof Error ? err : new Error('更新設定失敗'));
      
      // 回滾樂觀更新
      await loadSettings();
      throw err;
    }
  }, [settings, loadSettings]);

  /**
   * 重置為預設值
   */
  const resetToDefaults = useCallback(async () => {
    try {
      setError(null);
      
      await settingsService.resetToDefaults();
      const defaultSettings = await settingsService.loadSettings();
      setSettings(defaultSettings);
    } catch (err) {
      console.error('重置設定失敗:', err);
      setError(err instanceof Error ? err : new Error('重置設定失敗'));
      throw err;
    }
  }, []);

  /**
   * 重新載入設定
   */
  const reloadSettings = useCallback(async () => {
    await loadSettings();
  }, [loadSettings]);

  /**
   * 元件掛載時載入設定
   */
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  /**
   * 提供便利方法來更新特定設定
   */
  const enhancedUpdateSettings = useCallback(async (updates: Partial<UserSettings>) => {
    // 如果更新通知設定，記錄更新時間
    if (updates.notifications !== undefined) {
      updates.notifications = {
        ...settings?.notifications,
        ...updates.notifications,
        lastUpdated: new Date()
      };
    }
    
    await updateSettings(updates);
  }, [settings, updateSettings]);

  return {
    settings,
    loading,
    error,
    updateSettings: enhancedUpdateSettings,
    resetToDefaults,
    reloadSettings
  };
};

/**
 * 便利 Hook：僅管理通知設定
 */
export const useNotificationSettings = () => {
  const { settings, loading, updateSettings } = useSettings();
  
  const toggleNotifications = useCallback(async (enabled: boolean) => {
    await updateSettings({
      notifications: {
        enabled,
        lastUpdated: new Date()
      }
    });
  }, [updateSettings]);
  
  return {
    enabled: settings?.notifications.enabled ?? true,
    loading,
    toggleNotifications
  };
};

/**
 * 便利 Hook：僅管理音效設定
 */
export const useSoundSettings = () => {
  const { settings, loading, updateSettings } = useSettings();
  
  const toggleSounds = useCallback(async (enabled: boolean) => {
    await updateSettings({
      sounds: {
        enabled,
        volume: settings?.sounds.volume
      }
    });
  }, [updateSettings, settings]);
  
  const setVolume = useCallback(async (volume: number) => {
    await updateSettings({
      sounds: {
        enabled: settings?.sounds.enabled ?? true,
        volume: Math.max(0, Math.min(1, volume))
      }
    });
  }, [updateSettings, settings]);
  
  return {
    enabled: settings?.sounds.enabled ?? true,
    volume: settings?.sounds.volume ?? 0.7,
    loading,
    toggleSounds,
    setVolume
  };
};