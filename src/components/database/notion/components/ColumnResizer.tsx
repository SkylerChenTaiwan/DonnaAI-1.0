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
  const resizerRef = useRef<HTMLDivElement>(null);
  
  // 處理開始拖拽
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const th = (e.target as HTMLElement).parentElement;
    if (!th) return;
    
    setIsResizing(true);
    setStartX(e.clientX);
    setStartWidth(th.offsetWidth);
    
    // 添加全局樣式以防止文字選擇
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);
  
  // 處理拖拽移動
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const diff = e.clientX - startX;
    const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + diff));
    
    // 立即更新寬度以獲得即時反饋
    onResize(columnId, newWidth);
  }, [isResizing, startX, startWidth, columnId, onResize, minWidth, maxWidth]);
  
  // 處理結束拖拽
  const handleMouseUp = useCallback(() => {
    if (!isResizing) return;
    
    setIsResizing(false);
    
    // 恢復樣式
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, [isResizing]);
  
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