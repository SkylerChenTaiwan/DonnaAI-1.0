/**
 * 儀表板統計資料觸發器
 * 監聽 Firestore 資料變更，自動更新統計快照
 */

import { onDocumentWritten, onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { initializeApp } from 'firebase-admin/app';

// 初始化 Firebase Admin
if (!getFirestore().app) {
  initializeApp();
}

const db = getFirestore();

/**
 * 客戶建立觸發器
 */
export const onCustomerCreated = onDocumentCreated('customers/{customerId}', async (event) => {
  try {
    const customerData = event.data?.data();
    if (!customerData) {
      logger.warn('No customer data in event');
      return;
    }

    const organizationId = customerData.organizationId;
    if (!organizationId) {
      logger.warn('No organizationId in customer data');
      return;
    }

    logger.info(`Customer created in org ${organizationId}`);

    // 觸發統計更新
    await updateOrganizationStats(organizationId, 'customer_created', {
      customerId: event.params.customerId,
      customerData
    });

    // 更新即時客戶計數
    await incrementCustomerCount(organizationId);

  } catch (error) {
    logger.error('Error in onCustomerCreated:', error);
  }
});

/**
 * 任務狀態變更觸發器
 */
export const onTaskStatusChanged = onDocumentWritten('tasks/{taskId}', async (event) => {
  try {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();

    if (!after) {
      logger.info('Task deleted, skipping stats update');
      return;
    }

    const organizationId = after.organizationId;
    if (!organizationId) {
      logger.warn('No organizationId in task data');
      return;
    }

    const wasCompleted = before?.status === 'completed';
    const isCompleted = after.status === 'completed';

    // 如果任務剛完成
    if (!wasCompleted && isCompleted) {
      logger.info(`Task completed in org ${organizationId}`);
      
      await updateOrganizationStats(organizationId, 'task_completed', {
        taskId: event.params.taskId,
        taskData: after,
        completedAt: Timestamp.now()
      });

      // 更新任務完成統計
      await updateTaskCompletionStats(organizationId, event.params.taskId, after);
    }

  } catch (error) {
    logger.error('Error in onTaskStatusChanged:', error);
  }
});

/**
 * 銷售記錄建立觸發器
 */
export const onSalesRecordCreated = onDocumentCreated('records/{recordId}', async (event) => {
  try {
    const recordData = event.data?.data();
    if (!recordData || recordData.type !== 'sales') {
      return; // 只處理銷售記錄
    }

    const organizationId = recordData.organizationId;
    const amount = recordData.metadata?.amount || 0;

    if (!organizationId || amount <= 0) {
      logger.warn('Invalid sales record data');
      return;
    }

    logger.info(`Sales record created: ${amount} in org ${organizationId}`);

    // 觸發統計更新
    await updateOrganizationStats(organizationId, 'revenue_added', {
      recordId: event.params.recordId,
      amount,
      source: recordData.metadata?.source || 'direct',
      recordData
    });

    // 更新營收統計
    await updateRevenueStats(organizationId, amount, recordData.metadata?.source);

  } catch (error) {
    logger.error('Error in onSalesRecordCreated:', error);
  }
});

/**
 * 會議記錄完成觸發器
 */
export const onMeetingCompleted = onDocumentUpdated('records/{recordId}', async (event) => {
  try {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();

    if (!after || !['meeting', 'call'].includes(after.type)) {
      return; // 只處理會議記錄
    }

    const wasCompleted = before?.status === 'completed';
    const isCompleted = after.status === 'completed';

    // 如果會議剛完成
    if (!wasCompleted && isCompleted) {
      const organizationId = after.organizationId;
      if (!organizationId) {
        return;
      }

      logger.info(`Meeting completed in org ${organizationId}`);

      await updateOrganizationStats(organizationId, 'meeting_completed', {
        recordId: event.params.recordId,
        type: after.type,
        duration: after.metadata?.duration || 0,
        recordData: after
      });

      // 更新會議統計
      await updateMeetingStats(organizationId, after);
    }

  } catch (error) {
    logger.error('Error in onMeetingCompleted:', error);
  }
});

/**
 * 更新組織統計資料
 */
async function updateOrganizationStats(
  organizationId: string,
  updateType: 'customer_created' | 'task_completed' | 'revenue_added' | 'meeting_completed',
  data: any
): Promise<void> {
  const now = new Date();
  const dateKey = now.toISOString().split('T')[0];
  const hourKey = `${dateKey}-${now.getHours().toString().padStart(2, '0')}`;

  try {
    // 批次更新統計快照
    const batch = db.batch();

    // 更新每小時統計
    const hourlyRef = db
      .collection('organization-stats')
      .doc(organizationId)
      .collection('hourly')
      .doc(hourKey);

    batch.set(hourlyRef, {
      [`${updateType}_count`]: getFirestore.FieldValue.increment(1),
      [`${updateType}_last_data`]: data,
      updatedAt: Timestamp.now()
    }, { merge: true });

    // 更新每日統計
    const dailyRef = db
      .collection('organization-stats')
      .doc(organizationId)
      .collection('daily')
      .doc(dateKey);

    batch.set(dailyRef, {
      [`${updateType}_count`]: getFirestore.FieldValue.increment(1),
      updatedAt: Timestamp.now()
    }, { merge: true });

    // 更新即時快取狀態
    const cacheRef = db.collection('realtime-cache').doc(`dashboard-${organizationId}`);
    batch.set(cacheRef, {
      lastUpdated: Timestamp.now(),
      [`${updateType}_trigger`]: true,
      invalidatedMetrics: getFirestore.FieldValue.arrayUnion(getMetricTypeFromUpdate(updateType))
    }, { merge: true });

    await batch.commit();
    logger.info(`Stats updated for org ${organizationId}, type: ${updateType}`);

  } catch (error) {
    logger.error('Error updating organization stats:', error);
    throw error;
  }
}

/**
 * 增加客戶計數
 */
async function incrementCustomerCount(organizationId: string): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    await db.runTransaction(async (transaction) => {
      // 更新今日客戶統計
      const dailyStatsRef = db
        .collection('organization-stats')
        .doc(organizationId)
        .collection('daily')
        .doc(today);

      transaction.set(dailyStatsRef, {
        newCustomers: getFirestore.FieldValue.increment(1),
        updatedAt: Timestamp.now()
      }, { merge: true });

      // 更新總客戶數快取
      const totalStatsRef = db
        .collection('organization-stats')
        .doc(organizationId);

      transaction.set(totalStatsRef, {
        totalCustomers: getFirestore.FieldValue.increment(1),
        lastCustomerCreated: Timestamp.now(),
        updatedAt: Timestamp.now()
      }, { merge: true });
    });

    logger.info(`Customer count incremented for org ${organizationId}`);
  } catch (error) {
    logger.error('Error incrementing customer count:', error);
  }
}

/**
 * 更新任務完成統計
 */
async function updateTaskCompletionStats(
  organizationId: string,
  taskId: string,
  taskData: any
): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const assigneeId = taskData.assigneeId;

    await db.runTransaction(async (transaction) => {
      // 更新組織今日任務完成統計
      const dailyRef = db
        .collection('organization-stats')
        .doc(organizationId)
        .collection('daily')
        .doc(today);

      transaction.set(dailyRef, {
        tasksCompleted: getFirestore.FieldValue.increment(1),
        updatedAt: Timestamp.now()
      }, { merge: true });

      // 如果有指派人員，更新個人統計
      if (assigneeId) {
        const userStatsRef = db
          .collection('user-performance')
          .doc(assigneeId)
          .collection('daily')
          .doc(today);

        transaction.set(userStatsRef, {
          tasksCompleted: getFirestore.FieldValue.increment(1),
          organizationId,
          updatedAt: Timestamp.now()
        }, { merge: true });
      }
    });

    logger.info(`Task completion stats updated for org ${organizationId}`);
  } catch (error) {
    logger.error('Error updating task completion stats:', error);
  }
}

/**
 * 更新營收統計
 */
async function updateRevenueStats(
  organizationId: string,
  amount: number,
  source?: string
): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];

    await db.runTransaction(async (transaction) => {
      // 更新今日營收
      const dailyRef = db
        .collection('organization-stats')
        .doc(organizationId)
        .collection('daily')
        .doc(today);

      const updateData: any = {
        revenue: getFirestore.FieldValue.increment(amount),
        updatedAt: Timestamp.now()
      };

      // 如果有來源，分別統計
      if (source) {
        updateData[`revenue_by_${source}`] = getFirestore.FieldValue.increment(amount);
      }

      transaction.set(dailyRef, updateData, { merge: true });

      // 更新本月營收快照
      const monthKey = today.substring(0, 7); // YYYY-MM
      const monthlyRef = db
        .collection('organization-stats')
        .doc(organizationId)
        .collection('monthly')
        .doc(monthKey);

      transaction.set(monthlyRef, {
        revenue: getFirestore.FieldValue.increment(amount),
        updatedAt: Timestamp.now()
      }, { merge: true });
    });

    logger.info(`Revenue stats updated: +${amount} for org ${organizationId}`);
  } catch (error) {
    logger.error('Error updating revenue stats:', error);
  }
}

/**
 * 更新會議統計
 */
async function updateMeetingStats(
  organizationId: string,
  meetingData: any
): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const duration = meetingData.metadata?.duration || 0;
    const hasAiAnalysis = meetingData.metadata?.aiAnalysisCompleted || false;

    await db.runTransaction(async (transaction) => {
      const dailyRef = db
        .collection('organization-stats')
        .doc(organizationId)
        .collection('daily')
        .doc(today);

      const updateData: any = {
        meetingsCompleted: getFirestore.FieldValue.increment(1),
        totalMeetingDuration: getFirestore.FieldValue.increment(duration),
        updatedAt: Timestamp.now()
      };

      if (hasAiAnalysis) {
        updateData.meetingsWithAiAnalysis = getFirestore.FieldValue.increment(1);
      }

      transaction.set(dailyRef, updateData, { merge: true });
    });

    logger.info(`Meeting stats updated for org ${organizationId}`);
  } catch (error) {
    logger.error('Error updating meeting stats:', error);
  }
}

/**
 * 根據更新類型獲取對應的指標類型
 */
function getMetricTypeFromUpdate(updateType: string): string {
  switch (updateType) {
    case 'customer_created':
      return 'customers';
    case 'task_completed':
      return 'tasks';
    case 'revenue_added':
      return 'revenue';
    case 'meeting_completed':
      return 'meetings';
    default:
      return 'general';
  }
}

/**
 * 定期重算統計資料（每小時執行）
 */
export const recalculateStats = onSchedule('0 * * * *', async () => {
  try {
    logger.info('Starting scheduled stats recalculation');

    // 獲取所有組織
    const orgsQuery = await db.collection('organizations').get();
    
    const recalculationPromises = orgsQuery.docs.map(async (orgDoc) => {
      const organizationId = orgDoc.id;
      
      try {
        // 重新計算並更新統計快照
        await recalculateOrganizationStats(organizationId);
        logger.info(`Stats recalculated for org ${organizationId}`);
      } catch (error) {
        logger.error(`Error recalculating stats for org ${organizationId}:`, error);
      }
    });

    await Promise.allSettled(recalculationPromises);
    logger.info('Scheduled stats recalculation completed');

  } catch (error) {
    logger.error('Error in scheduled stats recalculation:', error);
  }
});

/**
 * 重新計算組織統計資料
 */
async function recalculateOrganizationStats(organizationId: string): Promise<void> {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const thisMonth = today.substring(0, 7);

  try {
    // 獲取今日資料並重新計算
    const [customers, revenue, tasks, meetings] = await Promise.all([
      calculateTodayCustomers(organizationId),
      calculateTodayRevenue(organizationId),
      calculateTodayTasks(organizationId),
      calculateTodayMeetings(organizationId)
    ]);

    // 更新今日統計快照
    await db
      .collection('organization-stats')
      .doc(organizationId)
      .collection('daily')
      .doc(today)
      .set({
        ...customers,
        ...revenue,
        ...tasks,
        ...meetings,
        recalculatedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }, { merge: true });

    // 更新本月統計（累計）
    const monthlyStats = await calculateMonthlyStats(organizationId, thisMonth);
    await db
      .collection('organization-stats')
      .doc(organizationId)
      .collection('monthly')
      .doc(thisMonth)
      .set({
        ...monthlyStats,
        recalculatedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }, { merge: true });

  } catch (error) {
    logger.error(`Error in recalculateOrganizationStats for ${organizationId}:`, error);
    throw error;
  }
}

// 統計計算輔助函數
async function calculateTodayCustomers(organizationId: string) {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  const query = await db
    .collection('customers')
    .where('organizationId', '==', organizationId)
    .where('createdAt', '>=', Timestamp.fromDate(startOfDay))
    .where('createdAt', '<', Timestamp.fromDate(endOfDay))
    .count()
    .get();

  return { newCustomers: query.data().count };
}

async function calculateTodayRevenue(organizationId: string) {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  const query = await db
    .collection('records')
    .where('organizationId', '==', organizationId)
    .where('type', '==', 'sales')
    .where('createdAt', '>=', Timestamp.fromDate(startOfDay))
    .where('createdAt', '<', Timestamp.fromDate(endOfDay))
    .get();

  let totalRevenue = 0;
  const revenueBySource: { [key: string]: number } = {};

  query.docs.forEach(doc => {
    const data = doc.data();
    const amount = data.metadata?.amount || 0;
    const source = data.metadata?.source || 'direct';
    
    totalRevenue += amount;
    revenueBySource[source] = (revenueBySource[source] || 0) + amount;
  });

  return { 
    revenue: totalRevenue,
    ...Object.fromEntries(
      Object.entries(revenueBySource).map(([source, amount]) => [`revenue_by_${source}`, amount])
    )
  };
}

async function calculateTodayTasks(organizationId: string) {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  const query = await db
    .collection('tasks')
    .where('organizationId', '==', organizationId)
    .where('status', '==', 'completed')
    .where('completedAt', '>=', Timestamp.fromDate(startOfDay))
    .where('completedAt', '<', Timestamp.fromDate(endOfDay))
    .count()
    .get();

  return { tasksCompleted: query.data().count };
}

async function calculateTodayMeetings(organizationId: string) {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  const query = await db
    .collection('records')
    .where('organizationId', '==', organizationId)
    .where('type', 'in', ['meeting', 'call'])
    .where('status', '==', 'completed')
    .where('createdAt', '>=', Timestamp.fromDate(startOfDay))
    .where('createdAt', '<', Timestamp.fromDate(endOfDay))
    .get();

  let totalDuration = 0;
  let meetingsWithAi = 0;

  query.docs.forEach(doc => {
    const data = doc.data();
    totalDuration += data.metadata?.duration || 0;
    if (data.metadata?.aiAnalysisCompleted) {
      meetingsWithAi++;
    }
  });

  return {
    meetingsCompleted: query.size,
    totalMeetingDuration: totalDuration,
    meetingsWithAiAnalysis: meetingsWithAi
  };
}

async function calculateMonthlyStats(organizationId: string, monthKey: string) {
  const [year, month] = monthKey.split('-');
  const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
  const endOfMonth = new Date(parseInt(year), parseInt(month), 0);

  // 這裡應該實作月度統計計算
  // 暫時返回基本結構
  return {
    revenue: 0,
    customerGrowth: 0,
    performance: 0,
    period: monthKey
  };
}