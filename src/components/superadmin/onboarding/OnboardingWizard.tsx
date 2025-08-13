import { Icon } from '../../../components/common/Icon';
/**
 * 組織入職精靈主元件
 * Organization Onboarding Wizard Main Component
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform } from 'react-native';
// Icon import removed - using platform-specific Icon component;
import { DesignSystem } from '@/theme/designSystem';
import {
  OnboardingWizardProps,
  OnboardingWizardState,
  OnboardingSession,
  OnboardingStep,
  ValidationResult } from '@/types/onboarding';
import {
  createOnboardingSession,
  getOnboardingSession,
  saveOnboardingProgress,
  saveStepData,
  markStepCompleted,
  executeOnboarding,
  validateBasicInfo,
  validateBillingPlan,
  validateUserImport,
  validateWelcomeSetup } from '@/services/firebase/onboardingService';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { useAuthStore } from '@/stores/authStore';
import { getFirebaseAuth } from '@/services/firebase/config';

// 匯入步驟元件
import BasicInfoStep from './steps/BasicInfoStep';
import SimpleBillingStep from './steps/SimpleBillingStep';
import UserImportStepV2 from './steps/UserImportStepV2';
import WelcomeSetupStep from './steps/WelcomeSetupStep';
import { withAlpha } from '@/utils/colorUtils';

// 定義精靈步驟
const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'basic-info',
    title: '組織基本資訊',
    description: '設定組織名稱、聯絡資訊等',
    component: BasicInfoStep,
    validation: validateBasicInfo,
    canSkip: false },
  {
    id: 'billing-plan',
    title: '設定組織人數',
    description: '設定組織人數與計費',
    component: SimpleBillingStep,
    validation: validateBillingPlan,
    canSkip: false },
  {
    id: 'user-import',
    title: '匯入用戶',
    description: '批量建立組織用戶',
    component: UserImportStepV2,
    validation: validateUserImport,
    canSkip: true },
  {
    id: 'welcome-setup',
    title: '歡迎設定',
    description: '發送歡迎郵件和初始設定',
    component: WelcomeSetupStep,
    validation: validateWelcomeSetup,
    canSkip: true },
];

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  mode = 'create',
  sessionId,
  onComplete,
  onCancel,
  onSaveDraft }) => {
  const colors = DesignSystem.colors;
  
  // 精靈狀態
  const [state, setState] = useState<OnboardingWizardState>({
    session: null,
    isLoading: true,
    isSaving: false,
    currentStep: 0,
    completedSteps: new Set(),
    validationErrors: {},
    canProceed: false,
    canGoBack: false });

  // 初始化會話
  useEffect(() => {
    initializeSession();
  }, [mode, sessionId]);

  // 更新導航狀態
  useEffect(() => {
    setState(prev => ({
      ...prev,
      canGoBack: prev.currentStep > 0,
      canProceed: !state.isLoading && !state.isSaving }));
  }, [state.currentStep, state.isLoading, state.isSaving]);

  // 初始化會話
  const initializeSession = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      let session: OnboardingSession | null = null;
      
      if (mode === 'resume' && sessionId) {
        // 恢復現有會話
        session = await getOnboardingSession(sessionId);
        if (!session) {
          showErrorToast('找不到會話');
          onCancel();
          return;
        }
      } else {
        // 建立新會話
        const userAuth = await getUserAuth(); // 需要實作取得當前用戶
        session = await createOnboardingSession(userAuth.uid);
      }
      
      setState(prev => ({
        ...prev,
        session,
        currentStep: session.currentStep || 0,
        completedSteps: new Set(session.completedSteps || []),
        isLoading: false }));
    } catch (error) {
      console.error('初始化會話失敗:', error);
      showErrorToast('初始化失敗');
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // 取得當前用戶
  const getUserAuth = async () => {
    const auth = getFirebaseAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('用戶未登入');
    }
    
    return { uid: currentUser.uid };
  };

  // 儲存步驟資料
  const handleStepDataChange = useCallback(async (stepKey: string, data: any) => {
    if (!state.session) return;
    
    try {
      setState(prev => ({ ...prev, isSaving: true }));
      
      // 更新本地狀態
      setState(prev => ({
        ...prev,
        session: prev.session ? {
          ...prev.session,
          stepData: {
            ...prev.session.stepData,
            [stepKey]: data } } : null }));
      
      // 儲存到資料庫
      await saveStepData(state.session.id, stepKey as any, data);
      
      setState(prev => ({ ...prev, isSaving: false }));
    } catch (error) {
      console.error('儲存步驟資料失敗:', error);
      showErrorToast('儲存失敗');
      setState(prev => ({ ...prev, isSaving: false }));
    }
  }, [state.session]);

  // 驗證當前步驟
  const validateCurrentStep = async (): Promise<ValidationResult> => {
    const currentStepDef = ONBOARDING_STEPS[state.currentStep];
    const stepKey = getStepKey(state.currentStep);
    const stepData = state.session?.stepData[stepKey];
    
    if (!stepData && !currentStepDef.canSkip) {
      return {
        isValid: false,
        errors: [{
          field: 'general',
          message: '請完成此步驟',
          severity: 'error' }] };
    }
    
    if (stepData) {
      return await currentStepDef.validation(stepData);
    }
    
    return { isValid: true, errors: [] };
  };

  // 前往下一步
  const handleNext = async () => {
    if (!state.session) return;
    
    // 驗證當前步驟
    const validation = await validateCurrentStep();
    if (!validation.isValid) {
      setState(prev => ({
        ...prev,
        validationErrors: {
          [state.currentStep]: validation.errors } }));
      showErrorToast('請修正錯誤後繼續');
      return;
    }
    
    // 標記步驟完成
    const currentStepId = ONBOARDING_STEPS[state.currentStep].id;
    await markStepCompleted(state.session.id, currentStepId);
    
    // 更新狀態
    setState(prev => ({
      ...prev,
      currentStep: prev.currentStep + 1,
      completedSteps: new Set([...prev.completedSteps, currentStepId]),
      validationErrors: {} }));
    
    // 儲存進度
    await saveOnboardingProgress(state.session.id, {
      currentStep: state.currentStep + 1 });
  };

  // 返回上一步
  const handleBack = async () => {
    if (state.currentStep <= 0) return;
    
    setState(prev => ({
      ...prev,
      currentStep: prev.currentStep - 1,
      validationErrors: {} }));
    
    if (state.session) {
      await saveOnboardingProgress(state.session.id, {
        currentStep: state.currentStep - 1 });
    }
  };

  // 跳過當前步驟
  const handleSkip = async () => {
    const currentStepDef = ONBOARDING_STEPS[state.currentStep];
    
    if (!currentStepDef.canSkip) {
      showErrorToast('此步驟不可跳過');
      return;
    }
    
    await handleNext();
  };

  // 儲存草稿
  const handleSaveDraft = async () => {
    if (!state.session) return;
    
    try {
      setState(prev => ({ ...prev, isSaving: true }));
      
      await saveOnboardingProgress(state.session.id, {
        status: 'draft' });
      
      showSuccessToast('草稿已儲存');
      
      if (onSaveDraft) {
        onSaveDraft(state.session.id);
      }
      
      setState(prev => ({ ...prev, isSaving: false }));
    } catch (error) {
      console.error('儲存草稿失敗:', error);
      showErrorToast('儲存失敗');
      setState(prev => ({ ...prev, isSaving: false }));
    }
  };

  // 完成入職流程
  const handleComplete = async () => {
    if (!state.session) return;
    
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      // 驗證所有必要步驟
      for (let i = 0; i < ONBOARDING_STEPS.length; i++) {
        const step = ONBOARDING_STEPS[i];
        if (!step.canSkip) {
          const stepKey = getStepKey(i);
          const stepData = state.session.stepData[stepKey];
          
          if (!stepData) {
            showErrorToast(`請完成步驟：${step.title}`);
            setState(prev => ({ ...prev, isLoading: false }));
            return;
          }
          
          const validation = await step.validation(stepData);
          if (!validation.isValid) {
            showErrorToast(`步驟 ${step.title} 有錯誤`);
            setState(prev => ({ ...prev, isLoading: false }));
            return;
          }
        }
      }
      
      // 執行入職流程
      const result = await executeOnboarding(state.session);
      
      if (result.success && result.organizationId) {
        showSuccessToast('組織建立成功！');
        onComplete(result.organizationId);
      } else {
        throw new Error(result.error || '建立失敗');
      }
    } catch (error) {
      console.error('完成入職流程失敗:', error);
      showErrorToast(error instanceof Error ? error.message : '建立失敗');
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // 取得步驟鍵值
  const getStepKey = (index: number): 'basicInfo' | 'billingPlan' | 'userImport' | 'welcomeSetup' => {
    const keys = ['basicInfo', 'billingPlan', 'userImport', 'welcomeSetup'];
    return keys[index] as any;
  };

  // 渲染進度指示器
  const renderProgressIndicator = () => {
    const progress = ((state.currentStep + 1) / ONBOARDING_STEPS.length) * 100;
    
    return (
      <View style={styles.progressContainer}>
        {/* 進度條 */}
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill,
              { 
                width: `${progress}%`,
                backgroundColor: colors.primary }
            ]}
          />
        </View>
        
        {/* 步驟指示器 */}
        <View style={styles.stepsIndicator}>
          {ONBOARDING_STEPS.map((step, index) => {
            const isCompleted = state.completedSteps.has(step.id);
            const isCurrent = index === state.currentStep;
            const isPast = index < state.currentStep;
            
            return (
              <View key={step.id} style={styles.stepIndicator}>
                <View style={[
                  styles.stepCircle,
                  isCompleted && styles.stepCompleted,
                  isCurrent && styles.stepCurrent,
                  isPast && styles.stepPast,
                ]}>
                  {isCompleted ? (
                    <Icon name="checkmark" size={16} color={colors.text.inverse}  />
                  ) : (
                    <Text style={[
                      styles.stepNumber,
                      (isCurrent || isPast) && styles.stepNumberActive,
                    ]}>
                      {index + 1}
                    </Text>
                  )}
                </View>
                <Text style={[
                  styles.stepLabel,
                  isCurrent && styles.stepLabelCurrent,
                ]}>
                  {step.title}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  // 渲染當前步驟內容
  const renderStepContent = () => {
    if (!state.session || state.isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>載入中...</Text>
        </View>
      );
    }
    
    const currentStepDef = ONBOARDING_STEPS[state.currentStep];
    const StepComponent = currentStepDef.component;
    const stepKey = getStepKey(state.currentStep);
    const stepData = state.session.stepData[stepKey] || {};
    
    return (
      <View style={styles.stepContent}>
        <View style={styles.stepHeader}>
          <Text style={styles.stepTitle}>{currentStepDef.title}</Text>
          <Text style={styles.stepDescription}>{currentStepDef.description}</Text>
        </View>
        
        <StepComponent
          data={stepData}
          onChange={(data) => handleStepDataChange(stepKey, data)}
          onValidate={currentStepDef.validation}
          isActive={true}
        />
        
        {/* 顯示驗證錯誤 */}
        {state.validationErrors[state.currentStep] && (
          <View style={styles.errorContainer}>
            {state.validationErrors[state.currentStep].map((error, index) => (
              <Text key={index} style={styles.errorText}>
                • {error.message}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  // 渲染底部按鈕
  const renderFooterButtons = () => {
    const isLastStep = state.currentStep === ONBOARDING_STEPS.length - 1;
    const currentStepDef = ONBOARDING_STEPS[state.currentStep];
    
    return (
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          {state.canGoBack && (
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleBack}
              disabled={state.isSaving}
            >
              <Icon name="arrow-back" size={20} color={DesignSystem.colors.gray600}  />
              <Text style={styles.secondaryButtonText}>上一步</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.button, styles.ghostButton]}
            onPress={handleSaveDraft}
            disabled={state.isSaving}
          >
            <Icon name="save" size={20} color={DesignSystem.colors.gray600}  />
            <Text style={styles.ghostButtonText}>儲存草稿</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.footerRight}>
          {currentStepDef.canSkip && !isLastStep && (
            <TouchableOpacity
              style={[styles.button, styles.ghostButton]}
              onPress={handleSkip}
              disabled={state.isSaving}
            >
              <Text style={styles.ghostButtonText}>跳過</Text>
            </TouchableOpacity>
          )}
          
          {isLastStep ? (
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleComplete}
              disabled={state.isSaving || state.isLoading}
            >
              <Icon name="checkmark" size={20} color={DesignSystem.colors.text.inverse}  />
              <Text style={styles.primaryButtonText}>完成建立</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleNext}
              disabled={state.isSaving}
            >
              <Text style={styles.primaryButtonText}>下一步</Text>
              <Icon name="arrow-forward" size={20} color={DesignSystem.colors.text.inverse}  />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 頂部標題 */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {mode === 'create' ? '建立新組織' : '繼續設置組織'}
          </Text>
          <Text style={styles.headerSubtitle}>
            步驟 {state.currentStep + 1}/{ONBOARDING_STEPS.length}
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onCancel}
        >
          <Icon name="close" size={24} color={DesignSystem.colors.gray600}  />
        </TouchableOpacity>
      </View>
      
      {/* 進度指示器 */}
      {renderProgressIndicator()}
      
      {/* 步驟內容 */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStepContent()}
      </ScrollView>
      
      {/* 底部按鈕 */}
      {renderFooterButtons()}
      
      {/* 儲存指示器 */}
      {state.isSaving && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.savingText}>儲存中...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.gray200 },
  headerContent: {
    flex: 1 },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
    marginBottom: 4 },
  headerSubtitle: {
    fontSize: 14,
    color: DesignSystem.colors.text.secondary },
  closeButton: {
    padding: 8 },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.gray200 },
  progressBar: {
    height: 4,
    backgroundColor: DesignSystem.colors.gray200,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 16 },
  progressFill: {
    height: '100%',
    borderRadius: 2 },
  stepsIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between' },
  stepIndicator: {
    alignItems: 'center',
    flex: 1 },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: DesignSystem.colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8 },
  stepCompleted: {
    backgroundColor: DesignSystem.colors.status.success },
  stepCurrent: {
    backgroundColor: DesignSystem.colors.primary },
  stepPast: {
    backgroundColor: DesignSystem.colors.primary,
    opacity: 0.6 },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: DesignSystem.colors.gray600 },
  stepNumberActive: {
    color: DesignSystem.colors.background.surface },
  stepLabel: {
    fontSize: 12,
    color: DesignSystem.colors.gray500,
    textAlign: 'center' },
  stepLabelCurrent: {
    color: DesignSystem.colors.text.primary,
    fontWeight: '500' },
  content: {
    flex: 1 },
  stepContent: {
    padding: 20 },
  stepHeader: {
    marginBottom: 24 },
  stepTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
    marginBottom: 8 },
  stepDescription: {
    fontSize: 14,
    color: DesignSystem.colors.text.secondary },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60 },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: DesignSystem.colors.gray600 },
  errorContainer: {
    backgroundColor: withAlpha(DesignSystem.colors.status.error, 0.063),
    borderRadius: 8,
    padding: 12,
    marginTop: 16 },
  errorText: {
    fontSize: 14,
    color: DesignSystem.colors.status.error,
    marginBottom: 4 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: DesignSystem.colors.gray200 },
  footerLeft: {
    flexDirection: 'row',
    gap: 12 },
  footerRight: {
    flexDirection: 'row',
    gap: 12 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8 },
  primaryButton: {
    backgroundColor: DesignSystem.colors.primary },
  primaryButtonText: {
    color: DesignSystem.colors.text.inverse,
    fontSize: 14,
    fontWeight: '500' },
  secondaryButton: {
    backgroundColor: DesignSystem.colors.background.surface,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.light },
  secondaryButtonText: {
    color: DesignSystem.colors.text.primary,
    fontSize: 14,
    fontWeight: '500' },
  ghostButton: {
    backgroundColor: 'transparent' },
  ghostButtonText: {
    color: DesignSystem.colors.text.secondary,
    fontSize: 14,
    fontWeight: '500' },
  savingOverlay: {
    position: 'absolute',
    top: 60,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DesignSystem.colors.background.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    ...(Platform.OS === 'web' ? {} : { shadowOffset: { width: 0, height: 2 } }),
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 8 },
  savingText: {
    fontSize: 12,
    color: DesignSystem.colors.gray600 } });

export default OnboardingWizard;