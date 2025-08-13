/**
 * 計費服務
 * 處理月度使用統計、計費記錄生成等
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  runTransaction,
  serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb } from '@/services/firebase/config';
import { 
  BillingRecord, 
  MonthlyUsage, 
  UserActivitySummary,
  UsageReport,
  ToolUsageItem 
} from '@/types/entities';
import { BILLING_CONFIG, calculatePrice } from '@/config/billing';

/**
 * 獲取指定月份的日期範圍
 */
function getMonthDateRange(yearMonth?: string) {
  const [year, month] = yearMonth 
    ? yearMonth.split('-').map(Number)
    : [new Date().getFullYear(), new Date().getMonth()];
  
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  
  return {
    start: Timestamp.fromDate(start),
    end: Timestamp.fromDate(end),
    period: `${year}-${String(month).padStart(2, '0')}` };
}

/**
 * 獲取上個月的日期範圍
 */
function getLastMonthDateRange() {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return getMonthDateRange(
    `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`
  );
}

/**
 * 計算組織的月度使用統計
 */
export async function calculateMonthlyUsage(
  organizationId: string,
  yearMonth?: string
): Promise<MonthlyUsage> {
  const db = getFirebaseDb();
  const dateRange = yearMonth ? getMonthDateRange(yearMonth) : getLastMonthDateRange();
  
  try {
    return await runTransaction(db, async (transaction) => {
      // 統計活躍用戶
      const usersQuery = query(
        collection(db, 'users'),
        where('organizationId', '==', organizationId),
        where('lastActiveAt', '>=', dateRange.start),
        where('lastActiveAt', '<=', dateRange.end)
      );
      
      const usersSnapshot = await transaction.get(usersQuery);
      const activeUserIds = new Set<string>();
      
      usersSnapshot.forEach(doc => {
        activeUserIds.add(doc.id);
      });
      
      // 統計工具使用
      const toolUsageMap = new Map<string, Set<string>>();
      const toolUsageQuery = query(
        collection(db, 'tool_usage'),
        where('organizationId', '==', organizationId),
        where('timestamp', '>=', dateRange.start),
        where('timestamp', '<=', dateRange.end)
      );
      
      const toolUsageSnapshot = await transaction.get(toolUsageQuery);
      
      toolUsageSnapshot.forEach(doc => {
        const data = doc.data();
        const { toolId, userId } = data;
        
        if (!toolUsageMap.has(toolId)) {
          toolUsageMap.set(toolId, new Set());
        }
        toolUsageMap.get(toolId)!.add(userId);
      });
      
      // 轉換工具使用統計
      const toolUsage: Record<string, number> = {};
      toolUsageMap.forEach((users, toolId) => {
        toolUsage[toolId] = users.size;
      });
      
      return {
        period: dateRange.period,
        activeUsers: activeUserIds.size,
        toolUsage,
        calculatedAt: serverTimestamp() as Timestamp };
    });
  } catch (error) {
    console.error('計算月度使用統計失敗:', error);
    throw error;
  }
}

/**
 * 套用贈送人數並計算計費用戶數
 */
export function applyGiftedSeats(
  activeUsers: number,
  giftedSeats: number = 0
): number {
  return Math.max(0, activeUsers - giftedSeats);
}

/**
 * 生成計費記錄
 */
export async function generateBillingRecord(
  organizationId: string,
  yearMonth?: string
): Promise<BillingRecord> {
  const db = getFirebaseDb();
  
  try {
    // 獲取組織資訊
    const orgDoc = await getDoc(doc(db, 'organizations', organizationId));
    if (!orgDoc.exists()) {
      throw new Error('組織不存在');
    }
    
    const organization = orgDoc.data();
    const giftedSeats = organization.giftedSeats || 0;
    const billingCycle = organization.billingCycle || 'monthly';
    
    // 計算月度使用
    const monthlyUsage = await calculateMonthlyUsage(organizationId, yearMonth);
    const billableUsers = applyGiftedSeats(monthlyUsage.activeUsers, giftedSeats);
    
    // 獲取工具使用詳情
    const toolUsageItems: ToolUsageItem[] = Object.entries(monthlyUsage.toolUsage)
      .map(([toolId, activeUsers]) => ({
        toolId,
        toolName: getToolName(toolId), // 需要實作工具名稱映射
        activeUsers }));
    
    // 計算金額
    const unitPrice = BILLING_CONFIG.PRICE_PER_USER;
    const totalAmount = calculatePrice(monthlyUsage.activeUsers, billingCycle, giftedSeats);
    
    // 建立計費記錄
    const billingRecord: Omit<BillingRecord, 'id'> = {
      organizationId,
      period: monthlyUsage.period,
      activeUsers: monthlyUsage.activeUsers,
      giftedSeats,
      billableUsers,
      toolUsage: toolUsageItems,
      unitPrice,
      totalAmount,
      currency: BILLING_CONFIG.CURRENCY,
      status: 'pending',
      createdAt: serverTimestamp() as Timestamp,
      dueDate: Timestamp.fromDate(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 天後到期
      ) };
    
    // 儲存計費記錄
    const billingRef = doc(collection(db, 'billing_records'));
    await setDoc(billingRef, billingRecord);
    
    return {
      id: billingRef.id,
      ...billingRecord };
  } catch (error) {
    console.error('生成計費記錄失敗:', error);
    throw error;
  }
}

/**
 * 獲取組織的計費歷史
 */
export async function getUsageHistory(
  organizationId: string,
  limitCount: number = 12
): Promise<BillingRecord[]> {
  const db = getFirebaseDb();
  
  try {
    const billingQuery = query(
      collection(db, 'billing_records'),
      where('organizationId', '==', organizationId),
      orderBy('period', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(billingQuery);
    const records: BillingRecord[] = [];
    
    snapshot.forEach(doc => {
      records.push({
        id: doc.id,
        ...doc.data() } as BillingRecord);
    });
    
    return records;
  } catch (error) {
    console.error('獲取計費歷史失敗:', error);
    throw error;
  }
}

/**
 * 更新計費記錄狀態
 */
export async function updateBillingRecordStatus(
  recordId: string,
  status: BillingRecord['status'],
  paidAt?: Timestamp
): Promise<void> {
  const db = getFirebaseDb();
  
  try {
    const updateData: any = { status };
    
    if (status === 'paid' && paidAt) {
      updateData.paidAt = paidAt;
    }
    
    await setDoc(
      doc(db, 'billing_records', recordId),
      updateData,
      { merge: true }
    );
  } catch (error) {
    console.error('更新計費記錄狀態失敗:', error);
    throw error;
  }
}

/**
 * 生成使用報告
 */
export async function generateUsageReport(
  organizationId: string,
  yearMonth?: string
): Promise<UsageReport> {
  const dateRange = yearMonth ? getMonthDateRange(yearMonth) : getLastMonthDateRange();
  
  try {
    // 獲取月度使用統計
    const monthlyUsage = await calculateMonthlyUsage(organizationId, yearMonth);
    
    // 獲取組織資訊
    const db = getFirebaseDb();
    const orgDoc = await getDoc(doc(db, 'organizations', organizationId));
    const organization = orgDoc.data();
    const giftedSeats = organization?.giftedSeats || 0;
    
    // 計算計費資訊
    const billableUsers = applyGiftedSeats(monthlyUsage.activeUsers, giftedSeats);
    const totalAmount = calculatePrice(
      monthlyUsage.activeUsers,
      organization?.billingCycle || 'monthly',
      giftedSeats
    );
    
    // 生成報告
    const report: UsageReport = {
      organizationId,
      period: dateRange.period,
      generatedAt: serverTimestamp() as Timestamp,
      summary: {
        activeUsers: monthlyUsage.activeUsers,
        billableUsers,
        totalAmount,
        currency: BILLING_CONFIG.CURRENCY },
      userDetails: [], // 需要實作用戶詳情統計
      toolUsageDetails: [], // 需要實作工具使用詳情
    };
    
    return report;
  } catch (error) {
    console.error('生成使用報告失敗:', error);
    throw error;
  }
}

/**
 * 工具名稱映射（暫時的實作）
 */
function getToolName(toolId: string): string {
  const toolNames: Record<string, string> = {
    'ai-assistant': 'AI 助手',
    'voice-recorder': '語音記錄',
    'data-import': '資料匯入',
    'analytics': '數據分析',
    'task-manager': '任務管理' };
  
  return toolNames[toolId] || toolId;
}

/**
 * 批次處理大量資料
 */
async function processInBatches<T>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<void>
): Promise<void> {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await processor(batch);
  }
}