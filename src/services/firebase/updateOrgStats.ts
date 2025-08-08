/**
 * 更新組織統計服務
 * 用於計算並更新組織的用戶、客戶等統計資料
 */

import {
  collection,
  doc,
  query,
  where,
  getDocs,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirebaseDb } from './config';

/**
 * 更新組織統計資料
 * 計算用戶數、客戶數等並更新到組織文件
 */
export async function updateOrganizationStats(organizationId: string) {
  console.log('📊 開始更新組織統計:', organizationId);
  
  try {
    const db = getFirebaseDb();
    
    // 1. 統計用戶數量
    const usersQuery = query(
      collection(db, 'users'),
      where('organizationId', '==', organizationId)
    );
    const usersSnapshot = await getDocs(usersQuery);
    const userCount = usersSnapshot.size;
    console.log(`✅ 找到 ${userCount} 個用戶`);
    
    // 2. 統計客戶數量
    const customersQuery = query(
      collection(db, 'customers'),
      where('organizationId', '==', organizationId)
    );
    const customersSnapshot = await getDocs(customersQuery);
    const customerCount = customersSnapshot.size;
    console.log(`✅ 找到 ${customerCount} 個客戶`);
    
    // 3. 統計團隊數量
    const teamsQuery = query(
      collection(db, 'teams'),
      where('organizationId', '==', organizationId)
    );
    const teamsSnapshot = await getDocs(teamsQuery);
    const teamCount = teamsSnapshot.size;
    console.log(`✅ 找到 ${teamCount} 個團隊`);
    
    // 4. 準備更新資料
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
    
    const updateData = {
      // 更新 stats 欄位
      'stats.userCount': userCount,
      'stats.activeUsers': userCount, // 暫時將所有用戶視為活躍
      'stats.customerCount': customerCount,
      'stats.teamCount': teamCount,
      
      // 更新 monthlyUsage 欄位（這是顯示統計的關鍵）
      monthlyUsage: {
        period: currentMonth,
        activeUsers: userCount,  // 這個欄位決定了前端顯示的活躍用戶數
        recordCount: customerCount,
        aiProcessingCount: 0,
        toolUsage: {},
        calculatedAt: new Date()
      },
      
      updatedAt: serverTimestamp()
    };
    
    // 5. 更新組織文件
    console.log('🔄 更新組織文件...');
    const orgRef = doc(db, 'organizations', organizationId);
    await updateDoc(orgRef, updateData);
    
    console.log('✅ 已成功更新組織統計:');
    console.log(`  用戶數: ${userCount}`);
    console.log(`  客戶數: ${customerCount}`);
    console.log(`  團隊數: ${teamCount}`);
    console.log(`  活躍用戶: ${userCount}`);
    
    return {
      userCount,
      customerCount,
      teamCount,
      activeUsers: userCount
    };
  } catch (error) {
    console.error('❌ 更新組織統計失敗:', error);
    throw error;
  }
}

/**
 * 自動檢查並更新組織統計
 * 如果 monthlyUsage 不存在或過期，自動更新
 */
export async function autoUpdateOrganizationStats(organizationId: string) {
  try {
    const db = getFirebaseDb();
    const orgRef = doc(db, 'organizations', organizationId);
    
    // 檢查是否需要更新（這裡簡化處理，實際可以檢查 monthlyUsage 是否存在或過期）
    console.log('🔍 檢查組織統計是否需要更新...');
    
    // 執行更新
    const stats = await updateOrganizationStats(organizationId);
    return stats;
  } catch (error) {
    console.error('自動更新統計失敗:', error);
    // 不拋出錯誤，避免影響主流程
    return null;
  }
}