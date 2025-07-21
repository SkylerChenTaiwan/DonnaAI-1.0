/**
 * 自動設置管理員權限（僅用於測試環境）
 */

import { doc, updateDoc } from 'firebase/firestore';
import { getFirebaseDb } from '@/services/firebase/config';
import { useAuthStore } from '@/stores/authStore';

/**
 * 自動將當前使用者設為管理員（僅在開發環境）
 */
export async function autoSetupAdminForDev() {
  if (!__DEV__) {
    console.log('非開發環境，跳過自動管理員設置');
    return;
  }

  const user = useAuthStore.getState().user;
  if (!user) {
    console.log('使用者未登入，跳過自動管理員設置');
    return;
  }

  // 如果已經是管理員，跳過
  if (user.role === 'admin') {
    console.log('✅ 使用者已經是管理員');
    return;
  }

  console.log('🔧 開發環境：自動設置管理員權限...');

  try {
    const db = getFirebaseDb();
    
    // 更新 Firestore 中的使用者角色
    await updateDoc(doc(db, 'users', user.id), {
      role: 'admin',
      updatedAt: new Date()
    });
    
    // 更新本地狀態
    useAuthStore.setState({
      user: {
        ...user,
        role: 'admin'
      }
    });
    
    console.log('✅ 已自動設置為管理員（開發環境）');
    
  } catch (error) {
    console.error('❌ 自動設置管理員失敗:', error);
  }
}

// 延遲執行，確保使用者已經載入
if (__DEV__ && typeof window !== 'undefined') {
  setTimeout(() => {
    autoSetupAdminForDev();
  }, 3000);
}