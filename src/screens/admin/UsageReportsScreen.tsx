/**
 * 使用報表頁面（Enterprise Admin）
 * 檢視組織使用情況和統計
 */

import React from 'react';
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder';

export const UsageReportsScreen: React.FC = () => {
  return (
    <AdminPlaceholder
      title="使用報表"
      description="檢視組織使用情況和統計報表"
      icon="bar-chart-outline"
    />
  );
};