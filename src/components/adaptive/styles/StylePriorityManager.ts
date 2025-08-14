/**
 * StylePriorityManager - 統一的樣式優先級管理器
 * 解決樣式衝突並提供一致的樣式合併行為
 */

import { Platform } from 'react-native';
import type {
  StyleConfig,
  StyleMergeOptions,
  StyleProcessResult,
  StyleConflict,
  CrossPlatformStyle,
  StyleProcessor,
  StyleCache
} from './types';
import { StylePriority } from './types';

// 簡單的樣式快取實現
class SimpleStyleCache implements StyleCache {
  private cache = new Map<string, any>();
  private maxSize = 100;

  get(key: string): any {
    return this.cache.get(key);
  }

  set(key: string, value: any): void {
    // 簡單的 LRU 策略
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }
}

export class StylePriorityManager implements StyleProcessor {
  private static instance: StylePriorityManager;
  private cache: StyleCache;
  private debugMode: boolean = false;

  private constructor() {
    this.cache = new SimpleStyleCache();
    // 在開發模式下預設開啟除錯
    this.debugMode = (typeof __DEV__ !== 'undefined' && __DEV__) || 
                    process.env.NODE_ENV === 'development';
  }

  // 單例模式
  static getInstance(): StylePriorityManager {
    if (!StylePriorityManager.instance) {
      StylePriorityManager.instance = new StylePriorityManager();
    }
    return StylePriorityManager.instance;
  }

  /**
   * 保護特定屬性不被覆蓋
   * @param style 樣式物件
   * @param properties 要保護的屬性列表
   * @param priority 優先級
   */
  protectProperties(style: any, properties: string[], priority: number): StyleConfig {
    const protectedStyle: any = {};
    
    for (const prop of properties) {
      if (style[prop] !== undefined) {
        protectedStyle[prop] = style[prop];
      }
    }
    
    return {
      priority,
      style: protectedStyle,
      source: 'protected-properties',
      protected: true
    };
  }

  /**
   * 合併多個樣式配置
   * @param configs 樣式配置陣列
   * @param options 合併選項
   */
  mergeStyles(configs: StyleConfig[], options?: StyleMergeOptions): StyleProcessResult {
    const platform = options?.platform || Platform.OS;
    const debug = options?.debug ?? this.debugMode;
    const forceImportant = options?.forceImportant || false;

    // 生成快取鍵
    const cacheKey = this.generateCacheKey(configs, options);
    const cached = this.cache.get(cacheKey);
    if (cached && !debug) {
      return cached;
    }

    // 分離保護和非保護的樣式配置
    const protectedConfigs = configs.filter(c => c.protected);
    const regularConfigs = configs.filter(c => !c.protected);

    // 按優先級排序常規配置
    const sortedConfigs = [...regularConfigs].sort((a, b) => a.priority - b.priority);

    // 追蹤樣式來源和衝突
    const sources: string[] = [];
    const conflicts: Map<string, StyleConflict> = new Map();
    let mergedStyle: any = {};

    // 逐個合併常規樣式
    for (const config of sortedConfigs) {
      if (!config.style) continue;

      // 記錄來源
      if (config.source) {
        sources.push(`${config.source} (priority: ${config.priority})`);
      }

      // 適配平台樣式
      const adaptedStyle = this.adaptStyle(config.style, platform);

      // 處理每個樣式屬性
      for (const [prop, value] of Object.entries(adaptedStyle)) {
        // 追蹤衝突
        if (debug && mergedStyle[prop] !== undefined) {
          this.trackConflict(conflicts, prop, mergedStyle[prop], config.source || 'unknown', config.priority - 1);
          this.trackConflict(conflicts, prop, value, config.source || 'unknown', config.priority);
        }

        // 應用樣式
        if (platform === 'web' && (config.important || forceImportant)) {
          mergedStyle[prop] = this.addImportant(value);
        } else {
          mergedStyle[prop] = value;
        }
      }
    }

    // 最後應用保護的樣式（最高優先級）
    for (const config of protectedConfigs) {
      if (!config.style) continue;

      // 記錄來源
      if (config.source) {
        sources.push(`${config.source} (priority: ${config.priority}, protected)`);
      }

      // 適配平台樣式
      const adaptedStyle = this.adaptStyle(config.style, platform);

      // 直接覆蓋，不管之前的值
      for (const [prop, value] of Object.entries(adaptedStyle)) {
        // 在 debug 模式下警告被保護屬性覆蓋的情況
        if (debug && mergedStyle[prop] !== undefined && mergedStyle[prop] !== value) {
          console.warn(
            `🔒 StylePriorityManager: 保護屬性 "${prop}" 覆蓋了原值`,
            { 原值: mergedStyle[prop], 新值: value, 來源: config.source }
          );
        }
        mergedStyle[prop] = value;
      }
    }

    // 準備結果
    const result: StyleProcessResult = {
      style: mergedStyle
    };

    // 添加除錯資訊
    if (debug) {
      result.sources = sources;
      result.conflicts = Array.from(conflicts.values());
      
      // 輸出除錯資訊
      if (result.conflicts.length > 0) {
        console.group('🎨 StylePriorityManager: 樣式衝突');
        result.conflicts.forEach(conflict => {
          console.log(`屬性: ${conflict.property}`);
          console.table(conflict.values);
          console.log(`解析值: ${conflict.resolved}`);
        });
        console.groupEnd();
      }
    }

    // 快取結果
    if (!debug) {
      this.cache.set(cacheKey, result);
    }

    return result;
  }

  /**
   * 適配樣式到特定平台
   */
  adaptStyle(style: CrossPlatformStyle, platform: 'web' | 'native' = Platform.OS as any): any {
    if (!style) return {};

    // Web 平台需要特殊處理
    if (platform === 'web') {
      return this.convertToWebStyle(style);
    }

    // Native 平台直接返回
    return style;
  }

  /**
   * 轉換為 Web 樣式
   */
  private convertToWebStyle(style: any): any {
    const webStyle: any = {};

    for (const [key, value] of Object.entries(style)) {
      if (value === undefined || value === null) continue;

      // 處理特殊屬性
      switch (key) {
        // 處理間距
        case 'marginHorizontal':
          webStyle.marginLeft = this.convertSpacing(value);
          webStyle.marginRight = this.convertSpacing(value);
          break;
        case 'marginVertical':
          webStyle.marginTop = this.convertSpacing(value);
          webStyle.marginBottom = this.convertSpacing(value);
          break;
        case 'paddingHorizontal':
          webStyle.paddingLeft = this.convertSpacing(value);
          webStyle.paddingRight = this.convertSpacing(value);
          break;
        case 'paddingVertical':
          webStyle.paddingTop = this.convertSpacing(value);
          webStyle.paddingBottom = this.convertSpacing(value);
          break;

        // 處理陰影
        case 'elevation':
          webStyle.boxShadow = this.convertElevation(value as number);
          break;
        case 'shadowColor':
        case 'shadowOffset':
        case 'shadowOpacity':
        case 'shadowRadius':
          // 這些需要組合處理，暫時忽略
          break;

        // 處理文字裝飾
        case 'textDecorationLine':
          webStyle.textDecoration = value;
          break;

        // 數值屬性需要加 px
        case 'width':
        case 'height':
        case 'minWidth':
        case 'minHeight':
        case 'maxWidth':
        case 'maxHeight':
        case 'top':
        case 'right':
        case 'bottom':
        case 'left':
        case 'margin':
        case 'marginTop':
        case 'marginRight':
        case 'marginBottom':
        case 'marginLeft':
        case 'padding':
        case 'paddingTop':
        case 'paddingRight':
        case 'paddingBottom':
        case 'paddingLeft':
        case 'borderRadius':
        case 'borderWidth':
        case 'borderTopWidth':
        case 'borderRightWidth':
        case 'borderBottomWidth':
        case 'borderLeftWidth':
        case 'fontSize':
        case 'lineHeight':
        case 'letterSpacing':
          webStyle[key] = this.convertSpacing(value);
          break;

        // 直接傳遞的屬性
        default:
          webStyle[key] = value;
      }
    }

    return webStyle;
  }

  /**
   * 轉換間距值
   */
  private convertSpacing(value: string | number): string {
    if (typeof value === 'number') {
      return `${value}px`;
    }
    return value;
  }

  /**
   * 轉換 elevation 為 box-shadow
   */
  private convertElevation(elevation: number): string {
    const elevationMap: Record<number, string> = {
      0: 'none',
      1: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
      2: '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',
      3: '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)',
      4: '0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)',
      5: '0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22)'
    };
    
    return elevationMap[elevation] || elevationMap[1];
  }

  /**
   * 為值添加 !important
   */
  private addImportant(value: any): string {
    if (typeof value === 'string' && !value.includes('!important')) {
      return `${value} !important`;
    }
    return value;
  }

  /**
   * 追蹤樣式衝突
   */
  private trackConflict(
    conflicts: Map<string, StyleConflict>,
    property: string,
    value: any,
    source: string,
    priority: number
  ): void {
    if (!conflicts.has(property)) {
      conflicts.set(property, {
        property,
        values: [],
        resolved: value
      });
    }

    const conflict = conflicts.get(property)!;
    conflict.values.push({ value, source, priority });
    conflict.resolved = value; // 最後的值就是解析值
  }

  /**
   * 生成快取鍵
   */
  private generateCacheKey(configs: StyleConfig[], options?: StyleMergeOptions): string {
    const configKey = configs
      .map(c => `${c.priority}:${c.protected ? 'p' : ''}:${JSON.stringify(c.style)}`)
      .join('|');
    const optionsKey = JSON.stringify(options || {});
    return `${configKey}::${optionsKey}`;
  }

  /**
   * 設定除錯模式
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  /**
   * 清除快取
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 建立樣式配置的輔助方法
   */
  static createConfig(
    style: CrossPlatformStyle,
    priority: StylePriority | number,
    source?: string
  ): StyleConfig {
    return {
      style,
      priority,
      source
    };
  }

  /**
   * 快速合併樣式的靜態方法
   */
  static merge(...styles: Array<CrossPlatformStyle | undefined>): any {
    const manager = StylePriorityManager.getInstance();
    const configs = styles
      .filter(style => style !== undefined)
      .map((style, index) => ({
        style: style!,
        priority: StylePriority.USER_STYLE + index,
        source: `style[${index}]`
      }));

    const result = manager.mergeStyles(configs);
    return result.style;
  }
}