/**
 * 平台統計服務
 * 處理 Super Admin 所需的各種統計數據
 */

import {
  collection,
  query,
  where,
  getDocs,
  getCountFromServer,
  Timestamp,
  orderBy,
  limit } from 'firebase/firestore';
import { getFirebaseDb } from '@/services/firebase/config';
import { SuperAdminStats, PlatformRevenue, OrganizationUsageStats } from '@/types/superadmin';
import { Organization } from '@/types/entities';
import { calculatePrice } from '@/config/billing';

/**
 * 獲取總組織數
 */
export async function getTotalOrganizations(): Promise<number> {
  const db = getFirebaseDb();
  const orgsRef = collection(db, 'organizations');
  const snapshot = await getCountFromServer(orgsRef);
  return snapshot.data().count;
}

/**
 * 獲取活躍組織數
 */
export async function getActiveOrganizations(): Promise<number> {
  const db = getFirebaseDb();
  const q = query(
    collection(db, 'organizations'),
    where('status', '==', 'active')
  );
  const snapshot = await getCountFromServer(q);
  return snapshot.data().count;
}

/**
 * 獲取總用戶數
 */
export async function getTotalUsers(): Promise<number> {
  const db = getFirebaseDb();
  const usersRef = collection(db, 'users');
  const snapshot = await getCountFromServer(usersRef);
  return snapshot.data().count;
}

/**
 * 獲取活躍用戶數（過去30天內有登入）
 */
export async function getActiveUsers(): Promise<number> {
  const db = getFirebaseDb();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const q = query(
    collection(db, 'users'),
    where('lastActive', '>=', Timestamp.fromDate(thirtyDaysAgo))
  );
  const snapshot = await getCountFromServer(q);
  return snapshot.data().count;
}

/**
 * 計算當月預估收入
 */
export async function calculateMonthlyRevenue(): Promise<number> {
  const db = getFirebaseDb();
  
  // 獲取所有活躍的付費組織
  const orgsQuery = query(
    collection(db, 'organizations'),
    where('status', '==', 'active'),
    where('subscriptionPlan', '==', 'pro')
  );
  
  const orgsSnapshot = await getDocs(orgsQuery);
  let totalRevenue = 0;
  
  // 計算每個組織的月費
  for (const doc of orgsSnapshot.docs) {
    const org = doc.data() as Organization;
    const activeUsers = org.monthlyUsage?.activeUsers || 0;
    const giftedSeats = org.giftedSeats || 0;
    
    const monthlyAmount = calculatePrice(
      activeUsers,
      org.billingCycle || 'monthly',
      giftedSeats
    );
    
    // 如果是年付，轉換為月度收入
    if (org.billingCycle === 'yearly') {
      totalRevenue += monthlyAmount / 12;
    } else {
      totalRevenue += monthlyAmount;
    }
  }
  
  return Math.round(totalRevenue);
}

/**
 * 計算年度預估收入
 */
export async function calculateYearlyRevenue(): Promise<number> {
  const monthlyRevenue = await calculateMonthlyRevenue();
  return monthlyRevenue * 12;
}

/**
 * 獲取總記錄數
 */
export async function getTotalRecords(): Promise<number> {
  const db = getFirebaseDb();
  const recordsRef = collection(db, 'records');
  const snapshot = await getCountFromServer(recordsRef);
  return snapshot.data().count;
}

/**
 * 獲取總 AI 處理次數
 */
export async function getTotalAIProcessing(): Promise<number> {
  const db = getFirebaseDb();
  // AI 處理記錄存在於 records 集合中的 aiProcessing 子集合
  let totalCount = 0;
  
  // 由於 Firestore 無法直接計算子集合，我們需要從組織統計中獲取
  const orgsQuery = query(collection(db, 'organizations'));
  const orgsSnapshot = await getDocs(orgsQuery);
  
  for (const doc of orgsSnapshot.docs) {
    const org = doc.data() as Organization;
    totalCount += org.monthlyUsage?.aiProcessingCount || 0;
  }
  
  return totalCount;
}

/**
 * 計算組織月成長率
 */
export async function calculateOrganizationGrowthRate(): Promise<number> {
  const db = getFirebaseDb();
  
  // 獲取本月和上月的新組織數
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  
  const thisMonthQuery = query(
    collection(db, 'organizations'),
    where('createdAt', '>=', Timestamp.fromDate(thisMonthStart))
  );
  const thisMonthSnapshot = await getCountFromServer(thisMonthQuery);
  const thisMonthCount = thisMonthSnapshot.data().count;
  
  const lastMonthQuery = query(
    collection(db, 'organizations'),
    where('createdAt', '>=', Timestamp.fromDate(lastMonthStart)),
    where('createdAt', '<=', Timestamp.fromDate(lastMonthEnd))
  );
  const lastMonthSnapshot = await getCountFromServer(lastMonthQuery);
  const lastMonthCount = lastMonthSnapshot.data().count;
  
  if (lastMonthCount === 0) return 0;
  
  return Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100);
}

/**
 * 計算用戶月成長率
 */
export async function calculateUserGrowthRate(): Promise<number> {
  const db = getFirebaseDb();
  
  // 獲取本月和上月的新用戶數
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  
  const thisMonthQuery = query(
    collection(db, 'users'),
    where('createdAt', '>=', Timestamp.fromDate(thisMonthStart))
  );
  const thisMonthSnapshot = await getCountFromServer(thisMonthQuery);
  const thisMonthCount = thisMonthSnapshot.data().count;
  
  const lastMonthQuery = query(
    collection(db, 'users'),
    where('createdAt', '>=', Timestamp.fromDate(lastMonthStart)),
    where('createdAt', '<=', Timestamp.fromDate(lastMonthEnd))
  );
  const lastMonthSnapshot = await getCountFromServer(lastMonthQuery);
  const lastMonthCount = lastMonthSnapshot.data().count;
  
  if (lastMonthCount === 0) return 0;
  
  return Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100);
}

/**
 * 獲取完整的平台統計數據
 */
export async function getPlatformStats(): Promise<SuperAdminStats> {
  // 平行載入所有統計數據以提升效能
  const [
    totalOrganizations,
    activeOrganizations,
    totalUsers,
    activeUsers,
    monthlyRevenue,
    yearlyRevenue,
    organizationGrowthRate,
    userGrowthRate,
    totalRecords,
    totalAIProcessing
  ] = await Promise.all([
    getTotalOrganizations(),
    getActiveOrganizations(),
    getTotalUsers(),
    getActiveUsers(),
    calculateMonthlyRevenue(),
    calculateYearlyRevenue(),
    calculateOrganizationGrowthRate(),
    calculateUserGrowthRate(),
    getTotalRecords(),
    getTotalAIProcessing()
  ]);
  
  return {
    totalOrganizations,
    activeOrganizations,
    totalUsers,
    activeUsers,
    monthlyRevenue,
    yearlyRevenue,
    organizationGrowthRate,
    userGrowthRate,
    totalRecords,
    totalAIProcessing,
    lastUpdated: new Date()
  };
}

/**
 * 獲取指定月份的收入統計
 */
export async function getMonthlyRevenueStats(yearMonth: string): Promise<PlatformRevenue> {
  const db = getFirebaseDb();
  const [year, month] = yearMonth.split('-').map(Number);
  
  try {
    // 獲取該月份的計費記錄
    const billingQuery = query(
      collection(db, 'billingRecords'),
      where('period', '==', yearMonth),
      where('status', 'in', ['paid', 'pending'])
    );
    
    const billingSnapshot = await getDocs(billingQuery);
    
    let totalRevenue = 0;
    let paidOrganizations = 0;
    let pendingPayments = 0;
    
    billingSnapshot.forEach(doc => {
      const billing = doc.data();
      if (billing.status === 'paid') {
        totalRevenue += billing.amount;
        paidOrganizations++;
      } else {
        pendingPayments += billing.amount;
      }
    });
    
    const averageRevenuePerOrg = paidOrganizations > 0 ? totalRevenue / paidOrganizations : 0;
    
    return {
      period: yearMonth,
      totalRevenue,
      paidOrganizations,
      pendingPayments,
      averageRevenuePerOrg: Math.round(averageRevenuePerOrg)
    };
  } catch (error) {
    console.error('獲取月度收入統計失敗:', error);
    // 如果是權限錯誤或集合不存在，返回預設值
    return {
      period: yearMonth,
      totalRevenue: 0,
      paidOrganizations: 0,
      pendingPayments: 0,
      averageRevenuePerOrg: 0
    };
  }
}

/**
 * 獲取組織使用統計列表
 */
export async function getOrganizationUsageStats(
  maxResults: number = 10,
  orderByField: 'monthlyBill' | 'activeUsers' | 'totalRecords' = 'monthlyBill'
): Promise<OrganizationUsageStats[]> {
  const db = getFirebaseDb();
  
  try {
    // 注意：這個查詢需要複合索引
    // 如果 orderByField 是 'monthlyBill'，我們需要改變策略
    // 因為 monthlyBill 不是資料庫欄位
    if (orderByField === 'monthlyBill') {
      // 先獲取所有活躍的 pro 組織，然後在記憶體中排序
      const orgsQuery = query(
        collection(db, 'organizations'),
        where('status', '==', 'active'),
        where('subscriptionPlan', '==', 'pro'),
        limit(maxResults * 2) // 獲取更多資料以便排序
      );
      
      const orgsSnapshot = await getDocs(orgsQuery);
      const stats: OrganizationUsageStats[] = [];
      
      for (const doc of orgsSnapshot.docs) {
        const org = doc.data() as Organization;
        const activeUsers = org.monthlyUsage?.activeUsers || 0;
        const giftedSeats = org.giftedSeats || 0;
        
        const monthlyBill = calculatePrice(
          activeUsers,
          org.billingCycle || 'monthly',
          giftedSeats
        );
        
        stats.push({
          organizationId: doc.id,
          organizationName: org.name,
          activeUsers,
          totalRecords: org.monthlyUsage?.recordCount || 0,
          aiProcessingCount: org.monthlyUsage?.aiProcessingCount || 0,
          monthlyBill: org.billingCycle === 'yearly' ? monthlyBill / 12 : monthlyBill,
          lastActive: org.lastActive?.toDate() || new Date()
        });
      }
      
      // 在記憶體中按月費排序
      stats.sort((a, b) => b.monthlyBill - a.monthlyBill);
      return stats.slice(0, maxResults);
    } else {
      // 對於其他欄位，使用資料庫排序
      const orgsQuery = query(
        collection(db, 'organizations'),
        where('status', '==', 'active'),
        where('subscriptionPlan', '==', 'pro'),
        orderBy(`monthlyUsage.${orderByField === 'activeUsers' ? 'activeUsers' : 'recordCount'}`, 'desc'),
        limit(maxResults)
      );
      
      const orgsSnapshot = await getDocs(orgsQuery);
      const stats: OrganizationUsageStats[] = [];
      
      for (const doc of orgsSnapshot.docs) {
        const org = doc.data() as Organization;
        const activeUsers = org.monthlyUsage?.activeUsers || 0;
        const giftedSeats = org.giftedSeats || 0;
        
        const monthlyBill = calculatePrice(
          activeUsers,
          org.billingCycle || 'monthly',
          giftedSeats
        );
        
        stats.push({
          organizationId: doc.id,
          organizationName: org.name,
          activeUsers,
          totalRecords: org.monthlyUsage?.recordCount || 0,
          aiProcessingCount: org.monthlyUsage?.aiProcessingCount || 0,
          monthlyBill: org.billingCycle === 'yearly' ? monthlyBill / 12 : monthlyBill,
          lastActive: org.lastActive?.toDate() || new Date()
        });
      }
      
      return stats;
    }
  } catch (error) {
    console.error('獲取組織使用統計失敗:', error);
    // 返回空陣列而不是拋出錯誤
    return [];
  }
}