/**
 * Jest 視覺測試設置文件
 * 配置全域測試環境和工具
 */

const { configureToMatchImageSnapshot } = require('jest-image-snapshot');
const path = require('path');
const fs = require('fs');

// 擴展 Jest 匹配器以支援圖片快照
const toMatchImageSnapshot = configureToMatchImageSnapshot({
  // 基本設定
  threshold: 0.2,                    // 差異閾值 (0-1)
  thresholdType: 'percent',          // 閾值類型：percent 或 pixel
  
  // 比較設定
  comparisonMethod: 'pixelmatch',    // 比較方法
  allowSizeMismatch: false,          // 是否允許尺寸不匹配
  failureThreshold: 0.01,           // 失敗閾值
  failureThresholdType: 'percent',   // 失敗閾值類型
  
  // 抗鋸齒檢查
  enableAntialiasingCheck: false,    // 禁用抗鋸齒檢查（提高一致性）
  
  // 路徑設定
  customSnapshotsDir: path.join(__dirname, '../snapshots'),
  customDiffDir: path.join(__dirname, '../results/diffs'),
  customReceivedDir: path.join(__dirname, '../results/received'),
  
  // 檔名設定
  customSnapshotIdentifier: ({ defaultIdentifier, counter }) => {
    return `${defaultIdentifier}-${counter}`;
  },
  
  // 差異設定
  customDiffConfig: {
    threshold: 0.2,
    includeAA: false,
    alpha: 0.1,
    aaColor: [255, 255, 0], // 抗鋸齒顏色：黃色
    diffColor: [255, 0, 255], // 差異顏色：洋紅色
  },
  
  // 更新模式
  updateSnapshot: process.argv.includes('--updateSnapshot') || 
                  process.argv.includes('-u') ||
                  process.env.UPDATE_SNAPSHOTS === 'true',
  
  // 錯誤處理
  noColors: process.env.CI,
  runInBand: process.env.CI,
});

// 註冊匹配器
expect.extend({ toMatchImageSnapshot });

// 全域設定
global.visualTestConfig = {
  // 測試環境
  isCI: !!process.env.CI,
  isDebug: !!process.env.DEBUG,
  platform: process.env.PLATFORM || 'web',
  
  // 路徑
  snapshotsDir: path.join(__dirname, '../snapshots'),
  resultsDir: path.join(__dirname, '../results'),
  assetsDir: path.join(__dirname, '../assets'),
  
  // Storybook 設定
  storybookUrl: process.env.STORYBOOK_URL || 'http://localhost:6006',
  
  // 預設視窗大小
  defaultViewport: {
    width: 1200,
    height: 800,
  },
  
  // 延遲設定
  delays: {
    pageLoad: 2000,      // 頁面載入延遲
    interaction: 500,    // 互動後延遲
    animation: 1000,     // 動畫完成延遲
    screenshot: 300,     // 截圖前延遲
  },
  
  // 重試設定
  retries: process.env.CI ? 2 : 1,
  retryDelay: 1000,
};

// 工具函數
global.visualTestUtils = {
  // 等待指定時間
  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // 確保目錄存在
  ensureDir: (dirPath) => {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  },
  
  // 生成測試 ID
  generateTestId: (component, story, variant = 'default') => {
    return `${component}--${story}--${variant}`.toLowerCase().replace(/\s+/g, '-');
  },
  
  // 清理截圖檔名
  sanitizeFilename: (filename) => {
    return filename
      .replace(/[^a-z0-9\-_]/gi, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  },
  
  // 取得快照路徑
  getSnapshotPath: (testId, platform = 'web') => {
    const snapshotsDir = path.join(global.visualTestConfig.snapshotsDir, platform);
    global.visualTestUtils.ensureDir(snapshotsDir);
    return path.join(snapshotsDir, `${testId}.png`);
  },
};

// 建立必要目錄
const requiredDirs = [
  global.visualTestConfig.snapshotsDir,
  global.visualTestConfig.resultsDir,
  path.join(global.visualTestConfig.resultsDir, 'diffs'),
  path.join(global.visualTestConfig.resultsDir, 'received'),
  path.join(global.visualTestConfig.resultsDir, 'reports'),
  path.join(global.visualTestConfig.snapshotsDir, 'web'),
  path.join(global.visualTestConfig.snapshotsDir, 'native'),
];

requiredDirs.forEach(dir => {
  global.visualTestUtils.ensureDir(dir);
});

// Puppeteer 全域設定
if (typeof global.puppeteerConfig === 'undefined') {
  global.puppeteerConfig = require('./puppeteer.config.js');
}

// 錯誤處理
process.on('unhandledRejection', (reason, promise) => {
  console.error('未處理的 Promise 拒絕:', reason);
  if (global.visualTestConfig.isDebug) {
    console.error('Promise:', promise);
  }
});

// 測試超時警告
const originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000; // 60秒

// 清理函數
const cleanup = () => {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
};

// 註冊清理函數
process.on('exit', cleanup);
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// 控制台美化
if (!global.visualTestConfig.isCI) {
  const chalk = require('chalk');
  
  // 自定義日誌函數
  global.logInfo = (message) => console.log(chalk.blue('[INFO]'), message);
  global.logSuccess = (message) => console.log(chalk.green('[SUCCESS]'), message);
  global.logWarning = (message) => console.log(chalk.yellow('[WARNING]'), message);
  global.logError = (message) => console.log(chalk.red('[ERROR]'), message);
  global.logDebug = (message) => {
    if (global.visualTestConfig.isDebug) {
      console.log(chalk.gray('[DEBUG]'), message);
    }
  };
} else {
  // CI 環境使用簡單日誌
  global.logInfo = console.log;
  global.logSuccess = console.log;
  global.logWarning = console.warn;
  global.logError = console.error;
  global.logDebug = global.visualTestConfig.isDebug ? console.log : () => {};
}

// 顯示初始化信息
global.logInfo('🎨 視覺回歸測試環境已初始化');
global.logInfo(`📁 快照目錄: ${global.visualTestConfig.snapshotsDir}`);
global.logInfo(`📊 結果目錄: ${global.visualTestConfig.resultsDir}`);
global.logInfo(`🌐 Storybook URL: ${global.visualTestConfig.storybookUrl}`);
global.logInfo(`🖥️  平台: ${global.visualTestConfig.platform}`);

if (global.visualTestConfig.isCI) {
  global.logInfo('🤖 在 CI 環境中執行');
}

if (global.visualTestConfig.isDebug) {
  global.logInfo('🐛 調試模式已啟用');
}