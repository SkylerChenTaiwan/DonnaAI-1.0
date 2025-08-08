/**
 * 階段 1: 用戶檔案上傳與合併
 * 基於 FileUploadMerger，針對用戶資料優化
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Icon } from '@/components/common/Icon';
import Papa from 'papaparse';
import { DesignSystem } from '@/theme/designSystem';
import {
  UploadedFile,
  MergeConfig,
  MergedTable,
  MergeStrategy,
} from '@/types/import';
import { ParsedUserFile } from '@/types/userImport';
import {
  mergeFiles,
  detectKeyFields,
  validateMerge,
  previewMergedData,
} from '@/components/import/utils/fileMerger';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { pickDocument } from '@/utils/web-file-picker';

interface UserFileUploaderProps {
  files: UploadedFile[];
  mergeConfig: MergeConfig | null;
  mergedTable: MergedTable | null;
  mode: 'simple' | 'advanced';
  onFilesUploaded: (files: UploadedFile[]) => void;
  onMergeCompleted: (config: MergeConfig, mergedTable: MergedTable) => void;
}

const UserFileUploader: React.FC<UserFileUploaderProps> = ({
  files,
  mergeConfig,
  mergedTable,
  mode,
  onFilesUploaded,
  onMergeCompleted,
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [keyFieldCandidates, setKeyFieldCandidates] = useState<Record<string, any[]>>({});
  const [selectedKeyFields, setSelectedKeyFields] = useState<Record<string, string>>({});
  const [mergeStrategy, setMergeStrategy] = useState<MergeStrategy>('left');
  const [showMergePreview, setShowMergePreview] = useState(false);

  /**
   * 處理檔案選擇
   */
  const handleFileSelect = async () => {
    try {
      const result = await pickDocument({
        type: ['text/csv', 'text/comma-separated-values', 'application/vnd.ms-excel', 
               'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        multiple: mode === 'advanced', // 進階模式允許多檔案
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      setLoading(true);
      const newFiles: UploadedFile[] = [];
      const failedFiles: string[] = [];

      for (const asset of result.assets) {
        try {
          const file = await processFile(asset);
          if (file) {
            newFiles.push(file);
          } else {
            failedFiles.push(asset.name || '未知檔案');
          }
        } catch (error) {
          console.error(`處理檔案 ${asset.name} 失敗:`, error);
          failedFiles.push(asset.name || '未知檔案');
        }
      }

      if (newFiles.length > 0) {
        const updatedFiles = [...files, ...newFiles];
        onFilesUploaded(updatedFiles);
        
        // 簡易模式自動合併（如果有多個檔案）
        if (mode === 'simple' && updatedFiles.length > 1) {
          await autoMergeFiles(updatedFiles);
        }
        
        showSuccessToast(`成功上傳 ${newFiles.length} 個檔案`);
      }

      if (failedFiles.length > 0) {
        showErrorToast(`${failedFiles.length} 個檔案處理失敗: ${failedFiles.join(', ')}`);
      }
    } catch (error) {
      console.error('選擇檔案失敗:', error);
      if (error instanceof Error) {
        showErrorToast(`選擇檔案失敗: ${error.message}`);
      } else {
        showErrorToast('選擇檔案失敗');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * 處理單個檔案
   */
  const processFile = async (file: any): Promise<UploadedFile | null> => {
    return new Promise((resolve) => {
      const fileUrl = file.uri || file;
      
      // 讀取檔案內容
      fetch(fileUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.text();
        })
        .then(text => {
          if (!text || text.trim() === '') {
            throw new Error('檔案內容為空');
          }
          // 解析 CSV
          Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            encoding: 'UTF-8',
            transformHeader: (header) => header?.trim() || '',
            transform: (value) => value?.trim() || '',
            complete: (result) => {
              if (result.errors?.length > 0) {
                console.warn('CSV 解析警告:', result.errors);
              }

              // 確保有正確的資料結構
              if (!result.data || !Array.isArray(result.data)) {
                console.error('解析結果無效:', result);
                showErrorToast('檔案格式錯誤或檔案為空');
                resolve(null);
                return;
              }

              const headers = result.meta?.fields || [];
              if (headers.length === 0) {
                console.error('無法取得檔案標題:', result);
                showErrorToast('無法讀取檔案欄位');
                resolve(null);
                return;
              }
              const data = result.data || [];

              // 檢查是否包含用戶欄位（不再強制要求）
              const hasEmailLike = headers?.some(h => 
                /email|mail|信箱|郵件|e-mail/i.test(h)
              ) || false;
              const hasNameLike = headers?.some(h => 
                /name|姓名|名字|用戶|使用者/i.test(h)
              ) || false;

              // 自動檢測關鍵欄位
              const tempFile = {
                id: '',
                name: file.name || 'imported.csv',
                headers,
                data: data || [],
                keyField: null,
                uploadedAt: new Date(),
                rowCount: data?.length || 0
              };
              const keyFieldResults = headers.length > 0 ? detectKeyFields(tempFile) : [];
              
              const uploadedFile: ParsedUserFile = {
                id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: file.name || 'imported.csv',
                headers,
                data,
                keyField: keyFieldResults.length > 0 ? keyFieldResults[0].field : null,
                uploadedAt: new Date(),
                rowCount: data.length,
                hasEmailField: hasEmailLike,
                hasNameField: hasNameLike,
              };

              setKeyFieldCandidates(prev => ({
                ...prev,
                [uploadedFile.id]: keyFieldResults,
              }));

              resolve(uploadedFile);
            },
            error: (error) => {
              console.error('CSV 解析錯誤:', error);
              showErrorToast(`解析檔案失敗: ${error.message || '未知錯誤'}`);
              resolve(null);
            },
          });
        })
        .catch(error => {
          console.error('讀取檔案失敗:', error);
          if (error.message.includes('NetworkError') || error.message.includes('network')) {
            showErrorToast('網路錯誤，請檢查網路連線');
          } else if (error.message.includes('檔案內容為空')) {
            showErrorToast('檔案內容為空，請確認檔案格式');
          } else {
            showErrorToast(`讀取檔案失敗: ${error.message}`);
          }
          resolve(null);
        });
    });
  };

  /**
   * 自動合併檔案（簡易模式）
   */
  const autoMergeFiles = async (filesToMerge: UploadedFile[]) => {
    if (filesToMerge.length < 2) return;

    try {
      // 使用第一個檔案的關鍵欄位
      const keyField = filesToMerge[0].keyField;
      if (!keyField) {
        // 如果沒有關鍵欄位，就不合併
        return;
      }

      const config: MergeConfig = {
        files: filesToMerge.map(f => ({
          id: f.id,
          keyField: keyField,
        })),
        mergeStrategy: 'left',
        handleDuplicates: 'rename',
        caseSensitive: false,
      };

      const merged = await mergeFiles(filesToMerge, config);
      onMergeCompleted(config, merged);
      showSuccessToast('檔案已自動合併');
    } catch (error) {
      console.error('自動合併失敗:', error);
      // 不顯示錯誤，因為是自動嘗試
    }
  };

  /**
   * 手動執行合併
   */
  const handleMerge = async () => {
    if (files.length < 2) {
      showErrorToast('需要至少兩個檔案才能合併');
      return;
    }

    // 檢查是否所有檔案都選擇了關鍵欄位
    const filesWithKey = files.filter(f => selectedKeyFields[f.id]);
    if (filesWithKey.length < files.length) {
      showErrorToast('請為所有檔案選擇關鍵欄位');
      return;
    }

    setLoading(true);
    try {
      const config: MergeConfig = {
        files: files.map(f => ({
          id: f.id,
          keyField: selectedKeyFields[f.id] || f.keyField || '',
        })),
        mergeStrategy,
        handleDuplicates: 'rename',
        caseSensitive: false,
      };

      // 驗證合併
      const validation = validateMerge(files, config);
      if (!validation.isValid) {
        showErrorToast(`合併驗證失敗: ${validation.errors.join(', ')}`);
        return;
      }

      // 執行合併
      const merged = await mergeFiles(files, config);
      onMergeCompleted(config, merged);
      
      showSuccessToast(
        `成功合併 ${files.length} 個檔案，共 ${merged.data.length} 筆資料`
      );
      
      setShowMergePreview(true);
    } catch (error) {
      console.error('合併失敗:', error);
      showErrorToast('合併檔案失敗');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 移除檔案
   */
  const handleRemoveFile = (fileId: string) => {
    const updatedFiles = files.filter(f => f.id !== fileId);
    onFilesUploaded(updatedFiles);
    
    // 清理相關狀態
    const newKeyFields = { ...selectedKeyFields };
    delete newKeyFields[fileId];
    setSelectedKeyFields(newKeyFields);
    
    const newCandidates = { ...keyFieldCandidates };
    delete newCandidates[fileId];
    setKeyFieldCandidates(newCandidates);
  };

  /**
   * 渲染檔案列表
   */
  const renderFileList = () => {
    if (files.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Icon name="document-text-outline" size={48} color={DesignSystem.colors.text.tertiary} />
          <Text style={styles.emptyStateText}>尚未上傳檔案</Text>
          <Text style={styles.emptyStateHint}>
            {mode === 'simple' 
              ? '點擊上方按鈕上傳用戶資料 CSV 檔案'
              : '可上傳多個檔案進行合併'
            }
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.fileList}>
        {files.map((file) => (
          <View key={file.id} style={styles.fileItem}>
            <View style={styles.fileInfo}>
              <Icon name="document-outline" size={24} color={DesignSystem.colors.primary} />
              <View style={styles.fileDetails}>
                <Text style={styles.fileName}>{file.name}</Text>
                <Text style={styles.fileMeta}>
                  {file.rowCount} 列 × {file.headers.length} 欄
                </Text>
                {mode === 'advanced' && files.length > 1 && (
                  <View style={styles.keyFieldSelector}>
                    <Text style={styles.keyFieldLabel}>合併關鍵欄位：</Text>
                    <TouchableOpacity
                      style={[
                        styles.keyFieldDropdown,
                        !selectedKeyFields[file.id] && !file.keyField && styles.keyFieldDropdownWarning
                      ]}
                      onPress={() => setSelectedFileId(
                        selectedFileId === file.id ? null : file.id
                      )}
                    >
                      <Text style={[
                        styles.keyFieldValue,
                        !selectedKeyFields[file.id] && !file.keyField && styles.keyFieldValueWarning
                      ]}>
                        {selectedKeyFields[file.id] || file.keyField || '請選擇關鍵欄位'}
                      </Text>
                      <Icon name="chevron-down" size={16} />
                    </TouchableOpacity>
                  </View>
                )}
                {/* 顯示欄位選項下拉選單 */}
                {selectedFileId === file.id && (
                  <View style={styles.keyFieldOptions}>
                    {file.headers.map((header) => (
                      <TouchableOpacity
                        key={header}
                        style={styles.keyFieldOption}
                        onPress={() => {
                          setSelectedKeyFields(prev => ({
                            ...prev,
                            [file.id]: header
                          }));
                          setSelectedFileId(null);
                        }}
                      >
                        <Text style={[
                          styles.keyFieldOptionText,
                          selectedKeyFields[file.id] === header && styles.keyFieldOptionTextSelected
                        ]}>
                          {header}
                        </Text>
                        {keyFieldCandidates[file.id]?.find(c => c.field === header) && (
                          <Text style={styles.keyFieldConfidence}>
                            {Math.round((keyFieldCandidates[file.id].find(c => c.field === header)?.uniquenessRatio || 0) * 100)}%
                          </Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity
              onPress={() => handleRemoveFile(file.id)}
              style={styles.removeButton}
            >
              <Icon name="close-circle" size={20} color={DesignSystem.colors.error} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  /**
   * 渲染合併預覽
   */
  const renderMergePreview = () => {
    if (!mergedTable || !showMergePreview) return null;

    return (
      <View style={styles.mergePreview}>
        <View style={styles.mergePreviewHeader}>
          <Text style={styles.mergePreviewTitle}>合併結果預覽</Text>
          <TouchableOpacity onPress={() => setShowMergePreview(false)}>
            <Icon name="close" size={20} />
          </TouchableOpacity>
        </View>
        <View style={styles.mergeStats}>
          <Text style={styles.mergeStat}>
            總計: {mergedTable.data.length} 筆資料
          </Text>
          <Text style={styles.mergeStat}>
            欄位: {mergedTable.headers.length} 個
          </Text>
          <Text style={styles.mergeStat}>
            匹配: {mergedTable.mergeInfo.matchedRows} 筆
          </Text>
        </View>
        <ScrollView horizontal style={styles.previewTable}>
          <View>
            <View style={styles.previewRow}>
              {mergedTable.headers.slice(0, 5).map((header, index) => (
                <Text key={index} style={styles.previewHeader}>
                  {header}
                </Text>
              ))}
            </View>
            {mergedTable.data.slice(0, 3).map((row, rowIndex) => (
              <View key={rowIndex} style={styles.previewRow}>
                {mergedTable.headers.slice(0, 5).map((header, colIndex) => (
                  <Text key={colIndex} style={styles.previewCell}>
                    {row[header] || '-'}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 上傳區域 */}
      <TouchableOpacity
        style={styles.uploadArea}
        onPress={handleFileSelect}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="large" color={DesignSystem.colors.primary} />
        ) : (
          <>
            <Icon name="cloud-upload-outline" size={48} color={DesignSystem.colors.primary} />
            <Text style={styles.uploadTitle}>
              {mode === 'simple' ? '上傳用戶資料' : '上傳用戶檔案'}
            </Text>
            <Text style={styles.uploadHint}>
              支援 CSV、Excel 格式
              {mode === 'advanced' && '（可選擇多個檔案）'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* 檔案列表 */}
      {renderFileList()}

      {/* 合併選項（進階模式） */}
      {mode === 'advanced' && files.length > 1 && (
        <View style={styles.mergeSection}>
          <Text style={styles.mergeSectionTitle}>合併選項</Text>
          <Text style={styles.mergeHint}>
            請在上方每個檔案選擇用於合併的關鍵欄位（例如：ID、Email 等唯一值）
          </Text>
          <View style={styles.mergeOptions}>
            <Text style={styles.mergeOptionLabel}>合併策略：</Text>
            <View style={styles.mergeStrategyButtons}>
              {(['left', 'inner', 'outer'] as MergeStrategy[]).map((strategy) => (
                <TouchableOpacity
                  key={strategy}
                  style={[
                    styles.strategyButton,
                    mergeStrategy === strategy && styles.strategyButtonActive,
                  ]}
                  onPress={() => setMergeStrategy(strategy)}
                >
                  <Text style={[
                    styles.strategyButtonText,
                    mergeStrategy === strategy && styles.strategyButtonTextActive,
                  ]}>
                    {strategy === 'left' ? '左連接' : 
                     strategy === 'inner' ? '內連接' : '外連接'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <Button
            title="合併檔案"
            onPress={handleMerge}
            disabled={loading || files.length < 2}
            style={styles.mergeButton}
          />
        </View>
      )}

      {/* 合併預覽 */}
      {renderMergePreview()}

      {/* 提示訊息 */}
      <View style={styles.tips}>
        <Icon name="information-circle-outline" size={16} color={DesignSystem.colors.text.tertiary} />
        <Text style={styles.tipsText}>
          {mode === 'simple' 
            ? '上傳 CSV 或 Excel 檔案，稍後可選擇欄位對應'
            : '可上傳多個檔案，系統會根據關鍵欄位自動合併'
          }
        </Text>
      </View>
    </View>
  );
};

// 匯入 Button 元件（避免循環依賴）
const Button: React.FC<any> = ({ title, onPress, disabled, style }) => (
  <TouchableOpacity
    style={[
      styles.button,
      disabled && styles.buttonDisabled,
      style,
    ]}
    onPress={onPress}
    disabled={disabled}
  >
    <Text style={styles.buttonText}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: DesignSystem.colors.border.light,
    borderStyle: 'dashed',
    borderRadius: DesignSystem.borderRadius.lg,
    padding: DesignSystem.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
    marginBottom: DesignSystem.spacing.lg,
  },
  uploadTitle: {
    ...DesignSystem.typography.h4,
    color: DesignSystem.colors.text.primary,
    marginTop: DesignSystem.spacing.md,
  },
  uploadHint: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    marginTop: DesignSystem.spacing.xs,
  },
  fileList: {
    marginBottom: DesignSystem.spacing.lg,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DesignSystem.colors.background.surface,
    borderRadius: DesignSystem.borderRadius.md,
    padding: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.sm,
  },
  fileInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileDetails: {
    flex: 1,
    marginLeft: DesignSystem.spacing.md,
  },
  fileName: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary,
    fontWeight: '500',
  },
  fileMeta: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    marginTop: DesignSystem.spacing.xxs,
  },
  keyFieldSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: DesignSystem.spacing.xs,
  },
  keyFieldLabel: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    marginRight: DesignSystem.spacing.xs,
  },
  keyFieldDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DesignSystem.colors.background.primary,
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.xs,
    borderRadius: DesignSystem.borderRadius.sm,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.light,
  },
  keyFieldValue: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.primary,
    marginRight: DesignSystem.spacing.xs,
  },
  removeButton: {
    padding: DesignSystem.spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: DesignSystem.spacing.xl,
  },
  emptyStateText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.secondary,
    marginTop: DesignSystem.spacing.md,
  },
  emptyStateHint: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.tertiary,
    marginTop: DesignSystem.spacing.xs,
    textAlign: 'center',
  },
  mergeSection: {
    backgroundColor: DesignSystem.colors.background.surface,
    borderRadius: DesignSystem.borderRadius.md,
    padding: DesignSystem.spacing.lg,
    marginBottom: DesignSystem.spacing.lg,
  },
  mergeSectionTitle: {
    ...DesignSystem.typography.h5,
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.md,
  },
  mergeOptions: {
    marginBottom: DesignSystem.spacing.md,
  },
  mergeOptionLabel: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.secondary,
    marginBottom: DesignSystem.spacing.sm,
  },
  mergeStrategyButtons: {
    flexDirection: 'row',
    gap: DesignSystem.spacing.sm,
  },
  strategyButton: {
    flex: 1,
    paddingVertical: DesignSystem.spacing.sm,
    paddingHorizontal: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.sm,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.medium,
    alignItems: 'center',
  },
  strategyButtonActive: {
    backgroundColor: DesignSystem.colors.primary,
    borderColor: DesignSystem.colors.primary,
  },
  strategyButtonText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.primary,
  },
  strategyButtonTextActive: {
    color: DesignSystem.colors.text.inverse,
  },
  mergeButton: {
    marginTop: DesignSystem.spacing.md,
  },
  button: {
    backgroundColor: DesignSystem.colors.primary,
    paddingVertical: DesignSystem.spacing.sm,
    paddingHorizontal: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.borderRadius.sm,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.inverse,
    fontWeight: '600',
  },
  mergePreview: {
    backgroundColor: DesignSystem.colors.background.surface,
    borderRadius: DesignSystem.borderRadius.md,
    padding: DesignSystem.spacing.lg,
    marginBottom: DesignSystem.spacing.lg,
  },
  mergePreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.md,
  },
  mergePreviewTitle: {
    ...DesignSystem.typography.h5,
    color: DesignSystem.colors.text.primary,
  },
  mergeStats: {
    flexDirection: 'row',
    marginBottom: DesignSystem.spacing.md,
  },
  mergeStat: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    marginRight: DesignSystem.spacing.lg,
  },
  previewTable: {
    maxHeight: 200,
  },
  previewRow: {
    flexDirection: 'row',
  },
  previewHeader: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.primary,
    fontWeight: '600',
    padding: DesignSystem.spacing.sm,
    backgroundColor: DesignSystem.colors.background.primary,
    minWidth: 100,
    borderRightWidth: 1,
    borderRightColor: DesignSystem.colors.border.light,
  },
  previewCell: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    padding: DesignSystem.spacing.sm,
    minWidth: 100,
    borderRightWidth: 1,
    borderRightColor: DesignSystem.colors.border.light,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light,
  },
  tips: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${DesignSystem.colors.primary}10`,
    padding: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borderRadius.sm,
  },
  tipsText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    marginLeft: DesignSystem.spacing.xs,
    flex: 1,
  },
  keyFieldOptions: {
    backgroundColor: DesignSystem.colors.background.primary,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.medium,
    borderRadius: DesignSystem.borderRadius.sm,
    marginTop: DesignSystem.spacing.xs,
    maxHeight: 200,
  },
  keyFieldOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: DesignSystem.spacing.sm,
    paddingHorizontal: DesignSystem.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light,
  },
  keyFieldOptionText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary,
    flex: 1,
  },
  keyFieldOptionTextSelected: {
    color: DesignSystem.colors.primary,
    fontWeight: '600',
  },
  keyFieldConfidence: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    marginLeft: DesignSystem.spacing.xs,
  },
  mergeHint: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    marginBottom: DesignSystem.spacing.md,
  },
  keyFieldDropdownWarning: {
    borderColor: DesignSystem.colors.warning,
  },
  keyFieldValueWarning: {
    color: DesignSystem.colors.warning,
  },
});

export default UserFileUploader;