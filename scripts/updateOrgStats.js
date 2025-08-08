/**
 * 更新組織統計資料
 * 用於修復統計顯示為 0 的問題
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.production') });

// 初始化 Firebase Admin
const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');
const serviceAccount = require(serviceAccountPath);

initializeApp({
  credential: cert(serviceAccount),
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID
});

const db = getFirestore();

async function updateOrganizationStats() {
  console.log('🔍 開始更新組織統計資料...\n');

  try {
    const targetOrgId = 'aAehDHokbFHvdaMULXJM';
    console.log(`📊 檢查組織: ${targetOrgId}\n`);

    // 1. 統計用戶數量
    const usersSnapshot = await db.collection('users')
      .where('organizationId', '==', targetOrgId)
      .get();
    
    const userCount = usersSnapshot.size;
    console.log(`✅ 找到 ${userCount} 個用戶`);

    // 2. 統計客戶數量
    const customersSnapshot = await db.collection('customers')
      .where('organizationId', '==', targetOrgId)
      .get();
    
    const customerCount = customersSnapshot.size;
    console.log(`✅ 找到 ${customerCount} 個客戶`);

    // 3. 統計團隊數量
    const teamsSnapshot = await db.collection('teams')
      .where('organizationId', '==', targetOrgId)
      .get();
    
    const teamCount = teamsSnapshot.size;
    console.log(`✅ 找到 ${teamCount} 個團隊`);

    // 4. 更新組織文件
    console.log('\n🔄 更新組織統計資料...');
    
    const orgRef = db.collection('organizations').doc(targetOrgId);
    
    // 先獲取現有資料
    const orgDoc = await orgRef.get();
    if (!orgDoc.exists) {
      console.error('❌ 組織不存在！');
      return;
    }

    const orgData = orgDoc.data();
    console.log('\n📋 現有統計資料:');
    console.log('  stats:', orgData.stats || '無');
    console.log('  monthlyUsage:', orgData.monthlyUsage || '無');

    // 準備更新資料
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
    
    const updateData = {
      'stats.userCount': userCount,
      'stats.customerCount': customerCount,
      'stats.teamCount': teamCount,
      'stats.activeUsers': userCount, // 暫時將所有用戶視為活躍
      'monthlyUsage.period': currentMonth,
      'monthlyUsage.activeUsers': userCount,
      'monthlyUsage.customerCount': customerCount,
      updatedAt: FieldValue.serverTimestamp()
    };

    await orgRef.update(updateData);
    
    console.log('\n✅ 已更新組織統計:');
    console.log(`  用戶數: ${userCount}`);
    console.log(`  客戶數: ${customerCount}`);
    console.log(`  團隊數: ${teamCount}`);
    console.log(`  活躍用戶: ${userCount}`);
    console.log(`  更新時間: ${new Date().toLocaleString('zh-TW')}`);

    // 5. 驗證更新
    console.log('\n🔍 驗證更新結果...');
    const updatedDoc = await orgRef.get();
    const updatedData = updatedDoc.data();
    
    console.log('📊 更新後的統計資料:');
    console.log('  stats:', JSON.stringify(updatedData.stats, null, 2));
    console.log('  monthlyUsage:', JSON.stringify(updatedData.monthlyUsage, null, 2));

  } catch (error) {
    console.error('❌ 發生錯誤:', error);
  }
}

// 執行更新
updateOrganizationStats()
  .then(() => {
    console.log('\n✅ 更新完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ 執行失敗:', error);
    process.exit(1);
  });