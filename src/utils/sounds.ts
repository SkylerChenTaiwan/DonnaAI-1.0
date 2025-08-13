/**
 * 音效管理工具
 * 負責預載入和播放應用程式音效
 * 
 * 注意：需要安裝 expo-audio 套件
 * npm install expo-audio
 */

import { Platform } from 'react-native';

export type SoundType = 'success' | 'error' | 'notification';

interface SoundAssets {
  [key: string]: any;
}

class SoundManager {
  private sounds: Map<SoundType, any> = new Map();
  private enabled: boolean = true;
  private volume: number = 0.7;
  private initialized: boolean = false;

  /**
   * 音效檔案來源
   * 注意：在 Web 平台上暫時停用音效
   */
  private readonly soundAssets: SoundAssets = {
    // Web 平台暫時不載入音效檔案
    success: null,
    error: null,
    notification: null };

  /**
   * 初始化音效管理器
   * 預載入所有音效檔案
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // 在 Web 平台上暫時停用音效以避免載入空檔案
    if (Platform.OS === 'web') {
      console.log('Web 平台暫時停用音效功能');
      this.initialized = true;
      this.enabled = false;
      return;
    }

    try {
      // Native 平台才需要真正載入音效
      if (Platform.OS !== 'web') {
        // 動態導入 expo-av
        const { Audio } = await import('expo-av');
        
        // 設定音訊模式
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          staysActiveInBackground: false,
          playThroughEarpieceAndroid: false
        });

        // 預載入所有音效
        const loadPromises = Object.entries(this.soundAssets).map(async ([key, source]) => {
          if (!source) return;
          
          try {
            const { sound } = await Audio.Sound.createAsync(source, {
              shouldPlay: false,
              volume: this.volume
            });
            this.sounds.set(key as SoundType, sound);
          } catch (error) {
            console.error(`載入音效 ${key} 失敗:`, error);
          }
        });

        await Promise.all(loadPromises);
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('初始化音效管理器失敗:', error);
      // 即使失敗也標記為已初始化，避免重複嘗試
      this.initialized = true;
    }
  }

  /**
   * 播放指定類型的音效
   */
  async playSound(type: SoundType): Promise<void> {
    if (!this.enabled) return;
    
    try {
      const sound = this.sounds.get(type);
      if (!sound) {
        console.warn(`音效 ${type} 尚未載入`);
        return;
      }

      // 重置到開頭
      await sound.setPositionAsync(0);
      // 設定音量
      await sound.setVolumeAsync(this.volume);
      // 播放音效
      await sound.playAsync();
    } catch (error) {
      console.error(`播放音效 ${type} 失敗:`, error);
    }
  }

  /**
   * 設定是否啟用音效
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * 獲取音效啟用狀態
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * 設定音量
   * @param volume 0-1 之間的數值
   */
  async setVolume(volume: number): Promise<void> {
    this.volume = Math.max(0, Math.min(1, volume));
    
    // 更新所有已載入音效的音量
    const updatePromises = Array.from(this.sounds.values()).map(sound => 
      sound.setVolumeAsync(this.volume).catch(error => 
        console.error('更新音量失敗:', error)
      )
    );
    
    await Promise.all(updatePromises);
  }

  /**
   * 獲取當前音量
   */
  getVolume(): number {
    return this.volume;
  }

  /**
   * 檢查是否已初始化
   */
  isReady(): boolean {
    return this.initialized;
  }

  /**
   * 清理資源
   * 在應用程式卸載時呼叫
   */
  async cleanup(): Promise<void> {
    try {
      const unloadPromises = Array.from(this.sounds.values()).map(sound => 
        sound.unloadAsync().catch(error => 
          console.error('卸載音效失敗:', error)
        )
      );
      
      await Promise.all(unloadPromises);
      this.sounds.clear();
      this.initialized = false;
    } catch (error) {
      console.error('清理音效資源失敗:', error);
    }
  }

  /**
   * 播放成功音效的便利方法
   */
  async playSuccess(): Promise<void> {
    await this.playSound('success');
  }

  /**
   * 播放錯誤音效的便利方法
   */
  async playError(): Promise<void> {
    await this.playSound('error');
  }

  /**
   * 播放通知音效的便利方法
   */
  async playNotification(): Promise<void> {
    await this.playSound('notification');
  }
}

// 匯出單例實例
export const soundManager = new SoundManager();

// 匯出便利函數
export const playSuccessSound = () => soundManager.playSuccess();
export const playErrorSound = () => soundManager.playError();
export const playNotificationSound = () => soundManager.playNotification();

/**
 * 音效管理 Hook
 * 提供 React 元件中使用音效的介面
 */
export const useSounds = () => {
  const playSound = async (type: SoundType) => {
    await soundManager.playSound(type);
  };

  return {
    playSound,
    playSuccess: soundManager.playSuccess.bind(soundManager),
    playError: soundManager.playError.bind(soundManager),
    playNotification: soundManager.playNotification.bind(soundManager),
    setEnabled: soundManager.setEnabled.bind(soundManager),
    setVolume: soundManager.setVolume.bind(soundManager),
    isEnabled: soundManager.isEnabled.bind(soundManager),
    getVolume: soundManager.getVolume.bind(soundManager)
  };
};