/**
 * 管理員設定頁面
 * 管理員個人設定和偏好
 */

import React from 'react';
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder';

export const AdminSettings: React.FC = () => {
  return (
    <AdminPlaceholder
      title="管理員設定"
      description="管理個人設定和偏好"
      icon="settings-outline"
    />
  );
};