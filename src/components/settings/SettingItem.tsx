/**
 * 設定項目元件
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet } from 'react-native';
import { Icon } from '@/components/common/Icon';
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
  onValueChange }: SettingItemProps) => {
  const renderRight = () => {
    switch (type) {
      case 'switch':
        return (
          <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{
              false: '#E3E1DC',
              true: '#1A1A1A' }}
            thumbColor="#F7F6F3"
          />
        );
      case 'select':
        return (
          <View style={styles.selectContainer}>
            <Text style={styles.selectValue}>{value || '未選擇'}</Text>
            <Icon name="chevron-forward" size={16} color="#BEBEBE" />
          </View>
        );
      case 'navigation':
        return <Icon name="chevron-forward" size={20} color="#BEBEBE" />;
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
            <Icon name={icon as any} size={20} color="#1A1A1A" />
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
    borderBottomColor: '#E1DFDB' },
  leftContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center' },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12 },
  textContainer: {
    flex: 1 },
  title: {
    fontSize: 16,
    color: '#1A1A1A' },
  subtitle: {
    fontSize: 14,
    color: '#7A7A7A',
    marginTop: 2 },
  selectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4 },
  selectValue: {
    fontSize: 14,
    color: '#7A7A7A' } });