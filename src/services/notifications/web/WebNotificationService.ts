/**
 * Web 平台通知服務
 * 使用瀏覽器 Notification API 實現通知功能
 */

export interface WebNotificationPermissionsStatus {
  status: 'granted' | 'denied' | 'undetermined';
  ios?: {
    status: 'granted' | 'denied' | 'undetermined';
  };
  android?: {
    status: 'granted' | 'denied' | 'undetermined';
  };
}

export interface WebScheduledNotificationRequest {
  id: string;
  content: {
    title: string;
    body?: string;
    data?: Record<string, any>;
    badge?: number;
  };
  trigger: Date | { seconds: number };
}

export interface WebNotificationChannel {
  id: string;
  name: string;
  importance: number;
  vibrationPattern?: number[];
  lightColor?: string;
}

// Android 重要性等級模擬
export const AndroidImportance = {
  MIN: 1,
  LOW: 2,
  DEFAULT: 3,
  HIGH: 4,
  MAX: 5 };

class WebNotificationService {
  private static scheduledNotifications = new Map<string, any>();
  private static notificationChannels = new Map<string, WebNotificationChannel>();

  // 設定通知處理器（Web 版本）
  static notificationHandler: {
    handleNotification: () => Promise<{
      shouldShowAlert: boolean;
      shouldPlaySound: boolean;
      shouldSetBadge: boolean;
    }>;
  } | null = null;

  static setNotificationHandler(handler: {
    handleNotification: () => Promise<{
      shouldShowAlert: boolean;
      shouldPlaySound: boolean;
      shouldSetBadge: boolean;
    }>;
  }): void {
    this.notificationHandler = handler;
  }

  // 獲取權限狀態
  static async getPermissionsAsync(): Promise<WebNotificationPermissionsStatus> {
    if (!('Notification' in window)) {
      return { status: 'denied' };
    }

    switch (Notification.permission) {
      case 'granted':
        return { status: 'granted' };
      case 'denied':
        return { status: 'denied' };
      default:
        return { status: 'undetermined' };
    }
  }

  // 請求權限
  static async requestPermissionsAsync(): Promise<WebNotificationPermissionsStatus> {
    if (!('Notification' in window)) {
      console.warn('此瀏覽器不支援通知功能');
      return { status: 'denied' };
    }

    try {
      const permission = await Notification.requestPermission();
      return {
        status: permission as 'granted' | 'denied' | 'undetermined' };
    } catch (error) {
      console.error('請求通知權限失敗:', error);
      return { status: 'denied' };
    }
  }

  // 獲取 Expo Push Token（Web 不支援，返回模擬值）
  static async getExpoPushTokenAsync(options?: any): Promise<{ data: string }> {
    // Web 平台不支援 Expo Push Token，返回一個模擬值
    return { data: 'ExponentPushToken[web-mock-token]' };
  }

  // 設定通知頻道（Android 特有功能，Web 版本僅儲存配置）
  static async setNotificationChannelAsync(
    channelId: string,
    channel: {
      name: string;
      importance?: number;
      vibrationPattern?: number[];
      lightColor?: string;
    }
  ): Promise<void> {
    this.notificationChannels.set(channelId, {
      id: channelId,
      name: channel.name,
      importance: channel.importance || AndroidImportance.DEFAULT,
      vibrationPattern: channel.vibrationPattern,
      lightColor: channel.lightColor });
  }

  // 排程本地通知
  static async scheduleNotificationAsync(
    request: WebScheduledNotificationRequest
  ): Promise<string> {
    const { id, content, trigger } = request;

    // 計算延遲時間
    let delay = 0;
    if (trigger instanceof Date) {
      delay = Math.max(0, trigger.getTime() - Date.now());
    } else if (typeof trigger === 'object' && 'seconds' in trigger) {
      delay = trigger.seconds * 1000;
    }

    // 設定定時器
    const timeoutId = setTimeout(async () => {
      // 檢查處理器設定
      if (this.notificationHandler) {
        const settings = await this.notificationHandler.handleNotification();
        if (!settings.shouldShowAlert) {
          return;
        }
      }

      // 顯示通知
      if (Notification.permission === 'granted') {
        const notification = new Notification(content.title, {
          body: content.body,
          data: content.data,
          badge: content.badge,
          icon: '/assets/icon.png', // 使用應用程式圖標
          tag: id, // 使用 id 作為 tag 以避免重複通知
        });

        // 處理點擊事件
        notification.onclick = () => {
          window.focus();
          if (content.data) {
            // 可以在這裡處理通知點擊邏輯
            console.log('通知被點擊:', content.data);
          }
          notification.close();
        };
      }

      // 從排程列表中移除
      this.scheduledNotifications.delete(id);
    }, delay);

    // 儲存到排程列表
    this.scheduledNotifications.set(id, {
      timeoutId,
      request });

    return id;
  }

  // 取消排程通知
  static async cancelScheduledNotificationAsync(notificationId: string): Promise<void> {
    const scheduled = this.scheduledNotifications.get(notificationId);
    if (scheduled) {
      clearTimeout(scheduled.timeoutId);
      this.scheduledNotifications.delete(notificationId);
    }
  }

  // 取消所有排程通知
  static async cancelAllScheduledNotificationsAsync(): Promise<void> {
    for (const [id, scheduled] of this.scheduledNotifications) {
      clearTimeout(scheduled.timeoutId);
    }
    this.scheduledNotifications.clear();
  }

  // 獲取所有排程通知
  static async getAllScheduledNotificationsAsync(): Promise<WebScheduledNotificationRequest[]> {
    const notifications: WebScheduledNotificationRequest[] = [];
    for (const [id, scheduled] of this.scheduledNotifications) {
      notifications.push(scheduled.request);
    }
    return notifications;
  }

  // 立即顯示通知
  static async presentNotificationAsync(content: {
    title: string;
    body?: string;
    data?: Record<string, any>;
  }): Promise<void> {
    if (Notification.permission !== 'granted') {
      console.warn('通知權限未授予');
      return;
    }

    // 檢查處理器設定
    if (this.notificationHandler) {
      const settings = await this.notificationHandler.handleNotification();
      if (!settings.shouldShowAlert) {
        return;
      }
    }

    const notification = new Notification(content.title, {
      body: content.body,
      data: content.data,
      icon: '/assets/icon.png' });

    notification.onclick = () => {
      window.focus();
      if (content.data) {
        console.log('通知被點擊:', content.data);
      }
      notification.close();
    };
  }

  // 設定徽章數量（Web 不支援，僅記錄）
  static async setBadgeCountAsync(count: number): Promise<void> {
    console.log('設定徽章數量:', count);
    // Web 平台不支援應用程式徽章
  }

  // 獲取徽章數量（Web 不支援，返回 0）
  static async getBadgeCountAsync(): Promise<number> {
    return 0;
  }

  // 添加通知回應監聽器（Web 版本使用事件監聽）
  static addNotificationResponseReceivedListener(
    listener: (response: any) => void
  ): { remove: () => void } {
    // Web 平台通知點擊在創建時處理
    console.log('添加通知回應監聽器');
    return {
      remove: () => {
        console.log('移除通知回應監聽器');
      } };
  }

  // 添加通知接收監聽器
  static addNotificationReceivedListener(
    listener: (notification: any) => void
  ): { remove: () => void } {
    // Web 平台通知接收在創建時處理
    console.log('添加通知接收監聽器');
    return {
      remove: () => {
        console.log('移除通知接收監聽器');
      } };
  }
}

// 模擬 expo-notifications 的導出
export const Notifications = WebNotificationService;

// 導出便利方法
export const requestNotificationPermission = async (): Promise<boolean> => {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

export const isNotificationSupported = (): boolean => {
  return 'Notification' in window;
};

// 導出類型
export type { WebNotificationPermissionsStatus as NotificationPermissionsStatus };
export type { WebScheduledNotificationRequest as ScheduledNotificationRequest };