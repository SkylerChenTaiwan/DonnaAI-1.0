/**
 * 共用表格工具函數
 */

import React from 'react';
import { TanStackTableColumn, TableData } from './tableTypes';
import { TableColumn } from '@/types/table';

/**
 * 將現有的 TableColumn 轉換為 TanStack Table 格式
 */
export const convertToTanStackColumns = (
  columns: TableColumn[],
  onUpdateCell?: (rowId: string, columnKey: string, value: any) => void | Promise<void>
): TanStackTableColumn[] => {
  return columns.map((col) => ({
    id: col.key,
    accessorKey: col.key,
    header: col.title,
    size: col.width,
    enableSorting: col.sortable || false,
    cell: ({ row, getValue }) => {
      const value = getValue();
      
      // 如果有自訂 render 函數，使用它
      if (col.render) {
        return col.render(value, row.original);
      }
      
      // 簡單顯示值，可編輯功能由上層組件處理
      
      // 否則顯示原始值
      return value || '-';
    } }));
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

/**
 * 生成客戶資料的欄位定義
 */
export const generateCustomerColumns = (
  onUpdateCell?: (rowId: string, columnKey: string, value: any) => void | Promise<void>
): TanStackTableColumn[] => {
  return [
    {
      id: 'name',
      accessorKey: 'name',
      header: '姓名',
      enableSorting: true },
    {
      id: 'company',
      accessorKey: 'company',
      header: '公司',
      enableSorting: true },
    {
      id: 'phone',
      accessorKey: 'phone',
      header: '電話',
      enableSorting: true },
    {
      id: 'tags',
      accessorKey: 'tags',
      header: '標籤',
      enableSorting: true,
      cell: ({ getValue }) => {
        const tags = getValue();
        return Array.isArray(tags) ? tags.join(', ') : (tags || '-');
      } },
  ];
};

/**
 * 生成紀錄資料的欄位定義
 */
export const generateRecordColumns = (
  onUpdateCell?: (rowId: string, columnKey: string, value: any) => void | Promise<void>
): TanStackTableColumn[] => {
  return [
    {
      id: 'type',
      accessorKey: 'type',
      header: '類型',
      enableSorting: true,
      cell: ({ getValue }) => {
        const type = getValue();
        return type === 'meeting' ? '會議' : '通話';
      } },
    {
      id: 'customerName',
      accessorKey: 'customerName',
      header: '客戶',
      enableSorting: true },
    {
      id: 'date',
      accessorKey: 'date',
      header: '日期',
      enableSorting: true },
    {
      id: 'summary',
      accessorKey: 'summary',
      header: '摘要',
      enableSorting: true },
  ];
};

/**
 * 生成任務資料的欄位定義
 */
export const generateTaskColumns = (
  onUpdateCell?: (rowId: string, columnKey: string, value: any) => void | Promise<void>
): TanStackTableColumn[] => {
  return [
    {
      id: 'title',
      accessorKey: 'title',
      header: '標題',
      enableSorting: true },
    {
      id: 'assignee',
      accessorKey: 'assignee',
      header: '負責人',
      enableSorting: true },
    {
      id: 'dueDate',
      accessorKey: 'dueDate',
      header: '到期日',
      enableSorting: true },
    {
      id: 'status',
      accessorKey: 'status',
      header: '狀態',
      enableSorting: true,
      cell: ({ getValue }) => {
        const status = getValue();
        const statusText = status === 'completed' ? '已完成' : 
                          status === 'todo' ? '待開始' : 
                          status || '未知';
        
        const statusStyle = getStatusStyle(status);
        
        return (
          <div style={{
            backgroundColor: statusStyle.backgroundColor,
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '12px',
            fontWeight: '500',
            color: '#37352f',
            display: 'inline-block'
          }}>
            {statusText}
          </div>
        );
      } },
  ];
};

/**
 * 取得狀態樣式
 */
const getStatusStyle = (status: string) => {
  switch (status) {
    case 'completed':
      return { backgroundColor: '#E3F2E6' };
    case 'in_progress':
      return { backgroundColor: '#E8F0FF' };
    case 'cancelled':
      return { backgroundColor: '#FFE5E5' };
    default:
      return { backgroundColor: '#FEF3E2' };
  }
};

/**
 * 根據資料類型生成對應的欄位
 */
export const generateColumnsByType = (
  type: 'customers' | 'records' | 'tasks',
  onUpdateCell?: (rowId: string, columnKey: string, value: any) => void | Promise<void>
): TanStackTableColumn[] => {
  switch (type) {
    case 'customers':
      return generateCustomerColumns(onUpdateCell);
    case 'records':
      return generateRecordColumns(onUpdateCell);
    case 'tasks':
      return generateTaskColumns(onUpdateCell);
    default:
      return [];
  }
};

/**
 * 格式化儲存格值顯示
 */
export const formatCellValue = (value: any, columnKey: string): string => {
  if (value === null || value === undefined) {
    return '-';
  }
  
  // 處理陣列（如標籤）
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  
  // 處理日期
  if (columnKey.includes('date') || columnKey.includes('Date')) {
    if (value.seconds) {
      return new Date(value.seconds * 1000).toLocaleDateString('zh-TW');
    }
    if (value instanceof Date) {
      return value.toLocaleDateString('zh-TW');
    }
  }
  
  return String(value);
};

/**
 * 驗證儲存格值
 */
export const validateCellValue = (value: any, columnKey: string, type: string): boolean => {
  // 基本驗證規則
  if (columnKey === 'email' && value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }
  
  if (columnKey === 'phone' && value) {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(value);
  }
  
  return true;
};