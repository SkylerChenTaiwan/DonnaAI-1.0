/**
 * 用戶管理頁面（Enterprise Admin）
 * 管理組織內的用戶
 */

import React from 'react';
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder';

export const UserManagementScreen: React.FC = () => {
  return (
    <AdminPlaceholder
      title="用戶管理"
      description="管理組織內的用戶帳號和權限"
      icon="people-outline"
    />
  );
};