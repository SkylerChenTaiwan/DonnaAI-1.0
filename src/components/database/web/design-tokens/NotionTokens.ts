export const NotionTokens = {
  colors: {
    // 精確的 Notion 色彩系統 V4
    background: '#fbfbfa',        // 主背景色
    surface: '#ffffff',           // 表格背景
    gray05: '#f7f6f3',           // 最淺灰
    gray10: '#f1f1ef',           // 行 hover 背景
    gray15: '#eeeeec',           // 淺分隔線
    gray20: '#e9e9e7',           // 主分隔線
    gray30: '#d3d3d1',           // 邊框色
    gray40: '#b8b8b6',           // 次要邊框
    gray50: '#9b9a97',           // 佔位符文字
    gray60: '#787774',           // 次要文字
    gray70: '#64625f',           // 圖標色
    gray80: '#37352f',           // 主要文字
    blue: '#2383e2',             // 主要操作色
    blueLight: '#e8f4fd',        // 選中背景
    blueDark: '#1a6bb8',         // 深藍 hover
    // 狀態色彩
    green: '#448361',            // 完成狀態
    greenBg: '#d4e9d7',          // 完成背景
    blueAlt: '#337ea9',          // 進行中狀態
    blueBg: '#d8e7f5',           // 進行中背景
    orange: '#9f6b53',           // 待辦狀態
    orangeBg: '#fcebdb',         // 待辦背景
    // 互動狀態
    hoverBg: 'rgba(55, 53, 47, 0.03)',
    selectedBg: 'rgba(35, 131, 226, 0.06)',
    focusShadow: '0 0 0 1px #2383e2, 0 0 0 3px #e8f4fd',
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    sizes: {
      small: '12px',
      body: '13px',              // 縮小主要字體
      header: '12px',            // 表頭更小
      title: '16px',
    },
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
    },
    lineHeights: {
      tight: 1.2,                // 更緊湊的行高
      normal: 1.3,               
      relaxed: 1.4,             
    },
  },
  spacing: {
    xs: '2px',
    sm: '4px', 
    md: '8px',                   // 標準間距
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '60px',              // 外層留白
    // 表格專用
    cellPaddingY: '6px',         // 單元格垂直內距
    cellPaddingX: '8px',         // 單元格水平內距
    cellHeight: '33px',          // 標準行高
    headerHeight: '36px',        // 表頭高度
    wrapperPadding: '20px 60px', // 外層容器留白
  },
  borders: {
    width: '1px',
    style: 'solid',
    radius: '3px',
    radiusLarge: '6px',
  },
  shadows: {
    subtle: '0 1px 2px rgba(0, 0, 0, 0.04)',
    focus: '0 0 0 1px #2383e2, 0 0 0 3px #e8f4fd',
    hover: '0 1px 2px rgba(0, 0, 0, 0.08)',
    button: '0 1px 2px rgba(0, 0, 0, 0.05)',
  },
  transitions: {
    fast: '0.1s ease',
    normal: '0.12s ease',
    slow: '0.15s ease-out',
  },
  layout: {
    tableLayout: 'auto',         // 彈性欄寬
    minColumnWidth: '50px',      // 最小欄寬
    defaultColumnWidths: {
      checkbox: '40px',
      title: '200px',
      status: '120px',
      date: '140px',
      tags: '160px',
    },
  },
};