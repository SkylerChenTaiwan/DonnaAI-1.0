/**
 * 即時資料更新 Hook
 * 使用 WebSocket 或 Server-Sent Events 實現即時資料同步
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/providers/auth-provider';

// 即時事件類型
export type RealTimeEventType = 
  | 'dashboard_data_updated'
  | 'metric_changed'
  | 'notification_received'
  | 'task_updated'
  | 'user_activity'
  | 'system_alert';

// 即時事件資料
export interface RealTimeEvent {
  id: string;
  type: RealTimeEventType;
  timestamp: Date;
  data: any;
  organizationId: string;
  userId?: string;
}

// 連線狀態
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error' | 'reconnecting';

// Hook 配置
interface UseRealTimeDataOptions {
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  onEvent?: (event: RealTimeEvent) => void;
  onStatusChange?: (status: ConnectionStatus) => void;
  subscribeToEvents?: RealTimeEventType[];
}

// Hook 狀態
interface RealTimeState {
  status: ConnectionStatus;
  lastEvent: RealTimeEvent | null;
  lastHeartbeat: Date | null;
  reconnectAttempts: number;
  eventCount: number;
  error: string | null;
}

/**
 * 即時資料更新 Hook
 */
export function useRealTimeData(options: UseRealTimeDataOptions = {}) {
  const {
    autoReconnect = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = 10,
    heartbeatInterval = 30000,
    onEvent,
    onStatusChange,
    subscribeToEvents = ['dashboard_data_updated', 'metric_changed', 'notification_received'],
  } = options;

  const { user } = useAuth();
  const [state, setState] = useState<RealTimeState>({
    status: 'disconnected',
    lastEvent: null,
    lastHeartbeat: null,
    reconnectAttempts: 0,
    eventCount: 0,
    error: null,
  });

  // WebSocket 或 EventSource 實例
  const connectionRef = useRef<WebSocket | EventSource | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 更新狀態
  const updateStatus = useCallback((status: ConnectionStatus, error?: string) => {
    setState(prev => ({
      ...prev,
      status,
      error: error || null,
    }));
    onStatusChange?.(status);
  }, [onStatusChange]);

  // 處理接收到的事件
  const handleEvent = useCallback((eventData: any) => {
    try {
      const event: RealTimeEvent = {
        id: eventData.id || `event_${Date.now()}`,
        type: eventData.type,
        timestamp: new Date(eventData.timestamp),
        data: eventData.data,
        organizationId: eventData.organizationId,
        userId: eventData.userId,
      };

      // 檢查是否訂閱了此類事件
      if (subscribeToEvents.includes(event.type)) {
        setState(prev => ({
          ...prev,
          lastEvent: event,
          eventCount: prev.eventCount + 1,
        }));

        onEvent?.(event);
      }
    } catch (error) {
      console.error('Handle real-time event error:', error);
    }
  }, [subscribeToEvents, onEvent]);

  // 發送心跳
  const sendHeartbeat = useCallback(() => {
    const connection = connectionRef.current;
    if (connection && state.status === 'connected') {
      try {
        if (connection instanceof WebSocket && connection.readyState === WebSocket.OPEN) {
          connection.send(JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }));
        }
        
        setState(prev => ({
          ...prev,
          lastHeartbeat: new Date(),
        }));
      } catch (error) {
        console.error('Send heartbeat error:', error);
      }
    }
  }, [state.status]);

  // 建立 WebSocket 連線
  const connectWebSocket = useCallback(() => {
    if (!user) return;

    try {
      updateStatus('connecting');

      const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'}/realtime`;
      const ws = new WebSocket(`${wsUrl}?userId=${user.uid}&orgId=${user.organizationId}`);
      
      ws.onopen = () => {
        updateStatus('connected');
        setState(prev => ({ ...prev, reconnectAttempts: 0 }));
        
        // 發送訂閱事件列表
        ws.send(JSON.stringify({
          type: 'subscribe',
          events: subscribeToEvents,
          organizationId: user.organizationId,
        }));

        // 開始心跳
        heartbeatRef.current = setInterval(sendHeartbeat, heartbeatInterval);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'heartbeat_response') {
            setState(prev => ({ ...prev, lastHeartbeat: new Date() }));
          } else {
            handleEvent(data);
          }
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      };

      ws.onclose = (event) => {
        updateStatus('disconnected');
        
        if (heartbeatRef.current) {
          clearInterval(heartbeatRef.current);
          heartbeatRef.current = null;
        }

        // 自動重連
        if (autoReconnect && state.reconnectAttempts < maxReconnectAttempts) {
          updateStatus('reconnecting');
          setState(prev => ({ ...prev, reconnectAttempts: prev.reconnectAttempts + 1 }));
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, reconnectInterval);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        updateStatus('error', 'WebSocket connection failed');
      };

      connectionRef.current = ws;

    } catch (error) {
      console.error('Connect WebSocket error:', error);
      updateStatus('error', 'Failed to create WebSocket connection');
    }
  }, [
    user, 
    subscribeToEvents, 
    autoReconnect, 
    maxReconnectAttempts, 
    reconnectInterval, 
    heartbeatInterval,
    sendHeartbeat,
    handleEvent,
    updateStatus,
    state.reconnectAttempts
  ]);

  // 建立 Server-Sent Events 連線 (備用方案)
  const connectSSE = useCallback(() => {
    if (!user) return;

    try {
      updateStatus('connecting');

      const sseUrl = `${process.env.NEXT_PUBLIC_API_URL || ''}/api/realtime/events`;
      const eventSource = new EventSource(
        `${sseUrl}?userId=${user.uid}&orgId=${user.organizationId}&events=${subscribeToEvents.join(',')}`
      );

      eventSource.onopen = () => {
        updateStatus('connected');
        setState(prev => ({ ...prev, reconnectAttempts: 0 }));
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleEvent(data);
        } catch (error) {
          console.error('SSE message parse error:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        updateStatus('error', 'Server-Sent Events connection failed');
        
        // 自動重連
        if (autoReconnect && state.reconnectAttempts < maxReconnectAttempts) {
          updateStatus('reconnecting');
          setState(prev => ({ ...prev, reconnectAttempts: prev.reconnectAttempts + 1 }));
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connectSSE();
          }, reconnectInterval);
        }
      };

      connectionRef.current = eventSource;

    } catch (error) {
      console.error('Connect SSE error:', error);
      updateStatus('error', 'Failed to create SSE connection');
    }
  }, [
    user, 
    subscribeToEvents, 
    autoReconnect, 
    maxReconnectAttempts, 
    reconnectInterval,
    handleEvent,
    updateStatus,
    state.reconnectAttempts
  ]);

  // 建立連線
  const connect = useCallback(() => {
    // 優先嘗試 WebSocket，如果不支援則使用 SSE
    if (typeof WebSocket !== 'undefined') {
      connectWebSocket();
    } else if (typeof EventSource !== 'undefined') {
      connectSSE();
    } else {
      updateStatus('error', 'Browser does not support WebSocket or SSE');
    }
  }, [connectWebSocket, connectSSE, updateStatus]);

  // 斷開連線
  const disconnect = useCallback(() => {
    if (connectionRef.current) {
      if (connectionRef.current instanceof WebSocket) {
        connectionRef.current.close();
      } else if (connectionRef.current instanceof EventSource) {
        connectionRef.current.close();
      }
      connectionRef.current = null;
    }

    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    updateStatus('disconnected');
  }, [updateStatus]);

  // 手動重連
  const reconnect = useCallback(() => {
    disconnect();
    setState(prev => ({ ...prev, reconnectAttempts: 0 }));
    setTimeout(connect, 1000);
  }, [disconnect, connect]);

  // 發送訊息 (僅限 WebSocket)
  const sendMessage = useCallback((message: any) => {
    const connection = connectionRef.current;
    if (connection instanceof WebSocket && connection.readyState === WebSocket.OPEN) {
      try {
        connection.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error('Send message error:', error);
        return false;
      }
    }
    return false;
  }, []);

  // 訂閱新事件類型
  const subscribe = useCallback((eventTypes: RealTimeEventType[]) => {
    const message = {
      type: 'subscribe',
      events: eventTypes,
      organizationId: user?.organizationId,
    };
    return sendMessage(message);
  }, [sendMessage, user?.organizationId]);

  // 取消訂閱事件類型
  const unsubscribe = useCallback((eventTypes: RealTimeEventType[]) => {
    const message = {
      type: 'unsubscribe',
      events: eventTypes,
      organizationId: user?.organizationId,
    };
    return sendMessage(message);
  }, [sendMessage, user?.organizationId]);

  // 初始化連線
  useEffect(() => {
    if (user) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [user?.uid]); // 只在使用者變更時重新連線

  // 清理
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    // 狀態
    status: state.status,
    lastEvent: state.lastEvent,
    lastHeartbeat: state.lastHeartbeat,
    reconnectAttempts: state.reconnectAttempts,
    eventCount: state.eventCount,
    error: state.error,
    
    // 操作方法
    connect,
    disconnect,
    reconnect,
    sendMessage,
    subscribe,
    unsubscribe,
    
    // 狀態檢查
    isConnected: state.status === 'connected',
    isConnecting: state.status === 'connecting',
    isReconnecting: state.status === 'reconnecting',
    hasError: state.status === 'error',
  };
}

/**
 * 簡化的即時指標更新 Hook
 */
export function useRealTimeMetrics(onMetricUpdate?: (data: any) => void) {
  return useRealTimeData({
    subscribeToEvents: ['dashboard_data_updated', 'metric_changed'],
    onEvent: (event) => {
      if (event.type === 'dashboard_data_updated' || event.type === 'metric_changed') {
        onMetricUpdate?.(event.data);
      }
    },
  });
}

/**
 * 即時通知 Hook
 */
export function useRealTimeNotifications(onNotification?: (notification: any) => void) {
  return useRealTimeData({
    subscribeToEvents: ['notification_received'],
    onEvent: (event) => {
      if (event.type === 'notification_received') {
        onNotification?.(event.data);
      }
    },
  });
}

/**
 * 即時任務更新 Hook
 */
export function useRealTimeTaskUpdates(onTaskUpdate?: (task: any) => void) {
  return useRealTimeData({
    subscribeToEvents: ['task_updated'],
    onEvent: (event) => {
      if (event.type === 'task_updated') {
        onTaskUpdate?.(event.data);
      }
    },
  });
}