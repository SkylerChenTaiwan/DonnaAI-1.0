import { TestRunnerConfig } from '@storybook/test-runner';
import { checkA11y, injectAxe } from 'axe-playwright';

const config: TestRunnerConfig = {
  // 視覺測試設定
  async preVisit(page) {
    // 注入 accessibility 測試工具
    await injectAxe(page);
    
    // 設定視覺測試環境
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // 等待字體載入
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(100);
    
    // 禁用動畫以確保截圖一致性
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `
    });
  },
  
  // 測試執行
  async postVisit(page, context) {
    // 執行 accessibility 測試
    await checkA11y(page, '#storybook-root', {
      detailedReport: true,
      detailedReportOptions: {
        html: true
      }
    });
    
    // 視覺快照測試
    const storyContext = await getStoryContext(page, context);
    
    if (storyContext.parameters?.snapshot !== false) {
      await page.screenshot({
        path: `./test-results/screenshots/${context.id}.png`,
        fullPage: storyContext.parameters?.snapshot?.fullPage || false,
        animations: 'disabled',
        caret: 'hide'
      });
    }
    
    // 效能指標收集
    if (storyContext.parameters?.performance) {
      const metrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
        };
      });
      
      console.log(`Performance metrics for ${context.id}:`, metrics);
    }
  },
  
  // 錯誤處理
  async onError(page, error, context) {
    // 截圖錯誤狀態
    await page.screenshot({
      path: `./test-results/errors/${context.id}-error.png`,
      fullPage: true
    });
    
    // 收集控制台日誌
    const logs = await page.evaluate(() => {
      return (window as any).__consoleLogs || [];
    });
    
    console.error(`Error in story ${context.id}:`, error);
    console.error('Console logs:', logs);
  },
  
  // 測試設定
  tags: {
    // 跳過特定標籤的測試
    skip: ['skip-test', 'manual'],
    // 只在 CI 環境執行的測試
    include: process.env.CI ? ['ci-only'] : undefined
  }
};

// 輔助函數：獲取 Story 上下文
async function getStoryContext(page: any, context: any) {
  return page.evaluate(({ storyId }: any) => {
    const storyStore = (window as any).__STORYBOOK_STORY_STORE__;
    const story = storyStore.fromId(storyId);
    return {
      parameters: story.parameters || {}
    };
  }, { storyId: context.id });
}

export default config;