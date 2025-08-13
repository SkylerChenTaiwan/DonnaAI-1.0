/**
 * AdaptiveSearchBar 主入口
 * 根據平台自動選擇對應的實作
 */

import { Platform } from 'react-native';

// 使用 Platform.select 動態載入對應平台的實作
const AdaptiveSearchBar = Platform.select({
  web: () => require('./AdaptiveSearchBar.web').AdaptiveSearchBar,
  default: () => require('./AdaptiveSearchBar.native').AdaptiveSearchBar,
})!();

export { AdaptiveSearchBar };
export type { AdaptiveSearchBarProps } from './AdaptiveSearchBar.types';