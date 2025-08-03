/**
 * 表格寬度調整管理器
 * 集中管理所有欄位的寬度調整邏輯
 */

import React, { useRef, useCallback, useEffect } from 'react';

interface TableResizeManagerProps {
  tableRef: React.RefObject<HTMLTableElement>;
  onResizeComplete?: (columnWidths: Record<string, number>) => void;
}

export const TableResizeManager: React.FC<TableResizeManagerProps> = ({
  tableRef,
  onResizeComplete
}) => {
  const resizingRef = useRef<{
    columnId: string;
    startX: number;
    startWidth: number;
    th: HTMLElement;
  } | null>(null);

  // 初始化表格寬度
  const initializeTableWidths = useCallback(() => {
    if (!tableRef.current) return;
    
    const table = tableRef.current;
    const ths = table.querySelectorAll('th');
    
    // 固定表格總寬度
    const tableWidth = table.offsetWidth;
    table.style.width = `${tableWidth}px`;
    table.style.tableLayout = 'fixed';
    
    // 固定每個欄位的寬度
    ths.forEach((th) => {
      if (!th.style.width) {
        const width = th.offsetWidth;
        th.style.width = `${width}px`;
      }
    });
  }, [tableRef]);

  // 處理開始調整
  const handleMouseDown = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.classList.contains('notion-column-resizer')) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // 找到對應的 th
    let th = target.parentElement;
    while (th && th.tagName !== 'TH') {
      th = th.parentElement;
    }
    if (!th) return;
    
    const columnId = th.getAttribute('data-column-id');
    if (!columnId) return;
    
    // 初始化所有欄位寬度
    initializeTableWidths();
    
    // 記錄調整資訊
    resizingRef.current = {
      columnId,
      startX: e.clientX,
      startWidth: th.offsetWidth,
      th
    };
    
    // 添加視覺反饋
    document.body.style.cursor = 'col-resize';
    document.body.classList.add('resizing-column');
    target.classList.add('resizing');
  }, [initializeTableWidths]);

  // 處理拖動
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizingRef.current) return;
    
    const { startX, startWidth, th } = resizingRef.current;
    const diff = e.clientX - startX;
    const newWidth = Math.max(50, Math.min(500, startWidth + diff));
    
    // 直接更新 DOM，不觸發 React 重新渲染
    th.style.width = `${newWidth}px`;
  }, []);

  // 處理結束調整
  const handleMouseUp = useCallback(() => {
    if (!resizingRef.current) return;
    
    // 收集所有欄位的最終寬度
    if (onResizeComplete && tableRef.current) {
      const columnWidths: Record<string, number> = {};
      const ths = tableRef.current.querySelectorAll('th[data-column-id]');
      
      ths.forEach((th) => {
        const columnId = th.getAttribute('data-column-id');
        if (columnId) {
          columnWidths[columnId] = th.clientWidth;
        }
      });
      
      // 延遲通知，避免立即觸發重新渲染
      setTimeout(() => {
        onResizeComplete(columnWidths);
      }, 100);
    }
    
    // 清理
    const resizer = document.querySelector('.notion-column-resizer.resizing');
    if (resizer) {
      resizer.classList.remove('resizing');
    }
    
    document.body.style.cursor = '';
    document.body.classList.remove('resizing-column');
    resizingRef.current = null;
  }, [onResizeComplete, tableRef]);

  // 設置事件監聽
  useEffect(() => {
    // 使用事件委託，避免為每個 resizer 單獨綁定事件
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp]);

  return null; // 這是一個純邏輯組件
};