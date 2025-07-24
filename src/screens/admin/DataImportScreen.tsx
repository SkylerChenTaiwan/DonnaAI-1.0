/**
 * 資料匯入頁面（Enterprise Admin）
 * 批量匯入客戶和記錄資料
 */

import React from 'react';
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder';

export const DataImportScreen: React.FC = () => {
  return (
    <AdminPlaceholder
      title="資料匯入"
      description="批量匯入客戶、記錄和任務資料"
      icon="cloud-upload-outline"
    />
  );
};