/**
 * 分配歷史管理服務
 * 記錄和查詢資料分配歷史
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { getFirebaseDb } from './config';
import { AssignmentHistory, AssignmentReport } from '@/types/assignment';
import { DatabaseType } from '@/types/import';
import { canAccessAssignmentHistory } from './permissions';

/**
 * 建立分配歷史記錄
 */
export const createAssignmentHistory = async (
  history: Omit<AssignmentHistory, 'id' | 'assignedAt'>
): Promise<string> => {
  try {
    const db = getFirebaseDb();
    const historyRef = doc(collection(db, 'assignment_history'));
    
    const historyData = {
      ...history,
      id: historyRef.id,
      assignedAt: serverTimestamp()
    };
    
    await setDoc(historyRef, historyData);
    
    console.log('✅ 建立分配歷史記錄:', historyRef.id);
    return historyRef.id;
  } catch (error) {
    console.error('❌ 建立分配歷史記錄失敗:', error);
    throw new Error('無法建立分配歷史記錄');
  }
};

/**
 * 批量建立分配歷史記錄
 */
export const createBatchAssignmentHistory = async (
  histories: Array<Omit<AssignmentHistory, 'id' | 'assignedAt'>>
): Promise<string[]> => {
  try {
    const db = getFirebaseDb();
    const historyIds: string[] = [];
    const batch = [];
    
    for (const history of histories) {
      const historyRef = doc(collection(db, 'assignment_history'));
      const historyData = {
        ...history,
        id: historyRef.id,
        assignedAt: serverTimestamp()
      };
      
      batch.push(setDoc(historyRef, historyData));
      historyIds.push(historyRef.id);
    }
    
    await Promise.all(batch);
    
    console.log(`✅ 批量建立 ${historyIds.length} 筆分配歷史記錄`);
    return historyIds;
  } catch (error) {
    console.error('❌ 批量建立分配歷史記錄失敗:', error);
    throw new Error('無法批量建立分配歷史記錄');
  }
};

/**
 * 取得分配歷史記錄
 */
export const getAssignmentHistory = async (
  historyId: string,
  userId: string
): Promise<AssignmentHistory | null> => {
  try {
    // 檢查權限
    const hasAccess = await canAccessAssignmentHistory(userId, historyId);
    if (!hasAccess) {
      throw new Error('沒有權限查看此分配歷史');
    }
    
    const db = getFirebaseDb();
    const historyDoc = await getDoc(doc(db, 'assignment_history', historyId));
    
    if (!historyDoc.exists()) {
      return null;
    }
    
    return {
      ...historyDoc.data(),
      id: historyDoc.id
    } as AssignmentHistory;
  } catch (error) {
    console.error('❌ 取得分配歷史記錄失敗:', error);
    throw error;
  }
};

/**
 * 取得用戶的分配歷史
 */
export const getUserAssignmentHistory = async (
  userId: string,
  role: 'assignee' | 'assigner' | 'both' = 'both',
  limitCount: number = 50
): Promise<AssignmentHistory[]> => {
  try {
    const db = getFirebaseDb();
    let q;
    
    if (role === 'assignee') {
      // 作為被分配者的歷史
      q = query(
        collection(db, 'assignment_history'),
        where('assigneeId', '==', userId),
        orderBy('assignedAt', 'desc'),
        limit(limitCount)
      );
    } else if (role === 'assigner') {
      // 作為分配者的歷史
      q = query(
        collection(db, 'assignment_history'),
        where('assignerId', '==', userId),
        orderBy('assignedAt', 'desc'),
        limit(limitCount)
      );
    } else {
      // 兩者都查詢（需要分開查詢再合併）
      const assigneeQuery = query(
        collection(db, 'assignment_history'),
        where('assigneeId', '==', userId),
        orderBy('assignedAt', 'desc'),
        limit(limitCount / 2)
      );
      
      const assignerQuery = query(
        collection(db, 'assignment_history'),
        where('assignerId', '==', userId),
        orderBy('assignedAt', 'desc'),
        limit(limitCount / 2)
      );
      
      const [assigneeSnapshot, assignerSnapshot] = await Promise.all([
        getDocs(assigneeQuery),
        getDocs(assignerQuery)
      ]);
      
      const histories: AssignmentHistory[] = [];
      
      assigneeSnapshot.forEach(doc => {
        histories.push({
          ...doc.data(),
          id: doc.id
        } as AssignmentHistory);
      });
      
      assignerSnapshot.forEach(doc => {
        if (!histories.find(h => h.id === doc.id)) {
          histories.push({
            ...doc.data(),
            id: doc.id
          } as AssignmentHistory);
        }
      });
      
      // 排序並限制數量
      return histories
        .sort((a, b) => b.assignedAt.toMillis() - a.assignedAt.toMillis())
        .slice(0, limitCount);
    }
    
    const snapshot = await getDocs(q);
    const histories: AssignmentHistory[] = [];
    
    snapshot.forEach(doc => {
      histories.push({
        ...doc.data(),
        id: doc.id
      } as AssignmentHistory);
    });
    
    return histories;
  } catch (error) {
    console.error('❌ 取得用戶分配歷史失敗:', error);
    throw new Error('無法取得用戶分配歷史');
  }
};

/**
 * 取得組織的分配歷史
 */
export const getOrganizationAssignmentHistory = async (
  organizationId: string,
  options: {
    dataType?: DatabaseType;
    startDate?: Date;
    endDate?: Date;
    limitCount?: number;
  } = {}
): Promise<AssignmentHistory[]> => {
  try {
    const db = getFirebaseDb();
    const constraints = [
      where('organizationId', '==', organizationId)
    ];
    
    if (options.dataType) {
      constraints.push(where('dataType', '==', options.dataType));
    }
    
    if (options.startDate) {
      constraints.push(where('assignedAt', '>=', Timestamp.fromDate(options.startDate)));
    }
    
    if (options.endDate) {
      constraints.push(where('assignedAt', '<=', Timestamp.fromDate(options.endDate)));
    }
    
    constraints.push(orderBy('assignedAt', 'desc'));
    
    if (options.limitCount) {
      constraints.push(limit(options.limitCount));
    }
    
    const q = query(collection(db, 'assignment_history'), ...constraints);
    const snapshot = await getDocs(q);
    
    const histories: AssignmentHistory[] = [];
    snapshot.forEach(doc => {
      histories.push({
        ...doc.data(),
        id: doc.id
      } as AssignmentHistory);
    });
    
    return histories;
  } catch (error) {
    console.error('❌ 取得組織分配歷史失敗:', error);
    throw new Error('無法取得組織分配歷史');
  }
};

/**
 * 取得匯入會話的分配歷史
 */
export const getImportSessionAssignmentHistory = async (
  importSessionId: string
): Promise<AssignmentHistory[]> => {
  try {
    const db = getFirebaseDb();
    const q = query(
      collection(db, 'assignment_history'),
      where('importSessionId', '==', importSessionId),
      orderBy('assignedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const histories: AssignmentHistory[] = [];
    
    snapshot.forEach(doc => {
      histories.push({
        ...doc.data(),
        id: doc.id
      } as AssignmentHistory);
    });
    
    return histories;
  } catch (error) {
    console.error('❌ 取得匯入會話分配歷史失敗:', error);
    throw new Error('無法取得匯入會話分配歷史');
  }
};

/**
 * 生成分配報告
 */
export const generateAssignmentReport = async (
  importSessionId: string,
  organizationId: string,
  createdBy: string
): Promise<AssignmentReport> => {
  try {
    const histories = await getImportSessionAssignmentHistory(importSessionId);
    
    if (histories.length === 0) {
      throw new Error('找不到相關的分配歷史');
    }
    
    // 統計資料
    const userCounts = new Map<string, { count: number; name?: string }>();
    let totalImported = 0;
    let totalAssigned = 0;
    let totalConfidence = 0;
    let confidenceCount = 0;
    const errors: any[] = [];
    
    histories.forEach(history => {
      totalImported += history.dataCount;
      
      if (history.assigneeId) {
        totalAssigned += history.dataCount;
        
        const current = userCounts.get(history.assigneeId) || { count: 0, name: history.assigneeName };
        current.count += history.dataCount;
        userCounts.set(history.assigneeId, current);
      }
      
      if (history.successRate) {
        totalConfidence += history.successRate;
        confidenceCount++;
      }
      
      if (history.errors && history.errors.length > 0) {
        errors.push(...history.errors);
      }
    });
    
    // 計算前幾名分配者
    const topAssignees = Array.from(userCounts.entries())
      .map(([userId, data]) => ({
        userId,
        userName: data.name || userId,
        count: data.count,
        percentage: (data.count / totalAssigned) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // 計算執行時間
    const startTime = histories[histories.length - 1].assignedAt.toMillis();
    const endTime = histories[0].assignedAt.toMillis();
    const duration = endTime - startTime;
    
    const report: AssignmentReport = {
      id: `report-${Date.now()}`,
      createdAt: Timestamp.now(),
      createdBy,
      organizationId,
      importSessionId,
      summary: {
        totalImported,
        totalAssigned,
        assignmentRate: totalImported > 0 ? (totalAssigned / totalImported) * 100 : 0,
        averageConfidence: confidenceCount > 0 ? totalConfidence / confidenceCount : 0,
        topAssignees,
        strategyUsed: histories[0].strategy,
        duration
      },
      details: histories,
      errors
    };
    
    // 儲存報告
    const db = getFirebaseDb();
    const reportRef = doc(collection(db, 'assignment_reports'));
    await setDoc(reportRef, {
      ...report,
      id: reportRef.id
    });
    
    return report;
  } catch (error) {
    console.error('❌ 生成分配報告失敗:', error);
    throw new Error('無法生成分配報告');
  }
};

/**
 * 取得分配統計
 */
export const getAssignmentStatistics = async (
  organizationId: string,
  dateRange?: { start: Date; end: Date }
): Promise<{
  totalAssignments: number;
  totalDataAssigned: number;
  uniqueAssignees: number;
  averagePerAssignee: number;
  topAssignees: Array<{ userId: string; count: number }>;
  byDataType: Record<DatabaseType, number>;
  byStrategy: Record<string, number>;
}> => {
  try {
    const histories = await getOrganizationAssignmentHistory(organizationId, {
      startDate: dateRange?.start,
      endDate: dateRange?.end
    });
    
    const userCounts = new Map<string, number>();
    const dataTypeCounts: Record<string, number> = {};
    const strategyCounts: Record<string, number> = {};
    let totalData = 0;
    
    histories.forEach(history => {
      // 統計用戶
      const current = userCounts.get(history.assigneeId) || 0;
      userCounts.set(history.assigneeId, current + history.dataCount);
      
      // 統計資料類型
      dataTypeCounts[history.dataType] = (dataTypeCounts[history.dataType] || 0) + history.dataCount;
      
      // 統計策略
      strategyCounts[history.strategy] = (strategyCounts[history.strategy] || 0) + 1;
      
      totalData += history.dataCount;
    });
    
    // 計算前幾名
    const topAssignees = Array.from(userCounts.entries())
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return {
      totalAssignments: histories.length,
      totalDataAssigned: totalData,
      uniqueAssignees: userCounts.size,
      averagePerAssignee: userCounts.size > 0 ? totalData / userCounts.size : 0,
      topAssignees,
      byDataType: dataTypeCounts as Record<DatabaseType, number>,
      byStrategy: strategyCounts
    };
  } catch (error) {
    console.error('❌ 取得分配統計失敗:', error);
    throw new Error('無法取得分配統計');
  }
};