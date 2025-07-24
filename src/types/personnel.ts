// 人事管理相關類型定義

import { User } from './user';

// 增強的使用者類型，包含人事管理所需的額外資訊
export interface EnhancedUser extends User {
  // 使用狀態
  isOnline?: boolean;
  lastActiveAt?: Date;
  activityStats?: {
    dailyLogins: number[];    // 30天登入記錄
    totalActions: number;     // 總操作次數
    lastActions: string[];    // 最近操作記錄
  };
  
  // 組織結構
  reportingTo?: string;       // 直屬主管 ID
  subordinates?: string[];    // 下屬 ID 列表
  level?: number;            // 組織層級
  
  // 詳細權限
  permissions?: {
    modules: string[];        // 可訪問模組
    actions: string[];        // 可執行動作
    dataAccess: 'own' | 'team' | 'organization';
    customPermissions?: Record<string, boolean>;
  };
}

// 活動類型
export type ActivityType = 'login' | 'action' | 'update' | 'create' | 'delete' | 'view';

// 活動記錄
export interface ActivityRecord {
  userId: string;
  type: ActivityType;
  timestamp: Date;
  details?: string;
  module?: string;
  targetId?: string;
}

// 權限等級
export type PermissionLevel = 'viewer' | 'editor' | 'manager' | 'admin' | 'super_admin';

// 權限範本
export interface PermissionTemplate {
  id: string;
  name: string;
  level: PermissionLevel;
  modules: string[];
  actions: string[];
  dataAccess: 'own' | 'team' | 'organization';
  description?: string;
}