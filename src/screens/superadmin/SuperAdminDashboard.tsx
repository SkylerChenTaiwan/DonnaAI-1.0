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
import { useAdminStore } from '@/stores/adminStore';
import { DesignSystem } from '@/theme/designSystem';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const SuperAdminDashboard: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { 
    organizations, 
    fetchOrganizations, 
    isLoading,
    error 
  } = useAdminStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrganizations();
    setRefreshing(false);
  };

  // 計算總計數據
  const totalOrganizations = organizations.length;
  const activeOrganizations = organizations.filter(org => org.status === 'active').length;
  const totalUsers = organizations.reduce((sum, org) => sum + (org.stats?.totalUsers || 0), 0);
  const totalRevenue = organizations.reduce((sum, org) => {
    // 根據訂閱方案計算收入
    const planPrices = {
      trial: 0,
      basic: 299,
      professional: 999,
      enterprise: 2999
    };
    return sum + (planPrices[org.subscription?.plan as keyof typeof planPrices] || 0);
  }, 0);

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
      id: 'add-org',
      title: '新增組織',
      icon: 'add-circle-outline',
      route: 'CreateOrganizationScreen'
    },
    {
      id: 'view-orgs',
      title: '組織管理',
      icon: 'business-outline',
      route: 'OrganizationsScreen'
    },
    {
      id: 'platform-stats',
      title: '平台統計',
      icon: 'analytics-outline',
      route: 'PlatformDashboard'
    },
    {
      id: 'settings',
      title: '平台設定',
      icon: 'settings-outline',
      route: 'AdminSettings'
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
                onPress={() => navigation.navigate(action.route as any)}
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

        {/* 最近組織 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>最近組織</Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('OrganizationsScreen')}
            >
              <Text style={styles.viewAllLink}>查看全部</Text>
            </TouchableOpacity>
          </View>
          
          {organizations.slice(0, 3).map((org) => (
            <TouchableOpacity
              key={org.id}
              style={styles.orgCard}
              onPress={() => navigation.navigate('OrganizationDetailScreen', { organizationId: org.id })}
            >
              <View style={styles.orgInfo}>
                <Text style={styles.orgName}>{org.name}</Text>
                <Text style={styles.orgPlan}>
                  {org.subscription?.plan || 'trial'} 方案 · {org.stats?.totalUsers || 0} 用戶
                </Text>
              </View>
              <View style={[
                styles.orgStatus,
                { backgroundColor: org.status === 'active' ? DesignSystem.colors.success : DesignSystem.colors.error }
              ]}>
                <Text style={styles.orgStatusText}>
                  {org.status === 'active' ? '活躍' : '停用'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
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
});