/**
 * 推播通知服務
 * 處理會議提醒、錄音通知和其他系統通知
 */

import { Notifications, AndroidImportance } from './notifications/NotificationService';
import * as Device from 'expo-device';
import { Platform, Linking, Alert } from 'react-native';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getFirebaseDb } from './firebase/config';
import { MeetingReminder } from '../types/record';
import { settingsService } from './settings';

// 設定通知處理器 - 檢查設定決定是否顯示通知
Notifications.setNotificationHandler({
  handleNotification: async () => {
    // 檢查使用者設定
    const settings = await settingsService.loadSettings();
    const notificationsEnabled = settings.notifications.enabled;
    
    return {
      shouldShowAlert: notificationsEnabled,
      shouldPlaySound: notificationsEnabled,
      shouldSetBadge: notificationsEnabled,
    };
  },
});

export interface NotificationData {
  type: 'meeting_reminder' | 'recording_reminder' | 'ai_processing_complete';
  recordId?: string;
  meetingId?: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  trigger: Date;
  data?: Record<string, any>;
}

class NotificationService {
  private expoPushToken: string | null = null;
  private isInitialized = false;

  /**
   * 初始化通知服務
   */
  async initialize(): Promise<boolean> {
    try {
      // 檢查設備是否支持推送通知
      if (!Device.isDevice) {
        console.warn('推播通知只能在實體設備上運行');
        return false;
      }

      // 請求權限
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('推播通知權限被拒絕');
        return false;
      }

      // 獲取推送令牌
      try {
        const token = (await Notifications.getExpoPushTokenAsync({
          projectId: 'your-expo-project-id', // 需要替換為實際的 Expo Project ID
        })).data;
        
        this.expoPushToken = token;
        console.log('Expo Push Token:', token);
      } catch (error) {
        console.error('獲取推送令牌失敗:', error);
        return false;
      }

      // Android 特定設定
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('meeting-reminders', {
          name: '會議提醒',
          importance: AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#2563eb',
        });

        await Notifications.setNotificationChannelAsync('recording-reminders', {
          name: '錄音提醒',
          importance: AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#ef4444',
        });

        await Notifications.setNotificationChannelAsync('ai-processing', {
          name: 'AI 處理通知',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250],
          lightColor: '#22c55e',
        });
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('通知服務初始化失敗:', error);
      return false;
    }
  }

  /**
   * 獲取推送令牌
   */
  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * 註冊用戶的推送令牌到 Firebase
   */
  async registerUserToken(userId: string): Promise<void> {
    if (!this.expoPushToken) {
      throw new Error('推送令牌尚未獲取');
    }

    try {
      await setDoc(doc(getFirebaseDb(), 'user_push_tokens', userId), {
        token: this.expoPushToken,
        platform: Platform.OS,
        updatedAt: new Date(),
        active: true,
      });
      
      console.log('用戶推送令牌已註冊');
    } catch (error) {
      console.error('註冊用戶推送令牌失敗:', error);
      throw error;
    }
  }

  /**
   * 立即發送本地通知
   */
  async sendLocalNotification(notification: NotificationData): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('通知服務尚未初始化');
    }

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: {
            type: notification.type,
            recordId: notification.recordId,
            meetingId: notification.meetingId,
            ...notification.data,
          },
        },
        trigger: null, // 立即發送
      });

      return notificationId;
    } catch (error) {
      console.error('發送本地通知失敗:', error);
      throw error;
    }
  }

  /**
   * 排程本地通知
   */
  async scheduleLocalNotification(notification: ScheduledNotification): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('通知服務尚未初始化');
    }

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
        },
        trigger: {
          date: notification.trigger,
        },
      });

      return notificationId;
    } catch (error) {
      console.error('排程本地通知失敗:', error);
      throw error;
    }
  }

  /**
   * 取消排程的通知
   */
  async cancelScheduledNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('取消排程通知失敗:', error);
      throw error;
    }
  }

  /**
   * 取消所有排程的通知
   */
  async cancelAllScheduledNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('取消所有排程通知失敗:', error);
      throw error;
    }
  }

  /**
   * 排程會議提醒通知
   */
  async scheduleMeetingReminder(
    meetingId: string,
    userId: string,
    meetingTitle: string,
    meetingTime: Date,
    reminderMinutes: number = 15
  ): Promise<MeetingReminder> {
    const reminderId = `meeting_${meetingId}_${Date.now()}`;
    const reminderTime = new Date(meetingTime.getTime() - reminderMinutes * 60 * 1000);

    // 檢查提醒時間是否在未來
    if (reminderTime <= new Date()) {
      throw new Error('會議提醒時間必須在未來');
    }

    try {
      // 排程本地通知
      const notificationId = await this.scheduleLocalNotification({
        id: reminderId,
        title: '會議提醒',
        body: `會議「${meetingTitle}」將在 ${reminderMinutes} 分鐘後開始，記得開始錄音！`,
        trigger: reminderTime,
        data: {
          type: 'meeting_reminder',
          meetingId,
          action: 'start_recording',
        },
      });

      // 儲存到 Firebase
      const reminder: MeetingReminder = {
        id: reminderId,
        meetingId,
        userId,
        scheduledTime: reminderTime as any, // Firestore Timestamp
        reminderType: 'pre_meeting',
        notificationSent: false,
      };

      await setDoc(doc(getFirebaseDb(), 'meeting_reminders', reminderId), {
        ...reminder,
        notificationId,
        createdAt: new Date(),
      });

      return reminder;
    } catch (error) {
      console.error('排程會議提醒失敗:', error);
      throw error;
    }
  }

  /**
   * 發送錄音提醒通知
   */
  async sendRecordingReminder(meetingTitle: string): Promise<void> {
    await this.sendLocalNotification({
      type: 'recording_reminder',
      title: '錄音提醒',
      body: `別忘了為會議「${meetingTitle}」開始錄音！`,
      data: {
        action: 'open_recorder',
      },
    });
  }

  /**
   * 發送 AI 處理完成通知
   */
  async sendAIProcessingComplete(recordId: string, meetingTitle: string): Promise<void> {
    await this.sendLocalNotification({
      type: 'ai_processing_complete',
      recordId,
      title: 'AI 分析完成',
      body: `會議「${meetingTitle}」的 AI 分析已完成，請檢視結果！`,
      data: {
        action: 'view_results',
        recordId,
      },
    });
  }

  /**
   * 獲取用戶的所有會議提醒
   */
  async getUserMeetingReminders(userId: string): Promise<MeetingReminder[]> {
    try {
      const q = query(
        collection(getFirebaseDb(), 'meeting_reminders'),
        where('userId', '==', userId),
        where('notificationSent', '==', false)
      );
      
      const querySnapshot = await getDocs(q);
      const reminders: MeetingReminder[] = [];
      
      querySnapshot.forEach((doc) => {
        reminders.push({ id: doc.id, ...doc.data() } as MeetingReminder);
      });
      
      return reminders;
    } catch (error) {
      console.error('獲取會議提醒失敗:', error);
      throw error;
    }
  }

  /**
   * 標記會議提醒為已發送
   */
  async markReminderAsSent(reminderId: string, userResponse?: string): Promise<void> {
    try {
      await updateDoc(doc(getFirebaseDb(), 'meeting_reminders', reminderId), {
        notificationSent: true,
        sentAt: new Date(),
        userResponse: userResponse || null,
      });
    } catch (error) {
      console.error('標記會議提醒狀態失敗:', error);
      throw error;
    }
  }

  /**
   * 獲取所有排程的通知
   */
  async getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('獲取排程通知失敗:', error);
      throw error;
    }
  }

  /**
   * 清理過期的會議提醒
   */
  async cleanupExpiredReminders(): Promise<void> {
    try {
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 7); // 7天前的提醒

      const q = query(
        collection(getFirebaseDb(), 'meeting_reminders'),
        where('scheduledTime', '<', expiredDate)
      );
      
      const querySnapshot = await getDocs(q);
      
      for (const docSnapshot of querySnapshot.docs) {
        const reminderData = docSnapshot.data();
        
        // 取消排程的通知
        if (reminderData.notificationId) {
          await this.cancelScheduledNotification(reminderData.notificationId);
        }
        
        // 刪除 Firebase 記錄（這裡可以選擇標記為已清理而不是刪除）
        await updateDoc(doc(getFirebaseDb(), 'meeting_reminders', docSnapshot.id), {
          cleaned: true,
          cleanedAt: new Date(),
        });
      }
      
      console.log(`清理了 ${querySnapshot.size} 個過期的會議提醒`);
    } catch (error) {
      console.error('清理過期會議提醒失敗:', error);
      throw error;
    }
  }

  /**
   * 啟用推播通知
   * 檢查權限並引導使用者授權
   */
  async enableNotifications(): Promise<boolean> {
    try {
      // 檢查設備是否支持推送通知
      if (!Device.isDevice) {
        Alert.alert(
          '不支援推播通知',
          '推播通知只能在實體設備上運行',
          [{ text: '確定' }]
        );
        return false;
      }

      // 檢查當前權限狀態
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      
      if (existingStatus === 'granted') {
        // 已有權限，直接返回成功
        return true;
      }

      if (existingStatus === 'denied') {
        // 權限被拒絕，引導使用者到系統設定
        Alert.alert(
          '需要通知權限',
          '請在系統設定中允許此應用程式發送通知',
          [
            { text: '取消', style: 'cancel' },
            { 
              text: '前往設定', 
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              }
            }
          ]
        );
        return false;
      }

      // 請求權限
      const { status } = await Notifications.requestPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          '通知權限被拒絕',
          '您將無法收到會議提醒和其他重要通知',
          [{ text: '確定' }]
        );
        return false;
      }

      // 初始化通知服務（如果尚未初始化）
      if (!this.isInitialized) {
        await this.initialize();
      }

      return true;
    } catch (error) {
      console.error('啟用通知失敗:', error);
      Alert.alert(
        '啟用通知失敗',
        '請稍後再試',
        [{ text: '確定' }]
      );
      return false;
    }
  }

  /**
   * 停用推播通知
   * 取消所有排程的通知但保留權限
   */
  async disableNotifications(): Promise<void> {
    try {
      // 取消所有排程的通知
      await this.cancelAllScheduledNotifications();
      
      // 注意：我們不撤銷系統權限，只是在應用層面停用通知
      // 使用者可以隨時在設定中重新啟用
      console.log('推播通知已停用');
    } catch (error) {
      console.error('停用通知失敗:', error);
      throw error;
    }
  }

  /**
   * 檢查通知權限狀態
   */
  async checkNotificationPermissions(): Promise<{
    granted: boolean;
    canAskAgain: boolean;
  }> {
    try {
      const { status, canAskAgain } = await Notifications.getPermissionsAsync();
      
      return {
        granted: status === 'granted',
        canAskAgain: canAskAgain ?? false,
      };
    } catch (error) {
      console.error('檢查通知權限失敗:', error);
      return {
        granted: false,
        canAskAgain: false,
      };
    }
  }

  /**
   * 獲取通知設定狀態
   */
  async getNotificationStatus(): Promise<{
    permissionGranted: boolean;
    notificationsEnabled: boolean;
    scheduledCount: number;
  }> {
    try {
      const { granted } = await this.checkNotificationPermissions();
      const settings = await settingsService.loadSettings();
      const scheduledNotifications = await this.getAllScheduledNotifications();
      
      return {
        permissionGranted: granted,
        notificationsEnabled: settings.notifications.enabled,
        scheduledCount: scheduledNotifications.length,
      };
    } catch (error) {
      console.error('獲取通知狀態失敗:', error);
      return {
        permissionGranted: false,
        notificationsEnabled: false,
        scheduledCount: 0,
      };
    }
  }
}

// 匯出單例實例
export const notificationService = new NotificationService();

// 便利函數
export const initializeNotifications = () => notificationService.initialize();
export const registerPushToken = (userId: string) => notificationService.registerUserToken(userId);
export const scheduleMeetingReminder = (
  meetingId: string,
  userId: string,
  meetingTitle: string,
  meetingTime: Date,
  reminderMinutes?: number
) => notificationService.scheduleMeetingReminder(meetingId, userId, meetingTitle, meetingTime, reminderMinutes);

// 新增的通知控制函數
export const enableNotifications = () => notificationService.enableNotifications();
export const disableNotifications = () => notificationService.disableNotifications();
export const checkNotificationPermissions = () => notificationService.checkNotificationPermissions();
export const getNotificationStatus = () => notificationService.getNotificationStatus();