/**
 * 全局錄音管理器
 * 確保整個應用程式只有一個錄音實例
 */

import { Audio, IRecording } from './AudioService';

class RecordingManager {
  private static instance: RecordingManager;
  private currentRecording: IRecording | null = null;
  private isRecording: boolean = false;
  private isStarting: boolean = false;

  private constructor() {}

  static getInstance(): RecordingManager {
    if (!RecordingManager.instance) {
      RecordingManager.instance = new RecordingManager();
    }
    return RecordingManager.instance;
  }

  async stopCurrentRecording(): Promise<void> {
    if (this.currentRecording) {
      const recordingToStop = this.currentRecording;
      this.currentRecording = null;
      this.isRecording = false;
      
      try {
        const status = await recordingToStop.getStatusAsync();
        if (status.isRecording || status.canRecord) {
          await recordingToStop.stopAndUnloadAsync();
        }
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      } catch (error) {
        // 忽略 "already unloaded" 錯誤
        if (!error.message?.includes('already been unloaded')) {
          console.warn('停止現有錄音時出錯:', error);
        }
      }
    }
  }

  async startNewRecording(): Promise<IRecording> {
    console.log('RecordingManager: 請求開始新錄音');
    
    // 如果正在啟動錄音，拋出錯誤
    if (this.isStarting) {
      console.warn('RecordingManager: 正在啟動另一個錄音');
      throw new Error('正在啟動另一個錄音');
    }
    
    // 如果已經在錄音中，拋出錯誤
    if (this.isRecording && this.currentRecording) {
      console.warn('RecordingManager: 已經有錄音在進行中');
      throw new Error('已經有錄音在進行中');
    }
    
    try {
      this.isStarting = true;
      
      // 先停止任何現有的錄音
      await this.stopCurrentRecording();
      
      // 重置音頻模式
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        interruptionModeIOS: 1, // Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX
        interruptionModeAndroid: 1, // Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
      });
      
      // 添加延遲以確保資源釋放
      await new Promise(resolve => setTimeout(resolve, 200));

      // 創建新的錄音
      console.log('RecordingManager: 創建新錄音...');
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        undefined,
        100
      );

      this.currentRecording = recording;
      this.isRecording = true;
      console.log('RecordingManager: 錄音開始成功');
      
      return recording;
    } finally {
      this.isStarting = false;
    }
  }

  getCurrentRecording(): IRecording | null {
    return this.currentRecording;
  }

  getIsRecording(): boolean {
    return this.isRecording;
  }

  setCurrentRecording(recording: Audio.Recording | null): void {
    console.log('RecordingManager: 設置當前錄音:', !!recording);
    this.currentRecording = recording;
    this.isRecording = !!recording;
  }
}

export const recordingManager = RecordingManager.getInstance();