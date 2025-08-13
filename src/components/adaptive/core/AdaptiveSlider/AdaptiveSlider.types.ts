/**
 * AdaptiveSlider 類型定義
 */

export interface AdaptiveSliderProps {
  // 核心屬性
  value?: number;
  onValueChange?: (value: number) => void;
  onSlidingStart?: () => void;
  onSlidingComplete?: (value: number) => void;
  
  // 範圍設定
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
  
  // 樣式
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  thumbTintColor?: string;
  
  // 顯示設定
  showValue?: boolean;
  valuePrefix?: string;
  valueSuffix?: string;
  
  // 狀態
  disabled?: boolean;
  
  // 無障礙
  accessibilityLabel?: string;
  testID?: string;
}

// 預設顏色
export const DEFAULT_COLORS = {
  minimumTrack: '#FE7821', // 橘色主題
  maximumTrack: '#E3E1DC',
  thumb: '#FFFFFF',
  thumbBorder: '#FE7821',
  disabled: '#CCCCCC',
  value: '#1A1A1A',
};