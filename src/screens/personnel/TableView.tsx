/**
 * 人事管理表格檢視
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TeamMember } from './PersonnelScreen';
import { DesignSystem } from '@/theme/DesignSystem';

interface TableViewProps {
  teamMembers: TeamMember[];
  searchQuery: string;
  refreshing: boolean;
  onRefresh: () => void;
}

export function TableView({ 
  teamMembers, 
  searchQuery, 
  refreshing, 
  onRefresh 
}: TableViewProps) {
  // 過濾成員
  const filteredMembers = teamMembers.filter((member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 狀態顏色
  const getStatusColor = (status: TeamMember['status']) => {
    switch (status) {
      case 'active':
        return '#34C759';
      case 'inactive':
        return '#8E8E93';
      case 'on_leave':
        return '#FF9500';
      default:
        return '#8E8E93';
    }
  };

  // 狀態文字
  const getStatusText = (status: TeamMember['status']) => {
    switch (status) {
      case 'active':
        return '在職';
      case 'inactive':
        return '離職';
      case 'on_leave':
        return '請假';
      default:
        return '未知';
    }
  };

  // 角色文字
  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin':
        return '管理員';
      case 'manager':
        return '主管';
      case 'salesperson':
        return '業務';
      default:
        return role;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* 統計資訊 */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{teamMembers.length}</Text>
          <Text style={styles.statLabel}>總人數</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#34C759' }]}>
            {teamMembers.filter(m => m.status === 'active').length}
          </Text>
          <Text style={styles.statLabel}>在職</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#FF9500' }]}>
            {teamMembers.filter(m => m.status === 'on_leave').length}
          </Text>
          <Text style={styles.statLabel}>請假</Text>
        </View>
      </View>

      {/* 成員列表 */}
      <View style={styles.membersList}>
        {filteredMembers.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>沒有找到成員</Text>
            <Text style={styles.emptyDescription}>
              {searchQuery ? '請嘗試其他搜尋條件' : '目前沒有團隊成員'}
            </Text>
          </View>
        ) : (
          filteredMembers.map((member) => (
            <TouchableOpacity
              key={member.id}
              style={styles.memberCard}
              activeOpacity={0.7}
              onPress={() => {
                // TODO: 導航到成員詳情頁
                console.log('查看成員詳情:', member.id);
              }}
            >
              <View style={styles.memberHeader}>
                <View style={styles.memberInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(member.status) },
                      ]}
                    >
                      <Text style={styles.statusText}>
                        {getStatusText(member.status)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.memberRole}>{getRoleText(member.role)}</Text>
                  <Text style={styles.memberEmail}>{member.email}</Text>
                </View>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    // TODO: 顯示快速操作選單
                    console.log('快速操作:', member.id);
                  }}
                >
                  <Ionicons name="ellipsis-vertical" size={20} color="#8E8E93" />
                </TouchableOpacity>
              </View>

              {/* 績效指標 */}
              <View style={styles.performanceRow}>
                <View style={styles.performanceItem}>
                  <Ionicons name="calendar-outline" size={16} color="#8E8E93" />
                  <Text style={styles.performanceText}>
                    {member.performance?.meetings || 0} 會議
                  </Text>
                </View>
                <View style={styles.performanceItem}>
                  <Ionicons name="people-outline" size={16} color="#8E8E93" />
                  <Text style={styles.performanceText}>
                    {member.performance?.customers || 0} 客戶
                  </Text>
                </View>
                <View style={styles.performanceItem}>
                  <Ionicons name="trophy-outline" size={16} color="#8E8E93" />
                  <Text style={styles.performanceText}>
                    {member.performance?.deals || 0} 成交
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background,
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
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: DesignSystem.colors.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: DesignSystem.colors.text.secondary,
  },
  membersList: {
    padding: 16,
  },
  memberCard: {
    backgroundColor: DesignSystem.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  memberInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  memberName: {
    fontSize: 18,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  memberRole: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 14,
    color: DesignSystem.colors.text.secondary,
  },
  actionButton: {
    padding: 8,
  },
  performanceRow: {
    flexDirection: 'row',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: DesignSystem.colors.border.light,
    gap: 16,
  },
  performanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  performanceText: {
    fontSize: 12,
    color: DesignSystem.colors.text.secondary,
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: DesignSystem.colors.text.secondary,
    textAlign: 'center',
  },
});