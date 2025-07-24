/**
 * 人事管理樹狀圖檢視
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { OrgChart } from '@/components/personnel/OrgChart';
import { OrgNode } from '@/types/organization';
import { TeamMember } from './PersonnelScreen';
import { DesignSystem } from '@/theme/DesignSystem';
import { Ionicons } from '@expo/vector-icons';

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
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  
  // 處理節點點擊
  const handleNodePress = (node: OrgNode) => {
    console.log('點擊節點:', node.user.name);
    // TODO: 導航到成員詳情頁
  };
  
  // 處理節點展開/收合
  const handleNodeExpand = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };
  
  // 檢查是否有資料
  if (teamMembers.length === 0) {
    return (
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.emptyContainer}
      >
        <Ionicons name="git-branch-outline" size={64} color={DesignSystem.colors.text.tertiary} />
        <Text style={styles.emptyTitle}>沒有組織資料</Text>
        <Text style={styles.emptyText}>
          目前沒有團隊成員資料
        </Text>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      {/* 統計資訊卡片 */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="business" size={20} color="#007AFF" />
          <Text style={styles.statValue}>
            {teamMembers.filter(m => m.role === 'admin').length}
          </Text>
          <Text style={styles.statLabel}>管理層</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="people" size={20} color="#34C759" />
          <Text style={styles.statValue}>
            {teamMembers.filter(m => m.role === 'manager').length}
          </Text>
          <Text style={styles.statLabel}>主管</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="person" size={20} color="#FF9500" />
          <Text style={styles.statValue}>
            {teamMembers.filter(m => m.role === 'salesperson').length}
          </Text>
          <Text style={styles.statLabel}>業務</Text>
        </View>
      </View>
      
      {/* 組織圖 */}
      <View style={styles.chartContainer}>
        <OrgChart
          teamMembers={teamMembers}
          searchQuery={searchQuery}
          onNodePress={handleNodePress}
          onNodeExpand={handleNodeExpand}
          draggable={true}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: DesignSystem.colors.text.secondary,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: DesignSystem.colors.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: DesignSystem.colors.text.primary,
  },
  statLabel: {
    fontSize: 12,
    color: DesignSystem.colors.text.secondary,
  },
  chartContainer: {
    flex: 1,
    backgroundColor: DesignSystem.colors.surface,
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
});