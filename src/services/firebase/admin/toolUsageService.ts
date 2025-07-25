/**
 * 工具使用統計服務
 * 追蹤和統計各工具的使用情況
 */

import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  increment,
  writeBatch,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/services/firebase/config';
import { getAuth } from 'firebase/auth';
import { ToolUsageStats, ToolUsageItem } from '@/types/entities';

// 工具類型定義
export const TOOL_TYPES = {
  AI_ASSISTANT: 'ai-assistant',
  VOICE_RECORDER: 'voice-recorder',
  DATA_IMPORT: 'data-import',
  DATA_EXPORT: 'data-export',
  ANALYTICS: 'analytics',
  TASK_MANAGER: 'task-manager',
  CUSTOMER_MANAGER: 'customer-manager',
  REPORT_GENERATOR: 'report-generator',
} as const;

export type ToolType = typeof TOOL_TYPES[keyof typeof TOOL_TYPES];

// 工具名稱映射
const TOOL_NAMES: Record<ToolType, string> = {
  [TOOL_TYPES.AI_ASSISTANT]: 'AI 助手',
  [TOOL_TYPES.VOICE_RECORDER]: '語音記錄',
  [TOOL_TYPES.DATA_IMPORT]: '資料匯入',
  [TOOL_TYPES.DATA_EXPORT]: '資料匯出',
  [TOOL_TYPES.ANALYTICS]: '數據分析',
  [TOOL_TYPES.TASK_MANAGER]: '任務管理',
  [TOOL_TYPES.CUSTOMER_MANAGER]: '客戶管理',
  [TOOL_TYPES.REPORT_GENERATOR]: '報表生成',
};

/**
 * 記錄工具使用
 */
export async function trackToolUsage(
  toolId: ToolType,
  metadata?: Record<string, any>
): Promise<void> {
  const db = getFirebaseDb();
  const auth = getAuth();
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    throw new Error('用戶未登入');
  }
  
  try {
    // 獲取用戶組織資訊
    const userDoc = await getDocs(
      query(
        collection(db, 'users'),
        where('id', '==', currentUser.uid),
        limit(1)
      )
    );
    
    if (userDoc.empty) {
      throw new Error('找不到用戶資料');
    }
    
    const userData = userDoc.docs[0].data();
    const organizationId = userData.organizationId;
    
    if (!organizationId) {
      throw new Error('用戶未關聯組織');
    }
    
    // 建立使用記錄
    const usageData = {
      toolId,
      toolName: TOOL_NAMES[toolId],
      userId: currentUser.uid,
      userName: userData.name || currentUser.email,
      organizationId,
      timestamp: serverTimestamp(),
      metadata: metadata || {},
    };
    
    // 儲存使用記錄
    const usageRef = doc(collection(db, 'tool_usage'));
    await setDoc(usageRef, usageData);
    
    // 更新每日統計
    await updateDailyStats(organizationId, toolId, currentUser.uid);
  } catch (error) {
    console.error('記錄工具使用失敗:', error);
    throw error;
  }
}

/**
 * 更新每日統計
 */
async function updateDailyStats(
  organizationId: string,
  toolId: string,
  userId: string
): Promise<void> {
  const db = getFirebaseDb();
  const today = new Date();
  const dateKey = today.toISOString().split('T')[0]; // YYYY-MM-DD
  
  try {
    const statsRef = doc(
      db,
      'tool_usage_daily_stats',
      `${organizationId}_${toolId}_${dateKey}`
    );
    
    // 使用批次更新
    const batch = writeBatch(db);
    
    // 更新統計
    batch.set(
      statsRef,
      {
        organizationId,
        toolId,
        toolName: TOOL_NAMES[toolId as ToolType],
        date: dateKey,
        usageCount: increment(1),
        uniqueUsers: {
          [userId]: true,
        },
        lastUpdated: serverTimestamp(),
      },
      { merge: true }
    );
    
    await batch.commit();
  } catch (error) {
    console.error('更新每日統計失敗:', error);
    // 不要拋出錯誤，避免影響主要功能
  }
}

/**
 * 獲取工具使用統計
 */
export async function getToolUsageStats(
  organizationId: string,
  period: string, // YYYY-MM
  toolId?: string
): Promise<ToolUsageStats[]> {
  const db = getFirebaseDb();
  const [year, month] = period.split('-').map(Number);
  
  // 計算月份的開始和結束日期
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  try {
    // 查詢條件
    const constraints = [
      where('organizationId', '==', organizationId),
      where('timestamp', '>=', Timestamp.fromDate(startDate)),
      where('timestamp', '<=', Timestamp.fromDate(endDate)),
    ];
    
    if (toolId) {
      constraints.push(where('toolId', '==', toolId));
    }
    
    const usageQuery = query(
      collection(db, 'tool_usage'),
      ...constraints,
      orderBy('timestamp', 'desc')
    );
    
    const snapshot = await getDocs(usageQuery);
    
    // 統計每個工具的使用情況
    const toolStatsMap = new Map<string, ToolUsageStats>();
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const { toolId, userId } = data;
      
      if (!toolStatsMap.has(toolId)) {
        toolStatsMap.set(toolId, {
          organizationId,
          toolId,
          toolName: TOOL_NAMES[toolId as ToolType] || toolId,
          period,
          uniqueUsers: new Set<string>(),
          totalUsage: 0,
          createdAt: serverTimestamp() as Timestamp,
        });
      }
      
      const stats = toolStatsMap.get(toolId)!;
      stats.uniqueUsers.add(userId);
      stats.totalUsage += 1;
    });
    
    // 轉換為陣列並處理 Set
    const results: ToolUsageStats[] = Array.from(toolStatsMap.values()).map(stats => ({
      ...stats,
      uniqueUsers: Array.from(stats.uniqueUsers as Set<string>),
    }));
    
    return results;
  } catch (error) {
    console.error('獲取工具使用統計失敗:', error);
    throw error;
  }
}

/**
 * 獲取工具的活躍用戶
 */
export async function getActiveToolUsers(
  organizationId: string,
  toolId: string,
  period: string // YYYY-MM
): Promise<string[]> {
  const stats = await getToolUsageStats(organizationId, period, toolId);
  
  if (stats.length === 0) {
    return [];
  }
  
  return stats[0].uniqueUsers as string[];
}

/**
 * 獲取組織的熱門工具
 */
export async function getPopularTools(
  organizationId: string,
  period: string, // YYYY-MM
  topN: number = 5
): Promise<ToolUsageItem[]> {
  const allStats = await getToolUsageStats(organizationId, period);
  
  // 排序並取前 N 個
  const sorted = allStats
    .map(stats => ({
      toolId: stats.toolId,
      toolName: stats.toolName,
      activeUsers: (stats.uniqueUsers as string[]).length,
      usageCount: stats.totalUsage,
    }))
    .sort((a, b) => b.activeUsers - a.activeUsers)
    .slice(0, topN);
  
  return sorted;
}

/**
 * 獲取用戶的工具使用記錄
 */
export async function getUserToolUsage(
  userId: string,
  period?: string // YYYY-MM
): Promise<Array<{
  toolId: string;
  toolName: string;
  usageCount: number;
  lastUsed: Date;
}>> {
  const db = getFirebaseDb();
  
  try {
    const constraints = [
      where('userId', '==', userId),
    ];
    
    if (period) {
      const [year, month] = period.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      constraints.push(
        where('timestamp', '>=', Timestamp.fromDate(startDate)),
        where('timestamp', '<=', Timestamp.fromDate(endDate))
      );
    }
    
    const usageQuery = query(
      collection(db, 'tool_usage'),
      ...constraints,
      orderBy('timestamp', 'desc')
    );
    
    const snapshot = await getDocs(usageQuery);
    
    // 統計使用情況
    const toolUsageMap = new Map<string, {
      toolName: string;
      usageCount: number;
      lastUsed: Date;
    }>();
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const { toolId, toolName, timestamp } = data;
      
      if (!toolUsageMap.has(toolId)) {
        toolUsageMap.set(toolId, {
          toolName: toolName || TOOL_NAMES[toolId as ToolType] || toolId,
          usageCount: 0,
          lastUsed: timestamp.toDate(),
        });
      }
      
      const usage = toolUsageMap.get(toolId)!;
      usage.usageCount += 1;
      
      // 更新最後使用時間
      const usedDate = timestamp.toDate();
      if (usedDate > usage.lastUsed) {
        usage.lastUsed = usedDate;
      }
    });
    
    // 轉換為陣列
    return Array.from(toolUsageMap.entries()).map(([toolId, usage]) => ({
      toolId,
      ...usage,
    }));
  } catch (error) {
    console.error('獲取用戶工具使用記錄失敗:', error);
    throw error;
  }
}

/**
 * 清理過期的使用記錄（保留最近 6 個月）
 */
export async function cleanupOldUsageRecords(): Promise<number> {
  const db = getFirebaseDb();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  try {
    const oldRecordsQuery = query(
      collection(db, 'tool_usage'),
      where('timestamp', '<', Timestamp.fromDate(sixMonthsAgo)),
      limit(500) // 批次處理
    );
    
    const snapshot = await getDocs(oldRecordsQuery);
    
    if (snapshot.empty) {
      return 0;
    }
    
    const batch = writeBatch(db);
    let count = 0;
    
    snapshot.forEach(doc => {
      batch.delete(doc.ref);
      count++;
    });
    
    await batch.commit();
    
    return count;
  } catch (error) {
    console.error('清理過期記錄失敗:', error);
    throw error;
  }
}