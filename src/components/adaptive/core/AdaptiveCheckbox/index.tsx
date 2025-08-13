/**
 * AdaptiveCheckbox 主入口
 * 根據平台自動選擇對應的實作
 */

import { Platform } from 'react-native';
import { AdaptiveCheckbox as WebCheckbox } from './AdaptiveCheckbox.web';
import { AdaptiveCheckbox as NativeCheckbox } from './AdaptiveCheckbox.native';

// 使用 Platform.select 選擇對應平台的實作
export const AdaptiveCheckbox = Platform.select({
  web: WebCheckbox,
  default: NativeCheckbox,
}) as typeof WebCheckbox;

export type { AdaptiveCheckboxProps } from './AdaptiveCheckbox.types';