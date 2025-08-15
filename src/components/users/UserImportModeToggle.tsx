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
  Platform } from 'react-native';
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
  disabled = false }) => {
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

  const renderToggleButton = () => {
    const toggleContent = (
      <>
        <View style={StyleSheet.flatten([
          styles.option,
          mode === 'simple' && styles.optionActive,
        ])}>
          <Icon
            name="flash-outline"
            size={16}
            color={mode === 'simple' ? DesignSystem.colors.primary : DesignSystem.colors.text.secondary}
          />
          <Text style={StyleSheet.flatten([
            styles.optionText,
            mode === 'simple' && styles.optionTextActive,
          ])}>
            簡易
          </Text>
        </View>
        
        <View style={StyleSheet.flatten([
          styles.slider,
          mode === 'advanced' && styles.sliderActive,
        ])} />
        
        <View style={StyleSheet.flatten([
          styles.option,
          mode === 'advanced' && styles.optionActive,
        ])}>
          <Icon
            name="settings-outline"
            size={16}
            color={mode === 'advanced' ? DesignSystem.colors.primary : DesignSystem.colors.text.secondary}
          />
          <Text style={StyleSheet.flatten([
            styles.optionText,
            mode === 'advanced' && styles.optionTextActive,
          ])}>
            進階
          </Text>
        </View>
      </>
    );

    if (Platform.OS === 'web') {
      // 為簡易和進階選項分別創建內容
      const webToggleContent = (
        <>
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            paddingLeft: '16px',
            paddingRight: '16px',
            paddingTop: '4px',
            paddingBottom: '4px',
            zIndex: 2
          }}>
            <span style={{
              fontSize: '14px',
              color: mode === 'simple' ? DesignSystem.colors.primary : DesignSystem.colors.text.secondary,
              fontWeight: mode === 'simple' ? '600' : 'normal',
              marginRight: '4px'
            }}>
              ⚡ 簡易
            </span>
          </div>
          
          <div style={{
            position: 'absolute',
            top: '2px',
            left: mode === 'simple' ? '2px' : 'calc(50% - 2px)',
            width: '50%',
            height: 'calc(100% - 4px)',
            backgroundColor: DesignSystem.colors.background.primary,
            borderRadius: '999px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            transition: 'left 0.2s ease'
          }} />
          
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            paddingLeft: '16px',
            paddingRight: '16px',
            paddingTop: '4px',
            paddingBottom: '4px',
            zIndex: 2
          }}>
            <span style={{
              fontSize: '14px',
              color: mode === 'advanced' ? DesignSystem.colors.primary : DesignSystem.colors.text.secondary,
              fontWeight: mode === 'advanced' ? '600' : 'normal',
              marginRight: '4px'
            }}>
              ⚙️ 進階
            </span>
          </div>
        </>
      );
      
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            backgroundColor: DesignSystem.colors.background.surface,
            borderRadius: '999px',
            padding: '2px',
            border: `1px solid ${DesignSystem.colors.border.light}`,
            position: 'relative',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            minWidth: '140px',
            height: '32px',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
          onClick={disabled ? undefined : handleToggle}
        >
          {webToggleContent}
        </div>
      );
    }

    return (
      <TouchableOpacity
        style={StyleSheet.flatten([
          styles.toggle,
          disabled && styles.toggleDisabled,
        ])}
        onPress={handleToggle}
        disabled={disabled}
      >
        {toggleContent}
      </TouchableOpacity>
    );
  };

  // Web 平台需要特殊處理容器
  if (Platform.OS === 'web') {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '4px'
      }}>
        {renderToggleButton()}
        
        {/* 模式說明提示 */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: '4px',
          paddingLeft: '8px',
          paddingRight: '8px'
        }}>
          <span style={{ 
            fontSize: '14px',
            color: DesignSystem.colors.text.tertiary,
            marginLeft: '4px',
            maxWidth: '200px'
          }}>
            {mode === 'simple' 
              ? '簡易模式：快速匯入，自動映射欄位'
              : '進階模式：多檔案合併、手動調整映射、批量編輯'
            }
          </span>
        </div>
      </div>
    );
  }
  
  return (
    <View style={styles.container}>
      {renderToggleButton()}
      
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
    alignItems: 'flex-end' },
  toggle: {
    flexDirection: 'row',
    backgroundColor: DesignSystem.colors.background.surface,
    borderRadius: DesignSystem.borderRadius.full,
    padding: 2,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.light,
    position: 'relative' },
  toggleDisabled: {
    opacity: 0.5 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.xs,
    zIndex: 2 },
  optionActive: {
    // Active styles handled by text and icon colors
  },
  optionText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    marginLeft: DesignSystem.spacing.xs },
  optionTextActive: {
    color: DesignSystem.colors.primary,
    fontWeight: '600' },
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
        ...(Platform.OS === 'web' ? {} : { ...(Platform.OS === 'web' ? {} : { shadowOffset: { width: 0, height: 1 } }) }),
        shadowOpacity: 0.1,
        shadowRadius: 2 },
      android: {
        ...(Platform.OS === 'web' ? {} : { elevation: 2 }) },
      web: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)' } as any }),
    transition: Platform.OS === 'web' ? 'transform 0.2s ease' : undefined } as any,
  sliderActive: {
    transform: Platform.OS === 'web' ? `translateX(${Platform.OS === 'web' ? 'calc(100% - 4px)' : 80}px)` : [{ translateX: Platform.OS === 'web' ? 'calc(100% - 4px)' : 80 }] as any },
  tooltip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: DesignSystem.spacing.xs,
    paddingHorizontal: DesignSystem.spacing.sm },
  tooltipText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.tertiary,
    marginLeft: DesignSystem.spacing.xxs,
    maxWidth: 200 } });

export default UserImportModeToggle;