/**
 * Web 平台專用樣式覆寫
 * 提供更高對比度的顏色以符合 WCAG AA 標準
 */

import { Platform } from 'react-native';

// Web 平台的顏色調整
export const webColorOverrides = {
  // 文字色 - 加深以提高對比度
  text: {
    primary: '#2C2C2C',      // 純黑，從 #1A1A1A 加深
    secondary: '#4A4A4A',    // 深灰，從 #666666 加深
    tertiary: '#666666',     // 中灰，從 #999999 加深
    disabled: '#999999',     // 淺灰，從 #CCCCCC 加深
    inverse: '#FFFFFF',      // 保持純白
  },
  
  // 背景色 - 提高對比
  background: {
    primary: '#2C2C2C',      // 純白背景
    surface: '#FFFFFF',      // 純白卡片
    elevated: '#FFFFFF',     // 純白提升背景
    input: '#F8F8F8',        // 更淺的輸入框背景，從 #FAFAFA 調整
  },
  
  // 邊框色 - 加深以更明顯
  border: {
    light: '#D1D5DB',        // 加深，從 #E5E7EB
    default: '#B5B5B5',      // 加深，從 #D1D5DB
    medium: '#999999',       // 加深，從 #B5B5B5
    dark: '#666666',         // 加深，從 #9CA3AF
  },
  
  // 按鈕專用色彩 - 確保足夠對比
  button: {
    primary: { default: '#2C2C2C',    // 加深主按鈕，從 #2C2C2C
      hover: '#000000',      // 懸停時純黑
      pressed: '#333333',    // 按下時深灰
      text: '#FFFFFF',       // 按鈕文字純白
    },
    secondary: {
      default: '#F0F0F0',    // 次要按鈕背景
      hover: '#E0E0E0',      // 懸停時稍深
      pressed: '#D0D0D0',    // 按下時更深
      text: '#000000',       // 按鈕文字純黑
    },
    outline: {
      border: '#999999',     // 邊框加深
      borderHover: '#666666', // 懸停時邊框
      background: 'transparent',
      backgroundHover: 'rgba(0, 0, 0, 0.05)',
      text: '#000000',       // 文字純黑
    } },
  
  // 狀態色 - 確保在白色背景上有足夠對比
  status: {
    success: '#2E7D32',      // 深綠，從 #34C759 加深
    warning: '#ED6C02',      // 深橙，從 #FF9500 加深
    error: '#D32F2F',        // 深紅，從 #FF3B30 加深
    info: '#0288D1',         // 深藍，從 #5856D6 調整
  } };

// 根據平台返回適當的顏色
export function getAdaptiveColor(nativeColor: string, webColor: string): string {
  return Platform.OS === 'web' ? webColor : nativeColor;
}

// Web 平台專用樣式調整
export const webStyleOverrides = {
  // 輸入框樣式
  input: {
    padding: '12px 16px',
    border: `1px solid ${webColorOverrides.border.default}`,
    borderRadius: '8px',
    fontSize: '14px',
    lineHeight: '20px',
    backgroundColor: webColorOverrides.background.input,
    color: webColorOverrides.text.primary,
    outline: 'none',
    boxSizing: 'border-box' as const,
    fontFamily: 'inherit',
    '&:focus': {
      borderColor: webColorOverrides.button.primary.default,
      boxShadow: `0 0 0 2px ${webColorOverrides.button.primary.default}20` },
    '&::placeholder': {
      color: webColorOverrides.text.tertiary } },
  
  // 下拉選單樣式
  select: {
    width: '100%',
    padding: '12px 16px',
    paddingRight: '40px', // 為下拉箭頭留空間
    border: `1px solid ${webColorOverrides.border.default}`,
    borderRadius: '8px',
    fontSize: '14px',
    lineHeight: '20px',
    backgroundColor: webColorOverrides.background.input,
    color: webColorOverrides.text.primary,
    cursor: 'pointer',
    outline: 'none',
    appearance: 'none' as const,
    WebkitAppearance: 'none' as const,
    MozAppearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    backgroundSize: '20px',
    '&:focus': {
      borderColor: webColorOverrides.button.primary.default,
      boxShadow: `0 0 0 2px ${webColorOverrides.button.primary.default}20` },
    '&:disabled': {
      backgroundColor: webColorOverrides.background.primary,
      color: webColorOverrides.text.disabled,
      cursor: 'not-allowed' } },
  
  // 按鈕樣式
  button: {
    primary: {
      padding: '12px 20px',
      backgroundColor: webColorOverrides.button.primary.default,
      color: webColorOverrides.button.primary.text,
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      outline: 'none',
      transition: 'all 0.2s ease',
      '&:hover': {
        backgroundColor: webColorOverrides.button.primary.hover },
      '&:active': {
        backgroundColor: webColorOverrides.button.primary.pressed },
      '&:disabled': {
        backgroundColor: webColorOverrides.text.disabled,
        cursor: 'not-allowed' } },
    secondary: {
      padding: '12px 20px',
      backgroundColor: webColorOverrides.button.secondary.default,
      color: webColorOverrides.button.secondary.text,
      border: `1px solid ${webColorOverrides.border.default}`,
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      outline: 'none',
      transition: 'all 0.2s ease',
      '&:hover': {
        backgroundColor: webColorOverrides.button.secondary.hover },
      '&:active': {
        backgroundColor: webColorOverrides.button.secondary.pressed } } },
  
  // 卡片樣式
  card: {
    backgroundColor: webColorOverrides.background.surface,
    border: `1px solid ${webColorOverrides.border.light}`,
    borderRadius: '12px',
    padding: '16px',
    '&:hover': {
      borderColor: webColorOverrides.border.default,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' } } };