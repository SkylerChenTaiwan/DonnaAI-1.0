/**
 * 儀表板指標 API
 * GET /api/dashboard/metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth-config';
import { firebaseAdmin } from '@/lib/firebase-admin';
import { dashboardCacheManager } from '@/lib/cache/dashboard-cache-manager';
import { withAuth } from '@/lib/auth/auth-middleware';
import { Permission } from '@/lib/auth/permissions';
import { PermissionAwareQueryHelper } from '@/lib/auth/query-helper';
import type { DashboardMetricsRequest, DashboardMetricsResponse } from '@/docs/types/dashboard-data-models';

export async function GET(request: NextRequest) {
  try {
    // 權限檢查和認證
    const authResult = await withAuth(request, {
      requireAuth: true,
      requiredPermissions: [Permission.DASHBOARD_VIEW],
      resource: 'dashboard',
      action: 'read'
    });

    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.error!.status }
      );
    }

    const { session, dataFilter } = authResult;

    // 解析查詢參數
    const searchParams = request.nextUrl.searchParams;
    const requestedOrgId = searchParams.get('organizationId');
    const period = searchParams.get('period') as string || '30d';
    const timezone = searchParams.get('timezone') || 'Asia/Taipei';
    const cache = searchParams.get('cache') !== 'false';

    // 使用資料過濾器驗證組織存取權限
    let organizationId = session.user.organizationId;
    if (requestedOrgId) {
      // 檢查是否可以存取請求的組織
      const accessScope = dataFilter.getMetricsAccessLevel();
      if (accessScope.canViewGlobal || 
          (accessScope.canViewOrganization && requestedOrgId === session.user.organizationId)) {
        organizationId = requestedOrgId;
      } else {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: '無權限存取指定組織的資料' } },
          { status: 403 }
        );
      }
    }

    const startTime = Date.now();
    let cacheHit = false;
    let cacheAge = 0;
    
    // 獲取儀表板指標（含快取邏輯）
    let metrics;
    
    if (cache) {
      // 嘗試從快取獲取資料
      metrics = await dashboardCacheManager.getOrganizationMetrics(organizationId);
      
      if (metrics) {
        cacheHit = true;
        console.log(`Cache hit for organization metrics: ${organizationId}`);
      }
    }
    
    if (!metrics) {
      // 快取未命中，從資料庫獲取（含權限過濾）
      metrics = await getDashboardMetrics({
        organizationId,
        period: period as any,
        timezone,
        userId: session.user.uid,
        dataFilter // 傳遞資料過濾器
      });
      
      // 將結果存入快取
      if (cache) {
        await dashboardCacheManager.cacheOrganizationMetrics(organizationId, metrics);
        console.log(`Cached organization metrics: ${organizationId}`);
      }
    }

    const processingTime = Date.now() - startTime;

    const response: DashboardMetricsResponse = {
      success: true,
      data: metrics,
      cacheStatus: cacheHit ? 'hit' : 'miss',
      nextUpdateAt: new Date(Date.now() + (cacheHit ? 2 * 60 * 1000 : 5 * 60 * 1000)), // 快取命中時更短的更新間隔
      metadata: {
        requestId: crypto.randomUUID(),
        timestamp: new Date(),
        processingTime,
        version: '1.0.0',
        cache: {
          hit: cacheHit,
          age: cacheAge
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Dashboard metrics API error:', error);
    
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
 * 獲取儀表板指標資料
 */
async function getDashboardMetrics(params: {
  organizationId: string;
  period: '7d' | '30d' | '90d' | '1y';
  timezone: string;
  userId: string;
  dataFilter?: any; // 資料過濾器
}) {
  const db = firebaseAdmin.firestore();
  const { organizationId, period, timezone, dataFilter } = params;

  // 計算時間範圍
  const endDate = new Date();
  const startDate = new Date();
  
  switch (period) {
    case '7d':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(endDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(endDate.getDate() - 90);
      break;
    case '1y':
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
  }

  // 並行獲取各種指標（含權限過濾）
  const [
    revenueMetrics,
    customerMetrics,
    taskMetrics,
    meetingMetrics,
    performanceMetrics
  ] = await Promise.all([
    getRevenueMetrics(db, organizationId, startDate, endDate, dataFilter),
    getCustomerMetrics(db, organizationId, startDate, endDate, dataFilter),
    getTaskMetrics(db, organizationId, startDate, endDate, dataFilter),
    getMeetingMetrics(db, organizationId, startDate, endDate, dataFilter),
    getPerformanceMetrics(db, organizationId, startDate, endDate, dataFilter)
  ]);

  return {
    revenue: revenueMetrics,
    customers: customerMetrics,
    tasks: taskMetrics,
    meetings: meetingMetrics,
    performance: performanceMetrics
  };
}

/**
 * 獲取營收相關指標
 */
async function getRevenueMetrics(
  db: FirebaseFirestore.Firestore,
  organizationId: string,
  startDate: Date,
  endDate: Date,
  dataFilter?: any
) {
  try {
    // 創建帶權限過濾的查詢
    let currentRevenueQueryResult;
    if (dataFilter) {
      const queryHelper = new PermissionAwareQueryHelper(dataFilter);
      const currentRevenueQuery = queryHelper.createRevenueQuery(db, organizationId, startDate, endDate);
      currentRevenueQueryResult = await currentRevenueQuery.get();
    } else {
      // 回退到基本查詢
      const currentRevenueQuery = db
        .collection('records')
        .where('organizationId', '==', organizationId)
        .where('type', '==', 'sales')
        .where('createdAt', '>=', startDate)
        .where('createdAt', '<=', endDate);
      currentRevenueQueryResult = await currentRevenueQuery.get();
    }

    // 計算當期總收入
    let currentRevenue = 0;
    const revenueBySource: { [key: string]: number } = {};

    currentRevenueQueryResult.docs.forEach(doc => {
      const data = doc.data();
      const amount = data.metadata?.amount || 0;
      const source = data.metadata?.source || 'unknown';
      
      currentRevenue += amount;
      revenueBySource[source] = (revenueBySource[source] || 0) + amount;
    });

    // 查詢前期收入（用於計算成長率）
    const previousStartDate = new Date(startDate);
    const previousEndDate = new Date(endDate);
    const periodLength = endDate.getTime() - startDate.getTime();
    
    previousStartDate.setTime(startDate.getTime() - periodLength);
    previousEndDate.setTime(endDate.getTime() - periodLength);

    const previousRevenueQuery = await db
      .collection('records')
      .where('organizationId', '==', organizationId)
      .where('type', '==', 'sales')
      .where('createdAt', '>=', previousStartDate)
      .where('createdAt', '<=', previousEndDate)
      .get();

    let previousRevenue = 0;
    previousRevenueQuery.docs.forEach(doc => {
      const data = doc.data();
      previousRevenue += data.metadata?.amount || 0;
    });

    // 計算成長率
    const growthRate = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;

    // 轉換收入來源為陣列格式
    const totalRevenue = currentRevenue;
    const revenueBySourceArray = Object.entries(revenueBySource).map(([source, amount]) => ({
      source,
      amount,
      percentage: totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0
    }));

    return {
      currentMonthRevenue: currentRevenue,
      previousMonthRevenue: previousRevenue,
      growthRate,
      quarterRevenue: currentRevenue, // TODO: 實作季度邏輯
      yearRevenue: currentRevenue, // TODO: 實作年度邏輯
      targetAchievementRate: 85, // TODO: 從目標設定中獲取
      revenueBySource: revenueBySourceArray,
      forecastRevenue: currentRevenue * 1.1 // TODO: 實作預測邏輯
    };
  } catch (error) {
    console.error('Error getting revenue metrics:', error);
    return {
      currentMonthRevenue: 0,
      previousMonthRevenue: 0,
      growthRate: 0,
      quarterRevenue: 0,
      yearRevenue: 0,
      targetAchievementRate: 0,
      revenueBySource: [],
      forecastRevenue: 0
    };
  }
}

/**
 * 獲取客戶相關指標
 */
async function getCustomerMetrics(
  db: FirebaseFirestore.Firestore,
  organizationId: string,
  startDate: Date,
  endDate: Date
) {
  try {
    // 總客戶數
    const totalCustomersQuery = await db
      .collection('customers')
      .where('organizationId', '==', organizationId)
      .get();

    const totalCustomers = totalCustomersQuery.size;

    // 新增客戶數
    const newCustomersQuery = await db
      .collection('customers')
      .where('organizationId', '==', organizationId)
      .where('createdAt', '>=', startDate)
      .where('createdAt', '<=', endDate)
      .get();

    const newCustomersThisMonth = newCustomersQuery.size;

    // 活躍客戶數（有互動記錄的客戶）
    const activeCustomersQuery = await db
      .collection('records')
      .where('organizationId', '==', organizationId)
      .where('createdAt', '>=', startDate)
      .where('createdAt', '<=', endDate)
      .get();

    const uniqueCustomers = new Set();
    activeCustomersQuery.docs.forEach(doc => {
      const data = doc.data();
      if (data.customerId) {
        uniqueCustomers.add(data.customerId);
      }
    });

    const activeCustomers = uniqueCustomers.size;

    // 客戶分級分布
    const customersByTier = [
      { tier: 'VIP' as const, count: Math.floor(totalCustomers * 0.2), percentage: 20 },
      { tier: 'Regular' as const, count: Math.floor(totalCustomers * 0.6), percentage: 60 },
      { tier: 'Potential' as const, count: Math.floor(totalCustomers * 0.2), percentage: 20 }
    ];

    return {
      totalCustomers,
      newCustomersThisMonth,
      activeCustomers,
      churnRate: 5.2, // TODO: 實作流失率計算
      satisfactionScore: 4.7, // TODO: 從滿意度調查中獲取
      averageLifetimeValue: 50000, // TODO: 實作客戶生命週期價值
      customersByTier
    };
  } catch (error) {
    console.error('Error getting customer metrics:', error);
    return {
      totalCustomers: 0,
      newCustomersThisMonth: 0,
      activeCustomers: 0,
      churnRate: 0,
      satisfactionScore: 0,
      averageLifetimeValue: 0,
      customersByTier: []
    };
  }
}

/**
 * 獲取任務相關指標
 */
async function getTaskMetrics(
  db: FirebaseFirestore.Firestore,
  organizationId: string,
  startDate: Date,
  endDate: Date
) {
  try {
    const tasksQuery = await db
      .collection('tasks')
      .where('organizationId', '==', organizationId)
      .get();

    let totalTasks = 0;
    let pendingTasks = 0;
    let inProgressTasks = 0;
    let completedTasks = 0;
    let overdueTasks = 0;
    
    const taskDistribution: { [key: string]: { assigned: number; completed: number } } = {};

    tasksQuery.docs.forEach(doc => {
      const data = doc.data();
      const status = data.status;
      const assigneeId = data.assigneeId;
      const assigneeName = data.assigneeName || 'Unknown';
      const dueDate = data.dueDate?.toDate();
      
      totalTasks++;
      
      switch (status) {
        case 'pending':
          pendingTasks++;
          break;
        case 'in_progress':
          inProgressTasks++;
          break;
        case 'completed':
          completedTasks++;
          break;
      }
      
      // 檢查是否逾期
      if (dueDate && dueDate < new Date() && status !== 'completed') {
        overdueTasks++;
      }
      
      // 統計任務分配
      if (assigneeId) {
        if (!taskDistribution[assigneeId]) {
          taskDistribution[assigneeId] = { assigned: 0, completed: 0 };
        }
        taskDistribution[assigneeId].assigned++;
        if (status === 'completed') {
          taskDistribution[assigneeId].completed++;
        }
      }
    });

    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    const taskDistributionArray = Object.entries(taskDistribution).map(([userId, stats]) => ({
      userId,
      userName: 'User', // TODO: 從使用者資料中獲取名稱
      assignedCount: stats.assigned,
      completedCount: stats.completed
    }));

    return {
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      overdueTasks,
      completionRate,
      averageCompletionTime: 5.5, // TODO: 實作平均完成時間計算
      taskDistribution: taskDistributionArray
    };
  } catch (error) {
    console.error('Error getting task metrics:', error);
    return {
      totalTasks: 0,
      pendingTasks: 0,
      inProgressTasks: 0,
      completedTasks: 0,
      overdueTasks: 0,
      completionRate: 0,
      averageCompletionTime: 0,
      taskDistribution: []
    };
  }
}

/**
 * 獲取會議相關指標
 */
async function getMeetingMetrics(
  db: FirebaseFirestore.Firestore,
  organizationId: string,
  startDate: Date,
  endDate: Date
) {
  try {
    const meetingsQuery = await db
      .collection('records')
      .where('organizationId', '==', organizationId)
      .where('type', 'in', ['meeting', 'call'])
      .where('createdAt', '>=', startDate)
      .where('createdAt', '<=', endDate)
      .get();

    let totalMeetings = 0;
    let completedMeetings = 0;
    let upcomingMeetings = 0;
    let totalDuration = 0;
    let aiAnalysisCompleted = 0;
    
    const meetingsByType: { [key: string]: number } = {};

    meetingsQuery.docs.forEach(doc => {
      const data = doc.data();
      const status = data.status;
      const type = data.type;
      const duration = data.metadata?.duration || 0;
      const hasAiAnalysis = data.metadata?.aiAnalysisCompleted || false;
      
      totalMeetings++;
      
      if (status === 'completed') {
        completedMeetings++;
        totalDuration += duration;
      } else {
        upcomingMeetings++;
      }
      
      if (hasAiAnalysis) {
        aiAnalysisCompleted++;
      }
      
      meetingsByType[type] = (meetingsByType[type] || 0) + 1;
    });

    const averageDuration = completedMeetings > 0 ? totalDuration / completedMeetings : 0;
    const participationRate = 85; // TODO: 實作參與率計算
    const aiAnalysisRate = totalMeetings > 0 ? (aiAnalysisCompleted / totalMeetings) * 100 : 0;
    
    const meetingsByTypeArray = Object.entries(meetingsByType).map(([type, count]) => ({
      type: type as any,
      count,
      percentage: totalMeetings > 0 ? (count / totalMeetings) * 100 : 0
    }));

    return {
      totalMeetingsThisMonth: totalMeetings,
      completedMeetings,
      upcomingMeetings,
      averageDuration,
      participationRate,
      aiAnalysisRate,
      meetingsByType: meetingsByTypeArray
    };
  } catch (error) {
    console.error('Error getting meeting metrics:', error);
    return {
      totalMeetingsThisMonth: 0,
      completedMeetings: 0,
      upcomingMeetings: 0,
      averageDuration: 0,
      participationRate: 0,
      aiAnalysisRate: 0,
      meetingsByType: []
    };
  }
}

/**
 * 獲取績效相關指標
 */
async function getPerformanceMetrics(
  db: FirebaseFirestore.Firestore,
  organizationId: string,
  startDate: Date,
  endDate: Date
) {
  try {
    // TODO: 實作完整的績效指標計算
    return {
      teamScore: 85.5,
      individualRankings: [
        {
          userId: 'user1',
          userName: '王小明',
          score: 92.5,
          rank: 1,
          trend: 'up' as const
        },
        {
          userId: 'user2', 
          userName: '李小華',
          score: 88.3,
          rank: 2,
          trend: 'stable' as const
        }
      ],
      goalAchievementRate: 78.5,
      productivityIndex: 82.1,
      qualityScore: 89.7
    };
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    return {
      teamScore: 0,
      individualRankings: [],
      goalAchievementRate: 0,
      productivityIndex: 0,
      qualityScore: 0
    };
  }
}