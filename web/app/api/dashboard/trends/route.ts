/**
 * 儀表板趨勢圖表 API
 * GET /api/dashboard/trends
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { firebaseAdmin } from '@/lib/firebase-admin';
import { dashboardCacheManager } from '@/lib/cache/dashboard-cache-manager';
import type { TrendsRequest, TrendsResponse } from '@/docs/types/dashboard-data-models';

export async function GET(request: NextRequest) {
  try {
    // 驗證使用者身份
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '未授權存取' } },
        { status: 401 }
      );
    }

    // 解析查詢參數
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId') || session.user.organizationId;
    const period = searchParams.get('period') as 'week' | 'month' | 'quarter' | 'year' || 'month';
    const granularity = searchParams.get('granularity') as 'hour' | 'day' | 'week' | 'month' || 'day';
    const metrics = searchParams.get('metrics')?.split(',') || ['revenue', 'customers', 'tasks'];
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_ORGANIZATION', message: '缺少組織 ID' } },
        { status: 400 }
      );
    }

    // 檢查權限
    const hasAccess = await checkOrganizationAccess(session.user.uid, organizationId);
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: '無存取權限' } },
        { status: 403 }
      );
    }

    const startTime = Date.now();
    let cacheHit = false;
    let cacheAge = 0;
    
    // 獲取趨勢資料（含快取邏輯）
    let trendData;
    
    // 嘗試從快取獲取資料
    trendData = await dashboardCacheManager.getTrendData(organizationId, period, granularity);
    
    if (trendData) {
      cacheHit = true;
      console.log(`Cache hit for trend data: ${organizationId}:${period}:${granularity}`);
    } else {
      // 快取未命中，從資料庫獲取
      trendData = await getTrendData({
        organizationId,
        metrics: metrics as ('revenue' | 'customers' | 'tasks' | 'activity')[],
        period,
        granularity,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined
      });
      
      // 將結果存入快取
      await dashboardCacheManager.cacheTrendData(organizationId, period, granularity, trendData);
      console.log(`Cached trend data: ${organizationId}:${period}:${granularity}`);
    }

    const processingTime = Date.now() - startTime;

    const response: TrendsResponse = {
      success: true,
      data: trendData,
      metadata: {
        requestId: crypto.randomUUID(),
        timestamp: new Date(),
        processingTime,
        version: '1.0.0',
        cache: {
          hit: cacheHit,
          age: cacheAge
        }
      },
      meta: {
        period,
        granularity,
        dataPoints: trendData.length,
        interpolated: false
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Dashboard trends API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '內部伺服器錯誤',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }
      },
      { status: 500 }
    );
  }
}

/**
 * 檢查使用者是否有存取組織的權限
 */
async function checkOrganizationAccess(userId: string, organizationId: string): Promise<boolean> {
  try {
    const db = firebaseAdmin.firestore();
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return false;
    }

    const userData = userDoc.data();
    return userData?.organizationId === organizationId;
  } catch (error) {
    console.error('Error checking organization access:', error);
    return false;
  }
}

/**
 * 獲取趨勢圖表資料
 */
async function getTrendData(params: {
  organizationId: string;
  metrics: ('revenue' | 'customers' | 'tasks' | 'activity')[];
  period: 'week' | 'month' | 'quarter' | 'year';
  granularity: 'hour' | 'day' | 'week' | 'month';
  startDate?: Date;
  endDate?: Date;
}) {
  const db = firebaseAdmin.firestore();
  const { organizationId, metrics, period, granularity, startDate, endDate } = params;

  // 計算時間範圍
  const endDateTime = endDate || new Date();
  const startDateTime = startDate || calculateStartDate(endDateTime, period);

  // 產生時間區間
  const timeIntervals = generateTimeIntervals(startDateTime, endDateTime, granularity);

  // 並行獲取所有指標的趨勢資料
  const trendDataPromises = metrics.map(metric => 
    getTrendDataForMetric(db, organizationId, metric, timeIntervals)
  );

  const results = await Promise.all(trendDataPromises);

  // 合併資料點
  return timeIntervals.map((timestamp, index) => {
    const dataPoint: any = {
      date: timestamp.toISOString(),
      timestamp
    };

    // 為每個指標添加數值
    results.forEach((metricData, metricIndex) => {
      const metricName = metrics[metricIndex];
      dataPoint[metricName] = metricData[index] || 0;
    });

    return dataPoint;
  });
}

/**
 * 計算開始日期
 */
function calculateStartDate(endDate: Date, period: 'week' | 'month' | 'quarter' | 'year'): Date {
  const startDate = new Date(endDate);
  
  switch (period) {
    case 'week':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(endDate.getMonth() - 1);
      break;
    case 'quarter':
      startDate.setMonth(endDate.getMonth() - 3);
      break;
    case 'year':
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
  }
  
  return startDate;
}

/**
 * 產生時間區間陣列
 */
function generateTimeIntervals(
  startDate: Date,
  endDate: Date,
  granularity: 'hour' | 'day' | 'week' | 'month'
): Date[] {
  const intervals: Date[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    intervals.push(new Date(current));
    
    switch (granularity) {
      case 'hour':
        current.setHours(current.getHours() + 1);
        break;
      case 'day':
        current.setDate(current.getDate() + 1);
        break;
      case 'week':
        current.setDate(current.getDate() + 7);
        break;
      case 'month':
        current.setMonth(current.getMonth() + 1);
        break;
    }
  }

  return intervals;
}

/**
 * 獲取單一指標的趨勢資料
 */
async function getTrendDataForMetric(
  db: FirebaseFirestore.Firestore,
  organizationId: string,
  metric: 'revenue' | 'customers' | 'tasks' | 'activity',
  timeIntervals: Date[]
): Promise<number[]> {
  switch (metric) {
    case 'revenue':
      return await getRevenueTrend(db, organizationId, timeIntervals);
    case 'customers':
      return await getCustomersTrend(db, organizationId, timeIntervals);
    case 'tasks':
      return await getTasksTrend(db, organizationId, timeIntervals);
    case 'activity':
      return await getActivityTrend(db, organizationId, timeIntervals);
    default:
      return new Array(timeIntervals.length).fill(0);
  }
}

/**
 * 獲取營收趨勢
 */
async function getRevenueTrend(
  db: FirebaseFirestore.Firestore,
  organizationId: string,
  timeIntervals: Date[]
): Promise<number[]> {
  try {
    const salesQuery = await db
      .collection('records')
      .where('organizationId', '==', organizationId)
      .where('type', '==', 'sales')
      .where('createdAt', '>=', timeIntervals[0])
      .where('createdAt', '<=', timeIntervals[timeIntervals.length - 1])
      .orderBy('createdAt', 'asc')
      .get();

    const revenueData = new Array(timeIntervals.length).fill(0);

    salesQuery.docs.forEach(doc => {
      const data = doc.data();
      const createdAt = data.createdAt.toDate();
      const amount = data.metadata?.amount || 0;

      // 找到對應的時間區間
      const intervalIndex = findTimeIntervalIndex(createdAt, timeIntervals);
      if (intervalIndex >= 0) {
        revenueData[intervalIndex] += amount;
      }
    });

    return revenueData;
  } catch (error) {
    console.error('Error getting revenue trend:', error);
    return new Array(timeIntervals.length).fill(0);
  }
}

/**
 * 獲取客戶增長趨勢
 */
async function getCustomersTrend(
  db: FirebaseFirestore.Firestore,
  organizationId: string,
  timeIntervals: Date[]
): Promise<number[]> {
  try {
    const customersQuery = await db
      .collection('customers')
      .where('organizationId', '==', organizationId)
      .where('createdAt', '>=', timeIntervals[0])
      .where('createdAt', '<=', timeIntervals[timeIntervals.length - 1])
      .orderBy('createdAt', 'asc')
      .get();

    const customerData = new Array(timeIntervals.length).fill(0);

    customersQuery.docs.forEach(doc => {
      const data = doc.data();
      const createdAt = data.createdAt.toDate();

      // 找到對應的時間區間
      const intervalIndex = findTimeIntervalIndex(createdAt, timeIntervals);
      if (intervalIndex >= 0) {
        customerData[intervalIndex] += 1;
      }
    });

    return customerData;
  } catch (error) {
    console.error('Error getting customers trend:', error);
    return new Array(timeIntervals.length).fill(0);
  }
}

/**
 * 獲取任務完成趨勢
 */
async function getTasksTrend(
  db: FirebaseFirestore.Firestore,
  organizationId: string,
  timeIntervals: Date[]
): Promise<number[]> {
  try {
    const tasksQuery = await db
      .collection('tasks')
      .where('organizationId', '==', organizationId)
      .where('status', '==', 'completed')
      .where('completedAt', '>=', timeIntervals[0])
      .where('completedAt', '<=', timeIntervals[timeIntervals.length - 1])
      .orderBy('completedAt', 'asc')
      .get();

    const taskData = new Array(timeIntervals.length).fill(0);

    tasksQuery.docs.forEach(doc => {
      const data = doc.data();
      const completedAt = data.completedAt?.toDate();

      if (completedAt) {
        // 找到對應的時間區間
        const intervalIndex = findTimeIntervalIndex(completedAt, timeIntervals);
        if (intervalIndex >= 0) {
          taskData[intervalIndex] += 1;
        }
      }
    });

    return taskData;
  } catch (error) {
    console.error('Error getting tasks trend:', error);
    return new Array(timeIntervals.length).fill(0);
  }
}

/**
 * 獲取活動趨勢
 */
async function getActivityTrend(
  db: FirebaseFirestore.Firestore,
  organizationId: string,
  timeIntervals: Date[]
): Promise<number[]> {
  try {
    const recordsQuery = await db
      .collection('records')
      .where('organizationId', '==', organizationId)
      .where('createdAt', '>=', timeIntervals[0])
      .where('createdAt', '<=', timeIntervals[timeIntervals.length - 1])
      .orderBy('createdAt', 'asc')
      .get();

    const activityData = new Array(timeIntervals.length).fill(0);

    recordsQuery.docs.forEach(doc => {
      const data = doc.data();
      const createdAt = data.createdAt.toDate();

      // 找到對應的時間區間
      const intervalIndex = findTimeIntervalIndex(createdAt, timeIntervals);
      if (intervalIndex >= 0) {
        activityData[intervalIndex] += 1;
      }
    });

    return activityData;
  } catch (error) {
    console.error('Error getting activity trend:', error);
    return new Array(timeIntervals.length).fill(0);
  }
}

/**
 * 找到時間點對應的區間索引
 */
function findTimeIntervalIndex(timestamp: Date, intervals: Date[]): number {
  // 找到最接近且不大於 timestamp 的區間
  for (let i = intervals.length - 1; i >= 0; i--) {
    if (timestamp >= intervals[i]) {
      return i;
    }
  }
  return -1;
}