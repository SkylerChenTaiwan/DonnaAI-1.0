import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';
import { vi } from 'vitest';
import { Platform } from 'react-native';

// 跨平台渲染輔助函數
export function renderWithProviders(
  ui: ReactElement,
  options: RenderOptions & {
    platform?: 'web' | 'ios' | 'android';
    initialState?: any;
    theme?: 'light' | 'dark';
  } = {}
) {
  const { platform = 'web', theme = 'light', initialState, ...renderOptions } = options;

  // 設定平台
  setPlatform(platform);

  // 建立 Providers
  const AllTheProviders = ({ children }: { children: ReactNode }) => {
    // 這裡可以加入各種 Provider (Theme, Auth, Database 等)
    return React.createElement(React.Fragment, null, children);
  };

  return render(ui, { wrapper: AllTheProviders, ...renderOptions });
}

// 設定平台
export function setPlatform(platform: 'web' | 'ios' | 'android') {
  Object.defineProperty(Platform, 'OS', {
    get: () => platform === 'web' ? 'web' : platform,
    configurable: true
  });
  
  Object.defineProperty(Platform, 'select', {
    value: (options: any) => {
      if (platform === 'web' && options.web !== undefined) return options.web;
      if (platform === 'ios' && options.ios !== undefined) return options.ios;
      if (platform === 'android' && options.android !== undefined) return options.android;
      return options.default;
    },
    configurable: true
  });
}

// 等待異步操作
export async function waitForAsync(fn: () => Promise<any>, timeout = 5000) {
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    try {
      return await fn();
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  throw new Error(`Async operation timed out after ${timeout}ms`);
}

// Mock Firebase
export function mockFirebase() {
  const auth = {
    currentUser: {
      uid: 'test-user-id',
      email: 'test@example.com'
    },
    signInWithEmailAndPassword: vi.fn().mockResolvedValue({ user: { uid: 'test-user-id' } }),
    signOut: vi.fn().mockResolvedValue(undefined),
    onAuthStateChanged: vi.fn((callback) => {
      callback({ uid: 'test-user-id', email: 'test@example.com' });
      return vi.fn();
    })
  };

  const firestore = {
    collection: vi.fn().mockReturnThis(),
    doc: vi.fn().mockReturnThis(),
    get: vi.fn().mockResolvedValue({ exists: true, data: () => ({}) }),
    set: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    onSnapshot: vi.fn((callback) => {
      callback({ docs: [] });
      return vi.fn();
    })
  };

  const storage = {
    ref: vi.fn().mockReturnThis(),
    put: vi.fn().mockResolvedValue({ ref: { getDownloadURL: vi.fn().mockResolvedValue('https://test.url') } }),
    getDownloadURL: vi.fn().mockResolvedValue('https://test.url')
  };

  return { auth, firestore, storage };
}

// 效能測試輔助
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();
  private measures: Map<string, number> = new Map();

  mark(name: string) {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string, endMark?: string) {
    const start = this.marks.get(startMark);
    const end = endMark ? this.marks.get(endMark) : performance.now();
    
    if (!start) throw new Error(`Start mark "${startMark}" not found`);
    if (endMark && !end) throw new Error(`End mark "${endMark}" not found`);
    
    const duration = (end || performance.now()) - start;
    this.measures.set(name, duration);
    
    return duration;
  }

  getMetrics() {
    return {
      marks: Object.fromEntries(this.marks),
      measures: Object.fromEntries(this.measures)
    };
  }

  clear() {
    this.marks.clear();
    this.measures.clear();
  }
}

// 記憶體使用監控
export function measureMemoryUsage() {
  if (typeof window !== 'undefined' && 'memory' in performance) {
    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit
    };
  }
  
  return null;
}

// 測試資料生成
export function generateTestData<T>(factory: (index: number) => T, count: number): T[] {
  return Array.from({ length: count }, (_, i) => factory(i));
}

// 斷言輔助
export function assertDefined<T>(value: T | undefined | null, message?: string): asserts value is T {
  if (value === undefined || value === null) {
    throw new Error(message || 'Value is not defined');
  }
}

// 快照測試輔助
export function prepareSnapshot(data: any) {
  // 移除動態值 (時間戳、隨機 ID 等)
  const cleaned = JSON.parse(JSON.stringify(data));
  
  const clean = (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;
    
    for (const key in obj) {
      if (key === 'id' || key === 'timestamp' || key === 'createdAt' || key === 'updatedAt') {
        obj[key] = '[DYNAMIC]';
      } else if (typeof obj[key] === 'object') {
        clean(obj[key]);
      }
    }
    
    return obj;
  };
  
  return clean(cleaned);
}

// 錯誤測試輔助
export async function expectToThrow(fn: () => any, errorMessage?: string | RegExp) {
  let error: Error | undefined;
  
  try {
    await fn();
  } catch (e) {
    error = e as Error;
  }
  
  expect(error).toBeDefined();
  
  if (errorMessage) {
    if (typeof errorMessage === 'string') {
      expect(error?.message).toContain(errorMessage);
    } else {
      expect(error?.message).toMatch(errorMessage);
    }
  }
}

// 控制台 Mock
export function mockConsole() {
  const originalConsole = { ...console };
  const logs: Array<{ type: string; args: any[] }> = [];

  ['log', 'warn', 'error', 'info', 'debug'].forEach(method => {
    vi.spyOn(console, method as any).mockImplementation((...args) => {
      logs.push({ type: method, args });
    });
  });

  return {
    logs,
    restore: () => {
      Object.assign(console, originalConsole);
    },
    getLogs: (type?: string) => {
      return type ? logs.filter(l => l.type === type) : logs;
    }
  };
}

// 延遲執行
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 重試機制
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delay?: number;
    backoff?: boolean;
  } = {}
): Promise<T> {
  const { maxAttempts = 3, delay: delayMs = 1000, backoff = true } = options;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      
      const waitTime = backoff ? delayMs * attempt : delayMs;
      await delay(waitTime);
    }
  }
  
  throw new Error('Retry failed');
}