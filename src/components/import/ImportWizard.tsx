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
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
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
import DatabaseSelector from './stages/DatabaseSelector';
import FileUploadMerger from './stages/FileUploadMerger';
import FieldMapper from './stages/FieldMapper';
import { useAuthStore } from '@/stores/authStore';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { SmartDataImporter } from '@/services/firebase/admin/dataImportService';
import { getFirebaseDb } from '@/services/firebase/config';

interface ImportWizardProps {
  organizationId: string;
  teamId?: string;
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
  onComplete,
  onCancel
}) => {
  const colors = DesignSystem.colors;
  const { user } = useAuthStore();
  
  // 初始化精靈狀態
  const [wizardState, setWizardState] = useState<ImportWizardState>({
    stage: 1,
    targetDatabase: null,
    existingFieldsLoaded: false,
    uploadedFiles: [],
    mergeConfig: null,
    mergedTable: null,
    fieldMappings: [],
    fieldRelations: [],
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

  // 狀態更新輔助函數
  const updateWizardState = useCallback((updates: Partial<ImportWizardState>) => {
    setWizardState(prev => ({ ...prev, ...updates }));
  }, []);

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
      default:
        return false;
    }
  }, [wizardState]);

  const goToPreviousStage = useCallback(() => {
    if (canGoBack) {
      updateWizardState({ stage: (wizardState.stage - 1) as 1 | 2 | 3 });
    }
  }, [wizardState.stage, canGoBack, updateWizardState]);

  const goToNextStage = useCallback(() => {
    if (canGoNext() && wizardState.stage < 3) {
      updateWizardState({ stage: (wizardState.stage + 1) as 1 | 2 | 3 });
    }
  }, [wizardState.stage, canGoNext, updateWizardState]);

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

  // 執行匯入
  const executeImport = useCallback(async () => {
    if (!wizardState.targetDatabase || !wizardState.mergedTable) {
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
      // 建立智能匯入器
      const importer = new SmartDataImporter(organizationId);
      
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

      // 執行匯入
      const importResult = await importer.importMultipleFilesWithMapping(
        [{
          uri: 'data:text/csv;base64,' + btoa(JSON.stringify(wizardState.mergedTable.data)),
          name: 'merged_data.csv',
          type: 'application/json'
        }],
        [mappingConfig],
        relationConfigs,
        (progress) => {
          updateWizardState({
            importProgress: {
              ...wizardState.importProgress,
              processedRows: progress.current,
              totalRows: progress.total,
              successCount: progress.current // 簡化處理
            }
          });
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
      updateWizardState({
        importProgress: {
          ...wizardState.importProgress,
          isImporting: false,
          errorCount: wizardState.importProgress.errorCount + 1,
          errors: [...wizardState.importProgress.errors, {
            row: wizardState.importProgress.processedRows,
            message: error instanceof Error ? error.message : '未知錯誤',
            type: 'unknown'
          }]
        }
      });
      showErrorToast('匯入失敗');
    }
  }, [wizardState, updateWizardState, onComplete, organizationId]);

  // 渲染階段標題
  const renderStageTitle = () => {
    const titles = [
      '選擇目標資料庫',
      '上傳並合併檔案',
      '設定欄位映射與關聯'
    ];
    return titles[wizardState.stage - 1];
  };

  // 渲染進度指示器
  const renderProgressIndicator = () => {
    return (
      <View style={styles.progressContainer}>
        {[1, 2, 3].map(stage => (
          <View key={stage} style={styles.progressItem}>
            <View style={[
              styles.progressCircle,
              {
                backgroundColor: stage <= wizardState.stage ? colors.primary : colors.gray200,
                borderColor: stage === wizardState.stage ? colors.primary : colors.gray200
              }
            ]}>
              <Text style={[
                styles.progressNumber,
                { color: stage <= wizardState.stage ? colors.white : colors.gray600 }
              ]}>
                {stage}
              </Text>
            </View>
            <Text style={[
              styles.progressLabel,
              { color: stage === wizardState.stage ? colors.text : colors.gray500 }
            ]}>
              {stage === 1 && '選擇資料庫'}
              {stage === 2 && '檔案處理'}
              {stage === 3 && '欄位設定'}
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
      <View style={[styles.progressOverlay, { backgroundColor: colors.background }]}>
        <View style={styles.progressContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.progressTitle, { color: colors.text }]}>
            正在匯入資料...
          </Text>
          <View style={styles.progressBar}>
            <View style={[
              styles.progressBarFill,
              { 
                width: `${progress * 100}%`,
                backgroundColor: colors.primary
              }
            ]} />
          </View>
          <Text style={[styles.progressText, { color: colors.gray600 }]}>
            已處理 {wizardState.importProgress.processedRows} / {wizardState.importProgress.totalRows} 筆
          </Text>
          {wizardState.importProgress.errorCount > 0 && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {wizardState.importProgress.errorCount} 筆錯誤
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 頂部標題欄 */}
      <View style={[styles.header, { borderBottomColor: colors.gray200 }]}>
        <View style={styles.headerContent}>
          <Text style={[styles.title, { color: colors.text }]}>
            資料匯入精靈
          </Text>
          <Text style={[styles.subtitle, { color: colors.gray600 }]}>
            {renderStageTitle()}
          </Text>
        </View>
        {onCancel && (
          <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color={colors.gray600} />
          </TouchableOpacity>
        )}
      </View>

      {/* 進度指示器 */}
      {renderProgressIndicator()}

      {/* 階段內容 */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStageContent()}
      </ScrollView>

      {/* 底部按鈕 */}
      <View style={[styles.footer, { borderTopColor: colors.gray200 }]}>
        <View style={styles.footerButtons}>
          {canGoBack && (
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton, { borderColor: colors.gray300 }]}
              onPress={goToPreviousStage}
            >
              <MaterialIcons name="arrow-back" size={20} color={colors.gray600} />
              <Text style={[styles.buttonText, { color: colors.gray600 }]}>上一步</Text>
            </TouchableOpacity>
          )}

          {onCancel && wizardState.stage === 1 && (
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton, { borderColor: colors.gray300 }]}
              onPress={onCancel}
            >
              <Text style={[styles.buttonText, { color: colors.gray600 }]}>取消</Text>
            </TouchableOpacity>
          )}

          {wizardState.stage < 3 ? (
            <TouchableOpacity
              style={[
                styles.button, 
                styles.primaryButton,
                { 
                  backgroundColor: canGoNext() ? colors.primary : colors.gray300,
                  opacity: canGoNext() ? 1 : 0.6
                }
              ]}
              onPress={goToNextStage}
              disabled={!canGoNext()}
            >
              <Text style={[styles.buttonText, { color: colors.white }]}>下一步</Text>
              <MaterialIcons name="arrow-forward" size={20} color={colors.white} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.button, 
                styles.primaryButton,
                { 
                  backgroundColor: canGoNext() ? colors.primary : colors.gray300,
                  opacity: canGoNext() ? 1 : 0.6
                }
              ]}
              onPress={executeImport}
              disabled={!canGoNext() || wizardState.importProgress.isImporting}
            >
              <MaterialIcons name="file-upload" size={20} color={colors.white} />
              <Text style={[styles.buttonText, { color: colors.white }]}>開始匯入</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 匯入進度覆蓋層 */}
      {renderImportProgress()}
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 280
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 12
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