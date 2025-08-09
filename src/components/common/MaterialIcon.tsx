/**
 * MaterialIcon 元件
 * 
 * 這個檔案不應該有實際的實作
 * Metro bundler 會自動根據平台選擇：
 * - Web: MaterialIcon.web.tsx
 * - Native: MaterialIcon.native.tsx
 */

import { ViewStyle } from 'react-native';

export interface MaterialIconProps {
  name: string;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

// 這是一個佔位符，實際的實作在平台特定檔案中
export const MaterialIcon: React.FC<MaterialIconProps> = () => {
  throw new Error('MaterialIcon component should be imported from platform-specific file');
};