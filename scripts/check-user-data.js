/**
 * 檢查 admin@donnaai.ai 用戶資料
 */

const admin = require('firebase-admin');
const path = require('path');

// 初始化 Firebase Admin
const serviceAccount = require(path.join(__dirname, '../serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkUserData() {
  console.log('檢查 admin@donnaai.ai 用戶資料...\n');
  
  try {
    // 1. 透過 email 查詢用戶
    const usersSnapshot = await db.collection('users')
      .where('email', '==', 'admin@donnaai.ai')
      .get();
    
    if (usersSnapshot.empty) {
      console.log('❌ 找不到 email 為 admin@donnaai.ai 的用戶');
      return;
    }
    
    usersSnapshot.forEach(doc => {
      console.log('✅ 找到用戶:');
      console.log('ID:', doc.id);
      console.log('資料:', JSON.stringify(doc.data(), null, 2));
      
      const userData = doc.data();
      
      // 檢查必要欄位
      console.log('\n📋 欄位檢查:');
      console.log('- organizationId:', userData.organizationId || '❌ 缺少');
      console.log('- role:', userData.role || '❌ 缺少');
      console.log('- name:', userData.name || '❌ 缺少');
      console.log('- teamIds:', userData.teamIds || '❌ 缺少');
      
      // 如果缺少 organizationId，嘗試查找組織
      if (!userData.organizationId) {
        console.log('\n🔍 嘗試查找相關組織...');
        checkOrganizations();
      }
    });
    
  } catch (error) {
    console.error('錯誤:', error);
  }
}

async function checkOrganizations() {
  const orgsSnapshot = await db.collection('organizations').get();
  
  if (orgsSnapshot.empty) {
    console.log('❌ 沒有找到任何組織');
  } else {
    console.log('找到的組織:');
    orgsSnapshot.forEach(doc => {
      console.log(`- ${doc.id}: ${doc.data().name}`);
    });
  }
}

// 執行檢查
checkUserData().then(() => {
  console.log('\n檢查完成');
  process.exit(0);
}).catch(err => {
  console.error('執行錯誤:', err);
  process.exit(1);
});