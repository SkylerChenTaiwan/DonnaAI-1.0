/**
 * 認證狀態管理 - 使用 Zustand + Firebase
 */

import { create } from 'zustand';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/services/firebase/config';
import { User } from '@/types/user';

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
  toggleMode: () => set((state) => ({ 
    mode: state.mode === 'business' ? 'manager' : 'business' 
  })),
  
  initializeAuth: () => {
    // 訂閱認證狀態變更
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      set({ firebaseUser, isLoading: true, error: null });
      
      if (firebaseUser) {
        try {
          // 從 Firestore 取得使用者檔案
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
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
      await auth.signOut();
      set({ 
        user: null, 
        firebaseUser: null, 
        isAuthenticated: false, 
        error: null 
      });
    } catch (error) {
      console.error('登出時發生錯誤:', error);
      set({ 
        error: error instanceof Error ? error.message : '登出時發生錯誤' 
      });
    }
  }
}));