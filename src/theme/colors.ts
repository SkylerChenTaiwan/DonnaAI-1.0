/**
 * 應用程式顏色主題配置
 * 定義了整個應用程式中使用的標準顏色
 */

export const colors = {
  // 主要品牌色
  primary: '#007AFF',      // iOS 藍色，用於主要按鈕和強調元素
  primaryDark: '#0056CC',  // 較深的主色調，用於按壓狀態
  primaryLight: '#4DA2FF', // 較淺的主色調，用於次要元素

  // 次要顏色
  secondary: '#34C759',    // 綠色，用於成功狀態和次要按鈕
  secondaryDark: '#248A3D', // 較深的次要色
  secondaryLight: '#5DD675', // 較淺的次要色

  // 系統顏色
  error: '#FF3B30',        // 錯誤和警告
  warning: '#FF9500',      // 警告狀態
  success: '#34C759',      // 成功狀態
  info: '#007AFF',         // 資訊提示

  // 背景顏色
  background: '#FFFFFF',   // 主背景色
  backgroundSecondary: '#F2F2F7', // 次要背景色
  backgroundTertiary: '#F0F8FF',  // 第三級背景色

  // 文字顏色
  text: '#000000',         // 主要文字
  textSecondary: '#8E8E93', // 次要文字
  textTertiary: '#C7C7CC', // 第三級文字
  textPlaceholder: '#C7C7CC', // 佔位符文字

  // 邊框和分隔線
  border: '#C6C6C8',       // 主要邊框
  separator: '#E5E5EA',    // 分隔線
  
  // 中性色系
  gray: {
    50: '#F9F9FB',
    100: '#F2F2F7',
    200: '#E5E5EA',
    300: '#C7C7CC',
    400: '#8E8E93',
    500: '#636366',
    600: '#48484A',
    700: '#3A3A3C',
    800: '#2C2C2E',
    900: '#1C1C1E'
  },

  // 圖表專用顏色
  chart: {
    colors: [
      '#007AFF', // 藍色
      '#34C759', // 綠色
      '#FF9500', // 橙色
      '#FF3B30', // 紅色
      '#AF52DE', // 紫色
      '#FF2D92', // 粉紅色
      '#5AC8FA', // 青色
      '#FFCC00', // 黃色
    ]
  }
} as const;

// 導出類型定義
export type Colors = typeof colors;