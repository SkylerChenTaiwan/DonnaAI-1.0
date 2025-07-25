#!/usr/bin/env node

/**
 * 建立 DonnaAI 系統管理員帳號
 * 系統管理員具有最高權限，可以管理所有組織和用戶
 */

const admin = require('firebase-admin');
const path = require('path');

// 初始化 Firebase Admin SDK
const serviceAccountPath = path.join(__dirname, 'seed-data/service-account-key.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

const db = admin.firestore();
const auth = admin.auth();

interface SystemAdminData {
  email: string;
  password: string;
  name: string;
}

async function createSystemAdmin(adminData: SystemAdminData) {
  console.log(`🔧 開始建立系統管理員帳號: ${adminData.email}`);
  
  try {
    // 檢查是否已存在該 email 的用戶
    let authUser;
    try {
      authUser = await auth.getUserByEmail(adminData.email);
      console.log(`⚠️  用戶已存在，將更新為系統管理員權限`);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // 建立 Firebase Auth 用戶
        console.log(`👤 建立 Firebase Auth 使用者...`);
        authUser = await auth.createUser({
          email: adminData.email,
          password: adminData.password,
          displayName: adminData.name,
          emailVerified: true
        });
        console.log(`✅ Firebase Auth 使用者建立成功: ${authUser.uid}`);
      } else {
        throw error;
      }
    }
    
    // 設置自定義聲明，標記為系統管理員
    await auth.setCustomUserClaims(authUser.uid, {
      role: 'system-admin',
      permissions: ['all']
    });
    console.log(`✅ 設置系統管理員權限`);
    
    // 建立系統管理員組織
    const systemOrgId = 'system-organization';
    const systemOrgData = {
      id: systemOrgId,
      name: 'DonnaAI System',
      description: '系統管理組織',
      type: 'system',
      ownerId: authUser.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      settings: {
        defaultLanguage: 'zh-TW',
        timezone: 'Asia/Taipei',
        features: ['all']
      }
    };
    
    await db.collection('organizations').doc(systemOrgId).set(systemOrgData, { merge: true });
    console.log(`✅ 建立系統組織: ${systemOrgData.name}`);
    
    // 建立系統管理團隊
    const systemTeamId = 'system-admin-team';
    const systemTeamData = {
      id: systemTeamId,
      name: '系統管理團隊',
      organizationId: systemOrgId,
      description: '系統管理員團隊',
      type: 'system',
      leaderId: authUser.uid,
      memberIds: [authUser.uid],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('teams').doc(systemTeamId).set(systemTeamData, { merge: true });
    console.log(`✅ 建立系統團隊: ${systemTeamData.name}`);
    
    // 建立系統管理員用戶文檔
    const systemUserData = {
      id: authUser.uid,
      email: authUser.email,
      name: adminData.name,
      photoURL: null,
      role: 'system-admin',
      type: 'system',
      organizationId: systemOrgId,
      teamId: systemTeamId,
      teamIds: [systemTeamId],
      permissions: ['all'],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      metadata: {
        isSystemAdmin: true,
        canManageOrganizations: true,
        canManageUsers: true,
        canAccessAllData: true
      }
    };
    
    await db.collection('users').doc(authUser.uid).set(systemUserData, { merge: true });
    console.log(`✅ 建立系統管理員用戶文檔`);
    
    console.log('\n🎉 系統管理員帳號建立完成！');
    console.log('================================');
    console.log(`👑 系統管理員: ${adminData.name}`);
    console.log(`📧 Email: ${adminData.email}`);
    console.log(`🔑 密碼: ${adminData.password}`);
    console.log(`🆔 UID: ${authUser.uid}`);
    console.log(`🏢 組織: ${systemOrgData.name} (${systemOrgId})`);
    console.log(`👥 團隊: ${systemTeamData.name} (${systemTeamId})`);
    console.log('================================');
    console.log('系統管理員可以：');
    console.log('• 管理所有組織和用戶');
    console.log('• 建立新的企業帳號');
    console.log('• 訪問所有數據和功能');
    console.log('• 進行系統維護和配置');
    console.log('\n請使用此帳號登入 DonnaAI 系統！');
    
  } catch (error: any) {
    console.error('❌ 建立系統管理員時發生錯誤:', error.message);
    if (error.code) {
      console.error(`錯誤代碼: ${error.code}`);
    }
    process.exit(1);
  }
}

// 系統管理員資料
const SYSTEM_ADMIN_DATA: SystemAdminData = {
  email: 'admin@donnaai-app.com',
  password: 'nevz6XWBLUMxZt8p',
  name: 'DonnaAI系統管理員'
};

console.log('🚀 DonnaAI 系統管理員建立工具');
console.log('================================');

createSystemAdmin(SYSTEM_ADMIN_DATA).then(() => {
  process.exit(0);
});