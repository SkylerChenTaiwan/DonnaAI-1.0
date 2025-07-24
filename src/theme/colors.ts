/**
 * 應用程式顏色主題配置
 * 基於單色灰階設計系統，遵循 Notion 風格
 * 保持向後兼容性，同時引入新的設計系統
 */

import { DesignSystem } from './designSystem';

export const colors = {
  // 主要品牌色 - 映射到新設計系統
  primary: DesignSystem.colors.primary,           // 深灰黑色 #1A1A1A
  primaryDark: DesignSystem.colors.gray[900],     // 更深的灰黑 #171717
  primaryLight: DesignSystem.colors.gray[600],    // 較淺的灰 #525252

  // 次要顏色 - 保留功能色
  secondary: DesignSystem.colors.status.success,    // 綠色 #34C759
  secondaryDark: '#248A3D',                        // 較深的綠色
  secondaryLight: '#5DD675',                       // 較淺的綠色

  // 系統顏色 - 保留必要的狀態色
  error: DesignSystem.colors.status.error,         // 錯誤紅 #FF3B30
  warning: DesignSystem.colors.status.warning,     // 警告橙 #FF9500
  success: DesignSystem.colors.status.success,     // 成功綠 #34C759
  info: DesignSystem.colors.status.info,           // 資訊紫 #5856D6

  // 背景顏色 - 使用新設計系統
  background: DesignSystem.colors.background.surface,       // 白色 #FFFFFF
  backgroundSecondary: DesignSystem.colors.background.primary, // 淺灰 #F5F5F5
  backgroundTertiary: DesignSystem.colors.background.elevated, // 微灰 #FAFAFA

  // 文字顏色 - 使用新設計系統
  text: DesignSystem.colors.text.primary,            // 主要文字 #1A1A1A
  textSecondary: DesignSystem.colors.text.secondary, // 次要文字 #666666
  textTertiary: DesignSystem.colors.text.tertiary,   // 第三級文字 #999999
  textPlaceholder: DesignSystem.colors.text.tertiary, // 佔位符文字 #999999

  // 邊框和分隔線 - 使用新設計系統
  border: DesignSystem.colors.border.default,    // 預設邊框 #D1D5DB
  separator: DesignSystem.colors.border.light,   // 分隔線 #E5E7EB
  
  // 中性色系 - 直接使用設計系統的灰階
  gray: DesignSystem.colors.gray,

  // 圖表專用顏色 - 使用更柔和的灰階變化
  chart: {
    colors: [
      DesignSystem.colors.primary,        // 深灰黑 #1A1A1A
      DesignSystem.colors.gray[600],      // #525252
      DesignSystem.colors.gray[500],      // #737373
      DesignSystem.colors.gray[400],      // #A3A3A3
      DesignSystem.colors.status.success, // 綠色（保留用於正面數據）
      DesignSystem.colors.status.error,   // 紅色（保留用於負面數據）
      DesignSystem.colors.gray[700],      // #404040
      DesignSystem.colors.gray[300],      // #D4D4D4
    ]
  }
} as const;

// 導出類型定義
export type Colors = typeof colors;