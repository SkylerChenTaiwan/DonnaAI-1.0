/**
 * AuthStore 認證狀態管理互動測試
 * 測試認證狀態管理、持久化和跨組件狀態同步功能
 */

import { act, renderHook } from '@testing-library/react-hooks';
import { useAuthStore } from '@/stores/authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/config/constants';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
}));

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
  User: {}
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn()
}));

jest.mock('@/services/firebase/config', () => ({
  getFirebaseAuth: jest.fn(() => ({
    currentUser: null,
    signOut: jest.fn()
  })),
  getFirebaseDb: jest.fn()
}));

jest.mock('@/config/constants', () => ({
  STORAGE_KEYS: {
    USER_MODE: 'user_mode'
  }
}));

import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb } from '@/services/firebase/config';

describe('AuthStore 互動測試', () => {
  const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
  const mockOnAuthStateChanged = onAuthStateChanged as jest.MockedFunction<typeof onAuthStateChanged>;
  const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;
  const mockGetFirebaseAuth = getFirebaseAuth as jest.MockedFunction<typeof getFirebaseAuth>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset Zustand store state
    useAuthStore.getState().setUser(null);
    useAuthStore.getState().setLoading(false);
    useAuthStore.getState().setError(null);
    
    // Mock AsyncStorage default behavior
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
    mockAsyncStorage.removeItem.mockResolvedValue();
  });

  describe('1. 基本狀態管理測試', () => {
    test('1.1 初始狀態正確', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.user).toBeNull();
      expect(result.current.firebaseUser).toBeNull();
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.mode).toBe('business');
    });

    test('1.2 setUser 狀態更新', () => {
      const { result } = renderHook(() => useAuthStore());

      const mockUser = {
        id: 'test-uid',
        email: 'test@example.com',
        name: 'Test User',
        role: 'salesperson' as const,
        organizationId: 'org-1',
        teamIds: ['team-1'],
        createdAt: new Date(),
        lastLoginAt: new Date()
      };

      act(() => {
        result.current.setUser(mockUser);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    test('1.3 setLoading 狀態更新', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.isLoading).toBe(false);

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);
    });

    test('1.4 setError 狀態更新', () => {
      const { result } = renderHook(() => useAuthStore());

      const errorMessage = '認證錯誤';

      act(() => {
        result.current.setError(errorMessage);
      });

      expect(result.current.error).toBe(errorMessage);

      act(() => {
        result.current.setError(null);
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('2. 模式切換互動測試', () => {
    test('2.1 基本模式切換', async () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.mode).toBe('business');

      await act(async () => {
        result.current.toggleMode();
      });

      expect(result.current.mode).toBe('manager');
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.USER_MODE,
        'manager'
      );

      await act(async () => {
        result.current.toggleMode();
      });

      expect(result.current.mode).toBe('business');
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.USER_MODE,
        'business'
      );
    });

    test('2.2 快速連續模式切換', async () => {
      const { result } = renderHook(() => useAuthStore());

      // 快速多次切換
      await act(async () => {
        for (let i = 0; i < 10; i++) {
          result.current.toggleMode();
        }
      });

      // 奇數次切換後應該是 manager 模式
      expect(result.current.mode).toBe('business');
      expect(mockAsyncStorage.setItem).toHaveBeenCalledTimes(10);
    });

    test('2.3 模式持久化失敗處理', async () => {
      const { result } = renderHook(() => useAuthStore());
      
      // 模擬 AsyncStorage 失敗
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await act(async () => {
        result.current.toggleMode();
      });

      // 狀態仍然應該更新
      expect(result.current.mode).toBe('manager');
      
      // 應該記錄錯誤
      expect(consoleSpy).toHaveBeenCalledWith(
        '儲存使用者模式失敗:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('3. 認證狀態初始化測試', () => {
    test('3.1 模式從存儲載入', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('manager');
      
      const { result } = renderHook(() => useAuthStore());

      const unsubscribe = await act(async () => {
        return result.current.initializeAuth();
      });

      // 等待 AsyncStorage 載入完成
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.mode).toBe('manager');
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith(STORAGE_KEYS.USER_MODE);

      if (unsubscribe) unsubscribe();
    });

    test('3.2 無效模式值處理', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('invalid-mode');
      
      const { result } = renderHook(() => useAuthStore());

      const unsubscribe = await act(async () => {
        return result.current.initializeAuth();
      });

      // 等待 AsyncStorage 載入完成
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // 應該保持預設值
      expect(result.current.mode).toBe('business');

      if (unsubscribe) unsubscribe();
    });

    test('3.3 模式載入失敗處理', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const { result } = renderHook(() => useAuthStore());

      const unsubscribe = await act(async () => {
        return result.current.initializeAuth();
      });

      // 等待錯誤處理完成
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        '載入使用者模式失敗:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
      if (unsubscribe) unsubscribe();
    });
  });

  describe('4. Firebase 認證狀態監聽測試', () => {
    test('4.1 用戶登入狀態變更', async () => {
      const mockFirebaseUser = {
        uid: 'firebase-uid',
        email: 'test@example.com',
        displayName: 'Test User'
      };

      const mockUserDoc = {
        exists: () => true,
        data: () => ({
          email: 'test@example.com',
          name: 'Test User',
          role: 'salesperson',
          organizationId: 'org-1',
          teamIds: ['team-1'],
          createdAt: new Date(),
          lastLoginAt: new Date()
        })
      };

      mockGetDoc.mockResolvedValue(mockUserDoc as any);

      let authStateCallback: (user: any) => void = () => {};
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        authStateCallback = callback;
        return () => {}; // unsubscribe function
      });

      const { result } = renderHook(() => useAuthStore());

      const unsubscribe = await act(async () => {
        return result.current.initializeAuth();
      });

      // 模擬用戶登入
      await act(async () => {
        authStateCallback(mockFirebaseUser);
      });

      expect(result.current.firebaseUser).toEqual(mockFirebaseUser);
      expect(result.current.user).toEqual(
        expect.objectContaining({
          id: 'firebase-uid',
          email: 'test@example.com',
          name: 'Test User'
        })
      );
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();

      if (unsubscribe) unsubscribe();
    });

    test('4.2 用戶登出狀態變更', async () => {
      let authStateCallback: (user: any) => void = () => {};
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        authStateCallback = callback;
        return () => {};
      });

      const { result } = renderHook(() => useAuthStore());

      const unsubscribe = await act(async () => {
        return result.current.initializeAuth();
      });

      // 模擬用戶登出
      await act(async () => {
        authStateCallback(null);
      });

      expect(result.current.firebaseUser).toBeNull();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();

      if (unsubscribe) unsubscribe();
    });

    test('4.3 已認證但無用戶檔案', async () => {
      const mockFirebaseUser = {
        uid: 'firebase-uid',
        email: 'test@example.com'
      };

      const mockUserDoc = {
        exists: () => false
      };

      mockGetDoc.mockResolvedValue(mockUserDoc as any);

      let authStateCallback: (user: any) => void = () => {};
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        authStateCallback = callback;
        return () => {};
      });

      const { result } = renderHook(() => useAuthStore());

      const unsubscribe = await act(async () => {
        return result.current.initializeAuth();
      });

      // 模擬已認證但無檔案的用戶
      await act(async () => {
        authStateCallback(mockFirebaseUser);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('找不到使用者檔案，請聯繫管理員');

      if (unsubscribe) unsubscribe();
    });

    test('4.4 Firestore 載入錯誤處理', async () => {
      const mockFirebaseUser = {
        uid: 'firebase-uid',
        email: 'test@example.com'
      };

      mockGetDoc.mockRejectedValue(new Error('Firestore error'));

      let authStateCallback: (user: any) => void = () => {};
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        authStateCallback = callback;
        return () => {};
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const { result } = renderHook(() => useAuthStore());

      const unsubscribe = await act(async () => {
        return result.current.initializeAuth();
      });

      // 模擬 Firestore 錯誤
      await act(async () => {
        authStateCallback(mockFirebaseUser);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Firestore error');
      expect(consoleSpy).toHaveBeenCalledWith(
        '載入使用者檔案時發生錯誤:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
      if (unsubscribe) unsubscribe();
    });
  });

  describe('5. 登出功能測試', () => {
    test('5.1 成功登出', async () => {
      const mockSignOut = jest.fn().mockResolvedValue(undefined);
      mockGetFirebaseAuth.mockReturnValue({
        signOut: mockSignOut,
        currentUser: null
      } as any);

      const { result } = renderHook(() => useAuthStore());

      // 設置初始狀態
      act(() => {
        result.current.setUser({
          id: 'test-uid',
          email: 'test@example.com',
          name: 'Test User',
          role: 'salesperson',
          organizationId: 'org-1',
          teamIds: ['team-1'],
          createdAt: new Date(),
          lastLoginAt: new Date()
        });
      });

      await act(async () => {
        await result.current.signOut();
      });

      expect(mockSignOut).toHaveBeenCalled();
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.USER_MODE);
      expect(result.current.user).toBeNull();
      expect(result.current.firebaseUser).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.mode).toBe('business');
    });

    test('5.2 登出失敗處理', async () => {
      const mockSignOut = jest.fn().mockRejectedValue(new Error('Sign out error'));
      mockGetFirebaseAuth.mockReturnValue({
        signOut: mockSignOut,
        currentUser: null
      } as any);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.signOut();
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        '登出時發生錯誤:',
        expect.any(Error)
      );
      expect(result.current.error).toBe('Sign out error');

      consoleSpy.mockRestore();
    });

    test('5.3 AsyncStorage 清除失敗處理', async () => {
      const mockSignOut = jest.fn().mockResolvedValue(undefined);
      mockGetFirebaseAuth.mockReturnValue({
        signOut: mockSignOut,
        currentUser: null
      } as any);
      
      mockAsyncStorage.removeItem.mockRejectedValue(new Error('Storage error'));

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.signOut();
      });

      // Firebase 登出應該成功，狀態應該清除
      expect(mockSignOut).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('6. 用戶資料刷新測試', () => {
    test('6.1 成功刷新用戶資料', async () => {
      const mockCurrentUser = {
        uid: 'test-uid',
        email: 'test@example.com'
      };

      const mockUserDoc = {
        exists: () => true,
        data: () => ({
          email: 'updated@example.com',
          name: 'Updated User',
          role: 'manager',
          organizationId: 'org-1',
          teamIds: ['team-1', 'team-2']
        })
      };

      mockGetFirebaseAuth.mockReturnValue({
        currentUser: mockCurrentUser
      } as any);
      mockGetDoc.mockResolvedValue(mockUserDoc as any);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.refreshUser();
      });

      expect(result.current.user).toEqual(
        expect.objectContaining({
          id: 'test-uid',
          email: 'updated@example.com',
          name: 'Updated User',
          role: 'manager'
        })
      );
      expect(result.current.firebaseUser).toEqual(mockCurrentUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.error).toBeNull();
    });

    test('6.2 無登入用戶時刷新', async () => {
      mockGetFirebaseAuth.mockReturnValue({
        currentUser: null
      } as any);

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.refreshUser();
      });

      expect(consoleSpy).toHaveBeenCalledWith('refreshUser: 沒有登入的用戶');
      
      consoleSpy.mockRestore();
    });

    test('6.3 用戶檔案不存在', async () => {
      const mockCurrentUser = {
        uid: 'test-uid',
        email: 'test@example.com'
      };

      const mockUserDoc = {
        exists: () => false
      };

      mockGetFirebaseAuth.mockReturnValue({
        currentUser: mockCurrentUser
      } as any);
      mockGetDoc.mockResolvedValue(mockUserDoc as any);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.refreshUser();
      });

      expect(consoleSpy).toHaveBeenCalledWith('refreshUser: 找不到用戶檔案');
      expect(result.current.error).toBe('找不到用戶檔案');

      consoleSpy.mockRestore();
    });

    test('6.4 刷新用戶資料錯誤', async () => {
      const mockCurrentUser = {
        uid: 'test-uid',
        email: 'test@example.com'
      };

      mockGetFirebaseAuth.mockReturnValue({
        currentUser: mockCurrentUser
      } as any);
      mockGetDoc.mockRejectedValue(new Error('Firestore error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.refreshUser();
      });

      expect(consoleSpy).toHaveBeenCalledWith('refreshUser 錯誤:', expect.any(Error));
      expect(result.current.error).toBe('Firestore error');

      consoleSpy.mockRestore();
    });
  });

  describe('7. 狀態同步測試', () => {
    test('7.1 多個 hook 實例狀態同步', () => {
      const { result: result1 } = renderHook(() => useAuthStore());
      const { result: result2 } = renderHook(() => useAuthStore());

      const mockUser = {
        id: 'test-uid',
        email: 'test@example.com',
        name: 'Test User',
        role: 'salesperson' as const,
        organizationId: 'org-1',
        teamIds: ['team-1'],
        createdAt: new Date(),
        lastLoginAt: new Date()
      };

      act(() => {
        result1.current.setUser(mockUser);
      });

      // 兩個實例應該同步
      expect(result1.current.user).toEqual(mockUser);
      expect(result2.current.user).toEqual(mockUser);
      expect(result1.current.isAuthenticated).toBe(true);
      expect(result2.current.isAuthenticated).toBe(true);
    });

    test('7.2 錯誤狀態同步', () => {
      const { result: result1 } = renderHook(() => useAuthStore());
      const { result: result2 } = renderHook(() => useAuthStore());

      const errorMessage = '同步錯誤測試';

      act(() => {
        result1.current.setError(errorMessage);
      });

      expect(result1.current.error).toBe(errorMessage);
      expect(result2.current.error).toBe(errorMessage);
    });

    test('7.3 載入狀態同步', () => {
      const { result: result1 } = renderHook(() => useAuthStore());
      const { result: result2 } = renderHook(() => useAuthStore());

      act(() => {
        result1.current.setLoading(false);
      });

      expect(result1.current.isLoading).toBe(false);
      expect(result2.current.isLoading).toBe(false);
    });

    test('7.4 模式切換同步', async () => {
      const { result: result1 } = renderHook(() => useAuthStore());
      const { result: result2 } = renderHook(() => useAuthStore());

      await act(async () => {
        result1.current.toggleMode();
      });

      expect(result1.current.mode).toBe('manager');
      expect(result2.current.mode).toBe('manager');
    });
  });

  describe('8. 邊界條件和併發測試', () => {
    test('8.1 快速連續狀態更新', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.setLoading(i % 2 === 0);
          result.current.setError(i % 3 === 0 ? `錯誤 ${i}` : null);
        }
      });

      expect(result.current.isLoading).toBe(false); // 99 % 2 !== 0
      expect(result.current.error).toBe('錯誤 99'); // 99 % 3 === 0
    });

    test('8.2 併發模式切換和狀態更新', async () => {
      const { result } = renderHook(() => useAuthStore());

      const mockUser = {
        id: 'test-uid',
        email: 'test@example.com',
        name: 'Test User',
        role: 'salesperson' as const,
        organizationId: 'org-1',
        teamIds: ['team-1'],
        createdAt: new Date(),
        lastLoginAt: new Date()
      };

      await act(async () => {
        // 併發執行多個操作
        const promises = [
          result.current.toggleMode(),
          new Promise(resolve => {
            result.current.setUser(mockUser);
            resolve(undefined);
          }),
          new Promise(resolve => {
            result.current.setError('併發錯誤');
            resolve(undefined);
          })
        ];
        
        await Promise.all(promises);
      });

      expect(result.current.mode).toBe('manager');
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.error).toBe('併發錯誤');
    });

    test('8.3 大型用戶物件處理', () => {
      const { result } = renderHook(() => useAuthStore());

      const largeUser = {
        id: 'test-uid',
        email: 'test@example.com',
        name: 'Test User',
        role: 'salesperson' as const,
        organizationId: 'org-1',
        teamIds: Array.from({ length: 1000 }, (_, i) => `team-${i}`),
        managedTeamIds: Array.from({ length: 500 }, (_, i) => `managed-team-${i}`),
        customData: {
          preferences: Array.from({ length: 100 }, (_, i) => ({
            key: `pref-${i}`,
            value: `value-${i}`.repeat(100)
          }))
        },
        createdAt: new Date(),
        lastLoginAt: new Date()
      };

      act(() => {
        result.current.setUser(largeUser as any);
      });

      expect(result.current.user).toEqual(largeUser);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('9. 記憶體洩漏預防測試', () => {
    test('9.1 取消訂閱功能', async () => {
      const mockUnsubscribe = jest.fn();
      mockOnAuthStateChanged.mockReturnValue(mockUnsubscribe);

      const { result } = renderHook(() => useAuthStore());

      const unsubscribe = await act(async () => {
        return result.current.initializeAuth();
      });

      expect(typeof unsubscribe).toBe('function');

      // 調用取消訂閱
      if (unsubscribe) {
        unsubscribe();
        expect(mockUnsubscribe).toHaveBeenCalled();
      }
    });

    test('9.2 多次初始化和清理', async () => {
      const mockUnsubscribe = jest.fn();
      mockOnAuthStateChanged.mockReturnValue(mockUnsubscribe);

      const { result } = renderHook(() => useAuthStore());

      // 多次初始化
      const unsubscribeFns = [];
      for (let i = 0; i < 5; i++) {
        const unsubscribe = await act(async () => {
          return result.current.initializeAuth();
        });
        if (unsubscribe) unsubscribeFns.push(unsubscribe);
      }

      // 清理所有訂閱
      unsubscribeFns.forEach(unsubscribe => unsubscribe());

      expect(mockUnsubscribe).toHaveBeenCalledTimes(5);
    });
  });

  describe('10. 效能測試', () => {
    test('10.1 大量狀態讀取操作', () => {
      const { result } = renderHook(() => useAuthStore());

      const startTime = Date.now();
      
      // 大量讀取操作
      for (let i = 0; i < 10000; i++) {
        const { user, isAuthenticated, isLoading, error, mode } = result.current;
        // 模擬使用這些值
        void user;
        void isAuthenticated;
        void isLoading;
        void error;
        void mode;
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // 應該能在合理時間內完成
      expect(duration).toBeLessThan(100); // 100ms 內完成
    });

    test('10.2 頻繁狀態更新效能', () => {
      const { result } = renderHook(() => useAuthStore());

      const startTime = Date.now();

      act(() => {
        for (let i = 0; i < 1000; i++) {
          result.current.setLoading(i % 2 === 0);
        }
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(50); // 50ms 內完成
      expect(result.current.isLoading).toBe(false); // 最終狀態正確
    });
  });
});