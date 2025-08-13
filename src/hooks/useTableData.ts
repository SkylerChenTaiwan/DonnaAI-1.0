/**
 * 表格資料管理 Hook
 */

import React, { useState, useMemo, useCallback } from 'react';
import { TableData } from '@/types/table';

interface UseTableDataOptions {
  initialSortKey?: string;
  initialSortDirection?: 'asc' | 'desc';
  filters?: { key: string; value: string; label?: string; operator?: string }[];
}

export const useTableData = (
  data: TableData[],
  options?: UseTableDataOptions
) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [sortConfig, setSortConfig] = useState({
    key: options?.initialSortKey || null,
    direction: (options?.initialSortDirection || 'asc') as 'asc' | 'desc' });

  // 同步外部排序設定
  React.useEffect(() => {
    if (options?.initialSortKey !== undefined || options?.initialSortDirection !== undefined) {
      setSortConfig({
        key: options?.initialSortKey || null,
        direction: options?.initialSortDirection || 'asc' });
    }
  }, [options?.initialSortKey, options?.initialSortDirection]);

  // 搜尋功能
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // 排序功能 - 支援三個狀態：升序 -> 降序 -> 無排序
  const handleSort = useCallback((key: string) => {
    setSortConfig((prevConfig) => {
      // 如果是不同的欄位，從升序開始
      if (prevConfig.key !== key) {
        return { key, direction: 'asc' };
      }
      
      // 如果是同一個欄位，循環切換：升序 -> 降序 -> 無排序
      if (prevConfig.direction === 'asc') {
        return { key, direction: 'desc' };
      } else if (prevConfig.direction === 'desc') {
        return { key: null, direction: 'asc' };
      } else {
        return { key, direction: 'asc' };
      }
    });
  }, []);

  // 選擇功能
  const toggleSelection = useCallback((id: string) => {
    setSelectedItems((prevItems) => {
      const newItems = new Set(prevItems);
      if (newItems.has(id)) {
        newItems.delete(id);
      } else {
        newItems.add(id);
      }
      return newItems;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set<string>());
  }, []);

  // 篩選功能
  const setFilter = useCallback((key: string, value: any) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [key]: value }));
  }, []);

  // 計算過濾和排序後的資料
  const processedData = useMemo(() => {
    let result = [...data];

    // 搜尋過濾
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((item) =>
        Object.values(item).some((value) =>
          String(value).toLowerCase().includes(query)
        )
      );
    }

    // 自訂篩選
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        result = result.filter((item) => item[key] === value);
      }
    });

    // 外部篩選條件
    if (options?.filters && options.filters.length > 0) {
      options.filters.forEach((filter) => {
        if (filter.value) {
          result = result.filter((item) => {
            const itemValue = String(item[filter.key] || '').toLowerCase();
            const filterValue = filter.value.toLowerCase();
            const operator = filter.operator || 'contains';
            
            switch (operator) {
              case 'equals':
                return itemValue === filterValue;
              case 'contains':
                return itemValue.includes(filterValue);
              case 'startsWith':
                return itemValue.startsWith(filterValue);
              case 'endsWith':
                return itemValue.endsWith(filterValue);
              default:
                return itemValue.includes(filterValue);
            }
          });
        }
      });
    }

    // 排序
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [data, searchQuery, filters, sortConfig, options?.filters]);

  const selectAll = useCallback(() => {
    const allIds = processedData.map((item) => item.id);
    setSelectedItems(new Set(allIds));
  }, [processedData]);

  return {
    data: processedData,
    searchQuery,
    sortConfig,
    selectedItems,
    filters,
    handleSearch,
    handleSort,
    toggleSelection,
    selectAll,
    clearSelection,
    setFilter };
};