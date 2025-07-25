/**
 * 資料匯入頁面（Enterprise Admin）
 * 批量匯入客戶和記錄資料
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Layout } from '@/components/common/Layout';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { showToast } from '@/utils/toast';
import { DesignSystem } from '@/theme/designSystem';
import * as DocumentPicker from 'expo-document-picker';

type ImportType = 'customers' | 'records' | 'tasks' | 'users';

interface ImportStatus {
  total: number;
  success: number;
  failed: number;
  errors: string[];
}

export const DataImportScreen: React.FC = () => {
  const navigation = useNavigation();
  const [selectedType, setSelectedType] = useState<ImportType>('customers');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<ImportStatus | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  
  // 匯入類型選項
  const importTypes = [
    { id: 'customers', label: '客戶資料', icon: 'people-outline' },
    { id: 'records', label: '會議記錄', icon: 'document-text-outline' },
    { id: 'tasks', label: '任務清單', icon: 'checkbox-outline' },
    { id: 'users', label: '用戶資料', icon: 'person-outline' },
  ];
  
  // 檔案選擇
  const handleFileSelect = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        copyToCacheDirectory: true,
      });
      
      if (result.type === 'success') {
        setSelectedFile(result);
        // TODO: 讀取和預覽檔案內容
        setPreviewData([
          { 姓名: '張三', 公司: 'ABC公司', 電子郵件: 'zhang@abc.com' },
          { 姓名: '李四', 公司: 'XYZ公司', 電子郵件: 'li@xyz.com' },
          { 姓名: '王五', 公司: '123公司', 電子郵件: 'wang@123.com' },
        ]);
        setImportStatus(null);
      }
    } catch (error) {
      showToast('error', '選擇檔案失敗');
    }
  };
  
  // 開始匯入
  const handleImport = async () => {
    if (!selectedFile) {
      showToast('error', '請先選擇檔案');
      return;
    }
    
    Alert.alert(
      '確認匯入',
      `確定要匯入 ${previewData.length} 筆${getTypeLabel(selectedType)}嗎？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '確定',
          onPress: async () => {
            setImporting(true);
            
            try {
              // TODO: 實作實際的匯入邏輯
              // 模擬匯入過程
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              // 模擬匯入結果
              const status: ImportStatus = {
                total: previewData.length,
                success: previewData.length - 1,
                failed: 1,
                errors: ['第3列: 電子郵件格式錯誤'],
              };
              
              setImportStatus(status);
              showToast('success', `匯入完成：成功 ${status.success} 筆，失敗 ${status.failed} 筆`);
            } catch (error) {
              showToast('error', '匯入失敗');
            } finally {
              setImporting(false);
            }
          },
        },
      ]
    );
  };
  
  // 獲取類型標籤
  const getTypeLabel = (type: ImportType) => {
    return importTypes.find(t => t.id === type)?.label || '';
  };
  
  // 下載範本
  const handleDownloadTemplate = () => {
    showToast('info', '此功能尚未完成');
    // TODO: 實作下載範本功能
  };
  
  return (
    <Layout>
      <ScrollView style={styles.container}>
        {/* 頁面標題 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={DesignSystem.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>資料匯入</Text>
        </View>
        
        {/* 匯入類型選擇 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>選擇匯入類型</Text>
          <View style={styles.typeGrid}>
            {importTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeCard,
                  selectedType === type.id && styles.typeCardActive,
                ]}
                onPress={() => setSelectedType(type.id as ImportType)}
              >
                <Ionicons
                  name={type.icon as any}
                  size={32}
                  color={selectedType === type.id ? DesignSystem.colors.primary : DesignSystem.colors.text.secondary}
                />
                <Text style={[
                  styles.typeLabel,
                  selectedType === type.id && styles.typeLabelActive,
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* 檔案選擇 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>上傳檔案</Text>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleFileSelect}
          >
            <Ionicons name="cloud-upload-outline" size={48} color={DesignSystem.colors.text.secondary} />
            <Text style={styles.uploadText}>
              {selectedFile ? selectedFile.name : '點擊選擇 CSV 或 Excel 檔案'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.templateLink}
            onPress={handleDownloadTemplate}
          >
            <Ionicons name="download-outline" size={20} color={DesignSystem.colors.primary} />
            <Text style={styles.templateText}>下載匯入範本</Text>
          </TouchableOpacity>
        </View>
        
        {/* 資料預覽 */}
        {previewData.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>資料預覽 (前 3 筆)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.previewTable}>
                {/* 表頭 */}
                <View style={styles.previewRow}>
                  {Object.keys(previewData[0]).map((key) => (
                    <Text key={key} style={styles.previewHeader}>{key}</Text>
                  ))}
                </View>
                {/* 資料列 */}
                {previewData.slice(0, 3).map((row, index) => (
                  <View key={index} style={styles.previewRow}>
                    {Object.values(row).map((value: any, i) => (
                      <Text key={i} style={styles.previewCell}>{value}</Text>
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}
        
        {/* 匯入結果 */}
        {importStatus && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>匯入結果</Text>
            <View style={styles.statusContainer}>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>總計:</Text>
                <Text style={styles.statusValue}>{importStatus.total} 筆</Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>成功:</Text>
                <Text style={[styles.statusValue, styles.successText]}>
                  {importStatus.success} 筆
                </Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>失敗:</Text>
                <Text style={[styles.statusValue, styles.errorText]}>
                  {importStatus.failed} 筆
                </Text>
              </View>
              
              {importStatus.errors.length > 0 && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorTitle}>錯誤訊息:</Text>
                  {importStatus.errors.map((error, index) => (
                    <Text key={index} style={styles.errorItem}>• {error}</Text>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}
        
        {/* 匯入按鈕 */}
        <TouchableOpacity
          style={[
            styles.importButton,
            (!selectedFile || importing) && styles.importButtonDisabled,
          ]}
          onPress={handleImport}
          disabled={!selectedFile || importing}
        >
          {importing ? (
            <ActivityIndicator color={DesignSystem.colors.white} />
          ) : (
            <>
              <Ionicons name="cloud-upload" size={20} color={DesignSystem.colors.white} />
              <Text style={styles.importButtonText}>開始匯入</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignSystem.spacing.lg,
    backgroundColor: DesignSystem.colors.background.surface,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light,
  },
  backButton: {
    marginRight: DesignSystem.spacing.md,
  },
  title: {
    ...DesignSystem.typography.h1,
    color: DesignSystem.colors.text.primary,
  },
  section: {
    backgroundColor: DesignSystem.colors.background.surface,
    padding: DesignSystem.spacing.lg,
    marginVertical: 8,
  },
  sectionTitle: {
    ...DesignSystem.typography.h2,
    color: DesignSystem.colors.text.primary,
    marginBottom: 16,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    width: '47%',
    padding: 20,
    alignItems: 'center',
    backgroundColor: DesignSystem.colors.background.elevated,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: DesignSystem.colors.border.light,
  },
  typeCardActive: {
    borderColor: DesignSystem.colors.primary,
    backgroundColor: DesignSystem.colors.primary + '10',
  },
  typeLabel: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.secondary,
    marginTop: 8,
  },
  typeLabelActive: {
    color: DesignSystem.colors.primary,
    fontWeight: '600',
  },
  uploadButton: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: DesignSystem.colors.background.elevated,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: DesignSystem.colors.border.light,
    borderStyle: 'dashed',
  },
  uploadText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.secondary,
    marginTop: 12,
    textAlign: 'center',
  },
  templateLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  templateText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.primary,
  },
  previewTable: {
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.light,
    borderRadius: 8,
    overflow: 'hidden',
  },
  previewRow: {
    flexDirection: 'row',
  },
  previewHeader: {
    ...DesignSystem.typography.caption,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
    padding: 12,
    minWidth: 120,
    backgroundColor: DesignSystem.colors.background.elevated,
    borderRightWidth: 1,
    borderRightColor: DesignSystem.colors.border.light,
  },
  previewCell: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary,
    padding: 12,
    minWidth: 120,
    borderRightWidth: 1,
    borderRightColor: DesignSystem.colors.border.light,
  },
  statusContainer: {
    backgroundColor: DesignSystem.colors.background.elevated,
    padding: 16,
    borderRadius: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  statusLabel: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.secondary,
  },
  statusValue: {
    ...DesignSystem.typography.body,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
  },
  successText: {
    color: DesignSystem.colors.success,
  },
  errorText: {
    color: DesignSystem.colors.error,
  },
  errorContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: DesignSystem.colors.border.light,
  },
  errorTitle: {
    ...DesignSystem.typography.caption,
    fontWeight: '600',
    color: DesignSystem.colors.error,
    marginBottom: 8,
  },
  errorItem: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    marginVertical: 2,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignSystem.colors.primary,
    padding: 16,
    margin: 20,
    borderRadius: 12,
    gap: 8,
  },
  importButtonDisabled: {
    backgroundColor: DesignSystem.colors.gray[400],
  },
  importButtonText: {
    ...DesignSystem.typography.button,
    color: DesignSystem.colors.white,
    fontWeight: '600',
  },
});