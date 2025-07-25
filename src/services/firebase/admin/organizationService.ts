/**
 * 組織管理服務
 * 提供 Super Admin 管理組織的功能
 * 支援新的按用戶計費模式和簡化的訂閱方案
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
  Timestamp,
  runTransaction
} from 'firebase/firestore';
import { getFirebaseDb } from '@/services/firebase/config';
import { Organization, MonthlyUsage } from '@/types/entities';
import { calculateMonthlyUsage } from './billingService';
import { BILLING_CONFIG } from '@/config/billing';

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
  subscriptionPlan: 'trial' | 'pro';
  adminEmail: string;
  adminName: string;
  billingCycle?: 'monthly' | 'yearly';
  giftedSeats?: number;
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
  const db = getFirebaseDb();
  
  try {
    return await runTransaction(db, async (transaction) => {
      const orgsRef = collection(db, 'organizations');
      const docRef = doc(orgsRef);
      
      // 計算試用期結束日期
      const trialEndDate = data.subscriptionPlan === 'trial'
        ? Timestamp.fromDate(new Date(Date.now() + BILLING_CONFIG.TRIAL_DAYS * 24 * 60 * 60 * 1000))
        : undefined;
      
      const orgData = {
        name: data.name,
        email: data.email,
        status: 'active' as const,
        subscriptionPlan: data.subscriptionPlan,
        billingCycle: data.billingCycle || 'monthly',
        giftedSeats: data.giftedSeats || 0,
        trialEndDate,
        settings: data.customSettings || {},
        monthlyUsage: {
          period: new Date().toISOString().slice(0, 7), // YYYY-MM
          activeUsers: 0,
          toolUsage: {},
          calculatedAt: serverTimestamp(),
        } as MonthlyUsage,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      transaction.set(docRef, orgData);
      
      // 建立企業配置（使用新的簡化模式）
      const configRef = doc(collection(db, 'enterprise_configs'));
      transaction.set(configRef, {
        organizationId: docRef.id,
        enabledTools: getDefaultToolsByPlan(data.subscriptionPlan),
        subscriptionDetails: {
          plan: data.subscriptionPlan,
          billingCycle: data.billingCycle || 'monthly',
          startDate: serverTimestamp(),
          trialEndDate
        },
        customSettings: {
          allowDataImport: true,
          allowDataExport: true,
          allowCustomFields: data.subscriptionPlan === 'pro'
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
    });
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
 * 更新組織月度使用統計
 */
export const updateOrganizationUsage = async (
  orgId: string,
  yearMonth?: string
): Promise<void> => {
  try {
    const db = getFirebaseDb();
    const orgRef = doc(db, 'organizations', orgId);

    // 計算最新的月度使用統計
    const monthlyUsage = await calculateMonthlyUsage(orgId, yearMonth);

    await updateDoc(orgRef, {
      monthlyUsage,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('更新組織使用統計失敗:', error);
    throw error;
  }
};

/**
 * 根據訂閱方案獲取預設工具列表
 */
function getDefaultToolsByPlan(plan: 'trial' | 'pro'): string[] {
  const trialTools = [
    'ai-assistant',
    'voice-recorder',
    'task-manager',
    'customer-manager'
  ];
  
  const proTools = [
    ...trialTools,
    'data-import',
    'data-export',
    'analytics',
    'report-generator'
  ];
  
  return plan === 'pro' ? proTools : trialTools;
}

/**
 * 升級組織訂閱方案
 */
export const upgradeOrganizationPlan = async (
  orgId: string,
  newPlan: 'pro',
  billingCycle: 'monthly' | 'yearly' = 'monthly'
): Promise<void> => {
  const db = getFirebaseDb();
  
  try {
    await runTransaction(db, async (transaction) => {
      const orgRef = doc(db, 'organizations', orgId);
      const orgDoc = await transaction.get(orgRef);
      
      if (!orgDoc.exists()) {
        throw new Error('組織不存在');
      }
      
      // 更新組織訂閱資訊
      transaction.update(orgRef, {
        subscriptionPlan: newPlan,
        billingCycle,
        trialEndDate: null, // 移除試用期限制
        updatedAt: serverTimestamp()
      });
      
      // 更新企業配置
      const configQuery = query(
        collection(db, 'enterprise_configs'),
        where('organizationId', '==', orgId)
      );
      const configSnapshot = await getDocs(configQuery);
      
      if (!configSnapshot.empty) {
        const configDoc = configSnapshot.docs[0];
        transaction.update(configDoc.ref, {
          enabledTools: getDefaultToolsByPlan(newPlan),
          'subscriptionDetails.plan': newPlan,
          'subscriptionDetails.billingCycle': billingCycle,
          'subscriptionDetails.trialEndDate': null,
          'customSettings.allowCustomFields': true,
          updatedAt: serverTimestamp()
        });
      }
    });
  } catch (error) {
    console.error('升級組織方案失敗:', error);
    throw error;
  }
};

/**
 * 更新組織贈送人數
 */
export const updateGiftedSeats = async (
  orgId: string,
  giftedSeats: number
): Promise<void> => {
  try {
    const db = getFirebaseDb();
    const orgRef = doc(db, 'organizations', orgId);
    
    if (giftedSeats < 0 || giftedSeats > BILLING_CONFIG.MAX_GIFTED_SEATS) {
      throw new Error(`贈送人數必須在 0 到 ${BILLING_CONFIG.MAX_GIFTED_SEATS} 之間`);
    }

    await updateDoc(orgRef, {
      giftedSeats,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('更新贈送人數失敗:', error);
    throw error;
  }
};

/**
 * 檢查組織是否在試用期內
 */
export const isTrialActive = (organization: Organization): boolean => {
  if (organization.subscriptionPlan !== 'trial') {
    return false;
  }
  
  if (!organization.trialEndDate) {
    return false;
  }
  
  const trialEnd = organization.trialEndDate instanceof Timestamp 
    ? organization.trialEndDate.toDate() 
    : new Date(organization.trialEndDate);
  
  return trialEnd > new Date();
};

/**
 * 獲取組織的計費統計摘要
 */
export const getOrganizationBillingSummary = async (orgId: string): Promise<{
  currentPlan: 'trial' | 'pro';
  billingCycle: 'monthly' | 'yearly';
  activeUsers: number;
  giftedSeats: number;
  billableUsers: number;
  monthlyAmount: number;
  trialDaysLeft?: number;
}> => {
  try {
    const organization = await getOrganization(orgId);
    if (!organization) {
      throw new Error('組織不存在');
    }
    
    const activeUsers = organization.monthlyUsage?.activeUsers || 0;
    const giftedSeats = organization.giftedSeats || 0;
    const billableUsers = Math.max(0, activeUsers - giftedSeats);
    
    // 計算月費（年付轉換為月費顯示）
    const yearlyMultiplier = organization.billingCycle === 'yearly' ? 12 : 1;
    const baseAmount = BILLING_CONFIG.PRICE_PER_USER * billableUsers;
    const discount = organization.billingCycle === 'yearly' ? BILLING_CONFIG.YEARLY_DISCOUNT : 0;
    const monthlyAmount = Math.round(baseAmount * (1 - discount) * yearlyMultiplier) / yearlyMultiplier;
    
    let trialDaysLeft: number | undefined;
    if (organization.subscriptionPlan === 'trial' && organization.trialEndDate) {
      const trialEnd = organization.trialEndDate instanceof Timestamp 
        ? organization.trialEndDate.toDate() 
        : new Date(organization.trialEndDate);
      trialDaysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
    }
    
    return {
      currentPlan: organization.subscriptionPlan,
      billingCycle: organization.billingCycle || 'monthly',
      activeUsers,
      giftedSeats,
      billableUsers,
      monthlyAmount,
      trialDaysLeft
    };
  } catch (error) {
    console.error('獲取組織計費摘要失敗:', error);
    throw error;
  }
};