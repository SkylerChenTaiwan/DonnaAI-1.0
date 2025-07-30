/**
 * 舊系統資料導入介面
 * 提供完整的 CSV 檔案上傳、驗證和導入功能
 */

import React, { useState, useCallback, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Layout } from '@/components/common/Layout';
import { theme } from '@/theme';
import { useAuth } from '@/contexts/AuthContext';
import { 
  createImportSession,
  loadAndValidateFile,
  executeLegacyImport,
  ImportSessionProgress,
  ImportSessionResult
} from '@/services/csv/legacy-import/legacyDataImportService';
import { LegacyImportSession } from '@/types/legacy-import';
import { previewCSV } from '@/services/csv/legacy-import/parser';

interface FileInfo {
  name: string;
  size: number;
  uri: string;
  content?: string;
  preview?: {
    headers: string[];
    data: any[];
    totalRows: number;
  };
  validated?: boolean;
  errors?: string[];
}

interface ImportState {
  codeMapping?: FileInfo;
  users?: FileInfo;
  customers?: FileInfo;
  records?: FileInfo;
}

export function LegacyDataImportScreen({ navigation }: any) {
  const { user, organizationId, currentTeamId } = useAuth();
  const [files, setFiles] = useState<ImportState>({});
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportSessionProgress | null>(null);
  const [importResult, setImportResult] = useState<ImportSessionResult | null>(null);
  const [session, setSession] = useState<LegacyImportSession | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    { title: '上傳檔案', icon: 'cloud-upload-outline' },
    { title: '驗證資料', icon: 'checkmark-circle-outline' },
    { title: '執行導入', icon: 'play-circle-outline' },
    { title: '完成', icon: 'flag-outline' },
  ];

  const fileTypes = [
    { 
      key: 'codeMapping' as keyof ImportState, 
      label: '業務代碼對照表', 
      required: true,
      description: '包含業務姓名、職級、顧問代碼、主管清單'
    },
    { 
      key: 'users' as keyof ImportState, 
      label: '業務人員名單', 
      required: true,
      description: '包含業務帳號、Gmail帳號、層級等資訊'
    },
    { 
      key: 'customers' as keyof ImportState, 
      label: '客戶名單', 
      required: false,
      description: '包含客戶基本資料和負責業務'
    },
    { 
      key: 'records' as keyof ImportState, 
      label: '訪談記錄', 
      required: false,
      description: '包含訪談內容、日期和相關人員'
    },
  ];

  // 選擇檔案
  const pickFile = async (fileType: keyof ImportState) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/csv'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // 讀取檔案內容
        const content = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        // 預覽檔案
        const preview = await previewCSV(content, 5);

        const fileInfo: FileInfo = {
          name: asset.name,
          size: asset.size || 0,
          uri: asset.uri,
          content,
          preview,
        };

        setFiles(prev => ({
          ...prev,
          [fileType]: fileInfo,
        }));
      }
    } catch (error) {
      Alert.alert('錯誤', `無法讀取檔案: ${error.message}`);
    }
  };

  // 驗證所有檔案
  const validateFiles = async () => {
    if (!session || !organizationId || !currentTeamId || !user) {
      Alert.alert('錯誤', '缺少必要的組織資訊');
      return false;
    }

    setActiveStep(1);
    let allValid = true;

    for (const fileType of fileTypes) {
      const file = files[fileType.key];
      
      if (fileType.required && !file) {
        Alert.alert('錯誤', `請上傳${fileType.label}`);
        return false;
      }

      if (file && file.content) {
        const validation = await loadAndValidateFile(
          session,
          fileType.key,
          file.content,
          file.name
        );

        if (!validation.success) {
          allValid = false;
          setFiles(prev => ({
            ...prev,
            [fileType.key]: {
              ...file,
              validated: false,
              errors: validation.errors,
            },
          }));
        } else {
          setFiles(prev => ({
            ...prev,
            [fileType.key]: {
              ...file,
              validated: true,
              errors: undefined,
            },
          }));
        }
      }
    }

    return allValid;
  };

  // 執行導入
  const executeImport = async () => {
    if (!session || !organizationId || !currentTeamId || !user) {
      Alert.alert('錯誤', '缺少必要的組織資訊');
      return;
    }

    setIsImporting(true);
    setActiveStep(2);

    try {
      const result = await executeLegacyImport(
        session,
        {
          skipDuplicates: true,
          updateExisting: false,
          validateOnly: false,
          batchSize: 500,
          continueOnError: true,
        },
        (progress) => {
          setImportProgress(progress);
        }
      );

      setImportResult(result);
      setActiveStep(3);

      if (result.success) {
        Alert.alert(
          '導入成功',
          `成功導入 ${result.stats.successCount} 筆資料`,
          [
            {
              text: '查看報告',
              onPress: () => showImportReport(result),
            },
            {
              text: '確定',
              style: 'default',
            },
          ]
        );
      } else {
        Alert.alert(
          '導入完成但有錯誤',
          `成功: ${result.stats.successCount} 筆\n失敗: ${result.stats.failureCount} 筆`,
          [
            {
              text: '查看報告',
              onPress: () => showImportReport(result),
            },
            {
              text: '確定',
              style: 'default',
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert('導入失敗', error.message);
    } finally {
      setIsImporting(false);
    }
  };

  // 顯示導入報告
  const showImportReport = (result: ImportSessionResult) => {
    // TODO: 導航到報告頁面或顯示模態視窗
    console.log('Import Report:', result.reports.summary);
  };

  // 開始導入流程
  const startImport = async () => {
    if (!user || !organizationId || !currentTeamId) {
      Alert.alert('錯誤', '請先登入並選擇團隊');
      return;
    }

    // 建立導入會話
    const newSession = createImportSession(
      organizationId,
      currentTeamId,
      user.uid
    );
    setSession(newSession);

    // 驗證檔案
    const isValid = await validateFiles();
    
    if (isValid) {
      Alert.alert(
        '確認導入',
        '檔案驗證成功，是否開始導入？',
        [
          {
            text: '取消',
            style: 'cancel',
          },
          {
            text: '開始導入',
            onPress: executeImport,
          },
        ]
      );
    } else {
      Alert.alert('驗證失敗', '請修正錯誤後重試');
    }
  };

  // 重置流程
  const resetImport = () => {
    setFiles({});
    setSession(null);
    setImportProgress(null);
    setImportResult(null);
    setActiveStep(0);
  };

  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return renderFileUpload();
      case 1:
        return renderValidation();
      case 2:
        return renderImportProgress();
      case 3:
        return renderComplete();
      default:
        return null;
    }
  };

  const renderFileUpload = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>請上傳舊系統匯出的 CSV 檔案</Text>
      
      {fileTypes.map((fileType) => (
        <View key={fileType.key} style={styles.fileSection}>
          <View style={styles.fileSectionHeader}>
            <Text style={styles.fileLabel}>
              {fileType.label}
              {fileType.required && <Text style={styles.required}> *</Text>}
            </Text>
            <Text style={styles.fileDescription}>{fileType.description}</Text>
          </View>

          {files[fileType.key] ? (
            <View style={styles.fileInfo}>
              <Ionicons name="document-text" size={24} color={theme.colors.primary} />
              <View style={styles.fileDetails}>
                <Text style={styles.fileName}>{files[fileType.key]!.name}</Text>
                <Text style={styles.fileSize}>
                  {(files[fileType.key]!.size / 1024).toFixed(2)} KB
                </Text>
                {files[fileType.key]!.preview && (
                  <Text style={styles.fileRows}>
                    {files[fileType.key]!.preview!.totalRows} 筆資料
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => setFiles(prev => ({ ...prev, [fileType.key]: undefined }))}
              >
                <Ionicons name="close-circle" size={24} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => pickFile(fileType.key)}
            >
              <Ionicons name="cloud-upload-outline" size={24} color={theme.colors.primary} />
              <Text style={styles.uploadText}>選擇檔案</Text>
            </TouchableOpacity>
          )}

          {files[fileType.key]?.errors && (
            <View style={styles.errorBox}>
              {files[fileType.key]!.errors!.map((error, index) => (
                <Text key={index} style={styles.errorText}>• {error}</Text>
              ))}
            </View>
          )}
        </View>
      ))}

      <TouchableOpacity
        style={[
          styles.actionButton,
          !files.codeMapping || !files.users ? styles.disabledButton : null,
        ]}
        onPress={startImport}
        disabled={!files.codeMapping || !files.users}
      >
        <Text style={styles.actionButtonText}>開始驗證</Text>
      </TouchableOpacity>
    </View>
  );

  const renderValidation = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>正在驗證資料...</Text>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );

  const renderImportProgress = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>正在導入資料</Text>
      
      {importProgress && (
        <View style={styles.progressSection}>
          <Text style={styles.progressPhase}>{importProgress.currentPhase}</Text>
          
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { width: `${importProgress.percentage}%` },
              ]} 
            />
          </View>
          
          <Text style={styles.progressText}>
            {importProgress.processedItems} / {importProgress.totalItems} 
            ({importProgress.percentage.toFixed(1)}%)
          </Text>

          {importProgress.currentItem && (
            <Text style={styles.currentItem}>
              處理中: {importProgress.currentItem}
            </Text>
          )}

          {importProgress.estimatedTimeRemaining && (
            <Text style={styles.timeRemaining}>
              預估剩餘時間: {importProgress.estimatedTimeRemaining} 秒
            </Text>
          )}

          {(importProgress.errors > 0 || importProgress.warnings > 0) && (
            <View style={styles.issuesSummary}>
              {importProgress.errors > 0 && (
                <Text style={styles.errorCount}>錯誤: {importProgress.errors}</Text>
              )}
              {importProgress.warnings > 0 && (
                <Text style={styles.warningCount}>警告: {importProgress.warnings}</Text>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );

  const renderComplete = () => (
    <View style={styles.stepContent}>
      <Ionicons 
        name={importResult?.success ? "checkmark-circle" : "alert-circle"} 
        size={64} 
        color={importResult?.success ? theme.colors.success : theme.colors.warning} 
      />
      
      <Text style={styles.completeTitle}>
        {importResult?.success ? '導入成功！' : '導入完成但有錯誤'}
      </Text>

      {importResult && (
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>總處理數:</Text>
            <Text style={styles.summaryValue}>{importResult.stats.totalProcessed}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>成功:</Text>
            <Text style={[styles.summaryValue, styles.successText]}>
              {importResult.stats.successCount}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>失敗:</Text>
            <Text style={[styles.summaryValue, styles.errorText]}>
              {importResult.stats.failureCount}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>警告:</Text>
            <Text style={[styles.summaryValue, styles.warningText]}>
              {importResult.stats.warningCount}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.completeActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => importResult && showImportReport(importResult)}
        >
          <Text style={styles.secondaryButtonText}>查看詳細報告</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={resetImport}
        >
          <Text style={styles.actionButtonText}>完成</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Layout
      headerProps={{
        title: '舊系統資料導入',
        showBack: true,
        onBack: () => navigation.goBack(),
      }}
    >
      <ScrollView style={styles.container}>
        {/* 步驟指示器 */}
        <View style={styles.stepIndicator}>
          {steps.map((step, index) => (
            <View key={index} style={styles.stepItem}>
              <View style={[
                styles.stepCircle,
                index <= activeStep ? styles.stepCircleActive : null,
              ]}>
                <Ionicons 
                  name={step.icon as any} 
                  size={20} 
                  color={index <= activeStep ? '#fff' : theme.colors.gray} 
                />
              </View>
              <Text style={[
                styles.stepLabel,
                index <= activeStep ? styles.stepLabelActive : null,
              ]}>
                {step.title}
              </Text>
              {index < steps.length - 1 && (
                <View style={[
                  styles.stepLine,
                  index < activeStep ? styles.stepLineActive : null,
                ]} />
              )}
            </View>
          ))}
        </View>

        {/* 步驟內容 */}
        {renderStep()}
      </ScrollView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepCircleActive: {
    backgroundColor: theme.colors.primary,
  },
  stepLabel: {
    fontSize: 12,
    color: theme.colors.gray,
  },
  stepLabelActive: {
    color: theme.colors.text,
    fontWeight: '500',
  },
  stepLine: {
    position: 'absolute',
    top: 20,
    left: '50%',
    right: '-50%',
    height: 2,
    backgroundColor: theme.colors.lightGray,
  },
  stepLineActive: {
    backgroundColor: theme.colors.primary,
  },
  stepContent: {
    padding: 16,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  fileSection: {
    marginBottom: 24,
  },
  fileSectionHeader: {
    marginBottom: 12,
  },
  fileLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 4,
  },
  required: {
    color: theme.colors.error,
  },
  fileDescription: {
    fontSize: 14,
    color: theme.colors.gray,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: theme.colors.lightGray + '20',
  },
  uploadText: {
    marginLeft: 8,
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: theme.colors.lightGray + '40',
    borderRadius: 8,
  },
  fileDetails: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  fileSize: {
    fontSize: 12,
    color: theme.colors.gray,
    marginTop: 2,
  },
  fileRows: {
    fontSize: 12,
    color: theme.colors.primary,
    marginTop: 2,
  },
  errorBox: {
    marginTop: 8,
    padding: 12,
    backgroundColor: theme.colors.error + '10',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.error + '20',
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.error,
    marginBottom: 4,
  },
  actionButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: theme.colors.gray,
    opacity: 0.5,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  progressSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  progressPhase: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 16,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: theme.colors.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  progressText: {
    fontSize: 14,
    color: theme.colors.gray,
    marginBottom: 8,
  },
  currentItem: {
    fontSize: 14,
    color: theme.colors.text,
    marginTop: 8,
  },
  timeRemaining: {
    fontSize: 14,
    color: theme.colors.gray,
    marginTop: 4,
  },
  issuesSummary: {
    flexDirection: 'row',
    marginTop: 16,
  },
  errorCount: {
    color: theme.colors.error,
    marginRight: 16,
  },
  warningCount: {
    color: theme.colors.warning,
  },
  completeTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 24,
  },
  summarySection: {
    width: '100%',
    padding: 16,
    backgroundColor: theme.colors.lightGray + '20',
    borderRadius: 8,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.colors.gray,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  successText: {
    color: theme.colors.success,
  },
  warningText: {
    color: theme.colors.warning,
  },
  completeActions: {
    width: '100%',
  },
});