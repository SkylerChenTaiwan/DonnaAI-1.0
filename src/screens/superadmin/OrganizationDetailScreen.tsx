/**
 * 組織詳情頁面（Super Admin）
 * 檢視和編輯組織設定
 */

import React from 'react';
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder';

export const OrganizationDetailScreen: React.FC = () => {
  return (
    <AdminPlaceholder
      title="組織詳情"
      description="檢視和管理組織詳細設定"
      icon="settings-outline"
    />
  );
};