/**
 * Notion 官方顏色和樣式定義
 * 基於 react-notion-x 和官方文檔
 */

export const NotionColors = {
  // 文字顏色
  default: '#37352f',      // 主要文字
  gray: '#787774',         // 次要文字
  lightGray: '#b4b4b3',    // 輔助文字
  
  // 背景顏色
  bgDefault: '#ffffff',    // 預設背景
  bgGray: '#f7f6f3',       // 灰色背景
  bgLight: '#fbfbfa',      // 淺色背景
  
  // 邊框顏色
  border: '#e9e9e7',       // 一般邊框
  borderLight: '#eeeeec',  // 淺色邊框
  
  // 強調色
  blue: '#0070f3',         // 主要操作
  blueHover: '#0051cc',    // 藍色 hover
  blueLight: '#e3f1ff',    // 藍色背景
  
  // Notion 官方顏色
  brown: '#9f6b53',
  orange: '#d9730d',
  yellow: '#dfab01',
  green: '#0f7b6c',
  purple: '#6940a5',
  pink: '#ad1a72',
  red: '#e03e3e',
  
  // 背景色版本
  brownBg: '#f4eeee',
  orangeBg: '#fbecdd',
  yellowBg: '#fbf3db',
  greenBg: '#ddedea',
  blueBg: '#ddebf1',
  purpleBg: '#eae4f2',
  pinkBg: '#f4dfeb',
  redBg: '#fbe4e4',
  grayBg: '#ebeced' };

export const NotionFonts = {
  // 字體家族
  family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol"',
  monoFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace',
  
  // 字體大小
  sizeBody: '14px',
  sizeSmall: '12px',
  sizeLarge: '16px',
  sizeHeader: '40px',
  
  // 字體粗細
  weightNormal: 400,
  weightMedium: 500,
  weightSemibold: 600,
  weightBold: 700,
  
  // 行高
  lineHeightBody: 1.5,
  lineHeightHeader: 1.2 };

export const NotionSpacing = {
  // 間距
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  xxl: '32px',
  
  // 頁面邊距
  pageMargin: '96px',
  pagePadding: '60px',
  
  // 表格間距
  cellPaddingH: '8px',
  cellPaddingV: '5px',
  headerHeight: '36px',
  rowHeight: '36px' };

export const NotionStyles = {
  // 圓角
  borderRadius: '4px',
  
  // 陰影
  shadowSmall: '0 1px 2px rgba(0, 0, 0, 0.05)',
  shadowMedium: '0 1px 3px rgba(0, 0, 0, 0.05)',
  shadowLarge: '0 2px 8px rgba(0, 0, 0, 0.1)',
  
  // 過渡
  transition: 'all 0.1s ease',
  
  // 表格樣式
  table: {
    borderCollapse: 'collapse',
    width: '100%',
    fontSize: NotionFonts.sizeBody,
    color: NotionColors.default },
  
  tableHeader: {
    backgroundColor: NotionColors.bgDefault,
    borderBottom: `1px solid ${NotionColors.border}`,
    height: NotionSpacing.headerHeight,
    fontSize: NotionFonts.sizeBody,
    fontWeight: NotionFonts.weightMedium,
    color: NotionColors.gray },
  
  tableCell: {
    padding: `${NotionSpacing.cellPaddingV} ${NotionSpacing.cellPaddingH}`,
    borderRight: `1px solid ${NotionColors.border}`,
    borderBottom: `1px solid ${NotionColors.border}`,
    height: NotionSpacing.rowHeight,
    fontSize: NotionFonts.sizeBody,
    color: NotionColors.default },
  
  tableCellHover: {
    backgroundColor: NotionColors.bgGray } };