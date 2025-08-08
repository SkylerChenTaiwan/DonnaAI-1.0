/**
 * 檢查匯入日誌
 * 找出為何只有 69 個用戶被匯入而非 80 個
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
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

async function analyzeImportedUsers() {
  console.log('🔍 分析匯入的用戶資料...\n');

  try {
    const targetOrgId = 'aAehDHokbFHvdaMULXJM';
    
    // 1. 獲取該組織的所有用戶
    const usersSnapshot = await db.collection('users')
      .where('organizationId', '==', targetOrgId)
      .get();
    
    console.log(`📊 組織 ${targetOrgId} 的用戶統計:`);
    console.log(`  總數: ${usersSnapshot.size} 個用戶\n`);
    
    // 2. 分析用戶資料
    const usersByEmail = new Map();
    const duplicateEmails = [];
    
    usersSnapshot.forEach(doc => {
      const user = doc.data();
      const email = user.email;
      
      if (usersByEmail.has(email)) {
        duplicateEmails.push(email);
        console.log(`⚠️ 發現重複 email: ${email}`);
      } else {
        usersByEmail.set(email, { id: doc.id, ...user });
      }
    });
    
    console.log(`\n📧 Email 分析:`);
    console.log(`  唯一 email 數: ${usersByEmail.size}`);
    console.log(`  重複 email 數: ${duplicateEmails.length}`);
    
    if (duplicateEmails.length > 0) {
      console.log(`\n❌ 重複的 emails:`);
      duplicateEmails.forEach(email => {
        console.log(`  - ${email}`);
      });
    }
    
    // 3. 檢查是否有用戶缺少必要欄位
    const incompleteUsers = [];
    usersSnapshot.forEach(doc => {
      const user = doc.data();
      if (!user.email || !user.name) {
        incompleteUsers.push({
          id: doc.id,
          email: user.email || '無',
          name: user.name || '無'
        });
      }
    });
    
    if (incompleteUsers.length > 0) {
      console.log(`\n⚠️ 缺少必要欄位的用戶:`);
      incompleteUsers.forEach(user => {
        console.log(`  ID: ${user.id}, Email: ${user.email}, Name: ${user.name}`);
      });
    }
    
    // 4. 檢查是否有臨時 UID（表示匯入失敗）
    const tempUsers = [];
    usersSnapshot.forEach(doc => {
      if (doc.id.startsWith('temp_')) {
        const user = doc.data();
        tempUsers.push({
          id: doc.id,
          email: user.email,
          name: user.name
        });
      }
    });
    
    if (tempUsers.length > 0) {
      console.log(`\n⚠️ 臨時用戶（匯入不完整）: ${tempUsers.length} 個`);
      tempUsers.forEach(user => {
        console.log(`  ${user.email} (${user.name})`);
      });
    }
    
    // 5. 顯示前10個用戶作為樣本
    console.log(`\n📋 前10個用戶樣本:`);
    const sampleUsers = Array.from(usersByEmail.values()).slice(0, 10);
    sampleUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name} (${user.email}) - Role: ${user.role || '未設定'}`);
    });
    
    // 6. 可能的原因分析
    console.log(`\n💡 可能導致只有 69 個用戶的原因:`);
    console.log(`  1. 重複的 email 地址被跳過 (${duplicateEmails.length} 個)`);
    console.log(`  2. CSV 檔案中有空行或格式錯誤的行`);
    console.log(`  3. 某些用戶的 email 格式不正確`);
    console.log(`  4. 匯入過程中發生錯誤但未報告`);
    
    const expectedCount = 80;
    const actualCount = usersSnapshot.size;
    const missingCount = expectedCount - actualCount;
    
    console.log(`\n📊 總結:`);
    console.log(`  預期匯入: ${expectedCount} 個用戶`);
    console.log(`  實際匯入: ${actualCount} 個用戶`);
    console.log(`  缺少: ${missingCount} 個用戶`);

  } catch (error) {
    console.error('❌ 發生錯誤:', error);
  }
}

// 執行分析
analyzeImportedUsers()
  .then(() => {
    console.log('\n✅ 分析完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ 執行失敗:', error);
    process.exit(1);
  });