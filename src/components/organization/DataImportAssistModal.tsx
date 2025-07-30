/**
 * 資料匯入協助 Modal
 * 協助組織匯入 CSV/Excel 資料到不同實體
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
import { Icon } from '@/components/common/Icon';
import DocumentPicker from 'expo-document-picker';
import { Organization } from '@/types/entities';
import { DesignSystem } from '@/theme/designSystem';
import { toast } from '@/utils/toast';
import { Button } from '@/components/common/Button';
import { importUserData } from '@/services/firebase/admin/userAssistService';

interface DataImportAssistModalProps {
  visible: boolean;
  organization: Organization;
  onClose: () => void;
}

type DataType = 'users' | 'customers' | 'tasks';

interface ImportOption {
  key: DataType;
  title: string;
  description: string;
  icon: string;
  color: string;
}

const IMPORT_OPTIONS: ImportOption[] = [
  {
    key: 'users',
    title: '用戶資料',
    description: '匯入員工或團隊成員資訊',
    icon: 'people-outline',
    color: DesignSystem.colors.primary,
  },
  {
    key: 'customers',
    title: '客戶資料',
    description: '匯入客戶聯絡資訊和公司資料',
    icon: 'business-outline',
    color: DesignSystem.colors.success,
  },
  {
    key: 'tasks',
    title: '任務資料',
    description: '匯入工作任務和待辦事項',
    icon: 'checkbox-outline',
    color: DesignSystem.colors.warning,
  },
];

const TEMPLATE_DATA = {
  users: `姓名,電子郵件,電話,部門,職位
張小明,zhang@example.com,0912-345678,業務部,業務專員
李小華,li@example.com,0923-456789,管理部,經理`,
  customers: `公司名稱,聯絡人,電子郵件,電話,地址
ABC公司,王經理,wang@abc.com,02-12345678,台北市信義區
XYZ企業,陳總監,chen@xyz.com,03-87654321,新竹市東區`,
  tasks: `任務標題,描述,負責人,截止日期,狀態
準備月報告,整理本月業績數據,張小明,2024-03-31,pending
客戶拜訪,拜訪重要客戶討論合作,李小華,2024-03-28,pending`,
};

export const DataImportAssistModal: React.FC<DataImportAssistModalProps> = ({
  visible,
  organization,
  onClose,
}) => {
  const [selectedType, setSelectedType] = useState<DataType | null>(null);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState<'select' | 'upload' | 'importing' | 'complete'>('select');

  const handleSelectType = (type: DataType) => {
    setSelectedType(type);
    setCurrentStep('upload');
  };

  const handleSelectFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedFile(result.assets[0]);
      }
    } catch (error) {
      console.error('選擇檔案失敗:', error);
      toast.error('選擇檔案失敗');
    }
  };

  const handleImport = async () => {
    if (!selectedFile || !selectedType) return;

    setIsImporting(true);
    setCurrentStep('importing');

    try {
      // 解析檔案內容
      const response = await fetch(selectedFile.uri);
      const csvText = await response.text();
      
      // 簡單的 CSV 解析
      const lines = csvText.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const data = lines.slice(1).map((line) => {
        const values = line.split(',').map(v => v.trim());
        const row: any = {};
        headers.forEach((header, i) => {
          row[header] = values[i] || '';
        });
        return row;
      });

      // 匯入資料
      const result = await importUserData(data, selectedType);
      
      setImportResult(result);
      setCurrentStep('complete');

      if (result.success) {
        toast.success(`成功匯入 ${result.imported} 筆資料`);
      } else {
        toast.error(`匯入完成，但有 ${result.failed} 筆失敗`);
      }
    } catch (error) {
      console.error('匯入失敗:', error);
      toast.error('匯入失敗');
      setCurrentStep('upload');
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    if (!isImporting) {
      setSelectedType(null);
      setSelectedFile(null);
      setImportResult(null);
      setCurrentStep('select');
      onClose();
    }
  };

  const showTemplate = () => {
    if (!selectedType) return;
    
    Alert.alert(
      '範本格式',
      `${IMPORT_OPTIONS.find(opt => opt.key === selectedType)?.title} CSV 格式範例：\n\n${TEMPLATE_DATA[selectedType]}`,
      [{ text: '知道了', style: 'default' }]
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'select':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>選擇要匯入的資料類型</Text>
            <Text style={styles.stepDesc}>
              請選擇您要匯入的資料類型，系統會引導您完成匯入流程
            </Text>

            {IMPORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={styles.optionCard}
                onPress={() => handleSelectType(option.key)}
              >
                <View style={[styles.optionIcon, { backgroundColor: option.color + '20' }]}>
                  <Icon name={option.icon as any} size={24} color={option.color} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionDesc}>{option.description}</Text>
                </View>
                <Icon name="chevron-forward" size={20} color={DesignSystem.colors.text.secondary} />
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'upload':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>上傳 {IMPORT_OPTIONS.find(opt => opt.key === selectedType)?.title} 檔案</Text>
            <Text style={styles.stepDesc}>
              請選擇包含資料的 CSV 或 Excel 檔案
            </Text>

            <View style={styles.uploadArea}>
              <Icon name="cloud-upload-outline" size={48} color={DesignSystem.colors.primary} />
              <Text style={styles.uploadTitle}>選擇檔案</Text>
              <Text style={styles.uploadDesc}>
                支援 CSV、Excel 格式
              </Text>
              
              <Button
                title="選擇檔案"
                onPress={handleSelectFile}
                style={styles.uploadButton}
              />

              <TouchableOpacity onPress={showTemplate} style={styles.templateLink}>
                <Icon name="document-text-outline" size={16} color={DesignSystem.colors.primary} />
                <Text style={styles.templateText}>查看格式範例</Text>
              </TouchableOpacity>
            </View>

            {selectedFile && (
              <View style={styles.selectedFile}>
                <Text style={styles.selectedFileName}>已選擇：{selectedFile.name}</Text>
                <View style={styles.uploadActions}>
                  <Button
                    title="重新選擇"
                    onPress={handleSelectFile}
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
            )}
          </View>
        );

      case 'importing':
        return (
          <View style={styles.stepContent}>
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingTitle}>正在匯入資料...</Text>
              <Text style={styles.loadingDesc}>
                請稍候，正在處理您的檔案
              </Text>
            </View>
          </View>
        );

      case 'complete':
        return (
          <View style={styles.stepContent}>
            <View style={styles.resultContainer}>
              <Icon 
                name={importResult?.success ? "checkmark-circle" : "alert-circle"} 
                size={48} 
                color={importResult?.success ? DesignSystem.colors.success : DesignSystem.colors.warning} 
              />
              <Text style={styles.resultTitle}>
                {importResult?.success ? '匯入完成' : '匯入完成（有錯誤）'}
              </Text>
              
              {importResult && (
                <View style={styles.resultStats}>
                  <Text style={styles.resultStat}>
                    成功: {importResult.imported} 筆
                  </Text>
                  <Text style={styles.resultStat}>
                    失敗: {importResult.failed} 筆
                  </Text>
                  {importResult.errors?.length > 0 && (
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
          <TouchableOpacity
            onPress={handleClose}
            style={styles.closeButton}
            disabled={isImporting}
          >
            <Icon name="close" size={24} color={DesignSystem.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>資料匯入協助</Text>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderStepContent()}
        </ScrollView>
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
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingVertical: DesignSystem.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light,
  },
  closeButton: {
    padding: DesignSystem.spacing.sm,
    marginRight: DesignSystem.spacing.sm,
  },
  headerTitle: {
    ...DesignSystem.typography.h4,
    color: DesignSystem.colors.text.primary,
  },
  content: {
    flex: 1,
  },
  stepContent: {
    padding: DesignSystem.spacing.lg,
  },
  stepTitle: {
    ...DesignSystem.typography.h3,
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.sm,
  },
  stepDesc: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.secondary,
    marginBottom: DesignSystem.spacing.lg,
    lineHeight: 20,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DesignSystem.colors.background.surface,
    padding: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.borderRadius.md,
    marginBottom: DesignSystem.spacing.md,
    ...DesignSystem.shadows.sm,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: DesignSystem.spacing.md,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary,
    fontWeight: '600',
    marginBottom: DesignSystem.spacing.xs,
  },
  optionDesc: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
  },
  uploadArea: {
    backgroundColor: DesignSystem.colors.background.surface,
    borderWidth: 2,
    borderColor: DesignSystem.colors.border.light,
    borderStyle: 'dashed',
    borderRadius: DesignSystem.borderRadius.lg,
    padding: DesignSystem.spacing.xl,
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.lg,
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
  selectedFile: {
    backgroundColor: DesignSystem.colors.background.surface,
    padding: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.borderRadius.md,
  },
  selectedFileName: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary,
    fontWeight: '500',
    marginBottom: DesignSystem.spacing.md,
  },
  uploadActions: {
    flexDirection: 'row',
    gap: DesignSystem.spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: DesignSystem.spacing.xl,
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
    alignItems: 'center',
    paddingVertical: DesignSystem.spacing.xl,
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