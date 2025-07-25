/**
 * 批量匯入用戶 Modal
 * 支援 CSV 檔案上傳和批量建立用戶
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DocumentPicker from 'expo-document-picker';
import { Organization } from '@/types/entities';
import { DesignSystem } from '@/theme/designSystem';
import { toast } from '@/utils/toast';
import { Button } from '@/components/common/Button';
import { importUserData } from '@/services/firebase/admin/userAssistService';

interface BulkImportUsersModalProps {
  visible: boolean;
  organization: Organization;
  onClose: () => void;
  onImportComplete?: (result: any) => void;
}

interface ImportStep {
  key: 'select' | 'preview' | 'importing' | 'complete';
  title: string;
  description: string;
}

const IMPORT_STEPS: ImportStep[] = [
  {
    key: 'select',
    title: '選擇檔案',
    description: '上傳包含用戶資料的 CSV 檔案',
  },
  {
    key: 'preview',
    title: '預覽資料',
    description: '確認欄位映射和資料格式',
  },
  {
    key: 'importing',
    title: '匯入中',
    description: '正在建立用戶帳號...',
  },
  {
    key: 'complete',
    title: '完成',
    description: '匯入結果摘要',
  },
];

const CSV_TEMPLATE = `email,name,role,department,position
john@example.com,張小明,user,業務部,業務專員
mary@example.com,李小華,admin,管理部,經理
bob@example.com,王小強,user,技術部,工程師`;

export const BulkImportUsersModal: React.FC<BulkImportUsersModalProps> = ({
  visible,
  organization,
  onClose,
  onImportComplete,
}) => {
  const [currentStep, setCurrentStep] = useState<ImportStep['key']>('select');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [importResult, setImportResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelectFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        setSelectedFile(file);
        
        // 解析 CSV 檔案
        await parseCSVFile(file.uri);
        setCurrentStep('preview');
      }
    } catch (error) {
      console.error('選擇檔案失敗:', error);
      toast.error('選擇檔案失敗');
    }
  };

  const parseCSVFile = async (fileUri: string) => {
    try {
      const response = await fetch(fileUri);
      const csvText = await response.text();
      
      // 簡單的 CSV 解析
      const lines = csvText.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const data = lines.slice(1).map((line, index) => {
        const values = line.split(',').map(v => v.trim());
        const row: any = { _rowNumber: index + 2 }; // +2 因為標題行 + 0-based index
        
        headers.forEach((header, i) => {
          row[header] = values[i] || '';
        });
        
        return row;
      });
      
      setParsedData(data);
    } catch (error) {
      console.error('解析 CSV 檔案失敗:', error);
      toast.error('解析檔案失敗，請確認格式正確');
    }
  };

  const handleImport = async () => {
    if (parsedData.length === 0) {
      toast.error('沒有可匯入的資料');
      return;
    }

    setIsProcessing(true);
    setCurrentStep('importing');

    try {
      // 轉換資料格式並匯入
      const result = await importUserData(parsedData, 'users');
      
      setImportResult(result);
      setCurrentStep('complete');
      
      if (result.success) {
        toast.success(`成功匯入 ${result.imported} 個用戶`);
        onImportComplete?.(result);
      } else {
        toast.error(`匯入失敗，錯誤: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      console.error('批量匯入失敗:', error);
      toast.error('匯入失敗');
      setCurrentStep('preview');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      // 重置狀態
      setCurrentStep('select');
      setSelectedFile(null);
      setParsedData([]);
      setImportResult(null);
      onClose();
    }
  };

  const downloadTemplate = () => {
    // 建立並下載 CSV 範本
    Alert.alert(
      '下載範本',
      'CSV 檔案應包含以下欄位：\n\n' +
      '• email (必填): 用戶電子郵件\n' +
      '• name (必填): 用戶姓名\n' +
      '• role (選填): user 或 admin\n' +
      '• department (選填): 部門\n' +
      '• position (選填): 職位\n\n' +
      '範例：\n' + CSV_TEMPLATE,
      [{ text: '知道了', style: 'default' }]
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'select':
        return (
          <View style={styles.stepContent}>
            <View style={styles.uploadArea}>
              <Ionicons name="cloud-upload-outline" size={48} color={DesignSystem.colors.primary} />
              <Text style={styles.uploadTitle}>選擇 CSV 檔案</Text>
              <Text style={styles.uploadDesc}>
                上傳包含用戶資料的 CSV 檔案
              </Text>
              <Button
                title="選擇檔案"
                onPress={handleSelectFile}
                style={styles.uploadButton}
              />
              <TouchableOpacity onPress={downloadTemplate} style={styles.templateLink}>
                <Ionicons name="download-outline" size={16} color={DesignSystem.colors.primary} />
                <Text style={styles.templateText}>查看 CSV 格式說明</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'preview':
        return (
          <View style={styles.stepContent}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>
                已選擇檔案：{selectedFile?.name}
              </Text>
              <Text style={styles.previewCount}>
                共 {parsedData.length} 筆資料
              </Text>
            </View>

            <ScrollView style={styles.previewList} showsVerticalScrollIndicator={false}>
              {parsedData.slice(0, 5).map((user, index) => (
                <View key={index} style={styles.previewItem}>
                  <Text style={styles.previewItemTitle}>{user.name || '未命名'}</Text>
                  <Text style={styles.previewItemEmail}>{user.email}</Text>
                  <Text style={styles.previewItemRole}>
                    {user.role === 'admin' ? '管理員' : '一般用戶'}
                  </Text>
                  {user.department && (
                    <Text style={styles.previewItemDept}>{user.department}</Text>
                  )}
                </View>
              ))}
              {parsedData.length > 5 && (
                <Text style={styles.moreItems}>
                  還有 {parsedData.length - 5} 筆資料...
                </Text>
              )}
            </ScrollView>

            <View style={styles.previewActions}>
              <Button
                title="重新選擇"
                onPress={() => setCurrentStep('select')}
                variant="outline"
                style={styles.actionButton}
              />
              <Button
                title="開始匯入"
                onPress={handleImport}
                style={styles.actionButton}
              />
            </View>
          </View>
        );

      case 'importing':
        return (
          <View style={styles.stepContent}>
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingTitle}>正在匯入用戶...</Text>
              <Text style={styles.loadingDesc}>
                請稍候，正在建立 {parsedData.length} 個用戶帳號
              </Text>
            </View>
          </View>
        );

      case 'complete':
        return (
          <View style={styles.stepContent}>
            <View style={styles.resultContainer}>
              <Ionicons 
                name={importResult?.success ? "checkmark-circle" : "alert-circle"} 
                size={48} 
                color={importResult?.success ? DesignSystem.colors.success : DesignSystem.colors.error} 
              />
              <Text style={styles.resultTitle}>
                {importResult?.success ? '匯入完成' : '匯入失敗'}
              </Text>
              
              {importResult && (
                <View style={styles.resultStats}>
                  <Text style={styles.resultStat}>
                    成功: {importResult.imported} 個用戶
                  </Text>
                  <Text style={styles.resultStat}>
                    失敗: {importResult.failed} 個用戶
                  </Text>
                  {importResult.errors.length > 0 && (
                    <View style={styles.errorList}>
                      <Text style={styles.errorTitle}>錯誤詳情:</Text>
                      {importResult.errors.slice(0, 3).map((error: string, index: number) => (
                        <Text key={index} style={styles.errorItem}>• {error}</Text>
                      ))}
                    </View>
                  )}
                </View>
              )}
              
              <Button
                title="完成"
                onPress={handleClose}
                style={styles.completeButton}
              />
            </View>
          </View>
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
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              disabled={isProcessing}
            >
              <Ionicons name="close" size={24} color={DesignSystem.colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>批量匯入用戶</Text>
          </View>
        </View>

        {/* Step Indicator */}
        <View style={styles.stepIndicator}>
          {IMPORT_STEPS.map((step, index) => {
            const isActive = currentStep === step.key;
            const isCompleted = IMPORT_STEPS.findIndex(s => s.key === currentStep) > index;
            
            return (
              <View key={step.key} style={styles.stepItem}>
                <View style={[
                  styles.stepCircle,
                  isActive && styles.stepCircleActive,
                  isCompleted && styles.stepCircleCompleted,
                ]}>
                  <Text style={[
                    styles.stepNumber,
                    (isActive || isCompleted) && styles.stepNumberActive,
                  ]}>
                    {index + 1}
                  </Text>
                </View>
                <Text style={[
                  styles.stepTitle,
                  isActive && styles.stepTitleActive,
                ]}>
                  {step.title}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Content */}
        {renderStepContent()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingVertical: DesignSystem.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  closeButton: {
    padding: DesignSystem.spacing.sm,
    marginRight: DesignSystem.spacing.sm,
  },
  headerTitle: {
    ...DesignSystem.typography.h4,
    color: DesignSystem.colors.text.primary,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingVertical: DesignSystem.spacing.lg,
    backgroundColor: DesignSystem.colors.background.surface,
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: DesignSystem.colors.background.primary,
    borderWidth: 2,
    borderColor: DesignSystem.colors.border.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.xs,
  },
  stepCircleActive: {
    borderColor: DesignSystem.colors.primary,
    backgroundColor: DesignSystem.colors.primary,
  },
  stepCircleCompleted: {
    borderColor: DesignSystem.colors.success,
    backgroundColor: DesignSystem.colors.success,
  },
  stepNumber: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    fontWeight: '600',
  },
  stepNumberActive: {
    color: DesignSystem.colors.text.inverse,
  },
  stepTitle: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    textAlign: 'center',
  },
  stepTitleActive: {
    color: DesignSystem.colors.primary,
    fontWeight: '500',
  },
  stepContent: {
    flex: 1,
    padding: DesignSystem.spacing.lg,
  },
  uploadArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: DesignSystem.colors.border.light,
    borderStyle: 'dashed',
    borderRadius: DesignSystem.borderRadius.lg,
    padding: DesignSystem.spacing.xl,
  },
  uploadTitle: {
    ...DesignSystem.typography.h4,
    color: DesignSystem.colors.text.primary,
    marginTop: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.sm,
  },
  uploadDesc: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.secondary,
    textAlign: 'center',
    marginBottom: DesignSystem.spacing.lg,
  },
  uploadButton: {
    marginBottom: DesignSystem.spacing.md,
  },
  templateLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSystem.spacing.xs,
  },
  templateText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.primary,
  },
  previewHeader: {
    marginBottom: DesignSystem.spacing.lg,
  },
  previewTitle: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary,
    fontWeight: '500',
  },
  previewCount: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    marginTop: DesignSystem.spacing.xs,
  },
  previewList: {
    flex: 1,
    marginBottom: DesignSystem.spacing.lg,
  },
  previewItem: {
    backgroundColor: DesignSystem.colors.background.surface,
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.sm,
    marginBottom: DesignSystem.spacing.sm,
  },
  previewItemTitle: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary,
    fontWeight: '500',
  },
  previewItemEmail: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    marginTop: DesignSystem.spacing.xs,
  },
  previewItemRole: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.primary,
    marginTop: DesignSystem.spacing.xs,
  },
  previewItemDept: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    marginTop: DesignSystem.spacing.xs,
  },
  moreItems: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  previewActions: {
    flexDirection: 'row',
    gap: DesignSystem.spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingTitle: {
    ...DesignSystem.typography.h4,
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.sm,
  },
  loadingDesc: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.secondary,
    textAlign: 'center',
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultTitle: {
    ...DesignSystem.typography.h3,
    color: DesignSystem.colors.text.primary,
    marginTop: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.lg,
  },
  resultStats: {
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.xl,
  },
  resultStat: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.xs,
  },
  errorList: {
    marginTop: DesignSystem.spacing.md,
    alignItems: 'flex-start',
  },
  errorTitle: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.error,
    fontWeight: '500',
    marginBottom: DesignSystem.spacing.xs,
  },
  errorItem: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    marginBottom: DesignSystem.spacing.xs,
  },
  completeButton: {
    minWidth: 120,
  },
});