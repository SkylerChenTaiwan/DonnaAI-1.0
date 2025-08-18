/**
 * 通知服務引擎
 * 管理通知的創建、發送和狀態追蹤
 */

import { db, admin } from '@/lib/firebase/admin';
import { 
  BaseNotification, 
  NotificationEventType, 
  NotificationChannel, 
  NotificationPriority, 
  NotificationStatus,
  NotificationPreferences,
  NotificationRule,
  NotificationBatch
} from './notification-types';
import { DashboardCacheManager } from '@/lib/cache/dashboard-cache-manager';
import { RedisManager } from '@/lib/cache/redis-manager';

/**
 * 通知服務主類
 */
export class NotificationService {
  private cacheManager: DashboardCacheManager;
  private redisManager: RedisManager;
  private batchQueue: Map<string, BaseNotification[]> = new Map();
  private processingBatch = false;

  constructor() {
    this.cacheManager = new DashboardCacheManager();
    this.redisManager = new RedisManager();
  }

  /**
   * 發送單個通知
   */
  async sendNotification(notification: Omit<BaseNotification, 'id' | 'status' | 'attempts' | 'createdAt'>): Promise<string> {
    const notificationId = this.generateNotificationId();
    
    const fullNotification: BaseNotification = {
      id: notificationId,
      ...notification,
      status: NotificationStatus.PENDING,
      attempts: 0,
      createdAt: new Date(),
    };

    // 1. 儲存到 Firestore
    await db.collection('notifications').doc(notificationId).set(fullNotification);

    // 2. 檢查使用者偏好設定
    const preferences = await this.getUserPreferences(notification.recipientId);
    if (!this.shouldSendNotification(fullNotification, preferences)) {
      await this.updateNotificationStatus(notificationId, NotificationStatus.FAILED, '使用者偏好設定不允許');
      return notificationId;
    }

    // 3. 加入處理佇列
    await this.queueNotificationForProcessing(fullNotification);

    // 4. 立即處理高優先級通知
    if (notification.priority === NotificationPriority.URGENT || notification.priority === NotificationPriority.CRITICAL) {
      await this.processNotificationImmediately(fullNotification);
    }

    return notificationId;
  }

  /**
   * 批次發送通知
   */
  async sendBatchNotifications(
    notifications: Omit<BaseNotification, 'id' | 'status' | 'attempts' | 'createdAt'>[],
    organizationId: string,
    eventType: NotificationEventType
  ): Promise<string> {
    const batchId = this.generateBatchId();
    
    const batch: NotificationBatch = {
      id: batchId,
      organizationId,
      eventType,
      notifications: notifications.map(notification => ({
        id: this.generateNotificationId(),
        ...notification,
        status: NotificationStatus.PENDING,
        attempts: 0,
        createdAt: new Date(),
      })),
      totalRecipients: notifications.length,
      status: 'pending',
      progress: {
        processed: 0,
        successful: 0,
        failed: 0,
        percentage: 0,
      },
      createdAt: new Date(),
      errors: [],
    };

    // 儲存批次資訊
    await db.collection('notification-batches').doc(batchId).set(batch);

    // 儲存個別通知
    const firestoreBatch = db.batch();
    batch.notifications.forEach(notification => {
      const ref = db.collection('notifications').doc(notification.id);
      firestoreBatch.set(ref, notification);
    });
    await firestoreBatch.commit();

    // 加入批次處理佇列
    this.batchQueue.set(batchId, batch.notifications);
    this.processBatchQueue();

    return batchId;
  }

  /**
   * 觸發事件通知
   */
  async triggerEventNotification(
    eventType: NotificationEventType,
    data: Record<string, any>,
    organizationId: string,
    additionalRecipients: string[] = []
  ): Promise<void> {
    // 1. 查找適用的通知規則
    const rules = await this.getNotificationRules(organizationId, eventType);
    
    // 2. 為每個規則生成通知
    const notifications: Omit<BaseNotification, 'id' | 'status' | 'attempts' | 'createdAt'>[] = [];
    
    for (const rule of rules) {
      if (!rule.enabled || !this.checkRuleConditions(rule, data)) {
        continue;
      }

      // 確定收件人
      const recipients = await this.resolveRecipients(rule.target, organizationId);
      recipients.push(...additionalRecipients);

      // 為每個收件人創建通知
      for (const recipientId of recipients) {
        const notification: Omit<BaseNotification, 'id' | 'status' | 'attempts' | 'createdAt'> = {
          eventType,
          title: this.interpolateTemplate(rule.template.title, data),
          message: this.interpolateTemplate(rule.template.message, data),
          priority: rule.template.priority,
          channels: rule.template.channels,
          recipientId,
          recipientType: 'user',
          organizationId,
          data,
          metadata: {
            sourceId: data.sourceId,
            sourceType: data.sourceType,
            actionUrl: data.actionUrl,
          },
          maxRetries: 3,
        };

        notifications.push(notification);
      }
    }

    // 3. 批次發送通知
    if (notifications.length > 0) {
      await this.sendBatchNotifications(notifications, organizationId, eventType);
    }
  }

  /**
   * 處理 Dashboard 資料更新通知
   */
  async notifyDashboardDataUpdate(
    organizationId: string,
    updateType: 'metrics' | 'trends' | 'team_status' | 'ai_insights',
    changes: Record<string, any>
  ): Promise<void> {
    const eventData = {
      updateType,
      changes,
      timestamp: new Date().toISOString(),
      sourceId: organizationId,
      sourceType: 'dashboard',
      actionUrl: '/dashboard',
    };

    await this.triggerEventNotification(
      NotificationEventType.DASHBOARD_DATA_UPDATED,
      eventData,
      organizationId
    );
  }

  /**
   * 立即處理通知
   */
  private async processNotificationImmediately(notification: BaseNotification): Promise<void> {
    try {
      // 更新狀態為處理中
      await this.updateNotificationStatus(notification.id, NotificationStatus.PENDING);

      // 根據渠道發送通知
      const results = await Promise.allSettled(
        notification.channels.map(channel => this.sendToChannel(notification, channel))
      );

      // 檢查發送結果
      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;

      if (successful > 0) {
        await this.updateNotificationStatus(notification.id, NotificationStatus.SENT);
      } else {
        await this.updateNotificationStatus(notification.id, NotificationStatus.FAILED, '所有渠道發送失敗');
      }

      // 記錄統計
      await this.recordNotificationStats(notification, successful > 0);

    } catch (error) {
      console.error('Process notification error:', error);
      await this.updateNotificationStatus(notification.id, NotificationStatus.FAILED, error.message);
    }
  }

  /**
   * 透過特定渠道發送通知
   */
  private async sendToChannel(notification: BaseNotification, channel: NotificationChannel): Promise<boolean> {
    switch (channel) {
      case NotificationChannel.IN_APP:
        return this.sendInAppNotification(notification);
      
      case NotificationChannel.EMAIL:
        return this.sendEmailNotification(notification);
      
      case NotificationChannel.PUSH:
        return this.sendPushNotification(notification);
      
      case NotificationChannel.WEBHOOK:
        return this.sendWebhookNotification(notification);
      
      case NotificationChannel.SLACK:
        return this.sendSlackNotification(notification);
      
      default:
        console.warn('Unsupported notification channel:', channel);
        return false;
    }
  }

  /**
   * 發送應用內通知
   */
  private async sendInAppNotification(notification: BaseNotification): Promise<boolean> {
    try {
      // 儲存到使用者的通知集合
      const userNotificationRef = db
        .collection('users')
        .doc(notification.recipientId)
        .collection('notifications')
        .doc(notification.id);

      await userNotificationRef.set({
        ...notification,
        sentAt: new Date(),
        channel: NotificationChannel.IN_APP,
      });

      // 更新使用者的未讀計數
      await this.updateUnreadCount(notification.recipientId);

      return true;
    } catch (error) {
      console.error('Send in-app notification error:', error);
      return false;
    }
  }

  /**
   * 發送電子郵件通知
   */
  private async sendEmailNotification(notification: BaseNotification): Promise<boolean> {
    try {
      // TODO: 整合電子郵件服務（如 SendGrid, AWS SES 等）
      console.log('Sending email notification:', notification);
      return true;
    } catch (error) {
      console.error('Send email notification error:', error);
      return false;
    }
  }

  /**
   * 發送推送通知
   */
  private async sendPushNotification(notification: BaseNotification): Promise<boolean> {
    try {
      // 獲取使用者的 FCM tokens
      const userDoc = await db.collection('users').doc(notification.recipientId).get();
      const userData = userDoc.data();
      const fcmTokens = userData?.fcmTokens || [];

      if (fcmTokens.length === 0) {
        return false;
      }

      // 發送 FCM 訊息
      const message = {
        notification: {
          title: notification.title,
          body: notification.message,
        },
        data: {
          notificationId: notification.id,
          eventType: notification.eventType,
          ...notification.data,
        },
        tokens: fcmTokens,
      };

      const response = await admin.messaging().sendMulticast(message);
      
      // 清理無效的 token
      if (response.failureCount > 0) {
        const validTokens = fcmTokens.filter((_, index) => 
          !response.responses[index]?.error
        );
        
        if (validTokens.length !== fcmTokens.length) {
          await userDoc.ref.update({ fcmTokens: validTokens });
        }
      }

      return response.successCount > 0;
    } catch (error) {
      console.error('Send push notification error:', error);
      return false;
    }
  }

  /**
   * 發送 Webhook 通知
   */
  private async sendWebhookNotification(notification: BaseNotification): Promise<boolean> {
    try {
      // TODO: 實作 Webhook 發送邏輯
      console.log('Sending webhook notification:', notification);
      return true;
    } catch (error) {
      console.error('Send webhook notification error:', error);
      return false;
    }
  }

  /**
   * 發送 Slack 通知
   */
  private async sendSlackNotification(notification: BaseNotification): Promise<boolean> {
    try {
      // TODO: 整合 Slack API
      console.log('Sending Slack notification:', notification);
      return true;
    } catch (error) {
      console.error('Send Slack notification error:', error);
      return false;
    }
  }

  /**
   * 獲取使用者通知偏好
   */
  private async getUserPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      const doc = await db.collection('notification-preferences').doc(userId).get();
      return doc.exists ? doc.data() as NotificationPreferences : null;
    } catch (error) {
      console.error('Get user preferences error:', error);
      return null;
    }
  }

  /**
   * 檢查是否應該發送通知
   */
  private shouldSendNotification(
    notification: BaseNotification, 
    preferences: NotificationPreferences | null
  ): boolean {
    if (!preferences || !preferences.enabled) {
      return true; // 預設允許
    }

    const eventPrefs = preferences.eventPreferences[notification.eventType];
    if (!eventPrefs?.enabled) {
      return false;
    }

    // 檢查勿擾時段
    if (preferences.doNotDisturbHours) {
      const now = new Date();
      const timeStr = now.toTimeString().slice(0, 5); // HH:mm format
      
      if (timeStr >= preferences.doNotDisturbHours.start && 
          timeStr <= preferences.doNotDisturbHours.end) {
        // 只有緊急通知可以在勿擾時段發送
        return notification.priority === NotificationPriority.URGENT || 
               notification.priority === NotificationPriority.CRITICAL;
      }
    }

    return true;
  }

  /**
   * 獲取通知規則
   */
  private async getNotificationRules(
    organizationId: string, 
    eventType: NotificationEventType
  ): Promise<NotificationRule[]> {
    try {
      const snapshot = await db
        .collection('notification-rules')
        .where('organizationId', '==', organizationId)
        .where('trigger.eventType', '==', eventType)
        .where('enabled', '==', true)
        .get();

      return snapshot.docs.map(doc => doc.data() as NotificationRule);
    } catch (error) {
      console.error('Get notification rules error:', error);
      return [];
    }
  }

  /**
   * 檢查規則條件
   */
  private checkRuleConditions(rule: NotificationRule, data: Record<string, any>): boolean {
    const conditions = rule.trigger.conditions;
    
    for (const [key, value] of Object.entries(conditions)) {
      if (data[key] !== value) {
        return false;
      }
    }

    return true;
  }

  /**
   * 解析收件人
   */
  private async resolveRecipients(
    target: NotificationRule['target'], 
    organizationId: string
  ): Promise<string[]> {
    const recipients: string[] = [];

    switch (target.recipientType) {
      case 'user':
        recipients.push(...target.recipients);
        break;

      case 'role':
        for (const role of target.recipients) {
          const users = await this.getUsersByRole(organizationId, role);
          recipients.push(...users);
        }
        break;

      case 'department':
        for (const deptId of target.recipients) {
          const users = await this.getUsersByDepartment(organizationId, deptId);
          recipients.push(...users);
        }
        break;

      case 'custom':
        // TODO: 實作自訂查詢邏輯
        break;
    }

    return [...new Set(recipients)]; // 去重
  }

  /**
   * 根據角色獲取使用者
   */
  private async getUsersByRole(organizationId: string, role: string): Promise<string[]> {
    try {
      const snapshot = await db
        .collection('users')
        .where('organizationId', '==', organizationId)
        .where('role', '==', role)
        .where('disabled', '==', false)
        .get();

      return snapshot.docs.map(doc => doc.id);
    } catch (error) {
      console.error('Get users by role error:', error);
      return [];
    }
  }

  /**
   * 根據部門獲取使用者
   */
  private async getUsersByDepartment(organizationId: string, departmentId: string): Promise<string[]> {
    try {
      const snapshot = await db
        .collection('users')
        .where('organizationId', '==', organizationId)
        .where('departments', 'array-contains', departmentId)
        .where('disabled', '==', false)
        .get();

      return snapshot.docs.map(doc => doc.id);
    } catch (error) {
      console.error('Get users by department error:', error);
      return [];
    }
  }

  /**
   * 批次處理佇列
   */
  private async processBatchQueue(): Promise<void> {
    if (this.processingBatch) {
      return;
    }

    this.processingBatch = true;

    try {
      for (const [batchId, notifications] of this.batchQueue.entries()) {
        await this.processBatch(batchId, notifications);
        this.batchQueue.delete(batchId);
      }
    } finally {
      this.processingBatch = false;
    }
  }

  /**
   * 處理批次通知
   */
  private async processBatch(batchId: string, notifications: BaseNotification[]): Promise<void> {
    const batchRef = db.collection('notification-batches').doc(batchId);
    
    // 更新批次狀態為處理中
    await batchRef.update({
      status: 'processing',
      startedAt: new Date(),
    });

    let processed = 0;
    let successful = 0;
    let failed = 0;
    const errors: any[] = [];

    for (const notification of notifications) {
      try {
        await this.processNotificationImmediately(notification);
        successful++;
      } catch (error) {
        failed++;
        errors.push({
          recipientId: notification.recipientId,
          error: error.message,
          timestamp: new Date(),
        });
      }

      processed++;

      // 定期更新進度
      if (processed % 10 === 0 || processed === notifications.length) {
        await batchRef.update({
          progress: {
            processed,
            successful,
            failed,
            percentage: Math.round((processed / notifications.length) * 100),
          },
          errors: errors.slice(-100), // 只保留最近 100 個錯誤
        });
      }
    }

    // 最終狀態更新
    await batchRef.update({
      status: 'completed',
      completedAt: new Date(),
      progress: {
        processed,
        successful,
        failed,
        percentage: 100,
      },
      errors,
    });
  }

  /**
   * 更新通知狀態
   */
  private async updateNotificationStatus(
    notificationId: string, 
    status: NotificationStatus, 
    error?: string
  ): Promise<void> {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === NotificationStatus.SENT) {
      updateData.sentAt = new Date();
    } else if (status === NotificationStatus.DELIVERED) {
      updateData.deliveredAt = new Date();
    } else if (status === NotificationStatus.FAILED && error) {
      updateData.lastError = error;
      updateData.errorDetails = { timestamp: new Date(), message: error };
    }

    await db.collection('notifications').doc(notificationId).update(updateData);
  }

  /**
   * 記錄通知統計
   */
  private async recordNotificationStats(notification: BaseNotification, success: boolean): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const statsKey = `notification-stats:${notification.organizationId}:${today}`;

    try {
      // 更新 Redis 統計
      await this.redisManager.hincrby(statsKey, 'total_sent', 1);
      
      if (success) {
        await this.redisManager.hincrby(statsKey, 'total_delivered', 1);
      } else {
        await this.redisManager.hincrby(statsKey, 'total_failed', 1);
      }

      await this.redisManager.hincrby(statsKey, `channel_${notification.channels[0]}_sent`, 1);
      await this.redisManager.hincrby(statsKey, `event_${notification.eventType}_count`, 1);
      await this.redisManager.hincrby(statsKey, `priority_${notification.priority}_count`, 1);

      // 設置過期時間（30天）
      await this.redisManager.expire(statsKey, 30 * 24 * 60 * 60);
    } catch (error) {
      console.error('Record notification stats error:', error);
    }
  }

  /**
   * 更新未讀計數
   */
  private async updateUnreadCount(userId: string): Promise<void> {
    try {
      const userRef = db.collection('users').doc(userId);
      await userRef.update({
        'notificationCount.unread': admin.firestore.FieldValue.increment(1),
        'notificationCount.lastUpdated': new Date(),
      });
    } catch (error) {
      console.error('Update unread count error:', error);
    }
  }

  /**
   * 加入處理佇列
   */
  private async queueNotificationForProcessing(notification: BaseNotification): Promise<void> {
    // 根據優先級決定處理延遲
    const delay = this.getProcessingDelay(notification.priority);
    
    // TODO: 整合訊息佇列（如 Redis Queue, Bull 等）
    // 這裡暫時使用 setTimeout 模擬
    setTimeout(async () => {
      await this.processNotificationImmediately(notification);
    }, delay);
  }

  /**
   * 獲取處理延遲時間
   */
  private getProcessingDelay(priority: NotificationPriority): number {
    switch (priority) {
      case NotificationPriority.CRITICAL:
        return 0; // 立即處理
      case NotificationPriority.URGENT:
        return 100; // 100ms
      case NotificationPriority.HIGH:
        return 1000; // 1s
      case NotificationPriority.NORMAL:
        return 5000; // 5s
      case NotificationPriority.LOW:
        return 30000; // 30s
      default:
        return 5000;
    }
  }

  /**
   * 插值模板
   */
  private interpolateTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }

  /**
   * 生成通知 ID
   */
  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 生成批次 ID
   */
  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// 單例模式
let notificationServiceInstance: NotificationService | null = null;

export function getNotificationService(): NotificationService {
  if (!notificationServiceInstance) {
    notificationServiceInstance = new NotificationService();
  }
  return notificationServiceInstance;
}