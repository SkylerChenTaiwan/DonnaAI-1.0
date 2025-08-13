/**
 * AdaptiveDatePicker 主入口
 * 根據平台自動選擇對應的實作
 */

import { Platform } from 'react-native';

// 使用 Platform.select 動態載入對應平台的實作
const AdaptiveDatePicker = Platform.select({
  web: () => require('./AdaptiveDatePicker.web').AdaptiveDatePicker,
  default: () => require('./AdaptiveDatePicker.native').AdaptiveDatePicker,
})!();

export { AdaptiveDatePicker };
export type { AdaptiveDatePickerProps } from './AdaptiveDatePicker.types';