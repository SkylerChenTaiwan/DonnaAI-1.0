/**
 * Button 元件平台選擇器
 * 根據平台自動載入對應的實作
 */

import { Platform } from 'react-native';

// 根據平台動態載入
const Button = Platform.select({
  web: () => require('./Button.web').default,
  default: () => require('./Button.native').default })!();

export { Button };
export default Button;