/**
 * 新增組織頁面（Super Admin）
 * 建立新組織和設定管理員
 * 支援新的按用戶計費模式和簡化的訂閱方案
 */

import React, { useState } from 'react';
import {
  AdaptiveButton,
  AdaptiveInput
} from '@/components/adaptive';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Layout } from '@/components/common/Layout';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { createOrganization, CreateOrganizationData } from '@/services/firebase/admin/organizationService';
import { BILLING_CONFIG } from '@/config/billing';
import { DesignSystem } from '@/theme/designSystem';
import { toast } from '@/utils/toast';
import UserImportWizard from '@/components/users/UserImportWizard';
import { Organization } from '@/types/entities';
import { withAlpha } from '@/utils/colorUtils';

export const CreateOrganizationScreen: React.FC = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<'create' | 'import'>('create');
  const [createdOrganization, setCreatedOrganization] = useState<Organization | null>(null);
  const [showImportWizard, setShowImportWizard] = useState(false);
  
  // 組織資料
  const [orgName, setOrgName] = useState('');
  const [orgEmail, setOrgEmail] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'trial' | 'pro'>('trial');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [giftedSeats, setGiftedSeats] = useState('0');
  
  // 管理員資料
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  const plans = [
    { 
      id: 'trial', 
      name: '試用版', 
      duration: `${BILLING_CONFIG.TRIAL_DAYS}天免費`, 
      price: '免費',
      features: ['AI 助手', '語音記錄', '任務管理', '客戶管理'],
      limitations: ['功能有限', '無自訂欄位', '無 API 存取']
    },
    { 
      id: 'pro', 
      name: 'Pro 版', 
      duration: '按月或按年計費', 
      price: `NT$ ${BILLING_CONFIG.PRICE_PER_USER}/人/月`,
      features: ['所有基礎功能', '資料匯入/匯出', '自訂欄位', 'API 存取', '進階分析'],
      limitations: []
    },
  ];

  const validateForm = () => {
    if (!orgName.trim()) {
      toast.error('請輸入組織名稱');
      return false;
    }
    if (!orgEmail.trim() || !orgEmail.includes('@')) {
      toast.error('請輸入有效的組織電子郵件');
      return false;
    }
    if (!adminName.trim()) {
      toast.error('請輸入管理員姓名');
      return false;
    }
    if (!adminEmail.trim() || !adminEmail.includes('@')) {
      toast.error('請輸入有效的管理員電子郵件');
      return false;
    }
    if (giftedSeats && parseInt(giftedSeats) < 0) {
      toast.error('贈送人數不能為負數');
      return false;
    }
    if (giftedSeats && parseInt(giftedSeats) > BILLING_CONFIG.MAX_GIFTED_SEATS) {
      toast.error(`贈送人數不能超過 ${BILLING_CONFIG.MAX_GIFTED_SEATS}`);
      return false;
    }
    return true;
  };

  const handleCreateOrganization = async () => {
    console.log('建立組織按鈕被點擊');
    
    if (!validateForm()) {
      console.log('表單驗證失敗');
      return;
    }

    console.log('開始建立組織...');
    setIsLoading(true);
    try {
      // 建立組織
      const organizationData: CreateOrganizationData = {
        name: orgName,
        email: orgEmail,
        subscriptionPlan: selectedPlan,
        adminEmail: adminEmail,
        adminName: adminName,
        billingCycle: selectedPlan === 'pro' ? billingCycle : 'monthly',
        giftedSeats: parseInt(giftedSeats) || 0 };
      
      const organization = await createOrganization(organizationData);
      setCreatedOrganization(organization as Organization);

      // 詢問是否要批量匯入用戶
      Alert.alert(
        '組織建立成功',
        '是否要立即批量匯入用戶？',
        [
          {
            text: '稍後再說',
            style: 'cancel',
            onPress: () => {
              toast.success('組織建立成功！管理員帳號資訊將發送至指定信箱。');
              navigation.goBack();
            } },
          {
            text: '批量匯入用戶',
            onPress: () => {
              setCurrentStep('import');
              setShowImportWizard(true);
            } },
        ],
        { cancelable: false }
      );
    } catch (error: any) {
      console.error('建立組織失敗:', error);
      toast.error('建立組織失敗：' + (error.message || '未知錯誤'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportComplete = (result: any) => {
    if (result?.imported > 0) {
      toast.success(`成功匯入 ${result.imported} 個用戶`);
    }
    navigation.goBack();
  };

  const handleImportClose = () => {
    setShowImportWizard(false);
    navigation.goBack();
  };

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner message="正在建立組織..." />
      </Layout>
    );
  }

  // 如果正在匯入用戶階段，顯示匯入精靈
  if (currentStep === 'import' && createdOrganization) {
    return (
      <UserImportWizard
        visible={showImportWizard}
        organization={createdOrganization}
        onClose={handleImportClose}
        onImportComplete={handleImportComplete}
        useIntelligentMapping={true}
      />
    );
  }

  return (
    <Layout scrollable={false}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 組織資訊 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>組織資訊</Text>
            
            <AdaptiveInput
              label="組織名稱"
              value={orgName}
              onChangeText={setOrgName}
              placeholder="例：XX 企業"
            />

            <AdaptiveInput
              label="組織電子郵件"
              value={orgEmail}
              onChangeText={setOrgEmail}
              placeholder="contact@company.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* 訂閱方案選擇 */}
            <View style={styles.planSection}>
              <Text style={styles.inputLabel}>
                訂閱方案 <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.planGrid}>
                {plans.map((plan) => (
                  <TouchableOpacity
                    key={plan.id}
                    style={StyleSheet.flatten([
                      styles.planCard,
                      selectedPlan === plan.id && styles.planCardActive
                    ])}
                    onPress={() => setSelectedPlan(plan.id as any)}
                  >
                    <View style={styles.planHeader}>
                      <Text style={StyleSheet.flatten([
                        styles.planName,
                        selectedPlan === plan.id && styles.planNameActive
                      ])}>
                        {plan.name}
                      </Text>
                      <Text style={StyleSheet.flatten([
                        styles.planPrice,
                        selectedPlan === plan.id && styles.planPriceActive
                      ])}>
                        {plan.price}
                      </Text>
                    </View>
                    
                    <Text style={styles.planDuration}>
                      {plan.duration}
                    </Text>
                    
                    <View style={styles.planFeatures}>
                      <Text style={styles.featuresTitle}>功能包含：</Text>
                      {plan.features.map((feature, index) => (
                        <Text key={index} style={styles.featureItem}>• {feature}</Text>
                      ))}
                    </View>
                    
                    {plan.limitations.length > 0 && (
                      <View style={styles.planLimitations}>
                        <Text style={styles.limitationsTitle}>限制：</Text>
                        {plan.limitations.map((limitation, index) => (
                          <Text key={index} style={styles.limitationItem}>• {limitation}</Text>
                        ))}
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 計費週期選擇 */}
            {selectedPlan === 'pro' && (
              <View style={styles.billingCycleSection}>
                <Text style={styles.inputLabel}>
                  計費週期 <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.cycleOptions}>
                  <TouchableOpacity
                    style={StyleSheet.flatten([
                      styles.cycleOption,
                      billingCycle === 'monthly' && styles.cycleOptionActive
                    ])}
                    onPress={() => setBillingCycle('monthly')}
                  >
                    <Text style={StyleSheet.flatten([
                      styles.cycleText,
                      billingCycle === 'monthly' && styles.cycleTextActive
                    ])}>
                      月付
                    </Text>
                    <Text style={styles.cyclePrice}>NT$ {BILLING_CONFIG.PRICE_PER_USER}/人/月</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={StyleSheet.flatten([
                      styles.cycleOption,
                      billingCycle === 'yearly' && styles.cycleOptionActive
                    ])}
                    onPress={() => setBillingCycle('yearly')}
                  >
                    <Text style={StyleSheet.flatten([
                      styles.cycleText,
                      billingCycle === 'yearly' && styles.cycleTextActive
                    ])}>
                      年付
                    </Text>
                    <Text style={styles.cyclePrice}>
                      NT$ {Math.round(BILLING_CONFIG.PRICE_PER_USER * (1 - BILLING_CONFIG.YEARLY_DISCOUNT))}/人/月
                    </Text>
                    <Text style={styles.cycleDiscount}>(節省 {Math.round(BILLING_CONFIG.YEARLY_DISCOUNT * 100)}%)</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <AdaptiveInput
              label="贈送人數"
              value={giftedSeats}
              onChangeText={setGiftedSeats}
              placeholder="0"
              keyboardType="number-pad"
              helperText="不計費的用戶人數，最多 ${BILLING_CONFIG.MAX_GIFTED_SEATS} 人"
            />
          </View>

          {/* 管理員資訊 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>管理員資訊</Text>
            
            <AdaptiveInput
              label="管理員姓名"
              value={adminName}
              onChangeText={setAdminName}
              placeholder="王小明"
            />

            <AdaptiveInput
              label="管理員電子郵件"
              value={adminEmail}
              onChangeText={setAdminEmail}
              placeholder="admin@company.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

          </View>

          {/* 操作按鈕 */}
          <View style={styles.actions}>
            <AdaptiveButton
              title="建立組織"
              onPress={handleCreateOrganization}
              disabled={isLoading}
            />
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>取消</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1 },
  scrollContent: {
    padding: DesignSystem.spacing.lg },
  section: {
    marginBottom: DesignSystem.spacing.xl },
  sectionTitle: {
    ...DesignSystem.typography.h2,
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.md },
  planSection: {
    marginBottom: DesignSystem.spacing.md },
  inputLabel: {
    ...DesignSystem.typography.bodySmall,
    color: DesignSystem.colors.text.secondary,
    marginBottom: DesignSystem.spacing.sm },
  required: {
    color: DesignSystem.colors.status.error },
  planGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignSystem.spacing.sm },
  planCard: {
    flex: 1,
    minWidth: '45%',
    padding: DesignSystem.spacing.lg,
    backgroundColor: DesignSystem.colors.background.surface,
    borderRadius: DesignSystem.borderRadius.md,
    borderWidth: 2,
    borderColor: DesignSystem.colors.border.light,
    minHeight: 200 },
  planCardActive: {
    borderColor: DesignSystem.colors.primary,
    backgroundColor: withAlpha(DesignSystem.colors.primary, 0.063) },
  planName: {
    ...DesignSystem.typography.h4,
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.xs },
  planNameActive: {
    color: DesignSystem.colors.primary },
  planHeader: {
    marginBottom: DesignSystem.spacing.sm },
  planPrice: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.secondary,
    fontWeight: '600',
    marginTop: DesignSystem.spacing.xs },
  planPriceActive: {
    color: DesignSystem.colors.primary },
  planDuration: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    marginBottom: DesignSystem.spacing.md },
  planFeatures: {
    marginBottom: DesignSystem.spacing.sm },
  featuresTitle: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.primary,
    fontWeight: '600',
    marginBottom: DesignSystem.spacing.xs },
  featureItem: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.status.success,
    marginBottom: DesignSystem.spacing.xs / 2 },
  planLimitations: {
    marginTop: DesignSystem.spacing.sm },
  limitationsTitle: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    fontWeight: '600',
    marginBottom: DesignSystem.spacing.xs },
  limitationItem: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    marginBottom: DesignSystem.spacing.xs / 2 },
  billingCycleSection: {
    marginBottom: DesignSystem.spacing.md },
  cycleOptions: {
    flexDirection: 'row',
    gap: DesignSystem.spacing.sm },
  cycleOption: {
    flex: 1,
    padding: DesignSystem.spacing.md,
    backgroundColor: DesignSystem.colors.background.surface,
    borderRadius: DesignSystem.borderRadius.sm,
    borderWidth: 2,
    borderColor: DesignSystem.colors.border.light,
    alignItems: 'center' },
  cycleOptionActive: {
    borderColor: DesignSystem.colors.primary,
    backgroundColor: withAlpha(DesignSystem.colors.primary, 0.063) },
  cycleText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary,
    fontWeight: '600',
    marginBottom: DesignSystem.spacing.xs },
  cycleTextActive: {
    color: DesignSystem.colors.primary },
  cyclePrice: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary },
  cycleDiscount: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.status.success,
    fontWeight: '600',
    marginTop: DesignSystem.spacing.xs / 2 },
  actions: {
    gap: DesignSystem.spacing.md,
    marginTop: DesignSystem.spacing.xl },
  cancelButton: {
    paddingVertical: DesignSystem.spacing.md,
    alignItems: 'center' },
  cancelButtonText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.secondary } });