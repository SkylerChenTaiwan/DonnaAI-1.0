/**
 * Dashboard 配置檔案
 * 集中管理所有 Dashboard 相關的配置設定
 */

// 即時資料配置
export const REALTIME_CONFIG = {
  // WebSocket 配置
  websocket: {
    url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
    reconnectInterval: 5000,
    maxReconnectAttempts: 10,
    heartbeatInterval: 30000,
    connectionTimeout: 10000,
  },
  
  // Server-Sent Events 配置
  sse: {
    url: process.env.NEXT_PUBLIC_API_URL || '',
    endpoint: '/api/realtime/events',
    reconnectInterval: 5000,
    maxReconnectAttempts: 10,
  },
  
  // 事件訂閱配置
  events: {
    defaultSubscriptions: [
      'dashboard_data_updated',
      'metric_changed',
      'notification_received'
    ],
    batchSize: 10,
    throttleDelay: 300,
  },
} as const;

// 佈局配置
export const LAYOUT_CONFIG = {
  // 網格設定
  grid: {
    defaultCols: 12,
    defaultRows: 8,
    minCellWidth: 120,
    minCellHeight: 80,
    gap: 16,
    containerPadding: 24,
  },
  
  // 響應式斷點
  breakpoints: {
    xs: { minWidth: 0, cols: 2, cellWidth: 120 },
    sm: { minWidth: 640, cols: 4, cellWidth: 140 },
    md: { minWidth: 768, cols: 6, cellWidth: 160 },
    lg: { minWidth: 1024, cols: 8, cellWidth: 180 },
    xl: { minWidth: 1280, cols: 12, cellWidth: 200 },
    '2xl': { minWidth: 1536, cols: 16, cellWidth: 220 },
  },
  
  // 小工具限制
  widgets: {
    maxWidgets: 20,
    minSize: { width: 1, height: 1 },
    maxSize: { width: 8, height: 6 },
    defaultSize: { width: 3, height: 2 },
  },
  
  // 拖拽配置
  dragAndDrop: {
    enableSnapping: true,
    snapThreshold: 10,
    dragThreshold: 5,
    animationDuration: 200,
  },
} as const;

// 效能配置
export const PERFORMANCE_CONFIG = {
  // 虛擬化設定
  virtualization: {
    enabled: true,
    threshold: 50, // 超過 50 個項目時啟用虛擬化
    itemHeight: 120,
    overscan: 5,
  },
  
  // 懶加載設定
  lazyLoading: {
    enabled: true,
    threshold: 0.1, // 10% 進入視窗時載入
    rootMargin: '50px',
    loadingDelay: 100,
  },
  
  // 防抖和節流設定
  debounce: {
    search: 300,
    resize: 250,
    scroll: 100,
    input: 500,
  },
  
  // 快取設定
  cache: {
    // 記憶體快取
    memory: {
      maxSize: 100, // 最多快取 100 個項目
      ttl: 5 * 60 * 1000, // 5 分鐘過期
    },
    
    // 本地儲存快取
    localStorage: {
      prefix: 'donnaai_dashboard_',
      maxSize: 5 * 1024 * 1024, // 5MB
      compression: true,
    },
    
    // API 回應快取
    api: {
      defaultTtl: 2 * 60 * 1000, // 2 分鐘
      maxAge: 10 * 60 * 1000, // 10 分鐘
      staleWhileRevalidate: true,
    },
  },
  
  // 圖表效能設定
  charts: {
    maxDataPoints: 1000,
    animationDuration: 300,
    updateThrottle: 100,
    renderDelay: 16, // 60fps
  },
} as const;

// API 配置
export const API_CONFIG = {
  // 端點配置
  endpoints: {
    base: process.env.NEXT_PUBLIC_API_URL || '',
    dashboard: '/api/dashboard',
    metrics: '/api/dashboard/metrics',
    trends: '/api/dashboard/trends',
    team: '/api/dashboard/team',
    ai: '/api/dashboard/ai',
    realtime: '/api/realtime',
  },
  
  // 請求配置
  request: {
    timeout: 10000,
    retries: 3,
    retryDelay: 1000,
    retryMultiplier: 1.5,
  },
  
  // 批次請求配置
  batch: {
    enabled: true,
    maxBatchSize: 5,
    batchDelay: 100,
  },
  
  // 錯誤處理配置
  errorHandling: {
    maxRetries: 3,
    backoffMultiplier: 2,
    maxBackoffDelay: 30000,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  },
} as const;

// UI 配置
export const UI_CONFIG = {
  // 主題配置
  theme: {
    defaultTheme: 'light',
    enableSystemTheme: true,
    availableThemes: ['light', 'dark', 'auto'],
  },
  
  // 動畫配置
  animations: {
    enabled: true,
    duration: {
      fast: 150,
      normal: 300,
      slow: 500,
    },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    },
  },
  
  // 通知配置
  notifications: {
    position: 'top-right',
    duration: 5000,
    maxNotifications: 5,
    enableSound: false,
  },
  
  // 載入狀態配置
  loading: {
    spinnerDelay: 200,
    skeletonAnimation: true,
    progressIndicator: true,
  },
} as const;

// 無障礙配置
export const ACCESSIBILITY_CONFIG = {
  // 鍵盤導航
  keyboard: {
    enabled: true,
    shortcuts: {
      search: '/',
      help: '?',
      settings: ',',
    },
  },
  
  // 螢幕閱讀器
  screenReader: {
    enabled: true,
    announcePageChanges: true,
    announceNotifications: true,
  },
  
  // 視覺輔助
  visual: {
    highContrast: false,
    reducedMotion: false,
    largeText: false,
  },
} as const;

// 開發配置
export const DEV_CONFIG = {
  // 除錯模式
  debug: {
    enabled: process.env.NODE_ENV === 'development',
    logLevel: 'info',
    showPerformanceMetrics: true,
    enableDevTools: true,
  },
  
  // 測試模式
  testing: {
    mockApi: process.env.NEXT_PUBLIC_MOCK_API === 'true',
    enableTestIds: true,
    slowNetwork: false,
  },
  
  // 開發工具
  devTools: {
    enableReduxDevTools: true,
    enableReactDevTools: true,
    enablePerformanceProfiler: false,
  },
} as const;

// 安全配置
export const SECURITY_CONFIG = {
  // CSP (Content Security Policy)
  csp: {
    enabled: true,
    reportOnly: false,
  },
  
  // XSS 防護
  xss: {
    enabled: true,
    sanitizeHtml: true,
    allowedTags: ['b', 'i', 'em', 'strong', 'code'],
  },
  
  // 資料驗證
  validation: {
    enabled: true,
    strictMode: true,
    sanitizeInput: true,
  },
} as const;

// 監控配置
export const MONITORING_CONFIG = {
  // 效能監控
  performance: {
    enabled: true,
    sampleRate: 0.1, // 10% 取樣率
    reportThreshold: 2000, // 2 秒以上才報告
  },
  
  // 錯誤監控
  errorTracking: {
    enabled: true,
    ignorePatterns: [
      /ResizeObserver loop limit exceeded/,
      /Non-Error promise rejection captured/,
    ],
  },
  
  // 使用者行為追蹤
  analytics: {
    enabled: process.env.NODE_ENV === 'production',
    anonymizeIP: true,
    cookieConsent: true,
  },
} as const;

// 匯出整合配置
export const DASHBOARD_CONFIG = {
  realtime: REALTIME_CONFIG,
  layout: LAYOUT_CONFIG,
  performance: PERFORMANCE_CONFIG,
  api: API_CONFIG,
  ui: UI_CONFIG,
  accessibility: ACCESSIBILITY_CONFIG,
  dev: DEV_CONFIG,
  security: SECURITY_CONFIG,
  monitoring: MONITORING_CONFIG,
} as const;

// 配置類型定義
export type DashboardConfig = typeof DASHBOARD_CONFIG;
export type RealtimeConfig = typeof REALTIME_CONFIG;
export type LayoutConfig = typeof LAYOUT_CONFIG;
export type PerformanceConfig = typeof PERFORMANCE_CONFIG;
export type ApiConfig = typeof API_CONFIG;
export type UiConfig = typeof UI_CONFIG;

// 配置驗證函數
export function validateConfig(): boolean {
  try {
    // 檢查必要的環境變數
    const requiredEnvVars = [
      'NEXT_PUBLIC_API_URL',
    ];
    
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        console.warn(`Missing environment variable: ${envVar}`);
      }
    }
    
    // 檢查配置值的合理性
    if (PERFORMANCE_CONFIG.cache.memory.maxSize <= 0) {
      throw new Error('Memory cache max size must be positive');
    }
    
    if (REALTIME_CONFIG.websocket.reconnectInterval < 1000) {
      throw new Error('Reconnect interval too short (minimum 1000ms)');
    }
    
    return true;
  } catch (error) {
    console.error('Configuration validation failed:', error);
    return false;
  }
}

// 取得執行時配置
export function getRuntimeConfig() {
  return {
    ...DASHBOARD_CONFIG,
    runtime: {
      timestamp: Date.now(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      buildTime: process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString(),
    },
  };
}

// 預設匯出
export default DASHBOARD_CONFIG;