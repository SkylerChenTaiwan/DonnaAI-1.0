/**
 * 用戶管理服務
 * 提供批量操作用戶的 API
 */

import {
  collection,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { getFirebaseDb } from '../config';
import { getAuth, deleteUser as deleteAuthUser } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { User } from '@/types/user';
import { isOrgAdmin } from '../permissions';

/**
 * 批量更新用戶狀態
 * @param userIds 用戶 ID 列表
 * @param isActive 是否啟用
 * @returns 更新成功的數量
 */
export async function batchUpdateUserStatus(
  userIds: string[],
  isActive: boolean
): Promise<{ success: number; failed: number; errors: string[] }> {
  const db = getFirebaseDb();
  const batch = writeBatch(db);
  const errors: string[] = [];
  let updateCount = 0;
  
  try {
    // 檢查權限
    const auth = getAuth();
    if (!auth.currentUser) {
      throw new Error('用戶未登入');
    }
    
    const isAdmin = await isOrgAdmin(auth.currentUser.uid);
    if (!isAdmin) {
      throw new Error('您沒有權限執行此操作');
    }
    
    // Firebase batch 有 500 筆的限制
    if (userIds.length > 500) {
      throw new Error('單次最多只能處理 500 筆資料');
    }
    
    // 更新每個用戶
    for (const userId of userIds) {
      try {
        const userRef = doc(db, 'users', userId);
        batch.update(userRef, {
          isActive,
          updatedAt: Timestamp.now(),
        });
        updateCount++;
      } catch (error) {
        errors.push(`用戶 ${userId}: ${error instanceof Error ? error.message : '更新失敗'}`);
      }
    }
    
    // 提交批次更新
    await batch.commit();
    
    return {
      success: updateCount,
      failed: userIds.length - updateCount,
      errors,
    };
  } catch (error) {
    console.error('batchUpdateUserStatus 錯誤:', error);
    throw error;
  }
}

/**
 * 批量更新用戶角色
 * @param userIds 用戶 ID 列表
 * @param role 新角色
 * @returns 更新成功的數量
 */
export async function batchUpdateUserRole(
  userIds: string[],
  role: User['role']
): Promise<{ success: number; failed: number; errors: string[] }> {
  const db = getFirebaseDb();
  const batch = writeBatch(db);
  const errors: string[] = [];
  let updateCount = 0;
  
  try {
    // 檢查權限
    const auth = getAuth();
    if (!auth.currentUser) {
      throw new Error('用戶未登入');
    }
    
    const isAdmin = await isOrgAdmin(auth.currentUser.uid);
    if (!isAdmin) {
      throw new Error('您沒有權限執行此操作');
    }
    
    // Firebase batch 有 500 筆的限制
    if (userIds.length > 500) {
      throw new Error('單次最多只能處理 500 筆資料');
    }
    
    // 更新每個用戶
    for (const userId of userIds) {
      try {
        const userRef = doc(db, 'users', userId);
        batch.update(userRef, {
          role,
          updatedAt: Timestamp.now(),
        });
        updateCount++;
      } catch (error) {
        errors.push(`用戶 ${userId}: ${error instanceof Error ? error.message : '更新失敗'}`);
      }
    }
    
    // 提交批次更新
    await batch.commit();
    
    return {
      success: updateCount,
      failed: userIds.length - updateCount,
      errors,
    };
  } catch (error) {
    console.error('batchUpdateUserRole 錯誤:', error);
    throw error;
  }
}

/**
 * 批量刪除用戶
 * 需要通過 Cloud Functions 來刪除 Auth 用戶
 * @param userIds 用戶 ID 列表
 * @returns 刪除結果
 */
export async function batchDeleteUsers(
  userIds: string[]
): Promise<{ success: number; failed: number; errors: string[] }> {
  const db = getFirebaseDb();
  const batch = writeBatch(db);
  const errors: string[] = [];
  let deleteCount = 0;
  
  try {
    // 檢查權限
    const auth = getAuth();
    if (!auth.currentUser) {
      throw new Error('用戶未登入');
    }
    
    const isAdmin = await isOrgAdmin(auth.currentUser.uid);
    if (!isAdmin) {
      throw new Error('您沒有權限執行此操作');
    }
    
    // Firebase batch 有 500 筆的限制
    if (userIds.length > 500) {
      throw new Error('單次最多只能處理 500 筆資料');
    }
    
    // 刪除 Firestore 中的用戶資料
    for (const userId of userIds) {
      try {
        const userRef = doc(db, 'users', userId);
        batch.delete(userRef);
        deleteCount++;
      } catch (error) {
        errors.push(`用戶 ${userId}: ${error instanceof Error ? error.message : '刪除失敗'}`);
      }
    }
    
    // 提交批次刪除
    await batch.commit();
    
    // 如果有 Cloud Functions，呼叫它來刪除 Auth 用戶
    // try {
    //   const functions = getFunctions();
    //   const deleteAuthUsers = httpsCallable(functions, 'deleteAuthUsers');
    //   await deleteAuthUsers({ userIds });
    // } catch (error) {
    //   console.error('刪除 Auth 用戶失敗:', error);
    //   errors.push('部分 Auth 用戶可能未成功刪除');
    // }
    
    return {
      success: deleteCount,
      failed: userIds.length - deleteCount,
      errors,
    };
  } catch (error) {
    console.error('batchDeleteUsers 錯誤:', error);
    throw error;
  }
}

/**
 * 檢查用戶是否可以被刪除
 * （例如：不能刪除自己、不能刪除唯一的管理員等）
 * @param userIds 用戶 ID 列表
 * @returns 可以刪除的用戶 ID 列表
 */
export async function validateDeletableUsers(
  userIds: string[]
): Promise<{ deletableIds: string[]; undeletableIds: string[]; reasons: Record<string, string> }> {
  const auth = getAuth();
  const currentUserId = auth.currentUser?.uid;
  const deletableIds: string[] = [];
  const undeletableIds: string[] = [];
  const reasons: Record<string, string> = {};
  
  if (!currentUserId) {
    throw new Error('用戶未登入');
  }
  
  const db = getFirebaseDb();
  
  try {
    // 獲取所有管理員
    const adminsQuery = query(
      collection(db, 'users'),
      where('role', 'in', ['admin', 'super_admin'])
    );
    const adminsSnapshot = await getDocs(adminsQuery);
    const adminIds = adminsSnapshot.docs.map(doc => doc.id);
    
    for (const userId of userIds) {
      // 不能刪除自己
      if (userId === currentUserId) {
        undeletableIds.push(userId);
        reasons[userId] = '不能刪除自己的帳號';
        continue;
      }
      
      // 如果是最後一個管理員，不能刪除
      if (adminIds.includes(userId) && adminIds.length <= 1) {
        undeletableIds.push(userId);
        reasons[userId] = '不能刪除組織中的最後一名管理員';
        continue;
      }
      
      deletableIds.push(userId);
    }
    
    return { deletableIds, undeletableIds, reasons };
  } catch (error) {
    console.error('validateDeletableUsers 錯誤:', error);
    throw error;
  }
}

/**
 * 重設用戶密碼
 * 需要通過 Cloud Functions 來實現
 * @param userId 用戶 ID
 * @param newPassword 新密碼
 */
export async function resetUserPassword(
  userId: string,
  newPassword: string
): Promise<void> {
  try {
    // 檢查權限
    const auth = getAuth();
    if (!auth.currentUser) {
      throw new Error('用戶未登入');
    }
    
    const isAdmin = await isOrgAdmin(auth.currentUser.uid);
    if (!isAdmin) {
      throw new Error('您沒有權限執行此操作');
    }
    
    // 需要 Cloud Functions 來處理
    // const functions = getFunctions();
    // const resetPassword = httpsCallable(functions, 'resetUserPassword');
    // await resetPassword({ userId, newPassword });
    
    throw new Error('密碼重設功能尚未實作，需要 Cloud Functions 支援');
  } catch (error) {
    console.error('resetUserPassword 錯誤:', error);
    throw error;
  }
}