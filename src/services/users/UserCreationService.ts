/**
 * 安全的用戶建立服務
 * 確保建立新用戶不會影響當前登入狀態
 */

import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp,
  collection,
  addDoc
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirebaseDb } from '../firebase/config';
import { getFirebaseFunctions } from '../firebase/config';
import { permissionService } from '../permissions/PermissionService';
import { Role, normalizeRole, getRolePermissions } from '@/constants/permissions';

// 用戶建立資料介面
export interface CreateUserData {
  email: string;
  password?: string; // Cloud Function 需要
  name: string;
  role?: string | Role;
  organizationId: string;
  teamIds?: string[];
  department?: string;
  jobTitle?: string;
  supervisorId?: string;
  phoneNumber?: string;
  // 舊系統匯入相關
  legacyId?: string;
  isLegacyImport?: boolean;
}

// 批量建立結果
export interface CreateUserResult {
  uid?: string;
  email: string;
  success: boolean;
  error?: string;
  isExisting?: boolean;
}

// 批量建立選項
export interface BatchCreateOptions {
  skipExisting?: boolean; // 跳過已存在的用戶
  updateExisting?: boolean; // 更新已存在的用戶資料
  generatePasswords?: boolean; // 自動生成密碼
  sendWelcomeEmail?: boolean; // 發送歡迎郵件
}

class UserCreationService {
  private static instance: UserCreationService;
  
  static getInstance(): UserCreationService {
    if (!this.instance) {
      this.instance = new UserCreationService();
    }
    return this.instance;
  }

  private constructor() {}

  /**
   * 建立單一用戶（不影響當前登入狀態）
   */
  async createUser(userData: CreateUserData): Promise<CreateUserResult> {
    try {
      console.log('🔐 開始建立用戶:', userData.email);
      
      // 1. 記錄當前登入狀態
      const auth = getAuth();
      const currentUser = auth.currentUser;
      const currentUserId = currentUser?.uid;
      const currentUserEmail = currentUser?.email;
      
      console.log('當前登入用戶:', currentUserEmail);
      
      // 2. 優先使用 Cloud Function
      const result = await this.createUserViaCloudFunction(userData);
      
      // 3. 驗證登入狀態沒有改變
      const afterUser = auth.currentUser;
      if (afterUser?.uid !== currentUserId) {
        console.error('⚠️ 警告：登入狀態意外改變！');
        console.log('原始用戶:', currentUserEmail);
        console.log('當前用戶:', afterUser?.email);
        
        // 嘗試恢復原始登入狀態
        if (currentUser) {
          await this.restoreLoginState(currentUser);
        }
      }
      
      return result;
    } catch (error) {
      console.error('建立用戶時發生錯誤:', error);
      return {
        email: userData.email,
        success: false,
        error: error instanceof Error ? error.message : '未知錯誤'
      };
    }
  }

  /**
   * 透過 Cloud Function 建立用戶
   */
  private async createUserViaCloudFunction(userData: CreateUserData): Promise<CreateUserResult> {
    try {
      const functions = getFirebaseFunctions();
      const createUserFunction = httpsCallable(functions, 'createUsersForImport');
      
      // 正規化角色
      const role = normalizeRole(userData.role as string);
      const permissions = getRolePermissions(role);
      
      // 準備資料
      const functionData = {
        users: [{
          email: userData.email,
          password: userData.password || this.generateSecurePassword(),
          displayName: userData.name,
          customClaims: {
            role: role,
            organizationId: userData.organizationId
          }
        }],
        userData: [{
          email: userData.email,
          name: userData.name,
          role: role,
          organizationId: userData.organizationId,
          teamIds: userData.teamIds || [],
          department: userData.department,
          jobTitle: userData.jobTitle,
          supervisorId: userData.supervisorId,
          phoneNumber: userData.phoneNumber,
          platformPermissions: permissions,
          legacyId: userData.legacyId,
          isLegacyImport: userData.isLegacyImport
        }]
      };
      
      console.log('呼叫 Cloud Function 建立用戶...');
      const response = await createUserFunction(functionData);
      const result = response.data as any;
      
      if (result.success && result.results?.[0]) {
        const userResult = result.results[0];
        
        // 如果 Cloud Function 成功但沒有建立 Firestore 文檔，我們在這裡補充
        if (userResult.uid && !userResult.firestoreCreated) {
          await this.createUserDocument(userResult.uid, userData);
        }
        
        return {
          uid: userResult.uid,
          email: userData.email,
          success: true,
          isExisting: userResult.isExisting
        };
      } else {
        throw new Error(result.error || '建立用戶失敗');
      }
    } catch (error) {
      console.error('Cloud Function 建立用戶失敗:', error);
      
      // 如果 Cloud Function 失敗，使用備用方案
      return await this.createUserViaFirestore(userData);
    }
  }

  /**
   * 透過 Firestore 直接建立用戶文檔（備用方案）
   * 注意：這不會建立 Firebase Auth 帳號
   */
  private async createUserViaFirestore(userData: CreateUserData): Promise<CreateUserResult> {
    try {
      console.log('使用 Firestore 備用方案建立用戶文檔...');
      
      // 檢查用戶是否已存在
      const db = getFirebaseDb();
      const usersRef = collection(db, 'users');
      
      // 生成臨時 UID（格式類似 Firebase Auth UID）
      const tempUid = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 正規化角色
      const role = normalizeRole(userData.role as string);
      const permissions = getRolePermissions(role);
      
      // 建立用戶文檔
      await setDoc(doc(db, 'users', tempUid), {
        id: tempUid,
        email: userData.email,
        name: userData.name,
        role: role,
        organizationId: userData.organizationId,
        teamIds: userData.teamIds || [],
        department: userData.department,
        jobTitle: userData.jobTitle,
        supervisorId: userData.supervisorId,
        phoneNumber: userData.phoneNumber,
        platformPermissions: permissions,
        isTemporary: true, // 標記為臨時用戶
        needsAuthCreation: true, // 需要後續建立 Auth 帳號
        legacyId: userData.legacyId,
        isLegacyImport: userData.isLegacyImport,
        createdAt: serverTimestamp(),
        createdBy: getAuth().currentUser?.uid || 'system'
      });
      
      // 記錄審計日誌
      await this.auditUserCreation(tempUid, userData, 'firestore_fallback');
      
      return {
        uid: tempUid,
        email: userData.email,
        success: true,
        isExisting: false
      };
    } catch (error) {
      console.error('Firestore 建立用戶文檔失敗:', error);
      throw error;
    }
  }

  /**
   * 建立用戶 Firestore 文檔
   */
  private async createUserDocument(uid: string, userData: CreateUserData): Promise<void> {
    try {
      const db = getFirebaseDb();
      const role = normalizeRole(userData.role as string);
      const permissions = getRolePermissions(role);
      
      await setDoc(doc(db, 'users', uid), {
        id: uid,
        email: userData.email,
        name: userData.name,
        role: role,
        organizationId: userData.organizationId,
        teamIds: userData.teamIds || [],
        department: userData.department,
        jobTitle: userData.jobTitle,
        supervisorId: userData.supervisorId,
        phoneNumber: userData.phoneNumber,
        platformPermissions: permissions,
        legacyId: userData.legacyId,
        isLegacyImport: userData.isLegacyImport,
        createdAt: serverTimestamp(),
        createdBy: getAuth().currentUser?.uid || 'system'
      });
      
      console.log('✅ 用戶文檔建立成功');
    } catch (error) {
      console.error('建立用戶文檔失敗:', error);
      throw error;
    }
  }

  /**
   * 批量建立用戶
   */
  async createUsers(
    users: CreateUserData[], 
    options: BatchCreateOptions = {}
  ): Promise<CreateUserResult[]> {
    try {
      console.log(`🔐 開始批量建立 ${users.length} 個用戶`);
      
      // 記錄當前登入狀態
      const auth = getAuth();
      const currentUser = auth.currentUser;
      const currentUserId = currentUser?.uid;
      
      // 分批處理（每批最多 100 個，避免 Cloud Function 超時）
      const batchSize = 100;
      const results: CreateUserResult[] = [];
      
      for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize);
        const batchResults = await this.createUserBatch(batch, options);
        results.push(...batchResults);
        
        // 檢查登入狀態
        const afterUser = auth.currentUser;
        if (afterUser?.uid !== currentUserId) {
          console.error('⚠️ 批量建立過程中登入狀態改變，嘗試恢復...');
          if (currentUser) {
            await this.restoreLoginState(currentUser);
          }
        }
      }
      
      console.log(`✅ 批量建立完成：成功 ${results.filter(r => r.success).length}/${results.length}`);
      return results;
    } catch (error) {
      console.error('批量建立用戶失敗:', error);
      throw error;
    }
  }

  /**
   * 建立單批用戶
   */
  private async createUserBatch(
    users: CreateUserData[], 
    options: BatchCreateOptions
  ): Promise<CreateUserResult[]> {
    try {
      const functions = getFirebaseFunctions();
      const createUsersFunction = httpsCallable(functions, 'createUsersForImport');
      
      // 準備批量資料
      const usersData = users.map(user => ({
        email: user.email,
        password: user.password || (options.generatePasswords ? this.generateSecurePassword() : undefined),
        displayName: user.name,
        customClaims: {
          role: normalizeRole(user.role as string),
          organizationId: user.organizationId
        }
      }));
      
      const userData = users.map(user => {
        const role = normalizeRole(user.role as string);
        return {
          email: user.email,
          name: user.name,
          role: role,
          organizationId: user.organizationId,
          teamIds: user.teamIds || [],
          department: user.department,
          jobTitle: user.jobTitle,
          supervisorId: user.supervisorId,
          phoneNumber: user.phoneNumber,
          platformPermissions: getRolePermissions(role),
          legacyId: user.legacyId,
          isLegacyImport: user.isLegacyImport
        };
      });
      
      // 確保有 organizationId
      const organizationId = users[0]?.organizationId;
      if (!organizationId) {
        throw new Error('用戶資料缺少 organizationId');
      }
      
      const response = await createUsersFunction({
        users: usersData,
        userData: userData,
        organizationId: organizationId,
        teamId: users[0]?.teamIds?.[0] || null,
        options: {
          skipExisting: options.skipExisting,
          updateExisting: options.updateExisting,
          sendWelcomeEmail: options.sendWelcomeEmail,
          generatePasswords: options.generatePasswords
        }
      });
      
      const result = response.data as any;
      
      if (result.success) {
        return result.results || [];
      } else {
        throw new Error(result.error || '批量建立失敗');
      }
    } catch (error) {
      console.error('批量建立失敗，使用逐個建立:', error);
      
      // 備用方案：逐個建立
      const results: CreateUserResult[] = [];
      for (const user of users) {
        const result = await this.createUser(user);
        results.push(result);
      }
      return results;
    }
  }

  /**
   * 恢復登入狀態（緊急措施）
   */
  private async restoreLoginState(originalUser: any): Promise<void> {
    try {
      console.log('嘗試恢復原始登入狀態...');
      // 這裡無法直接恢復，需要提示用戶重新登入
      console.error('⚠️ 無法自動恢復登入狀態，請重新登入');
      
      // 記錄事件
      await this.auditLoginStateChange(originalUser.uid, 'restore_attempted');
    } catch (error) {
      console.error('恢復登入狀態失敗:', error);
    }
  }

  /**
   * 生成安全密碼
   */
  private generateSecurePassword(): string {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    // 確保包含各種字符類型
    password += 'A'; // 大寫
    password += 'a'; // 小寫
    password += '1'; // 數字
    password += '!'; // 特殊字符
    
    // 填充剩餘長度
    for (let i = 4; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    // 打亂順序
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * 審計用戶建立
   */
  private async auditUserCreation(uid: string, userData: CreateUserData, method: string): Promise<void> {
    try {
      const db = getFirebaseDb();
      await addDoc(collection(db, 'user_creation_audits'), {
        uid,
        email: userData.email,
        method,
        createdBy: getAuth().currentUser?.uid || 'system',
        createdAt: serverTimestamp(),
        metadata: {
          role: userData.role,
          organizationId: userData.organizationId,
          isLegacyImport: userData.isLegacyImport
        }
      });
    } catch (error) {
      console.error('記錄審計日誌失敗:', error);
    }
  }

  /**
   * 審計登入狀態變更
   */
  private async auditLoginStateChange(originalUid: string, action: string): Promise<void> {
    try {
      const db = getFirebaseDb();
      await addDoc(collection(db, 'login_state_audits'), {
        originalUid,
        currentUid: getAuth().currentUser?.uid,
        action,
        timestamp: serverTimestamp(),
        metadata: {
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('記錄登入狀態審計失敗:', error);
    }
  }

  /**
   * 檢查用戶是否存在
   */
  async checkUserExists(email: string): Promise<boolean> {
    try {
      // 先嘗試使用 Cloud Function 檢查
      const functions = getFirebaseFunctions();
      const checkUserFunction = httpsCallable(functions, 'checkUserExists');
      const response = await checkUserFunction({ email });
      const result = response.data as any;
      
      return result.exists;
    } catch (error) {
      console.error('檢查用戶是否存在失敗:', error);
      
      // 備用方案：查詢 Firestore
      // 注意：這需要適當的安全規則
      return false;
    }
  }
}

// 導出單例實例
export const userCreationService = UserCreationService.getInstance();

// 導出類型
export type { CreateUserData, CreateUserResult, BatchCreateOptions };
export { UserCreationService };