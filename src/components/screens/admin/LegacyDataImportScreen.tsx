/**
 * 舊系統資料導入介面
 * 提供完整的 CSV 檔案上傳、驗證和導入功能
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
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
import { Icon } from '@/components/common/Icon';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { WebLayout } from '@/components/layout/WebLayout';
import { responsiveGrid } from '@/components/common/ResponsiveLayout';
import { isDesktopWeb, isTabletWeb } from '@/utils/web-detector';
import { DesignSystem } from '@/theme/designSystem';
import { useAuthStore } from '@/stores/authStore';
import { 
  createImportSession,
  loadAndValidateFile,
  executeLegacyImport,
  ImportSessionProgress,
  ImportSessionResult
} from '@/services/csv/legacy-import/legacyDataImportService';
import { LegacyImportSession } from '@/types/legacy-import';
import { previewCSV } from '@/services/csv/legacy-import/parser';
import { FieldMappingModal, FieldMapping, RelationMapping } from '@/components/import/FieldMappingModal';
import { SmartDataImporter } from '@/services/firebase/admin/dataImportService';
import ImportWizard from '@/components/import/ImportWizard';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getFirebaseDb } from '@/services/firebase/config';

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

export function LegacyDataImportScreen({ navigation, route }: any) {
  const { user } = useAuthStore();
  // 優先使用路由參數中的 organizationId，否則使用當前用戶的
  const organizationId = route?.params?.organizationId || user?.organizationId;
  const [currentTeamId, setCurrentTeamId] = useState<string>(route?.params?.teamId || user?.teamIds?.[0] || '');
  const [files, setFiles] = useState<ImportState>({});
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportSessionProgress | null>(null);
  const [importResult, setImportResult] = useState<ImportSessionResult | null>(null);
  const [session, setSession] = useState<LegacyImportSession | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [relationMappings, setRelationMappings] = useState<RelationMapping[]>([]);
  const [useNewWizard, setUseNewWizard] = useState(true); // 預設使用新的三階段精靈
  const isDesktop = isDesktopWeb();
  const isTablet = isTabletWeb();
  const isLandscape = true; // 簡化判斷

  // 獲取組織的第一個團隊（如果沒有提供 teamId）
  useEffect(() => {
    const fetchFirstTeam = async () => {
      if (organizationId && !currentTeamId) {
        try {
          const db = getFirebaseDb();
          const teamsQuery = query(
            collection(db, 'teams'),
            where('organizationId', '==', organizationId)
          );
          const teamsSnapshot = await getDocs(teamsQuery);
          
          if (!teamsSnapshot.empty) {
            const firstTeam = teamsSnapshot.docs[0];
            setCurrentTeamId(firstTeam.id);
            console.log('使用組織的第一個團隊:', firstTeam.id, firstTeam.data().name);
          } else {
            // 如果組織沒有團隊，使用預設值
            setCurrentTeamId('default-team');
            console.log('組織沒有團隊，使用預設團隊');
          }
        } catch (error) {
          console.error('獲取團隊失敗:', error);
          setCurrentTeamId('default-team');
        }
      }
    };
    
    fetchFirstTeam();
  }, [organizationId, currentTeamId]);

  // 初始化 session
  useEffect(() => {
    if (organizationId && currentTeamId && user?.id) {
      const newSession = createImportSession(
        organizationId,
        currentTeamId,
        user.id
      );
      setSession(newSession);
      console.log('建立新的導入 session:', newSession);
    }
  }, [organizationId, currentTeamId, user?.id]);

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
      if (Platform.OS === 'web') {
        // Web 平台使用 input 元素
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv,text/csv,text/comma-separated-values,application/csv';
        
        input.onchange = async (event: any) => {
          const file = event.target.files?.[0];
          if (!file) return;
          
          const reader = new FileReader();
          reader.onload = async (e) => {
            const content = e.target?.result as string;
            
            // 預覽檔案
            const preview = await previewCSV(content, 5);
            
            const fileInfo: FileInfo = {
              name: file.name,
              size: file.size,
              uri: URL.createObjectURL(file),
              content,
              preview };
            
            setFiles(prev => ({
              ...prev,
              [fileType]: fileInfo }));
          };
          
          reader.readAsText(file);
        };
        
        input.click();
      } else {
        // 原生平台使用 DocumentPicker
        const result = await DocumentPicker.getDocumentAsync({
          type: ['text/csv', 'text/comma-separated-values', 'application/csv'],
          copyToCacheDirectory: true });

        if (!result.canceled && result.assets[0]) {
          const asset = result.assets[0];
          
          // 讀取檔案內容
          const content = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: FileSystem.EncodingType.UTF8 });

          // 預覽檔案
          const preview = await previewCSV(content, 5);

          const fileInfo: FileInfo = {
            name: asset.name,
            size: asset.size || 0,
            uri: asset.uri,
            content,
            preview };

          setFiles(prev => ({
            ...prev,
            [fileType]: fileInfo }));
        }
      }
    } catch (error) {
      if (Platform.OS === 'web') {
        window.alert(`無法讀取檔案: ${error.message}`);
      } else {
        Alert.alert('錯誤', `無法讀取檔案: ${error.message}`);
      }
    }
  };

  // 驗證所有檔案
  const validateFiles = async () => {
    if (!session || !organizationId || !user) {
      if (Platform.OS === 'web') {
        window.alert('錯誤：缺少必要的組織資訊');
      } else {
        Alert.alert('錯誤', '缺少必要的組織資訊');
      }
      console.error('驗證失敗：缺少必要資訊', {
        session: !!session,
        organizationId: !!organizationId,
        user: !!user
      });
      return false;
    }

    setActiveStep(1);
    let allValid = true;

    try {
      for (const fileType of fileTypes) {
        const file = files[fileType.key];
        
        if (fileType.required && !file) {
          if (Platform.OS === 'web') {
            window.alert(`錯誤：請上傳${fileType.label}`);
          } else {
            Alert.alert('錯誤', `請上傳${fileType.label}`);
          }
          return false;
        }

        if (file && file.content) {
          console.log(`開始驗證 ${fileType.label}...`);
          
          const validation = await loadAndValidateFile(
            session,
            fileType.key,
            file.content,
            file.name
          );

          console.log(`${fileType.label} 驗證結果:`, validation);

          if (!validation.success) {
            allValid = false;
            setFiles(prev => ({
              ...prev,
              [fileType.key]: {
                ...file,
                validated: false,
                errors: validation.errors } }));
            console.error(`${fileType.label} 驗證失敗:`, validation.errors);
          } else {
            setFiles(prev => ({
              ...prev,
              [fileType.key]: {
                ...file,
                validated: true,
                errors: undefined } }));
            console.log(`${fileType.label} 驗證成功`);
          }
        }
      }
    } catch (error) {
      console.error('驗證過程發生錯誤:', error);
      if (Platform.OS === 'web') {
        window.alert(`驗證過程發生錯誤: ${error.message}`);
      } else {
        Alert.alert('錯誤', `驗證過程發生錯誤: ${error.message}`);
      }
      return false;
    }

    return allValid;
  };

  // 處理欄位映射確認
  const handleMappingConfirm = async (
    mappings: FieldMapping[],
    relations: RelationMapping[]
  ) => {
    setShowMappingModal(false);
    setFieldMappings(mappings);
    setRelationMappings(relations);
    
    // 繼續執行原本的導入流程
    await executeImportWithMapping();
  };

  // 執行導入（顯示欄位映射）
  const executeImport = async () => {
    if (!session || !organizationId || !user) {
      if (Platform.OS === 'web') {
        window.alert('錯誤：缺少必要的組織資訊');
      } else {
        Alert.alert('錯誤', '缺少必要的組織資訊');
      }
      return;
    }

    // 顯示欄位映射 Modal
    const filesArray = Object.entries(files)
      .filter(([key, file]) => file && file.uri)
      .map(([key, file]) => ({
        uri: file!.uri,
        name: file!.name,
        mimeType: 'text/csv'
      }));
    
    if (filesArray.length > 0) {
      setShowMappingModal(true);
      return; // 等待用戶確認映射
    } else {
      // 沒有檔案時直接執行原流程
      await executeImportWithMapping();
    }
  };

  // 執行導入（使用映射）
  const executeImportWithMapping = async () => {
    if (!session || !organizationId || !user) {
      if (Platform.OS === 'web') {
        window.alert('錯誤：缺少必要的組織資訊');
      } else {
        Alert.alert('錯誤', '缺少必要的組織資訊');
      }
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
          continueOnError: true },
        (progress) => {
          setImportProgress(progress);
        }
      );

      setImportResult(result);
      setActiveStep(3);

      if (result.success) {
        if (Platform.OS === 'web') {
          window.alert(`導入成功！成功導入 ${result.stats.successCount} 筆資料`);
          showImportReport(result);
        } else {
          Alert.alert(
            '導入成功',
            `成功導入 ${result.stats.successCount} 筆資料`,
            [
              {
                text: '查看報告',
                onPress: () => showImportReport(result) },
              {
                text: '確定',
                style: 'default' },
            ]
          );
        }
      } else {
        if (Platform.OS === 'web') {
          window.alert(`導入完成但有錯誤\n成功: ${result.stats.successCount} 筆\n失敗: ${result.stats.failureCount} 筆`);
          showImportReport(result);
        } else {
          Alert.alert(
            '導入完成但有錯誤',
            `成功: ${result.stats.successCount} 筆\n失敗: ${result.stats.failureCount} 筆`,
            [
              {
                text: '查看報告',
                onPress: () => showImportReport(result) },
              {
                text: '確定',
                style: 'default' },
            ]
          );
        }
      }
    } catch (error) {
      if (Platform.OS === 'web') {
        window.alert(`導入失敗: ${error.message}`);
      } else {
        Alert.alert('導入失敗', error.message);
      }
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
    if (!user || !organizationId) {
      if (Platform.OS === 'web') {
        window.alert('錯誤：請先登入');
      } else {
        Alert.alert('錯誤', '請先登入');
      }
      return;
    }

    // 確保 session 已建立
    if (!session) {
      // 如果沒有 session，建立新的
      const teamId = currentTeamId || 'default-team';
      const newSession = createImportSession(
        organizationId,
        teamId,
        user.id
      );
      setSession(newSession);
    }

    // 驗證檔案
    const isValid = await validateFiles();
    
    if (isValid) {
      // 驗證成功，恢復到檔案上傳步驟，等待使用者確認
      setActiveStep(0);
      
      if (Platform.OS === 'web') {
        // Web 平台使用 window.confirm
        const shouldImport = window.confirm('檔案驗證成功，是否開始導入？');
        if (shouldImport) {
          executeImport();
        }
      } else {
        // 原生平台使用 Alert.alert
        Alert.alert(
          '確認導入',
          '檔案驗證成功，是否開始導入？',
          [
            {
              text: '取消',
              style: 'cancel',
              onPress: () => {
                // 使用者取消，保持在步驟 0
                setActiveStep(0);
              }
            },
            {
              text: '開始導入',
              onPress: executeImport },
          ]
        );
      }
    } else {
      // 驗證失敗，恢復到檔案上傳步驟
      setActiveStep(0);
      
      if (Platform.OS === 'web') {
        window.alert('驗證失敗：請修正錯誤後重試');
      } else {
        Alert.alert('驗證失敗', '請修正錯誤後重試');
      }
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

  const renderFileUpload = () => {
    const useGrid = isDesktop || (isTablet && isLandscape);
    
    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>請上傳舊系統匯出的 CSV 檔案</Text>
        
        <View style={StyleSheet.flatten([useGrid && responsiveGrid.twoColumn])}>
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
              <Icon name="document-text" size={24} color={DesignSystem.colors.primary} />
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
                <Icon name="close-circle" size={24} color={DesignSystem.colors.error} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => pickFile(fileType.key)}
            >
              <Icon name="cloud-upload-outline" size={24} color={DesignSystem.colors.primary} />
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
        </View>

        <TouchableOpacity
        style={StyleSheet.flatten([
          styles.actionButton,
          !files.codeMapping || !files.users ? styles.disabledButton : null,
        ])}
        onPress={startImport}
        disabled={!files.codeMapping || !files.users}
      >
        <Text style={styles.actionButtonText}>開始驗證</Text>
        </TouchableOpacity>
      </View>
    );
    
    // Web 平台直接返回內容
    if (Platform.OS === 'web') {
      return wizardContent;
    }
    
    return (
      <WebLayout scrollable={false}>
        {wizardContent}
      </WebLayout>
    );
  };

  const renderValidation = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>正在驗證資料...</Text>
      <ActivityIndicator size="large" color={DesignSystem.colors.primary} />
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
              style={StyleSheet.flatten([
                styles.progressFill,
                { width: `${importProgress.percentage}%` },
              ])} 
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
      <Icon 
        name={importResult?.success ? "checkmark-circle" : "alert-circle"} 
        size={64} 
        color={importResult?.success ? DesignSystem.colors.success : DesignSystem.colors.warning} 
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
            <Text style={StyleSheet.flatten([styles.summaryValue, styles.successText])}>
              {importResult.stats.successCount}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>失敗:</Text>
            <Text style={StyleSheet.flatten([styles.summaryValue, styles.errorText])}>
              {importResult.stats.failureCount}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>警告:</Text>
            <Text style={StyleSheet.flatten([styles.summaryValue, styles.warningText])}>
              {importResult.stats.warningCount}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.completeActions}>
        <TouchableOpacity
          style={StyleSheet.flatten([styles.actionButton, styles.secondaryButton])}
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

  // 使用新的三階段精靈
  if (useNewWizard) {
    const wizardContent = (
      <View style={styles.wizardContainer}>
        {/* 切換開關 */}
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>使用新版匯入精靈</Text>
          <TouchableOpacity
            style={StyleSheet.flatten([styles.switchButton, { backgroundColor: DesignSystem.colors.primary }])}
            onPress={() => setUseNewWizard(false)}
          >
            <Text style={styles.switchButtonText}>切換到舊版</Text>
          </TouchableOpacity>
        </View>
        
        {/* 新的三階段匯入精靈 */}
        <ImportWizard
          organizationId={organizationId}
          teamId={currentTeamId}
          onComplete={(result) => {
            Alert.alert(
              '匯入完成',
              `成功匯入 ${result.importedCount} 筆資料到 ${result.targetDatabase}`,
              [{ text: '確定', onPress: () => navigation.goBack() }]
            );
          }}
          onCancel={() => navigation.goBack()}
        />
      </View>,
      {
        maxWidth: 1400,
        scrollable: false,
        layoutProps: {
          headerProps: {
            title: '資料匯入精靈',
            showBack: true,
            onBack: () => navigation.goBack() }
        }
      }
    );
  }

  // 使用響應式佈局（舊版）
  const content = (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 切換開關 */}
      <View style={styles.switchContainer}>
        <Text style={styles.switchLabel}>使用舊版匯入</Text>
        <TouchableOpacity
          style={StyleSheet.flatten([styles.switchButton, { backgroundColor: DesignSystem.colors.gray500 }])}
          onPress={() => setUseNewWizard(true)}
        >
          <Text style={styles.switchButtonText}>切換到新版</Text>
        </TouchableOpacity>
      </View>

      {/* 步驟指示器 */}
      <View style={styles.stepIndicator}>
        {steps.map((step, index) => (
          <View key={index} style={styles.stepItem}>
            <View style={StyleSheet.flatten([
              styles.stepCircle,
              index <= activeStep ? styles.stepCircleActive : null,
            ])}>
              <Icon 
                name={step.icon as any} 
                size={20} 
                color={index <= activeStep ? '#fff' : DesignSystem.colors.gray} 
              />
            </View>
            <Text style={StyleSheet.flatten([
              styles.stepLabel,
              index <= activeStep ? styles.stepLabelActive : null,
            ])}>
              {step.title}
            </Text>
            {index < steps.length - 1 && (
              <View style={StyleSheet.flatten([
                styles.stepLine,
                index < activeStep ? styles.stepLineActive : null,
              ])} />
            )}
          </View>
        ))}
      </View>

      {/* 步驟內容 */}
      {renderStep()}
      
      {/* 欄位映射 Modal */}
      {showMappingModal && (
        <FieldMappingModal
          visible={showMappingModal}
          files={Object.entries(files)
            .filter(([key, file]) => file && file.uri)
            .map(([key, file]) => ({
              uri: file!.uri,
              name: file!.name,
              mimeType: 'text/csv'
            }))}
          onConfirm={handleMappingConfirm}
          onCancel={() => setShowMappingModal(false)}
        />
      )}
    </ScrollView>
  );

  // Web 平台直接返回內容
  if (Platform.OS === 'web') {
    return content;
  }
  
  // 其他平台使用 WebLayout
  return (
    <WebLayout scrollable={false} maxWidth={1400}>
      {content}
    </WebLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background.primary },
  wizardContainer: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background.primary },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: DesignSystem.colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.gray200 },
  switchLabel: {
    fontSize: 14,
    color: DesignSystem.colors.text.secondary },
  switchButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20 },
  switchButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600' },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16 },
  stepItem: {
    alignItems: 'center',
    flex: 1 },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DesignSystem.colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8 },
  stepCircleActive: {
    backgroundColor: DesignSystem.colors.primary },
  stepLabel: {
    fontSize: 12,
    color: DesignSystem.colors.gray500 },
  stepLabelActive: {
    color: DesignSystem.colors.text.primary,
    fontWeight: '500' },
  stepLine: {
    position: 'absolute',
    top: 20,
    left: '50%',
    right: '-50%',
    height: 2,
    backgroundColor: DesignSystem.colors.gray200 },
  stepLineActive: {
    backgroundColor: DesignSystem.colors.primary },
  stepContent: {
    padding: 16 },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
    marginBottom: 24,
    textAlign: 'center' },
  fileSection: {
    marginBottom: 24 },
  fileSectionHeader: {
    marginBottom: 12 },
  fileLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: DesignSystem.colors.text.primary,
    marginBottom: 4 },
  required: {
    color: DesignSystem.colors.error },
  fileDescription: {
    fontSize: 14,
    color: DesignSystem.colors.gray500 },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: DesignSystem.colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: 'rgba(229, 229, 229, 0.125)' },
  uploadText: {
    marginLeft: 8,
    fontSize: 16,
    color: DesignSystem.colors.primary,
    fontWeight: '500' },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(229, 229, 229, 0.25)',
    borderRadius: 8 },
  fileDetails: {
    flex: 1,
    marginLeft: 12 },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: DesignSystem.colors.text.primary },
  fileSize: {
    fontSize: 12,
    color: DesignSystem.colors.gray500,
    marginTop: 2 },
  fileRows: {
    fontSize: 12,
    color: DesignSystem.colors.primary,
    marginTop: 2 },
  errorBox: {
    marginTop: 8,
    padding: 12,
    backgroundColor: 'rgba(255, 59, 48, 0.0625)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.125)' },
  errorText: {
    fontSize: 14,
    color: DesignSystem.colors.error,
    marginBottom: 4 },
  actionButton: {
    backgroundColor: DesignSystem.colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24 },
  actionButtonText: {
    color: DesignSystem.colors.text.inverse,
    fontSize: 16,
    fontWeight: '600' },
  disabledButton: {
    backgroundColor: DesignSystem.colors.gray500,
    opacity: 0.5 },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: DesignSystem.colors.primary,
    marginBottom: 12 },
  secondaryButtonText: {
    color: DesignSystem.colors.primary,
    fontSize: 16,
    fontWeight: '600' },
  progressSection: {
    alignItems: 'center',
    paddingVertical: 24 },
  progressPhase: {
    fontSize: 16,
    fontWeight: '500',
    color: DesignSystem.colors.text.primary,
    marginBottom: 16 },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: DesignSystem.colors.gray200,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12 },
  progressFill: {
    height: '100%',
    backgroundColor: DesignSystem.colors.primary },
  progressText: {
    fontSize: 14,
    color: DesignSystem.colors.gray500,
    marginBottom: 8 },
  currentItem: {
    fontSize: 14,
    color: DesignSystem.colors.text.primary,
    marginTop: 8 },
  timeRemaining: {
    fontSize: 14,
    color: DesignSystem.colors.gray500,
    marginTop: 4 },
  issuesSummary: {
    flexDirection: 'row',
    marginTop: 16 },
  errorCount: {
    color: DesignSystem.colors.error,
    marginRight: 16 },
  warningCount: {
    color: DesignSystem.colors.warning },
  completeTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
    marginTop: 16,
    marginBottom: 24 },
  summarySection: {
    width: '100%',
    padding: 16,
    backgroundColor: 'rgba(229, 229, 229, 0.125)',
    borderRadius: 8,
    marginBottom: 24 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8 },
  summaryLabel: {
    fontSize: 14,
    color: DesignSystem.colors.gray500 },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary },
  successText: {
    color: DesignSystem.colors.success },
  warningText: {
    color: DesignSystem.colors.warning },
  completeActions: {
    width: '100%' } });

// 匯出元件
export default LegacyDataImportScreen;