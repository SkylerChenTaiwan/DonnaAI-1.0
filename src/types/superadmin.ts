// Super Admin 統計資料和平台管理相關類型定義

export interface SuperAdminStats {
  // 組織統計
  totalOrganizations: number;
  activeOrganizations: number;
  
  // 用戶統計
  totalUsers: number;
  activeUsers: number; // 過去30天內活躍的用戶
  
  // 收入統計
  monthlyRevenue: number; // 當月預估收入
  yearlyRevenue: number; // 年度預估收入
  
  // 成長統計
  organizationGrowthRate: number; // 組織月成長率（百分比）
  userGrowthRate: number; // 用戶月成長率（百分比）
  
  // 其他統計
  totalRecords: number; // 平台總記錄數
  totalAIProcessing: number; // 總AI處理次數
  
  // 更新時間
  lastUpdated: Date;
}

export interface PlatformRevenue {
  period: string; // YYYY-MM 格式
  totalRevenue: number; // 總收入
  paidOrganizations: number; // 付費組織數
  pendingPayments: number; // 待收款金額
  averageRevenuePerOrg: number; // 每組織平均收入
}

export interface OrganizationUsageStats {
  organizationId: string;
  organizationName: string;
  activeUsers: number;
  totalRecords: number;
  aiProcessingCount: number;
  monthlyBill: number;
  lastActive: Date;
}

export interface PlatformHealthMetrics {
  systemLoad: number; // 系統負載（0-100）
  apiResponseTime: number; // API平均響應時間（毫秒）
  errorRate: number; // 錯誤率（百分比）
  activeConnections: number; // 活躍連線數
}

export interface BillingCycleStats {
  cycleStart: Date;
  cycleEnd: Date;
  totalBilled: number;
  totalCollected: number;
  outstandingAmount: number;
  billingRecords: number;
}