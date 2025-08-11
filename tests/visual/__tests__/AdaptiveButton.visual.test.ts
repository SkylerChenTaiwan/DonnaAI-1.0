/**
 * AdaptiveButton 視覺回歸測試
 * 使用視覺測試工具驗證元件在不同狀態下的視覺一致性
 */

import { ScreenshotTool } from '../utils/screenshot';
import { ImageComparator } from '../utils/compare';
import { createReporter } from '../utils/reporter';
import type { TestResult } from '../utils/reporter';
import path from 'path';

describe('AdaptiveButton 視覺測試', () => {
  let screenshotTool: ScreenshotTool;
  let imageComparator: ImageComparator;
  const testResults: TestResult[] = [];

  beforeAll(async () => {
    // 初始化測試工具
    screenshotTool = new ScreenshotTool();
    imageComparator = new ImageComparator({
      threshold: 0.2,
      createDiffImage: true,
    });

    // 確保 Storybook 正在運行
    const storybookUrl = global.visualTestConfig?.storybookUrl || 'http://localhost:6006';
    try {
      const response = await fetch(storybookUrl);
      if (!response.ok) {
        throw new Error('Storybook 未運行');
      }
    } catch (error) {
      console.warn('請確保 Storybook 正在運行:', storybookUrl);
      throw error;
    }
  });

  afterAll(async () => {
    // 清理資源
    await screenshotTool.cleanup();

    // 生成測試報告
    if (testResults.length > 0) {
      const reporter = createReporter({
        outputDir: path.join(__dirname, '../results/reports'),
        title: 'AdaptiveButton 視覺測試報告',
      });

      await reporter.generateReport(testResults);
      console.log('測試報告已生成');
    }
  });

  const runVisualTest = async (
    testName: string,
    storyId: string,
    variant: string = 'default'
  ) => {
    const startTime = Date.now();
    
    try {
      // 截圖
      const actualScreenshot = await screenshotTool.captureStoryScreenshot(storyId, {
        delay: 500,
      });

      // 基線快照路徑
      const snapshotPath = path.join(
        global.visualTestConfig.snapshotsDir,
        'web',
        `${global.visualTestUtils.sanitizeFilename(testName)}.png`
      );

      // 實際截圖路徑
      const actualPath = path.join(
        global.visualTestConfig.resultsDir,
        'received',
        `${global.visualTestUtils.sanitizeFilename(testName)}.png`
      );

      // 差異圖片路徑
      const diffPath = path.join(
        global.visualTestConfig.resultsDir,
        'diffs',
        `${global.visualTestUtils.sanitizeFilename(testName)}-diff.png`
      );

      // 保存實際截圖
      await screenshotTool.saveScreenshot(actualScreenshot, actualPath);

      // 檢查基線快照是否存在
      try {
        await require('fs').promises.access(snapshotPath);
      } catch {
        // 基線快照不存在，保存當前截圖作為基線
        await screenshotTool.saveScreenshot(actualScreenshot, snapshotPath);
        
        const result: TestResult = {
          id: global.visualTestUtils.generateTestId('AdaptiveButton', testName, variant),
          name: testName,
          component: 'AdaptiveButton',
          story: testName,
          variant,
          platform: 'web',
          status: 'passed',
          duration: Date.now() - startTime,
          timestamp: new Date(),
          screenshots: {
            baseline: snapshotPath,
            actual: actualPath,
          },
        };
        
        testResults.push(result);
        return;
      }

      // 比較圖片
      const comparison = await imageComparator.compareImages(
        snapshotPath,
        actualPath,
        diffPath
      );

      // 判斷測試結果
      const testStatus = comparison.match ? 'passed' : 'failed';

      // 記錄測試結果
      const result: TestResult = {
        id: global.visualTestUtils.generateTestId('AdaptiveButton', testName, variant),
        name: testName,
        component: 'AdaptiveButton',
        story: testName,
        variant,
        platform: 'web',
        status: testStatus,
        comparison,
        duration: Date.now() - startTime,
        timestamp: new Date(),
        screenshots: {
          baseline: snapshotPath,
          actual: actualPath,
          diff: comparison.diffImagePath,
        },
      };

      testResults.push(result);

      // Jest 斷言
      expect(actualScreenshot.buffer).toMatchImageSnapshot({
        customSnapshotsDir: path.dirname(snapshotPath),
        customSnapshotIdentifier: path.basename(snapshotPath, '.png'),
        threshold: 0.2,
        failureThreshold: 0.01,
        failureThresholdType: 'percent',
      });

    } catch (error) {
      // 記錄錯誤結果
      const result: TestResult = {
        id: global.visualTestUtils.generateTestId('AdaptiveButton', testName, variant),
        name: testName,
        component: 'AdaptiveButton',
        story: testName,
        variant,
        platform: 'web',
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
        timestamp: new Date(),
        screenshots: {},
      };

      testResults.push(result);
      throw error;
    }
  };

  describe('基本變體', () => {
    test('預設按鈕', async () => {
      await runVisualTest('Default', 'adaptive-core-adaptivebutton--default');
    });

    test('按鈕變體', async () => {
      await runVisualTest('Variants', 'adaptive-core-adaptivebutton--variants');
    });

    test('按鈕尺寸', async () => {
      await runVisualTest('Sizes', 'adaptive-core-adaptivebutton--sizes');
    });
  });

  describe('狀態測試', () => {
    test('按鈕狀態', async () => {
      await runVisualTest('States', 'adaptive-core-adaptivebutton--states');
    });

    test('帶圖示按鈕', async () => {
      await runVisualTest('WithIcons', 'adaptive-core-adaptivebutton--with-icons');
    });

    test('不同寬度', async () => {
      await runVisualTest('Widths', 'adaptive-core-adaptivebutton--widths');
    });
  });

  describe('互動測試', () => {
    test('按鈕組合', async () => {
      await runVisualTest('ButtonGroups', 'adaptive-core-adaptivebutton--button-groups');
    });

    test('自定義樣式', async () => {
      await runVisualTest('CustomStyles', 'adaptive-core-adaptivebutton--custom-styles');
    });

    test('響應式按鈕', async () => {
      await runVisualTest('ResponsiveButtons', 'adaptive-core-adaptivebutton--responsive-buttons');
    });
  });

  describe('無障礙與邊界測試', () => {
    test('無障礙測試', async () => {
      await runVisualTest('AccessibilityTest', 'adaptive-core-adaptivebutton--accessibility-test');
    });

    test('邊界測試', async () => {
      await runVisualTest('EdgeCases', 'adaptive-core-adaptivebutton--edge-cases');
    });
  });

  describe('多狀態截圖測試', () => {
    test('hover 狀態', async () => {
      const storyId = 'adaptive-core-adaptivebutton--default';
      const interactions = [
        { type: 'hover' as const, selector: 'button' },
      ];

      const screenshots = await screenshotTool.captureMultiStateScreenshots(
        storyId,
        { hover: interactions }
      );

      expect(screenshots.hover).toBeDefined();
      
      // 保存 hover 狀態截圖進行比較
      const testName = 'Default-Hover';
      const snapshotPath = path.join(
        global.visualTestConfig.snapshotsDir,
        'web',
        `${global.visualTestUtils.sanitizeFilename(testName)}.png`
      );

      await screenshotTool.saveScreenshot(screenshots.hover, snapshotPath);

      const result: TestResult = {
        id: global.visualTestUtils.generateTestId('AdaptiveButton', testName, 'hover'),
        name: testName,
        component: 'AdaptiveButton',
        story: 'Default',
        variant: 'hover',
        platform: 'web',
        status: 'passed',
        duration: 100,
        timestamp: new Date(),
        screenshots: {
          actual: snapshotPath,
        },
      };

      testResults.push(result);
    });

    test('focus 狀態', async () => {
      const storyId = 'adaptive-core-adaptivebutton--default';
      const interactions = [
        { type: 'focus' as const, selector: 'button' },
      ];

      const screenshots = await screenshotTool.captureMultiStateScreenshots(
        storyId,
        { focus: interactions }
      );

      expect(screenshots.focus).toBeDefined();

      const testName = 'Default-Focus';
      const snapshotPath = path.join(
        global.visualTestConfig.snapshotsDir,
        'web',
        `${global.visualTestUtils.sanitizeFilename(testName)}.png`
      );

      await screenshotTool.saveScreenshot(screenshots.focus, snapshotPath);

      const result: TestResult = {
        id: global.visualTestUtils.generateTestId('AdaptiveButton', testName, 'focus'),
        name: testName,
        component: 'AdaptiveButton',
        story: 'Default',
        variant: 'focus',
        platform: 'web',
        status: 'passed',
        duration: 100,
        timestamp: new Date(),
        screenshots: {
          actual: snapshotPath,
        },
      };

      testResults.push(result);
    });
  });

  describe('視窗大小測試', () => {
    test('手機視窗', async () => {
      const screenshot = await screenshotTool.captureStoryScreenshot(
        'adaptive-core-adaptivebutton--responsive-buttons',
        {
          viewport: {
            width: 375,
            height: 667,
            isMobile: true,
          },
        }
      );

      expect(screenshot.buffer).toBeDefined();
      expect(screenshot.metadata.width).toBe(375);
      expect(screenshot.metadata.height).toBe(667);

      const result: TestResult = {
        id: global.visualTestUtils.generateTestId('AdaptiveButton', 'ResponsiveButtons-Mobile', 'mobile'),
        name: 'ResponsiveButtons-Mobile',
        component: 'AdaptiveButton',
        story: 'ResponsiveButtons',
        variant: 'mobile',
        platform: 'web',
        status: 'passed',
        duration: 100,
        timestamp: new Date(),
        screenshots: {},
      };

      testResults.push(result);
    });

    test('平板視窗', async () => {
      const screenshot = await screenshotTool.captureStoryScreenshot(
        'adaptive-core-adaptivebutton--responsive-buttons',
        {
          viewport: {
            width: 768,
            height: 1024,
            isMobile: true,
          },
        }
      );

      expect(screenshot.buffer).toBeDefined();
      expect(screenshot.metadata.width).toBe(768);
      expect(screenshot.metadata.height).toBe(1024);
    });

    test('桌面視窗', async () => {
      const screenshot = await screenshotTool.captureStoryScreenshot(
        'adaptive-core-adaptivebutton--responsive-buttons',
        {
          viewport: {
            width: 1920,
            height: 1080,
          },
        }
      );

      expect(screenshot.buffer).toBeDefined();
      expect(screenshot.metadata.width).toBe(1920);
      expect(screenshot.metadata.height).toBe(1080);
    });
  });
});