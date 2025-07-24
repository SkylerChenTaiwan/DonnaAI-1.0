/**
 * Firebase 認證服務
 */

import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  updateEmail as firebaseUpdateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { doc, setDoc, updateDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb } from './config';
import { User, Organization, Team } from '@/types/user';

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  organizationName: string;
  role: 'salesperson' | 'manager' | 'admin';
}

export interface SignInData {
  email: string;
  password: string;
}

/**
 * 使用者登入
 */
export const signIn = async ({ email, password }: SignInData) => {
  try {
    const userCredential = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
    
    // 更新最後登入時間
    const userRef = doc(getFirebaseDb(), 'users', userCredential.user.uid);
    await setDoc(userRef, {
      lastLoginAt: Timestamp.now()
    }, { merge: true });
    
    return userCredential.user;
  } catch (error) {
    console.error('登入失敗:', error);
    throw new Error(getAuthErrorMessage(error));
  }
};

/**
 * 使用者註冊
 */
export const signUp = async ({ email, password, name, organizationName, role }: SignUpData) => {
  try {
    // 建立 Firebase 認證帳號
    const userCredential = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
    const { user: firebaseUser } = userCredential;
    
    // 更新 Firebase 使用者顯示名稱
    await updateProfile(firebaseUser, { displayName: name });
    
    // 建立組織（如果是第一個使用者）
    const organizationId = await createOrganizationIfNeeded(organizationName);
    
    // 建立預設團隊
    const teamId = await createDefaultTeam(organizationId, name);
    
    // 建立使用者檔案
    const userData: User = {
      id: firebaseUser.uid,
      email: firebaseUser.email!,
      name,
      role,
      organizationId,
      teamIds: [teamId],
      managedTeamIds: role === 'manager' || role === 'admin' ? [teamId] : undefined,
      createdAt: new Date(),
      lastLoginAt: new Date()
    };
    
    const userRef = doc(getFirebaseDb(), 'users', firebaseUser.uid);
    await setDoc(userRef, {
      ...userData,
      createdAt: Timestamp.now(),
      lastLoginAt: Timestamp.now()
    });
    
    return firebaseUser;
  } catch (error) {
    console.error('註冊失敗:', error);
    throw new Error(getAuthErrorMessage(error));
  }
};

/**
 * 密碼重設
 */
export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(getFirebaseAuth(), email);
  } catch (error) {
    console.error('密碼重設失敗:', error);
    throw new Error(getAuthErrorMessage(error));
  }
};

/**
 * 建立組織（如果不存在）
 */
const createOrganizationIfNeeded = async (organizationName: string): Promise<string> => {
  // 為簡化，每個註冊都建立新組織
  // 實際應用中可能需要邀請碼或驗證流程
  const orgId = `org_${Date.now()}`;
  
  const organizationData: Organization = {
    id: orgId,
    name: organizationName,
    subscriptionPlan: 'trial',
    aiMinutesQuota: 60, // 試用版每月 60 分鐘
    aiMinutesUsed: 0,
    createdAt: new Date()
  };
  
  const orgRef = doc(getFirebaseDb(), 'organizations', orgId);
  await setDoc(orgRef, {
    ...organizationData,
    createdAt: Timestamp.now()
  });
  
  return orgId;
};

/**
 * 建立預設團隊
 */
const createDefaultTeam = async (organizationId: string, userName: string): Promise<string> => {
  const teamId = `team_${Date.now()}`;
  
  const teamData: Team = {
    id: teamId,
    name: `${userName}的團隊`,
    organizationId,
    managerIds: [getFirebaseAuth().currentUser!.uid],
    memberIds: [getFirebaseAuth().currentUser!.uid]
  };
  
  const teamRef = doc(getFirebaseDb(), 'teams', teamId);
  await setDoc(teamRef, teamData);
  
  return teamId;
};

/**
 * 更新用戶名稱
 */
export const updateUserName = async (name: string): Promise<void> => {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error('用戶未登入');
  
  try {
    // 更新 Firebase Auth
    await updateProfile(user, { displayName: name });
    
    // 更新 Firestore
    const userRef = doc(getFirebaseDb(), 'users', user.uid);
    await updateDoc(userRef, { 
      name,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('更新用戶名稱失敗:', error);
    throw new Error(getAuthErrorMessage(error));
  }
};

/**
 * 更新用戶電子郵件
 * 需要重新驗證用戶
 */
export const updateUserEmail = async (newEmail: string, currentPassword: string): Promise<void> => {
  const user = getFirebaseAuth().currentUser;
  if (!user || !user.email) throw new Error('用戶未登入');
  
  try {
    // 重新驗證用戶
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    
    // 更新 Firebase Auth
    await firebaseUpdateEmail(user, newEmail);
    
    // 更新 Firestore
    const userRef = doc(getFirebaseDb(), 'users', user.uid);
    await updateDoc(userRef, { 
      email: newEmail,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('更新用戶電子郵件失敗:', error);
    throw new Error(getAuthErrorMessage(error));
  }
};

/**
 * 轉換 Firebase 錯誤訊息為使用者友善的中文訊息
 */
const getAuthErrorMessage = (error: any): string => {
  switch (error.code) {
    case 'auth/user-not-found':
      return '找不到此電子郵件帳號';
    case 'auth/wrong-password':
      return '密碼錯誤';
    case 'auth/email-already-in-use':
      return '此電子郵件已被註冊';
    case 'auth/weak-password':
      return '密碼強度不足，請至少使用 6 個字元';
    case 'auth/invalid-email':
      return '電子郵件格式無效';
    case 'auth/too-many-requests':
      return '嘗試次數過多，請稍後再試';
    case 'auth/network-request-failed':
      return '網路連線失敗，請檢查網路設定';
    case 'auth/requires-recent-login':
      return '為了安全考量，請重新登入後再嘗試更新';
    default:
      return error.message || '發生未知錯誤，請稍後再試';
  }
};