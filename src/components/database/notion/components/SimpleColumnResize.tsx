/**
 * 簡單的欄位寬度調整實作
 * 參考 TanStack Table 的設計理念
 */

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { Platform } from 'react-native';

interface SimpleColumnResizeProps {
  tableId: string;
  onWidthsChange: (widths: Record<string, number>) => void;
}

export const SimpleColumnResize: React.FC<SimpleColumnResizeProps> = ({
  tableId,
  onWidthsChange
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const resizeDataRef = useRef<{
    columnId: string;
    startX: number;
    startWidth: number;
    currentWidth: number;
  } | null>(null);

  // 處理開始調整
  const handleMouseDown = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.classList.contains('notion-column-resizer')) return;
    
    e.preventDefault();
    
    const columnId = target.getAttribute('data-column-id');
    if (!columnId) return;
    
    // 找到對應的 th 元素
    const th = target.parentElement as HTMLElement;
    if (!th || th.tagName !== 'TH') return;
    
    // 獲取當前寬度
    const currentWidth = th.offsetWidth;
    
    // 記錄調整資訊
    resizeDataRef.current = {
      columnId,
      startX: e.clientX,
      startWidth: currentWidth,
      currentWidth: currentWidth
    };
    
    setIsResizing(true);
    
    // 設定 CSS 變數來即時更新寬度
    document.documentElement.style.setProperty(
      `--col-${columnId}-width`,
      `${currentWidth}px`
    );
    
    // 添加視覺反饋
    document.body.style.cursor = 'col-resize';
    target.classList.add('resizing');
  }, []);

  // 處理拖動
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !resizeDataRef.current) return;
    
    const { columnId, startX, startWidth } = resizeDataRef.current;
    const diff = e.clientX - startX;
    const newWidth = Math.max(50, Math.min(500, startWidth + diff));
    
    // 更新 CSS 變數
    document.documentElement.style.setProperty(
      `--col-${columnId}-width`,
      `${newWidth}px`
    );
    
    resizeDataRef.current.currentWidth = newWidth;
  }, [isResizing]);

  // 處理結束調整
  const handleMouseUp = useCallback(() => {
    if (!isResizing || !resizeDataRef.current) return;
    
    const { columnId, currentWidth } = resizeDataRef.current;
    
    // 收集所有欄位寬度
    const table = document.querySelector(`#${tableId}`) as HTMLTableElement;
    if (table) {
      const widths: Record<string, number> = {};
      const ths = table.querySelectorAll('th[data-column-id]');
      
      ths.forEach((th) => {
        const id = th.getAttribute('data-column-id');
        if (id) {
          if (id === columnId) {
            widths[id] = currentWidth;
          } else {
            // 使用 CSS 變數或實際寬度
            const varWidth = getComputedStyle(document.documentElement)
              .getPropertyValue(`--col-${id}-width`);
            widths[id] = varWidth ? parseInt(varWidth) : (th as HTMLElement).offsetWidth;
          }
        }
      });
      
      // 延遲通知，確保 DOM 更新完成
      setTimeout(() => {
        onWidthsChange(widths);
      }, 0);
    }
    
    // 清理
    const resizer = document.querySelector('.notion-column-resizer.resizing');
    if (resizer) {
      resizer.classList.remove('resizing');
    }
    
    document.body.style.cursor = '';
    setIsResizing(false);
    resizeDataRef.current = null;
  }, [isResizing, tableId, onWidthsChange]);

  // 設置事件監聽
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp]);

  // 初始化 CSS 變數
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    
    const table = document.querySelector(`#${tableId}`) as HTMLTableElement;
    if (!table) return;
    
    const ths = table.querySelectorAll('th[data-column-id]');
    ths.forEach((th) => {
      const columnId = th.getAttribute('data-column-id');
      if (columnId) {
        const width = (th as HTMLElement).offsetWidth;
        document.documentElement.style.setProperty(
          `--col-${columnId}-width`,
          `${width}px`
        );
      }
    });
  }, [tableId]);

  if (Platform.OS !== 'web') return null;
  
  // 添加必要的樣式
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      /* 使用 CSS 變數控制欄位寬度 */
      .notion-database-table th[data-column-id] {
        width: var(--col-width);
      }
      
      .notion-database-table td {
        width: var(--col-width);
      }
      
      /* 確保表格佈局固定 */
      .notion-database-table {
        table-layout: fixed !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return null;
};