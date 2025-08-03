/**
 * Notion 資料庫欄位寬度調整器
 */

import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Platform } from 'react-native';

export interface ColumnResizerProps {
  columnId: string;
  onResize: (columnId: string, width: number) => void;
  minWidth?: number;
  maxWidth?: number;
}

export const ColumnResizer: React.FC<ColumnResizerProps> = ({
  columnId,
  onResize,
  minWidth = 50,
  maxWidth = 500
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  const [currentWidth, setCurrentWidth] = useState(0);
  const resizerRef = useRef<HTMLDivElement>(null);
  const thRef = useRef<HTMLElement | null>(null);
  
  // 處理開始拖拽
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 找到最近的 th 元素和 table 元素
    let th = e.currentTarget.parentElement;
    while (th && th.tagName !== 'TH') {
      th = th.parentElement;
    }
    if (!th) return;
    
    let table = th.parentElement;
    while (table && table.tagName !== 'TABLE') {
      table = table.parentElement;
    }
    
    thRef.current = th;
    
    // 獲取實際計算的寬度
    const computedStyle = window.getComputedStyle(th);
    const actualWidth = parseFloat(computedStyle.width);
    
    console.log('開始調整寬度:', { columnId, actualWidth });
    
    // 固定表格和所有欄位的寬度，避免跳動
    if (table) {
      // 固定表格總寬度
      const tableWidth = table.offsetWidth;
      table.style.width = `${tableWidth}px`;
      
      // 固定所有 th 的寬度
      const allThs = table.querySelectorAll('th');
      allThs.forEach((header) => {
        const width = window.getComputedStyle(header).width;
        header.style.width = width;
      });
    }
    
    // 設定當前寬度
    setCurrentWidth(actualWidth);
    
    setIsResizing(true);
    setStartX(e.clientX);
    setStartWidth(actualWidth);
    
    // 添加全局樣式以防止文字選擇和干擾
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    // 保持所有元素可交互，只改變游標
    document.body.classList.add('resizing-column');
  }, [columnId]);
  
  // 處理拖拽移動
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !thRef.current) return;
    
    const diff = e.clientX - startX;
    const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + diff));
    
    // 更新當前寬度狀態
    setCurrentWidth(newWidth);
    
    // 直接設定 th 的寬度以獲得即時視覺反饋
    thRef.current.style.width = `${newWidth}px`;
  }, [isResizing, startX, startWidth, columnId, onResize, minWidth, maxWidth]);
  
  // 處理結束拖拽
  const handleMouseUp = useCallback(() => {
    if (!isResizing) return;
    
    // 在結束時通知父組件最終寬度
    if (currentWidth > 0) {
      onResize(columnId, currentWidth);
    }
    
    setIsResizing(false);
    thRef.current = null;
    
    // 恢復樣式
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.body.classList.remove('resizing-column');
  }, [isResizing, currentWidth, columnId, onResize]);
  
  // 添加全局事件監聽器
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);
  
  if (Platform.OS !== 'web') {
    return null;
  }
  
  return React.createElement('div', {
    ref: resizerRef,
    className: `notion-column-resizer ${isResizing ? 'resizing' : ''}`,
    onMouseDown: handleMouseDown
  });
};