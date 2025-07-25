/**
 * 組織詳情頁面（Super Admin）
 * 檢視和編輯組織設定
 * 支援新的按用戶計費模式和簡化的訂閱方案
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Layout } from '@/components/common/Layout';
import { TextInput } from '@/components/common/TextInput';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { 
  getOrganization, 
  updateOrganization,
  deleteOrganization,
  upgradeOrganizationPlan,
  updateGiftedSeats,
  getOrganizationBillingSummary,
  isTrialActive
} from '@/services/firebase/admin/organizationService';
import { getUsageHistory } from '@/services/firebase/admin/billingService';
import { getToolUsageStats } from '@/services/firebase/admin/toolUsageService';
import { Organization, BillingRecord, ToolUsageStats } from '@/types/entities';
import { RootStackParamList } from '@/types/navigation';
import { DesignSystem } from '@/theme/designSystem';
import { toast } from '@/utils/toast';
import { AddUserToOrganizationModal } from '@/components/organization/AddUserToOrganizationModal';
import { BulkImportUsersModal } from '@/components/organization/BulkImportUsersModal';
import { DataImportAssistModal } from '@/components/organization/DataImportAssistModal';
import { CustomFieldsModal } from '@/components/organization/CustomFieldsModal';

type RouteParams = RouteProp<RootStackParamList, 'OrganizationDetailScreen'>;
type NavigationProp = StackNavigationProp<RootStackParamList, 'OrganizationDetailScreen'>;

export const OrganizationDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteParams>();
  const { organizationId } = route.params;

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // 編輯表單狀態
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    giftedSeats: '',
    status: 'active' as 'active' | 'suspended' | 'cancelled',
  });
  
  // 計費資訊
  const [billingSummary, setBillingSummary] = useState<any>(null);
  const [billingHistory, setBillingHistory] = useState<BillingRecord[]>([]);
  const [toolUsageStats, setToolUsageStats] = useState<ToolUsageStats[]>([]);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'users' | 'billing' | 'permissions' | 'assistance'>('overview');
  
  // 用戶管理 Modal 狀態
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  
  // 用戶協助 Modal 狀態
  const [showDataImportModal, setShowDataImportModal] = useState(false);
  const [showCustomFieldsModal, setShowCustomFieldsModal] = useState(false);

  // 功能開關狀態
  const [features, setFeatures] = useState({
    allowDataImport: true,
    allowDataExport: true,
    allowCustomFields: true,
    allowAPIAccess: false,
  });

  useEffect(() => {
    loadOrganizationData();
  }, [organizationId]);

  const loadOrganizationData = async () => {
    try {
      setIsLoading(true);
      const orgData = await getOrganization(organizationId);
      
      if (orgData) {
        setOrganization(orgData);
        setFormData({
          name: orgData.name,
          email: orgData.email || '',
          giftedSeats: String(orgData.giftedSeats || 0),
          status: orgData.status || 'active',
        });
        
        // TODO: 載入計費資訊（暫時停用，等實際有資料時再啟用）
        // loadBillingData(organizationId);
        
        // TODO: 載入工具使用統計（暫時停用，等實際有資料時再啟用）
        // loadToolUsageData(organizationId);
        
        // 設定功能開關
        if (orgData.features) {
          setFeatures({
            allowDataImport: orgData.features.allowDataImport ?? true,
            allowDataExport: orgData.features.allowDataExport ?? true,
            allowCustomFields: orgData.features.allowCustomFields ?? true,
            allowAPIAccess: orgData.features.allowAPIAccess ?? false,
          });
        }
      } else {
        toast.error('找不到組織資料');
        navigation.goBack();
      }
    } catch (error) {
      console.error('載入組織資料失敗:', error);
      toast.error('載入失敗');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOrganizationData();
    setRefreshing(false);
  };

  const loadBillingData = async (orgId: string) => {
    try {
      const [summary, history] = await Promise.all([
        getOrganizationBillingSummary(orgId),
        getUsageHistory(orgId, 6)
      ]);
      setBillingSummary(summary);
      setBillingHistory(history);
    } catch (error) {
      console.error('載入計費資訊失敗:', error);
    }
  };
  
  const loadToolUsageData = async (orgId: string) => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const stats = await getToolUsageStats(orgId, currentMonth);
      setToolUsageStats(stats);
    } catch (error) {
      console.error('載入工具使用統計失敗:', error);
    }
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      await updateOrganization(organizationId, {
        name: formData.name,
        email: formData.email,
        status: formData.status,
        settings: features,
      });
      
      // 更新贈送人數
      const newGiftedSeats = parseInt(formData.giftedSeats) || 0;
      if (newGiftedSeats !== (organization?.giftedSeats || 0)) {
        await updateGiftedSeats(organizationId, newGiftedSeats);
      }

      toast.success('組織資料已更新');
      setIsEditing(false);
      await loadOrganizationData();
    } catch (error) {
      console.error('更新組織失敗:', error);
      toast.error('更新失敗');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleUpgradePlan = async () => {
    Alert.alert(
      '升級到 Pro 方案',
      '確定要將此組織升級到 Pro 方案嗎？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '升級',
          onPress: async () => {
            try {
              await upgradeOrganizationPlan(organizationId, 'pro');
              toast.success('已升級到 Pro 方案');
              await loadOrganizationData();
            } catch (error) {
              console.error('升級方案失敗:', error);
              toast.error('升級失敗');
            }
          },
        },
      ]
    );
  };

  const handleDeleteOrganization = () => {
    Alert.alert(
      '刪除組織',
      `確定要刪除「${organization?.name}」嗎？此操作無法復原。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '刪除',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteOrganization(organizationId);
              toast.success('組織已刪除');
              navigation.goBack();
            } catch (error) {
              console.error('刪除組織失敗:', error);
              toast.error('刪除失敗');
            }
          },
        },
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
        return DesignSystem.colors.error;
      default:
        return DesignSystem.colors.gray[500];
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner message="載入組織資料..." />
      </Layout>
    );
  }

  if (!organization) {
    return null;
  }

  return (
    <Layout scrollable={false}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* 組織概覽 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>組織概覽</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsEditing(!isEditing)}
            >
              <Ionicons 
                name={isEditing ? "close" : "create-outline"} 
                size={20} 
                color={DesignSystem.colors.primary} 
              />
            </TouchableOpacity>
          </View>

          {isEditing ? (
            <>
              <TextInput
                label="組織名稱"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="組織名稱"
              />
              <TextInput
                label="聯絡信箱"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="contact@company.com"
                keyboardType="email-address"
              />
              <TextInput
                label="贈送人數"
                value={formData.giftedSeats}
                onChangeText={(text) => setFormData({ ...formData, giftedSeats: text })}
                placeholder="0"
                keyboardType="number-pad"
                helperText="不計費的用戶人數"
              />
            </>
          ) : (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.label}>組織 ID</Text>
                <Text style={styles.value}>{organization.id}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>組織名稱</Text>
                <Text style={styles.value}>{organization.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>聯絡信箱</Text>
                <Text style={styles.value}>{organization.email || '未設定'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>訂閱方案</Text>
                <View style={styles.planContainer}>
                  <Text style={[styles.value, { textTransform: 'uppercase' }]}>
                    {organization.subscriptionPlan}
                  </Text>
                  {organization.subscriptionPlan === 'trial' && isTrialActive(organization) && (
                    <TouchableOpacity
                      style={styles.upgradeButton}
                      onPress={handleUpgradePlan}
                    >
                      <Text style={styles.upgradeButtonText}>升級到 Pro</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>計費週期</Text>
                <Text style={styles.value}>
                  {organization.billingCycle === 'yearly' ? '年付' : '月付'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>贈送人數</Text>
                <Text style={styles.value}>{organization.giftedSeats || 0}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>狀態</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(organization.status) }]}>
                  <Text style={styles.statusText}>{organization.status || 'active'}</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* 分頁標籤 */}
        <View style={styles.tabContainer}>
          {[
            { key: 'overview', label: '概覽' },
            { key: 'users', label: '用戶管理' },
            { key: 'billing', label: '計費管理' },
            { key: 'permissions', label: '權限管理' },
            { key: 'assistance', label: '用戶協助' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, selectedTab === tab.key && styles.activeTab]}
              onPress={() => setSelectedTab(tab.key as any)}
            >
              <Text style={[styles.tabText, selectedTab === tab.key && styles.activeTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* 概覽分頁 */}
        {selectedTab === 'overview' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>使用統計</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{billingSummary?.activeUsers || 0}</Text>
                <Text style={styles.statLabel}>活躍用戶</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{billingSummary?.billableUsers || 0}</Text>
                <Text style={styles.statLabel}>計費用戶</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{organization.giftedSeats || 0}</Text>
                <Text style={styles.statLabel}>贈送人數</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>NT$ {billingSummary?.monthlyAmount || 0}</Text>
                <Text style={styles.statLabel}>月費</Text>
              </View>
            </View>
            
            {/* TODO: 工具使用統計（暫時隱藏，等有實際資料時再顯示）
            {toolUsageStats.length > 0 && (
              <View style={styles.toolUsageSection}>
                <Text style={styles.subSectionTitle}>工具使用統計（本月）</Text>
                {toolUsageStats.map((tool) => (
                  <View key={tool.toolId} style={styles.toolUsageRow}>
                    <Text style={styles.toolName}>{tool.toolName}</Text>
                    <Text style={styles.toolUsage}>
                      {Array.isArray(tool.uniqueUsers) ? tool.uniqueUsers.length : 0} 用戶
                    </Text>
                  </View>
                ))}
              </View>
            )}
            */}
          </View>
        )}
        
        {/* 用戶管理分頁 */}
        {selectedTab === 'users' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>用戶管理</Text>
              <View style={styles.userActionButtons}>
                <TouchableOpacity
                  style={styles.addUserButton}
                  onPress={() => setShowAddUserModal(true)}
                >
                  <Ionicons name="person-add-outline" size={16} color={DesignSystem.colors.primary} />
                  <Text style={styles.addUserButtonText}>新增用戶</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.bulkImportButton}
                  onPress={() => setShowBulkImportModal(true)}
                >
                  <Ionicons name="cloud-upload-outline" size={16} color={DesignSystem.colors.success} />
                  <Text style={styles.bulkImportButtonText}>批量匯入</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.userInfoCard}>
              <Text style={styles.userInfoTitle}>用戶管理說明</Text>
              <Text style={styles.userInfoText}>
                • 新增用戶：為組織新增單個用戶{"\n"}
                • 批量匯入：使用 CSV 檔案批量新增多個用戶{"\n"}
                • 用戶會自動獲得 Firebase Auth 帳號{"\n"}
                • 用戶可以設定為一般用戶或管理員角色
              </Text>
            </View>
          </View>
        )}
        
        {/* 計費管理分頁 - 暫時顯示開發中狀態 */}
        {selectedTab === 'billing' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>計費管理</Text>
            
            <View style={styles.developmentNotice}>
              <Text style={styles.developmentTitle}>🚧 功能開發中</Text>
              <Text style={styles.developmentText}>
                計費統計功能正在開發中，將在後續版本中提供：{'\n'}
                • 月度使用統計{'\n'}
                • 計費記錄查看{'\n'}
                • 使用趨勢分析
              </Text>
            </View>
          </View>
        )}
        
        {/* 權限管理分頁 */}
        {selectedTab === 'permissions' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>權限管理</Text>
            
            <View style={styles.featureRow}>
              <View style={styles.featureInfo}>
                <Text style={styles.featureName}>資料匯入</Text>
                <Text style={styles.featureDesc}>允許匯入 CSV/Excel 檔案</Text>
              </View>
              <Switch
                value={features.allowDataImport}
                onValueChange={(value) => setFeatures({ ...features, allowDataImport: value })}
                disabled={!isEditing}
              />
            </View>
            
            <View style={styles.featureRow}>
              <View style={styles.featureInfo}>
                <Text style={styles.featureName}>資料匯出</Text>
                <Text style={styles.featureDesc}>允許匯出資料為 CSV/Excel</Text>
              </View>
              <Switch
                value={features.allowDataExport}
                onValueChange={(value) => setFeatures({ ...features, allowDataExport: value })}
                disabled={!isEditing}
              />
            </View>
            
            <View style={styles.featureRow}>
              <View style={styles.featureInfo}>
                <Text style={styles.featureName}>自訂欄位</Text>
                <Text style={styles.featureDesc}>允許建立客戶自訂欄位</Text>
              </View>
              <Switch
                value={features.allowCustomFields}
                onValueChange={(value) => setFeatures({ ...features, allowCustomFields: value })}
                disabled={!isEditing || organization?.subscriptionPlan === 'trial'}
              />
            </View>
            
            <View style={styles.featureRow}>
              <View style={styles.featureInfo}>
                <Text style={styles.featureName}>API 存取</Text>
                <Text style={styles.featureDesc}>允許使用 API 整合</Text>
              </View>
              <Switch
                value={features.allowAPIAccess}
                onValueChange={(value) => setFeatures({ ...features, allowAPIAccess: value })}
                disabled={!isEditing || organization?.subscriptionPlan === 'trial'}
              />
            </View>
          </View>
        )}
        
        {/* 用戶協助分頁 */}
        {selectedTab === 'assistance' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>用戶協助</Text>
            
            <View style={styles.assistanceCard}>
              <Ionicons name="cloud-upload-outline" size={24} color={DesignSystem.colors.primary} />
              <Text style={styles.assistanceTitle}>資料匯入協助</Text>
              <Text style={styles.assistanceDesc}>協助組織匯入 CSV/Excel 資料</Text>
              <TouchableOpacity 
                style={styles.assistanceButton}
                onPress={() => setShowDataImportModal(true)}
              >
                <Text style={styles.assistanceButtonText}>開始匯入</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.assistanceCard}>
              <Ionicons name="database-outline" size={24} color={DesignSystem.colors.primary} />
              <Text style={styles.assistanceTitle}>自訂欄位查看</Text>
              <Text style={styles.assistanceDesc}>查看各資料庫的自訂欄位配置</Text>
              <TouchableOpacity 
                style={styles.assistanceButton}
                onPress={() => setShowCustomFieldsModal(true)}
              >
                <Text style={styles.assistanceButtonText}>查看欄位</Text>
              </TouchableOpacity>
            </View>
            
            <View style={[styles.assistanceCard, styles.disabledCard]}>
              <Ionicons name="sync-outline" size={24} color={DesignSystem.colors.text.secondary} />
              <Text style={[styles.assistanceTitle, styles.disabledTitle]}>舊系統遷移</Text>
              <Text style={styles.assistanceDesc}>功能開發中，即將推出</Text>
              <View style={[styles.assistanceButton, styles.disabledButton]}>
                <Text style={[styles.assistanceButtonText, styles.disabledButtonText]}>開發中</Text>
              </View>
            </View>
          </View>
        )}


        {/* 操作按鈕 */}
        {isEditing && (
          <View style={styles.actions}>
            <Button
              title="儲存變更"
              onPress={handleSaveChanges}
              disabled={isSaving}
            />
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setIsEditing(false)}
              disabled={isSaving}
            >
              <Text style={styles.cancelButtonText}>取消</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 危險區域 */}
        {!isEditing && (
          <View style={[styles.section, styles.dangerSection]}>
            <Text style={styles.dangerTitle}>危險區域</Text>
            <TouchableOpacity
              style={styles.dangerButton}
              onPress={handleDeleteOrganization}
            >
              <Ionicons name="trash-outline" size={20} color={DesignSystem.colors.error} />
              <Text style={styles.dangerButtonText}>刪除組織</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      
      {/* 用戶管理 Modal */}
      <AddUserToOrganizationModal
        visible={showAddUserModal}
        organization={organization}
        onClose={() => setShowAddUserModal(false)}
        onUserAdded={() => {
          setShowAddUserModal(false);
          toast.success('用戶新增成功');
        }}
      />
      
      <BulkImportUsersModal
        visible={showBulkImportModal}
        organization={organization}
        onClose={() => setShowBulkImportModal(false)}
        onImportComplete={(result) => {
          setShowBulkImportModal(false);
          if (result.success) {
            toast.success(`成功匯入 ${result.imported} 個用戶`);
          } else {
            toast.error('批量匯入完成，但有部分失敗');
          }
        }}
      />
      
      {/* 用戶協助 Modal */}
      <DataImportAssistModal
        visible={showDataImportModal}
        organization={organization}
        onClose={() => setShowDataImportModal(false)}
      />
      
      <CustomFieldsModal
        visible={showCustomFieldsModal}
        organization={organization}
        onClose={() => setShowCustomFieldsModal(false)}
      />
    </Layout>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: DesignSystem.spacing.lg,
  },
  section: {
    marginBottom: DesignSystem.spacing.xl,
    padding: DesignSystem.spacing.lg,
    backgroundColor: DesignSystem.colors.background.surface,
    borderRadius: DesignSystem.borderRadius.md,
    ...DesignSystem.shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.md,
  },
  sectionTitle: {
    ...DesignSystem.typography.h3,
    color: DesignSystem.colors.text.primary,
  },
  editButton: {
    padding: DesignSystem.spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: DesignSystem.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light,
  },
  label: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.secondary,
  },
  value: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary,
    fontWeight: '500',
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignSystem.spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: DesignSystem.spacing.md,
    backgroundColor: DesignSystem.colors.background.primary,
    borderRadius: DesignSystem.borderRadius.sm,
    alignItems: 'center',
  },
  statValue: {
    ...DesignSystem.typography.h2,
    color: DesignSystem.colors.primary,
    marginBottom: DesignSystem.spacing.xs,
  },
  statLabel: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: DesignSystem.spacing.lg,
    backgroundColor: DesignSystem.colors.background.surface,
    borderRadius: DesignSystem.borderRadius.md,
    padding: DesignSystem.spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: DesignSystem.spacing.sm,
    paddingHorizontal: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.sm,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: DesignSystem.colors.primary,
  },
  tabText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: DesignSystem.colors.text.inverse,
  },
  planContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSystem.spacing.sm,
  },
  upgradeButton: {
    backgroundColor: DesignSystem.colors.success,
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.xs,
    borderRadius: DesignSystem.borderRadius.sm,
  },
  upgradeButtonText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.inverse,
    fontWeight: '600',
  },
  toolUsageSection: {
    marginTop: DesignSystem.spacing.lg,
  },
  subSectionTitle: {
    ...DesignSystem.typography.h4,
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.md,
  },
  toolUsageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: DesignSystem.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light,
  },
  toolName: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary,
  },
  toolUsage: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.secondary,
  },
  billingCard: {
    backgroundColor: DesignSystem.colors.background.primary,
    padding: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.borderRadius.md,
    marginBottom: DesignSystem.spacing.md,
  },
  billingCardTitle: {
    ...DesignSystem.typography.h4,
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.md,
  },
  billingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: DesignSystem.spacing.sm,
  },
  billingLabel: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.secondary,
  },
  billingValue: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary,
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: DesignSystem.colors.border.light,
    marginTop: DesignSystem.spacing.sm,
    paddingTop: DesignSystem.spacing.md,
  },
  totalLabel: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary,
    fontWeight: '600',
  },
  totalValue: {
    ...DesignSystem.typography.h4,
    color: DesignSystem.colors.primary,
    fontWeight: '600',
  },
  trialInfo: {
    marginTop: DesignSystem.spacing.md,
    padding: DesignSystem.spacing.md,
    backgroundColor: DesignSystem.colors.warning + '20',
    borderRadius: DesignSystem.borderRadius.sm,
  },
  trialText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.warning,
    fontWeight: '500',
    textAlign: 'center',
  },
  historySection: {
    marginTop: DesignSystem.spacing.lg,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: DesignSystem.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light,
  },
  historyPeriod: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary,
    fontWeight: '500',
    flex: 1,
  },
  historyUsers: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    flex: 1,
    textAlign: 'center',
  },
  historyAmount: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  historyStatus: {
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.xs,
    borderRadius: DesignSystem.borderRadius.sm,
    marginLeft: DesignSystem.spacing.sm,
  },
  historyStatusText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.inverse,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  assistanceCard: {
    backgroundColor: DesignSystem.colors.background.primary,
    padding: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.borderRadius.md,
    marginBottom: DesignSystem.spacing.md,
    alignItems: 'center',
  },
  assistanceTitle: {
    ...DesignSystem.typography.h4,
    color: DesignSystem.colors.text.primary,
    marginTop: DesignSystem.spacing.sm,
    marginBottom: DesignSystem.spacing.xs,
  },
  assistanceDesc: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.secondary,
    textAlign: 'center',
    marginBottom: DesignSystem.spacing.md,
  },
  assistanceButton: {
    backgroundColor: DesignSystem.colors.primary,
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingVertical: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borderRadius.sm,
  },
  assistanceButtonText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.inverse,
    fontWeight: '500',
  },
  developmentNotice: {
    backgroundColor: DesignSystem.colors.warning + '20',
    padding: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.borderRadius.md,
    borderWidth: 1,
    borderColor: DesignSystem.colors.warning + '40',
    alignItems: 'center',
  },
  developmentTitle: {
    ...DesignSystem.typography.h4,
    color: DesignSystem.colors.warning,
    marginBottom: DesignSystem.spacing.sm,
  },
  developmentText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: DesignSystem.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light,
  },
  featureInfo: {
    flex: 1,
  },
  featureName: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.xs,
  },
  featureDesc: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
  },
  actions: {
    gap: DesignSystem.spacing.md,
  },
  cancelButton: {
    paddingVertical: DesignSystem.spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.secondary,
  },
  dangerSection: {
    borderWidth: 1,
    borderColor: DesignSystem.colors.error + '30',
    backgroundColor: DesignSystem.colors.error + '10',
  },
  dangerTitle: {
    ...DesignSystem.typography.h4,
    color: DesignSystem.colors.error,
    marginBottom: DesignSystem.spacing.md,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSystem.spacing.sm,
    padding: DesignSystem.spacing.md,
    borderWidth: 1,
    borderColor: DesignSystem.colors.error,
    borderRadius: DesignSystem.borderRadius.sm,
    justifyContent: 'center',
  },
  dangerButtonText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.error,
    fontWeight: '500',
  },
  userActionButtons: {
    flexDirection: 'row',
    gap: DesignSystem.spacing.sm,
  },
  addUserButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSystem.spacing.xs,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    borderWidth: 1,
    borderColor: DesignSystem.colors.primary,
    borderRadius: DesignSystem.borderRadius.sm,
    backgroundColor: DesignSystem.colors.background.surface,
  },
  addUserButtonText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.primary,
    fontWeight: '500',
  },
  bulkImportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSystem.spacing.xs,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    borderWidth: 1,
    borderColor: DesignSystem.colors.success,
    borderRadius: DesignSystem.borderRadius.sm,
    backgroundColor: DesignSystem.colors.background.surface,
  },
  bulkImportButtonText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.success,
    fontWeight: '500',
  },
  userInfoCard: {
    backgroundColor: DesignSystem.colors.primary + '10',
    padding: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.borderRadius.sm,
    borderWidth: 1,
    borderColor: DesignSystem.colors.primary + '20',
  },
  userInfoTitle: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary,
    fontWeight: '600',
    marginBottom: DesignSystem.spacing.sm,
  },
  userInfoText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    lineHeight: 18,
  },
  disabledCard: {
    opacity: 0.6,
  },
  disabledTitle: {
    color: DesignSystem.colors.text.secondary,
  },
  disabledButton: {
    backgroundColor: DesignSystem.colors.gray[300],
  },
  disabledButtonText: {
    color: DesignSystem.colors.text.secondary,
  },
});