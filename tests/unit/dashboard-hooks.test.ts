/**
 * Dashboard Hooks 單元測試
 * 測試 useRealTimeData hook 的各種功能
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useRealTimeData, useRealTimeMetrics, useRealTimeNotifications } from '@/hooks/use-real-time-data';

// Mock WebSocket 和 EventSource
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  url: string;
  readyState: number = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    
    // 模擬異步連線建立
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 100);
  }

  send(data: string) {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }

  // 模擬接收訊息
  simulateMessage(data: any) {
    if (this.readyState === MockWebSocket.OPEN && this.onmessage) {
      this.onmessage(new MessageEvent('message', {
        data: JSON.stringify(data)
      }));
    }
  }

  // 模擬連線錯誤
  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }
}

class MockEventSource {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 2;

  url: string;
  readyState: number = MockEventSource.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    
    setTimeout(() => {
      this.readyState = MockEventSource.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 100);
  }

  close() {
    this.readyState = MockEventSource.CLOSED;
  }

  // 模擬接收訊息
  simulateMessage(data: any) {
    if (this.readyState === MockEventSource.OPEN && this.onmessage) {
      this.onmessage(new MessageEvent('message', {
        data: JSON.stringify(data)
      }));
    }
  }

  // 模擬連線錯誤
  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }
}

// Mock 認證提供者
const mockUser = {
  uid: 'test-user-123',
  organizationId: 'test-org-456',
  email: 'test@example.com'
};

const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <div data-testid="mock-auth-provider">
      {children}
    </div>
  );
};

// Mock useAuth hook
jest.mock('@/providers/auth-provider', () => ({
  useAuth: () => ({
    user: mockUser
  })
}));

describe('useRealTimeData Hook 測試', () => {
  let mockWebSocket: MockWebSocket;
  let mockEventSource: MockEventSource;

  beforeEach(() => {
    // 設定全域 mocks
    (global as any).WebSocket = jest.fn((url: string) => {
      mockWebSocket = new MockWebSocket(url);
      return mockWebSocket;
    });

    (global as any).EventSource = jest.fn((url: string) => {
      mockEventSource = new MockEventSource(url);
      return mockEventSource;
    });

    // Mock 時間函數
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('基本連線功能', () => {
    
    test('應該成功建立 WebSocket 連線', async () => {
      const { result } = renderHook(() => useRealTimeData());

      // 初始狀態檢查
      expect(result.current.status).toBe('disconnected');
      expect(result.current.isConnected).toBe(false);

      // 模擬連線建立
      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(result.current.status).toBe('connected');
        expect(result.current.isConnected).toBe(true);
      });
    });

    test('應該在 WebSocket 不可用時使用 EventSource', async () => {
      // 禁用 WebSocket
      (global as any).WebSocket = undefined;

      const { result } = renderHook(() => useRealTimeData());

      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(result.current.status).toBe('connected');
        expect(global.EventSource).toHaveBeenCalled();
      });
    });

    test('應該正確處理連線失敗', async () => {
      const { result } = renderHook(() => useRealTimeData());

      act(() => {
        jest.advanceTimersByTime(100);
      });

      // 模擬連線錯誤
      act(() => {
        mockWebSocket.simulateError();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('error');
        expect(result.current.hasError).toBe(true);
        expect(result.current.error).toBeTruthy();
      });
    });
  });

  describe('事件處理功能', () => {
    
    test('應該接收和處理即時事件', async () => {
      const onEvent = jest.fn();
      const { result } = renderHook(() => 
        useRealTimeData({ onEvent })
      );

      // 等待連線建立
      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // 發送測試事件
      const testEvent = {
        type: 'dashboard_data_updated',
        id: 'test-event-1',
        timestamp: new Date().toISOString(),
        data: { metric: 'revenue', value: 100000 },
        organizationId: mockUser.organizationId,
        userId: mockUser.uid
      };

      act(() => {
        mockWebSocket.simulateMessage(testEvent);
      });

      await waitFor(() => {
        expect(onEvent).toHaveBeenCalledWith(expect.objectContaining({
          type: 'dashboard_data_updated',
          id: 'test-event-1',
          data: { metric: 'revenue', value: 100000 }
        }));
        expect(result.current.lastEvent).toEqual(expect.objectContaining(testEvent));
        expect(result.current.eventCount).toBe(1);
      });
    });

    test('應該只處理訂閱的事件類型', async () => {
      const onEvent = jest.fn();
      const { result } = renderHook(() => 
        useRealTimeData({
          onEvent,
          subscribeToEvents: ['metric_changed']
        })
      );

      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // 發送未訂閱的事件
      const unsubscribedEvent = {
        type: 'dashboard_data_updated',
        id: 'unsubscribed-event',
        timestamp: new Date().toISOString(),
        data: {},
        organizationId: mockUser.organizationId
      };

      act(() => {
        mockWebSocket.simulateMessage(unsubscribedEvent);
      });

      // 發送訂閱的事件
      const subscribedEvent = {
        type: 'metric_changed',
        id: 'subscribed-event',
        timestamp: new Date().toISOString(),
        data: {},
        organizationId: mockUser.organizationId
      };

      act(() => {
        mockWebSocket.simulateMessage(subscribedEvent);
      });

      await waitFor(() => {
        // 只應該處理訂閱的事件
        expect(onEvent).toHaveBeenCalledTimes(1);
        expect(onEvent).toHaveBeenCalledWith(expect.objectContaining({
          type: 'metric_changed'
        }));
        expect(result.current.eventCount).toBe(1);
      });
    });

    test('應該正確處理心跳回應', async () => {
      const { result } = renderHook(() => useRealTimeData());

      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // 模擬心跳回應
      const heartbeatResponse = {
        type: 'heartbeat_response',
        timestamp: new Date().toISOString()
      };

      act(() => {
        mockWebSocket.simulateMessage(heartbeatResponse);
      });

      await waitFor(() => {
        expect(result.current.lastHeartbeat).toBeTruthy();
      });
    });
  });

  describe('重連機制', () => {
    
    test('應該在連線斷開時自動重連', async () => {
      const { result } = renderHook(() => 
        useRealTimeData({
          autoReconnect: true,
          maxReconnectAttempts: 3,
          reconnectInterval: 1000
        })
      );

      // 等待初始連線
      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // 模擬連線斷開
      act(() => {
        mockWebSocket.close();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('reconnecting');
      });

      // 快進到重連時間
      act(() => {
        jest.advanceTimersByTime(1100);
      });

      await waitFor(() => {
        expect(result.current.reconnectAttempts).toBe(1);
      });
    });

    test('應該在達到最大重連次數後停止重連', async () => {
      const maxAttempts = 2;
      const { result } = renderHook(() => 
        useRealTimeData({
          autoReconnect: true,
          maxReconnectAttempts: maxAttempts,
          reconnectInterval: 100
        })
      );

      // 建立連線
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // 模擬多次連線失敗
      for (let i = 0; i < maxAttempts + 1; i++) {
        act(() => {
          if (mockWebSocket) {
            mockWebSocket.close();
          }
        });

        act(() => {
          jest.advanceTimersByTime(200);
        });
      }

      await waitFor(() => {
        expect(result.current.reconnectAttempts).toBeLessThanOrEqual(maxAttempts);
      });
    });

    test('手動重連應該重設重連計數', async () => {
      const { result } = renderHook(() => useRealTimeData());

      // 建立初始連線
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // 模擬一些失敗的重連嘗試
      act(() => {
        mockWebSocket.close();
      });

      act(() => {
        jest.advanceTimersByTime(5100); // 超過重連間隔
      });

      // 手動重連
      act(() => {
        result.current.reconnect();
      });

      await waitFor(() => {
        expect(result.current.reconnectAttempts).toBe(0);
      });
    });
  });

  describe('訊息發送和訂閱', () => {
    
    test('應該能夠發送 WebSocket 訊息', async () => {
      const { result } = renderHook(() => useRealTimeData());

      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Mock WebSocket send 方法
      const mockSend = jest.fn();
      mockWebSocket.send = mockSend;

      const testMessage = { type: 'test', data: 'hello' };
      
      act(() => {
        const success = result.current.sendMessage(testMessage);
        expect(success).toBe(true);
      });

      expect(mockSend).toHaveBeenCalledWith(JSON.stringify(testMessage));
    });

    test('應該能夠動態訂閱新事件類型', async () => {
      const { result } = renderHook(() => useRealTimeData());

      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      const mockSend = jest.fn();
      mockWebSocket.send = mockSend;

      act(() => {
        const success = result.current.subscribe(['new_event_type']);
        expect(success).toBe(true);
      });

      expect(mockSend).toHaveBeenCalledWith(JSON.stringify({
        type: 'subscribe',
        events: ['new_event_type'],
        organizationId: mockUser.organizationId
      }));
    });

    test('應該能夠取消訂閱事件類型', async () => {
      const { result } = renderHook(() => useRealTimeData());

      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      const mockSend = jest.fn();
      mockWebSocket.send = mockSend;

      act(() => {
        const success = result.current.unsubscribe(['dashboard_data_updated']);
        expect(success).toBe(true);
      });

      expect(mockSend).toHaveBeenCalledWith(JSON.stringify({
        type: 'unsubscribe',
        events: ['dashboard_data_updated'],
        organizationId: mockUser.organizationId
      }));
    });
  });

  describe('心跳機制', () => {
    
    test('應該定期發送心跳', async () => {
      const { result } = renderHook(() => 
        useRealTimeData({ heartbeatInterval: 1000 })
      );

      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      const mockSend = jest.fn();
      mockWebSocket.send = mockSend;

      // 快進到心跳時間
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.stringContaining('"type":"heartbeat"')
      );

      // 再次檢查後續心跳
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(mockSend).toHaveBeenCalledTimes(2);
    });
  });

  describe('清理機制', () => {
    
    test('應該在卸載時清理資源', async () => {
      const { result, unmount } = renderHook(() => useRealTimeData());

      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      const mockClose = jest.fn();
      mockWebSocket.close = mockClose;

      unmount();

      expect(mockClose).toHaveBeenCalled();
    });
  });
});

describe('專用 Hook 測試', () => {
  
  describe('useRealTimeMetrics', () => {
    test('應該只訂閱指標相關事件', async () => {
      const onMetricUpdate = jest.fn();
      const { result } = renderHook(() => 
        useRealTimeMetrics(onMetricUpdate)
      );

      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // 發送指標事件
      const metricEvent = {
        type: 'metric_changed',
        data: { metric: 'revenue', value: 120000 },
        organizationId: mockUser.organizationId
      };

      act(() => {
        if (mockWebSocket) {
          mockWebSocket.simulateMessage(metricEvent);
        }
      });

      await waitFor(() => {
        expect(onMetricUpdate).toHaveBeenCalledWith({ metric: 'revenue', value: 120000 });
      });
    });
  });

  describe('useRealTimeNotifications', () => {
    test('應該只處理通知事件', async () => {
      const onNotification = jest.fn();
      const { result } = renderHook(() => 
        useRealTimeNotifications(onNotification)
      );

      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // 發送通知事件
      const notificationEvent = {
        type: 'notification_received',
        data: { title: '新訊息', message: '您有一則新訊息' },
        organizationId: mockUser.organizationId
      };

      act(() => {
        if (mockWebSocket) {
          mockWebSocket.simulateMessage(notificationEvent);
        }
      });

      await waitFor(() => {
        expect(onNotification).toHaveBeenCalledWith({
          title: '新訊息',
          message: '您有一則新訊息'
        });
      });
    });
  });
});