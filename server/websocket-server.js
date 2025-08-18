#!/usr/bin/env node

/**
 * WebSocket 服務器
 * 為 Dashboard 提供即時通訊支援
 */

const WebSocket = require('ws');
const http = require('http');
const url = require('url');
const jwt = require('jsonwebtoken');

// 配置
const CONFIG = {
  port: process.env.WS_PORT || 3001,
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  heartbeatInterval: 30000, // 30 秒心跳
  maxConnections: 1000,
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
};

/**
 * WebSocket 連線管理器
 */
class WebSocketManager {
  constructor() {
    this.connections = new Map();
    this.organizationChannels = new Map();
    this.userChannels = new Map();
    this.stats = {
      totalConnections: 0,
      activeConnections: 0,
      messagesProcessed: 0,
      errors: 0,
    };
  }

  /**
   * 添加連線
   */
  addConnection(connectionId, ws, metadata) {
    const connection = {
      id: connectionId,
      ws,
      metadata,
      lastHeartbeat: Date.now(),
      createdAt: Date.now(),
      subscriptions: new Set(),
    };

    this.connections.set(connectionId, connection);
    this.stats.totalConnections++;
    this.stats.activeConnections++;

    // 按組織分組
    const { organizationId } = metadata;
    if (organizationId) {
      if (!this.organizationChannels.has(organizationId)) {
        this.organizationChannels.set(organizationId, new Set());
      }
      this.organizationChannels.get(organizationId).add(connectionId);
    }

    // 按用戶分組
    const { userId } = metadata;
    if (userId) {
      if (!this.userChannels.has(userId)) {
        this.userChannels.set(userId, new Set());
      }
      this.userChannels.get(userId).add(connectionId);
    }

    console.log(`WebSocket 連線已建立: ${connectionId} (組織: ${organizationId}, 用戶: ${userId})`);
    return connection;
  }

  /**
   * 移除連線
   */
  removeConnection(connectionId) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    const { organizationId, userId } = connection.metadata;

    // 從組織頻道移除
    if (organizationId && this.organizationChannels.has(organizationId)) {
      const orgConnections = this.organizationChannels.get(organizationId);
      orgConnections.delete(connectionId);
      if (orgConnections.size === 0) {
        this.organizationChannels.delete(organizationId);
      }
    }

    // 從用戶頻道移除
    if (userId && this.userChannels.has(userId)) {
      const userConnections = this.userChannels.get(userId);
      userConnections.delete(connectionId);
      if (userConnections.size === 0) {
        this.userChannels.delete(userId);
      }
    }

    this.connections.delete(connectionId);
    this.stats.activeConnections--;

    console.log(`WebSocket 連線已移除: ${connectionId}`);
  }

  /**
   * 發送訊息給特定連線
   */
  sendToConnection(connectionId, message) {
    const connection = this.connections.get(connectionId);
    if (!connection || connection.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      connection.ws.send(JSON.stringify(message));
      this.stats.messagesProcessed++;
      return true;
    } catch (error) {
      console.error(`發送訊息失敗 (${connectionId}):`, error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * 廣播訊息給組織
   */
  broadcastToOrganization(organizationId, message, excludeConnectionId = null) {
    const connections = this.organizationChannels.get(organizationId);
    if (!connections) return 0;

    let successCount = 0;
    for (const connectionId of connections) {
      if (connectionId !== excludeConnectionId) {
        if (this.sendToConnection(connectionId, message)) {
          successCount++;
        }
      }
    }

    return successCount;
  }

  /**
   * 發送訊息給特定用戶
   */
  sendToUser(userId, message) {
    const connections = this.userChannels.get(userId);
    if (!connections) return 0;

    let successCount = 0;
    for (const connectionId of connections) {
      if (this.sendToConnection(connectionId, message)) {
        successCount++;
      }
    }

    return successCount;
  }

  /**
   * 廣播給所有連線
   */
  broadcast(message, filter = null) {
    let successCount = 0;
    for (const [connectionId, connection] of this.connections) {
      if (!filter || filter(connection)) {
        if (this.sendToConnection(connectionId, message)) {
          successCount++;
        }
      }
    }
    return successCount;
  }

  /**
   * 處理訂閱
   */
  subscribe(connectionId, eventTypes) {
    const connection = this.connections.get(connectionId);
    if (!connection) return false;

    eventTypes.forEach(eventType => {
      connection.subscriptions.add(eventType);
    });

    return true;
  }

  /**
   * 處理取消訂閱
   */
  unsubscribe(connectionId, eventTypes) {
    const connection = this.connections.get(connectionId);
    if (!connection) return false;

    eventTypes.forEach(eventType => {
      connection.subscriptions.delete(eventType);
    });

    return true;
  }

  /**
   * 檢查連線是否訂閱了特定事件
   */
  isSubscribed(connectionId, eventType) {
    const connection = this.connections.get(connectionId);
    return connection ? connection.subscriptions.has(eventType) : false;
  }

  /**
   * 更新心跳
   */
  updateHeartbeat(connectionId) {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.lastHeartbeat = Date.now();
    }
  }

  /**
   * 清理過期連線
   */
  cleanupStaleConnections() {
    const now = Date.now();
    const staleThreshold = CONFIG.heartbeatInterval * 3; // 3 倍心跳間隔

    for (const [connectionId, connection] of this.connections) {
      if (now - connection.lastHeartbeat > staleThreshold) {
        console.log(`清理過期連線: ${connectionId}`);
        connection.ws.terminate();
        this.removeConnection(connectionId);
      }
    }
  }

  /**
   * 獲取統計資訊
   */
  getStats() {
    return {
      ...this.stats,
      organizationChannels: this.organizationChannels.size,
      userChannels: this.userChannels.size,
      averageConnectionsPerOrg: this.organizationChannels.size > 0 
        ? this.stats.activeConnections / this.organizationChannels.size 
        : 0,
    };
  }
}

/**
 * JWT 驗證中間件
 */
function authenticateToken(token) {
  try {
    if (!token) {
      throw new Error('Missing token');
    }

    const decoded = jwt.verify(token, CONFIG.jwtSecret);
    return { success: true, user: decoded };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 解析連線參數
 */
function parseConnectionParams(request) {
  const query = url.parse(request.url, true).query;
  
  return {
    userId: query.userId,
    organizationId: query.orgId,
    token: query.token || request.headers.authorization?.replace('Bearer ', ''),
    events: query.events ? query.events.split(',') : ['dashboard_data_updated'],
  };
}

/**
 * 建立 WebSocket 服務器
 */
function createWebSocketServer() {
  const server = http.createServer();
  const wss = new WebSocket.Server({ 
    server,
    perMessageDeflate: {
      zlibDeflateOptions: {
        chunkSize: 4096,
        windowBits: 13,
        level: 3,
      },
      threshold: 1024,
      concurrencyLimit: 10,
      serverMaxWindow: 13,
      clientMaxWindow: 13,
    },
  });

  const manager = new WebSocketManager();

  // 設定定期清理
  setInterval(() => {
    manager.cleanupStaleConnections();
  }, CONFIG.heartbeatInterval);

  // 設定統計報告
  setInterval(() => {
    const stats = manager.getStats();
    console.log('WebSocket 統計:', JSON.stringify(stats, null, 2));
  }, 60000); // 每分鐘報告一次

  wss.on('connection', (ws, request) => {
    const connectionId = `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const params = parseConnectionParams(request);

    // 驗證認證 (開發模式下跳過)
    if (process.env.NODE_ENV === 'production') {
      const authResult = authenticateToken(params.token);
      if (!authResult.success) {
        console.log(`WebSocket 認證失敗: ${authResult.error}`);
        ws.close(1008, 'Authentication failed');
        return;
      }
    }

    // 檢查連線數限制
    if (manager.stats.activeConnections >= CONFIG.maxConnections) {
      console.log('WebSocket 連線數已達上限');
      ws.close(1008, 'Connection limit exceeded');
      return;
    }

    // 建立連線
    const connection = manager.addConnection(connectionId, ws, {
      userId: params.userId,
      organizationId: params.organizationId,
      userAgent: request.headers['user-agent'],
      ip: request.socket.remoteAddress,
    });

    // 訂閱初始事件
    manager.subscribe(connectionId, params.events);

    // 發送歡迎訊息
    manager.sendToConnection(connectionId, {
      type: 'connection_established',
      connectionId,
      timestamp: new Date().toISOString(),
      data: {
        message: 'WebSocket 連線已建立',
        subscribedEvents: params.events,
      },
    });

    // 設定心跳
    const heartbeatInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        manager.sendToConnection(connectionId, {
          type: 'heartbeat',
          timestamp: new Date().toISOString(),
        });
      } else {
        clearInterval(heartbeatInterval);
      }
    }, CONFIG.heartbeatInterval);

    // 處理訊息
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        handleWebSocketMessage(connectionId, message, manager);
      } catch (error) {
        console.error(`WebSocket 訊息解析錯誤 (${connectionId}):`, error);
        manager.sendToConnection(connectionId, {
          type: 'error',
          message: 'Invalid message format',
        });
      }
    });

    // 處理連線關閉
    ws.on('close', (code, reason) => {
      console.log(`WebSocket 連線關閉: ${connectionId} (${code}: ${reason})`);
      clearInterval(heartbeatInterval);
      manager.removeConnection(connectionId);
    });

    // 處理錯誤
    ws.on('error', (error) => {
      console.error(`WebSocket 錯誤 (${connectionId}):`, error);
      manager.removeConnection(connectionId);
    });
  });

  return { server, wss, manager };
}

/**
 * 處理 WebSocket 訊息
 */
function handleWebSocketMessage(connectionId, message, manager) {
  const { type, data } = message;

  switch (type) {
    case 'heartbeat_response':
      manager.updateHeartbeat(connectionId);
      break;

    case 'subscribe':
      if (data.events && Array.isArray(data.events)) {
        manager.subscribe(connectionId, data.events);
        manager.sendToConnection(connectionId, {
          type: 'subscription_updated',
          data: { subscribedEvents: data.events },
        });
      }
      break;

    case 'unsubscribe':
      if (data.events && Array.isArray(data.events)) {
        manager.unsubscribe(connectionId, data.events);
        manager.sendToConnection(connectionId, {
          type: 'subscription_updated',
          data: { unsubscribedEvents: data.events },
        });
      }
      break;

    case 'broadcast':
      // 允許客戶端廣播訊息（需要適當的權限檢查）
      if (data.organizationId) {
        manager.broadcastToOrganization(data.organizationId, {
          type: 'client_broadcast',
          data: data.message,
          from: connectionId,
          timestamp: new Date().toISOString(),
        }, connectionId);
      }
      break;

    case 'ping':
      manager.sendToConnection(connectionId, {
        type: 'pong',
        timestamp: new Date().toISOString(),
      });
      break;

    default:
      console.log(`未知的 WebSocket 訊息類型: ${type}`);
      manager.sendToConnection(connectionId, {
        type: 'error',
        message: `Unknown message type: ${type}`,
      });
  }
}

/**
 * 啟動服務器
 */
function startServer() {
  const { server, manager } = createWebSocketServer();

  server.listen(CONFIG.port, () => {
    console.log(`WebSocket 服務器啟動在端口 ${CONFIG.port}`);
    console.log(`CORS 來源: ${CONFIG.cors.origin}`);
    console.log(`最大連線數: ${CONFIG.maxConnections}`);
    console.log(`心跳間隔: ${CONFIG.heartbeatInterval}ms`);
  });

  // 優雅關閉
  process.on('SIGTERM', () => {
    console.log('收到 SIGTERM，正在關閉 WebSocket 服務器...');
    server.close(() => {
      console.log('WebSocket 服務器已關閉');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('收到 SIGINT，正在關閉 WebSocket 服務器...');
    server.close(() => {
      console.log('WebSocket 服務器已關閉');
      process.exit(0);
    });
  });

  // 模擬事件廣播（開發模式）
  if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
      const mockEvents = [
        {
          type: 'dashboard_data_updated',
          data: {
            metrics: {
              totalRevenue: 125430 + Math.floor(Math.random() * 10000) - 5000,
              activeUsers: 856 + Math.floor(Math.random() * 100) - 50,
            },
          },
        },
        {
          type: 'metric_changed',
          data: {
            metricName: 'conversionRate',
            oldValue: 3.2,
            newValue: 3.2 + (Math.random() * 0.4) - 0.2,
          },
        },
        {
          type: 'notification_received',
          data: {
            title: '系統通知',
            message: '新的資料更新已可用',
            priority: 'normal',
          },
        },
      ];

      const randomEvent = mockEvents[Math.floor(Math.random() * mockEvents.length)];
      
      manager.broadcast({
        ...randomEvent,
        id: `event_${Date.now()}`,
        timestamp: new Date().toISOString(),
      });

      console.log(`廣播模擬事件: ${randomEvent.type}`);
    }, 15000); // 每 15 秒廣播一次
  }

  return { server, manager };
}

// 如果直接執行此腳本
if (require.main === module) {
  startServer();
}

module.exports = {
  createWebSocketServer,
  WebSocketManager,
  CONFIG,
};