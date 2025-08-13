/**
 * 音訊錄製組件
 * 支援實時錄音、暫停、恢復、停止功能
 * 提供錄音狀態視覺化和波形顯示
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, Platform } from 'react-native';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { OfflineRecordingService, NetworkMonitor } from '@/services/offline-recording';

export interface AudioRecorderProps {
  onRecordingComplete: (audioUri: string, duration: number) => void;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  onRecordingPause?: () => void;
  onRecordingResume?: () => void;
  maxDuration?: number; // 最大錄製時間（秒）
  showWaveform?: boolean;
  enableOfflineSupport?: boolean; // 是否啟用離線支援
  userId?: string; // 用戶ID（離線模式需要）
}

type RecordingStatus = 'idle' | 'recording' | 'paused' | 'stopped' | 'loading';

export const AudioRecorder = ({
  onRecordingComplete,
  onRecordingStart,
  onRecordingStop,
  onRecordingPause,
  onRecordingResume,
  maxDuration = 3600, // 預設最大1小時
  showWaveform = true,
  enableOfflineSupport = true,
  userId
}: AudioRecorderProps) => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>('idle');
  const [duration, setDuration] = useState(0);
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const [isOnline, setIsOnline] = useState(true);
  const [offlineRecordingsCount, setOfflineRecordingsCount] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const waveformTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 初始化離線支援和網路監控
  useEffect(() => {
    if (enableOfflineSupport) {
      OfflineRecordingService.initialize();
      loadOfflineRecordingsCount();
      
      // 監聽網路狀態變化
      const handleNetworkChange = (online: boolean) => {
        setIsOnline(online);
        if (online && userId) {
          // 網路恢復時自動同步
          OfflineRecordingService.autoSync(userId);
        }
      };

      NetworkMonitor.addListener(handleNetworkChange);
      
      // 檢查初始網路狀態
      checkInitialNetworkStatus();

      return () => {
        NetworkMonitor.removeListener(handleNetworkChange);
      };
    }
    return undefined;
  }, [enableOfflineSupport, userId]);

  // 檢查初始網路狀態
  const checkInitialNetworkStatus = async () => {
    const online = await OfflineRecordingService.isOnline();
    setIsOnline(online);
  };

  // 載入離線錄音數量
  const loadOfflineRecordingsCount = async () => {
    const count = await OfflineRecordingService.getOfflineRecordingsCount();
    setOfflineRecordingsCount(count);
  };

  // 初始化音訊模式
  const initializeAudio = useCallback(async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix });
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

  // 生成模擬波形資料
  const generateWaveformData = useCallback(() => {
    if (recordingStatus === 'recording') {
      setWaveformData(prev => [
        ...prev.slice(-50), // 保留最後50個資料點
        Math.random() * 100 // 新增隨機波形資料
      ]);
    }
  }, [recordingStatus]);

  // 開始錄音
  const startRecording = useCallback(async () => {
    try {
      setRecordingStatus('loading');
      
      await checkPermissions();
      await initializeAudio();

      console.log('開始錄音...');
      
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        undefined,
        100 // 更新間隔 (ms)
      );

      setRecording(newRecording);
      setRecordingStatus('recording');
      setDuration(0);
      setWaveformData([]);
      
      // 開始計時器
      durationTimerRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1;
          if (newDuration >= maxDuration) {
            stopRecording();
            return prev;
          }
          return newDuration;
        });
      }, 1000);

      // 開始波形更新
      if (showWaveform) {
        waveformTimerRef.current = setInterval(generateWaveformData, 100);
      }

      onRecordingStart?.();
    } catch (error) {
      console.error('開始錄音失敗:', error);
      setRecordingStatus('idle');
      Alert.alert('錄音失敗', error instanceof Error ? error.message : '無法開始錄音');
    }
  }, [checkPermissions, initializeAudio, maxDuration, showWaveform, generateWaveformData, onRecordingStart]);

  // 暫停錄音
  const pauseRecording = useCallback(async () => {
    if (!recording || recordingStatus !== 'recording') return;

    try {
      await recording.pauseAsync();
      setRecordingStatus('paused');
      
      // 停止計時器
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
      
      // 停止波形更新
      if (waveformTimerRef.current) {
        clearInterval(waveformTimerRef.current);
        waveformTimerRef.current = null;
      }

      onRecordingPause?.();
    } catch (error) {
      console.error('暫停錄音失敗:', error);
      Alert.alert('暫停失敗', '無法暫停錄音');
    }
  }, [recording, recordingStatus, onRecordingPause]);

  // 恢復錄音
  const resumeRecording = useCallback(async () => {
    if (!recording || recordingStatus !== 'paused') return;

    try {
      await recording.startAsync();
      setRecordingStatus('recording');
      
      // 重新開始計時器
      durationTimerRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1;
          if (newDuration >= maxDuration) {
            stopRecording();
            return prev;
          }
          return newDuration;
        });
      }, 1000);

      // 重新開始波形更新
      if (showWaveform) {
        waveformTimerRef.current = setInterval(generateWaveformData, 100);
      }

      onRecordingResume?.();
    } catch (error) {
      console.error('恢復錄音失敗:', error);
      Alert.alert('恢復失敗', '無法恢復錄音');
    }
  }, [recording, recordingStatus, maxDuration, showWaveform, generateWaveformData, onRecordingResume]);

  // 停止錄音
  const stopRecording = useCallback(async () => {
    if (!recording) return;

    try {
      setRecordingStatus('loading');
      
      // 清除計時器
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
      
      if (waveformTimerRef.current) {
        clearInterval(waveformTimerRef.current);
        waveformTimerRef.current = null;
      }

      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const uri = recording.getURI();
      if (uri) {
        console.log('錄音完成，檔案位置:', uri);
        
        // 獲取檔案資訊
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (fileInfo.exists && 'size' in fileInfo) {
          console.log('錄音檔案大小:', fileInfo.size, 'bytes');
        }
        
        setRecordingStatus('stopped');
        onRecordingComplete(uri, duration);
        onRecordingStop?.();
      } else {
        throw new Error('無法獲取錄音檔案路徑');
      }
      
      setRecording(null);
    } catch (error) {
      console.error('停止錄音失敗:', error);
      setRecordingStatus('idle');
      Alert.alert('停止錄音失敗', error instanceof Error ? error.message : '無法停止錄音');
    }
  }, [recording, duration, onRecordingComplete, onRecordingStop]);

  // 重置錄音狀態
  const resetRecording = useCallback(() => {
    setRecordingStatus('idle');
    setDuration(0);
    setWaveformData([]);
    setRecording(null);
  }, []);

  // 清理定時器
  useEffect(() => {
    return () => {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
      if (waveformTimerRef.current) {
        clearInterval(waveformTimerRef.current);
      }
    };
  }, []);

  // 波形視覺化組件
  const WaveformVisualization = () => {
    if (!showWaveform || waveformData.length === 0) return null;

    return (
      <View style={styles.waveformContainer}>
        <View style={styles.waveform}>
          {waveformData.map((amplitude, index) => (
            <View
              key={index}
              style={StyleSheet.flatten([
                styles.waveformBar,
                {
                  height: Math.max(2, amplitude / 2),
                  backgroundColor: recordingStatus === 'recording' ? '#22c55e' : '#6b7280'
                }
              ])}
            />
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 錄音狀態顯示 */}
      <View style={styles.statusContainer}>
        <View style={StyleSheet.flatten([
          styles.statusIndicator,
          { backgroundColor: getStatusColor(recordingStatus) }
        ])} />
        <Text style={styles.statusText}>
          {getStatusText(recordingStatus)}
        </Text>
        {recordingStatus === 'loading' && <LoadingSpinner size="small" />}
      </View>

      {/* 時間顯示 */}
      <Text style={styles.durationText}>
        {formatDuration(duration)}
        {maxDuration > 0 && ` / ${formatDuration(maxDuration)}`}
      </Text>

      {/* 波形顯示 */}
      <WaveformVisualization />

      {/* 控制按鈕 */}
      <View style={styles.controlsContainer}>
        {recordingStatus === 'idle' && (
          <Button
            title="開始錄音"
            onPress={startRecording}
            style={styles.startButton}
            textStyle={styles.startButtonText}
          />
        )}

        {recordingStatus === 'recording' && (
          <>
            <Button
              title="暫停"
              onPress={pauseRecording}
              style={styles.pauseButton}
              textStyle={styles.pauseButtonText}
            />
            <Button
              title="停止"
              onPress={stopRecording}
              style={styles.stopButton}
              textStyle={styles.stopButtonText}
            />
          </>
        )}

        {recordingStatus === 'paused' && (
          <>
            <Button
              title="繼續"
              onPress={resumeRecording}
              style={styles.resumeButton}
              textStyle={styles.resumeButtonText}
            />
            <Button
              title="停止"
              onPress={stopRecording}
              style={styles.stopButton}
              textStyle={styles.stopButtonText}
            />
          </>
        )}

        {recordingStatus === 'stopped' && (
          <Button
            title="重新錄音"
            onPress={resetRecording}
            style={styles.resetButton}
            textStyle={styles.resetButtonText}
          />
        )}
      </View>
    </View>
  );
};

// 輔助函數
const getStatusColor = (status: RecordingStatus): string => {
  switch (status) {
    case 'recording': return '#ef4444';
    case 'paused': return '#f59e0b';
    case 'stopped': return '#6b7280';
    case 'loading': return '#3b82f6';
    default: return '#6b7280';
  }
};

const getStatusText = (status: RecordingStatus): string => {
  switch (status) {
    case 'recording': return '錄音中';
    case 'paused': return '已暫停';
    case 'stopped': return '錄音完成';
    case 'loading': return '處理中';
    default: return '準備錄音';
  }
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000000',
    ...(Platform.OS === 'web' ? {} : { ...(Platform.OS === 'web' ? {} : { shadowOffset: { width: 0, height: 2 } }) }),
    shadowOpacity: 0.1,
    shadowRadius: 8,
    ...(Platform.OS === 'web' ? {} : { elevation: 4 }) },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16 },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8 },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginRight: 8 },
  durationText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  waveformContainer: {
    marginBottom: 24 },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 8 },
  waveformBar: {
    width: 3,
    marginHorizontal: 1,
    borderRadius: 1.5 },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12 },
  startButton: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 32,
    paddingVertical: 16 },
  startButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600' },
  pauseButton: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 24,
    paddingVertical: 16 },
  pauseButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600' },
  resumeButton: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 24,
    paddingVertical: 16 },
  resumeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600' },
  stopButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 24,
    paddingVertical: 16 },
  stopButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600' },
  resetButton: {
    backgroundColor: '#6b7280',
    paddingHorizontal: 32,
    paddingVertical: 16 },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600' } });