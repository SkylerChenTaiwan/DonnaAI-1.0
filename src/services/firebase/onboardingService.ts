/**
 * 組織入職精靈服務
 * 管理入職會話、進度儲存和恢復
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
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { getFirebaseDb } from './config';
import {
  OnboardingSession,
  BasicInfoData,
  BillingPlanData,
  UserImportData,
  WelcomeSetupData,
  ValidationResult,
  ValidationError,
  UserData,
} from '@/types/onboarding';
import { createOrganization, updateOrganization } from './organizations';
import { Organization } from '@/types/entities/organization';

const COLLECTION_NAME = 'onboardingSessions';

/**
 * 建立新的入職會話
 */
export async function createOnboardingSession(
  startedBy: string
): Promise<OnboardingSession> {
  try {
    const db = getFirebaseDb();
    const sessionRef = doc(collection(db, COLLECTION_NAME));
    
    const session: OnboardingSession = {
      id: sessionRef.id,
      startedAt: serverTimestamp() as Timestamp,
      startedBy,
      currentStep: 0,
      completedSteps: [],
      stepData: {},
      status: 'draft',
    };

    await setDoc(sessionRef, session);

    return {
      ...session,
      startedAt: Timestamp.now(),
    };
  } catch (error) {
    console.error('建立入職會話失敗:', error);
    throw error;
  }
}

/**
 * 取得入職會話
 */
export async function getOnboardingSession(
  sessionId: string
): Promise<OnboardingSession | null> {
  try {
    const db = getFirebaseDb();
    const sessionDoc = await getDoc(doc(db, COLLECTION_NAME, sessionId));
    
    if (!sessionDoc.exists()) {
      return null;
    }

    return {
      id: sessionDoc.id,
      ...sessionDoc.data(),
    } as OnboardingSession;
  } catch (error) {
    console.error('取得入職會話失敗:', error);
    throw error;
  }
}

/**
 * 取得進行中的入職會話
 */
export async function getInProgressSessions(
  superAdminId: string
): Promise<OnboardingSession[]> {
  try {
    const db = getFirebaseDb();
    const q = query(
      collection(db, COLLECTION_NAME),
      where('startedBy', '==', superAdminId),
      where('status', 'in', ['draft', 'in_progress']),
      orderBy('startedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as OnboardingSession));
  } catch (error) {
    console.error('取得進行中會話失敗:', error);
    throw error;
  }
}

/**
 * 儲存入職進度
 */
export async function saveOnboardingProgress(
  sessionId: string,
  updates: Partial<OnboardingSession>
): Promise<void> {
  try {
    const db = getFirebaseDb();
    const sessionRef = doc(db, COLLECTION_NAME, sessionId);
    
    await updateDoc(sessionRef, {
      ...updates,
      status: 'in_progress',
      lastUpdated: serverTimestamp(),
    });
  } catch (error) {
    console.error('儲存入職進度失敗:', error);
    throw error;
  }
}

/**
 * 儲存步驟資料
 */
export async function saveStepData(
  sessionId: string,
  step: 'basicInfo' | 'billingPlan' | 'userImport' | 'welcomeSetup',
  data: any
): Promise<void> {
  try {
    const db = getFirebaseDb();
    const sessionRef = doc(db, COLLECTION_NAME, sessionId);
    
    // 清理 undefined 值
    const cleanData = cleanUndefinedFields(data);
    
    const updates: any = {
      [`stepData.${step}`]: cleanData,
      lastUpdated: serverTimestamp(),
    };
    
    await updateDoc(sessionRef, updates);
  } catch (error) {
    console.error(`儲存步驟資料失敗 (${step}):`, error);
    throw error;
  }
}

// 輔助函數：清理 undefined 欄位
function cleanUndefinedFields(obj: any): any {
  if (obj === null || obj === undefined) {
    return null;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => cleanUndefinedFields(item));
  }
  
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        if (value !== undefined) {
          cleaned[key] = cleanUndefinedFields(value);
        }
      }
    }
    return cleaned;
  }
  
  return obj;
}

/**
 * 標記步驟完成
 */
export async function markStepCompleted(
  sessionId: string,
  stepId: string
): Promise<void> {
  try {
    const session = await getOnboardingSession(sessionId);
    if (!session) throw new Error('會話不存在');
    
    const completedSteps = new Set(session.completedSteps);
    completedSteps.add(stepId);
    
    await saveOnboardingProgress(sessionId, {
      completedSteps: Array.from(completedSteps),
    });
  } catch (error) {
    console.error(`標記步驟完成失敗 (${stepId}):`, error);
    throw error;
  }
}

/**
 * 驗證基本資訊
 */
export async function validateBasicInfo(
  data: BasicInfoData
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  
  // 驗證組織名稱
  if (!data.organizationName || data.organizationName.trim().length < 2) {
    errors.push({
      field: 'organizationName',
      message: '組織名稱至少需要 2 個字元',
      severity: 'error',
    });
  }
  
  // 檢查組織名稱是否重複
  const db = getFirebaseDb();
  const q = query(
    collection(db, 'organizations'),
    where('name', '==', data.organizationName)
  );
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    errors.push({
      field: 'organizationName',
      message: '組織名稱已存在',
      severity: 'critical',
    });
  }
  
  // 驗證聯絡人資訊
  if (!data.contactPerson.name) {
    errors.push({
      field: 'contactPerson.name',
      message: '請輸入聯絡人姓名',
      severity: 'error',
    });
  }
  
  // 驗證 Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.contactPerson.email)) {
    errors.push({
      field: 'contactPerson.email',
      message: '請輸入有效的 Email',
      severity: 'error',
    });
  }
  
  // 驗證電話（選填但如果有值要驗證格式）
  if (data.contactPerson.phone) {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(data.contactPerson.phone)) {
      errors.push({
        field: 'contactPerson.phone',
        message: '電話號碼格式不正確',
        severity: 'error',
      });
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * 驗證計費方案
 */
export async function validateBillingPlan(
  data: BillingPlanData
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  
  if (!data.planId) {
    errors.push({
      field: 'planId',
      message: '請選擇計費方案',
      severity: 'error',
    });
  }
  
  if (data.seats < 1) {
    errors.push({
      field: 'seats',
      message: '用戶數必須至少為 1',
      severity: 'error',
    });
  }
  
  // 驗證計費 Email（選填但如果有值要驗證格式）
  if (data.billingEmail) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.billingEmail)) {
      errors.push({
        field: 'billingEmail',
        message: '計費 Email 格式不正確',
        severity: 'error',
      });
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * 驗證用戶匯入
 */
export async function validateUserImport(
  data: UserImportData
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings = [];
  
  // 檢查是否有用戶資料
  if (!data.users || data.users.length === 0) {
    warnings.push({
      field: 'users',
      message: '未匯入任何用戶，可以稍後再新增',
      canProceed: true,
    });
  }
  
  // 檢查重複 Email
  const emails = data.users.map(u => u.email.toLowerCase());
  const uniqueEmails = new Set(emails);
  
  if (uniqueEmails.size < emails.length) {
    const duplicates = emails.filter((email, index) => 
      emails.indexOf(email) !== index
    );
    errors.push({
      field: 'users',
      message: `發現 ${duplicates.length} 個重複的 Email: ${[...new Set(duplicates)].join(', ')}`,
      severity: 'error',
    });
  }
  
  // 驗證每個用戶的資料
  data.users.forEach((user, index) => {
    // 驗證 Email 格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.email)) {
      errors.push({
        field: `users[${index}].email`,
        message: `用戶 ${index + 1} 的 Email 格式不正確`,
        severity: 'error',
      });
    }
    
    // 驗證名稱
    if (!user.name || user.name.trim().length < 1) {
      errors.push({
        field: `users[${index}].name`,
        message: `用戶 ${index + 1} 缺少姓名`,
        severity: 'error',
      });
    }
  });
  
  // Google 設定檢查
  if (data.googleAuthConfig?.enabled) {
    if (!data.googleAuthConfig.domain) {
      warnings.push({
        field: 'googleDomain',
        message: '未設定網域限制，所有 Google 用戶都可登入',
        canProceed: true,
      });
    }
  }
  
  // 密碼策略檢查
  if (data.passwordStrategy.type === 'same-for-all') {
    if (!data.passwordStrategy.value || data.passwordStrategy.value.length < 8) {
      errors.push({
        field: 'password',
        message: '密碼至少需要 8 個字元',
        severity: 'error',
      });
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * 驗證歡迎設定
 */
export async function validateWelcomeSetup(
  data: WelcomeSetupData
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  
  // 驗證郵件主旨
  if (!data.emailTemplate.subject || data.emailTemplate.subject.trim().length < 1) {
    errors.push({
      field: 'emailTemplate.subject',
      message: '請輸入郵件主旨',
      severity: 'error',
    });
  }
  
  // 驗證郵件內容
  if (!data.emailTemplate.body || data.emailTemplate.body.trim().length < 10) {
    errors.push({
      field: 'emailTemplate.body',
      message: '郵件內容至少需要 10 個字元',
      severity: 'error',
    });
  }
  
  // 驗證排程發送時間
  if (data.scheduledSend?.enabled && data.scheduledSend.sendAt) {
    const sendTime = new Date(data.scheduledSend.sendAt);
    if (sendTime < new Date()) {
      errors.push({
        field: 'scheduledSend.sendAt',
        message: '排程時間不能是過去的時間',
        severity: 'error',
      });
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * 執行入職流程
 */
export async function executeOnboarding(
  session: OnboardingSession
): Promise<{ success: boolean; organizationId?: string; error?: string }> {
  const db = getFirebaseDb();
  const batch = writeBatch(db);
  
  try {
    const { basicInfo, billingPlan, userImport, welcomeSetup } = session.stepData;
    
    if (!basicInfo || !billingPlan) {
      throw new Error('缺少必要的步驟資料');
    }
    
    // 1. 建立組織
    const organizationData = {
      name: basicInfo.organizationName,
      description: `${basicInfo.companyInfo.industry} - ${basicInfo.companyInfo.size}`,
      ownerId: session.startedBy,
      subscriptionPlan: billingPlan.planId === 'trial' ? 'trial' as const : 'pro' as const,
      billingCycle: billingPlan.billingCycle,
      contactEmail: basicInfo.contactPerson.email,
      domain: basicInfo.companyInfo.website,
      settings: {
        timezone: basicInfo.settings.timezone,
        defaultLanguage: basicInfo.settings.language,
      },
      status: 'active' as const,
      aiMinutesQuota: getAiMinutesQuota(billingPlan.planId),
      aiMinutesUsed: 0,
    };
    
    const organization = await createOrganization(
      organizationData,
      session.startedBy
    );
    
    // 2. 批量建立用戶（如果有）
    if (userImport && userImport.users.length > 0) {
      await batchCreateUsers(
        organization.id,
        userImport.users,
        userImport.passwordStrategy
      );
    }
    
    // 3. 設定 Google 登入（如果啟用）
    if (userImport?.googleAuthConfig?.enabled) {
      await setupGoogleAuth(organization.id, userImport.googleAuthConfig);
    }
    
    // 4. 發送歡迎郵件（如果設定）
    if (welcomeSetup && userImport?.sendWelcomeEmail) {
      await scheduleWelcomeEmails(
        organization.id,
        userImport.users,
        welcomeSetup
      );
    }
    
    // 5. 更新會話狀態
    await saveOnboardingProgress(session.id, {
      organizationId: organization.id,
      status: 'completed',
      completedAt: serverTimestamp() as Timestamp,
    });
    
    return {
      success: true,
      organizationId: organization.id,
    };
  } catch (error) {
    console.error('執行入職流程失敗:', error);
    
    // 記錄錯誤
    await saveOnboardingProgress(session.id, {
      status: 'failed',
      errorLog: [
        ...(session.errorLog || []),
        {
          step: 'execute',
          error: error instanceof Error ? error.message : String(error),
          timestamp: Timestamp.now(),
        },
      ],
    });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤',
    };
  }
}

/**
 * 批量建立用戶
 */
async function batchCreateUsers(
  organizationId: string,
  users: UserData[],
  passwordStrategy: any
): Promise<void> {
  const db = getFirebaseDb();
  const batch = writeBatch(db);
  
  for (const userData of users) {
    const userRef = doc(collection(db, 'users'));
    
    // 建立基礎文檔，只包含必要欄位
    const userDoc: any = {
      email: userData.email,
      name: userData.name,
      role: userData.role || 'user',
      organizationId,
      authMethod: userData.authMethod || 'password',
      createdAt: serverTimestamp(),
      isActive: true,
      // 密碼將由 Firebase Auth 處理
    };
    
    // 只加入非 undefined 的可選欄位
    if (userData.department !== undefined) userDoc.department = userData.department;
    if (userData.phone !== undefined) userDoc.phone = userData.phone;
    if (userData.photoUrl !== undefined) userDoc.photoUrl = userData.photoUrl;
    
    batch.set(userRef, userDoc);
  }
  
  await batch.commit();
}

/**
 * 設定 Google 登入
 */
async function setupGoogleAuth(
  organizationId: string,
  config: any
): Promise<void> {
  // TODO: 實作 Google OAuth 設定
  // 這需要與 Firebase Auth 整合
  console.log('設定 Google 登入:', { organizationId, config });
}

/**
 * 排程發送歡迎郵件
 */
async function scheduleWelcomeEmails(
  organizationId: string,
  users: UserData[],
  welcomeSetup: WelcomeSetupData
): Promise<void> {
  // TODO: 實作郵件發送
  // 這需要與郵件服務整合
  console.log('排程發送歡迎郵件:', { organizationId, users: users.length, welcomeSetup });
}

/**
 * 取得 AI 分鐘配額
 */
function getAiMinutesQuota(planId: string): number {
  const quotaMap: Record<string, number> = {
    trial: 100,
    basic: 500,
    professional: 2000,
    enterprise: 10000,
  };
  
  return quotaMap[planId] || 100;
}

/**
 * 刪除入職會話
 */
export async function deleteOnboardingSession(sessionId: string): Promise<void> {
  try {
    const db = getFirebaseDb();
    await deleteDoc(doc(db, COLLECTION_NAME, sessionId));
  } catch (error) {
    console.error('刪除入職會話失敗:', error);
    throw error;
  }
}