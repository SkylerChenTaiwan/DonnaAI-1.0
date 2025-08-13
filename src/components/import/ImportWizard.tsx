/**
 * 三階段資料匯入精靈
 * 主要元件，管理整個匯入流程
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import {
  AdaptiveButton
} from '@/components/adaptive';
import { MaterialIcon } from '@/components/common/MaterialIcon';
import { ProgressIndicator } from '@/components/common/ProgressIndicator';
import { DesignSystem } from '@/theme/designSystem';
import { 
  ImportWizardState, 
  DatabaseType,
  UploadedFile,
  MergeConfig,
  FieldMapping,
  FieldRelation,
  ImportError
} from '@/types/import';
import { ImportAssignmentConfig, AssignmentPreview } from '@/types/assignment';
import DatabaseSelector from './stages/DatabaseSelector';
import FileUploadMerger from './stages/FileUploadMerger';
import FieldMapper from './stages/FieldMapper';
import DataAssignmentStep from './stages/DataAssignmentStep';
import { IntelligentFieldMapper } from './IntelligentFieldMapper';
import { useAuthStore } from '@/stores/authStore';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { SmartDataImporter } from '@/services/firebase/admin/dataImportService';
import { getFirebaseDb, getFirebaseAuth } from '@/services/firebase/config';
import { cleanupDuplicateCustomers } from '@/services/firebase/cleanupService';
import { FieldMappingEngine } from '@/services/import/FieldMappingEngine';
import { DataTypeInferrer } from '@/services/import/DataTypeInferrer';
import { ValidationEngine } from '@/services/import/ValidationEngine';
import { DataCleaner } from '@/services/import/DataCleaner';
import { StreamProcessor } from '@/services/import/StreamProcessor';
import { DataMerger } from '@/services/import/DataMerger';
import { RelationBuilder } from '@/services/import/RelationBuilder';
import { withAlpha } from '@/utils/colorUtils';

interface ImportWizardProps {
  organizationId: string;
  teamId?: string;
  initialTargetDatabase?: DatabaseType; // 新增：允許預設選擇的資料庫類型
  useIntelligentMapping?: boolean; // 新增：使用智能映射
  openAIKey?: string; // 新增：OpenAI API 金鑰（用於 AI 輔助映射）
  onComplete?: (result: {
    targetDatabase: DatabaseType;
    importedCount: number;
    errors: ImportError[];
  }) => void;
  onCancel?: () => void;
}

const ImportWizard: React.FC<ImportWizardProps> = ({
  organizationId,
  teamId,
  initialTargetDatabase,
  useIntelligentMapping = false,
  openAIKey,
  onComplete,
  onCancel
}) => {
  const colors = DesignSystem.colors;
  const { user } = useAuthStore();
  
  // 初始化精靈狀態
  const [wizardState, setWizardState] = useState<ImportWizardState>({
    stage: initialTargetDatabase ? 2 : 1, // 如果有預設資料庫，直接跳到第二階段
    targetDatabase: initialTargetDatabase || null,
    existingFieldsLoaded: false,
    uploadedFiles: [],
    mergeConfig: null,
    mergedTable: null,
    fieldMappings: [],
    fieldRelations: [],
    assignmentConfig: undefined,
    assignmentPreview: undefined,
    importOptions: {
      skipDuplicates: true,
      updateExisting: false,
      batchSize: 500,
      validateBeforeImport: true,
      createBackup: false
    },
    importProgress: {
      isImporting: false,
      totalRows: 0,
      processedRows: 0,
      successCount: 0,
      errorCount: 0,
      errors: []
    }
  });

  // 清理狀態
  const [cleanupState, setCleanupState] = useState({
    isCleaningUp: false,
    progress: { message: '', percent: 0 }
  });

  // 狀態更新輔助函數
  const updateWizardState = useCallback((updates: Partial<ImportWizardState>) => {
    setWizardState(prev => ({ ...prev, ...updates }));
  }, []);

  // 獲取目標資料庫的欄位定義
  const getTargetFieldsForDatabase = (database: DatabaseType) => {
    // 這裡應該從 Firebase 或配置中獲取實際的欄位定義
    // 暫時返回預設欄位
    const fieldsByDatabase = {
      customers: [
        { name: 'name', label: '客戶姓名', type: 'text' as const, required: true },
        { name: 'email', label: '電子郵件', type: 'email' as const, required: false },
        { name: 'phone', label: '電話', type: 'phone' as const, required: false },
        { name: 'company', label: '公司名稱', type: 'text' as const, required: false },
        { name: 'address', label: '地址', type: 'address' as const, required: false },
        { name: 'tags', label: '標籤', type: 'text' as const, required: false },
        { name: 'notes', label: '備註', type: 'text' as const, required: false },
      ],
      users: [
        { name: 'email', label: '電子郵件', type: 'email' as const, required: true },
        { name: 'name', label: '姓名', type: 'text' as const, required: true },
        { name: 'role', label: '角色', type: 'text' as const, required: true },
        { name: 'department', label: '部門', type: 'text' as const, required: false },
        { name: 'phone', label: '電話', type: 'phone' as const, required: false },
      ],
      records: [
        { name: 'title', label: '標題', type: 'text' as const, required: true },
        { name: 'date', label: '日期', type: 'date' as const, required: true },
        { name: 'customer', label: '客戶', type: 'text' as const, required: false },
        { name: 'amount', label: '金額', type: 'currency' as const, required: false },
        { name: 'status', label: '狀態', type: 'text' as const, required: false },
      ],
      tasks: [
        { name: 'title', label: '任務標題', type: 'text' as const, required: true },
        { name: 'description', label: '描述', type: 'text' as const, required: false },
        { name: 'assignee', label: '負責人', type: 'text' as const, required: false },
        { name: 'dueDate', label: '到期日', type: 'date' as const, required: false },
        { name: 'priority', label: '優先級', type: 'text' as const, required: false },
        { name: 'status', label: '狀態', type: 'text' as const, required: false },
      ] };

    return fieldsByDatabase[database] || [];
  };

  // 階段導航
  const canGoBack = wizardState.stage > 1 && !wizardState.importProgress.isImporting;
  const canGoNext = useCallback(() => {
    switch (wizardState.stage) {
      case 1:
        return wizardState.targetDatabase !== null;
      case 2:
        return wizardState.mergedTable !== null;
      case 3:
        return wizardState.fieldMappings.length > 0;
      case 4:
        // 第四階段可以選擇跳過分配或已配置分配
        return wizardState.assignmentConfig !== undefined || wizardState.assignmentConfig === null;
      default:
        return false;
    }
  }, [wizardState]);

  const goToPreviousStage = useCallback(() => {
    if (canGoBack) {
      updateWizardState({ stage: (wizardState.stage - 1) as 1 | 2 | 3 | 4 });
    }
  }, [wizardState.stage, canGoBack, updateWizardState]);

  const goToNextStage = useCallback(() => {
    console.log('➡️ ImportWizard: 嘗試進入下一階段', {
      currentStage: wizardState.stage,
      canGoNext: canGoNext(),
      mergedTable: wizardState.mergedTable ? 'exists' : 'null',
      targetDatabase: wizardState.targetDatabase
    });
    if (canGoNext() && wizardState.stage < 4) {
      updateWizardState({ stage: (wizardState.stage + 1) as 1 | 2 | 3 | 4 });
    }
  }, [wizardState.stage, canGoNext, updateWizardState, wizardState.mergedTable, wizardState.targetDatabase]);

  // 階段 1: 選擇資料庫
  const handleDatabaseSelect = useCallback((database: DatabaseType) => {
    updateWizardState({
      targetDatabase: database,
      existingFieldsLoaded: false
    });
  }, [updateWizardState]);

  // 階段 2: 檔案上傳與合併
  const handleFilesUploaded = useCallback((files: UploadedFile[]) => {
    updateWizardState({
      uploadedFiles: files
    });
  }, [updateWizardState]);

  const handleMergeConfigured = useCallback((config: MergeConfig, mergedTable: any) => {
    console.log('📊 ImportWizard: 收到合併資料:', {
      config,
      mergedTable: mergedTable ? {
        headers: mergedTable.headers,
        dataLength: mergedTable.data?.length
      } : null
    });
    updateWizardState({
      mergeConfig: config,
      mergedTable
    });
  }, [updateWizardState]);

  // 階段 3: 欄位映射與關聯
  const handleFieldMappingsChanged = useCallback((mappings: FieldMapping[]) => {
    updateWizardState({
      fieldMappings: mappings
    });
  }, [updateWizardState]);

  const handleFieldRelationsChanged = useCallback((relations: FieldRelation[]) => {
    updateWizardState({
      fieldRelations: relations
    });
  }, [updateWizardState]);

  // 階段 4: 資料分配
  const handleAssignmentConfigChanged = useCallback((config: ImportAssignmentConfig | undefined) => {
    updateWizardState({
      assignmentConfig: config
    });
  }, [updateWizardState]);

  const handleSkipAssignment = useCallback((skip: boolean) => {
    if (skip) {
      updateWizardState({
        assignmentConfig: null // null 表示跳過分配
      });
    }
  }, [updateWizardState]);

  // 執行匯入
  const executeImport = useCallback(async () => {
    console.log('開始執行匯入，當前狀態:', {
      targetDatabase: wizardState.targetDatabase,
      hasMergedTable: !!wizardState.mergedTable,
      dataCount: wizardState.mergedTable?.data?.length || 0,
      mappingsCount: wizardState.fieldMappings.length
    });
    
    if (!wizardState.targetDatabase || !wizardState.mergedTable) {
      console.error('匯入設定不完整:', {
        targetDatabase: wizardState.targetDatabase,
        mergedTable: wizardState.mergedTable
      });
      showErrorToast('匯入設定不完整');
      return;
    }

    updateWizardState({
      importProgress: {
        ...wizardState.importProgress,
        isImporting: true,
        totalRows: wizardState.mergedTable.data.length,
        processedRows: 0,
        successCount: 0,
        errorCount: 0,
        errors: []
      }
    });

    try {
      console.log('建立智能匯入器，organizationId:', organizationId);
      // 建立智能匯入器
      const importer = new SmartDataImporter(organizationId);
      
      // 設定分配配置（如果有）
      if (wizardState.assignmentConfig && wizardState.assignmentConfig !== null) {
        console.log('設定分配配置:', wizardState.assignmentConfig);
        // 設定分配者 ID
        const configWithAssigner = {
          ...wizardState.assignmentConfig,
          assignerId: user?.uid
        };
        await importer.setAssignmentConfig(configWithAssigner);
      } else {
        // 明確設定不使用分配
        await importer.setAssignmentConfig(null);
      }
      console.log('智能匯入器建立成功');
      
      // 準備映射配置
      const mappingConfig = {
        fileIndex: 0,
        fileType: wizardState.targetDatabase as any,
        mappings: wizardState.fieldMappings.reduce((acc, mapping) => {
          if (mapping.targetField) {
            acc[mapping.targetField] = mapping.sourceColumn;
          }
          return acc;
        }, {} as { [key: string]: string }),
        keyField: wizardState.mergedTable.keyColumn
      };

      // 準備關聯配置
      const relationConfigs = wizardState.fieldRelations.map(relation => ({
        sourceFile: 0,
        sourceField: relation.sourceField,
        targetFile: 0, // 在單檔案匯入中，這個值不重要
        targetField: relation.targetField
      }));

      // 執行匯入 - 直接處理資料而不透過檔案
      console.log('準備匯入資料:', {
        dataLength: wizardState.mergedTable.data.length,
        mappingConfig,
        relationConfigs
      });
      
      // 直接使用 processFileWithCustomMapping 方法
      const importResult = await importer.processFileWithCustomMapping(
        wizardState.targetDatabase as any,
        wizardState.mergedTable.data,
        mappingConfig.mappings,
        mappingConfig.keyField,
        (progress) => {
          console.log('匯入進度更新:', progress);
          setWizardState(prev => ({
            ...prev,
            importProgress: {
              ...prev.importProgress,
              processedRows: progress.current,
              totalRows: progress.total,
              successCount: progress.current,
              isImporting: true
            }
          }));
        }
      );

      const result = {
        targetDatabase: wizardState.targetDatabase,
        importedCount: importResult.success,
        errors: importResult.errors.map(e => ({
          row: e.row,
          message: e.message,
          type: 'import' as const
        }))
      };

      updateWizardState({
        importProgress: {
          ...wizardState.importProgress,
          isImporting: false,
          processedRows: result.importedCount,
          successCount: result.importedCount,
          errorCount: importResult.failed,
          errors: result.errors
        }
      });

      if (importResult.failed > 0) {
        showErrorToast(`匯入完成，但有 ${importResult.failed} 筆失敗`);
      } else {
        showSuccessToast(`成功匯入 ${result.importedCount} 筆資料`);
      }

      if (onComplete) {
        onComplete(result);
      }
    } catch (error) {
      console.error('匯入失敗:', error);
      console.error('詳細錯誤資訊:', {
        errorType: typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        wizardState: {
          targetDatabase: wizardState.targetDatabase,
          mappingsCount: wizardState.fieldMappings.length,
          dataCount: wizardState.mergedTable?.data?.length || 0
        }
      });
      
      const errorMessage = error instanceof Error ? error.message : '未知錯誤';
      
      updateWizardState({
        importProgress: {
          ...wizardState.importProgress,
          isImporting: false,
          errorCount: wizardState.importProgress.errorCount + 1,
          errors: [...wizardState.importProgress.errors, {
            row: wizardState.importProgress.processedRows,
            message: errorMessage,
            type: 'unknown'
          }]
        }
      });
      showErrorToast(`匯入失敗: ${errorMessage}`);
    }
  }, [wizardState, updateWizardState, onComplete, organizationId]);

  // 清理重複資料
  const handleCleanupDuplicates = useCallback(async () => {
    console.log('🧹 開始執行清理重複資料...');
    
    // 直接從 Firebase Auth 獲取用戶狀態
    const auth = getFirebaseAuth();
    const firebaseUser = auth.currentUser;
    
    console.log('📋 參數檢查:', { 
      organizationId, 
      storeUser: user?.uid, 
      firebaseUser: firebaseUser?.uid,
      authState: !!firebaseUser
    });
    
    // 參數驗證
    if (!organizationId) {
      console.error('❌ organizationId 未提供');
      Alert.alert('錯誤', '找不到組織 ID，無法執行清理操作');
      return;
    }
    
    if (!firebaseUser?.uid) {
      console.error('❌ Firebase 用戶未登入');
      Alert.alert('錯誤', '用戶未登入，請重新登入後再試');
      return;
    }
    
    try {
      console.log('🔄 設定清理狀態為進行中...');
      setCleanupState({ isCleaningUp: true, progress: { message: '開始清理...', percent: 0 } });
      
      console.log('🚀 呼叫 cleanupDuplicateCustomers...', organizationId);
      const result = await cleanupDuplicateCustomers(
        organizationId,
        (progress) => {
          console.log('📊 清理進度更新:', progress);
          setCleanupState(prev => ({
            ...prev,
            progress
          }));
        }
      );
      
      console.log('✅ 清理完成，結果:', result);
      
      setCleanupState({ isCleaningUp: false, progress: { message: '', percent: 0 } });
      
      Alert.alert(
        '清理完成',
        `清理結果：\n• 原始記錄: ${result.totalRecords} 筆\n• 發現重複: ${result.duplicatesFound} 筆\n• 已清理: ${result.duplicatesRemoved} 筆\n• 剩餘記錄: ${result.finalRecords} 筆`,
        [{ text: '確定', style: 'default' }]
      );
      
      showSuccessToast(`清理完成！已移除 ${result.duplicatesRemoved} 筆重複資料`);
      
    } catch (error) {
      console.error('❌ 清理失敗 - 完整錯誤資訊:', error);
      console.error('❌ 錯誤類型:', typeof error);
      console.error('❌ 錯誤堆疊:', error instanceof Error ? error.stack : '無堆疊資訊');
      
      setCleanupState({ isCleaningUp: false, progress: { message: '', percent: 0 } });
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ 處理後的錯誤訊息:', errorMessage);
      
      Alert.alert(
        '清理失敗',
        `清理過程中發生錯誤：${errorMessage}`,
        [{ text: '確定', style: 'default' }]
      );
      showErrorToast(`清理失敗: ${errorMessage}`);
    }
  }, [organizationId, user]);

  // 渲染階段標題
  const renderStageTitle = () => {
    const titles = [
      '選擇目標資料庫',
      '上傳並合併檔案',
      '設定欄位映射與關聯',
      '分配資料給用戶'
    ];
    return titles[wizardState.stage - 1];
  };

  // 渲染進度指示器
  const renderProgressIndicator = () => {
    const stageLabels = [
      '選擇資料庫',
      '檔案處理',
      '欄位映射',
      '資料分配'
    ];
    
    return (
      <ProgressIndicator 
        currentStage={wizardState.stage}
        totalStages={4}
        labels={stageLabels}
      />
    );
  };

  // 舊版本備份（已被 ProgressIndicator 元件取代）
  const renderProgressIndicatorOld = () => {
    // Web 平台使用完全內聯樣式來避免被 CSS 覆蓋
    if (Platform.OS === 'web') {
      return (
        <View style={styles.progressContainer}>
          {[1, 2, 3, 4].map(stage => (
            <View key={stage} style={styles.progressItem}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: stage <= wizardState.stage ? '#2C2C2C' : '#FFFFFF',
                border: stage === wizardState.stage ? '2px solid #2C2C2C' : '2px solid #4A4A4A',
                boxSizing: 'border-box'
              }}>
                <span style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: stage <= wizardState.stage ? '#FFFFFF' : '#000000'
                }}>
                  {stage}
                </span>
              </div>
            </View>
          ))}
        </View>
      );
    }
    
    // Native 平台保持原樣
    return (
      <View style={styles.progressContainer}>
        {[1, 2, 3, 4].map(stage => (
          <View key={stage} style={styles.progressItem}>
            <View style={StyleSheet.flatten([
              styles.progressCircle,
              {
                backgroundColor: stage <= wizardState.stage ? colors.primary : colors.gray100,
                borderColor: stage === wizardState.stage ? colors.primary : colors.gray600,
                borderWidth: 1.5
              }
            ])}>
              <Text style={StyleSheet.flatten([
                styles.progressNumber,
                { color: stage <= wizardState.stage ? colors.white : colors.gray700 }
              ])}>
                {stage}
              </Text>
            </View>
            <Text style={StyleSheet.flatten([
              styles.progressLabel,
              { color: stage === wizardState.stage ? colors.text : colors.gray500 }
            ])}>
              {stage === 1 && '選擇資料庫'}
              {stage === 2 && '檔案處理'}
              {stage === 3 && '欄位設定'}
              {stage === 4 && '資料分配'}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  // 渲染當前階段內容
  const renderStageContent = () => {
    switch (wizardState.stage) {
      case 1:
        return (
          <DatabaseSelector
            selectedDatabase={wizardState.targetDatabase}
            onSelect={handleDatabaseSelect}
            organizationId={organizationId}
          />
        );
      
      case 2:
        return (
          <FileUploadMerger
            uploadedFiles={wizardState.uploadedFiles}
            mergeConfig={wizardState.mergeConfig}
            mergedTable={wizardState.mergedTable}
            onFilesUploaded={handleFilesUploaded}
            onMergeConfigured={handleMergeConfigured}
          />
        );
      
      case 3:
        // 使用智能映射或傳統映射
        if (useIntelligentMapping && wizardState.mergedTable) {
          return (
            <IntelligentFieldMapper
              sourceHeaders={wizardState.mergedTable.headers}
              sampleData={wizardState.mergedTable.data.slice(0, 100)}
              targetFields={wizardState.targetDatabase ? 
                getTargetFieldsForDatabase(wizardState.targetDatabase) : []
              }
              onMappingChange={(mappings) => {
                const fieldMappings = mappings.map(m => ({
                  sourceField: m.sourceField,
                  targetField: m.targetField,
                  transform: m.transform
                }));
                handleFieldMappingsChanged(fieldMappings);
              }}
              onCreateField={(fieldName, fieldType) => {
                console.log('建立新欄位:', fieldName, fieldType);
                // 這裡可以加入動態建立欄位的邏輯
              }}
              openAIKey={openAIKey}
            />
          );
        }
        
        // 傳統映射介面
        return (
          <FieldMapper
            targetDatabase={wizardState.targetDatabase!}
            mergedTable={wizardState.mergedTable!}
            fieldMappings={wizardState.fieldMappings}
            fieldRelations={wizardState.fieldRelations}
            onMappingsChanged={handleFieldMappingsChanged}
            onRelationsChanged={handleFieldRelationsChanged}
            organizationId={organizationId}
          />
        );
      
      case 4:
        // 資料分配階段
        return (
          <DataAssignmentStep
            data={wizardState.mergedTable?.data || []}
            targetDatabase={wizardState.targetDatabase!}
            organizationId={organizationId}
            currentUserId={user?.uid || ''}
            onAssignmentChange={handleAssignmentConfigChanged}
            onSkipAssignment={handleSkipAssignment}
          />
        );
      
      default:
        return null;
    }
  };

  // 渲染匯入進度
  const renderImportProgress = () => {
    if (!wizardState.importProgress.isImporting) return null;

    const progress = wizardState.importProgress.totalRows > 0
      ? wizardState.importProgress.processedRows / wizardState.importProgress.totalRows
      : 0;

    return (
      <View style={StyleSheet.flatten([styles.progressOverlay, { backgroundColor: colors.background }])}>
        <View style={styles.progressContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={StyleSheet.flatten([styles.progressTitle, { color: colors.text }])}>
            正在匯入資料...
          </Text>
          <View style={styles.progressBar}>
            <View style={StyleSheet.flatten([
              styles.progressBarFill,
              { 
                width: `${progress * 100}%`,
                backgroundColor: colors.primary
              }
            ])} />
          </View>
          <Text style={StyleSheet.flatten([styles.progressText, { color: colors.gray600 }])}>
            已處理 {wizardState.importProgress.processedRows} / {wizardState.importProgress.totalRows} 筆
          </Text>
          {wizardState.importProgress.errorCount > 0 && (
            <Text style={StyleSheet.flatten([styles.errorText, { color: colors.error }])}>
              {wizardState.importProgress.errorCount} 筆錯誤
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])}>
      {/* 頂部標題欄 */}
      <View style={StyleSheet.flatten([styles.header, { borderBottomColor: colors.gray200 }])}>
        <View style={styles.headerContent}>
          <Text style={StyleSheet.flatten([styles.title, { color: colors.text }])}>
            資料匯入精靈
          </Text>
          <Text style={StyleSheet.flatten([styles.subtitle, { color: colors.gray600 }])}>
            {renderStageTitle()}
          </Text>
        </View>
        {onCancel && (
          <AdaptiveButton
            variant="ghost"
            onPress={onCancel}
            icon={<MaterialIcon name="close" size={24} color={colors.gray600} />}
            style={styles.closeButton}
          />
        )}
        
        {/* 資料清理按鈕 */}
        <AdaptiveButton
          variant="outline"
          style={StyleSheet.flatten([styles.cleanupButton, {
            backgroundColor: withAlpha(colors.status.warning, 0.125),
            borderColor: colors.status.warning,
            opacity: cleanupState.isCleaningUp ? 0.6 : 1
          }])}
          onPress={handleCleanupDuplicates}
          disabled={cleanupState.isCleaningUp || wizardState.importProgress.isImporting}
          icon={<MaterialIcon 
            name={cleanupState.isCleaningUp ? "hourglass-empty" : "cleaning-services"} 
            size={16} 
            color={colors.status.warning} 
          />}
          iconPosition="left"
          title={cleanupState.isCleaningUp ? '清理中...' : '清理重複資料'}
        />
      </View>

      {/* 進度指示器 */}
      {renderProgressIndicator()}

      {/* 階段內容 */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStageContent()}
      </ScrollView>

      {/* 底部按鈕 */}
      <View style={StyleSheet.flatten([styles.footer, { borderTopColor: colors.gray200 }])}>
        <View style={styles.footerButtons}>
          {canGoBack && (
            <AdaptiveButton
              variant="secondary"
              onPress={goToPreviousStage}
              icon={<MaterialIcon name="arrow-back" size={20} color={colors.gray600} />}
              iconPosition="left"
              title="上一步"
            />
          )}

          {onCancel && wizardState.stage === 1 && (
            <AdaptiveButton
              variant="secondary"
              onPress={onCancel}
              title="取消"
            />
          )}

          {wizardState.stage < 4 ? (
            <AdaptiveButton
              variant="primary"
              onPress={goToNextStage}
              disabled={!canGoNext()}
              title="下一步"
              icon={<MaterialIcon name="arrow-forward" size={20} color="#FFFFFF" />}
              iconPosition="right"
            />
          ) : (
            <AdaptiveButton
              variant="primary"
              onPress={executeImport}
              disabled={!canGoNext() || wizardState.importProgress.isImporting}
              loading={wizardState.importProgress.isImporting}
              title="開始匯入"
              icon={<MaterialIcon name="file-upload" size={20} color="#FFFFFF" />}
              iconPosition="left"
            />
          )}
        </View>
      </View>

      {/* 匯入進度覆蓋層 */}
      {renderImportProgress()}
      
      {/* 清理進度覆蓋層 */}
      {cleanupState.isCleaningUp && (
        <View style={StyleSheet.flatten([styles.progressOverlay, { backgroundColor: colors.background }])}>
          <View style={styles.progressContent}>
            <ActivityIndicator size="large" color={colors.status.warning} />
            <Text style={StyleSheet.flatten([styles.progressTitle, { color: colors.text }])}>
              正在清理重複資料...
            </Text>
            <Text style={StyleSheet.flatten([styles.progressMessage, { color: colors.gray600 }])}>
              {cleanupState.progress.message}
            </Text>
            <View style={styles.progressBar}>
              <View style={StyleSheet.flatten([
                styles.progressBarFill,
                { 
                  backgroundColor: colors.status.warning,
                  width: `${cleanupState.progress.percent}%`
                }
              ])} />
            </View>
            <Text style={StyleSheet.flatten([styles.progressText, { color: colors.gray600 }])}>
              {Math.round(cleanupState.progress.percent)}%
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerContent: {
    flex: 1
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 14
  },
  closeButton: {
    padding: 8
  },
  cleanupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
    marginLeft: 8
  },
  cleanupButtonText: {
    fontSize: 12,
    fontWeight: '500'
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 24,
    paddingHorizontal: 20
  },
  progressItem: {
    alignItems: 'center',
    flex: 1
  },
  progressCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  progressNumber: {
    fontSize: 16,
    fontWeight: '600'
  },
  progressLabel: {
    fontSize: 12,
    textAlign: 'center'
  },
  content: {
    flex: 1,
    paddingHorizontal: 20
  },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 16
  },
  footerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
    minWidth: 100
  },
  primaryButton: {
    flex: 1
  },
  secondaryButton: {
    borderWidth: 1,
    backgroundColor: 'transparent'
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500'
  },
  progressOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  progressContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    ...(Platform.OS === 'web' ? {} : { ...(Platform.OS === 'web' ? {} : { shadowOffset: { width: 0, height: 2 } }) }),
    shadowOpacity: 0.1,
    shadowRadius: 8,
    ...(Platform.OS === 'web' ? {} : { elevation: 5 }),
    minWidth: 280
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 12
  },
  progressMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8
  },
  progressBar: {
    width: 200,
    height: 4,
    backgroundColor: '#E5E5E5',
    borderRadius: 2,
    overflow: 'hidden',
    marginVertical: 12
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2
  },
  progressText: {
    fontSize: 12
  },
  errorText: {
    fontSize: 12,
    marginTop: 8
  }
});

export default ImportWizard;