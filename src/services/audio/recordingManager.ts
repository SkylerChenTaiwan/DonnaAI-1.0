/**
 * 全局錄音管理器
 * 確保整個應用程式只有一個錄音實例
 */

import { Audio } from 'expo-av';

class RecordingManager {
  private static instance: RecordingManager;
  private currentRecording: Audio.Recording | null = null;
  private isRecording: boolean = false;

  private constructor() {}

  static getInstance(): RecordingManager {
    if (!RecordingManager.instance) {
      RecordingManager.instance = new RecordingManager();
    }
    return RecordingManager.instance;
  }

  async stopCurrentRecording(): Promise<void> {
    if (this.currentRecording) {
      try {
        await this.currentRecording.stopAndUnloadAsync();
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      } catch (error) {
        console.warn('停止現有錄音時出錯:', error);
      } finally {
        this.currentRecording = null;
        this.isRecording = false;
      }
    }
  }

  async startNewRecording(): Promise<Audio.Recording> {
    console.log('RecordingManager: 請求開始新錄音');
    
    // 如果已經在錄音中，拋出錯誤
    if (this.isRecording && this.currentRecording) {
      console.warn('RecordingManager: 已經有錄音在進行中');
      throw new Error('已經有錄音在進行中');
    }
    
    // 先停止任何現有的錄音
    await this.stopCurrentRecording();
    
    // 添加延遲以確保資源釋放
    await new Promise(resolve => setTimeout(resolve, 100));

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
  }

  getCurrentRecording(): Audio.Recording | null {
    return this.currentRecording;
  }

  getIsRecording(): boolean {
    return this.isRecording;
  }

  setCurrentRecording(recording: Audio.Recording | null): void {
    this.currentRecording = recording;
    this.isRecording = !!recording;
  }
}

export const recordingManager = RecordingManager.getInstance();