/**
 * Notion 風格搜尋列
 * 提供即時搜尋功能，支援防抖、高亮和欄位選擇
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Platform } from 'react-native';
import { SearchBarProps, SearchConfig, SearchResult, TableData } from '../types';
import { NotionIcons } from '../NotionIcons';

// 搜尋管理器類別
export class SearchManager {
  private searchConfig: SearchConfig;

  constructor(config: SearchConfig) {
    this.searchConfig = config;
  }

  /**
   * 在資料中執行搜尋
   */
  public search(data: TableData[]): { filteredData: TableData[]; results: SearchResult[] } {
    if (!this.searchConfig.query.trim()) {
      return { filteredData: data, results: [] };
    }

    const results: SearchResult[] = [];
    const matchedRowIds = new Set<string>();

    const query = this.searchConfig.caseSensitive 
      ? this.searchConfig.query 
      : this.searchConfig.query.toLowerCase();

    for (const row of data) {
      const searchColumns = this.searchConfig.columns.length > 0 
        ? this.searchConfig.columns 
        : Object.keys(row).filter(key => key !== 'id' && !key.startsWith('_'));

      for (const columnKey of searchColumns) {
        const value = row[columnKey];
        const searchResults = this.searchInValue(value, query, row.id, columnKey);
        
        if (searchResults.length > 0) {
          results.push(...searchResults);
          matchedRowIds.add(row.id);
        }
      }
    }

    const filteredData = data.filter(row => matchedRowIds.has(row.id));

    return { filteredData, results };
  }

  /**
   * 在單一值中搜尋
   */
  private searchInValue(value: any, query: string, rowId: string, columnKey: string): SearchResult[] {
    if (value == null) return [];

    const searchText = this.searchConfig.caseSensitive 
      ? String(value) 
      : String(value).toLowerCase();

    const results: SearchResult[] = [];
    let startIndex = 0;

    while (true) {
      const index = searchText.indexOf(query, startIndex);
      if (index === -1) break;

      results.push({
        rowId,
        columnKey,
        matchedText: String(value).substring(index, index + query.length),
        startIndex: index,
        endIndex: index + query.length - 1 });

      startIndex = index + 1;
    }

    return results;
  }

  /**
   * 高亮搜尋結果
   */
  public highlightMatches(text: string, searchResults: SearchResult[]): React.ReactNode {
    if (!this.searchConfig.highlightMatches || !searchResults.length) {
      return text;
    }

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    // 按位置排序結果
    const sortedResults = [...searchResults].sort((a, b) => a.startIndex - b.startIndex);

    for (const result of sortedResults) {
      // 添加高亮前的文字
      if (result.startIndex > lastIndex) {
        parts.push(text.substring(lastIndex, result.startIndex));
      }

      // 添加高亮的文字
      parts.push(
        React.createElement('mark', {
          key: `highlight-${result.startIndex}`,
          className: 'notion-search-highlight'
        }, result.matchedText)
      );

      lastIndex = result.endIndex + 1;
    }

    // 添加剩餘的文字
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return React.createElement('span', {}, ...parts);
  }

  /**
   * 更新搜尋配置
   */
  public updateConfig(updates: Partial<SearchConfig>): SearchManager {
    return new SearchManager({ ...this.searchConfig, ...updates });
  }
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchConfig,
  onSearchChange,
  columns,
  placeholder = '搜尋...'
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localQuery, setLocalQuery] = useState(searchConfig.query);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  // 防抖搜尋
  const debouncedSearch = useCallback((query: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      onSearchChange({
        ...searchConfig,
        query: query.trim() });
    }, 300); // 300ms 防抖
  }, [searchConfig, onSearchChange]);

  // 處理查詢變更
  const handleQueryChange = useCallback((query: string) => {
    setLocalQuery(query);
    debouncedSearch(query);
  }, [debouncedSearch]);

  // 處理輸入框聚焦
  const handleFocus = useCallback(() => {
    setIsExpanded(true);
  }, []);

  // 處理輸入框失焦
  const handleBlur = useCallback(() => {
    // 延遲收合，讓用戶可以點擊選項
    setTimeout(() => {
      if (!localQuery && !showColumnSelector) {
        setIsExpanded(false);
      }
    }, 200);
  }, [localQuery, showColumnSelector]);

  // 處理清除搜尋
  const handleClear = useCallback(() => {
    setLocalQuery('');
    onSearchChange({
      ...searchConfig,
      query: '' });
    inputRef.current?.focus();
  }, [searchConfig, onSearchChange]);

  // 處理欄位選擇
  const handleColumnToggle = useCallback((columnKey: string) => {
    const currentColumns = searchConfig.columns;
    const newColumns = currentColumns.includes(columnKey)
      ? currentColumns.filter(key => key !== columnKey)
      : [...currentColumns, columnKey];
    
    onSearchChange({
      ...searchConfig,
      columns: newColumns });
  }, [searchConfig, onSearchChange]);

  // 處理大小寫敏感切換
  const handleCaseSensitiveToggle = useCallback(() => {
    onSearchChange({
      ...searchConfig,
      caseSensitive: !searchConfig.caseSensitive });
  }, [searchConfig, onSearchChange]);

  // 清理定時器
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // 同步外部搜尋變更
  useEffect(() => {
    if (searchConfig.query !== localQuery) {
      setLocalQuery(searchConfig.query);
    }
  }, [searchConfig.query]);

  if (Platform.OS !== 'web') {
    return null;
  }

  const selectedColumnsText = useMemo(() => {
    if (searchConfig.columns.length === 0) {
      return '全部欄位';
    }
    if (searchConfig.columns.length === 1) {
      const column = columns.find(col => col.key === searchConfig.columns[0]);
      return column?.title || searchConfig.columns[0];
    }
    return `${searchConfig.columns.length} 個欄位`;
  }, [searchConfig.columns, columns]);

  return React.createElement('div', {
    className: `notion-search-bar ${isExpanded ? 'expanded' : 'collapsed'}`
  },
    // 搜尋輸入框
    React.createElement('div', {
      className: 'notion-search-input-container'
    },
      React.createElement('div', {
        className: 'notion-search-icon'
      }, NotionIcons.search()),
      
      React.createElement('input', {
        ref: inputRef,
        type: 'text',
        className: 'notion-search-input',
        placeholder,
        value: localQuery,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
          handleQueryChange(e.target.value);
        },
        onFocus: handleFocus,
        onBlur: handleBlur,
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === 'Escape') {
            handleClear();
            inputRef.current?.blur();
          }
        }
      }),

      // 清除按鈕
      localQuery && React.createElement('button', {
        className: 'notion-search-clear',
        onClick: handleClear,
        title: '清除搜尋'
      }, '✕'),

      // 設定按鈕
      React.createElement('button', {
        className: 'notion-search-settings',
        onClick: () => setShowColumnSelector(!showColumnSelector),
        title: '搜尋設定'
      }, '⚙')
    ),

    // 展開的設定面板
    isExpanded && React.createElement('div', {
      className: 'notion-search-settings-panel'
    },
      // 搜尋範圍
      React.createElement('div', {
        className: 'notion-search-setting-group'
      },
        React.createElement('label', {
          className: 'notion-search-setting-label'
        }, '搜尋範圍'),
        React.createElement('div', {
          className: 'notion-search-column-selector'
        },
          React.createElement('button', {
            className: 'notion-search-column-button',
            onClick: () => setShowColumnSelector(!showColumnSelector)
          }, 
            selectedColumnsText,
            React.createElement('span', {
              className: 'notion-search-dropdown-arrow'
            }, showColumnSelector ? '▲' : '▼')
          ),

          // 欄位選擇下拉
          showColumnSelector && React.createElement('div', {
            className: 'notion-search-column-dropdown'
          },
            React.createElement('label', {
              className: 'notion-search-column-option'
            },
              React.createElement('input', {
                type: 'checkbox',
                checked: searchConfig.columns.length === 0,
                onChange: () => {
                  onSearchChange({
                    ...searchConfig,
                    columns: [] });
                }
              }),
              '全部欄位'
            ),
            ...columns.map(column => 
              React.createElement('label', {
                key: column.key,
                className: 'notion-search-column-option'
              },
                React.createElement('input', {
                  type: 'checkbox',
                  checked: searchConfig.columns.includes(column.key),
                  onChange: () => handleColumnToggle(column.key)
                }),
                column.title
              )
            )
          )
        )
      ),

      // 搜尋選項
      React.createElement('div', {
        className: 'notion-search-setting-group'
      },
        React.createElement('label', {
          className: 'notion-search-setting-label'
        }, '選項'),
        React.createElement('label', {
          className: 'notion-search-option'
        },
          React.createElement('input', {
            type: 'checkbox',
            checked: searchConfig.caseSensitive,
            onChange: handleCaseSensitiveToggle
          }),
          '區分大小寫'
        ),
        React.createElement('label', {
          className: 'notion-search-option'
        },
          React.createElement('input', {
            type: 'checkbox',
            checked: searchConfig.highlightMatches,
            onChange: () => {
              onSearchChange({
                ...searchConfig,
                highlightMatches: !searchConfig.highlightMatches });
            }
          }),
          '高亮搜尋結果'
        )
      )
    )
  );
};

/**
 * React Hook 用於搜尋功能
 */
export function useSearch(
  data: TableData[], 
  searchConfig: SearchConfig
): { filteredData: TableData[]; searchResults: SearchResult[]; searchManager: SearchManager } {
  const searchManager = useMemo(() => new SearchManager(searchConfig), [searchConfig]);
  
  const { filteredData, results } = useMemo(
    () => searchManager.search(data),
    [data, searchManager]
  );

  return {
    filteredData,
    searchResults: results,
    searchManager };
}

/**
 * 建立預設搜尋配置
 */
export function createDefaultSearchConfig(): SearchConfig {
  return {
    query: '',
    columns: [], // 空陣列表示搜尋所有欄位
    caseSensitive: false,
    highlightMatches: true };
}