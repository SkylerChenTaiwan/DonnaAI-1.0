/**
 * AdaptiveSwitch 類型定義
 * 定義跨平台開關元件的統一介面
 */

export interface AdaptiveSwitchProps {
  /**
   * 開關的當前值
   */
  value?: boolean;
  
  /**
   * 值變更時的回調函數
   */
  onValueChange?: (value: boolean) => void;
  
  /**
   * 是否禁用
   */
  disabled?: boolean;
  
  /**
   * 軌道顏色配置
   */
  trackColor?: {
    false?: string;
    true?: string;
  };
  
  /**
   * 滑塊顏色（iOS）
   */
  thumbColor?: string;
  
  /**
   * iOS 的邊框顏色（關閉時）
   */
  ios_backgroundColor?: string;
  
  /**
   * 標籤文字
   */
  label?: string;
  
  /**
   * 標籤位置
   */
  labelPosition?: 'left' | 'right';
  
  /**
   * Web 特定屬性
   */
  name?: string;
  id?: string;
  className?: string;
  
  /**
   * 無障礙屬性
   */
  accessibilityLabel?: string;
  accessibilityRole?: 'switch';
  accessibilityState?: {
    checked?: boolean;
    disabled?: boolean;
  };
  
  /**
   * 測試 ID
   */
  testID?: string;
  
  /**
   * 自定義樣式（僅用於容器）
   */
  style?: any;
}

/**
 * 預設顏色配置
 */
export const DEFAULT_COLORS = {
  trackColor: {
    false: '#E3E1DC',
    true: '#007AFF', // 改為 iOS 標準藍色，更明顯
  },
  thumbColor: '#FFFFFF',
  disabledThumbColor: '#F4F4F4',
  disabledTrackColor: '#D3D3D3',
};