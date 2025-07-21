/**
 * 表格相關型別定義
 */

import React from 'react';

export interface TableColumn {
  key: string;
  title: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: number;
  render?: (value: any, item: any) => React.ReactNode;
}

export interface TableData {
  id: string;
  [key: string]: any;
}

export interface TableState {
  data: TableData[];
  filteredData: TableData[];
  sortConfig: {
    key: string | null;
    direction: 'asc' | 'desc';
  };
  searchQuery: string;
  selectedItems: Set<string>;
  filters: Record<string, any>;
}

export interface TableProps {
  data: TableData[];
  columns: TableColumn[];
  searchable?: boolean;
  selectable?: boolean;
  showCheckboxes?: boolean; // 新增：控制是否顯示勾選框
  onSelect?: (selectedIds: string[]) => void;
  onRowPress?: (item: TableData) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
}