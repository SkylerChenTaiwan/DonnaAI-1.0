/**
 * 組織管理 Hook
 * 提供當前組織和團隊資訊
 */

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export interface Organization {
  id: string;
  name: string;
  // 其他組織欄位...
}

export interface Team {
  id: string;
  name: string;
  organizationId: string;
  // 其他團隊欄位...
}

export interface OrganizationState {
  currentOrganization: Organization | null;
  currentTeam: Team | null;
  loading: boolean;
}

export function useOrganization(): OrganizationState {
  const { user } = useAuth();
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCurrentOrganization(null);
      setCurrentTeam(null);
      setLoading(false);
      return;
    }

    // TODO: 實作從 Firebase 獲取使用者的組織和團隊資訊
    // 暫時使用模擬數據
    const mockOrganization: Organization = {
      id: 'org_1',
      name: '示例組織',
    };

    const mockTeam: Team = {
      id: 'team_1',
      name: '示例團隊',
      organizationId: 'org_1',
    };

    setCurrentOrganization(mockOrganization);
    setCurrentTeam(mockTeam);
    setLoading(false);
  }, [user]);

  return {
    currentOrganization,
    currentTeam,
    loading,
  };
}