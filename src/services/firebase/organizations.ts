/**
 * 組織管理服務
 * 提供組織的 CRUD 操作和相關功能
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { getFirebaseDb } from './config';
import { Organization } from '@/types/user';
import { OrganizationDetails, EnterpriseConfig } from '@/types/admin';
import { logOperation, logError } from '@/utils/logger';

// 建立新組織
export async function createOrganization(
  data: Omit<Organization, 'id' | 'createdAt'>,
  createdBy: string
): Promise<Organization> {
  try {
    const db = getFirebaseDb();
    const orgRef = doc(collection(db, 'organizations'));
    
    const orgData = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy,
      status: 'active' as const,
    };

    await setDoc(orgRef, orgData);

    logOperation('create_organization', {
      organizationId: orgRef.id,
      name: data.name,
      plan: data.subscriptionPlan,
    });

    return {
      id: orgRef.id,
      ...data,
      createdAt: new Date(),
    };
  } catch (error) {
    logError('createOrganization', error as Error);
    throw error;
  }
}

// 取得單一組織詳情
export async function getOrganization(orgId: string): Promise<OrganizationDetails | null> {
  try {
    const db = getFirebaseDb();
    const orgDoc = await getDoc(doc(db, 'organizations', orgId));
    
    if (!orgDoc.exists()) {
      return null;
    }

    const orgData = orgDoc.data();
    
    // 取得相關統計資料
    const [userCount, teamCount] = await Promise.all([
      getUserCount(orgId),
      getTeamCount(orgId),
    ]);

    // 取得企業配置
    const configDoc = await getEnterpriseConfig(orgId);

    return {
      id: orgDoc.id,
      name: orgData.name,
      subscriptionPlan: orgData.subscriptionPlan,
      aiMinutesQuota: orgData.aiMinutesQuota,
      aiMinutesUsed: orgData.aiMinutesUsed,
      userCount,
      activeUserCount: userCount, // TODO: 實作活躍用戶統計
      teamCount,
      dataVolume: {
        customers: 0, // TODO: 實作資料量統計
        records: 0,
        tasks: 0,
      },
      createdAt: orgData.createdAt,
      lastActivityAt: orgData.lastActivityAt,
      config: configDoc || undefined,
    };
  } catch (error) {
    logError('getOrganization', error as Error);
    throw error;
  }
}

// 取得所有組織（僅 Super Admin 使用）
export async function getAllOrganizations(
  limitCount: number = 50,
  startAfter?: string
): Promise<Organization[]> {
  try {
    const db = getFirebaseDb();
    let q = query(
      collection(db, 'organizations'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
    })) as Organization[];
  } catch (error) {
    logError('getAllOrganizations', error as Error);
    throw error;
  }
}

// 更新組織資料
export async function updateOrganization(
  orgId: string,
  data: Partial<Organization>
): Promise<void> {
  try {
    const db = getFirebaseDb();
    const orgRef = doc(db, 'organizations', orgId);
    
    await updateDoc(orgRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });

    logOperation('update_organization', {
      organizationId: orgId,
      updatedFields: Object.keys(data),
    });
  } catch (error) {
    logError('updateOrganization', error as Error);
    throw error;
  }
}

// 刪除組織（軟刪除）
export async function deleteOrganization(orgId: string): Promise<void> {
  try {
    const db = getFirebaseDb();
    const orgRef = doc(db, 'organizations', orgId);
    
    // 軟刪除：只更新狀態
    await updateDoc(orgRef, {
      status: 'cancelled',
      updatedAt: serverTimestamp(),
    });

    logOperation('delete_organization', {
      organizationId: orgId,
    });
  } catch (error) {
    logError('deleteOrganization', error as Error);
    throw error;
  }
}

// 取得企業配置
export async function getEnterpriseConfig(orgId: string): Promise<EnterpriseConfig | null> {
  try {
    const db = getFirebaseDb();
    const configQuery = query(
      collection(db, 'enterprise_configs'),
      where('organizationId', '==', orgId)
    );
    
    const snapshot = await getDocs(configQuery);
    
    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as EnterpriseConfig;
  } catch (error) {
    logError('getEnterpriseConfig', error as Error);
    throw error;
  }
}

// 建立或更新企業配置
export async function saveEnterpriseConfig(
  config: Omit<EnterpriseConfig, 'id' | 'createdAt' | 'updatedAt'>,
  configId?: string
): Promise<EnterpriseConfig> {
  try {
    const db = getFirebaseDb();
    const configRef = configId
      ? doc(db, 'enterprise_configs', configId)
      : doc(collection(db, 'enterprise_configs'));

    const configData = {
      ...config,
      updatedAt: serverTimestamp(),
      ...(configId ? {} : { createdAt: serverTimestamp() }),
    };

    await setDoc(configRef, configData, { merge: configId !== undefined });

    return {
      id: configRef.id,
      ...config,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error) {
    logError('saveEnterpriseConfig', error as Error);
    throw error;
  }
}

// 取得用戶數量
async function getUserCount(orgId: string): Promise<number> {
  try {
    const db = getFirebaseDb();
    const usersQuery = query(
      collection(db, 'users'),
      where('organizationId', '==', orgId)
    );
    
    const snapshot = await getDocs(usersQuery);
    return snapshot.size;
  } catch (error) {
    logError('getUserCount', error as Error);
    return 0;
  }
}

// 取得團隊數量
async function getTeamCount(orgId: string): Promise<number> {
  try {
    const db = getFirebaseDb();
    const teamsQuery = query(
      collection(db, 'teams'),
      where('organizationId', '==', orgId)
    );
    
    const snapshot = await getDocs(teamsQuery);
    return snapshot.size;
  } catch (error) {
    logError('getTeamCount', error as Error);
    return 0;
  }
}

// 批量建立組織和初始用戶
export async function createOrganizationWithAdmin(
  orgData: Omit<Organization, 'id' | 'createdAt'>,
  adminUserData: {
    email: string;
    name: string;
    uid: string;
  },
  config?: Omit<EnterpriseConfig, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>
): Promise<{
  organization: Organization;
  adminUser: any;
  config?: EnterpriseConfig;
}> {
  try {
    const db = getFirebaseDb();
    const batch = writeBatch(db);

    // 1. 建立組織
    const orgRef = doc(collection(db, 'organizations'));
    const organization = {
      ...orgData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: adminUserData.uid,
      status: 'active' as const,
    };
    batch.set(orgRef, organization);

    // 2. 建立管理員用戶
    const userRef = doc(db, 'users', adminUserData.uid);
    const userData = {
      id: adminUserData.uid,
      email: adminUserData.email,
      name: adminUserData.name,
      role: 'admin' as const,
      organizationId: orgRef.id,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    };
    batch.set(userRef, userData);

    // 3. 建立企業配置（如果提供）
    let enterpriseConfig;
    if (config) {
      const configRef = doc(collection(db, 'enterprise_configs'));
      enterpriseConfig = {
        ...config,
        organizationId: orgRef.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: adminUserData.uid,
      };
      batch.set(configRef, enterpriseConfig);
    }

    // 執行批量操作
    await batch.commit();

    logOperation('create_organization_with_admin', {
      organizationId: orgRef.id,
      adminEmail: adminUserData.email,
    });

    return {
      organization: {
        id: orgRef.id,
        ...orgData,
        createdAt: new Date(),
      },
      adminUser: userData,
      config: enterpriseConfig ? {
        id: orgRef.id,
        ...config,
        organizationId: orgRef.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: adminUserData.uid,
      } : undefined,
    };
  } catch (error) {
    logError('createOrganizationWithAdmin', error as Error);
    throw error;
  }
}