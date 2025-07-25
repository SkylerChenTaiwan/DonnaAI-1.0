/**
 * Super Admin 控制台首頁
 * 平台總覽和管理功能
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Layout } from '@/components/common/Layout';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation';
import { useAuthStore } from '@/stores/authStore';
import { DesignSystem } from '@/theme/designSystem';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const SuperAdminDashboard: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 系統管理員不需要載入業務資料
  useEffect(() => {
    // 不執行任何資料載入
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    // 模擬 refresh，但不實際載入資料
    setTimeout(() => setRefreshing(false), 500);
  };

  // 系統管理員專用的模擬統計資料
  const totalOrganizations = 0;
  const activeOrganizations = 0;
  const totalUsers = 0;
  const totalRevenue = 0;

  const quickStats = [
    {
      id: 'organizations',
      title: '組織總數',
      value: totalOrganizations.toString(),
      subtitle: `${activeOrganizations} 個活躍`,
      icon: 'business-outline',
      color: DesignSystem.colors.primary
    },
    {
      id: 'users',
      title: '用戶總數',
      value: totalUsers.toString(),
      subtitle: '跨所有組織',
      icon: 'people-outline',
      color: DesignSystem.colors.success
    },
    {
      id: 'revenue',
      title: '每月收入',
      value: `$${totalRevenue.toLocaleString()}`,
      subtitle: '預估收入',
      icon: 'cash-outline',
      color: DesignSystem.colors.warning
    },
    {
      id: 'growth',
      title: '成長率',
      value: '+23%',
      subtitle: '本月 vs 上月',
      icon: 'trending-up-outline',
      color: DesignSystem.colors.info
    }
  ];

  const quickActions = [
    {
      id: 'organizations',
      title: '組織管理',
      icon: 'business-outline',
      action: () => navigation.navigate('OrganizationsScreen')
    },
    {
      id: 'platform-stats',
      title: '平台監控',
      icon: 'analytics-outline',
      action: () => console.log('平台監控功能開發中')
    },
    {
      id: 'system-logs',
      title: '系統日誌',
      icon: 'document-text-outline',
      action: () => console.log('系統日誌功能開發中')
    },
    {
      id: 'backup',
      title: '資料備份',
      icon: 'cloud-download-outline',
      action: () => console.log('資料備份功能開發中')
    },
    {
      id: 'settings',
      title: '系統設定',
      icon: 'settings-outline',
      action: () => console.log('系統設定功能開發中')
    }
  ];

  if (isLoading && !refreshing) {
    return (
      <Layout style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={DesignSystem.colors.primary} />
          <Text style={styles.loadingText}>載入中...</Text>
        </View>
      </Layout>
    );
  }

  return (
    <Layout style={styles.container} scrollable={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* 歡迎區塊 */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>歡迎回來，Super Admin</Text>
          <Text style={styles.welcomeSubtitle}>今天是 {new Date().toLocaleDateString('zh-TW')}</Text>
        </View>

        {/* 快速統計 */}
        <View style={styles.statsGrid}>
          {quickStats.map((stat) => (
            <View key={stat.id} style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: `${stat.color}15` }]}>
                <Ionicons name={stat.icon as any} size={24} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statTitle}>{stat.title}</Text>
              <Text style={styles.statSubtitle}>{stat.subtitle}</Text>
            </View>
          ))}
        </View>

        {/* 快速操作 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>快速操作</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionCard}
                onPress={action.action}
              >
                <Ionicons 
                  name={action.icon as any} 
                  size={32} 
                  color={DesignSystem.colors.primary} 
                />
                <Text style={styles.actionTitle}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 系統資訊 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>系統狀態</Text>
          
          <View style={styles.systemInfoCard}>
            <View style={styles.systemInfoRow}>
              <Text style={styles.systemInfoLabel}>當前用戶角色：</Text>
              <Text style={styles.systemInfoValue}>系統管理員</Text>
            </View>
            <View style={styles.systemInfoRow}>
              <Text style={styles.systemInfoLabel}>登入帳號：</Text>
              <Text style={styles.systemInfoValue}>{user?.email}</Text>
            </View>
            <View style={styles.systemInfoRow}>
              <Text style={styles.systemInfoLabel}>權限範圍：</Text>
              <Text style={styles.systemInfoValue}>系統管理功能</Text>
            </View>
            <View style={styles.systemInfoRow}>
              <Text style={styles.systemInfoLabel}>資料存取：</Text>
              <Text style={styles.systemInfoValue}>無業務資料存取權限</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer} />
      </ScrollView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background.primary,
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
  welcomeSection: {
    padding: 20,
    backgroundColor: DesignSystem.colors.background.surface,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: DesignSystem.colors.text.primary,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: DesignSystem.colors.text.secondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  statCard: {
    width: '50%',
    padding: 10,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: DesignSystem.colors.text.primary,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 12,
    color: DesignSystem.colors.text.secondary,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
    marginBottom: 16,
  },
  viewAllLink: {
    fontSize: 14,
    color: DesignSystem.colors.primary,
    fontWeight: '500',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  actionCard: {
    width: '50%',
    padding: 8,
    backgroundColor: DesignSystem.colors.background.surface,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.light,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: DesignSystem.colors.text.primary,
    marginTop: 8,
    textAlign: 'center',
  },
  orgCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: DesignSystem.colors.background.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.light,
  },
  orgInfo: {
    flex: 1,
  },
  orgName: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
    marginBottom: 4,
  },
  orgPlan: {
    fontSize: 14,
    color: DesignSystem.colors.text.secondary,
  },
  orgStatus: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  orgStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: DesignSystem.colors.text.inverse,
  },
  footer: {
    height: 20,
  },
  systemInfoCard: {
    backgroundColor: DesignSystem.colors.background.surface,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.light,
  },
  systemInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light,
  },
  systemInfoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: DesignSystem.colors.text.secondary,
    flex: 1,
  },
  systemInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
    flex: 1,
    textAlign: 'right',
  },
});