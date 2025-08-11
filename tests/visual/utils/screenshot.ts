/**
 * 視覺測試截圖工具
 * 提供跨平台的截圖捕獲和處理功能
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import { Device } from 'puppeteer';
import path from 'path';
import fs from 'fs/promises';

// 配置介面
export interface ScreenshotConfig {
  url: string;
  selector?: string;
  viewport?: {
    width: number;
    height: number;
    deviceScaleFactor?: number;
    isMobile?: boolean;
  };
  waitFor?: number | string;
  fullPage?: boolean;
  clip?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  omitBackground?: boolean;
  quality?: number;
  type?: 'png' | 'jpeg' | 'webp';
  animations?: 'disabled' | 'allow';
  delay?: number;
}

// 截圖結果介面
export interface ScreenshotResult {
  buffer: Buffer;
  path?: string;
  metadata: {
    width: number;
    height: number;
    timestamp: Date;
    viewport: { width: number; height: number };
    url: string;
    devicePixelRatio: number;
  };
}

// 互動操作介面
export interface InteractionStep {
  type: 'click' | 'hover' | 'focus' | 'type' | 'scroll' | 'wait';
  selector?: string;
  text?: string;
  delay?: number;
  position?: { x: number; y: number };
}

// 截圖工具類別
export class ScreenshotTool {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private config: any;

  constructor(config = global.puppeteerConfig) {
    this.config = config;
  }

  /**
   * 初始化瀏覽器
   */
  async initialize(): Promise<void> {
    if (this.browser) return;

    this.browser = await puppeteer.launch(this.config.launch);
    this.page = await this.browser.newPage();

    // 設置預設視窗大小
    await this.page.setViewport(this.config.launch.defaultViewport);

    // 設置用戶代理
    if (this.config.page.userAgent) {
      await this.page.setUserAgent(this.config.page.userAgent);
    }

    // 設置額外 HTTP 標頭
    if (this.config.page.extraHTTPHeaders) {
      await this.page.setExtraHTTPHeaders(this.config.page.extraHTTPHeaders);
    }

    // 禁用動畫
    if (this.config.performance.disableAnimations) {
      await this.disableAnimations();
    }

    // 設置媒體類型
    await this.page.emulateMediaType(this.config.page.media);

    // 設置顏色方案
    await this.page.emulateMediaFeatures([
      { name: 'prefers-color-scheme', value: this.config.page.colorScheme },
      { name: 'prefers-reduced-motion', value: this.config.page.reducedMotion },
    ]);
  }

  /**
   * 禁用動畫和過渡效果
   */
  private async disableAnimations(): Promise<void> {
    if (!this.page) return;

    await this.page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
          scroll-behavior: auto !important;
        }
        
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-25%); } }
        
        [data-testid="loading-spinner"],
        .loading,
        .spinner {
          animation: none !important;
        }
      `,
    });
  }

  /**
   * 捕獲 Storybook story 截圖
   */
  async captureStoryScreenshot(
    storyId: string,
    config: Partial<ScreenshotConfig> = {}
  ): Promise<ScreenshotResult> {
    await this.initialize();
    if (!this.page) throw new Error('頁面未初始化');

    const storyUrl = `${this.config.storybook.url}/iframe.html?id=${storyId}&viewMode=story&visualTest=true`;
    
    const fullConfig: ScreenshotConfig = {
      url: storyUrl,
      selector: '[data-testid="storybook-root"]',
      waitFor: 'networkidle0',
      fullPage: false,
      omitBackground: true,
      type: 'png',
      quality: 100,
      animations: 'disabled',
      delay: 500,
      ...config,
    };

    return this.captureScreenshot(fullConfig);
  }

  /**
   * 捕獲元件截圖
   */
  async captureComponentScreenshot(
    componentId: string,
    storyName: string,
    variant: string = 'default',
    config: Partial<ScreenshotConfig> = {}
  ): Promise<ScreenshotResult> {
    const storyId = `${componentId}--${storyName}`;
    const screenshotConfig = {
      ...config,
      delay: config.delay || 500,
    };

    return this.captureStoryScreenshot(storyId, screenshotConfig);
  }

  /**
   * 通用截圖方法
   */
  async captureScreenshot(config: ScreenshotConfig): Promise<ScreenshotResult> {
    await this.initialize();
    if (!this.page || !this.browser) throw new Error('瀏覽器未初始化');

    try {
      // 設置視窗大小
      if (config.viewport) {
        await this.page.setViewport(config.viewport);
      }

      // 導航到頁面
      await this.page.goto(config.url, {
        waitUntil: typeof config.waitFor === 'string' ? config.waitFor as any : 'networkidle0',
        timeout: 30000,
      });

      // 等待特定元素或時間
      if (typeof config.waitFor === 'number') {
        await this.page.waitForTimeout(config.waitFor);
      } else if (typeof config.waitFor === 'string' && config.waitFor.startsWith('[')) {
        await this.page.waitForSelector(config.waitFor, { timeout: 10000 });
      }

      // 額外延遲
      if (config.delay) {
        await this.page.waitForTimeout(config.delay);
      }

      // 等待圖片載入
      await this.waitForImages();

      // 準備截圖選項
      const screenshotOptions: any = {
        type: config.type || 'png',
        omitBackground: config.omitBackground || false,
        fullPage: config.fullPage || false,
        clip: config.clip,
      };

      if (config.type === 'jpeg' || config.type === 'webp') {
        screenshotOptions.quality = config.quality || 90;
      }

      // 選擇截圖區域
      let element = null;
      if (config.selector) {
        element = await this.page.$(config.selector);
        if (!element) {
          throw new Error(`找不到選擇器: ${config.selector}`);
        }
      }

      // 捕獲截圖
      const buffer = element 
        ? await element.screenshot(screenshotOptions)
        : await this.page.screenshot(screenshotOptions);

      // 取得頁面元數據
      const viewport = this.page.viewport() || { width: 1200, height: 800 };
      const devicePixelRatio = await this.page.evaluate(() => window.devicePixelRatio);

      return {
        buffer: buffer as Buffer,
        metadata: {
          width: viewport.width,
          height: viewport.height,
          timestamp: new Date(),
          viewport,
          url: config.url,
          devicePixelRatio,
        },
      };
    } catch (error) {
      throw new Error(`截圖失敗: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 捕獲多個狀態的截圖
   */
  async captureMultiStateScreenshots(
    storyId: string,
    states: Record<string, InteractionStep[]>,
    baseConfig: Partial<ScreenshotConfig> = {}
  ): Promise<Record<string, ScreenshotResult>> {
    const results: Record<string, ScreenshotResult> = {};

    for (const [stateName, interactions] of Object.entries(states)) {
      await this.initialize();
      if (!this.page) continue;

      // 導航到 story
      const storyUrl = `${this.config.storybook.url}/iframe.html?id=${storyId}&viewMode=story&visualTest=true`;
      await this.page.goto(storyUrl, { waitUntil: 'networkidle0' });

      // 執行互動步驟
      for (const step of interactions) {
        await this.performInteraction(step);
      }

      // 額外延遲讓效果穩定
      await this.page.waitForTimeout(300);

      // 截圖
      const result = await this.captureScreenshot({
        url: storyUrl,
        ...baseConfig,
      });

      results[stateName] = result;
    }

    return results;
  }

  /**
   * 執行互動操作
   */
  private async performInteraction(step: InteractionStep): Promise<void> {
    if (!this.page) return;

    const delay = step.delay || 100;

    switch (step.type) {
      case 'click':
        if (step.selector) {
          await this.page.click(step.selector);
        } else if (step.position) {
          await this.page.mouse.click(step.position.x, step.position.y);
        }
        break;

      case 'hover':
        if (step.selector) {
          await this.page.hover(step.selector);
        } else if (step.position) {
          await this.page.mouse.move(step.position.x, step.position.y);
        }
        break;

      case 'focus':
        if (step.selector) {
          await this.page.focus(step.selector);
        }
        break;

      case 'type':
        if (step.selector && step.text) {
          await this.page.type(step.selector, step.text);
        }
        break;

      case 'scroll':
        if (step.position) {
          await this.page.evaluate(
            (x, y) => window.scrollTo(x, y),
            step.position.x,
            step.position.y
          );
        }
        break;

      case 'wait':
        await this.page.waitForTimeout(delay);
        break;
    }

    if (delay) {
      await this.page.waitForTimeout(delay);
    }
  }

  /**
   * 等待圖片載入完成
   */
  private async waitForImages(): Promise<void> {
    if (!this.page) return;

    await this.page.evaluate(() => {
      return Promise.all(
        Array.from(document.images).map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        })
      );
    });
  }

  /**
   * 保存截圖到文件
   */
  async saveScreenshot(
    result: ScreenshotResult,
    filepath: string
  ): Promise<string> {
    const dir = path.dirname(filepath);
    
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }

    await fs.writeFile(filepath, result.buffer);
    return filepath;
  }

  /**
   * 清理資源
   */
  async cleanup(): Promise<void> {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }
    
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * 批量截圖處理
   */
  async batchScreenshots(
    tasks: Array<{
      id: string;
      config: ScreenshotConfig;
      outputPath?: string;
    }>
  ): Promise<Array<{ id: string; result: ScreenshotResult; path?: string }>> {
    const results = [];

    for (const task of tasks) {
      try {
        const result = await this.captureScreenshot(task.config);
        
        let savedPath;
        if (task.outputPath) {
          savedPath = await this.saveScreenshot(result, task.outputPath);
        }

        results.push({
          id: task.id,
          result,
          path: savedPath,
        });
      } catch (error) {
        console.error(`截圖失敗 ${task.id}:`, error);
        // 繼續處理其他任務
      }
    }

    return results;
  }
}

// 工具函數
export const createScreenshotTool = (config?: any): ScreenshotTool => {
  return new ScreenshotTool(config);
};

// 預設導出
export default ScreenshotTool;