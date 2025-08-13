/**
 * AdaptiveSearchBar 類型定義
 */

export interface AdaptiveSearchBarProps {
  // 核心屬性
  value?: string;
  onChangeText?: (text: string) => void;
  onSearch?: (text: string) => void;
  onClear?: () => void;
  
  // 搜尋設定
  placeholder?: string;
  autoFocus?: boolean;
  returnKeyType?: 'search' | 'done' | 'go' | 'next' | 'send';
  
  // 樣式
  showIcon?: boolean;
  showClearButton?: boolean;
  variant?: 'filled' | 'outlined';
  
  // 狀態
  disabled?: boolean;
  loading?: boolean;
  
  // 無障礙
  accessibilityLabel?: string;
  testID?: string;
}

// 預設顏色
export const DEFAULT_COLORS = {
  background: '#F5F5F5',
  border: '#E3E1DC',
  text: '#1A1A1A',
  placeholder: '#999999',
  icon: '#666666',
  focus: '#FE7821',
};