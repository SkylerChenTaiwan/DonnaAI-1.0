/**
 * 增強版首頁（含模式切換）
 * 簡化版 - 專注於任務管理和客戶互動
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { Layout } from '@/components/common/Layout';
import { ModeToggle } from '@/components/common/ModeToggle';
import { TaskListSection } from '@/components/dashboard/TaskListSection';
import { RecentCustomersSection } from '@/components/dashboard/RecentCustomersSection';
import { useAuthStore } from '@/stores/authStore';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';

export const EnhancedDashboard: React.FC = () => {
  const { user: authUser } = useAuth();
  const { currentOrganization, currentTeam, loading: orgLoading } = useOrganization();
  const { user, mode, toggleMode } = useAuthStore();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // 重新整理會由子組件各自處理
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  // 如果正在載入組織資訊，顯示載入中
  if (orgLoading) {
    return (
      <Layout style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>載入中...</Text>
        </View>
      </Layout>
    );
  }

  // 如果沒有登入，顯示提示
  if (!authUser) {
    return (
      <Layout style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>請先登入</Text>
        </View>
      </Layout>
    );
  }

  // 如果登入但沒有組織資訊，顯示設定提示
  if (!currentOrganization || !currentTeam) {
    return (
      <Layout style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>請先設定組織資訊</Text>
        </View>
      </Layout>
    );
  }

  return (
    <Layout style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* 頭部區域 - 使用者資訊 */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || authUser.displayName || '使用者'}</Text>
            <Text style={styles.userEmail}>{user?.email || authUser.email}</Text>
          </View>
          <ModeToggle
            value={mode}
            onToggle={toggleMode}
            label={mode === 'business' ? '業務模式' : '主管模式'}
          />
        </View>

        <View style={styles.content}>
          {/* 任務列表區塊 */}
          <View style={styles.section}>
            <TaskListSection
              userId={authUser.uid}
              organizationId={currentOrganization.id}
              teamId={currentTeam.id}
            />
          </View>

          {/* 近期接觸客戶區塊 - 暫時隱藏以避免嵌套問題 */}
          {/* <RecentCustomersSection
            userId={authUser.uid}
            organizationId={currentOrganization.id}
            teamId={currentTeam.id}
            limit={5}
          /> */}
        </View>
      </SafeAreaView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 20,
    marginBottom: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
});