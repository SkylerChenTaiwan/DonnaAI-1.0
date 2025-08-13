/**
 * 月度計費排程服務
 * 處理自動月度計費任務
 */

import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  runTransaction,
  doc } from 'firebase/firestore';
import { getFirebaseDb } from '@/services/firebase/config';
import { Organization } from '@/types/entities';
import { 
  calculateMonthlyUsage, 
  generateBillingRecord 
} from '@/services/firebase/admin/billingService';

/**
 * 執行月度計費任務
 * 應該在每月初執行（例如每月1日凌晨）
 */
export async function executeMonthlyBilling(): Promise<{
  success: boolean;
  processedCount: number;
  failedCount: number;
  errors: Array<{ organizationId: string; error: string }>;
}> {
  const db = getFirebaseDb();
  const results = {
    success: true,
    processedCount: 0,
    failedCount: 0,
    errors: [] as Array<{ organizationId: string; error: string }> };

  try {
    // 獲取所有活躍的付費組織
    const orgsQuery = query(
      collection(db, 'organizations'),
      where('status', '==', 'active'),
      where('subscriptionPlan', '==', 'pro')
    );
    
    const orgsSnapshot = await getDocs(orgsQuery);
    
    console.log(`開始處理 ${orgsSnapshot.size} 個組織的月度計費`);
    
    // 處理每個組織
    for (const orgDoc of orgsSnapshot.docs) {
      const organization = orgDoc.data() as Organization;
      
      try {
        await processOrganizationBilling(orgDoc.id, organization);
        results.processedCount++;
      } catch (error) {
        console.error(`處理組織 ${orgDoc.id} 計費失敗:`, error);
        results.failedCount++;
        results.errors.push({
          organizationId: orgDoc.id,
          error: error instanceof Error ? error.message : '未知錯誤' });
      }
    }
    
    // 判斷是否有失敗
    if (results.failedCount > 0) {
      results.success = false;
    }
    
    console.log(`月度計費完成：成功 ${results.processedCount}，失敗 ${results.failedCount}`);
    
    return results;
  } catch (error) {
    console.error('執行月度計費任務失敗:', error);
    return {
      success: false,
      processedCount: results.processedCount,
      failedCount: results.failedCount,
      errors: results.errors };
  }
}

/**
 * 處理單個組織的計費
 */
async function processOrganizationBilling(
  organizationId: string,
  organization: Organization
): Promise<void> {
  const db = getFirebaseDb();
  
  // 獲取上個月的時間範圍
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const yearMonth = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
  
  // 使用事務處理確保數據一致性
  await runTransaction(db, async (transaction) => {
    // 檢查是否已經生成過該月的計費記錄
    const billingQuery = query(
      collection(db, 'billingRecords'),
      where('organizationId', '==', organizationId),
      where('period', '==', yearMonth)
    );
    
    const existingBilling = await getDocs(billingQuery);
    if (!existingBilling.empty) {
      console.log(`組織 ${organizationId} 已存在 ${yearMonth} 的計費記錄`);
      return;
    }
    
    // 計算月度使用量
    const usage = await calculateMonthlyUsage(organizationId, yearMonth);
    
    // 如果沒有使用量，跳過
    if (usage.activeUsers === 0) {
      console.log(`組織 ${organizationId} 在 ${yearMonth} 沒有活躍用戶`);
      return;
    }
    
    // 生成計費記錄
    const billingRecord = await generateBillingRecord(organizationId, yearMonth);
    
    // 更新組織的最後計費時間
    const orgRef = doc(db, 'organizations', organizationId);
    transaction.update(orgRef, {
      lastBillingDate: Timestamp.now(),
      lastBillingPeriod: yearMonth });
    
    console.log(`成功生成組織 ${organizationId} 的 ${yearMonth} 計費記錄`);
  });
}

/**
 * 檢查是否需要執行月度計費
 * 通常在每月1日執行
 */
export function shouldRunMonthlyBilling(date: Date = new Date()): boolean {
  return date.getDate() === 1;
}

/**
 * 獲取下次計費時間
 */
export function getNextBillingDate(currentDate: Date = new Date()): Date {
  const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
  // 設定為凌晨2點執行，避免時區問題
  nextMonth.setHours(2, 0, 0, 0);
  return nextMonth;
}

/**
 * 手動觸發特定組織的計費
 * 用於管理員介面手動生成計費記錄
 */
export async function triggerOrganizationBilling(
  organizationId: string,
  yearMonth?: string
): Promise<void> {
  const db = getFirebaseDb();
  
  // 獲取組織資訊
  const orgDoc = await getDocs(
    query(
      collection(db, 'organizations'),
      where('__name__', '==', organizationId)
    )
  );
  
  if (orgDoc.empty) {
    throw new Error('找不到指定的組織');
  }
  
  const organization = orgDoc.docs[0].data() as Organization;
  
  // 如果沒有指定月份，使用上個月
  if (!yearMonth) {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    yearMonth = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
  }
  
  // 驗證月份格式
  const monthRegex = /^\d{4}-\d{2}$/;
  if (!monthRegex.test(yearMonth)) {
    throw new Error('無效的月份格式，應為 YYYY-MM');
  }
  
  // 執行計費
  await processOrganizationBilling(organizationId, organization);
}

/**
 * 批量修正計費記錄
 * 用於修正計算錯誤的計費記錄
 */
export async function recalculateBillingRecords(
  yearMonth: string,
  organizationIds?: string[]
): Promise<{
  updatedCount: number;
  errors: Array<{ organizationId: string; error: string }>;
}> {
  const db = getFirebaseDb();
  const results = {
    updatedCount: 0,
    errors: [] as Array<{ organizationId: string; error: string }> };
  
  try {
    // 建立查詢
    let orgsQuery = query(
      collection(db, 'organizations'),
      where('status', '==', 'active'),
      where('subscriptionPlan', '==', 'pro')
    );
    
    // 如果指定了組織ID列表，則只處理這些組織
    if (organizationIds && organizationIds.length > 0) {
      orgsQuery = query(
        collection(db, 'organizations'),
        where('__name__', 'in', organizationIds)
      );
    }
    
    const orgsSnapshot = await getDocs(orgsQuery);
    
    for (const orgDoc of orgsSnapshot.docs) {
      try {
        // 重新計算使用量
        const usage = await calculateMonthlyUsage(orgDoc.id, yearMonth);
        
        // 查找現有的計費記錄
        const billingQuery = query(
          collection(db, 'billingRecords'),
          where('organizationId', '==', orgDoc.id),
          where('period', '==', yearMonth)
        );
        
        const billingSnapshot = await getDocs(billingQuery);
        
        if (!billingSnapshot.empty) {
          // 更新現有記錄
          const billingDoc = billingSnapshot.docs[0];
          await runTransaction(db, async (transaction) => {
            transaction.update(billingDoc.ref, {
              ...usage,
              updatedAt: Timestamp.now(),
              isRecalculated: true });
          });
          
          results.updatedCount++;
        }
      } catch (error) {
        console.error(`重新計算組織 ${orgDoc.id} 計費失敗:`, error);
        results.errors.push({
          organizationId: orgDoc.id,
          error: error instanceof Error ? error.message : '未知錯誤' });
      }
    }
    
    return results;
  } catch (error) {
    console.error('批量修正計費記錄失敗:', error);
    throw error;
  }
}