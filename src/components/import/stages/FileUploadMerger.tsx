/**
 * 階段 2: 檔案上傳與合併
 * 處理多個檔案的上傳、預覽、關鍵欄位選擇和合併
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
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import Papa from 'papaparse';
import { useTheme } from '@/hooks/useTheme';
import {
  UploadedFile,
  MergeConfig,
  MergedTable,
  MergeStrategy,
  KeyFieldCandidate
} from '@/types/import';
import {
  mergeFiles,
  detectKeyFields,
  validateMerge,
  previewMergedData,
  getFieldStatistics
} from '../utils/fileMerger';
import { showErrorToast, showSuccessToast } from '@/utils/toast';

interface FileUploadMergerProps {
  uploadedFiles: UploadedFile[];
  mergeConfig: MergeConfig | null;
  mergedTable: MergedTable | null;
  onFilesUploaded: (files: UploadedFile[]) => void;
  onMergeConfigured: (config: MergeConfig, mergedTable: MergedTable) => void;
}

const FileUploadMerger: React.FC<FileUploadMergerProps> = ({
  uploadedFiles,
  mergeConfig,
  mergedTable,
  onFilesUploaded,
  onMergeConfigured
}) => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [keyFieldCandidates, setKeyFieldCandidates] = useState<Record<string, KeyFieldCandidate[]>>({});
  const [selectedKeyFields, setSelectedKeyFields] = useState<Record<string, string>>({});
  const [mergeStrategy, setMergeStrategy] = useState<MergeStrategy>('left');
  const [showMergePreview, setShowMergePreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 處理檔案選擇
  const handleFileSelect = async () => {
    try {
      if (Platform.OS === 'web') {
        // Web 平台使用 input element
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv,.txt';
        input.multiple = true;
        input.onchange = async (e: any) => {
          const files = Array.from(e.target.files || []);
          for (const file of files) {
            await processFile(file as File);
          }
        };
        input.click();
      } else {
        // 移動平台使用 DocumentPicker
        const result = await DocumentPicker.getDocumentAsync({
          type: ['text/csv', 'text/plain'],
          multiple: true
        });

        if (!result.canceled && result.assets) {
          for (const asset of result.assets) {
            await processFileFromUri(asset);
          }
        }
      }
    } catch (error) {
      console.error('選擇檔案失敗:', error);
      showErrorToast('選擇檔案失敗');
    }
  };

  // 處理 Web 檔案
  const processFile = async (file: File) => {
    setLoading(true);
    try {
      const text = await file.text();
      const result = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        encoding: 'UTF-8'
      });

      if (result.errors.length > 0) {
        console.warn('CSV 解析警告:', result.errors);
      }

      const uploadedFile: UploadedFile = {
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        headers: result.meta.fields || [],
        data: result.data,
        keyField: null,
        uploadedAt: new Date(),
        rowCount: result.data.length,
        size: file.size
      };

      // 偵測關鍵欄位候選
      const candidates = detectKeyFields(uploadedFile);
      setKeyFieldCandidates(prev => ({
        ...prev,
        [uploadedFile.id]: candidates
      }));

      // 自動選擇最佳關鍵欄位
      if (candidates.length > 0 && candidates[0].confidence === 'high') {
        setSelectedKeyFields(prev => ({
          ...prev,
          [uploadedFile.id]: candidates[0].field
        }));
      }

      // 更新檔案列表
      const newFiles = [...uploadedFiles, uploadedFile];
      onFilesUploaded(newFiles);

      showSuccessToast(`成功載入 ${file.name}`);
    } catch (error) {
      console.error('處理檔案失敗:', error);
      showErrorToast(`處理 ${file.name} 失敗`);
    } finally {
      setLoading(false);
    }
  };

  // 處理移動平台檔案
  const processFileFromUri = async (asset: any) => {
    setLoading(true);
    try {
      const response = await fetch(asset.uri);
      const text = await response.text();
      
      const result = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        encoding: 'UTF-8'
      });

      const uploadedFile: UploadedFile = {
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: asset.name,
        headers: result.meta.fields || [],
        data: result.data,
        keyField: null,
        uploadedAt: new Date(),
        rowCount: result.data.length,
        size: asset.size
      };

      // 偵測關鍵欄位候選
      const candidates = detectKeyFields(uploadedFile);
      setKeyFieldCandidates(prev => ({
        ...prev,
        [uploadedFile.id]: candidates
      }));

      // 更新檔案列表
      const newFiles = [...uploadedFiles, uploadedFile];
      onFilesUploaded(newFiles);

      showSuccessToast(`成功載入 ${asset.name}`);
    } catch (error) {
      console.error('處理檔案失敗:', error);
      showErrorToast(`處理 ${asset.name} 失敗`);
    } finally {
      setLoading(false);
    }
  };

  // 移除檔案
  const handleRemoveFile = (fileId: string) => {
    const newFiles = uploadedFiles.filter(f => f.id !== fileId);
    onFilesUploaded(newFiles);
    
    // 清理相關狀態
    const newKeyFields = { ...selectedKeyFields };
    delete newKeyFields[fileId];
    setSelectedKeyFields(newKeyFields);
    
    const newCandidates = { ...keyFieldCandidates };
    delete newCandidates[fileId];
    setKeyFieldCandidates(newCandidates);
  };

  // 設定關鍵欄位
  const handleKeyFieldChange = (fileId: string, field: string) => {
    setSelectedKeyFields(prev => ({
      ...prev,
      [fileId]: field
    }));
  };

  // 執行合併
  const handleMerge = useCallback(() => {
    if (uploadedFiles.length === 0) {
      showErrorToast('請先上傳檔案');
      return;
    }

    if (uploadedFiles.length > 1) {
      // 檢查是否所有檔案都選擇了關鍵欄位
      const missingKeyFields = uploadedFiles.filter(
        file => !selectedKeyFields[file.id]
      );
      
      if (missingKeyFields.length > 0) {
        showErrorToast('請為所有檔案選擇關鍵欄位');
        return;
      }
    }

    setLoading(true);
    try {
      // 建立合併配置
      const config: MergeConfig = {
        files: uploadedFiles.map(file => ({
          id: file.id,
          keyField: selectedKeyFields[file.id] || ''
        })),
        mergeStrategy,
        handleDuplicates: 'rename',
        caseSensitive: false
      };

      // 執行合併
      const merged = mergeFiles(uploadedFiles, config);
      
      // 驗證合併結果
      const validation = validateMerge(merged);
      if (!validation.isValid) {
        Alert.alert('合併失敗', validation.issues.join('\n'));
        return;
      }

      if (validation.warnings.length > 0) {
        console.warn('合併警告:', validation.warnings);
      }

      // 更新狀態
      onMergeConfigured(config, merged);
      setShowMergePreview(true);
      
      showSuccessToast(
        `成功合併 ${uploadedFiles.length} 個檔案，共 ${merged.data.length} 筆資料`
      );
    } catch (error) {
      console.error('合併失敗:', error);
      showErrorToast('合併檔案失敗');
    } finally {
      setLoading(false);
    }
  }, [uploadedFiles, selectedKeyFields, mergeStrategy, onMergeConfigured]);

  // 渲染檔案卡片
  const renderFileCard = (file: UploadedFile) => {
    const isSelected = selectedFileId === file.id;
    const candidates = keyFieldCandidates[file.id] || [];
    const selectedKey = selectedKeyFields[file.id];

    return (
      <TouchableOpacity
        key={file.id}
        style={[
          styles.fileCard,
          {
            backgroundColor: colors.white,
            borderColor: isSelected ? colors.primary : colors.gray200
          }
        ]}
        onPress={() => setSelectedFileId(isSelected ? null : file.id)}
        activeOpacity={0.7}
      >
        <View style={styles.fileHeader}>
          <MaterialIcons name="insert-drive-file" size={24} color={colors.primary} />
          <View style={styles.fileInfo}>
            <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>
              {file.name}
            </Text>
            <Text style={[styles.fileStats, { color: colors.gray500 }]}>
              {file.rowCount} 列 × {file.headers.length} 欄
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => handleRemoveFile(file.id)}
            style={styles.removeButton}
          >
            <MaterialIcons name="close" size={20} color={colors.gray500} />
          </TouchableOpacity>
        </View>

        {/* 關鍵欄位選擇 */}
        {uploadedFiles.length > 1 && (
          <View style={[styles.keyFieldSection, { borderTopColor: colors.gray100 }]}>
            <Text style={[styles.keyFieldLabel, { color: colors.gray600 }]}>
              關鍵欄位（用於合併）
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.keyFieldOptions}>
                {candidates.slice(0, 3).map(candidate => (
                  <TouchableOpacity
                    key={candidate.field}
                    style={[
                      styles.keyFieldOption,
                      {
                        backgroundColor: selectedKey === candidate.field 
                          ? colors.primary 
                          : colors.gray100,
                        borderColor: candidate.confidence === 'high' 
                          ? colors.success 
                          : colors.gray200
                      }
                    ]}
                    onPress={() => handleKeyFieldChange(file.id, candidate.field)}
                  >
                    <Text style={[
                      styles.keyFieldText,
                      { 
                        color: selectedKey === candidate.field 
                          ? colors.white 
                          : colors.gray700 
                      }
                    ]}>
                      {candidate.field}
                    </Text>
                    <View style={[
                      styles.confidenceBadge,
                      {
                        backgroundColor: selectedKey === candidate.field
                          ? colors.white + '30'
                          : getConfidenceColor(candidate.confidence) + '20'
                      }
                    ]}>
                      <Text style={[
                        styles.confidenceText,
                        {
                          color: selectedKey === candidate.field
                            ? colors.white
                            : getConfidenceColor(candidate.confidence)
                        }
                      ]}>
                        {candidate.confidence === 'high' ? '推薦' : 
                         candidate.confidence === 'medium' ? '可用' : ''}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* 展開顯示更多資訊 */}
        {isSelected && (
          <View style={[styles.expandedInfo, { borderTopColor: colors.gray100 }]}>
            <Text style={[styles.expandedTitle, { color: colors.gray600 }]}>
              欄位預覽
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.headerPreview}>
                {file.headers.slice(0, 10).map((header, index) => (
                  <View 
                    key={index} 
                    style={[styles.headerChip, { backgroundColor: colors.gray100 }]}
                  >
                    <Text style={[styles.headerChipText, { color: colors.gray700 }]}>
                      {header}
                    </Text>
                  </View>
                ))}
                {file.headers.length > 10 && (
                  <Text style={[styles.moreText, { color: colors.gray500 }]}>
                    +{file.headers.length - 10} 更多
                  </Text>
                )}
              </View>
            </ScrollView>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // 取得信心度顏色
  const getConfidenceColor = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'low': return '#9E9E9E';
    }
  };

  // 渲染合併預覽
  const renderMergePreview = () => {
    if (!mergedTable || !showMergePreview) return null;

    const preview = previewMergedData(mergedTable, 5);

    return (
      <View style={[styles.previewContainer, { backgroundColor: colors.white }]}>
        <View style={styles.previewHeader}>
          <Text style={[styles.previewTitle, { color: colors.text }]}>
            合併結果預覽
          </Text>
          <TouchableOpacity onPress={() => setShowMergePreview(false)}>
            <MaterialIcons name="close" size={20} color={colors.gray500} />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View>
            {/* 表頭 */}
            <View style={[styles.tableRow, { backgroundColor: colors.gray50 }]}>
              {preview.headers.map((header, index) => (
                <View key={index} style={styles.tableCell}>
                  <Text style={[styles.tableCellText, { color: colors.gray700, fontWeight: '600' }]}>
                    {header}
                  </Text>
                </View>
              ))}
            </View>

            {/* 資料列 */}
            {preview.data.map((row, rowIndex) => (
              <View 
                key={rowIndex} 
                style={[
                  styles.tableRow,
                  { borderBottomColor: colors.gray100 }
                ]}
              >
                {preview.headers.map((header, cellIndex) => (
                  <View key={cellIndex} style={styles.tableCell}>
                    <Text 
                      style={[styles.tableCellText, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {row[header] || '-'}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>

        {preview.hasMore && (
          <Text style={[styles.moreDataText, { color: colors.gray500 }]}>
            還有 {mergedTable.data.length - 5} 筆資料...
          </Text>
        )}

        <View style={[styles.mergeStats, { borderTopColor: colors.gray100 }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.gray500 }]}>總筆數</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {mergedTable.mergeInfo.totalRows}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.gray500 }]}>匹配</Text>
            <Text style={[styles.statValue, { color: colors.success }]}>
              {mergedTable.mergeInfo.matchedRows}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.gray500 }]}>未匹配</Text>
            <Text style={[styles.statValue, { color: colors.warning }]}>
              {mergedTable.mergeInfo.unmatchedRows}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 上傳區域 */}
      <TouchableOpacity
        style={[styles.uploadArea, { borderColor: colors.primary }]}
        onPress={handleFileSelect}
        activeOpacity={0.7}
      >
        <MaterialIcons name="cloud-upload" size={48} color={colors.primary} />
        <Text style={[styles.uploadText, { color: colors.text }]}>
          點擊上傳 CSV 檔案
        </Text>
        <Text style={[styles.uploadHint, { color: colors.gray500 }]}>
          支援多個檔案，可根據關鍵欄位自動合併
        </Text>
      </TouchableOpacity>

      {/* 檔案列表 */}
      {uploadedFiles.length > 0 && (
        <View style={styles.filesSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            已上傳檔案 ({uploadedFiles.length})
          </Text>
          {uploadedFiles.map(renderFileCard)}
        </View>
      )}

      {/* 合併策略選擇 */}
      {uploadedFiles.length > 1 && (
        <View style={styles.mergeStrategySection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            合併策略
          </Text>
          <View style={styles.strategyOptions}>
            {(['left', 'inner', 'outer'] as MergeStrategy[]).map(strategy => (
              <TouchableOpacity
                key={strategy}
                style={[
                  styles.strategyOption,
                  {
                    backgroundColor: mergeStrategy === strategy 
                      ? colors.primary 
                      : colors.gray100
                  }
                ]}
                onPress={() => setMergeStrategy(strategy)}
              >
                <Text style={[
                  styles.strategyText,
                  { 
                    color: mergeStrategy === strategy 
                      ? colors.white 
                      : colors.gray700 
                  }
                ]}>
                  {strategy === 'left' ? '左連接' :
                   strategy === 'inner' ? '內連接' : '外連接'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.strategyHint, { color: colors.gray500 }]}>
            {mergeStrategy === 'left' && '保留第一個檔案的所有資料'}
            {mergeStrategy === 'inner' && '只保留有匹配的資料'}
            {mergeStrategy === 'outer' && '保留所有檔案的所有資料'}
          </Text>
        </View>
      )}

      {/* 合併按鈕 */}
      {uploadedFiles.length > 0 && !mergedTable && (
        <TouchableOpacity
          style={[styles.mergeButton, { backgroundColor: colors.primary }]}
          onPress={handleMerge}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <MaterialIcons name="merge-type" size={20} color={colors.white} />
              <Text style={[styles.mergeButtonText, { color: colors.white }]}>
                {uploadedFiles.length === 1 ? '確認檔案' : '合併檔案'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* 合併預覽 */}
      {renderMergePreview()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 20
  },
  uploadArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12
  },
  uploadHint: {
    fontSize: 12,
    marginTop: 4
  },
  filesSection: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12
  },
  fileCard: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden'
  },
  fileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12
  },
  fileInfo: {
    flex: 1
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500'
  },
  fileStats: {
    fontSize: 12,
    marginTop: 2
  },
  removeButton: {
    padding: 4
  },
  keyFieldSection: {
    borderTopWidth: 1,
    padding: 12
  },
  keyFieldLabel: {
    fontSize: 12,
    marginBottom: 8
  },
  keyFieldOptions: {
    flexDirection: 'row',
    gap: 8
  },
  keyFieldOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  keyFieldText: {
    fontSize: 12,
    fontWeight: '500'
  },
  confidenceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: '600'
  },
  expandedInfo: {
    borderTopWidth: 1,
    padding: 12
  },
  expandedTitle: {
    fontSize: 12,
    marginBottom: 8
  },
  headerPreview: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center'
  },
  headerChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  headerChipText: {
    fontSize: 11
  },
  moreText: {
    fontSize: 11,
    marginLeft: 4
  },
  mergeStrategySection: {
    marginBottom: 24
  },
  strategyOptions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8
  },
  strategyOption: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center'
  },
  strategyText: {
    fontSize: 12,
    fontWeight: '500'
  },
  strategyHint: {
    fontSize: 11
  },
  mergeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 24
  },
  mergeButtonText: {
    fontSize: 14,
    fontWeight: '600'
  },
  previewContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 24
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5'
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600'
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1
  },
  tableCell: {
    width: 120,
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: '#E5E5E5'
  },
  tableCellText: {
    fontSize: 12
  },
  moreDataText: {
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 8
  },
  mergeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1
  },
  statItem: {
    alignItems: 'center'
  },
  statLabel: {
    fontSize: 10,
    marginBottom: 2
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600'
  }
});

export default FileUploadMerger;