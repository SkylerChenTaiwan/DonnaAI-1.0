/**
 * WebSocket 事件類型和處理系統
 * 定義所有 Dashboard 相關的即時事件
 */

import type { DashboardMetrics, TeamMember, Notification } from '@/types/dashboard';

// 基礎事件接口
export interface BaseWebSocketEvent {
  type: string;
  id: string;
  timestamp: string;
  organizationId?: string;
  userId?: string;
}

// Dashboard 資料更新事件
export interface DashboardDataUpdatedEvent extends BaseWebSocketEvent {
  type: 'dashboard_data_updated';
  data: {
    metrics: Partial<DashboardMetrics>;
    source: 'realtime' | 'scheduled' | 'manual';
    affectedWidgets?: string[];
  };
}

// 指標變更事件
export interface MetricChangedEvent extends BaseWebSocketEvent {
  type: 'metric_changed';
  data: {
    metricName: string;
    oldValue: number;
    newValue: number;
    changePercentage: number;
    threshold?: number;
    isAlert?: boolean;
  };
}

// 通知接收事件
export interface NotificationReceivedEvent extends BaseWebSocketEvent {
  type: 'notification_received';
  data: Notification;
}

// 團隊成員狀態更新事件
export interface TeamMemberStatusUpdatedEvent extends BaseWebSocketEvent {
  type: 'team_member_status_updated';
  data: {
    member: TeamMember;
    previousStatus: string;
    newStatus: string;
    timestamp: string;
  };
}

// 任務狀態變更事件
export interface TaskStatusChangedEvent extends BaseWebSocketEvent {
  type: 'task_status_changed';
  data: {
    taskId: string;
    taskTitle: string;
    oldStatus: string;
    newStatus: string;
    assigneeId: string;
    assigneeName: string;
    completionPercentage?: number;
  };
}

// 新客戶加入事件
export interface NewCustomerAddedEvent extends BaseWebSocketEvent {
  type: 'new_customer_added';
  data: {
    customerId: string;
    customerName: string;
    customerEmail: string;
    source: string;
    value?: number;
  };
}

// 收入更新事件
export interface RevenueUpdatedEvent extends BaseWebSocketEvent {
  type: 'revenue_updated';
  data: {
    amount: number;
    currency: string;
    source: string;
    period: 'daily' | 'weekly' | 'monthly' | 'yearly';
    previousAmount?: number;
  };
}

// 系統警告事件
export interface SystemAlertEvent extends BaseWebSocketEvent {
  type: 'system_alert';
  data: {
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    message: string;
    category: 'performance' | 'security' | 'business' | 'system';
    actionRequired?: boolean;
    actionUrl?: string;
  };
}

// AI 查詢完成事件
export interface AiQueryCompletedEvent extends BaseWebSocketEvent {
  type: 'ai_query_completed';
  data: {
    queryId: string;
    query: string;
    result: any;
    processingTime: number;
    confidence: number;
  };
}

// 資料同步狀態事件
export interface DataSyncStatusEvent extends BaseWebSocketEvent {
  type: 'data_sync_status';
  data: {
    status: 'started' | 'in_progress' | 'completed' | 'failed';
    progress?: number;
    totalItems?: number;
    processedItems?: number;
    errorMessage?: string;
    syncType: 'manual' | 'scheduled' | 'automatic';
  };
}

// 所有事件類型聯合
export type WebSocketEvent = 
  | DashboardDataUpdatedEvent
  | MetricChangedEvent
  | NotificationReceivedEvent
  | TeamMemberStatusUpdatedEvent
  | TaskStatusChangedEvent
  | NewCustomerAddedEvent
  | RevenueUpdatedEvent
  | SystemAlertEvent
  | AiQueryCompletedEvent
  | DataSyncStatusEvent;

// 事件類型常數
export const WEBSOCKET_EVENT_TYPES = {
  DASHBOARD_DATA_UPDATED: 'dashboard_data_updated',
  METRIC_CHANGED: 'metric_changed',
  NOTIFICATION_RECEIVED: 'notification_received',
  TEAM_MEMBER_STATUS_UPDATED: 'team_member_status_updated',
  TASK_STATUS_CHANGED: 'task_status_changed',
  NEW_CUSTOMER_ADDED: 'new_customer_added',
  REVENUE_UPDATED: 'revenue_updated',
  SYSTEM_ALERT: 'system_alert',
  AI_QUERY_COMPLETED: 'ai_query_completed',
  DATA_SYNC_STATUS: 'data_sync_status',
} as const;

// 事件處理器類型
export type WebSocketEventHandler<T extends WebSocketEvent = WebSocketEvent> = (event: T) => void | Promise<void>;

/**
 * 事件處理器註冊表
 */
export class WebSocketEventRegistry {
  private handlers = new Map<string, Set<WebSocketEventHandler>>();
  private middlewares: Array<(event: WebSocketEvent) => boolean | Promise<boolean>> = [];

  /**
   * 註冊事件處理器
   */
  on<T extends WebSocketEvent>(
    eventType: T['type'],
    handler: WebSocketEventHandler<T>
  ): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }

    this.handlers.get(eventType)!.add(handler as WebSocketEventHandler);

    // 返回取消註冊函數
    return () => {
      this.off(eventType, handler);
    };
  }

  /**
   * 取消事件處理器
   */
  off<T extends WebSocketEvent>(
    eventType: T['type'],
    handler?: WebSocketEventHandler<T>
  ): void {
    const handlers = this.handlers.get(eventType);
    if (!handlers) return;

    if (handler) {
      handlers.delete(handler as WebSocketEventHandler);
      if (handlers.size === 0) {
        this.handlers.delete(eventType);
      }
    } else {
      this.handlers.delete(eventType);
    }
  }

  /**
   * 處理事件
   */
  async emit(event: WebSocketEvent): Promise<void> {
    // 執行中間件
    for (const middleware of this.middlewares) {
      const shouldContinue = await middleware(event);
      if (!shouldContinue) {
        return;
      }
    }

    const handlers = this.handlers.get(event.type);
    if (!handlers || handlers.size === 0) {
      return;
    }

    // 並行執行所有處理器
    const promises = Array.from(handlers).map(async (handler) => {
      try {
        await handler(event);
      } catch (error) {
        console.error(`事件處理器錯誤 (${event.type}):`, error);
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * 添加中間件
   */
  use(middleware: (event: WebSocketEvent) => boolean | Promise<boolean>): void {
    this.middlewares.push(middleware);
  }

  /**
   * 移除所有處理器
   */
  clear(): void {
    this.handlers.clear();
    this.middlewares.length = 0;
  }

  /**
   * 取得已註冊的事件類型
   */
  getRegisteredEvents(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * 取得事件處理器數量
   */
  getHandlerCount(eventType?: string): number {
    if (eventType) {
      return this.handlers.get(eventType)?.size || 0;
    }
    
    let total = 0;
    for (const handlers of this.handlers.values()) {
      total += handlers.size;
    }
    return total;
  }
}

/**
 * 事件工廠函數
 */
export class WebSocketEventFactory {
  /**
   * 建立 Dashboard 資料更新事件
   */
  static createDashboardDataUpdatedEvent(
    data: DashboardDataUpdatedEvent['data'],
    organizationId?: string
  ): DashboardDataUpdatedEvent {
    return {
      type: WEBSOCKET_EVENT_TYPES.DASHBOARD_DATA_UPDATED,
      id: `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      organizationId,
      data,
    };
  }

  /**
   * 建立指標變更事件
   */
  static createMetricChangedEvent(
    data: MetricChangedEvent['data'],
    organizationId?: string
  ): MetricChangedEvent {
    return {
      type: WEBSOCKET_EVENT_TYPES.METRIC_CHANGED,
      id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      organizationId,
      data,
    };
  }

  /**
   * 建立通知事件
   */
  static createNotificationReceivedEvent(
    data: NotificationReceivedEvent['data'],
    organizationId?: string,
    userId?: string
  ): NotificationReceivedEvent {
    return {
      type: WEBSOCKET_EVENT_TYPES.NOTIFICATION_RECEIVED,
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      organizationId,
      userId,
      data,
    };
  }

  /**
   * 建立系統警告事件
   */
  static createSystemAlertEvent(
    data: SystemAlertEvent['data'],
    organizationId?: string
  ): SystemAlertEvent {
    return {
      type: WEBSOCKET_EVENT_TYPES.SYSTEM_ALERT,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      organizationId,
      data,
    };
  }
}

/**
 * 全域事件註冊表
 */
export const globalEventRegistry = new WebSocketEventRegistry();

/**
 * 事件防抖處理器
 */
export function createDebouncedHandler<T extends WebSocketEvent>(
  handler: WebSocketEventHandler<T>,
  delay: number = 300
): WebSocketEventHandler<T> {
  let timeoutId: NodeJS.Timeout | null = null;

  return (event: T) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      handler(event);
      timeoutId = null;
    }, delay);
  };
}

/**
 * 事件節流處理器
 */
export function createThrottledHandler<T extends WebSocketEvent>(
  handler: WebSocketEventHandler<T>,
  delay: number = 300
): WebSocketEventHandler<T> {
  let lastCallTime = 0;

  return (event: T) => {
    const now = Date.now();
    if (now - lastCallTime >= delay) {
      lastCallTime = now;
      handler(event);
    }
  };
}

/**
 * 條件事件處理器
 */
export function createConditionalHandler<T extends WebSocketEvent>(
  handler: WebSocketEventHandler<T>,
  condition: (event: T) => boolean
): WebSocketEventHandler<T> {
  return (event: T) => {
    if (condition(event)) {
      handler(event);
    }
  };
}