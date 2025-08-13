/**
 * AdaptiveSwitch 主入口
 * 根據平台自動選擇對應的實作
 */

import { Platform } from 'react-native';
import { AdaptiveSwitch as WebSwitch } from './AdaptiveSwitch.web';
import { AdaptiveSwitch as NativeSwitch } from './AdaptiveSwitch.native';

// 根據平台選擇對應的實作
export const AdaptiveSwitch = Platform.select({
  web: WebSwitch,
  default: NativeSwitch,
}) as typeof WebSwitch;

// 導出預設和類型
export default AdaptiveSwitch;
export * from './AdaptiveSwitch.types';