/**
 * 簡化版語音任務輸入組件
 * 全螢幕錄音介面，自動語音轉任務
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
  Platform
} from 'react-native';
import { Icon } from '@/components/common/Icon';
import { Audio } from 'expo-av';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/common/Button';
import { recordingManager } from '@/services/audio/recordingManager';
import { 
  convertVoiceToTask,
  validateExtractionQuality,
  VoiceToTaskResult,
  VoiceToTaskOptions,
  TaskExtractionProgress,
} from '@/services/ai/voice-to-task';
import { createTask } from '@/services/firebase/tasks';
import { TaskCreateRequest } from '@/types/task';
import { showToast } from '@/utils/toast';

export interface SimplifiedVoiceTaskInputProps {
  onTaskCreated: () => void;
  userId: string;
  organizationId: string;
  teamId: string;
}

type RecordingStatus = 'idle' | 'recording' | 'processing' | 'review' | 'error';

const { height: screenHeight } = Dimensions.get('window');

export const SimplifiedVoiceTaskInput: React.FC<SimplifiedVoiceTaskInputProps> = ({
  onTaskCreated,
  userId,
  organizationId,
  teamId,
}) => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>('idle');
  const [duration, setDuration] = useState(0);
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const [processingProgress, setProcessingProgress] = useState<TaskExtractionProgress | null>(null);
  const [extractionResult, setExtractionResult] = useState<VoiceToTaskResult | null>(null);
  
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // 初始化音訊模式
  const initializeAudio = useCallback(async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        interruptionModeIOS: 1,
        interruptionModeAndroid: 1,
      });
    } catch (error) {
      console.error('音訊模式初始化失敗:', error);
      throw error;
    }
  }, []);

  // 檢查並請求權限
  const checkPermissions = useCallback(async () => {
    if (permissionResponse?.status !== 'granted') {
      console.log('請求錄音權限...');
      const newPermission = await requestPermission();
      if (newPermission.status !== 'granted') {
        throw new Error('錄音權限被拒絕');
      }
    }
  }, [permissionResponse, requestPermission]);

  // 格式化時間顯示
  const formatDuration = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // 開始脈動動畫
  const startPulseAnimation = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  // 停止脈動動畫
  const stopPulseAnimation = useCallback(() => {
    pulseAnim.stopAnimation();
    Animated.timing(pulseAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [pulseAnim]);

  // 淡入動畫
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // 開始錄音
  const startRecording = useCallback(async () => {
    try {
      if (recording) return;

      await checkPermissions();
      await initializeAudio();

      // 停止任何現有的錄音
      await recordingManager.stopCurrentRecording();

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setRecordingStatus('recording');
      setDuration(0);
      startPulseAnimation();

      // 開始計時
      durationTimerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('開始錄音失敗:', error);
      Alert.alert('錄音失敗', '無法開始錄音，請檢查權限設定');
      setRecordingStatus('error');
    }
  }, [recording, checkPermissions, initializeAudio, startPulseAnimation]);

  // 停止錄音並處理
  const stopRecording = useCallback(async () => {
    try {
      if (!recording) return;

      // 清除計時器
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }

      stopPulseAnimation();
      setRecordingStatus('processing');

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (!uri) {
        throw new Error('無法獲取錄音檔案');
      }

      setRecording(null);

      // 語音轉任務處理
      const options: VoiceToTaskOptions = {
        extractDeadline: true,
        extractPriority: true,
        extractAssignee: true,
        autoDetectTaskType: true,
      };

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
        setRecordingStatus('review');
      } else {
        setRecordingStatus('error');
        Alert.alert('轉換失敗', result.error || '語音轉任務處理失敗');
      }

    } catch (error) {
      console.error('停止錄音失敗:', error);
      setRecordingStatus('error');
      Alert.alert('錯誤', '處理錄音時發生錯誤');
    }
  }, [recording, stopPulseAnimation]);

  // 確認建立任務
  const confirmCreateTask = useCallback(async () => {
    if (!extractionResult?.success || !extractionResult.taskFormData) {
      return;
    }

    try {
      const data = extractionResult.taskFormData;
      
      // 轉換中文優先級到英文
      const priorityMap: Record<string, 'low' | 'medium' | 'high'> = {
        '低': 'low',
        '中': 'medium',
        '高': 'high',
      };

      // 基礎任務資料
      const taskData: TaskCreateRequest = {
        title: data.title,
        description: data.description || '',
        type: 'unscheduled', // 修正為正確的任務類型
        priority: priorityMap[data.priority] || 'medium',
        assigneeId: data.assignedTo || userId,
        source: 'voice',
        teamId: teamId,
        organizationId: organizationId,
        customerIds: data.customerId ? [data.customerId] : [],
        tags: data.tags || [],
      };
      
      // 只有在有值時才添加 optional 欄位
      if (data.dueDate) {
        taskData.dueDate = data.dueDate;
      }

      await createTask(taskData, userId);
      
      showToast('success', '任務建立成功');
      onTaskCreated();
      
      // 重置狀態
      resetRecording();
      
    } catch (error) {
      console.error('建立任務失敗:', error);
      showToast('error', '建立任務失敗');
    }
  }, [extractionResult, userId, teamId, organizationId, onTaskCreated]);

  // 重新錄音
  const resetRecording = useCallback(() => {
    setRecordingStatus('idle');
    setDuration(0);
    setExtractionResult(null);
    setProcessingProgress(null);
  }, []);

  // 清理
  useEffect(() => {
    return () => {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
      if (recording) {
        recording.stopAndUnloadAsync().catch(console.error);
      }
    };
  }, [recording]);

  // 渲染錄音介面
  const renderRecording = () => (
    <Animated.View style={[styles.recordingContainer, { opacity: fadeAnim }]}>
      <View style={styles.topSection}>
        <Icon name="mic" size={48} color="#FF6B6B" />
        <Text style={styles.title}>語音建立任務</Text>
        <Text style={styles.description}>
          說出您的任務內容，AI 將自動識別並建立任務
        </Text>
      </View>

      <View style={styles.centerSection}>
        <Text style={styles.duration}>{formatDuration(duration)}</Text>
        
        <TouchableOpacity
          style={styles.recordButtonContainer}
          onPress={recordingStatus === 'idle' ? startRecording : stopRecording}
          activeOpacity={0.8}
        >
          <Animated.View 
            style={[
              styles.recordButton,
              recordingStatus === 'recording' && {
                transform: Platform.OS === 'web' ? `scale(${pulseAnim})` : [{ scale: pulseAnim }],
              },
            ]}
          >
            <View style={recordingStatus === 'recording' ? styles.stopIcon : styles.micIcon}>
              {recordingStatus === 'recording' ? (
                <View style={styles.stopSquare} />
              ) : (
                <Icon name="mic" size={60} color="#FFFFFF" />
              )}
            </View>
          </Animated.View>
        </TouchableOpacity>

        <Text style={styles.hint}>
          {recordingStatus === 'idle' ? '點擊開始錄音' : '點擊結束錄音'}
        </Text>
      </View>

      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>💡 說話技巧</Text>
        <Text style={styles.tipText}>• 清楚說明任務內容</Text>
        <Text style={styles.tipText}>• 提及截止時間（如：明天前、週五）</Text>
        <Text style={styles.tipText}>• 說明優先級（如：很重要、不急）</Text>
      </View>
    </Animated.View>
  );

  // 渲染處理中
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
        </View>
      )}
    </View>
  );

  // 渲染檢視結果
  const renderReview = () => {
    if (!extractionResult?.extractedTask) return null;

    const task = extractionResult.extractedTask;
    
    return (
      <View style={styles.reviewContainer}>
        <Text style={styles.reviewTitle}>識別結果</Text>
        
        <View style={styles.taskPreview}>
          <View style={styles.taskField}>
            <Text style={styles.fieldLabel}>任務標題</Text>
            <Text style={styles.fieldValue}>{task.title}</Text>
          </View>
          
          {task.description && (
            <View style={styles.taskField}>
              <Text style={styles.fieldLabel}>任務描述</Text>
              <Text style={styles.fieldValue}>{task.description}</Text>
            </View>
          )}
          
          <View style={styles.taskMetadata}>
            {task.priority && (
              <View style={styles.metaItem}>
                <Icon name="flag" size={16} color="#FF6B6B" />
                <Text style={styles.metaText}>
                  {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}優先級
                </Text>
              </View>
            )}
            
            {task.dueDate && (
              <View style={styles.metaItem}>
                <Icon name="calendar" size={16} color="#FF6B6B" />
                <Text style={styles.metaText}>
                  {new Date(task.dueDate).toLocaleDateString('zh-TW')}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.reviewActions}>
          <Button
            title="重新錄音"
            variant="secondary"
            onPress={resetRecording}
            style={styles.reviewButton}
          />
          <Button
            title="確認建立"
            onPress={confirmCreateTask}
            style={styles.reviewButton}
          />
        </View>
      </View>
    );
  };

  // 渲染錯誤
  const renderError = () => (
    <View style={styles.errorContainer}>
      <Icon name="alert-circle" size={64} color="#FF6B6B" />
      <Text style={styles.errorTitle}>處理失敗</Text>
      <Text style={styles.errorMessage}>
        {extractionResult?.error || '語音轉任務處理失敗'}
      </Text>
      <Button
        title="重新錄音"
        onPress={resetRecording}
        style={styles.retryButton}
      />
    </View>
  );

  // 根據狀態渲染不同介面
  switch (recordingStatus) {
    case 'idle':
    case 'recording':
      return renderRecording();
    case 'processing':
      return renderProcessing();
    case 'review':
      return renderReview();
    case 'error':
      return renderError();
    default:
      return renderRecording();
  }
};

const styles = StyleSheet.create({
  recordingContainer: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#7A7A7A',
    textAlign: 'center',
    lineHeight: 22,
  },
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  duration: {
    fontSize: 48,
    fontWeight: '200',
    color: '#1A1A1A',
    marginBottom: 40,
  },
  recordButtonContainer: {
    marginBottom: 24,
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  micIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopSquare: {
    width: 40,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  hint: {
    fontSize: 16,
    color: '#7A7A7A',
  },
  tipsSection: {
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#7A7A7A',
    lineHeight: 20,
    marginBottom: 4,
  },
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
    marginTop: 24,
  },
  progressMessage: {
    fontSize: 16,
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E3E1DC',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B6B',
    borderRadius: 2,
  },
  reviewContainer: {
    flex: 1,
    padding: 20,
  },
  reviewTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 24,
    textAlign: 'center',
  },
  taskPreview: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E3E1DC',
  },
  taskField: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7A7A7A',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
    color: '#1A1A1A',
    lineHeight: 22,
  },
  taskMetadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    color: '#7A7A7A',
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 12,
  },
  reviewButton: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FF6B6B',
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
});