/**
 * 表格資料管理 Hook
 */

import React, { useState, useMemo, useCallback } from 'react';
import { TableData, TableState } from '@/types/table';

interface UseTableDataOptions {
  initialSortKey?: string;
  initialSortDirection?: 'asc' | 'desc';
  filters?: { key: string; value: string; label?: string }[];
}

export const useTableData = (
  data: TableData[],
  options?: UseTableDataOptions
) => {
  const [state, setState] = useState<TableState>({
    data,
    filteredData: data,
    sortConfig: {
      key: options?.initialSortKey || null,
      direction: options?.initialSortDirection || 'asc',
    },
    searchQuery: '',
    selectedItems: new Set<string>(),
    filters: {},
  });

  // 同步外部排序設定
  React.useEffect(() => {
    if (options?.initialSortKey !== undefined || options?.initialSortDirection !== undefined) {
      setState(prevState => ({
        ...prevState,
        sortConfig: {
          key: options.initialSortKey || null,
          direction: options.initialSortDirection || 'asc',
        },
      }));
    }
  }, [options?.initialSortKey, options?.initialSortDirection]);

  // 搜尋功能
  const handleSearch = useCallback((query: string) => {
    setState((prevState) => ({
      ...prevState,
      searchQuery: query,
    }));
  }, []);

  // 排序功能
  const handleSort = useCallback((key: string) => {
    setState((prevState) => {
      const { sortConfig } = prevState;
      let direction: 'asc' | 'desc' = 'asc';

      if (sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
      }

      return {
        ...prevState,
        sortConfig: { key, direction },
      };
    });
  }, []);

  // 選擇功能
  const toggleSelection = useCallback((id: string) => {
    setState((prevState) => {
      const newSelectedItems = new Set(prevState.selectedItems);
      if (newSelectedItems.has(id)) {
        newSelectedItems.delete(id);
      } else {
        newSelectedItems.add(id);
      }
      return {
        ...prevState,
        selectedItems: newSelectedItems,
      };
    });
  }, []);

  const selectAll = useCallback(() => {
    setState((prevState) => {
      const allIds = prevState.filteredData.map((item) => item.id);
      return {
        ...prevState,
        selectedItems: new Set(allIds),
      };
    });
  }, []);

  const clearSelection = useCallback(() => {
    setState((prevState) => ({
      ...prevState,
      selectedItems: new Set<string>(),
    }));
  }, []);

  // 篩選功能
  const setFilter = useCallback((key: string, value: any) => {
    setState((prevState) => ({
      ...prevState,
      filters: {
        ...prevState.filters,
        [key]: value,
      },
    }));
  }, []);

  // 計算過濾和排序後的資料
  const processedData = useMemo(() => {
    let result = [...data];

    // 搜尋過濾
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      result = result.filter((item) =>
        Object.values(item).some((value) =>
          String(value).toLowerCase().includes(query)
        )
      );
    }

    // 自訂篩選
    Object.entries(state.filters).forEach(([key, value]) => {
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
            // 使用包含邏輯，而不是完全匹配
            return itemValue.includes(filterValue);
          });
        }
      });
    }

    // 排序
    if (state.sortConfig.key) {
      result.sort((a, b) => {
        const aValue = a[state.sortConfig.key!];
        const bValue = b[state.sortConfig.key!];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (aValue < bValue) {
          return state.sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return state.sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [data, state.searchQuery, state.filters, state.sortConfig, options?.filters]);

  return {
    data: processedData,
    searchQuery: state.searchQuery,
    sortConfig: state.sortConfig,
    selectedItems: state.selectedItems,
    filters: state.filters,
    handleSearch,
    handleSort,
    toggleSelection,
    selectAll,
    clearSelection,
    setFilter,
  };
};