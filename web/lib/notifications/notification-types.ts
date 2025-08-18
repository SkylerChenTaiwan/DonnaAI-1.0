/**
 * 通知系統類型定義
 * 定義各種通知事件、渠道和配置
 */

// 通知事件類型
export enum NotificationEventType {
  // 儀表板事件
  DASHBOARD_DATA_UPDATED = 'dashboard.data.updated',
  DASHBOARD_METRICS_CHANGED = 'dashboard.metrics.changed',
  DASHBOARD_ALERT_TRIGGERED = 'dashboard.alert.triggered',
  
  // 任務事件
  TASK_CREATED = 'task.created',
  TASK_UPDATED = 'task.updated',
  TASK_COMPLETED = 'task.completed',
  TASK_ASSIGNED = 'task.assigned',
  TASK_OVERDUE = 'task.overdue',
  
  // 客戶事件
  CUSTOMER_CREATED = 'customer.created',
  CUSTOMER_UPDATED = 'customer.updated',
  CUSTOMER_STATUS_CHANGED = 'customer.status.changed',
  
  // 會議事件
  MEETING_SCHEDULED = 'meeting.scheduled',
  MEETING_STARTED = 'meeting.started',
  MEETING_COMPLETED = 'meeting.completed',
  MEETING_CANCELLED = 'meeting.cancelled',
  
  // 系統事件
  SYSTEM_MAINTENANCE = 'system.maintenance',
  SYSTEM_UPDATE = 'system.update',
  SYSTEM_ERROR = 'system.error',
  
  // 使用者事件
  USER_INVITED = 'user.invited',
  USER_JOINED = 'user.joined',
  USER_ROLE_CHANGED = 'user.role.changed',
  
  // 報告事件
  REPORT_GENERATED = 'report.generated',
  REPORT_SHARED = 'report.shared',
  
  // AI 事件
  AI_ANALYSIS_COMPLETED = 'ai.analysis.completed',
  AI_INSIGHTS_AVAILABLE = 'ai.insights.available'
}

// 通知渠道類型
export enum NotificationChannel {
  IN_APP = 'in_app',           // 應用內通知
  EMAIL = 'email',             // 電子郵件
  SMS = 'sms',                 // 簡訊
  PUSH = 'push',               // 推送通知
  WEBHOOK = 'webhook',         // Webhook
  SLACK = 'slack',             // Slack
  TEAMS = 'teams',             // Microsoft Teams
  DISCORD = 'discord'          // Discord
}

// 通知優先級
export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical'
}

// 通知狀態
export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  EXPIRED = 'expired'
}

// 基礎通知介面
export interface BaseNotification {
  id: string;
  eventType: NotificationEventType;
  title: string;
  message: string;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  
  // 目標資訊
  recipientId: string;
  recipientType: 'user' | 'role' | 'department' | 'organization';
  organizationId: string;
  departmentId?: string;
  
  // 資料和上下文
  data?: Record<string, any>;
  metadata?: {
    sourceId?: string;
    sourceType?: string;
    actionUrl?: string;
    expiresAt?: Date;
    tags?: string[];
  };
  
  // 狀態追蹤
  status: NotificationStatus;
  attempts: number;
  maxRetries: number;
  
  // 時間戳
  createdAt: Date;
  scheduledAt?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  
  // 錯誤資訊
  lastError?: string;
  errorDetails?: Record<string, any>;
}

// 應用內通知
export interface InAppNotification extends BaseNotification {
  channels: [NotificationChannel.IN_APP];
  ui?: {
    icon?: string;
    color?: string;
    avatar?: string;
    image?: string;
    showModal?: boolean;
    autoHide?: boolean;
    hideDelay?: number;
  };
}

// 電子郵件通知
export interface EmailNotification extends BaseNotification {
  channels: NotificationChannel[];
  email?: {
    subject: string;
    htmlContent?: string;
    textContent?: string;
    templateId?: string;
    templateData?: Record<string, any>;
    attachments?: Array<{
      filename: string;
      content: string | Buffer;
      contentType: string;
    }>;
    replyTo?: string;
    cc?: string[];
    bcc?: string[];
  };
}

// 推送通知
export interface PushNotification extends BaseNotification {
  channels: [NotificationChannel.PUSH];
  push?: {
    badge?: number;
    sound?: string;
    vibrate?: number[];
    actions?: Array<{
      action: string;
      title: string;
      icon?: string;
    }>;
    image?: string;
    silent?: boolean;
    tag?: string;
  };
}

// Webhook 通知
export interface WebhookNotification extends BaseNotification {
  channels: [NotificationChannel.WEBHOOK];
  webhook?: {
    url: string;
    method: 'POST' | 'PUT' | 'PATCH';
    headers?: Record<string, string>;
    timeout?: number;
    retryDelays?: number[];
    verifySSL?: boolean;
  };
}

// 通知模板
export interface NotificationTemplate {
  id: string;
  name: string;
  eventType: NotificationEventType;
  channels: NotificationChannel[];
  
  // 模板內容
  title: string;
  message: string;
  emailSubject?: string;
  emailTemplate?: string;
  
  // 條件和規則
  conditions?: {
    userRoles?: string[];
    organizationIds?: string[];
    departmentIds?: string[];
    customConditions?: Record<string, any>;
  };
  
  // 設定
  priority: NotificationPriority;
  enabled: boolean;
  throttling?: {
    maxPerHour?: number;
    maxPerDay?: number;
    cooldownMinutes?: number;
  };
  
  // 元資料
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  version: number;
}

// 通知偏好設定
export interface NotificationPreferences {
  userId: string;
  organizationId: string;
  
  // 全域設定
  enabled: boolean;
  globalChannels: NotificationChannel[];
  doNotDisturbHours?: {
    start: string; // HH:mm format
    end: string;
    timezone: string;
  };
  
  // 事件類型偏好
  eventPreferences: Record<NotificationEventType, {
    enabled: boolean;
    channels: NotificationChannel[];
    priority: NotificationPriority;
    grouping?: 'immediate' | 'batch' | 'digest';
    frequency?: 'real_time' | 'hourly' | 'daily' | 'weekly';
  }>;
  
  // 渠道特定設定
  channelSettings: {
    [NotificationChannel.EMAIL]?: {
      address: string;
      verified: boolean;
      digestFrequency: 'daily' | 'weekly';
      includeUnread: boolean;
    };
    [NotificationChannel.SMS]?: {
      phoneNumber: string;
      verified: boolean;
      onlyUrgent: boolean;
    };
    [NotificationChannel.PUSH]?: {
      tokens: string[];
      allowSound: boolean;
      allowVibration: boolean;
    };
    [NotificationChannel.SLACK]?: {
      webhookUrl: string;
      channelId: string;
      mentionUser: boolean;
    };
  };
  
  updatedAt: Date;
}

// 通知統計
export interface NotificationStats {
  organizationId: string;
  period: {
    start: Date;
    end: Date;
  };
  
  // 基本統計
  totalSent: number;
  totalDelivered: number;
  totalRead: number;
  totalFailed: number;
  
  // 按渠道統計
  byChannel: Record<NotificationChannel, {
    sent: number;
    delivered: number;
    failed: number;
    avgDeliveryTime: number;
  }>;
  
  // 按事件類型統計
  byEventType: Record<NotificationEventType, {
    count: number;
    successRate: number;
    avgEngagement: number;
  }>;
  
  // 按優先級統計
  byPriority: Record<NotificationPriority, {
    count: number;
    avgDeliveryTime: number;
    engagementRate: number;
  }>;
  
  // 效能指標
  performance: {
    avgProcessingTime: number;
    avgDeliveryTime: number;
    peakHourlyVolume: number;
    errorRate: number;
    retryRate: number;
  };
}

// 通知批次處理
export interface NotificationBatch {
  id: string;
  organizationId: string;
  eventType: NotificationEventType;
  
  // 批次內容
  notifications: BaseNotification[];
  totalRecipients: number;
  
  // 處理狀態
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: {
    processed: number;
    successful: number;
    failed: number;
    percentage: number;
  };
  
  // 時間資訊
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  estimatedCompletion?: Date;
  
  // 錯誤追蹤
  errors: Array<{
    recipientId: string;
    error: string;
    timestamp: Date;
  }>;
}

// 通知規則引擎
export interface NotificationRule {
  id: string;
  name: string;
  organizationId: string;
  
  // 觸發條件
  trigger: {
    eventType: NotificationEventType;
    conditions: Record<string, any>;
    frequency?: 'once' | 'always' | 'throttled';
  };
  
  // 目標和內容
  target: {
    recipientType: 'user' | 'role' | 'department' | 'custom';
    recipients: string[];
    customQuery?: Record<string, any>;
  };
  
  template: {
    title: string;
    message: string;
    channels: NotificationChannel[];
    priority: NotificationPriority;
  };
  
  // 規則設定
  enabled: boolean;
  schedule?: {
    start?: Date;
    end?: Date;
    timezone: string;
    allowedHours?: {
      start: string;
      end: string;
    };
    allowedDays?: number[]; // 0-6, Sunday-Saturday
  };
  
  // 元資料
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastTriggered?: Date;
  triggerCount: number;
}