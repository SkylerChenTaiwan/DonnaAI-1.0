/**
 * 麵包屑導航組件
 * 提供清晰的位置指示和快速返回功能
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Icon } from '@/components/common/Icon';
import { DesignSystem } from '@/theme/designSystem';

export interface BreadcrumbItem {
  id: string;
  label: string;
  onPress?: () => void;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  style?: any;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, style }) => {
  if (items.length === 0) return null;
  
  return (
    <View style={[styles.container, style]}>
      {items.map((item, index) => (
        <View key={item.id} style={styles.item}>
          {index > 0 && (
            <Icon 
              name="chevron-forward" 
              size={16} 
              color={DesignSystem.colors.gray500} 
              style={styles.separator}
            />
          )}
          {item.onPress ? (
            <TouchableOpacity 
              onPress={item.onPress}
              activeOpacity={0.7}
              style={styles.linkButton}
            >
              <Text style={[
                styles.text,
                styles.link,
                Platform.OS === 'web' && styles.webLink
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={[styles.text, styles.current]}>
              {item.label}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    backgroundColor: DesignSystem.colors.background.surface,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light },
  item: {
    flexDirection: 'row',
    alignItems: 'center' },
  separator: {
    marginHorizontal: DesignSystem.spacing.xs },
  linkButton: {
    padding: DesignSystem.spacing.xs },
  text: {
    ...DesignSystem.typography.body },
  link: {
    color: DesignSystem.colors.primary },
  webLink: {
    cursor: 'pointer' as any,
    textDecorationLine: 'underline' },
  current: {
    color: DesignSystem.colors.text.primary,
    fontWeight: '600' } });

export default Breadcrumbs;