/**
 * WCAG 對比度計算工具
 * 用於檢查文字和背景顏色是否符合 WCAG AA 標準
 */

// 將 RGB 值轉換為相對亮度
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// 將 hex 顏色轉換為 RGB
function hexToRgb(hex: string): [number, number, number] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : null;
}

// 將 RGB 字串解析為數值陣列
function parseRgbString(rgb: string): [number, number, number] | null {
  const match = rgb.match(/\d+/g);
  if (match && match.length >= 3) {
    return [
      parseInt(match[0]),
      parseInt(match[1]),
      parseInt(match[2])
    ];
  }
  return null;
}

// 計算兩個顏色之間的對比度
export function calculateContrast(color1: string, color2: string): number {
  let rgb1: [number, number, number] | null = null;
  let rgb2: [number, number, number] | null = null;

  // 處理不同格式的顏色輸入
  if (color1.startsWith('#')) {
    rgb1 = hexToRgb(color1);
  } else if (color1.includes('rgb')) {
    rgb1 = parseRgbString(color1);
  }

  if (color2.startsWith('#')) {
    rgb2 = hexToRgb(color2);
  } else if (color2.includes('rgb')) {
    rgb2 = parseRgbString(color2);
  }

  if (!rgb1 || !rgb2) {
    throw new Error('無法解析顏色值');
  }

  const l1 = getLuminance(...rgb1);
  const l2 = getLuminance(...rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

// 檢查是否符合 WCAG AA 標準（4.5:1 正常文字，3:1 大文字）
export function meetsWCAGAA(
  foreground: string, 
  background: string, 
  isLargeText: boolean = false
): boolean {
  const contrast = calculateContrast(foreground, background);
  const minRatio = isLargeText ? 3 : 4.5;
  return contrast >= minRatio;
}

// 檢查是否符合 WCAG AAA 標準（7:1 正常文字，4.5:1 大文字）
export function meetsWCAGAAA(
  foreground: string, 
  background: string, 
  isLargeText: boolean = false
): boolean {
  const contrast = calculateContrast(foreground, background);
  const minRatio = isLargeText ? 4.5 : 7;
  return contrast >= minRatio;
}

// 建議符合對比度的替代顏色
export function suggestColor(
  original: string, 
  background: string, 
  targetRatio: number = 4.5
): string {
  const currentRatio = calculateContrast(original, background);
  
  if (currentRatio >= targetRatio) {
    return original; // 已經符合要求
  }

  // 將原始顏色轉換為 RGB
  let rgb: [number, number, number] | null = null;
  if (original.startsWith('#')) {
    rgb = hexToRgb(original);
  } else if (original.includes('rgb')) {
    rgb = parseRgbString(original);
  }

  if (!rgb) {
    return original;
  }

  // 判斷是否需要變深或變淺
  const bgLuminance = calculateContrast(background, '#000000');
  const shouldDarken = bgLuminance > 5; // 背景是淺色

  // 逐步調整顏色直到符合對比度要求
  let adjustedRgb = [...rgb];
  let step = shouldDarken ? -10 : 10;
  
  while (true) {
    adjustedRgb = adjustedRgb.map(c => {
      const newValue = c + step;
      return Math.max(0, Math.min(255, newValue));
    }) as [number, number, number];

    const adjustedColor = `rgb(${adjustedRgb[0]}, ${adjustedRgb[1]}, ${adjustedRgb[2]})`;
    const newRatio = calculateContrast(adjustedColor, background);

    if (newRatio >= targetRatio) {
      return `#${adjustedRgb.map(c => c.toString(16).padStart(2, '0')).join('')}`;
    }

    // 如果已經到達極限，返回黑色或白色
    if ((shouldDarken && adjustedRgb.every(c => c === 0)) ||
        (!shouldDarken && adjustedRgb.every(c => c === 255))) {
      return shouldDarken ? '#000000' : '#FFFFFF';
    }
  }
}

// 批量檢查顏色組合的對比度
export interface ContrastCheck {
  foreground: string;
  background: string;
  label: string;
  isLargeText?: boolean;
}

export interface ContrastResult {
  label: string;
  foreground: string;
  background: string;
  ratio: number;
  meetsAA: boolean;
  meetsAAA: boolean;
  suggestion?: string;
}

export function checkColorPairs(pairs: ContrastCheck[]): ContrastResult[] {
  return pairs.map(pair => {
    const ratio = calculateContrast(pair.foreground, pair.background);
    const meetsAA = meetsWCAGAA(pair.foreground, pair.background, pair.isLargeText);
    const meetsAAA = meetsWCAGAAA(pair.foreground, pair.background, pair.isLargeText);
    
    const result: ContrastResult = {
      label: pair.label,
      foreground: pair.foreground,
      background: pair.background,
      ratio: Math.round(ratio * 100) / 100,
      meetsAA,
      meetsAAA
    };

    // 如果不符合 AA 標準，提供建議
    if (!meetsAA) {
      result.suggestion = suggestColor(pair.foreground, pair.background);
    }

    return result;
  });
}