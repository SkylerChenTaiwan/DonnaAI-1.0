/**
 * 離線錄音支援服務
 * 處理網路中斷時的錄音暫存和同步功能
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Network from 'expo-network';
import { Alert } from 'react-native';
import { RecordDoc } from '@/types/record';

interface OfflineRecording {
  id: string;
  audioUri: string;
  recordData: Omit<RecordDoc, 'id' | 'createdAt' | 'updatedAt'>;
  timestamp: number;
  fileSize: number;
  duration: number;
  userId: string;
}

interface SyncProgress {
  totalFiles: number;
  uploadedFiles: number;
  currentFile: string;
  isComplete: boolean;
}

export class OfflineRecordingService {
  private static readonly OFFLINE_RECORDINGS_KEY = 'offline_recordings';
  private static readonly OFFLINE_DIRECTORY = `${FileSystem.documentDirectory}offline_recordings/`;

  // 初始化離線錄音目錄
  static async initialize(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.OFFLINE_DIRECTORY);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.OFFLINE_DIRECTORY, { intermediates: true });
      }
    } catch (error) {
      console.error('初始化離線錄音目錄失敗:', error);
    }
  }

  // 檢查網路狀態
  static async isOnline(): Promise<boolean> {
    try {
      const networkState = await Network.getNetworkStateAsync();
      return networkState.isConnected === true && networkState.isInternetReachable === true;
    } catch (error) {
      console.error('檢查網路狀態失敗:', error);
      return false;
    }
  }

  // 保存離線錄音
  static async saveOfflineRecording(
    audioUri: string,
    recordData: Omit<RecordDoc, 'id' | 'createdAt' | 'updatedAt'>,
    userId: string
  ): Promise<string> {
    try {
      await this.initialize();

      const recordingId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const fileName = `${recordingId}.mp3`;
      const offlineAudioPath = `${this.OFFLINE_DIRECTORY}${fileName}`;

      // 複製音訊檔案到離線目錄
      await FileSystem.copyAsync({
        from: audioUri,
        to: offlineAudioPath
      });

      // 獲取檔案資訊
      const fileInfo = await FileSystem.getInfoAsync(offlineAudioPath);
      const fileSize = fileInfo.size || 0;

      // 創建離線錄音記錄
      const offlineRecording: OfflineRecording = {
        id: recordingId,
        audioUri: offlineAudioPath,
        recordData,
        timestamp: Date.now(),
        fileSize,
        duration: recordData.audioRecordingState?.duration || 0,
        userId
      };

      // 保存到 AsyncStorage
      const existingRecordings = await this.getOfflineRecordings();
      existingRecordings.push(offlineRecording);
      await AsyncStorage.setItem(this.OFFLINE_RECORDINGS_KEY, JSON.stringify(existingRecordings));

      console.log('離線錄音已保存:', recordingId);
      return recordingId;

    } catch (error) {
      console.error('保存離線錄音失敗:', error);
      throw new Error('無法保存離線錄音');
    }
  }

  // 獲取所有離線錄音
  static async getOfflineRecordings(): Promise<OfflineRecording[]> {
    try {
      const recordingsJson = await AsyncStorage.getItem(this.OFFLINE_RECORDINGS_KEY);
      return recordingsJson ? JSON.parse(recordingsJson) : [];
    } catch (error) {
      console.error('獲取離線錄音失敗:', error);
      return [];
    }
  }

  // 獲取離線錄音數量
  static async getOfflineRecordingsCount(): Promise<number> {
    const recordings = await this.getOfflineRecordings();
    return recordings.length;
  }

  // 獲取離線錄音總大小
  static async getOfflineRecordingsSize(): Promise<number> {
    const recordings = await this.getOfflineRecordings();
    return recordings.reduce((total, recording) => total + recording.fileSize, 0);
  }

  // 同步離線錄音到伺服器
  static async syncOfflineRecordings(
    userId: string,
    onProgress?: (progress: SyncProgress) => void
  ): Promise<void> {
    try {
      // 檢查網路連線
      if (!(await this.isOnline())) {
        throw new Error('無網路連線，無法同步');
      }

      const recordings = await this.getOfflineRecordings();
      const userRecordings = recordings.filter(r => r.userId === userId);

      if (userRecordings.length === 0) {
        onProgress?.({
          totalFiles: 0,
          uploadedFiles: 0,
          currentFile: '',
          isComplete: true
        });
        return;
      }

      console.log(`開始同步 ${userRecordings.length} 個離線錄音`);

      let uploadedCount = 0;

      for (const recording of userRecordings) {
        try {
          onProgress?.({
            totalFiles: userRecordings.length,
            uploadedFiles: uploadedCount,
            currentFile: recording.recordData.title || '未命名錄音',
            isComplete: false
          });

          // 這裡需要實際調用上傳 API
          // 暫時模擬上傳過程
          await this.uploadRecordingToServer(recording);
          
          // 上傳成功後刪除本地檔案
          await this.removeOfflineRecording(recording.id);
          
          uploadedCount++;

          console.log(`同步完成: ${recording.id}`);

        } catch (error) {
          console.error(`同步錄音失敗 ${recording.id}:`, error);
          // 繼續同步其他檔案
        }
      }

      onProgress?.({
        totalFiles: userRecordings.length,
        uploadedFiles: uploadedCount,
        currentFile: '',
        isComplete: true
      });

      console.log(`同步完成: ${uploadedCount}/${userRecordings.length} 個檔案`);

    } catch (error) {
      console.error('同步離線錄音失敗:', error);
      throw error;
    }
  }

  // 上傳錄音到伺服器（模擬）
  private static async uploadRecordingToServer(recording: OfflineRecording): Promise<void> {
    // 這裡應該調用實際的 createRecord API
    // 暫時模擬網路延遲
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // 模擬偶爾的上傳失敗
    if (Math.random() < 0.1) {
      throw new Error('模擬網路錯誤');
    }
  }

  // 刪除離線錄音
  static async removeOfflineRecording(recordingId: string): Promise<void> {
    try {
      const recordings = await this.getOfflineRecordings();
      const recording = recordings.find(r => r.id === recordingId);
      
      if (recording) {
        // 刪除音訊檔案
        const fileInfo = await FileSystem.getInfoAsync(recording.audioUri);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(recording.audioUri);
        }

        // 從 AsyncStorage 中移除
        const updatedRecordings = recordings.filter(r => r.id !== recordingId);
        await AsyncStorage.setItem(this.OFFLINE_RECORDINGS_KEY, JSON.stringify(updatedRecordings));
      }
    } catch (error) {
      console.error('刪除離線錄音失敗:', error);
    }
  }

  // 清除所有離線錄音
  static async clearAllOfflineRecordings(): Promise<void> {
    try {
      const recordings = await this.getOfflineRecordings();
      
      // 刪除所有音訊檔案
      for (const recording of recordings) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(recording.audioUri);
          if (fileInfo.exists) {
            await FileSystem.deleteAsync(recording.audioUri);
          }
        } catch (error) {
          console.error(`刪除檔案失敗 ${recording.audioUri}:`, error);
        }
      }

      // 清空 AsyncStorage
      await AsyncStorage.removeItem(this.OFFLINE_RECORDINGS_KEY);
      
      console.log('已清除所有離線錄音');
    } catch (error) {
      console.error('清除離線錄音失敗:', error);
    }
  }

  // 顯示同步提示
  static async showSyncPrompt(userId: string): Promise<boolean> {
    const count = await this.getOfflineRecordingsCount();
    if (count === 0) return false;

    const sizeInMB = (await this.getOfflineRecordingsSize()) / (1024 * 1024);

    return new Promise((resolve) => {
      Alert.alert(
        '離線錄音同步',
        `您有 ${count} 個離線錄音 (${sizeInMB.toFixed(1)} MB) 等待同步。\n是否現在同步到雲端？`,
        [
          {
            text: '稍後',
            style: 'cancel',
            onPress: () => resolve(false)
          },
          {
            text: '立即同步',
            onPress: () => resolve(true)
          }
        ]
      );
    });
  }

  // 自動同步（當網路可用時）
  static async autoSync(userId: string): Promise<void> {
    try {
      if (await this.isOnline()) {
        const count = await this.getOfflineRecordingsCount();
        if (count > 0) {
          console.log('自動同步離線錄音...');
          await this.syncOfflineRecordings(userId);
        }
      }
    } catch (error) {
      console.error('自動同步失敗:', error);
    }
  }
}

// 網路狀態監聽器
export class NetworkMonitor {
  private static listeners: Array<(isOnline: boolean) => void> = [];
  private static isListening = false;

  static addListener(callback: (isOnline: boolean) => void): void {
    this.listeners.push(callback);
    if (!this.isListening) {
      this.startListening();
    }
  }

  static removeListener(callback: (isOnline: boolean) => void): void {
    this.listeners = this.listeners.filter(listener => listener !== callback);
    if (this.listeners.length === 0) {
      this.stopListening();
    }
  }

  private static startListening(): void {
    this.isListening = true;
    // 這裡應該實作實際的網路狀態監聽
    // 由於 expo-network 沒有直接的監聽器，我們使用輪詢
    this.pollNetworkStatus();
  }

  private static stopListening(): void {
    this.isListening = false;
  }

  private static async pollNetworkStatus(): Promise<void> {
    if (!this.isListening) return;

    try {
      const isOnline = await OfflineRecordingService.isOnline();
      this.listeners.forEach(listener => listener(isOnline));
    } catch (error) {
      console.error('檢查網路狀態失敗:', error);
    }

    // 每 30 秒檢查一次網路狀態
    setTimeout(() => this.pollNetworkStatus(), 30000);
  }
}