/**
 * 核心使用者和組織型別定義
 */

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'salesperson' | 'manager' | 'admin' | 'super_admin';
  organizationId: string;
  teamIds?: string[]; // 可屬於多個團隊
  managedTeamIds?: string[]; // 管理的團隊
  createdAt: Date;
  lastLoginAt: Date;
  // CRM 相關欄位
  department?: string;          // 部門
  jobTitle?: string;           // 職稱
  supervisorId?: string;       // 上級主管 ID
  phoneNumber?: string;        // 電話號碼
  avatar?: string;             // 頭像 URL
  // Admin 相關欄位
  isSuperAdmin?: boolean;      // 是否為平台管理員
  platformPermissions?: string[]; // 平台權限（僅 super_admin）
}

export interface Organization {
  id: string;
  name: string;
  subscriptionPlan: 'trial' | 'basic' | 'professional' | 'enterprise';
  aiMinutesQuota: number; // 每月 AI 處理分鐘數
  aiMinutesUsed: number;
  createdAt: Date;
  updatedAt?: Date;
  // Admin 相關欄位
  status?: 'active' | 'suspended' | 'cancelled' | 'expired';
  domain?: string; // 企業網域
  contactEmail?: string; // 主要聯絡信箱
  maxUsers?: number; // 最大用戶數限制
}

export interface Team {
  id: string;
  name: string;
  organizationId: string;
  parentTeamId?: string; // 用於樹狀結構
  managerIds?: string[];
  memberIds?: string[];
}

export type UserRole = User['role'];

export interface UserWithTeams extends User {
  teams: Team[];
  managedTeams?: Team[];
}