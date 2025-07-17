/**
 * 任務管理服務
 * 處理任務的 CRUD 操作、狀態管理和多來源整合
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  Timestamp,
  serverTimestamp,
  Unsubscribe,
  writeBatch,
  limit
} from 'firebase/firestore';
import { db } from './config';
import { 
  TaskDoc,
  TaskType,
  TaskStatus,
  TaskPriority,
  TaskSource,
  TaskCreateRequest,
  TaskUpdateRequest,
  TaskFilter,
  TaskStats,
  TaskBatchOperation
} from '../../types/task';
import { 
  canAssignTaskTo,
  isOrgAdmin,
  isManagerOfUser 
} from './permissions';

const TASKS_COLLECTION = 'tasks';

/**
 * 建立新任務
 */
export async function createTask(
  task: TaskCreateRequest,
  userId: string
): Promise<TaskDoc> {
  try {
    // 驗證必填欄位
    if (!task.title || !task.assigneeId) {
      throw new Error('任務標題和負責人為必填欄位');
    }
    
    // 檢查分派權限
    const canAssign = await canAssignTaskTo(userId, task.assigneeId);
    if (!canAssign) {
      throw new Error('您沒有權限分派任務給此使用者');
    }
    
    // 驗證任務類型邏輯
    if (task.type === 'scheduled' && !task.scheduledAt) {
      throw new Error('已排程任務必須指定時間');
    }
    if (task.type === 'unscheduled' && task.scheduledAt) {
      throw new Error('未排程任務不應有指定時間');
    }
    
    // 產生文件 ID
    const taskId = `task_${Date.now()}`;
    
    // 建立任務文件
    const taskDoc: TaskDoc = {
      ...task,
      id: taskId,
      status: 'todo',
      assignerId: userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy: userId,
      // 轉換日期為 Timestamp
      scheduledAt: task.scheduledAt ? Timestamp.fromDate(task.scheduledAt) : undefined,
      dueDate: task.dueDate ? Timestamp.fromDate(task.dueDate) : undefined
    };
    
    // 儲存到 Firestore
    await setDoc(
      doc(db, TASKS_COLLECTION, taskId),
      taskDoc
    );
    
    return taskDoc;
  } catch (error) {
    console.error('建立任務失敗:', error);
    throw error;
  }
}

/**
 * 更新任務
 */
export async function updateTask(
  taskId: string,
  updates: TaskUpdateRequest,
  userId: string
): Promise<void> {
  try {
    // 獲取現有任務
    const taskDoc = await getDoc(doc(db, TASKS_COLLECTION, taskId));
    if (!taskDoc.exists()) {
      throw new Error('找不到指定的任務');
    }
    
    const task = taskDoc.data() as TaskDoc;
    
    // 檢查權限
    const canEdit = await checkTaskEditPermission(userId, task);
    if (!canEdit) {
      throw new Error('您沒有權限編輯此任務');
    }
    
    // 如果要重新分派，檢查分派權限
    if (updates.assigneeId && updates.assigneeId !== task.assigneeId) {
      const canAssign = await canAssignTaskTo(userId, updates.assigneeId);
      if (!canAssign) {
        throw new Error('您沒有權限分派任務給此使用者');
      }
    }
    
    // 處理狀態變更
    const processedUpdates: any = { ...updates };
    
    if (updates.status === 'completed' && task.status !== 'completed') {
      processedUpdates.completedAt = Timestamp.now();
      processedUpdates.completedBy = userId;
    }
    
    // 轉換日期為 Timestamp
    if (updates.scheduledAt !== undefined) {
      processedUpdates.scheduledAt = updates.scheduledAt 
        ? Timestamp.fromDate(updates.scheduledAt) 
        : null;
    }
    if (updates.dueDate !== undefined) {
      processedUpdates.dueDate = updates.dueDate 
        ? Timestamp.fromDate(updates.dueDate) 
        : null;
    }
    
    // 更新文件
    await updateDoc(
      doc(db, TASKS_COLLECTION, taskId),
      {
        ...processedUpdates,
        updatedAt: serverTimestamp()
      }
    );
  } catch (error) {
    console.error('更新任務失敗:', error);
    throw error;
  }
}

/**
 * 刪除任務
 */
export async function deleteTask(
  taskId: string,
  userId: string
): Promise<void> {
  try {
    // 獲取任務
    const taskDoc = await getDoc(doc(db, TASKS_COLLECTION, taskId));
    if (!taskDoc.exists()) {
      throw new Error('找不到指定的任務');
    }
    
    const task = taskDoc.data() as TaskDoc;
    
    // 檢查權限（只有建立者、負責人或管理員可以刪除）
    const canDelete = 
      task.createdBy === userId ||
      task.assigneeId === userId ||
      task.assignerId === userId ||
      await isOrgAdmin(userId);
      
    if (!canDelete) {
      throw new Error('您沒有權限刪除此任務');
    }
    
    // 刪除文件
    await deleteDoc(doc(db, TASKS_COLLECTION, taskId));
  } catch (error) {
    console.error('刪除任務失敗:', error);
    throw error;
  }
}

/**
 * 獲取單一任務
 */
export async function getTask(
  taskId: string,
  userId: string
): Promise<TaskDoc | null> {
  try {
    const taskDoc = await getDoc(doc(db, TASKS_COLLECTION, taskId));
    if (!taskDoc.exists()) {
      return null;
    }
    
    const data = taskDoc.data() as Omit<TaskDoc, 'id'>;
    const task: TaskDoc = {
      id: taskDoc.id,
      ...data
    };
    
    // 檢查查看權限
    const canView = await checkTaskViewPermission(userId, task);
    if (!canView) {
      throw new Error('您沒有權限查看此任務');
    }
    
    return task;
  } catch (error) {
    console.error('獲取任務失敗:', error);
    throw error;
  }
}

/**
 * 獲取任務列表
 */
export async function getTasks(
  userId: string,
  filter?: TaskFilter
): Promise<TaskDoc[]> {
  try {
    let q = query(collection(db, TASKS_COLLECTION));
    
    // 套用過濾條件
    if (filter) {
      if (filter.type) {
        const types = Array.isArray(filter.type) ? filter.type : [filter.type];
        q = query(q, where('type', 'in', types));
      }
      
      if (filter.status) {
        const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
        q = query(q, where('status', 'in', statuses));
      }
      
      if (filter.priority) {
        const priorities = Array.isArray(filter.priority) ? filter.priority : [filter.priority];
        q = query(q, where('priority', 'in', priorities));
      }
      
      if (filter.assigneeId) {
        q = query(q, where('assigneeId', '==', filter.assigneeId));
      }
      
      if (filter.assignerId) {
        q = query(q, where('assignerId', '==', filter.assignerId));
      }
      
      if (filter.teamId) {
        q = query(q, where('teamId', '==', filter.teamId));
      }
      
      if (filter.source) {
        const sources = Array.isArray(filter.source) ? filter.source : [filter.source];
        q = query(q, where('source', 'in', sources));
      }
      
      if (filter.customerIds && filter.customerIds.length > 0) {
        q = query(q, where('customerIds', 'array-contains-any', filter.customerIds));
      }
    }
    
    // 排序
    if (filter?.overdue) {
      q = query(q, orderBy('dueDate', 'asc'));
    } else {
      q = query(q, orderBy('updatedAt', 'desc'));
    }
    
    const snapshot = await getDocs(q);
    const tasks: TaskDoc[] = [];
    const now = new Date();
    
    // 逐一檢查權限和過濾
    for (const doc of snapshot.docs) {
      const data = doc.data() as Omit<TaskDoc, 'id'>;
      const task: TaskDoc = {
        id: doc.id,
        ...data
      };
      
      const canView = await checkTaskViewPermission(userId, task);
      if (canView) {
        // 過期過濾
        if (filter?.overdue) {
          if (task.dueDate && task.dueDate.toDate() < now && task.status !== 'completed') {
            tasks.push(task);
          }
        } else {
          tasks.push(task);
        }
      }
    }
    
    return tasks;
  } catch (error) {
    console.error('獲取任務列表失敗:', error);
    throw error;
  }
}

/**
 * 訂閱任務變更
 */
export function subscribeToTasks(
  userId: string,
  callback: (tasks: TaskDoc[]) => void,
  filter?: TaskFilter
): Unsubscribe {
  let q = query(
    collection(db, TASKS_COLLECTION),
    orderBy('updatedAt', 'desc'),
    limit(100) // 限制數量以提升效能
  );
  
  // 基本過濾（最常用的）
  if (filter?.assigneeId) {
    q = query(
      collection(db, TASKS_COLLECTION),
      where('assigneeId', '==', filter.assigneeId),
      orderBy('updatedAt', 'desc'),
      limit(100)
    );
  }
  
  return onSnapshot(q, async (snapshot) => {
    const tasks: TaskDoc[] = [];
    
    // 逐一檢查權限
    for (const doc of snapshot.docs) {
      const data = doc.data() as Omit<TaskDoc, 'id'>;
      const task: TaskDoc = {
        id: doc.id,
        ...data
      };
      
      const canView = await checkTaskViewPermission(userId, task);
      if (canView) {
        // 客戶端額外過濾
        if (filter) {
          if (filter.status && !matchesFilter(task.status, filter.status)) continue;
          if (filter.priority && !matchesFilter(task.priority, filter.priority)) continue;
          if (filter.type && !matchesFilter(task.type, filter.type)) continue;
        }
        
        tasks.push(task);
      }
    }
    
    callback(tasks);
  }, (error) => {
    console.error('訂閱任務失敗:', error);
  });
}

/**
 * 批次操作任務
 */
export async function batchOperateTasks(
  operation: TaskBatchOperation,
  userId: string
): Promise<void> {
  try {
    const batch = writeBatch(db);
    
    for (const taskId of operation.taskIds) {
      const taskRef = doc(db, TASKS_COLLECTION, taskId);
      
      switch (operation.operation) {
        case 'update':
          if (!operation.data) {
            throw new Error('批次更新需要提供更新資料');
          }
          
          // 檢查每個任務的權限
          const taskDoc = await getDoc(taskRef);
          if (taskDoc.exists()) {
            const task = taskDoc.data() as TaskDoc;
            const canEdit = await checkTaskEditPermission(userId, task);
            if (canEdit) {
              batch.update(taskRef, {
                ...operation.data,
                updatedAt: serverTimestamp()
              });
            }
          }
          break;
          
        case 'delete':
          // 刪除權限已在 deleteTask 中處理
          await deleteTask(taskId, userId);
          break;
          
        case 'assign':
          if (!operation.data?.assigneeId) {
            throw new Error('批次分派需要指定負責人');
          }
          
          // 檢查分派權限
          const canAssign = await canAssignTaskTo(userId, operation.data.assigneeId);
          if (canAssign) {
            batch.update(taskRef, {
              assigneeId: operation.data.assigneeId,
              updatedAt: serverTimestamp()
            });
          }
          break;
          
        case 'complete':
          batch.update(taskRef, {
            status: 'completed' as TaskStatus,
            completedAt: Timestamp.now(),
            completedBy: userId,
            updatedAt: serverTimestamp()
          });
          break;
      }
    }
    
    if (operation.operation !== 'delete') {
      await batch.commit();
    }
  } catch (error) {
    console.error('批次操作任務失敗:', error);
    throw error;
  }
}

/**
 * 從 AI 提取的行動項目建立任務
 */
export async function createTasksFromAIActions(
  recordId: string,
  actionItems: string[],
  assigneeId: string,
  teamId: string,
  _organizationId: string,
  customerIds?: string[]
): Promise<TaskDoc[]> {
  try {
    const createdTasks: TaskDoc[] = [];
    
    for (const action of actionItems) {
      const task = await createTask({
        title: action,
        type: 'pending',
        priority: 'medium',
        assigneeId,
        teamId,
        source: 'ai_extracted',
        recordId,
        customerIds
      }, assigneeId); // AI 建立的任務預設由負責人自己建立
      
      createdTasks.push(task);
    }
    
    return createdTasks;
  } catch (error) {
    console.error('從 AI 行動項目建立任務失敗:', error);
    throw error;
  }
}

/**
 * 獲取任務統計
 */
export async function getTaskStats(
  userId: string,
  teamId?: string
): Promise<TaskStats> {
  try {
    let q = query(collection(db, TASKS_COLLECTION));
    
    if (teamId) {
      q = query(q, where('teamId', '==', teamId));
    }
    
    const snapshot = await getDocs(q);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const stats: TaskStats = {
      totalCount: 0,
      byStatus: {
        todo: 0,
        in_progress: 0,
        completed: 0,
        cancelled: 0
      },
      byPriority: {
        low: 0,
        medium: 0,
        high: 0,
        urgent: 0
      },
      byType: {
        scheduled: 0,
        unscheduled: 0,
        pending: 0
      },
      overdueTasks: 0,
      completedToday: 0,
      upcomingTasks: 0
    };
    
    for (const doc of snapshot.docs) {
      const task = doc.data() as TaskDoc;
      
      // 檢查權限
      const canView = await checkTaskViewPermission(userId, task);
      if (!canView) continue;
      
      stats.totalCount++;
      
      // 按狀態統計
      stats.byStatus[task.status]++;
      
      // 按優先級統計
      stats.byPriority[task.priority]++;
      
      // 按類型統計
      stats.byType[task.type]++;
      
      // 過期任務
      if (task.dueDate && 
          task.dueDate.toDate() < now && 
          task.status !== 'completed' && 
          task.status !== 'cancelled') {
        stats.overdueTasks++;
      }
      
      // 今日完成
      if (task.completedAt && 
          task.completedAt.toDate() >= todayStart) {
        stats.completedToday++;
      }
      
      // 即將到來的任務（未來7天）
      if (task.scheduledAt && 
          task.scheduledAt.toDate() > now &&
          task.scheduledAt.toDate() < new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) &&
          task.status !== 'completed' && 
          task.status !== 'cancelled') {
        stats.upcomingTasks++;
      }
    }
    
    return stats;
  } catch (error) {
    console.error('獲取任務統計失敗:', error);
    throw error;
  }
}

/**
 * 獲取客戶相關的任務
 */
export async function getTasksByCustomer(
  customerId: string,
  userId: string,
  includeCompleted: boolean = false
): Promise<TaskDoc[]> {
  try {
    let q = query(
      collection(db, TASKS_COLLECTION),
      where('customerIds', 'array-contains', customerId),
      orderBy('updatedAt', 'desc')
    );
    
    if (!includeCompleted) {
      q = query(
        collection(db, TASKS_COLLECTION),
        where('customerIds', 'array-contains', customerId),
        where('status', 'in', ['todo', 'in_progress']),
        orderBy('updatedAt', 'desc')
      );
    }
    
    const snapshot = await getDocs(q);
    const tasks: TaskDoc[] = [];
    
    for (const doc of snapshot.docs) {
      const data = doc.data() as Omit<TaskDoc, 'id'>;
      const task: TaskDoc = {
        id: doc.id,
        ...data
      };
      
      const canView = await checkTaskViewPermission(userId, task);
      if (canView) {
        tasks.push(task);
      }
    }
    
    return tasks;
  } catch (error) {
    console.error('獲取客戶相關任務失敗:', error);
    throw error;
  }
}

// === 私有輔助函數 ===

/**
 * 檢查任務查看權限
 */
async function checkTaskViewPermission(userId: string, task: TaskDoc): Promise<boolean> {
  // 負責人、分派人或建立者可以查看
  if (task.assigneeId === userId || 
      task.assignerId === userId || 
      task.createdBy === userId) {
    return true;
  }
  
  // 管理員可以查看所有任務
  if (await isOrgAdmin(userId)) {
    return true;
  }
  
  // 負責人的主管可以查看
  if (await isManagerOfUser(userId, task.assigneeId)) {
    return true;
  }
  
  return false;
}

/**
 * 檢查任務編輯權限
 */
async function checkTaskEditPermission(userId: string, task: TaskDoc): Promise<boolean> {
  // 負責人可以編輯
  if (task.assigneeId === userId) {
    return true;
  }
  
  // 分派人可以編輯
  if (task.assignerId === userId) {
    return true;
  }
  
  // 管理員可以編輯所有任務
  if (await isOrgAdmin(userId)) {
    return true;
  }
  
  // 負責人的主管可以編輯
  if (await isManagerOfUser(userId, task.assigneeId)) {
    return true;
  }
  
  return false;
}

/**
 * 檢查值是否符合過濾條件
 */
function matchesFilter<T>(value: T, filter: T | T[]): boolean {
  if (Array.isArray(filter)) {
    return filter.includes(value);
  }
  return value === filter;
}