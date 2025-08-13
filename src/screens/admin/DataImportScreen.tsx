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
  Alert } from 'react-native';
import { Layout } from '@/components/common/Layout';
import { Icon } from '@/components/common/Icon';
import { useNavigation } from '@react-navigation/native';
import { showToast } from '@/utils/toast';
import { DesignSystem } from '@/theme/designSystem';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
  ImportType,
  ImportResult,
  ImportProgress,
  parseImportFile,
  importData,
  generateImportTemplate,
  SmartDataImporter } from '@/services/firebase/admin/dataImportService';
import { useAuth } from '@/hooks/useAuth';
import { FieldMappingModal, FieldMapping, RelationMapping } from '@/components/import/FieldMappingModal';
import { withAlpha } from '@/utils/colorUtils';

export const DataImportScreen: React.FC = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();
  const [selectedType, setSelectedType] = useState<ImportType>('auto');
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<ImportResult | null>(null);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [relationMappings, setRelationMappings] = useState<RelationMapping[]>([]);
  
  // 匯入類型選項
  const importTypes = [
    { id: 'auto', label: '智慧識別', icon: 'flash-outline' },
    { id: 'customers', label: '客戶資料', icon: 'people-outline' },
    { id: 'records', label: '會議記錄', icon: 'document-text-outline' },
    { id: 'tasks', label: '任務清單', icon: 'checkbox-outline' },
    { id: 'users', label: '用戶資料', icon: 'person-outline' },
    { id: 'hierarchy', label: '層級結構', icon: 'git-branch-outline' },
  ];
  
  // 檔案選擇
  const handleFileSelect = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        copyToCacheDirectory: true,
        multiple: true, // 支援多檔案選擇
      });
      
      if (result.type === 'success') {
        // 處理多檔案
        const files = Array.isArray(result.output) ? result.output : [result];
        setSelectedFiles(files);
        setImportStatus(null);
        setImportProgress(null);
        
        // 如果是智慧識別模式，預覽第一個檔案
        if (selectedType === 'auto' && files.length > 0) {
          try {
            const firstFile = files[0];
            const data = await parseImportFile(firstFile.uri, firstFile.mimeType || '');
            
            if (data.length === 0) {
              showToast('error', '檔案是空的或格式不正確');
              setPreviewData([]);
              return;
            }
            
            // 設定預覽資料（最多顯示前 5 筆）
            setPreviewData(data.slice(0, 5));
            showToast('success', `已選擇 ${files.length} 個檔案，預覽第一個檔案的 ${data.length} 筆資料`);
          } catch (parseError) {
            showToast('error', `檔案解析失敗: ${parseError instanceof Error ? parseError.message : '未知錯誤'}`);
            setPreviewData([]);
          }
        } else if (files.length === 1) {
          // 單檔案模式
          try {
            const data = await parseImportFile(files[0].uri, files[0].mimeType || '');
            
            if (data.length === 0) {
              showToast('error', '檔案是空的或格式不正確');
              setPreviewData([]);
              return;
            }
            
            setPreviewData(data.slice(0, 5));
            showToast('success', `成功讀取 ${data.length} 筆資料`);
          } catch (parseError) {
            showToast('error', `檔案解析失敗: ${parseError instanceof Error ? parseError.message : '未知錯誤'}`);
            setPreviewData([]);
          }
        }
      }
    } catch (error) {
      showToast('error', '選擇檔案失敗');
    }
  };
  
  // 處理欄位映射確認
  const handleMappingConfirm = async (
    mappings: FieldMapping[],
    relations: RelationMapping[]
  ) => {
    setShowMappingModal(false);
    setFieldMappings(mappings);
    setRelationMappings(relations);
    
    if (!userProfile?.organizationId) {
      showToast('error', '無法取得組織資訊');
      return;
    }
    
    setImporting(true);
    setImportProgress({
      current: 0,
      total: 0,
      status: 'parsing',
      message: '準備匯入資料...' });
    
    try {
      const importer = new SmartDataImporter(userProfile.organizationId);
      const result = await importer.importMultipleFilesWithMapping(
        selectedFiles.map(f => ({
          uri: f.uri,
          name: f.name,
          type: f.mimeType
        })),
        mappings.map(m => ({
          fileIndex: m.fileIndex,
          fileType: m.fileType as ImportType,
          mappings: m.mappings,
          keyField: m.keyField
        })),
        relations.map(r => ({
          sourceFile: r.sourceFile,
          sourceField: r.sourceField,
          targetFile: r.targetFile,
          targetField: r.targetField
        })),
        (progress) => {
          setImportProgress(progress);
        }
      );
      
      setImportStatus(result);
      
      // 顯示詳細結果
      if (result.imported) {
        const details = [];
        if (result.imported.users > 0) details.push(`${result.imported.users} 位用戶`);
        if (result.imported.teams > 0) details.push(`${result.imported.teams} 個團隊`);
        if (result.imported.customers > 0) details.push(`${result.imported.customers} 位客戶`);
        if (result.imported.records > 0) details.push(`${result.imported.records} 筆紀錄`);
        
        if (details.length > 0) {
          showToast('success', `成功匯入: ${details.join(', ')}`);
        }
      }
      
      // 顯示警告
      if (result.warnings && result.warnings.length > 0) {
        result.warnings.forEach(warning => {
          console.log('Import warning:', warning);
        });
      }
    } catch (error) {
      showToast('error', `匯入失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
      setImportProgress({
        current: 0,
        total: 0,
        status: 'error',
        message: error instanceof Error ? error.message : '匯入失敗' });
    } finally {
      setImporting(false);
    }
  };
  
  // 開始匯入
  const handleImport = async () => {
    if (selectedFiles.length === 0) {
      showToast('error', '請先選擇檔案');
      return;
    }
    
    if (!userProfile?.organizationId) {
      showToast('error', '無法取得組織資訊');
      return;
    }
    
    const filesText = selectedFiles.length > 1 
      ? `${selectedFiles.length} 個檔案` 
      : '1 個檔案';
    
    Alert.alert(
      '確認匯入',
      selectedType === 'auto' 
        ? `使用智慧識別模式匯入 ${filesText}？\n系統將自動識別檔案類型並建立關聯`
        : `確定要匯入${getTypeLabel(selectedType)}嗎？\n\n總共 ${filesText}`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '確定',
          onPress: async () => {
            setImporting(true);
            setImportProgress({
              current: 0,
              total: previewData.length,
              status: 'parsing',
              message: '準備匯入資料...' });
            
            try {
              let result: ImportResult;
              
              if (selectedType === 'auto' && selectedFiles.length > 1) {
                // 顯示欄位映射配置 Modal
                setShowMappingModal(true);
                return; // 等待用戶確認映射
              } else {
                // 單檔案匯入
                const fullData = await parseImportFile(selectedFiles[0].uri, selectedFiles[0].mimeType || '');
                
                result = await importData(
                  selectedType === 'auto' ? 'customers' : selectedType,
                  fullData,
                  (progress) => {
                    setImportProgress(progress);
                  }
                );
              }
              
              setImportStatus(result);
              
              // 顯示詳細結果
              if (result.imported) {
                const details = [];
                if (result.imported.users > 0) details.push(`${result.imported.users} 位用戶`);
                if (result.imported.teams > 0) details.push(`${result.imported.teams} 個團隊`);
                if (result.imported.customers > 0) details.push(`${result.imported.customers} 位客戶`);
                if (result.imported.records > 0) details.push(`${result.imported.records} 筆紀錄`);
                
                if (details.length > 0) {
                  showToast('success', `成功匯入: ${details.join(', ')}`);
                } else if (result.failed === 0) {
                  showToast('success', `成功匯入所有 ${result.success} 筆資料`);
                } else {
                  showToast('warning', `匯入完成：成功 ${result.success} 筆，失敗 ${result.failed} 筆`);
                }
              } else if (result.failed === 0) {
                showToast('success', `成功匯入所有 ${result.success} 筆資料`);
              } else {
                showToast('warning', `匯入完成：成功 ${result.success} 筆，失敗 ${result.failed} 筆`);
              }
            } catch (error) {
              showToast('error', `匯入失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
              setImportProgress({
                current: 0,
                total: previewData.length,
                status: 'error',
                message: error instanceof Error ? error.message : '匯入失敗' });
            } finally {
              setImporting(false);
            }
          } },
      ]
    );
  };
  
  // 獲取類型標籤
  const getTypeLabel = (type: ImportType) => {
    return importTypes.find(t => t.id === type)?.label || '';
  };
  
  // 下載範本
  const handleDownloadTemplate = async () => {
    try {
      // 產生範本內容
      const templateContent = generateImportTemplate(selectedType);
      const fileName = `${getTypeLabel(selectedType)}_匯入範本.csv`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      // 寫入檔案
      await FileSystem.writeAsStringAsync(fileUri, templateContent, {
        encoding: FileSystem.EncodingType.UTF8 });
      
      // 分享檔案
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: '下載匯入範本' });
      } else {
        showToast('error', '您的裝置不支援檔案分享功能');
      }
    } catch (error) {
      showToast('error', '下載範本失敗');
      console.error('下載範本錯誤:', error);
    }
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
            <Icon name="arrow-back" size={24} color={DesignSystem.colors.text.primary} />
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
                <Icon
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
            <Icon name="cloud-upload-outline" size={48} color={DesignSystem.colors.text.secondary} />
            <Text style={styles.uploadText}>
              {selectedFiles.length > 0 
                ? selectedFiles.length === 1 
                  ? selectedFiles[0].name 
                  : `已選擇 ${selectedFiles.length} 個檔案`
                : '點擊選擇 CSV 或 Excel 檔案（可多選）'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.templateLink}
            onPress={handleDownloadTemplate}
          >
            <Icon name="download-outline" size={20} color={DesignSystem.colors.primary} />
            <Text style={styles.templateText}>下載匯入範本</Text>
          </TouchableOpacity>
        </View>
        
        {/* 資料預覽 */}
        {previewData.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>資料預覽 (前 {Math.min(5, previewData.length)} 筆)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.previewTable}>
                {/* 表頭 */}
                <View style={styles.previewRow}>
                  {Object.keys(previewData[0]).map((key) => (
                    <Text key={key} style={styles.previewHeader}>{key}</Text>
                  ))}
                </View>
                {/* 資料列 */}
                {previewData.slice(0, 5).map((row, index) => (
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
                    <Text key={index} style={styles.errorItem}>
                      • 第 {error.row} 列: {error.message}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}
        
        {/* 匯入進度 */}
        {importProgress && importing && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>匯入進度</Text>
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>{importProgress.message}</Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${(importProgress.current / importProgress.total) * 100}%`,
                      backgroundColor: importProgress.status === 'error' 
                        ? DesignSystem.colors.error 
                        : DesignSystem.colors.primary 
                    }
                  ]} 
                />
              </View>
              <Text style={styles.progressCount}>
                {importProgress.current} / {importProgress.total}
              </Text>
            </View>
          </View>
        )}
        
        {/* 匯入按鈕 */}
        <TouchableOpacity
          style={[
            styles.importButton,
            (selectedFiles.length === 0 || importing) && styles.importButtonDisabled,
          ]}
          onPress={handleImport}
          disabled={selectedFiles.length === 0 || importing}
        >
          {importing ? (
            <ActivityIndicator color={DesignSystem.colors.white} />
          ) : (
            <>
              <Icon name="cloud-upload" size={20} color={DesignSystem.colors.white} />
              <Text style={styles.importButtonText}>開始匯入</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
      
      {/* 欄位映射配置 Modal */}
      {showMappingModal && (
        <FieldMappingModal
          visible={showMappingModal}
          files={selectedFiles.map(f => ({
            uri: f.uri,
            name: f.name,
            mimeType: f.mimeType
          }))}
          onConfirm={handleMappingConfirm}
          onCancel={() => {
            setShowMappingModal(false);
            setImporting(false);
          }}
        />
      )}
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignSystem.spacing.lg,
    backgroundColor: DesignSystem.colors.background.surface,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light },
  backButton: {
    marginRight: DesignSystem.spacing.md },
  title: {
    ...DesignSystem.typography.h1,
    color: DesignSystem.colors.text.primary },
  section: {
    backgroundColor: DesignSystem.colors.background.surface,
    padding: DesignSystem.spacing.lg,
    marginVertical: 8 },
  sectionTitle: {
    ...DesignSystem.typography.h2,
    color: DesignSystem.colors.text.primary,
    marginBottom: 16 },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12 },
  typeCard: {
    width: '47%',
    padding: 20,
    alignItems: 'center',
    backgroundColor: DesignSystem.colors.background.elevated,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: DesignSystem.colors.border.light },
  typeCardActive: {
    borderColor: DesignSystem.colors.primary,
    backgroundColor: withAlpha(DesignSystem.colors.primary, 0.063) },
  typeLabel: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.secondary,
    marginTop: 8 },
  typeLabelActive: {
    color: DesignSystem.colors.primary,
    fontWeight: '600' },
  uploadButton: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: DesignSystem.colors.background.elevated,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: DesignSystem.colors.border.light,
    borderStyle: 'dashed' },
  uploadText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.secondary,
    marginTop: 12,
    textAlign: 'center' },
  templateLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8 },
  templateText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.primary },
  previewTable: {
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.light,
    borderRadius: 8,
    overflow: 'hidden' },
  previewRow: {
    flexDirection: 'row' },
  previewHeader: {
    ...DesignSystem.typography.caption,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
    padding: 12,
    minWidth: 120,
    backgroundColor: DesignSystem.colors.background.elevated,
    borderRightWidth: 1,
    borderRightColor: DesignSystem.colors.border.light },
  previewCell: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary,
    padding: 12,
    minWidth: 120,
    borderRightWidth: 1,
    borderRightColor: DesignSystem.colors.border.light },
  statusContainer: {
    backgroundColor: DesignSystem.colors.background.elevated,
    padding: 16,
    borderRadius: 8 },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8 },
  statusLabel: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.secondary },
  statusValue: {
    ...DesignSystem.typography.body,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary },
  successText: {
    color: DesignSystem.colors.success },
  errorText: {
    color: DesignSystem.colors.error },
  errorContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: DesignSystem.colors.border.light },
  errorTitle: {
    ...DesignSystem.typography.caption,
    fontWeight: '600',
    color: DesignSystem.colors.error,
    marginBottom: 8 },
  errorItem: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    marginVertical: 2 },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignSystem.colors.primary,
    padding: 16,
    margin: 20,
    borderRadius: 12,
    gap: 8 },
  importButtonDisabled: {
    backgroundColor: DesignSystem.colors.gray400 },
  importButtonText: {
    ...DesignSystem.typography.button,
    color: DesignSystem.colors.white,
    fontWeight: '600' },
  progressContainer: {
    gap: 12 },
  progressText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.secondary,
    textAlign: 'center' },
  progressBar: {
    height: 8,
    backgroundColor: DesignSystem.colors.background.elevated,
    borderRadius: 4,
    overflow: 'hidden' },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    transition: 'width 0.3s ease' },
  progressCount: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    textAlign: 'center' } });