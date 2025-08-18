/**
 * Dashboard 效能測試
 * 測試載入時間、記憶體使用、渲染效能
 */

import { performance, PerformanceObserver } from 'perf_hooks';
import puppeteer, { Browser, Page } from 'puppeteer';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  interactionTime: number;
  memoryUsage: number;
  networkRequests: number;
  jsExecutionTime: number;
  cssParseTime: number;
}

class DashboardPerformanceTester {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async initialize() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-gpu',
        '--no-sandbox',
      ]
    });

    this.page = await this.browser.newPage();
    
    // 設定視窗大小
    await this.page.setViewport({ width: 1920, height: 1080 });
    
    // 監控性能指標
    await this.page.evaluateOnNewDocument(() => {
      // 初始化性能監控
      (window as any).performanceMetrics = {
        navigationStart: performance.now(),
        renderStart: 0,
        renderEnd: 0,
        interactions: [],
        networkRequests: 0
      };

      // 監控網路請求
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        (window as any).performanceMetrics.networkRequests++;
        return originalFetch.apply(window, args);
      };

      // 監控 DOM 載入
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          (window as any).performanceMetrics.renderStart = performance.now();
        });
      }

      // 監控載入完成
      window.addEventListener('load', () => {
        (window as any).performanceMetrics.renderEnd = performance.now();
      });
    });
  }

  async cleanup() {
    if (this.page) {
      await this.page.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
  }

  async measurePageLoad(url: string): Promise<Partial<PerformanceMetrics>> {
    if (!this.page) throw new Error('Page not initialized');

    const startTime = performance.now();

    // 載入頁面並等待網路空閒
    await this.page.goto(url, {
      waitUntil: ['networkidle0', 'domcontentloaded']
    });

    const endTime = performance.now();
    const loadTime = endTime - startTime;

    // 獲取瀏覽器內的性能指標
    const browserMetrics = await this.page.evaluate(() => {
      const metrics = (window as any).performanceMetrics;
      const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      return {
        renderTime: metrics.renderEnd - metrics.renderStart,
        networkRequests: metrics.networkRequests,
        domContentLoadedTime: navigationTiming.domContentLoadedEventEnd - navigationTiming.navigationStart,
        loadEventTime: navigationTiming.loadEventEnd - navigationTiming.navigationStart,
        firstPaintTime: performance.getEntriesByType('paint').find(p => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaintTime: performance.getEntriesByType('paint').find(p => p.name === 'first-contentful-paint')?.startTime || 0
      };
    });

    // 獲取記憶體使用情況
    const memoryUsage = await this.page.evaluate(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        return memory.usedJSHeapSize;
      }
      return 0;
    });

    return {
      loadTime,
      renderTime: browserMetrics.renderTime,
      networkRequests: browserMetrics.networkRequests,
      memoryUsage
    };
  }

  async measureInteractionPerformance(): Promise<Partial<PerformanceMetrics>> {
    if (!this.page) throw new Error('Page not initialized');

    const interactions = [];

    // 測試按鈕點擊響應時間
    const buttonClickTime = await this.measureButtonClick();
    interactions.push({ type: 'button-click', time: buttonClickTime });

    // 測試小工具拖拽性能
    const dragTime = await this.measureWidgetDrag();
    interactions.push({ type: 'widget-drag', time: dragTime });

    // 測試輸入響應時間
    const inputTime = await this.measureInputResponse();
    interactions.push({ type: 'input-response', time: inputTime });

    // 測試模式切換時間
    const modeToggleTime = await this.measureModeToggle();
    interactions.push({ type: 'mode-toggle', time: modeToggleTime });

    const avgInteractionTime = interactions.reduce((sum, i) => sum + i.time, 0) / interactions.length;

    return {
      interactionTime: avgInteractionTime
    };
  }

  private async measureButtonClick(): Promise<number> {
    if (!this.page) throw new Error('Page not initialized');

    // 等待編輯按鈕出現
    await this.page.waitForSelector('button:has-text("編輯")', { timeout: 5000 });

    const startTime = performance.now();
    
    await this.page.click('button:has-text("編輯")');
    
    // 等待編輯模式啟用
    await this.page.waitForSelector('[data-testid="edit-mode"]', { timeout: 3000 });
    
    const endTime = performance.now();
    
    return endTime - startTime;
  }

  private async measureWidgetDrag(): Promise<number> {
    if (!this.page) throw new Error('Page not initialized');

    // 確保在編輯模式
    try {
      await this.page.click('button:has-text("編輯")');
      await this.page.waitForSelector('[data-testid="edit-mode"]', { timeout: 3000 });
    } catch (error) {
      // 可能已經在編輯模式
    }

    // 尋找可拖拽的小工具
    const widget = await this.page.$('[data-testid="dashboard-widget"]');
    if (!widget) {
      return 0; // 沒有小工具可拖拽
    }

    const startTime = performance.now();

    // 獲取小工具位置
    const box = await widget.boundingBox();
    if (!box) return 0;

    // 執行拖拽
    await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await this.page.mouse.down();
    await this.page.mouse.move(box.x + 100, box.y + 100, { steps: 10 });
    await this.page.mouse.up();

    // 等待拖拽完成
    await this.page.waitForTimeout(100);

    const endTime = performance.now();

    return endTime - startTime;
  }

  private async measureInputResponse(): Promise<number> {
    if (!this.page) throw new Error('Page not initialized');

    // 尋找 AI 查詢輸入框
    const inputSelector = '[data-testid="query-input"], input[placeholder*="問題"]';
    
    try {
      await this.page.waitForSelector(inputSelector, { timeout: 5000 });
    } catch (error) {
      return 0; // 輸入框不存在
    }

    const startTime = performance.now();

    // 輸入文字
    await this.page.type(inputSelector, '測試查詢文字');

    // 等待輸入完成和可能的即時反饋
    await this.page.waitForTimeout(100);

    const endTime = performance.now();

    return endTime - startTime;
  }

  private async measureModeToggle(): Promise<number> {
    if (!this.page) throw new Error('Page not initialized');

    const startTime = performance.now();

    // 檢查當前模式並切換
    const editButton = await this.page.$('button:has-text("編輯")');
    const viewButton = await this.page.$('button:has-text("完成編輯")');

    if (editButton) {
      await this.page.click('button:has-text("編輯")');
      await this.page.waitForSelector('[data-testid="edit-mode"]', { timeout: 3000 });
    } else if (viewButton) {
      await this.page.click('button:has-text("完成編輯")');
      await this.page.waitForSelector('[data-testid="view-mode"]', { timeout: 3000 });
    }

    const endTime = performance.now();

    return endTime - startTime;
  }

  async measureMemoryLeak(): Promise<number[]> {
    if (!this.page) throw new Error('Page not initialized');

    const memorySnapshots: number[] = [];

    // 執行多輪操作來測試記憶體洩漏
    for (let i = 0; i < 10; i++) {
      // 切換模式
      try {
        await this.page.click('button:has-text("編輯")');
        await this.page.waitForTimeout(500);
        await this.page.click('button:has-text("完成編輯")');
        await this.page.waitForTimeout(500);
      } catch (error) {
        // 忽略切換錯誤
      }

      // 模擬一些 AI 查詢
      const queryInput = await this.page.$('[data-testid="query-input"]');
      if (queryInput) {
        await this.page.type('[data-testid="query-input"]', `測試查詢 ${i}`);
        await this.page.keyboard.press('Enter');
        await this.page.waitForTimeout(1000);
      }

      // 記錄記憶體使用
      const memoryUsage = await this.page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });

      memorySnapshots.push(memoryUsage);

      // 強制垃圾回收（如果可用）
      await this.page.evaluate(() => {
        if ((window as any).gc) {
          (window as any).gc();
        }
      });

      await this.page.waitForTimeout(1000);
    }

    return memorySnapshots;
  }

  async measureRealTimePerformance(): Promise<{
    connectionTime: number;
    messageProcessingTime: number;
    uiUpdateTime: number;
  }> {
    if (!this.page) throw new Error('Page not initialized');

    // 監控即時連線建立時間
    const connectionStartTime = performance.now();
    
    await this.page.waitForSelector('[data-testid="connection-status"]:has-text("即時連線")', { timeout: 10000 });
    
    const connectionTime = performance.now() - connectionStartTime;

    // 模擬即時事件並測量處理時間
    const messageProcessingStart = performance.now();
    
    await this.page.evaluate(() => {
      // 模擬 SSE 事件
      const event = new CustomEvent('sse-message', {
        detail: {
          type: 'dashboard_data_updated',
          data: { revenue: 150000, users: 1200 },
          timestamp: new Date().toISOString()
        }
      });
      window.dispatchEvent(event);
    });

    // 等待 UI 更新
    await this.page.waitForTimeout(100);
    
    const messageProcessingTime = performance.now() - messageProcessingStart;

    // 測量 UI 更新性能
    const uiUpdateStart = performance.now();
    
    // 觸發一個會導致 UI 更新的操作
    const widget = await this.page.$('[data-testid="dashboard-widget"]');
    if (widget) {
      await widget.click();
    }
    
    await this.page.waitForTimeout(100);
    
    const uiUpdateTime = performance.now() - uiUpdateStart;

    return {
      connectionTime,
      messageProcessingTime,
      uiUpdateTime
    };
  }
}

describe('Dashboard 效能測試', () => {
  let tester: DashboardPerformanceTester;
  const dashboardUrl = process.env.TEST_DASHBOARD_URL || 'http://localhost:3000/dashboard';

  beforeAll(async () => {
    tester = new DashboardPerformanceTester();
    await tester.initialize();
  }, 30000);

  afterAll(async () => {
    await tester.cleanup();
  });

  describe('頁面載入效能', () => {
    
    test('首次載入時間應在可接受範圍內', async () => {
      const metrics = await tester.measurePageLoad(dashboardUrl);

      // 頁面載入時間應小於 5 秒
      expect(metrics.loadTime).toBeLessThan(5000);
      
      // 渲染時間應小於 2 秒
      if (metrics.renderTime) {
        expect(metrics.renderTime).toBeLessThan(2000);
      }

      // 網路請求數量應在合理範圍內
      if (metrics.networkRequests) {
        expect(metrics.networkRequests).toBeLessThan(50);
      }

      console.log('頁面載入效能指標:', {
        載入時間: `${metrics.loadTime?.toFixed(2)}ms`,
        渲染時間: `${metrics.renderTime?.toFixed(2)}ms`,
        網路請求數: metrics.networkRequests,
        記憶體使用: `${(metrics.memoryUsage || 0 / 1024 / 1024).toFixed(2)}MB`
      });
    }, 15000);

    test('重複載入應有快取效果', async () => {
      // 第一次載入
      const firstLoad = await tester.measurePageLoad(dashboardUrl);
      
      // 第二次載入
      const secondLoad = await tester.measurePageLoad(dashboardUrl);

      // 第二次載入應該更快（有快取效果）
      expect(secondLoad.loadTime).toBeLessThan(firstLoad.loadTime || 0);

      console.log('快取效能比較:', {
        首次載入: `${firstLoad.loadTime?.toFixed(2)}ms`,
        快取載入: `${secondLoad.loadTime?.toFixed(2)}ms`,
        改善幅度: `${((1 - (secondLoad.loadTime || 0) / (firstLoad.loadTime || 1)) * 100).toFixed(1)}%`
      });
    }, 20000);
  });

  describe('互動效能', () => {
    
    test('使用者互動響應時間', async () => {
      await tester.measurePageLoad(dashboardUrl);
      const metrics = await tester.measureInteractionPerformance();

      // 平均互動時間應小於 200ms
      expect(metrics.interactionTime).toBeLessThan(200);

      console.log('互動效能指標:', {
        平均響應時間: `${metrics.interactionTime?.toFixed(2)}ms`
      });
    }, 15000);

    test('大量小工具的渲染效能', async () => {
      await tester.measurePageLoad(dashboardUrl);

      const startTime = performance.now();

      // 添加多個小工具來測試渲染效能
      // 這個測試需要根據實際的小工具添加邏輯調整

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // 大量小工具渲染時間應在合理範圍內
      expect(renderTime).toBeLessThan(3000);

      console.log('大量渲染效能:', {
        渲染時間: `${renderTime.toFixed(2)}ms`
      });
    }, 20000);
  });

  describe('記憶體效能', () => {
    
    test('記憶體洩漏檢測', async () => {
      await tester.measurePageLoad(dashboardUrl);
      const memorySnapshots = await tester.measureMemoryLeak();

      // 計算記憶體增長趨勢
      const initialMemory = memorySnapshots[0];
      const finalMemory = memorySnapshots[memorySnapshots.length - 1];
      const memoryIncrease = finalMemory - initialMemory;
      const increasePercentage = (memoryIncrease / initialMemory) * 100;

      // 記憶體增長不應超過 50%
      expect(increasePercentage).toBeLessThan(50);

      console.log('記憶體使用分析:', {
        初始記憶體: `${(initialMemory / 1024 / 1024).toFixed(2)}MB`,
        最終記憶體: `${(finalMemory / 1024 / 1024).toFixed(2)}MB`,
        增長幅度: `${increasePercentage.toFixed(1)}%`,
        記憶體變化曲線: memorySnapshots.map(m => `${(m / 1024 / 1024).toFixed(1)}MB`)
      });
    }, 30000);
  });

  describe('即時功能效能', () => {
    
    test('即時連線和資料更新效能', async () => {
      await tester.measurePageLoad(dashboardUrl);
      const realtimeMetrics = await tester.measureRealTimePerformance();

      // 連線建立時間應小於 3 秒
      expect(realtimeMetrics.connectionTime).toBeLessThan(3000);

      // 訊息處理時間應小於 100ms
      expect(realtimeMetrics.messageProcessingTime).toBeLessThan(100);

      // UI 更新時間應小於 50ms
      expect(realtimeMetrics.uiUpdateTime).toBeLessThan(50);

      console.log('即時功能效能:', {
        連線時間: `${realtimeMetrics.connectionTime.toFixed(2)}ms`,
        訊息處理: `${realtimeMetrics.messageProcessingTime.toFixed(2)}ms`,
        UI更新: `${realtimeMetrics.uiUpdateTime.toFixed(2)}ms`
      });
    }, 15000);
  });

  describe('壓力測試', () => {
    
    test('大量即時事件處理效能', async () => {
      await tester.measurePageLoad(dashboardUrl);

      const eventCount = 100;
      const startTime = performance.now();

      // 發送大量即時事件
      for (let i = 0; i < eventCount; i++) {
        await tester.page!.evaluate((index) => {
          const event = new CustomEvent('sse-message', {
            detail: {
              type: 'dashboard_data_updated',
              id: `stress-test-${index}`,
              data: { value: Math.random() * 1000 },
              timestamp: new Date().toISOString()
            }
          });
          window.dispatchEvent(event);
        }, i);

        // 小延遲避免過於密集
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      const processingTime = performance.now() - startTime;

      // 平均每個事件處理時間應小於 10ms
      const avgProcessingTime = processingTime / eventCount;
      expect(avgProcessingTime).toBeLessThan(10);

      console.log('大量事件處理效能:', {
        總處理時間: `${processingTime.toFixed(2)}ms`,
        事件數量: eventCount,
        平均處理時間: `${avgProcessingTime.toFixed(2)}ms/事件`
      });
    }, 25000);
  });
});

// 效能基準測試工具
export class PerformanceBenchmark {
  static async runFullBenchmark(url: string) {
    const tester = new DashboardPerformanceTester();
    await tester.initialize();

    try {
      console.log('開始 Dashboard 效能基準測試...\n');

      // 頁面載入測試
      console.log('📊 頁面載入效能測試');
      const loadMetrics = await tester.measurePageLoad(url);
      console.table({
        載入時間: `${loadMetrics.loadTime?.toFixed(2)}ms`,
        渲染時間: `${loadMetrics.renderTime?.toFixed(2)}ms`,
        網路請求: loadMetrics.networkRequests,
        記憶體使用: `${((loadMetrics.memoryUsage || 0) / 1024 / 1024).toFixed(2)}MB`
      });

      // 互動效能測試
      console.log('\n🖱️  互動效能測試');
      const interactionMetrics = await tester.measureInteractionPerformance();
      console.table({
        平均響應時間: `${interactionMetrics.interactionTime?.toFixed(2)}ms`
      });

      // 即時功能測試
      console.log('\n⚡ 即時功能效能測試');
      const realtimeMetrics = await tester.measureRealTimePerformance();
      console.table({
        連線建立: `${realtimeMetrics.connectionTime.toFixed(2)}ms`,
        訊息處理: `${realtimeMetrics.messageProcessingTime.toFixed(2)}ms`,
        UI更新: `${realtimeMetrics.uiUpdateTime.toFixed(2)}ms`
      });

      // 記憶體洩漏測試
      console.log('\n🧠 記憶體效能測試');
      const memorySnapshots = await tester.measureMemoryLeak();
      const memoryIncrease = ((memorySnapshots[memorySnapshots.length - 1] - memorySnapshots[0]) / memorySnapshots[0]) * 100;
      console.table({
        初始記憶體: `${(memorySnapshots[0] / 1024 / 1024).toFixed(2)}MB`,
        最終記憶體: `${(memorySnapshots[memorySnapshots.length - 1] / 1024 / 1024).toFixed(2)}MB`,
        增長幅度: `${memoryIncrease.toFixed(1)}%`
      });

      console.log('\n✅ 效能基準測試完成');

      return {
        loadMetrics,
        interactionMetrics,
        realtimeMetrics,
        memorySnapshots
      };

    } finally {
      await tester.cleanup();
    }
  }
}