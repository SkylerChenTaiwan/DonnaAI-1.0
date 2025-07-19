/**
 * 設定項目元件
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SettingItem as SettingItemType } from '@/types/settings';

interface SettingItemProps extends SettingItemType {
  onValueChange?: (value: any) => void;
}

export const SettingItem = ({
  title,
  subtitle,
  type,
  value,
  action,
  icon,
  onValueChange,
}: SettingItemProps) => {
  const renderRight = () => {
    switch (type) {
      case 'switch':
        return (
          <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{
              false: '#E5E5EA',
              true: '#007AFF',
            }}
            thumbColor="#FFFFFF"
          />
        );
      case 'select':
        return (
          <View style={styles.selectContainer}>
            <Text style={styles.selectValue}>{value || '未選擇'}</Text>
            <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
          </View>
        );
      case 'navigation':
        return <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />;
      case 'action':
        return null;
      default:
        return null;
    }
  };

  const handlePress = () => {
    if (type === 'switch') return;
    if (action) action();
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={type === 'switch' ? 1 : 0.7}
      disabled={type === 'switch'}
    >
      <View style={styles.leftContent}>
        {icon && (
          <View style={styles.iconContainer}>
            <Ionicons name={icon as any} size={20} color="#007AFF" />
          </View>
        )}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
      {renderRight()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  leftContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  selectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  selectValue: {
    fontSize: 14,
    color: '#8E8E93',
  },
});