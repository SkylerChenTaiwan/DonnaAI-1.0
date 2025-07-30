/**
 * 動畫配置工具
 * 處理跨平台動畫配置差異
 */

import { Platform } from 'react-native';

/**
 * 根據平台返回是否使用原生動畫驅動
 * Web 平台不支援 useNativeDriver，會導致警告
 */
export const getUseNativeDriver = (): boolean => {
  return Platform.OS !== 'web';
};

/**
 * 獲取動畫配置，自動處理平台差異
 * @param config 動畫配置物件
 * @returns 包含正確 useNativeDriver 設定的配置
 */
export const getAnimationConfig = <T extends { useNativeDriver?: boolean }>(
  config: T
): T => {
  return {
    ...config,
    useNativeDriver: getUseNativeDriver()
  };
};

/**
 * 預設的 timing 動畫配置
 */
export const defaultTimingConfig = {
  duration: 300,
  useNativeDriver: getUseNativeDriver()
};

/**
 * 預設的 spring 動畫配置
 */
export const defaultSpringConfig = {
  tension: 50,
  friction: 7,
  useNativeDriver: getUseNativeDriver()
};