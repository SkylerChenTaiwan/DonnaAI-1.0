/**
 * 設計系統常量
 * 基於 Notion 風格的單色灰階設計系統
 */

export const DesignSystem = {
  colors: {
    // 主色調 - 深灰色用於按鈕和互動元素（Linear 風格）
    primary: '#2C2C2C',
    
    // 背景色
    background: {
      primary: '#FFFFFF',  // 主背景 - 純白
      surface: '#FFFFFF',  // 卡片背景 - 純白
      elevated: '#FFFFFF', // 提升的背景 - 純白
      input: '#FAFAFA',    // 輸入欄位背景 - 極淺灰
    },
    
    // 按鈕專用色彩系統
    button: {
      // 主要按鈕
      primary: {
        default: '#2C2C2C',
        hover: '#3C3C3C',
        pressed: '#1C1C1C',
      },
      // 次要按鈕
      secondary: {
        default: '#F7F7F7',
        hover: '#ECECEC',
        pressed: '#E0E0E0',
      },
      // 輪廓按鈕
      outline: {
        border: '#D0D0D0',
        borderHover: '#A0A0A0',
        background: 'transparent',
        backgroundHover: 'rgba(0, 0, 0, 0.03)',
      },
      // Ghost 按鈕
      ghost: {
        background: 'transparent',
        backgroundHover: 'rgba(0, 0, 0, 0.05)',
      },
      // 文字按鈕
      text: {
        color: '#2C2C2C',
        underline: 'rgba(44, 44, 44, 0.3)',
      },
    },
    
    // 文字色
    text: {
      primary: '#1A1A1A',   // 主要文字
      secondary: '#666666', // 次要文字
      tertiary: '#999999',  // 第三級文字
      disabled: '#CCCCCC',  // 禁用文字
      inverse: '#FFFFFF',   // 反色文字（用於深色背景）
    },
    
    // 邊框色
    border: {
      light: '#E5E7EB',    // 淺邊框
      default: '#D1D5DB',  // 預設邊框
      medium: '#B5B5B5',   // 中等邊框 - 提升對比度
      dark: '#9CA3AF',     // 深邊框
    },
    
    // 狀態色 - 僅保留必要的功能色
    status: {
      success: '#34C759',  // 成功綠
      warning: '#FF9500',  // 警告橙
      error: '#FF3B30',    // 錯誤紅
      info: '#5856D6',     // 資訊紫（保留但減少使用）
    },
    
    // 灰階
    gray: {
      50: '#FAFAFA',
      100: '#F8F8F8',
      200: '#E5E5E5',
      300: '#D4D4D4',
      400: '#A3A3A3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
    },
  },
  
  // 間距系統
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  // 圓角系統
  borderRadius: {
    button: 6,  // 按鈕專用 - 更細膩的圓角
    sm: 8,      // 小元素
    md: 12,     // 卡片、容器
    lg: 16,     // 大卡片、模態框
    xl: 24,     // 特大圓角
    full: 9999, // 完全圓角
  },
  
  // 陰影系統
  shadows: {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 8,
    },
  },
  
  // 字體大小系統
  typography: {
    // 標題
    h1: {
      fontSize: 32,
      lineHeight: 40,
      fontWeight: '700' as const,
    },
    h2: {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: '600' as const,
    },
    h3: {
      fontSize: 20,
      lineHeight: 28,
      fontWeight: '600' as const,
    },
    h4: {
      fontSize: 18,
      lineHeight: 24,
      fontWeight: '600' as const,
    },
    
    // 正文
    body: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '400' as const,
    },
    bodySmall: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400' as const,
    },
    
    // 標籤
    caption: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '400' as const,
    },
    
    // 按鈕
    button: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500' as const,
    },
    buttonSmall: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '500' as const,
    },
    buttonLarge: {
      fontSize: 16,
      lineHeight: 22,
      fontWeight: '500' as const,
    },
  },
  
  // 過渡動畫
  transitions: {
    fast: 150,
    normal: 250,
    slow: 350,
  },
};

// 輔助函數：生成一致的按鈕樣式
export const getButtonStyle = (
  variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'text' = 'primary',
  size: 'small' | 'medium' | 'large' = 'medium'
) => {
  // 基礎樣式 - 無陰影
  const base = {
    borderRadius: DesignSystem.borderRadius.button,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flexDirection: 'row' as const,
    borderWidth: 0,
    ...DesignSystem.shadows.none,
  };
  
  // 尺寸樣式
  const sizeStyles = {
    small: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      ...DesignSystem.typography.buttonSmall,
    },
    medium: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      ...DesignSystem.typography.button,
    },
    large: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      ...DesignSystem.typography.buttonLarge,
    },
  };
  
  // 變體樣式
  const variantStyles = {
    primary: {
      backgroundColor: DesignSystem.colors.button.primary.default,
      color: DesignSystem.colors.text.inverse,
    },
    secondary: {
      backgroundColor: DesignSystem.colors.button.secondary.default,
      color: DesignSystem.colors.primary,
    },
    outline: {
      backgroundColor: DesignSystem.colors.button.outline.background,
      borderWidth: 1,
      borderColor: DesignSystem.colors.button.outline.border,
      color: DesignSystem.colors.primary,
    },
    ghost: {
      backgroundColor: DesignSystem.colors.button.ghost.background,
      color: DesignSystem.colors.primary,
    },
    text: {
      backgroundColor: 'transparent',
      paddingHorizontal: 0,
      paddingVertical: 0,
      color: DesignSystem.colors.button.text.color,
    },
  };
  
  return {
    ...base,
    ...sizeStyles[size],
    ...variantStyles[variant],
  };
};

// 輔助函數：生成一致的卡片樣式
export const getCardStyle = (elevated = false) => ({
  backgroundColor: DesignSystem.colors.background.surface,
  borderRadius: DesignSystem.borderRadius.md,
  padding: DesignSystem.spacing.md,
  ...(elevated ? DesignSystem.shadows.md : DesignSystem.shadows.sm),
});

// 輔助函數：生成一致的文字樣式
export const getTextStyle = (variant: 'primary' | 'secondary' | 'tertiary' = 'primary') => {
  const colors = {
    primary: DesignSystem.colors.text.primary,
    secondary: DesignSystem.colors.text.secondary,
    tertiary: DesignSystem.colors.text.tertiary,
  };
  
  return {
    color: colors[variant],
    ...DesignSystem.typography.body,
  };
};