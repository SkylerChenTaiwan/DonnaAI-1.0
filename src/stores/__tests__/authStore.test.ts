/**
 * authStore 模式持久化測試
 */

import { renderHook, act } from '@testing-library/react-hooks';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../authStore';
import { STORAGE_KEYS } from '@/config/constants';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Firebase
vi.mock('@/services/firebase/config', () => ({
  getFirebaseAuth: jest.fn(() => ({
    signOut: vi.fn().mockResolvedValue(undefined) })),
  getFirebaseDb: vi.fn() }));

// Mock Firebase Auth
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn((auth, callback) => {
    // 立即呼叫 callback 模擬未登入狀態
    callback(null);
    // 返回取消訂閱函數
    return vi.fn();
  }) }));

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn() }));

describe('authStore mode persistence', () => {
  beforeEach(() => {
    // 清除所有 mock
    vi.clearAllMocks();
    // 清除 AsyncStorage
    AsyncStorage.clear();
    // 重置 store
    useAuthStore.setState({
      user: null,
      firebaseUser: null,
      isLoading: true,
      isAuthenticated: false,
      error: null,
      mode: 'business' });
  });

  it('應該從 AsyncStorage 載入模式', async () => {
    // 設定儲存的模式
    await AsyncStorage.setItem(STORAGE_KEYS.USER_MODE, 'manager');
    
    const { result } = renderHook(() => useAuthStore());
    
    // 執行初始化
    act(() => {
      result.current.initializeAuth();
    });
    
    // 等待非同步操作完成
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    expect(result.current.mode).toBe('manager');
  });

  it('如果沒有儲存的模式，應該使用預設模式', async () => {
    const { result } = renderHook(() => useAuthStore());
    
    // 執行初始化
    act(() => {
      result.current.initializeAuth();
    });
    
    // 等待非同步操作完成
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    expect(result.current.mode).toBe('business');
  });

  it('toggleMode 應該儲存到 AsyncStorage', async () => {
    const { result } = renderHook(() => useAuthStore());
    
    // 初始模式應該是 business
    expect(result.current.mode).toBe('business');
    
    // 切換模式
    await act(async () => {
      result.current.toggleMode();
    });
    
    // 檢查模式已切換
    expect(result.current.mode).toBe('manager');
    
    // 檢查是否儲存到 AsyncStorage
    const savedMode = await AsyncStorage.getItem(STORAGE_KEYS.USER_MODE);
    expect(savedMode).toBe('manager');
  });

  it('再次 toggleMode 應該切換回 business', async () => {
    const { result } = renderHook(() => useAuthStore());
    
    // 先切換到 manager
    await act(async () => {
      result.current.toggleMode();
    });
    
    expect(result.current.mode).toBe('manager');
    
    // 再切換回 business
    await act(async () => {
      result.current.toggleMode();
    });
    
    expect(result.current.mode).toBe('business');
    
    // 檢查是否儲存到 AsyncStorage
    const savedMode = await AsyncStorage.getItem(STORAGE_KEYS.USER_MODE);
    expect(savedMode).toBe('business');
  });

  it('signOut 應該清除儲存的模式並重置為預設', async () => {
    const { result } = renderHook(() => useAuthStore());
    
    // 先設定為 manager 模式
    await act(async () => {
      result.current.toggleMode();
    });
    
    expect(result.current.mode).toBe('manager');
    
    // 登出
    await act(async () => {
      await result.current.signOut();
    });
    
    // 檢查模式已重置
    expect(result.current.mode).toBe('business');
    
    // 檢查 AsyncStorage 已清除
    const savedMode = await AsyncStorage.getItem(STORAGE_KEYS.USER_MODE);
    expect(savedMode).toBeNull();
  });

  it('處理 AsyncStorage 錯誤時應該使用預設值', async () => {
    // Mock AsyncStorage 錯誤
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation();
    AsyncStorage.getItem = vi.fn().mockRejectedValue(new Error('AsyncStorage error'));
    
    const { result } = renderHook(() => useAuthStore());
    
    // 執行初始化
    act(() => {
      result.current.initializeAuth();
    });
    
    // 等待非同步操作完成
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    // 應該使用預設模式
    expect(result.current.mode).toBe('business');
    
    // 應該記錄錯誤
    expect(consoleSpy).toHaveBeenCalledWith('載入使用者模式失敗:', expect.any(Error));
    
    consoleSpy.mockRestore();
  });

  it('儲存模式失敗時應該記錄錯誤但不影響切換', async () => {
    // Mock AsyncStorage 儲存錯誤
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation();
    AsyncStorage.setItem = vi.fn().mockRejectedValue(new Error('Storage error'));
    
    const { result } = renderHook(() => useAuthStore());
    
    // 切換模式
    await act(async () => {
      result.current.toggleMode();
    });
    
    // 模式應該已切換
    expect(result.current.mode).toBe('manager');
    
    // 應該記錄錯誤
    expect(consoleSpy).toHaveBeenCalledWith('儲存使用者模式失敗:', expect.any(Error));
    
    consoleSpy.mockRestore();
  });

  it('無效的儲存值應該使用預設模式', async () => {
    // 設定無效的模式值
    await AsyncStorage.setItem(STORAGE_KEYS.USER_MODE, 'invalid_mode');
    
    const { result } = renderHook(() => useAuthStore());
    
    // 執行初始化
    act(() => {
      result.current.initializeAuth();
    });
    
    // 等待非同步操作完成
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    // 應該使用預設模式
    expect(result.current.mode).toBe('business');
  });
});