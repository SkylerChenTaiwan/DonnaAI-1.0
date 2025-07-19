/**
 * 補救錄音組件
 * 支援語音摘要錄製和文字摘要輸入
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button } from '@/components/common/Button';
import { TextInput } from '@/components/common/TextInput';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { AudioRecorder } from '@/components/audio/AudioRecorder';
import { useRecordStore } from '@/stores/recordStore';
import { useAuthStore } from '@/stores/authStore';

interface MakeupRecordingProps {
  meetingTitle: string;
  originalMeetingDate?: Date;
  onComplete: (recordId: string) => void;
  onCancel: () => void;
}

type MakeupMode = 'selection' | 'voice_summary' | 'text_summary' | 'processing';

export const MakeupRecording = ({
  meetingTitle,
  originalMeetingDate,
  onComplete,
  onCancel
}: MakeupRecordingProps) => {
  const [currentMode, setCurrentMode] = useState<MakeupMode>('selection');
  const [textSummary, setTextSummary] = useState('');
  const [voiceSummaryUri, setVoiceSummaryUri] = useState<string | null>(null);
  const [voiceSummaryDuration, setVoiceSummaryDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { createRecord } = useRecordStore();
  const { user } = useAuthStore();

  // 格式化日期顯示
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 選擇語音摘要模式
  const handleVoiceSummaryMode = () => {
    setCurrentMode('voice_summary');
  };

  // 選擇文字摘要模式
  const handleTextSummaryMode = () => {
    setCurrentMode('text_summary');
  };

  // 語音摘要錄製完成
  const handleVoiceSummaryComplete = (audioUri: string, duration: number) => {
    setVoiceSummaryUri(audioUri);
    setVoiceSummaryDuration(duration);
    
    Alert.alert(
      '錄音完成',
      `語音摘要錄製完成，時長 ${Math.floor(duration / 60)} 分 ${Math.floor(duration % 60)} 秒。是否提交處理？`,
      [
        { text: '重新錄製', onPress: () => setVoiceSummaryUri(null) },
        { text: '提交處理', onPress: handleVoiceSummarySubmit }
      ]
    );
  };

  // 提交語音摘要
  const handleVoiceSummarySubmit = async () => {
    if (!voiceSummaryUri || !user) return;

    try {
      setCurrentMode('processing');
      setIsProcessing(true);

      // 建立補救錄音記錄
      const record = await createRecord({
        type: 'meeting',
        title: `${meetingTitle} (語音摘要)`,
        customerIds: [],
        participantIds: [user.uid],
        scheduledAt: originalMeetingDate as any,
        content: '',
        status: 'processing',
        processingPreference: 'immediate',
        recordingType: 'voice_summary',
        teamId: user.teamId || '',
        organizationId: user.organizationId || '',
        audioRecordingState: {
          status: 'processing',
          duration: voiceSummaryDuration,
          format: 'mp3'
        }
      }, user.uid, new File([voiceSummaryUri], 'voice_summary.mp3'));

      onComplete(record.id!);

    } catch (error) {
      console.error('提交語音摘要失敗:', error);
      Alert.alert('提交失敗', '無法處理語音摘要，請稍後重試');
      setCurrentMode('voice_summary');
    } finally {
      setIsProcessing(false);
    }
  };

  // 提交文字摘要
  const handleTextSummarySubmit = async () => {
    if (!textSummary.trim() || !user) {
      Alert.alert('請輸入內容', '請輸入會議摘要內容');
      return;
    }

    try {
      setCurrentMode('processing');
      setIsProcessing(true);

      // 建立文字摘要記錄
      const record = await createRecord({
        type: 'meeting',
        title: `${meetingTitle} (文字摘要)`,
        customerIds: [],
        participantIds: [user.uid],
        scheduledAt: originalMeetingDate as any,
        content: textSummary,
        status: 'processing',
        processingPreference: 'immediate',
        recordingType: 'text_summary',
        teamId: user.teamId || '',
        organizationId: user.organizationId || ''
      }, user.uid);

      onComplete(record.id!);

    } catch (error) {
      console.error('提交文字摘要失敗:', error);
      Alert.alert('提交失敗', '無法處理文字摘要，請稍後重試');
      setCurrentMode('text_summary');
    } finally {
      setIsProcessing(false);
    }
  };

  // 渲染模式選擇
  const renderModeSelection = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>補救錄音</Text>
        <Text style={styles.subtitle}>
          為會議「{meetingTitle}」建立補救記錄
        </Text>
        {originalMeetingDate && (
          <Text style={styles.dateInfo}>
            原始會議時間：{formatDate(originalMeetingDate)}
          </Text>
        )}
      </View>

      <View style={styles.optionsContainer}>
        <View style={styles.optionCard}>
          <Text style={styles.optionTitle}>語音摘要</Text>
          <Text style={styles.optionDescription}>
            錄製口述的會議內容摘要，AI 會進行語音轉文字和智能分析
          </Text>
          <View style={styles.optionFeatures}>
            <Text style={styles.featureItem}>• 支援自然語言描述</Text>
            <Text style={styles.featureItem}>• 自動語音轉文字</Text>
            <Text style={styles.featureItem}>• AI 內容分析</Text>
          </View>
          <Button
            title="開始語音摘要"
            onPress={handleVoiceSummaryMode}
            style={styles.primaryButton}
            textStyle={styles.primaryButtonText}
          />
        </View>

        <View style={styles.optionCard}>
          <Text style={styles.optionTitle}>文字摘要</Text>
          <Text style={styles.optionDescription}>
            直接輸入會議內容的文字摘要，AI 會進行智能分析
          </Text>
          <View style={styles.optionFeatures}>
            <Text style={styles.featureItem}>• 快速文字輸入</Text>
            <Text style={styles.featureItem}>• 支援複製貼上</Text>
            <Text style={styles.featureItem}>• AI 內容分析</Text>
          </View>
          <Button
            title="開始文字摘要"
            onPress={handleTextSummaryMode}
            style={styles.secondaryButton}
            textStyle={styles.secondaryButtonText}
          />
        </View>
      </View>

      <View style={styles.actionButtons}>
        <Button
          title="取消"
          onPress={onCancel}
          style={styles.cancelButton}
          textStyle={styles.cancelButtonText}
        />
      </View>
    </View>
  );

  // 渲染語音摘要模式
  const renderVoiceSummaryMode = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>語音摘要錄製</Text>
        <Text style={styles.subtitle}>
          請口述會議的主要內容、重點討論和決議事項
        </Text>
      </View>

      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>錄製建議：</Text>
        <Text style={styles.instructionItem}>• 清楚描述會議目的和主要參與者</Text>
        <Text style={styles.instructionItem}>• 提及重要的討論要點和決議</Text>
        <Text style={styles.instructionItem}>• 包含後續行動項目和負責人</Text>
        <Text style={styles.instructionItem}>• 提及相關的客戶資訊和聯絡方式</Text>
      </View>

      <AudioRecorder
        onRecordingComplete={handleVoiceSummaryComplete}
        maxDuration={1800} // 最長 30 分鐘
        showWaveform={true}
      />

      <View style={styles.actionButtons}>
        <Button
          title="返回選擇"
          onPress={() => setCurrentMode('selection')}
          style={styles.cancelButton}
          textStyle={styles.cancelButtonText}
        />
      </View>
    </View>
  );

  // 渲染文字摘要模式
  const renderTextSummaryMode = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>文字摘要輸入</Text>
        <Text style={styles.subtitle}>
          請輸入會議的詳細摘要內容
        </Text>
      </View>

      <View style={styles.textInputContainer}>
        <Text style={styles.inputLabel}>會議摘要內容</Text>
        <TextInput
          value={textSummary}
          onChangeText={setTextSummary}
          placeholder="請輸入會議的主要內容、討論要點、決議事項、後續行動等..."
          style={styles.textSummaryInput}
          multiline
          numberOfLines={15}
        />
        
        <Text style={styles.characterCount}>
          {textSummary.length} 字符 {textSummary.length < 100 && '(建議至少輸入 100 字符)'}
        </Text>
      </View>

      <View style={styles.templateContainer}>
        <Text style={styles.templateTitle}>參考範本：</Text>
        <ScrollView style={styles.templateScroll}>
          <Text style={styles.templateText}>
            會議目的：[會議主要目的]{'\n'}
            參與人員：[主要參與者]{'\n'}
            討論要點：{'\n'}
            1. [要點一]{'\n'}
            2. [要點二]{'\n'}
            決議事項：{'\n'}
            - [決議一]{'\n'}
            - [決議二]{'\n'}
            後續行動：{'\n'}
            - [行動項目] - 負責人：[姓名] - 完成時間：[日期]{'\n'}
            客戶資訊：{'\n'}
            - 客戶名稱：[名稱]{'\n'}
            - 聯絡資訊：[電話/電子郵件]{'\n'}
            其他備註：[其他重要資訊]
          </Text>
        </ScrollView>
      </View>

      <View style={styles.actionButtons}>
        <Button
          title="返回選擇"
          onPress={() => setCurrentMode('selection')}
          style={styles.cancelButton}
          textStyle={styles.cancelButtonText}
        />
        <Button
          title="提交處理"
          onPress={handleTextSummarySubmit}
          style={[
            styles.submitButton,
            textSummary.length < 50 && styles.disabledButton
          ]}
          textStyle={styles.submitButtonText}
          disabled={textSummary.length < 50}
        />
      </View>
    </View>
  );

  // 渲染處理中狀態
  const renderProcessingMode = () => (
    <View style={styles.container}>
      <View style={styles.processingContainer}>
        <LoadingSpinner size="large" />
        <Text style={styles.processingTitle}>正在處理補救記錄</Text>
        <Text style={styles.processingSubtitle}>
          正在上傳內容並開始 AI 分析...
        </Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
      {currentMode === 'selection' && renderModeSelection()}
      {currentMode === 'voice_summary' && renderVoiceSummaryMode()}
      {currentMode === 'text_summary' && renderTextSummaryMode()}
      {currentMode === 'processing' && renderProcessingMode()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    padding: 16,
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  dateInfo: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  optionsContainer: {
    marginBottom: 32,
  },
  optionCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  optionFeatures: {
    marginBottom: 16,
  },
  featureItem: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 4,
  },
  instructionsContainer: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  instructionItem: {
    fontSize: 14,
    color: '#1e40af',
    marginBottom: 4,
  },
  textInputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textSummaryInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    textAlignVertical: 'top',
    minHeight: 200,
    marginBottom: 8,
  },
  characterCount: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
  },
  templateContainer: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  templateTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  templateScroll: {
    maxHeight: 120,
  },
  templateText: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },
  processingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  processingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  processingSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#22c55e',
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    flex: 1,
  },
  submitButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#d1d5db',
  },
  cancelButton: {
    backgroundColor: '#e5e7eb',
    flex: 1,
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '600',
  },
});