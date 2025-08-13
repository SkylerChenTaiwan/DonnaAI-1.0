/**
 * 組織資料驗證與正規化工具
 */

import { Organization, isOrganization } from '@/types/entities';
import { Timestamp } from 'firebase/firestore';

// 驗證組織資料是否合法
export function validateOrganization(data: any): data is Organization {
  return isOrganization(data);
}

// 正規化組織資料，確保所有必要欄位都有預設值
export function normalizeOrganization(data: Partial<Organization>): Organization {
  const now = new Date();
  
  return {
    // 必要欄位
    id: data.id || '',
    name: data.name || '',
    ownerId: data.ownerId || '',
    subscriptionPlan: data.subscriptionPlan || 'trial',
    aiMinutesQuota: data.aiMinutesQuota ?? 1000, // 預設 1000 分鐘
    aiMinutesUsed: data.aiMinutesUsed ?? 0,
    createdAt: data.createdAt || now,
    
    // 選擇性欄位
    ...(data.description && { description: data.description }),
    ...(data.updatedAt && { updatedAt: data.updatedAt }),
    ...(data.status && { status: data.status }),
    ...(data.maxUsers !== undefined && { maxUsers: data.maxUsers }),
    ...(data.domain && { domain: data.domain }),
    ...(data.contactEmail && { contactEmail: data.contactEmail }),
    ...(data.settings && { settings: data.settings }),
    ...(data.stats && { stats: data.stats }) };
}

// 從 Firestore 文檔轉換為 Organization 物件
export function organizationFromFirestore(doc: any): Organization | null {
  if (!doc || !doc.data) {
    return null;
  }
  
  const data = doc.data();
  
  // 轉換 Timestamp 為 Date
  if (data.createdAt instanceof Timestamp) {
    data.createdAt = data.createdAt.toDate();
  }
  if (data.updatedAt instanceof Timestamp) {
    data.updatedAt = data.updatedAt.toDate();
  }
  
  // 確保必要欄位存在
  const normalized = normalizeOrganization({
    id: doc.id,
    ...data
  });
  
  return validateOrganization(normalized) ? normalized : null;
}

// 準備組織資料以儲存到 Firestore
export function organizationToFirestore(org: Organization): Record<string, any> {
  const { id, ...data } = org;
  
  // 移除 undefined 值
  const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, any>);
  
  return cleanData;
}

// 驗證訂閱計劃
export function isValidSubscriptionPlan(plan: string): plan is Organization['subscriptionPlan'] {
  return ['trial', 'basic', 'professional', 'enterprise'].includes(plan);
}

// 驗證組織狀態
export function isValidOrganizationStatus(status: string): status is NonNullable<Organization['status']> {
  return ['active', 'suspended', 'cancelled', 'expired'].includes(status);
}

// 檢查組織是否有效（可以使用）
export function isOrganizationActive(org: Organization): boolean {
  return !org.status || org.status === 'active';
}

// 檢查是否超過 AI 配額
export function hasExceededAIQuota(org: Organization): boolean {
  return org.aiMinutesUsed >= org.aiMinutesQuota;
}

// 計算剩餘 AI 配額
export function getRemainingAIQuota(org: Organization): number {
  return Math.max(0, org.aiMinutesQuota - org.aiMinutesUsed);
}