/**
 * 進度指示器元件
 * 根據平台自動選擇適當的實作
 */

import { Platform } from 'react-native';

// 根據平台動態載入
const ProgressIndicator = Platform.select({
  web: () => require('./ProgressIndicator.web').default,
  default: () => require('./ProgressIndicator').default })!();

export { ProgressIndicator };
export default ProgressIndicator;