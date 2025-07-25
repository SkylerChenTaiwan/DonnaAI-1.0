/**
 * 計費相關型別定義
 * 包含計費記錄、工具使用統計等
 */

import { Timestamp } from 'firebase/firestore';

// 計費記錄
export interface BillingRecord {
  id: string;
  organizationId: string;
  period: string; // YYYY-MM
  
  // 使用統計
  activeUsers: number;
  giftedSeats: number;
  billableUsers: number; // activeUsers - giftedSeats
  
  // 工具使用統計
  toolUsage: ToolUsageItem[];
  
  // 計費資訊
  unitPrice: number; // 每用戶單價
  totalAmount: number; // 總金額
  currency?: string; // 貨幣，預設 NTD
  
  // 狀態
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  
  // 時間戳記
  createdAt: Date | Timestamp;
  paidAt?: Date | Timestamp;
  dueDate?: Date | Timestamp;
}

// 工具使用項目
export interface ToolUsageItem {
  toolId: string;
  toolName: string;
  activeUsers: number;
  usageCount?: number; // 使用次數
}

// 工具使用統計
export interface ToolUsageStats {
  organizationId: string;
  toolId: string;
  toolName: string;
  period: string; // YYYY-MM
  
  // 統計數據
  uniqueUsers: Set<string> | string[]; // 唯一用戶
  totalUsage: number; // 總使用次數
  
  // 詳細統計（按日）
  dailyStats?: {
    date: string; // YYYY-MM-DD
    users: number;
    usage: number;
  }[];
  
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

// 用戶活動摘要
export interface UserActivitySummary {
  userId: string;
  organizationId: string;
  period: string; // YYYY-MM
  
  // 活動統計
  loginDays: number; // 登入天數
  lastActiveAt: Date | Timestamp;
  
  // 工具使用
  toolsUsed: {
    toolId: string;
    toolName: string;
    usageCount: number;
  }[];
  
  // AI 使用
  aiMinutesUsed?: number;
  
  // 資料操作
  recordsCreated?: number;
  recordsUpdated?: number;
  tasksCompleted?: number;
}

// 計費設定
export interface BillingConfig {
  pricePerUser: number; // 每用戶單價
  currency: string; // 貨幣
  trialDays: number; // 試用天數
  billingCycles: ('monthly' | 'yearly')[];
  
  // 折扣設定
  yearlyDiscount?: number; // 年付折扣百分比
  volumeDiscounts?: {
    minUsers: number;
    discount: number; // 折扣百分比
  }[];
}

// 使用報告
export interface UsageReport {
  organizationId: string;
  period: string; // YYYY-MM
  generatedAt: Date | Timestamp;
  
  // 摘要
  summary: {
    activeUsers: number;
    billableUsers: number;
    totalAmount: number;
    currency: string;
  };
  
  // 詳細資料
  userDetails: UserActivitySummary[];
  toolUsageDetails: ToolUsageStats[];
  
  // 比較資料（與上月）
  comparison?: {
    userGrowth: number; // 百分比
    usageGrowth: number; // 百分比
    amountGrowth: number; // 百分比
  };
}

// 匯入結果
export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: string[];
  warnings?: string[];
  
  // 詳細記錄
  details?: {
    rowNumber: number;
    status: 'success' | 'failed' | 'skipped';
    message?: string;
  }[];
}

// 欄位映射
export interface FieldMapping {
  sourceField: string; // CSV/Excel 欄位名
  targetField: string; // 系統欄位名
  transform?: 'none' | 'uppercase' | 'lowercase' | 'date' | 'phone'; // 轉換方式
  defaultValue?: any; // 預設值
}