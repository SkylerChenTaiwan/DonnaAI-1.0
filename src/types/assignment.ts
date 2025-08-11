/**
 * 資料分配系統類型定義
 * 用於 CSV 匯入時的資料所有權分配
 */

import { Timestamp } from 'firebase/firestore';
import { DatabaseType } from './import';
import { UserRole } from './user';

/**
 * 分配策略類型
 */
export type AssignmentStrategy = 
  | 'single_user'      // 全部分配給單一用戶
  | 'round_robin'      // 輪流分配
  | 'csv_column'       // CSV 中指定負責人欄位
  | 'department_rule'  // 按部門規則分配
  | 'manual_mapping';  // 手動對應分配

/**
 * 部門分配規則
 */
export interface DepartmentAssignmentRule {
  departmentId: string;
  departmentName: string;
  assigneeId: string;
  assigneeName: string;
  priority: number;  // 優先級，數字越小優先級越高
  conditions?: {
    fieldName: string;
    operator: 'equals' | 'contains' | 'startsWith' | 'endsWith';
    value: string;
  }[];
}

/**
 * 匯入資料分配配置
 */
export interface ImportAssignmentConfig {
  strategy: AssignmentStrategy;
  assigneeId?: string;                              // 單一分配時使用
  assigneeIds?: string[];                           // 輪流分配時使用
  csvColumn?: string;                               // CSV 欄位名稱
  assigneeMapping?: Map<string, string>;            // CSV 值到用戶 ID 的映射
  defaultAssignee?: string;                         // 無法分配時的預設用戶
  departmentRules?: DepartmentAssignmentRule[];     // 部門規則
  skipUnassigned?: boolean;                         // 是否跳過無法分配的資料
  matchingStrategy?: 'exact' | 'fuzzy' | 'smart';   // 匹配策略
}

/**
 * 分配預覽項目
 */
export interface AssignmentPreviewItem {
  rowIndex: number;
  rowData: Record<string, any>;
  assignedTo?: string;
  assigneeName?: string;
  matchConfidence?: number;  // 0-100 匹配信心度
  matchReason?: string;       // 匹配原因說明
  error?: string;             // 分配錯誤訊息
}

/**
 * 分配預覽統計
 */
export interface AssignmentPreview {
  userId: string;
  userName: string;
  userEmail?: string;
  department?: string;
  assignedCount: number;
  assignedItems: AssignmentPreviewItem[];
  workloadPercentage: number;  // 工作負載百分比
}

/**
 * 分配結果
 */
export interface AssignmentResult {
  assigneeId: string;
  assigneeName?: string;
  teamId?: string;
  department?: string;
  matchConfidence?: number;
  matchedBy?: 'email' | 'name' | 'employeeId' | 'csvColumn' | 'rule' | 'default';
}

/**
 * 分配歷史記錄
 */
export interface AssignmentHistory {
  id: string;
  importSessionId: string;       // 匯入會話 ID
  assignerId: string;             // 執行分配的管理員
  assignerName?: string;
  assigneeId: string;             // 被分配的用戶
  assigneeName?: string;
  dataType: DatabaseType;
  dataCount: number;
  assignedAt: Timestamp;
  organizationId: string;
  strategy: AssignmentStrategy;
  configSnapshot?: ImportAssignmentConfig;  // 配置快照
  successRate?: number;           // 成功率
  errors?: string[];               // 錯誤訊息
}

/**
 * 用戶匹配結果
 */
export interface UserMatchResult {
  userId: string;
  userName: string;
  userEmail?: string;
  matchType: 'exact' | 'fuzzy' | 'partial';
  matchField: 'email' | 'name' | 'employeeId' | 'customField';
  confidence: number;  // 0-100
  score?: number;      // 匹配分數
}

/**
 * 分配調整
 */
export interface AssignmentAdjustment {
  rowIndex: number;
  fromUserId?: string;
  toUserId: string;
  reason?: string;
}

/**
 * 分配驗證結果
 */
export interface AssignmentValidation {
  isValid: boolean;
  errors: Array<{
    type: 'permission' | 'user_not_found' | 'quota_exceeded' | 'invalid_config';
    message: string;
    details?: any;
  }>;
  warnings: Array<{
    type: 'unbalanced' | 'no_match' | 'low_confidence';
    message: string;
    affectedRows?: number[];
  }>;
  statistics: {
    totalRows: number;
    assignableRows: number;
    unassignedRows: number;
    averageConfidence: number;
    userDistribution: Map<string, number>;
  };
}

/**
 * 可分配用戶篩選條件
 */
export interface AssignableUserFilter {
  organizationId: string;
  roles?: UserRole[];
  departments?: string[];
  teamIds?: string[];
  isActive?: boolean;
  hasPermission?: string[];
  excludeUserIds?: string[];
  searchQuery?: string;
}

/**
 * 分配任務狀態
 */
export interface AssignmentJobStatus {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;  // 0-100
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  totalRows: number;
  processedRows: number;
  successCount: number;
  errorCount: number;
  currentBatch?: number;
  totalBatches?: number;
  errors?: ImportAssignmentError[];
}

/**
 * 匯入分配錯誤
 */
export interface ImportAssignmentError {
  rowIndex: number;
  errorType: 'assignment_failed' | 'user_not_found' | 'permission_denied' | 'validation_error';
  message: string;
  details?: Record<string, any>;
  suggestedFix?: string;
}

/**
 * 分配報告
 */
export interface AssignmentReport {
  id: string;
  createdAt: Timestamp;
  createdBy: string;
  organizationId: string;
  importSessionId: string;
  summary: {
    totalImported: number;
    totalAssigned: number;
    assignmentRate: number;
    averageConfidence: number;
    topAssignees: Array<{
      userId: string;
      userName: string;
      count: number;
      percentage: number;
    }>;
    strategyUsed: AssignmentStrategy;
    duration: number;  // 毫秒
  };
  details: AssignmentHistory[];
  errors: ImportAssignmentError[];
}