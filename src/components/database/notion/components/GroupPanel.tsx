/**
 * Notion 資料庫群組面板元件
 * 用於選擇和配置資料分組
 */

import React, { useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { GroupPanelProps, ColumnConfig, GroupConfig } from '../types';
import { GroupManager, createGroupConfig } from '../managers/GroupManager';
import { NotionIcons } from '../NotionIcons';

export const GroupPanel: React.FC<GroupPanelProps> = ({
  isOpen,
  onClose,
  columns,
  currentGroup,
  onGroupChange,
  anchorEl
}) => {
  // 將所有 Hook 宣告移到條件檢查之前
  const [groupManager] = useState(() => new GroupManager());
  const groupableColumns = groupManager.getGroupableColumns(columns);
  
  // 處理選擇群組欄位
  const handleSelectColumn = useCallback((columnKey: string) => {
    if (currentGroup?.columnKey === columnKey) {
      // 如果選擇相同欄位，則取消群組
      onGroupChange(null);
    } else {
      // 選擇新的群組欄位
      const newGroup = createGroupConfig(columnKey);
      onGroupChange(newGroup);
    }
    onClose();
  }, [currentGroup, onGroupChange, onClose]);

  // 處理清除群組
  const handleClearGroup = useCallback(() => {
    onGroupChange(null);
    onClose();
  }, [onGroupChange, onClose]);
  
  // 條件檢查移到所有 Hook 宣告之後
  console.log('👥 GroupPanel 渲染:', { isOpen, platform: Platform.OS });
  
  if (!isOpen || Platform.OS !== 'web') {
    return null;
  }
  
  console.log('👥 GroupPanel 將要渲染面板');

  return React.createElement('div', {
    className: 'notion-group-panel-overlay',
    onClick: (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    }
  },
    React.createElement('div', {
      className: 'notion-group-panel',
      style: anchorEl ? getPositionStyle(anchorEl) : undefined
    },
      // 面板標題
      React.createElement('div', {
        className: 'notion-group-panel-header'
      },
        React.createElement('span', null, '群組'),
        React.createElement('button', {
          className: 'notion-group-panel-close',
          onClick: onClose
        }, '✕')
      ),

      // 群組選項內容
      React.createElement('div', {
        className: 'notion-group-panel-content'
      },
        // 目前群組狀態
        currentGroup && React.createElement('div', {
          className: 'notion-group-current'
        },
          React.createElement('span', null, '目前群組: '),
          React.createElement('strong', null, 
            columns.find(col => col.key === currentGroup.columnKey)?.title || currentGroup.columnKey
          )
        ),

        // 可群組的欄位列表
        React.createElement('div', {
          className: 'notion-group-columns'
        },
          groupableColumns.length === 0 
            ? React.createElement('div', {
                className: 'notion-group-empty'
              }, '沒有可用於群組的欄位')
            : groupableColumns.map(column => 
                React.createElement('button', {
                  key: column.key,
                  className: `notion-group-column-item ${
                    currentGroup?.columnKey === column.key ? 'active' : ''
                  }`,
                  onClick: () => handleSelectColumn(column.key)
                },
                  React.createElement('span', {
                    className: 'notion-group-column-icon'
                  }, getColumnIcon(column.type)),
                  React.createElement('span', {
                    className: 'notion-group-column-title'
                  }, column.title),
                  currentGroup?.columnKey === column.key && 
                    React.createElement('span', {
                      className: 'notion-group-column-check'
                    }, NotionIcons.check())
                )
              )
        ),

        // 清除群組按鈕
        currentGroup && React.createElement('div', {
          className: 'notion-group-panel-footer'
        },
          React.createElement('button', {
            className: 'notion-button-text notion-button-destructive',
            onClick: handleClearGroup
          }, '清除群組')
        )
      )
    )
  );
};

// === 輔助函數 ===

function getPositionStyle(anchorEl: HTMLElement): React.CSSProperties {
  const rect = anchorEl.getBoundingClientRect();
  const panelWidth = 280; // 面板寬度
  const panelHeight = 400; // 預估面板高度
  const padding = 16; // 與視窗邊緣的間距
  
  // 優先顯示在按鈕下方
  let top = rect.bottom + 8;
  let left = rect.left;
  
  // 檢查是否會超出視窗底部
  if (top + panelHeight > window.innerHeight - padding) {
    // 如果下方空間不足，顯示在按鈕上方
    top = rect.top - panelHeight - 8;
    
    // 如果上方也不足，則固定在視窗內
    if (top < padding) {
      top = padding;
    }
  }
  
  // 檢查是否會超出視窗右側
  if (left + panelWidth > window.innerWidth - padding) {
    // 優先向左對齊按鈕右側
    left = rect.right - panelWidth;
    
    // 如果還是超出，則固定在視窗內
    if (left + panelWidth > window.innerWidth - padding) {
      left = window.innerWidth - panelWidth - padding;
    }
  }
  
  // 檢查是否會超出視窗左側
  if (left < padding) {
    left = padding;
  }
  
  // 檢查底部是否會超出視窗
  if (top + panelHeight + padding > window.innerHeight) {
    // 改為顯示在按鈕上方
    top = rect.top - panelHeight - 8;
    
    // 如果上方也不夠空間，則限制在視窗內
    if (top < padding) {
      top = padding;
    }
  }
  
  return {
    position: 'fixed',
    top,
    left,
    zIndex: 1000,
  };
}

function getColumnIcon(type: string): React.ReactElement {
  switch (type) {
    case 'text':
      return NotionIcons.text();
    case 'number':
      return NotionIcons.number();
    case 'select':
      return NotionIcons.select();
    case 'multiselect':
      return NotionIcons.multiSelect();
    case 'date':
      return NotionIcons.date();
    case 'checkbox':
      return NotionIcons.checkbox();
    case 'tags':
      return NotionIcons.tag();
    default:
      return NotionIcons.text();
  }
}