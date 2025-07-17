/**
 * 任務管理系統型別定義
 */

import { Timestamp } from 'firebase/firestore';
import { FirestoreDoc } from './firebase';

// 任務類型
export type TaskType = 'scheduled' | 'unscheduled' | 'pending';

// 任務優先級
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

// 任務狀態
export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled';

// 任務來源
export type TaskSource = 'manual' | 'ai_extracted' | 'calendar_sync';

// 任務文件
export interface TaskDoc extends FirestoreDoc {
  id?: string;                         // 文件 ID（從 Firestore 獲取時會有）
  title: string;                       // 任務標題
  description?: string;                // 任務描述
  type: TaskType;                      // 任務類型
  scheduledAt?: Timestamp;             // 排定時間（有指定時間的任務）
  dueDate?: Timestamp;                 // 截止日期
  priority: TaskPriority;              // 優先級
  status: TaskStatus;                  // 任務狀態
  assigneeId: string;                  // 負責人 ID
  assignerId?: string;                 // 指派人 ID
  customerIds?: string[];              // 關聯客戶 IDs
  recordId?: string;                   // 來源紀錄 ID
  googleCalendarEventId?: string;      // Google Calendar 事件 ID
  source: TaskSource;                  // 任務來源
  tags?: string[];                     // 標籤
  teamId: string;                      // 所屬團隊
  organizationId: string;              // 所屬組織
  completedAt?: Timestamp;             // 完成時間
  completedBy?: string;                // 完成者 ID
}

// 任務建立請求
export interface TaskCreateRequest {
  title: string;
  description?: string;
  type: TaskType;
  scheduledAt?: Date;
  dueDate?: Date;
  priority: TaskPriority;
  assigneeId: string;
  customerIds?: string[];
  recordId?: string;
  source: TaskSource;
  tags?: string[];
  teamId: string;
}

// 任務更新請求
export interface TaskUpdateRequest {
  title?: string;
  description?: string;
  scheduledAt?: Date | null;
  dueDate?: Date | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  assigneeId?: string;
  tags?: string[];
}

// 任務查詢過濾器
export interface TaskFilter {
  type?: TaskType | TaskType[];
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority | TaskPriority[];
  assigneeId?: string;
  assignerId?: string;
  customerIds?: string[];
  teamId?: string;
  source?: TaskSource | TaskSource[];
  dateFrom?: Date;
  dateTo?: Date;
  overdue?: boolean;
  hasSchedule?: boolean;
}

// 任務統計資料
export interface TaskStats {
  totalCount: number;
  byStatus: Record<TaskStatus, number>;
  byPriority: Record<TaskPriority, number>;
  byType: Record<TaskType, number>;
  overdueTasks: number;
  completedToday: number;
  upcomingTasks: number;
}

// Google Calendar 同步配置
export interface CalendarSyncConfig {
  enabled: boolean;
  calendarId: string;
  syncDirection: 'one-way' | 'two-way';
  syncInterval: number;                // 同步間隔（分鐘）
  lastSyncAt?: Timestamp;
}

// 批次任務操作
export interface TaskBatchOperation {
  taskIds: string[];
  operation: 'update' | 'delete' | 'assign' | 'complete';
  data?: Partial<TaskUpdateRequest>;
}

// 任務提醒設定
export interface TaskReminder {
  taskId: string;
  remindAt: Timestamp;
  reminderType: 'email' | 'push' | 'in-app';
  sent: boolean;
}