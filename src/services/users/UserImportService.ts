/**
 * 用戶匯入專用服務
 * 整合用戶資料驗證、批量處理和進度追蹤
 */

import { UserDataValidator } from './UserDataValidator';
import { userCreationService, CreateUserData, CreateUserResult } from './UserCreationService';
import { 
  ImportUserData, 
  UserImportProgress, 
  UserImportResult, 
  ImportError,
  UserImportConfig,
  UserImportStats
} from '@/types/userImport';

/**
 * 進度回調函數類型
 */
export type ProgressCallback = (progress: UserImportProgress) => void;

/**
 * 用戶匯入服務
 */
export class UserImportService {
  private static instance: UserImportService;
  private validator: UserDataValidator;
  
  static getInstance(): UserImportService {
    if (!this.instance) {
      this.instance = new UserImportService();
    }
    return this.instance;
  }

  private constructor() {
    this.validator = new UserDataValidator();
  }

  /**
   * 批量匯入用戶
   */
  async importUsers(
    users: ImportUserData[],
    config: UserImportConfig,
    onProgress?: ProgressCallback
  ): Promise<UserImportResult> {
    console.log('🚀 開始批量匯入用戶:', users.length);
    
    // 初始化進度
    const progress: UserImportProgress = {
      isImporting: true,
      totalUsers: users.length,
      processedUsers: 0,
      successCount: 0,
      errorCount: 0,
      currentUser: '',
      errors: []
    };

    try {
      // 報告開始進度
      onProgress?.(progress);

      // 篩選要匯入的用戶
      const validUsers = this.filterUsersForImport(users, config);
      progress.totalUsers = validUsers.length;

      if (validUsers.length === 0) {
        progress.isImporting = false;
        onProgress?.(progress);
        return {
          success: true,
          imported: 0,
          failed: 0,
          skipped: users.length,
          errors: [],
          warnings: ['沒有有效的用戶可以匯入']
        };
      }

      // 分批處理（較小的批次以提供更細緻的進度反饋）
      const batchSize = 15; // 每批 15 個用戶，在進度反饋和效率間取得平衡
      const results: CreateUserResult[] = [];
      
      for (let i = 0; i < validUsers.length; i += batchSize) {
        const batch = validUsers.slice(i, i + batchSize);
        console.log(`處理批次 ${Math.floor(i / batchSize) + 1}/${Math.ceil(validUsers.length / batchSize)}`);
        
        // 處理當前批次
        const batchResults = await this.processBatch(batch, config, progress, onProgress);
        results.push(...batchResults);
        
        // 更新總進度
        progress.processedUsers = Math.min(i + batchSize, validUsers.length);
        progress.successCount = results.filter(r => r.success).length;
        progress.errorCount = results.filter(r => !r.success).length;
        
        // 收集錯誤
        progress.errors.push(...this.convertResultsToErrors(batchResults, batch));
        
        onProgress?.(progress);
        
        // 短暫延遲避免過載
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // 完成匯入
      progress.isImporting = false;
      progress.currentUser = '';
      onProgress?.(progress);

      // 統計結果
      const imported = results.filter(r => r.success && !r.isExisting).length;
      const failed = results.filter(r => !r.success).length;
      const skipped = users.length - validUsers.length + results.filter(r => r.isExisting).length;

      console.log(`✅ 匯入完成 - 成功: ${imported}, 失敗: ${failed}, 跳過: ${skipped}`);

      return {
        success: failed === 0,
        imported,
        failed,
        skipped,
        errors: progress.errors,
        warnings: this.generateWarnings(results, config)
      };

    } catch (error) {
      console.error('批量匯入失敗:', error);
      
      progress.isImporting = false;
      progress.errors.push({
        row: -1,
        email: '',
        error: `匯入過程發生錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`
      });
      onProgress?.(progress);
      
      return {
        success: false,
        imported: progress.successCount,
        failed: progress.errorCount + 1,
        skipped: users.length - progress.processedUsers,
        errors: progress.errors,
        warnings: []
      };
    }
  }

  /**
   * 處理單個批次
   */
  private async processBatch(
    users: ImportUserData[],
    config: UserImportConfig,
    progress: UserImportProgress,
    onProgress?: ProgressCallback
  ): Promise<CreateUserResult[]> {
    const results: CreateUserResult[] = [];
    
    // 轉換為 CreateUserData 格式
    const createUserDataArray: CreateUserData[] = users.map(user => ({
      email: user.email,
      name: user.name,
      role: user.role || config.defaultRole,
      organizationId: config.organizationId,
      department: user.department,
      jobTitle: user.position,
      phoneNumber: user.phoneNumber
    }));

    // 批量創建選項 (未來可用於批量處理)
    // const batchOptions: BatchCreateOptions = {
    //   skipExisting: config.skipDuplicates,
    //   updateExisting: config.updateExisting,
    //   generatePasswords: config.generatePasswords,
    //   sendWelcomeEmail: config.sendWelcomeEmail
    // };

    try {
      // 使用批量建立方法以提高效率
      progress.currentUser = `正在批量創建 ${createUserDataArray.length} 個用戶...`;
      onProgress?.(progress);
      
      const batchResults = await userCreationService.createUsers(
        createUserDataArray,
        {
          skipExisting: config.skipDuplicates,
          updateExisting: config.updateExisting,
          generatePasswords: config.generatePasswords,
          sendWelcomeEmail: config.sendWelcomeEmail
        }
      );
      
      results.push(...batchResults);
      
      // 更新進度顯示
      for (const result of batchResults) {
        progress.currentUser = `已處理: ${result.email}`;
        onProgress?.(progress);
        // 短暫延遲以顯示進度
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      
      return results;
    } catch (error) {
      console.error('批次處理失敗:', error);
      
      // 為每個用戶創建失敗結果
      const failedResults: CreateUserResult[] = createUserDataArray.map(user => ({
        email: user.email,
        success: false,
        error: `批次處理失敗: ${error instanceof Error ? error.message : '未知錯誤'}`
      }));
      
      return [...results, ...failedResults];
    }
  }

  /**
   * 篩選要匯入的用戶
   */
  private filterUsersForImport(users: ImportUserData[], config: UserImportConfig): ImportUserData[] {
    return users.filter(user => {
      // 只處理選中的有效用戶
      if (!user.isSelected || !user.isValid) {
        return false;
      }
      
      // 如果配置跳過重複用戶
      if (config.skipDuplicates && user.isDuplicate) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * 將創建結果轉換為匯入錯誤
   */
  private convertResultsToErrors(results: CreateUserResult[], users: ImportUserData[]): ImportError[] {
    const errors: ImportError[] = [];
    
    results.forEach((result, index) => {
      if (!result.success && result.error) {
        const user = users[index];
        errors.push({
          row: parseInt(user.id.replace('user-', '')) + 1, // 恢復原始行號
          email: result.email,
          error: result.error
        });
      }
    });
    
    return errors;
  }

  /**
   * 生成警告訊息
   */
  private generateWarnings(results: CreateUserResult[], config: UserImportConfig): string[] {
    const warnings: string[] = [];
    
    const existingCount = results.filter(r => r.isExisting).length;
    if (existingCount > 0) {
      if (config.skipDuplicates) {
        warnings.push(`跳過 ${existingCount} 個已存在的用戶`);
      } else if (config.updateExisting) {
        warnings.push(`更新了 ${existingCount} 個已存在的用戶`);
      }
    }
    
    if (!config.sendWelcomeEmail) {
      warnings.push('未發送歡迎郵件給新用戶');
    }
    
    if (!config.generatePasswords) {
      warnings.push('未自動生成密碼，用戶需要重設密碼');
    }
    
    return warnings;
  }

  /**
   * 檢查重複用戶（與資料庫比對）
   */
  async checkExistingUsers(users: ImportUserData[]): Promise<ImportUserData[]> {
    console.log('檢查現有用戶...');
    const updatedUsers: ImportUserData[] = [];
    
    for (const user of users) {
      try {
        const exists = await userCreationService.checkUserExists(user.email);
        
        if (exists && !user.isDuplicate) {
          // 標記為重複並重新驗證
          const updatedUser = this.validator.revalidateUser(
            { ...user, isDuplicate: true },
            users
          );
          updatedUsers.push(updatedUser);
        } else {
          updatedUsers.push(user);
        }
      } catch (error) {
        console.error(`檢查用戶 ${user.email} 時發生錯誤:`, error);
        // 保持原狀，錯誤會在匯入時處理
        updatedUsers.push(user);
      }
    }
    
    return updatedUsers;
  }

  /**
   * 驗證匯入配置
   */
  validateImportConfig(config: UserImportConfig): { isValid: boolean; errors: string[] } {
    const result = this.validator.validateImportConfig({
      organizationId: config.organizationId,
      defaultRole: config.defaultRole
    });
    
    return result;
  }

  /**
   * 獲取匯入統計
   */
  getImportStatistics(users: ImportUserData[]): UserImportStats {
    return this.validator.getImportStats(users);
  }

  /**
   * 重新驗證用戶資料（編輯後）
   */
  revalidateUser(user: ImportUserData, allUsers: ImportUserData[]): ImportUserData {
    return this.validator.revalidateUser(user, allUsers);
  }

  /**
   * 批量操作：設定角色
   */
  batchSetRole(users: ImportUserData[], role: 'user' | 'admin', targetIds?: string[]): ImportUserData[] {
    return users.map(user => {
      if (!targetIds || targetIds.includes(user.id)) {
        const updatedUser = { ...user, role, isEdited: true };
        return this.validator.revalidateUser(updatedUser, users);
      }
      return user;
    });
  }

  /**
   * 批量操作：設定部門
   */
  batchSetDepartment(users: ImportUserData[], department: string, targetIds?: string[]): ImportUserData[] {
    return users.map(user => {
      if (!targetIds || targetIds.includes(user.id)) {
        const updatedUser = { ...user, department, isEdited: true };
        return this.validator.revalidateUser(updatedUser, users);
      }
      return user;
    });
  }

  /**
   * 批量操作：切換選擇狀態
   */
  batchToggleSelection(users: ImportUserData[], selected: boolean, targetIds?: string[]): ImportUserData[] {
    return users.map(user => {
      if (!targetIds || targetIds.includes(user.id)) {
        return { ...user, isSelected: selected };
      }
      return user;
    });
  }

  /**
   * 取消匯入（如果支援）
   */
  cancelImport(): boolean {
    // TODO: 實現取消邏輯
    console.log('取消匯入請求');
    return false; // 暫時不支援取消
  }
}

// 導出單例實例
export const userImportService = UserImportService.getInstance();