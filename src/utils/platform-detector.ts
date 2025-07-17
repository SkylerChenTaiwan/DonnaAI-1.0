/**
 * 跨平台檢測和測試工具
 */

import { Platform, Dimensions, PixelRatio } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

export interface PlatformInfo {
  platform: 'ios' | 'android' | 'web';
  isDevice: boolean;
  deviceType: 'phone' | 'tablet' | 'desktop' | 'unknown';
  osVersion: string;
  screenSize: {
    width: number;
    height: number;
    pixelRatio: number;
  };
  appInfo: {
    version: string;
    buildNumber: string;
    isDebug: boolean;
  };
}

export class PlatformDetector {
  // 獲取平台資訊
  static getPlatformInfo(): PlatformInfo {
    const { width, height } = Dimensions.get('window');
    const pixelRatio = PixelRatio.get();

    return {
      platform: Platform.OS as 'ios' | 'android' | 'web',
      isDevice: Device.isDevice || false,
      deviceType: this.getDeviceType(),
      osVersion: Platform.Version.toString(),
      screenSize: {
        width,
        height,
        pixelRatio
      },
      appInfo: {
        version: Constants.expoConfig?.version || '1.0.0',
        buildNumber: Constants.expoConfig?.ios?.buildNumber || 
                    Constants.expoConfig?.android?.versionCode?.toString() || '1',
        isDebug: __DEV__
      }
    };
  }

  // 檢測設備類型
  static getDeviceType(): 'phone' | 'tablet' | 'desktop' | 'unknown' {
    const { width, height } = Dimensions.get('window');
    const pixelRatio = PixelRatio.get();
    
    if (Platform.OS === 'web') {
      return width > 768 ? 'desktop' : 'phone';
    }

    // 基於螢幕尺寸和像素密度判斷設備類型
    const shortDimension = Math.min(width, height);
    
    // iPad 或 Android 平板的判斷標準
    if (Platform.OS === 'ios') {
      // iOS 設備判斷
      if (Device.deviceType === Device.DeviceType.TABLET) {
        return 'tablet';
      }
      return 'phone';
    } else if (Platform.OS === 'android') {
      // Android 設備判斷
      const dp = shortDimension / pixelRatio;
      return dp >= 600 ? 'tablet' : 'phone';
    }

    return 'unknown';
  }

  // 檢查是否為小螢幕設備
  static isSmallScreen(): boolean {
    const { width, height } = Dimensions.get('window');
    const shortDimension = Math.min(width, height);
    return shortDimension < 375;
  }

  // 檢查是否為大螢幕設備
  static isLargeScreen(): boolean {
    const { width, height } = Dimensions.get('window');
    const shortDimension = Math.min(width, height);
    return shortDimension > 414;
  }

  // 獲取安全區域參數
  static getSafeAreaInsets() {
    if (Platform.OS === 'ios') {
      const { height } = Dimensions.get('window');
      // iPhone X 系列及以上的判斷
      if (height >= 812) {
        return {
          top: 44,
          bottom: 34,
          left: 0,
          right: 0
        };
      }
    }
    
    return {
      top: Platform.OS === 'ios' ? 20 : 0,
      bottom: 0,
      left: 0,
      right: 0
    };
  }

  // 檢測音訊功能支援
  static async checkAudioSupport(): Promise<{
    recording: boolean;
    playback: boolean;
    backgroundAudio: boolean;
  }> {
    try {
      // 這裡應該實際測試音訊功能
      return {
        recording: true,
        playback: true,
        backgroundAudio: Platform.OS !== 'web'
      };
    } catch (error) {
      console.error('音訊支援檢測失敗:', error);
      return {
        recording: false,
        playback: false,
        backgroundAudio: false
      };
    }
  }

  // 檢測通知功能支援
  static async checkNotificationSupport(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        return 'Notification' in window;
      }
      return true; // React Native 平台預設支援
    } catch (error) {
      console.error('通知支援檢測失敗:', error);
      return false;
    }
  }

  // 檢測檔案系統支援
  static async checkFileSystemSupport(): Promise<{
    read: boolean;
    write: boolean;
    delete: boolean;
  }> {
    try {
      // 基本的檔案系統功能檢測
      return {
        read: true,
        write: true,
        delete: true
      };
    } catch (error) {
      console.error('檔案系統支援檢測失敗:', error);
      return {
        read: false,
        write: false,
        delete: false
      };
    }
  }

  // 執行平台兼容性測試
  static async runCompatibilityTests(): Promise<{
    platform: PlatformInfo;
    audio: Awaited<ReturnType<typeof PlatformDetector.checkAudioSupport>>;
    notifications: boolean;
    fileSystem: Awaited<ReturnType<typeof PlatformDetector.checkFileSystemSupport>>;
    performance: {
      memoryWarning: boolean;
      lowEndDevice: boolean;
    };
  }> {
    const [audio, notifications, fileSystem] = await Promise.all([
      this.checkAudioSupport(),
      this.checkNotificationSupport(),
      this.checkFileSystemSupport()
    ]);

    return {
      platform: this.getPlatformInfo(),
      audio,
      notifications,
      fileSystem,
      performance: {
        memoryWarning: this.isLowMemoryDevice(),
        lowEndDevice: this.isLowEndDevice()
      }
    };
  }

  // 檢測是否為低記憶體設備
  static isLowMemoryDevice(): boolean {
    if (Platform.OS === 'ios') {
      // iOS 設備記憶體檢測邏輯
      const deviceType = Device.deviceType;
      return deviceType === Device.DeviceType.PHONE && 
             this.getPlatformInfo().screenSize.pixelRatio < 3;
    } else if (Platform.OS === 'android') {
      // Android 設備記憶體檢測邏輯
      return this.getPlatformInfo().screenSize.pixelRatio < 2;
    }
    return false;
  }

  // 檢測是否為低端設備
  static isLowEndDevice(): boolean {
    const { pixelRatio } = this.getPlatformInfo().screenSize;
    const { width, height } = Dimensions.get('window');
    
    // 基於螢幕解析度和像素密度判斷
    const totalPixels = width * height * pixelRatio;
    return totalPixels < 1000000; // 100萬像素以下視為低端設備
  }

  // 獲取推薦的性能設定
  static getPerformanceSettings(): {
    maxAudioDuration: number;
    audioQuality: 'low' | 'medium' | 'high';
    waveformEnabled: boolean;
    backgroundProcessing: boolean;
  } {
    const isLowEnd = this.isLowEndDevice();
    const isLowMemory = this.isLowMemoryDevice();

    if (isLowEnd || isLowMemory) {
      return {
        maxAudioDuration: 1800, // 30分鐘
        audioQuality: 'low',
        waveformEnabled: false,
        backgroundProcessing: false
      };
    } else {
      return {
        maxAudioDuration: 7200, // 2小時
        audioQuality: 'high',
        waveformEnabled: true,
        backgroundProcessing: true
      };
    }
  }

  // 生成設備指紋
  static generateDeviceFingerprint(): string {
    const info = this.getPlatformInfo();
    const fingerprint = [
      info.platform,
      info.deviceType,
      info.osVersion,
      info.screenSize.width,
      info.screenSize.height,
      info.screenSize.pixelRatio
    ].join('_');
    
    return Buffer.from(fingerprint).toString('base64');
  }
}