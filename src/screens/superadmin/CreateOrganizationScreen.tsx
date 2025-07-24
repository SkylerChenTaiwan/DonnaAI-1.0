/**
 * 新增組織頁面（Super Admin）
 * 建立新組織和設定管理員
 */

import React from 'react';
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder';

export const CreateOrganizationScreen: React.FC = () => {
  return (
    <AdminPlaceholder
      title="建立新組織"
      description="為新客戶建立組織並設定管理員"
      icon="business-outline"
    />
  );
};