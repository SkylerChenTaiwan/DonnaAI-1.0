/**
 * 組織管理頁面（Super Admin）
 * 顯示和管理所有組織
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Icon } from '@/components/common/Icon';
import { Layout } from '@/components/common/Layout';
import { SearchBar } from '@/components/common/SearchBar';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { getAllOrganizations, updateOrganization } from '@/services/firebase/organizations';
import { Organization } from '@/types/entities';
import { RootStackParamList } from '@/types/navigation';
import { DesignSystem } from '@/theme/designSystem';
import { toast } from '@/utils/toast';

type NavigationProp = StackNavigationProp<RootStackParamList, 'OrganizationsScreen'>;

export const OrganizationsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { isSuperAdmin, checkPermission, user } = useAdminAuth();
  
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [filteredOrgs, setFilteredOrgs] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 檢查權限
  useEffect(() => {
    if (!isSuperAdmin) {
      Alert.alert('無權限', '您沒有權限訪問此頁面', [
        { text: '確定', onPress: () => navigation.goBack() }
      ]);
    }
  }, [isSuperAdmin, navigation]);

  // 載入組織列表
  useEffect(() => {
    // 偵錯：檢查用戶資訊
    console.log('🔍 OrganizationsScreen - 用戶資訊:', {
      email: user?.email,
      role: user?.role,
      isSuperAdmin,
      uid: user?.id
    });
    loadOrganizations();
  }, []);

  // 搜尋過濾
  useEffect(() => {
    if (searchQuery) {
      const filtered = organizations.filter(org =>
        org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.contactEmail?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredOrgs(filtered);
    } else {
      setFilteredOrgs(organizations);
    }
  }, [searchQuery, organizations]);

  const loadOrganizations = async () => {
    try {
      setIsLoading(true);
      const orgs = await getAllOrganizations();
      setOrganizations(orgs);
      setFilteredOrgs(orgs);
    } catch (error) {
      console.error('載入組織失敗:', error);
      toast.error('載入組織列表失敗');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOrganizations();
    setRefreshing(false);
  };


  const handleOrganizationPress = (org: Organization) => {
    navigation.navigate('OrganizationDetailScreen', { organizationId: org.id });
  };

  const handleToggleStatus = async (org: Organization) => {
    const newStatus = org.status === 'active' ? 'suspended' : 'active';
    const action = newStatus === 'active' ? '啟用' : '停用';
    
    Alert.alert(
      `${action}組織`,
      `確定要${action}「${org.name}」嗎？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '確定',
          style: newStatus === 'suspended' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await updateOrganization(org.id, { status: newStatus });
              await loadOrganizations();
              toast.success(`已${action}組織`);
            } catch (error) {
              console.error('更新組織狀態失敗:', error);
              toast.error(`${action}失敗`);
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active':
        return DesignSystem.colors.success;
      case 'suspended':
        return DesignSystem.colors.warning;
      case 'cancelled':
      case 'expired':
        return DesignSystem.colors.error;
      default:
        return DesignSystem.colors.gray[500];
    }
  };

  const renderOrganizationItem = ({ item }: { item: Organization }) => (
    <TouchableOpacity
      style={styles.orgCard}
      onPress={() => handleOrganizationPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.orgHeader}>
        <View style={styles.orgInfo}>
          <Text style={styles.orgName}>{item.name}</Text>
          <Text style={styles.orgPlan}>{(item.subscriptionPlan || 'basic').toUpperCase()}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status || 'active'}</Text>
        </View>
      </View>

      <View style={styles.orgDetails}>
        <View style={styles.detailRow}>
          <Icon name="people-outline" size={16} color={DesignSystem.colors.gray[600]} />
          <Text style={styles.detailText}>
            {item.maxUsers || 0} 用戶
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="time-outline" size={16} color={DesignSystem.colors.gray[600]} />
          <Text style={styles.detailText}>
            {item.aiMinutesUsed || 0} / {item.aiMinutesQuota || 0} AI 分鐘
          </Text>
        </View>
      </View>

      <View style={styles.orgActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleToggleStatus(item)}
        >
          <Icon
            name={item.status === 'active' ? 'pause-circle-outline' : 'play-circle-outline'}
            size={20}
            color={DesignSystem.colors.gray[700]}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleOrganizationPress(item)}
        >
          <Icon
            name="settings-outline"
            size={20}
            color={DesignSystem.colors.gray[700]}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner message="載入組織列表..." />
      </Layout>
    );
  }

  return (
    <Layout 
      style={styles.container} 
      scrollable={false}
      headerProps={{
        title: '組織管理',
        showBackButton: true,
        onBackPress: () => navigation.goBack(),
        rightComponent: (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('CreateOrganizationScreen')}
          >
            <Icon name="add" size={20} color={DesignSystem.colors.text.inverse} />
          </TouchableOpacity>
        ),
      }}
    >
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="搜尋組織名稱或信箱..."
        />
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{organizations.length}</Text>
          <Text style={styles.statLabel}>總組織數</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {organizations.filter(o => o.status === 'active').length}
          </Text>
          <Text style={styles.statLabel}>活躍組織</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {organizations.filter(o => o.subscriptionPlan === 'enterprise').length}
          </Text>
          <Text style={styles.statLabel}>企業版</Text>
        </View>
      </View>

      <FlatList
        data={filteredOrgs}
        keyExtractor={item => item.id}
        renderItem={renderOrganizationItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="business-outline" size={48} color={DesignSystem.colors.gray[400]} />
            <Text style={styles.emptyText}>
              {searchQuery ? '沒有符合的組織' : '尚無組織'}
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
      />
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background.primary,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: DesignSystem.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    padding: DesignSystem.spacing.md,
    backgroundColor: DesignSystem.colors.background.surface,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: DesignSystem.spacing.md,
    backgroundColor: DesignSystem.colors.background.surface,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...DesignSystem.typography.h2,
    color: DesignSystem.colors.text.primary,
  },
  statLabel: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    marginTop: DesignSystem.spacing.xs,
  },
  listContent: {
    padding: DesignSystem.spacing.md,
  },
  orgCard: {
    backgroundColor: DesignSystem.colors.background.surface,
    borderRadius: DesignSystem.borderRadius.md,
    padding: DesignSystem.spacing.md,
    ...DesignSystem.shadows.sm,
  },
  orgHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: DesignSystem.spacing.sm,
  },
  orgInfo: {
    flex: 1,
  },
  orgName: {
    ...DesignSystem.typography.h3,
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.xs,
  },
  orgPlan: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.xs,
    borderRadius: DesignSystem.borderRadius.sm,
  },
  statusText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.inverse,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  orgDetails: {
    flexDirection: 'row',
    gap: DesignSystem.spacing.lg,
    marginBottom: DesignSystem.spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSystem.spacing.xs,
  },
  detailText: {
    ...DesignSystem.typography.bodySmall,
    color: DesignSystem.colors.text.secondary,
  },
  orgActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: DesignSystem.spacing.sm,
    marginTop: DesignSystem.spacing.sm,
    paddingTop: DesignSystem.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: DesignSystem.colors.border.light,
  },
  actionButton: {
    padding: DesignSystem.spacing.sm,
  },
  separator: {
    height: DesignSystem.spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DesignSystem.spacing.xxl,
  },
  emptyText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.secondary,
    marginTop: DesignSystem.spacing.md,
  },
});