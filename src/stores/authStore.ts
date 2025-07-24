/**
 * 認證狀態管理 - 使用 Zustand + Firebase
 */

import { create } from 'zustand';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb } from '@/services/firebase/config';
import { User } from '@/types/user';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/config/constants';

interface AuthState {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  mode: 'business' | 'manager';
  
  // 動作
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  toggleMode: () => void;
  initializeAuth: () => () => void; // 返回取消訂閱函數
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  firebaseUser: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
  mode: 'business',
  
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  toggleMode: () => set((state) => { 
    const newMode = state.mode === 'business' ? 'manager' : 'business';
    // 持久化模式到 AsyncStorage
    AsyncStorage.setItem(STORAGE_KEYS.USER_MODE, newMode).catch(error => {
      console.error('儲存使用者模式失敗:', error);
    });
    return { mode: newMode };
  }),
  
  initializeAuth: () => {
    // 載入持久化的模式
    AsyncStorage.getItem(STORAGE_KEYS.USER_MODE).then(savedMode => {
      if (savedMode === 'manager' || savedMode === 'business') {
        set({ mode: savedMode });
      }
    }).catch(error => {
      console.error('載入使用者模式失敗:', error);
    });
    
    // 訂閱認證狀態變更
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), async (firebaseUser) => {
      set({ firebaseUser, isLoading: true, error: null });
      
      if (firebaseUser) {
        try {
          // 從 Firestore 取得使用者檔案
          const userDoc = await getDoc(doc(getFirebaseDb(), 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = {
              ...userDoc.data(),
              id: firebaseUser.uid  // 確保有 id 欄位
            } as User;
            set({ 
              user: userData, 
              isAuthenticated: true, 
              isLoading: false,
              error: null 
            });
          } else {
            // 已認證但沒有檔案
            set({ 
              user: null, 
              isAuthenticated: false, 
              isLoading: false,
              error: '找不到使用者檔案，請聯繫管理員' 
            });
          }
        } catch (error) {
          console.error('載入使用者檔案時發生錯誤:', error);
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false,
            error: error instanceof Error ? error.message : '載入使用者資料時發生錯誤'
          });
        }
      } else {
        // 未認證
        set({ 
          user: null, 
          isAuthenticated: false, 
          isLoading: false,
          error: null 
        });
      }
    });
    
    return unsubscribe;
  },
  
  signOut: async () => {
    try {
      await getFirebaseAuth().signOut();
      // 清除持久化的模式
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_MODE);
      set({ 
        user: null, 
        firebaseUser: null, 
        isAuthenticated: false, 
        error: null,
        mode: 'business' // 重置為預設模式
      });
    } catch (error) {
      console.error('登出時發生錯誤:', error);
      set({ 
        error: error instanceof Error ? error.message : '登出時發生錯誤' 
      });
    }
  },
  
  refreshUser: async () => {
    const currentUser = getFirebaseAuth().currentUser;
    if (!currentUser) {
      console.warn('refreshUser: 沒有登入的用戶');
      return;
    }
    
    try {
      const userDoc = await getDoc(doc(getFirebaseDb(), 'users', currentUser.uid));
      if (userDoc.exists()) {
        const userData = {
          ...userDoc.data(),
          id: currentUser.uid
        } as User;
        
        set({ 
          user: userData,
          firebaseUser: currentUser,
          isAuthenticated: true,
          error: null
        });
      } else {
        console.error('refreshUser: 找不到用戶檔案');
        set({ 
          error: '找不到用戶檔案' 
        });
      }
    } catch (error) {
      console.error('refreshUser 錯誤:', error);
      set({ 
        error: error instanceof Error ? error.message : '重新載入用戶資料時發生錯誤' 
      });
    }
  }
}));