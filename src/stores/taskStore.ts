/**
 * 任務狀態管理 Store
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Timestamp } from 'firebase/firestore';
import { 
  TaskDoc,
  TaskCreateRequest,
  TaskUpdateRequest,
  TaskFilter,
  TaskStats,
  TaskBatchOperation 
} from '../types/task';
import { 
  createTask,
  updateTask,
  deleteTask,
  createTasksFromAIActions
} from '../services/firebase/tasks';
import { 
  getTask,
  getTasksOptimized,
  subscribeToTasksOptimized,
  batchOperateTasks,
  getTaskStats,
  getTasksByCustomerOptimized
} from '../services/firebase/tasks-v2';
import { Unsubscribe } from 'firebase/firestore';
import { User } from '../types/user';

interface TaskState {
  // 狀態
  tasks: TaskDoc[];
  selectedTask: TaskDoc | null;
  taskStats: TaskStats | null;
  isLoading: boolean;
  error: string | null;
  filter: TaskFilter;
  
  // 訂閱管理
  unsubscribe: Unsubscribe | null;
  
  // 動作 - 基本 CRUD
  fetchTasks: (userOrUserId: User | string, filter?: TaskFilter) => Promise<void>;
  fetchTask: (taskId: string, userOrUserId: User | string) => Promise<void>;
  createTask: (task: TaskCreateRequest, userId: string) => Promise<TaskDoc>;
  updateTask: (taskId: string, updates: TaskUpdateRequest, userId: string) => Promise<void>;
  deleteTask: (taskId: string, userId: string) => Promise<void>;
  
  // 動作 - 批次操作
  batchOperateTasks: (operation: TaskBatchOperation, userOrUserId: User | string) => Promise<void>;
  
  // 動作 - 快速操作
  completeTask: (taskId: string, userId: string) => Promise<void>;
  assignTask: (taskId: string, assigneeId: string, userId: string) => Promise<void>;
  
  // 動作 - 即時訂閱
  subscribeToTasks: (userOrUserId: User | string, filter?: TaskFilter) => void;
  unsubscribeFromTasks: () => void;
  
  // 動作 - 統計
  fetchTaskStats: (userOrUserId: User | string, teamId?: string) => Promise<void>;
  
  // 動作 - 客戶相關
  fetchCustomerTasks: (customerId: string, userOrUserId: User | string, includeCompleted?: boolean) => Promise<void>;
  
  // 動作 - AI 整合
  createTasksFromAI: (
    recordId: string,
    actionItems: string[],
    assigneeId: string,
    teamId: string,
    organizationId: string,
    customerIds?: string[]
  ) => Promise<TaskDoc[]>;
  
  // 動作 - 過濾
  setFilter: (filter: Partial<TaskFilter>) => void;
  clearFilter: () => void;
  
  // 動作 - 狀態管理
  setSelectedTask: (task: TaskDoc | null) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  tasks: [],
  selectedTask: null,
  taskStats: null,
  isLoading: false,
  error: null,
  filter: {},
  unsubscribe: null
};

export const useTaskStore = create<TaskState>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      // 獲取任務列表（支援向後相容）
      fetchTasks: async (userOrUserId: User | string, filter?: TaskFilter) => {
        set({ isLoading: true, error: null });
        
        try {
          let tasks: TaskDoc[];
          const currentFilter = filter || get().filter;
          
          if (typeof userOrUserId === 'string') {
            // 舊版調用方式 - 創建臨時 User 物件
            const tempUser: User = {
              id: userOrUserId,
              email: '',
              name: '',
              role: 'salesperson',
              organizationId: '',
              teamIds: [],
              managedTeamIds: [],
              createdAt: new Date(),
              updatedAt: new Date()
            };
            
            tasks = await getTasksOptimized(tempUser, currentFilter);
          } else {
            // 新版調用方式 - 直接使用 User 物件
            tasks = await getTasksOptimized(userOrUserId, currentFilter);
          }
          
          set({ tasks, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '獲取任務列表失敗',
            isLoading: false 
          });
        }
      },
      
      // 獲取單一任務（支援向後相容）
      fetchTask: async (taskId: string, userOrUserId: User | string) => {
        set({ isLoading: true, error: null });
        
        try {
          let task: TaskDoc | null;
          
          if (typeof userOrUserId === 'string') {
            // 舊版調用方式 - 創建臨時 User 物件
            const tempUser: User = {
              id: userOrUserId,
              email: '',
              name: '',
              role: 'salesperson',
              organizationId: '',
              teamIds: [],
              managedTeamIds: [],
              createdAt: new Date(),
              updatedAt: new Date()
            };
            
            task = await getTask(taskId, tempUser);
          } else {
            // 新版調用方式 - 直接使用 User 物件
            task = await getTask(taskId, userOrUserId);
          }
          
          if (task) {
            set({ selectedTask: task, isLoading: false });
          } else {
            set({ 
              error: '找不到指定的任務',
              isLoading: false 
            });
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '獲取任務失敗',
            isLoading: false 
          });
        }
      },
      
      // 建立任務
      createTask: async (task, userId) => {
        set({ isLoading: true, error: null });
        
        try {
          const newTask = await createTask(task, userId);
          set(state => ({
            tasks: [newTask, ...state.tasks],
            isLoading: false
          }));
          return newTask;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '建立任務失敗',
            isLoading: false 
          });
          throw error;
        }
      },
      
      // 更新任務
      updateTask: async (taskId, updates, userId) => {
        set({ isLoading: true, error: null });
        
        try {
          await updateTask(taskId, updates, userId);
          
          // 更新本地狀態
          set(state => {
            // 轉換日期為 Timestamp
            const processedUpdates: any = { ...updates };
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
            
            return {
              tasks: state.tasks.map(t => 
                t.id === taskId ? { ...t, ...processedUpdates } : t
              ),
              selectedTask: state.selectedTask?.id === taskId 
                ? { ...state.selectedTask, ...processedUpdates }
                : state.selectedTask,
              isLoading: false
            };
          });
          
          // 如果狀態改變，更新統計
          if (updates.status) {
            const state = get();
            if (state.taskStats) {
              get().fetchTaskStats(userId);
            }
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '更新任務失敗',
            isLoading: false 
          });
          throw error;
        }
      },
      
      // 刪除任務
      deleteTask: async (taskId, userId) => {
        set({ isLoading: true, error: null });
        
        try {
          await deleteTask(taskId, userId);
          
          // 更新本地狀態
          set(state => ({
            tasks: state.tasks.filter(t => t.id !== taskId),
            selectedTask: state.selectedTask?.id === taskId 
              ? null 
              : state.selectedTask,
            isLoading: false
          }));
          
          // 更新統計
          const state = get();
          if (state.taskStats) {
            get().fetchTaskStats(userId);
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '刪除任務失敗',
            isLoading: false 
          });
          throw error;
        }
      },
      
      // 批次操作任務（支援向後相容）
      batchOperateTasks: async (operation, userOrUserId) => {
        set({ isLoading: true, error: null });
        
        try {
          if (typeof userOrUserId === 'string') {
            // 舊版調用方式 - 創建臨時 User 物件
            const tempUser: User = {
              id: userOrUserId,
              email: '',
              name: '',
              role: 'salesperson',
              organizationId: '',
              teamIds: [],
              managedTeamIds: [],
              createdAt: new Date(),
              updatedAt: new Date()
            };
            
            await batchOperateTasks(operation, tempUser);
            await get().fetchTasks(tempUser);
            
            // 更新統計
            const state = get();
            if (state.taskStats) {
              get().fetchTaskStats(tempUser);
            }
          } else {
            // 新版調用方式 - 直接使用 User 物件
            await batchOperateTasks(operation, userOrUserId);
            await get().fetchTasks(userOrUserId);
            
            // 更新統計
            const state = get();
            if (state.taskStats) {
              get().fetchTaskStats(userOrUserId);
            }
          }
          
          set({ isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '批次操作任務失敗',
            isLoading: false 
          });
          throw error;
        }
      },
      
      // 完成任務
      completeTask: async (taskId: string, userId: string) => {
        await get().updateTask(taskId, { status: 'completed' }, userId);
      },
      
      // 分派任務
      assignTask: async (taskId: string, assigneeId: string, userId: string) => {
        await get().updateTask(taskId, { assigneeId }, userId);
      },
      
      // 訂閱任務變更（支援向後相容）
      subscribeToTasks: (userOrUserId: User | string, filter?: TaskFilter) => {
        // 先取消現有訂閱
        const currentUnsubscribe = get().unsubscribe;
        if (currentUnsubscribe) {
          currentUnsubscribe();
        }
        
        const currentFilter = filter || get().filter;
        let unsubscribe: Unsubscribe;
        
        if (typeof userOrUserId === 'string') {
          // 舊版調用方式 - 創建臨時 User 物件
          const tempUser: User = {
            id: userOrUserId,
            email: '',
            name: '',
            role: 'salesperson',
            organizationId: '',
            teamIds: [],
            managedTeamIds: [],
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          unsubscribe = subscribeToTasksOptimized(tempUser, (tasks) => {
            set({ tasks });
          }, currentFilter);
        } else {
          // 新版調用方式 - 直接使用 User 物件
          unsubscribe = subscribeToTasksOptimized(userOrUserId, (tasks) => {
            set({ tasks });
          }, currentFilter);
        }
        
        set({ unsubscribe });
      },
      
      // 取消訂閱
      unsubscribeFromTasks: () => {
        const unsubscribe = get().unsubscribe;
        if (unsubscribe) {
          unsubscribe();
          set({ unsubscribe: null });
        }
      },
      
      // 獲取任務統計（支援向後相容）
      fetchTaskStats: async (userOrUserId: User | string, teamId?: string) => {
        try {
          let stats: TaskStats;
          
          if (typeof userOrUserId === 'string') {
            // 舊版調用方式 - 創建臨時 User 物件
            const tempUser: User = {
              id: userOrUserId,
              email: '',
              name: '',
              role: 'salesperson',
              organizationId: '',
              teamIds: teamId ? [teamId] : [],
              managedTeamIds: [],
              createdAt: new Date(),
              updatedAt: new Date()
            };
            
            stats = await getTaskStats(tempUser, teamId);
          } else {
            // 新版調用方式 - 直接使用 User 物件
            stats = await getTaskStats(userOrUserId, teamId);
          }
          
          set({ taskStats: stats });
        } catch (error) {
          console.error('獲取任務統計失敗:', error);
        }
      },
      
      // 獲取客戶相關任務（支援向後相容）
      fetchCustomerTasks: async (customerId: string, userOrUserId: User | string, includeCompleted: boolean = false) => {
        set({ isLoading: true, error: null });
        
        try {
          let tasks: TaskDoc[];
          
          if (typeof userOrUserId === 'string') {
            // 舊版調用方式 - 創建臨時 User 物件
            const tempUser: User = {
              id: userOrUserId,
              email: '',
              name: '',
              role: 'salesperson',
              organizationId: '',
              teamIds: [],
              managedTeamIds: [],
              createdAt: new Date(),
              updatedAt: new Date()
            };
            
            tasks = await getTasksByCustomerOptimized(customerId, tempUser, includeCompleted);
          } else {
            // 新版調用方式 - 直接使用 User 物件
            tasks = await getTasksByCustomerOptimized(customerId, userOrUserId, includeCompleted);
          }
          
          set({ tasks, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '獲取客戶任務失敗',
            isLoading: false 
          });
        }
      },
      
      // 從 AI 建立任務
      createTasksFromAI: async (
        recordId: string,
        actionItems: string[],
        assigneeId: string,
        teamId: string,
        organizationId: string,
        customerIds?: string[]
      ) => {
        set({ isLoading: true, error: null });
        
        try {
          const newTasks = await createTasksFromAIActions(
            recordId,
            actionItems,
            assigneeId,
            teamId,
            organizationId,
            customerIds
          );
          
          set(state => ({
            tasks: [...newTasks, ...state.tasks],
            isLoading: false
          }));
          
          return newTasks;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '從 AI 建立任務失敗',
            isLoading: false 
          });
          throw error;
        }
      },
      
      // 設定過濾條件
      setFilter: (filter) => {
        set(state => ({
          filter: { ...state.filter, ...filter }
        }));
      },
      
      // 清除過濾條件
      clearFilter: () => {
        set({ filter: {} });
      },
      
      // 設定選中的任務
      setSelectedTask: (task) => {
        set({ selectedTask: task });
      },
      
      // 清除錯誤
      clearError: () => {
        set({ error: null });
      },
      
      // 重置狀態
      reset: () => {
        const unsubscribe = get().unsubscribe;
        if (unsubscribe) {
          unsubscribe();
        }
        set(initialState);
      }
    }),
    {
      name: 'task-store'
    }
  )
);