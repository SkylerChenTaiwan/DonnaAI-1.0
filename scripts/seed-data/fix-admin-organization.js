/**
 * 修復 admin@donnaai.ai 的組織資料不匹配問題
 */

const admin = require('firebase-admin');
const path = require('path');

// 初始化 Firebase Admin SDK
const serviceAccountPath = path.join(__dirname, 'service-account-key.json');
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
    console.log(`   目前 teamId: ${userData.teamId}`);
    console.log(`   目前 teamIds: ${JSON.stringify(userData.teamIds)}`);
    
    // 2. 檢查組織是否存在
    const orgId = userData.organizationId || 'system';
    console.log(`\n📋 檢查組織 '${orgId}'...`);
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
      const orgData = orgDoc.data();
      console.log(`   名稱: ${orgData.name}`);
    }
    
    // 4. 檢查團隊是否存在
    const teamId = userData.teamId || userData.teamIds?.[0] || 'default_team';
    console.log(`\n📋 檢查團隊 '${teamId}'...`);
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
      const teamData = teamDoc.data();
      console.log(`   名稱: ${teamData.name}`);
      console.log(`   組織ID: ${teamData.organizationId}`);
    }
    
    // 6. 更新使用者文檔，確保有正確的組織和團隊
    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    let needUpdate = false;
    
    if (!userData.organizationId) {
      updateData.organizationId = orgId;
      needUpdate = true;
      console.log(`\n⚠️  需要設定 organizationId: ${orgId}`);
    }
    
    if (!userData.teamId) {
      updateData.teamId = teamId;
      needUpdate = true;
      console.log(`⚠️  需要設定 teamId: ${teamId}`);
    }
    
    if (!userData.teamIds || userData.teamIds.length === 0) {
      updateData.teamIds = [teamId];
      needUpdate = true;
      console.log(`⚠️  需要設定 teamIds: [${teamId}]`);
    }
    
    if (needUpdate) {
      await userDoc.ref.update(updateData);
      console.log('✅ 更新使用者文檔');
    } else {
      console.log('\n✅ 使用者文檔已有完整的組織和團隊資訊');
    }
    
    // 7. 驗證所有資料是否正確
    console.log('\n🔍 驗證最終資料...');
    const finalUserDoc = await userDoc.ref.get();
    const finalUserData = finalUserDoc.data();
    
    console.log('\n✨ 修復完成！');
    console.log('========================');
    console.log(`👤 使用者: ${finalUserData.name} (${finalUserData.email})`);
    console.log(`🏢 組織: ${finalUserData.organizationId}`);
    console.log(`👥 團隊: ${finalUserData.teamId}`);
    console.log(`📋 所有團隊: ${JSON.stringify(finalUserData.teamIds)}`);
    console.log('========================');
    console.log('\n請重新整理應用程式，首頁應該能正常顯示了！');
    
  } catch (error) {
    console.error('❌ 錯誤:', error);
    process.exit(1);
  }
}

// 執行修復
fixAdminOrganization().then(() => {
  console.log('\n👍 腳本執行成功');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ 腳本執行失敗:', error);
  process.exit(1);
});