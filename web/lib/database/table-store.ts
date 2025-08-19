/**
 * PRP-125: Notion 風格資料庫管理系統 - 表格狀態管理
 * 
 * @description 統一的表格狀態管理，整合 React Query 和 Zustand
 * @version 1.0.0
 * @date 2025-08-19
 * 
 * 主要功能：
 * - 表格資料狀態管理
 * - 篩選和排序狀態
 * - 編輯狀態管理
 * - 選擇狀態管理
 * - React Query 整合
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Table,
  Row,
  Field,
  FilterState,
  SortState,
  EditingState,
  SelectionState,
  CellReference,
  CellValue,
  FilterConfig,
  SortConfig,
  TableError
} from '@/docs/types/database-table-types';

/**
 * 表格狀態介面
 */
interface TableState {
  // 基礎狀態
  currentTableId: string | null;
  isLoading: boolean;
  error: TableError | null;

  // 篩選和排序狀態
  filterState: FilterState;
  sortState: SortState;
  
  // 編輯狀態
  editingState: EditingState;
  
  // 選擇狀態
  selectionState: SelectionState;
  
  // UI 狀態
  viewMode: 'table' | 'board' | 'calendar' | 'gallery';
  sidebarOpen: boolean;
  
  // 效能狀態
  virtualScrollOffset: number;
  visibleRowRange: { start: number; end: number };
}

/**
 * 表格動作介面
 */
interface TableActions {
  // 基礎動作
  setCurrentTable: (tableId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: TableError | null) => void;
  
  // 篩選動作
  addFilter: (filter: FilterConfig) => void;
  removeFilter: (filterId: string) => void;
  updateFilter: (filterId: string, filter: Partial<FilterConfig>) => void;
  clearFilters: () => void;
  
  // 排序動作
  setSorts: (sorts: SortConfig[]) => void;
  addSort: (sort: SortConfig) => void;
  removeSort: (fieldId: string) => void;
  toggleSort: (fieldId: string) => void;
  
  // 編輯動作
  startEdit: (cellRef: CellReference, originalValue: CellValue) => void;
  updateEditValue: (value: CellValue) => void;
  endEdit: (save?: boolean) => void;
  cancelEdit: () => void;
  
  // 選擇動作
  selectCell: (cellRef: CellReference) => void;
  selectRow: (rowId: string, extend?: boolean) => void;
  selectColumn: (fieldId: string, extend?: boolean) => void;
  selectAll: () => void;
  clearSelection: () => void;
  
  // UI 動作
  setViewMode: (mode: 'table' | 'board' | 'calendar' | 'gallery') => void;
  toggleSidebar: () => void;
  
  // 效能動作
  setVirtualScrollOffset: (offset: number) => void;
  setVisibleRowRange: (range: { start: number; end: number }) => void;
}

/**
 * 初始狀態
 */
const initialState: TableState = {
  currentTableId: null,
  isLoading: false,
  error: null,
  
  filterState: {
    filters: [],
    filteredRowIds: undefined,
    filterStats: undefined
  },
  
  sortState: {
    sorts: [],
    sortedRowIds: undefined
  },
  
  editingState: {
    editingCell: null,
    mode: 'none',
    originalValue: null,
    currentValue: null,
    hasChanges: false,
    validationState: { isValidating: false },
    history: []
  },
  
  selectionState: {
    mode: 'single',
    selectedCells: new Set(),
    selectedRows: new Set(),
    selectedColumns: new Set()
  },
  
  viewMode: 'table',
  sidebarOpen: false,
  virtualScrollOffset: 0,
  visibleRowRange: { start: 0, end: 50 }
};

/**
 * Zustand 狀態管理 Store
 */
export const useTableStore = create<TableState & TableActions>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,
    
    // 基礎動作
    setCurrentTable: (tableId: string) => {
      set({ 
        currentTableId: tableId,
        // 重置其他狀態
        filterState: initialState.filterState,
        sortState: initialState.sortState,
        editingState: initialState.editingState,
        selectionState: initialState.selectionState
      });
    },
    
    setLoading: (loading: boolean) => set({ isLoading: loading }),
    setError: (error: TableError | null) => set({ error }),
    
    // 篩選動作
    addFilter: (filter: FilterConfig) => {
      const currentFilters = get().filterState.filters;
      set({
        filterState: {
          ...get().filterState,
          filters: [...currentFilters, filter]
        }
      });
    },
    
    removeFilter: (filterId: string) => {
      const currentFilters = get().filterState.filters;
      set({
        filterState: {
          ...get().filterState,
          filters: currentFilters.filter(f => f.id !== filterId)
        }
      });
    },
    
    updateFilter: (filterId: string, filterUpdate: Partial<FilterConfig>) => {
      const currentFilters = get().filterState.filters;
      set({
        filterState: {
          ...get().filterState,
          filters: currentFilters.map(f => 
            f.id === filterId ? { ...f, ...filterUpdate } : f
          )
        }
      });
    },
    
    clearFilters: () => {
      set({
        filterState: {
          ...get().filterState,
          filters: []
        }
      });
    },
    
    // 排序動作
    setSorts: (sorts: SortConfig[]) => {
      set({
        sortState: {
          ...get().sortState,
          sorts
        }
      });
    },
    
    addSort: (sort: SortConfig) => {
      const currentSorts = get().sortState.sorts;
      set({
        sortState: {
          ...get().sortState,
          sorts: [...currentSorts, sort]
        }
      });
    },
    
    removeSort: (fieldId: string) => {
      const currentSorts = get().sortState.sorts;
      set({
        sortState: {
          ...get().sortState,
          sorts: currentSorts.filter(s => s.fieldId !== fieldId)
        }
      });
    },
    
    toggleSort: (fieldId: string) => {
      const currentSorts = get().sortState.sorts;
      const existingSort = currentSorts.find(s => s.fieldId === fieldId);
      
      if (!existingSort) {
        // 新增升序排序
        set({
          sortState: {
            ...get().sortState,
            sorts: [...currentSorts, { fieldId, direction: 'asc' }]
          }
        });
      } else if (existingSort.direction === 'asc') {
        // 切換為降序
        set({
          sortState: {
            ...get().sortState,
            sorts: currentSorts.map(s => 
              s.fieldId === fieldId ? { ...s, direction: 'desc' } : s
            )
          }
        });
      } else {
        // 移除排序
        set({
          sortState: {
            ...get().sortState,
            sorts: currentSorts.filter(s => s.fieldId !== fieldId)
          }
        });
      }
    },
    
    // 編輯動作
    startEdit: (cellRef: CellReference, originalValue: CellValue) => {
      set({
        editingState: {
          editingCell: cellRef,
          mode: 'cell',
          originalValue,
          currentValue: originalValue,
          hasChanges: false,
          validationState: { isValidating: false },
          startedAt: new Date(),
          history: []
        }
      });
    },
    
    updateEditValue: (value: CellValue) => {
      const currentState = get().editingState;
      set({
        editingState: {
          ...currentState,
          currentValue: value,
          hasChanges: value !== currentState.originalValue
        }
      });
    },
    
    endEdit: (save: boolean = true) => {
      if (save && get().editingState.hasChanges) {
        // TODO: 觸發儲存邏輯
        console.log('Save edit:', get().editingState);
      }
      
      set({
        editingState: {
          ...initialState.editingState
        }
      });
    },
    
    cancelEdit: () => {
      set({
        editingState: {
          ...initialState.editingState
        }
      });
    },
    
    // 選擇動作
    selectCell: (cellRef: CellReference) => {
      const key = `${cellRef.rowId}-${cellRef.fieldId}`;
      set({
        selectionState: {
          ...get().selectionState,
          selectedCells: new Set([key]),
          lastSelection: cellRef
        }
      });
    },
    
    selectRow: (rowId: string, extend: boolean = false) => {
      const currentSelection = get().selectionState.selectedRows;
      const newSelection = extend 
        ? new Set([...currentSelection, rowId])
        : new Set([rowId]);
      
      set({
        selectionState: {
          ...get().selectionState,
          selectedRows: newSelection
        }
      });
    },
    
    selectColumn: (fieldId: string, extend: boolean = false) => {
      const currentSelection = get().selectionState.selectedColumns;
      const newSelection = extend 
        ? new Set([...currentSelection, fieldId])
        : new Set([fieldId]);
      
      set({
        selectionState: {
          ...get().selectionState,
          selectedColumns: newSelection
        }
      });
    },
    
    selectAll: () => {
      // TODO: 實作全選邏輯，需要知道當前表格的所有列
      console.log('Select all rows');
    },
    
    clearSelection: () => {
      set({
        selectionState: {
          ...get().selectionState,
          selectedCells: new Set(),
          selectedRows: new Set(),
          selectedColumns: new Set()
        }
      });
    },
    
    // UI 動作
    setViewMode: (mode: 'table' | 'board' | 'calendar' | 'gallery') => {
      set({ viewMode: mode });
    },
    
    toggleSidebar: () => {
      set({ sidebarOpen: !get().sidebarOpen });
    },
    
    // 效能動作
    setVirtualScrollOffset: (offset: number) => {
      set({ virtualScrollOffset: offset });
    },
    
    setVisibleRowRange: (range: { start: number; end: number }) => {
      set({ visibleRowRange: range });
    }
  }))
);

/**
 * React Query Keys
 */
export const tableQueryKeys = {
  all: ['tables'] as const,
  table: (id: string) => ['tables', id] as const,
  tableData: (id: string) => ['tables', id, 'data'] as const,
  tableSchema: (id: string) => ['tables', id, 'schema'] as const,
  filteredData: (id: string, filters: FilterConfig[]) => 
    ['tables', id, 'filtered', filters] as const,
  sortedData: (id: string, sorts: SortConfig[]) => 
    ['tables', id, 'sorted', sorts] as const
};

/**
 * 表格資料查詢 Hook
 */
export const useTableData = (tableId: string) => {
  return useQuery({
    queryKey: tableQueryKeys.tableData(tableId),
    queryFn: async (): Promise<Table> => {
      // TODO: 實作實際的 API 呼叫
      console.log('Fetching table data for:', tableId);
      
      // 模擬資料
      return {
        id: tableId,
        databaseId: 'db-1',
        name: '客戶資料表',
        description: '客戶管理系統的主要資料表',
        schema: {
          fields: [
            {
              id: 'name',
              name: '客戶名稱',
              type: 'text',
              required: true
            },
            {
              id: 'email',
              name: '電子郵件',
              type: 'email',
              required: true
            },
            {
              id: 'phone',
              name: '電話',
              type: 'phone'
            },
            {
              id: 'status',
              name: '狀態',
              type: 'select',
              settings: {
                options: [
                  { id: 'active', label: '活躍', color: '#green' },
                  { id: 'inactive', label: '非活躍', color: '#red' },
                  { id: 'pending', label: '待確認', color: '#yellow' }
                ]
              }
            }
          ],
          primaryKey: 'id'
        },
        rows: Array.from({ length: 100 }, (_, i) => ({
          id: `row-${i + 1}`,
          tableId,
          data: {
            name: `客戶 ${i + 1}`,
            email: `customer${i + 1}@example.com`,
            phone: `09${String(i + 1).padStart(8, '0')}`,
            status: ['active', 'inactive', 'pending'][i % 3]
          },
          metadata: {
            index: i
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system',
          updatedBy: 'system',
          version: 1
        })),
        views: [],
        settings: {
          rowHeight: 'default',
          enableDragDrop: true,
          enableBulkOperations: true,
          enableInlineEditing: true
        },
        permissions: {
          canView: true,
          canEdit: true,
          canDelete: true,
          canShare: true,
          canExport: true,
          canManageSchema: true
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1
      };
    },
    enabled: !!tableId,
    staleTime: 5 * 60 * 1000, // 5 分鐘
    gcTime: 10 * 60 * 1000 // 10 分鐘
  });
};

/**
 * 篩選資料查詢 Hook
 */
export const useFilteredTableData = (tableId: string, filters: FilterConfig[]) => {
  const { data: tableData } = useTableData(tableId);
  
  return useQuery({
    queryKey: tableQueryKeys.filteredData(tableId, filters),
    queryFn: async (): Promise<Row[]> => {
      if (!tableData || filters.length === 0) {
        return tableData?.rows || [];
      }
      
      // TODO: 實作實際的篩選邏輯
      console.log('Filtering data with filters:', filters);
      
      return tableData.rows.filter(row => {
        return filters.every(filter => {
          const cellValue = row.data[filter.fieldId];
          
          switch (filter.operator) {
            case 'equals':
              return cellValue === filter.value;
            case 'contains':
              return String(cellValue).includes(String(filter.value));
            case 'not_equals':
              return cellValue !== filter.value;
            default:
              return true;
          }
        });
      });
    },
    enabled: !!tableData,
    staleTime: 2 * 60 * 1000 // 2 分鐘
  });
};

/**
 * 排序資料查詢 Hook
 */
export const useSortedTableData = (tableId: string, sorts: SortConfig[], filteredData?: Row[]) => {
  const { data: tableData } = useTableData(tableId);
  const dataToSort = filteredData || tableData?.rows || [];
  
  return useQuery({
    queryKey: tableQueryKeys.sortedData(tableId, sorts),
    queryFn: async (): Promise<Row[]> => {
      if (sorts.length === 0) {
        return dataToSort;
      }
      
      // TODO: 實作實際的排序邏輯
      console.log('Sorting data with sorts:', sorts);
      
      return [...dataToSort].sort((a, b) => {
        for (const sort of sorts) {
          const aValue = a.data[sort.fieldId];
          const bValue = b.data[sort.fieldId];
          
          let comparison = 0;
          if (aValue < bValue) comparison = -1;
          if (aValue > bValue) comparison = 1;
          
          if (comparison !== 0) {
            return sort.direction === 'asc' ? comparison : -comparison;
          }
        }
        return 0;
      });
    },
    enabled: !!dataToSort.length,
    staleTime: 2 * 60 * 1000 // 2 分鐘
  });
};

/**
 * 組合的表格資料 Hook
 */
export const useProcessedTableData = (tableId: string) => {
  const { filterState, sortState } = useTableStore();
  
  const { data: tableData, isLoading: isTableLoading, error: tableError } = useTableData(tableId);
  const { data: filteredData, isLoading: isFilterLoading } = useFilteredTableData(tableId, filterState.filters);
  const { data: sortedData, isLoading: isSortLoading } = useSortedTableData(tableId, sortState.sorts, filteredData);
  
  return {
    table: tableData,
    processedRows: sortedData || filteredData || tableData?.rows || [],
    isLoading: isTableLoading || isFilterLoading || isSortLoading,
    error: tableError
  };
};

/**
 * 儲存格更新 Mutation
 */
export const useCellUpdateMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      tableId, 
      rowId, 
      fieldId, 
      value 
    }: {
      tableId: string;
      rowId: string;
      fieldId: string;
      value: CellValue;
    }) => {
      // TODO: 實作實際的 API 呼叫
      console.log('Updating cell:', { tableId, rowId, fieldId, value });
      
      // 模擬 API 延遲
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return { success: true };
    },
    onSuccess: (_, variables) => {
      // 樂觀更新快取
      queryClient.setQueryData(
        tableQueryKeys.tableData(variables.tableId),
        (oldData: Table | undefined) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            rows: oldData.rows.map(row => 
              row.id === variables.rowId 
                ? {
                    ...row,
                    data: {
                      ...row.data,
                      [variables.fieldId]: variables.value
                    },
                    updatedAt: new Date()
                  }
                : row
            )
          };
        }
      );
    }
  });
};