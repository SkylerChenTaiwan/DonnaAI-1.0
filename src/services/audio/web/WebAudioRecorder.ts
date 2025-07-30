/**
 * Web 平台音訊錄製服務
 * 使用 Web Audio API 和 MediaRecorder API 實現音訊錄製
 */

export interface WebRecordingStatus {
  isRecording: boolean;
  isDoneRecording: boolean;
  canRecord: boolean;
  durationMillis: number;
}

export class WebAudioRecording {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private startTime: number = 0;
  private uri: string | null = null;
  private _isRecording: boolean = false;
  private _isDoneRecording: boolean = false;
  private onStatusUpdate?: (status: WebRecordingStatus) => void;
  private statusUpdateInterval?: number;

  constructor() {
    this._isRecording = false;
    this._isDoneRecording = false;
  }

  private updateStatus() {
    if (this.onStatusUpdate) {
      this.onStatusUpdate(this.getStatus());
    }
  }

  getStatus(): WebRecordingStatus {
    const durationMillis = this._isRecording ? Date.now() - this.startTime : 0;
    return {
      isRecording: this._isRecording,
      isDoneRecording: this._isDoneRecording,
      canRecord: !this._isRecording && !this._isDoneRecording,
      durationMillis,
    };
  }

  async getStatusAsync(): Promise<WebRecordingStatus> {
    return this.getStatus();
  }

  async prepareToRecordAsync(options?: any): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        } 
      });

      // 決定使用的 MIME 類型
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }

      this.mediaRecorder = new MediaRecorder(stream, { mimeType });
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        this.uri = URL.createObjectURL(audioBlob);
        this._isRecording = false;
        this._isDoneRecording = true;
        
        // 停止所有音軌
        stream.getTracks().forEach(track => track.stop());
        
        if (this.statusUpdateInterval) {
          clearInterval(this.statusUpdateInterval);
          this.statusUpdateInterval = undefined;
        }
        
        this.updateStatus();
      };

    } catch (error) {
      console.error('無法獲取麥克風權限:', error);
      throw new Error('無法獲取麥克風權限，請確保已授予網站麥克風使用權限');
    }
  }

  async startAsync(): Promise<void> {
    if (!this.mediaRecorder) {
      await this.prepareToRecordAsync();
    }

    if (this.mediaRecorder && this.mediaRecorder.state === 'inactive') {
      this.audioChunks = [];
      this.startTime = Date.now();
      this.mediaRecorder.start();
      this._isRecording = true;
      this._isDoneRecording = false;

      // 每 100ms 更新一次狀態
      this.statusUpdateInterval = window.setInterval(() => {
        this.updateStatus();
      }, 100);

      this.updateStatus();
    }
  }

  async pauseAsync(): Promise<void> {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
      this._isRecording = false;
      this.updateStatus();
    }
  }

  async stopAndUnloadAsync(): Promise<void> {
    if (this.mediaRecorder) {
      if (this.mediaRecorder.state === 'recording' || this.mediaRecorder.state === 'paused') {
        this.mediaRecorder.stop();
      }
      
      // 等待 stop 事件完成
      await new Promise(resolve => setTimeout(resolve, 100));
      
      this.mediaRecorder = null;
    }
  }

  async getURI(): Promise<string | null> {
    return this.uri;
  }

  setOnRecordingStatusUpdate(callback: (status: WebRecordingStatus) => void): void {
    this.onStatusUpdate = callback;
  }

  // 創建音訊檔案物件（用於上傳）
  async createFileAsync(): Promise<{ uri: string; blob: Blob; mimeType: string }> {
    if (!this.uri) {
      throw new Error('沒有可用的錄音');
    }

    const response = await fetch(this.uri);
    const blob = await response.blob();
    
    return {
      uri: this.uri,
      blob,
      mimeType: blob.type || 'audio/webm',
    };
  }
}

// 模擬 expo-av 的 Recording 類別
export class WebRecording {
  private recording: WebAudioRecording;

  constructor() {
    this.recording = new WebAudioRecording();
  }

  static async createAsync(
    options: any,
    onRecordingStatusUpdate?: (status: WebRecordingStatus) => void,
    progressUpdateIntervalMillis?: number
  ): Promise<{ recording: WebRecording; status: WebRecordingStatus }> {
    const recording = new WebRecording();
    
    if (onRecordingStatusUpdate) {
      recording.recording.setOnRecordingStatusUpdate(onRecordingStatusUpdate);
    }

    await recording.recording.prepareToRecordAsync(options);
    await recording.recording.startAsync();

    const status = recording.recording.getStatus();
    return { recording, status };
  }

  async getStatusAsync(): Promise<WebRecordingStatus> {
    return this.recording.getStatusAsync();
  }

  async stopAndUnloadAsync(): Promise<void> {
    return this.recording.stopAndUnloadAsync();
  }

  async getURI(): Promise<string | null> {
    return this.recording.getURI();
  }

  setOnRecordingStatusUpdate(callback: (status: WebRecordingStatus) => void): void {
    this.recording.setOnRecordingStatusUpdate(callback);
  }

  async pauseAsync(): Promise<void> {
    return this.recording.pauseAsync();
  }

  async startAsync(): Promise<void> {
    return this.recording.startAsync();
  }

  // Web 平台特有方法
  async createFileAsync(): Promise<{ uri: string; blob: Blob; mimeType: string }> {
    return this.recording.createFileAsync();
  }
}

// Web Audio 設定（模擬 expo-av 的 Audio.setAudioModeAsync）
export class WebAudio {
  static async setAudioModeAsync(options: any): Promise<void> {
    // Web 平台不需要特殊的音訊模式設定
    // 這裡只是為了相容性而保留這個方法
    console.log('Web Audio Mode:', options);
  }

  static Recording = WebRecording;
  
  // 預設錄音選項
  static RecordingOptionsPresets = {
    HIGH_QUALITY: {
      isMeteringEnabled: true,
      android: {
        extension: '.m4a',
        outputFormat: 'mp4',
        audioEncoder: 'aac',
        sampleRate: 44100,
        numberOfChannels: 2,
        bitRate: 128000,
      },
      ios: {
        extension: '.m4a',
        outputFormat: 'mp4',
        audioQuality: 'high',
        sampleRate: 44100,
        numberOfChannels: 2,
        bitRate: 128000,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
      },
      web: {
        mimeType: 'audio/webm',
        bitsPerSecond: 128000,
      },
    },
    LOW_QUALITY: {
      isMeteringEnabled: true,
      android: {
        extension: '.m4a',
        outputFormat: 'mp4', 
        audioEncoder: 'aac',
        sampleRate: 22050,
        numberOfChannels: 1,
        bitRate: 64000,
      },
      ios: {
        extension: '.m4a',
        outputFormat: 'mp4',
        audioQuality: 'low',
        sampleRate: 22050,
        numberOfChannels: 1,
        bitRate: 64000,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
      },
      web: {
        mimeType: 'audio/webm',
        bitsPerSecond: 64000,
      },
    },
  };
}

// 權限檢查工具
export async function requestMicrophonePermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // 立即停止音軌以釋放麥克風
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.error('麥克風權限請求失敗:', error);
    return false;
  }
}

export default WebAudio;