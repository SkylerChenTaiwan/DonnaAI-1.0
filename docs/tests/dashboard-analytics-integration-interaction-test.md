# DonnaAI Dashboard Analytics Integration 互動測試報告

## 測試概覽

**測試日期**: 2025-08-18  
**測試範圍**: Dashboard Analytics Integration 系統完整互動功能  
**測試工具**: React Testing Library, Jest, Cypress, Manual Testing  
**測試狀態**: 待執行  

---

## 執行摘要

本報告針對 DonnaAI Dashboard Analytics Integration 系統進行全面的互動測試分析，涵蓋所有用戶可互動的元素，包括儀表板佈局、WebSocket 即時通訊、圖表互動、AI 查詢介面等核心功能。

### 關鍵發現

1. **高互動性複雜度**: 系統包含 47 個主要互動元素
2. **即時通訊整合**: WebSocket 連線需要穩定性和錯誤恢復測試
3. **響應式設計**: 6 個斷點需要跨裝置互動驗證
4. **AI 介面**: 語音輸入和自然語言處理需要特殊測試方法

---

## 測試架構分析

### 主要測試目標

| 組件分類 | 互動元素數量 | 複雜度等級 | 測試優先級 |
|---------|-------------|-----------|-----------|
| Dashboard Layout | 15 個元素 | 高 | P0 |
| Chart Container | 12 個元素 | 中 | P1 |
| AI Query Interface | 13 個元素 | 高 | P0 |
| WebSocket Integration | 7 個事件類型 | 高 | P0 |

---

## 1. Dashboard Layout 互動測試

### 1.1 佈局管理互動

#### 測試目標
- 響應式佈局在不同斷點的互動行為
- 小工具拖拽和重新排列功能
- 編輯模式和檢視模式切換

#### 關鍵互動元素
```typescript
// 主要互動元素清單
const dashboardInteractions = [
  'widget-drag-start',      // 小工具拖拽開始
  'widget-drag-end',        // 小工具拖拽結束
  'widget-selection',       // 小工具選取
  'container-click',        // 容器點擊取消選取
  'fullscreen-toggle',      // 全螢幕切換
  'widget-lock-toggle',     // 小工具鎖定/解鎖
  'widget-remove',          // 小工具刪除
  'layout-mode-switch',     // 佈局模式切換
  'connection-status',      // 連線狀態指示器
  'layout-settings',        // 佈局設定按鈕
  'save-changes',           // 儲存變更按鈕
  'widget-controls-menu',   // 小工具控制選單
  'more-options-menu',      // 更多選項選單
  'grid-background',        // 網格背景顯示
  'responsive-breakpoint'   // 響應式斷點切換
];
```

#### 測試案例

##### TC-DL-001: 小工具拖拽互動
```javascript
describe('小工具拖拽功能', () => {
  test('應該能夠拖拽小工具並重新定位', async () => {
    // 1. 設定編輯模式
    await setLayoutMode('edit');
    
    // 2. 選取小工具
    const widget = screen.getByTestId('widget-metrics-overview');
    
    // 3. 模擬拖拽操作
    fireEvent.mouseDown(widget, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(document, { clientX: 200, clientY: 150 });
    fireEvent.mouseUp(document);
    
    // 4. 驗證位置變更
    expect(widget).toHaveStyle({
      transform: expect.stringContaining('translate')
    });
  });

  test('應該在拖拽時顯示視覺回饋', async () => {
    const widget = screen.getByTestId('widget-revenue-chart');
    
    fireEvent.mouseDown(widget);
    
    // 驗證拖拽狀態
    expect(widget).toHaveClass('dragging');
    expect(widget).toHaveClass('opacity-80');
  });

  test('鎖定的小工具不應該能夠拖拽', async () => {
    const lockedWidget = screen.getByTestId('widget-locked');
    
    fireEvent.mouseDown(lockedWidget);
    
    // 驗證拖拽被阻止
    expect(lockedWidget).not.toHaveClass('dragging');
  });
});
```

##### TC-DL-002: 響應式佈局互動
```javascript
describe('響應式佈局互動', () => {
  const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
  
  test.each(breakpoints)('在 %s 斷點下互動應該正常', async (breakpoint) => {
    // 設定視窗大小
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: BREAKPOINTS[breakpoint],
    });
    
    // 觸發 resize 事件
    fireEvent(window, new Event('resize'));
    
    // 等待重新渲染
    await waitFor(() => {
      const container = screen.getByTestId('dashboard-layout');
      expect(container).toHaveClass(`breakpoint-${breakpoint}`);
    });
    
    // 驗證互動元素可用性
    const widgets = screen.getAllByTestId(/^widget-/);
    widgets.forEach(widget => {
      expect(widget).toBeVisible();
      expect(widget).not.toHaveAttribute('disabled');
    });
  });
});
```

##### TC-DL-003: 全螢幕模式互動
```javascript
describe('全螢幕模式互動', () => {
  test('應該能夠進入和退出全螢幕模式', async () => {
    const widget = screen.getByTestId('widget-ai-insights');
    const fullscreenBtn = within(widget).getByTitle('全螢幕');
    
    // 進入全螢幕
    fireEvent.click(fullscreenBtn);
    
    await waitFor(() => {
      expect(screen.getByTestId('fullscreen-container')).toBeInTheDocument();
    });
    
    // 退出全螢幕
    const exitBtn = screen.getByText('退出全螢幕');
    fireEvent.click(exitBtn);
    
    await waitFor(() => {
      expect(screen.queryByTestId('fullscreen-container')).not.toBeInTheDocument();
    });
  });
});
```

### 1.2 即時連線狀態互動

#### 測試案例

##### TC-DL-004: WebSocket 連線狀態指示器
```javascript
describe('WebSocket 連線狀態互動', () => {
  test('連線狀態指示器應該反映真實連線狀態', async () => {
    const mockWebSocket = new MockWebSocket();
    
    // 模擬連線中
    mockWebSocket.readyState = WebSocket.CONNECTING;
    
    const statusIndicator = screen.getByTestId('connection-status');
    expect(statusIndicator).toHaveClass('connecting');
    
    // 模擬連線成功
    mockWebSocket.readyState = WebSocket.OPEN;
    fireEvent(mockWebSocket, new Event('open'));
    
    await waitFor(() => {
      expect(statusIndicator).toHaveClass('connected');
      expect(within(statusIndicator).getByText('即時')).toBeInTheDocument();
    });
  });

  test('應該能夠手動重新連線', async () => {
    const statusIndicator = screen.getByTestId('connection-status');
    const reconnectBtn = within(statusIndicator).getByTitle('重新連線');
    
    fireEvent.click(reconnectBtn);
    
    // 驗證重新連線請求
    expect(mockReconnect).toHaveBeenCalled();
  });
});
```

---

## 2. Chart Container 互動測試

### 2.1 圖表類型切換互動

#### 測試目標
- 圖表類型選擇器功能
- 時間範圍選擇互動
- 圖表設定面板操作

#### 關鍵互動元素
```typescript
const chartInteractions = [
  'chart-type-selector',    // 圖表類型選擇器
  'time-range-selector',    // 時間範圍選擇器
  'refresh-button',         // 刷新按鈕
  'settings-toggle',        // 設定面板切換
  'fullscreen-button',      // 全螢幕按鈕
  'export-dropdown',        // 導出下拉選單
  'animation-checkbox',     // 動畫設定
  'interactive-checkbox',   // 互動模式設定
  'zoom-checkbox',          // 縮放設定
  'theme-radio',            // 主題選擇
  'chart-area',             // 圖表互動區域
  'toolbar-controls'        // 工具列控制項
];
```

#### 測試案例

##### TC-CC-001: 圖表類型切換互動
```javascript
describe('圖表類型切換', () => {
  const chartTypes = ['line', 'bar', 'pie', 'area'];
  
  test.each(chartTypes)('應該能夠切換到 %s 圖表', async (chartType) => {
    const typeSelector = screen.getByTestId('chart-type-selector');
    
    // 開啟選擇器
    fireEvent.click(typeSelector);
    
    // 選擇圖表類型
    const option = screen.getByText(getChartTypeLabel(chartType));
    fireEvent.click(option);
    
    // 驗證圖表變更
    await waitFor(() => {
      const chartContainer = screen.getByTestId('chart-container');
      expect(chartContainer).toHaveAttribute('data-chart-type', chartType);
    });
    
    // 驗證配置回調
    expect(mockOnConfigChange).toHaveBeenCalledWith({ type: chartType });
  });

  test('圖表類型切換應該保持資料完整性', async () => {
    const initialData = screen.getByTestId('chart-data');
    const dataCount = within(initialData).getByText(/\d+ 筆資料/);
    
    // 切換圖表類型
    await switchChartType('bar');
    
    // 驗證資料保持不變
    const updatedData = screen.getByTestId('chart-data');
    expect(within(updatedData).getByText(dataCount.textContent)).toBeInTheDocument();
  });
});
```

##### TC-CC-002: 時間範圍選擇互動
```javascript
describe('時間範圍選擇', () => {
  const timeRanges = ['7d', '30d', '90d', '6m', '1y'];
  
  test.each(timeRanges)('應該能夠選擇 %s 時間範圍', async (range) => {
    const timeSelector = screen.getByTestId('time-range-selector');
    
    fireEvent.click(timeSelector);
    
    const option = screen.getByText(getTimeRangeLabel(range));
    fireEvent.click(option);
    
    // 驗證時間範圍更新
    await waitFor(() => {
      expect(mockOnConfigChange).toHaveBeenCalledWith({
        timeRange: expect.objectContaining({
          start: expect.any(Date),
          end: expect.any(Date),
          granularity: expect.any(String)
        })
      });
    });
  });

  test('自訂時間範圍應該開啟日期選擇器', async () => {
    const timeSelector = screen.getByTestId('time-range-selector');
    
    fireEvent.click(timeSelector);
    fireEvent.click(screen.getByText('自訂範圍'));
    
    // 驗證日期選擇器出現
    expect(screen.getByTestId('date-picker')).toBeInTheDocument();
  });
});
```

##### TC-CC-003: 圖表設定面板互動
```javascript
describe('圖表設定面板', () => {
  beforeEach(() => {
    // 開啟設定面板
    fireEvent.click(screen.getByTestId('settings-toggle'));
  });

  test('動畫設定應該影響圖表行為', async () => {
    const animationCheckbox = screen.getByLabelText('動畫效果');
    
    // 關閉動畫
    fireEvent.click(animationCheckbox);
    
    expect(mockOnConfigChange).toHaveBeenCalledWith({ animated: false });
  });

  test('互動模式設定應該影響圖表可互動性', async () => {
    const interactiveCheckbox = screen.getByLabelText('互動模式');
    
    fireEvent.click(interactiveCheckbox);
    
    expect(mockOnConfigChange).toHaveBeenCalledWith({ interactive: false });
  });

  test('主題切換應該更新圖表外觀', async () => {
    const darkThemeRadio = screen.getByLabelText('深色');
    
    fireEvent.click(darkThemeRadio);
    
    expect(mockOnConfigChange).toHaveBeenCalledWith({ theme: 'dark' });
  });
});
```

### 2.2 即時資料更新互動

#### 測試案例

##### TC-CC-004: 即時指標更新
```javascript
describe('即時資料更新', () => {
  test('WebSocket 資料更新應該觸發圖表重新載入', async () => {
    const mockMetricsData = {
      totalRevenue: 130000,
      activeUsers: 900
    };
    
    // 模擬 WebSocket 事件
    mockWebSocketEvent('dashboard_data_updated', mockMetricsData);
    
    // 驗證刷新被呼叫
    await waitFor(() => {
      expect(mockOnRefresh).toHaveBeenCalled();
    });
    
    // 驗證更新時間顯示
    const updateTime = screen.getByText(/更新:/);
    expect(updateTime).toBeInTheDocument();
  });

  test('即時連線狀態應該正確顯示', async () => {
    const statusIndicator = screen.getByTestId('realtime-status');
    
    // 模擬連線
    mockIsConnected(true);
    
    await waitFor(() => {
      expect(statusIndicator).toHaveClass('bg-green-50', 'text-green-600');
      expect(within(statusIndicator).getByText('即時')).toBeInTheDocument();
    });
    
    // 模擬斷線
    mockIsConnected(false);
    
    await waitFor(() => {
      expect(statusIndicator).toHaveClass('bg-gray-50', 'text-gray-400');
    });
  });
});
```

---

## 3. AI Query Interface 互動測試

### 3.1 查詢輸入互動

#### 測試目標
- 文字輸入和提交功能
- 語音輸入功能
- 快速查詢建議

#### 關鍵互動元素
```typescript
const aiQueryInteractions = [
  'query-input',            // 查詢輸入框
  'voice-input-button',     // 語音輸入按鈕
  'send-button',           // 發送按鈕
  'quick-query-buttons',   // 快速查詢按鈕
  'category-buttons',      // 查詢分類按鈕
  'query-history',         // 查詢歷史
  'feedback-buttons',      // 反饋按鈕
  'copy-button',           // 複製按鈕
  'share-button',          // 分享按鈕
  'retry-button',          // 重試按鈕
  'related-queries',       // 相關查詢建議
  'processing-indicator',  // 處理狀態指示器
  'confidence-badge'       // 信心度標記
];
```

#### 測試案例

##### TC-AI-001: 文字查詢輸入互動
```javascript
describe('AI 查詢輸入', () => {
  test('應該能夠輸入和提交查詢', async () => {
    const queryInput = screen.getByPlaceholderText(/請輸入您的問題/);
    const sendButton = screen.getByTestId('send-button');
    
    // 輸入查詢
    fireEvent.change(queryInput, { target: { value: '本月營收表現如何？' } });
    
    // 驗證發送按鈕啟用
    expect(sendButton).not.toBeDisabled();
    
    // 提交查詢
    fireEvent.click(sendButton);
    
    // 驗證查詢被處理
    await waitFor(() => {
      expect(screen.getByText('AI 正在思考中...')).toBeInTheDocument();
    });
  });

  test('Enter 鍵應該提交查詢', async () => {
    const queryInput = screen.getByPlaceholderText(/請輸入您的問題/);
    
    fireEvent.change(queryInput, { target: { value: '客戶分析報告' } });
    fireEvent.keyPress(queryInput, { key: 'Enter', code: 'Enter' });
    
    await waitFor(() => {
      expect(screen.getByTestId('processing-indicator')).toBeInTheDocument();
    });
  });

  test('空查詢不應該被提交', async () => {
    const sendButton = screen.getByTestId('send-button');
    
    fireEvent.click(sendButton);
    
    expect(mockOnQuerySubmit).not.toHaveBeenCalled();
  });
});
```

##### TC-AI-002: 語音輸入互動
```javascript
describe('語音輸入功能', () => {
  beforeEach(() => {
    // 模擬語音識別 API
    global.webkitSpeechRecognition = jest.fn(() => ({
      continuous: false,
      interimResults: false,
      lang: 'zh-TW',
      start: jest.fn(),
      stop: jest.fn(),
      onresult: null,
      onerror: null,
      onend: null
    }));
  });

  test('應該能夠開始語音輸入', async () => {
    const voiceButton = screen.getByTestId('voice-input-button');
    
    fireEvent.click(voiceButton);
    
    // 驗證語音輸入狀態
    expect(voiceButton).toHaveClass('text-red-500', 'animate-pulse');
    expect(screen.getByTitle('停止錄音')).toBeInTheDocument();
  });

  test('語音識別結果應該填入輸入框', async () => {
    const voiceButton = screen.getByTestId('voice-input-button');
    const queryInput = screen.getByTestId('query-input');
    
    fireEvent.click(voiceButton);
    
    // 模擬語音識別結果
    const mockResult = {
      results: [[{ transcript: '顯示本週業績報告' }]]
    };
    
    // 觸發識別事件
    const recognition = global.webkitSpeechRecognition.mock.instances[0];
    recognition.onresult(mockResult);
    
    await waitFor(() => {
      expect(queryInput).toHaveValue('顯示本週業績報告');
    });
  });

  test('語音識別錯誤應該正確處理', async () => {
    const voiceButton = screen.getByTestId('voice-input-button');
    
    fireEvent.click(voiceButton);
    
    const recognition = global.webkitSpeechRecognition.mock.instances[0];
    recognition.onerror({ error: 'no-speech' });
    
    // 驗證錯誤狀態
    await waitFor(() => {
      expect(voiceButton).not.toHaveClass('animate-pulse');
    });
  });
});
```

##### TC-AI-003: 快速查詢互動
```javascript
describe('快速查詢功能', () => {
  test('快速查詢按鈕應該自動填入並提交', async () => {
    const quickQuery = screen.getByText('本月營收表現如何？');
    
    fireEvent.click(quickQuery);
    
    // 驗證查詢被提交
    await waitFor(() => {
      expect(mockOnQuerySubmit).toHaveBeenCalledWith('本月營收表現如何？');
    });
  });

  test('查詢分類應該觸發相關查詢', async () => {
    const revenueCategory = screen.getByText('營收分析');
    
    fireEvent.click(revenueCategory);
    
    // 驗證相關查詢被執行
    await waitFor(() => {
      expect(mockOnQuerySubmit).toHaveBeenCalledWith(
        expect.stringMatching(/營收|業績/)
      );
    });
  });
});
```

### 3.2 查詢回應互動

#### 測試案例

##### TC-AI-004: 回應顯示和互動
```javascript
describe('AI 回應互動', () => {
  const mockResponse = {
    id: 'response_1',
    answer: '根據最新資料分析，本月營收表現良好...',
    confidence: 85,
    sources: [{ type: 'dashboard', name: '儀表板數據' }],
    actionables: [{
      id: 'action1',
      title: '主動聯繫高價值客戶',
      priority: 'high'
    }],
    relatedQueries: ['詳細的月度報告在哪裡？']
  };

  test('回應應該正確顯示所有元素', async () => {
    await simulateQueryResponse(mockResponse);
    
    // 驗證回應內容
    expect(screen.getByText(mockResponse.answer)).toBeInTheDocument();
    
    // 驗證信心度標記
    expect(screen.getByText('可信度: 85%')).toBeInTheDocument();
    
    // 驗證資料來源
    expect(screen.getByText('儀表板數據')).toBeInTheDocument();
    
    // 驗證可行動建議
    expect(screen.getByText('主動聯繫高價值客戶')).toBeInTheDocument();
  });

  test('反饋按鈕應該記錄用戶回饋', async () => {
    await simulateQueryResponse(mockResponse);
    
    const thumbsUpButton = screen.getByTestId('feedback-up');
    fireEvent.click(thumbsUpButton);
    
    // 驗證反饋狀態
    expect(thumbsUpButton).toHaveClass('text-green-600');
    expect(mockRecordFeedback).toHaveBeenCalledWith('up');
  });

  test('相關查詢應該觸發新的查詢', async () => {
    await simulateQueryResponse(mockResponse);
    
    const relatedQuery = screen.getByText('詳細的月度報告在哪裡？');
    fireEvent.click(relatedQuery);
    
    expect(mockOnQuerySubmit).toHaveBeenCalledWith('詳細的月度報告在哪裡？');
  });

  test('複製按鈕應該複製回應內容', async () => {
    await simulateQueryResponse(mockResponse);
    
    // 模擬 clipboard API
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn().mockResolvedValue(undefined) }
    });
    
    const copyButton = screen.getByTestId('copy-button');
    fireEvent.click(copyButton);
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      mockResponse.answer
    );
  });
});
```

---

## 4. WebSocket 即時通訊測試

### 4.1 連線管理互動

#### 測試目標
- WebSocket 連線建立和維護
- 斷線重連機制
- 事件訂閱和取消訂閱

#### 關鍵事件類型
```typescript
const webSocketEvents = [
  'dashboard_data_updated',      // 儀表板資料更新
  'metric_changed',             // 指標變更
  'notification_received',      // 通知接收
  'team_member_status_updated', // 團隊成員狀態更新
  'task_status_changed',        // 任務狀態變更
  'new_customer_added',         // 新客戶添加
  'revenue_updated',            // 營收更新
  'system_alert',               // 系統警告
  'ai_query_completed',         // AI 查詢完成
  'data_sync_status'            // 資料同步狀態
];
```

#### 測試案例

##### TC-WS-001: WebSocket 連線生命週期
```javascript
describe('WebSocket 連線管理', () => {
  test('應該能夠建立 WebSocket 連線', async () => {
    const { result } = renderHook(() => useWebSocket());
    
    // 等待連線建立
    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
    
    expect(result.current.connectionState).toBe('open');
  });

  test('連線失敗應該觸發重連機制', async () => {
    const { result } = renderHook(() => useWebSocket());
    
    // 模擬連線失敗
    act(() => {
      result.current.client.close(1006, 'Connection failed');
    });
    
    // 驗證重連嘗試
    await waitFor(() => {
      expect(result.current.isConnecting).toBe(true);
    }, { timeout: 5000 });
  });

  test('手動重連應該重新建立連線', async () => {
    const { result } = renderHook(() => useWebSocket());
    
    // 斷開連線
    act(() => {
      result.current.disconnect();
    });
    
    expect(result.current.isConnected).toBe(false);
    
    // 手動重連
    act(() => {
      result.current.connect();
    });
    
    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
  });
});
```

##### TC-WS-002: 事件訂閱和處理
```javascript
describe('WebSocket 事件處理', () => {
  test('應該能夠訂閱和接收儀表板更新事件', async () => {
    const mockHandler = jest.fn();
    const { result } = renderHook(() => useWebSocket());
    
    // 訂閱事件
    act(() => {
      result.current.subscribe('dashboard_data_updated', mockHandler);
    });
    
    // 模擬服務器事件
    const mockData = { metrics: { revenue: 125000 } };
    mockWebSocketMessage({
      type: 'dashboard_data_updated',
      data: mockData
    });
    
    await waitFor(() => {
      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'dashboard_data_updated',
          data: mockData
        })
      );
    });
  });

  test('取消訂閱應該停止接收事件', async () => {
    const mockHandler = jest.fn();
    const { result } = renderHook(() => useWebSocket());
    
    // 訂閱事件
    const unsubscribe = result.current.subscribe('metric_changed', mockHandler);
    
    // 取消訂閱
    act(() => {
      unsubscribe();
    });
    
    // 發送事件
    mockWebSocketMessage({
      type: 'metric_changed',
      data: { metricName: 'revenue', value: 100000 }
    });
    
    // 驗證處理器未被呼叫
    expect(mockHandler).not.toHaveBeenCalled();
  });
});
```

##### TC-WS-003: 心跳和連線穩定性
```javascript
describe('WebSocket 連線穩定性', () => {
  test('應該定期發送心跳訊息', async () => {
    const { result } = renderHook(() => useWebSocket());
    
    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
    
    // 等待心跳間隔
    await act(async () => {
      jest.advanceTimersByTime(30000);
    });
    
    // 驗證心跳訊息
    expect(mockWebSocket.send).toHaveBeenCalledWith(
      JSON.stringify({
        type: 'heartbeat',
        timestamp: expect.any(String)
      })
    );
  });

  test('心跳回應應該更新連線狀態', async () => {
    const { result } = renderHook(() => useWebSocket());
    
    // 模擬心跳回應
    mockWebSocketMessage({
      type: 'heartbeat_response',
      timestamp: new Date().toISOString()
    });
    
    // 驗證連線保持活躍
    expect(result.current.isConnected).toBe(true);
  });
});
```

---

## 5. 錯誤處理和邊界情況測試

### 5.1 網路錯誤處理

#### 測試案例

##### TC-EH-001: 網路中斷處理
```javascript
describe('網路錯誤處理', () => {
  test('網路中斷應該顯示適當的錯誤訊息', async () => {
    // 模擬網路中斷
    mockNetworkError();
    
    await waitFor(() => {
      expect(screen.getByText(/網路連線中斷/)).toBeInTheDocument();
      expect(screen.getByText('重試')).toBeInTheDocument();
    });
  });

  test('API 請求失敗應該顯示錯誤狀態', async () => {
    const { result } = renderHook(() => useWebSocket());
    
    // 模擬 API 錯誤
    act(() => {
      result.current.send({
        type: 'api_request',
        data: { endpoint: '/metrics' }
      });
    });
    
    mockWebSocketMessage({
      type: 'error',
      message: 'API request failed'
    });
    
    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
  });
});
```

### 5.2 資料載入狀態

#### 測試案例

##### TC-EH-002: 載入狀態處理
```javascript
describe('載入狀態管理', () => {
  test('資料載入時應該顯示載入指示器', async () => {
    render(<ChartContainer config={mockConfig} isLoading={true} />);
    
    expect(screen.getByText('載入圖表資料中...')).toBeInTheDocument();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('空資料狀態應該顯示適當訊息', async () => {
    const emptyConfig = { ...mockConfig, data: [] };
    render(<ChartContainer config={emptyConfig} />);
    
    expect(screen.getByText('暫無資料')).toBeInTheDocument();
    expect(screen.getByText('目前沒有可顯示的圖表資料')).toBeInTheDocument();
  });
});
```

---

## 6. 可存取性 (Accessibility) 測試

### 6.1 鍵盤導航

#### 測試案例

##### TC-A11Y-001: 鍵盤導航支援
```javascript
describe('鍵盤導航', () => {
  test('所有互動元素應該可以用鍵盤存取', async () => {
    render(<DashboardLayout layoutConfig={mockLayout} />);
    
    // Tab 導航測試
    const focusableElements = screen.getAllByRole('button');
    
    focusableElements.forEach(element => {
      element.focus();
      expect(element).toHaveFocus();
      
      // 驗證焦點樣式
      expect(element).toHaveClass('focus:ring-2');
    });
  });

  test('Enter 和 Space 鍵應該觸發按鈕動作', async () => {
    const mockOnClick = jest.fn();
    render(<Button onClick={mockOnClick}>測試按鈕</Button>);
    
    const button = screen.getByRole('button');
    button.focus();
    
    // Enter 鍵
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(mockOnClick).toHaveBeenCalled();
    
    // Space 鍵
    fireEvent.keyDown(button, { key: ' ' });
    expect(mockOnClick).toHaveBeenCalledTimes(2);
  });
});
```

### 6.2 螢幕閱讀器支援

#### 測試案例

##### TC-A11Y-002: 語義化標記
```javascript
describe('螢幕閱讀器支援', () => {
  test('重要元素應該有適當的 ARIA 標籤', async () => {
    render(<AIQueryInterface />);
    
    // 驗證表單標籤
    expect(screen.getByLabelText(/請輸入您的問題/)).toBeInTheDocument();
    
    // 驗證狀態指示器
    const statusIndicator = screen.getByTestId('connection-status');
    expect(statusIndicator).toHaveAttribute('aria-label');
    
    // 驗證載入狀態
    const loadingElement = screen.getByText('AI 正在思考中...');
    expect(loadingElement).toHaveAttribute('aria-live', 'polite');
  });

  test('動態內容變更應該通知螢幕閱讀器', async () => {
    render(<ChartContainer config={mockConfig} />);
    
    // 模擬資料更新
    const updateButton = screen.getByTestId('refresh-button');
    fireEvent.click(updateButton);
    
    // 驗證 aria-live 區域更新
    await waitFor(() => {
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveTextContent(/資料已更新/);
    });
  });
});
```

---

## 7. 效能測試

### 7.1 互動回應性

#### 測試案例

##### TC-PERF-001: 互動延遲測試
```javascript
describe('互動效能', () => {
  test('按鈕點擊回應時間應該小於 100ms', async () => {
    render(<DashboardLayout layoutConfig={mockLayout} />);
    
    const button = screen.getByTestId('settings-button');
    
    const startTime = performance.now();
    fireEvent.click(button);
    
    await waitFor(() => {
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  test('大量資料渲染不應該阻塞 UI', async () => {
    const largeDataset = generateMockData(10000);
    const config = { ...mockConfig, data: largeDataset };
    
    const startTime = performance.now();
    render(<ChartContainer config={config} />);
    
    // 驗證渲染時間
    await waitFor(() => {
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000);
    });
    
    // 驗證互動仍然響應
    const refreshButton = screen.getByTestId('refresh-button');
    expect(refreshButton).not.toBeDisabled();
  });
});
```

---

## 8. 跨瀏覽器兼容性測試

### 8.1 瀏覽器特定功能

#### 測試案例

##### TC-COMPAT-001: 語音識別支援
```javascript
describe('瀏覽器兼容性', () => {
  test('不支援語音識別的瀏覽器應該隱藏語音按鈕', async () => {
    // 模擬不支援語音識別
    delete window.webkitSpeechRecognition;
    
    render(<AIQueryInterface />);
    
    expect(screen.queryByTestId('voice-input-button')).not.toBeInTheDocument();
  });

  test('WebSocket 不可用時應該回退到輪詢', async () => {
    // 模擬 WebSocket 不可用
    delete window.WebSocket;
    
    const { result } = renderHook(() => useWebSocket());
    
    // 應該回退到其他連線方式
    expect(result.current.connectionState).toBe('closed');
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('WebSocket not supported')
    );
  });
});
```

---

## 9. 測試執行計劃

### 9.1 自動化測試腳本

#### 單元測試
```bash
# 執行所有互動測試
npm run test:interaction

# 執行特定組件測試
npm run test -- --testNamePattern="Dashboard Layout"
npm run test -- --testNamePattern="Chart Container"
npm run test -- --testNamePattern="AI Query Interface"
npm run test -- --testNamePattern="WebSocket"

# 產生覆蓋率報告
npm run test:coverage
```

#### 整合測試
```bash
# Cypress 端到端測試
npm run e2e:open
npm run e2e:run

# 效能測試
npm run test:performance

# 可存取性測試
npm run test:a11y
```

### 9.2 手動測試檢查清單

#### Dashboard Layout
- [ ] 拖拽小工具重新排列
- [ ] 響應式佈局在不同螢幕尺寸下的表現
- [ ] 全螢幕模式進入和退出
- [ ] 小工具鎖定和解鎖
- [ ] 編輯模式和檢視模式切換
- [ ] 網格背景顯示和隱藏

#### Chart Container
- [ ] 圖表類型切換功能
- [ ] 時間範圍選擇器操作
- [ ] 設定面板開啟和關閉
- [ ] 導出功能各種格式
- [ ] 即時資料更新顯示
- [ ] 載入和錯誤狀態

#### AI Query Interface
- [ ] 文字輸入和提交
- [ ] 語音輸入錄音和識別
- [ ] 快速查詢按鈕
- [ ] 查詢分類選擇
- [ ] 回應反饋按鈕
- [ ] 相關查詢建議

#### WebSocket Integration
- [ ] 連線建立和狀態顯示
- [ ] 斷線重連機制
- [ ] 即時事件接收
- [ ] 心跳機制
- [ ] 錯誤處理

---

## 10. 已知問題和限制

### 10.1 目前限制

1. **語音識別**: 僅支援 Chrome 和 Edge 瀏覽器
2. **WebSocket**: 需要後端服務器支援
3. **即時圖表**: 大量資料可能影響效能
4. **行動裝置**: 某些拖拽功能在觸控裝置上體驗較差

### 10.2 改進建議

1. **語音輸入**: 增加更多瀏覽器支援或提供替代方案
2. **效能優化**: 實作虛擬化技術處理大量資料
3. **觸控支援**: 改善行動裝置的拖拽體驗
4. **錯誤恢復**: 增強網路錯誤的自動恢復機制

---

## 11. 測試結果摘要

### 11.1 測試覆蓋率目標

| 測試類型 | 目標覆蓋率 | 優先級 |
|---------|-----------|--------|
| 功能測試 | 95% | P0 |
| 互動測試 | 90% | P0 |
| 錯誤處理 | 85% | P1 |
| 效能測試 | 80% | P1 |
| 可存取性 | 100% | P0 |

### 11.2 成功標準

- ✅ 所有關鍵互動路徑都能正常工作
- ✅ 響應時間在可接受範圍內
- ✅ 錯誤狀態有適當的使用者回饋
- ✅ 可存取性符合 WCAG 2.1 AA 標準
- ✅ 跨瀏覽器兼容性良好

---

## 12. 後續行動項目

1. **實作自動化測試**: 根據本報告建立完整的測試套件
2. **效能監控**: 設置即時效能監控和警報
3. **使用者測試**: 進行真實用戶的互動測試
4. **持續改進**: 根據測試結果迭代改進互動設計

---

**測試負責人**: Claude AI  
**測試完成日期**: 待執行  
**下次檢核日期**: 功能更新後