/**
 * Dashboard 即時資料更新功能 E2E 測試
 * 測試 SSE 連線、即時更新、互動功能
 */

import { test, expect, Page } from '@playwright/test';

// 測試資料和配置
const TEST_CONFIG = {
  dashboardUrl: '/dashboard',
  sseEndpoint: '/api/realtime/events',
  testUser: {
    email: 'test@example.com',
    password: 'testpassword'
  },
  timeouts: {
    connection: 10000,
    dataUpdate: 15000,
    interaction: 5000
  }
};

// 輔助函數：等待元素出現
async function waitForElement(page: Page, selector: string, timeout = 5000) {
  return await page.waitForSelector(selector, { timeout });
}

// 輔助函數：檢查即時連線狀態
async function checkConnectionStatus(page: Page, expectedStatus: 'connected' | 'disconnected') {
  const statusText = expectedStatus === 'connected' ? '即時連線' : '已斷線';
  const statusElement = page.locator('text=' + statusText).first();
  await expect(statusElement).toBeVisible({ timeout: 10000 });
}

// 輔助函數：模擬 SSE 事件
async function simulateSSEEvent(page: Page, eventType: string, data: any) {
  return await page.evaluate(async ({ eventType, data }) => {
    // 模擬接收 SSE 事件
    const event = new CustomEvent('sse-message', {
      detail: {
        type: eventType,
        data: data,
        timestamp: new Date().toISOString()
      }
    });
    window.dispatchEvent(event);
  }, { eventType, data });
}

test.describe('Dashboard 即時資料更新功能測試', () => {
  
  test.beforeEach(async ({ page }) => {
    // 導航到 Dashboard 頁面
    await page.goto(TEST_CONFIG.dashboardUrl);
    
    // 等待頁面載入完成
    await waitForElement(page, '[data-testid="dashboard-layout"]', TEST_CONFIG.timeouts.connection);
    
    // 等待即時連線建立
    await checkConnectionStatus(page, 'connected');
  });

  test.describe('1. 即時連線測試', () => {
    
    test('1.1 檢查 SSE 連線是否正常建立', async ({ page }) => {
      // 檢查連線狀態指示器
      const connectionIndicator = page.locator('[data-testid="connection-status"]');
      await expect(connectionIndicator).toBeVisible();
      
      // 檢查連線狀態文字
      await checkConnectionStatus(page, 'connected');
      
      // 檢查連線圖標是否為連線狀態
      const wifiIcon = page.locator('[data-testid="wifi-icon"]');
      await expect(wifiIcon).toBeVisible();
      
      // 檢查脈衝動畫是否存在（表示即時連線）
      const pulseElement = page.locator('.animate-pulse');
      await expect(pulseElement).toBeVisible();
    });

    test('1.2 驗證心跳機制', async ({ page }) => {
      // 監聽網路請求以捕獲心跳
      const heartbeatRequests = [];
      page.on('response', response => {
        if (response.url().includes('/api/realtime/events')) {
          heartbeatRequests.push(response);
        }
      });

      // 等待至少一次心跳（30秒間隔，但測試環境可能縮短）
      await page.waitForTimeout(35000);
      
      // 驗證是否收到心跳回應
      expect(heartbeatRequests.length).toBeGreaterThan(0);
    });

    test('1.3 測試斷線重連功能', async ({ page }) => {
      // 模擬網路中斷
      await page.setOffline(true);
      
      // 檢查連線狀態變為斷線
      await checkConnectionStatus(page, 'disconnected');
      
      // 恢復網路連線
      await page.setOffline(false);
      
      // 等待自動重連
      await page.waitForTimeout(5000);
      
      // 檢查連線狀態恢復
      await checkConnectionStatus(page, 'connected');
    });

    test('1.4 測試手動重連功能', async ({ page }) => {
      // 模擬斷線狀態
      await page.setOffline(true);
      await checkConnectionStatus(page, 'disconnected');
      
      // 恢復網路
      await page.setOffline(false);
      
      // 點擊重連按鈕
      const reconnectButton = page.locator('[data-testid="reconnect-button"]');
      await reconnectButton.click();
      
      // 驗證重連成功
      await checkConnectionStatus(page, 'connected');
    });
  });

  test.describe('2. Dashboard 互動測試', () => {
    
    test('2.1 小工具拖拽功能', async ({ page }) => {
      // 切換到編輯模式
      const editButton = page.locator('text=編輯');
      await editButton.click();
      
      // 等待編輯模式啟用
      await expect(page.locator('[data-testid="edit-mode"]')).toBeVisible();
      
      // 選擇第一個小工具進行拖拽
      const widget = page.locator('[data-testid="dashboard-widget"]').first();
      await expect(widget).toBeVisible();
      
      // 獲取原始位置
      const originalBoundingBox = await widget.boundingBox();
      
      // 執行拖拽操作
      await widget.hover();
      await page.mouse.down();
      await page.mouse.move(
        originalBoundingBox!.x + 200, 
        originalBoundingBox!.y + 100
      );
      await page.mouse.up();
      
      // 驗證小工具位置已改變
      const newBoundingBox = await widget.boundingBox();
      expect(newBoundingBox!.x).not.toBe(originalBoundingBox!.x);
      expect(newBoundingBox!.y).not.toBe(originalBoundingBox!.y);
    });

    test('2.2 佈局模式切換（檢視/編輯）', async ({ page }) => {
      // 初始檢查檢視模式
      await expect(page.locator('[data-testid="view-mode"]')).toBeVisible();
      
      // 切換到編輯模式
      const editButton = page.locator('text=編輯');
      await editButton.click();
      
      // 驗證編輯模式啟用
      await expect(page.locator('[data-testid="edit-mode"]')).toBeVisible();
      await expect(page.locator('text=編輯模式')).toBeVisible();
      
      // 驗證網格背景顯示
      const gridBackground = page.locator('.grid-background');
      await expect(gridBackground).toBeVisible();
      
      // 切換回檢視模式
      const viewButton = page.locator('text=完成編輯');
      await viewButton.click();
      
      // 驗證回到檢視模式
      await expect(page.locator('[data-testid="view-mode"]')).toBeVisible();
    });

    test('2.3 即時狀態顯示更新', async ({ page }) => {
      // 檢查初始連線狀態
      const connectionStatus = page.locator('[data-testid="connection-status"]');
      await expect(connectionStatus).toContainText('即時連線');
      
      // 檢查最後更新時間顯示
      const lastUpdate = page.locator('[data-testid="last-update"]');
      await expect(lastUpdate).toBeVisible();
      
      // 模擬即時資料更新
      await simulateSSEEvent(page, 'dashboard_data_updated', {
        metrics: { revenue: 130000, users: 890 }
      });
      
      // 驗證更新時間變更
      await page.waitForTimeout(1000);
      const updatedTime = await lastUpdate.textContent();
      expect(updatedTime).toBeTruthy();
      
      // 檢查事件計數器
      const eventCounter = page.locator('[data-testid="event-counter"]');
      await expect(eventCounter).toContainText('事件');
    });

    test('2.4 小工具控制選單功能', async ({ page }) => {
      // 切換到編輯模式
      await page.locator('text=編輯').click();
      
      // 選擇一個小工具
      const widget = page.locator('[data-testid="dashboard-widget"]').first();
      await widget.click();
      
      // 檢查控制選單是否出現
      const controlMenu = page.locator('[data-testid="widget-controls"]');
      await expect(controlMenu).toBeVisible();
      
      // 測試鎖定/解鎖功能
      const lockButton = page.locator('[data-testid="lock-widget"]');
      await lockButton.click();
      
      // 驗證鎖定狀態
      await expect(page.locator('[data-testid="locked-indicator"]')).toBeVisible();
      
      // 測試全螢幕功能
      const fullscreenButton = page.locator('[data-testid="fullscreen-widget"]');
      await fullscreenButton.click();
      
      // 驗證全螢幕模式
      await expect(page.locator('[data-testid="fullscreen-mode"]')).toBeVisible();
      
      // 退出全螢幕
      const exitFullscreen = page.locator('text=退出全螢幕');
      await exitFullscreen.click();
    });
  });

  test.describe('3. 圖表互動測試', () => {
    
    test('3.1 圖表類型切換', async ({ page }) => {
      // 定位圖表容器
      const chartContainer = page.locator('[data-testid="chart-container"]').first();
      await expect(chartContainer).toBeVisible();
      
      // 點擊圖表類型選擇器
      const chartTypeSelector = chartContainer.locator('[data-testid="chart-type-selector"]');
      await chartTypeSelector.click();
      
      // 選擇條圖
      const barChartOption = page.locator('text=條圖');
      await barChartOption.click();
      
      // 驗證圖表類型已變更
      const barChartIcon = chartContainer.locator('[data-testid="bar-chart-icon"]');
      await expect(barChartIcon).toBeVisible();
      
      // 測試切換到圓餅圖
      await chartTypeSelector.click();
      const pieChartOption = page.locator('text=圓餅圖');
      await pieChartOption.click();
      
      // 驗證圓餅圖顯示
      const pieChartIcon = chartContainer.locator('[data-testid="pie-chart-icon"]');
      await expect(pieChartIcon).toBeVisible();
    });

    test('3.2 時間範圍選擇功能', async ({ page }) => {
      const chartContainer = page.locator('[data-testid="chart-container"]').first();
      
      // 點擊時間範圍選擇器
      const timeRangeSelector = chartContainer.locator('[data-testid="time-range-selector"]');
      await timeRangeSelector.click();
      
      // 選擇「過去 7 天」
      const sevenDaysOption = page.locator('text=過去 7 天');
      await sevenDaysOption.click();
      
      // 驗證時間範圍標籤更新
      const timeRangeBadge = chartContainer.locator('[data-testid="time-range-badge"]');
      await expect(timeRangeBadge).toContainText('7d');
      
      // 測試自訂範圍
      await timeRangeSelector.click();
      const customOption = page.locator('text=自訂範圍');
      await customOption.click();
      
      // 這裡可以添加日期選擇器的測試
    });

    test('3.3 即時資料更新顯示', async ({ page }) => {
      const chartContainer = page.locator('[data-testid="chart-container"]').first();
      
      // 檢查即時狀態指示器
      const realtimeIndicator = chartContainer.locator('[data-testid="realtime-indicator"]');
      await expect(realtimeIndicator).toBeVisible();
      await expect(realtimeIndicator).toContainText('即時');
      
      // 模擬接收圖表資料更新
      await simulateSSEEvent(page, 'metric_changed', {
        chartId: 'revenue-chart',
        newData: [
          { name: '今日', value: 15000 },
          { name: '昨日', value: 12000 }
        ]
      });
      
      // 驗證更新時間戳記
      const updateBadge = chartContainer.locator('[data-testid="chart-update-badge"]');
      await expect(updateBadge).toBeVisible();
      
      // 檢查更新時間格式
      const updateText = await updateBadge.textContent();
      expect(updateText).toMatch(/更新: \d{2}:\d{2}:\d{2}/);
    });

    test('3.4 圖表設定面板', async ({ page }) => {
      const chartContainer = page.locator('[data-testid="chart-container"]').first();
      
      // 點擊設定按鈕
      const settingsButton = chartContainer.locator('[data-testid="chart-settings"]');
      await settingsButton.click();
      
      // 驗證設定面板顯示
      const settingsPanel = chartContainer.locator('[data-testid="chart-settings-panel"]');
      await expect(settingsPanel).toBeVisible();
      
      // 測試動畫設定
      const animationToggle = settingsPanel.locator('[data-testid="animation-toggle"]');
      await animationToggle.click();
      
      // 測試互動模式設定
      const interactiveToggle = settingsPanel.locator('[data-testid="interactive-toggle"]');
      await interactiveToggle.click();
      
      // 測試顏色主題切換
      const darkThemeRadio = settingsPanel.locator('[data-testid="dark-theme"]');
      await darkThemeRadio.click();
      
      // 驗證設定已套用（這裡需要檢查實際的視覺變化）
    });
  });

  test.describe('4. AI 查詢測試', () => {
    
    test('4.1 文字查詢輸入和提交', async ({ page }) => {
      // 定位 AI 查詢介面
      const aiInterface = page.locator('[data-testid="ai-query-interface"]');
      await expect(aiInterface).toBeVisible();
      
      // 輸入查詢文字
      const queryInput = aiInterface.locator('[data-testid="query-input"]');
      await queryInput.fill('本月營收表現如何？');
      
      // 點擊發送按鈕
      const sendButton = aiInterface.locator('[data-testid="send-button"]');
      await sendButton.click();
      
      // 驗證處理中狀態
      const processingIndicator = page.locator('[data-testid="processing-indicator"]');
      await expect(processingIndicator).toBeVisible();
      await expect(processingIndicator).toContainText('AI 正在思考中');
      
      // 等待回應
      const response = page.locator('[data-testid="ai-response"]').first();
      await expect(response).toBeVisible({ timeout: 15000 });
      
      // 驗證回應內容包含相關資訊
      const responseText = await response.textContent();
      expect(responseText).toContain('營收');
    });

    test('4.2 快速查詢按鈕', async ({ page }) => {
      const aiInterface = page.locator('[data-testid="ai-query-interface"]');
      
      // 點擊快速查詢按鈕
      const quickQueryButton = aiInterface.locator('[data-testid="quick-query"]').first();
      const quickQueryText = await quickQueryButton.textContent();
      await quickQueryButton.click();
      
      // 驗證查詢輸入框已填入快速查詢文字
      const queryInput = aiInterface.locator('[data-testid="query-input"]');
      const inputValue = await queryInput.inputValue();
      expect(inputValue).toBe(quickQueryText?.trim());
      
      // 驗證自動提交
      const response = page.locator('[data-testid="ai-response"]').first();
      await expect(response).toBeVisible({ timeout: 15000 });
    });

    test('4.3 語音輸入功能（如果支援）', async ({ page }) => {
      const aiInterface = page.locator('[data-testid="ai-query-interface"]');
      
      // 檢查語音按鈕是否存在
      const voiceButton = aiInterface.locator('[data-testid="voice-button"]');
      
      if (await voiceButton.isVisible()) {
        // 點擊語音輸入按鈕
        await voiceButton.click();
        
        // 驗證錄音狀態
        await expect(voiceButton).toHaveClass(/animate-pulse/);
        const micOffIcon = voiceButton.locator('[data-testid="mic-off-icon"]');
        await expect(micOffIcon).toBeVisible();
        
        // 停止錄音
        await voiceButton.click();
        
        // 驗證錄音結束
        const micIcon = voiceButton.locator('[data-testid="mic-icon"]');
        await expect(micIcon).toBeVisible();
      } else {
        // 如果不支援語音輸入，跳過此測試
        test.skip();
      }
    });

    test('4.4 查詢回應互動功能', async ({ page }) => {
      // 先提交一個查詢
      const aiInterface = page.locator('[data-testid="ai-query-interface"]');
      const queryInput = aiInterface.locator('[data-testid="query-input"]');
      await queryInput.fill('團隊績效如何？');
      
      const sendButton = aiInterface.locator('[data-testid="send-button"]');
      await sendButton.click();
      
      // 等待回應
      const queryItem = page.locator('[data-testid="query-item"]').first();
      await expect(queryItem).toBeVisible({ timeout: 15000 });
      
      // 測試正面反饋
      const thumbsUpButton = queryItem.locator('[data-testid="thumbs-up"]');
      await thumbsUpButton.click();
      await expect(thumbsUpButton).toHaveClass(/text-green-600/);
      
      // 測試複製功能
      const copyButton = queryItem.locator('[data-testid="copy-response"]');
      await copyButton.click();
      
      // 測試相關查詢建議
      const relatedQuery = queryItem.locator('[data-testid="related-query"]').first();
      if (await relatedQuery.isVisible()) {
        await relatedQuery.click();
        
        // 驗證新查詢已提交
        const newQueryItem = page.locator('[data-testid="query-item"]').first();
        await expect(newQueryItem).not.toBe(queryItem);
      }
    });
  });

  test.describe('5. 整體 UX 測試', () => {
    
    test('5.1 頁面載入流程', async ({ page }) => {
      // 重新載入頁面測試
      await page.reload();
      
      // 檢查載入狀態
      const loadingIndicator = page.locator('[data-testid="loading-indicator"]');
      if (await loadingIndicator.isVisible()) {
        await expect(loadingIndicator).toContainText('載入儀表板中');
      }
      
      // 驗證頁面完全載入
      await expect(page.locator('[data-testid="dashboard-layout"]')).toBeVisible();
      
      // 檢查所有關鍵元素都已載入
      await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible();
      await expect(page.locator('[data-testid="connection-status"]')).toBeVisible();
      await expect(page.locator('[data-testid="dashboard-widgets"]')).toBeVisible();
    });

    test('5.2 響應式設計測試', async ({ page }) => {
      // 測試桌面版本
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(1000);
      
      // 驗證桌面佈局
      const desktopNav = page.locator('[data-testid="desktop-nav"]');
      await expect(desktopNav).toBeVisible();
      
      // 測試平板版本
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(1000);
      
      // 驗證平板佈局調整
      const gridContainer = page.locator('[data-testid="dashboard-grid"]');
      await expect(gridContainer).toBeVisible();
      
      // 測試手機版本
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(1000);
      
      // 驗證手機佈局
      const mobileLayout = page.locator('[data-testid="mobile-layout"]');
      if (await mobileLayout.isVisible()) {
        await expect(mobileLayout).toBeVisible();
      }
    });

    test('5.3 錯誤處理測試', async ({ page }) => {
      // 模擬 API 錯誤
      await page.route('/api/realtime/events', route => 
        route.fulfill({ status: 500, body: 'Internal Server Error' })
      );
      
      await page.reload();
      
      // 檢查錯誤狀態顯示
      await checkConnectionStatus(page, 'disconnected');
      
      // 檢查是否有重試按鈕
      const retryButton = page.locator('[data-testid="retry-button"]');
      if (await retryButton.isVisible()) {
        await expect(retryButton).toBeEnabled();
      }
    });

    test('5.4 效能測試', async ({ page }) => {
      // 測試大量小工具的效能
      const startTime = Date.now();
      
      // 切換到編輯模式並添加多個小工具
      await page.locator('text=編輯').click();
      
      const addWidgetButton = page.locator('[data-testid="add-widget"]');
      
      // 添加 5 個小工具並測試載入時間
      for (let i = 0; i < 5; i++) {
        await addWidgetButton.click();
        
        // 選擇第一個可用的小工具類型
        const widgetOption = page.locator('[data-testid="widget-option"]').first();
        await widgetOption.click();
        
        const confirmButton = page.locator('text=確認添加');
        await confirmButton.click();
        
        // 等待小工具載入
        await page.waitForTimeout(500);
      }
      
      const endTime = Date.now();
      const loadTime = endTime - startTime;
      
      // 驗證載入時間合理（應該在 10 秒內）
      expect(loadTime).toBeLessThan(10000);
      
      // 檢查所有小工具都正確顯示
      const widgets = page.locator('[data-testid="dashboard-widget"]');
      const widgetCount = await widgets.count();
      expect(widgetCount).toBeGreaterThanOrEqual(5);
    });

    test('5.5 鍵盤導航測試', async ({ page }) => {
      // 測試 Tab 鍵導航
      await page.keyboard.press('Tab');
      
      // 檢查焦點是否在第一個可聚焦元素上
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // 繼續 Tab 導航
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);
      }
      
      // 測試 Enter 鍵啟動元素
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      
      // 測試 Escape 鍵關閉選單
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    });
  });

  test.describe('6. 邊界條件和壓力測試', () => {
    
    test('6.1 大量即時事件處理', async ({ page }) => {
      // 模擬快速連續的即時事件
      const eventPromises = [];
      
      for (let i = 0; i < 20; i++) {
        eventPromises.push(
          simulateSSEEvent(page, 'dashboard_data_updated', {
            id: `batch-event-${i}`,
            timestamp: Date.now() + i
          })
        );
      }
      
      await Promise.all(eventPromises);
      
      // 驗證系統仍然響應
      const connectionStatus = page.locator('[data-testid="connection-status"]');
      await expect(connectionStatus).toBeVisible();
      
      // 檢查事件計數器
      const eventCounter = page.locator('[data-testid="event-counter"]');
      if (await eventCounter.isVisible()) {
        const counterText = await eventCounter.textContent();
        expect(counterText).toContain('事件');
      }
    });

    test('6.2 長時間連線穩定性', async ({ page }) => {
      // 測試 2 分鐘的連續連線
      const testDuration = 120000; // 2 分鐘
      const checkInterval = 10000; // 每 10 秒檢查一次
      
      let checksCount = 0;
      const maxChecks = testDuration / checkInterval;
      
      const intervalId = setInterval(async () => {
        if (checksCount >= maxChecks) {
          clearInterval(intervalId);
          return;
        }
        
        // 檢查連線狀態
        const connectionStatus = page.locator('[data-testid="connection-status"]');
        await expect(connectionStatus).toContainText('即時連線');
        
        checksCount++;
      }, checkInterval);
      
      // 等待測試完成
      await page.waitForTimeout(testDuration);
    });

    test('6.3 併發使用者模擬', async ({ browser }) => {
      // 建立多個瀏覽器上下文模擬多個使用者
      const contexts = await Promise.all([
        browser.newContext(),
        browser.newContext(),
        browser.newContext()
      ]);
      
      const pages = await Promise.all(
        contexts.map(context => context.newPage())
      );
      
      // 所有使用者同時訪問 Dashboard
      await Promise.all(
        pages.map(page => page.goto(TEST_CONFIG.dashboardUrl))
      );
      
      // 驗證所有頁面都正確載入
      for (const page of pages) {
        await expect(page.locator('[data-testid="dashboard-layout"]')).toBeVisible();
        await checkConnectionStatus(page, 'connected');
      }
      
      // 清理資源
      await Promise.all(contexts.map(context => context.close()));
    });
  });
});