/**
 * 權限管理區塊組件
 * 管理組織的功能權限、工具存取和用戶角色
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { updateOrganization } from '@/services/firebase/admin/organizationService';
import { TOOL_TYPES } from '@/services/firebase/admin/toolUsageService';
import { Organization } from '@/types/entities';
import { DesignSystem } from '@/theme/designSystem';
import { toast } from '@/utils/toast';

interface PermissionsManagementSectionProps {
  organization: Organization;
  onUpdate?: () => void;
  isEditing?: boolean;
}

interface FeaturePermissions {
  allowDataImport: boolean;
  allowDataExport: boolean;
  allowCustomFields: boolean;
  allowAPIAccess: boolean;
  allowAdvancedAnalytics: boolean;
  allowBulkOperations: boolean;
}

interface ToolAccess {
  [key: string]: boolean;
}

interface UserRoleSettings {
  maxAdmins: number;
  allowUserSelfRegistration: boolean;
  requireAdminApproval: boolean;
  allowGuestAccess: boolean;
}

export const PermissionsManagementSection: React.FC<PermissionsManagementSectionProps> = ({
  organization,
  onUpdate,
  isEditing = false,
}) => {
  const [permissions, setPermissions] = useState<FeaturePermissions>({
    allowDataImport: true,
    allowDataExport: true,
    allowCustomFields: false,
    allowAPIAccess: false,
    allowAdvancedAnalytics: false,
    allowBulkOperations: false,
  });

  const [toolAccess, setToolAccess] = useState<ToolAccess>({});
  const [roleSettings, setRoleSettings] = useState<UserRoleSettings>({
    maxAdmins: 3,
    allowUserSelfRegistration: true,
    requireAdminApproval: false,
    allowGuestAccess: false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'features' | 'tools' | 'roles'>('features');

  useEffect(() => {
    loadPermissions();
  }, [organization]);

  const loadPermissions = () => {
    // 從組織設定載入權限
    const settings = organization.settings || {};
    
    setPermissions({
      allowDataImport: settings.allowDataImport ?? true,
      allowDataExport: settings.allowDataExport ?? true,
      allowCustomFields: settings.allowCustomFields ?? (organization.subscriptionPlan === 'pro'),
      allowAPIAccess: settings.allowAPIAccess ?? (organization.subscriptionPlan === 'pro'),
      allowAdvancedAnalytics: settings.allowAdvancedAnalytics ?? (organization.subscriptionPlan === 'pro'),
      allowBulkOperations: settings.allowBulkOperations ?? (organization.subscriptionPlan === 'pro'),
    });

    // 載入工具存取權限
    const tools: ToolAccess = {};
    Object.values(TOOL_TYPES).forEach(toolId => {
      tools[toolId] = settings.enabledTools?.includes(toolId) ?? getDefaultToolAccess(toolId);
    });
    setToolAccess(tools);

    // 載入用戶角色設定
    setRoleSettings({
      maxAdmins: settings.maxAdmins ?? 3,
      allowUserSelfRegistration: settings.allowUserSelfRegistration ?? true,
      requireAdminApproval: settings.requireAdminApproval ?? false,
      allowGuestAccess: settings.allowGuestAccess ?? false,
    });
  };

  const getDefaultToolAccess = (toolId: string): boolean => {
    // 基本工具對所有方案開放
    const basicTools = [
      TOOL_TYPES.AI_ASSISTANT,
      TOOL_TYPES.VOICE_RECORDER,
      TOOL_TYPES.TASK_MANAGER,
      TOOL_TYPES.CUSTOMER_MANAGER,
    ];

    // Pro 工具只對 Pro 方案開放
    const proTools = [
      TOOL_TYPES.DATA_IMPORT,
      TOOL_TYPES.DATA_EXPORT,
      TOOL_TYPES.ANALYTICS,
      TOOL_TYPES.REPORT_GENERATOR,
    ];

    if (basicTools.includes(toolId)) {
      return true;
    }

    if (proTools.includes(toolId)) {
      return organization.subscriptionPlan === 'pro';
    }

    return false;
  };

  const handleSavePermissions = async () => {
    setIsSaving(true);
    try {
      // 準備更新的設定
      const enabledTools = Object.entries(toolAccess)
        .filter(([, enabled]) => enabled)
        .map(([toolId]) => toolId);

      const updatedSettings = {
        ...permissions,
        ...roleSettings,
        enabledTools,
      };

      await updateOrganization(organization.id, {
        settings: updatedSettings,
      });

      toast.success('權限設定已更新');
      onUpdate?.();
    } catch (error) {
      console.error('更新權限設定失敗:', error);
      toast.error('更新失敗');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    Alert.alert(
      '重設為預設值',
      '確定要將所有權限重設為預設值嗎？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '重設',
          style: 'destructive',
          onPress: () => {
            loadPermissions();
            toast.success('已重設為預設值');
          },
        },
      ]
    );
  };

  const isProFeature = (feature: string): boolean => {
    const proFeatures = ['allowCustomFields', 'allowAPIAccess', 'allowAdvancedAnalytics', 'allowBulkOperations'];
    return proFeatures.includes(feature) && organization.subscriptionPlan === 'trial';
  };

  const getToolName = (toolId: string): string => {
    const toolNames: Record<string, string> = {
      [TOOL_TYPES.AI_ASSISTANT]: 'AI 助手',
      [TOOL_TYPES.VOICE_RECORDER]: '語音記錄',
      [TOOL_TYPES.DATA_IMPORT]: '資料匯入',
      [TOOL_TYPES.DATA_EXPORT]: '資料匯出',
      [TOOL_TYPES.ANALYTICS]: '數據分析',
      [TOOL_TYPES.TASK_MANAGER]: '任務管理',
      [TOOL_TYPES.CUSTOMER_MANAGER]: '客戶管理',
      [TOOL_TYPES.REPORT_GENERATOR]: '報表生成',
    };
    return toolNames[toolId] || toolId;
  };

  const getToolDescription = (toolId: string): string => {
    const descriptions: Record<string, string> = {
      [TOOL_TYPES.AI_ASSISTANT]: '智能對話和問答功能',
      [TOOL_TYPES.VOICE_RECORDER]: '語音記錄和轉文字功能',
      [TOOL_TYPES.DATA_IMPORT]: '匯入外部資料檔案',
      [TOOL_TYPES.DATA_EXPORT]: '匯出資料為各種格式',
      [TOOL_TYPES.ANALYTICS]: '數據統計和分析圖表',
      [TOOL_TYPES.TASK_MANAGER]: '任務建立和進度追蹤',
      [TOOL_TYPES.CUSTOMER_MANAGER]: '客戶資料管理',
      [TOOL_TYPES.REPORT_GENERATOR]: '自動生成各種報表',
    };
    return descriptions[toolId] || '功能描述';
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 分頁標籤 */}
      <View style={styles.tabContainer}>
        {[
          { key: 'features', label: '功能權限', icon: 'settings-outline' },
          { key: 'tools', label: '工具存取', icon: 'build-outline' },
          { key: 'roles', label: '用戶角色', icon: 'people-outline' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Ionicons
              name={tab.icon as any}
              size={16}
              color={activeTab === tab.key ? DesignSystem.colors.text.inverse : DesignSystem.colors.text.secondary}
            />
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 功能權限分頁 */}
      {activeTab === 'features' && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>功能權限</Text>
            <Text style={styles.sectionDesc}>控制組織可使用的系統功能</Text>
          </View>

          <View style={styles.permissionItem}>
            <View style={styles.permissionInfo}>
              <Text style={styles.permissionName}>資料匯入</Text>
              <Text style={styles.permissionDesc}>允許匯入 CSV/Excel 檔案</Text>
            </View>
            <Switch
              value={permissions.allowDataImport}
              onValueChange={(value) => setPermissions({ ...permissions, allowDataImport: value })}
              disabled={!isEditing}
            />
          </View>

          <View style={styles.permissionItem}>
            <View style={styles.permissionInfo}>
              <Text style={styles.permissionName}>資料匯出</Text>
              <Text style={styles.permissionDesc}>允許匯出資料為各種格式</Text>
            </View>
            <Switch
              value={permissions.allowDataExport}
              onValueChange={(value) => setPermissions({ ...permissions, allowDataExport: value })}
              disabled={!isEditing}
            />
          </View>

          <View style={styles.permissionItem}>
            <View style={styles.permissionInfo}>
              <Text style={styles.permissionName}>自訂欄位</Text>
              <Text style={styles.permissionDesc}>允許建立客戶自訂欄位</Text>
              {isProFeature('allowCustomFields') && (
                <Text style={styles.proLabel}>Pro 功能</Text>
              )}
            </View>
            <Switch
              value={permissions.allowCustomFields}
              onValueChange={(value) => setPermissions({ ...permissions, allowCustomFields: value })}
              disabled={!isEditing || isProFeature('allowCustomFields')}
            />
          </View>

          <View style={styles.permissionItem}>
            <View style={styles.permissionInfo}>
              <Text style={styles.permissionName}>API 存取</Text>
              <Text style={styles.permissionDesc}>允許使用 API 進行系統整合</Text>
              {isProFeature('allowAPIAccess') && (
                <Text style={styles.proLabel}>Pro 功能</Text>
              )}
            </View>
            <Switch
              value={permissions.allowAPIAccess}
              onValueChange={(value) => setPermissions({ ...permissions, allowAPIAccess: value })}
              disabled={!isEditing || isProFeature('allowAPIAccess')}
            />
          </View>

          <View style={styles.permissionItem}>
            <View style={styles.permissionInfo}>
              <Text style={styles.permissionName}>進階分析</Text>
              <Text style={styles.permissionDesc}>使用進階數據分析功能</Text>
              {isProFeature('allowAdvancedAnalytics') && (
                <Text style={styles.proLabel}>Pro 功能</Text>
              )}
            </View>
            <Switch
              value={permissions.allowAdvancedAnalytics}
              onValueChange={(value) => setPermissions({ ...permissions, allowAdvancedAnalytics: value })}
              disabled={!isEditing || isProFeature('allowAdvancedAnalytics')}
            />
          </View>

          <View style={styles.permissionItem}>
            <View style={styles.permissionInfo}>
              <Text style={styles.permissionName}>批量操作</Text>
              <Text style={styles.permissionDesc}>允許批量編輯和處理資料</Text>
              {isProFeature('allowBulkOperations') && (
                <Text style={styles.proLabel}>Pro 功能</Text>
              )}
            </View>
            <Switch
              value={permissions.allowBulkOperations}
              onValueChange={(value) => setPermissions({ ...permissions, allowBulkOperations: value })}
              disabled={!isEditing || isProFeature('allowBulkOperations')}
            />
          </View>
        </View>
      )}

      {/* 工具存取分頁 */}
      {activeTab === 'tools' && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>工具存取</Text>
            <Text style={styles.sectionDesc}>管理組織可使用的工具</Text>
          </View>

          {Object.values(TOOL_TYPES).map((toolId) => {
            const isProTool = !getDefaultToolAccess(toolId) && organization.subscriptionPlan === 'trial';
            return (
              <View key={toolId} style={styles.toolItem}>
                <View style={styles.toolInfo}>
                  <Text style={styles.toolName}>{getToolName(toolId)}</Text>
                  <Text style={styles.toolDesc}>{getToolDescription(toolId)}</Text>
                  {isProTool && (
                    <Text style={styles.proLabel}>Pro 功能</Text>
                  )}
                </View>
                <Switch
                  value={toolAccess[toolId] || false}
                  onValueChange={(value) => setToolAccess({ ...toolAccess, [toolId]: value })}
                  disabled={!isEditing || isProTool}
                />
              </View>
            );
          })}
        </View>
      )}

      {/* 用戶角色分頁 */}
      {activeTab === 'roles' && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>用戶角色設定</Text>
            <Text style={styles.sectionDesc}>管理用戶權限和存取控制</Text>
          </View>

          <View style={styles.roleItem}>
            <View style={styles.roleInfo}>
              <Text style={styles.roleName}>管理員人數上限</Text>
              <Text style={styles.roleDesc}>組織中最多可有幾位管理員</Text>
            </View>
            <View style={styles.numberInput}>
              <TouchableOpacity
                style={styles.numberButton}
                onPress={() => setRoleSettings({
                  ...roleSettings,
                  maxAdmins: Math.max(1, roleSettings.maxAdmins - 1)
                })}
                disabled={!isEditing}
              >
                <Ionicons name="remove" size={16} color={DesignSystem.colors.text.secondary} />
              </TouchableOpacity>
              <Text style={styles.numberValue}>{roleSettings.maxAdmins}</Text>
              <TouchableOpacity
                style={styles.numberButton}
                onPress={() => setRoleSettings({
                  ...roleSettings,
                  maxAdmins: Math.min(10, roleSettings.maxAdmins + 1)
                })}
                disabled={!isEditing}
              >
                <Ionicons name="add" size={16} color={DesignSystem.colors.text.secondary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.permissionItem}>
            <View style={styles.permissionInfo}>
              <Text style={styles.permissionName}>用戶自註冊</Text>
              <Text style={styles.permissionDesc}>允許用戶自行註冊加入組織</Text>
            </View>
            <Switch
              value={roleSettings.allowUserSelfRegistration}
              onValueChange={(value) => setRoleSettings({ ...roleSettings, allowUserSelfRegistration: value })}
              disabled={!isEditing}
            />
          </View>

          <View style={styles.permissionItem}>
            <View style={styles.permissionInfo}>
              <Text style={styles.permissionName}>需要管理員審核</Text>
              <Text style={styles.permissionDesc}>新用戶需要管理員審核才能啟用</Text>
            </View>
            <Switch
              value={roleSettings.requireAdminApproval}
              onValueChange={(value) => setRoleSettings({ ...roleSettings, requireAdminApproval: value })}
              disabled={!isEditing}
            />
          </View>

          <View style={styles.permissionItem}>
            <View style={styles.permissionInfo}>
              <Text style={styles.permissionName}>訪客存取</Text>
              <Text style={styles.permissionDesc}>允許訪客以唯讀方式存取系統</Text>
            </View>
            <Switch
              value={roleSettings.allowGuestAccess}
              onValueChange={(value) => setRoleSettings({ ...roleSettings, allowGuestAccess: value })}
              disabled={!isEditing}
            />
          </View>
        </View>
      )}

      {/* 操作按鈕 */}
      {isEditing && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSavePermissions}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? '儲存中...' : '儲存設定'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleResetToDefaults}
            disabled={isSaving}
          >
            <Text style={styles.resetButtonText}>重設為預設值</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 權限摘要 */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>權限摘要</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>啟用功能</Text>
          <Text style={styles.summaryValue}>
            {Object.values(permissions).filter(Boolean).length} / {Object.keys(permissions).length}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>可用工具</Text>
          <Text style={styles.summaryValue}>
            {Object.values(toolAccess).filter(Boolean).length} / {Object.keys(toolAccess).length}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>管理員上限</Text>
          <Text style={styles.summaryValue}>{roleSettings.maxAdmins} 人</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DesignSystem.spacing.xs,
    paddingVertical: DesignSystem.spacing.sm,
    paddingHorizontal: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borderRadius.sm,
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
  sectionCard: {
    backgroundColor: DesignSystem.colors.background.surface,
    padding: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.borderRadius.md,
    marginBottom: DesignSystem.spacing.md,
    ...DesignSystem.shadows.sm,
  },
  sectionHeader: {
    marginBottom: DesignSystem.spacing.lg,
  },
  sectionTitle: {
    ...DesignSystem.typography.h4,
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.xs,
  },
  sectionDesc: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.secondary,
  },
  permissionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: DesignSystem.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light,
  },
  permissionInfo: {
    flex: 1,
    marginRight: DesignSystem.spacing.md,
  },
  permissionName: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary,
    fontWeight: '500',
    marginBottom: DesignSystem.spacing.xs,
  },
  permissionDesc: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
  },
  proLabel: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.warning,
    fontWeight: '600',
    marginTop: DesignSystem.spacing.xs,
  },
  toolItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: DesignSystem.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light,
  },
  toolInfo: {
    flex: 1,
    marginRight: DesignSystem.spacing.md,
  },
  toolName: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary,
    fontWeight: '500',
    marginBottom: DesignSystem.spacing.xs,
  },
  toolDesc: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
  },
  roleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: DesignSystem.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light,
  },
  roleInfo: {
    flex: 1,
    marginRight: DesignSystem.spacing.md,
  },
  roleName: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary,
    fontWeight: '500',
    marginBottom: DesignSystem.spacing.xs,
  },
  roleDesc: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
  },
  numberInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSystem.spacing.sm,
  },
  numberButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: DesignSystem.colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.light,
  },
  numberValue: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary,
    fontWeight: '500',
    minWidth: 24,
    textAlign: 'center',
  },
  actions: {
    gap: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.lg,
  },
  saveButton: {
    backgroundColor: DesignSystem.colors.primary,
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.borderRadius.sm,
    alignItems: 'center',
  },
  saveButtonText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.inverse,
    fontWeight: '500',
  },
  resetButton: {
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.borderRadius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.default,
  },
  resetButtonText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.secondary,
  },
  summaryCard: {
    backgroundColor: DesignSystem.colors.background.primary,
    padding: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.borderRadius.md,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.light,
  },
  summaryTitle: {
    ...DesignSystem.typography.h4,
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: DesignSystem.spacing.sm,
  },
  summaryLabel: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.secondary,
  },
  summaryValue: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary,
    fontWeight: '500',
  },
});