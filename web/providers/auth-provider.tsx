/**
 * Firebase 認證 Provider
 * 提供全域認證狀態管理和認證相關功能
 */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  AuthError,
  onAuthStateChanged,
  type UserCredential,
} from 'firebase/auth';
import { auth } from '@/lib/firebase-client';

// 認證狀態介面
export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

// 認證操作介面
export interface AuthActions {
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signUp: (email: string, password: string, displayName?: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (displayName?: string, photoURL?: string) => Promise<void>;
  clearError: () => void;
}

// 認證 Context 介面
export interface AuthContextType extends AuthState, AuthActions {}

// 建立 Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 認證 Hook
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// 錯誤處理函數
function getAuthErrorMessage(error: AuthError): string {
  const errorCode = error.code;
  
  switch (errorCode) {
    case 'auth/user-not-found':
      return '使用者不存在，請檢查 Email 或建立新帳號';
    case 'auth/wrong-password':
      return '密碼錯誤，請重新輸入';
    case 'auth/invalid-email':
      return 'Email 格式不正確';
    case 'auth/user-disabled':
      return '此帳號已被停用，請聯絡客服';
    case 'auth/email-already-in-use':
      return '此 Email 已被註冊，請使用其他 Email 或嘗試登入';
    case 'auth/weak-password':
      return '密碼強度不足，請使用至少 6 個字元';
    case 'auth/network-request-failed':
      return '網路連線失敗，請檢查網路狀態';
    case 'auth/too-many-requests':
      return '嘗試次數過多，請稍後再試';
    case 'auth/invalid-credential':
      return 'Email 或密碼不正確';
    default:
      return `認證失敗：${error.message}`;
  }
}

// 認證 Provider 組件
interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  // 監聽認證狀態變化
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setState(prev => ({
          ...prev,
          user,
          loading: false,
          error: null,
        }));
      },
      (error) => {
        console.error('Auth state change error:', error);
        setState(prev => ({
          ...prev,
          user: null,
          loading: false,
          error: getAuthErrorMessage(error as AuthError),
        }));
      }
    );

    return () => unsubscribe();
  }, []);

  // 登入
  const signIn = async (email: string, password: string): Promise<UserCredential> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setState(prev => ({ ...prev, loading: false, error: null }));
      return userCredential;
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error as AuthError);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      throw error;
    }
  };

  // 註冊
  const signUp = async (
    email: string, 
    password: string, 
    displayName?: string
  ): Promise<UserCredential> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // 如果提供了顯示名稱，更新用戶資料
      if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
      }
      
      setState(prev => ({ ...prev, loading: false, error: null }));
      return userCredential;
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error as AuthError);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      throw error;
    }
  };

  // 登出
  const logout = async (): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      await signOut(auth);
      setState(prev => ({ 
        ...prev, 
        user: null, 
        loading: false, 
        error: null 
      }));
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error as AuthError);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      throw error;
    }
  };

  // 重設密碼
  const resetPassword = async (email: string): Promise<void> => {
    setState(prev => ({ ...prev, error: null }));
    
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error as AuthError);
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  };

  // 更新用戶資料
  const updateUserProfile = async (
    displayName?: string, 
    photoURL?: string
  ): Promise<void> => {
    if (!auth.currentUser) {
      throw new Error('未登入使用者');
    }

    setState(prev => ({ ...prev, error: null }));
    
    try {
      const updateData: { displayName?: string; photoURL?: string } = {};
      if (displayName !== undefined) updateData.displayName = displayName;
      if (photoURL !== undefined) updateData.photoURL = photoURL;
      
      await updateProfile(auth.currentUser, updateData);
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error as AuthError);
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  };

  // 清除錯誤
  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  const contextValue: AuthContextType = {
    ...state,
    signIn,
    signUp,
    logout,
    resetPassword,
    updateUserProfile,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}