/**
 * 團隊狀態 API
 * GET /api/dashboard/team-status
 * POST /api/dashboard/team-status (更新個人狀態)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { firebaseAdmin } from '@/lib/firebase-admin';
import { dashboardCacheManager } from '@/lib/cache/dashboard-cache-manager';
import type { TeamStatusRequest, TeamStatusResponse } from '@/docs/types/dashboard-data-models';

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
    const includeMetrics = searchParams.get('includeMetrics') === 'true';
    const includeCurrentTasks = searchParams.get('includeCurrentTasks') === 'true';

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
    
    // 獲取團隊狀態（含快取邏輯）
    let teamStatus;
    
    // 如果不需要額外資訊，嘗試從快取獲取
    if (!includeMetrics && !includeCurrentTasks) {
      teamStatus = await dashboardCacheManager.getTeamStatus(organizationId);
      
      if (teamStatus) {
        cacheHit = true;
        console.log(`Cache hit for team status: ${organizationId}`);
      }
    }
    
    if (!teamStatus) {
      // 快取未命中或需要額外資訊，從資料庫獲取
      teamStatus = await getTeamStatus({
        organizationId,
        includeMetrics,
        includeCurrentTasks
      });
      
      // 如果是基本查詢，將結果存入快取
      if (!includeMetrics && !includeCurrentTasks) {
        await dashboardCacheManager.cacheTeamStatus(organizationId, teamStatus);
        console.log(`Cached team status: ${organizationId}`);
      }
    }

    const processingTime = Date.now() - startTime;

    const response: TeamStatusResponse = {
      success: true,
      data: teamStatus,
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
        totalMembers: teamStatus.length,
        onlineMembers: teamStatus.filter(member => member.isOnline).length,
        lastSync: new Date().toISOString()
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Team status API error:', error);
    
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

export async function POST(request: NextRequest) {
  try {
    // 驗證使用者身份
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '未授權存取' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { status, currentTaskId } = body;

    if (!status || !['online', 'offline', 'busy', 'away'].includes(status)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATUS', message: '無效的狀態' } },
        { status: 400 }
      );
    }

    // 更新使用者狀態
    await updateUserStatus(session.user.uid, {
      status,
      currentTaskId,
      organizationId: session.user.organizationId
    });

    return NextResponse.json({
      success: true,
      data: { message: '狀態更新成功' }
    });

  } catch (error) {
    console.error('Update user status error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '更新狀態失敗',
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
 * 獲取團隊狀態
 */
async function getTeamStatus(params: {
  organizationId: string;
  includeMetrics: boolean;
  includeCurrentTasks: boolean;
}): Promise<any[]> {
  const db = firebaseAdmin.firestore();
  const { organizationId, includeMetrics, includeCurrentTasks } = params;

  try {
    // 獲取組織所有使用者
    const usersQuery = await db
      .collection('users')
      .where('organizationId', '==', organizationId)
      .get();

    if (usersQuery.empty) {
      return [];
    }

    // 並行獲取所有使用者的狀態資訊
    const teamStatusPromises = usersQuery.docs.map(async (userDoc) => {
      const userData = userDoc.data();
      const userId = userDoc.id;

      // 獲取使用者狀態
      const userStatus = await getUserStatusInfo(db, userId, organizationId);
      
      // 獲取今日指標（如果需要）
      let todayMetrics = null;
      if (includeMetrics) {
        todayMetrics = await getUserTodayMetrics(db, userId, organizationId);
      }

      // 獲取當前任務（如果需要）
      let currentTask = null;
      if (includeCurrentTasks && userStatus.currentTaskId) {
        currentTask = await getCurrentTaskInfo(db, userStatus.currentTaskId);
      }

      return {
        userId,
        userName: userData.displayName || userData.name || '未命名使用者',
        userAvatar: userData.photoURL,
        role: userData.role || 'member',
        isOnline: userStatus.isOnline,
        lastActiveAt: userStatus.lastActiveAt,
        currentActivity: userStatus.currentActivity,
        todayCompletedTasks: todayMetrics?.completedTasks || 0,
        pendingTasks: todayMetrics?.pendingTasks || 0,
        statusMessage: userStatus.statusMessage,
        currentTask
      };
    });

    const teamStatus = await Promise.all(teamStatusPromises);
    
    // 按線上狀態和活動時間排序
    teamStatus.sort((a, b) => {
      if (a.isOnline !== b.isOnline) {
        return a.isOnline ? -1 : 1;
      }
      return new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime();
    });

    return teamStatus;

  } catch (error) {
    console.error('Error getting team status:', error);
    return [];
  }
}

/**
 * 獲取使用者狀態資訊
 */
async function getUserStatusInfo(
  db: FirebaseFirestore.Firestore,
  userId: string,
  organizationId: string
) {
  try {
    // 從 team-status 集合獲取即時狀態
    const statusDoc = await db.collection('team-status').doc(userId).get();
    
    if (statusDoc.exists) {
      const statusData = statusDoc.data();
      const lastActivity = statusData?.lastActivity?.toDate() || new Date(0);
      const now = new Date();
      
      // 如果超過 5 分鐘沒有活動，視為離線
      const isOnline = statusData?.status === 'online' && 
                      (now.getTime() - lastActivity.getTime()) < 5 * 60 * 1000;

      return {
        isOnline,
        lastActiveAt: lastActivity,
        currentActivity: statusData?.currentActivity || '',
        statusMessage: statusData?.statusMessage || '',
        currentTaskId: statusData?.currentTask?.id
      };
    } else {
      // 如果沒有狀態記錄，視為離線
      return {
        isOnline: false,
        lastActiveAt: new Date(0),
        currentActivity: '',
        statusMessage: '',
        currentTaskId: null
      };
    }
  } catch (error) {
    console.error('Error getting user status info:', error);
    return {
      isOnline: false,
      lastActiveAt: new Date(0),
      currentActivity: '',
      statusMessage: '',
      currentTaskId: null
    };
  }
}

/**
 * 獲取使用者今日指標
 */
async function getUserTodayMetrics(
  db: FirebaseFirestore.Firestore,
  userId: string,
  organizationId: string
) {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    // 獲取今日完成的任務
    const completedTasksQuery = await db
      .collection('tasks')
      .where('assigneeId', '==', userId)
      .where('organizationId', '==', organizationId)
      .where('status', '==', 'completed')
      .where('completedAt', '>=', startOfDay)
      .where('completedAt', '<', endOfDay)
      .get();

    // 獲取待處理任務
    const pendingTasksQuery = await db
      .collection('tasks')
      .where('assigneeId', '==', userId)
      .where('organizationId', '==', organizationId)
      .where('status', 'in', ['pending', 'in_progress'])
      .get();

    return {
      completedTasks: completedTasksQuery.size,
      pendingTasks: pendingTasksQuery.size
    };
  } catch (error) {
    console.error('Error getting user today metrics:', error);
    return {
      completedTasks: 0,
      pendingTasks: 0
    };
  }
}

/**
 * 獲取當前任務資訊
 */
async function getCurrentTaskInfo(
  db: FirebaseFirestore.Firestore,
  taskId: string
) {
  try {
    const taskDoc = await db.collection('tasks').doc(taskId).get();
    
    if (!taskDoc.exists) {
      return null;
    }

    const taskData = taskDoc.data();
    
    return {
      id: taskId,
      title: taskData?.title || '未命名任務',
      priority: taskData?.priority || 'medium',
      dueDate: taskData?.dueDate?.toDate()
    };
  } catch (error) {
    console.error('Error getting current task info:', error);
    return null;
  }
}

/**
 * 更新使用者狀態
 */
async function updateUserStatus(
  userId: string,
  params: {
    status: 'online' | 'offline' | 'busy' | 'away';
    currentTaskId?: string;
    organizationId?: string;
  }
) {
  const db = firebaseAdmin.firestore();
  const { status, currentTaskId, organizationId } = params;

  try {
    const statusData: any = {
      status,
      lastActivity: new Date(),
      organizationId,
      updatedAt: new Date()
    };

    if (currentTaskId) {
      // 獲取任務資訊
      const taskDoc = await db.collection('tasks').doc(currentTaskId).get();
      if (taskDoc.exists) {
        const taskData = taskDoc.data();
        statusData.currentTask = {
          id: currentTaskId,
          title: taskData?.title || '未命名任務',
          priority: taskData?.priority || 'medium',
          startedAt: new Date()
        };
      }
    } else {
      statusData.currentTask = null;
    }

    // 更新到 team-status 集合
    await db.collection('team-status').doc(userId).set(statusData, { merge: true });

    console.log(`User ${userId} status updated to ${status}`);
  } catch (error) {
    console.error('Error updating user status:', error);
    throw error;
  }
}