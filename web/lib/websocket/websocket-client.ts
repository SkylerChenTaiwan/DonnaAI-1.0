/**
 * WebSocket 客戶端管理器
 * 提供 Dashboard 即時資料同步功能
 */

import { DASHBOARD_CONFIG } from '@/config/dashboard.config';

export interface WebSocketMessage {
  type: string;
  id?: string;
  timestamp: string;
  data?: any;
  from?: string;
}

export interface WebSocketOptions {
  userId?: string;
  organizationId?: string;
  token?: string;
  events?: string[];
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
}

export type WebSocketEventHandler = (message: WebSocketMessage) => void;

/**
 * WebSocket 客戶端管理類
 */
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private options: Required<WebSocketOptions>;
  private eventHandlers: Map<string, Set<WebSocketEventHandler>> = new Map();
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private isManualDisconnect = false;

  constructor(options: WebSocketOptions = {}) {
    this.options = {
      userId: options.userId || '',
      organizationId: options.organizationId || '',
      token: options.token || '',
      events: options.events || DASHBOARD_CONFIG.realtime.events.defaultSubscriptions,
      autoReconnect: options.autoReconnect ?? true,
      maxReconnectAttempts: options.maxReconnectAttempts || DASHBOARD_CONFIG.realtime.websocket.maxReconnectAttempts,
      reconnectInterval: options.reconnectInterval || DASHBOARD_CONFIG.realtime.websocket.reconnectInterval,
    };
  }

  /**
   * 建立 WebSocket 連線
   */
  async connect(): Promise<void> {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    this.isManualDisconnect = false;

    try {
      const url = this.buildWebSocketUrl();
      console.log('WebSocket 嘗試連線:', url);

      this.ws = new WebSocket(url);
      this.setupEventHandlers();

      // 等待連線建立
      await new Promise<void>((resolve, reject) => {
        if (!this.ws) {
          reject(new Error('WebSocket 初始化失敗'));
          return;
        }

        const timeout = setTimeout(() => {
          reject(new Error('WebSocket 連線超時'));
        }, DASHBOARD_CONFIG.realtime.websocket.connectionTimeout);

        this.ws.onopen = () => {
          clearTimeout(timeout);
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          console.log('WebSocket 連線成功');
          resolve();
        };

        this.ws.onerror = (error) => {
          clearTimeout(timeout);
          this.isConnecting = false;
          console.error('WebSocket 連線錯誤:', error);
          reject(error);
        };
      });

    } catch (error) {
      this.isConnecting = false;
      console.error('WebSocket 連線失敗:', error);
      
      if (this.options.autoReconnect && this.reconnectAttempts < this.options.maxReconnectAttempts) {
        this.scheduleReconnect();
      }
      
      throw error;
    }
  }

  /**
   * 關閉 WebSocket 連線
   */
  disconnect(): void {
    this.isManualDisconnect = true;
    this.clearReconnectTimer();
    this.clearHeartbeatTimer();

    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }

    console.log('WebSocket 連線已關閉');
  }

  /**
   * 發送訊息
   */
  send(message: Omit<WebSocketMessage, 'timestamp'>): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket 未連線，無法發送訊息');
      return false;
    }

    try {
      const fullMessage: WebSocketMessage = {
        ...message,
        timestamp: new Date().toISOString(),
      };

      this.ws.send(JSON.stringify(fullMessage));
      return true;
    } catch (error) {
      console.error('WebSocket 發送訊息失敗:', error);
      return false;
    }
  }

  /**
   * 訂閱事件
   */
  subscribe(eventType: string, handler: WebSocketEventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    
    this.eventHandlers.get(eventType)!.add(handler);

    // 如果已連線，立即更新訂閱
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({
        type: 'subscribe',
        data: { events: [eventType] },
      });
    }
  }

  /**
   * 取消訂閱事件
   */
  unsubscribe(eventType: string, handler?: WebSocketEventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      return;
    }

    const handlers = this.eventHandlers.get(eventType)!;
    
    if (handler) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.eventHandlers.delete(eventType);
      }
    } else {
      this.eventHandlers.delete(eventType);
    }

    // 如果已連線，立即更新訂閱
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({
        type: 'unsubscribe',
        data: { events: [eventType] },
      });
    }
  }

  /**
   * 取得連線狀態
   */
  getConnectionState(): 'connecting' | 'open' | 'closing' | 'closed' {
    if (this.isConnecting) return 'connecting';
    if (!this.ws) return 'closed';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'open';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'closed';
      default: return 'closed';
    }
  }

  /**
   * 檢查是否已連線
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * 建立 WebSocket URL
   */
  private buildWebSocketUrl(): string {
    const { websocket } = DASHBOARD_CONFIG.realtime;
    const url = new URL(websocket.url);
    
    // 添加查詢參數
    if (this.options.userId) {
      url.searchParams.set('userId', this.options.userId);
    }
    if (this.options.organizationId) {
      url.searchParams.set('orgId', this.options.organizationId);
    }
    if (this.options.token) {
      url.searchParams.set('token', this.options.token);
    }
    if (this.options.events.length > 0) {
      url.searchParams.set('events', this.options.events.join(','));
    }

    return url.toString();
  }

  /**
   * 設置 WebSocket 事件處理器
   */
  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('WebSocket 訊息解析錯誤:', error);
      }
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket 連線關閉:', event.code, event.reason);
      this.clearHeartbeatTimer();
      
      if (!this.isManualDisconnect && this.options.autoReconnect) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket 錯誤:', error);
    };
  }

  /**
   * 處理收到的訊息
   */
  private handleMessage(message: WebSocketMessage): void {
    const { type } = message;

    // 處理系統訊息
    switch (type) {
      case 'heartbeat':
        this.send({ type: 'heartbeat_response' });
        return;
      
      case 'connection_established':
        console.log('WebSocket 歡迎訊息:', message.data);
        return;
      
      case 'subscription_updated':
        console.log('WebSocket 訂閱更新:', message.data);
        return;
      
      case 'pong':
        // 心跳回應，不需要特別處理
        return;
      
      case 'error':
        console.error('WebSocket 伺服器錯誤:', message.data || message);
        return;
    }

    // 分發事件給註冊的處理器
    const handlers = this.eventHandlers.get(type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error('事件處理器錯誤:', error);
        }
      });
    }
  }

  /**
   * 開始心跳檢測
   */
  private startHeartbeat(): void {
    this.clearHeartbeatTimer();
    
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' });
      }
    }, DASHBOARD_CONFIG.realtime.websocket.heartbeatInterval);
  }

  /**
   * 清除心跳定時器
   */
  private clearHeartbeatTimer(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * 安排重新連線
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      console.error('WebSocket 重連次數已達上限，停止重連');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.options.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1);
    
    console.log(`WebSocket 將在 ${delay}ms 後嘗試第 ${this.reconnectAttempts} 次重連`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(error => {
        console.error('WebSocket 重連失敗:', error);
      });
    }, delay);
  }

  /**
   * 清除重連定時器
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

/**
 * 全域 WebSocket 客戶端實例
 */
let globalWebSocketClient: WebSocketClient | null = null;

/**
 * 取得全域 WebSocket 客戶端
 */
export function getWebSocketClient(options?: WebSocketOptions): WebSocketClient {
  if (!globalWebSocketClient) {
    globalWebSocketClient = new WebSocketClient(options);
  }
  return globalWebSocketClient;
}

/**
 * 初始化 WebSocket 連線
 */
export async function initializeWebSocket(options: WebSocketOptions): Promise<WebSocketClient> {
  const client = getWebSocketClient(options);
  await client.connect();
  return client;
}

/**
 * 清理 WebSocket 連線
 */
export function cleanupWebSocket(): void {
  if (globalWebSocketClient) {
    globalWebSocketClient.disconnect();
    globalWebSocketClient = null;
  }
}