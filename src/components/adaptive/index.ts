/**
 * Adaptive Components 主要匯出點
 * 提供簡化的匯入路徑
 */

// 匯出所有核心元件
export * from './core';

// 匯出平台適配器
export * from './platform';

// 提供簡化的預設匯出
export {
  AdaptiveView,
  AdaptiveText,
  AdaptiveButton,
  AdaptiveInput,
  AdaptiveSelect,
  AdaptiveImage,
  AdaptiveModal,
  AdaptiveSwitch,
} from './core';