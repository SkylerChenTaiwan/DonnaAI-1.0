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
  Platform } from 'react-native';
import { Icon } from '@/components/common/Icon';
import Papa from 'papaparse';
import { DesignSystem } from '@/theme/designSystem';
import {
  UploadedFile,
  MergeConfig,
  MergedTable,
  MergeStrategy } from '@/types/import';
import { ParsedUserFile } from '@/types/userImport';
import {
  mergeFiles,
  detectKeyFields,
  validateMerge,
  previewMergedData,
  getFieldStatistics } from '@/components/import/utils/fileMerger';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { pickDocument } from '@/utils/web-file-picker';
import { withAlpha } from '@/utils/colorUtils';

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
  onMergeCompleted }) => {
  const [loading, setLoading] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [keyFieldCandidates, setKeyFieldCandidates] = useState<Record<string, any[]>>({});
  const [selectedKeyFields, setSelectedKeyFields] = useState<Record<string, string>>({});
  const [mergeStrategy, setMergeStrategy] = useState<MergeStrategy>('left');
  const [showMergePreview, setShowMergePreview] = useState(false);
  const [fieldTypes, setFieldTypes] = useState<Record<string, string>>({});
  const [showFieldEditor, setShowFieldEditor] = useState<string | null>(null);

  /**
   * 處理檔案選擇
   */
  const handleFileSelect = async () => {
    try {
      // 簡易模式下，如果已有檔案，先移除
      if (mode === 'simple' && files.length > 0) {
        onFilesUploaded([]);
      }
      
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
        
        // 偵測每個檔案的欄位類型
        const newFieldTypes = { ...fieldTypes };
        for (const file of newFiles) {
          file.headers.forEach(header => {
            const fieldKey = `${file.id}:${header}`;
            const stats = getFieldStatistics(file.data, header);
            newFieldTypes[fieldKey] = stats.type || 'text';
          });
        }
        setFieldTypes(newFieldTypes);
        
        // 不再自動合併，讓用戶手動點擊合併按鈕
        // if (mode === 'simple' && updatedFiles.length > 1) {
        //   await autoMergeFiles(updatedFiles);
        // }
        
        showSuccessToast(`成功上傳 ${newFiles.length} 個檔案`);
        
        // 如果有多個檔案，提示用戶可以合併
        if (updatedFiles.length > 1) {
          showSuccessToast('您可以點擊下方的「預覽及合併」按鈕來合併檔案');
        }
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
      
      // 處理檔案內容的函數
      const parseCSVContent = (text: string) => {
        if (!text || text.trim() === '') {
          showErrorToast('檔案內容為空，請確認檔案格式');
          resolve(null);
          return;
        }
        
        // 解析 CSV
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          encoding: 'UTF-8',
          transformHeader: (header) => {
            // 清理標題：移除 BOM、空白、特殊字元
            const cleaned = header
              ?.replace(/^\uFEFF/, '') // 移除 BOM
              ?.replace(/[\r\n]/g, '') // 移除換行
              ?.trim() || '';
            return cleaned;
          },
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

            // 取得並驗證標題
            let headers = result.meta?.fields || [];
            
            // 過濾掉無效的標題（太長或包含奇怪字元的）
            headers = headers.filter(h => {
              // 排除空標題
              if (!h || h.trim() === '') return false;
              // 排除太長的標題（可能是資料被誤認為標題）
              if (h.length > 50) {
                console.warn('排除過長的標題:', h.substring(0, 50) + '...');
                return false;
              }
              // 排除包含太多特殊字元的標題
              const specialCharCount = (h.match(/[^\w\s\u4e00-\u9fa5\-_@.]/g) || []).length;
              if (specialCharCount > h.length * 0.3) {
                console.warn('排除包含太多特殊字元的標題:', h);
                return false;
              }
              return true;
            });
            
            if (headers.length === 0) {
              console.error('無法取得有效的檔案標題:', result.meta?.fields);
              showErrorToast('無法讀取檔案欄位，請確認 CSV 格式是否正確');
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
              hasNameField: hasNameLike };

            setKeyFieldCandidates(prev => ({
              ...prev,
              [uploadedFile.id]: keyFieldResults }));

            resolve(uploadedFile);
          },
          error: (error) => {
            console.error('CSV 解析錯誤:', error);
            showErrorToast(`解析檔案失敗: ${error.message || '未知錯誤'}`);
            resolve(null);
          } });
      };
      
      // 檢查是否為 data URL
      if (fileUrl.startsWith('data:')) {
        try {
          // 直接從 data URL 解析內容
          const base64Data = fileUrl.split(',')[1];
          
          // 正確解碼 base64 並處理 UTF-8
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          
          // 使用 TextDecoder 正確處理 UTF-8 編碼
          const decoder = new TextDecoder('utf-8');
          const text = decoder.decode(bytes);
          
          parseCSVContent(text);
        } catch (error) {
          console.error('解析 data URL 失敗:', error);
          showErrorToast('檔案格式錯誤，無法解析');
          resolve(null);
        }
      } else {
        // 使用 fetch 讀取其他類型的 URL
        fetch(fileUrl)
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
          })
          .then(text => {
            parseCSVContent(text);
          })
          .catch(error => {
            console.error('讀取檔案失敗:', error);
            if (error.message.includes('NetworkError') || error.message.includes('network')) {
              showErrorToast('網路錯誤，請檢查網路連線');
            } else {
              showErrorToast(`讀取檔案失敗: ${error.message}`);
            }
            resolve(null);
          });
      }
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
          keyField: keyField })),
        mergeStrategy: 'left',
        handleDuplicates: 'rename',
        caseSensitive: false };

      const merged = mergeFiles(filesToMerge, config);
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
    console.log('handleMerge called', { files, selectedKeyFields });
    
    if (files.length < 2) {
      showErrorToast('需要至少兩個檔案才能合併');
      return;
    }

    // 檢查是否所有檔案都選擇了關鍵欄位
    const filesWithKey = files.filter(f => {
      const hasKey = selectedKeyFields[f.id] || f.keyField;
      console.log(`File ${f.id}: selectedKey=${selectedKeyFields[f.id]}, keyField=${f.keyField}, hasKey=${hasKey}`);
      return hasKey;
    });
    
    if (filesWithKey.length < files.length) {
      const missingKeyFiles = files.filter(f => !selectedKeyFields[f.id] && !f.keyField);
      console.error('Missing key fields for files:', missingKeyFiles);
      showErrorToast('請為所有檔案選擇關鍵欄位');
      return;
    }

    setLoading(true);
    try {
      const config: MergeConfig = {
        files: files.map(f => ({
          id: f.id,
          keyField: selectedKeyFields[f.id] || f.keyField || '' })),
        mergeStrategy,
        handleDuplicates: 'rename',
        caseSensitive: false };

      // 先檢查關鍵欄位是否存在
      for (const fileConfig of config.files) {
        const file = files.find(f => f.id === fileConfig.id);
        if (!file) {
          showErrorToast(`找不到檔案 ${fileConfig.id}`);
          return;
        }
        if (!fileConfig.keyField) {
          showErrorToast(`檔案 ${file.name} 沒有選擇關鍵欄位`);
          return;
        }
        if (!file.headers.includes(fileConfig.keyField)) {
          showErrorToast(`檔案 ${file.name} 沒有欄位 ${fileConfig.keyField}`);
          return;
        }
      }

      // 執行合併
      const merged = mergeFiles(files, config);
      
      // 驗證合併結果
      const validation = validateMerge(merged);
      if (!validation.isValid) {
        showErrorToast(`合併驗證失敗: ${validation.issues.join(', ')}`);
        return;
      }
      
      // 顯示警告（如果有）
      if (validation.warnings && validation.warnings.length > 0) {
        console.warn('合併警告:', validation.warnings);
      }
      
      // 保留使用者定義的欄位類型到合併後的欄位
      const mergedFieldTypes: Record<string, string> = {};
      merged.headers.forEach(header => {
        // 嘗試從原始檔案的欄位類型定義中找到對應的類型
        let foundType: string | null = null;
        
        // 檢查每個檔案是否有這個欄位
        for (const file of files) {
          if (file.headers.includes(header)) {
            const fieldKey = `${file.id}:${header}`;
            if (fieldTypes[fieldKey]) {
              foundType = fieldTypes[fieldKey];
              break;
            }
          }
        }
        
        // 如果找不到使用者定義的類型，則自動偵測
        if (!foundType) {
          const stats = getFieldStatistics(merged.data, header);
          foundType = stats.type || 'text';
        }
        
        mergedFieldTypes[header] = foundType;
      });
      
      // 更新欄位類型（現在是合併後的欄位）
      setFieldTypes(mergedFieldTypes);
      
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
                
                {/* 欄位類型檢視按鈕 */}
                <TouchableOpacity
                  style={styles.fieldTypeButton}
                  onPress={() => setShowFieldEditor(showFieldEditor === file.id ? null : file.id)}
                >
                  <Icon name="settings-outline" size={14} color={DesignSystem.colors.primary} />
                  <Text style={styles.fieldTypeButtonText}>檢視欄位定義</Text>
                </TouchableOpacity>
                
                {/* 顯示欄位類型編輯器 */}
                {showFieldEditor === file.id && (
                  <View style={styles.fileFieldEditor}>
                    <Text style={styles.fileFieldEditorTitle}>欄位類型定義</Text>
                    <ScrollView style={styles.fileFieldList}>
                      {file.headers.map((header) => {
                        const fieldKey = `${file.id}:${header}`;
                        return (
                          <View key={header} style={styles.fileFieldRow}>
                            <Text style={styles.fileFieldName}>{header}</Text>
                            {Platform.OS === 'web' ? (
                              <select
                                value={fieldTypes[fieldKey] || 'text'}
                                onChange={(e) => {
                                  setFieldTypes({
                                    ...fieldTypes,
                                    [fieldKey]: e.target.value
                                  });
                                }}
                                style={{
                                  padding: '4px 8px',
                                  border: `1px solid ${DesignSystem.colors.border.light}`,
                                  borderRadius: 4,
                                  backgroundColor: DesignSystem.colors.background.surface,
                                  fontSize: 12,
                                  minWidth: 100 }}
                              >
                                <option value="text">文字</option>
                                <option value="number">數字</option>
                                <option value="date">日期</option>
                                <option value="email">電子郵件</option>
                                <option value="phone">電話</option>
                                <option value="boolean">布林值</option>
                                <option value="url">網址</option>
                              </select>
                            ) : (
                              <TouchableOpacity style={styles.fileFieldTypeSelector}>
                                <Text style={styles.fileFieldTypeText}>
                                  {fieldTypes[fieldKey] || 'text'}
                                </Text>
                                <Icon name="chevron-down" size={14} />
                              </TouchableOpacity>
                            )}
                            <Text style={styles.fileFieldTypeHint}>
                              (自動: {fieldTypes[fieldKey] || 'text'})
                            </Text>
                          </View>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}
                
                {mode === 'advanced' && files.length > 1 && (
                  <View style={styles.keyFieldSelector}>
                    <Text style={styles.keyFieldLabel}>合併關鍵欄位：</Text>
                    {Platform.OS === 'web' ? (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: DesignSystem.colors.background.primary,
                          paddingLeft: '12px',
                          paddingRight: '12px',
                          paddingTop: '8px',
                          paddingBottom: '8px',
                          borderRadius: '8px',
                          border: `1px solid ${!selectedKeyFields[file.id] && !file.keyField ? DesignSystem.colors.warning : DesignSystem.colors.border.light}`,
                          cursor: 'pointer' }}
                        onClick={() => setSelectedFileId(
                          selectedFileId === file.id ? null : file.id
                        )}
                      >
                        <span style={{
                          fontSize: '12px',
                          color: !selectedKeyFields[file.id] && !file.keyField ? DesignSystem.colors.warning : DesignSystem.colors.text.primary,
                          marginRight: '8px' }}>
                          {selectedKeyFields[file.id] || file.keyField || '請選擇關鍵欄位'}
                        </span>
                        <Icon name="chevron-down" size={16} />
                      </div>
                    ) : (
                      <TouchableOpacity
                        style={StyleSheet.flatten([
                          styles.keyFieldDropdown,
                          !selectedKeyFields[file.id] && !file.keyField && styles.keyFieldDropdownWarning
                        ])}
                        onPress={() => setSelectedFileId(
                          selectedFileId === file.id ? null : file.id
                        )}
                      >
                        <Text style={StyleSheet.flatten([
                          styles.keyFieldValue,
                          !selectedKeyFields[file.id] && !file.keyField && styles.keyFieldValueWarning
                        ])}>
                          {selectedKeyFields[file.id] || file.keyField || '請選擇關鍵欄位'}
                        </Text>
                        <Icon name="chevron-down" size={16} />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                {/* 顯示欄位選項下拉選單 */}
                {selectedFileId === file.id && (
                  <View style={styles.keyFieldOptions}>
                    {file.headers.map((header) => (
                      Platform.OS === 'web' ? (
                        <div
                          key={header}
                          style={{
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingTop: '12px',
                            paddingBottom: '12px',
                            paddingLeft: '16px',
                            paddingRight: '16px',
                            borderBottom: `1px solid ${DesignSystem.colors.border.light}`,
                            cursor: 'pointer',
                            backgroundColor: 'transparent' }}
                          onClick={() => {
                            setSelectedKeyFields(prev => ({
                              ...prev,
                              [file.id]: header
                            }));
                            setSelectedFileId(null);
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = DesignSystem.colors.background.surface;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <span style={{
                            fontSize: '14px',
                            color: selectedKeyFields[file.id] === header ? DesignSystem.colors.primary : DesignSystem.colors.text.primary,
                            fontWeight: selectedKeyFields[file.id] === header ? '600' : 'normal',
                            flex: 1 }}>
                            {header}
                          </span>
                          {keyFieldCandidates[file.id]?.find(c => c.field === header) && (
                            <span style={{
                              fontSize: '12px',
                              color: DesignSystem.colors.text.secondary,
                              marginLeft: '8px' }}>
                              {Math.round((keyFieldCandidates[file.id].find(c => c.field === header)?.uniquenessRatio || 0) * 100)}%
                            </span>
                          )}
                        </div>
                      ) : (
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
                          <Text style={StyleSheet.flatten([
                            styles.keyFieldOptionText,
                            selectedKeyFields[file.id] === header && styles.keyFieldOptionTextSelected
                          ])}>
                            {header}
                          </Text>
                          {keyFieldCandidates[file.id]?.find(c => c.field === header) && (
                            <Text style={styles.keyFieldConfidence}>
                              {Math.round((keyFieldCandidates[file.id].find(c => c.field === header)?.uniquenessRatio || 0) * 100)}%
                            </Text>
                          )}
                        </TouchableOpacity>
                      )
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
                <View key={index} style={styles.previewHeaderCell}>
                  <Text style={styles.previewHeader}>
                    {header}
                  </Text>
                  <Text style={styles.previewHeaderType}>
                    ({fieldTypes[header] || 'text'})
                  </Text>
                </View>
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
              上傳用戶資料
            </Text>
            <Text style={styles.uploadHint}>
              支援 CSV、Excel 格式
              {mode === 'simple' ? '（簡易模式：單一檔案）' : '（進階模式：可選擇多個檔案合併）'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* 檔案列表 */}
      {renderFileList()}

      {/* 合併選項（進階模式且有多個檔案時顯示） */}
      {mode === 'advanced' && files.length > 1 && (
        <View style={styles.mergeSection}>
          <Text style={styles.mergeSectionTitle}>合併選項</Text>
          <Text style={styles.mergeHint}>
            {mergedTable ? 
              `已成功合併 ${files.length} 個檔案，共 ${mergedTable.data.length} 筆資料` :
              '請在上方每個檔案選擇用於合併的關鍵欄位（例如：ID、Email 等唯一值）'
            }
          </Text>
          {!mergedTable && (
            <View style={styles.mergeWarning}>
              <Icon name="alert-circle-outline" size={16} color={DesignSystem.colors.warning} />
              <Text style={styles.mergeWarningText}>
                需要先合併檔案才能進入下一步
              </Text>
            </View>
          )}
          <View style={styles.mergeOptions}>
            <Text style={styles.mergeOptionLabel}>合併策略：</Text>
            <View style={styles.mergeStrategyButtons}>
              {(['left', 'inner', 'outer'] as MergeStrategy[]).map((strategy) => (
                <TouchableOpacity
                  key={strategy}
                  style={StyleSheet.flatten([
                    styles.strategyButton,
                    mergeStrategy === strategy && styles.strategyButtonActive,
                  ])}
                  onPress={() => setMergeStrategy(strategy)}
                >
                  <Text style={StyleSheet.flatten([
                    styles.strategyButtonText,
                    mergeStrategy === strategy && styles.strategyButtonTextActive,
                  ])}>
                    {strategy === 'left' ? '左連接' : 
                     strategy === 'inner' ? '內連接' : '外連接'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <TouchableOpacity
            onPress={handleMerge}
            disabled={loading || files.length < 2}
            style={StyleSheet.flatten([
              styles.mergeButton,
              (loading || files.length < 2) && styles.mergeButtonDisabled
            ])}
          >
            <Text style={styles.mergeButtonText}>
              {showMergePreview ? "重新合併" : "預覽及合併"}
            </Text>
          </TouchableOpacity>
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
const Button: React.FC<any> = ({ title, onPress, disabled, style }) => {
  if (Platform.OS === 'web') {
    return (
      <button
        style={{
          backgroundColor: disabled ? DesignSystem.colors.border.medium : DesignSystem.colors.primary,
          color: DesignSystem.colors.text.inverse,
          paddingTop: '12px',
          paddingBottom: '12px',
          paddingLeft: '24px',
          paddingRight: '24px',
          borderRadius: '8px',
          border: 'none',
          fontSize: '14px',
          fontWeight: '600',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          marginTop: '16px',
          width: '100%' }}
        onClick={disabled ? undefined : onPress}
        disabled={disabled}
      >
        {title}
      </button>
    );
  }
  
  return (
    <TouchableOpacity
      style={StyleSheet.flatten([
        styles.button,
        disabled && styles.buttonDisabled,
        style,
      ])}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1 },
  uploadArea: {
    borderWidth: 2,
    borderColor: DesignSystem.colors.border.light,
    borderStyle: 'dashed',
    borderRadius: DesignSystem.borderRadius.lg,
    padding: DesignSystem.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
    marginBottom: DesignSystem.spacing.lg },
  uploadTitle: {
    ...DesignSystem.typography.h4,
    color: DesignSystem.colors.text.primary,
    marginTop: DesignSystem.spacing.md },
  uploadHint: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    marginTop: DesignSystem.spacing.xs },
  fileList: {
    marginBottom: DesignSystem.spacing.lg },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DesignSystem.colors.background.surface,
    borderRadius: DesignSystem.borderRadius.md,
    padding: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.sm },
  fileInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center' },
  fileDetails: {
    flex: 1,
    marginLeft: DesignSystem.spacing.md },
  fileName: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary,
    fontWeight: '500' },
  fileMeta: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    marginTop: DesignSystem.spacing.xxs },
  keyFieldSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: DesignSystem.spacing.xs },
  keyFieldLabel: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    marginRight: DesignSystem.spacing.xs },
  keyFieldDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DesignSystem.colors.background.primary,
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.xs,
    borderRadius: DesignSystem.borderRadius.sm,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.light },
  keyFieldValue: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.primary,
    marginRight: DesignSystem.spacing.xs },
  removeButton: {
    padding: DesignSystem.spacing.xs },
  emptyState: {
    alignItems: 'center',
    paddingVertical: DesignSystem.spacing.xl },
  emptyStateText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.secondary,
    marginTop: DesignSystem.spacing.md },
  emptyStateHint: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.tertiary,
    marginTop: DesignSystem.spacing.xs,
    textAlign: 'center' },
  mergeSection: {
    backgroundColor: DesignSystem.colors.background.surface,
    borderRadius: DesignSystem.borderRadius.md,
    padding: DesignSystem.spacing.lg,
    marginBottom: DesignSystem.spacing.lg },
  mergeSectionTitle: {
    ...DesignSystem.typography.h5,
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.md },
  mergeOptions: {
    marginBottom: DesignSystem.spacing.md },
  mergeOptionLabel: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.secondary,
    marginBottom: DesignSystem.spacing.sm },
  mergeStrategyButtons: {
    flexDirection: 'row',
    gap: DesignSystem.spacing.sm },
  strategyButton: {
    flex: 1,
    paddingVertical: DesignSystem.spacing.sm,
    paddingHorizontal: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.sm,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.medium,
    alignItems: 'center' },
  strategyButtonActive: {
    backgroundColor: DesignSystem.colors.primary,
    borderColor: DesignSystem.colors.primary },
  strategyButtonText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.primary },
  strategyButtonTextActive: {
    color: DesignSystem.colors.text.inverse },
  mergeButton: {
    marginTop: DesignSystem.spacing.md },
  mergeWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: withAlpha(DesignSystem.colors.warning, 0.094),
    padding: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borderRadius.sm,
    marginTop: DesignSystem.spacing.sm,
    marginBottom: DesignSystem.spacing.sm },
  mergeWarningText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.warning,
    marginLeft: DesignSystem.spacing.xs,
    fontWeight: '500' },
  button: {
    backgroundColor: DesignSystem.colors.primary,
    paddingVertical: DesignSystem.spacing.sm,
    paddingHorizontal: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.borderRadius.sm,
    alignItems: 'center' },
  buttonDisabled: {
    opacity: 0.5 },
  buttonText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.inverse,
    fontWeight: '600' },
  mergePreview: {
    backgroundColor: DesignSystem.colors.background.surface,
    borderRadius: DesignSystem.borderRadius.md,
    padding: DesignSystem.spacing.lg,
    marginBottom: DesignSystem.spacing.lg },
  mergePreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.md },
  mergePreviewTitle: {
    ...DesignSystem.typography.h5,
    color: DesignSystem.colors.text.primary },
  mergeStats: {
    flexDirection: 'row',
    marginBottom: DesignSystem.spacing.md },
  mergeStat: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    marginRight: DesignSystem.spacing.lg },
  previewTable: {
    maxHeight: 200 },
  previewRow: {
    flexDirection: 'row' },
  previewHeader: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.primary,
    fontWeight: '600',
    padding: DesignSystem.spacing.sm,
    backgroundColor: DesignSystem.colors.background.primary,
    minWidth: 100,
    borderRightWidth: 1,
    borderRightColor: DesignSystem.colors.border.light },
  previewCell: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    padding: DesignSystem.spacing.sm,
    minWidth: 100,
    borderRightWidth: 1,
    borderRightColor: DesignSystem.colors.border.light,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light },
  tips: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${DesignSystem.colors.primary}10`,
    padding: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borderRadius.sm },
  tipsText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    marginLeft: DesignSystem.spacing.xs,
    flex: 1 },
  keyFieldOptions: {
    backgroundColor: DesignSystem.colors.background.primary,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.medium,
    borderRadius: DesignSystem.borderRadius.sm,
    marginTop: DesignSystem.spacing.xs,
    maxHeight: 200 },
  keyFieldOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: DesignSystem.spacing.sm,
    paddingHorizontal: DesignSystem.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light },
  keyFieldOptionText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary,
    flex: 1 },
  keyFieldOptionTextSelected: {
    color: DesignSystem.colors.primary,
    fontWeight: '600' },
  keyFieldConfidence: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    marginLeft: DesignSystem.spacing.xs },
  mergeHint: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    marginBottom: DesignSystem.spacing.md },
  keyFieldDropdownWarning: {
    borderColor: DesignSystem.colors.warning },
  keyFieldValueWarning: {
    color: DesignSystem.colors.warning },
  mergeButton: {
    backgroundColor: DesignSystem.colors.primary,
    paddingVertical: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.md,
    alignItems: 'center',
    marginTop: DesignSystem.spacing.md },
  mergeButtonDisabled: {
    backgroundColor: DesignSystem.colors.gray300 },
  mergeButtonText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.white,
    fontWeight: '600' },
  // 檔案層級的欄位編輯器樣式
  fieldTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: DesignSystem.spacing.xs,
    paddingHorizontal: DesignSystem.spacing.xs,
    paddingVertical: 4,
    backgroundColor: `${DesignSystem.colors.primary}10`,
    borderRadius: DesignSystem.borderRadius.xs,
    alignSelf: 'flex-start',
    gap: 4 },
  fieldTypeButtonText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.primary,
    fontSize: 12 },
  fileFieldEditor: {
    backgroundColor: DesignSystem.colors.background.secondary,
    borderRadius: DesignSystem.borderRadius.sm,
    padding: DesignSystem.spacing.sm,
    marginTop: DesignSystem.spacing.sm },
  fileFieldEditorTitle: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.primary,
    fontWeight: '600',
    marginBottom: DesignSystem.spacing.xs },
  fileFieldList: {
    maxHeight: 150 },
  fileFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light },
  fileFieldName: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.primary,
    flex: 1,
    fontSize: 12 },
  fileFieldTypeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignSystem.spacing.xs,
    paddingVertical: 2,
    backgroundColor: DesignSystem.colors.background.surface,
    borderRadius: DesignSystem.borderRadius.xs,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.light,
    minWidth: 80 },
  fileFieldTypeText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.primary,
    fontSize: 11,
    flex: 1 },
  fileFieldTypeHint: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.tertiary,
    fontSize: 10,
    marginLeft: DesignSystem.spacing.xs },
  // 欄位編輯器樣式（已移除，改為在檔案項目中顯示）
  previewActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSystem.spacing.sm },
  fieldEditorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.xs,
    backgroundColor: `${DesignSystem.colors.primary}10`,
    borderRadius: DesignSystem.borderRadius.sm,
    gap: DesignSystem.spacing.xs },
  fieldEditorButtonText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.primary,
    fontWeight: '500' },
  fieldEditor: {
    backgroundColor: DesignSystem.colors.background.secondary,
    borderRadius: DesignSystem.borderRadius.md,
    padding: DesignSystem.spacing.md,
    marginVertical: DesignSystem.spacing.sm },
  fieldEditorTitle: {
    ...DesignSystem.typography.subtitle,
    color: DesignSystem.colors.text.primary,
    fontWeight: '600',
    marginBottom: DesignSystem.spacing.sm },
  fieldEditorContent: {
    maxHeight: 200 },
  fieldTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: DesignSystem.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light },
  fieldName: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary,
    flex: 1 },
  fieldTypeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.xs,
    backgroundColor: DesignSystem.colors.background.surface,
    borderRadius: DesignSystem.borderRadius.sm,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.light,
    minWidth: 120 },
  fieldTypeText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.primary,
    flex: 1 },
  fieldTypeBadge: {
    marginLeft: DesignSystem.spacing.sm,
    paddingHorizontal: DesignSystem.spacing.xs,
    paddingVertical: 2,
    backgroundColor: `${DesignSystem.colors.info}20`,
    borderRadius: DesignSystem.borderRadius.xs },
  fieldTypeBadgeText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.info,
    fontSize: 10 },
  applyButton: {
    backgroundColor: DesignSystem.colors.primary,
    paddingVertical: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borderRadius.sm,
    alignItems: 'center',
    marginTop: DesignSystem.spacing.md },
  applyButtonText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.white,
    fontWeight: '600' },
  previewHeaderCell: {
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.xs },
  previewHeaderType: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.tertiary,
    fontSize: 10,
    marginTop: 2 } });

export default UserFileUploader;