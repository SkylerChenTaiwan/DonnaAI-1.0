/**
 * 修復組織統計資料
 * 直接在前端執行以更新組織的統計欄位
 */

// 注意：這個腳本需要在瀏覽器 console 中執行，因為需要前端的 Firebase 認證

const fixOrganizationStats = async () => {
  try {
    // 從全域變數取得 Firebase 實例（假設已經初始化）
    const { getFirestore, doc, updateDoc, collection, query, where, getDocs } = window.firebase.firestore;
    const db = getFirestore();
    
    const targetOrgId = 'aAehDHokbFHvdaMULXJM';
    console.log(`📊 修復組織統計: ${targetOrgId}`);
    
    // 1. 統計用戶數量
    const usersQuery = query(
      collection(db, 'users'),
      where('organizationId', '==', targetOrgId)
    );
    const usersSnapshot = await getDocs(usersQuery);
    const userCount = usersSnapshot.size;
    console.log(`✅ 找到 ${userCount} 個用戶`);
    
    // 2. 統計客戶數量
    const customersQuery = query(
      collection(db, 'customers'),
      where('organizationId', '==', targetOrgId)
    );
    const customersSnapshot = await getDocs(customersQuery);
    const customerCount = customersSnapshot.size;
    console.log(`✅ 找到 ${customerCount} 個客戶`);
    
    // 3. 統計團隊數量
    const teamsQuery = query(
      collection(db, 'teams'),
      where('organizationId', '==', targetOrgId)
    );
    const teamsSnapshot = await getDocs(teamsQuery);
    const teamCount = teamsSnapshot.size;
    console.log(`✅ 找到 ${teamCount} 個團隊`);
    
    // 4. 準備更新資料
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
    const currentDate = new Date();
    
    const updateData = {
      // 更新 stats 欄位
      'stats.userCount': userCount,
      'stats.activeUsers': userCount, // 暫時將所有用戶視為活躍
      'stats.customerCount': customerCount,
      'stats.teamCount': teamCount,
      
      // 更新 monthlyUsage 欄位（這是顯示統計的關鍵）
      'monthlyUsage': {
        period: currentMonth,
        activeUsers: userCount,  // 這個欄位決定了前端顯示的活躍用戶數
        recordCount: customerCount,
        aiProcessingCount: 0,
        toolUsage: {},
        calculatedAt: currentDate
      },
      
      updatedAt: currentDate
    };
    
    // 5. 更新組織文件
    console.log('🔄 更新組織統計資料...');
    const orgRef = doc(db, 'organizations', targetOrgId);
    await updateDoc(orgRef, updateData);
    
    console.log('✅ 已成功更新組織統計:');
    console.log(`  用戶數: ${userCount}`);
    console.log(`  客戶數: ${customerCount}`);
    console.log(`  團隊數: ${teamCount}`);
    console.log(`  活躍用戶: ${userCount}`);
    console.log('');
    console.log('📌 請重新整理頁面以查看更新後的統計！');
    
    return updateData;
  } catch (error) {
    console.error('❌ 發生錯誤:', error);
    throw error;
  }
};

// 如果在瀏覽器環境中執行
if (typeof window !== 'undefined') {
  console.log('📝 請執行以下命令來修復統計:');
  console.log('fixOrganizationStats()');
  window.fixOrganizationStats = fixOrganizationStats;
} else {
  console.log('⚠️ 這個腳本需要在瀏覽器 console 中執行！');
  console.log('請將以下程式碼複製到瀏覽器 console:');
  console.log('');
  console.log(fixOrganizationStats.toString());
  console.log('');
  console.log('然後執行: fixOrganizationStats()');
}