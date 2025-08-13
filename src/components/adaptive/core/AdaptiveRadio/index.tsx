/**
 * AdaptiveRadio 主入口
 * 根據平台自動選擇對應的實作
 */

import { Platform } from 'react-native';

// 使用 Platform.select 動態載入對應平台的實作
const module = Platform.select({
  web: () => require('./AdaptiveRadio.web'),
  default: () => require('./AdaptiveRadio.native'),
})!();

export const AdaptiveRadio = module.AdaptiveRadio;
export const AdaptiveRadioGroup = module.AdaptiveRadioGroup;
export type { AdaptiveRadioProps, AdaptiveRadioGroupProps } from './AdaptiveRadio.types';