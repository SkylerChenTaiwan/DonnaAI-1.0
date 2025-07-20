/**
 * 修正現有使用者資料
 * 確保 admin@donnaai.ai 有正確的 id 和 teamId
 */

import * as admin from 'firebase-admin';
import { initializeFirebase } from './utils/firebase';

async function fixUserData() {
  console.log('🔧 修正使用者資料...\n');
  
  const db = initializeFirebase();
  const usersRef = db.collection('users');
  
  // 查詢 admin@donnaai.ai
  const query = await usersRef.where('email', '==', 'admin@donnaai.ai').get();
  
  if (query.empty) {
    console.log('❌ 找不到使用者 admin@donnaai.ai');
    return;
  }
  
  console.log(`找到 ${query.size} 個使用者，開始修正...`);
  
  for (const doc of query.docs) {
    const userData = doc.data();
    const userId = doc.id;
    
    console.log(`\n📝 處理使用者: ${userId}`);
    console.log(`   Email: ${userData.email}`);
    console.log(`   當前資料:`, {
      id: userData.id || '無',
      teamId: userData.teamId || '無',
      teamIds: userData.teamIds || []
    });
    
    const updates: any = {};
    
    // 確保有 id 欄位
    if (!userData.id) {
      updates.id = userId;
      console.log(`   ✅ 設定 id: ${userId}`);
    }
    
    // 確保有 teamId 欄位
    if (!userData.teamId && userData.teamIds && userData.teamIds.length > 0) {
      updates.teamId = userData.teamIds[0];
      console.log(`   ✅ 設定 teamId: ${userData.teamIds[0]}`);
    }
    
    // 如果沒有 teamIds，創建一個預設團隊
    if (!userData.teamIds || userData.teamIds.length === 0) {
      const teamId = `team_${Date.now()}`;
      const organizationId = userData.organizationId || 'default_org';
      
      // 創建團隊
      await db.collection('teams').doc(teamId).set({
        id: teamId,
        name: '預設團隊',
        organizationId,
        managerIds: [userId],
        memberIds: [userId],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      updates.teamId = teamId;
      updates.teamIds = [teamId];
      updates.managedTeamIds = [teamId];
      console.log(`   ✅ 創建並設定團隊: ${teamId}`);
    }
    
    // 更新使用者資料
    if (Object.keys(updates).length > 0) {
      await doc.ref.update(updates);
      console.log(`   ✅ 使用者資料已更新`);
    } else {
      console.log(`   ℹ️  使用者資料已完整，無需更新`);
    }
  }
  
  console.log('\n✅ 修正完成！');
}

// 執行修正
fixUserData()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ 修正失敗:', error);
    process.exit(1);
  });