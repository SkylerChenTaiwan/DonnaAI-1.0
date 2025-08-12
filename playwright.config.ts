import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const CI = process.env.CI === 'true';

export default defineConfig({
  testDir: './src/tests/e2e',
  outputDir: './test-results',
  timeout: 30 * 1000,
  expect: {
    timeout: 10 * 1000,
    toHaveScreenshot: {
      maxDiffPixels: 100,
      threshold: 0.2,
      animations: 'disabled',
      caret: 'hide'
    }
  },
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  workers: CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list'],
    ...(CI ? [['github']] : [])
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3002',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10 * 1000,
    navigationTimeout: 30 * 1000,
    ignoreHTTPSErrors: true,
    testIdAttribute: 'data-testid'
  },

  // 瀏覽器配置
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },
    // 移動設備測試
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] }
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] }
    },
    // 視覺回歸測試專用
    {
      name: 'visual',
      testDir: './src/tests/visual',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      }
    },
    // 效能測試專用
    {
      name: 'performance',
      testDir: './src/tests/e2e/performance',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--disable-blink-features=AutomationControlled',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process'
          ]
        }
      }
    }
  ],

  // 本地開發伺服器
  webServer: CI ? undefined : {
    command: 'npm run web',
    url: 'http://localhost:3002',
    reuseExistingServer: !CI,
    timeout: 120 * 1000
  },

  // 全域設定
  globalSetup: path.join(__dirname, './src/tests/e2e/global-setup.ts'),
  globalTeardown: path.join(__dirname, './src/tests/e2e/global-teardown.ts')
});