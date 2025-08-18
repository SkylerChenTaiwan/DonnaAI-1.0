/**
 * Jest 測試環境設定
 * 為 Firebase 認證互動測試配置必要的測試環境
 */

import 'react-native-gesture-handler/jestSetup';
import '@testing-library/jest-native/extend-expect';

// Mock react-native modules
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock Dimensions
jest.mock('react-native/Libraries/Utilities/Dimensions', () => ({
  get: jest.fn(() => ({
    width: 375,
    height: 812,
    scale: 2,
    fontScale: 1
  })),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
}));

// Mock Platform
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: jest.fn((platforms) => platforms.ios || platforms.default),
  Version: 14
}));

// Mock Alert
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn()
}));

// Mock Keyboard
jest.mock('react-native/Libraries/Components/Keyboard/Keyboard', () => ({
  dismiss: jest.fn(),
  addListener: jest.fn(() => ({
    remove: jest.fn()
  })),
  removeListener: jest.fn(),
  removeAllListeners: jest.fn()
}));

// Mock StatusBar
jest.mock('react-native/Libraries/Components/StatusBar/StatusBar', () => ({
  setBarStyle: jest.fn(),
  setBackgroundColor: jest.fn(),
  setTranslucent: jest.fn(),
  setHidden: jest.fn()
}));

// Mock NetInfo
jest.mock('@react-native-netinfo/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi'
  })),
  addEventListener: jest.fn(() => jest.fn())
}));

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
jest.mock('react-native-vector-icons/Feather', () => 'Icon');

// Global test utilities
global.console = {
  ...console,
  // 在測試中抑制某些警告
  warn: jest.fn(),
  error: jest.fn()
};

// Mock timers
jest.useFakeTimers();

// 設定全域測試超時
jest.setTimeout(10000);

// 模擬 fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve('')
  })
);

// 清理函數，在每個測試後執行
afterEach(() => {
  jest.clearAllTimers();
  jest.clearAllMocks();
});

// 測試失敗時的詳細錯誤信息
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// 模擬 Performance API
global.performance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn(() => []),
  getEntriesByType: jest.fn(() => [])
};

// 模擬 RequestAnimationFrame
global.requestAnimationFrame = (cb) => {
  return setTimeout(cb, 0);
};

global.cancelAnimationFrame = (id) => {
  clearTimeout(id);
};

// 模擬 localStorage (for web compatibility)
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// 模擬 sessionStorage
global.sessionStorage = localStorageMock;

// 模擬 URL 和 URLSearchParams
global.URL = class URL {
  constructor(url) {
    this.href = url;
    this.pathname = url.split('?')[0];
    this.search = url.includes('?') ? url.split('?')[1] : '';
  }
};

global.URLSearchParams = class URLSearchParams {
  constructor(params) {
    this.params = new Map();
    if (typeof params === 'string') {
      params.split('&').forEach(param => {
        const [key, value] = param.split('=');
        this.params.set(key, value);
      });
    }
  }
  
  get(key) {
    return this.params.get(key);
  }
  
  set(key, value) {
    this.params.set(key, value);
  }
};

// 錯誤邊界模擬
global.ErrorBoundary = ({ children }) => children;

// 測試工具函數
global.testUtils = {
  // 等待異步操作完成
  waitForAsync: async (fn, timeout = 5000) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      try {
        const result = await fn();
        if (result) return result;
      } catch (error) {
        // 繼續等待
      }
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    throw new Error(`等待異步操作超時 (${timeout}ms)`);
  },
  
  // 模擬用戶輸入延遲
  simulateUserDelay: () => new Promise(resolve => setTimeout(resolve, 50)),
  
  // 創建測試用戶數據
  createMockUser: (overrides = {}) => ({
    id: 'test-uid',
    email: 'test@example.com',
    name: 'Test User',
    role: 'salesperson',
    organizationId: 'org-1',
    teamIds: ['team-1'],
    createdAt: new Date(),
    lastLoginAt: new Date(),
    ...overrides
  }),
  
  // 創建測試錯誤
  createAuthError: (code, message) => ({
    code: `auth/${code}`,
    message: `Firebase: Error (auth/${code}). ${message}`
  }),
  
  // 模擬網路延遲
  simulateNetworkDelay: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms))
};

// 輸出測試環境信息
console.log('🧪 Firebase 認證互動測試環境已初始化');
console.log('📱 平台:', global.Platform?.OS || 'unknown');
console.log('🎯 測試模式: 互動測試');
console.log('⏰ 測試超時:', jest.getTimeout(), 'ms');

// 確保在測試結束後清理所有定時器
process.on('exit', () => {
  jest.clearAllTimers();
});