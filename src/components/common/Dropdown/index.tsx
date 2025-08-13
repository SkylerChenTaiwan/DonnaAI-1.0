/**
 * Dropdown 元件導出
 * 根據平台自動選擇適當的實作
 */

import { Platform } from 'react-native';

// 動態導入以避免 Web 平台載入 Native 元件
const DropdownComponent = Platform.select({
  web: () => require('./Dropdown.web').Dropdown,
  default: () => require('./Dropdown').Dropdown })();

export const Dropdown = DropdownComponent;