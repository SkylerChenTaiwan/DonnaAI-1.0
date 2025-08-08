/**
 * 批量匯入用戶 Modal
 * 整合智能欄位映射的用戶匯入精靈
 */

import React from 'react';
import { Organization } from '@/types/entities';
import UserImportWizard from '@/components/users/UserImportWizard';

interface BulkImportUsersModalProps {
  visible: boolean;
  organization: Organization;
  onClose: () => void;
  onImportComplete?: (result: any) => void;
  useIntelligentMapping?: boolean;
  openAIKey?: string;
}

/**
 * 批量匯入用戶 Modal
 * 使用新的智能用戶匯入精靈
 */
export const BulkImportUsersModal: React.FC<BulkImportUsersModalProps> = ({
  visible,
  organization,
  onClose,
  onImportComplete,
  useIntelligentMapping = true,
  openAIKey,
}) => {
  // 直接使用 UserImportWizard，它包含了所有功能
  return (
    <UserImportWizard
      visible={visible}
      organization={organization}
      onClose={onClose}
      onImportComplete={onImportComplete}
      useIntelligentMapping={useIntelligentMapping}
      openAIKey={openAIKey}
    />
  );
};