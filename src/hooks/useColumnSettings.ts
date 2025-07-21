/**
 * 欄位設定管理 Hook
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ColumnSettings {
  visibleColumns: string[];
  columnOrder?: string[];
}

interface UseColumnSettingsReturn {
  settings: ColumnSettings | null;
  loading: boolean;
  saveSettings: (newSettings: ColumnSettings) => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

const STORAGE_KEY_PREFIX = 'columnSettings_';

export const useColumnSettings = (
  tabId: string,
  defaultColumns: string[]
): UseColumnSettingsReturn => {
  const [settings, setSettings] = useState<ColumnSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // 載入設定
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const storageKey = `${STORAGE_KEY_PREFIX}${tabId}`;
        const savedSettings = await AsyncStorage.getItem(storageKey);
        
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        } else {
          // 使用預設值
          setSettings({
            visibleColumns: [...defaultColumns],
            columnOrder: [...defaultColumns],
          });
        }
      } catch (error) {
        console.error('載入欄位設定失敗:', error);
        // 出錯時使用預設值
        setSettings({
          visibleColumns: [...defaultColumns],
          columnOrder: [...defaultColumns],
        });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [tabId]);

  // 儲存設定
  const saveSettings = useCallback(async (newSettings: ColumnSettings) => {
    try {
      const storageKey = `${STORAGE_KEY_PREFIX}${tabId}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('儲存欄位設定失敗:', error);
      throw error;
    }
  }, [tabId]);

  // 重置為預設值
  const resetToDefaults = useCallback(async () => {
    const defaultSettings: ColumnSettings = {
      visibleColumns: [...defaultColumns],
      columnOrder: [...defaultColumns],
    };
    await saveSettings(defaultSettings);
  }, [defaultColumns, saveSettings]);

  // 當 defaultColumns 改變時，如果沒有設定則使用新的預設值
  useEffect(() => {
    if (!settings && defaultColumns.length > 0) {
      setSettings({
        visibleColumns: [...defaultColumns],
        columnOrder: [...defaultColumns],
      });
      setLoading(false);
    }
  }, [defaultColumns, settings]);

  return {
    settings,
    loading,
    saveSettings,
    resetToDefaults,
  };
};