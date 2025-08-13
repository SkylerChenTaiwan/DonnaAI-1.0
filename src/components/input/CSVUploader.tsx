/**
 * CSV 檔案上傳組件
 * 提供檔案選擇、數據預覽、驗證結果顯示和批量導入功能
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform } from 'react-native';
import { Icon } from '@/components/common/Icon';
import { pickDocument } from '@/utils/web-file-picker';
import * as FileSystem from 'expo-file-system';

import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { parseCSVFile, CSVParseResult, getCSVTemplate, validateFileSize } from '@/services/csv/parser';
import { validateCustomerBatch, ValidationSummary } from '@/services/csv/validator';
import { importCustomers, ImportResult, ImportOptions } from '@/services/csv/importer';
import { CustomerFormData } from '@/services/validation/form-schemas';
import { useAuthStore } from '@/stores/authStore';
import { useOrganization } from '@/hooks/useOrganization';
import { subscribeToFieldDefinitions } from '@/services/firebase/fieldDefinitions';
import { generateCSVTemplate, downloadCSVTemplate } from '@/utils/csvTemplateGenerator';
import { FieldConfig } from '@/types/fieldDefinitions';

export interface CSVUploaderProps {
  onComplete: (customers: CustomerFormData[]) => void;
  loading?: boolean;
  dataType: 'customer';
}

type UploadStage = 'select' | 'preview' | 'validate' | 'import' | 'complete';

export const CSVUploader: React.FC<CSVUploaderProps> = ({
  onComplete,
  loading: externalLoading = false,
  dataType }) => {
  const [stage, setStage] = useState<UploadStage>('select');
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: number;
    uri: string;
  } | null>(null);
  const [parseResult, setParseResult] = useState<CSVParseResult | null>(null);
  const [validationSummary, setValidationSummary] = useState<ValidationSummary | null>(null);
  const [importProgress, setImportProgress] = useState<{
    percentage: number;
    current: string;
    estimatedTime?: number;
  }>({ percentage: 0, current: '' });
  const [loading, setLoading] = useState(false);
  const [fields, setFields] = useState<FieldConfig[] | null>(null);
  
  // 從 auth store 獲取使用者資訊
  const { user } = useAuthStore.getState();
  const { currentOrganization } = useOrganization();

  // 訂閱欄位定義
  useEffect(() => {
    if (!currentOrganization || dataType !== 'customer') return;
    
    console.log('CSV 匯入器訂閱欄位定義');
    const unsubscribe = subscribeToFieldDefinitions(
      'customers',
      currentOrganization.id,
      (fieldConfigs) => {
        console.log('CSV 匯入器收到欄位定義:', fieldConfigs);
        setFields(fieldConfigs);
      }
    );
    
    return () => {
      unsubscribe();
    };
  }, [currentOrganization, dataType]);

  // 選擇檔案
  const handleFileSelect = useCallback(async () => {
    try {
      const result = await pickDocument({
        type: ['text/csv', 'application/csv', 'text/comma-separated-values'],
        copyToCacheDirectory: true,
        multiple: false });

      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0];
        
        // 驗證檔案大小（最大 10MB）
        if (!validateFileSize(file.size, 10)) {
          Alert.alert('檔案過大', '請選擇小於 10MB 的 CSV 檔案');
          return;
        }

        setSelectedFile({
          name: file.name,
          size: file.size,
          uri: file.uri });

        // 自動進行解析
        await parseFile(file.uri);
      }
    } catch (error) {
      console.error('檔案選擇失敗:', error);
      Alert.alert('錯誤', '檔案選擇失敗，請重試');
    }
  }, []);

  // 解析檔案
  const parseFile = useCallback(async (uri: string) => {
    try {
      setLoading(true);
      setStage('preview');

      let fileContent: string;
      
      // 根據平台不同處理檔案讀取
      if (Platform.OS === 'web' && uri.startsWith('data:')) {
        // Web 平台：從 data URL 提取內容
        const base64Data = uri.split(',')[1];
        fileContent = atob(base64Data);
      } else {
        // Native 平台：使用 FileSystem 讀取
        fileContent = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.UTF8 });
      }

      // 解析 CSV
      const result = await parseCSVFile(fileContent, {
        skipEmptyLines: true,
        trimWhitespace: true,
        checkDuplicates: true });

      setParseResult(result);

      if (result.validRows === 0) {
        Alert.alert(
          '解析失敗',
          '沒有找到有效的資料行，請檢查 CSV 檔案格式是否正確',
          [{ text: '重新選擇', onPress: () => setStage('select') }]
        );
        return;
      }

      // 如果有錯誤，顯示警告
      if (result.errors.length > 0) {
        Alert.alert(
          '發現問題',
          `檔案中有 ${result.errors.length} 個錯誤，${result.validRows} 行有效資料。是否要繼續處理有效的資料？`,
          [
            { text: '重新選擇', onPress: () => setStage('select') },
            { text: '繼續', onPress: () => validateData(result.data) },
          ]
        );
      } else {
        // 自動進行驗證
        await validateData(result.data);
      }
    } catch (error) {
      console.error('檔案解析失敗:', error);
      Alert.alert('解析失敗', '檔案格式不正確或檔案損壞');
      setStage('select');
    } finally {
      setLoading(false);
    }
  }, []);

  // 驗證數據
  const validateData = useCallback(async (data: CustomerFormData[]) => {
    try {
      setLoading(true);
      setStage('validate');

      const summary = validateCustomerBatch(data, {
        removeEmptyFields: true,
        standardizePhoneNumbers: true,
        standardizeEmails: true,
        trimWhitespace: true,
        capitalizeNames: true });

      setValidationSummary(summary);
      setStage('import');
    } catch (error) {
      console.error('資料驗證失敗:', error);
      Alert.alert('驗證失敗', '資料驗證過程中發生錯誤');
    } finally {
      setLoading(false);
    }
  }, []);

  // 開始導入
  const handleStartImport = useCallback(async () => {
    if (!parseResult || !validationSummary) return;

    try {
      setLoading(true);

      const options: ImportOptions = {
        batchSize: 100,
        skipDuplicates: true,
        updateExisting: false,
        userId: user?.uid || '',
        teamId: user?.teamId || '',
        organizationId: user?.organizationId || '',
        onProgress: (progress) => {
          setImportProgress({
            percentage: progress.percentage,
            current: progress.currentOperation,
            estimatedTime: progress.estimatedTimeRemaining });
        } };

      // 簡化：直接回傳客戶資料給父組件處理
      onComplete(parseResult.data);
      setStage('complete');

    } catch (error) {
      console.error('資料導入失敗:', error);
      Alert.alert('導入失敗', '資料導入過程中發生錯誤，請稍後重試');
    } finally {
      setLoading(false);
    }
  }, [parseResult, validationSummary, onComplete]);

  // 下載範本檔案
  const handleDownloadTemplate = useCallback(async () => {
    try {
      if (!fields) {
        Alert.alert('提示', '正在載入欄位定義，請稍後再試');
        return;
      }
      
      const fileName = `客戶資料範本_${new Date().getTime()}.csv`;
      
      // Web 平台可以直接下載
      if (Platform.OS === 'web') {
        downloadCSVTemplate(fields, fileName, true);
        Alert.alert('成功', '範本檔案已下載');
      } else {
        // 在 Expo 環境中，我們顯示範本內容讓用戶複製
        const template = generateCSVTemplate(fields, true);
        Alert.alert(
          'CSV 範本格式',
          template,
          [
            { text: '關閉' },
            { text: '複製', onPress: () => {
              // TODO: 實作複製到剪貼簿的功能
              Alert.alert('提示', '請手動複製上面的範本內容到 CSV 檔案中');
            }}
          ]
        );
      }
    } catch (error) {
      console.error('範本生成失敗:', error);
      Alert.alert('錯誤', '範本生成失敗');
    }
  }, [fields]);

  // 渲染不同階段的內容
  const renderContent = () => {
    switch (stage) {
      case 'select':
        return (
          <View style={styles.stageContainer}>
            <View style={styles.uploadArea}>
              <Icon name="cloud-upload-outline" size={64} color="#7A7A7A" />
              <Text style={styles.uploadTitle}>選擇 CSV 檔案</Text>
              <Text style={styles.uploadDescription}>
                支援的格式：CSV (.csv){'\n'}
                最大檔案大小：10MB
              </Text>
              
              <Button
                title="選擇檔案"
                onPress={handleFileSelect}
                style={styles.uploadButton}
              />
              
              <TouchableOpacity 
                style={styles.templateLink}
                onPress={handleDownloadTemplate}
              >
                <Icon name="download-outline" size={20} color="#1A1A1A" />
                <Text style={styles.templateText}>下載範本格式</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'preview':
      case 'validate':
        return (
          <View style={styles.stageContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <LoadingSpinner size="large" />
                <Text style={styles.loadingText}>
                  {stage === 'preview' ? '解析檔案中...' : '驗證資料中...'}
                </Text>
              </View>
            ) : null}
          </View>
        );

      case 'import':
        return (
          <View style={styles.stageContainer}>
            {/* 檔案資訊 */}
            {selectedFile && (
              <View style={styles.fileInfo}>
                <Text style={styles.fileName}>{selectedFile.name}</Text>
                <Text style={styles.fileSize}>
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </Text>
              </View>
            )}

            {/* 解析結果 */}
            {parseResult && (
              <View style={styles.resultSection}>
                <Text style={styles.sectionTitle}>解析結果</Text>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>總行數：</Text>
                  <Text style={styles.statValue}>{parseResult.totalRows}</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>有效資料：</Text>
                  <Text style={[styles.statValue, { color: '#22c55e' }]}>
                    {parseResult.validRows}
                  </Text>
                </View>
                {parseResult.invalidRows > 0 && (
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>無效資料：</Text>
                    <Text style={[styles.statValue, { color: '#ef4444' }]}>
                      {parseResult.invalidRows}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* 驗證摘要 */}
            {validationSummary && (
              <View style={styles.resultSection}>
                <Text style={styles.sectionTitle}>驗證摘要</Text>
                {validationSummary.warnings.length > 0 && (
                  <View style={styles.warningBox}>
                    <Icon name="warning-outline" size={20} color="#f59e0b" />
                    <Text style={styles.warningText}>
                      發現 {validationSummary.warnings.length} 個警告
                    </Text>
                  </View>
                )}
                {validationSummary.duplicateRecords.length > 0 && (
                  <View style={styles.warningBox}>
                    <Icon name="copy-outline" size={20} color="#f59e0b" />
                    <Text style={styles.warningText}>
                      發現 {validationSummary.duplicateRecords.length} 筆重複資料
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* 導入進度 */}
            {loading && (
              <View style={styles.progressSection}>
                <Text style={styles.progressTitle}>導入進度</Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { width: `${importProgress.percentage}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  {importProgress.current} ({importProgress.percentage.toFixed(1)}%)
                </Text>
                {importProgress.estimatedTime && (
                  <Text style={styles.estimatedTime}>
                    預估剩餘時間：{importProgress.estimatedTime} 秒
                  </Text>
                )}
              </View>
            )}
          </View>
        );

      case 'complete':
        return (
          <View style={styles.stageContainer}>
            <View style={styles.completeContainer}>
              <Icon name="checkmark-circle" size={64} color="#22c55e" />
              <Text style={styles.completeTitle}>導入完成</Text>
              <Text style={styles.completeDescription}>
                CSV 檔案已成功處理完畢
              </Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>

      {/* 內容區域 */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderContent()}
      </ScrollView>

      {/* 底部按鈕 */}
      <View style={styles.footer}>
        {stage === 'select' && (
          <Button
            title="取消"
            variant="secondary"
            onPress={() => setStage('select')}
            style={styles.button}
          />
        )}
        
        {stage === 'import' && !loading && (
          <>
            <Button
              title="重新選擇"
              variant="secondary"
              onPress={() => {
                setStage('select');
                setSelectedFile(null);
                setParseResult(null);
                setValidationSummary(null);
              }}
              style={styles.button}
            />
            <Button
              title="開始導入"
              onPress={handleStartImport}
              style={styles.button}
            />
          </>
        )}
        
        {stage === 'complete' && (
          <Button
            title="完成"
            onPress={() => setStage('select')}
            style={styles.button}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0' },
  content: {
    flex: 1 },
  stageContainer: {
    flex: 1,
    padding: 20 },
  uploadArea: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E3E1DC',
    borderStyle: 'dashed' },
  uploadTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8 },
  uploadDescription: {
    fontSize: 14,
    color: '#7A7A7A',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24 },
  uploadButton: {
    minWidth: 120 },
  templateLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 8 },
  templateText: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center' },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7A7A7A' },
  fileInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center' },
  fileName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    flex: 1 },
  fileSize: {
    fontSize: 14,
    color: '#7A7A7A' },
  resultSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12 },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4 },
  statLabel: {
    fontSize: 14,
    color: '#7A7A7A' },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A' },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8 },
  warningText: {
    fontSize: 14,
    color: '#f59e0b' },
  progressSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16 },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12 },
  progressBar: {
    height: 8,
    backgroundColor: '#E3E1DC',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden' },
  progressFill: {
    height: '100%',
    backgroundColor: '#1A1A1A',
    borderRadius: 4 },
  progressText: {
    fontSize: 14,
    color: '#7A7A7A',
    textAlign: 'center' },
  estimatedTime: {
    fontSize: 12,
    color: '#7A7A7A',
    textAlign: 'center',
    marginTop: 4 },
  completeContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 12 },
  completeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8 },
  completeDescription: {
    fontSize: 14,
    color: '#7A7A7A',
    textAlign: 'center' },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E3E1DC' },
  button: {
    flex: 1 } });