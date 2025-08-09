/**
 * 管理中心首頁（Enterprise Admin）
 * 組織概覽和快速操作
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
// Icon import removed - using platform-specific Icon component;
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Icon } from '@/components/common/Icon';
import { WebLayout } from '@/components/layout/WebLayout';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAuthStore } from '@/stores/authStore';
import { getOrganization } from '@/services/firebase/organizations';
import { getOrganizationMetrics } from '@/services/firebase/usageMetrics';
import { OrganizationDetails, UsageMetrics } from '@/types/admin';
import { RootStackParamList } from '@/types/navigation';
import { DesignSystem } from '@/theme/designSystem';
import { showToast } from '@/utils/toast';

type NavigationProp = StackNavigationProp<RootStackParamList, 'AdminDashboard'>;

interface QuickAction {
  id: string;
  title: string;
  icon: string;
  color: string;
  route: keyof RootStackParamList;
  permission?: string;
}

export const AdminDashboard: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuthStore();
  const { isEnterpriseAdmin, checkPermission, permissions } = useAdminAuth();
  
  const [orgDetails, setOrgDetails] = useState<OrganizationDetails | null>(null);
  const [todayMetrics, setTodayMetrics] = useState<UsageMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 檢查權限
  useEffect(() => {
    if (!isEnterpriseAdmin) {
      Alert.alert('無權限', '您沒有權限訪問此頁面', [
        { text: '確定', onPress: () => navigation.goBack() }
      ]);
    }
  }, [isEnterpriseAdmin, navigation]);

  // 載入資料
  useEffect(() => {
    if (user?.organizationId) {
      loadDashboardData();
    }
  }, [user?.organizationId]);

  const loadDashboardData = async () => {
    if (!user?.organizationId) return;
    
    try {
      setIsLoading(true);
      
      // 載入組織詳情
      const org = await getOrganization(user.organizationId);
      setOrgDetails(org);
      
      // 載入今日統計
      const today = new Date();
      const metrics = await getOrganizationMetrics(
        user.organizationId,
        'daily',
        today,
        today
      );
      
      if (metrics.length > 0) {
        setTodayMetrics(metrics[0]);
      }
    } catch (error) {
      console.error('載入管理中心資料失敗:', error);
      showToast.error('載入資料失敗');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  // 快速操作按鈕
  const quickActions: QuickAction[] = [
    {
      id: 'users',
      title: '用戶管理',
      icon: 'people-outline',
      color: DesignSystem.colors.primary,
      route: 'UserManagementScreen',
      permission: 'manage_users',
    },
    {
      id: 'tools',
      title: '工具管理',
      icon: 'construct-outline',
      color: '#34C759',
      route: 'ToolManagementScreen',
      permission: 'manage_tools',
    },
    {
      id: 'import',
      title: '資料匯入',
      icon: 'cloud-upload-outline',
      color: '#FF9500',
      route: 'DataImportScreen',
      permission: 'import_data',
    },
    {
      id: 'legacy-import',
      title: '舊系統導入',
      icon: 'git-pull-request-outline',
      color: '#FF3B30',
      route: 'LegacyDataImportScreen',
      permission: 'import_data',
    },
    {
      id: 'reports',
      title: '使用報表',
      icon: 'bar-chart-outline',
      color: '#5856D6',
      route: 'UsageReportsScreen',
      permission: 'view_reports',
    },
  ];

  const handleQuickAction = (action: QuickAction) => {
    if (action.permission && !checkPermission(action.permission)) {
      Alert.alert('無權限', '您沒有權限使用此功能');
      return;
    }
    
    navigation.navigate(action.route as any);
  };

  const renderQuickActions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>快速操作</Text>
      <View style={styles.quickActionsGrid}>
        {quickActions.map(action => {
          const hasPermission = !action.permission || checkPermission(action.permission);
          
          return (
            <TouchableOpacity
              key={action.id}
              style={[
                styles.quickActionCard,
                !hasPermission && styles.disabledCard
              ]}
              onPress={() => handleQuickAction(action)}
              disabled={!hasPermission}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: action.color }]}>
                <Icon
                  name={action.icon}
                  size={24}
                  color={DesignSystem.colors.text.inverse}
                />
              </View>
              <Text style={styles.actionTitle}>{action.title}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderOrgStats = () => {
    if (!orgDetails) return null;
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>組織概覽</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{orgDetails.userCount}</Text>
            <Text style={styles.statLabel}>總用戶數</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{orgDetails.activeUserCount}</Text>
            <Text style={styles.statLabel}>活躍用戶</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {Math.round((orgDetails.aiMinutesUsed / orgDetails.aiMinutesQuota) * 100)}%
            </Text>
            <Text style={styles.statLabel}>AI 使用率</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{orgDetails.teamCount}</Text>
            <Text style={styles.statLabel}>團隊數</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderTodayActivity = () => {
    if (!todayMetrics) return null;
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>今日活動</Text>
        <View style={styles.activityCard}>
          <View style={styles.activityRow}>
            <Text style={styles.activityLabel}>活躍用戶</Text>
            <Text style={styles.activityValue}>{todayMetrics.metrics.activeUsers}</Text>
          </View>
          <View style={styles.activityRow}>
            <Text style={styles.activityLabel}>總會話數</Text>
            <Text style={styles.activityValue}>{todayMetrics.metrics.totalSessions}</Text>
          </View>
          <View style={styles.activityRow}>
            <Text style={styles.activityLabel}>AI 分鐘數</Text>
            <Text style={styles.activityValue}>{todayMetrics.metrics.aiMinutesUsed}</Text>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    const loadingContent = <LoadingSpinner message="載入管理中心..." />;
    
    // Web 平台直接返回內容
    if (Platform.OS === 'web') {
      return loadingContent;
    }
    
    return (
      <WebLayout>
        {loadingContent}
      </WebLayout>
    );
  }

  const content = (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
      >
        {renderOrgStats()}
        {renderQuickActions()}
        {renderTodayActivity()}
      </ScrollView>
    </View>
  );
  
  // Web 平台直接返回內容（由 WebNavigator 管理佈局）
  if (Platform.OS === 'web') {
    return content;
  }
  
  // 其他平台使用 WebLayout
  return (
    <WebLayout scrollable={false}>
      {content}
    </WebLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background.primary,
  },
  settingsButton: {
    padding: DesignSystem.spacing.sm,
  },
  scrollContent: {
    paddingBottom: DesignSystem.spacing.xxl,
  },
  section: {
    padding: DesignSystem.spacing.lg,
  },
  sectionTitle: {
    ...DesignSystem.typography.h2,
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignSystem.spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: DesignSystem.colors.background.surface,
    borderRadius: DesignSystem.borderRadius.md,
    padding: DesignSystem.spacing.md,
    alignItems: 'center',
    ...DesignSystem.shadows.sm,
  },
  statValue: {
    ...DesignSystem.typography.h1,
    color: DesignSystem.colors.text.primary,
  },
  statLabel: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    marginTop: DesignSystem.spacing.xs,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignSystem.spacing.md,
  },
  quickActionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: DesignSystem.colors.background.surface,
    borderRadius: DesignSystem.borderRadius.md,
    padding: DesignSystem.spacing.lg,
    alignItems: 'center',
    ...DesignSystem.shadows.sm,
  },
  disabledCard: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.sm,
  },
  actionTitle: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary,
    textAlign: 'center',
  },
  activityCard: {
    backgroundColor: DesignSystem.colors.background.surface,
    borderRadius: DesignSystem.borderRadius.md,
    padding: DesignSystem.spacing.md,
    ...DesignSystem.shadows.sm,
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: DesignSystem.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light,
  },
  activityLabel: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.secondary,
  },
  activityValue: {
    ...DesignSystem.typography.h3,
    color: DesignSystem.colors.text.primary,
  },
});