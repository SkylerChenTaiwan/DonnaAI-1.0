/**
 * 檢查認證相關的資料結構
 */

import { initializeFirebase } from './utils/firebase';

async function checkAuth() {
  const db = initializeFirebase();
  
  console.log('\n🔍 檢查使用者和團隊資料結構...\n');
  
  // 1. 檢查 admin 使用者
  const users = await db.collection('users').where('email', '==', 'admin@donnaai.ai').get();
  
  if (users.empty) {
    console.log('❌ 找不到 admin@donnaai.ai 使用者');
    return;
  }
  
  const userData = users.docs[0].data();
  const userId = users.docs[0].id;
  
  console.log('👤 使用者資料:');
  console.log('- ID:', userId);
  console.log('- Email:', userData.email);
  console.log('- Role:', userData.role);
  console.log('- teamId:', userData.teamId);
  console.log('- teamIds:', userData.teamIds);
  console.log('- organizationId:', userData.organizationId);
  
  // 2. 檢查團隊是否存在
  if (userData.teamId) {
    const team = await db.collection('teams').doc(userData.teamId).get();
    if (team.exists) {
      const teamData = team.data();
      console.log('\n👥 團隊資料:');
      console.log('- ID:', userData.teamId);
      console.log('- Name:', teamData?.name);
      console.log('- organizationId:', teamData?.organizationId);
      console.log('- memberIds:', teamData?.memberIds);
      console.log('- managerIds:', teamData?.managerIds);
    } else {
      console.log('\n❌ 團隊不存在:', userData.teamId);
    }
  }
  
  // 3. 測試查詢邏輯
  console.log('\n📊 測試查詢邏輯:');
  
  // 模擬 getCustomers 的查詢
  console.log('\n1. 使用 teamId 查詢:');
  const customersWithTeam = await db.collection('customers')
    .where('teamId', '==', userData.teamId)
    .limit(5)
    .get();
  console.log(`   找到 ${customersWithTeam.size} 個客戶`);
  
  // 不使用 teamId 查詢
  console.log('\n2. 不使用 teamId 查詢（所有客戶）:');
  const allCustomers = await db.collection('customers')
    .limit(5)
    .get();
  console.log(`   找到 ${allCustomers.size} 個客戶`);
  
  // 查詢指派給該使用者的客戶
  console.log('\n3. 查詢指派給該使用者的客戶:');
  const assignedCustomers = await db.collection('customers')
    .where('assignedTo', '==', userId)
    .limit(5)
    .get();
  console.log(`   找到 ${assignedCustomers.size} 個客戶`);
  
  // 4. 顯示一個客戶範例
  if (customersWithTeam.size > 0) {
    console.log('\n📋 客戶範例:');
    const firstCustomer = customersWithTeam.docs[0].data();
    console.log('- Name:', firstCustomer.name);
    console.log('- Company:', firstCustomer.company);
    console.log('- teamId:', firstCustomer.teamId);
    console.log('- assignedTo:', firstCustomer.assignedTo);
    console.log('- createdBy:', firstCustomer.createdBy);
  }
}

checkAuth()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('錯誤:', error);
    process.exit(1);
  });