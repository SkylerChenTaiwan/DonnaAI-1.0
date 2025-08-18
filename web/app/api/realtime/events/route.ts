/**
 * Server-Sent Events (SSE) API
 * 為前端提供即時資料更新串流
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { Permission } from '@/lib/auth/permissions';

// 全域 SSE 連線管理器
class SSEConnectionManager {
  private connections = new Map<string, WritableStreamDefaultWriter>();
  private userConnections = new Map<string, Set<string>>();

  // 添加連線
  addConnection(connectionId: string, userId: string, writer: WritableStreamDefaultWriter) {
    this.connections.set(connectionId, writer);
    
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId)!.add(connectionId);
    
    console.log(`SSE 連線已建立: ${connectionId} (用戶: ${userId})`);
  }

  // 移除連線
  removeConnection(connectionId: string, userId: string) {
    this.connections.delete(connectionId);
    
    const userConns = this.userConnections.get(userId);
    if (userConns) {
      userConns.delete(connectionId);
      if (userConns.size === 0) {
        this.userConnections.delete(userId);
      }
    }
    
    console.log(`SSE 連線已移除: ${connectionId} (用戶: ${userId})`);
  }

  // 向特定用戶發送訊息
  async sendToUser(userId: string, data: any) {
    const userConns = this.userConnections.get(userId);
    if (!userConns) return;

    const message = `data: ${JSON.stringify(data)}\n\n`;
    const promises: Promise<void>[] = [];

    for (const connectionId of userConns) {
      const writer = this.connections.get(connectionId);
      if (writer) {
        promises.push(
          writer.write(new TextEncoder().encode(message)).catch((error) => {
            console.error(`發送 SSE 訊息失敗 (${connectionId}):`, error);
            this.removeConnection(connectionId, userId);
          })
        );
      }
    }

    await Promise.allSettled(promises);
  }

  // 向組織發送訊息
  async sendToOrganization(organizationId: string, data: any) {
    // 這裡需要根據組織 ID 找到相關用戶
    // 簡化實作：向所有連線發送
    const message = `data: ${JSON.stringify(data)}\n\n`;
    const promises: Promise<void>[] = [];

    for (const [connectionId, writer] of this.connections) {
      promises.push(
        writer.write(new TextEncoder().encode(message)).catch((error) => {
          console.error(`發送 SSE 組織訊息失敗 (${connectionId}):`, error);
        })
      );
    }

    await Promise.allSettled(promises);
  }

  // 廣播訊息
  async broadcast(data: any) {
    const message = `data: ${JSON.stringify(data)}\n\n`;
    const promises: Promise<void>[] = [];

    for (const [connectionId, writer] of this.connections) {
      promises.push(
        writer.write(new TextEncoder().encode(message)).catch((error) => {
          console.error(`廣播 SSE 訊息失敗 (${connectionId}):`, error);
        })
      );
    }

    await Promise.allSettled(promises);
  }

  // 獲取連線統計
  getStats() {
    return {
      totalConnections: this.connections.size,
      totalUsers: this.userConnections.size,
      userConnections: Array.from(this.userConnections.entries()).map(([userId, connections]) => ({
        userId,
        connectionCount: connections.size,
      })),
    };
  }
}

// 全域 SSE 管理器實例
const sseManager = new SSEConnectionManager();

// 導出 SSE 管理器供其他地方使用
export { sseManager };

export async function GET(request: NextRequest) {
  const authResult = await withAuth(request, {
    requireAuth: true,
    requiredPermissions: [Permission.DASHBOARD_VIEW],
    resource: 'realtime',
    action: 'read'
  });

  if (!authResult.success) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.statusCode }
    );
  }

  const { user } = authResult;
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId') || user.uid;
  const organizationId = searchParams.get('orgId') || user.organizationId;
  const events = searchParams.get('events')?.split(',') || ['dashboard_data_updated'];

  // 驗證權限
  if (userId !== user.uid && !user.permissions?.includes(Permission.ADMIN)) {
    return NextResponse.json(
      { error: '無權限訪問其他用戶的即時資料' },
      { status: 403 }
    );
  }

  const connectionId = `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // 建立 SSE 串流
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      const writer = controller;
      
      // 發送初始連線訊息
      const welcomeMessage = {
        type: 'connection_established',
        connectionId,
        timestamp: new Date().toISOString(),
        subscribedEvents: events,
        data: {
          message: '即時資料串流已建立',
          userId,
          organizationId,
        }
      };
      
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(welcomeMessage)}\n\n`));

      // 註冊連線到管理器
      const writerProxy = {
        write: (chunk: Uint8Array) => {
          try {
            controller.enqueue(chunk);
            return Promise.resolve();
          } catch (error) {
            return Promise.reject(error);
          }
        }
      };
      
      sseManager.addConnection(connectionId, userId, writerProxy as WritableStreamDefaultWriter);

      // 設定心跳
      const heartbeatInterval = setInterval(() => {
        try {
          const heartbeat = {
            type: 'heartbeat',
            timestamp: new Date().toISOString(),
            connectionId,
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(heartbeat)}\n\n`));
        } catch (error) {
          console.error('心跳發送失敗:', error);
          clearInterval(heartbeatInterval);
        }
      }, 30000); // 每 30 秒發送心跳

      // 模擬即時資料更新（開發階段）
      const mockDataInterval = setInterval(() => {
        try {
          // 隨機發送不同類型的事件
          const eventTypes = events.filter(e => ['dashboard_data_updated', 'metric_changed', 'notification_received'].includes(e));
          const randomEventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
          
          let mockData: any = {
            type: randomEventType,
            id: `event_${Date.now()}`,
            timestamp: new Date().toISOString(),
            organizationId,
            userId,
          };

          switch (randomEventType) {
            case 'dashboard_data_updated':
              mockData.data = {
                metrics: {
                  totalRevenue: 125430 + Math.floor(Math.random() * 10000) - 5000,
                  activeUsers: 856 + Math.floor(Math.random() * 100) - 50,
                  conversionRate: 3.2 + (Math.random() * 2) - 1,
                },
                timestamp: new Date().toISOString(),
              };
              break;
              
            case 'metric_changed':
              mockData.data = {
                metricName: 'totalRevenue',
                oldValue: 125430,
                newValue: 127580,
                change: 2150,
                changePercent: 1.7,
              };
              break;
              
            case 'notification_received':
              mockData.data = {
                title: '新的客戶訊息',
                message: '客戶張三剛才發送了新訊息',
                priority: 'normal',
                category: 'customer',
              };
              break;
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify(mockData)}\n\n`));
        } catch (error) {
          console.error('模擬資料發送失敗:', error);
          clearInterval(mockDataInterval);
        }
      }, 10000 + Math.random() * 20000); // 每 10-30 秒隨機發送

      // 清理函數
      const cleanup = () => {
        clearInterval(heartbeatInterval);
        clearInterval(mockDataInterval);
        sseManager.removeConnection(connectionId, userId);
      };

      // 當串流關閉時清理
      request.signal.addEventListener('abort', cleanup);
      
      // 存儲清理函數供後續使用
      (writer as any).cleanup = cleanup;
    },

    cancel() {
      console.log(`SSE 串流已取消: ${connectionId}`);
      sseManager.removeConnection(connectionId, userId);
    }
  });

  // 返回 SSE 回應
  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// 健康檢查端點
export async function POST(request: NextRequest) {
  const authResult = await withAuth(request, {
    requireAuth: true,
    requiredPermissions: [Permission.ADMIN],
    resource: 'realtime',
    action: 'admin'
  });

  if (!authResult.success) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.statusCode }
    );
  }

  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'broadcast':
        await sseManager.broadcast(data);
        return NextResponse.json({ success: true, message: '廣播訊息已發送' });

      case 'send_to_user':
        const { userId, message } = data;
        await sseManager.sendToUser(userId, message);
        return NextResponse.json({ success: true, message: '用戶訊息已發送' });

      case 'send_to_organization':
        const { organizationId, orgMessage } = data;
        await sseManager.sendToOrganization(organizationId, orgMessage);
        return NextResponse.json({ success: true, message: '組織訊息已發送' });

      case 'get_stats':
        const stats = sseManager.getStats();
        return NextResponse.json({ success: true, data: stats });

      default:
        return NextResponse.json(
          { error: '不支援的操作' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('SSE 管理操作失敗:', error);
    return NextResponse.json(
      { error: '操作失敗' },
      { status: 500 }
    );
  }
}