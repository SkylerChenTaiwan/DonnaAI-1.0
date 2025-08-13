/**
 * 人員狀態指示器元件
 */

import React from 'react';
import { View, Text, StyleSheet , Platform } from 'react-native';
import { Icon } from '@/components/common/Icon';
import { DesignSystem } from '@/theme/designSystem';
import { EnhancedUser } from '@/types/personnel';

interface StatusIndicatorProps {
  user: Partial<EnhancedUser>;
  size?: 'small' | 'medium' | 'large';
  showLastActive?: boolean;
}

export function StatusIndicator({ 
  user, 
  size = 'medium',
  showLastActive = false 
}: StatusIndicatorProps) {
  const isOnline = user.isOnline || false;
  
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { dotSize: 8, fontSize: 10, iconSize: 12 };
      case 'medium':
        return { dotSize: 10, fontSize: 12, iconSize: 16 };
      case 'large':
        return { dotSize: 12, fontSize: 14, iconSize: 20 };
    }
  };

  const sizeStyles = getSizeStyles();

  const formatLastActive = (date?: Date) => {
    if (!date) return '從未上線';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return '剛剛';
    if (minutes < 60) return `${minutes} 分鐘前`;
    if (hours < 24) return `${hours} 小時前`;
    if (days < 7) return `${days} 天前`;
    
    return date.toLocaleDateString('zh-TW');
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <View 
          style={StyleSheet.flatten([
            styles.statusDot,
            { 
              width: sizeStyles.dotSize, 
              height: sizeStyles.dotSize,
              backgroundColor: isOnline ? '#34C759' : '#8E8E93'
            }
          ])} 
        />
        <Text style={StyleSheet.flatten([styles.statusText, { fontSize: sizeStyles.fontSize }])}>
          {isOnline ? '線上' : '離線'}
        </Text>
      </View>
      
      {showLastActive && user.lastActiveAt && (
        <View style={styles.lastActiveRow}>
          <Icon 
            name="time-outline" 
            size={sizeStyles.iconSize} 
            color={DesignSystem.colors.text.tertiary} 
          />
          <Text style={StyleSheet.flatten([styles.lastActiveText, { fontSize: sizeStyles.fontSize }])}>
            {formatLastActive(user.lastActiveAt)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: 4 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6 },
  statusDot: {
    borderRadius: 10,
    shadowColor: '#000',
    ...(Platform.OS === 'web' ? {} : { ...(Platform.OS === 'web' ? {} : { shadowOffset: { width: 0, height: 1 } }) }),
    shadowOpacity: 0.1,
    shadowRadius: 1,
    ...(Platform.OS === 'web' ? {} : { elevation: 1 }) },
  statusText: {
    fontWeight: '500',
    color: DesignSystem.colors.text.secondary },
  lastActiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4 },
  lastActiveText: {
    color: DesignSystem.colors.text.tertiary } });