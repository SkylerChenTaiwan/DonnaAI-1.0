/**
 * 檢查組織統計資料
 * 診斷為何匯入的用戶沒有顯示在統計中
 */

const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.production') });

// 初始化 Firebase Admin
const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID
});

const db = admin.firestore();

// 顏色輸出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function checkOrganizationStats() {
  console.log(`${colors.cyan}🔍 開始檢查組織統計資料...${colors.reset}\n`);

  try {
    // 1. 獲取所有組織
    console.log(`${colors.blue}📋 正在讀取 organizations 集合...${colors.reset}`);
    const orgsSnapshot = await db.collection('organizations').get();
    console.log(`✅ 找到 ${colors.green}${orgsSnapshot.size}${colors.reset} 個組織\n`);

    // 2. 對每個組織進行統計
    for (const orgDoc of orgsSnapshot.docs) {
      const orgId = orgDoc.id;
      const orgData = orgDoc.data();
      
      console.log(`${colors.bright}${'='.repeat(80)}${colors.reset}`);
      console.log(`${colors.cyan}組織: ${orgData.name} (${orgId})${colors.reset}`);
      console.log(`${colors.bright}${'='.repeat(80)}${colors.reset}`);

      // 檢查用戶數量
      console.log(`\n${colors.yellow}👥 用戶統計:${colors.reset}`);
      
      // 方法1: 直接查詢 users 集合
      const usersQuery = await db.collection('users')
        .where('organizationId', '==', orgId)
        .get();
      console.log(`  直接查詢: ${colors.green}${usersQuery.size}${colors.reset} 個用戶`);

      // 列出前5個用戶
      if (usersQuery.size > 0) {
        console.log(`  前5個用戶:`);
        usersQuery.docs.slice(0, 5).forEach(doc => {
          const user = doc.data();
          console.log(`    - ${user.name || '無名稱'} (${user.email || '無email'}) - 角色: ${user.role || '無角色'}`);
        });
      }

      // 檢查活躍用戶（過去30天）
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const activeUsersQuery = await db.collection('users')
        .where('organizationId', '==', orgId)
        .where('lastActiveAt', '>=', admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
        .get();
      console.log(`  活躍用戶(30天): ${colors.green}${activeUsersQuery.size}${colors.reset} 個`);

      // 檢查 organizationMembers 集合
      console.log(`\n${colors.yellow}🔗 組織成員關聯:${colors.reset}`);
      const membersQuery = await db.collection('organizationMembers')
        .where('organizationId', '==', orgId)
        .get();
      console.log(`  organizationMembers: ${colors.green}${membersQuery.size}${colors.reset} 個成員關聯`);

      // 檢查 customers 數量
      console.log(`\n${colors.yellow}📊 其他統計:${colors.reset}`);
      const customersQuery = await db.collection('customers')
        .where('organizationId', '==', orgId)
        .get();
      console.log(`  客戶數量: ${colors.green}${customersQuery.size}${colors.reset} 個`);

      // 檢查組織的 stats 欄位
      if (orgData.stats) {
        console.log(`\n${colors.yellow}📈 儲存的統計資料:${colors.reset}`);
        console.log(`  用戶數: ${orgData.stats.userCount || 0}`);
        console.log(`  團隊數: ${orgData.stats.teamCount || 0}`);
        console.log(`  客戶數: ${orgData.stats.customerCount || 0}`);
      }

      // 檢查組織的 monthlyUsage
      if (orgData.monthlyUsage) {
        console.log(`\n${colors.yellow}📅 月度使用統計:${colors.reset}`);
        console.log(`  期間: ${orgData.monthlyUsage.period || '未設定'}`);
        console.log(`  活躍用戶: ${orgData.monthlyUsage.activeUsers || 0}`);
        console.log(`  贈送人數: ${orgData.giftedSeats || 0}`);
      }

      console.log();
    }

    // 3. 特別檢查目標組織 (Global)
    const targetOrgId = 'aAehDHokbFHvdaMULXJM';
    console.log(`${colors.bright}${'='.repeat(80)}${colors.reset}`);
    console.log(`${colors.cyan}🎯 特別檢查目標組織 (ID: ${targetOrgId})${colors.reset}`);
    console.log(`${colors.bright}${'='.repeat(80)}${colors.reset}`);

    // 更新組織統計
    console.log(`\n${colors.yellow}🔄 嘗試更新組織統計...${colors.reset}`);
    
    const usersCount = await db.collection('users')
      .where('organizationId', '==', targetOrgId)
      .get();
    
    const customersCount = await db.collection('customers')
      .where('organizationId', '==', targetOrgId)
      .get();

    const updateData = {
      'stats.userCount': usersCount.size,
      'stats.customerCount': customersCount.size,
      'monthlyUsage.activeUsers': usersCount.size, // 暫時將所有用戶視為活躍
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('organizations').doc(targetOrgId).update(updateData);
    
    console.log(`${colors.green}✅ 已更新組織統計:${colors.reset}`);
    console.log(`  用戶數: ${usersCount.size}`);
    console.log(`  客戶數: ${customersCount.size}`);
    console.log(`  活躍用戶: ${usersCount.size}`);

  } catch (error) {
    console.error(`${colors.red}❌ 發生錯誤:${colors.reset}`, error);
  }
}

// 執行檢查
checkOrganizationStats()
  .then(() => {
    console.log(`\n${colors.green}✅ 檢查完成${colors.reset}`);
    process.exit(0);
  })
  .catch(error => {
    console.error(`${colors.red}❌ 執行失敗:${colors.reset}`, error);
    process.exit(1);
  });