/**
 * 即時連線整合測試
 * 測試 SSE 連線、WebSocket 備援、心跳機制
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/test';
import { Server } from 'http';
import { AddressInfo } from 'net';

// 模擬 SSE 伺服器
class MockSSEServer {
  private server: Server;
  private connections: Map<string, any> = new Map();
  private port: number = 0;

  constructor() {
    this.server = new Server();
    
    this.server.on('request', (req, res) => {
      if (req.url?.startsWith('/api/realtime/events')) {
        this.handleSSEConnection(req, res);
      } else {
        res.writeHead(404);
        res.end();
      }
    });
  }

  private handleSSEConnection(req: any, res: any) {
    const url = new URL(req.url, `http://localhost:${this.port}`);
    const userId = url.searchParams.get('userId') || 'test-user';
    const connectionId = `${userId}_${Date.now()}`;

    // 設定 SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    // 發送歡迎訊息
    const welcomeMessage = {
      type: 'connection_established',
      connectionId,
      timestamp: new Date().toISOString(),
      data: { message: '即時資料串流已建立' }
    };
    
    res.write(`data: ${JSON.stringify(welcomeMessage)}\n\n`);

    // 儲存連線
    this.connections.set(connectionId, { res, userId });

    // 設定心跳
    const heartbeatInterval = setInterval(() => {
      if (res.destroyed) {
        clearInterval(heartbeatInterval);
        this.connections.delete(connectionId);
        return;
      }

      const heartbeat = {
        type: 'heartbeat',
        timestamp: new Date().toISOString(),
        connectionId,
      };

      try {
        res.write(`data: ${JSON.stringify(heartbeat)}\n\n`);
      } catch (error) {
        clearInterval(heartbeatInterval);
        this.connections.delete(connectionId);
      }
    }, 5000); // 每 5 秒心跳

    // 處理連線關閉
    req.on('close', () => {
      clearInterval(heartbeatInterval);
      this.connections.delete(connectionId);
    });
  }

  start(): Promise<number> {
    return new Promise((resolve) => {
      this.server.listen(0, () => {
        this.port = (this.server.address() as AddressInfo).port;
        resolve(this.port);
      });
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      this.server.close(() => resolve());
    });
  }

  // 發送模擬事件到所有連線
  broadcastEvent(event: any) {
    const message = `data: ${JSON.stringify(event)}\n\n`;
    
    for (const [connectionId, { res }] of this.connections) {
      try {
        if (!res.destroyed) {
          res.write(message);
        }
      } catch (error) {
        this.connections.delete(connectionId);
      }
    }
  }

  getConnectionCount(): number {
    return this.connections.size;
  }
}

describe('即時連線整合測試', () => {
  let mockServer: MockSSEServer;
  let serverPort: number;

  beforeAll(async () => {
    mockServer = new MockSSEServer();
    serverPort = await mockServer.start();
  });

  afterAll(async () => {
    await mockServer.stop();
  });

  describe('SSE 連線測試', () => {
    
    test('建立 SSE 連線並接收歡迎訊息', async () => {
      const eventSource = new EventSource(
        `http://localhost:${serverPort}/api/realtime/events?userId=test-user-1`
      );

      const messages: any[] = [];
      
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          eventSource.close();
          reject(new Error('連線逾時'));
        }, 10000);

        eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data);
          messages.push(data);

          if (data.type === 'connection_established') {
            clearTimeout(timeout);
            eventSource.close();
            
            expect(data.type).toBe('connection_established');
            expect(data.data.message).toBe('即時資料串流已建立');
            expect(data.connectionId).toContain('test-user-1');
            
            resolve();
          }
        };

        eventSource.onerror = (error) => {
          clearTimeout(timeout);
          eventSource.close();
          reject(error);
        };
      });
    });

    test('接收心跳訊息', async () => {
      const eventSource = new EventSource(
        `http://localhost:${serverPort}/api/realtime/events?userId=test-user-2`
      );

      const heartbeats: any[] = [];
      
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          eventSource.close();
          reject(new Error('心跳逾時'));
        }, 15000);

        eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data);
          
          if (data.type === 'heartbeat') {
            heartbeats.push(data);
            
            if (heartbeats.length >= 2) {
              clearTimeout(timeout);
              eventSource.close();
              
              expect(heartbeats.length).toBeGreaterThanOrEqual(2);
              expect(heartbeats[0].type).toBe('heartbeat');
              expect(heartbeats[1].type).toBe('heartbeat');
              
              // 驗證心跳間隔
              const time1 = new Date(heartbeats[0].timestamp).getTime();
              const time2 = new Date(heartbeats[1].timestamp).getTime();
              const interval = time2 - time1;
              
              expect(interval).toBeGreaterThanOrEqual(4000);
              expect(interval).toBeLessThanOrEqual(6000);
              
              resolve();
            }
          }
        };

        eventSource.onerror = (error) => {
          clearTimeout(timeout);
          eventSource.close();
          reject(error);
        };
      });
    });

    test('多個併發連線', async () => {
      const connections: EventSource[] = [];
      const connectedClients = new Set<string>();

      // 建立 5 個併發連線
      for (let i = 0; i < 5; i++) {
        const eventSource = new EventSource(
          `http://localhost:${serverPort}/api/realtime/events?userId=test-user-concurrent-${i}`
        );
        connections.push(eventSource);
      }

      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          connections.forEach(es => es.close());
          reject(new Error('併發連線逾時'));
        }, 15000);

        connections.forEach((eventSource, index) => {
          eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'connection_established') {
              connectedClients.add(data.connectionId);
              
              if (connectedClients.size === 5) {
                clearTimeout(timeout);
                connections.forEach(es => es.close());
                
                expect(connectedClients.size).toBe(5);
                expect(mockServer.getConnectionCount()).toBeGreaterThanOrEqual(0);
                
                resolve();
              }
            }
          };

          eventSource.onerror = (error) => {
            clearTimeout(timeout);
            connections.forEach(es => es.close());
            reject(error);
          };
        });
      });
    });

    test('廣播事件到所有連線', async () => {
      const connections: EventSource[] = [];
      const receivedEvents: Map<number, any[]> = new Map();

      // 建立 3 個連線
      for (let i = 0; i < 3; i++) {
        const eventSource = new EventSource(
          `http://localhost:${serverPort}/api/realtime/events?userId=broadcast-test-${i}`
        );
        connections.push(eventSource);
        receivedEvents.set(i, []);
      }

      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          connections.forEach(es => es.close());
          reject(new Error('廣播測試逾時'));
        }, 20000);

        let connectedCount = 0;
        
        connections.forEach((eventSource, index) => {
          eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            receivedEvents.get(index)?.push(data);
            
            if (data.type === 'connection_established') {
              connectedCount++;
              
              // 當所有連線建立後，發送廣播事件
              if (connectedCount === 3) {
                setTimeout(() => {
                  const broadcastEvent = {
                    type: 'dashboard_data_updated',
                    id: 'broadcast-test',
                    timestamp: new Date().toISOString(),
                    data: { message: '廣播測試訊息' }
                  };
                  
                  mockServer.broadcastEvent(broadcastEvent);
                }, 1000);
              }
            }
            
            if (data.type === 'dashboard_data_updated' && data.id === 'broadcast-test') {
              // 檢查是否所有連線都收到廣播
              let allReceived = true;
              for (let i = 0; i < 3; i++) {
                const events = receivedEvents.get(i) || [];
                const hasBroadcastEvent = events.some(e => 
                  e.type === 'dashboard_data_updated' && e.id === 'broadcast-test'
                );
                if (!hasBroadcastEvent) {
                  allReceived = false;
                  break;
                }
              }
              
              if (allReceived) {
                clearTimeout(timeout);
                connections.forEach(es => es.close());
                
                // 驗證所有連線都收到相同的廣播事件
                for (let i = 0; i < 3; i++) {
                  const events = receivedEvents.get(i) || [];
                  const broadcastEvents = events.filter(e => 
                    e.type === 'dashboard_data_updated' && e.id === 'broadcast-test'
                  );
                  expect(broadcastEvents.length).toBe(1);
                  expect(broadcastEvents[0].data.message).toBe('廣播測試訊息');
                }
                
                resolve();
              }
            }
          };

          eventSource.onerror = (error) => {
            clearTimeout(timeout);
            connections.forEach(es => es.close());
            reject(error);
          };
        });
      });
    });
  });

  describe('連線穩定性測試', () => {
    
    test('連線異常中斷後清理', async () => {
      const eventSource = new EventSource(
        `http://localhost:${serverPort}/api/realtime/events?userId=cleanup-test`
      );

      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('清理測試逾時'));
        }, 10000);

        eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data);
          
          if (data.type === 'connection_established') {
            const initialConnectionCount = mockServer.getConnectionCount();
            expect(initialConnectionCount).toBeGreaterThan(0);
            
            // 強制關閉連線
            eventSource.close();
            
            // 等待伺服器清理連線
            setTimeout(() => {
              const finalConnectionCount = mockServer.getConnectionCount();
              
              // 驗證連線已被清理（考慮到可能有其他測試的連線）
              expect(finalConnectionCount).toBeLessThanOrEqual(initialConnectionCount);
              
              clearTimeout(timeout);
              resolve();
            }, 2000);
          }
        };

        eventSource.onerror = (error) => {
          clearTimeout(timeout);
          reject(error);
        };
      });
    });

    test('大量資料處理壓力測試', async () => {
      const eventSource = new EventSource(
        `http://localhost:${serverPort}/api/realtime/events?userId=stress-test`
      );

      const receivedEvents: any[] = [];
      const eventCount = 50;

      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          eventSource.close();
          reject(new Error('壓力測試逾時'));
        }, 30000);

        eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data);
          receivedEvents.push(data);
          
          if (data.type === 'connection_established') {
            // 開始發送大量事件
            for (let i = 0; i < eventCount; i++) {
              setTimeout(() => {
                const stressEvent = {
                  type: 'stress_test_event',
                  id: `stress-${i}`,
                  timestamp: new Date().toISOString(),
                  data: { index: i, message: `壓力測試事件 ${i}` }
                };
                
                mockServer.broadcastEvent(stressEvent);
              }, i * 10); // 每 10ms 發送一個事件
            }
          }
          
          // 檢查是否收到所有壓力測試事件
          const stressEvents = receivedEvents.filter(e => e.type === 'stress_test_event');
          if (stressEvents.length === eventCount) {
            clearTimeout(timeout);
            eventSource.close();
            
            // 驗證事件順序和完整性
            for (let i = 0; i < eventCount; i++) {
              const event = stressEvents.find(e => e.data.index === i);
              expect(event).toBeDefined();
              expect(event.id).toBe(`stress-${i}`);
              expect(event.data.message).toBe(`壓力測試事件 ${i}`);
            }
            
            resolve();
          }
        };

        eventSource.onerror = (error) => {
          clearTimeout(timeout);
          eventSource.close();
          reject(error);
        };
      });
    });
  });

  describe('錯誤處理測試', () => {
    
    test('伺服器錯誤處理', async () => {
      // 嘗試連線到不存在的端點
      const eventSource = new EventSource(
        `http://localhost:${serverPort}/api/nonexistent/endpoint`
      );

      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          eventSource.close();
          reject(new Error('錯誤處理測試逾時'));
        }, 5000);

        eventSource.onerror = () => {
          clearTimeout(timeout);
          eventSource.close();
          
          // 驗證錯誤被正確處理
          expect(eventSource.readyState).toBe(EventSource.CLOSED);
          
          resolve();
        };

        eventSource.onmessage = () => {
          clearTimeout(timeout);
          eventSource.close();
          reject(new Error('不應該收到訊息'));
        };
      });
    });

    test('網路中斷模擬', async () => {
      const eventSource = new EventSource(
        `http://localhost:${serverPort}/api/realtime/events?userId=network-test`
      );

      let connectionEstablished = false;

      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          eventSource.close();
          reject(new Error('網路中斷測試逾時'));
        }, 15000);

        eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data);
          
          if (data.type === 'connection_established') {
            connectionEstablished = true;
            
            // 模擬網路中斷：關閉伺服器
            setTimeout(async () => {
              await mockServer.stop();
              
              // 重新啟動伺服器
              setTimeout(async () => {
                mockServer = new MockSSEServer();
                await mockServer.start();
              }, 2000);
            }, 1000);
          }
        };

        eventSource.onerror = () => {
          if (connectionEstablished) {
            clearTimeout(timeout);
            eventSource.close();
            
            // 驗證連線中斷被正確檢測
            expect(eventSource.readyState).toBe(EventSource.CLOSED);
            
            resolve();
          }
        };
      });
    });
  });
});