/**
 * Dashboard 即時資料整合 Hook
 * 整合 WebSocket 和原有的即時資料系統
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { useDashboardWebSocket } from '@/hooks/use-websocket';
import { 
  WEBSOCKET_EVENT_TYPES,
  type DashboardDataUpdatedEvent,
  type MetricChangedEvent,
  type NotificationReceivedEvent,
  type TeamMemberStatusUpdatedEvent,
  type TaskStatusChangedEvent,
  type WebSocketEvent
} from '@/lib/websocket/websocket-events';
import type { WebSocketMessage } from '@/lib/websocket/websocket-client';
import type { DashboardMetrics } from '@/types/dashboard';

// 即時 Dashboard 事件
export interface RealTimeDashboardEvent<T = unknown> {
  id: string;
  type: 'dashboard_update' | 'metric_change' | 'notification' | 'team_update' | 'task_update';
  timestamp: Date;
  data: T;
  source: 'websocket' | 'sse' | 'fallback';
}

// Hook 配置
interface UseRealTimeDashboardOptions {
  enableWebSocket?: boolean;
  enableSSE?: boolean;
  autoReconnect?: boolean;
  onDashboardUpdate?: (metrics: Partial<DashboardMetrics>) => void;
  onMetricChange?: (metric: MetricChangedEvent['data']) => void;
  onNotification?: (notification: NotificationReceivedEvent['data']) => void;
  onTeamUpdate?: (member: TeamMemberStatusUpdatedEvent['data']) => void;
  onTaskUpdate?: (task: TaskStatusChangedEvent['data']) => void;
  onStatusChange?: (status: string) => void;
}

// 連線狀態
export interface ConnectionState {
  websocket: 'connected' | 'connecting' | 'disconnected' | 'error';
  sse: 'connected' | 'connecting' | 'disconnected' | 'error';
  overall: 'connected' | 'connecting' | 'disconnected' | 'error';
  lastEvent: RealTimeDashboardEvent<unknown> | null;
  eventCount: number;
  reconnectAttempts: number;
}

/**
 * Dashboard 即時資料 Hook
 */
export function useRealTimeDashboard(options: UseRealTimeDashboardOptions = {}) {
  const {
    enableWebSocket = true,
    enableSSE = true,
    autoReconnect = true,
    onDashboardUpdate,
    onMetricChange,
    onNotification,
    onTeamUpdate,
    onTaskUpdate,
    onStatusChange,
  } = options;

  const { user } = useAuth();
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    websocket: 'disconnected',
    sse: 'disconnected',
    overall: 'disconnected',
    lastEvent: null,
    eventCount: 0,
    reconnectAttempts: 0,
  });

  // WebSocket 連線
  const webSocket = useDashboardWebSocket({
    enabled: enableWebSocket && !!user,
    autoReconnect,
    onConnect: () => {
      setConnectionState(prev => ({
        ...prev,
        websocket: 'connected',
        overall: 'connected',
        reconnectAttempts: 0,
      }));
      onStatusChange?.('connected');
    },
    onDisconnect: () => {
      setConnectionState(prev => ({
        ...prev,
        websocket: 'disconnected',
        overall: prev.sse === 'connected' ? 'connected' : 'disconnected',
      }));
    },
    onError: (error) => {
      console.error('WebSocket 錯誤:', error);
      setConnectionState(prev => ({
        ...prev,
        websocket: 'error',
        overall: prev.sse === 'connected' ? 'connected' : 'error',
      }));
    },
  });

  // SSE 備用連線
  const [sseConnection, setSSEConnection] = useState<EventSource | null>(null);

  // 建立 SSE 連線
  const connectSSE = useCallback(() => {
    if (!enableSSE || !user || sseConnection) return;

    try {
      setConnectionState(prev => ({ ...prev, sse: 'connecting' }));

      const sseUrl = `${process.env.NEXT_PUBLIC_API_URL || ''}/api/realtime/events`;
      const eventSource = new EventSource(
        `${sseUrl}?userId=${user.uid}&orgId=${user.organizationId}&events=${[
          WEBSOCKET_EVENT_TYPES.DASHBOARD_DATA_UPDATED,
          WEBSOCKET_EVENT_TYPES.METRIC_CHANGED,
          WEBSOCKET_EVENT_TYPES.NOTIFICATION_RECEIVED,
          WEBSOCKET_EVENT_TYPES.TEAM_MEMBER_STATUS_UPDATED,
          WEBSOCKET_EVENT_TYPES.TASK_STATUS_CHANGED,
        ].join(',')}`
      );

      eventSource.onopen = () => {
        setConnectionState(prev => ({
          ...prev,
          sse: 'connected',
          overall: 'connected',
          reconnectAttempts: 0,
        }));
        onStatusChange?.('connected');
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleEvent(data, 'sse');
        } catch (error) {
          console.error('SSE 訊息解析錯誤:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE 錯誤:', error);
        setConnectionState(prev => ({
          ...prev,
          sse: 'error',
          overall: prev.websocket === 'connected' ? 'connected' : 'error',
        }));
        
        eventSource.close();
        setSSEConnection(null);
        
        // 自動重連
        if (autoReconnect) {
          setTimeout(() => {
            setConnectionState(prev => ({
              ...prev,
              reconnectAttempts: prev.reconnectAttempts + 1,
            }));
            connectSSE();
          }, 5000);
        }
      };

      setSSEConnection(eventSource);

    } catch (error) {
      console.error('SSE 連線錯誤:', error);
      setConnectionState(prev => ({ ...prev, sse: 'error' }));
    }
  }, [enableSSE, user, sseConnection, autoReconnect, onStatusChange]);

  // 處理事件
  const handleEvent = useCallback((eventData: WebSocketEvent | Record<string, unknown>, source: 'websocket' | 'sse') => {
    const event: RealTimeDashboardEvent<unknown> = {
      id: eventData.id || `event_${Date.now()}`,
      type: mapEventType(eventData.type),
      timestamp: new Date(eventData.timestamp),
      data: eventData.data,
      source,
    };

    setConnectionState(prev => ({
      ...prev,
      lastEvent: event,
      eventCount: prev.eventCount + 1,
    }));

    // 分發到對應的處理器
    switch (event.type) {
      case 'dashboard_update':
        onDashboardUpdate?.(event.data.metrics || event.data);
        break;
      case 'metric_change':
        onMetricChange?.(event.data);
        break;
      case 'notification':
        onNotification?.(event.data);
        break;
      case 'team_update':
        onTeamUpdate?.(event.data.member || event.data);
        break;
      case 'task_update':
        onTaskUpdate?.(event.data);
        break;
    }
  }, [onDashboardUpdate, onMetricChange, onNotification, onTeamUpdate, onTaskUpdate]);

  // 事件類型映射
  const mapEventType = (wsEventType: string): RealTimeDashboardEvent['type'] => {
    switch (wsEventType) {
      case WEBSOCKET_EVENT_TYPES.DASHBOARD_DATA_UPDATED:
        return 'dashboard_update';
      case WEBSOCKET_EVENT_TYPES.METRIC_CHANGED:
        return 'metric_change';
      case WEBSOCKET_EVENT_TYPES.NOTIFICATION_RECEIVED:
        return 'notification';
      case WEBSOCKET_EVENT_TYPES.TEAM_MEMBER_STATUS_UPDATED:
        return 'team_update';
      case WEBSOCKET_EVENT_TYPES.TASK_STATUS_CHANGED:
        return 'task_update';
      default:
        return 'dashboard_update';
    }
  };

  // 監聽 WebSocket 事件
  useEffect(() => {
    if (!webSocket.subscribe) return;

    const unsubscribers = [
      webSocket.subscribe(WEBSOCKET_EVENT_TYPES.DASHBOARD_DATA_UPDATED, (event) => {
        handleEvent(event, 'websocket');
      }),
      webSocket.subscribe(WEBSOCKET_EVENT_TYPES.METRIC_CHANGED, (event) => {
        handleEvent(event, 'websocket');
      }),
      webSocket.subscribe(WEBSOCKET_EVENT_TYPES.NOTIFICATION_RECEIVED, (event) => {
        handleEvent(event, 'websocket');
      }),
      webSocket.subscribe(WEBSOCKET_EVENT_TYPES.TEAM_MEMBER_STATUS_UPDATED, (event) => {
        handleEvent(event, 'websocket');
      }),
      webSocket.subscribe(WEBSOCKET_EVENT_TYPES.TASK_STATUS_CHANGED, (event) => {
        handleEvent(event, 'websocket');
      }),
    ];

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [webSocket.subscribe, handleEvent]);

  // 初始化 SSE 備用連線
  useEffect(() => {
    if (!enableSSE || !user) return;

    // 如果 WebSocket 連線失敗，則使用 SSE
    if (webSocket.connectionState === 'closed' || webSocket.error) {
      connectSSE();
    }

    return () => {
      if (sseConnection) {
        sseConnection.close();
        setSSEConnection(null);
      }
    };
  }, [enableSSE, user, webSocket.connectionState, webSocket.error, connectSSE, sseConnection]);

  // 發送訊息（僅限 WebSocket）
  const sendMessage = useCallback(<T = unknown>(message: Omit<WebSocketMessage<T>, 'timestamp'>) => {
    return webSocket.send?.(message) || false;
  }, [webSocket.send]);

  // 手動重連
  const reconnect = useCallback(() => {
    // 重連 WebSocket
    if (enableWebSocket) {
      webSocket.reconnect?.();
    }

    // 重連 SSE
    if (enableSSE && sseConnection) {
      sseConnection.close();
      setSSEConnection(null);
      setTimeout(connectSSE, 1000);
    }
  }, [enableWebSocket, enableSSE, webSocket.reconnect, sseConnection, connectSSE]);

  // 斷開連線
  const disconnect = useCallback(() => {
    webSocket.disconnect?.();
    
    if (sseConnection) {
      sseConnection.close();
      setSSEConnection(null);
    }

    setConnectionState(prev => ({
      ...prev,
      websocket: 'disconnected',
      sse: 'disconnected',
      overall: 'disconnected',
    }));
  }, [webSocket.disconnect, sseConnection]);

  return {
    // 連線狀態
    connectionState,
    isConnected: connectionState.overall === 'connected',
    isConnecting: connectionState.overall === 'connecting',
    hasError: connectionState.overall === 'error',
    
    // WebSocket 狀態
    websocket: {
      isConnected: webSocket.isConnected,
      isConnecting: webSocket.isConnecting,
      connectionState: webSocket.connectionState,
      error: webSocket.error,
    },
    
    // SSE 狀態
    sse: {
      isConnected: connectionState.sse === 'connected',
      connection: sseConnection,
    },
    
    // 事件資料
    lastEvent: connectionState.lastEvent,
    eventCount: connectionState.eventCount,
    reconnectAttempts: connectionState.reconnectAttempts,
    
    // 操作方法
    sendMessage,
    reconnect,
    disconnect,
    
    // 原始 WebSocket 實例（用於進階操作）
    webSocketClient: webSocket.client,
  };
}

/**
 * 簡化的 Dashboard 指標更新 Hook
 */
export function useDashboardRealTimeMetrics() {
  const [metrics, setMetrics] = useState<Partial<DashboardMetrics> | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const { isConnected, lastEvent } = useRealTimeDashboard({
    onDashboardUpdate: (newMetrics) => {
      setMetrics(newMetrics);
      setLastUpdate(new Date());
    },
    onMetricChange: (metricData) => {
      setMetrics(prev => ({
        ...prev,
        [metricData.metricName]: metricData.newValue,
      }));
      setLastUpdate(new Date());
    },
  });

  return {
    metrics,
    lastUpdate,
    isConnected,
    lastEvent,
  };
}

/**
 * Dashboard 通知 Hook
 */
export function useDashboardNotifications() {
  const [notifications, setNotifications] = useState<NotificationReceivedEvent['data'][]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const { isConnected } = useRealTimeDashboard({
    onNotification: (notification) => {
      setNotifications(prev => [notification, ...prev.slice(0, 49)]); // 保留最近 50 個
      setUnreadCount(prev => prev + 1);
    },
  });

  const markAsRead = useCallback((notificationId?: string) => {
    if (notificationId) {
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } else {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    clearNotifications,
  };
}

/**
 * 團隊狀態即時更新 Hook
 */
export function useTeamRealTimeStatus() {
  const [teamMembers, setTeamMembers] = useState<Map<string, TeamMemberStatusUpdatedEvent['data']['member']>>(new Map());
  const [lastActivity, setLastActivity] = useState<Date | null>(null);

  const { isConnected } = useRealTimeDashboard({
    onTeamUpdate: (memberData) => {
      setTeamMembers(prev => {
        const newMap = new Map(prev);
        newMap.set(memberData.id || memberData.userId, memberData);
        return newMap;
      });
      setLastActivity(new Date());
    },
    onTaskUpdate: (taskData) => {
      // 更新任務相關的團隊成員狀態
      if (taskData.assigneeId) {
        setTeamMembers(prev => {
          const newMap = new Map(prev);
          const member = newMap.get(taskData.assigneeId);
          if (member) {
            newMap.set(taskData.assigneeId, {
              ...member,
              lastTaskUpdate: taskData,
              lastActivity: new Date(),
            });
          }
          return newMap;
        });
      }
      setLastActivity(new Date());
    },
  });

  const getTeamMember = useCallback((memberId: string) => {
    return teamMembers.get(memberId);
  }, [teamMembers]);

  const getActiveMembers = useCallback(() => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return Array.from(teamMembers.values()).filter(member => 
      member.lastActivity && new Date(member.lastActivity) > fiveMinutesAgo
    );
  }, [teamMembers]);

  return {
    teamMembers: Array.from(teamMembers.values()),
    teamMembersMap: teamMembers,
    getTeamMember,
    getActiveMembers,
    lastActivity,
    isConnected,
  };
}