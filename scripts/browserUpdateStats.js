/**
 * 在瀏覽器中執行的統計更新腳本
 * 複製整個程式碼到瀏覽器 Console 執行
 */

// 請在瀏覽器 Console 中執行以下程式碼：

(async function updateOrganizationStats() {
  try {
    console.log('🔄 開始更新組織統計...');
    
    // 從 URL 獲取組織 ID
    const orgId = 'aAehDHokbFHvdaMULXJM';
    
    // 獲取 Firebase 實例（假設已經在頁面中初始化）
    const { getFirestore, doc, updateDoc, collection, query, where, getDocs, serverTimestamp } = 
      window.firebase?.firestore || {};
    
    if (!getFirestore) {
      console.error('❌ Firebase 未初始化，請確認您在正確的頁面');
      return;
    }
    
    const db = getFirestore();
    
    // 1. 統計用戶數量
    console.log('📊 統計用戶數量...');
    const usersQuery = query(
      collection(db, 'users'),
      where('organizationId', '==', orgId)
    );
    const usersSnapshot = await getDocs(usersQuery);
    const userCount = usersSnapshot.size;
    console.log(`✅ 找到 ${userCount} 個用戶`);
    
    // 2. 統計客戶數量
    console.log('📊 統計客戶數量...');
    const customersQuery = query(
      collection(db, 'customers'),
      where('organizationId', '==', orgId)
    );
    const customersSnapshot = await getDocs(customersQuery);
    const customerCount = customersSnapshot.size;
    console.log(`✅ 找到 ${customerCount} 個客戶`);
    
    // 3. 準備更新資料
    const currentMonth = new Date().toISOString().substring(0, 7);
    const updateData = {
      'stats.userCount': userCount,
      'stats.activeUsers': userCount,
      'stats.customerCount': customerCount,
      'monthlyUsage': {
        period: currentMonth,
        activeUsers: userCount,
        recordCount: customerCount,
        aiProcessingCount: 0,
        toolUsage: {},
        calculatedAt: new Date()
      },
      updatedAt: serverTimestamp()
    };
    
    console.log('📝 準備更新的資料:', updateData);
    
    // 4. 更新組織文件
    console.log('🔄 更新組織文件...');
    const orgRef = doc(db, 'organizations', orgId);
    await updateDoc(orgRef, updateData);
    
    console.log('✅ 統計更新成功！');
    console.log(`  用戶數: ${userCount}`);
    console.log(`  客戶數: ${customerCount}`);
    console.log('');
    console.log('📌 請重新整理頁面查看更新後的統計！');
    
    // 自動重新整理（可選）
    if (confirm('統計已更新，是否要重新整理頁面？')) {
      window.location.reload();
    }
    
  } catch (error) {
    console.error('❌ 更新失敗:', error);
    console.error('詳細錯誤:', error.message);
    
    // 提供替代方案
    console.log('');
    console.log('💡 請嘗試以下步驟：');
    console.log('1. 確認您已登入');
    console.log('2. 確認您有 Super Admin 權限');
    console.log('3. 嘗試手動在頁面上點擊"更新"按鈕');
  }
})();