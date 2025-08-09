/**
 * Icon 元件
 * 
 * 這個檔案不應該有實際的實作
 * Metro bundler 會自動根據平台選擇：
 * - Web: Icon.web.tsx
 * - Native: Icon.native.tsx
 */

import { ViewStyle } from 'react-native';

export interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

// 這是一個佔位符，實際的實作在平台特定檔案中
export const Icon: React.FC<IconProps> = () => {
  throw new Error('Icon component should be imported from platform-specific file');
};