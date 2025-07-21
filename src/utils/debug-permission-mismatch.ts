/**
 * 調試權限不匹配問題
 */

import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getFirebaseDb } from '@/services/firebase/config';
import { useAuthStore } from '@/stores/authStore';
import { getAuth } from 'firebase/auth';

/**
 * 詳細調試權限不匹配
 */
export async function debugPermissionMismatch(customerId: string) {
  console.log('🔍 開始調試權限不匹配...');
  console.log('=====================================');
  
  try {
    const db = getFirebaseDb();
    const auth = getAuth();
    const firebaseUser = auth.currentUser;
    const storeUser = useAuthStore.getState().user;
    
    // 1. 檢查認證狀態
    console.log('1️⃣ 認證狀態檢查:');
    console.log('   Firebase Auth UID:', firebaseUser?.uid || '❌ 未登入');
    console.log('   Store User ID:', storeUser?.id || '❌ 無使用者');
    console.log('   一致性:', firebaseUser?.uid === storeUser?.id ? '✅ 一致' : '❌ 不一致');
    
    if (!firebaseUser || !storeUser) {
      console.error('❌ 使用者未正確登入');
      return;
    }
    
    // 2. 檢查使用者文檔
    console.log('\n2️⃣ 使用者文檔檢查:');
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    
    if (!userDoc.exists()) {
      console.error('❌ 使用者文檔不存在於 Firestore');
      return;
    }
    
    const userData = userDoc.data();
    console.log('   角色:', userData.role);
    console.log('   團隊 IDs:', userData.teamIds || '[]');
    console.log('   組織 ID:', userData.organizationId);
    console.log('   是管理員:', userData.role === 'admin' ? '✅ 是' : '❌ 否');
    
    // 3. 檢查客戶文檔
    console.log('\n3️⃣ 客戶文檔檢查:');
    const customerDoc = await getDoc(doc(db, 'customers', customerId));
    
    if (!customerDoc.exists()) {
      console.error('❌ 客戶不存在');
      return;
    }
    
    const customerData = customerDoc.data();
    console.log('   客戶 ID:', customerId);
    console.log('   負責人:', customerData.assignedTo);
    console.log('   團隊 ID:', customerData.teamId);
    console.log('   組織 ID:', customerData.organizationId);
    
    // 4. 權限匹配分析
    console.log('\n4️⃣ 權限匹配分析:');
    const isAdmin = userData.role === 'admin';
    const isAssignedTo = customerData.assignedTo === firebaseUser.uid;
    const isTeamMember = userData.teamIds?.includes(customerData.teamId) || false;
    const sameOrg = userData.organizationId === customerData.organizationId;
    
    console.log('   是管理員:', isAdmin ? '✅' : '❌');
    console.log('   是負責人:', isAssignedTo ? '✅' : '❌');
    console.log('   是團隊成員:', isTeamMember ? '✅' : '❌');
    console.log('   同一組織:', sameOrg ? '✅' : '❌');
    
    // 5. Firestore 規則要求
    console.log('\n5️⃣ Firestore 規則要求:');
    console.log('   必須是團隊成員:', isTeamMember ? '✅ 滿足' : '❌ 不滿足');
    console.log('   必須是負責人或管理員:', (isAssignedTo || isAdmin) ? '✅ 滿足' : '❌ 不滿足');
    
    const canEdit = isTeamMember && (isAssignedTo || isAdmin);
    console.log('\n🎯 最終結果: 可以編輯嗎?', canEdit ? '✅ 可以' : '❌ 不可以');
    
    if (!canEdit) {
      console.log('\n❌ 權限不足的原因:');
      if (!isTeamMember) {
        console.log('   - 您不是客戶所屬團隊的成員');
        console.log('     您的團隊:', userData.teamIds);
        console.log('     客戶團隊:', customerData.teamId);
      }
      if (!isAssignedTo && !isAdmin) {
        console.log('   - 您不是客戶負責人，也不是管理員');
        console.log('     客戶負責人:', customerData.assignedTo);
        console.log('     您的 ID:', firebaseUser.uid);
      }
    }
    
    // 6. 提供修復選項
    console.log('\n6️⃣ 修復選項:');
    console.log('   A. makeUserAdmin() - 將您設為管理員');
    console.log('   B. assignCustomerToMe("' + customerId + '") - 將客戶指派給您');
    console.log('   C. addUserToTeam("' + customerData.teamId + '") - 將您加入客戶團隊');
    
  } catch (error) {
    console.error('❌ 調試過程發生錯誤:', error);
  }
}

/**
 * 將當前使用者設為管理員
 */
export async function makeUserAdmin() {
  console.log('🔧 設置管理員權限...');
  
  try {
    const auth = getAuth();
    const firebaseUser = auth.currentUser;
    
    if (!firebaseUser) {
      console.error('❌ 未登入');
      return;
    }
    
    const db = getFirebaseDb();
    await updateDoc(doc(db, 'users', firebaseUser.uid), {
      role: 'admin',
      updatedAt: new Date()
    });
    
    // 更新本地狀態
    const user = useAuthStore.getState().user;
    if (user) {
      useAuthStore.setState({
        user: { ...user, role: 'admin' }
      });
    }
    
    console.log('✅ 已設為管理員！請重試批量編輯。');
    
  } catch (error) {
    console.error('❌ 設置失敗:', error);
  }
}

/**
 * 將客戶指派給當前使用者
 */
export async function assignCustomerToMe(customerId: string) {
  console.log('🔧 指派客戶...');
  
  try {
    const auth = getAuth();
    const firebaseUser = auth.currentUser;
    
    if (!firebaseUser) {
      console.error('❌ 未登入');
      return;
    }
    
    const db = getFirebaseDb();
    await updateDoc(doc(db, 'customers', customerId), {
      assignedTo: firebaseUser.uid,
      updatedAt: new Date()
    });
    
    console.log('✅ 客戶已指派給您！');
    
  } catch (error) {
    console.error('❌ 指派失敗:', error);
  }
}

/**
 * 將使用者加入團隊
 */
export async function addUserToTeam(teamId: string) {
  console.log('🔧 加入團隊...');
  
  try {
    const auth = getAuth();
    const firebaseUser = auth.currentUser;
    
    if (!firebaseUser) {
      console.error('❌ 未登入');
      return;
    }
    
    const db = getFirebaseDb();
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    
    if (!userDoc.exists()) {
      console.error('❌ 使用者文檔不存在');
      return;
    }
    
    const userData = userDoc.data();
    const currentTeamIds = userData.teamIds || [];
    
    if (!currentTeamIds.includes(teamId)) {
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        teamIds: [...currentTeamIds, teamId],
        updatedAt: new Date()
      });
      
      // 更新本地狀態
      const user = useAuthStore.getState().user;
      if (user) {
        useAuthStore.setState({
          user: { ...user, teamIds: [...currentTeamIds, teamId] }
        });
      }
      
      console.log('✅ 已加入團隊！');
    } else {
      console.log('ℹ️ 您已經在此團隊中');
    }
    
  } catch (error) {
    console.error('❌ 加入團隊失敗:', error);
  }
}

// 掛載到 window
if (typeof window !== 'undefined') {
  (window as any).debugPermissionMismatch = debugPermissionMismatch;
  (window as any).makeUserAdmin = makeUserAdmin;
  (window as any).assignCustomerToMe = assignCustomerToMe;
  (window as any).addUserToTeam = addUserToTeam;
  
  console.log('🐛 權限調試工具已載入！');
  console.log('可用命令：');
  console.log('- debugPermissionMismatch("customer_id") : 詳細調試權限問題');
  console.log('- makeUserAdmin() : 設為管理員');
  console.log('- assignCustomerToMe("customer_id") : 指派客戶給自己');
  console.log('- addUserToTeam("team_id") : 加入團隊');
}