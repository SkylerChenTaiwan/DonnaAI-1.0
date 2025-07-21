/**
 * 立即修復權限問題
 */

import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { getFirebaseDb } from '@/services/firebase/config';
import { useAuthStore } from '@/stores/authStore';
import { getAuth } from 'firebase/auth';

/**
 * 立即檢查並修復權限
 */
export async function immediatePermissionFix() {
  console.log('🔧 開始權限檢查...');
  
  try {
    // 獲取 Firebase Auth 使用者
    const auth = getAuth();
    const firebaseUser = auth.currentUser;
    
    if (!firebaseUser) {
      console.log('❌ Firebase 使用者未登入');
      return false;
    }
    
    console.log('📧 Firebase 使用者:', firebaseUser.email);
    console.log('🆔 Firebase UID:', firebaseUser.uid);
    
    const db = getFirebaseDb();
    
    // 檢查使用者文檔是否存在
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      console.log('⚠️ 使用者文檔不存在，創建新文檔...');
      
      // 創建使用者文檔
      const newUserData = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        role: 'admin', // 直接設為管理員
        organizationId: 'default-org',
        teamIds: ['default-team'],
        managedTeamIds: ['default-team'],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await setDoc(userDocRef, newUserData);
      console.log('✅ 創建使用者文檔成功');
      
      // 更新本地狀態
      useAuthStore.setState({
        user: newUserData,
        isAuthenticated: true
      });
      
      return true;
    }
    
    // 如果文檔存在，檢查是否為管理員
    const userData = userDoc.data();
    console.log('👤 當前使用者資料:', {
      role: userData.role,
      teamIds: userData.teamIds,
      organizationId: userData.organizationId
    });
    
    if (userData.role !== 'admin') {
      console.log('🔧 更新使用者為管理員...');
      
      // 更新為管理員
      await updateDoc(userDocRef, {
        role: 'admin',
        updatedAt: new Date()
      });
      
      // 更新本地狀態
      const updatedUser = {
        ...userData,
        id: firebaseUser.uid,
        role: 'admin'
      };
      
      useAuthStore.setState({
        user: updatedUser,
        isAuthenticated: true
      });
      
      console.log('✅ 已更新為管理員');
      return true;
    }
    
    // 確保本地狀態同步
    if (!useAuthStore.getState().user || useAuthStore.getState().user?.role !== 'admin') {
      console.log('🔧 同步本地狀態...');
      
      useAuthStore.setState({
        user: {
          ...userData,
          id: firebaseUser.uid
        },
        isAuthenticated: true
      });
      
      console.log('✅ 本地狀態已同步');
    }
    
    console.log('✅ 權限檢查完成，使用者已是管理員');
    return true;
    
  } catch (error) {
    console.error('❌ 權限修復失敗:', error);
    return false;
  }
}

/**
 * 檢查特定客戶的詳細資訊
 */
export async function checkCustomerDetails(customerId: string) {
  console.log(`🔍 檢查客戶 ${customerId} 的詳細資訊...`);
  
  try {
    const db = getFirebaseDb();
    const customerDoc = await getDoc(doc(db, 'customers', customerId));
    
    if (!customerDoc.exists()) {
      console.log('❌ 客戶不存在');
      return;
    }
    
    const customerData = customerDoc.data();
    console.log('📋 客戶資料:', {
      id: customerId,
      assignedTo: customerData.assignedTo,
      teamId: customerData.teamId,
      organizationId: customerData.organizationId,
      name: customerData.name,
      company: customerData.company
    });
    
    // 檢查當前使用者
    const user = useAuthStore.getState().user;
    const auth = getAuth();
    const firebaseUser = auth.currentUser;
    
    console.log('👤 當前使用者:', {
      storeUserId: user?.id,
      storeUserRole: user?.role,
      firebaseUid: firebaseUser?.uid,
      firebaseEmail: firebaseUser?.email
    });
    
    // 檢查權限匹配
    console.log('🔐 權限檢查:', {
      isAssignedTo: customerData.assignedTo === user?.id,
      isAdmin: user?.role === 'admin',
      sameTeam: user?.teamIds?.includes(customerData.teamId)
    });
    
  } catch (error) {
    console.error('❌ 檢查客戶失敗:', error);
  }
}

// 掛載到 window
if (typeof window !== 'undefined') {
  (window as any).immediatePermissionFix = immediatePermissionFix;
  (window as any).checkCustomerDetails = checkCustomerDetails;
  
  console.log('🛠️ 立即權限修復工具已載入！');
  console.log('可用命令：');
  console.log('- immediatePermissionFix() : 立即修復權限');
  console.log('- checkCustomerDetails("customer_id") : 檢查客戶詳細資訊');
  
  // 自動執行一次
  setTimeout(() => {
    immediatePermissionFix();
  }, 1000);
}