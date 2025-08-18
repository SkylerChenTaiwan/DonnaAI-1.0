/**
 * WebSocket React Hook
 * 提供 React 元件中使用 WebSocket 的便利介面
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { 
  WebSocketClient, 
  type WebSocketMessage, 
  type WebSocketOptions,
  type WebSocketEventHandler 
} from '@/lib/websocket/websocket-client';
import { 
  WebSocketEvent, 
  WebSocketEventHandler, 
  globalEventRegistry,
  WEBSOCKET_EVENT_TYPES 
} from '@/lib/websocket/websocket-events';

export interface UseWebSocketOptions extends Omit<WebSocketOptions, 'userId' | 'organizationId' | 'token'> {
  enabled?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  onMessage?: (message: WebSocketMessage<unknown>) => void;
}

export interface UseWebSocketReturn {
  client: WebSocketClient | null;
  isConnected: boolean;
  isConnecting: boolean;
  connectionState: 'connecting' | 'open' | 'closing' | 'closed';
  connect: () => Promise<void>;
  disconnect: () => void;
  send: <T = unknown>(message: Omit<WebSocketMessage<T>, 'timestamp'>) => boolean;
  subscribe: <T extends WebSocketEvent>(
    eventType: T['type'], 
    handler: WebSocketEventHandler<T>
  ) => () => void;
  unsubscribe: (eventType: string, handler?: WebSocketEventHandler) => void;
  lastMessage: WebSocketMessage<unknown> | null;
  error: Error | null;
}

/**
 * WebSocket Hook
 */
export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const { user } = useAuth();
  const [client, setClient] = useState<WebSocketClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionState, setConnectionState] = useState<'connecting' | 'open' | 'closing' | 'closed'>('closed');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage<unknown> | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  const clientRef = useRef<WebSocketClient | null>(null);
  const subscribedEventsRef = useRef<Set<string>>(new Set());

  const {
    enabled = true,
    onConnect,
    onDisconnect,
    onError,
    onMessage,
    ...wsOptions
  } = options;

  // 連線函數
  const connect = useCallback(async () => {
    if (!enabled || !user || isConnecting || (client && client.isConnected())) {
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);

      const wsClient = new WebSocketClient({
        ...wsOptions,
        userId: user.uid,
        organizationId: user.organizationId,
        token: await user.getIdToken(),
      });

      // 設置訊息處理器
      wsClient.subscribe<unknown>('*', (message) => {
        setLastMessage(message);
        onMessage?.(message);
        
        // 分發到全域事件系統
        if (message.type !== 'heartbeat' && message.type !== 'pong') {
          globalEventRegistry.emit(message as WebSocketEvent).catch(console.error);
        }
      });

      await wsClient.connect();
      
      setClient(wsClient);
      clientRef.current = wsClient;
      setIsConnected(true);
      setIsConnecting(false);
      onConnect?.();

    } catch (err) {
      const error = err instanceof Error ? err : new Error('WebSocket 連線失敗');
      setError(error);
      setIsConnecting(false);
      onError?.(error);
    }
  }, [enabled, user, isConnecting, client, wsOptions, onConnect, onDisconnect, onError, onMessage]);

  // 斷線函數
  const disconnect = useCallback(() => {
    if (client) {
      client.disconnect();
      setClient(null);
      clientRef.current = null;
      setIsConnected(false);
      setConnectionState('closed');
      onDisconnect?.();
    }
  }, [client, onDisconnect]);

  // 發送訊息函數
  const send = useCallback(<T = unknown>(message: Omit<WebSocketMessage<T>, 'timestamp'>) => {
    if (!client) {
      console.warn('WebSocket 未連線，無法發送訊息');
      return false;
    }
    return client.send(message);
  }, [client]);

  // 訂閱事件函數
  const subscribe = useCallback(<T extends WebSocketEvent>(
    eventType: T['type'], 
    handler: WebSocketEventHandler<T>
  ) => {
    subscribedEventsRef.current.add(eventType);
    
    // 如果客戶端已存在，立即訂閱
    if (client) {
      client.subscribe(eventType, handler as WebSocketEventHandler<unknown>);
    }

    // 在全域註冊表中註冊
    const unsubscribe = globalEventRegistry.on(eventType, handler);

    return () => {
      subscribedEventsRef.current.delete(eventType);
      client?.unsubscribe(eventType, handler as WebSocketEventHandler<unknown>);
      unsubscribe();
    };
  }, [client]);

  // 取消訂閱函數
  const unsubscribe = useCallback((eventType: string, handler?: WebSocketEventHandler) => {
    subscribedEventsRef.current.delete(eventType);
    client?.unsubscribe(eventType, handler as WebSocketEventHandler<unknown>);
    globalEventRegistry.off(eventType, handler);
  }, [client]);

  // 監聽連線狀態變化
  useEffect(() => {
    if (!client) return;

    const checkConnectionState = () => {
      const state = client.getConnectionState();
      setConnectionState(state);
      setIsConnected(state === 'open');
    };

    // 初始檢查
    checkConnectionState();

    // 定期檢查連線狀態
    const interval = setInterval(checkConnectionState, 1000);

    return () => clearInterval(interval);
  }, [client]);

  // 自動連線
  useEffect(() => {
    if (enabled && user && !client && !isConnecting) {
      connect();
    }
  }, [enabled, user, client, isConnecting, connect]);

  // 清理
  useEffect(() => {
    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
      }
    };
  }, []);

  return {
    client,
    isConnected,
    isConnecting,
    connectionState,
    connect,
    disconnect,
    send,
    subscribe,
    unsubscribe,
    lastMessage,
    error,
  };
}

/**
 * Dashboard 專用 WebSocket Hook
 */
export function useDashboardWebSocket(options: Omit<UseWebSocketOptions, 'events'> = {}) {
  return useWebSocket({
    ...options,
    events: [
      WEBSOCKET_EVENT_TYPES.DASHBOARD_DATA_UPDATED,
      WEBSOCKET_EVENT_TYPES.METRIC_CHANGED,
      WEBSOCKET_EVENT_TYPES.NOTIFICATION_RECEIVED,
      WEBSOCKET_EVENT_TYPES.TEAM_MEMBER_STATUS_UPDATED,
      WEBSOCKET_EVENT_TYPES.TASK_STATUS_CHANGED,
      WEBSOCKET_EVENT_TYPES.NEW_CUSTOMER_ADDED,
      WEBSOCKET_EVENT_TYPES.REVENUE_UPDATED,
      WEBSOCKET_EVENT_TYPES.SYSTEM_ALERT,
      WEBSOCKET_EVENT_TYPES.AI_QUERY_COMPLETED,
      WEBSOCKET_EVENT_TYPES.DATA_SYNC_STATUS,
    ],
  });
}

/**
 * 事件監聽 Hook
 */
export function useWebSocketEvent<T extends WebSocketEvent>(
  eventType: T['type'],
  handler: WebSocketEventHandler<T>,
  deps: React.DependencyList = []
) {
  const { subscribe } = useWebSocket({ enabled: false }); // 不自動連線，只用於事件系統

  useEffect(() => {
    const unsubscribe = globalEventRegistry.on(eventType, handler);
    return unsubscribe;
  }, [eventType, ...deps]);
}

/**
 * Dashboard 資料更新監聽 Hook
 */
export function useDashboardDataUpdates(
  handler: (data: any) => void,
  deps: React.DependencyList = []
) {
  useWebSocketEvent(
    WEBSOCKET_EVENT_TYPES.DASHBOARD_DATA_UPDATED,
    (event) => handler(event.data),
    deps
  );
}

/**
 * 指標變更監聽 Hook
 */
export function useMetricChanges(
  handler: (data: any) => void,
  deps: React.DependencyList = []
) {
  useWebSocketEvent(
    WEBSOCKET_EVENT_TYPES.METRIC_CHANGED,
    (event) => handler(event.data),
    deps
  );
}

/**
 * 通知監聽 Hook
 */
export function useNotifications(
  handler: (notification: any) => void,
  deps: React.DependencyList = []
) {
  useWebSocketEvent(
    WEBSOCKET_EVENT_TYPES.NOTIFICATION_RECEIVED,
    (event) => handler(event.data),
    deps
  );
}

/**
 * 系統警告監聽 Hook
 */
export function useSystemAlerts(
  handler: (alert: any) => void,
  deps: React.DependencyList = []
) {
  useWebSocketEvent(
    WEBSOCKET_EVENT_TYPES.SYSTEM_ALERT,
    (event) => handler(event.data),
    deps
  );
}