/**
 * 設定服務
 * 負責管理使用者設定的儲存、載入和同步
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb } from './firebase/config';
import { UserSettings, SettingsService as ISettingsService } from '../types/settings';
import { STORAGE_KEYS } from '../config/constants';
import Constants from 'expo-constants';

/**
 * 預設設定值
 */
const DEFAULT_SETTINGS: UserSettings = {
  notifications: {
    enabled: true,
    lastUpdated: new Date()
  },
  sounds: {
    enabled: true,
    volume: 0.7
  },
  version: Constants.expoConfig?.version || '1.0.0',
  lastSynced: new Date()
};

class SettingsServiceImpl implements ISettingsService {
  private readonly STORAGE_KEY = STORAGE_KEYS.USER_SETTINGS;
  private syncInProgress = false;

  /**
   * 載入使用者設定
   * 優先從本地載入，背景同步 Firebase
   */
  async loadSettings(): Promise<UserSettings> {
    try {
      // 1. 先從 AsyncStorage 載入（快速）
      const localSettingsStr = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (localSettingsStr) {
        const localSettings = JSON.parse(localSettingsStr);
        // 轉換日期字串為 Date 物件
        if (localSettings.notifications?.lastUpdated) {
          localSettings.notifications.lastUpdated = new Date(localSettings.notifications.lastUpdated);
        }
        if (localSettings.lastSynced) {
          localSettings.lastSynced = new Date(localSettings.lastSynced);
        }
        
        // 2. 背景同步 Firebase（如果使用者已登入）
        const auth = getFirebaseAuth();
        if (auth.currentUser && !this.syncInProgress) {
          this.syncWithFirebase().catch(error => {
            // 如果是權限錯誤，靜默處理
            if (error instanceof Error && error.message.includes('Missing or insufficient permissions')) {
              console.log('Firebase 設定同步暫時無法使用，使用本地儲存');
              return;
            }
            console.error('背景同步失敗:', error);
          });
        }
        
        return localSettings;
      }
      
      // 3. 如果本地沒有，從 Firebase 載入
      const auth = getFirebaseAuth();
      if (auth.currentUser) {
        const fbSettings = await this.loadFromFirebase();
        if (fbSettings) {
          await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(fbSettings));
          return fbSettings;
        }
      }
      
      // 4. 返回預設值
      return { ...DEFAULT_SETTINGS };
    } catch (error) {
      console.error('載入設定失敗:', error);
      return { ...DEFAULT_SETTINGS };
    }
  }

  /**
   * 儲存使用者設定
   * 採用樂觀更新策略
   */
  async saveSettings(updates: Partial<UserSettings>): Promise<void> {
    try {
      // 載入現有設定
      const currentSettings = await this.loadSettings();
      
      // 合併更新
      const updatedSettings: UserSettings = {
        ...currentSettings,
        ...updates,
        lastSynced: new Date()
      };
      
      // 1. 立即儲存到 AsyncStorage
      await AsyncStorage.setItem(
        this.STORAGE_KEY, 
        JSON.stringify(updatedSettings)
      );
      
      // 2. 背景同步到 Firebase（如果使用者已登入）
      const auth = getFirebaseAuth();
      if (auth.currentUser && !this.syncInProgress) {
        this.syncToFirebase(updatedSettings).catch(error => {
          // 如果是權限錯誤，靜默處理
          if (error instanceof Error && error.message.includes('Missing or insufficient permissions')) {
            console.log('Firebase 設定同步暫時無法使用，使用本地儲存');
            return;
          }
          console.error('同步到 Firebase 失敗:', error);
        });
      }
    } catch (error) {
      console.error('儲存設定失敗:', error);
      throw error;
    }
  }

  /**
   * 從 Firebase 載入設定
   */
  private async loadFromFirebase(): Promise<UserSettings | null> {
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) return null;
      
      // 假設使用者屬於某個組織
      const db = getFirebaseDb();
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      if (!userData?.organizationId) return null;
      
      const settingsRef = doc(
        db, 
        'organizations', 
        userData.organizationId, 
        'settings', 
        user.uid
      );
      
      const settingsDoc = await getDoc(settingsRef);
      if (!settingsDoc.exists()) return null;
      
      const data = settingsDoc.data();
      
      // 轉換 Firestore Timestamp 為 Date
      return {
        ...data,
        notifications: {
          ...data.notifications,
          lastUpdated: data.notifications?.lastUpdated?.toDate() || new Date()
        },
        lastSynced: data.lastSynced?.toDate() || new Date()
      } as UserSettings;
    } catch (error) {
      // 如果是權限錯誤，靜默處理
      if (error instanceof Error && error.message.includes('Missing or insufficient permissions')) {
        console.log('Firebase 設定同步暫時無法使用，使用本地儲存');
        return null;
      }
      console.error('從 Firebase 載入設定失敗:', error);
      return null;
    }
  }

  /**
   * 同步設定到 Firebase
   */
  private async syncToFirebase(settings: UserSettings): Promise<void> {
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) return;
      
      this.syncInProgress = true;
      
      // 獲取使用者組織
      const db = getFirebaseDb();
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      if (!userData?.organizationId) {
        this.syncInProgress = false;
        return;
      }
      
      const settingsRef = doc(
        db, 
        'organizations', 
        userData.organizationId, 
        'settings', 
        user.uid
      );
      
      // 準備要儲存的資料
      const dataToSave = {
        ...settings,
        notifications: {
          ...settings.notifications,
          lastUpdated: settings.notifications.lastUpdated ? 
            Timestamp.fromDate(new Date(settings.notifications.lastUpdated)) : 
            serverTimestamp()
        },
        lastSynced: serverTimestamp(),
        userId: user.uid,
        updatedAt: serverTimestamp()
      };
      
      await setDoc(settingsRef, dataToSave, { merge: true });
    } catch (error) {
      // 如果是權限錯誤，靜默處理
      if (error instanceof Error && error.message.includes('Missing or insufficient permissions')) {
        console.log('Firebase 設定同步暫時無法使用，使用本地儲存');
        return;
      }
      console.error('同步到 Firebase 失敗:', error);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * 與 Firebase 同步
   * 比較本地和遠端版本，使用較新的
   */
  async syncWithFirebase(): Promise<void> {
    try {
      if (this.syncInProgress) return;
      
      const localSettings = await this.loadSettings();
      const remoteSettings = await this.loadFromFirebase();
      
      if (!remoteSettings) {
        // 遠端沒有設定，上傳本地設定
        await this.syncToFirebase(localSettings);
        return;
      }
      
      // 比較最後同步時間，使用較新的版本
      const localTime = localSettings.lastSynced?.getTime() || 0;
      const remoteTime = remoteSettings.lastSynced?.getTime() || 0;
      
      if (localTime > remoteTime) {
        // 本地較新，上傳到遠端
        await this.syncToFirebase(localSettings);
      } else if (remoteTime > localTime) {
        // 遠端較新，儲存到本地
        await AsyncStorage.setItem(
          this.STORAGE_KEY, 
          JSON.stringify(remoteSettings)
        );
      }
    } catch (error) {
      // 如果是權限錯誤，靜默處理（避免過多錯誤訊息）
      if (error instanceof Error && error.message.includes('Missing or insufficient permissions')) {
        console.log('Firebase 設定同步暫時無法使用，使用本地儲存');
        return;
      }
      console.error('同步失敗:', error);
      throw error;
    }
  }

  /**
   * 重置為預設設定
   */
  async resetToDefaults(): Promise<void> {
    try {
      await this.saveSettings(DEFAULT_SETTINGS);
    } catch (error) {
      console.error('重置設定失敗:', error);
      throw error;
    }
  }

  /**
   * 清除本地設定快取
   */
  async clearLocalCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('清除本地快取失敗:', error);
      throw error;
    }
  }
}

// 匯出單例實例
export const settingsService = new SettingsServiceImpl();