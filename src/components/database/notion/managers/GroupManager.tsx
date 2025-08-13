/**
 * Notion 資料庫群組管理器
 * 處理資料分組、群組折疊和拖放排序
 */

import { useMemo } from 'react';
import { 
  TableData, 
  ColumnConfig, 
  GroupConfig,
  GroupManagerOptions 
} from '../types';

export interface GroupResult {
  groupKey: string;
  groupValue: any;
  label: string;
  items: TableData[];
  count: number;
  collapsed: boolean;
}

export class GroupManager {
  private options: GroupManagerOptions;

  constructor(options: GroupManagerOptions = {}) {
    this.options = {
      showEmptyGroups: true,
      sortGroups: true,
      ...options };
  }

  /**
   * 對資料進行分組
   */
  public groupData(
    data: TableData[], 
    groupConfig: GroupConfig | null,
    columns: ColumnConfig[]
  ): GroupResult[] {
    if (!groupConfig || !groupConfig.columnKey) {
      // 沒有分組設定時，返回單一群組
      return [{
        groupKey: '_all',
        groupValue: null,
        label: '所有項目',
        items: data,
        count: data.length,
        collapsed: false }];
    }

    const column = columns.find(col => col.key === groupConfig.columnKey);
    if (!column) {
      console.warn('找不到分組欄位:', groupConfig.columnKey);
      return [{
        groupKey: '_all',
        groupValue: null,
        label: '所有項目',
        items: data,
        count: data.length,
        collapsed: false }];
    }

    // 建立分組映射
    const groups = new Map<string, TableData[]>();
    const groupLabels = new Map<string, string>();

    // 根據欄位類型處理分組
    data.forEach(row => {
      const value = row[groupConfig.columnKey];
      const groupKey = this.getGroupKey(value, column.type);
      const groupLabel = this.getGroupLabel(value, column);

      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
        groupLabels.set(groupKey, groupLabel);
      }

      groups.get(groupKey)!.push(row);
    });

    // 如果需要顯示空群組，添加選項中沒有資料的群組
    if (this.options.showEmptyGroups && column.options) {
      column.options.forEach(option => {
        const groupKey = this.getGroupKey(option.value, column.type);
        if (!groups.has(groupKey)) {
          groups.set(groupKey, []);
          groupLabels.set(groupKey, option.label || option.value);
        }
      });
    }

    // 轉換為結果陣列
    const results: GroupResult[] = Array.from(groups.entries()).map(([groupKey, items]) => ({
      groupKey,
      groupValue: this.parseGroupValue(groupKey),
      label: groupLabels.get(groupKey) || groupKey,
      items,
      count: items.length,
      collapsed: groupConfig.collapsedGroups?.includes(groupKey) || false }));

    // 排序群組
    if (this.options.sortGroups) {
      results.sort((a, b) => {
        // 優先按自訂順序排序
        if (groupConfig.groupOrder) {
          const aIndex = groupConfig.groupOrder.indexOf(a.groupKey);
          const bIndex = groupConfig.groupOrder.indexOf(b.groupKey);
          if (aIndex !== -1 && bIndex !== -1) {
            return aIndex - bIndex;
          }
          if (aIndex !== -1) return -1;
          if (bIndex !== -1) return 1;
        }

        // 否則按標籤排序
        return a.label.localeCompare(b.label, 'zh-TW');
      });
    }

    return results;
  }

  /**
   * 取得群組鍵值
   */
  private getGroupKey(value: any, columnType: string): string {
    if (value === null || value === undefined || value === '') {
      return '_empty';
    }

    switch (columnType) {
      case 'date':
        // 按日期分組（按天）
        if (value instanceof Date) {
          return value.toISOString().split('T')[0];
        }
        return new Date(value).toISOString().split('T')[0];

      case 'checkbox':
        return value ? 'checked' : 'unchecked';

      case 'multiselect':
      case 'tags':
        // 多選欄位每個值都創建一個群組
        if (Array.isArray(value) && value.length > 0) {
          return value.join(',');
        }
        return '_empty';

      default:
        return String(value);
    }
  }

  /**
   * 取得群組標籤
   */
  private getGroupLabel(value: any, column: ColumnConfig): string {
    if (value === null || value === undefined || value === '') {
      return '(空白)';
    }

    switch (column.type) {
      case 'date':
        // 格式化日期
        const date = value instanceof Date ? value : new Date(value);
        return date.toLocaleDateString('zh-TW');

      case 'checkbox':
        return value ? '已勾選' : '未勾選';

      case 'select':
        // 從選項中找到對應的標籤
        const option = column.options?.find(opt => opt.value === value);
        return option?.label || String(value);

      case 'multiselect':
      case 'tags':
        if (Array.isArray(value) && value.length > 0) {
          return value.map(v => {
            const opt = column.options?.find(o => o.value === v);
            return opt?.label || v;
          }).join(', ');
        }
        return '(空白)';

      default:
        return String(value);
    }
  }

  /**
   * 解析群組值
   */
  private parseGroupValue(groupKey: string): any {
    if (groupKey === '_empty') return null;
    if (groupKey === '_all') return null;
    if (groupKey === 'checked') return true;
    if (groupKey === 'unchecked') return false;
    return groupKey;
  }

  /**
   * 切換群組折疊狀態
   */
  public toggleGroupCollapse(
    groupConfig: GroupConfig,
    groupKey: string
  ): GroupConfig {
    const collapsedGroups = groupConfig.collapsedGroups || [];
    const isCollapsed = collapsedGroups.includes(groupKey);

    return {
      ...groupConfig,
      collapsedGroups: isCollapsed
        ? collapsedGroups.filter(key => key !== groupKey)
        : [...collapsedGroups, groupKey] };
  }

  /**
   * 更新群組順序
   */
  public updateGroupOrder(
    groupConfig: GroupConfig,
    newOrder: string[]
  ): GroupConfig {
    return {
      ...groupConfig,
      groupOrder: newOrder };
  }

  /**
   * 驗證分組設定
   */
  public validateGroupConfig(
    groupConfig: GroupConfig,
    columns: ColumnConfig[]
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!groupConfig.columnKey) {
      errors.push('必須選擇分組欄位');
    } else {
      const column = columns.find(col => col.key === groupConfig.columnKey);
      if (!column) {
        errors.push('分組欄位不存在');
      }
    }

    return {
      isValid: errors.length === 0,
      errors };
  }

  /**
   * 取得適合分組的欄位
   */
  public getGroupableColumns(columns: ColumnConfig[]): ColumnConfig[] {
    // 排除不適合分組的欄位類型
    const excludedTypes = ['file', 'url', 'email', 'phone'];
    
    return columns.filter(col => 
      !excludedTypes.includes(col.type) &&
      col.key !== 'id' // 排除 ID 欄位
    );
  }
}

/**
 * React Hook 用於使用群組管理器
 */
export function useGroupManager(
  data: TableData[],
  groupConfig: GroupConfig | null,
  columns: ColumnConfig[],
  options?: GroupManagerOptions
): GroupResult[] {
  const groupManager = useMemo(
    () => new GroupManager(options),
    [options?.showEmptyGroups, options?.sortGroups]
  );

  return useMemo(
    () => groupManager.groupData(data, groupConfig, columns),
    [data, groupConfig, columns, groupManager]
  );
}

/**
 * 建立預設的群組設定
 */
export function createGroupConfig(columnKey: string = ''): GroupConfig {
  return {
    columnKey,
    collapsedGroups: [],
    groupOrder: [] };
}