/**
 * 人事管理樹狀圖檢視
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TeamMember } from './PersonnelScreen';
import { DesignSystem } from '@/theme/DesignSystem';

interface TreeViewProps {
  teamMembers: TeamMember[];
  searchQuery: string;
  refreshing: boolean;
  onRefresh: () => void;
}

export function TreeView({ 
  teamMembers, 
  searchQuery, 
  refreshing, 
  onRefresh 
}: TreeViewProps) {
  // TODO: 實作樹狀圖檢視
  // 目前先顯示占位內容
  
  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.placeholder}>
        <Ionicons name="git-branch-outline" size={64} color={DesignSystem.colors.text.tertiary} />
        <Text style={styles.placeholderTitle}>組織圖檢視</Text>
        <Text style={styles.placeholderText}>
          樹狀圖功能即將推出
        </Text>
        <Text style={styles.placeholderDescription}>
          將顯示組織架構、報告關係和拖放管理功能
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
    paddingHorizontal: 40,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
    marginTop: 20,
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 16,
    color: DesignSystem.colors.text.secondary,
    marginBottom: 8,
  },
  placeholderDescription: {
    fontSize: 14,
    color: DesignSystem.colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
});