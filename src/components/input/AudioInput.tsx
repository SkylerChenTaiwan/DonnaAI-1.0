/**
 * 音頻輸入組件
 * 包裝 AudioRecorder 組件，添加錄音用途選擇和 AI 處理集成
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Icon } from '@/components/common/Icon';

import { AudioRecorder } from '@/components/audio/AudioRecorder';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { 
  transcribeAudio, 
  cleanTranscriptionText,
  analyzeTranscriptionQuality,
  validateAudioFile,
  SpeechToTextOptions,
  TranscriptionResult,
  SpeechProcessingProgress 
} from '@/services/ai/speech-to-text';

export interface AudioInputProps {
  onTranscriptionComplete: (result: {
    transcription: string;
    audioUri: string;
    duration: number;
    confidence: number;
    purpose: AudioPurpose;
    metadata?: any;
  }) => void;
  onCancel?: () => void;
  userId: string;
  maxDuration?: number;
  language?: string;
  enableQualityCheck?: boolean;
}

export type AudioPurpose = 
  | 'meeting'      // 會議記錄
  | 'note'         // 補充記錄
  | 'task'         // 任務說明
  | 'customer'     // 客戶通話
  | 'other';       // 其他用途

interface PurposeOption {
  key: AudioPurpose;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  settings: Partial<SpeechToTextOptions>;
}

const AUDIO_PURPOSES: PurposeOption[] = [
  {
    key: 'meeting',
    title: '會議記錄',
    description: '記錄會議內容、決議事項',
    icon: 'people-outline',
    settings: {
      enableAutomaticPunctuation: true,
      maxAlternatives: 2,
      profanityFilter: false,
    },
  },
  {
    key: 'note',
    title: '補充記錄',
    description: '補充說明、備註資訊',
    icon: 'document-text-outline',
    settings: {
      enableAutomaticPunctuation: true,
      maxAlternatives: 1,
      profanityFilter: false,
    },
  },
  {
    key: 'task',
    title: '任務說明',
    description: '任務描述、執行步驟',
    icon: 'checkmark-circle-outline',
    settings: {
      enableAutomaticPunctuation: true,
      maxAlternatives: 3,
      profanityFilter: false,
    },
  },
  {
    key: 'customer',
    title: '客戶通話',
    description: '客戶對話、需求討論',
    icon: 'call-outline',
    settings: {
      enableAutomaticPunctuation: true,
      maxAlternatives: 2,
      profanityFilter: true,
    },
  },
  {
    key: 'other',
    title: '其他用途',
    description: '自由格式錄音',
    icon: 'mic-outline',
    settings: {
      enableAutomaticPunctuation: false,
      maxAlternatives: 1,
      profanityFilter: false,
    },
  },
];

type ProcessingStage = 'purpose' | 'recording' | 'processing' | 'review' | 'complete';

export const AudioInput: React.FC<AudioInputProps> = ({
  onTranscriptionComplete,
  onCancel,
  userId,
  maxDuration = 3600,
  language = 'zh-TW',
  enableQualityCheck = true,
}) => {
  const [stage, setStage] = useState<ProcessingStage>('purpose');
  const [selectedPurpose, setSelectedPurpose] = useState<AudioPurpose | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResult | null>(null);
  const [processingProgress, setProcessingProgress] = useState<SpeechProcessingProgress | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [customSettings, setCustomSettings] = useState<Partial<SpeechToTextOptions>>({});

  // 選擇錄音用途
  const handlePurposeSelect = useCallback((purpose: AudioPurpose) => {
    setSelectedPurpose(purpose);
    
    // 設定該用途的預設選項
    const purposeOption = AUDIO_PURPOSES.find(p => p.key === purpose);
    if (purposeOption) {
      setCustomSettings(purposeOption.settings);
    }
    
    setStage('recording');
  }, []);

  // 錄音完成處理
  const handleRecordingComplete = useCallback(async (uri: string, duration: number) => {
    try {
      setAudioUri(uri);
      setAudioDuration(duration);

      // 驗證音頻檔案
      const validation = await validateAudioFile(uri);
      if (!validation.isValid) {
        Alert.alert('檔案驗證失敗', validation.reason || '音頻檔案無效');
        return;
      }

      // 自動開始轉錄
      await startTranscription(uri);
    } catch (error) {
      console.error('錄音處理失敗:', error);
      Alert.alert('錯誤', '錄音處理失敗，請重試');
    }
  }, []);

  // 開始語音轉文字處理
  const startTranscription = useCallback(async (uri: string) => {
    if (!selectedPurpose) return;

    try {
      setIsProcessing(true);
      setStage('processing');
      
      // 合併設定
      const options: SpeechToTextOptions = {
        language,
        ...customSettings,
      };

      const result = await transcribeAudio(
        uri,
        options,
        (progress: SpeechProcessingProgress) => {
          setProcessingProgress(progress);
        }
      );

      // 清理轉錄文本
      const cleanedText = cleanTranscriptionText(result.transcription);
      const finalResult = {
        ...result,
        transcription: cleanedText,
      };

      setTranscriptionResult(finalResult);
      setStage(enableQualityCheck ? 'review' : 'complete');

      // 如果不需要質量檢查，直接完成
      if (!enableQualityCheck) {
        handleComplete(finalResult);
      }

    } catch (error) {
      console.error('語音轉文字失敗:', error);
      Alert.alert('轉錄失敗', error instanceof Error ? error.message : '語音轉文字處理失敗');
      setStage('recording'); // 返回錄音階段
    } finally {
      setIsProcessing(false);
      setProcessingProgress(null);
    }
  }, [selectedPurpose, language, customSettings, enableQualityCheck]);

  // 完成處理
  const handleComplete = useCallback((result?: TranscriptionResult) => {
    const finalResult = result || transcriptionResult;
    if (!finalResult || !audioUri || !selectedPurpose) return;

    onTranscriptionComplete({
      transcription: finalResult.transcription,
      audioUri,
      duration: audioDuration,
      confidence: finalResult.confidence,
      purpose: selectedPurpose,
      metadata: {
        language: finalResult.languageCode,
        alternatives: finalResult.alternatives,
        processingTime: Date.now(),
        userId,
      },
    });

    setStage('complete');
  }, [transcriptionResult, audioUri, audioDuration, selectedPurpose, userId, onTranscriptionComplete]);

  // 重新錄音
  const handleRetry = useCallback(() => {
    setAudioUri(null);
    setAudioDuration(0);
    setTranscriptionResult(null);
    setProcessingProgress(null);
    setStage('recording');
  }, []);

  // 渲染用途選擇
  const renderPurposeSelection = () => (
    <ScrollView style={styles.purposeContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.stageTitle}>選擇錄音用途</Text>
      <Text style={styles.stageDescription}>
        選擇錄音的主要用途，系統將根據用途優化語音識別設定
      </Text>
      
      <View style={styles.purposeOptions}>
        {AUDIO_PURPOSES.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={styles.purposeOption}
            onPress={() => handlePurposeSelect(option.key)}
          >
            <View style={styles.purposeIcon}>
              <Icon name={option.icon} size={24} color="#1A1A1A" />
            </View>
            <View style={styles.purposeInfo}>
              <Text style={styles.purposeTitle}>{option.title}</Text>
              <Text style={styles.purposeDescription}>{option.description}</Text>
            </View>
            <Icon name="chevron-forward" size={20} color="#7A7A7A" />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  // 渲染錄音階段
  const renderRecording = () => {
    const purposeOption = AUDIO_PURPOSES.find(p => p.key === selectedPurpose);
    
    return (
      <View style={styles.recordingContainer}>
        <View style={styles.purposeBadge}>
          <Icon name={purposeOption?.icon || 'mic'} size={16} color="#1A1A1A" />
          <Text style={styles.purposeBadgeText}>{purposeOption?.title}</Text>
        </View>
        
        <Text style={styles.stageTitle}>開始錄音</Text>
        <Text style={styles.stageDescription}>
          點擊開始錄音按鈕開始記錄，錄音完成後將自動進行語音轉文字處理
        </Text>

        <AudioRecorder
          onRecordingComplete={handleRecordingComplete}
          maxDuration={maxDuration}
          showWaveform={true}
          enableOfflineSupport={true}
          userId={userId}
        />
      </View>
    );
  };

  // 渲染處理階段
  const renderProcessing = () => (
    <View style={styles.processingContainer}>
      <LoadingSpinner size="large" />
      <Text style={styles.stageTitle}>處理中</Text>
      
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
            {processingProgress.percentage.toFixed(0)}%
          </Text>
        </View>
      )}
      
      <Text style={styles.processingHint}>
        請耐心等待，語音轉文字處理需要一些時間...
      </Text>
    </View>
  );

  // 渲染檢查階段
  const renderReview = () => {
    if (!transcriptionResult) return null;

    const qualityAnalysis = analyzeTranscriptionQuality(transcriptionResult);
    
    return (
      <ScrollView style={styles.reviewContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.stageTitle}>轉錄結果檢查</Text>
        
        {/* 品質指標 */}
        <View style={styles.qualitySection}>
          <Text style={styles.sectionTitle}>轉錄品質</Text>
          <View style={styles.qualityIndicator}>
            <View style={[
              styles.qualityBadge,
              { backgroundColor: getQualityColor(qualityAnalysis.quality) }
            ]}>
              <Text style={styles.qualityText}>
                {getQualityText(qualityAnalysis.quality)}
              </Text>
            </View>
            <Text style={styles.confidenceText}>
              信心度: {(transcriptionResult.confidence * 100).toFixed(1)}%
            </Text>
          </View>
          
          {qualityAnalysis.issues.length > 0 && (
            <View style={styles.issuesSection}>
              <Text style={styles.issuesTitle}>發現的問題：</Text>
              {qualityAnalysis.issues.map((issue, index) => (
                <Text key={index} style={styles.issueText}>• {issue}</Text>
              ))}
            </View>
          )}
          
          {qualityAnalysis.suggestions.length > 0 && (
            <View style={styles.suggestionsSection}>
              <Text style={styles.suggestionsTitle}>改善建議：</Text>
              {qualityAnalysis.suggestions.map((suggestion, index) => (
                <Text key={index} style={styles.suggestionText}>• {suggestion}</Text>
              ))}
            </View>
          )}
        </View>

        {/* 轉錄內容 */}
        <View style={styles.transcriptionSection}>
          <Text style={styles.sectionTitle}>轉錄內容</Text>
          <View style={styles.transcriptionBox}>
            <Text style={styles.transcriptionText}>
              {transcriptionResult.transcription}
            </Text>
          </View>
          
          <View style={styles.transcriptionMeta}>
            <Text style={styles.metaText}>
              錄音時長: {Math.floor(audioDuration / 60)}:{(audioDuration % 60).toString().padStart(2, '0')}
            </Text>
            <Text style={styles.metaText}>
              語言: {transcriptionResult.languageCode}
            </Text>
          </View>
        </View>

        {/* 備選結果 */}
        {transcriptionResult.alternatives && transcriptionResult.alternatives.length > 0 && (
          <View style={styles.alternativesSection}>
            <Text style={styles.sectionTitle}>其他可能結果</Text>
            {transcriptionResult.alternatives.slice(0, 2).map((alt, index) => (
              <TouchableOpacity
                key={index}
                style={styles.alternativeOption}
                onPress={() => {
                  const updatedResult = {
                    ...transcriptionResult,
                    transcription: alt.transcript,
                    confidence: alt.confidence,
                  };
                  setTranscriptionResult(updatedResult);
                }}
              >
                <Text style={styles.alternativeText} numberOfLines={3}>
                  {alt.transcript}
                </Text>
                <Text style={styles.alternativeConfidence}>
                  信心度: {(alt.confidence * 100).toFixed(1)}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  // 渲染不同階段的內容
  const renderStageContent = () => {
    switch (stage) {
      case 'purpose':
        return renderPurposeSelection();
      case 'recording':
        return renderRecording();
      case 'processing':
        return renderProcessing();
      case 'review':
        return renderReview();
      case 'complete':
        return (
          <View style={styles.completeContainer}>
            <Icon name="checkmark-circle" size={64} color="#22c55e" />
            <Text style={styles.completeTitle}>處理完成</Text>
            <Text style={styles.completeDescription}>
              語音已成功轉換為文字並準備使用
            </Text>
          </View>
        );
      default:
        return null;
    }
  };

  // 渲染底部按鈕
  const renderFooterButtons = () => {
    switch (stage) {
      case 'purpose':
        return (
          <Button
            title="取消"
            variant="secondary"
            onPress={onCancel}
            style={styles.footerButton}
          />
        );
        
      case 'recording':
        return (
          <>
            <Button
              title="重新選擇用途"
              variant="secondary"
              onPress={() => setStage('purpose')}
              style={styles.footerButton}
            />
            <Button
              title="取消"
              variant="secondary"
              onPress={onCancel}
              style={styles.footerButton}
            />
          </>
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
              title="確認使用"
              onPress={() => handleComplete()}
              style={styles.footerButton}
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
      <View style={styles.header}>
        <Text style={styles.title}>語音輸入</Text>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={onCancel}
        >
          <Icon name="close" size={24} color="#7A7A7A" />
        </TouchableOpacity>
      </View>

      {/* 進度指示器 */}
      <View style={styles.progressIndicator}>
        {['purpose', 'recording', 'processing', 'review', 'complete'].map((stepStage, index) => {
          const isActive = stage === stepStage;
          const isCompleted = ['purpose', 'recording', 'processing', 'review', 'complete'].indexOf(stage) > index;
          
          return (
            <View
              key={stepStage}
              style={[
                styles.progressStep,
                isActive && styles.progressStepActive,
                isCompleted && styles.progressStepCompleted,
              ]}
            />
          );
        })}
      </View>

      {/* 內容區域 */}
      <View style={styles.content}>
        {renderStageContent()}
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
const getQualityColor = (quality: string): string => {
  switch (quality) {
    case 'excellent': return '#22c55e';
    case 'good': return '#3b82f6';
    case 'fair': return '#f59e0b';
    case 'poor': return '#ef4444';
    default: return '#6b7280';
  }
};

const getQualityText = (quality: string): string => {
  switch (quality) {
    case 'excellent': return '優秀';
    case 'good': return '良好';
    case 'fair': return '一般';
    case 'poor': return '較差';
    default: return '未知';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0',
  },
  header: {
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
  progressIndicator: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E3E1DC',
    gap: 8,
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: '#E3E1DC',
    borderRadius: 2,
  },
  progressStepActive: {
    backgroundColor: '#1A1A1A',
  },
  progressStepCompleted: {
    backgroundColor: '#22c55e',
  },
  content: {
    flex: 1,
  },
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
  
  // 用途選擇樣式
  purposeContainer: {
    flex: 1,
    padding: 20,
  },
  stageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  stageDescription: {
    fontSize: 16,
    color: '#7A7A7A',
    lineHeight: 22,
    marginBottom: 24,
  },
  purposeOptions: {
    gap: 12,
  },
  purposeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E3E1DC',
  },
  purposeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  purposeInfo: {
    flex: 1,
  },
  purposeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  purposeDescription: {
    fontSize: 14,
    color: '#7A7A7A',
  },
  
  // 錄音階段樣式
  recordingContainer: {
    flex: 1,
    padding: 20,
  },
  purposeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 20,
    gap: 6,
  },
  purposeBadgeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  
  // 處理階段樣式
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  progressInfo: {
    width: '100%',
    marginTop: 32,
  },
  progressMessage: {
    fontSize: 16,
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 16,
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
    marginTop: 24,
    fontStyle: 'italic',
  },
  
  // 檢查階段樣式
  reviewContainer: {
    flex: 1,
    padding: 20,
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
  qualityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  qualityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  qualityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  confidenceText: {
    fontSize: 14,
    color: '#7A7A7A',
  },
  issuesSection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
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
    marginTop: 8,
    padding: 12,
    backgroundColor: '#dbeafe',
    borderRadius: 8,
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
  transcriptionSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  transcriptionBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    minHeight: 120,
  },
  transcriptionText: {
    fontSize: 16,
    color: '#1A1A1A',
    lineHeight: 24,
  },
  transcriptionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    fontSize: 12,
    color: '#7A7A7A',
  },
  alternativesSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  alternativeOption: {
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E3E1DC',
  },
  alternativeText: {
    fontSize: 14,
    color: '#1A1A1A',
    lineHeight: 20,
    marginBottom: 6,
  },
  alternativeConfidence: {
    fontSize: 12,
    color: '#7A7A7A',
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
});