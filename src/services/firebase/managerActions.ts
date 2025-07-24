/**
 * 主管操作服務
 * 提供公告發佈、任務批量指派、報表保存等功能
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { getFirebaseDb } from './config';
import { notificationService } from '../notifications';
import { getUserPermissionContext } from './permissions-v2';
import { showToast } from '../../utils/toast';

/**
 * 公告數據模型
 */
export interface Announcement {
  id?: string;
  title: string;
  content: string;
  createdBy: string;
  createdByName?: string;
  createdAt: Timestamp;
  targetUsers: string[];
  targetTeams?: string[];
  priority: 'high' | 'normal' | 'low';
  expiresAt?: Timestamp;
  isRead?: { [userId: string]: boolean };
  organizationId: string;
  teamId?: string;
}

/**
 * 保存的報表模型
 */
export interface SavedReport {
  id?: string;
  name: string;
  query: string;
  chartType: string;
  chartData: any;
  createdBy: string;
  createdByName?: string;
  createdAt: Timestamp;
  isPublic: boolean;
  teamId?: string;
  organizationId: string;
  tags?: string[];
}

/**
 * 創建公告
 */
export const createAnnouncement = async (
  announcement: Omit<Announcement, 'id' | 'createdAt'>,
  currentUserId: string,
  currentUserName?: string
): Promise<string> => {
  try {
    // 檢查權限
    const permissionContext = await getUserPermissionContext(currentUserId);
    const canManageTeam = permissionContext.role === 'manager' || 
                         permissionContext.role === 'admin' || 
                         permissionContext.managedTeamIds.length > 0;
    if (!canManageTeam) {
      throw new Error('您沒有權限發佈公告');
    }

    // 創建公告文檔
    const announcementData: Omit<Announcement, 'id'> = {
      ...announcement,
      createdBy: currentUserId,
      createdByName: currentUserName || '管理員',
      createdAt: serverTimestamp() as Timestamp,
      isRead: {},
    };

    const db = getFirebaseDb();
    const docRef = await addDoc(
      collection(db, 'announcements'),
      announcementData
    );

    // 發送通知給目標用戶
    const notificationPromises = announcement.targetUsers.map(async (userId) => {
      try {
        await notificationService.sendLocalNotification({
          type: 'meeting_reminder',
          title: `新公告：${announcement.title}`,
          body: announcement.content.substring(0, 100) + '...',
        });
      } catch (error) {
        console.error(`發送通知給用戶 ${userId} 失敗:`, error);
      }
    });

    await Promise.all(notificationPromises);

    showToast('success', '公告已發佈');
    return docRef.id;
  } catch (error) {
    console.error('創建公告失敗:', error);
    showToast('error', '發佈公告失敗');
    throw error;
  }
};

/**
 * 批量指派任務
 */
export const bulkAssignTasks = async (
  taskData: {
    title: string;
    description?: string;
    priority: 'high' | 'medium' | 'low';
    dueDate?: Date;
    type: string;
    customerId?: string;
  },
  assigneeIds: string[],
  assignerId: string,
  assignerName?: string,
  teamId?: string
): Promise<string[]> => {
  try {
    // 檢查權限
    const permissionContext = await getUserPermissionContext(assignerId);
    const canManageTeam = permissionContext.role === 'manager' || 
                         permissionContext.role === 'admin' || 
                         permissionContext.managedTeamIds.length > 0;
    if (!canManageTeam) {
      throw new Error('您沒有權限指派任務');
    }

    const db = getFirebaseDb();
    const batch = writeBatch(db);
    const taskIds: string[] = [];
    const now = serverTimestamp() as Timestamp;

    // 為每個受派人創建任務
    for (const assigneeId of assigneeIds) {
      const taskRef = doc(collection(db, 'tasks'));
      const task = {
        ...taskData,
        id: taskRef.id,
        assigneeId,
        assignerId,
        assignerName: assignerName || '管理員',
        teamId: teamId || permissionContext.teamIds[0],
        status: 'todo',
        createdAt: now,
        updatedAt: now,
        dueDate: taskData.dueDate ? Timestamp.fromDate(taskData.dueDate) : null,
      };

      batch.set(taskRef, task);
      taskIds.push(taskRef.id);
    }

    // 提交批量操作
    await batch.commit();

    // 發送通知給受派人
    const notificationPromises = assigneeIds.map(async (assigneeId) => {
      try {
        await notificationService.sendLocalNotification({
          type: 'meeting_reminder',
          title: '新任務指派',
          body: `${assignerName || '管理員'} 指派了新任務：${taskData.title}`,
        });
      } catch (error) {
        console.error(`發送通知給用戶 ${assigneeId} 失敗:`, error);
      }
    });

    await Promise.all(notificationPromises);

    showToast('success', `已成功指派 ${assigneeIds.length} 個任務`);
    return taskIds;
  } catch (error) {
    console.error('批量指派任務失敗:', error);
    showToast('error', '指派任務失敗');
    throw error;
  }
};

/**
 * 保存報表
 */
export const saveReport = async (
  report: Omit<SavedReport, 'id' | 'createdAt'>,
  currentUserId: string,
  currentUserName?: string
): Promise<string> => {
  try {
    // 創建報表文檔
    const reportData: Omit<SavedReport, 'id'> = {
      ...report,
      createdBy: currentUserId,
      createdByName: currentUserName || '未知用戶',
      createdAt: serverTimestamp() as Timestamp,
    };

    const db = getFirebaseDb();
    const docRef = await addDoc(collection(db, 'savedReports'), reportData);

    showToast('success', '報表已保存');
    return docRef.id;
  } catch (error) {
    console.error('保存報表失敗:', error);
    showToast('error', '保存報表失敗');
    throw error;
  }
};

/**
 * 獲取公告列表
 */
export const getAnnouncements = async (
  userId: string,
  options: {
    teamId?: string;
    limit?: number;
  } = {}
): Promise<Announcement[]> => {
  try {
    const db = getFirebaseDb();
    const constraints = [
      where('targetUsers', 'array-contains', userId),
      orderBy('createdAt', 'desc')
    ];

    if (options.teamId) {
      constraints.push(where('teamId', '==', options.teamId));
    }

    if (options.limit) {
      constraints.push(limit(options.limit));
    }

    const q = query(collection(db, 'announcements'), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Announcement[];
  } catch (error) {
    console.error('獲取公告列表失敗:', error);
    return [];
  }
};

/**
 * 獲取保存的報表
 */
export const getSavedReports = async (
  userId: string,
  options: {
    teamId?: string;
    isPublic?: boolean;
    limit?: number;
  } = {}
): Promise<SavedReport[]> => {
  try {
    const db = getFirebaseDb();
    const constraints = [orderBy('createdAt', 'desc')];

    // 獲取用戶可以查看的報表（自己創建的或公開的）
    if (options.isPublic !== undefined) {
      constraints.push(where('isPublic', '==', options.isPublic));
    }

    if (options.teamId) {
      constraints.push(where('teamId', '==', options.teamId));
    }

    if (options.limit) {
      constraints.push(limit(options.limit));
    }

    const q = query(collection(db, 'savedReports'), ...constraints);
    const snapshot = await getDocs(q);

    // 過濾出用戶有權限查看的報表
    const reports = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((report: any) => {
        return report.createdBy === userId || report.isPublic;
      }) as SavedReport[];

    return reports;
  } catch (error) {
    console.error('獲取保存的報表失敗:', error);
    return [];
  }
};

/**
 * 標記公告為已讀
 */
export const markAnnouncementAsRead = async (
  announcementId: string,
  userId: string
): Promise<void> => {
  try {
    const db = getFirebaseDb();
    const announcementRef = doc(db, 'announcements', announcementId);
    await updateDoc(announcementRef, {
      [`isRead.${userId}`]: true,
    });
  } catch (error) {
    console.error('標記公告已讀失敗:', error);
  }
};

/**
 * 刪除過期公告
 */
export const deleteExpiredAnnouncements = async (): Promise<number> => {
  try {
    const db = getFirebaseDb();
    const now = Timestamp.now();
    const q = query(
      collection(db, 'announcements'),
      where('expiresAt', '<', now)
    );

    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    
    return snapshot.size;
  } catch (error) {
    console.error('刪除過期公告失敗:', error);
    return 0;
  }
};