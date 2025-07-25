/**
 * 組織管理服務
 * 提供 Super Admin 管理組織的功能
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { getFirebaseDb } from '@/services/firebase/config';
import { Organization } from '@/types/user';

export interface OrganizationFilters {
  search?: string;
  status?: 'active' | 'inactive' | 'suspended';
  subscriptionPlan?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface CreateOrganizationData {
  name: string;
  email: string;
  plan: 'trial' | 'basic' | 'professional' | 'enterprise';
  adminEmail: string;
  adminName: string;
  seats?: number;
  customSettings?: Record<string, any>;
}

/**
 * 獲取所有組織列表
 */
export const getOrganizations = async (filters?: OrganizationFilters): Promise<Organization[]> => {
  try {
    const db = getFirebaseDb();
    const orgsRef = collection(db, 'organizations');
    let q = query(orgsRef, orderBy('createdAt', 'desc'));

    // 應用過濾條件
    if (filters?.status) {
      q = query(q, where('status', '==', filters.status));
    }

    const querySnapshot = await getDocs(q);
    const organizations: Organization[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      organizations.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Organization);
    });

    // 客戶端過濾（搜尋）
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      return organizations.filter(org => 
        org.name.toLowerCase().includes(searchLower) ||
        org.id.toLowerCase().includes(searchLower)
      );
    }

    return organizations;
  } catch (error) {
    console.error('獲取組織列表失敗:', error);
    throw error;
  }
};

/**
 * 獲取單一組織詳情
 */
export const getOrganization = async (orgId: string): Promise<Organization | null> => {
  try {
    const db = getFirebaseDb();
    const orgRef = doc(db, 'organizations', orgId);
    const orgDoc = await getDoc(orgRef);

    if (!orgDoc.exists()) {
      return null;
    }

    const data = orgDoc.data();
    return {
      id: orgDoc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    } as Organization;
  } catch (error) {
    console.error('獲取組織詳情失敗:', error);
    throw error;
  }
};

/**
 * 建立新組織
 */
export const createOrganization = async (data: CreateOrganizationData): Promise<Organization> => {
  try {
    const db = getFirebaseDb();
    const orgsRef = collection(db, 'organizations');

    const orgData = {
      name: data.name,
      status: 'active',
      subscription: {
        plan: data.plan,
        seats: data.seats || 5,
        startDate: serverTimestamp(),
        endDate: data.plan === 'trial' 
          ? Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) // 30天試用
          : null
      },
      settings: data.customSettings || {},
      stats: {
        totalUsers: 0,
        activeUsers: 0,
        totalCustomers: 0,
        totalRecords: 0,
        totalTasks: 0
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(orgsRef, orgData);
    
    // 同時建立企業配置
    const configRef = collection(db, 'enterprise_configs');
    await addDoc(configRef, {
      organizationId: docRef.id,
      enabledTools: [],
      subscriptionDetails: {
        plan: data.plan,
        startDate: serverTimestamp(),
        seats: data.seats || 5,
        aiMinutesQuota: getAIQuotaByPlan(data.plan)
      },
      customSettings: {
        allowDataImport: true,
        allowDataExport: true
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return {
      id: docRef.id,
      ...orgData,
      createdAt: new Date(),
      updatedAt: new Date()
    } as Organization;
  } catch (error) {
    console.error('建立組織失敗:', error);
    throw error;
  }
};

/**
 * 更新組織資訊
 */
export const updateOrganization = async (
  orgId: string, 
  updates: Partial<Organization>
): Promise<void> => {
  try {
    const db = getFirebaseDb();
    const orgRef = doc(db, 'organizations', orgId);

    const updateData = {
      ...updates,
      updatedAt: serverTimestamp()
    };

    // 移除不應更新的欄位
    delete updateData.id;
    delete updateData.createdAt;

    await updateDoc(orgRef, updateData);
  } catch (error) {
    console.error('更新組織失敗:', error);
    throw error;
  }
};

/**
 * 刪除組織（軟刪除）
 */
export const deleteOrganization = async (orgId: string): Promise<void> => {
  try {
    const db = getFirebaseDb();
    const orgRef = doc(db, 'organizations', orgId);

    // 軟刪除 - 只更新狀態
    await updateDoc(orgRef, {
      status: 'inactive',
      deletedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('刪除組織失敗:', error);
    throw error;
  }
};

/**
 * 更新組織統計資料
 */
export const updateOrganizationStats = async (
  orgId: string,
  stats: Partial<Organization['stats']>
): Promise<void> => {
  try {
    const db = getFirebaseDb();
    const orgRef = doc(db, 'organizations', orgId);

    const updateData: any = {
      updatedAt: serverTimestamp()
    };

    // 更新統計欄位
    Object.keys(stats).forEach(key => {
      updateData[`stats.${key}`] = stats[key as keyof typeof stats];
    });

    await updateDoc(orgRef, updateData);
  } catch (error) {
    console.error('更新組織統計失敗:', error);
    throw error;
  }
};

/**
 * 根據訂閱方案獲取 AI 配額
 */
function getAIQuotaByPlan(plan: string): number {
  switch (plan) {
    case 'trial':
      return 60; // 60分鐘
    case 'basic':
      return 300; // 5小時
    case 'professional':
      return 1200; // 20小時
    case 'enterprise':
      return -1; // 無限制
    default:
      return 60;
  }
}