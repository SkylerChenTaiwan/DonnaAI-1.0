/**
 * 核心使用者和組織型別定義
 */

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'salesperson' | 'manager' | 'admin';
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
}

export interface Organization {
  id: string;
  name: string;
  subscriptionPlan: 'trial' | 'basic' | 'enterprise';
  aiMinutesQuota: number; // 每月 AI 處理分鐘數
  aiMinutesUsed: number;
  createdAt: Date;
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