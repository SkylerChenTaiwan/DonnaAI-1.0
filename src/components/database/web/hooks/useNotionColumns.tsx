/**
 * Notion 風格欄位定義 Hook
 */

import React, { useMemo } from 'react';
import { TanStackTableColumn, ColumnGeneratorProps } from '../../shared/tableTypes';
import { generateColumnsByType } from '../../shared/tableUtils';
import { NotionCheckbox } from '../NotionCheckbox';
import { NotionTableCell } from '../NotionTableCell';

interface UseNotionColumnsProps extends ColumnGeneratorProps {
  includeSelectColumn?: boolean;
}

export const useNotionColumns = ({
  onUpdateCell,
  onColumnsReorder,
  activeTab,
  includeSelectColumn = true }: UseNotionColumnsProps): TanStackTableColumn[] => {
  
  const dataColumns = useMemo(() => {
    const baseColumns = generateColumnsByType(activeTab, onUpdateCell);
    
    // 為每個欄位添加可編輯的 cell 渲染器
    return baseColumns.map((col) => ({
      ...col,
      cell: ({ row, getValue, column }) => {
        const value = getValue();
        const rowId = row.original.id;
        const columnKey = column.id;
        
        // 如果欄位已經有自訂 cell 渲染器，使用它
        if (col.cell && col.id === 'status') {
          return col.cell({ row, getValue, column });
        }
        
        // 否則使用可編輯的儲存格
        return (
          <NotionTableCell
            value={value}
            onChange={onUpdateCell ? (newValue) => onUpdateCell(rowId, columnKey, newValue) : undefined}
            type={getInputType(columnKey)}
            placeholder={`輸入${col.header}`}
          />
        );
      } }));
  }, [activeTab, onUpdateCell]);

  const columns = useMemo(() => {
    const result: TanStackTableColumn[] = [];
    
    // 核取方塊列（始終顯示）
    if (includeSelectColumn) {
      result.push({
        id: 'select',
        header: ({ table }) => (
          <NotionCheckbox
            checked={table.getIsAllRowsSelected()}
            indeterminate={table.getIsSomeRowsSelected()}
            onChange={(checked) => table.toggleAllRowsSelected(checked)}
          />
        ),
        cell: ({ row }) => (
          <NotionCheckbox
            checked={row.getIsSelected()}
            onChange={(checked) => row.toggleSelected(checked)}
          />
        ),
        size: 40,
        enableSorting: false });
    }
    
    // 資料欄位
    result.push(...dataColumns);
    
    return result;
  }, [dataColumns, includeSelectColumn]);

  return columns;
};

/**
 * 根據欄位名稱推斷輸入類型
 */
const getInputType = (columnKey: string): 'text' | 'number' | 'email' | 'phone' | 'multiline' => {
  if (columnKey.includes('email')) return 'email';
  if (columnKey.includes('phone')) return 'phone';
  if (columnKey.includes('amount') || columnKey.includes('price') || columnKey.includes('count')) return 'number';
  if (columnKey.includes('note') || columnKey.includes('description') || columnKey.includes('summary')) return 'multiline';
  return 'text';
};