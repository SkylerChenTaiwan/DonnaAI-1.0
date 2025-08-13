/**
 * Notion 資料庫過濾管理器
 * 處理複雜的過濾邏輯，支援嵌套過濾組和 AND/OR 邏輯
 */

import { useMemo } from 'react';
import { 
  Filter, 
  FilterGroup, 
  FilterOperator, 
  TableData, 
  ColumnConfig,
  FilterManagerOptions 
} from '../types';

export class FilterManager {
  private options: FilterManagerOptions;

  constructor(options: FilterManagerOptions = {}) {
    this.options = {
      enableNestedGroups: true,
      maxNestingLevel: 2,
      debugMode: false,
      ...options };
  }

  /**
   * 對資料應用過濾條件
   */
  public applyFilters(data: TableData[], filters: FilterGroup): TableData[] {
    if (!filters.filters.length) {
      return data;
    }

    const startTime = this.options.debugMode ? performance.now() : 0;
    
    const filteredData = data.filter(row => 
      this.evaluateFilterGroup(row, filters, 0)
    );

    if (this.options.debugMode) {
      const endTime = performance.now();
      console.log(`🔍 FilterManager: 過濾 ${data.length} 筆資料至 ${filteredData.length} 筆，耗時 ${(endTime - startTime).toFixed(2)}ms`);
    }

    return filteredData;
  }

  /**
   * 評估過濾組是否通過
   */
  private evaluateFilterGroup(row: TableData, group: FilterGroup, nestingLevel: number): boolean {
    if (nestingLevel > this.options.maxNestingLevel) {
      console.warn('FilterManager: 超過最大嵌套層級，跳過過濾');
      return true;
    }

    const results = group.filters.map(filter => {
      if ('filters' in filter) {
        // 遞迴處理嵌套組
        return this.evaluateFilterGroup(row, filter as FilterGroup, nestingLevel + 1);
      }
      return this.evaluateFilter(row, filter as Filter);
    });

    return group.operator === 'and' 
      ? results.every(r => r)
      : results.some(r => r);
  }

  /**
   * 評估單一過濾條件是否通過
   */
  private evaluateFilter(row: TableData, filter: Filter): boolean {
    if (!filter.isActive) {
      return true;
    }

    const value = row[filter.columnKey];
    
    try {
      return this.applyOperator(value, filter.operator, filter.value);
    } catch (error) {
      console.error('FilterManager: 過濾條件評估錯誤', { filter, error });
      return true; // 發生錯誤時讓資料通過
    }
  }

  /**
   * 應用過濾操作符
   */
  private applyOperator(rowValue: any, operator: FilterOperator, filterValue: any): boolean {
    switch (operator) {
      // 等值比較
      case 'equals':
        return this.normalizeValue(rowValue) === this.normalizeValue(filterValue);
      
      case 'not_equals':
        return this.normalizeValue(rowValue) !== this.normalizeValue(filterValue);

      // 文字操作
      case 'contains':
        return this.safeStringIncludes(rowValue, filterValue);
      
      case 'not_contains':
        return !this.safeStringIncludes(rowValue, filterValue);
      
      case 'starts_with':
        return this.safeString(rowValue).toLowerCase()
          .startsWith(this.safeString(filterValue).toLowerCase());
      
      case 'ends_with':
        return this.safeString(rowValue).toLowerCase()
          .endsWith(this.safeString(filterValue).toLowerCase());

      // 空值檢查
      case 'is_empty':
        return this.isEmpty(rowValue);
      
      case 'is_not_empty':
        return !this.isEmpty(rowValue);

      // 數字比較
      case 'greater_than':
        return this.safeNumber(rowValue) > this.safeNumber(filterValue);
      
      case 'less_than':
        return this.safeNumber(rowValue) < this.safeNumber(filterValue);
      
      case 'greater_than_or_equal':
        return this.safeNumber(rowValue) >= this.safeNumber(filterValue);
      
      case 'less_than_or_equal':
        return this.safeNumber(rowValue) <= this.safeNumber(filterValue);

      // 日期比較
      case 'date_is':
        return this.isSameDay(rowValue, filterValue);
      
      case 'date_before':
        return this.safeDate(rowValue) < this.safeDate(filterValue);
      
      case 'date_after':
        return this.safeDate(rowValue) > this.safeDate(filterValue);

      // 布林值
      case 'checkbox_checked':
        return Boolean(rowValue) === true;
      
      case 'checkbox_unchecked':
        return Boolean(rowValue) === false;

      // 選項
      case 'select_is':
        return this.normalizeValue(rowValue) === this.normalizeValue(filterValue);
      
      case 'select_is_not':
        return this.normalizeValue(rowValue) !== this.normalizeValue(filterValue);

      // 多選
      case 'multi_select_contains':
        return this.arrayContains(rowValue, filterValue);
      
      case 'multi_select_not_contains':
        return !this.arrayContains(rowValue, filterValue);

      default:
        console.warn('FilterManager: 未知的過濾操作符', operator);
        return true;
    }
  }

  // === 輔助方法 ===

  private normalizeValue(value: any): string {
    if (value == null) return '';
    return String(value).toLowerCase().trim();
  }

  private safeString(value: any): string {
    if (value == null) return '';
    return String(value);
  }

  private safeStringIncludes(rowValue: any, filterValue: any): boolean {
    return this.safeString(rowValue).toLowerCase()
      .includes(this.safeString(filterValue).toLowerCase());
  }

  private safeNumber(value: any): number {
    if (value == null) return 0;
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  }

  private safeDate(value: any): Date {
    if (value == null) return new Date(0);
    if (value instanceof Date) return value;
    const date = new Date(value);
    return isNaN(date.getTime()) ? new Date(0) : date;
  }

  private isSameDay(date1: any, date2: any): boolean {
    const d1 = this.safeDate(date1);
    const d2 = this.safeDate(date2);
    return d1.toDateString() === d2.toDateString();
  }

  private isEmpty(value: any): boolean {
    if (value == null) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }

  private arrayContains(array: any, value: any): boolean {
    if (!Array.isArray(array)) return false;
    const normalizedValue = this.normalizeValue(value);
    return array.some(item => this.normalizeValue(item) === normalizedValue);
  }

  /**
   * 驗證過濾組結構
   */
  public validateFilterGroup(group: FilterGroup): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!group.id) {
      errors.push('過濾組必須有 ID');
    }

    if (!['and', 'or'].includes(group.operator)) {
      errors.push('過濾組操作符必須是 and 或 or');
    }

    if (!Array.isArray(group.filters)) {
      errors.push('過濾組必須包含 filters 陣列');
    }

    // 遞迴驗證子過濾條件
    group.filters.forEach((filter, index) => {
      if ('filters' in filter) {
        const subValidation = this.validateFilterGroup(filter as FilterGroup);
        if (!subValidation.isValid) {
          errors.push(`子過濾組 ${index}: ${subValidation.errors.join(', ')}`);
        }
      } else {
        const filterValidation = this.validateFilter(filter as Filter);
        if (!filterValidation.isValid) {
          errors.push(`過濾條件 ${index}: ${filterValidation.errors.join(', ')}`);
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors };
  }

  /**
   * 驗證單一過濾條件
   */
  public validateFilter(filter: Filter): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!filter.id) {
      errors.push('過濾條件必須有 ID');
    }

    if (!filter.columnKey) {
      errors.push('過濾條件必須指定欄位');
    }

    if (!filter.operator) {
      errors.push('過濾條件必須指定操作符');
    }

    return {
      isValid: errors.length === 0,
      errors };
  }

  /**
   * 取得適用於特定欄位類型的操作符
   */
  public getOperatorsForColumnType(columnType: string): FilterOperator[] {
    const baseOperators: FilterOperator[] = ['equals', 'not_equals', 'is_empty', 'is_not_empty'];

    switch (columnType) {
      case 'text':
      case 'email':
      case 'url':
      case 'phone':
        return [
          ...baseOperators,
          'contains', 'not_contains', 'starts_with', 'ends_with'
        ];

      case 'number':
        return [
          ...baseOperators,
          'greater_than', 'less_than', 'greater_than_or_equal', 'less_than_or_equal'
        ];

      case 'date':
        return [
          ...baseOperators,
          'date_is', 'date_before', 'date_after'
        ];

      case 'checkbox':
        return ['checkbox_checked', 'checkbox_unchecked'];

      case 'select':
        return ['select_is', 'select_is_not', 'is_empty', 'is_not_empty'];

      case 'multiselect':
      case 'tags':
        return [
          'multi_select_contains', 'multi_select_not_contains', 'is_empty', 'is_not_empty'
        ];

      default:
        return baseOperators;
    }
  }
}

/**
 * React Hook 用於使用過濾管理器
 */
export function useFilterManager(
  data: TableData[], 
  filters: FilterGroup,
  options?: FilterManagerOptions
): TableData[] {
  const filterManager = useMemo(
    () => new FilterManager(options),
    [options?.enableNestedGroups, options?.maxNestingLevel, options?.debugMode]
  );

  return useMemo(
    () => filterManager.applyFilters(data, filters),
    [data, filters, filterManager]
  );
}

/**
 * 建立預設空的過濾組
 */
export function createEmptyFilterGroup(): FilterGroup {
  return {
    id: `group_${Date.now()}`,
    operator: 'and',
    filters: [] };
}

/**
 * 建立新的過濾條件
 */
export function createFilter(
  columnKey: string, 
  operator: FilterOperator, 
  value: any = ''
): Filter {
  return {
    id: `filter_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    columnKey,
    operator,
    value,
    isActive: true };
}