/**
 * 更新指定組織的統計資料
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// 初始化 Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function updateOrganizationStats(organizationId) {
  console.log(`📊 開始更新組織 ${organizationId} 的統計資料...`);
  
  try {
    // 1. 統計用戶數量
    const usersSnapshot = await db.collection('users')
      .where('organizationId', '==', organizationId)
      .get();
    const userCount = usersSnapshot.size;
    console.log(`✅ 找到 ${userCount} 個用戶`);
    
    // 2. 統計客戶數量
    const customersSnapshot = await db.collection('customers')
      .where('organizationId', '==', organizationId)
      .get();
    const customerCount = customersSnapshot.size;
    console.log(`✅ 找到 ${customerCount} 個客戶`);
    
    // 3. 統計團隊數量
    const teamsSnapshot = await db.collection('teams')
      .where('organizationId', '==', organizationId)
      .get();
    const teamCount = teamsSnapshot.size;
    console.log(`✅ 找到 ${teamCount} 個團隊`);
    
    // 4. 更新組織文檔
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
    
    const updateData = {
      // 更新 stats 欄位
      'stats.userCount': userCount,
      'stats.activeUsers': userCount,
      'stats.customerCount': customerCount,
      'stats.teamCount': teamCount,
      
      // 更新 monthlyUsage 欄位（前端優先讀取這個）
      monthlyUsage: {
        period: currentMonth,
        activeUsers: userCount,
        recordCount: customerCount,
        aiProcessingCount: 0,
        toolUsage: {},
        calculatedAt: new Date()
      },
      
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    console.log('🔄 更新組織文檔...');
    await db.collection('organizations').doc(organizationId).update(updateData);
    
    console.log('✅ 組織統計更新成功！');
    console.log(`  活躍用戶: ${userCount}`);
    console.log(`  客戶數: ${customerCount}`);
    console.log(`  團隊數: ${teamCount}`);
    
  } catch (error) {
    console.error('❌ 更新失敗:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// 從命令列參數取得組織 ID，或使用 Global_test3 的 ID
const organizationId = process.argv[2] || '1HuFLKCrQBOQUp3cURLv';

// 執行更新
updateOrganizationStats(organizationId);