/**
 * 工具卡片元件
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image, Platform } from 'react-native';
// Icon import removed - using platform-specific Icon component;
import { Icon } from '@/components/common/Icon';

interface ToolCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  color?: string;
  onPress: () => void;
}

export const ToolCard = ({
  id,
  title,
  description,
  icon,
  color = '#1A1A1A',
  onPress }: ToolCardProps) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={StyleSheet.flatten([styles.iconContainer, { backgroundColor: `${color}15` }])}>
        <Icon name={icon} size={40} color={color} />
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.description} numberOfLines={2}>
        {description}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    ...(Platform.OS === 'web' ? {} : { ...(Platform.OS === 'web' ? {} : { shadowOffset: { width: 0, height: 1 } }) }),
    shadowOpacity: 0.05,
    shadowRadius: 2,
    ...(Platform.OS === 'web' ? {} : { elevation: 2 }),
    minHeight: 160 },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12 },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
    textAlign: 'center' },
  description: {
    fontSize: 14,
    color: '#7A7A7A',
    textAlign: 'center',
    lineHeight: 18 } });