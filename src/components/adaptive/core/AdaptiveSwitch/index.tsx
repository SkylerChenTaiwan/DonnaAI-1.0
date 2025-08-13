/**
 * AdaptiveSwitch 主入口
 * 根據平台自動選擇對應的實作
 */

import { Platform } from 'react-native';

// 根據平台動態載入對應的實作
const AdaptiveSwitch = Platform.select({
  web: () => require('./AdaptiveSwitch.web').AdaptiveSwitch,
  default: () => require('./AdaptiveSwitch.native').AdaptiveSwitch,
})!();

// 導出元件和類型
export default AdaptiveSwitch;
export { AdaptiveSwitch };
export * from './AdaptiveSwitch.types';