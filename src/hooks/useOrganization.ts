/**
 * 組織管理 Hook
 * 提供當前組織和團隊資訊
 */

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, getDocs, collection, query, where, onSnapshot } from 'firebase/firestore';
import { getFirebaseDb, getFirebaseAuth } from '@/services/firebase/config';
import { useAuth } from './useAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Organization {
  id: string;
  name: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
  ownerId: string;
  settings?: {
    defaultLanguage?: string;
    timezone?: string;
    features?: string[];
  };
}

export interface Team {
  id: string;
  name: string;
  organizationId: string;
  description?: string;
  memberCount?: number;
  leaderId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrganizationState {
  currentOrganization: Organization | null;
  currentTeam: Team | null;
  organizations: Organization[];
  teams: Team[];
  loading: boolean;
  error: Error | null;
  switchOrganization: (organizationId: string) => Promise<void>;
  switchTeam: (teamId: string) => Promise<void>;
  refreshOrganizations: () => Promise<void>;
  createOrganization: (data: Partial<Organization>) => Promise<Organization>;
  updateOrganization: (id: string, data: Partial<Organization>) => Promise<void>;
}

const CACHE_KEY_ORGANIZATION = '@donnaai/current_organization';
const CACHE_KEY_TEAM = '@donnaai/current_team';

export function useOrganization(): OrganizationState {
  const { userProfile } = useAuth();
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // 從快取載入組織和團隊
  const loadFromCache = async () => {
    try {
      const [cachedOrgId, cachedTeamId] = await Promise.all([
        AsyncStorage.getItem(CACHE_KEY_ORGANIZATION),
        AsyncStorage.getItem(CACHE_KEY_TEAM)
      ]);
      
      return { cachedOrgId, cachedTeamId };
    } catch (error) {
      console.error('Error loading from cache:', error);
      return { cachedOrgId: null, cachedTeamId: null };
    }
  };

  // 儲存到快取
  const saveToCache = async (organizationId: string | null, teamId: string | null) => {
    try {
      const promises = [];
      
      if (organizationId) {
        promises.push(AsyncStorage.setItem(CACHE_KEY_ORGANIZATION, organizationId));
      } else {
        promises.push(AsyncStorage.removeItem(CACHE_KEY_ORGANIZATION));
      }
      
      if (teamId) {
        promises.push(AsyncStorage.setItem(CACHE_KEY_TEAM, teamId));
      } else {
        promises.push(AsyncStorage.removeItem(CACHE_KEY_TEAM));
      }
      
      await Promise.all(promises);
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  };

  // 獲取組織詳細資料
  const fetchOrganization = async (organizationId: string): Promise<Organization | null> => {
    try {
      const db = getFirebaseDb();
      const orgDoc = await getDoc(doc(db, 'organizations', organizationId));
      
      if (orgDoc.exists()) {
        return {
          id: orgDoc.id,
          ...orgDoc.data()
        } as Organization;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching organization:', error);
      throw error;
    }
  };

  // 獲取團隊詳細資料
  const fetchTeam = async (teamId: string): Promise<Team | null> => {
    try {
      const db = getFirebaseDb();
      const teamDoc = await getDoc(doc(db, 'teams', teamId));
      
      if (teamDoc.exists()) {
        return {
          id: teamDoc.id,
          ...teamDoc.data()
        } as Team;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching team:', error);
      throw error;
    }
  };

  // 獲取用戶的所有組織
  const fetchUserOrganizations = async (userId: string): Promise<Organization[]> => {
    try {
      const auth = getFirebaseAuth();
      
      // 檢查用戶是否已登入
      if (!auth.currentUser) {
        console.log('User not authenticated, skipping organization fetch');
        return [];
      }
      
      const db = getFirebaseDb();
      
      // 先獲取使用者文檔以取得 organizationId
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) {
        console.log('User document not found:', userId);
        return [];
      }
      
      const userData = userDoc.data();
      const organizationId = userData?.organizationId;
      
      if (!organizationId) {
        console.log('User has no organization assigned:', userId);
        return [];
      }
      
      // 獲取使用者的組織
      const organization = await fetchOrganization(organizationId);
      
      if (organization) {
        return [organization];
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching user organizations:', error);
      return []; // 返回空陣列而不是拋出錯誤
    }
  };

  // 獲取組織的所有團隊
  const fetchOrganizationTeams = async (organizationId: string): Promise<Team[]> => {
    try {
      const auth = getFirebaseAuth();
      
      // 檢查用戶是否已登入
      if (!auth.currentUser) {
        console.log('User not authenticated, skipping teams fetch');
        return [];
      }
      
      const db = getFirebaseDb();
      const teamsQuery = query(
        collection(db, 'teams'),
        where('organizationId', '==', organizationId)
      );
      
      const snapshot = await getDocs(teamsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Team));
    } catch (error) {
      console.error('Error fetching organization teams:', error);
      return []; // 返回空陣列而不是拋出錯誤
    }
  };

  // 切換組織
  const switchOrganization = useCallback(async (organizationId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const [organization, orgTeams] = await Promise.all([
        fetchOrganization(organizationId),
        fetchOrganizationTeams(organizationId)
      ]);
      
      if (organization) {
        setCurrentOrganization(organization);
        setTeams(orgTeams);
        
        // 自動選擇第一個團隊
        if (orgTeams.length > 0) {
          setCurrentTeam(orgTeams[0]);
          await saveToCache(organizationId, orgTeams[0].id);
        } else {
          setCurrentTeam(null);
          await saveToCache(organizationId, null);
        }
      }
    } catch (error) {
      setError(error as Error);
      console.error('Error switching organization:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 切換團隊
  const switchTeam = useCallback(async (teamId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const team = await fetchTeam(teamId);
      
      if (team && currentOrganization) {
        setCurrentTeam(team);
        await saveToCache(currentOrganization.id, teamId);
      }
    } catch (error) {
      setError(error as Error);
      console.error('Error switching team:', error);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization]);

  // 刷新組織列表
  const refreshOrganizations = useCallback(async () => {
    if (!userProfile) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const userOrgs = await fetchUserOrganizations(userProfile.id);
      setOrganizations(userOrgs);
    } catch (error) {
      setError(error as Error);
      console.error('Error refreshing organizations:', error);
    } finally {
      setLoading(false);
    }
  }, [userProfile]);

  // 創建新組織
  const createOrganization = useCallback(async (data: Partial<Organization>): Promise<Organization> => {
    if (!userProfile) throw new Error('No authenticated user');
    
    try {
      const db = getFirebaseDb();
      
      // TODO: 實作創建組織的邏輯
      // 這需要整合組織服務
      
      throw new Error('Not implemented');
    } catch (error) {
      console.error('Error creating organization:', error);
      throw error;
    }
  }, [userProfile]);

  // 更新組織
  const updateOrganization = useCallback(async (id: string, data: Partial<Organization>) => {
    try {
      const db = getFirebaseDb();
      
      // TODO: 實作更新組織的邏輯
      // 這需要整合組織服務
      
      throw new Error('Not implemented');
    } catch (error) {
      console.error('Error updating organization:', error);
      throw error;
    }
  }, []);

  // 初始化載入
  useEffect(() => {
    if (!userProfile) {
      setCurrentOrganization(null);
      setCurrentTeam(null);
      setOrganizations([]);
      setTeams([]);
      setLoading(false);
      return;
    }

    const loadOrganizationData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // 檢查是否已登入
        const auth = getFirebaseAuth();
        if (!auth.currentUser) {
          console.log('User not authenticated, skipping organization data load');
          setLoading(false);
          return;
        }
        
        // 載入快取
        const { cachedOrgId, cachedTeamId } = await loadFromCache();
        
        // 獲取用戶的所有組織
        const userOrgs = await fetchUserOrganizations(userProfile.id);
        setOrganizations(userOrgs);
        
        // 確定當前組織
        let currentOrgId = cachedOrgId || userProfile.organizationId;
        let organization: Organization | null = null;
        
        if (currentOrgId) {
          organization = userOrgs.find(org => org.id === currentOrgId) || null;
        }
        
        // 如果沒有找到，使用第一個組織
        if (!organization && userOrgs.length > 0) {
          organization = userOrgs[0];
          currentOrgId = organization.id;
        }
        
        if (organization) {
          setCurrentOrganization(organization);
          
          // 獲取組織的團隊
          const orgTeams = await fetchOrganizationTeams(organization.id);
          setTeams(orgTeams);
          
          // 確定當前團隊
          let currentTeamId = cachedTeamId || userProfile.teamId;
          let team: Team | null = null;
          
          if (currentTeamId) {
            team = orgTeams.find(t => t.id === currentTeamId) || null;
          }
          
          // 如果沒有找到，使用第一個團隊
          if (!team && orgTeams.length > 0) {
            team = orgTeams[0];
            currentTeamId = team.id;
          }
          
          if (team) {
            setCurrentTeam(team);
          }
          
          // 更新快取
          await saveToCache(organization.id, team?.id || null);
        }
      } catch (error) {
        setError(error as Error);
        console.error('Error loading organization data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrganizationData();
  }, [userProfile]);

  // 監聽組織變更
  useEffect(() => {
    if (!currentOrganization) return;
    
    const db = getFirebaseDb();
    const unsubscribe = onSnapshot(
      doc(db, 'organizations', currentOrganization.id),
      (doc) => {
        if (doc.exists()) {
          setCurrentOrganization({
            id: doc.id,
            ...doc.data()
          } as Organization);
        }
      },
      (error) => {
        console.error('Error listening to organization changes:', error);
      }
    );
    
    return unsubscribe;
  }, [currentOrganization?.id]);

  return {
    currentOrganization,
    currentTeam,
    organizations,
    teams,
    loading,
    error,
    switchOrganization,
    switchTeam,
    refreshOrganizations,
    createOrganization,
    updateOrganization
  };
}