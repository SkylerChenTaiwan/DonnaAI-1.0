/**
 * 語音轉任務輸入組件
 * 提供語音輸入並自動轉換為任務資料的界面
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AudioRecorder } from '@/components/audio/AudioRecorder';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { 
  convertVoiceToTask,
  validateExtractionQuality,
  VoiceToTaskResult,
  VoiceToTaskOptions,
  TaskExtractionProgress,
  ExtractedTaskData,
} from '@/services/ai/voice-to-task';
import { TaskFormData } from '@/services/validation/form-schemas';

export interface VoiceTaskInputProps {
  onTaskExtracted: (taskData: Partial<TaskFormData>, result: VoiceToTaskResult) => void;
  onCancel?: () => void;
  userId: string;
  options?: VoiceToTaskOptions;
  maxDuration?: number;
}

type ProcessingStage = 'recording' | 'processing' | 'review' | 'complete' | 'error';

export const VoiceTaskInput: React.FC<VoiceTaskInputProps> = ({
  onTaskExtracted,
  onCancel,
  userId,
  options = {
    extractDeadline: true,
    extractPriority: true,
    extractAssignee: true,
    autoDetectTaskType: true,
  },
  maxDuration = 300, // 預設最大5分鐘
}) => {
  const [stage, setStage] = useState<ProcessingStage>('recording');
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [processing, setProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState<TaskExtractionProgress | null>(null);
  const [extractionResult, setExtractionResult] = useState<VoiceToTaskResult | null>(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // 處理錄音完成
  const handleRecordingComplete = useCallback(async (uri: string, duration: number) => {
    setAudioUri(uri);
    setAudioDuration(duration);
    
    // 自動開始處理
    await processVoiceToTask(uri);
  }, []);

  // 語音轉任務處理
  const processVoiceToTask = useCallback(async (uri: string) => {
    try {
      setProcessing(true);
      setStage('processing');
      
      const result = await convertVoiceToTask(
        uri,
        options,
        (progress: TaskExtractionProgress) => {
          setProcessingProgress(progress);
        }
      );

      setExtractionResult(result);
      setProcessingProgress(null);

      if (result.success && result.extractedTask) {
        // 驗證提取品質
        const qualityCheck = validateExtractionQuality(result.extractedTask);
        
        if (qualityCheck.isValid || result.extractedTask.confidence > 0.5) {
          setStage('review');
        } else {
          // 品質不佳，顯示警告但仍允許檢視
          setStage('review');
          Alert.alert(
            '提取品質警告',
            `發現 ${qualityCheck.issues.length} 個問題，建議檢查任務內容`,
            [{ text: '了解' }]
          );
        }
      } else {
        setStage('error');
        Alert.alert('轉換失敗', result.error || '語音轉任務處理失敗');
      }
    } catch (error) {
      console.error('語音轉任務失敗:', error);
      setStage('error');
      Alert.alert('錯誤', '語音轉任務處理失敗，請重試');
    } finally {
      setProcessing(false);
    }
  }, [options]);

  // 重新錄音
  const handleRetry = useCallback(() => {
    setAudioUri(null);
    setAudioDuration(0);
    setExtractionResult(null);
    setProcessingProgress(null);
    setStage('recording');
  }, []);

  // 確認使用提取的任務
  const handleConfirm = useCallback(() => {
    if (extractionResult?.success && extractionResult.taskFormData) {
      onTaskExtracted(extractionResult.taskFormData, extractionResult);
      setStage('complete');
    }
  }, [extractionResult, onTaskExtracted]);

  // 渲染錄音階段
  const renderRecording = () => (
    <View style={styles.recordingContainer}>
      <View style={styles.header}>
        <Ionicons name="mic" size={32} color="#ef4444" />
        <Text style={styles.headerTitle}>語音轉任務</Text>
        <Text style={styles.headerDescription}>
          說出您的任務內容，系統將自動識別任務標題、優先級、截止時間等資訊
        </Text>
      </View>

      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>💡 說話技巧：</Text>
        <View style={styles.tipsList}>
          <Text style={styles.tipText}>• 清楚說明任務內容和目標</Text>
          <Text style={styles.tipText}>• 提及重要程度（如：「很重要」、「不急」）</Text>
          <Text style={styles.tipText}>• 說明截止時間（如：「明天前」、「這週五」）</Text>
          <Text style={styles.tipText}>• 可以指定負責人（如：「請小明處理」）</Text>
        </View>
      </View>

      <AudioRecorder
        onRecordingComplete={handleRecordingComplete}
        maxDuration={maxDuration}
        showWaveform={true}
        enableOfflineSupport={false}
        userId={userId}
      />

      {/* 高級選項切換 */}
      <TouchableOpacity
        style={styles.advancedToggle}
        onPress={() => setShowAdvancedOptions(!showAdvancedOptions)}
      >
        <Text style={styles.advancedToggleText}>
          高級選項 {showAdvancedOptions ? '▼' : '▶'}
        </Text>
      </TouchableOpacity>

      {showAdvancedOptions && (
        <View style={styles.advancedOptions}>
          <Text style={styles.advancedTitle}>提取選項：</Text>
          <Text style={styles.advancedDescription}>
            系統將嘗試從語音中提取以下資訊：
          </Text>
          <View style={styles.optionsList}>
            <View style={styles.optionItem}>
              <Ionicons 
                name={options.extractPriority ? "checkmark-circle" : "ellipse-outline"} 
                size={16} 
                color={options.extractPriority ? "#22c55e" : "#7A7A7A"} 
              />
              <Text style={styles.optionText}>優先級</Text>
            </View>
            <View style={styles.optionItem}>
              <Ionicons 
                name={options.extractDeadline ? "checkmark-circle" : "ellipse-outline"} 
                size={16} 
                color={options.extractDeadline ? "#22c55e" : "#7A7A7A"} 
              />
              <Text style={styles.optionText}>截止時間</Text>
            </View>
            <View style={styles.optionItem}>
              <Ionicons 
                name={options.extractAssignee ? "checkmark-circle" : "ellipse-outline"} 
                size={16} 
                color={options.extractAssignee ? "#22c55e" : "#7A7A7A"} 
              />
              <Text style={styles.optionText}>指派人員</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  // 渲染處理階段
  const renderProcessing = () => (
    <View style={styles.processingContainer}>
      <LoadingSpinner size="large" />
      <Text style={styles.processingTitle}>正在處理語音...</Text>
      
      {processingProgress && (
        <View style={styles.progressInfo}>
          <Text style={styles.progressMessage}>{processingProgress.message}</Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { width: `${processingProgress.percentage}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {processingProgress.stage === 'transcribing' && '🎤 語音識別中...'}
            {processingProgress.stage === 'analyzing' && '🧠 內容分析中...'}
            {processingProgress.stage === 'extracting' && '📝 任務提取中...'}
            {processingProgress.stage === 'completing' && '✅ 完成處理'}
          </Text>
        </View>
      )}
      
      <Text style={styles.processingHint}>
        AI 正在分析您的語音並提取任務資訊，請稍候...
      </Text>
    </View>
  );

  // 渲染檢視階段
  const renderReview = () => {
    if (!extractionResult?.success || !extractionResult.extractedTask) return null;

    const task = extractionResult.extractedTask;
    const qualityCheck = validateExtractionQuality(task);

    return (
      <ScrollView style={styles.reviewContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.reviewTitle}>提取結果檢查</Text>
        
        {/* 品質指標 */}
        <View style={styles.qualitySection}>
          <View style={styles.qualityHeader}>
            <Text style={styles.sectionTitle}>提取品質</Text>
            <View style={[
              styles.confidenceBadge,
              { backgroundColor: getConfidenceColor(task.confidence) }
            ]}>
              <Text style={styles.confidenceText}>
                {(task.confidence * 100).toFixed(0)}%
              </Text>
            </View>
          </View>
          
          {qualityCheck.issues.length > 0 && (
            <View style={styles.issuesSection}>
              <Text style={styles.issuesTitle}>發現問題：</Text>
              {qualityCheck.issues.map((issue, index) => (
                <Text key={index} style={styles.issueText}>• {issue}</Text>
              ))}
            </View>
          )}
          
          {qualityCheck.suggestions.length > 0 && (
            <View style={styles.suggestionsSection}>
              <Text style={styles.suggestionsTitle}>建議：</Text>
              {qualityCheck.suggestions.map((suggestion, index) => (
                <Text key={index} style={styles.suggestionText}>• {suggestion}</Text>
              ))}
            </View>
          )}
        </View>

        {/* 任務資訊 */}
        <View style={styles.taskSection}>
          <Text style={styles.sectionTitle}>提取的任務資訊</Text>
          
          <View style={styles.taskField}>
            <Text style={styles.fieldLabel}>任務標題</Text>
            <View style={styles.fieldValueContainer}>
              <Text style={styles.fieldValue}>{task.title}</Text>
            </View>
          </View>

          <View style={styles.taskField}>
            <Text style={styles.fieldLabel}>任務描述</Text>
            <View style={[styles.fieldValueContainer, styles.descriptionContainer]}>
              <Text style={styles.fieldValue}>{task.description}</Text>
            </View>
          </View>

          {task.priority && (
            <View style={styles.taskField}>
              <Text style={styles.fieldLabel}>優先級</Text>
              <View style={styles.fieldValueContainer}>
                <Text style={[styles.fieldValue, { color: getPriorityColor(task.priority) }]}>
                  {getPriorityText(task.priority)}
                </Text>
              </View>
            </View>
          )}

          {task.dueDate && (
            <View style={styles.taskField}>
              <Text style={styles.fieldLabel}>截止日期</Text>
              <View style={styles.fieldValueContainer}>
                <Text style={styles.fieldValue}>{formatDate(task.dueDate)}</Text>
              </View>
            </View>
          )}

          {task.assignedTo && (
            <View style={styles.taskField}>
              <Text style={styles.fieldLabel}>指派給</Text>
              <View style={styles.fieldValueContainer}>
                <Text style={styles.fieldValue}>{task.assignedTo}</Text>
              </View>
            </View>
          )}

          {task.tags && task.tags.length > 0 && (
            <View style={styles.taskField}>
              <Text style={styles.fieldLabel}>標籤</Text>
              <View style={styles.tagsContainer}>
                {task.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* 原始轉錄內容 */}
        <View style={styles.transcriptionSection}>
          <Text style={styles.sectionTitle}>原始語音轉錄</Text>
          <View style={styles.transcriptionBox}>
            <Text style={styles.transcriptionText}>{task.rawTranscription}</Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  // 渲染錯誤階段
  const renderError = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle" size={64} color="#ef4444" />
      <Text style={styles.errorTitle}>處理失敗</Text>
      <Text style={styles.errorMessage}>
        {extractionResult?.error || '語音轉任務處理失敗，請重試'}
      </Text>
      <Button
        title="重新錄音"
        onPress={handleRetry}
        style={styles.retryButton}
        icon="refresh"
      />
    </View>
  );

  // 渲染完成階段
  const renderComplete = () => (
    <View style={styles.completeContainer}>
      <Ionicons name="checkmark-circle" size={64} color="#22c55e" />
      <Text style={styles.completeTitle}>任務創建成功</Text>
      <Text style={styles.completeDescription}>
        語音已成功轉換為任務，可以開始執行了！
      </Text>
    </View>
  );

  // 渲染底部按鈕
  const renderFooterButtons = () => {
    switch (stage) {
      case 'recording':
        return (
          <Button
            title="取消"
            variant="secondary"
            onPress={onCancel}
            style={styles.footerButton}
          />
        );
        
      case 'processing':
        return (
          <Button
            title="取消處理"
            variant="secondary"
            onPress={handleRetry}
            style={styles.footerButton}
          />
        );
        
      case 'review':
        return (
          <>
            <Button
              title="重新錄音"
              variant="secondary"
              onPress={handleRetry}
              style={styles.footerButton}
            />
            <Button
              title="確認創建任務"
              onPress={handleConfirm}
              style={styles.footerButton}
              icon="checkmark"
            />
          </>
        );
        
      case 'error':
        return (
          <>
            <Button
              title="取消"
              variant="secondary"
              onPress={onCancel}
              style={styles.footerButton}
            />
            <Button
              title="重新錄音"
              onPress={handleRetry}
              style={styles.footerButton}
              icon="refresh"
            />
          </>
        );
        
      case 'complete':
        return (
          <Button
            title="完成"
            onPress={onCancel}
            style={styles.footerButton}
          />
        );
        
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* 標頭 */}
      <View style={styles.titleHeader}>
        <Text style={styles.title}>語音轉任務</Text>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={onCancel}
        >
          <Ionicons name="close" size={24} color="#7A7A7A" />
        </TouchableOpacity>
      </View>

      {/* 內容區域 */}
      <View style={styles.content}>
        {stage === 'recording' && renderRecording()}
        {stage === 'processing' && renderProcessing()}
        {stage === 'review' && renderReview()}
        {stage === 'error' && renderError()}
        {stage === 'complete' && renderComplete()}
      </View>

      {/* 底部按鈕 */}
      {renderFooterButtons() && (
        <View style={styles.footer}>
          {renderFooterButtons()}
        </View>
      )}
    </View>
  );
};

// 輔助函數
const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 0.8) return '#22c55e';
  if (confidence >= 0.6) return '#3b82f6';
  if (confidence >= 0.4) return '#f59e0b';
  return '#ef4444';
};

const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'urgent': return '#ef4444';
    case 'high': return '#f59e0b';
    case 'medium': return '#3b82f6';
    case 'low': return '#6b7280';
    default: return '#6b7280';
  }
};

const getPriorityText = (priority: string): string => {
  switch (priority) {
    case 'urgent': return '緊急';
    case 'high': return '高';
    case 'medium': return '中';
    case 'low': return '低';
    default: return '未設定';
  }
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0',
  },
  titleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E3E1DC',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  
  // 錄音階段樣式
  recordingContainer: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 12,
    marginBottom: 8,
  },
  headerDescription: {
    fontSize: 16,
    color: '#7A7A7A',
    textAlign: 'center',
    lineHeight: 22,
  },
  tipsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  tipsList: {
    gap: 6,
  },
  tipText: {
    fontSize: 14,
    color: '#7A7A7A',
    lineHeight: 20,
  },
  advancedToggle: {
    marginTop: 16,
    paddingVertical: 8,
  },
  advancedToggleText: {
    fontSize: 14,
    color: '#3b82f6',
    textAlign: 'center',
  },
  advancedOptions: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  advancedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  advancedDescription: {
    fontSize: 14,
    color: '#7A7A7A',
    marginBottom: 12,
  },
  optionsList: {
    gap: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionText: {
    fontSize: 14,
    color: '#1A1A1A',
  },

  // 處理階段樣式
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  processingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 24,
  },
  progressInfo: {
    width: '100%',
    marginBottom: 24,
  },
  progressMessage: {
    fontSize: 16,
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E3E1DC',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1A1A1A',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#7A7A7A',
    textAlign: 'center',
  },
  processingHint: {
    fontSize: 14,
    color: '#7A7A7A',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // 檢視階段樣式
  reviewContainer: {
    flex: 1,
    padding: 20,
  },
  reviewTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 20,
  },
  qualitySection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  qualityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  issuesSection: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  issuesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 6,
  },
  issueText: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 18,
  },
  suggestionsSection: {
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    padding: 12,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 6,
  },
  suggestionText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 18,
  },
  taskSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  taskField: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7A7A7A',
    marginBottom: 6,
  },
  fieldValueContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E3E1DC',
  },
  descriptionContainer: {
    minHeight: 80,
  },
  fieldValue: {
    fontSize: 16,
    color: '#1A1A1A',
    lineHeight: 22,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#E3E1DC',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 12,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  transcriptionSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  transcriptionBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    minHeight: 60,
  },
  transcriptionText: {
    fontSize: 14,
    color: '#7A7A7A',
    lineHeight: 20,
    fontStyle: 'italic',
  },

  // 錯誤階段樣式
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ef4444',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#7A7A7A',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    minWidth: 120,
  },

  // 完成階段樣式
  completeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  completeTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
  },
  completeDescription: {
    fontSize: 16,
    color: '#7A7A7A',
    textAlign: 'center',
  },

  // 底部按鈕
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E3E1DC',
  },
  footerButton: {
    flex: 1,
  },
});