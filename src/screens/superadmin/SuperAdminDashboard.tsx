/**
 * Super Admin 控制台首頁
 * 平台總覽和管理功能
 */

import React from 'react';
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder';

export const SuperAdminDashboard: React.FC = () => {
  return (
    <AdminPlaceholder
      title="Super Admin 控制台"
      description="平台總覽和管理功能"
      icon="shield-checkmark-outline"
    />
  );
};