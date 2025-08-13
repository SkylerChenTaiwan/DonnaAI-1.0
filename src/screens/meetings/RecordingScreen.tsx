/**
 * 錄音控制畫面
 * 整合錄音、編輯、處理流程
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView , Platform } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Layout } from '@/components/common/Layout';
import {
  AdaptiveButton
} from '@/components/adaptive';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { AudioRecorder } from '@/components/audio/AudioRecorder';
import { AudioEditor } from '@/components/audio/AudioEditor';
import { useRecordStore } from '@/stores/recordStore';
import { useAuthStore } from '@/stores/authStore';
import { RecordDoc } from '@/types/record';
import { notificationService } from '@/services/notifications';

type RootStackParamList = {
  Recording: {
    recordId?: string;
    meetingTitle?: string;
    isNewRecording?: boolean;
  };
  AIConfirmation: {
    recordId: string;
  };
};

type RecordingScreenRouteProp = RouteProp<RootStackParamList, 'Recording'>;
type RecordingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Recording'>;

interface RecordingSession {
  audioUri?: string;
  duration?: number;
  isEdited: boolean;
  editedDuration?: number;
}

type RecordingStep = 'recording' | 'processing_choice' | 'editing' | 'uploading' | 'ai_processing';

export const RecordingScreen: React.FC = () => {
  const navigation = useNavigation<RecordingScreenNavigationProp>();
  const route = useRoute<RecordingScreenRouteProp>();
  const { user } = useAuthStore();
  const { createRecord, updateRecord, processRecordFields } = useRecordStore();

  const { recordId, meetingTitle = '新會議記錄', isNewRecording = true } = route.params || {};

  const [currentStep, setCurrentStep] = useState<RecordingStep>('recording');
  const [recordingSession, setRecordingSession] = useState<RecordingSession>({
    isEdited: false
  });
  const [currentRecord, setCurrentRecord] = useState<RecordDoc | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    // 初始化錄音畫面
    if (!isNewRecording && recordId) {
      // 載入現有記錄
      loadExistingRecord();
    }
  }, [recordId, isNewRecording]);

  // 載入現有記錄
  const loadExistingRecord = async () => {
    if (!recordId || !user) return;

    try {
      setIsLoading(true);
      // 這裡應該從 recordStore 載入記錄
      // const record = await getRecord(recordId, user.uid);
      // setCurrentRecord(record);
    } catch (error) {
      console.error('載入記錄失敗:', error);
      Alert.alert('錯誤', '無法載入會議記錄');
    } finally {
      setIsLoading(false);
    }
  };

  // 錄音完成處理
  const handleRecordingComplete = async (audioUri: string, duration: number) => {
    console.log('錄音完成:', { audioUri, duration });
    
    setRecordingSession({
      audioUri,
      duration,
      isEdited: false
    });
    
    setCurrentStep('processing_choice');
    
    // 發送錄音完成通知
    await notificationService.sendLocalNotification({
      type: 'recording_reminder',
      title: '錄音完成',
      body: `會議「${meetingTitle}」錄音已完成，請選擇處理方式。` });
  };

  // 選擇立即處理
  const handleImmediateProcessing = async () => {
    if (!recordingSession.audioUri || !user) return;

    try {
      setCurrentStep('uploading');
      setIsLoading(true);
      
      // 建立新記錄
      const newRecord = await createRecord({
        type: 'meeting',
        title: meetingTitle,
        customerIds: [],
        participantIds: [user.uid],
        content: '',
        status: 'processing',
        processingPreference: 'immediate',
        recordingType: 'live',
        teamId: user.teamId || '',
        organizationId: user.organizationId || '',
        audioRecordingState: {
          status: 'processing',
          duration: recordingSession.duration,
          format: 'mp3'
        }
      }, user.uid, new File([recordingSession.audioUri], 'recording.mp3'));

      setCurrentRecord(newRecord);
      setCurrentStep('ai_processing');
      
      // 開始 AI 處理
      await processRecordFields(newRecord.id!, true);
      
      // 發送處理完成通知
      await notificationService.sendAIProcessingComplete(newRecord.id!, meetingTitle);
      
      // 導航到確認畫面
      navigation.navigate('AIConfirmation', { recordId: newRecord.id! });
      
    } catch (error) {
      console.error('立即處理失敗:', error);
      Alert.alert('處理失敗', '無法開始 AI 處理，請稍後重試');
      setCurrentStep('processing_choice');
    } finally {
      setIsLoading(false);
    }
  };

  // 選擇先編輯
  const handleEditFirst = () => {
    setCurrentStep('editing');
  };

  // 編輯完成處理
  const handleEditSave = (editedUri: string, editedDuration: number) => {
    setRecordingSession(prev => ({
      ...prev,
      audioUri: editedUri,
      duration: editedDuration,
      isEdited: true,
      editedDuration
    }));
    
    setCurrentStep('processing_choice');
  };

  // 取消編輯
  const handleEditCancel = () => {
    setCurrentStep('processing_choice');
  };

  // 重新錄音
  const handleReRecord = () => {
    setRecordingSession({ isEdited: false });
    setCurrentStep('recording');
  };

  // 取消錄音並返回
  const handleCancel = () => {
    Alert.alert(
      '確認取消',
      '確定要取消錄音並返回嗎？未儲存的錄音將會遺失。',
      [
        { text: '繼續錄音', style: 'cancel' },
        {
          text: '確定取消',
          style: 'destructive',
          onPress: () => navigation.goBack()
        }
      ]
    );
  };

  // 渲染錄音步驟
  const renderRecordingStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>會議錄音</Text>
      <Text style={styles.stepSubtitle}>{meetingTitle}</Text>
      
      <AudioRecorder
        onRecordingComplete={handleRecordingComplete}
        maxDuration={7200} // 最長 2 小時
        showWaveform={true}
      />
      
      <View style={styles.actionButtons}>
        <AdaptiveButton
          title="取消"
          onPress={handleCancel}
          style={styles.cancelButton}
          textStyle={styles.cancelButtonText}
        />
      </View>
    </View>
  );

  // 渲染處理選擇步驟
  const renderProcessingChoiceStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>錄音完成</Text>
      <Text style={styles.stepSubtitle}>
        錄音時長: {Math.floor((recordingSession.duration || 0) / 60)} 分 {Math.floor((recordingSession.duration || 0) % 60)} 秒
      </Text>
      
      <View style={styles.choiceContainer}>
        <View style={styles.choiceCard}>
          <Text style={styles.choiceTitle}>立即處理</Text>
          <Text style={styles.choiceDescription}>
            直接上傳並開始 AI 分析，快速獲得會議摘要和任務建議
          </Text>
          <AdaptiveButton
            title="開始 AI 處理"
            onPress={handleImmediateProcessing}
            style={styles.primaryButton}
            textStyle={styles.primaryButtonText}
          />
        </View>
        
        <View style={styles.choiceCard}>
          <Text style={styles.choiceTitle}>先編輯再處理</Text>
          <Text style={styles.choiceDescription}>
            先編輯音訊（移除不需要的部分），再進行 AI 分析
          </Text>
          <AdaptiveButton
            title="編輯音訊"
            onPress={handleEditFirst}
            style={styles.secondaryButton}
            textStyle={styles.secondaryButtonText}
          />
        </View>
      </View>
      
      <View style={styles.actionButtons}>
        <AdaptiveButton
          title="重新錄音"
          onPress={handleReRecord}
          style={styles.tertiaryButton}
          textStyle={styles.tertiaryButtonText}
        />
        <AdaptiveButton
          title="取消"
          onPress={handleCancel}
          style={styles.cancelButton}
          textStyle={styles.cancelButtonText}
        />
      </View>
    </View>
  );

  // 渲染編輯步驟
  const renderEditingStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>音訊編輯</Text>
      <Text style={styles.stepSubtitle}>移除不需要的部分，提高 AI 分析準確度</Text>
      
      {recordingSession.audioUri && (
        <AudioEditor
          audioUri={recordingSession.audioUri}
          originalDuration={recordingSession.duration || 0}
          onSaveEdit={handleEditSave}
          onCancel={handleEditCancel}
        />
      )}
    </View>
  );

  // 渲染上傳步驟
  const renderUploadingStep = () => (
    <View style={styles.stepContainer}>
      <LoadingSpinner size="large" />
      <Text style={styles.stepTitle}>上傳錄音檔案</Text>
      <Text style={styles.stepSubtitle}>正在上傳到雲端並準備 AI 分析...</Text>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={StyleSheet.flatten([
              styles.progressFill, 
              { width: `${uploadProgress}%` }
            ])} 
          />
        </View>
        <Text style={styles.progressText}>{uploadProgress}%</Text>
      </View>
    </View>
  );

  // 渲染 AI 處理步驟
  const renderAIProcessingStep = () => (
    <View style={styles.stepContainer}>
      <LoadingSpinner size="large" />
      <Text style={styles.stepTitle}>AI 智能分析中</Text>
      <Text style={styles.stepSubtitle}>正在轉錄音訊並分析會議內容...</Text>
      
      <View style={styles.processingSteps}>
        <Text style={styles.processingStep}>✓ 音訊上傳完成</Text>
        <Text style={styles.processingStep}>⏳ 語音轉文字中...</Text>
        <Text style={styles.processingStep}>⏳ AI 內容分析中...</Text>
        <Text style={styles.processingStep}>⏳ 提取客戶資訊和任務...</Text>
      </View>
    </View>
  );

  if (isLoading && currentStep !== 'uploading' && currentStep !== 'ai_processing') {
    return (
      <Layout>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" />
          <Text style={styles.loadingText}>載入中...</Text>
        </View>
      </Layout>
    );
  }

  return (
    <Layout>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {currentStep === 'recording' && renderRecordingStep()}
        {currentStep === 'processing_choice' && renderProcessingChoiceStep()}
        {currentStep === 'editing' && renderEditingStep()}
        {currentStep === 'uploading' && renderUploadingStep()}
        {currentStep === 'ai_processing' && renderAIProcessingStep()}
      </ScrollView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb' },
  contentContainer: {
    padding: 16 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center' },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280' },
  stepContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000000',
    ...(Platform.OS === 'web' ? {} : { ...(Platform.OS === 'web' ? {} : { shadowOffset: { width: 0, height: 2 } }) }),
    shadowOpacity: 0.1,
    shadowRadius: 12,
    ...(Platform.OS === 'web' ? {} : { elevation: 4 }) },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8 },
  stepSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32 },
  choiceContainer: {
    marginBottom: 32 },
  choiceCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb' },
  choiceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8 },
  choiceDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 20 },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12 },
  primaryButton: {
    backgroundColor: '#3b82f6' },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '600' },
  secondaryButton: {
    backgroundColor: '#22c55e' },
  secondaryButtonText: {
    color: '#ffffff',
    fontWeight: '600' },
  tertiaryButton: {
    backgroundColor: '#f59e0b',
    flex: 1 },
  tertiaryButtonText: {
    color: '#ffffff',
    fontWeight: '600' },
  cancelButton: {
    backgroundColor: '#e5e7eb',
    flex: 1 },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '600' },
  progressContainer: {
    marginTop: 24,
    alignItems: 'center' },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8 },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4 },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600' },
  processingSteps: {
    marginTop: 24,
    alignItems: 'center' },
  processingStep: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
    textAlign: 'center' } });