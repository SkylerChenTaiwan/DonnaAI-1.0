// 瀏覽器清理腳本 - 在開發者工具 Console 執行
async function cleanupDuplicateCustomers() {
  try {
    // 匯入 Firebase 服務
    const { auth } = window.firebaseConfig || {};
    if (!auth?.currentUser) {
      console.error('❌ 請先登入 DonnaAI 再執行此腳本');
      return;
    }
    
    const organizationId = auth.currentUser.organizationId;
    if (!organizationId) {
      console.error('❌ 找不到 organizationId');
      return;
    }
    
    console.log('🔍 開始清理重複客戶資料...');
    console.log('組織 ID:', organizationId);
    
    // 使用 Firestore 服務
    const db = window.firebase?.firestore();
    if (!db) {
      console.error('❌ Firebase 未初始化');
      return;
    }
    
    // 取得所有客戶資料
    const customersRef = db.collection('organizations')
      .doc(organizationId)
      .collection('customers');
    
    const snapshot = await customersRef.get();
    console.log(`📊 找到 ${snapshot.size} 筆客戶記錄`);
    
    // 按照 name + company 分組
    const customerGroups = new Map();
    const allCustomers = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const customer = { id: doc.id, ...data };
      allCustomers.push(customer);
      
      const key = `${data.name || ''}_${data.company || ''}`;
      if (!customerGroups.has(key)) {
        customerGroups.set(key, []);
      }
      customerGroups.get(key).push(customer);
    });
    
    // 找出重複項目
    let duplicateCount = 0;
    let toDelete = [];
    
    for (const [key, customers] of customerGroups) {
      if (customers.length > 1) {
        duplicateCount += customers.length - 1;
        
        // 按照建立時間排序，保留最新的
        customers.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() || new Date(0);
          const bTime = b.createdAt?.toDate?.() || new Date(0);
          return bTime - aTime;
        });
        
        // 標記要刪除的項目（除了第一個）
        for (let i = 1; i < customers.length; i++) {
          toDelete.push(customers[i]);
        }
        
        console.log(`🔄 ${key}: 發現 ${customers.length} 筆重複，將保留最新的`);
      }
    }
    
    console.log(`🧹 準備清理 ${duplicateCount} 筆重複資料`);
    
    if (duplicateCount === 0) {
      console.log('✅ 沒有找到重複資料');
      return;
    }
    
    // 執行刪除（分批處理）
    const batchSize = 25;
    let deletedCount = 0;
    
    for (let i = 0; i < toDelete.length; i += batchSize) {
      const batch = db.batch();
      const batchItems = toDelete.slice(i, i + batchSize);
      
      for (const customer of batchItems) {
        batch.delete(customersRef.doc(customer.id));
      }
      
      await batch.commit();
      deletedCount += batchItems.length;
      
      console.log(`🗑️  已刪除 ${deletedCount}/${toDelete.length} 筆重複資料`);
      
      // 避免過快操作
      if (i + batchSize < toDelete.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`✅ 清理完成！`);
    console.log(`📊 原本記錄數: ${allCustomers.length}`);
    console.log(`🗑️  刪除重複: ${deletedCount}`);
    console.log(`📈 剩餘記錄數: ${allCustomers.length - deletedCount}`);
    
  } catch (error) {
    console.error('❌ 清理失敗:', error);
  }
}

// 執行清理
cleanupDuplicateCustomers();