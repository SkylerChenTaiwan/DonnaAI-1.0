/**
 * 顏色處理工具函數
 * 用於處理顏色透明度，解決 React Native Web 的兼容性問題
 */

/**
 * 將十六進位顏色轉換為帶透明度的 RGBA 格式
 * 避免使用字串連接（如 color + '20'）造成的 Web 平台錯誤
 * 
 * @param hex - 十六進位顏色值（如 '#FF0000'）
 * @param alpha - 透明度（0-1 之間的數值，或 0-255 的整數）
 * @returns RGBA 格式的顏色字串
 */
export function hexToRgba(hex: string, alpha: number | string): string {
  // 處理透明度參數
  let opacity: number;
  
  if (typeof alpha === 'string') {
    // 如果是十六進位字串（如 '20', 'CC'）
    const hexAlpha = parseInt(alpha, 16);
    opacity = hexAlpha / 255;
  } else if (alpha > 1) {
    // 如果是 0-255 的整數
    opacity = alpha / 255;
  } else {
    // 如果是 0-1 的小數
    opacity = alpha;
  }
  
  // 移除 # 符號
  const cleanHex = hex.replace('#', '');
  
  // 解析 RGB 值
  let r: number, g: number, b: number;
  
  if (cleanHex.length === 3) {
    // 短格式（如 'F00'）
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else if (cleanHex.length === 6) {
    // 完整格式（如 'FF0000'）
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  } else {
    // 無效格式，返回原值
    console.warn(`Invalid hex color: ${hex}`);
    return hex;
  }
  
  return `rgba(${r}, ${g}, ${b}, ${opacity.toFixed(2)})`;
}

/**
 * 為顏色添加透明度
 * 自動檢測顏色格式並處理
 * 
 * @param color - 顏色值（十六進位或 RGB/RGBA）
 * @param alpha - 透明度值
 * @returns 帶透明度的顏色字串
 */
export function withAlpha(color: string, alpha: number | string): string {
  if (!color) return color;
  
  // 如果是十六進位顏色
  if (color.startsWith('#')) {
    return hexToRgba(color, alpha);
  }
  
  // 如果已經是 rgba 格式，替換透明度
  if (color.startsWith('rgba')) {
    const rgbaMatch = color.match(/rgba\(([^,]+),([^,]+),([^,]+),([^)]+)\)/);
    if (rgbaMatch) {
      const [, r, g, b] = rgbaMatch;
      let opacity: number;
      
      if (typeof alpha === 'string') {
        opacity = parseInt(alpha, 16) / 255;
      } else if (alpha > 1) {
        opacity = alpha / 255;
      } else {
        opacity = alpha;
      }
      
      return `rgba(${r},${g},${b}, ${opacity.toFixed(2)})`;
    }
  }
  
  // 如果是 rgb 格式，轉換為 rgba
  if (color.startsWith('rgb')) {
    const rgbMatch = color.match(/rgb\(([^,]+),([^,]+),([^)]+)\)/);
    if (rgbMatch) {
      const [, r, g, b] = rgbMatch;
      let opacity: number;
      
      if (typeof alpha === 'string') {
        opacity = parseInt(alpha, 16) / 255;
      } else if (alpha > 1) {
        opacity = alpha / 255;
      } else {
        opacity = alpha;
      }
      
      return `rgba(${r},${g},${b}, ${opacity.toFixed(2)})`;
    }
  }
  
  // 無法處理的格式，返回原值
  console.warn(`Unable to process color with alpha: ${color}`);
  return color;
}