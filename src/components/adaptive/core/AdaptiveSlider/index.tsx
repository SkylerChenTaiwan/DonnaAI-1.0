/**
 * AdaptiveSlider 主入口
 * 根據平台自動選擇對應的實作
 */

import { Platform } from 'react-native';

// 使用 Platform.select 動態載入對應平台的實作
const AdaptiveSlider = Platform.select({
  web: () => require('./AdaptiveSlider.web').AdaptiveSlider,
  default: () => require('./AdaptiveSlider.native').AdaptiveSlider,
})!();

export { AdaptiveSlider };
export type { AdaptiveSliderProps } from './AdaptiveSlider.types';