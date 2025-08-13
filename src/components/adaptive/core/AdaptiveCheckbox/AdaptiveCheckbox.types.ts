/**
 * AdaptiveCheckbox 類型定義
 */

export interface AdaptiveCheckboxProps {
  // 核心屬性
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  disabled?: boolean;
  
  // 樣式
  color?: string;
  size?: 'small' | 'medium' | 'large';
  
  // 標籤
  label?: string;
  labelPosition?: 'left' | 'right';
  
  // 狀態
  indeterminate?: boolean;
  
  // 無障礙
  accessibilityLabel?: string;
  testID?: string;
}

// 預設顏色
export const DEFAULT_COLORS = {
  checked: '#FE7821', // 橘色主題
  unchecked: '#E3E1DC',
  disabled: '#999999',
  label: '#1A1A1A'
};