/**
 * 步驟 3: 用戶匯入 V2 - 使用新的智能映射系統
 * Step 3: User Import V2 with Intelligent Mapping
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignSystem } from '@/theme/designSystem';
import { StepProps, UserImportData } from '@/types/onboarding';
import UserImportWizard from '@/components/users/UserImportWizard';
import { Organization } from '@/types/entities';
import { showSuccessToast } from '@/utils/toast';

const UserImportStepV2: React.FC<StepProps> = ({
  data,
  onChange,
  onValidate,
  isActive,
}) => {
  const colors = DesignSystem.colors;
  
  // 狀態
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [formData, setFormData] = useState<UserImportData>({
    importMethod: 'csv',
    users: [],
    googleAuthConfig: {
      enabled: false,
      domain: '',
      autoCreateUsers: true,
      syncGroups: false,
      groupMappings: [],
    },
    passwordStrategy: {
      type: 'auto-generate',
      requireChange: true,
    },
    sendWelcomeEmail: true,
    ...data,
  });

  // 當資料變更時通知父元件
  useEffect(() => {
    if (isActive) {
      onChange(formData);
    }
  }, [formData, isActive]);

  // 處理匯入完成
  const handleImportComplete = (result: any) => {
    setImportResult(result);
    setShowImportWizard(false);
    
    if (result?.imported > 0) {
      showSuccessToast(`成功匯入 ${result.imported} 個用戶`);
      
      // 更新 formData 中的用戶列表
      setFormData(prev => ({
        ...prev,
        users: [
          ...prev.users,
          ...Array(result.imported).fill(null).map((_, i) => ({
            email: `imported_user_${i}@example.com`,
            name: `匯入用戶 ${i + 1}`,
            role: 'user',
            authMethod: 'password',
          })),
        ],
      }));
    }
  };

  // 模擬組織資料（在實際使用時應該從父元件傳入）
  const mockOrganization: Organization = {
    id: data?.organizationId || 'temp-org',
    name: data?.organizationName || '新組織',
    email: data?.organizationEmail || 'contact@org.com',
    adminEmail: data?.adminEmail || 'admin@org.com',
    plan: 'pro',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userCount: 0,
    activeUserCount: 0,
    billingCycle: 'monthly',
    isSuperAdmin: false,
  };

  // 渲染 Google 登入設定
  const renderGoogleAuthSettings = () => {
    return (
      <View style={styles.authSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>登入設定</Text>
        </View>
        
        <View style={styles.switchRow}>
          <View style={styles.switchContent}>
            <Text style={styles.switchLabel}>啟用 Google 登入</Text>
            <Text style={styles.switchHint}>允許用戶使用 Google 帳號登入</Text>
          </View>
          <Switch
            value={formData.googleAuthConfig?.enabled}
            onValueChange={(value) => setFormData(prev => ({
              ...prev,
              googleAuthConfig: {
                ...prev.googleAuthConfig!,
                enabled: value,
              },
            }))}
            trackColor={{ false: colors.gray300, true: colors.primary }}
          />
        </View>
      </View>
    );
  };

  // 渲染密碼策略
  const renderPasswordStrategy = () => {
    return (
      <View style={styles.passwordSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="lock-closed-outline" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>密碼策略</Text>
        </View>
        
        <View style={styles.switchRow}>
          <View style={styles.switchContent}>
            <Text style={styles.switchLabel}>自動生成密碼</Text>
            <Text style={styles.switchHint}>系統自動為用戶生成安全密碼</Text>
          </View>
          <Switch
            value={formData.passwordStrategy.type === 'auto-generate'}
            onValueChange={(value) => setFormData(prev => ({
              ...prev,
              passwordStrategy: {
                ...prev.passwordStrategy,
                type: value ? 'auto-generate' : 'send-reset',
              },
            }))}
            trackColor={{ false: colors.gray300, true: colors.primary }}
          />
        </View>
        
        <View style={styles.switchRow}>
          <View style={styles.switchContent}>
            <Text style={styles.switchLabel}>首次登入強制變更密碼</Text>
            <Text style={styles.switchHint}>用戶首次登入時必須設定新密碼</Text>
          </View>
          <Switch
            value={formData.passwordStrategy.requireChange}
            onValueChange={(value) => setFormData(prev => ({
              ...prev,
              passwordStrategy: {
                ...prev.passwordStrategy,
                requireChange: value,
              },
            }))}
            trackColor={{ false: colors.gray300, true: colors.primary }}
          />
        </View>
      </View>
    );
  };

  // 渲染歡迎郵件設定
  const renderWelcomeEmailSettings = () => {
    return (
      <View style={styles.emailSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="mail-outline" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>通知設定</Text>
        </View>
        
        <View style={styles.switchRow}>
          <View style={styles.switchContent}>
            <Text style={styles.switchLabel}>發送歡迎郵件</Text>
            <Text style={styles.switchHint}>向新用戶發送帳號資訊和登入指引</Text>
          </View>
          <Switch
            value={formData.sendWelcomeEmail}
            onValueChange={(value) => setFormData(prev => ({
              ...prev,
              sendWelcomeEmail: value,
            }))}
            trackColor={{ false: colors.gray300, true: colors.primary }}
          />
        </View>
      </View>
    );
  };

  // 渲染匯入結果摘要
  const renderImportSummary = () => {
    if (!importResult) return null;
    
    return (
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Ionicons 
            name={importResult.success ? "checkmark-circle" : "alert-circle"} 
            size={24} 
            color={importResult.success ? colors.success : colors.error} 
          />
          <Text style={styles.summaryTitle}>
            {importResult.success ? '匯入成功' : '匯入部分成功'}
          </Text>
        </View>
        
        <View style={styles.summaryStats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>成功匯入</Text>
            <Text style={styles.statValue}>{importResult.imported || 0}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>失敗</Text>
            <Text style={styles.statValue}>{importResult.failed || 0}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>跳過</Text>
            <Text style={styles.statValue}>{importResult.skipped || 0}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* 主要操作區 */}
        <View style={styles.mainSection}>
          <View style={styles.importPrompt}>
            <Ionicons name="people-outline" size={48} color={colors.primary} />
            <Text style={styles.promptTitle}>批量匯入用戶</Text>
            <Text style={styles.promptDescription}>
              使用智能欄位映射系統，支援 CSV、Excel 檔案上傳，
              自動識別中英文欄位名稱
            </Text>
            
            <TouchableOpacity
              style={styles.importButton}
              onPress={() => setShowImportWizard(true)}
            >
              <Ionicons name="cloud-upload-outline" size={20} color={colors.white} />
              <Text style={styles.importButtonText}>開始匯入用戶</Text>
            </TouchableOpacity>
          </View>
          
          {/* 匯入結果摘要 */}
          {renderImportSummary()}
          
          {/* 已匯入用戶數量 */}
          {formData.users.length > 0 && (
            <View style={styles.userCount}>
              <Ionicons name="people" size={20} color={colors.primary} />
              <Text style={styles.userCountText}>
                已設定 {formData.users.length} 個用戶
              </Text>
            </View>
          )}
        </View>
        
        {/* 設定區域 */}
        <View style={styles.settingsSection}>
          {renderGoogleAuthSettings()}
          {renderPasswordStrategy()}
          {renderWelcomeEmailSettings()}
        </View>
        
        {/* 提示訊息 */}
        <View style={styles.tipCard}>
          <Ionicons name="information-circle-outline" size={20} color={colors.info} />
          <Text style={styles.tipText}>
            您可以稍後在組織管理頁面中隨時新增或移除用戶
          </Text>
        </View>
      </ScrollView>
      
      {/* 智能匯入精靈 Modal */}
      {showImportWizard && (
        <UserImportWizard
          visible={showImportWizard}
          organization={mockOrganization}
          onClose={() => setShowImportWizard(false)}
          onImportComplete={handleImportComplete}
          useIntelligentMapping={true}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainSection: {
    marginBottom: 24,
  },
  importPrompt: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: DesignSystem.colors.background.surface,
    borderRadius: 12,
    marginBottom: 16,
  },
  promptTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  promptDescription: {
    fontSize: 14,
    color: DesignSystem.colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
    marginBottom: 24,
  },
  importButton: {
    flexDirection: 'row',
    backgroundColor: DesignSystem.colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 8,
  },
  importButtonText: {
    color: DesignSystem.colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: DesignSystem.colors.background.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.light,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: DesignSystem.colors.text.secondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
  },
  userCount: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: `${DesignSystem.colors.primary}10`,
    borderRadius: 8,
  },
  userCountText: {
    fontSize: 14,
    fontWeight: '500',
    color: DesignSystem.colors.primary,
  },
  settingsSection: {
    gap: 16,
  },
  authSection: {
    backgroundColor: DesignSystem.colors.background.surface,
    borderRadius: 8,
    padding: 16,
  },
  passwordSection: {
    backgroundColor: DesignSystem.colors.background.surface,
    borderRadius: 8,
    padding: 16,
  },
  emailSection: {
    backgroundColor: DesignSystem.colors.background.surface,
    borderRadius: 8,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchContent: {
    flex: 1,
    marginRight: 12,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: DesignSystem.colors.text.primary,
  },
  switchHint: {
    fontSize: 12,
    color: DesignSystem.colors.text.secondary,
    marginTop: 2,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: `${DesignSystem.colors.info}10`,
    borderRadius: 8,
    padding: 12,
    marginTop: 24,
    gap: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: DesignSystem.colors.info,
    lineHeight: 18,
  },
});

export default UserImportStepV2;