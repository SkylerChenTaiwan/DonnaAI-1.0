/**
 * 跨平台音訊服務
 * 根據平台自動選擇合適的音訊錄製實作
 */

import { Platform } from 'react-native';

// 通用的錄音狀態介面
export interface RecordingStatus {
  isRecording: boolean;
  isDoneRecording: boolean;
  canRecord: boolean;
  durationMillis: number;
}

// 通用的錄音介面
export interface IRecording {
  getStatusAsync(): Promise<RecordingStatus>;
  stopAndUnloadAsync(): Promise<void>;
  getURI(): Promise<string | null>;
  setOnRecordingStatusUpdate(callback: (status: RecordingStatus) => void): void;
  pauseAsync?(): Promise<void>;
  startAsync?(): Promise<void>;
}

// 通用的音訊服務介面
export interface IAudioService {
  setAudioModeAsync(options: any): Promise<void>;
  Recording: {
    createAsync(
      options: any,
      onRecordingStatusUpdate?: (status: RecordingStatus) => void,
      progressUpdateIntervalMillis?: number
    ): Promise<{ recording: IRecording; status: RecordingStatus }>;
  };
  RecordingOptionsPresets: {
    HIGH_QUALITY: any;
    LOW_QUALITY: any;
  };
}

// 動態載入音訊服務
let AudioService: IAudioService;

if (Platform.OS === 'web') {
  // Web 平台使用 WebAudioRecorder
  const WebAudio = require('./web/WebAudioRecorder').default;
  AudioService = WebAudio;
} else {
  // 原生平台使用 expo-av
  const { Audio } = require('expo-av');
  AudioService = Audio;
}

// 匯出統一的音訊服務
export const Audio = AudioService;

// 匯出便利方法
export const createRecording = async (
  options?: any,
  onStatusUpdate?: (status: RecordingStatus) => void
): Promise<{ recording: IRecording; status: RecordingStatus }> => {
  return Audio.Recording.createAsync(
    options || Audio.RecordingOptionsPresets.HIGH_QUALITY,
    onStatusUpdate,
    100
  );
};

// 權限檢查（跨平台）
export const requestMicrophonePermission = async (): Promise<boolean> => {
  if (Platform.OS === 'web') {
    const { requestMicrophonePermission: webRequest } = require('./web/WebAudioRecorder');
    return webRequest();
  } else {
    const { Audio } = require('expo-av');
    const { status } = await Audio.requestPermissionsAsync();
    return status === 'granted';
  }
};

// 檢查是否支援音訊錄製
export const isAudioRecordingSupported = (): boolean => {
  if (Platform.OS === 'web') {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }
  return true; // 原生平台總是支援
};