/**
 * 認證 Hook
 * 提供使用者認證狀態和相關功能
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { getFirebaseAuth } from '@/services/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseDb } from '@/services/firebase/config';

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  role?: string;
  isSuperAdmin?: boolean;
  teamId?: string;
  organizationId?: string;
  permissions?: string[];
  platformPermissions?: string[];
}

export interface AuthState {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  checkPermission: (permission: string) => boolean;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // 獲取用戶詳細資料
  const fetchUserProfile = async (uid: string) => {
    try {
      const db = getFirebaseDb();
      const userDoc = await getDoc(doc(db, 'users', uid));
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserProfile({
          id: uid,
          email: data.email,
          displayName: data.displayName,
          role: data.role,
          isSuperAdmin: data.isSuperAdmin || data.role === 'super_admin',
          teamId: data.teamId,
          organizationId: data.organizationId,
          permissions: data.permissions || [],
          platformPermissions: data.platformPermissions || []
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  useEffect(() => {
    const auth = getFirebaseAuth();
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        await fetchUserProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // 登入
  const signIn = useCallback(async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    if (userCredential.user) {
      await fetchUserProfile(userCredential.user.uid);
    }
  }, []);

  // 註冊
  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    const auth = getFirebaseAuth();
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    if (userCredential.user && displayName) {
      await updateProfile(userCredential.user, { displayName });
    }
    
    if (userCredential.user) {
      await fetchUserProfile(userCredential.user.uid);
    }
  }, []);

  // 登出
  const signOut = useCallback(async () => {
    const auth = getFirebaseAuth();
    await firebaseSignOut(auth);
    setUserProfile(null);
  }, []);

  // 重設密碼
  const resetPassword = useCallback(async (email: string) => {
    const auth = getFirebaseAuth();
    await sendPasswordResetEmail(auth, email);
  }, []);

  // 檢查權限
  const checkPermission = useCallback((permission: string): boolean => {
    if (!userProfile) return false;
    
    // 管理員擁有所有權限
    if (userProfile.role === 'admin') return true;
    
    // 檢查特定權限
    return userProfile.permissions?.includes(permission) || false;
  }, [userProfile]);

  // 更新用戶資料
  const updateUserProfile = useCallback(async (data: Partial<UserProfile>) => {
    if (!user) throw new Error('No authenticated user');
    
    const auth = getFirebaseAuth();
    
    // 更新 Firebase Auth 顯示名稱
    if (data.displayName && user) {
      await updateProfile(user, { displayName: data.displayName });
    }
    
    // TODO: 更新 Firestore 中的用戶資料
    // 這需要整合用戶服務
    
    // 重新獲取用戶資料
    await fetchUserProfile(user.uid);
  }, [user]);

  return {
    user,
    userProfile,
    loading,
    isAuthenticated: !!user,
    isSuperAdmin: userProfile?.isSuperAdmin || userProfile?.role === 'super_admin',
    signIn,
    signUp,
    signOut,
    resetPassword,
    checkPermission,
    updateUserProfile
  };
}