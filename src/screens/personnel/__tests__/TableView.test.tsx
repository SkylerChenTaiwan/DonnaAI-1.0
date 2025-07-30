/**
 * TableView 測試
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TableView } from '../TableView';
import { TeamMember } from '../PersonnelScreen';
import { describe, it, expect, vi } from 'vitest';

// Mock DataTable component
vi.mock('@/components/common/DataTable', () => ({
  DataTable: jest.fn(({ data, onRowPress, showCheckboxes }) => (
    <div testID="data-table">
      {data.map((item: any) => (
        <div key={item.id} testID={`row-${item.id}`} onPress={() => onRowPress?.(item)}>
          {item.name}
          {showCheckboxes && <div testID={`checkbox-${item.id}`} />}
        </div>
      ))}
    </div>
  )),
}));

// Mock 其他組件
vi.mock('@/components/personnel/StatusIndicator', () => ({
  StatusIndicator: jest.fn(() => <div testID="status-indicator" />),
}));

vi.mock('@/components/personnel/PermissionBadge', () => ({
  PermissionBadge: jest.fn(() => <div testID="permission-badge" />),
}));

const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    name: '張三',
    email: 'zhang@example.com',
    role: 'manager',
    department: '業務部',
    status: 'active',
    joinDate: new Date('2023-01-01'),
    performance: {
      meetings: 10,
      customers: 20,
      deals: 5,
    },
  },
  {
    id: '2',
    name: '李四',
    email: 'li@example.com',
    role: 'salesperson',
    department: '業務部',
    status: 'active',
    joinDate: new Date('2023-06-01'),
    performance: {
      meetings: 5,
      customers: 10,
      deals: 2,
    },
  },
];

describe('TableView with Toolbar', () => {
  const defaultProps = {
    teamMembers: mockTeamMembers,
    searchQuery: '',
    refreshing: false,
    onRefresh: vi.fn(),
  };

  it('應該顯示工具列而非統計列', () => {
    const { queryByText } = render(<TableView {...defaultProps} />);
    
    // 統計列不應存在
    expect(queryByText('總人數')).toBeNull();
    expect(queryByText('在職')).toBeNull();
    expect(queryByText('請假')).toBeNull();
    expect(queryByText('線上')).toBeNull();
  });

  it('應該正確顯示團隊成員資料', () => {
    const { getByTestId } = render(<TableView {...defaultProps} />);
    
    // 檢查 DataTable 是否被渲染
    expect(getByTestId('data-table')).toBeTruthy();
    
    // 檢查是否傳遞了正確的資料
    const DataTable = require('@/components/common/DataTable').DataTable;
    expect(DataTable).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ name: '張三' }),
          expect.objectContaining({ name: '李四' }),
        ]),
        showCheckboxes: false, // 預設不顯示多選框
      }),
      expect.anything()
    );
  });

  it('多選模式應該正確運作', () => {
    const onSelectionChange = vi.fn();
    const { getByTestId } = render(
      <TableView
        {...defaultProps}
        multiSelectMode={true}
        selectedIds={[]}
        onSelectionChange={onSelectionChange}
      />
    );
    
    // 檢查多選模式下是否顯示勾選框
    const DataTable = require('@/components/common/DataTable').DataTable;
    expect(DataTable).toHaveBeenCalledWith(
      expect.objectContaining({
        showCheckboxes: true,
      }),
      expect.anything()
    );
  });

  it('應該正確傳遞篩選條件', () => {
    const activeFilters = [
      { key: 'status', operator: 'equals' as const, value: 'active' },
      { key: 'role', operator: 'equals' as const, value: 'manager' },
    ];
    
    render(
      <TableView
        {...defaultProps}
        searchQuery="張"
        activeFilters={activeFilters}
      />
    );
    
    const DataTable = require('@/components/common/DataTable').DataTable;
    expect(DataTable).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: [
          { key: 'search', value: '張' },
          ...activeFilters,
        ],
      }),
      expect.anything()
    );
  });

  it('應該處理行點擊事件', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
    const { getByTestId } = render(<TableView {...defaultProps} />);
    
    // 模擬點擊行
    const DataTable = require('@/components/common/DataTable').DataTable;
    const onRowPress = DataTable.mock.calls[0][0].onRowPress;
    onRowPress(mockTeamMembers[0]);
    
    expect(consoleSpy).toHaveBeenCalledWith('查看成員詳情:', '1');
    consoleSpy.mockRestore();
  });

  it('應該正確顯示批次操作工具列', () => {
    const { getByText, queryByText } = render(
      <TableView
        {...defaultProps}
        multiSelectMode={true}
        selectedIds={['1', '2']}
      />
    );
    
    // 應該顯示選擇數量
    expect(getByText('已選擇 2 位成員')).toBeTruthy();
    
    // 應該顯示批次操作按鈕
    expect(getByText('匯出')).toBeTruthy();
    expect(getByText('設定權限')).toBeTruthy();
  });

  it('沒有選擇時不應顯示批次操作工具列', () => {
    const { queryByText } = render(
      <TableView
        {...defaultProps}
        multiSelectMode={true}
        selectedIds={[]}
      />
    );
    
    expect(queryByText(/已選擇/)).toBeNull();
    expect(queryByText('匯出')).toBeNull();
    expect(queryByText('設定權限')).toBeNull();
  });
});