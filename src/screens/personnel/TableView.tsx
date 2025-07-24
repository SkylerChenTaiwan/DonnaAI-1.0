/**
 * 人事管理表格檢視
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { DataTable } from '@/components/common/DataTable';
import { StatusIndicator } from '@/components/personnel/StatusIndicator';
import { PermissionBadge } from '@/components/personnel/PermissionBadge';
import { TeamMember } from './PersonnelScreen';
import { DesignSystem } from '@/theme/DesignSystem';
import { TableColumn } from '@/types/table';
import { EnhancedUser } from '@/types/personnel';

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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // 將 TeamMember 轉換為 EnhancedUser 格式
  const enhancedMembers: Partial<EnhancedUser>[] = useMemo(() => {
    return teamMembers.map(member => ({
      ...member,
      isOnline: member.status === 'active' && member.lastActive && 
        (new Date().getTime() - member.lastActive.getTime()) < 15 * 60 * 1000, // 15分鐘內活躍
      lastActiveAt: member.lastActive,
      permissions: {
        modules: [],
        actions: [],
        dataAccess: member.role === 'admin' ? 'organization' : 
                   member.role === 'manager' ? 'team' : 'own',
      },
      subordinates: member.role === 'manager' ? [] : undefined,
    }));
  }, [teamMembers]);

  // 定義表格欄位
  const columns: TableColumn[] = useMemo(() => [
    {
      key: 'name',
      title: '姓名',
      sortable: true,
      render: (value, item) => (
        <View style={styles.nameCell}>
          <Text style={styles.nameText}>{value}</Text>
          <Text style={styles.emailText}>{item.email}</Text>
        </View>
      ),
    },
    {
      key: 'status',
      title: '狀態',
      width: 100,
      render: (value, item) => (
        <StatusIndicator user={item} size="small" />
      ),
    },
    {
      key: 'role',
      title: '角色權限',
      width: 150,
      render: (value, item) => (
        <PermissionBadge user={item} />
      ),
    },
    {
      key: 'department',
      title: '部門',
      sortable: true,
      render: (value) => value || '未設定',
    },
    {
      key: 'performance',
      title: '績效指標',
      width: 200,
      render: (value) => (
        <View style={styles.performanceCell}>
          <View style={styles.performanceItem}>
            <Text style={styles.performanceValue}>{value?.meetings || 0}</Text>
            <Text style={styles.performanceLabel}>會議</Text>
          </View>
          <View style={styles.performanceItem}>
            <Text style={styles.performanceValue}>{value?.customers || 0}</Text>
            <Text style={styles.performanceLabel}>客戶</Text>
          </View>
          <View style={styles.performanceItem}>
            <Text style={styles.performanceValue}>{value?.deals || 0}</Text>
            <Text style={styles.performanceLabel}>成交</Text>
          </View>
        </View>
      ),
    },
    {
      key: 'joinDate',
      title: '入職日期',
      sortable: true,
      render: (value) => value ? new Date(value).toLocaleDateString('zh-TW') : '-',
    },
  ], []);

  // 處理行點擊
  const handleRowPress = (item: any) => {
    console.log('查看成員詳情:', item.id);
    // TODO: 導航到成員詳情頁
  };

  // 處理選擇變更
  const handleSelectionChange = (ids: string[]) => {
    setSelectedIds(ids);
    console.log('選擇的成員:', ids);
  };

  return (
    <View style={styles.container}>
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
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#007AFF' }]}>
            {enhancedMembers.filter(m => m.isOnline).length}
          </Text>
          <Text style={styles.statLabel}>線上</Text>
        </View>
      </View>

      {/* 表格區域 */}
      <View style={styles.tableContainer}>
        <DataTable
          data={enhancedMembers}
          columns={columns}
          searchable={false} // 搜尋功能已在上層實作
          selectable={true}
          showCheckboxes={true}
          onSelect={handleSelectionChange}
          onRowPress={handleRowPress}
          refreshing={refreshing}
          onRefresh={onRefresh}
          filters={searchQuery ? [
            { key: 'search', value: searchQuery }
          ] : undefined}
        />
      </View>

      {/* 批次操作工具列 */}
      {selectedIds.length > 0 && (
        <View style={styles.batchActions}>
          <Text style={styles.selectedCount}>
            已選擇 {selectedIds.length} 位成員
          </Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>匯出</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>設定權限</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
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
  tableContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  // 表格內容樣式
  nameCell: {
    paddingVertical: 4,
  },
  nameText: {
    fontSize: 14,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
    marginBottom: 2,
  },
  emailText: {
    fontSize: 12,
    color: DesignSystem.colors.text.secondary,
  },
  performanceCell: {
    flexDirection: 'row',
    gap: 16,
  },
  performanceItem: {
    alignItems: 'center',
  },
  performanceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
  },
  performanceLabel: {
    fontSize: 10,
    color: DesignSystem.colors.text.tertiary,
    marginTop: 2,
  },
  // 批次操作工具列
  batchActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: DesignSystem.colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: DesignSystem.colors.border.light,
  },
  selectedCount: {
    fontSize: 14,
    color: DesignSystem.colors.text.secondary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: DesignSystem.colors.primary,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});