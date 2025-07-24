/**
 * 平台統計頁面（Super Admin）
 * 平台整體使用情況和統計
 */

import React from 'react';
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder';

export const PlatformDashboard: React.FC = () => {
  return (
    <AdminPlaceholder
      title="平台統計"
      description="查看平台整體使用情況和統計數據"
      icon="bar-chart-outline"
    />
  );
};