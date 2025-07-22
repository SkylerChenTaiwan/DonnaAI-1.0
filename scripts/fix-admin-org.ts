#!/usr/bin/env node

/**
 * 修復 admin@donnaai.ai 的組織資料不匹配問題
 */

import * as admin from 'firebase-admin';
import * as path from 'path';

// 初始化 Firebase Admin SDK
const serviceAccountPath = path.join(__dirname, 'seed-data/service-account-key.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

const db = admin.firestore();

async function fixAdminOrganization() {
  console.log('🔧 修復 admin@donnaai.ai 的組織資料...\n');
  
  try {
    // 1. 查詢 admin 使用者
    const usersRef = db.collection('users');
    const userQuery = await usersRef.where('email', '==', 'admin@donnaai.ai').limit(1).get();
    
    if (userQuery.empty) {
      console.error('❌ 找不到 admin@donnaai.ai 使用者');
      return;
    }
    
    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();
    console.log(`✅ 找到使用者: ${userData.name} (${userData.id})`);
    console.log(`   目前 organizationId: ${userData.organizationId}`);
    
    // 2. 檢查組織是否存在
    const orgId = userData.organizationId || 'system';
    const orgDoc = await db.collection('organizations').doc(orgId).get();
    
    if (!orgDoc.exists) {
      console.log(`❌ 組織 '${orgId}' 不存在，需要建立`);
      
      // 3. 建立缺失的組織
      const orgData = {
        id: orgId,
        name: orgId === 'system' ? '系統預設組織' : '預設組織',
        description: 'DonnaAI 預設組織',
        ownerId: userData.id,
        subscriptionPlan: 'enterprise',
        aiMinutesQuota: 10000,
        aiMinutesUsed: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        settings: {
          defaultLanguage: 'zh-TW',
          timezone: 'Asia/Taipei',
          features: ['ai-transcription', 'voice-tasks', 'data-visualization']
        }
      };
      
      await db.collection('organizations').doc(orgId).set(orgData);
      console.log(`✅ 建立組織: ${orgData.name} (${orgId})`);
    } else {
      console.log(`✅ 組織 '${orgId}' 已存在`);
    }
    
    // 4. 檢查團隊是否存在
    const teamId = userData.teamId || userData.teamIds?.[0] || 'default_team';
    const teamDoc = await db.collection('teams').doc(teamId).get();
    
    if (!teamDoc.exists) {
      console.log(`❌ 團隊 '${teamId}' 不存在，需要建立`);
      
      // 5. 建立缺失的團隊
      const teamData = {
        id: teamId,
        name: '預設團隊',
        organizationId: orgId,
        description: '預設工作團隊',
        leaderId: userData.id,
        memberIds: [userData.id],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await db.collection('teams').doc(teamId).set(teamData);
      console.log(`✅ 建立團隊: ${teamData.name} (${teamId})`);
    } else {
      console.log(`✅ 團隊 '${teamId}' 已存在`);
    }
    
    // 6. 更新使用者文檔，確保有正確的組織和團隊
    const updateData: any = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (!userData.organizationId) {
      updateData.organizationId = orgId;
    }
    
    if (!userData.teamId) {
      updateData.teamId = teamId;
    }
    
    if (!userData.teamIds || userData.teamIds.length === 0) {
      updateData.teamIds = [teamId];
    }
    
    if (Object.keys(updateData).length > 1) {
      await userDoc.ref.update(updateData);
      console.log('✅ 更新使用者文檔');
    }
    
    console.log('\n✨ 修復完成！');
    console.log('========================');
    console.log(`👤 使用者: ${userData.name} (${userData.email})`);
    console.log(`🏢 組織: ${orgId}`);
    console.log(`👥 團隊: ${teamId}`);
    console.log('========================');
    console.log('請重新整理應用程式，首頁應該能正常顯示了！');
    
  } catch (error) {
    console.error('❌ 錯誤:', error);
    process.exit(1);
  }
}

fixAdminOrganization().then(() => {
  process.exit(0);
});