/**
 * 跨平台通知服務
 * 根據平台自動選擇合適的通知實作
 */

import { Platform } from 'react-native';

// 通用的權限狀態介面
export interface INotificationPermissionsStatus {
  status: 'granted' | 'denied' | 'undetermined';
}

// 通用的排程通知請求介面
export interface IScheduledNotificationRequest {
  id: string;
  content: {
    title: string;
    body?: string;
    data?: Record<string, any>;
    badge?: number;
  };
  trigger: Date | { seconds: number };
}

// 通用的通知服務介面
export interface INotificationService {
  setNotificationHandler(handler: {
    handleNotification: () => Promise<{
      shouldShowAlert: boolean;
      shouldPlaySound: boolean;
      shouldSetBadge: boolean;
    }>;
  }): void;
  
  getPermissionsAsync(): Promise<INotificationPermissionsStatus>;
  requestPermissionsAsync(): Promise<INotificationPermissionsStatus>;
  getExpoPushTokenAsync(options?: any): Promise<{ data: string }>;
  
  setNotificationChannelAsync(channelId: string, channel: {
    name: string;
    importance?: number;
    vibrationPattern?: number[];
    lightColor?: string;
  }): Promise<void>;
  
  scheduleNotificationAsync(request: IScheduledNotificationRequest): Promise<string>;
  cancelScheduledNotificationAsync(notificationId: string): Promise<void>;
  cancelAllScheduledNotificationsAsync(): Promise<void>;
  getAllScheduledNotificationsAsync(): Promise<IScheduledNotificationRequest[]>;
  
  presentNotificationAsync(content: {
    title: string;
    body?: string;
    data?: Record<string, any>;
  }): Promise<void>;
  
  setBadgeCountAsync(count: number): Promise<void>;
  getBadgeCountAsync(): Promise<number>;
  
  addNotificationResponseReceivedListener(listener: (response: any) => void): { remove: () => void };
  addNotificationReceivedListener(listener: (notification: any) => void): { remove: () => void };
  
  AndroidImportance?: {
    MIN: number;
    LOW: number;
    DEFAULT: number;
    HIGH: number;
    MAX: number;
  };
}

// 動態載入通知服務
let NotificationService: INotificationService;
let AndroidImportance: any;

if (Platform.OS === 'web') {
  // Web 平台使用 WebNotificationService
  const WebNotifications = require('./web/WebNotificationService');
  NotificationService = WebNotifications.Notifications;
  AndroidImportance = WebNotifications.AndroidImportance;
} else {
  // 原生平台使用 expo-notifications
  const ExpoNotifications = require('expo-notifications');
  NotificationService = ExpoNotifications;
  AndroidImportance = ExpoNotifications.AndroidImportance;
}

// 匯出統一的通知服務
export const Notifications = NotificationService;
export { AndroidImportance };

// 匯出便利方法
export const requestNotificationPermission = async (): Promise<boolean> => {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

export const scheduleNotification = async (
  title: string,
  body: string,
  triggerDate: Date,
  data?: Record<string, any>
): Promise<string> => {
  return Notifications.scheduleNotificationAsync({
    id: `notification-${Date.now()}`,
    content: {
      title,
      body,
      data },
    trigger: triggerDate });
};

export const cancelNotification = async (notificationId: string): Promise<void> => {
  return Notifications.cancelScheduledNotificationAsync(notificationId);
};

export const clearAllNotifications = async (): Promise<void> => {
  return Notifications.cancelAllScheduledNotificationsAsync();
};

// 檢查是否支援通知
export const isNotificationSupported = (): boolean => {
  if (Platform.OS === 'web') {
    return 'Notification' in window;
  }
  return true; // 原生平台總是支援
};