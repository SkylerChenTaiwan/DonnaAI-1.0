/**
 * Web 平台功能測試
 * 驗證所有 Web 平台服務是否正確實作
 */

import { Platform } from 'react-native';
import { isWebPlatform, checkWebFeatures } from '@/utils/web-detector';
import { Audio, isAudioRecordingSupported } from '@/services/audio/AudioService';
import { Notifications, isNotificationSupported } from '@/services/notifications/NotificationService';
import { FileSystem } from '@/services/filesystem/FileSystemService';

// 測試平台檢測
export function testPlatformDetection() {
  console.log('=== 平台檢測測試 ===');
  console.log('Platform.OS:', Platform.OS);
  console.log('isWebPlatform:', isWebPlatform());
  
  if (isWebPlatform()) {
    console.log('Web 功能支援:', checkWebFeatures());
  }
}

// 測試音訊服務
export async function testAudioService() {
  console.log('\n=== 音訊服務測試 ===');
  console.log('音訊錄製支援:', isAudioRecordingSupported());
  
  if (isWebPlatform() && isAudioRecordingSupported()) {
    try {
      // 測試錄音設定
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      console.log('✅ 音訊模式設定成功');
      
      // 測試錄音預設
      console.log('錄音預設:', Audio.RecordingOptionsPresets.HIGH_QUALITY);
    } catch (error) {
      console.error('❌ 音訊服務測試失敗:', error);
    }
  }
}

// 測試通知服務
export async function testNotificationService() {
  console.log('\n=== 通知服務測試 ===');
  console.log('通知支援:', isNotificationSupported());
  
  if (isWebPlatform() && isNotificationSupported()) {
    try {
      // 檢查權限狀態
      const { status } = await Notifications.getPermissionsAsync();
      console.log('通知權限狀態:', status);
      
      // 測試通知頻道設定
      await Notifications.setNotificationChannelAsync('test-channel', {
        name: '測試頻道',
        importance: 3,
      });
      console.log('✅ 通知頻道設定成功');
    } catch (error) {
      console.error('❌ 通知服務測試失敗:', error);
    }
  }
}

// 測試檔案系統
export async function testFileSystem() {
  console.log('\n=== 檔案系統測試 ===');
  console.log('文檔目錄:', FileSystem.documentDirectory);
  console.log('快取目錄:', FileSystem.cacheDirectory);
  
  if (isWebPlatform()) {
    try {
      // 測試寫入檔案
      const testContent = 'Hello Web Platform!';
      const testFile = `${FileSystem.documentDirectory}test.txt`;
      
      await FileSystem.writeAsStringAsync(testFile, testContent);
      console.log('✅ 檔案寫入成功');
      
      // 測試讀取檔案
      const readContent = await FileSystem.readAsStringAsync(testFile);
      console.log('✅ 檔案讀取成功:', readContent);
      
      // 測試檔案資訊
      const fileInfo = await FileSystem.getInfoAsync(testFile);
      console.log('✅ 檔案資訊:', fileInfo);
      
      // 測試刪除檔案
      await FileSystem.deleteAsync(testFile);
      console.log('✅ 檔案刪除成功');
    } catch (error) {
      console.error('❌ 檔案系統測試失敗:', error);
    }
  }
}

// 執行所有測試
export async function runAllWebTests() {
  console.log('開始 Web 平台測試...\n');
  
  testPlatformDetection();
  await testAudioService();
  await testNotificationService();
  await testFileSystem();
  
  console.log('\n測試完成！');
}

// 類型驗證（確保所有服務都有正確的類型）
type AudioServiceType = typeof Audio;
type NotificationServiceType = typeof Notifications;
type FileSystemType = typeof FileSystem;

// 驗證介面實作
const _audioCheck: AudioServiceType = Audio;
const _notificationCheck: NotificationServiceType = Notifications;
const _fileSystemCheck: FileSystemType = FileSystem;