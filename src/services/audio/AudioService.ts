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

// 建立一個空的實作作為預設值
const DummyAudioService: IAudioService = {
  async setAudioModeAsync(options: any): Promise<void> {
    console.log('音訊模式設定（模擬）:', options);
  },
  Recording: {
    async createAsync(
      options: any,
      onRecordingStatusUpdate?: (status: RecordingStatus) => void,
      progressUpdateIntervalMillis?: number
    ): Promise<{ recording: IRecording; status: RecordingStatus }> {
      console.warn('音訊錄製在此平台上不可用');
      const dummyRecording: IRecording = {
        async getStatusAsync() {
          return {
            isRecording: false,
            isDoneRecording: false,
            canRecord: false,
            durationMillis: 0 };
        },
        async stopAndUnloadAsync() {},
        async getURI() { return null; },
        setOnRecordingStatusUpdate() {} };
      return {
        recording: dummyRecording,
        status: {
          isRecording: false,
          isDoneRecording: false,
          canRecord: false,
          durationMillis: 0 } };
    } },
  RecordingOptionsPresets: {
    HIGH_QUALITY: {},
    LOW_QUALITY: {} } };

if (Platform.OS === 'web') {
  // Web 平台使用 WebAudioRecorder
  try {
    const WebAudio = require('./web/WebAudioRecorder').default;
    AudioService = WebAudio;
  } catch (error) {
    console.warn('無法載入 Web 音訊服務，使用模擬實作');
    AudioService = DummyAudioService;
  }
} else {
  // 原生平台動態載入 expo-av
  try {
    const { Audio } = require('expo-av');
    AudioService = Audio;
  } catch (error) {
    console.warn('無法載入 expo-av，使用模擬實作');
    AudioService = DummyAudioService;
  }
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