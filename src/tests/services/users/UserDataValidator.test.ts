/**
 * 用戶資料驗證服務單元測試
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { UserDataValidator } from '../../../services/users/UserDataValidator';
import { RawUserData, ImportUserData } from '../../../types/userImport';

describe('UserDataValidator', () => {
  let validator: UserDataValidator;

  beforeEach(() => {
    validator = new UserDataValidator();
  });

  describe('validateUser', () => {
    it('應該通過有效的用戶資料驗證', () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        name: '測試用戶',
        role: 'user' as const,
        department: '測試部門',
        position: '測試職位',
        phoneNumber: '0912-345-678'
      };

      // Act
      const result = validator.validateUser(userData);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('應該檢測缺少必填欄位', () => {
      // Arrange
      const userData = {
        email: '',
        name: '' };

      // Act
      const result = validator.validateUser(userData);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('電子郵件為必填');
      expect(result.errors).toContain('姓名為必填');
    });

    it('應該檢測無效的電子郵件格式', () => {
      // Arrange
      const userData = {
        email: 'invalid-email',
        name: '測試用戶' };

      // Act
      const result = validator.validateUser(userData);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('電子郵件格式不正確');
    });

    it('應該檢測無效的角色', () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        name: '測試用戶',
        role: 'invalid-role'
      };

      // Act
      const result = validator.validateUser(userData);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('角色必須是 user 或 admin');
    });

    it('應該檢測無效的電話號碼', () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        name: '測試用戶',
        phoneNumber: '123'
      };

      // Act
      const result = validator.validateUser(userData);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('電話號碼格式不正確');
    });

    it('應該檢測姓名長度超限', () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        name: 'a'.repeat(51), // 超過 50 個字元
      };

      // Act
      const result = validator.validateUser(userData);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('姓名長度不能超過50個字元');
    });

    it('應該接受有效的台灣電話號碼格式', () => {
      // Arrange
      const validPhoneNumbers = [
        '0912345678',
        '0912-345-678',
        '+886-912345678',
        '02-12345678',
        '04-1234567'
      ];

      validPhoneNumbers.forEach(phone => {
        const userData = {
          email: 'test@example.com',
          name: '測試用戶',
          phoneNumber: phone
        };

        // Act
        const result = validator.validateUser(userData);

        // Assert
        expect(result.isValid).toBe(true);
        expect(result.errors).not.toContain('電話號碼格式不正確');
      });
    });
  });

  describe('validateBatch', () => {
    it('應該正確驗證批量用戶資料', () => {
      // Arrange
      const rawUsers: RawUserData[] = [
        {
          email: 'user1@example.com',
          name: '用戶1',
          role: 'user'
        },
        {
          email: 'user2@example.com',
          name: '用戶2',
          role: 'admin'
        },
        {
          email: '', // 無效：缺少 email
          name: '用戶3'
        }
      ];

      // Act
      const result = validator.validateBatch(rawUsers);

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0].isValid).toBe(true);
      expect(result[1].isValid).toBe(true);
      expect(result[2].isValid).toBe(false);
      expect(result[2].validationErrors).toContain('電子郵件為必填');
    });

    it('應該檢測重複的電子郵件', () => {
      // Arrange
      const rawUsers: RawUserData[] = [
        {
          email: 'duplicate@example.com',
          name: '用戶1'
        },
        {
          email: 'duplicate@example.com', // 重複
          name: '用戶2'
        }
      ];

      // Act
      const result = validator.validateBatch(rawUsers);

      // Assert
      expect(result[0].isDuplicate).toBe(true);
      expect(result[1].isDuplicate).toBe(true);
      expect(result[0].isValid).toBe(false);
      expect(result[1].isValid).toBe(false);
      expect(result[0].validationErrors).toContain('電子郵件重複');
      expect(result[1].validationErrors).toContain('電子郵件重複');
    });

    it('應該清理和標準化用戶資料', () => {
      // Arrange
      const rawUsers: RawUserData[] = [
        {
          email: '  USER@EXAMPLE.COM  ',
          name: '  用戶名稱  ',
          role: 'ADMIN',
          department: '  技術部  ',
          title: '資深工程師', // 使用 title 而不是 position
          phone: '  0912-345-678  ' // 使用 phone 而不是 phoneNumber
        }
      ];

      // Act
      const result = validator.validateBatch(rawUsers);

      // Assert
      expect(result[0].email).toBe('user@example.com'); // 小寫並去除空格
      expect(result[0].name).toBe('用戶名稱'); // 去除空格
      expect(result[0].role).toBe('admin'); // 小寫
      expect(result[0].department).toBe('技術部'); // 去除空格
      expect(result[0].position).toBe('資深工程師'); // title 映射到 position
      expect(result[0].phoneNumber).toBe('0912-345-678'); // phone 映射到 phoneNumber
    });

    it('應該為每個用戶生成唯一 ID', () => {
      // Arrange
      const rawUsers: RawUserData[] = [
        { email: 'user1@example.com', name: '用戶1' },
        { email: 'user2@example.com', name: '用戶2' },
        { email: 'user3@example.com', name: '用戶3' }
      ];

      // Act
      const result = validator.validateBatch(rawUsers);

      // Assert
      const ids = result.map(user => user.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3); // 所有 ID 都是唯一的

      // ID 格式檢查
      expect(ids[0]).toBe('user-0');
      expect(ids[1]).toBe('user-1');
      expect(ids[2]).toBe('user-2');
    });
  });

  describe('revalidateUser', () => {
    it('應該重新驗證編輯後的用戶', () => {
      // Arrange
      const user: ImportUserData = {
        id: 'user-1',
        email: 'test@example.com',
        name: '原始名稱',
        role: 'user',
        isValid: true,
        validationErrors: [],
        isDuplicate: false,
        isEdited: false,
        isSelected: true
      };

      const allUsers: ImportUserData[] = [user];

      // 編輯用戶資料（添加無效的電話號碼）
      const editedUser = {
        ...user,
        phoneNumber: 'invalid-phone'
      };

      // Act
      const result = validator.revalidateUser(editedUser, allUsers);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.isEdited).toBe(true);
      expect(result.validationErrors).toContain('電話號碼格式不正確');
    });

    it('應該檢測與其他用戶的電子郵件重複', () => {
      // Arrange
      const users: ImportUserData[] = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          name: '用戶1',
          role: 'user',
          isValid: true,
          validationErrors: [],
          isDuplicate: false,
          isEdited: false,
          isSelected: true
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          name: '用戶2',
          role: 'user',
          isValid: true,
          validationErrors: [],
          isDuplicate: false,
          isEdited: false,
          isSelected: true
        }
      ];

      // 將用戶2的電子郵件改為與用戶1重複
      const editedUser = {
        ...users[1],
        email: 'user1@example.com'
      };

      // Act
      const result = validator.revalidateUser(editedUser, users);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.isDuplicate).toBe(true);
      expect(result.validationErrors).toContain('電子郵件重複');
    });
  });

  describe('getImportStats', () => {
    it('應該正確計算匯入統計資訊', () => {
      // Arrange
      const users: ImportUserData[] = [
        {
          id: 'user-1',
          email: 'valid@example.com',
          name: '有效用戶',
          role: 'user',
          isValid: true,
          validationErrors: [],
          isDuplicate: false,
          isEdited: false,
          isSelected: true
        },
        {
          id: 'user-2',
          email: 'invalid-email',
          name: '無效用戶',
          role: 'user',
          isValid: false,
          validationErrors: ['電子郵件格式不正確'],
          isDuplicate: false,
          isEdited: false,
          isSelected: false
        },
        {
          id: 'user-3',
          email: 'duplicate@example.com',
          name: '重複用戶',
          role: 'user',
          isValid: false,
          validationErrors: ['電子郵件重複'],
          isDuplicate: true,
          isEdited: true,
          isSelected: true
        }
      ];

      // Act
      const stats = validator.getImportStats(users);

      // Assert
      expect(stats.total).toBe(3);
      expect(stats.valid).toBe(1);
      expect(stats.invalid).toBe(2);
      expect(stats.duplicates).toBe(1);
      expect(stats.selected).toBe(2);
      expect(stats.errors).toBe(2); // 總錯誤數
    });
  });

  describe('validateImportConfig', () => {
    it('應該驗證有效的匯入配置', () => {
      // Arrange
      const config = {
        organizationId: 'org-123',
        defaultRole: 'user' as const
      };

      // Act
      const result = validator.validateImportConfig(config);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('應該檢測缺少組織 ID', () => {
      // Arrange
      const config = {
        organizationId: '',
        defaultRole: 'user' as const
      };

      // Act
      const result = validator.validateImportConfig(config);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('組織 ID 為必填');
    });

    it('應該檢測無效的預設角色', () => {
      // Arrange
      const config = {
        organizationId: 'org-123',
        defaultRole: 'invalid-role'
      };

      // Act
      const result = validator.validateImportConfig(config);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('預設角色必須是 user 或 admin');
    });
  });
});