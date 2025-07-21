/**
 * 修復測試資料權限問題
 * 將所有客戶的負責人設為當前使用者
 */

import { collection, getDocs, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { getFirebaseDb } from '@/services/firebase/config';
import { useAuthStore } from '@/stores/authStore';

/**
 * 修復所有客戶的權限
 * 將所有客戶的 assignedTo 設為當前使用者
 */
export async function fixAllCustomerPermissions() {
  const user = useAuthStore.getState().user;
  if (!user) {
    console.error('❌ 使用者未登入');
    return;
  }

  console.log('🔧 開始修復所有客戶權限...');
  console.log('當前使用者:', user.email);
  console.log('使用者 ID:', user.id);
  console.log('使用者團隊:', user.teamIds);

  try {
    const db = getFirebaseDb();
    
    // 獲取所有客戶
    const customersSnapshot = await getDocs(collection(db, 'customers'));
    console.log(`找到 ${customersSnapshot.size} 個客戶`);

    // 使用批次更新
    const batch = writeBatch(db);
    let updateCount = 0;

    customersSnapshot.forEach((customerDoc) => {
      const customerData = customerDoc.data();
      const updates: any = {};
      
      // 如果客戶沒有 assignedTo 或不是當前使用者，更新它
      if (customerData.assignedTo !== user.id) {
        updates.assignedTo = user.id;
        console.log(`  - 更新客戶 ${customerDoc.id} 的負責人`);
      }
      
      // 如果使用者有團隊，確保客戶也在同一團隊
      if (user.teamIds && user.teamIds.length > 0) {
        const userTeamId = user.teamIds[0]; // 使用第一個團隊
        if (customerData.teamId !== userTeamId) {
          updates.teamId = userTeamId;
          console.log(`  - 更新客戶 ${customerDoc.id} 的團隊為 ${userTeamId}`);
        }
      }
      
      // 確保組織 ID 一致
      if (user.organizationId && customerData.organizationId !== user.organizationId) {
        updates.organizationId = user.organizationId;
        console.log(`  - 更新客戶 ${customerDoc.id} 的組織`);
      }
      
      // 如果有更新，加入批次
      if (Object.keys(updates).length > 0) {
        batch.update(doc(db, 'customers', customerDoc.id), {
          ...updates,
          updatedAt: new Date()
        });
        updateCount++;
      }
    });

    // 執行批次更新
    if (updateCount > 0) {
      await batch.commit();
      console.log(`✅ 成功更新 ${updateCount} 個客戶的權限`);
      console.log('請重新整理頁面以載入更新後的資料');
    } else {
      console.log('✅ 所有客戶權限已經正確，無需更新');
    }

  } catch (error) {
    console.error('❌ 修復權限失敗:', error);
    throw error;
  }
}

/**
 * 檢查當前使用者的完整權限狀態
 */
export async function checkUserFullPermissions() {
  const user = useAuthStore.getState().user;
  if (!user) {
    console.error('❌ 使用者未登入');
    return;
  }

  console.log('🔍 檢查使用者完整權限狀態');
  console.log('========================');
  
  try {
    const db = getFirebaseDb();
    
    // 檢查使用者文檔
    const userDoc = await getDocs(collection(db, 'users'));
    console.log(`\n📊 系統中共有 ${userDoc.size} 個使用者`);
    
    userDoc.forEach((doc) => {
      const userData = doc.data();
      console.log(`\n使用者: ${userData.email}`);
      console.log(`  - ID: ${doc.id}`);
      console.log(`  - 角色: ${userData.role}`);
      console.log(`  - 組織: ${userData.organizationId}`);
      console.log(`  - 團隊: ${userData.teamIds?.join(', ') || '無'}`);
      console.log(`  - 是否為當前使用者: ${doc.id === user.id ? '✅ 是' : '❌ 否'}`);
    });
    
    // 檢查團隊
    const teamsDoc = await getDocs(collection(db, 'teams'));
    console.log(`\n📊 系統中共有 ${teamsDoc.size} 個團隊`);
    
    teamsDoc.forEach((doc) => {
      const teamData = doc.data();
      console.log(`\n團隊: ${teamData.name || doc.id}`);
      console.log(`  - ID: ${doc.id}`);
      console.log(`  - 組織: ${teamData.organizationId}`);
      console.log(`  - 成員數: ${teamData.memberIds?.length || 0}`);
      console.log(`  - 包含當前使用者: ${teamData.memberIds?.includes(user.id) ? '✅ 是' : '❌ 否'}`);
    });
    
    // 統計客戶權限
    const customersDoc = await getDocs(collection(db, 'customers'));
    let assignedCount = 0;
    let teamCount = 0;
    
    customersDoc.forEach((doc) => {
      const customerData = doc.data();
      if (customerData.assignedTo === user.id) assignedCount++;
      if (user.teamIds?.includes(customerData.teamId)) teamCount++;
    });
    
    console.log(`\n📊 客戶權限統計`);
    console.log(`  - 總客戶數: ${customersDoc.size}`);
    console.log(`  - 指派給當前使用者: ${assignedCount}`);
    console.log(`  - 在使用者團隊中: ${teamCount}`);
    
  } catch (error) {
    console.error('❌ 檢查失敗:', error);
  }
}

/**
 * 創建測試管理員帳號（如果需要）
 */
export async function makeCurrentUserAdmin() {
  const user = useAuthStore.getState().user;
  if (!user) {
    console.error('❌ 使用者未登入');
    return;
  }

  console.log('🔧 將當前使用者設為管理員...');
  
  try {
    const db = getFirebaseDb();
    
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
    
    console.log('✅ 成功將使用者設為管理員！請重新整理頁面。');
    
  } catch (error) {
    console.error('❌ 設定失敗:', error);
  }
}

// 掛載到 window
if (typeof window !== 'undefined') {
  (window as any).fixAllCustomerPermissions = fixAllCustomerPermissions;
  (window as any).checkUserFullPermissions = checkUserFullPermissions;
  (window as any).makeCurrentUserAdmin = makeCurrentUserAdmin;
  
  console.log('🛠️ 權限修復工具已載入！');
  console.log('可用命令：');
  console.log('- fixAllCustomerPermissions() : 修復所有客戶權限（推薦）');
  console.log('- checkUserFullPermissions() : 檢查完整權限狀態');
  console.log('- makeCurrentUserAdmin() : 將當前使用者設為管理員');
}