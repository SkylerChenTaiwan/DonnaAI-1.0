/**
 * 用戶管理頁面（Enterprise Admin）
 * 管理組織內的用戶
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Layout } from '@/components/common/Layout';
import { SearchBar } from '@/components/common/SearchBar';
import { ToolbarIcons } from '@/components/common/ToolbarIcons';
import { DataTable } from '@/components/common/DataTable';
import { FilterModal } from '@/components/common/FilterModal';
import { FilterBadge, FilterCondition } from '@/components/common/FilterBadge';
import { StatusIndicator } from '@/components/personnel/StatusIndicator';
import { PermissionBadge } from '@/components/personnel/PermissionBadge';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/stores/authStore';
import { useAdminStore } from '@/stores/adminStore';
import { showToast } from '@/utils/toast';
import { DesignSystem } from '@/theme/designSystem';
import { TableColumn } from '@/types/table';
import { EnhancedUser } from '@/types/personnel';
import { User } from '@/types/firebase';

export const UserManagementScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user: currentUser } = useAuthStore();
  const { users, loading, refreshUsers } = useAdminStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterCondition[]>([]);
  
  // 載入用戶資料
  useEffect(() => {
    refreshUsers();
  }, []);
  
  // 處理刷新
  const onRefresh = async () => {
    setRefreshing(true);
    await refreshUsers();
    setRefreshing(false);
  };
  
  // 轉換用戶資料為表格格式
  const tableData: Partial<EnhancedUser>[] = useMemo(() => {
    return users.map(user => ({
      id: user.id,
      name: user.name || '未設定',
      email: user.email,
      role: user.role,
      status: user.isActive ? 'active' : 'inactive',
      department: user.department,
      joinDate: user.createdAt,
      lastActive: user.lastLoginAt,
      isOnline: false, // 暫時設為離線
      permissions: {
        modules: [],
        actions: [],
        dataAccess: user.role === 'super_admin' ? 'organization' : 
                   user.role === 'admin' ? 'organization' :
                   user.role === 'manager' ? 'team' : 'own',
      },
    }));
  }, [users]);
  
  // 過濾用戶
  const filteredUsers = useMemo(() => {
    let filtered = tableData;
    
    // 搜尋過濾
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.role?.toLowerCase().includes(query)
      );
    }
    
    // 應用篩選條件
    activeFilters.forEach(filter => {
      if (filter.key === 'status' && filter.value) {
        filtered = filtered.filter(user => user.status === filter.value);
      }
      if (filter.key === 'role' && filter.value) {
        filtered = filtered.filter(user => user.role === filter.value);
      }
    });
    
    return filtered;
  }, [tableData, searchQuery, activeFilters]);
  
  // 定義表格欄位
  const columns: TableColumn[] = [
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
      key: 'lastActive',
      title: '最後登入',
      sortable: true,
      render: (value) => {
        if (!value) return '從未登入';
        const date = new Date(value);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return '今天';
        if (diffDays === 1) return '昨天';
        if (diffDays < 7) return `${diffDays}天前`;
        return date.toLocaleDateString('zh-TW');
      },
    },
    {
      key: 'joinDate',
      title: '加入日期',
      sortable: true,
      render: (value) => value ? new Date(value).toLocaleDateString('zh-TW') : '-',
    },
  ];
  
  // 處理行點擊
  const handleRowPress = (user: any) => {
    // TODO: 導航到用戶詳情或編輯頁面
    console.log('查看用戶詳情:', user.id);
  };
  
  // 處理批量操作
  const handleBatchAction = (action: 'enable' | 'disable' | 'delete') => {
    if (selectedIds.length === 0) return;
    
    const actionText = action === 'enable' ? '啟用' : 
                      action === 'disable' ? '停用' : '刪除';
    
    Alert.alert(
      `確認${actionText}`,
      `確定要${actionText} ${selectedIds.length} 個用戶嗎？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '確定',
          style: action === 'delete' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              // TODO: 實作批量操作 API
              showToast('success', `已${actionText} ${selectedIds.length} 個用戶`);
              setSelectedIds([]);
              setMultiSelectMode(false);
              await refreshUsers();
            } catch (error) {
              showToast('error', `${actionText}失敗`);
            }
          },
        },
      ]
    );
  };
  
  // 處理新增用戶
  const handleAddUser = () => {
    // TODO: 導航到新增用戶頁面
    console.log('新增用戶');
  };
  
  if (loading && users.length === 0) {
    return (
      <Layout>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={DesignSystem.colors.primary} />
          <Text style={styles.loadingText}>載入用戶資料...</Text>
        </View>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <View style={styles.container}>
        {/* 頁面標題 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={DesignSystem.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>用戶管理</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddUser}
          >
            <Ionicons name="add" size={24} color={DesignSystem.colors.primary} />
          </TouchableOpacity>
        </View>
        
        {/* 工具列 */}
        <View style={styles.toolbar}>
          <View style={styles.searchWrapper}>
            <SearchBar
              placeholder="搜尋姓名、電子郵件或角色..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchBar}
            />
          </View>
          <View style={styles.toolbarButtons}>
            <ToolbarIcons
              multiSelectMode={multiSelectMode}
              showSort={false}
              showFilter={true}
              showMultiSelect={true}
              showColumns={false}
              showModeToggle={false}
              onFilterPress={() => setShowFilterModal(true)}
              onMultiSelectPress={() => {
                setMultiSelectMode(!multiSelectMode);
                if (!multiSelectMode) {
                  setSelectedIds([]);
                }
              }}
            />
          </View>
        </View>
        
        {/* 篩選條件顯示 */}
        <FilterBadge
          filters={activeFilters}
          onRemoveFilter={(key: string) => {
            setActiveFilters(prev => prev.filter(f => f.key !== key));
          }}
          onClearAll={() => setActiveFilters([])}
        />
        
        {/* 統計資訊 */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{users.length}</Text>
            <Text style={styles.statLabel}>總用戶數</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {users.filter(u => u.isActive).length}
            </Text>
            <Text style={styles.statLabel}>活躍用戶</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {users.filter(u => u.role === 'admin').length}
            </Text>
            <Text style={styles.statLabel}>管理員</Text>
          </View>
        </View>
        
        {/* 表格區域 */}
        <View style={styles.tableContainer}>
          <DataTable
            data={filteredUsers}
            columns={columns}
            searchable={false}
            selectable={true}
            showCheckboxes={multiSelectMode}
            onSelect={setSelectedIds}
            onRowPress={handleRowPress}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        </View>
        
        {/* 批量操作工具列 */}
        {selectedIds.length > 0 && (
          <View style={styles.batchActions}>
            <Text style={styles.selectedCount}>
              已選擇 {selectedIds.length} 個用戶
            </Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.enableButton]}
                onPress={() => handleBatchAction('enable')}
              >
                <Text style={styles.actionButtonText}>啟用</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.disableButton]}
                onPress={() => handleBatchAction('disable')}
              >
                <Text style={styles.actionButtonText}>停用</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleBatchAction('delete')}
              >
                <Text style={styles.deleteButtonText}>刪除</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
      
      {/* 篩選 Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={(filters) => {
          setActiveFilters(filters);
          setShowFilterModal(false);
        }}
        filters={activeFilters}
        columns={[
          { key: 'status', title: '狀態' },
          { key: 'role', title: '角色' },
        ]}
        tabType="users"
      />
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: DesignSystem.colors.text.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignSystem.spacing.lg,
    backgroundColor: DesignSystem.colors.background.surface,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light,
  },
  backButton: {
    marginRight: DesignSystem.spacing.md,
  },
  title: {
    ...DesignSystem.typography.h1,
    color: DesignSystem.colors.text.primary,
    flex: 1,
  },
  addButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: DesignSystem.colors.background.elevated,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: DesignSystem.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light,
    gap: 12,
  },
  searchWrapper: {
    flex: 1,
  },
  searchBar: {
    flex: 1,
  },
  toolbarButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: DesignSystem.colors.background.elevated,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
  },
  statLabel: {
    fontSize: 12,
    color: DesignSystem.colors.text.secondary,
    marginTop: 4,
  },
  tableContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
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
    borderRadius: 8,
  },
  enableButton: {
    backgroundColor: DesignSystem.colors.success,
  },
  disableButton: {
    backgroundColor: DesignSystem.colors.warning,
  },
  deleteButton: {
    backgroundColor: DesignSystem.colors.error,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});