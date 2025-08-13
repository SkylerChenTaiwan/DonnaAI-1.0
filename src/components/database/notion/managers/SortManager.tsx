/**
 * Notion 資料庫排序管理器
 * 處理多層排序、穩定排序和空值處理
 */

import { useMemo } from 'react';
import { Sort, TableData, SortManagerOptions, ColumnConfig } from '../types';

export class SortManager {
  private options: SortManagerOptions;

  constructor(options: SortManagerOptions = {}) {
    this.options = {
      preserveGrouping: false,
      nullsFirst: false,
      stableSort: true,
      ...options };
  }

  /**
   * 對資料應用排序
   */
  public applySorts(data: TableData[], sorts: Sort[]): TableData[] {
    if (!sorts.length) {
      return data;
    }

    const startTime = this.options.preserveGrouping ? performance.now() : 0;
    
    // 複製陣列避免修改原始資料
    const sortedData = [...data];
    
    // 如果啟用穩定排序，為每個項目添加原始索引
    if (this.options.stableSort) {
      sortedData.forEach((item, index) => {
        if (!item._originalIndex) {
          item._originalIndex = index;
        }
      });
    }

    // 按優先級排序規則（數字越小優先級越高）
    const sortedSorts = [...sorts].sort((a, b) => a.priority - b.priority);
    
    // 執行多層排序
    const result = sortedData.sort((a, b) => {
      return this.compareRows(a, b, sortedSorts);
    });

    // 清理臨時屬性
    if (this.options.stableSort) {
      result.forEach(item => {
        delete item._originalIndex;
      });
    }

    if (this.options.preserveGrouping && startTime) {
      const endTime = performance.now();
      console.log(`📊 SortManager: 排序 ${data.length} 筆資料，耗時 ${(endTime - startTime).toFixed(2)}ms`);
    }

    return result;
  }

  /**
   * 比較兩個行資料
   */
  private compareRows(a: TableData, b: TableData, sorts: Sort[]): number {
    for (const sort of sorts) {
      const aVal = a[sort.columnKey];
      const bVal = b[sort.columnKey];
      
      const comparison = this.compareValues(aVal, bVal, sort);
      
      if (comparison !== 0) {
        return comparison;
      }
    }
    
    // 如果所有排序欄位相等，使用穩定排序
    if (this.options.stableSort && a._originalIndex !== undefined && b._originalIndex !== undefined) {
      return a._originalIndex - b._originalIndex;
    }
    
    return 0;
  }

  /**
   * 比較兩個值
   */
  private compareValues(aVal: any, bVal: any, sort: Sort): number {
    // 處理空值
    const aNull = this.isNullish(aVal);
    const bNull = this.isNullish(bVal);
    
    if (aNull && bNull) return 0;
    if (aNull) return this.options.nullsFirst ? -1 : 1;
    if (bNull) return this.options.nullsFirst ? 1 : -1;

    // 根據值類型進行比較
    let comparison = 0;
    
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      // 字串比較 - 使用本地化比較
      comparison = aVal.localeCompare(bVal, 'zh-TW', { 
        numeric: true, 
        sensitivity: 'base' 
      });
    } else if (aVal instanceof Date && bVal instanceof Date) {
      // 日期比較
      comparison = aVal.getTime() - bVal.getTime();
    } else if (typeof aVal === 'number' && typeof bVal === 'number') {
      // 數字比較
      comparison = aVal - bVal;
    } else if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
      // 布林值比較 - true > false
      comparison = Number(bVal) - Number(aVal);
    } else {
      // 混合類型 - 轉換為字串比較
      const aStr = this.valueToString(aVal);
      const bStr = this.valueToString(bVal);
      comparison = aStr.localeCompare(bStr, 'zh-TW', { 
        numeric: true, 
        sensitivity: 'base' 
      });
    }
    
    // 應用排序方向
    return sort.direction === 'asc' ? comparison : -comparison;
  }

  /**
   * 檢查值是否為空值
   */
  private isNullish(value: any): boolean {
    return value === null || value === undefined || value === '';
  }

  /**
   * 將值轉換為字串用於比較
   */
  private valueToString(value: any): string {
    if (this.isNullish(value)) return '';
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'object') {
      // 處理陣列和物件
      if (Array.isArray(value)) {
        return value.map(v => this.valueToString(v)).join(', ');
      }
      return JSON.stringify(value);
    }
    return String(value);
  }

  /**
   * 驗證排序設定
   */
  public validateSorts(sorts: Sort[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 檢查重複的欄位
    const columnKeys = sorts.map(s => s.columnKey);
    const uniqueKeys = new Set(columnKeys);
    if (columnKeys.length !== uniqueKeys.size) {
      errors.push('排序規則中有重複的欄位');
    }

    // 檢查優先級
    const priorities = sorts.map(s => s.priority);
    const uniquePriorities = new Set(priorities);
    if (priorities.length !== uniquePriorities.size) {
      errors.push('排序規則中有重複的優先級');
    }

    // 檢查每個排序規則
    sorts.forEach((sort, index) => {
      const sortErrors = this.validateSort(sort);
      if (!sortErrors.isValid) {
        errors.push(`排序規則 ${index + 1}: ${sortErrors.errors.join(', ')}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors };
  }

  /**
   * 驗證單一排序規則
   */
  public validateSort(sort: Sort): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!sort.columnKey) {
      errors.push('必須指定排序欄位');
    }

    if (!['asc', 'desc'].includes(sort.direction)) {
      errors.push('排序方向必須是 asc 或 desc');
    }

    if (typeof sort.priority !== 'number' || sort.priority < 0) {
      errors.push('優先級必須是非負整數');
    }

    return {
      isValid: errors.length === 0,
      errors };
  }

  /**
   * 取得欄位的預設排序方向
   */
  public getDefaultSortDirection(columnType: string): 'asc' | 'desc' {
    switch (columnType) {
      case 'date':
        return 'desc'; // 日期預設最新在前
      case 'number':
        return 'desc'; // 數字預設大到小
      case 'checkbox':
        return 'desc'; // 布林值預設 true 在前
      default:
        return 'asc'; // 文字等其他類型預設升序
    }
  }

  /**
   * 切換排序方向
   */
  public toggleSortDirection(direction: 'asc' | 'desc'): 'asc' | 'desc' {
    return direction === 'asc' ? 'desc' : 'asc';
  }

  /**
   * 添加或更新排序規則
   */
  public addOrUpdateSort(sorts: Sort[], columnKey: string, direction?: 'asc' | 'desc'): Sort[] {
    const existingIndex = sorts.findIndex(s => s.columnKey === columnKey);
    
    if (existingIndex !== -1) {
      // 更新現有排序
      const newSorts = [...sorts];
      newSorts[existingIndex] = {
        ...newSorts[existingIndex],
        direction: direction || this.toggleSortDirection(newSorts[existingIndex].direction) };
      return newSorts;
    } else {
      // 添加新排序
      const newPriority = sorts.length > 0 ? Math.max(...sorts.map(s => s.priority)) + 1 : 0;
      return [
        ...sorts,
        {
          columnKey,
          direction: direction || 'asc',
          priority: newPriority },
      ];
    }
  }

  /**
   * 移除排序規則
   */
  public removeSort(sorts: Sort[], columnKey: string): Sort[] {
    return sorts
      .filter(s => s.columnKey !== columnKey)
      .map((s, index) => ({ ...s, priority: index })); // 重新分配優先級
  }

  /**
   * 更新排序優先級
   */
  public updateSortPriority(sorts: Sort[], columnKey: string, newPriority: number): Sort[] {
    const targetSort = sorts.find(s => s.columnKey === columnKey);
    if (!targetSort) return sorts;

    // 移除目標排序
    const otherSorts = sorts.filter(s => s.columnKey !== columnKey);
    
    // 在新位置插入
    const newSorts = [
      ...otherSorts.slice(0, newPriority),
      targetSort,
      ...otherSorts.slice(newPriority),
    ];

    // 重新分配優先級
    return newSorts.map((sort, index) => ({
      ...sort,
      priority: index }));
  }

  /**
   * 清除所有排序規則
   */
  public clearSorts(): Sort[] {
    return [];
  }
}

/**
 * React Hook 用於使用排序管理器
 */
export function useSortManager(
  data: TableData[], 
  sorts: Sort[],
  options?: SortManagerOptions
): TableData[] {
  const sortManager = useMemo(
    () => new SortManager(options),
    [options?.preserveGrouping, options?.nullsFirst, options?.stableSort]
  );

  return useMemo(
    () => sortManager.applySorts(data, sorts),
    [data, sorts, sortManager]
  );
}

/**
 * 建立新的排序規則
 */
export function createSort(
  columnKey: string, 
  direction: 'asc' | 'desc' = 'asc', 
  priority: number = 0
): Sort {
  return {
    columnKey,
    direction,
    priority };
}

/**
 * 從欄位點擊產生排序規則
 */
export function createSortFromColumnClick(
  currentSorts: Sort[],
  columnKey: string,
  columns: ColumnConfig[]
): Sort[] {
  const sortManager = new SortManager();
  const column = columns.find(col => col.key === columnKey);
  const defaultDirection = column 
    ? sortManager.getDefaultSortDirection(column.type)
    : 'asc';

  return sortManager.addOrUpdateSort(currentSorts, columnKey, defaultDirection);
}

/**
 * 取得欄位當前的排序狀態
 */
export function getColumnSortState(
  sorts: Sort[], 
  columnKey: string
): { isSorted: boolean; direction?: 'asc' | 'desc'; priority?: number } {
  const sort = sorts.find(s => s.columnKey === columnKey);
  
  if (!sort) {
    return { isSorted: false };
  }

  return {
    isSorted: true,
    direction: sort.direction,
    priority: sort.priority };
}