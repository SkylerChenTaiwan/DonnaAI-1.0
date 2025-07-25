/**
 * 組織詳情頁面（Super Admin）
 * 檢視和編輯組織設定
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
  deleteOrganization 
} from '@/services/firebase/admin/organizationService';
import { Organization } from '@/types/entities';
import { RootStackParamList } from '@/types/navigation';
import { DesignSystem } from '@/theme/designSystem';
import { toast } from '@/utils/toast';

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
    contactEmail: '',
    maxUsers: '',
    aiMinutesQuota: '',
    status: 'active' as 'active' | 'suspended' | 'cancelled',
  });

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
          contactEmail: orgData.contactEmail || '',
          maxUsers: String(orgData.maxUsers || 0),
          aiMinutesQuota: String(orgData.aiMinutesQuota || 0),
          status: orgData.status || 'active',
        });
        
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

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      await updateOrganization(organizationId, {
        name: formData.name,
        contactEmail: formData.contactEmail,
        maxUsers: parseInt(formData.maxUsers) || 0,
        aiMinutesQuota: parseInt(formData.aiMinutesQuota) || 0,
        status: formData.status,
        features,
      });

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
                value={formData.contactEmail}
                onChangeText={(text) => setFormData({ ...formData, contactEmail: text })}
                placeholder="contact@company.com"
                keyboardType="email-address"
              />
              <TextInput
                label="最大用戶數"
                value={formData.maxUsers}
                onChangeText={(text) => setFormData({ ...formData, maxUsers: text })}
                placeholder="10"
                keyboardType="number-pad"
              />
              <TextInput
                label="AI 分鐘配額"
                value={formData.aiMinutesQuota}
                onChangeText={(text) => setFormData({ ...formData, aiMinutesQuota: text })}
                placeholder="1000"
                keyboardType="number-pad"
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
                <Text style={styles.value}>{organization.contactEmail || '未設定'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>訂閱方案</Text>
                <Text style={styles.value}>
                  {(organization.subscriptionPlan || 'basic').toUpperCase()}
                </Text>
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

        {/* 使用統計 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>使用統計</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{organization.currentUsers || 0}</Text>
              <Text style={styles.statLabel}>目前用戶</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{organization.maxUsers || 0}</Text>
              <Text style={styles.statLabel}>用戶上限</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{organization.aiMinutesUsed || 0}</Text>
              <Text style={styles.statLabel}>已用 AI 分鐘</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{organization.aiMinutesQuota || 0}</Text>
              <Text style={styles.statLabel}>AI 分鐘配額</Text>
            </View>
          </View>
        </View>

        {/* 功能設定 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>功能設定</Text>
          
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
              disabled={!isEditing}
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
              disabled={!isEditing}
            />
          </View>
        </View>

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
});