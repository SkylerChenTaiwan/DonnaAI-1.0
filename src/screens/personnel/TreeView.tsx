/**
 * 人事管理樹狀圖檢視 - 包含效能優化
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ScrollView,
  ActivityIndicator, Platform } from 'react-native';
import { OrgChart } from '@/components/personnel/OrgChart';
import { OrgNode } from '@/types/organization';
import { TeamMember } from './PersonnelScreen';
import { DesignSystem } from '@/theme/designSystem';
import { Icon } from '@/components/common/Icon';

interface TreeViewProps {
  teamMembers: TeamMember[];
  searchQuery: string;
  refreshing: boolean;
  onRefresh: () => void;
}

// 效能優化常數
const INITIAL_LOAD_COUNT = 50; // 初始載入節點數
const BATCH_SIZE = 20; // 每次載入的批次大小
const RENDER_DELAY = 100; // 渲染延遲（毫秒）

export function TreeView({ 
  teamMembers, 
  searchQuery, 
  refreshing, 
  onRefresh 
}: TreeViewProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [visibleNodeCount, setVisibleNodeCount] = useState(INITIAL_LOAD_COUNT);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // 效能優化：篩選後的成員列表
  const filteredMembers = useMemo(() => {
    if (!searchQuery) return teamMembers;
    
    const query = searchQuery.toLowerCase();
    return teamMembers.filter(member =>
      member.name.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query) ||
      member.teams.some(team => team.toLowerCase().includes(query))
    );
  }, [teamMembers, searchQuery]);
  
  // 效能優化：虛擬化的成員列表
  const virtualizedMembers = useMemo(() => {
    return filteredMembers.slice(0, visibleNodeCount);
  }, [filteredMembers, visibleNodeCount]);
  
  // 效能優化：延遲載入更多節點
  const loadMoreNodes = useCallback(() => {
    if (isLoadingMore || visibleNodeCount >= filteredMembers.length) return;
    
    setIsLoadingMore(true);
    
    // 模擬延遲以改善效能
    setTimeout(() => {
      setVisibleNodeCount(prev => 
        Math.min(prev + BATCH_SIZE, filteredMembers.length)
      );
      setIsLoadingMore(false);
    }, RENDER_DELAY);
  }, [isLoadingMore, visibleNodeCount, filteredMembers.length]);
  
  // 重置可見節點數當搜尋改變時
  useEffect(() => {
    setVisibleNodeCount(INITIAL_LOAD_COUNT);
  }, [searchQuery]);
  
  // 處理節點點擊
  const handleNodePress = useCallback((node: OrgNode) => {
    console.log('點擊節點:', node.user.name);
    // TODO: 導航到成員詳情頁
  }, []);
  
  // 處理節點展開/收合
  const handleNodeExpand = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(nodeId)) {
        newExpanded.delete(nodeId);
      } else {
        newExpanded.add(nodeId);
      }
      return newExpanded;
    });
  }, []);
  
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
        <Icon name="git-branch-outline" size={64} color={DesignSystem.colors.text.tertiary} />
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
          <Icon name="business" size={20} color="#007AFF" />
          <Text style={styles.statValue}>
            {filteredMembers.filter(m => m.role === 'admin').length}
          </Text>
          <Text style={styles.statLabel}>管理層</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="people" size={20} color="#34C759" />
          <Text style={styles.statValue}>
            {filteredMembers.filter(m => m.role === 'manager').length}
          </Text>
          <Text style={styles.statLabel}>主管</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="person" size={20} color="#FF9500" />
          <Text style={styles.statValue}>
            {filteredMembers.filter(m => m.role === 'salesperson').length}
          </Text>
          <Text style={styles.statLabel}>業務</Text>
        </View>
      </View>
      
      {/* 組織圖 */}
      <View style={styles.chartContainer}>
        <OrgChart
          teamMembers={virtualizedMembers}
          searchQuery={searchQuery}
          onNodePress={handleNodePress}
          onNodeExpand={handleNodeExpand}
          draggable={true}
          onScroll={loadMoreNodes}
        />
        
        {/* 載入更多指示器 */}
        {visibleNodeCount < filteredMembers.length && (
          <View style={styles.loadMoreContainer}>
            {isLoadingMore ? (
              <ActivityIndicator size="small" color={DesignSystem.colors.primary} />
            ) : (
              <Text style={styles.loadMoreText}>
                顯示 {visibleNodeCount} / {filteredMembers.length} 個成員
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
    marginTop: 16,
    marginBottom: 8 },
  emptyText: {
    fontSize: 14,
    color: DesignSystem.colors.text.secondary },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: DesignSystem.colors.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    ...(Platform.OS === 'web' ? {} : { ...(Platform.OS === 'web' ? {} : { shadowOffset: { width: 0, height: 1 } }) }),
    shadowOpacity: 0.05,
    shadowRadius: 2,
    ...(Platform.OS === 'web' ? {} : { elevation: 1 }),
    gap: 4 },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: DesignSystem.colors.text.primary },
  statLabel: {
    fontSize: 12,
    color: DesignSystem.colors.text.secondary },
  chartContainer: {
    flex: 1,
    backgroundColor: DesignSystem.colors.surface,
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    ...(Platform.OS === 'web' ? {} : { ...(Platform.OS === 'web' ? {} : { shadowOffset: { width: 0, height: 2 } }) }),
    shadowOpacity: 0.05,
    shadowRadius: 4,
    ...(Platform.OS === 'web' ? {} : { elevation: 2 }) },
  loadMoreContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: 'center' },
  loadMoreText: {
    fontSize: 12,
    color: DesignSystem.colors.text.secondary,
    backgroundColor: DesignSystem.colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    ...(Platform.OS === 'web' ? {} : { ...(Platform.OS === 'web' ? {} : { shadowOffset: { width: 0, height: 1 } }) }),
    shadowOpacity: 0.1,
    shadowRadius: 2,
    ...(Platform.OS === 'web' ? {} : { elevation: 1 }) } });