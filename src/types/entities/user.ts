/**
 * 使用者實體統一定義
 * 這是 User 介面的單一真實來源
 */

import { Timestamp } from 'firebase/firestore';
import { Team } from './team';

// 使用者角色定義
export type UserRole = 'salesperson' | 'manager' | 'admin' | 'super_admin' | 'system-admin';

// 基礎使用者介面
export interface BaseUser {
  id: string;
  email: string;
  name: string;
  createdAt: Date | Timestamp;
}

// 完整的使用者介面
export interface User extends BaseUser {
  // 角色與權限
  role: UserRole;
  organizationId: string;
  teamIds?: string[]; // 可屬於多個團隊
  managedTeamIds?: string[]; // 管理的團隊
  
  // 登入資訊
  lastLoginAt?: Date | Timestamp;
  
  // CRM 相關欄位
  department?: string; // 部門
  jobTitle?: string; // 職稱
  supervisorId?: string; // 上級主管 ID
  phoneNumber?: string; // 電話號碼
  avatar?: string; // 頭像 URL
  
  // Admin 相關欄位
  isSuperAdmin?: boolean; // 是否為平台管理員
  platformPermissions?: string[]; // 平台權限（僅 super_admin）
  
  // 其他欄位
  isActive?: boolean; // 用戶是否啟用
  phone?: string; // 電話（備用欄位）
  personalGoals?: { // 個人目標
    monthly?: number;
    quarterly?: number;
    yearly?: number;
  };
}

// 帶有團隊資訊的使用者（用於顯示）
export interface UserWithTeams extends User {
  teams: Team[];
  managedTeams?: Team[];
}

// 使用者建立資料（用於建立新使用者時）
export interface CreateUserData {
  email: string;
  name: string;
  role: UserRole;
  organizationId: string;
  teamIds?: string[];
  department?: string;
  jobTitle?: string;
  supervisorId?: string;
  phoneNumber?: string;
}

// 使用者更新資料（用於更新使用者時）
export interface UpdateUserData {
  name?: string;
  role?: UserRole;
  teamIds?: string[];
  managedTeamIds?: string[];
  department?: string;
  jobTitle?: string;
  supervisorId?: string;
  phoneNumber?: string;
  avatar?: string;
  isActive?: boolean;
  personalGoals?: {
    monthly?: number;
    quarterly?: number;
    yearly?: number;
  };
}

// 類型防護函式
export function isUser(obj: any): obj is User {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.email === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.organizationId === 'string' &&
    ['salesperson', 'manager', 'admin', 'super_admin', 'system-admin'].includes(obj.role)
  );
}

// 檢查是否為系統管理員
export function isSystemAdmin(user: User): boolean {
  return user.role === 'super_admin' || user.role === 'system-admin' || user.isSuperAdmin === true;
}