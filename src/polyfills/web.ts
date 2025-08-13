/**
 * Web 平台 Polyfills
 * 為 Web 平台提供必要的 polyfills 和相容性處理
 */

import { Platform } from 'react-native';

// 只在 Web 平台執行 polyfills
if (Platform.OS === 'web') {
  // 1. 全域物件相容性
  if (typeof global === 'undefined') {
    (window as any).global = window;
  }

  // 2. Process 物件 polyfill
  if (typeof process === 'undefined') {
    (window as any).process = {
      env: {},
      version: '1.0.0',
      nextTick: (callback: Function) => {
        setTimeout(callback, 0);
      } };
  }

  // 3. Buffer polyfill (某些套件可能需要)
  if (typeof Buffer === 'undefined') {
    (window as any).Buffer = {
      from: (data: any) => {
        if (typeof data === 'string') {
          return new TextEncoder().encode(data);
        }
        return data;
      },
      alloc: (size: number) => new Uint8Array(size),
      isBuffer: (obj: any) => obj instanceof Uint8Array };
  }

  // 4. Crypto polyfill 
  if (typeof crypto === 'undefined') {
    (window as any).crypto = window.crypto || (window as any).msCrypto;
  }

  // 5. Performance API polyfill
  if (!window.performance || !window.performance.now) {
    const startTime = Date.now();
    if (!window.performance) {
      (window as any).performance = {};
    }
    window.performance.now = () => Date.now() - startTime;
  }

  // 6. RequestAnimationFrame polyfill
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (callback: FrameRequestCallback) => {
      return window.setTimeout(() => callback(Date.now()), 1000 / 60);
    };
  }

  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = (id: number) => {
      clearTimeout(id);
    };
  }

  // 7. URL polyfill (for older browsers)
  if (typeof URL === 'undefined' && typeof window !== 'undefined') {
    (window as any).URL = (window as any).webkitURL;
  }

  // 8. IndexedDB polyfill check
  if (!window.indexedDB) {
    console.warn('IndexedDB 不被支援，檔案系統功能將受限');
  }

  // 9. Web Audio API check
  if (!window.AudioContext && !(window as any).webkitAudioContext) {
    console.warn('Web Audio API 不被支援，音訊功能將受限');
  }

  // 10. Notification API check
  if (!('Notification' in window)) {
    console.warn('Notification API 不被支援，通知功能將無法使用');
  }
}

// 匯出空物件以符合 TypeScript 模組規範
export {};