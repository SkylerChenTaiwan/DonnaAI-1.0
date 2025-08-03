/**
 * 計算面板位置的工具函數
 * 確保面板不會超出視窗範圍
 */

export interface PanelDimensions {
  width: number;
  height: number;
}

export function calculatePanelPosition(
  anchorEl: HTMLElement | null,
  dimensions: PanelDimensions
): React.CSSProperties {
  if (!anchorEl) {
    return { top: 100, left: 100 };
  }

  const rect = anchorEl.getBoundingClientRect();
  const { width: panelWidth, height: panelHeight } = dimensions;
  const padding = 16; // 與視窗邊緣的間距
  const gap = 8; // 與按鈕的間距

  // 初始位置：按鈕下方左對齊
  let top = rect.bottom + gap;
  let left = rect.left;

  // 檢查是否會超出視窗底部
  if (top + panelHeight > window.innerHeight - padding) {
    // 嘗試顯示在按鈕上方
    const topAbove = rect.top - panelHeight - gap;
    
    if (topAbove >= padding) {
      // 上方有足夠空間
      top = topAbove;
    } else {
      // 上下都不夠，固定在視窗內並允許滾動
      top = Math.min(
        rect.bottom + gap,
        window.innerHeight - panelHeight - padding
      );
      top = Math.max(padding, top);
    }
  }

  // 檢查是否會超出視窗右側
  if (left + panelWidth > window.innerWidth - padding) {
    // 嘗試向左對齊按鈕右側
    const leftAlignRight = rect.right - panelWidth;
    
    if (leftAlignRight >= padding) {
      // 左對齊按鈕右側
      left = leftAlignRight;
    } else {
      // 固定在視窗右側
      left = window.innerWidth - panelWidth - padding;
    }
  }

  // 確保不會超出視窗左側
  if (left < padding) {
    left = padding;
  }

  return {
    position: 'fixed',
    top: `${top}px`,
    left: `${left}px`,
    width: `${panelWidth}px`,
    maxHeight: `${Math.min(panelHeight, window.innerHeight - top - padding)}px`,
    zIndex: 1000
  };
}

// 預設的面板尺寸
export const PANEL_DIMENSIONS = {
  filter: { width: 480, height: 400 },
  sort: { width: 320, height: 350 },
  group: { width: 280, height: 300 },
  search: { width: 320, height: 400 },
  columnManager: { width: 320, height: 480 }
};