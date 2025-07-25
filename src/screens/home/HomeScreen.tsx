/**
 * 統一的首頁組件
 * 根據用戶角色顯示不同的儀表板
 */

import React from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { SuperAdminDashboard } from '@/screens/superadmin/SuperAdminDashboard';
import { EnhancedDashboardV2 } from '@/screens/dashboard/EnhancedDashboardV2';

export const HomeScreen: React.FC = () => {
  const { isSuperAdmin } = useAdminAuth();
  
  // 根據角色返回對應的儀表板
  if (isSuperAdmin) {
    return <SuperAdminDashboard />;
  }
  
  return <EnhancedDashboardV2 />;
};