/**
 * 音訊編輯組件
 * 支援音訊波形顯示、剪切、預覽播放功能
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { PanGestureHandler, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { AudioEditingSession } from '../../types/record';

interface AudioEditorProps {
  audioUri: string;
  originalDuration: number;
  onSaveEdit: (editedUri: string, editedDuration: number) => void;
  onCancel: () => void;
}

interface TrimSettings {
  startTime: number;
  endTime: number;
}

type EditMode = 'trim' | 'cut' | 'preview';

export const AudioEditor = ({
  audioUri,
  originalDuration,
  onSaveEdit,
  onCancel
}: AudioEditorProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [trimSettings, setTrimSettings] = useState<TrimSettings>({
    startTime: 0,
    endTime: originalDuration
  });
  const [editMode, setEditMode] = useState<EditMode>('trim');
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [editHistory, setEditHistory] = useState<AudioEditingSession['editHistory']>([]);

  const positionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const waveformWidth = 300;
  const waveformHeight = 80;

  // 初始化音訊
  useEffect(() => {
    initializeAudio();
    generateWaveformData();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      if (positionTimerRef.current) {
        clearInterval(positionTimerRef.current);
      }
    };
  }, [audioUri]);

  // 初始化音訊播放器
  const initializeAudio = async () => {
    try {
      setIsLoading(true);
      
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: false }
      );
      
      setSound(newSound);
      setIsLoading(false);
    } catch (error) {
      console.error('初始化音訊失敗:', error);
      setIsLoading(false);
    }
  };

  // 生成模擬波形資料
  const generateWaveformData = () => {
    const dataPoints = 150;
    const data: number[] = [];
    
    for (let i = 0; i < dataPoints; i++) {
      // 生成模擬波形資料（實際應用中應該從音訊檔案分析）
      const amplitude = Math.random() * 50 + 10;
      data.push(amplitude);
    }
    
    setWaveformData(data);
  };

  // 格式化時間顯示
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // 播放音訊
  const playAudio = async () => {
    if (!sound) return;

    try {
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        // 從修剪開始位置播放
        await sound.setPositionAsync(trimSettings.startTime * 1000);
        await sound.playAsync();
        setIsPlaying(true);

        // 開始追蹤播放位置
        positionTimerRef.current = setInterval(async () => {
          const currentStatus = await sound.getStatusAsync();
          if (currentStatus.isLoaded && currentStatus.isPlaying) {
            const currentPos = (currentStatus.positionMillis || 0) / 1000;
            setPosition(currentPos);

            // 如果播放到修剪結束位置，停止播放
            if (currentPos >= trimSettings.endTime) {
              pauseAudio();
            }
          }
        }, 100);
      }
    } catch (error) {
      console.error('播放音訊失敗:', error);
    }
  };

  // 暫停音訊
  const pauseAudio = async () => {
    if (!sound) return;

    try {
      await sound.pauseAsync();
      setIsPlaying(false);
      
      if (positionTimerRef.current) {
        clearInterval(positionTimerRef.current);
        positionTimerRef.current = null;
      }
    } catch (error) {
      console.error('暫停音訊失敗:', error);
    }
  };

  // 停止音訊
  const stopAudio = async () => {
    if (!sound) return;

    try {
      await sound.stopAsync();
      await sound.setPositionAsync(trimSettings.startTime * 1000);
      setIsPlaying(false);
      setPosition(trimSettings.startTime);
      
      if (positionTimerRef.current) {
        clearInterval(positionTimerRef.current);
        positionTimerRef.current = null;
      }
    } catch (error) {
      console.error('停止音訊失敗:', error);
    }
  };

  // 更新修剪設定
  const updateTrimSettings = (startTime: number, endTime: number) => {
    const newSettings = {
      startTime: Math.max(0, Math.min(startTime, originalDuration)),
      endTime: Math.max(0, Math.min(endTime, originalDuration))
    };
    
    // 確保開始時間小於結束時間
    if (newSettings.startTime >= newSettings.endTime) {
      newSettings.endTime = newSettings.startTime + 1;
    }
    
    setTrimSettings(newSettings);
    
    // 記錄編輯歷史
    const editAction = {
      action: 'trim' as const,
      timestamp: new Date(),
      parameters: newSettings
    };
    setEditHistory(prev => [...prev, editAction]);
  };

  // 重置到原始狀態
  const resetEdit = () => {
    setTrimSettings({
      startTime: 0,
      endTime: originalDuration
    });
    setPosition(0);
    setEditHistory([]);
    stopAudio();
  };

  // 儲存編輯結果
  const saveEdit = async () => {
    try {
      setIsLoading(true);
      
      // 這裡應該實際處理音訊剪切
      // 由於 React Native 缺乏原生音訊編輯 API，這裡模擬處理
      const editedDuration = trimSettings.endTime - trimSettings.startTime;
      
      // 實際應用中，需要使用後端服務或原生模組來處理音訊剪切
      // 這裡返回原始 URI 和編輯資訊
      onSaveEdit(audioUri, editedDuration);
      
    } catch (error) {
      console.error('儲存編輯失敗:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 波形視覺化組件
  const WaveformDisplay = () => {
    const startPercent = (trimSettings.startTime / originalDuration) * 100;
    const endPercent = (trimSettings.endTime / originalDuration) * 100;
    const positionPercent = (position / originalDuration) * 100;

    return (
      <View style={styles.waveformContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={[styles.waveform, { width: waveformWidth }]}>
            {/* 波形條 */}
            {waveformData.map((amplitude, index) => {
              const xPosition = (index / waveformData.length) * 100;
              const isInRange = xPosition >= startPercent && xPosition <= endPercent;
              
              return (
                <View
                  key={index}
                  style={[
                    styles.waveformBar,
                    {
                      height: amplitude,
                      backgroundColor: isInRange ? '#3b82f6' : '#d1d5db',
                      left: (index / waveformData.length) * waveformWidth }
                  ]}
                />
              );
            })}
            
            {/* 修剪範圍指示器 */}
            <View
              style={[
                styles.trimIndicator,
                styles.trimStart,
                { left: (startPercent / 100) * waveformWidth }
              ]}
            />
            <View
              style={[
                styles.trimIndicator,
                styles.trimEnd,
                { left: (endPercent / 100) * waveformWidth }
              ]}
            />
            
            {/* 播放位置指示器 */}
            {isPlaying && (
              <View
                style={[
                  styles.playbackIndicator,
                  { left: (positionPercent / 100) * waveformWidth }
                ]}
              />
            )}
          </View>
        </ScrollView>
        
        {/* 時間標籤 */}
        <View style={styles.timeLabels}>
          <Text style={styles.timeLabel}>0:00</Text>
          <Text style={styles.timeLabel}>{formatTime(originalDuration)}</Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" />
        <Text style={styles.loadingText}>載入音訊編輯器...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>音訊編輯</Text>
        <Text style={styles.subtitle}>
          原始長度: {formatTime(originalDuration)}
        </Text>
      </View>

      {/* 波形顯示 */}
      <WaveformDisplay />

      {/* 修剪控制 */}
      <View style={styles.trimControls}>
        <Text style={styles.trimLabel}>修剪範圍</Text>
        
        <View style={styles.trimInputs}>
          <View style={styles.trimInput}>
            <Text style={styles.trimInputLabel}>開始</Text>
            <Text style={styles.trimInputValue}>
              {formatTime(trimSettings.startTime)}
            </Text>
          </View>
          
          <View style={styles.trimInput}>
            <Text style={styles.trimInputLabel}>結束</Text>
            <Text style={styles.trimInputValue}>
              {formatTime(trimSettings.endTime)}
            </Text>
          </View>
          
          <View style={styles.trimInput}>
            <Text style={styles.trimInputLabel}>長度</Text>
            <Text style={styles.trimInputValue}>
              {formatTime(trimSettings.endTime - trimSettings.startTime)}
            </Text>
          </View>
        </View>
      </View>

      {/* 快速修剪按鈕 */}
      <View style={styles.quickTrimButtons}>
        <Button
          title="移除前 5 秒"
          onPress={() => updateTrimSettings(Math.min(5, trimSettings.startTime + 5), trimSettings.endTime)}
          style={styles.quickTrimButton}
          textStyle={styles.quickTrimButtonText}
        />
        <Button
          title="移除後 5 秒"
          onPress={() => updateTrimSettings(trimSettings.startTime, Math.max(trimSettings.endTime - 5, trimSettings.startTime + 1))}
          style={styles.quickTrimButton}
          textStyle={styles.quickTrimButtonText}
        />
      </View>

      {/* 播放控制 */}
      <View style={styles.playbackControls}>
        <Button
          title={isPlaying ? "暫停" : "預覽"}
          onPress={isPlaying ? pauseAudio : playAudio}
          style={styles.playButton}
          textStyle={styles.playButtonText}
        />
        <Button
          title="停止"
          onPress={stopAudio}
          style={styles.stopButton}
          textStyle={styles.stopButtonText}
        />
        <Button
          title="重置"
          onPress={resetEdit}
          style={styles.resetButton}
          textStyle={styles.resetButtonText}
        />
      </View>

      {/* 操作按鈕 */}
      <View style={styles.actionButtons}>
        <Button
          title="取消"
          onPress={onCancel}
          style={styles.cancelButton}
          textStyle={styles.cancelButtonText}
        />
        <Button
          title="儲存編輯"
          onPress={saveEdit}
          style={styles.saveButton}
          textStyle={styles.saveButtonText}
        />
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff' },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280' },
  header: {
    alignItems: 'center',
    marginBottom: 24 },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4 },
  subtitle: {
    fontSize: 14,
    color: '#6b7280' },
  waveformContainer: {
    marginBottom: 24,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16 },
  waveform: {
    height: 80,
    position: 'relative',
    backgroundColor: '#ffffff',
    borderRadius: 8 },
  waveformBar: {
    position: 'absolute',
    bottom: 0,
    width: 2,
    borderRadius: 1 },
  trimIndicator: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 3 },
  trimStart: {
    backgroundColor: '#22c55e' },
  trimEnd: {
    backgroundColor: '#ef4444' },
  playbackIndicator: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#f59e0b' },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8 },
  timeLabel: {
    fontSize: 12,
    color: '#6b7280' },
  trimControls: {
    marginBottom: 24 },
  trimLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12 },
  trimInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between' },
  trimInput: {
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginHorizontal: 4 },
  trimInputLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4 },
  trimInputValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937' },
  quickTrimButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12 },
  quickTrimButton: {
    backgroundColor: '#e5e7eb',
    flex: 1 },
  quickTrimButtonText: {
    color: '#374151',
    fontSize: 14 },
  playbackControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 12 },
  playButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24 },
  playButtonText: {
    color: '#ffffff',
    fontWeight: '600' },
  stopButton: {
    backgroundColor: '#6b7280',
    paddingHorizontal: 24 },
  stopButtonText: {
    color: '#ffffff',
    fontWeight: '600' },
  resetButton: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 24 },
  resetButtonText: {
    color: '#ffffff',
    fontWeight: '600' },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16 },
  cancelButton: {
    backgroundColor: '#e5e7eb',
    flex: 1 },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '600' },
  saveButton: {
    backgroundColor: '#22c55e',
    flex: 1 },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '600' } });