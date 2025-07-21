/**
 * 診斷 Firestore 權限問題
 */

import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseDb } from '@/services/firebase/config';
import { useAuthStore } from '@/stores/authStore';

/**
 * 診斷特定客戶的權限問題
 */
export async function diagnoseCustomerPermission(customerId: string) {
  const user = useAuthStore.getState().user;
  if (!user) {
    console.error('❌ 使用者未登入');
    return;
  }

  console.log('🔍 開始診斷客戶權限問題');
  console.log('========================');
  console.log('客戶 ID:', customerId);
  console.log('使用者 ID:', user.id);
  console.log('使用者 Email:', user.email);
  console.log('========================\n');

  try {
    const db = getFirebaseDb();
    
    // 1. 檢查客戶資料
    console.log('📋 檢查客戶資料...');
    const customerDoc = await getDoc(doc(db, 'customers', customerId));
    
    if (!customerDoc.exists()) {
      console.error('❌ 客戶不存在！');
      return;
    }
    
    const customerData = customerDoc.data();
    console.log('✅ 客戶資料:');
    console.log('  - 團隊 ID:', customerData.teamId);
    console.log('  - 負責人:', customerData.assignedTo);
    console.log('  - 組織 ID:', customerData.organizationId);
    
    // 2. 檢查使用者資料
    console.log('\n👤 檢查使用者資料...');
    const userDoc = await getDoc(doc(db, 'users', user.id));
    
    if (!userDoc.exists()) {
      console.error('❌ 使用者文檔不存在！');
      return;
    }
    
    const userData = userDoc.data();
    console.log('✅ 使用者資料:');
    console.log('  - 團隊 IDs:', userData.teamIds || '[]');
    console.log('  - 角色:', userData.role);
    console.log('  - 組織 ID:', userData.organizationId);
    
    // 3. 權限檢查
    console.log('\n🔐 權限檢查結果:');
    
    // 檢查團隊成員資格
    const isTeamMember = userData.teamIds?.includes(customerData.teamId) || false;
    console.log(`  - 是否為團隊成員: ${isTeamMember ? '✅ 是' : '❌ 否'}`);
    if (!isTeamMember) {
      console.log(`    → 使用者團隊: [${userData.teamIds?.join(', ') || '無'}]`);
      console.log(`    → 客戶團隊: ${customerData.teamId}`);
    }
    
    // 檢查是否為負責人
    const isAssignee = customerData.assignedTo === user.id;
    console.log(`  - 是否為負責人: ${isAssignee ? '✅ 是' : '❌ 否'}`);
    if (!isAssignee) {
      console.log(`    → 客戶負責人: ${customerData.assignedTo}`);
      console.log(`    → 當前使用者: ${user.id}`);
    }
    
    // 檢查是否為管理員
    const isAdmin = userData.role === 'admin';
    console.log(`  - 是否為管理員: ${isAdmin ? '✅ 是' : '❌ 否'}`);
    
    // 檢查組織
    const sameOrg = userData.organizationId === customerData.organizationId;
    console.log(`  - 同一組織: ${sameOrg ? '✅ 是' : '❌ 否'}`);
    
    // 總結
    console.log('\n📊 總結:');
    const canUpdate = isTeamMember && (isAssignee || isAdmin) && sameOrg;
    if (canUpdate) {
      console.log('✅ 應該有權限更新此客戶');
    } else {
      console.log('❌ 無權限更新此客戶，原因：');
      if (!isTeamMember) console.log('  - 不是團隊成員');
      if (!isAssignee && !isAdmin) console.log('  - 不是負責人也不是管理員');
      if (!sameOrg) console.log('  - 不在同一組織');
    }
    
    // 4. 建議解決方案
    console.log('\n💡 建議解決方案:');
    if (!isTeamMember) {
      console.log('  1. 將使用者加入團隊 ' + customerData.teamId);
      console.log('  2. 或將客戶轉移到使用者所在的團隊');
    }
    if (!isAssignee && !isAdmin) {
      console.log('  3. 將客戶指派給當前使用者');
      console.log('  4. 或提升使用者權限為管理員');
    }
    
  } catch (error) {
    console.error('❌ 診斷過程發生錯誤:', error);
  }
}

/**
 * 列出使用者可以編輯的客戶
 */
export async function listEditableCustomers() {
  const user = useAuthStore.getState().user;
  if (!user) {
    console.error('❌ 使用者未登入');
    return;
  }

  console.log('🔍 尋找可編輯的客戶...');
  
  try {
    const db = getFirebaseDb();
    const userDoc = await getDoc(doc(db, 'users', user.id));
    const userData = userDoc.data();
    
    const { customers } = await import('@/stores/customerStore').then(m => m.useCustomerStore.getState());
    const editableCustomers = [];
    
    for (const customer of customers) {
      const isTeamMember = userData?.teamIds?.includes(customer.teamId) || false;
      const isAssignee = customer.assignedTo === user.id;
      const isAdmin = userData?.role === 'admin';
      
      if (isTeamMember && (isAssignee || isAdmin)) {
        editableCustomers.push({
          id: customer.id,
          name: customer.name,
          company: customer.company,
          teamId: customer.teamId,
          assignedTo: customer.assignedTo
        });
      }
    }
    
    console.log(`✅ 找到 ${editableCustomers.length} 個可編輯的客戶`);
    console.table(editableCustomers);
    
    return editableCustomers;
  } catch (error) {
    console.error('❌ 查詢失敗:', error);
  }
}

// 將函數掛載到 window
if (typeof window !== 'undefined') {
  (window as any).diagnoseCustomerPermission = diagnoseCustomerPermission;
  (window as any).listEditableCustomers = listEditableCustomers;
  
  console.log('🔧 權限診斷工具已載入！');
  console.log('可用命令：');
  console.log('- diagnoseCustomerPermission("customer_id") : 診斷特定客戶的權限');
  console.log('- listEditableCustomers() : 列出所有可編輯的客戶');
}