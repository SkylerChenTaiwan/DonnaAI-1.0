/**
 * 優化的任務管理服務 V2
 * 使用查詢層級權限，避免 N+1 查詢問題
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
import { getFirebaseDb } from './config';
import { 
  TaskDoc,
  TaskStatus,
  TaskCreateRequest,
  TaskUpdateRequest,
  TaskFilter,
  TaskStats,
  TaskBatchOperation
} from '../../types/task';
import { User } from '../../types/user';
import { getUserPermissionContext } from './permissions-v2';

const TASKS_COLLECTION = 'tasks';

/**
 * 建立新任務（保持原有邏輯）
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
    
    // 簡化權限檢查 - 預設使用者只能分派給自己或同團隊成員
    // TODO: 實作更完整的分派權限檢查
    
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
      doc(getFirebaseDb(), TASKS_COLLECTION, taskId),
      taskDoc
    );
    
    return taskDoc;
  } catch (error) {
    console.error('建立任務失敗:', error);
    throw error;
  }
}

/**
 * 更新任務（保持原有邏輯）
 */
export async function updateTask(
  taskId: string,
  updates: TaskUpdateRequest,
  userId: string
): Promise<void> {
  try {
    // 獲取現有任務
    const taskDoc = await getDoc(doc(getFirebaseDb(), TASKS_COLLECTION, taskId));
    if (!taskDoc.exists()) {
      throw new Error('找不到指定的任務');
    }
    
    const task = taskDoc.data() as TaskDoc;
    
    // 簡化的權限檢查 - 負責人、分派人或建立者可以編輯
    const canEdit = 
      task.assigneeId === userId ||
      task.assignerId === userId ||
      task.createdBy === userId;
      
    if (!canEdit) {
      throw new Error('您沒有權限編輯此任務');
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
      doc(getFirebaseDb(), TASKS_COLLECTION, taskId),
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
 * 刪除任務（保持原有邏輯）
 */
export async function deleteTask(
  taskId: string,
  userId: string
): Promise<void> {
  try {
    // 獲取任務
    const taskDoc = await getDoc(doc(getFirebaseDb(), TASKS_COLLECTION, taskId));
    if (!taskDoc.exists()) {
      throw new Error('找不到指定的任務');
    }
    
    const task = taskDoc.data() as TaskDoc;
    
    // 檢查權限（只有建立者、負責人或分派人可以刪除）
    const canDelete = 
      task.createdBy === userId ||
      task.assigneeId === userId ||
      task.assignerId === userId;
      
    if (!canDelete) {
      throw new Error('您沒有權限刪除此任務');
    }
    
    // 刪除文件
    await deleteDoc(doc(getFirebaseDb(), TASKS_COLLECTION, taskId));
  } catch (error) {
    console.error('刪除任務失敗:', error);
    throw error;
  }
}

/**
 * 獲取單一任務（仍需要個別權限檢查）
 */
export async function getTask(
  taskId: string,
  user: User
): Promise<TaskDoc | null> {
  try {
    const taskDoc = await getDoc(doc(getFirebaseDb(), TASKS_COLLECTION, taskId));
    if (!taskDoc.exists()) {
      return null;
    }
    
    const data = taskDoc.data() as Omit<TaskDoc, 'id'>;
    const task: TaskDoc = {
      id: taskDoc.id,
      ...data
    };
    
    // 簡化的權限檢查
    const permissionContext = await getUserPermissionContext(user);
    
    // 管理員可以看所有
    if (permissionContext.role === 'admin') {
      return task;
    }
    
    // 負責人、分派人或建立者可以查看
    if (task.assigneeId === user.id || 
        task.assignerId === user.id || 
        task.createdBy === user.id) {
      return task;
    }
    
    // 主管可以查看下屬的任務
    if (permissionContext.role === 'manager' && 
        task.teamId && 
        permissionContext.managedTeamIds.includes(task.teamId)) {
      return task;
    }
    
    throw new Error('您沒有權限查看此任務');
  } catch (error) {
    console.error('獲取任務失敗:', error);
    throw error;
  }
}

/**
 * 優化的獲取任務列表
 * 使用複合查詢減少權限檢查
 */
export async function getTasksOptimized(
  user: User,
  filter?: TaskFilter
): Promise<TaskDoc[]> {
  try {
    // 取得權限上下文（帶快取）
    const permissionContext = await getUserPermissionContext(user);
    
    let allTasks: TaskDoc[] = [];
    
    // 策略：根據角色使用不同的查詢方式
    if (permissionContext.role === 'admin') {
      // 管理員：查詢組織內所有任務
      let q = query(
        collection(getFirebaseDb(), TASKS_COLLECTION),
        where('organizationId', '==', permissionContext.organizationId)
      );
      
      const snapshot = await getDocs(q);
      allTasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as TaskDoc));
      
    } else if (permissionContext.role === 'manager') {
      // 主管：查詢管理團隊的任務 + 自己的任務
      const queries = [];
      
      // 管理團隊的任務
      if (permissionContext.managedTeamIds.length > 0) {
        queries.push(
          getDocs(query(
            collection(getFirebaseDb(), TASKS_COLLECTION),
            where('teamId', 'in', permissionContext.managedTeamIds)
          ))
        );
      }
      
      // 自己負責的任務
      queries.push(
        getDocs(query(
          collection(getFirebaseDb(), TASKS_COLLECTION),
          where('assigneeId', '==', user.id)
        ))
      );
      
      // 自己分派的任務
      queries.push(
        getDocs(query(
          collection(getFirebaseDb(), TASKS_COLLECTION),
          where('assignerId', '==', user.id)
        ))
      );
      
      // 並行執行查詢
      const results = await Promise.all(queries);
      const taskMap = new Map<string, TaskDoc>();
      
      results.forEach(snapshot => {
        snapshot.docs.forEach(doc => {
          if (!taskMap.has(doc.id)) {
            taskMap.set(doc.id, {
              id: doc.id,
              ...doc.data()
            } as TaskDoc);
          }
        });
      });
      
      allTasks = Array.from(taskMap.values());
      
    } else {
      // 一般使用者：查詢自己相關的任務
      const queries = [];
      
      // 自己負責的任務
      queries.push(
        getDocs(query(
          collection(getFirebaseDb(), TASKS_COLLECTION),
          where('assigneeId', '==', user.id)
        ))
      );
      
      // 自己分派的任務
      queries.push(
        getDocs(query(
          collection(getFirebaseDb(), TASKS_COLLECTION),
          where('assignerId', '==', user.id)
        ))
      );
      
      // 自己建立的任務
      queries.push(
        getDocs(query(
          collection(getFirebaseDb(), TASKS_COLLECTION),
          where('createdBy', '==', user.id)
        ))
      );
      
      // 並行執行查詢
      const results = await Promise.all(queries);
      const taskMap = new Map<string, TaskDoc>();
      
      results.forEach(snapshot => {
        snapshot.docs.forEach(doc => {
          if (!taskMap.has(doc.id)) {
            taskMap.set(doc.id, {
              id: doc.id,
              ...doc.data()
            } as TaskDoc);
          }
        });
      });
      
      allTasks = Array.from(taskMap.values());
      console.log(`User ${user.id} - Found ${allTasks.length} tasks before filtering`);
    }
    
    // 客戶端過濾
    if (filter) {
      const now = new Date();
      
      allTasks = allTasks.filter(task => {
        // 類型過濾
        if (filter.type) {
          const types = Array.isArray(filter.type) ? filter.type : [filter.type];
          if (!types.includes(task.type)) return false;
        }
        
        // 狀態過濾
        if (filter.status) {
          const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
          if (!statuses.includes(task.status)) return false;
        }
        
        // 優先級過濾
        if (filter.priority) {
          const priorities = Array.isArray(filter.priority) ? filter.priority : [filter.priority];
          if (!priorities.includes(task.priority)) return false;
        }
        
        // 團隊過濾
        if (filter.teamId && task.teamId !== filter.teamId) {
          return false;
        }
        
        // 負責人過濾
        if (filter.assigneeId && task.assigneeId !== filter.assigneeId) {
          return false;
        }
        
        // 分派人過濾
        if (filter.assignerId && task.assignerId !== filter.assignerId) {
          return false;
        }
        
        // 客戶過濾
        if (filter.customerIds && filter.customerIds.length > 0) {
          if (!task.customerIds?.some(id => filter.customerIds!.includes(id))) {
            return false;
          }
        }
        
        // 過期過濾
        if (filter.overdue) {
          if (!task.dueDate || 
              task.dueDate.toDate() >= now || 
              task.status === 'completed') {
            return false;
          }
        }
        
        // 日期範圍過濾
        if (filter.dateFrom && task.scheduledAt && 
            task.scheduledAt.toDate() < filter.dateFrom) {
          return false;
        }
        
        if (filter.dateTo && task.scheduledAt && 
            task.scheduledAt.toDate() > filter.dateTo) {
          return false;
        }
        
        return true;
      });
    }
    
    // 排序
    allTasks.sort((a, b) => {
      if (filter?.overdue && a.dueDate && b.dueDate) {
        return a.dueDate.toDate().getTime() - b.dueDate.toDate().getTime();
      }
      return b.updatedAt.toDate().getTime() - a.updatedAt.toDate().getTime();
    });
    
    console.log(`✅ 獲取到 ${allTasks.length} 個任務（優化版）`);
    console.log('Filter applied:', filter);
    console.log('Tasks breakdown:');
    console.log('- With due date:', allTasks.filter(t => t.dueDate).length);
    console.log('- Without due date:', allTasks.filter(t => !t.dueDate).length);
    console.log('- By status:', {
      todo: allTasks.filter(t => t.status === 'todo').length,
      completed: allTasks.filter(t => t.status === 'completed').length
    });
    if (filter?.teamId) {
      console.log('- In specified team:', allTasks.filter(t => t.teamId === filter.teamId).length);
    }
    return allTasks;
    
  } catch (error) {
    console.error('獲取任務列表失敗:', error);
    throw error;
  }
}

/**
 * 優化的訂閱任務變更
 * 根據使用者角色使用不同的訂閱策略
 */
export function subscribeToTasksOptimized(
  user: User,
  callback: (tasks: TaskDoc[]) => void,
  filter?: TaskFilter
): Unsubscribe {
  const unsubscribes: Unsubscribe[] = [];
  const taskMap = new Map<string, TaskDoc>();
  
  // 取得權限上下文
  getUserPermissionContext(user).then(permissionContext => {
    // 定義更新回調
    const updateCallback = () => {
      let tasks = Array.from(taskMap.values());
      
      // 客戶端過濾
      if (filter) {
        tasks = tasks.filter(task => {
          if (filter.status && !matchesFilter(task.status, filter.status)) return false;
          if (filter.priority && !matchesFilter(task.priority, filter.priority)) return false;
          if (filter.type && !matchesFilter(task.type, filter.type)) return false;
          if (filter.assigneeId && task.assigneeId !== filter.assigneeId) return false;
          return true;
        });
      }
      
      // 排序
      tasks.sort((a, b) => b.updatedAt.toDate().getTime() - a.updatedAt.toDate().getTime());
      
      callback(tasks);
    };
    
    // 根據角色訂閱不同的查詢
    if (permissionContext.role === 'admin') {
      // 管理員：訂閱組織內所有任務
      const unsubscribe = onSnapshot(
        query(
          collection(getFirebaseDb(), TASKS_COLLECTION),
          where('organizationId', '==', permissionContext.organizationId),
          orderBy('updatedAt', 'desc'),
          limit(100)
        ),
        (snapshot) => {
          snapshot.docChanges().forEach(change => {
            if (change.type === 'removed') {
              taskMap.delete(change.doc.id);
            } else {
              taskMap.set(change.doc.id, {
                id: change.doc.id,
                ...change.doc.data()
              } as TaskDoc);
            }
          });
          updateCallback();
        }
      );
      unsubscribes.push(unsubscribe);
      
    } else {
      // 其他角色：訂閱多個查詢
      
      // 訂閱自己負責的任務
      unsubscribes.push(
        onSnapshot(
          query(
            collection(getFirebaseDb(), TASKS_COLLECTION),
            where('assigneeId', '==', user.id),
            orderBy('updatedAt', 'desc'),
            limit(50)
          ),
          (snapshot) => {
            snapshot.docChanges().forEach(change => {
              if (change.type === 'removed') {
                taskMap.delete(change.doc.id);
              } else {
                taskMap.set(change.doc.id, {
                  id: change.doc.id,
                  ...change.doc.data()
                } as TaskDoc);
              }
            });
            updateCallback();
          }
        )
      );
      
      // 訂閱自己分派的任務
      unsubscribes.push(
        onSnapshot(
          query(
            collection(getFirebaseDb(), TASKS_COLLECTION),
            where('assignerId', '==', user.id),
            orderBy('updatedAt', 'desc'),
            limit(50)
          ),
          (snapshot) => {
            snapshot.docChanges().forEach(change => {
              if (change.type === 'removed') {
                taskMap.delete(change.doc.id);
              } else {
                taskMap.set(change.doc.id, {
                  id: change.doc.id,
                  ...change.doc.data()
                } as TaskDoc);
              }
            });
            updateCallback();
          }
        )
      );
      
      // 主管額外訂閱管理團隊的任務
      if (permissionContext.role === 'manager' && permissionContext.managedTeamIds.length > 0) {
        unsubscribes.push(
          onSnapshot(
            query(
              collection(getFirebaseDb(), TASKS_COLLECTION),
              where('teamId', 'in', permissionContext.managedTeamIds),
              orderBy('updatedAt', 'desc'),
              limit(100)
            ),
            (snapshot) => {
              snapshot.docChanges().forEach(change => {
                if (change.type === 'removed') {
                  taskMap.delete(change.doc.id);
                } else {
                  taskMap.set(change.doc.id, {
                    id: change.doc.id,
                    ...change.doc.data()
                  } as TaskDoc);
                }
              });
              updateCallback();
            }
          )
        );
      }
    }
  }).catch(error => {
    console.error('獲取權限上下文失敗:', error);
  });
  
  // 返回合併的 unsubscribe 函數
  return () => {
    unsubscribes.forEach(unsubscribe => unsubscribe());
  };
}

/**
 * 批次操作任務（優化版）
 */
export async function batchOperateTasks(
  operation: TaskBatchOperation,
  user: User
): Promise<void> {
  try {
    const batch = writeBatch(getFirebaseDb());
    const permissionContext = await getUserPermissionContext(user);
    
    // 批量獲取任務
    const taskDocs = await Promise.all(
      operation.taskIds.map(taskId => 
        getDoc(doc(getFirebaseDb(), TASKS_COLLECTION, taskId))
      )
    );
    
    for (let i = 0; i < taskDocs.length; i++) {
      const taskDoc = taskDocs[i];
      if (!taskDoc.exists()) continue;
      
      const task = taskDoc.data() as TaskDoc;
      const taskRef = doc(getFirebaseDb(), TASKS_COLLECTION, operation.taskIds[i]);
      
      // 簡化的權限檢查
      const canEdit = 
        permissionContext.role === 'admin' ||
        task.assigneeId === user.id ||
        task.assignerId === user.id ||
        (permissionContext.role === 'manager' && 
         task.teamId && 
         permissionContext.managedTeamIds.includes(task.teamId));
      
      if (!canEdit) continue;
      
      switch (operation.operation) {
        case 'update':
          if (!operation.data) {
            throw new Error('批次更新需要提供更新資料');
          }
          batch.update(taskRef, {
            ...operation.data,
            updatedAt: serverTimestamp()
          });
          break;
          
        case 'delete':
          batch.delete(taskRef);
          break;
          
        case 'assign':
          if (!operation.data?.assigneeId) {
            throw new Error('批次分派需要指定負責人');
          }
          batch.update(taskRef, {
            assigneeId: operation.data.assigneeId,
            updatedAt: serverTimestamp()
          });
          break;
          
        case 'complete':
          batch.update(taskRef, {
            status: 'completed' as TaskStatus,
            completedAt: Timestamp.now(),
            completedBy: user.id,
            updatedAt: serverTimestamp()
          });
          break;
      }
    }
    
    await batch.commit();
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
  organizationId: string,
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
        customerIds,
        organizationId
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
 * 獲取任務統計（優化版）
 */
export async function getTaskStats(
  user: User,
  teamId?: string
): Promise<TaskStats> {
  try {
    // 使用優化的獲取任務函數
    const tasks = await getTasksOptimized(user, teamId ? { teamId } : undefined);
    
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const stats: TaskStats = {
      totalCount: tasks.length,
      byStatus: {
        todo: 0,
        completed: 0
      } as Record<TaskStatus, number>,
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
    
    tasks.forEach(task => {
      // 按狀態統計
      stats.byStatus[task.status]++;
      
      // 按優先級統計
      stats.byPriority[task.priority]++;
      
      // 按類型統計
      stats.byType[task.type]++;
      
      // 過期任務
      if (task.dueDate && 
          task.dueDate.toDate() < now && 
          task.status !== 'completed') {
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
          task.status !== 'completed') {
        stats.upcomingTasks++;
      }
    });
    
    return stats;
  } catch (error) {
    console.error('獲取任務統計失敗:', error);
    throw error;
  }
}

/**
 * 獲取客戶相關的任務（優化版）
 */
export async function getTasksByCustomerOptimized(
  customerId: string,
  user: User,
  includeCompleted: boolean = false
): Promise<TaskDoc[]> {
  try {
    const permissionContext = await getUserPermissionContext(user);
    
    // 建立查詢條件
    const constraints: any[] = [
      where('customerIds', 'array-contains', customerId)
    ];
    
    // 根據權限加入額外條件
    if (permissionContext.role === 'salesperson') {
      // 一般業務員只能看自己相關的任務
      // 這需要複合查詢，所以獲取後再過濾
    }
    
    if (!includeCompleted) {
      constraints.push(where('status', '==', 'todo'));
    }
    
    constraints.push(orderBy('updatedAt', 'desc'));
    
    const q = query(
      collection(getFirebaseDb(), TASKS_COLLECTION),
      ...constraints
    );
    
    const snapshot = await getDocs(q);
    let tasks: TaskDoc[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as TaskDoc));
    
    // 根據角色過濾
    if (permissionContext.role === 'salesperson') {
      tasks = tasks.filter(task => 
        task.assigneeId === user.id ||
        task.assignerId === user.id ||
        task.createdBy === user.id
      );
    } else if (permissionContext.role === 'manager') {
      // 主管可以看管理團隊和自己的任務
      tasks = tasks.filter(task => 
        task.assigneeId === user.id ||
        task.assignerId === user.id ||
        task.createdBy === user.id ||
        (task.teamId && permissionContext.managedTeamIds.includes(task.teamId))
      );
    }
    // admin 可以看所有，不需要過濾
    
    return tasks;
  } catch (error) {
    console.error('獲取客戶相關任務失敗:', error);
    throw error;
  }
}

// === 私有輔助函數 ===

/**
 * 檢查值是否符合過濾條件
 */
function matchesFilter<T>(value: T, filter: T | T[]): boolean {
  if (Array.isArray(filter)) {
    return filter.includes(value);
  }
  return value === filter;
}

// 匯出舊版函數名稱以保持向後相容
export {
  getTasksOptimized as getTasks,
  subscribeToTasksOptimized as subscribeToTasks,
  getTasksByCustomerOptimized as getTasksByCustomer
};