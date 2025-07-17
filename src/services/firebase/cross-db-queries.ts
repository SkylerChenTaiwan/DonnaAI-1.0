/**
 * 跨資料庫查詢服務
 * 提供跨多個集合的複雜查詢功能
 */

import { Timestamp } from 'firebase/firestore';
import { CustomerDoc } from '../../types/firebase';
import { RecordDoc } from '../../types/record';
import { TaskDoc, TaskStatus } from '../../types/task';
import { getCustomer, getCustomers } from './customers';
import { getRecordsByCustomer, getRecords } from './records';
import { getTasksByCustomer, getTasks } from './tasks';

/**
 * 獲取團隊的完整儀表板資料
 */
export async function getTeamDashboardData(
  teamId: string,
  userId: string,
  dateRange?: { start: Date; end: Date }
): Promise<{
  customers: CustomerDoc[];
  recentRecords: RecordDoc[];
  pendingTasks: TaskDoc[];
  statistics: {
    totalCustomers: number;
    totalRecords: number;
    pendingTasks: number;
    completedTasks: number;
    totalAudioMinutes: number;
  };
}> {
  try {
    // 並行查詢所有資料
    const [customers, records, tasks] = await Promise.all([
      getCustomers(userId, teamId),
      getRecords(userId, {
        teamId,
        dateFrom: dateRange?.start,
        dateTo: dateRange?.end
      }),
      getTasks(userId, {
        teamId,
        status: ['todo', 'in_progress']
      })
    ]);

    // 計算統計資料
    const completedTasks = await getTasks(userId, {
      teamId,
      status: 'completed',
      dateFrom: dateRange?.start,
      dateTo: dateRange?.end
    });

    const totalAudioMinutes = records.reduce((total, record) => {
      return total + (record.duration || 0);
    }, 0);

    return {
      customers,
      recentRecords: records.slice(0, 10), // 最近10筆紀錄
      pendingTasks: tasks,
      statistics: {
        totalCustomers: customers.length,
        totalRecords: records.length,
        pendingTasks: tasks.length,
        completedTasks: completedTasks.length,
        totalAudioMinutes
      }
    };
  } catch (error) {
    console.error('獲取團隊儀表板資料失敗:', error);
    throw error;
  }
}

/**
 * 獲取客戶的完整活動歷史
 */
export async function getCustomerActivityHistory(
  customerId: string,
  userId: string,
  limit: number = 50
): Promise<{
  customer: CustomerDoc | null;
  activities: Array<{
    type: 'record' | 'task' | 'update';
    timestamp: Date;
    title: string;
    description?: string;
    data: RecordDoc | TaskDoc | any;
  }>;
}> {
  try {
    // 獲取客戶資料
    const customer = await getCustomer(customerId, userId);
    if (!customer) {
      return { customer: null, activities: [] };
    }

    // 並行獲取相關資料
    const [records, tasks] = await Promise.all([
      getRecordsByCustomer(customerId, userId, limit),
      getTasksByCustomer(customerId, userId, true) // 包含已完成的任務
    ]);

    // 組合並排序活動
    const activities: Array<any> = [];

    // 加入紀錄
    records.forEach(record => {
      activities.push({
        type: 'record',
        timestamp: record.scheduledAt?.toDate() || record.createdAt.toDate(),
        title: record.title,
        description: record.aiSummary,
        data: record
      });
    });

    // 加入任務
    tasks.forEach(task => {
      activities.push({
        type: 'task',
        timestamp: task.scheduledAt?.toDate() || task.createdAt.toDate(),
        title: task.title,
        description: task.description,
        data: task
      });
    });

    // 按時間排序（最新的在前）
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return {
      customer,
      activities: activities.slice(0, limit)
    };
  } catch (error) {
    console.error('獲取客戶活動歷史失敗:', error);
    throw error;
  }
}

/**
 * 搜尋跨多個集合的內容
 */
export async function globalSearch(
  searchTerm: string,
  userId: string,
  teamId?: string
): Promise<{
  customers: CustomerDoc[];
  records: RecordDoc[];
  tasks: TaskDoc[];
}> {
  try {
    const searchLower = searchTerm.toLowerCase();

    // 並行搜尋所有集合
    const [customers, records, tasks] = await Promise.all([
      getCustomers(userId, teamId, { searchTerm }),
      getRecords(userId, { teamId }),
      getTasks(userId, { teamId })
    ]);

    // 過濾紀錄（搜尋標題、內容、摘要）
    const filteredRecords = records.filter(record => 
      record.title.toLowerCase().includes(searchLower) ||
      record.content?.toLowerCase().includes(searchLower) ||
      record.aiSummary?.toLowerCase().includes(searchLower) ||
      record.transcription?.toLowerCase().includes(searchLower)
    );

    // 過濾任務（搜尋標題、描述）
    const filteredTasks = tasks.filter(task =>
      task.title.toLowerCase().includes(searchLower) ||
      task.description?.toLowerCase().includes(searchLower)
    );

    return {
      customers, // 已經在 getCustomers 中過濾過了
      records: filteredRecords,
      tasks: filteredTasks
    };
  } catch (error) {
    console.error('全域搜尋失敗:', error);
    throw error;
  }
}

/**
 * 獲取使用者的工作負載統計
 */
export async function getUserWorkloadStats(
  userId: string,
  dateRange?: { start: Date; end: Date }
): Promise<{
  assignedTasks: {
    total: number;
    byStatus: Record<TaskStatus, number>;
    overdue: number;
    dueThisWeek: number;
  };
  recordsCreated: number;
  customersManaged: number;
  upcomingMeetings: RecordDoc[];
}> {
  try {
    // 獲取指派給使用者的任務
    const tasks = await getTasks(userId, {
      assigneeId: userId
    });

    // 統計任務狀態
    const tasksByStatus: Record<TaskStatus, number> = {
      todo: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0
    };

    let overdueTasks = 0;
    let dueThisWeek = 0;
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    tasks.forEach(task => {
      tasksByStatus[task.status]++;
      
      if (task.dueDate && task.status !== 'completed' && task.status !== 'cancelled') {
        const dueDate = task.dueDate.toDate();
        if (dueDate < now) {
          overdueTasks++;
        } else if (dueDate <= weekFromNow) {
          dueThisWeek++;
        }
      }
    });

    // 獲取使用者建立的紀錄
    const records = await getRecords(userId, {
      dateFrom: dateRange?.start,
      dateTo: dateRange?.end
    });
    
    const userRecords = records.filter(r => r.createdBy === userId);

    // 獲取使用者管理的客戶
    const customers = await getCustomers(userId, undefined, {
      assignedTo: userId
    });

    // 獲取即將到來的會議
    const upcomingMeetings = records
      .filter(r => 
        r.type === 'meeting' && 
        r.scheduledAt && 
        r.scheduledAt.toDate() > now &&
        r.participantIds?.includes(userId)
      )
      .sort((a, b) => 
        (a.scheduledAt?.toDate().getTime() || 0) - 
        (b.scheduledAt?.toDate().getTime() || 0)
      )
      .slice(0, 5);

    return {
      assignedTasks: {
        total: tasks.length,
        byStatus: tasksByStatus,
        overdue: overdueTasks,
        dueThisWeek: dueThisWeek
      },
      recordsCreated: userRecords.length,
      customersManaged: customers.length,
      upcomingMeetings
    };
  } catch (error) {
    console.error('獲取使用者工作負載統計失敗:', error);
    throw error;
  }
}

/**
 * 獲取組織的 AI 使用統計
 */
export async function getOrganizationAIUsageStats(
  organizationId: string,
  dateRange?: { start: Date; end: Date }
): Promise<{
  totalProcessedRecords: number;
  totalAudioMinutes: number;
  averageConfidenceScore: number;
  topExtractedFields: Array<{ fieldKey: string; count: number }>;
  processingTrend: Array<{ date: string; count: number }>;
}> {
  try {
    // 獲取組織的所有紀錄
    const records = await getRecords('system', { // 使用系統權限
      dateFrom: dateRange?.start,
      dateTo: dateRange?.end
    });

    // 過濾出該組織且有 AI 處理的紀錄
    const aiProcessedRecords = records.filter(r => 
      r.organizationId === organizationId && 
      (r.aiSummary || r.transcription || r.aiFieldMappings)
    );

    // 計算總音訊分鐘數
    const totalAudioMinutes = aiProcessedRecords.reduce((total, record) => 
      total + (record.duration || 0), 0
    );

    // 計算平均信心分數
    let totalConfidence = 0;
    let confidenceCount = 0;
    const fieldCounts = new Map<string, number>();

    aiProcessedRecords.forEach(record => {
      if (record.aiProcessingMetadata?.totalConfidence) {
        totalConfidence += record.aiProcessingMetadata.totalConfidence;
        confidenceCount++;
      }

      // 統計欄位提取
      record.aiFieldMappings?.forEach(mapping => {
        const count = fieldCounts.get(mapping.fieldKey) || 0;
        fieldCounts.set(mapping.fieldKey, count + 1);
      });
    });

    const averageConfidenceScore = confidenceCount > 0 
      ? totalConfidence / confidenceCount 
      : 0;

    // 獲取前10個最常提取的欄位
    const topExtractedFields = Array.from(fieldCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([fieldKey, count]) => ({ fieldKey, count }));

    // 計算處理趨勢（按日分組）
    const trendMap = new Map<string, number>();
    aiProcessedRecords.forEach(record => {
      if (record.aiProcessingMetadata?.processedAt) {
        const date = record.aiProcessingMetadata.processedAt.toDate();
        const dateKey = date.toISOString().split('T')[0];
        const count = trendMap.get(dateKey) || 0;
        trendMap.set(dateKey, count + 1);
      }
    });

    const processingTrend = Array.from(trendMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));

    return {
      totalProcessedRecords: aiProcessedRecords.length,
      totalAudioMinutes,
      averageConfidenceScore,
      topExtractedFields,
      processingTrend
    };
  } catch (error) {
    console.error('獲取組織 AI 使用統計失敗:', error);
    throw error;
  }
}