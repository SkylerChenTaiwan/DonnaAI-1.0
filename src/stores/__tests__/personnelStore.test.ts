/**
 * 人事管理 Store 測試
 */

import { act, renderHook } from '@testing-library/react';
import { usePersonnelStore } from '../personnelStore';
import { User } from '../../types/user';
import { doc, updateDoc, getDocs } from 'firebase/firestore';

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  onSnapshot: jest.fn(),
  doc: jest.fn(),
  updateDoc: jest.fn(() => Promise.resolve()),
  getDocs: jest.fn(),
  Unsubscribe: jest.fn(),
}));

jest.mock('../../services/firebase', () => ({
  db: {},
}));

jest.mock('../../services/firebase/permissions-v2', () => ({
  getUserPermissionContext: jest.fn(() => Promise.resolve({
    userId: 'test-user',
    role: 'admin',
    organizationId: 'org-1',
    teamIds: ['team-1'],
    managedTeamIds: ['team-1'],
    cachedAt: Date.now(),
  })),
  clearUserPermissionCache: jest.fn(),
}));

describe('personnelStore', () => {
  const mockCurrentUser: User = {
    id: 'current-user',
    email: 'admin@example.com',
    displayName: '管理員',
    role: 'admin',
    organizationId: 'org-1',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUsers = [
    {
      id: 'user-1',
      email: 'user1@example.com',
      displayName: '使用者一',
      role: 'manager',
      organizationId: 'org-1',
      teamIds: ['team-1'],
      teamNames: ['業務一組'],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActiveAt: new Date(),
      isOnline: true,
    },
    {
      id: 'user-2',
      email: 'user2@example.com',
      displayName: '使用者二',
      role: 'salesperson',
      organizationId: 'org-1',
      teamIds: ['team-1'],
      teamNames: ['業務一組'],
      reportingTo: 'user-1',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActiveAt: new Date(Date.now() - 86400000), // 1天前
      isOnline: false,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock getDocs 回傳
    (getDocs as jest.Mock).mockResolvedValue({
      forEach: jest.fn((callback) => {
        mockUsers.forEach((user, index) => {
          callback({
            id: user.id,
            data: () => ({
              ...user,
              lastActiveAt: { toDate: () => user.lastActiveAt },
              createdAt: { toDate: () => user.createdAt },
              updatedAt: { toDate: () => user.updatedAt },
            }),
          });
        });
      }),
    });
  });

  afterEach(() => {
    act(() => {
      usePersonnelStore.getState().reset();
    });
  });

  describe('fetchUsers', () => {
    it('應該成功載入使用者列表', async () => {
      const { result } = renderHook(() => usePersonnelStore());
      
      await act(async () => {
        await result.current.fetchUsers(mockCurrentUser);
      });
      
      expect(result.current.users).toHaveLength(2);
      expect(result.current.users[0].displayName).toBe('使用者一');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('載入失敗應該設定錯誤狀態', async () => {
      (getDocs as jest.Mock).mockRejectedValueOnce(new Error('載入失敗'));
      
      const { result } = renderHook(() => usePersonnelStore());
      
      await act(async () => {
        await result.current.fetchUsers(mockCurrentUser);
      });
      
      expect(result.current.users).toHaveLength(0);
      expect(result.current.error).toBe('載入使用者失敗');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('篩選功能', () => {
    it('getFilteredUsers 應該正確篩選使用者', async () => {
      const { result } = renderHook(() => usePersonnelStore());
      
      // 先載入使用者
      await act(async () => {
        await result.current.fetchUsers(mockCurrentUser);
      });
      
      // 設定搜尋條件
      act(() => {
        result.current.setSearchQuery('使用者一');
      });
      
      const filtered = result.current.getFilteredUsers();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].displayName).toBe('使用者一');
    });

    it('應該根據角色篩選', async () => {
      const { result } = renderHook(() => usePersonnelStore());
      
      await act(async () => {
        await result.current.fetchUsers(mockCurrentUser);
      });
      
      act(() => {
        result.current.setFilterRole('manager');
      });
      
      const filtered = result.current.getFilteredUsers();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].role).toBe('manager');
    });

    it('應該根據線上狀態篩選', async () => {
      const { result } = renderHook(() => usePersonnelStore());
      
      await act(async () => {
        await result.current.fetchUsers(mockCurrentUser);
      });
      
      act(() => {
        result.current.setFilterStatus('online');
      });
      
      const filtered = result.current.getFilteredUsers();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].isOnline).toBe(true);
    });
  });

  describe('排序功能', () => {
    it('getSortedUsers 應該根據名稱排序', async () => {
      const { result } = renderHook(() => usePersonnelStore());
      
      await act(async () => {
        await result.current.fetchUsers(mockCurrentUser);
      });
      
      act(() => {
        result.current.setSortBy('name');
        result.current.toggleSortOrder(); // 改為降序
      });
      
      const sorted = result.current.getSortedUsers();
      expect(sorted[0].displayName).toBe('使用者二');
      expect(sorted[1].displayName).toBe('使用者一');
    });
  });

  describe('組織結構', () => {
    it('buildOrgStructure 應該正確建立組織樹', async () => {
      const { result } = renderHook(() => usePersonnelStore());
      
      await act(async () => {
        await result.current.fetchUsers(mockCurrentUser);
      });
      
      expect(result.current.orgStructure).toBeTruthy();
      expect(result.current.orgStructure?.user.displayName).toBe('使用者一');
      expect(result.current.orgStructure?.children).toHaveLength(1);
      expect(result.current.orgStructure?.children[0].user.displayName).toBe('使用者二');
    });

    it('updateUserOrganization 應該更新使用者組織關係', async () => {
      const { result } = renderHook(() => usePersonnelStore());
      
      await act(async () => {
        await result.current.fetchUsers(mockCurrentUser);
      });
      
      await act(async () => {
        await result.current.updateUserOrganization('user-2', null);
      });
      
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          reportingTo: null,
        })
      );
    });
  });

  describe('節點操作', () => {
    it('expandNode 應該展開節點', async () => {
      const { result } = renderHook(() => usePersonnelStore());
      
      await act(async () => {
        await result.current.fetchUsers(mockCurrentUser);
      });
      
      // 先收合節點
      act(() => {
        result.current.collapseNode('user-1');
      });
      
      expect(result.current.orgStructure?.expanded).toBe(false);
      
      // 再展開節點
      act(() => {
        result.current.expandNode('user-1');
      });
      
      expect(result.current.orgStructure?.expanded).toBe(true);
    });
  });

  describe('檢視切換', () => {
    it('setActiveView 應該切換檢視模式', () => {
      const { result } = renderHook(() => usePersonnelStore());
      
      expect(result.current.activeView).toBe('table');
      
      act(() => {
        result.current.setActiveView('tree');
      });
      
      expect(result.current.activeView).toBe('tree');
    });
  });

  describe('選擇使用者', () => {
    it('selectUser 應該設定選中的使用者', async () => {
      const { result } = renderHook(() => usePersonnelStore());
      
      await act(async () => {
        await result.current.fetchUsers(mockCurrentUser);
      });
      
      act(() => {
        result.current.selectUser(result.current.users[0]);
      });
      
      expect(result.current.selectedUser?.id).toBe('user-1');
    });
  });
});