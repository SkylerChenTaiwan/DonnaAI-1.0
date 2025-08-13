/**
 * 用戶資料驗證服務
 * 提供用戶資料的格式驗證、重複檢測和批量驗證功能
 */

import { ImportUserData, RawUserData, UserImportStats } from '@/types/userImport';

/**
 * 驗證結果介面
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * 用戶資料驗證器
 */
export class UserDataValidator {
  
  /**
   * 驗證電子郵件格式
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  /**
   * 驗證電話號碼格式
   */
  private isValidPhoneNumber(phone: string): boolean {
    if (!phone || phone.trim() === '') return true; // 電話是選填的
    
    // 支援多種台灣電話格式
    const phonePatterns = [
      /^09\d{8}$/, // 09xxxxxxxx
      /^09\d{2}-\d{3}-\d{3}$/, // 09xx-xxx-xxx
      /^\+886-?9\d{8}$/, // +886-9xxxxxxxx
      /^0\d-\d{7,8}$/, // 市話：0x-xxxxxxx
      /^0\d{1,2}-\d{6,8}$/, // 市話變體
      /^\+\d{1,4}-\d{6,12}$/, // 國際格式
      /^\d{7,15}$/, // 純數字格式
    ];
    
    const cleanPhone = phone.replace(/\s/g, ''); // 移除空格
    return phonePatterns.some(pattern => pattern.test(cleanPhone));
  }

  /**
   * 驗證角色值
   */
  private isValidRole(role: string): boolean {
    return ['user', 'admin'].includes(role.toLowerCase());
  }

  /**
   * 清理和標準化用戶資料
   */
  private cleanUserData(rawData: RawUserData): Partial<ImportUserData> {
    return {
      email: rawData.email?.trim().toLowerCase() || '',
      name: rawData.name?.trim() || '',
      role: rawData.role?.toLowerCase() === 'admin' ? 'admin' : 'user',
      department: rawData.department?.trim() || undefined,
      position: rawData.position?.trim() || rawData.title?.trim() || undefined,
      phoneNumber: rawData.phoneNumber?.trim() || rawData.phone?.trim() || undefined };
  }

  /**
   * 驗證單一用戶資料
   */
  validateUser(userData: Partial<ImportUserData>): ValidationResult {
    const errors: string[] = [];
    
    // 欄位檢查 - 至少需要 email 或 name 其中一個
    const hasEmail = userData.email && userData.email.trim() !== '';
    const hasName = userData.name && userData.name.trim() !== '';
    
    if (!hasEmail && !hasName) {
      errors.push('至少需要提供電子郵件或姓名其中一項');
    }
    
    // 格式驗證
    if (userData.email && userData.email.trim() !== '' && !this.isValidEmail(userData.email)) {
      errors.push('電子郵件格式不正確');
    }
    
    // 角色驗證
    if (userData.role && !this.isValidRole(userData.role)) {
      errors.push('角色必須是 user 或 admin');
    }
    
    // 電話號碼驗證（選填）
    if (userData.phoneNumber && !this.isValidPhoneNumber(userData.phoneNumber)) {
      errors.push('電話號碼格式不正確');
    }

    // 姓名長度檢查
    if (userData.name && userData.name.trim().length > 50) {
      errors.push('姓名長度不能超過50個字元');
    }

    // 電子郵件長度檢查
    if (userData.email && userData.email.trim().length > 100) {
      errors.push('電子郵件長度不能超過100個字元');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * 批量驗證並檢測重複
   */
  validateBatch(rawUsers: RawUserData[]): ImportUserData[] {
    // 首先清理和標準化資料
    const cleanedUsers = rawUsers.map(user => this.cleanUserData(user));
    
    // 檢測重複的 email
    const emailSet = new Set<string>();
    const duplicateEmails = new Set<string>();
    
    // 第一次掃描：找出重複的 email
    cleanedUsers.forEach(user => {
      if (user.email && user.email.trim() !== '') {
        const email = user.email.toLowerCase().trim();
        if (emailSet.has(email)) {
          duplicateEmails.add(email);
        } else {
          emailSet.add(email);
        }
      }
    });
    
    // 第二次掃描：進行完整驗證
    return cleanedUsers.map((user, index) => {
      const validation = this.validateUser(user);
      const email = user.email?.toLowerCase().trim() || '';
      const isDuplicate = duplicateEmails.has(email);
      
      // 如果是重複的，加入重複錯誤
      const finalValidationErrors = [...validation.errors];
      if (isDuplicate) {
        finalValidationErrors.push('電子郵件重複');
      }
      
      const isValid = validation.isValid && !isDuplicate;
      
      return {
        id: `user-${index}`,
        email: user.email || '',
        name: user.name || '',
        role: user.role || 'user',
        department: user.department,
        position: user.position,
        phoneNumber: user.phoneNumber,
        isValid,
        validationErrors: finalValidationErrors,
        isDuplicate,
        isEdited: false,
        isSelected: isValid // 預設只選中有效的用戶
      };
    });
  }

  /**
   * 重新驗證單一用戶（編輯後）
   */
  revalidateUser(user: ImportUserData, allUsers: ImportUserData[]): ImportUserData {
    // 檢查基本驗證
    const validation = this.validateUser(user);
    
    // 檢查是否與其他用戶重複（排除自己）
    const email = user.email.toLowerCase().trim();
    const isDuplicate = allUsers.some(otherUser => 
      otherUser.id !== user.id && 
      otherUser.email.toLowerCase().trim() === email &&
      email !== ''
    );
    
    const finalValidationErrors = [...validation.errors];
    if (isDuplicate) {
      finalValidationErrors.push('電子郵件重複');
    }
    
    const isValid = validation.isValid && !isDuplicate;
    
    return {
      ...user,
      isValid,
      validationErrors: finalValidationErrors,
      isDuplicate,
      isEdited: true
    };
  }

  /**
   * 獲取匯入統計資訊
   */
  getImportStats(users: ImportUserData[]): UserImportStats {
    const total = users.length;
    const valid = users.filter(u => u.isValid).length;
    const invalid = users.filter(u => !u.isValid).length;
    const duplicates = users.filter(u => u.isDuplicate).length;
    const selected = users.filter(u => u.isSelected).length;
    const errors = users.reduce((sum, u) => sum + u.validationErrors.length, 0);

    return {
      total,
      valid,
      invalid,
      duplicates,
      selected,
      errors
    };
  }

  /**
   * 驗證匯入配置
   */
  validateImportConfig(config: {
    organizationId?: string;
    defaultRole?: string;
  }): ValidationResult {
    const errors: string[] = [];

    if (!config.organizationId || config.organizationId.trim() === '') {
      errors.push('組織 ID 為必填');
    }

    if (config.defaultRole && !this.isValidRole(config.defaultRole)) {
      errors.push('預設角色必須是 user 或 admin');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}