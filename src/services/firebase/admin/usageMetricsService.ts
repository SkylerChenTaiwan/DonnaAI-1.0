/**
 * 使用統計服務
 * 追蹤和報告組織的使用情況
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
  Timestamp,
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { getFirebaseDb } from '@/services/firebase/config';
import { UsageMetrics, Period } from '@/types/admin';

export interface UsageMetric {
  organizationId: string;
  userId: string;
  action: string;
  category: 'tool' | 'feature' | 'ai' | 'data';
  metadata?: Record<string, any>;
  timestamp?: Date;
}

export interface UsageReport {
  organizationId: string;
  period: Period;
  startDate: Date;
  endDate: Date;
  summary: {
    totalUsers: number;
    activeUsers: number;
    totalSessions: number;
    aiMinutesUsed: number;
    storageUsed: number;
  };
  toolUsage: Record<string, number>;
  featureUsage: Record<string, number>;
  userActivity: Array<{
    userId: string;
    userName: string;
    sessionsCount: number;
    aiMinutesUsed: number;
    lastActive: Date;
  }>;
}

/**
 * 記錄使用統計
 */
export const trackUsage = async (metric: UsageMetric): Promise<void> => {
  try {
    const db = getFirebaseDb();
    const metricsRef = collection(
      db, 
      'usage_metrics',
      metric.organizationId,
      'metrics'
    );

    const metricData = {
      ...metric,
      timestamp: metric.timestamp || serverTimestamp(),
      createdAt: serverTimestamp()
    };

    // 使用時間戳作為文檔 ID
    const docId = `${Date.now()}_${metric.userId}_${metric.action}`;
    await setDoc(doc(metricsRef, docId), metricData);

    // 同時更新每日聚合資料
    await updateDailyAggregates(metric);
  } catch (error) {
    console.error('記錄使用統計失敗:', error);
    // 不拋出錯誤，避免影響主要功能
  }
};

/**
 * 獲取使用報表
 */
export const getUsageReport = async (
  orgId: string, 
  period: Period,
  startDate?: Date,
  endDate?: Date
): Promise<UsageReport> => {
  try {
    const db = getFirebaseDb();
    const { start, end } = getDateRangeForPeriod(period, startDate, endDate);

    // 獲取聚合資料
    const aggregatesRef = collection(
      db,
      'usage_metrics',
      orgId,
      'daily_aggregates'
    );

    const q = query(
      aggregatesRef,
      where('date', '>=', Timestamp.fromDate(start)),
      where('date', '<=', Timestamp.fromDate(end)),
      orderBy('date', 'desc')
    );

    const querySnapshot = await getDocs(q);
    
    // 初始化報表資料
    const report: UsageReport = {
      organizationId: orgId,
      period,
      startDate: start,
      endDate: end,
      summary: {
        totalUsers: 0,
        activeUsers: 0,
        totalSessions: 0,
        aiMinutesUsed: 0,
        storageUsed: 0
      },
      toolUsage: {},
      featureUsage: {},
      userActivity: []
    };

    // 處理聚合資料
    const userActivityMap = new Map<string, any>();

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // 累計摘要資料
      report.summary.totalSessions += data.sessionsCount || 0;
      report.summary.aiMinutesUsed += data.aiMinutesUsed || 0;

      // 累計工具使用
      if (data.toolUsage) {
        Object.entries(data.toolUsage).forEach(([tool, count]) => {
          report.toolUsage[tool] = (report.toolUsage[tool] || 0) + (count as number);
        });
      }

      // 累計功能使用
      if (data.featureUsage) {
        Object.entries(data.featureUsage).forEach(([feature, count]) => {
          report.featureUsage[feature] = (report.featureUsage[feature] || 0) + (count as number);
        });
      }

      // 累計用戶活動
      if (data.userActivity) {
        data.userActivity.forEach((activity: any) => {
          const existing = userActivityMap.get(activity.userId) || {
            userId: activity.userId,
            userName: activity.userName,
            sessionsCount: 0,
            aiMinutesUsed: 0,
            lastActive: activity.lastActive
          };

          existing.sessionsCount += activity.sessionsCount || 0;
          existing.aiMinutesUsed += activity.aiMinutesUsed || 0;
          
          // 更新最後活動時間
          if (activity.lastActive > existing.lastActive) {
            existing.lastActive = activity.lastActive;
          }

          userActivityMap.set(activity.userId, existing);
        });
      }
    });

    // 轉換用戶活動資料
    report.userActivity = Array.from(userActivityMap.values())
      .sort((a, b) => b.sessionsCount - a.sessionsCount);

    report.summary.activeUsers = report.userActivity.length;

    // 獲取總用戶數
    const orgDoc = await getDoc(doc(db, 'organizations', orgId));
    if (orgDoc.exists()) {
      report.summary.totalUsers = orgDoc.data().stats?.totalUsers || 0;
      report.summary.storageUsed = orgDoc.data().stats?.storageUsed || 0;
    }

    return report;
  } catch (error) {
    console.error('獲取使用報表失敗:', error);
    throw error;
  }
};

/**
 * 更新每日聚合資料
 */
async function updateDailyAggregates(metric: UsageMetric): Promise<void> {
  try {
    const db = getFirebaseDb();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const aggregateId = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    const aggregateRef = doc(
      db,
      'usage_metrics',
      metric.organizationId,
      'daily_aggregates',
      aggregateId
    );

    const aggregateDoc = await getDoc(aggregateRef);
    
    if (aggregateDoc.exists()) {
      // 更新現有聚合資料
      const data = aggregateDoc.data();
      const updates: any = {
        updatedAt: serverTimestamp()
      };

      // 更新工具使用
      if (metric.category === 'tool' && metric.action) {
        updates[`toolUsage.${metric.action}`] = (data.toolUsage?.[metric.action] || 0) + 1;
      }

      // 更新功能使用
      if (metric.category === 'feature' && metric.action) {
        updates[`featureUsage.${metric.action}`] = (data.featureUsage?.[metric.action] || 0) + 1;
      }

      // 更新 AI 使用
      if (metric.category === 'ai' && metric.metadata?.minutes) {
        updates.aiMinutesUsed = (data.aiMinutesUsed || 0) + metric.metadata.minutes;
      }

      await setDoc(aggregateRef, updates, { merge: true });
    } else {
      // 建立新的聚合資料
      const newAggregate = {
        date: Timestamp.fromDate(today),
        organizationId: metric.organizationId,
        sessionsCount: 0,
        aiMinutesUsed: metric.category === 'ai' ? (metric.metadata?.minutes || 0) : 0,
        toolUsage: metric.category === 'tool' ? { [metric.action]: 1 } : {},
        featureUsage: metric.category === 'feature' ? { [metric.action]: 1 } : {},
        userActivity: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(aggregateRef, newAggregate);
    }
  } catch (error) {
    console.error('更新每日聚合資料失敗:', error);
  }
}

/**
 * 根據期間獲取日期範圍
 */
function getDateRangeForPeriod(
  period: Period,
  startDate?: Date,
  endDate?: Date
): { start: Date; end: Date } {
  if (startDate && endDate) {
    return { start: startDate, end: endDate };
  }

  const now = new Date();
  const end = new Date();
  let start = new Date();

  switch (period) {
    case 'daily':
      start.setDate(now.getDate() - 1);
      break;
    case 'weekly':
      start.setDate(now.getDate() - 7);
      break;
    case 'monthly':
      start.setMonth(now.getMonth() - 1);
      break;
    default:
      start.setDate(now.getDate() - 7);
  }

  return { start, end };
}

/**
 * 獲取即時使用統計
 */
export const getRealtimeStats = async (orgId: string): Promise<{
  onlineUsers: number;
  todaySessions: number;
  todayAIMinutes: number;
}> => {
  try {
    const db = getFirebaseDb();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const aggregateId = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    const aggregateRef = doc(
      db,
      'usage_metrics',
      orgId,
      'daily_aggregates',
      aggregateId
    );

    const aggregateDoc = await getDoc(aggregateRef);

    if (aggregateDoc.exists()) {
      const data = aggregateDoc.data();
      return {
        onlineUsers: data.userActivity?.length || 0,
        todaySessions: data.sessionsCount || 0,
        todayAIMinutes: data.aiMinutesUsed || 0
      };
    }

    return {
      onlineUsers: 0,
      todaySessions: 0,
      todayAIMinutes: 0
    };
  } catch (error) {
    console.error('獲取即時統計失敗:', error);
    return {
      onlineUsers: 0,
      todaySessions: 0,
      todayAIMinutes: 0
    };
  }
};