/**
 * Puppeteer 視覺測試配置
 * 配置瀏覽器截圖和頁面互動設定
 */

module.exports = {
  // 瀏覽器啟動選項
  launch: {
    headless: process.env.CI ? true : 'new', // CI 環境使用無頭模式
    devtools: !process.env.CI,
    slowMo: process.env.DEBUG ? 50 : 0,
    
    // 視窗設定
    defaultViewport: {
      width: 1200,
      height: 800,
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false,
      isLandscape: true,
    },
    
    // 啟動參數
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-features=TranslateUI',
      '--disable-ipc-flooding-protection',
      '--font-render-hinting=none',
      '--disable-font-subpixel-positioning',
    ],
    
    // 超時設定
    timeout: 30000,
  },
  
  // 頁面設定
  page: {
    // 用戶代理
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 VisualTest/1.0',
    
    // 等待條件
    waitUntil: 'networkidle0',
    timeout: 30000,
    
    // 媒體功能
    media: 'screen',
    colorScheme: 'light',
    reducedMotion: 'reduce', // 減少動畫以獲得一致的截圖
    
    // JavaScript 設定
    javaScriptEnabled: true,
    
    // 額外 HTTP 標頭
    extraHTTPHeaders: {
      'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
    },
    
    // 地理位置
    geolocation: {
      latitude: 25.0330,  // 台北
      longitude: 121.5654,
    },
    
    // 時區
    timezone: 'Asia/Taipei',
    
    // 權限
    permissions: ['geolocation'],
  },
  
  // 截圖設定
  screenshot: {
    // 預設截圖選項
    default: {
      type: 'png',
      quality: 100,
      fullPage: false,
      omitBackground: false,
      encoding: 'binary',
      captureBeyondViewport: false,
    },
    
    // 不同測試場景的設定
    scenarios: {
      // 元件截圖 - 精確範圍
      component: {
        type: 'png',
        quality: 100,
        fullPage: false,
        omitBackground: true,
        clip: null, // 動態設定
      },
      
      // 頁面截圖 - 全頁面
      page: {
        type: 'png',
        quality: 90,
        fullPage: true,
        omitBackground: false,
      },
      
      // 互動截圖 - 捕獲狀態變化
      interaction: {
        type: 'png',
        quality: 100,
        fullPage: false,
        omitBackground: true,
        delay: 500, // 等待動畫完成
      },
    },
  },
  
  // 響應式測試視窗
  viewports: [
    {
      name: 'mobile',
      width: 375,
      height: 667,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      isLandscape: false,
    },
    {
      name: 'tablet',
      width: 768,
      height: 1024,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      isLandscape: false,
    },
    {
      name: 'desktop',
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false,
      isLandscape: true,
    },
    {
      name: 'desktop-hd',
      width: 2560,
      height: 1440,
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false,
      isLandscape: true,
    },
  ],
  
  // Storybook 設定
  storybook: {
    url: process.env.STORYBOOK_URL || 'http://localhost:6006',
    
    // 等待條件
    waitForSelector: '[data-testid="storybook-root"]',
    waitTimeout: 10000,
    
    // 路徑模式
    storyUrlPattern: '/?path=/story/{kind}--{story}',
    
    // 參數設定
    parameters: {
      viewport: 'reset',
      backgrounds: { disable: true },
      docs: { disable: true },
      actions: { disable: true },
    },
  },
  
  // 互動測試設定
  interactions: {
    // 滑鼠操作延遲
    mouseDelay: 100,
    
    // 鍵盤輸入延遲
    typeDelay: 50,
    
    // 等待動畫完成
    animationTimeout: 1000,
    
    // 常用互動操作
    actions: {
      hover: {
        delay: 300,
        screenshot: true,
      },
      focus: {
        delay: 200,
        screenshot: true,
      },
      click: {
        delay: 100,
        screenshot: true,
      },
      type: {
        delay: 50,
        screenshot: true,
      },
    },
  },
  
  // 錯誤處理
  errorHandling: {
    // 重試次數
    retries: 2,
    
    // 超時重試間隔
    retryDelay: 1000,
    
    // 忽略的錯誤類型
    ignoreErrors: [
      'net::ERR_INTERNET_DISCONNECTED',
      'Navigation timeout',
    ],
    
    // 錯誤截圖
    screenshotOnError: true,
  },
  
  // 效能設定
  performance: {
    // 禁用圖片載入（加速測試）
    disableImages: false,
    
    // 禁用 CSS 動畫
    disableAnimations: true,
    
    // 資源攔截
    interceptResources: {
      images: true,
      stylesheets: true,
      fonts: true,
      scripts: true,
    },
    
    // 快取策略
    cache: {
      enabled: true,
      maxSize: '100mb',
      ttl: 3600, // 1小時
    },
  },
  
  // 調試設定
  debug: {
    // 控制台日誌
    console: process.env.DEBUG ? true : false,
    
    // 網路請求日誌
    network: process.env.DEBUG ? true : false,
    
    // 頁面錯誤日誌
    pageErrors: true,
    
    // 截圖保存路徑
    screenshotPath: process.env.DEBUG ? 'tests/visual/results/debug' : null,
    
    // 詳細日誌
    verbose: process.env.DEBUG ? true : false,
  },
};