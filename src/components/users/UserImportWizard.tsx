/**
 * 智能用戶批量匯入精靈
 * 三階段流程：檔案上傳 → 欄位映射 → 資料預覽
 * 整合智能欄位對應功能
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert } from 'react-native';
import { Icon } from '@/components/common/Icon';
import { DesignSystem } from '@/theme/designSystem';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/common/Button';
import { toast } from '@/utils/toast';

// 階段元件
import UserFileUploader from './stages/UserFileUploader';
import UserFieldMapper from './stages/UserFieldMapper';
import UserDataPreview from './stages/UserDataPreview';
import UserImportModeToggle from './UserImportModeToggle';

// 類型
import {
  UserImportStage,
  UserImportWizardState,
  UserImportConfigExtended,
  UserFieldMapping,
  ImportUserData,
  UserImportResult,
  ParsedUserFile } from '@/types/userImport';
import { Organization } from '@/types/entities';
import { UploadedFile, MergedTable, MergeConfig } from '@/types/import';

// 服務
import { UserFieldMappingEngine } from '@/services/users/UserFieldMappingEngine';
import { UserImportOrchestrator } from '@/services/users/UserImportOrchestrator';
import { UserDataValidator } from '@/services/users/UserDataValidator';

interface UserImportWizardProps {
  visible: boolean;
  organization: Organization;
  onClose: () => void;
  onImportComplete?: (result: UserImportResult) => void;
  useIntelligentMapping?: boolean;
  openAIKey?: string;
}

/**
 * 階段配置
 */
const STAGES: Array<{ key: UserImportStage; label: string; icon: string }> = [
  { key: 'upload', label: '上傳檔案', icon: 'cloud-upload-outline' },
  { key: 'mapping', label: '欄位對應', icon: 'git-compare-outline' },
  { key: 'preview', label: '預覽匯入', icon: 'eye-outline' },
];

/**
 * 智能用戶匯入精靈主元件
 */
const UserImportWizard: React.FC<UserImportWizardProps> = ({
  visible,
  organization,
  onClose,
  onImportComplete,
  useIntelligentMapping = true,
  openAIKey }) => {
  // 初始化服務
  const [mappingEngine] = useState(() => new UserFieldMappingEngine(openAIKey));
  const [importOrchestrator] = useState(() => new UserImportOrchestrator());
  const [validator] = useState(() => new UserDataValidator());

  // 精靈狀態
  const [wizardState, setWizardState] = useState<UserImportWizardState>({
    stage: 'upload',
    mode: 'simple',
    files: [],
    mergedTable: null,
    mergeConfig: null,
    mappings: [],
    importData: [],
    validationResults: [],
    importProgress: {
      isImporting: false,
      totalUsers: 0,
      processedUsers: 0,
      successCount: 0,
      errorCount: 0,
      currentUser: '',
      errors: [] },
    config: {
      organizationId: organization.id,
      defaultRole: 'user',
      skipDuplicates: true,
      updateExisting: false,
      sendWelcomeEmail: true,
      generatePasswords: true,
      fieldMappings: [],
      aiAssisted: useIntelligentMapping,
      mode: 'simple' } });

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 取得當前階段索引
   */
  const getCurrentStageIndex = useCallback(() => {
    return STAGES.findIndex(s => s.key === wizardState.stage);
  }, [wizardState.stage]);

  /**
   * 檢查是否可以進入下一階段
   */
  const canProceed = useCallback(() => {
    switch (wizardState.stage) {
      case 'upload':
        // 簡易模式：只允許單一檔案
        // 進階模式：可以多個檔案，但需要合併
        if (wizardState.mode === 'simple') {
          return wizardState.files.length === 1;
        } else {
          // 進階模式
          if (wizardState.files.length > 1) {
            return wizardState.mergedTable !== null;
          }
          return wizardState.files.length > 0;
        }
      case 'mapping':
        // 至少需要有一個欄位被映射
        return wizardState.mappings.some(m => m.sourceField && m.targetField);
      case 'preview':
        return wizardState.importData.length > 0 && wizardState.importData.some(u => u.isValid);
      default:
        return false;
    }
  }, [wizardState]);

  /**
   * 進入下一階段
   */
  const goToNextStage = useCallback(async () => {
    const currentIndex = getCurrentStageIndex();
    if (currentIndex < STAGES.length - 1) {
      const nextStage = STAGES[currentIndex + 1].key;
      
      // 階段轉換前的準備工作
      if (nextStage === 'mapping' && wizardState.files.length > 0) {
        // 生成智能映射建議
        await generateMappingSuggestions();
      } else if (nextStage === 'preview') {
        // 準備預覽資料
        await preparePreviewData();
      }
      
      setWizardState(prev => ({ ...prev, stage: nextStage }));
    }
  }, [getCurrentStageIndex, wizardState.files]);

  /**
   * 返回上一階段
   */
  const goToPreviousStage = useCallback(() => {
    const currentIndex = getCurrentStageIndex();
    if (currentIndex > 0) {
      const prevStage = STAGES[currentIndex - 1].key;
      setWizardState(prev => ({ ...prev, stage: prevStage }));
    }
  }, [getCurrentStageIndex]);

  /**
   * 生成智能映射建議
   */
  const generateMappingSuggestions = useCallback(async () => {
    if (wizardState.files.length === 0) return;

    setIsProcessing(true);
    try {
      // 取得合併後的欄位
      const headers = wizardState.mergedTable?.headers || wizardState.files[0].headers;
      
      // 使用映射引擎生成建議，傳入樣本資料以提高準確性
      const sampleData = wizardState.mergedTable?.data?.slice(0, 5) || 
                        wizardState.files[0]?.data?.slice(0, 5) || [];
      const suggestions = await mappingEngine.suggestMappings(headers, sampleData);
      
      setWizardState(prev => ({
        ...prev,
        mappings: suggestions,
        config: {
          ...prev.config,
          fieldMappings: suggestions } }));
      
      toast.success('已生成智能欄位映射建議');
    } catch (error) {
      console.error('生成映射建議失敗:', error);
      toast.error('生成映射建議失敗，請手動設定');
    } finally {
      setIsProcessing(false);
    }
  }, [wizardState.files, wizardState.mergedTable, mappingEngine]);

  /**
   * 準備預覽資料
   */
  const preparePreviewData = useCallback(async () => {
    setIsProcessing(true);
    try {
      // 根據映射轉換資料
      const data = wizardState.mergedTable?.data || wizardState.files[0]?.data || [];
      const importData = await importOrchestrator.transformData(
        data,
        wizardState.mappings
      );
      
      // 驗證資料
      const validatedData = await validator.validateBatch(importData);
      
      setWizardState(prev => ({
        ...prev,
        importData: validatedData }));
      
      toast.success(`已準備 ${validatedData.length} 筆用戶資料`);
    } catch (error) {
      console.error('準備預覽資料失敗:', error);
      toast.error('資料準備失敗');
    } finally {
      setIsProcessing(false);
    }
  }, [wizardState.mergedTable, wizardState.files, wizardState.mappings, importOrchestrator, validator]);

  /**
   * 處理檔案上傳完成
   */
  const handleFilesUploaded = useCallback((files: UploadedFile[]) => {
    setWizardState(prev => ({
      ...prev,
      files }));
  }, []);

  /**
   * 處理檔案合併完成
   */
  const handleMergeCompleted = useCallback((mergeConfig: MergeConfig, mergedTable: MergedTable) => {
    setWizardState(prev => ({
      ...prev,
      mergeConfig,
      mergedTable }));
  }, []);

  /**
   * 處理映射更新
   */
  const handleMappingUpdate = useCallback((mappings: UserFieldMapping[]) => {
    setWizardState(prev => ({
      ...prev,
      mappings,
      config: {
        ...prev.config,
        fieldMappings: mappings } }));
  }, []);

  /**
   * 處理資料編輯
   */
  const handleDataEdit = useCallback((updatedData: ImportUserData[]) => {
    setWizardState(prev => ({
      ...prev,
      importData: updatedData }));
  }, []);

  /**
   * 處理配置更新
   */
  const handleConfigUpdate = useCallback((config: Partial<UserImportConfigExtended>) => {
    setWizardState(prev => ({
      ...prev,
      config: {
        ...prev.config,
        ...config } }));
  }, []);

  /**
   * 執行匯入
   */
  const executeImport = useCallback(async () => {
    setIsProcessing(true);
    
    try {
      const result = await importOrchestrator.importUsers(
        wizardState.importData,
        wizardState.config,
        (progress) => {
          setWizardState(prev => ({
            ...prev,
            importProgress: progress }));
        }
      );
      
      if (result.success) {
        toast.success(`成功匯入 ${result.imported} 個用戶`);
      } else {
        toast.error(`匯入完成，但有 ${result.failed} 個用戶失敗`);
      }
      
      onImportComplete?.(result);
      
      // 延遲關閉以顯示結果
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('執行匯入失敗:', error);
      toast.error('匯入失敗');
      setError(error instanceof Error ? error.message : '未知錯誤');
    } finally {
      setIsProcessing(false);
    }
  }, [wizardState.importData, wizardState.config, importOrchestrator, onImportComplete, onClose]);

  /**
   * 處理模式切換
   */
  const handleModeChange = useCallback((mode: 'simple' | 'advanced') => {
    setWizardState(prev => ({
      ...prev,
      mode,
      config: {
        ...prev.config,
        mode } }));
  }, []);

  /**
   * 重置精靈狀態
   */
  const resetWizard = useCallback(() => {
    setWizardState({
      stage: 'upload',
      mode: 'simple',
      files: [],
      mergedTable: null,
      mergeConfig: null,
      mappings: [],
      importData: [],
      validationResults: [],
      importProgress: {
        isImporting: false,
        totalUsers: 0,
        processedUsers: 0,
        successCount: 0,
        errorCount: 0,
        currentUser: '',
        errors: [] },
      config: {
        organizationId: organization.id,
        defaultRole: 'user',
        skipDuplicates: true,
        updateExisting: false,
        sendWelcomeEmail: true,
        generatePasswords: true,
        fieldMappings: [],
        aiAssisted: useIntelligentMapping,
        mode: 'simple' } });
    setError(null);
  }, [organization.id, useIntelligentMapping]);

  /**
   * 處理關閉
   */
  const handleClose = useCallback(() => {
    if (wizardState.importProgress.isImporting) {
      Alert.alert(
        '警告',
        '匯入正在進行中，確定要關閉嗎？',
        [
          { text: '取消', style: 'cancel' },
          {
            text: '確定',
            onPress: () => {
              resetWizard();
              onClose();
            } },
        ]
      );
    } else {
      resetWizard();
      onClose();
    }
  }, [wizardState.importProgress.isImporting, resetWizard, onClose]);

  /**
   * 渲染階段內容
   */
  const renderStageContent = () => {
    switch (wizardState.stage) {
      case 'upload':
        return (
          <UserFileUploader
            files={wizardState.files}
            mergeConfig={wizardState.mergeConfig}
            mergedTable={wizardState.mergedTable}
            mode={wizardState.mode}
            onFilesUploaded={handleFilesUploaded}
            onMergeCompleted={handleMergeCompleted}
          />
        );

      case 'mapping':
        return (
          <UserFieldMapper
            files={wizardState.files}
            mergedTable={wizardState.mergedTable}
            mappings={wizardState.mappings}
            mode={wizardState.mode}
            useIntelligentMapping={useIntelligentMapping}
            onMappingUpdate={handleMappingUpdate}
          />
        );

      case 'preview':
        return (
          <UserDataPreview
            data={wizardState.importData}
            config={wizardState.config}
            onDataEdit={handleDataEdit}
            onConfigUpdate={handleConfigUpdate}
            onImport={executeImport}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={DesignSystem.colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>智能用戶匯入</Text>
          </View>
          <UserImportModeToggle
            mode={wizardState.mode}
            onChange={handleModeChange}
          />
        </View>

        {/* 階段指示器 */}
        <View style={styles.stageIndicator}>
          {STAGES.map((stage, index) => {
            const isActive = stage.key === wizardState.stage;
            const isCompleted = getCurrentStageIndex() > index;

            return (
              <View key={stage.key} style={styles.stageItem}>
                <View
                  style={StyleSheet.flatten([
                    styles.stageCircle,
                    isActive && styles.stageCircleActive,
                    isCompleted && styles.stageCircleCompleted,
                  ])}
                >
                  <Icon
                    name={isCompleted ? 'checkmark' : stage.icon}
                    size={20}
                    color={
                      isActive || isCompleted
                        ? DesignSystem.colors.text.inverse
                        : DesignSystem.colors.text.secondary
                    }
                  />
                </View>
                <Text
                  style={StyleSheet.flatten([
                    styles.stageLabel,
                    isActive && styles.stageLabelActive,
                  ])}
                >
                  {stage.label}
                </Text>
                {index < STAGES.length - 1 && (
                  <View
                    style={StyleSheet.flatten([
                      styles.stageConnector,
                      isCompleted && styles.stageConnectorCompleted,
                    ])}
                  />
                )}
              </View>
            );
          })}
        </View>

        {/* 錯誤提示 */}
        {error && (
          <View style={styles.errorBanner}>
            <Icon name="alert-circle-outline" size={20} color={DesignSystem.colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => setError(null)}>
              <Icon name="close" size={20} color={DesignSystem.colors.error} />
            </TouchableOpacity>
          </View>
        )}

        {/* 內容區域 */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {isProcessing ? (
            <View style={styles.loadingContainer}>
              <LoadingSpinner size="large" />
              <Text style={styles.loadingText}>處理中...</Text>
            </View>
          ) : (
            renderStageContent()
          )}
        </ScrollView>

        {/* 底部操作欄 */}
        <View style={styles.footer}>
          <View style={styles.footerButtons}>
            {getCurrentStageIndex() > 0 && (
              <Button
                title="上一步"
                onPress={goToPreviousStage}
                variant="outline"
                style={styles.footerButton}
                disabled={isProcessing || wizardState.importProgress.isImporting}
              />
            )}
            
            {wizardState.stage === 'preview' ? (
              <Button
                title="開始匯入"
                onPress={executeImport}
                style={styles.footerButton}
                disabled={!canProceed() || isProcessing || wizardState.importProgress.isImporting}
              />
            ) : (
              <Button
                title="下一步"
                onPress={goToNextStage}
                style={styles.footerButton}
                disabled={!canProceed() || isProcessing}
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingVertical: DesignSystem.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center' },
  closeButton: {
    marginRight: DesignSystem.spacing.md },
  headerTitle: {
    ...DesignSystem.typography.h3,
    color: DesignSystem.colors.text.primary },
  stageIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingVertical: DesignSystem.spacing.lg,
    backgroundColor: DesignSystem.colors.background.surface },
  stageItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative' },
  stageCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: DesignSystem.colors.background.primary,
    borderWidth: 2,
    borderColor: DesignSystem.colors.border.medium,
    justifyContent: 'center',
    alignItems: 'center' },
  stageCircleActive: {
    backgroundColor: DesignSystem.colors.primary,
    borderColor: DesignSystem.colors.primary },
  stageCircleCompleted: {
    backgroundColor: DesignSystem.colors.success,
    borderColor: DesignSystem.colors.success },
  stageLabel: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    marginLeft: DesignSystem.spacing.xs },
  stageLabelActive: {
    color: DesignSystem.colors.primary,
    fontWeight: '600' },
  stageConnector: {
    position: 'absolute',
    left: 36,
    right: 0,
    height: 2,
    backgroundColor: DesignSystem.colors.border.light,
    top: 17,
    zIndex: -1 },
  stageConnectorCompleted: {
    backgroundColor: DesignSystem.colors.success },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${DesignSystem.colors.error}10`,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    marginHorizontal: DesignSystem.spacing.lg,
    marginTop: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.sm },
  errorText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.error,
    flex: 1,
    marginLeft: DesignSystem.spacing.sm },
  content: {
    flex: 1 },
  contentContainer: {
    flexGrow: 1,
    padding: DesignSystem.spacing.lg },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center' },
  loadingText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.secondary,
    marginTop: DesignSystem.spacing.md },
  footer: {
    borderTopWidth: 1,
    borderTopColor: DesignSystem.colors.border.light,
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingVertical: DesignSystem.spacing.md },
  footerButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: DesignSystem.spacing.md },
  footerButton: {
    minWidth: 100 } });

export default UserImportWizard;