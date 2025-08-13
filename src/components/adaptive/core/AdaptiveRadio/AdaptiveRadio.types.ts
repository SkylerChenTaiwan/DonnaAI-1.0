/**
 * AdaptiveRadio 類型定義
 */

export interface AdaptiveRadioProps {
  // 核心屬性
  value?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  
  // 樣式
  color?: string;
  size?: 'small' | 'medium' | 'large';
  
  // 標籤
  label?: string;
  labelPosition?: 'left' | 'right';
  
  // 群組（用於 RadioGroup）
  groupValue?: string;
  itemValue?: string;
  
  // 無障礙
  accessibilityLabel?: string;
  testID?: string;
}

export interface AdaptiveRadioGroupProps {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  options: Array<{
    value: string;
    label: string;
    disabled?: boolean;
  }>;
  direction?: 'horizontal' | 'vertical';
  color?: string;
  size?: 'small' | 'medium' | 'large';
}

// 預設顏色
export const DEFAULT_COLORS = {
  selected: '#FE7821', // 橘色主題
  unselected: '#E3E1DC',
  disabled: '#999999',
  label: '#1A1A1A'
};