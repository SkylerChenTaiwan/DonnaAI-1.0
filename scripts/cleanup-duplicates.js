/**
 * 清理重複的客戶資料腳本 (Node.js 版本)
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  writeBatch, 
  doc 
} = require('firebase/firestore');

// Firebase 配置
const firebaseConfig = {
  apiKey: "AIzaSyA4I0L_RnfqWTJyPgRdh1_QRl5EjPgYlFU",
  authDomain: "donnaai-5e601.firebaseapp.com", 
  projectId: "donnaai-5e601",
  storageBucket: "donnaai-5e601.appspot.com",
  messagingSenderId: "147655397948",
  appId: "1:147655397948:web:38a3e7a12dc4e0b7ebce5b"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cleanupDuplicateCustomers(organizationId) {
  console.log('🧹 開始清理重複的客戶資料...');
  
  // 取得所有客戶資料
  console.log('📥 載入所有客戶資料...');
  const customersQuery = query(
    collection(db, 'customers'),
    where('organizationId', '==', organizationId)
  );
  
  const snapshot = await getDocs(customersQuery);
  const allCustomers = [];
  
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    allCustomers.push({
      id: docSnap.id,
      name: data.name || '',
      company: data.company || '',
      createdAt: data.createdAt,
      ...data
    });
  });
  
  console.log(`📊 總共找到 ${allCustomers.length} 筆客戶資料`);
  
  // 按姓名+公司分組
  const customerGroups = new Map();
  
  for (const customer of allCustomers) {
    const key = `${customer.name}_${customer.company}`;
    if (!customerGroups.has(key)) {
      customerGroups.set(key, []);
    }
    customerGroups.get(key).push(customer);
  }
  
  console.log(`📋 分組後共有 ${customerGroups.size} 個唯一客戶`);
  
  // 找出重複項
  let duplicateCount = 0;
  let toDeleteIds = [];
  
  for (const [key, customers] of customerGroups.entries()) {
    if (customers.length > 1) {
      console.log(`🔍 發現重複客戶: ${key} (${customers.length} 筆)`);
      
      // 按創建時間排序，保留最新的
      customers.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime; // 降序，最新的在前面
      });
      
      // 標記除了第一個（最新）之外的所有記錄為待刪除
      for (let i = 1; i < customers.length; i++) {
        toDeleteIds.push(customers[i].id);
        duplicateCount++;
      }
      
      console.log(`  ✅ 保留: ${customers[0].id} (${customers[0].createdAt?.toDate?.()?.toLocaleString() || '未知時間'})`);
      console.log(`  ❌ 刪除: ${customers.slice(1).length} 筆舊記錄`);
    }
  }
  
  console.log(`📈 統計結果:`);
  console.log(`  - 原始記錄: ${allCustomers.length} 筆`);
  console.log(`  - 唯一客戶: ${customerGroups.size} 筆`);
  console.log(`  - 待刪除重複: ${duplicateCount} 筆`);
  console.log(`  - 清理後預估: ${allCustomers.length - duplicateCount} 筆`);
  
  if (toDeleteIds.length === 0) {
    console.log('✨ 沒有發現重複記錄，無需清理');
    return;
  }
  
  // 批量刪除重複記錄
  console.log('🗑️ 開始批量刪除重複記錄...');
  const BATCH_SIZE = 500; // Firebase 批量操作限制
  
  for (let i = 0; i < toDeleteIds.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const batchIds = toDeleteIds.slice(i, i + BATCH_SIZE);
    
    for (const id of batchIds) {
      batch.delete(doc(db, 'customers', id));
    }
    
    await batch.commit();
    console.log(`  ✅ 已刪除 ${Math.min(i + BATCH_SIZE, toDeleteIds.length)}/${toDeleteIds.length} 筆重複記錄`);
    
    // 批次間稍作延遲
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('🎉 重複資料清理完成！');
  console.log(`📊 最終結果: ${allCustomers.length - duplicateCount} 筆唯一客戶記錄`);
}

// 執行清理
async function main() {
  const ORGANIZATION_ID = 'b0FD5QExAZtWeDX60mHr';
  
  try {
    await cleanupDuplicateCustomers(ORGANIZATION_ID);
    console.log('✨ 所有清理任務已完成');
  } catch (error) {
    console.error('❌ 清理過程中發生錯誤:', error);
  }
}

main();