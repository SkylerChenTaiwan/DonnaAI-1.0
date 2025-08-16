/**
 * FileUploader - 動態欄位檔案上傳元件
 * 支援拖放（Web）和檔案選擇（Mobile），使用 Adaptive 元件確保跨平台相容性
 */

import React, { useState, useCallback, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import { pickDocument, DocumentPickerOptions } from 'expo-document-picker';
import {
  AdaptiveView,
  AdaptiveText,
  AdaptiveButton,
  type AdaptiveViewProps,
} from '@/components/adaptive';
import { withAlpha } from '@/utils/colorUtils';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  maxSize: number;
  acceptedFormats: string[];
  disabled?: boolean;
  isLoading?: boolean;
  progress?: number;
  className?: string;
  style?: AdaptiveViewProps['style'];
}

interface UploadState {
  isDragOver: boolean;
  isUploading: boolean;
  error: string | null;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelect,
  maxSize,
  acceptedFormats,
  disabled = false,
  isLoading = false,
  progress = 0,
  className,
  style,
}) => {
  const [uploadState, setUploadState] = useState<UploadState>({
    isDragOver: false,
    isUploading: false,
    error: null,
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * 驗證檔案
   */
  const validateFile = useCallback((file: File): string | null => {
    // 檢查檔案大小
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
      return `檔案太大，最大允許 ${maxSizeMB}MB`;
    }

    // 檢查檔案格式
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !acceptedFormats.includes(`.${fileExtension}`)) {
      return `不支援的檔案格式，請上傳：${acceptedFormats.join(', ')}`;
    }

    return null;
  }, [maxSize, acceptedFormats]);

  /**
   * 處理檔案選擇
   */
  const handleFileSelect = useCallback(async (file: File) => {
    setUploadState(prev => ({ ...prev, error: null, isUploading: true }));

    try {
      const error = validateFile(file);
      if (error) {
        setUploadState(prev => ({ ...prev, error, isUploading: false }));
        return;
      }

      await onFileSelect(file);
      setUploadState(prev => ({ ...prev, isUploading: false }));
    } catch (error) {
      setUploadState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '檔案上傳失敗',
        isUploading: false,
      }));
    }
  }, [validateFile, onFileSelect]);

  /**
   * Web 平台拖放處理
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isLoading) {
      setUploadState(prev => ({ ...prev, isDragOver: true }));
    }
  }, [disabled, isLoading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setUploadState(prev => ({ ...prev, isDragOver: false }));
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setUploadState(prev => ({ ...prev, isDragOver: false }));

    if (disabled || isLoading) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [disabled, isLoading, handleFileSelect]);

  /**
   * Web 檔案輸入處理
   */
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
    // 重置 input 值以允許重複選擇同一檔案
    e.target.value = '';
  }, [handleFileSelect]);

  /**
   * Mobile 檔案選擇
   */
  const handleMobileFilePick = useCallback(async () => {
    if (disabled || isLoading) return;

    try {
      const options: DocumentPickerOptions = {
        type: acceptedFormats.includes('.csv') ? 'text/csv' : '*/*',
        copyToCacheDirectory: true,
      };

      const result = await pickDocument(options);
      
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        
        // 建立 File 物件
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        const file = new File([blob], asset.name, { type: asset.mimeType || 'text/csv' });
        
        await handleFileSelect(file);
      }
    } catch (error) {
      Alert.alert('錯誤', '無法選擇檔案，請重試');
      console.error('Mobile file pick error:', error);
    }
  }, [disabled, isLoading, acceptedFormats, handleFileSelect]);

  /**
   * 觸發檔案選擇
   */
  const triggerFileSelect = useCallback(() => {
    if (Platform.OS === 'web') {
      fileInputRef.current?.click();
    } else {
      handleMobileFilePick();
    }
  }, [handleMobileFilePick]);

  /**
   * 格式化檔案大小
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // 樣式
  const containerStyle = {
    minHeight: 120,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed' as const,
    borderColor: uploadState.isDragOver 
      ? '#007AFF' 
      : uploadState.error 
        ? '#FF3B30' 
        : '#E3E1DC',
    backgroundColor: uploadState.isDragOver 
      ? withAlpha('#007AFF', 0.05)
      : disabled || isLoading
        ? withAlpha('#8E8E93', 0.1)
        : '#FFFFFF',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 20,
    ...(style as any),
  };

  const progressBarStyle = {
    width: '100%',
    height: 4,
    backgroundColor: withAlpha('#E3E1DC', 0.3),
    borderRadius: 2,
    overflow: 'hidden' as const,
    marginTop: 8,
  };

  const progressFillStyle = {
    height: '100%',
    backgroundColor: '#007AFF',
    width: `${Math.max(0, Math.min(100, progress))}%`,
    transition: Platform.OS === 'web' ? 'width 0.3s ease' : undefined,
  };

  return (
    <AdaptiveView style={containerStyle} className={className}>
      {/* Web 拖放區域 */}
      {Platform.OS === 'web' && (
        <>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
            }}
            onClick={disabled || isLoading ? undefined : triggerFileSelect}
          >
            {/* 隱藏的檔案輸入 */}
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedFormats.join(',')}
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
              disabled={disabled || isLoading}
            />
            
            {/* 拖放提示 */}
            <AdaptiveText 
              style={{ 
                fontSize: 16, 
                fontWeight: '600', 
                textAlign: 'center',
                color: uploadState.isDragOver ? '#007AFF' : '#1C1C1E',
                marginBottom: 8,
              }}
            >
              {uploadState.isUploading || isLoading
                ? '上傳中...'
                : uploadState.isDragOver
                  ? '放下檔案以上傳'
                  : '拖放檔案或點擊選擇'}
            </AdaptiveText>
          </div>
        </>
      )}

      {/* Mobile 檔案選擇 */}
      {Platform.OS !== 'web' && (
        <AdaptiveView style={{ alignItems: 'center', width: '100%' }}>
          <AdaptiveText 
            style={{ 
              fontSize: 16, 
              fontWeight: '600', 
              textAlign: 'center',
              color: '#1C1C1E',
              marginBottom: 16,
            }}
          >
            {uploadState.isUploading || isLoading ? '上傳中...' : '選擇要上傳的檔案'}
          </AdaptiveText>
          
          <AdaptiveButton
            onPress={triggerFileSelect}
            disabled={disabled || isLoading || uploadState.isUploading}
            style={{
              backgroundColor: '#007AFF',
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 8,
            }}
          >
            <AdaptiveText style={{ color: '#FFFFFF', fontWeight: '600' }}>
              {uploadState.isUploading ? '處理中...' : '選擇檔案'}
            </AdaptiveText>
          </AdaptiveButton>
        </AdaptiveView>
      )}

      {/* 檔案格式和大小提示 */}
      <AdaptiveText 
        style={{ 
          fontSize: 12, 
          color: '#8E8E93', 
          textAlign: 'center',
          marginTop: 8,
        }}
      >
        支援格式：{acceptedFormats.join(', ')} | 最大 {formatFileSize(maxSize)}
      </AdaptiveText>

      {/* 進度條 */}
      {(isLoading || uploadState.isUploading) && progress > 0 && (
        <AdaptiveView style={progressBarStyle}>
          <AdaptiveView style={progressFillStyle} />
        </AdaptiveView>
      )}

      {/* 錯誤訊息 */}
      {uploadState.error && (
        <AdaptiveText 
          style={{ 
            fontSize: 12, 
            color: '#FF3B30', 
            textAlign: 'center',
            marginTop: 8,
            fontWeight: '500',
          }}
        >
          ❌ {uploadState.error}
        </AdaptiveText>
      )}
    </AdaptiveView>
  );
};

export default FileUploader;