/**
 * 組織實體統一定義
 * 這是 Organization 介面的單一真實來源
 */

import { Timestamp } from 'firebase/firestore';

// 基礎組織介面
export interface BaseOrganization {
  id: string;
  name: string;
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

// 組織設定
export interface OrganizationSettings {
  defaultLanguage?: string;
  timezone?: string;
  features?: string[];
}

// 組織統計資訊
export interface OrganizationStats {
  totalUsers: number;
  activeUsers?: number;
  totalTeams?: number;
  totalRecords?: number;
  totalTasks?: number;
  totalCustomers?: number;
  activeProjects?: number;
  storageUsed?: number; // in MB
}

// 完整的組織介面
export interface Organization extends BaseOrganization {
  // 基本資訊
  description?: string;
  ownerId: string;
  
  // 訂閱與配額
  subscriptionPlan: 'trial' | 'basic' | 'professional' | 'enterprise';
  aiMinutesQuota: number; // 每月 AI 處理分鐘數
  aiMinutesUsed: number;
  
  // 狀態與限制
  status?: 'active' | 'suspended' | 'cancelled' | 'expired';
  maxUsers?: number; // 最大用戶數限制
  
  // 聯絡資訊
  domain?: string; // 企業網域
  contactEmail?: string; // 主要聯絡信箱
  
  // 設定與統計
  settings?: OrganizationSettings;
  stats?: OrganizationStats;
}

// 組織建立資料（用於建立新組織時）
export interface CreateOrganizationData {
  name: string;
  description?: string;
  ownerId: string;
  subscriptionPlan?: 'trial' | 'basic' | 'professional' | 'enterprise';
  settings?: OrganizationSettings;
}

// 組織更新資料（用於更新組織時）
export interface UpdateOrganizationData {
  name?: string;
  description?: string;
  status?: 'active' | 'suspended' | 'cancelled' | 'expired';
  maxUsers?: number;
  domain?: string;
  contactEmail?: string;
  settings?: OrganizationSettings;
}

// 類型防護函式
export function isOrganization(obj: any): obj is Organization {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.ownerId === 'string' &&
    ['trial', 'basic', 'professional', 'enterprise'].includes(obj.subscriptionPlan) &&
    typeof obj.aiMinutesQuota === 'number' &&
    typeof obj.aiMinutesUsed === 'number'
  );
}