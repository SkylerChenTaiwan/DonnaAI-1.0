/**
 * 設定區塊元件
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SettingItem } from './SettingItem';
import { SettingSection as SettingSectionType } from '@/types/settings';

interface SettingSectionProps extends SettingSectionType {
  onItemValueChange?: (itemId: string, value: any) => void;
}

export const SettingSection: React.FC<SettingSectionProps> = ({
  title,
  items,
  onItemValueChange,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.itemsContainer}>
        {items.map((item, index) => (
          <SettingItem
            key={item.id}
            {...item}
            onValueChange={(value) => onItemValueChange?.(item.id, value)}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  itemsContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
});