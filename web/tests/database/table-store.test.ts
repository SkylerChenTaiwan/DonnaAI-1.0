/**
 * PRP-125: 表格狀態管理單元測試
 * 
 * @description 測試表格狀態管理、篩選、排序、編輯狀態等功能
 * @version 1.0.0
 * @date 2025-08-19
 */

import { act, renderHook } from '@testing-library/react';
import { useTableStore, tableQueryKeys } from '../../lib/database/table-store';

import type {
  FilterConfig,
  SortConfig,
  CellReference,
  TableError
} from '../../docs/types/database-table-types';

describe('Table Store', () => {
  
  beforeEach(() => {
    // 重置 store 狀態
    useTableStore.getState().setCurrentTable('');
    useTableStore.getState().clearFilters();
    useTableStore.getState().setSorts([]);
    useTableStore.getState().clearSelection();
    useTableStore.getState().cancelEdit();
  });

  describe('基礎狀態管理', () => {
    
    test('應該設定當前表格 ID', () => {
      const { result } = renderHook(() => useTableStore());
      
      act(() => {
        result.current.setCurrentTable('table-123');
      });
      
      expect(result.current.currentTableId).toBe('table-123');
    });

    test('設定新表格時應該重置其他狀態', () => {
      const { result } = renderHook(() => useTableStore());
      
      // 先設定一些狀態
      act(() => {
        result.current.addFilter({
          id: 'filter-1',
          fieldId: 'name',
          operator: 'contains',
          value: 'test'
        });
        result.current.selectRow('row-1');
        result.current.setCurrentTable('table-123');
      });
      
      // 設定新表格後狀態應該被重置
      act(() => {
        result.current.setCurrentTable('table-456');
      });
      
      expect(result.current.filterState.filters).toHaveLength(0);
      expect(result.current.selectionState.selectedRows.size).toBe(0);
    });

    test('應該設定載入狀態', () => {
      const { result } = renderHook(() => useTableStore());
      
      act(() => {
        result.current.setLoading(true);
      });
      
      expect(result.current.isLoading).toBe(true);
      
      act(() => {
        result.current.setLoading(false);
      });
      
      expect(result.current.isLoading).toBe(false);
    });

    test('應該設定錯誤狀態', () => {
      const { result } = renderHook(() => useTableStore());
      
      const error: TableError = {
        type: 'network',
        message: '網路錯誤',
        recoverable: true
      };
      
      act(() => {
        result.current.setError(error);
      });
      
      expect(result.current.error).toEqual(error);
      
      act(() => {
        result.current.setError(null);
      });
      
      expect(result.current.error).toBeNull();
    });
  });

  describe('篩選狀態管理', () => {
    
    test('應該新增篩選器', () => {
      const { result } = renderHook(() => useTableStore());
      
      const filter: FilterConfig = {
        id: 'filter-1',
        fieldId: 'name',
        operator: 'contains',
        value: 'John'
      };
      
      act(() => {
        result.current.addFilter(filter);
      });
      
      expect(result.current.filterState.filters).toHaveLength(1);
      expect(result.current.filterState.filters[0]).toEqual(filter);
    });

    test('應該移除篩選器', () => {
      const { result } = renderHook(() => useTableStore());
      
      const filter1: FilterConfig = {
        id: 'filter-1',
        fieldId: 'name',
        operator: 'contains',
        value: 'John'
      };
      
      const filter2: FilterConfig = {
        id: 'filter-2',
        fieldId: 'age',
        operator: 'equals',
        value: 25
      };
      
      act(() => {
        result.current.addFilter(filter1);
        result.current.addFilter(filter2);
      });
      
      expect(result.current.filterState.filters).toHaveLength(2);
      
      act(() => {
        result.current.removeFilter('filter-1');
      });
      
      expect(result.current.filterState.filters).toHaveLength(1);
      expect(result.current.filterState.filters[0].id).toBe('filter-2');
    });

    test('應該更新篩選器', () => {
      const { result } = renderHook(() => useTableStore());
      
      const filter: FilterConfig = {
        id: 'filter-1',
        fieldId: 'name',
        operator: 'contains',
        value: 'John'
      };
      
      act(() => {
        result.current.addFilter(filter);
      });
      
      act(() => {
        result.current.updateFilter('filter-1', {
          operator: 'equals',
          value: 'Jane'
        });
      });
      
      const updatedFilter = result.current.filterState.filters[0];
      expect(updatedFilter.operator).toBe('equals');
      expect(updatedFilter.value).toBe('Jane');
      expect(updatedFilter.fieldId).toBe('name'); // 未更新的屬性應該保持
    });

    test('應該清除所有篩選器', () => {
      const { result } = renderHook(() => useTableStore());
      
      act(() => {
        result.current.addFilter({
          id: 'filter-1',
          fieldId: 'name',
          operator: 'contains',
          value: 'John'
        });
        result.current.addFilter({
          id: 'filter-2',
          fieldId: 'age',
          operator: 'equals',
          value: 25
        });
      });
      
      expect(result.current.filterState.filters).toHaveLength(2);
      
      act(() => {
        result.current.clearFilters();
      });
      
      expect(result.current.filterState.filters).toHaveLength(0);
    });
  });

  describe('排序狀態管理', () => {
    
    test('應該設定排序', () => {
      const { result } = renderHook(() => useTableStore());
      
      const sorts: SortConfig[] = [
        { fieldId: 'name', direction: 'asc' },
        { fieldId: 'age', direction: 'desc' }
      ];
      
      act(() => {
        result.current.setSorts(sorts);
      });
      
      expect(result.current.sortState.sorts).toEqual(sorts);
    });

    test('應該新增排序', () => {
      const { result } = renderHook(() => useTableStore());
      
      act(() => {
        result.current.addSort({ fieldId: 'name', direction: 'asc' });
        result.current.addSort({ fieldId: 'age', direction: 'desc' });
      });
      
      expect(result.current.sortState.sorts).toHaveLength(2);
      expect(result.current.sortState.sorts[0].fieldId).toBe('name');
      expect(result.current.sortState.sorts[1].fieldId).toBe('age');
    });

    test('應該移除排序', () => {
      const { result } = renderHook(() => useTableStore());
      
      act(() => {
        result.current.addSort({ fieldId: 'name', direction: 'asc' });
        result.current.addSort({ fieldId: 'age', direction: 'desc' });
      });
      
      expect(result.current.sortState.sorts).toHaveLength(2);
      
      act(() => {
        result.current.removeSort('name');
      });
      
      expect(result.current.sortState.sorts).toHaveLength(1);
      expect(result.current.sortState.sorts[0].fieldId).toBe('age');
    });

    test('應該切換排序狀態', () => {
      const { result } = renderHook(() => useTableStore());
      
      // 第一次切換：新增升序
      act(() => {
        result.current.toggleSort('name');
      });
      
      expect(result.current.sortState.sorts).toHaveLength(1);
      expect(result.current.sortState.sorts[0]).toEqual({
        fieldId: 'name',
        direction: 'asc'
      });
      
      // 第二次切換：改為降序
      act(() => {
        result.current.toggleSort('name');
      });
      
      expect(result.current.sortState.sorts[0].direction).toBe('desc');
      
      // 第三次切換：移除排序
      act(() => {
        result.current.toggleSort('name');
      });
      
      expect(result.current.sortState.sorts).toHaveLength(0);
    });
  });

  describe('編輯狀態管理', () => {
    
    test('應該開始編輯', () => {
      const { result } = renderHook(() => useTableStore());
      
      const cellRef: CellReference = {
        rowId: 'row-1',
        fieldId: 'name',
        rowIndex: 0,
        columnIndex: 0
      };
      
      const originalValue = 'Original Value';
      
      act(() => {
        result.current.startEdit(cellRef, originalValue);
      });
      
      expect(result.current.editingState.editingCell).toEqual(cellRef);
      expect(result.current.editingState.mode).toBe('cell');
      expect(result.current.editingState.originalValue).toBe(originalValue);
      expect(result.current.editingState.currentValue).toBe(originalValue);
      expect(result.current.editingState.hasChanges).toBe(false);
    });

    test('應該更新編輯值', () => {
      const { result } = renderHook(() => useTableStore());
      
      const cellRef: CellReference = {
        rowId: 'row-1',
        fieldId: 'name'
      };
      
      act(() => {
        result.current.startEdit(cellRef, 'Original');
      });
      
      act(() => {
        result.current.updateEditValue('Modified');
      });
      
      expect(result.current.editingState.currentValue).toBe('Modified');
      expect(result.current.editingState.hasChanges).toBe(true);
    });

    test('應該結束編輯', () => {
      const { result } = renderHook(() => useTableStore());
      
      const cellRef: CellReference = {
        rowId: 'row-1',
        fieldId: 'name'
      };
      
      act(() => {
        result.current.startEdit(cellRef, 'Original');
        result.current.updateEditValue('Modified');
      });
      
      expect(result.current.editingState.mode).toBe('cell');
      
      act(() => {
        result.current.endEdit(true);
      });
      
      expect(result.current.editingState.mode).toBe('none');
      expect(result.current.editingState.editingCell).toBeNull();
    });

    test('應該取消編輯', () => {
      const { result } = renderHook(() => useTableStore());
      
      const cellRef: CellReference = {
        rowId: 'row-1',
        fieldId: 'name'
      };
      
      act(() => {
        result.current.startEdit(cellRef, 'Original');
        result.current.updateEditValue('Modified');
      });
      
      expect(result.current.editingState.hasChanges).toBe(true);
      
      act(() => {
        result.current.cancelEdit();
      });
      
      expect(result.current.editingState.mode).toBe('none');
      expect(result.current.editingState.editingCell).toBeNull();
      expect(result.current.editingState.hasChanges).toBe(false);
    });
  });

  describe('選擇狀態管理', () => {
    
    test('應該選擇儲存格', () => {
      const { result } = renderHook(() => useTableStore());
      
      const cellRef: CellReference = {
        rowId: 'row-1',
        fieldId: 'name'
      };
      
      act(() => {
        result.current.selectCell(cellRef);
      });
      
      const expectedKey = `${cellRef.rowId}-${cellRef.fieldId}`;
      expect(result.current.selectionState.selectedCells.has(expectedKey)).toBe(true);
      expect(result.current.selectionState.lastSelection).toEqual(cellRef);
    });

    test('應該選擇列', () => {
      const { result } = renderHook(() => useTableStore());
      
      act(() => {
        result.current.selectRow('row-1');
      });
      
      expect(result.current.selectionState.selectedRows.has('row-1')).toBe(true);
      
      // 測試擴展選擇
      act(() => {
        result.current.selectRow('row-2', true);
      });
      
      expect(result.current.selectionState.selectedRows.has('row-1')).toBe(true);
      expect(result.current.selectionState.selectedRows.has('row-2')).toBe(true);
    });

    test('應該選擇欄位', () => {
      const { result } = renderHook(() => useTableStore());
      
      act(() => {
        result.current.selectColumn('name');
      });
      
      expect(result.current.selectionState.selectedColumns.has('name')).toBe(true);
    });

    test('應該清除選擇', () => {
      const { result } = renderHook(() => useTableStore());
      
      act(() => {
        result.current.selectRow('row-1');
        result.current.selectColumn('name');
        result.current.selectCell({ rowId: 'row-1', fieldId: 'name' });
      });
      
      expect(result.current.selectionState.selectedRows.size).toBe(1);
      expect(result.current.selectionState.selectedColumns.size).toBe(1);
      expect(result.current.selectionState.selectedCells.size).toBe(1);
      
      act(() => {
        result.current.clearSelection();
      });
      
      expect(result.current.selectionState.selectedRows.size).toBe(0);
      expect(result.current.selectionState.selectedColumns.size).toBe(0);
      expect(result.current.selectionState.selectedCells.size).toBe(0);
    });
  });

  describe('UI 狀態管理', () => {
    
    test('應該設定檢視模式', () => {
      const { result } = renderHook(() => useTableStore());
      
      expect(result.current.viewMode).toBe('table');
      
      act(() => {
        result.current.setViewMode('board');
      });
      
      expect(result.current.viewMode).toBe('board');
    });

    test('應該切換側邊欄', () => {
      const { result } = renderHook(() => useTableStore());
      
      expect(result.current.sidebarOpen).toBe(false);
      
      act(() => {
        result.current.toggleSidebar();
      });
      
      expect(result.current.sidebarOpen).toBe(true);
      
      act(() => {
        result.current.toggleSidebar();
      });
      
      expect(result.current.sidebarOpen).toBe(false);
    });
  });

  describe('效能狀態管理', () => {
    
    test('應該設定虛擬滾動偏移', () => {
      const { result } = renderHook(() => useTableStore());
      
      act(() => {
        result.current.setVirtualScrollOffset(100);
      });
      
      expect(result.current.virtualScrollOffset).toBe(100);
    });

    test('應該設定可見列範圍', () => {
      const { result } = renderHook(() => useTableStore());
      
      const range = { start: 10, end: 60 };
      
      act(() => {
        result.current.setVisibleRowRange(range);
      });
      
      expect(result.current.visibleRowRange).toEqual(range);
    });
  });

  describe('Query Keys', () => {
    
    test('應該生成正確的查詢鍵', () => {
      expect(tableQueryKeys.all).toEqual(['tables']);
      expect(tableQueryKeys.table('table-1')).toEqual(['tables', 'table-1']);
      expect(tableQueryKeys.tableData('table-1')).toEqual(['tables', 'table-1', 'data']);
      expect(tableQueryKeys.tableSchema('table-1')).toEqual(['tables', 'table-1', 'schema']);
    });

    test('應該為篩選資料生成正確的查詢鍵', () => {
      const filters: FilterConfig[] = [
        { id: 'filter-1', fieldId: 'name', operator: 'contains', value: 'test' }
      ];
      
      const key = tableQueryKeys.filteredData('table-1', filters);
      expect(key).toEqual(['tables', 'table-1', 'filtered', filters]);
    });

    test('應該為排序資料生成正確的查詢鍵', () => {
      const sorts: SortConfig[] = [
        { fieldId: 'name', direction: 'asc' }
      ];
      
      const key = tableQueryKeys.sortedData('table-1', sorts);
      expect(key).toEqual(['tables', 'table-1', 'sorted', sorts]);
    });
  });

  describe('邊界條件測試', () => {
    
    test('應該處理不存在的篩選器移除', () => {
      const { result } = renderHook(() => useTableStore());
      
      expect(() => {
        act(() => {
          result.current.removeFilter('non-existent');
        });
      }).not.toThrow();
      
      expect(result.current.filterState.filters).toHaveLength(0);
    });

    test('應該處理不存在的排序移除', () => {
      const { result } = renderHook(() => useTableStore());
      
      expect(() => {
        act(() => {
          result.current.removeSort('non-existent');
        });
      }).not.toThrow();
      
      expect(result.current.sortState.sorts).toHaveLength(0);
    });

    test('應該處理大量篩選器', () => {
      const { result } = renderHook(() => useTableStore());
      
      // 新增 1000 個篩選器
      for (let i = 0; i < 1000; i++) {
        act(() => {
          result.current.addFilter({
            id: `filter-${i}`,
            fieldId: `field-${i}`,
            operator: 'equals',
            value: `value-${i}`
          });
        });
      }
      
      expect(result.current.filterState.filters).toHaveLength(1000);
      
      // 清除應該能正常工作
      act(() => {
        result.current.clearFilters();
      });
      
      expect(result.current.filterState.filters).toHaveLength(0);
    });
  });
});