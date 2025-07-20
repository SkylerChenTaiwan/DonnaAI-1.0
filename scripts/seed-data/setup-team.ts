/**
 * 設置 Donna-test 團隊並配置權限
 */

import * as admin from 'firebase-admin';
import { initializeFirebase } from './utils/firebase';

async function setupTeam() {
  console.log('🔧 設置 Donna-test 團隊...\n');
  
  const db = initializeFirebase();
  const teamId = 'donna-test';
  const teamName = 'Donna-test';
  
  try {
    // 1. 查找 admin 使用者
    const usersQuery = await db.collection('users')
      .where('email', '==', 'admin@donnaai.ai')
      .limit(1)
      .get();
    
    if (usersQuery.empty) {
      console.log('❌ 找不到 admin@donnaai.ai 使用者');
      return;
    }
    
    const userDoc = usersQuery.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();
    
    console.log('👤 找到使用者:', userId);
    
    // 2. 創建或更新團隊
    const teamRef = db.collection('teams').doc(teamId);
    const teamData = {
      id: teamId,
      name: teamName,
      organizationId: userData.organizationId || 'system',
      managerIds: [userId],
      memberIds: [userId],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await teamRef.set(teamData);
    console.log('✅ 團隊已創建/更新:', teamId);
    
    // 3. 更新使用者資料
    const userUpdates = {
      // 確保是系統管理員
      role: 'admin',
      // 主要團隊
      teamId: teamId,
      // 所有團隊
      teamIds: admin.firestore.FieldValue.arrayUnion(teamId),
      // 管理的團隊
      managedTeamIds: admin.firestore.FieldValue.arrayUnion(teamId),
      // 權限設置
      permissions: {
        canCreateOrganization: true,
        canManageAllOrganizations: true,
        canViewSystemMetrics: true,
        canManageSystemSettings: true,
        canManageAllTeams: true,
        canManageAllUsers: true,
        canViewAllData: true
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await userDoc.ref.update(userUpdates);
    console.log('✅ 使用者權限已更新');
    
    // 4. 更新所有沒有 teamId 的客戶
    console.log('\n📊 處理客戶資料...');
    const customersWithoutTeam = await db.collection('customers')
      .where('teamId', '==', null)
      .get();
    
    if (customersWithoutTeam.size > 0) {
      console.log(`找到 ${customersWithoutTeam.size} 個沒有 teamId 的客戶`);
      
      const batch = db.batch();
      customersWithoutTeam.forEach(doc => {
        batch.update(doc.ref, {
          teamId: teamId,
          assignedTo: userId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });
      
      await batch.commit();
      console.log('✅ 已更新客戶的 teamId');
    }
    
    // 同樣處理 undefined 的情況
    const customersWithUndefined = await db.collection('customers')
      .get();
    
    let updatedCount = 0;
    const batch2 = db.batch();
    
    customersWithUndefined.forEach(doc => {
      const data = doc.data();
      if (!data.teamId || data.teamId === undefined) {
        batch2.update(doc.ref, {
          teamId: teamId,
          assignedTo: data.assignedTo || userId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        updatedCount++;
      }
    });
    
    if (updatedCount > 0) {
      await batch2.commit();
      console.log(`✅ 額外更新了 ${updatedCount} 個客戶的 teamId`);
    }
    
    // 5. 驗證設置
    console.log('\n📋 驗證設置:');
    
    // 檢查使用者
    const updatedUser = await userDoc.ref.get();
    const updatedUserData = updatedUser.data();
    console.log('\n使用者資料:');
    console.log('- Email:', updatedUserData?.email);
    console.log('- Role:', updatedUserData?.role);
    console.log('- Team ID:', updatedUserData?.teamId);
    console.log('- Team IDs:', updatedUserData?.teamIds);
    console.log('- Managed Teams:', updatedUserData?.managedTeamIds);
    
    // 檢查團隊客戶
    const teamCustomers = await db.collection('customers')
      .where('teamId', '==', teamId)
      .limit(5)
      .get();
    
    console.log(`\n團隊 ${teamId} 的客戶數量: ${teamCustomers.size}`);
    
    console.log('\n✅ 設置完成！');
    console.log('---');
    console.log('使用者 admin@donnaai.ai 現在:');
    console.log('- 屬於 Donna-test 團隊');
    console.log('- 擁有系統最高權限');
    console.log('- 可以管理所有資料');
    
  } catch (error) {
    console.error('❌ 設置失敗:', error);
  }
}

setupTeam()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('錯誤:', error);
    process.exit(1);
  });