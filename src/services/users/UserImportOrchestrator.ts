/**
 * 用戶匯入協調器
 * 協調整個用戶匯入流程，包括資料轉換、驗證和批量建立
 */

import {
  ImportUserData,
  UserFieldMapping,
  UserImportConfigExtended,
  UserImportProgress,
  UserImportResult,
  ImportError } from '@/types/userImport';
// import { importUsersInBatches } from '@/services/firebase/admin/userAssistService'; // 此函數不存在
import { UserDataValidator } from './UserDataValidator';
import { UserCreationService } from './UserCreationService';
import { auth } from '@/services/firebase/config';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  query,
  where,
  getDocs,
  writeBatch,
  serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb } from '@/services/firebase/config';
import { updateOrganizationStats } from '@/services/firebase/updateOrgStats';

export class UserImportOrchestrator {
  private validator: UserDataValidator;
  private batchSize = 100; // Firebase 批量操作限制

  constructor() {
    this.validator = new UserDataValidator();
  }

  /**
   * 根據映射轉換資料
   */
  async transformData(
    rawData: any[],
    mappings: UserFieldMapping[]
  ): Promise<ImportUserData[]> {
    const transformed: ImportUserData[] = [];

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      const userData: ImportUserData = {
        id: `import_${Date.now()}_${i}`,
        email: '',
        name: '',
        role: 'user',
        department: '',
        position: '',
        phoneNumber: '',
        isValid: false,
        validationErrors: [],
        isDuplicate: false,
        isEdited: false,
        isSelected: true };

      // 應用映射
      for (const mapping of mappings) {
        if (mapping.sourceField && row[mapping.sourceField] !== undefined) {
          const value = row[mapping.sourceField];
          
          // 應用轉換（如果有）
          const transformedValue = mapping.transform 
            ? mapping.transform(value)
            : value;

          // 設定對應的欄位
          switch (mapping.targetField) {
            case 'email':
              userData.email = String(transformedValue).toLowerCase().trim();
              break;
            case 'name':
              userData.name = String(transformedValue).trim();
              break;
            case 'role':
              const roleValue = String(transformedValue).toLowerCase();
              userData.role = (roleValue === 'admin' || roleValue === '管理員') ? 'admin' : 'user';
              break;
            case 'department':
              userData.department = String(transformedValue).trim();
              break;
            case 'position':
              userData.position = String(transformedValue).trim();
              break;
            case 'phoneNumber':
              userData.phoneNumber = this.normalizePhone(String(transformedValue));
              break;
          }
        }
      }

      transformed.push(userData);
    }

    // 驗證轉換後的資料
    return this.validator.validateBatch(transformed);
  }

  /**
   * 執行用戶匯入
   */
  async importUsers(
    users: ImportUserData[],
    config: UserImportConfigExtended,
    onProgress?: (progress: UserImportProgress) => void
  ): Promise<UserImportResult> {
    const selectedUsers = users.filter(u => u.isSelected && u.isValid);
    
    if (selectedUsers.length === 0) {
      return {
        success: false,
        imported: 0,
        failed: 0,
        skipped: users.length,
        errors: [{ row: 0, email: '', error: '沒有有效的用戶資料可匯入' }],
        warnings: [] };
    }

    const progress: UserImportProgress = {
      isImporting: true,
      totalUsers: selectedUsers.length,
      processedUsers: 0,
      successCount: 0,
      errorCount: 0,
      currentUser: '',
      errors: [] };

    onProgress?.(progress);

    const errors: ImportError[] = [];
    const warnings: string[] = [];
    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    // 檢查重複用戶
    if (config.skipDuplicates) {
      const existingEmails = await this.checkExistingUsers(
        selectedUsers.map(u => u.email),
        config.organizationId
      );

      for (const user of selectedUsers) {
        if (existingEmails.has(user.email)) {
          user.isDuplicate = true;
          if (!config.updateExisting) {
            user.isSelected = false;
            skippedCount++;
            warnings.push(`用戶 ${user.email} 已存在，已跳過`);
          }
        }
      }
    }

    // 分批處理
    const batches = this.createBatches(selectedUsers.filter(u => u.isSelected), this.batchSize);

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      
      try {
        // 更新進度
        progress.currentUser = `處理批次 ${batchIndex + 1}/${batches.length}`;
        onProgress?.(progress);

        // 建立用戶批次
        const batchResult = await this.createUserBatch(batch, config);
        
        successCount += batchResult.success;
        failedCount += batchResult.failed;
        
        if (batchResult.errors.length > 0) {
          errors.push(...batchResult.errors);
        }

        // 更新進度
        progress.processedUsers += batch.length;
        progress.successCount = successCount;
        progress.errorCount = failedCount;
        onProgress?.(progress);

      } catch (error) {
        console.error(`批次 ${batchIndex + 1} 處理失敗:`, error);
        failedCount += batch.length;
        
        for (const user of batch) {
          errors.push({
            row: 0,
            email: user.email,
            error: `批次處理失敗: ${error instanceof Error ? error.message : '未知錯誤'}` });
        }
      }
    }

    // 完成
    progress.isImporting = false;
    onProgress?.(progress);

    // 如果有成功匯入的用戶，更新組織統計
    if (successCount > 0) {
      try {
        console.log(`📊 更新組織 ${config.organizationId} 的統計資料...`);
        await updateOrganizationStats(config.organizationId);
        console.log('✅ 組織統計更新完成');
      } catch (statsError) {
        console.error('更新組織統計失敗:', statsError);
        // 統計更新失敗不影響匯入結果
        warnings.push('用戶已成功匯入，但組織統計更新失敗');
      }
    }

    return {
      success: successCount > 0,
      imported: successCount,
      failed: failedCount,
      skipped: skippedCount,
      errors,
      warnings };
  }

  /**
   * 檢查已存在的用戶
   */
  private async checkExistingUsers(
    emails: string[],
    organizationId: string
  ): Promise<Set<string>> {
    const existingEmails = new Set<string>();
    const db = getFirebaseDb(); // 獲取 db 實例

    try {
      // 查詢組織中的現有用戶
      const usersQuery = query(
        collection(db, 'users'),
        where('organizationId', '==', organizationId),
        where('email', 'in', emails.slice(0, 10)) // Firestore 限制
      );

      const snapshot = await getDocs(usersQuery);
      snapshot.forEach(doc => {
        const userData = doc.data();
        if (userData.email) {
          existingEmails.add(userData.email);
        }
      });

      // 如果有更多郵件需要檢查，分批處理
      if (emails.length > 10) {
        for (let i = 10; i < emails.length; i += 10) {
          const batch = emails.slice(i, Math.min(i + 10, emails.length));
          const batchQuery = query(
            collection(db, 'users'),
            where('organizationId', '==', organizationId),
            where('email', 'in', batch)
          );
          
          const batchSnapshot = await getDocs(batchQuery);
          batchSnapshot.forEach(doc => {
            const userData = doc.data();
            if (userData.email) {
              existingEmails.add(userData.email);
            }
          });
        }
      }
    } catch (error) {
      console.error('檢查現有用戶失敗:', error);
    }

    return existingEmails;
  }

  /**
   * 建立用戶批次
   */
  private async createUserBatch(
    users: ImportUserData[],
    config: UserImportConfigExtended
  ): Promise<{
    success: number;
    failed: number;
    errors: ImportError[];
  }> {
    let successCount = 0;
    let failedCount = 0;
    const errors: ImportError[] = [];

    // 使用 Firebase Admin SDK 批量建立用戶（需要後端 API）
    try {
      const usersToCreate = users.map(user => ({
        email: user.email,
        name: user.name,
        role: user.role || config.defaultRole,
        department: user.department || '',
        position: user.position || '',
        phoneNumber: user.phoneNumber || '',
        organizationId: config.organizationId,
        generatePassword: config.generatePasswords,
        sendWelcomeEmail: config.sendWelcomeEmail }));

      // 調用批量建立用戶服務
      const userCreationService = UserCreationService.getInstance();
      const createResults = await userCreationService.createUsers(
        usersToCreate.map(user => {
          const userData: any = {
            email: user.email,
            name: user.name,
            role: user.role || 'user',
            organizationId: config.organizationId };
          
          // 只加入非空字串的可選欄位
          if (user.department && user.department.trim()) {
            userData.department = user.department.trim();
          }
          if (user.position && user.position.trim()) {
            userData.jobTitle = user.position.trim();
          }
          if (user.phoneNumber && user.phoneNumber.trim()) {
            userData.phoneNumber = user.phoneNumber.trim();
          }
          
          return userData;
        }),
        {
          skipExisting: config.skipExisting,
          generatePasswords: true }
      );
      
      // 處理批量建立結果
      const successResults = createResults.filter(r => r.success);
      const failedResults = createResults.filter(r => !r.success);
      
      successCount = successResults.length;
      failedCount = failedResults.length;
      
      // 處理錯誤結果
      failedResults.forEach((result, index) => {
        errors.push({
          row: index + 1,
          email: result.email,
          error: result.error || '建立失敗' });
      });
    } catch (error) {
      console.error('批量建立用戶失敗:', error);
      failedCount = users.length;
      
      for (const user of users) {
        errors.push({
          row: 0,
          email: user.email,
          error: error instanceof Error ? error.message : '建立用戶失敗' });
      }
    }

    return {
      success: successCount,
      failed: failedCount,
      errors };
  }

  /**
   * 建立批次
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    
    return batches;
  }

  /**
   * 標準化電話號碼
   */
  private normalizePhone(phone: string): string {
    if (!phone) return '';

    // 移除所有非數字字元
    let normalized = phone.replace(/\D/g, '');

    // 台灣手機號碼格式化
    if (normalized.startsWith('886')) {
      normalized = '0' + normalized.slice(3);
    }

    if (normalized.length === 10 && normalized.startsWith('09')) {
      return `${normalized.slice(0, 4)}-${normalized.slice(4, 7)}-${normalized.slice(7)}`;
    }

    // 保持原樣如果不符合格式
    return phone.trim();
  }

  /**
   * 驗證配置
   */
  validateConfig(config: UserImportConfigExtended): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!config.organizationId) {
      errors.push('缺少組織 ID');
    }

    if (!config.fieldMappings || config.fieldMappings.length === 0) {
      errors.push('缺少欄位映射');
    }

    // 檢查必填欄位映射
    const hasEmail = config.fieldMappings.some(m => m.targetField === 'email' && m.sourceField);
    const hasName = config.fieldMappings.some(m => m.targetField === 'name' && m.sourceField);

    if (!hasEmail) {
      errors.push('缺少 Email 欄位映射');
    }

    if (!hasName) {
      errors.push('缺少姓名欄位映射');
    }

    return {
      isValid: errors.length === 0,
      errors };
  }
}