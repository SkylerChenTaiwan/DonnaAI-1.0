/**
 * 人事管理頁面標籤切換元件
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated } from 'react-native';
// Icon import removed - using platform-specific Icon component;
import { Icon } from '@/components/common/Icon';
import { DesignSystem } from '@/theme/designSystem';

interface Tab {
  id: 'tree' | 'table';
  title: string;
  icon: string;
}

interface PersonnelTabsProps {
  activeView: 'tree' | 'table';
  onViewChange: (view: 'tree' | 'table') => void;
}

export function PersonnelTabs({ activeView, onViewChange }: PersonnelTabsProps) {
  const tabs: Tab[] = [
    { id: 'tree', title: '組織圖', icon: 'git-branch-outline' },
    { id: 'table', title: '表格', icon: 'grid-outline' },
  ];

  return (
    <View style={styles.tabContainer}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={StyleSheet.flatten([
            styles.tab,
            activeView === tab.id && styles.activeTab,
          ])}
          onPress={() => onViewChange(tab.id)}
          activeOpacity={0.7}
        >
          <Icon
            name={tab.icon}
            size={20}
            color={activeView === tab.id ? DesignSystem.colors.text.primary : DesignSystem.colors.text.secondary}
          />
          <Text
            style={StyleSheet.flatten([
              styles.tabText,
              activeView === tab.id && styles.activeTabText,
            ])}
            numberOfLines={1}
          >
            {tab.title}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: DesignSystem.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: 14,
    gap: 8 },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: DesignSystem.colors.text.primary },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: DesignSystem.colors.text.secondary },
  activeTabText: {
    color: DesignSystem.colors.text.primary,
    fontWeight: '600' } });