/**
 * 簡化版音頻輸入組件
 * 提供簡潔的錄音介面，直接顯示錄音按鈕
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Animated } from 'react-native';
import { Icon } from '@/components/common/Icon';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { recordingManager } from '@/services/audio/recordingManager';

export interface SimplifiedAudioInputProps {
  onComplete: (audioUri: string, duration: number) => void;
  disabled?: boolean;
}

type RecordingStatus = 'idle' | 'recording' | 'paused' | 'loading';

export const SimplifiedAudioInput: React.FC<SimplifiedAudioInputProps> = ({
  onComplete,
  disabled = false }) => {
  // 組件實例ID，用於調試
  const instanceId = useRef(Math.random().toString(36).substr(2, 9)).current;
  
  useEffect(() => {
    console.log(`SimplifiedAudioInput mounted: ${instanceId}`);
    
    // 組件掛載時不要自動停止錄音，以免影響正在進行的錄音
    // recordingManager.stopCurrentRecording().catch(error => {
    //   console.warn('初始化時清理錄音失敗:', error);
    // });
    
    return () => {
      console.log(`SimplifiedAudioInput unmounted: ${instanceId}`);
    };
  }, [instanceId]);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>('idle');
  const [duration, setDuration] = useState(0);
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveformAnim = useRef(new Animated.Value(0)).current;
  const isProcessingRef = useRef(false);

  // 初始化音訊模式
  const initializeAudio = useCallback(async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        interruptionModeIOS: 1, // DoNotMix
        interruptionModeAndroid: 1, // DoNotMix
      });
    } catch (error) {
      console.error('音訊模式初始化失敗:', error);
      throw error;
    }
  }, []);

  // 檢查並請求權限
  const checkPermissions = useCallback(async () => {
    if (permissionResponse?.status !== 'granted') {
      // eslint-disable-next-line no-console
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
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  // 停止脈動動畫
  const stopPulseAnimation = useCallback(() => {
    pulseAnim.stopAnimation();
    Animated.timing(pulseAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true }).start();
  }, [pulseAnim]);

  // 開始波形動畫
  const startWaveformAnimation = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveformAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true }),
        Animated.timing(waveformAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true }),
      ])
    ).start();
  }, [waveformAnim]);

  // 停止波形動畫
  const stopWaveformAnimation = useCallback(() => {
    waveformAnim.stopAnimation();
    Animated.timing(waveformAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true }).start();
  }, [waveformAnim]);

  // 開始錄音
  const startRecording = useCallback(async () => {
    try {
      setRecordingStatus('loading');
      
      await checkPermissions();
      await initializeAudio();

      // eslint-disable-next-line no-console
      console.log(`開始錄音... (instance: ${instanceId})`);
      
      // 使用全局錄音管理器
      const newRecording = await recordingManager.startNewRecording();

      setRecording(newRecording);
      setRecordingStatus('recording');
      setDuration(0);
      
      // 開始計時器
      console.log('開始計時器...');
      durationTimerRef.current = setInterval(() => {
        setDuration(prev => {
          console.log('計時器更新:', prev + 1);
          return prev + 1;
        });
      }, 1000);

      // 開始動畫
      console.log('開始動畫...');
      startPulseAnimation();
      startWaveformAnimation();
      
      // 檢查錄音狀態
      const status = await newRecording.getStatusAsync();
      console.log('錄音狀態:', status);
    } catch (error) {
      console.error('開始錄音失敗:', error);
      setRecordingStatus('idle');
      Alert.alert('錄音失敗', error instanceof Error ? error.message : '無法開始錄音');
    }
  }, [instanceId, checkPermissions, initializeAudio, startPulseAnimation, startWaveformAnimation]);

  // 暫停錄音
  const pauseRecording = useCallback(async () => {
    console.log('嘗試暫停錄音...', { 
      recording: !!recording, 
      status: recordingStatus,
      globalRecording: !!recordingManager.getCurrentRecording() 
    });
    
    // 優先使用組件狀態中的錄音對象
    const recordingToPause = recording || recordingManager.getCurrentRecording();
    if (!recordingToPause || recordingStatus !== 'recording') {
      console.warn('無法暫停：沒有活躍的錄音');
      return;
    }

    try {
      const status = await recordingToPause.getStatusAsync();
      console.log('暫停前錄音狀態:', status);
      
      if (status.isRecording) {
        await recordingToPause.pauseAsync();
        setRecordingStatus('paused');
        
        // 停止計時器
        if (durationTimerRef.current) {
          clearInterval(durationTimerRef.current);
          durationTimerRef.current = null;
        }

        // 停止動畫
        stopPulseAnimation();
        stopWaveformAnimation();
        
        console.log('錄音已暫停');
      } else {
        console.warn('錄音不在錄製狀態，無法暫停');
      }
    } catch (error) {
      console.error('暫停錄音失敗:', error);
      Alert.alert('暫停失敗', '無法暫停錄音');
    }
  }, [recording, recordingStatus, stopPulseAnimation, stopWaveformAnimation]);

  // 恢復錄音
  const resumeRecording = useCallback(async () => {
    const recordingToResume = recording || recordingManager.getCurrentRecording();
    if (!recordingToResume || recordingStatus !== 'paused') return;

    try {
      await recordingToResume.startAsync();
      setRecordingStatus('recording');
      
      // 重新開始計時器
      durationTimerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      // 重新開始動畫
      startPulseAnimation();
      startWaveformAnimation();
    } catch (error) {
      console.error('恢復錄音失敗:', error);
      Alert.alert('恢復失敗', '無法恢復錄音');
    }
  }, [recording, recordingStatus, startPulseAnimation, startWaveformAnimation]);

  // 停止錄音
  const stopRecording = useCallback(async () => {
    const currentRecording = recordingManager.getCurrentRecording();
    if (!currentRecording && !recording) return;

    const recordingToStop = currentRecording || recording;
    setRecording(null); // 立即清空，防止重複調用

    try {
      setRecordingStatus('loading');
      
      // 清除計時器
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }

      // 停止動畫
      stopPulseAnimation();
      stopWaveformAnimation();

      await recordingToStop.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const uri = recordingToStop.getURI();
      if (uri) {
        // eslint-disable-next-line no-console
        console.log('錄音完成，檔案位置:', uri);
        
        // 獲取檔案資訊
        const fileInfo = await FileSystem.getInfoAsync(uri);
        // eslint-disable-next-line no-console
        console.log('錄音檔案大小:', fileInfo.exists ? (fileInfo as any).size : 'unknown', 'bytes');
        
        setRecordingStatus('idle');
        onComplete(uri, duration);
      } else {
        throw new Error('無法獲取錄音檔案路徑');
      }
      
      setDuration(0);
      
      // 更新全局管理器
      recordingManager.setCurrentRecording(null);
    } catch (error) {
      // 忽略 "already unloaded" 錯誤
      if (!error.message?.includes('already been unloaded')) {
        console.error('停止錄音失敗:', error);
        Alert.alert('停止錄音失敗', error instanceof Error ? error.message : '無法停止錄音');
      }
      setRecordingStatus('idle');
    }
  }, [recording, duration, onComplete, stopPulseAnimation, stopWaveformAnimation]);

  // 處理錄音按鈕點擊
  const handleRecordPress = useCallback(() => {
    if (disabled || isProcessingRef.current) return;
    
    // 防止重複點擊
    isProcessingRef.current = true;
    
    const resetProcessing = () => {
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 500);
    };

    if (recordingStatus === 'idle') {
      startRecording().finally(resetProcessing);
    } else if (recordingStatus === 'recording') {
      pauseRecording();
      resetProcessing();
    } else if (recordingStatus === 'paused') {
      resumeRecording();
      resetProcessing();
    } else {
      resetProcessing();
    }
  }, [disabled, recordingStatus, startRecording, pauseRecording, resumeRecording]);

  // 清理定時器和錄音資源 - 只在組件卸載時執行
  useEffect(() => {
    return () => {
      console.log(`SimplifiedAudioInput 真正卸載: ${instanceId}`);
      
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
      
      // 停止動畫
      if (pulseAnim) {
        pulseAnim.stopAnimation();
      }
      if (waveformAnim) {
        waveformAnim.stopAnimation();
      }
      
      // 如果組件卸載時還在錄音，停止它
      if (recordingManager.getIsRecording()) {
        recordingManager.stopCurrentRecording().catch(error => {
          console.error('組件卸載時清理錄音失敗:', error);
        });
      }
    };
  }, []); // 空依賴數組，只在組件真正卸載時執行
  
  // 單獨的 effect 處理錄音狀態
  useEffect(() => {
    if (recordingStatus === 'idle' && recording) {
      setRecording(null);
    }
  }, [recordingStatus, recording]);

  // 渲染波形
  const renderWaveform = () => {
    const waveOpacity = waveformAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1] });

    return (
      <View style={styles.waveformContainer}>
        <Animated.View style={StyleSheet.flatten([styles.waveformBar, { opacity: waveOpacity, height: 30 }])} />
        <Animated.View style={StyleSheet.flatten([styles.waveformBar, { opacity: waveOpacity, height: 50 }])} />
        <Animated.View style={StyleSheet.flatten([styles.waveformBar, { opacity: waveOpacity, height: 40 }])} />
        <Animated.View style={StyleSheet.flatten([styles.waveformBar, { opacity: waveOpacity, height: 60 }])} />
        <Animated.View style={StyleSheet.flatten([styles.waveformBar, { opacity: waveOpacity, height: 45 }])} />
        <Animated.View style={StyleSheet.flatten([styles.waveformBar, { opacity: waveOpacity, height: 55 }])} />
        <Animated.View style={StyleSheet.flatten([styles.waveformBar, { opacity: waveOpacity, height: 35 }])} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 波形顯示區域 */}
      <View style={styles.visualizationArea}>
        {(recordingStatus === 'recording' || recordingStatus === 'paused') && renderWaveform()}
      </View>

      {/* 計時器 */}
      <Text style={styles.timer}>{formatDuration(duration)}</Text>

      {/* 控制按鈕區域 */}
      <View style={styles.controlsContainer}>
        {/* 左側按鈕空間 */}
        <View style={styles.sideButtonContainer}>
          {recordingStatus === 'recording' && (
            <TouchableOpacity
              style={styles.sideButton}
              onPress={pauseRecording}
              activeOpacity={0.7}
            >
              <Icon name="pause" size={32} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>

        {/* 中央錄音按鈕 */}
        <TouchableOpacity
          style={styles.recordButtonWrapper}
          onPress={handleRecordPress}
          disabled={disabled || recordingStatus === 'loading'}
          activeOpacity={0.8}
        >
          <Animated.View
            style={[
              styles.recordButton,
              recordingStatus === 'recording' && styles.recordingButton,
              recordingStatus === 'paused' && styles.pausedButton,
              {
                transform: Platform.OS === 'web' ? `scale(${pulseAnim})` : [{ scale: pulseAnim }] },
            ]}
          >
            {recordingStatus === 'loading' ? (
              <LoadingSpinner size="large" color="#FFFFFF" />
            ) : (
              <Icon
                name={
                  recordingStatus === 'recording' ? 'mic' : 
                  recordingStatus === 'paused' ? 'play' : 
                  'mic'
                }
                size={40}
                color="#FFFFFF"
              />
            )}
          </Animated.View>
        </TouchableOpacity>

        {/* 右側按鈕空間 */}
        <View style={styles.sideButtonContainer}>
          {(recordingStatus === 'recording' || recordingStatus === 'paused') && (
            <TouchableOpacity
              style={styles.sideButton}
              onPress={stopRecording}
              activeOpacity={0.7}
            >
              <Icon name="stop" size={32} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 提示文字 */}
      <Text style={styles.hint}>
        {recordingStatus === 'loading'
          ? '處理中...'
          : recordingStatus === 'recording'
          ? '錄音中'
          : recordingStatus === 'paused'
          ? '已暫停'
          : '點擊開始錄音'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40 },
  visualizationArea: {
    height: 100,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40 },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6 },
  waveformBar: {
    width: 4,
    backgroundColor: '#C7C7CC',
    borderRadius: 2 },
  timer: {
    fontSize: 48,
    fontWeight: '300',
    color: '#1A1A1A',
    marginBottom: 60,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif-light' },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 40 },
  recordButtonWrapper: {
    position: 'relative' },
  sideButtonContainer: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center' },
  sideButton: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center' },
  recordButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#B91C1C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#B91C1C',
    ...(Platform.OS === 'web' ? {} : { ...(Platform.OS === 'web' ? {} : { shadowOffset: { width: 0, height: 4 } }) }),
    shadowOpacity: 0.3,
    shadowRadius: 8,
    ...(Platform.OS === 'web' ? {} : { elevation: 8 }) },
  recordingButton: {
    backgroundColor: '#991B1B' },
  pausedButton: {
    backgroundColor: '#F59E0B' },
  hint: {
    fontSize: 16,
    color: '#7A7A7A',
    textAlign: 'center' } });