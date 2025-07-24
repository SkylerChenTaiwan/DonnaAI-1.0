/**
 * 工具管理頁面（Enterprise Admin）
 * 管理組織可用的工具和功能
 */

import React from 'react';
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder';

export const ToolManagementScreen: React.FC = () => {
  return (
    <AdminPlaceholder
      title="工具管理"
      description="管理組織可用的工具和功能設定"
      icon="construct-outline"
    />
  );
};