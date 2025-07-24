/**
 * Admin 管理系統類型定義
 * 包含 Super Admin（平台管理）和 Enterprise Admin（企業管理）
 */

import { User } from './user';
import { Timestamp } from 'firebase/firestore';

// Super Admin - DonnaAI 平台管理員
export interface SuperAdmin extends User {
  role: 'super_admin';
  isSuperAdmin: true;
  platformPermissions: string[];
}

// 企業配置
export interface EnterpriseConfig {
  id: string;
  organizationId: string;
  enabledTools: ToolConfig[];
  subscriptionDetails: SubscriptionDetails;
  customSettings: CustomSettings;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  createdBy: string;
}

// 訂閱詳情
export interface SubscriptionDetails {
  plan: 'trial' | 'basic' | 'professional' | 'enterprise';
  startDate: Date | Timestamp;
  endDate?: Date | Timestamp;
  seats: number;
  aiMinutesQuota: number;
  status: 'active' | 'suspended' | 'cancelled' | 'expired';
  billingCycle: 'monthly' | 'yearly';
  price?: number;
}

// 自定義設定
export interface CustomSettings {
  allowDataImport: boolean;
  allowDataExport: boolean;
  allowBulkOperations: boolean;
  maxUsersPerTeam?: number;
  customBranding?: CustomBranding;
  features?: Record<string, boolean>;
}

// 自定義品牌
export interface CustomBranding {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  companyName?: string;
}

// 工具配置
export interface ToolConfig {
  id: string;
  name: string;
  category: ToolCategory;
  enabled: boolean;
  usageLimit?: number;
  customConfig?: Record<string, any>;
  assignedTeams?: string[];
  assignedUsers?: string[];
}

// 工具類別
export type ToolCategory = 'recording' | 'analytics' | 'sales' | 'productivity' | 'communication' | 'custom';

// 使用統計
export interface UsageMetrics {
  id?: string;
  organizationId: string;
  period: 'daily' | 'weekly' | 'monthly';
  date: Date | Timestamp;
  metrics: {
    activeUsers: number;
    totalSessions: number;
    aiMinutesUsed: number;
    toolUsage: Record<string, number>;
    dataVolume: DataVolume;
    apiCalls?: number;
    storageUsed?: number; // MB
  };
  calculatedAt: Date | Timestamp;
}

// 數據量統計
export interface DataVolume {
  customers: number;
  records: number;
  tasks: number;
  meetings?: number;
  files?: number;
}

// 資料匯入任務
export interface ImportJob {
  id: string;
  organizationId: string;
  type: 'customers' | 'records' | 'tasks' | 'all';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  source: ImportSource;
  mapping?: FieldMapping;
  progress: ImportProgress;
  result?: ImportResult;
  createdBy: string;
  createdAt: Date | Timestamp;
  startedAt?: Date | Timestamp;
  completedAt?: Date | Timestamp;
}

// 匯入來源
export interface ImportSource {
  type: 'csv' | 'excel' | 'json' | 'api';
  fileName?: string;
  fileUrl?: string;
  fileSize?: number; // bytes
  rowCount?: number;
}

// 欄位映射
export interface FieldMapping {
  [sourceField: string]: {
    targetField: string;
    transform?: 'none' | 'date' | 'number' | 'boolean' | 'custom';
    defaultValue?: any;
  };
}

// 匯入進度
export interface ImportProgress {
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  percentage: number;
}

// 匯入結果
export interface ImportResult {
  totalProcessed: number;
  totalSucceeded: number;
  totalFailed: number;
  totalSkipped: number;
  errors?: ImportError[];
  duplicates?: string[];
  createdIds?: string[];
}

// 匯入錯誤
export interface ImportError {
  row: number;
  field?: string;
  value?: any;
  error: string;
  severity: 'warning' | 'error';
}

// 企業管理員權限
export interface EnterpriseAdminPermissions {
  canManageUsers: boolean;
  canManageTeams: boolean;
  canManageTools: boolean;
  canImportData: boolean;
  canExportData: boolean;
  canViewReports: boolean;
  canManageBilling: boolean;
  canCustomizeBranding: boolean;
  customPermissions?: string[];
}

// 平台統計（給 Super Admin 看的）
export interface PlatformStatistics {
  totalOrganizations: number;
  activeOrganizations: number;
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  averageRevenuePerOrg: number;
  topTools: Array<{
    toolId: string;
    toolName: string;
    usage: number;
  }>;
  growthRate: {
    organizations: number; // percentage
    users: number; // percentage
    revenue: number; // percentage
  };
  calculatedAt: Date | Timestamp;
}

// 組織詳細資訊（擴展原有的 Organization）
export interface OrganizationDetails {
  id: string;
  name: string;
  subscriptionPlan: SubscriptionDetails['plan'];
  aiMinutesQuota: number;
  aiMinutesUsed: number;
  userCount: number;
  activeUserCount: number;
  teamCount: number;
  dataVolume: DataVolume;
  createdAt: Date | Timestamp;
  lastActivityAt?: Date | Timestamp;
  config?: EnterpriseConfig;
  primaryContact?: {
    userId: string;
    name: string;
    email: string;
    phone?: string;
  };
  billingInfo?: {
    companyName?: string;
    taxId?: string;
    address?: string;
    paymentMethod?: 'credit_card' | 'invoice' | 'bank_transfer';
  };
}

// 審計日誌
export interface AuditLog {
  id: string;
  organizationId: string;
  userId: string;
  userName: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date | Timestamp;
}

// 審計動作
export type AuditAction = 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'import' 
  | 'export' 
  | 'login' 
  | 'logout' 
  | 'permission_change' 
  | 'subscription_change'
  | 'tool_enable'
  | 'tool_disable';

// Admin 頁面權限檢查
export interface AdminAccessControl {
  requireSuperAdmin?: boolean;
  requireEnterpriseAdmin?: boolean;
  requiredPermissions?: string[];
  allowedRoles?: Array<'super_admin' | 'admin' | 'manager'>;
}

// 工具使用統計
export interface ToolUsageStats {
  toolId: string;
  toolName: string;
  organizationId: string;
  period: 'daily' | 'weekly' | 'monthly';
  date: Date | Timestamp;
  metrics: {
    uniqueUsers: number;
    totalSessions: number;
    averageSessionDuration: number; // minutes
    totalActions: number;
    errorRate: number; // percentage
  };
}