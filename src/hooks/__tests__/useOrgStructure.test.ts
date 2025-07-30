/**
 * 組織結構 Hook 測試
 */

import { renderHook, act } from '@testing-library/react';
import { useOrgStructure } from '../useOrgStructure';
import { usePersonnelStore } from '../../stores/personnelStore';
import { useAuth } from '../useAuth';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock stores 和 hooks
vi.mock('../../stores/personnelStore');
vi.mock('../useAuth');

describe('useOrgStructure', () => {
  const mockOrgStructure = {
    id: 'user-1',
    user: {
      id: 'user-1',
      displayName: '主管',
      role: 'manager',
      level: 0,
    },
    children: [
      {
        id: 'user-2',
        user: {
          id: 'user-2',
          displayName: '業務一',
          role: 'salesperson',
          reportingTo: 'user-1',
          level: 1,
        },
        children: [],
        expanded: true,
        position: { x: 0, y: 150 },
      },
      {
        id: 'user-3',
        user: {
          id: 'user-3',
          displayName: '業務二',
          role: 'salesperson',
          reportingTo: 'user-1',
          level: 1,
        },
        children: [],
        expanded: true,
        position: { x: 100, y: 150 },
      },
    ],
    expanded: true,
    position: { x: 0, y: 0 },
  };

  const mockUsers = [
    mockOrgStructure.user,
    mockOrgStructure.children[0].user,
    mockOrgStructure.children[1].user,
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'current-user', role: 'admin' },
    });
    
    (usePersonnelStore as unknown as jest.Mock).mockReturnValue({
      orgStructure: mockOrgStructure,
      users: mockUsers,
      isLoading: false,
      error: null,
      expandNode: vi.fn(),
      collapseNode: vi.fn(),
      updateUserOrganization: vi.fn(),
      subscribeToUsers: vi.fn(),
      unsubscribeFromUsers: vi.fn(),
    });
  });

  describe('基本功能', () => {
    it('應該返回組織結構資料', () => {
      const { result } = renderHook(() => useOrgStructure());
      
      expect(result.current.orgStructure).toEqual(mockOrgStructure);
      expect(result.current.totalNodes).toBe(3);
      expect(result.current.maxDepth).toBe(2);
    });

    it('應該正確計算扁平化節點', () => {
      const { result } = renderHook(() => useOrgStructure());
      
      expect(result.current.flattenedNodes).toHaveLength(3);
      expect(result.current.flattenedNodes[0].id).toBe('user-1');
      expect(result.current.flattenedNodes[1].id).toBe('user-2');
      expect(result.current.flattenedNodes[2].id).toBe('user-3');
    });
  });

  describe('節點操作', () => {
    it('toggleNode 應該切換節點展開狀態', () => {
      const mockExpandNode = vi.fn();
      const mockCollapseNode = vi.fn();
      
      (usePersonnelStore as unknown as jest.Mock).mockReturnValue({
        ...usePersonnelStore(),
        expandNode: mockExpandNode,
        collapseNode: mockCollapseNode,
        orgStructure: { ...mockOrgStructure, expanded: true },
      });
      
      const { result } = renderHook(() => useOrgStructure());
      
      act(() => {
        result.current.toggleNode('user-1');
      });
      
      expect(mockCollapseNode).toHaveBeenCalledWith('user-1');
    });

    it('expandAll 應該展開所有節點', () => {
      const mockExpandNode = vi.fn();
      
      (usePersonnelStore as unknown as jest.Mock).mockReturnValue({
        ...usePersonnelStore(),
        expandNode: mockExpandNode,
      });
      
      const { result } = renderHook(() => useOrgStructure());
      
      act(() => {
        result.current.expandAll();
      });
      
      expect(mockExpandNode).toHaveBeenCalledTimes(2); // 對每個子節點調用
    });

    it('collapseAll 應該收合所有節點（除了根節點）', () => {
      const mockCollapseNode = vi.fn();
      
      (usePersonnelStore as unknown as jest.Mock).mockReturnValue({
        ...usePersonnelStore(),
        collapseNode: mockCollapseNode,
      });
      
      const { result } = renderHook(() => useOrgStructure());
      
      act(() => {
        result.current.collapseAll();
      });
      
      expect(mockCollapseNode).toHaveBeenCalledWith('user-2');
      expect(mockCollapseNode).toHaveBeenCalledWith('user-3');
      expect(mockCollapseNode).not.toHaveBeenCalledWith('user-1'); // 根節點不應被收合
    });
  });

  describe('組織結構操作', () => {
    it('canMoveUser 應該正確判斷是否可以移動使用者', () => {
      const { result } = renderHook(() => useOrgStructure());
      
      // 不能移動到自己
      expect(result.current.canMoveUser('user-1', 'user-1')).toBe(false);
      
      // 不能移動到自己的下屬
      expect(result.current.canMoveUser('user-1', 'user-2')).toBe(false);
      
      // 可以移動到其他位置
      expect(result.current.canMoveUser('user-2', 'user-3')).toBe(true);
      expect(result.current.canMoveUser('user-2', null)).toBe(true);
    });

    it('moveUser 應該更新使用者組織關係', async () => {
      const mockUpdateUserOrganization = jest.fn(() => Promise.resolve());
      
      (usePersonnelStore as unknown as jest.Mock).mockReturnValue({
        ...usePersonnelStore(),
        updateUserOrganization: mockUpdateUserOrganization,
      });
      
      const { result } = renderHook(() => useOrgStructure());
      
      await act(async () => {
        await result.current.moveUser('user-2', 'user-3');
      });
      
      expect(mockUpdateUserOrganization).toHaveBeenCalledWith('user-2', 'user-3');
    });

    it('moveUser 應該拒絕無效的移動', async () => {
      const { result } = renderHook(() => useOrgStructure());
      
      await expect(
        result.current.moveUser('user-1', 'user-2')
      ).rejects.toThrow('無法移動使用者到該位置');
    });
  });

  describe('搜尋功能', () => {
    it('searchInTree 應該正確搜尋節點', () => {
      const { result } = renderHook(() => useOrgStructure());
      
      const searchResults = result.current.searchInTree('業務');
      
      expect(searchResults).toHaveLength(2);
      expect(searchResults[0].user.displayName).toBe('業務一');
      expect(searchResults[1].user.displayName).toBe('業務二');
    });

    it('searchInTree 空查詢應該返回空陣列', () => {
      const { result } = renderHook(() => useOrgStructure());
      
      expect(result.current.searchInTree('')).toHaveLength(0);
    });

    it('getNodePath 應該返回正確的節點路徑', () => {
      const { result } = renderHook(() => useOrgStructure());
      
      const path = result.current.getNodePath('user-2');
      
      expect(path).toHaveLength(2);
      expect(path[0].id).toBe('user-1');
      expect(path[1].id).toBe('user-2');
    });

    it('getNodeById 應該返回正確的節點', () => {
      const { result } = renderHook(() => useOrgStructure());
      
      const node = result.current.getNodeById('user-2');
      
      expect(node?.user.displayName).toBe('業務一');
    });
  });

  describe('統計功能', () => {
    it('getTeamSize 應該計算團隊大小', () => {
      const { result } = renderHook(() => useOrgStructure());
      
      expect(result.current.getTeamSize('user-1')).toBe(2);
      expect(result.current.getTeamSize('user-2')).toBe(0);
    });

    it('getDirectReports 應該返回直屬下屬', () => {
      const { result } = renderHook(() => useOrgStructure());
      
      const directReports = result.current.getDirectReports('user-1');
      
      expect(directReports).toHaveLength(2);
      expect(directReports[0].displayName).toBe('業務一');
      expect(directReports[1].displayName).toBe('業務二');
    });

    it('getAllSubordinates 應該返回所有下屬', () => {
      const nestedStructure = {
        ...mockOrgStructure,
        children: [
          {
            ...mockOrgStructure.children[0],
            children: [
              {
                id: 'user-4',
                user: {
                  id: 'user-4',
                  displayName: '實習生',
                  role: 'salesperson',
                  reportingTo: 'user-2',
                  level: 2,
                },
                children: [],
                expanded: true,
                position: { x: 0, y: 300 },
              },
            ],
          },
          mockOrgStructure.children[1],
        ],
      };
      
      const nestedUsers = [
        ...mockUsers,
        { ...nestedStructure.children[0].children[0].user },
      ];
      
      (usePersonnelStore as unknown as jest.Mock).mockReturnValue({
        ...usePersonnelStore(),
        orgStructure: nestedStructure,
        users: nestedUsers,
      });
      
      const { result } = renderHook(() => useOrgStructure());
      
      const allSubordinates = result.current.getAllSubordinates('user-1');
      
      expect(allSubordinates).toHaveLength(3); // 包含所有層級的下屬
    });
  });

  describe('訂閱管理', () => {
    it('應該在組件掛載時訂閱使用者資料', () => {
      const mockSubscribe = vi.fn();
      
      (usePersonnelStore as unknown as jest.Mock).mockReturnValue({
        ...usePersonnelStore(),
        subscribeToUsers: mockSubscribe,
      });
      
      renderHook(() => useOrgStructure());
      
      expect(mockSubscribe).toHaveBeenCalledWith({ id: 'current-user', role: 'admin' });
    });

    it('應該在組件卸載時取消訂閱', () => {
      const mockUnsubscribe = vi.fn();
      
      (usePersonnelStore as unknown as jest.Mock).mockReturnValue({
        ...usePersonnelStore(),
        unsubscribeFromUsers: mockUnsubscribe,
      });
      
      const { unmount } = renderHook(() => useOrgStructure());
      
      unmount();
      
      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });
});