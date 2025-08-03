/**
 * Notion 風格面板容器
 * 用於過濾、排序、搜尋等懸浮面板的統一容器
 */

import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

interface PanelContainerProps {
  isOpen: boolean;
  onClose: () => void;
  anchorEl: HTMLElement | null;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  width?: number;
}

export const PanelContainer: React.FC<PanelContainerProps> = ({
  isOpen,
  onClose,
  anchorEl,
  title,
  icon,
  children,
  width = 280,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  // 處理點擊外部關閉
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // 延遲添加事件監聽器，避免立即觸發
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // 處理 ESC 鍵關閉
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || Platform.OS !== 'web') {
    return null;
  }

  // 計算面板位置
  const getPosition = () => {
    if (!anchorEl) {
      return { top: 100, left: 100 };
    }

    const rect = anchorEl.getBoundingClientRect();
    const panelHeight = 400; // 預估高度
    const panelWidth = width;

    let top = rect.bottom + 8;
    let left = rect.left;

    // 檢查是否會超出視窗底部
    if (top + panelHeight > window.innerHeight) {
      top = rect.top - panelHeight - 8;
    }

    // 檢查是否會超出視窗右側
    if (left + panelWidth > window.innerWidth) {
      left = window.innerWidth - panelWidth - 16;
    }

    // 檢查是否會超出視窗左側
    if (left < 16) {
      left = 16;
    }

    return { top, left };
  };

  const position = getPosition();

  return React.createElement('div', {
    className: 'notion-panel-overlay'
  },
    React.createElement('div', {
      ref: panelRef,
      className: 'notion-panel',
      style: {
        top: position.top,
        left: position.left,
        width,
      }
    },
      // 面板標題
      React.createElement('div', {
        className: 'notion-panel-header'
      },
        React.createElement('div', {
          className: 'notion-panel-title'
        },
          icon && React.createElement('span', {
            className: 'notion-panel-icon'
          }, icon),
          React.createElement('span', {}, title)
        ),
        React.createElement('button', {
          className: 'notion-panel-close',
          onClick: onClose,
          title: '關閉'
        }, '✕')
      ),
      
      // 面板內容
      React.createElement('div', {
        className: 'notion-panel-content'
      }, children)
    )
  );
};