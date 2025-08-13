/**
 * AdaptiveDatePicker 類型定義
 */

export interface AdaptiveDatePickerProps {
  // 核心屬性
  value?: Date | null;
  onDateChange?: (date: Date | null) => void;
  
  // 日期設定
  mode?: 'date' | 'time' | 'datetime';
  minimumDate?: Date;
  maximumDate?: Date;
  
  // 顯示設定
  placeholder?: string;
  format?: string;
  locale?: string;
  
  // 狀態
  disabled?: boolean;
  
  // 樣式
  variant?: 'filled' | 'outlined';
  
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
  primary: '#FE7821',
  disabled: '#CCCCCC',
};

// 日期格式化
export const formatDate = (date: Date | null, format: string = 'YYYY-MM-DD'): string => {
  if (!date) return '';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes);
};