/**
 * 平台適配器核心 - 統一抽象層的基礎
 * 集中化所有 Platform.OS 判斷，提供跨平台統一介面
 */

import { Platform } from 'react-native';

export interface StyleAdapter {
  adaptStyle(style: any, platformSpecificStyle?: any): any;
  convertToCSS?(style: any): any;
  convertToRNStyle?(style: any): any;
}

export interface PlatformInfo {
  isWeb: boolean;
  isNative: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  platform: 'web' | 'ios' | 'android';
  version?: string;
}

/**
 * 平台適配器 - 單例模式
 * 提供統一的跨平台檢測和樣式適配
 */
export class PlatformAdapter {
  private static instance: PlatformAdapter;
  private _platformInfo: PlatformInfo;
  private _styleAdapter: StyleAdapter | null = null;

  private constructor() {
    this._platformInfo = this.detectPlatform();
  }

  /**
   * 取得單例實例
   */
  static getInstance(): PlatformAdapter {
    if (!PlatformAdapter.instance) {
      PlatformAdapter.instance = new PlatformAdapter();
    }
    return PlatformAdapter.instance;
  }

  /**
   * 檢測當前平台資訊
   */
  private detectPlatform(): PlatformInfo {
    // CRITICAL: 處理 SSR 環境的 Platform.OS undefined 問題
    const platformOS = Platform.OS;
    
    const isWeb = platformOS === 'web';
    const isNative = !isWeb;
    
    // Web 環境下檢測螢幕尺寸
    let isMobile = false;
    let isTablet = false;
    let isDesktop = false;
    
    if (isWeb && typeof window !== 'undefined') {
      const width = window.innerWidth;
      isMobile = width < 768;
      isTablet = width >= 768 && width < 1024;
      isDesktop = width >= 1024;
    } else if (isNative) {
      // React Native 環境，根據平台判斷
      isMobile = true; // RN 主要針對移動設備
    }

    return {
      isWeb,
      isNative,
      isMobile,
      isTablet,
      isDesktop,
      platform: (platformOS as 'web' | 'ios' | 'android') || 'web',
      version: Platform.Version ? String(Platform.Version) : undefined };
  }

  /**
   * 取得平台資訊
   */
  get platformInfo(): PlatformInfo {
    return this._platformInfo;
  }

  /**
   * 是否為 Web 平台
   */
  get isWeb(): boolean {
    return this._platformInfo.isWeb;
  }

  /**
   * 是否為原生平台
   */
  get isNative(): boolean {
    return this._platformInfo.isNative;
  }

  /**
   * 是否為手機
   */
  get isMobile(): boolean {
    return this._platformInfo.isMobile;
  }

  /**
   * 是否為平板
   */
  get isTablet(): boolean {
    return this._platformInfo.isTablet;
  }

  /**
   * 是否為桌面
   */
  get isDesktop(): boolean {
    return this._platformInfo.isDesktop;
  }

  /**
   * 取得當前平台
   */
  get platform(): string {
    return this._platformInfo.platform;
  }

  /**
   * 設定樣式適配器
   */
  setStyleAdapter(adapter: StyleAdapter): void {
    this._styleAdapter = adapter;
  }

  /**
   * 取得樣式適配器
   */
  getStyleAdapter(): StyleAdapter {
    if (!this._styleAdapter) {
      // 延遲載入適配器避免循環依賴
      if (this.isWeb) {
        const { WebStyleAdapter } = require('./WebStyleAdapter');
        this._styleAdapter = new WebStyleAdapter();
      } else {
        const { NativeStyleAdapter } = require('./NativeStyleAdapter');
        this._styleAdapter = new NativeStyleAdapter();
      }
    }
    return this._styleAdapter;
  }

  /**
   * 執行平台特定的程式碼
   */
  select<T>(options: {
    web?: T;
    native?: T;
    ios?: T;
    android?: T;
    default?: T;
  }): T | undefined {
    const { web, native, ios, android, default: defaultValue } = options;
    
    if (this.isWeb && web !== undefined) return web;
    if (this.platform === 'ios' && ios !== undefined) return ios;
    if (this.platform === 'android' && android !== undefined) return android;
    if (this.isNative && native !== undefined) return native;
    
    return defaultValue;
  }

  /**
   * 條件式執行函數
   */
  when<T>(condition: keyof PlatformInfo, callback: () => T): T | undefined {
    return this._platformInfo[condition] ? callback() : undefined;
  }

  /**
   * 重新檢測平台（通常用於視窗大小變化）
   */
  refresh(): void {
    this._platformInfo = this.detectPlatform();
  }

  /**
   * 監聽視窗大小變化（僅 Web）
   */
  onResize(callback: () => void): () => void {
    if (!this.isWeb || typeof window === 'undefined') {
      return () => {}; // 空函數
    }

    const handleResize = () => {
      this.refresh();
      callback();
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }

  /**
   * 取得媒體查詢字串（Web 專用）
   */
  getMediaQuery(): string {
    if (!this.isWeb) return '';
    
    if (this.isMobile) return '(max-width: 767px)';
    if (this.isTablet) return '(min-width: 768px) and (max-width: 1023px)';
    if (this.isDesktop) return '(min-width: 1024px)';
    
    return '';
  }
}