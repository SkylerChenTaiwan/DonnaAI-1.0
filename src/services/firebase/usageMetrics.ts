/**
 * 使用統計服務
 * 追蹤和分析組織、用戶、工具的使用情況
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  increment,
} from 'firebase/firestore';
import { getFirebaseDb } from './config';
import { UsageMetrics, PlatformStatistics, ToolUsageStats } from '@/types/admin';

// 記錄使用統計
export async function recordUsageMetrics(
  orgId: string,
  metrics: Omit<UsageMetrics['metrics'], 'calculatedAt'>
): Promise<void> {
  try {
    const db = getFirebaseDb();
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // 記錄每日統計
    await recordMetricsForPeriod(orgId, 'daily', dateStr, metrics);
    
    // 同時更新週統計和月統計
    const weekStr = getWeekString(today);
    const monthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    
    await Promise.all([
      recordMetricsForPeriod(orgId, 'weekly', weekStr, metrics),
      recordMetricsForPeriod(orgId, 'monthly', monthStr, metrics),
    ]);
  } catch (error) {
    console.error('recordUsageMetrics 錯誤:', error);
    throw error;
  }
}

// 記錄特定週期的統計
async function recordMetricsForPeriod(
  orgId: string,
  period: UsageMetrics['period'],
  dateStr: string,
  metrics: Omit<UsageMetrics['metrics'], 'calculatedAt'>
): Promise<void> {
  try {
    const db = getFirebaseDb();
    const metricsRef = doc(db, 'usage_metrics', orgId, period, dateStr);
    
    const existingDoc = await getDoc(metricsRef);
    
    if (existingDoc.exists()) {
      // 更新現有統計
      const existingData = existingDoc.data();
      await updateDoc(metricsRef, {
        metrics: {
          activeUsers: Math.max(existingData.metrics.activeUsers, metrics.activeUsers),
          totalSessions: increment(metrics.totalSessions),
          aiMinutesUsed: increment(metrics.aiMinutesUsed),
          toolUsage: mergeToolUsage(existingData.metrics.toolUsage, metrics.toolUsage),
          dataVolume: metrics.dataVolume,
          apiCalls: increment(metrics.apiCalls || 0),
          storageUsed: metrics.storageUsed,
        },
        calculatedAt: serverTimestamp(),
      });
    } else {
      // 建立新統計
      await setDoc(metricsRef, {
        organizationId: orgId,
        period,
        date: dateStr,
        metrics: {
          ...metrics,
          calculatedAt: serverTimestamp(),
        },
        calculatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('recordMetricsForPeriod 錯誤:', error);
    throw error;
  }
}

// 取得組織使用統計
export async function getOrganizationMetrics(
  orgId: string,
  period: UsageMetrics['period'],
  startDate: Date,
  endDate: Date
): Promise<UsageMetrics[]> {
  try {
    const db = getFirebaseDb();
    const metricsQuery = query(
      collection(db, 'usage_metrics', orgId, period),
      where('date', '>=', startDate.toISOString().split('T')[0]),
      where('date', '<=', endDate.toISOString().split('T')[0]),
      orderBy('date', 'desc')
    );
    
    const snapshot = await getDocs(metricsQuery);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as UsageMetrics[];
  } catch (error) {
    console.error('getOrganizationMetrics 錯誤:', error);
    throw error;
  }
}

// 追蹤工具使用
export async function trackToolUsage(
  toolId: string,
  toolName: string,
  userId: string,
  orgId: string,
  sessionDuration?: number
): Promise<void> {
  try {
    const db = getFirebaseDb();
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    
    // 記錄工具使用統計
    const toolStatsRef = doc(
      db,
      'usage_metrics',
      orgId,
      'tool_usage',
      `${toolId}_${dateStr}`
    );
    
    const existingDoc = await getDoc(toolStatsRef);
    
    if (existingDoc.exists()) {
      // 更新現有統計
      await updateDoc(toolStatsRef, {
        'metrics.uniqueUsers': increment(1),
        'metrics.totalSessions': increment(1),
        'metrics.totalActions': increment(1),
        'metrics.averageSessionDuration': sessionDuration || 0,
      });
    } else {
      // 建立新統計
      const toolStats: ToolUsageStats = {
        toolId,
        toolName,
        organizationId: orgId,
        period: 'daily',
        date: dateStr,
        metrics: {
          uniqueUsers: 1,
          totalSessions: 1,
          averageSessionDuration: sessionDuration || 0,
          totalActions: 1,
          errorRate: 0,
        },
      };
      await setDoc(toolStatsRef, toolStats);
    }

    // 同時更新組織級別的工具使用統計
    await recordUsageMetrics(orgId, {
      activeUsers: 1,
      totalSessions: 1,
      aiMinutesUsed: 0,
      toolUsage: { [toolId]: 1 },
      dataVolume: {
        customers: 0,
        records: 0,
        tasks: 0,
      },
    });
  } catch (error) {
    console.error('trackToolUsage 錯誤:', error);
    throw error;
  }
}

// 取得平台統計（Super Admin 使用）
export async function getPlatformStatistics(): Promise<PlatformStatistics> {
  try {
    const db = getFirebaseDb();
    
    // 取得所有組織
    const orgsSnapshot = await getDocs(collection(db, 'organizations'));
    const totalOrganizations = orgsSnapshot.size;
    const activeOrganizations = orgsSnapshot.docs.filter(
      doc => doc.data().status === 'active'
    ).length;
    
    // 取得所有用戶
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const totalUsers = usersSnapshot.size;
    
    // 計算活躍用戶（最近30天有登入）
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeUsers = usersSnapshot.docs.filter(doc => {
      const lastLogin = doc.data().lastLoginAt;
      if (lastLogin && lastLogin.toDate) {
        return lastLogin.toDate() > thirtyDaysAgo;
      }
      return false;
    }).length;
    
    // 計算收入（簡化版本，實際應從計費系統取得）
    let totalRevenue = 0;
    orgsSnapshot.docs.forEach(doc => {
      const plan = doc.data().subscriptionPlan;
      const planPrices: Record<string, number> = {
        trial: 0,
        basic: 299,
        professional: 599,
        enterprise: 1999,
      };
      totalRevenue += planPrices[plan] || 0;
    });
    
    const averageRevenuePerOrg = activeOrganizations > 0 
      ? totalRevenue / activeOrganizations 
      : 0;
    
    // TODO: 實作更詳細的統計
    const statistics: PlatformStatistics = {
      totalOrganizations,
      activeOrganizations,
      totalUsers,
      activeUsers,
      totalRevenue,
      averageRevenuePerOrg,
      topTools: [],
      growthRate: {
        organizations: 0,
        users: 0,
        revenue: 0,
      },
      calculatedAt: new Date(),
    };
    
    return statistics;
  } catch (error) {
    console.error('getPlatformStatistics 錯誤:', error);
    throw error;
  }
}

// 取得工具使用排行
export async function getTopTools(limit: number = 10): Promise<Array<{
  toolId: string;
  toolName: string;
  usage: number;
}>> {
  try {
    const db = getFirebaseDb();
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    
    // 取得今日所有工具使用統計
    const toolStatsQuery = query(
      collection(db, 'usage_metrics'),
      where('period', '==', 'daily'),
      where('date', '==', dateStr),
      orderBy('metrics.totalSessions', 'desc'),
      limit(limit)
    );
    
    const snapshot = await getDocs(toolStatsQuery);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        toolId: data.toolId,
        toolName: data.toolName,
        usage: data.metrics.totalSessions,
      };
    });
  } catch (error) {
    console.error('getTopTools 錯誤:', error);
    return [];
  }
}

// 輔助函數：合併工具使用統計
function mergeToolUsage(
  existing: Record<string, number>,
  updates: Record<string, number>
): Record<string, number> {
  const merged = { ...existing };
  
  for (const [toolId, count] of Object.entries(updates)) {
    merged[toolId] = (merged[toolId] || 0) + count;
  }
  
  return merged;
}

// 輔助函數：取得週字串
function getWeekString(date: Date): string {
  const year = date.getFullYear();
  const week = getWeekNumber(date);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

// 輔助函數：計算週數
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}