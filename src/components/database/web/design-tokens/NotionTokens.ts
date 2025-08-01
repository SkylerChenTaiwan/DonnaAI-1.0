export const NotionTokens = {
  colors: {
    // 精確的 Notion 色彩系統
    white: '#ffffff',
    background: '#fbfbfa',        // 主背景 - 溫暖白色
    gray05: '#f7f6f3',          // 表頭背景
    gray10: '#f1f1ef',          // 次要背景
    gray15: '#eeeeec',          // 分隔線背景
    gray20: '#e9e9e7',          // 淺色邊框
    gray30: '#d3d3d1',          // 主要邊框
    gray40: '#b8b8b6',          // 強調邊框
    gray50: '#9b9a97',          // 輔助文字
    gray60: '#787774',          // 次要文字
    gray70: '#64625f',          // 表頭文字
    gray90: '#37352f',          // 主要文字
    blue: '#2383e2',            // 主操作色
    blueLight: '#e8f2ff',       // 藍色淺背景
    blueDark: '#1a6bb8',        // 深藍色
    // 互動狀態色彩
    hoverBackground: 'rgba(55, 53, 47, 0.04)',
    selectedBackground: 'rgba(35, 131, 226, 0.08)',
    focusShadow: 'rgba(35, 131, 226, 0.3)',
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    sizes: {
      small: '12px',
      body: '14px', 
      header: '13px',           // 表頭專用字體大小
      title: '16px',
    },
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
    },
    lineHeights: {
      tight: 1.3,               // 表格專用行高
      normal: 1.4,              // 一般內容行高
      relaxed: 1.5,             // 寬鬆行高
    },
  },
  spacing: {
    xs: '2px',
    sm: '4px', 
    md: '6px',                  // 縮小中等間距
    lg: '12px',
    xl: '16px',
    '2xl': '24px',
    '3xl': '32px',
    // 表格專用間距
    cellPadding: '6px 12px',    // 單元格內邊距
    cellHeight: '32px',         // 標準行高
    headerHeight: '32px',       // 表頭高度
  },
  borders: {
    width: '1px',
    style: 'solid',
    radius: '3px',
    radiusLarge: '6px',
  },
  shadows: {
    subtle: '0 1px 3px rgba(0, 0, 0, 0.02)',
    focus: '0 0 0 1px #2383e2, 0 2px 4px rgba(0, 0, 0, 0.04)',
    hover: '0 2px 8px rgba(0, 0, 0, 0.06)',
  },
  transitions: {
    fast: '0.1s ease',
    normal: '0.15s ease-out',
    slow: '0.2s ease-out',
  },
};