/**
 * 樣式系統類型定義
 * 定義統一的樣式優先級和配置介面
 */

import type { ViewStyle, TextStyle, ImageStyle } from 'react-native';
import type { CSSProperties } from 'react';

// React Native 樣式類型聯合
export type RNStyle = ViewStyle | TextStyle | ImageStyle;

// 跨平台樣式類型
export type CrossPlatformStyle = RNStyle | CSSProperties;

// 樣式優先級常數
export enum StylePriority {
  // 基礎層級 (1-10)
  DEFAULT = 1,           // 元件預設樣式
  THEME = 2,            // 主題預設樣式
  
  // 預設層級 (11-20)  
  SIZE_PRESET = 11,     // 尺寸預設值 (small, medium, large)
  VARIANT_PRESET = 12,  // 變體預設值 (primary, secondary)
  
  // 用戶層級 (21-30)
  USER_STYLE = 21,      // 通用 style prop
  
  // 平台層級 (31-40)
  PLATFORM_STYLE = 31,  // webStyle/nativeStyle
  
  // 特定層級 (41-50)
  CONTENT_STYLE = 41,   // contentStyle, overlayStyle 等
  CONTAINER_STYLE = 42, // containerStyle
  
  // 覆蓋層級 (51-60)
  INLINE_OVERRIDE = 51, // 內聯樣式覆蓋
  IMPORTANT = 60        // !important 樣式
}

// 樣式配置介面
export interface StyleConfig {
  priority: StylePriority | number;
  style: CrossPlatformStyle;
  source?: string;  // 用於除錯：樣式來源
  important?: boolean;  // 是否添加 !important
}

// 樣式合併選項
export interface StyleMergeOptions {
  platform?: 'web' | 'native';
  debug?: boolean;  // 是否輸出除錯資訊
  forceImportant?: boolean;  // 強制所有樣式為 !important
}

// 樣式處理結果
export interface StyleProcessResult {
  style: any;  // 最終樣式
  sources?: string[];  // 樣式來源列表（除錯用）
  conflicts?: StyleConflict[];  // 樣式衝突列表
}

// 樣式衝突資訊
export interface StyleConflict {
  property: string;
  values: Array<{
    value: any;
    source: string;
    priority: number;
  }>;
  resolved: any;  // 最終解析的值
}

// 元件樣式屬性標準介面
export interface AdaptiveStyleProps {
  // 基礎樣式
  style?: CrossPlatformStyle;
  
  // 平台特定樣式
  webStyle?: CSSProperties;
  nativeStyle?: RNStyle;
  
  // 容器和內容樣式
  containerStyle?: CrossPlatformStyle;
  contentStyle?: CrossPlatformStyle;
  overlayStyle?: CrossPlatformStyle;
  
  // 預設值
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  variant?: string;
  
  // 除錯
  debugStyle?: boolean;
}

// 樣式處理器介面
export interface StyleProcessor {
  mergeStyles(configs: StyleConfig[], options?: StyleMergeOptions): StyleProcessResult;
  adaptStyle(style: CrossPlatformStyle, platform?: 'web' | 'native'): any;
}

// 樣式快取介面
export interface StyleCache {
  get(key: string): any;
  set(key: string, value: any): void;
  clear(): void;
}