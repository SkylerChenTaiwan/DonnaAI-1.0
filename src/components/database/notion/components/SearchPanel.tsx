/**
 * Notion 風格搜尋面板
 * 懸浮式搜尋介面，與過濾、排序面板保持一致
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { NotionIcons } from '../NotionIcons';
import { SearchConfig, TableColumn } from '../types';
import { calculatePanelPosition, PANEL_DIMENSIONS } from '../utils/panelPosition';

interface SearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
  anchorEl: HTMLElement | null;
  searchConfig: SearchConfig;
  onSearchChange: (config: SearchConfig) => void;
  columns: TableColumn[];
}

export const SearchPanel: React.FC<SearchPanelProps> = ({
  isOpen,
  onClose,
  anchorEl,
  searchConfig,
  onSearchChange,
  columns,
}) => {
  const [localQuery, setLocalQuery] = useState(searchConfig.query);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(searchConfig.columns);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 自動聚焦輸入框
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // 防抖處理查詢變更
  const handleQueryChange = useCallback((value: string) => {
    setLocalQuery(value);
    
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      onSearchChange({
        ...searchConfig,
        query: value,
      });
    }, 300);
  }, [searchConfig, onSearchChange]);

  // 處理欄位選擇
  const handleColumnToggle = useCallback((columnKey: string) => {
    const newColumns = selectedColumns.includes(columnKey)
      ? selectedColumns.filter(key => key !== columnKey)
      : [...selectedColumns, columnKey];
    
    setSelectedColumns(newColumns);
    onSearchChange({
      ...searchConfig,
      columns: newColumns,
    });
  }, [selectedColumns, searchConfig, onSearchChange]);

  // 全選/取消全選
  const handleSelectAll = useCallback(() => {
    if (selectedColumns.length === 0) {
      // 已經是全部欄位，不做任何改變
      return;
    }
    setSelectedColumns([]);
    onSearchChange({
      ...searchConfig,
      columns: [],
    });
  }, [searchConfig, onSearchChange]);

  // 清除搜尋
  const handleClear = useCallback(() => {
    setLocalQuery('');
    setSelectedColumns([]);
    onSearchChange({
      query: '',
      columns: [],
      caseSensitive: false,
      highlightMatches: true,
    });
  }, [onSearchChange]);

  // 清理定時器
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  if (!isOpen || Platform.OS !== 'web') {
    return null;
  }

  return React.createElement('div', {
    className: 'notion-filter-panel-overlay',
    onClick: (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    }
  },
    React.createElement('div', {
      className: 'notion-filter-panel',
      style: calculatePanelPosition(anchorEl, PANEL_DIMENSIONS.search)
    },
      // 面板標題
      React.createElement('div', {
        className: 'notion-filter-panel-header'
      },
        React.createElement('h3', {
          className: 'notion-filter-panel-title'
        }, '搜尋'),
        React.createElement('button', {
          className: 'notion-filter-panel-close',
          onClick: onClose
        }, '✕')
      ),
      
      // 搜尋內容
      React.createElement('div', {
        className: 'notion-filter-panel-content'
      },
      // 搜尋輸入框
      React.createElement('div', { className: 'notion-search-input-wrapper' },
        React.createElement('input', {
          ref: inputRef,
          type: 'text',
          className: 'notion-input notion-search-panel-input',
          placeholder: '搜尋資料庫...',
          value: localQuery,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleQueryChange(e.target.value),
          onKeyDown: (e: React.KeyboardEvent) => {
            if (e.key === 'Escape') {
              onClose();
            }
          }
        }),
        localQuery && React.createElement('button', {
          className: 'notion-input-clear',
          onClick: () => handleQueryChange(''),
          title: '清除'
        }, '✕')
      ),

      // 搜尋選項
      React.createElement('div', { className: 'notion-filter-option-group' },
        React.createElement('div', { className: 'notion-filter-option-header' },
          React.createElement('span', { className: 'notion-filter-option-title' }, '搜尋範圍'),
          React.createElement('button', {
            className: 'notion-text-link',
            onClick: handleSelectAll
          }, selectedColumns.length === 0 ? '取消全選' : '全部欄位')
        ),
        
        // 欄位選擇列表
        React.createElement('div', { className: 'notion-checkbox-list' },
          columns.map(column => 
            React.createElement('label', {
              key: column.key,
              className: 'notion-checkbox-item'
            },
              React.createElement('input', {
                type: 'checkbox',
                className: 'notion-checkbox',
                checked: selectedColumns.length === 0 || selectedColumns.includes(column.key),
                onChange: () => handleColumnToggle(column.key)
              }),
              React.createElement('span', { className: 'notion-property-icon' },
                NotionIcons[column.type]?.() || NotionIcons.text()
              ),
              React.createElement('span', {}, column.title)
            )
          )
        )
      ),

      // 搜尋選項
      React.createElement('div', { className: 'notion-filter-option-group' },
        React.createElement('div', { className: 'notion-filter-option-header' },
          React.createElement('span', { className: 'notion-filter-option-title' }, '選項')
        ),
        React.createElement('label', { className: 'notion-checkbox-item' },
          React.createElement('input', {
            type: 'checkbox',
            className: 'notion-checkbox',
            checked: searchConfig.caseSensitive,
            onChange: () => onSearchChange({
              ...searchConfig,
              caseSensitive: !searchConfig.caseSensitive
            })
          }),
          React.createElement('span', {}, '區分大小寫')
        ),
        React.createElement('label', { className: 'notion-checkbox-item' },
          React.createElement('input', {
            type: 'checkbox',
            className: 'notion-checkbox',
            checked: searchConfig.highlightMatches,
            onChange: () => onSearchChange({
              ...searchConfig,
              highlightMatches: !searchConfig.highlightMatches
            })
          }),
          React.createElement('span', {}, '高亮顯示結果')
        )
        )
      )
    )
  );
};