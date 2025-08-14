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
  Alert,
  Platform } from 'react-native';
import { Icon } from '@/components/common/Icon';
import { Layout } from '@/components/common/Layout';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { isWebPlatform, isDesktopWeb, isTabletWeb } from '@/utils/web-detector';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation';
import { useAuthStore } from '@/stores/authStore';
import { DesignSystem } from '@/theme/designSystem';
import { useSuperAdminStats } from '@/hooks/useSuperAdminStats';
import { withAlpha } from '@/utils/colorUtils';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const SuperAdminDashboard: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  
  // 使用 Super Admin 統計 Hook
  const { 
    stats, 
    isLoading, 
    error, 
    refreshStats,
    topOrganizations 
  } = useSuperAdminStats();

  // 處理錯誤
  useEffect(() => {
    if (error) {
      Alert.alert('載入錯誤', error);
    }
  }, [error]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshStats();
    setRefreshing(false);
  };

  // 從統計資料取得實際數值
  const totalOrganizations = stats?.totalOrganizations || 0;
  const activeOrganizations = stats?.activeOrganizations || 0;
  const totalUsers = stats?.totalUsers || 0;
  const totalRevenue = stats?.monthlyRevenue || 0;
  const growthRate = stats?.organizationGrowthRate || 0;

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
      subtitle: `${stats?.activeUsers || 0} 個活躍`,
      icon: 'people-outline',
      color: DesignSystem.colors.primary
    },
    {
      id: 'revenue',
      title: '每月收入',
      value: `NT$${totalRevenue.toLocaleString('zh-TW')}`,
      subtitle: '預估收入',
      icon: 'cash-outline',
      color: DesignSystem.colors.primary
    },
    {
      id: 'growth',
      title: '成長率',
      value: growthRate > 0 ? `+${growthRate}%` : `${growthRate}%`,
      subtitle: '本月 vs 上月',
      icon: growthRate >= 0 ? 'trending-up-outline' : 'trending-down-outline',
      color: DesignSystem.colors.primary
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

  const isWeb = isWebPlatform();
  const isDesktop = isDesktopWeb();
  const isTablet = isTabletWeb();
  const shouldUseWebLayout = isWeb && (isDesktop || isTablet);
  const useResponsiveLayout = shouldUseWebLayout;
  
  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={DesignSystem.colors.primary} />
        <Text style={styles.loadingText}>載入中...</Text>
      </View>
    );
  }
  
  const content = (
    <>
      {/* 麵包屑導航 */}
      <Breadcrumbs
        items={[
          {
            id: 'home',
            label: '首頁',
            onPress: () => navigation.navigate('Home' as any) },
          {
            id: 'current',
            label: 'Super Admin 控制台' },
        ]}
      />
      
      {/* 歡迎區塊 */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>歡迎回來，Super Admin</Text>
        <Text style={styles.welcomeSubtitle}>今天是 {new Date().toLocaleDateString('zh-TW')}</Text>
      </View>

      {/* 快速統計 */}
      <View style={StyleSheet.flatten([styles.statsGrid, shouldUseWebLayout && styles.webStatsGrid])}>
        {quickStats.map((stat) => (
          <View key={stat.id} style={StyleSheet.flatten([styles.statCard, useResponsiveLayout && styles.webStatCard])}>
            <View style={StyleSheet.flatten([styles.statIconContainer])}>
              <Icon name={stat.icon as any} size={24} color={DesignSystem.colors.primary} />
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statTitle}>{stat.title}</Text>
            <Text style={styles.statSubtitle}>{stat.subtitle}</Text>
          </View>
        ))}
      </View>

      {/* 快速操作 */}
      <View style={StyleSheet.flatten([styles.section, useResponsiveLayout && styles.webSection])}>
        <Text style={styles.sectionTitle}>快速操作</Text>
        <View style={StyleSheet.flatten([styles.actionsGrid, useResponsiveLayout && styles.webActionsGrid])}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={StyleSheet.flatten([styles.actionCard, useResponsiveLayout && styles.webActionCard])}
              onPress={action.action}
            >
              <Icon 
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
      <View style={StyleSheet.flatten([styles.section, useResponsiveLayout && styles.webSection])}>
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
            <Text style={styles.systemInfoLabel}>平台總記錄數：</Text>
            <Text style={styles.systemInfoValue}>{stats?.totalRecords.toLocaleString() || '0'}</Text>
          </View>
          <View style={styles.systemInfoRow}>
            <Text style={styles.systemInfoLabel}>AI 處理次數：</Text>
            <Text style={styles.systemInfoValue}>{stats?.totalAIProcessing.toLocaleString() || '0'}</Text>
          </View>
        </View>
      </View>

      {/* 收入排行榜 */}
      {topOrganizations.length > 0 && (
        <View style={StyleSheet.flatten([styles.section, useResponsiveLayout && styles.webSection])}>
          <Text style={styles.sectionTitle}>收入排行榜（前10名）</Text>
          {topOrganizations.map((org, index) => (
            <TouchableOpacity 
              key={org.organizationId} 
              style={styles.orgCard}
              onPress={() => navigation.navigate('OrganizationDetail', { organizationId: org.organizationId })}
            >
              <View style={styles.orgRank}>
                <Text style={styles.orgRankText}>{index + 1}</Text>
              </View>
              <View style={styles.orgInfo}>
                <Text style={styles.orgName}>{org.organizationName}</Text>
                <Text style={styles.orgStats}>
                  {org.activeUsers} 位用戶 • {org.totalRecords} 筆記錄
                </Text>
              </View>
              <Text style={styles.orgRevenue}>
                NT${org.monthlyBill.toLocaleString('zh-TW')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.footer} />
    </>
  );

  // Web 平台直接返回內容（由 WebNavigator 管理佈局）
  if (Platform.OS === 'web') {
    return (
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={shouldUseWebLayout ? styles.webScrollContent : undefined}
      >
        {content}
      </ScrollView>
    );
  }
  
  // 其他平台使用 Layout
  return (
    <Layout scrollable={false}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={shouldUseWebLayout ? styles.webScrollContent : undefined}
      >
        {content}
      </ScrollView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background.primary },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center' },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: DesignSystem.colors.text.secondary },
  welcomeSection: {
    padding: 20,
    backgroundColor: DesignSystem.colors.background.surface,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: DesignSystem.colors.text.primary,
    marginBottom: 4 },
  welcomeSubtitle: {
    fontSize: 14,
    color: DesignSystem.colors.text.secondary },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10 },
  statCard: {
    width: '50%',
    padding: 10 },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: DesignSystem.colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12 },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: DesignSystem.colors.text.primary,
    marginBottom: 4 },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
    marginBottom: 2 },
  statSubtitle: {
    fontSize: 12,
    color: DesignSystem.colors.text.secondary },
  section: {
    padding: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
    marginBottom: 16 },
  viewAllLink: {
    fontSize: 14,
    color: DesignSystem.colors.primary,
    fontWeight: '500' },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8 },
  actionCard: {
    width: '50%',
    padding: 8,
    backgroundColor: DesignSystem.colors.background.surface,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.light },
  actionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: DesignSystem.colors.text.primary,
    marginTop: 8,
    textAlign: 'center' },
  orgCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: DesignSystem.colors.background.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.light },
  orgRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: withAlpha(DesignSystem.colors.primary, 0.094),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12 },
  orgRankText: {
    fontSize: 14,
    fontWeight: '700',
    color: DesignSystem.colors.primary },
  orgInfo: {
    flex: 1 },
  orgName: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
    marginBottom: 4 },
  orgStats: {
    fontSize: 12,
    color: DesignSystem.colors.text.secondary },
  orgRevenue: {
    fontSize: 16,
    fontWeight: '700',
    color: DesignSystem.colors.success },
  orgPlan: {
    fontSize: 14,
    color: DesignSystem.colors.text.secondary },
  orgStatus: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4 },
  orgStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: DesignSystem.colors.text.inverse },
  footer: {
    height: 20 },
  systemInfoCard: {
    backgroundColor: DesignSystem.colors.background.surface,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.light },
  systemInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light },
  systemInfoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: DesignSystem.colors.text.secondary,
    flex: 1 },
  systemInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
    flex: 1,
    textAlign: 'right' },
  // Web 響應式樣式
  webScrollContent: {
    ...Platform.select({
      web: {
        maxWidth: 1200,
        width: '100%',
        marginHorizontal: 'auto' as any },
      default: {} }) },
  webStatsGrid: {
    ...Platform.select({
      web: {
        display: 'grid' as any,
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16,
        padding: 20 },
      default: {} }) },
  webStatCard: {
    ...Platform.select({
      web: {
        width: 'auto',
        padding: 20,
        backgroundColor: DesignSystem.colors.background.surface,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: DesignSystem.colors.border.light },
      default: {} }) },
  webSection: {
    ...Platform.select({
      web: {
        padding: 32 },
      default: {} }) },
  webActionsGrid: {
    ...Platform.select({
      web: {
        display: 'grid' as any,
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 16,
        marginHorizontal: 0 },
      default: {} }) },
  webActionCard: {
    ...Platform.select({
      web: {
        width: 'auto',
        padding: 20,
        minHeight: 100 },
      default: {} }) } });