/**
 * 用戶匯入模式切換元件
 * 提供簡易/進階模式切換功能
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Icon } from '@/components/common/Icon';
import { DesignSystem } from '@/theme/designSystem';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserImportModeToggleProps {
  mode: 'simple' | 'advanced';
  onChange: (mode: 'simple' | 'advanced') => void;
  disabled?: boolean;
}

const STORAGE_KEY = 'userImportMode';

const UserImportModeToggle: React.FC<UserImportModeToggleProps> = ({
  mode,
  onChange,
  disabled = false,
}) => {
  // 從 localStorage 載入偏好設定
  useEffect(() => {
    loadModePreference();
  }, []);

  // 儲存模式偏好設定
  useEffect(() => {
    saveModePreference(mode);
  }, [mode]);

  const loadModePreference = async () => {
    try {
      if (Platform.OS === 'web') {
        const savedMode = localStorage.getItem(STORAGE_KEY);
        if (savedMode === 'simple' || savedMode === 'advanced') {
          onChange(savedMode);
        }
      } else {
        const savedMode = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedMode === 'simple' || savedMode === 'advanced') {
          onChange(savedMode);
        }
      }
    } catch (error) {
      console.error('載入模式偏好設定失敗:', error);
    }
  };

  const saveModePreference = async (newMode: 'simple' | 'advanced') => {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(STORAGE_KEY, newMode);
      } else {
        await AsyncStorage.setItem(STORAGE_KEY, newMode);
      }
    } catch (error) {
      console.error('儲存模式偏好設定失敗:', error);
    }
  };

  const handleToggle = () => {
    if (!disabled) {
      const newMode = mode === 'simple' ? 'advanced' : 'simple';
      onChange(newMode);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.toggle,
          disabled && styles.toggleDisabled,
        ]}
        onPress={handleToggle}
        disabled={disabled}
      >
        <View style={[
          styles.option,
          mode === 'simple' && styles.optionActive,
        ]}>
          <Icon
            name="flash-outline"
            size={16}
            color={mode === 'simple' ? DesignSystem.colors.primary : DesignSystem.colors.text.secondary}
          />
          <Text style={[
            styles.optionText,
            mode === 'simple' && styles.optionTextActive,
          ]}>
            簡易
          </Text>
        </View>
        
        <View style={[
          styles.slider,
          mode === 'advanced' && styles.sliderActive,
        ]} />
        
        <View style={[
          styles.option,
          mode === 'advanced' && styles.optionActive,
        ]}>
          <Icon
            name="settings-outline"
            size={16}
            color={mode === 'advanced' ? DesignSystem.colors.primary : DesignSystem.colors.text.secondary}
          />
          <Text style={[
            styles.optionText,
            mode === 'advanced' && styles.optionTextActive,
          ]}>
            進階
          </Text>
        </View>
      </TouchableOpacity>
      
      {/* 模式說明提示 */}
      <View style={styles.tooltip}>
        <Icon
          name="information-circle-outline"
          size={14}
          color={DesignSystem.colors.text.tertiary}
        />
        <Text style={styles.tooltipText}>
          {mode === 'simple' 
            ? '簡易模式：快速匯入，自動映射欄位'
            : '進階模式：多檔案合併、手動調整映射、批量編輯'
          }
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: DesignSystem.colors.background.surface,
    borderRadius: DesignSystem.borderRadius.full,
    padding: 2,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.light,
    position: 'relative',
  },
  toggleDisabled: {
    opacity: 0.5,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.xs,
    zIndex: 2,
  },
  optionActive: {
    // Active styles handled by text and icon colors
  },
  optionText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    marginLeft: DesignSystem.spacing.xs,
  },
  optionTextActive: {
    color: DesignSystem.colors.primary,
    fontWeight: '600',
  },
  slider: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: '50%',
    height: '100%',
    backgroundColor: DesignSystem.colors.background.primary,
    borderRadius: DesignSystem.borderRadius.full,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      } as any,
    }),
    transition: Platform.OS === 'web' ? 'transform 0.2s ease' : undefined,
  } as any,
  sliderActive: {
    transform: [{ translateX: Platform.OS === 'web' ? 'calc(100% - 4px)' : 80 }] as any,
  },
  tooltip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: DesignSystem.spacing.xs,
    paddingHorizontal: DesignSystem.spacing.sm,
  },
  tooltipText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.tertiary,
    marginLeft: DesignSystem.spacing.xxs,
    maxWidth: 200,
  },
});

export default UserImportModeToggle;