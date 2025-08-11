/**
 * UserSelector 元件單元測試
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { UserSelector } from '@/components/import/UserSelector';
import { User } from '@/types/user';
import { mockUsers } from '../../utils/assignmentMocks';

// Mock React Native 元件
vi.mock('react-native', () => ({
  View: ({ children, testID }: any) => <div data-testid={testID}>{children}</div>,
  Text: ({ children }: any) => <span>{children}</span>,
  TouchableOpacity: ({ children, onPress, disabled, testID }: any) => (
    <button onClick={onPress} disabled={disabled} data-testid={testID}>
      {children}
    </button>
  ),
  ScrollView: ({ children }: any) => <div>{children}</div>,
  TextInput: ({ value, onChangeText, placeholder, testID }: any) => (
    <input
      value={value}
      onChange={(e) => onChangeText(e.target.value)}
      placeholder={placeholder}
      data-testid={testID}
    />
  ),
  ActivityIndicator: () => <div>Loading...</div>,
  Modal: ({ visible, children }: any) => (
    visible ? <div role="dialog">{children}</div> : null
  ),
  Alert: {
    alert: vi.fn()
  },
  Platform: {
    OS: 'web'
  }
}));

describe('UserSelector', () => {
  const mockOnSelect = vi.fn();
  const mockOnMultiSelect = vi.fn();
  const mockOnClose = vi.fn();

  const defaultProps = {
    users: mockUsers,
    onSelect: mockOnSelect,
    onClose: mockOnClose,
    selectedUserId: undefined,
    multiple: false,
    loading: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('基本渲染', () => {
    it('應該正確渲染用戶列表', () => {
      render(<UserSelector {...defaultProps} />);
      
      // 檢查所有用戶是否顯示
      mockUsers.forEach(user => {
        expect(screen.getByText(user.name)).toBeDefined();
        expect(screen.getByText(user.email)).toBeDefined();
      });
    });

    it('應該顯示用戶的部門資訊', () => {
      render(<UserSelector {...defaultProps} />);
      
      mockUsers.forEach(user => {
        if (user.department) {
          expect(screen.getByText(user.department)).toBeDefined();
        }
      });
    });

    it('應該顯示載入狀態', () => {
      render(<UserSelector {...defaultProps} loading={true} />);
      
      expect(screen.getByText('Loading...')).toBeDefined();
    });

    it('應該顯示空狀態訊息', () => {
      render(<UserSelector {...defaultProps} users={[]} />);
      
      expect(screen.getByText('沒有可選擇的用戶')).toBeDefined();
    });
  });

  describe('單選模式', () => {
    it('應該在點擊用戶時觸發 onSelect', () => {
      render(<UserSelector {...defaultProps} />);
      
      const firstUser = screen.getByTestId(`user-item-${mockUsers[0].id}`);
      fireEvent.click(firstUser);
      
      expect(mockOnSelect).toHaveBeenCalledWith(mockUsers[0]);
      expect(mockOnSelect).toHaveBeenCalledTimes(1);
    });

    it('應該高亮顯示已選擇的用戶', () => {
      render(
        <UserSelector 
          {...defaultProps} 
          selectedUserId={mockUsers[1].id} 
        />
      );
      
      const selectedUser = screen.getByTestId(`user-item-${mockUsers[1].id}`);
      expect(selectedUser.className).toContain('selected');
    });

    it('應該在選擇後自動關閉', async () => {
      render(<UserSelector {...defaultProps} />);
      
      const firstUser = screen.getByTestId(`user-item-${mockUsers[0].id}`);
      fireEvent.click(firstUser);
      
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('多選模式', () => {
    it('應該顯示複選框', () => {
      render(
        <UserSelector 
          {...defaultProps} 
          multiple={true}
          onMultiSelect={mockOnMultiSelect}
        />
      );
      
      mockUsers.forEach(user => {
        const checkbox = screen.getByTestId(`checkbox-${user.id}`);
        expect(checkbox).toBeDefined();
      });
    });

    it('應該允許選擇多個用戶', () => {
      render(
        <UserSelector 
          {...defaultProps} 
          multiple={true}
          onMultiSelect={mockOnMultiSelect}
          selectedUserIds={[]}
        />
      );
      
      // 選擇第一個用戶
      const checkbox1 = screen.getByTestId(`checkbox-${mockUsers[0].id}`);
      fireEvent.click(checkbox1);
      
      // 選擇第二個用戶
      const checkbox2 = screen.getByTestId(`checkbox-${mockUsers[1].id}`);
      fireEvent.click(checkbox2);
      
      expect(mockOnMultiSelect).toHaveBeenCalledWith([mockUsers[0].id]);
      expect(mockOnMultiSelect).toHaveBeenCalledWith([mockUsers[0].id, mockUsers[1].id]);
    });

    it('應該允許取消選擇用戶', () => {
      render(
        <UserSelector 
          {...defaultProps} 
          multiple={true}
          onMultiSelect={mockOnMultiSelect}
          selectedUserIds={[mockUsers[0].id, mockUsers[1].id]}
        />
      );
      
      const checkbox1 = screen.getByTestId(`checkbox-${mockUsers[0].id}`);
      fireEvent.click(checkbox1);
      
      expect(mockOnMultiSelect).toHaveBeenCalledWith([mockUsers[1].id]);
    });

    it('應該顯示確認按鈕', () => {
      render(
        <UserSelector 
          {...defaultProps} 
          multiple={true}
          onMultiSelect={mockOnMultiSelect}
        />
      );
      
      const confirmButton = screen.getByTestId('confirm-selection-button');
      expect(confirmButton).toBeDefined();
    });

    it('應該在未選擇用戶時禁用確認按鈕', () => {
      render(
        <UserSelector 
          {...defaultProps} 
          multiple={true}
          onMultiSelect={mockOnMultiSelect}
          selectedUserIds={[]}
        />
      );
      
      const confirmButton = screen.getByTestId('confirm-selection-button');
      expect(confirmButton).toBeDisabled();
    });
  });

  describe('搜尋功能', () => {
    it('應該顯示搜尋輸入框', () => {
      render(<UserSelector {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('搜尋用戶...');
      expect(searchInput).toBeDefined();
    });

    it('應該根據姓名過濾用戶', async () => {
      render(<UserSelector {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('搜尋用戶...');
      fireEvent.change(searchInput, { target: { value: '張三' } });
      
      await waitFor(() => {
        expect(screen.getByText('張三')).toBeDefined();
        expect(screen.queryByText('李四')).toBeNull();
      });
    });

    it('應該根據 Email 過濾用戶', async () => {
      render(<UserSelector {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('搜尋用戶...');
      fireEvent.change(searchInput, { target: { value: 'zhang@test.com' } });
      
      await waitFor(() => {
        expect(screen.getByText('張三')).toBeDefined();
        expect(screen.queryByText('李四')).toBeNull();
      });
    });

    it('應該根據部門過濾用戶', async () => {
      render(<UserSelector {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('搜尋用戶...');
      fireEvent.change(searchInput, { target: { value: '業務部' } });
      
      await waitFor(() => {
        expect(screen.getByText('張三')).toBeDefined();
        expect(screen.getByText('李四')).toBeDefined();
        expect(screen.queryByText('John Doe')).toBeNull();
      });
    });

    it('應該顯示無搜尋結果訊息', async () => {
      render(<UserSelector {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('搜尋用戶...');
      fireEvent.change(searchInput, { target: { value: '不存在的用戶' } });
      
      await waitFor(() => {
        expect(screen.getByText('找不到符合的用戶')).toBeDefined();
      });
    });
  });

  describe('角色過濾', () => {
    it('應該顯示角色過濾器', () => {
      render(<UserSelector {...defaultProps} />);
      
      expect(screen.getByTestId('role-filter-all')).toBeDefined();
      expect(screen.getByTestId('role-filter-salesperson')).toBeDefined();
      expect(screen.getByTestId('role-filter-manager')).toBeDefined();
      expect(screen.getByTestId('role-filter-admin')).toBeDefined();
    });

    it('應該根據角色過濾用戶', async () => {
      render(<UserSelector {...defaultProps} />);
      
      const managerFilter = screen.getByTestId('role-filter-manager');
      fireEvent.click(managerFilter);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeDefined();
        expect(screen.queryByText('張三')).toBeNull();
        expect(screen.queryByText('李四')).toBeNull();
      });
    });

    it('應該允許切換角色過濾器', async () => {
      render(<UserSelector {...defaultProps} />);
      
      // 先選擇 manager
      const managerFilter = screen.getByTestId('role-filter-manager');
      fireEvent.click(managerFilter);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeDefined();
      });
      
      // 切換到 salesperson
      const salespersonFilter = screen.getByTestId('role-filter-salesperson');
      fireEvent.click(salespersonFilter);
      
      await waitFor(() => {
        expect(screen.getByText('張三')).toBeDefined();
        expect(screen.getByText('李四')).toBeDefined();
        expect(screen.queryByText('John Doe')).toBeNull();
      });
    });
  });

  describe('排序功能', () => {
    it('應該顯示排序選項', () => {
      render(<UserSelector {...defaultProps} />);
      
      const sortButton = screen.getByTestId('sort-button');
      expect(sortButton).toBeDefined();
    });

    it('應該按姓名排序', async () => {
      render(<UserSelector {...defaultProps} />);
      
      const sortButton = screen.getByTestId('sort-button');
      fireEvent.click(sortButton);
      
      const sortByName = screen.getByTestId('sort-by-name');
      fireEvent.click(sortByName);
      
      await waitFor(() => {
        const userItems = screen.getAllByTestId(/^user-item-/);
        const names = userItems.map(item => 
          within(item).getByTestId('user-name').textContent
        );
        
        // 檢查是否按字母順序排列
        const sortedNames = [...names].sort();
        expect(names).toEqual(sortedNames);
      });
    });

    it('應該按部門排序', async () => {
      render(<UserSelector {...defaultProps} />);
      
      const sortButton = screen.getByTestId('sort-button');
      fireEvent.click(sortButton);
      
      const sortByDepartment = screen.getByTestId('sort-by-department');
      fireEvent.click(sortByDepartment);
      
      await waitFor(() => {
        const userItems = screen.getAllByTestId(/^user-item-/);
        const departments = userItems.map(item => 
          within(item).queryByTestId('user-department')?.textContent || ''
        );
        
        // 檢查是否按部門排序
        const sortedDepartments = [...departments].sort();
        expect(departments).toEqual(sortedDepartments);
      });
    });
  });

  describe('無障礙功能', () => {
    it('應該有適當的 ARIA 標籤', () => {
      render(<UserSelector {...defaultProps} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeDefined();
      
      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toBeDefined();
    });

    it('應該支援鍵盤導航', async () => {
      render(<UserSelector {...defaultProps} />);
      
      const firstUser = screen.getByTestId(`user-item-${mockUsers[0].id}`);
      
      // 模擬 Tab 鍵
      fireEvent.keyDown(firstUser, { key: 'Tab' });
      
      // 模擬 Enter 鍵選擇
      fireEvent.keyDown(firstUser, { key: 'Enter' });
      
      expect(mockOnSelect).toHaveBeenCalledWith(mockUsers[0]);
    });
  });

  describe('錯誤處理', () => {
    it('應該處理無效的用戶資料', () => {
      const invalidUsers = [
        { ...mockUsers[0], id: undefined } as any,
        { ...mockUsers[1], name: undefined } as any
      ];
      
      render(<UserSelector {...defaultProps} users={invalidUsers} />);
      
      // 不應該崩潰，應該優雅地處理
      expect(screen.getByText('沒有可選擇的用戶')).toBeDefined();
    });

    it('應該處理選擇錯誤', async () => {
      const errorOnSelect = vi.fn().mockRejectedValue(new Error('Selection failed'));
      
      render(<UserSelector {...defaultProps} onSelect={errorOnSelect} />);
      
      const firstUser = screen.getByTestId(`user-item-${mockUsers[0].id}`);
      fireEvent.click(firstUser);
      
      await waitFor(() => {
        // 應該顯示錯誤訊息
        expect(screen.getByText('選擇失敗，請重試')).toBeDefined();
      });
    });
  });
});