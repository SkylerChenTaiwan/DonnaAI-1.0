/**
 * Web 平台專用的 Icon 組件
 * 使用 CDN 載入的 Ionicons 字體
 */

import React from 'react';
import { View, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface WebIconProps {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
  style?: any;
}

export const WebIcon: React.FC<WebIconProps> = ({ name, size = 24, color = '#000', style }) => {
  // 原生平台使用原本的 Ionicons
  if (Platform.OS !== 'web') {
    return <Ionicons name={name} size={size} color={color} style={style} />;
  }

  // Web 平台使用 ion-icon web component
  // 將 React Native 的 icon 名稱轉換為 web component 格式
  const webIconName = name.replace(/-outline$/, '').replace(/-sharp$/, '');
  
  return (
    <View style={[{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }, style]}>
      <ion-icon 
        name={webIconName}
        style={{
          fontSize: `${size}px`,
          color: color,
        }}
      />
    </View>
  );
};

// 為了保持向後相容，匯出一個模擬 Ionicons 的物件
export const WebIonicons = {
  ...Ionicons,
  // 覆寫預設的組件
  render: (props: any) => <WebIcon {...props} />,
};