#!/usr/bin/env node

/**
 * 為現有的 Firebase Auth 使用者建立組織和團隊資料
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
const auth = admin.auth();

async function createUserOrganization(email: string) {
  console.log(`🔍 查詢使用者: ${email}`);
  
  try {
    // 從 Firebase Auth 獲取使用者
    const authUser = await auth.getUserByEmail(email);
    console.log(`✅ 找到 Firebase Auth 使用者: ${authUser.uid}`);
    
    // 檢查 Firestore 中是否已有使用者文檔
    const userDoc = await db.collection('users').doc(authUser.uid).get();
    
    if (userDoc.exists && userDoc.data()?.organizationId) {
      console.log('✅ 使用者已有組織資訊');
      return;
    }
    
    // 建立組織
    const orgId = `org_${Date.now()}`;
    const orgData = {
      id: orgId,
      name: `${authUser.displayName || email.split('@')[0]} 的組織`,
      description: '個人組織',
      ownerId: authUser.uid,
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
    
    // 建立團隊
    const teamId = `team_${Date.now()}`;
    const teamData = {
      id: teamId,
      name: '預設團隊',
      organizationId: orgId,
      description: '預設工作團隊',
      leaderId: authUser.uid,
      memberIds: [authUser.uid],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('teams').doc(teamId).set(teamData);
    console.log(`✅ 建立團隊: ${teamData.name} (${teamId})`);
    
    // 更新或建立使用者文檔
    const userData = {
      id: authUser.uid,
      email: authUser.email,
      name: authUser.displayName || email.split('@')[0],
      photoURL: authUser.photoURL || null,
      role: 'admin',
      organizationId: orgId,
      teamId: teamId,
      teamIds: [teamId],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('users').doc(authUser.uid).set(userData, { merge: true });
    console.log(`✅ 更新使用者文檔`);
    
    console.log('\n✨ 組織建立完成！');
    console.log('========================');
    console.log(`👤 使用者: ${userData.name} (${userData.email})`);
    console.log(`🏢 組織: ${orgData.name}`);
    console.log(`👥 團隊: ${teamData.name}`);
    console.log('========================');
    console.log('請重新整理應用程式即可看到首頁內容！');
    
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      console.error('❌ 找不到使用者，請確認 email 是否正確');
    } else {
      console.error('❌ 錯誤:', error.message);
    }
    process.exit(1);
  }
}

// 從命令列參數獲取 email
const email = process.argv[2];

if (!email) {
  console.error('請提供使用者 email');
  console.error('用法: npx ts-node create-user-org.ts <email>');
  process.exit(1);
}

createUserOrganization(email).then(() => {
  process.exit(0);
});