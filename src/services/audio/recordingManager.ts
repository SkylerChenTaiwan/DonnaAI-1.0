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
    // 先停止任何現有的錄音
    await this.stopCurrentRecording();

    // 創建新的錄音
    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY,
      undefined,
      100
    );

    this.currentRecording = recording;
    this.isRecording = true;
    
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