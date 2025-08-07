/**
 * 用戶匯入服務單元測試
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { UserImportService } from '../../../services/users/UserImportService';
import { UserDataValidator } from '../../../services/users/UserDataValidator';
import * as userCreationService from '../../../services/users/UserCreationService';
import { 
  ImportUserData, 
  UserImportConfig, 
  UserImportProgress,
  BatchOperationOptions,
  UserEditEvent 
} from '../../../types/userImport';

// Mock dependencies
vi.mock('../../../services/users/UserDataValidator');
vi.mock('../../../services/users/UserCreationService');

describe('UserImportService', () => {
  let service: UserImportService;
  let mockValidator: {
    revalidateUser: Mock;
    validateImportConfig: Mock;
    getImportStats: Mock;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock UserDataValidator
    mockValidator = {
      revalidateUser: vi.fn(),
      validateImportConfig: vi.fn(),
      getImportStats: vi.fn()
    };
    
    vi.mocked(UserDataValidator).mockImplementation(() => mockValidator as any);
    
    service = UserImportService.getInstance();
  });

  describe('getInstance', () => {
    it('應該返回單例實例', () => {
      // Act
      const instance1 = UserImportService.getInstance();
      const instance2 = UserImportService.getInstance();

      // Assert
      expect(instance1).toBe(instance2);
    });
  });

  describe('importUsers', () => {
    it('應該成功匯入有效用戶', async () => {
      // Arrange
      const users: ImportUserData[] = [
        {
          id: 'user-1',
          email: 'test1@example.com',
          name: '測試用戶1',
          role: 'user',
          isValid: true,
          validationErrors: [],
          isDuplicate: false,
          isEdited: false,
          isSelected: true
        },
        {
          id: 'user-2',
          email: 'test2@example.com',
          name: '測試用戶2',
          role: 'admin',
          isValid: true,
          validationErrors: [],
          isDuplicate: false,
          isEdited: false,
          isSelected: true
        }
      ];

      const config: UserImportConfig = {
        defaultRole: 'user',
        skipDuplicates: true,
        updateExisting: false,
        sendWelcomeEmail: true,
        generatePasswords: true,
        organizationId: 'org-123'
      };

      const mockCreateUserResult = {
        uid: 'firebase-uid',
        email: 'test@example.com',
        success: true
      };

      vi.mocked(userCreationService.userCreationService.createUser)
        .mockResolvedValue(mockCreateUserResult);

      mockValidator.validateImportConfig.mockReturnValue({
        isValid: true,
        errors: []
      });

      const progressCallback = vi.fn();

      // Act
      const result = await service.importUsers(users, config, progressCallback);

      // Assert
      expect(result.success).toBe(true);
      expect(result.imported).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.skipped).toBe(0);
      expect(progressCallback).toHaveBeenCalled();
    });

    it('應該跳過無效和未選中的用戶', async () => {
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
          email: 'invalid@example.com',
          name: '無效用戶',
          role: 'user',
          isValid: false,
          validationErrors: ['電子郵件格式不正確'],
          isDuplicate: false,
          isEdited: false,
          isSelected: true
        },
        {
          id: 'user-3',
          email: 'unselected@example.com',
          name: '未選用戶',
          role: 'user',
          isValid: true,
          validationErrors: [],
          isDuplicate: false,
          isEdited: false,
          isSelected: false
        }
      ];

      const config: UserImportConfig = {
        defaultRole: 'user',
        skipDuplicates: true,
        updateExisting: false,
        sendWelcomeEmail: true,
        generatePasswords: true,
        organizationId: 'org-123'
      };

      vi.mocked(userCreationService.userCreationService.createUser)
        .mockResolvedValue({ uid: 'uid', email: 'valid@example.com', success: true });

      mockValidator.validateImportConfig.mockReturnValue({
        isValid: true,
        errors: []
      });

      // Act
      const result = await service.importUsers(users, config);

      // Assert
      expect(result.imported).toBe(1);
      expect(result.skipped).toBe(2); // 1 無效 + 1 未選
      expect(vi.mocked(userCreationService.userCreationService.createUser)).toHaveBeenCalledTimes(1);
    });

    it('應該處理匯入錯誤', async () => {
      // Arrange
      const users: ImportUserData[] = [
        {
          id: 'user-1',
          email: 'test@example.com',
          name: '測試用戶',
          role: 'user',
          isValid: true,
          validationErrors: [],
          isDuplicate: false,
          isEdited: false,
          isSelected: true
        }
      ];

      const config: UserImportConfig = {
        defaultRole: 'user',
        skipDuplicates: true,
        updateExisting: false,
        sendWelcomeEmail: true,
        generatePasswords: true,
        organizationId: 'org-123'
      };

      vi.mocked(userCreationService.userCreationService.createUser)
        .mockResolvedValue({ 
          email: 'test@example.com', 
          success: false, 
          error: '創建失敗'
        });

      mockValidator.validateImportConfig.mockReturnValue({
        isValid: true,
        errors: []
      });

      // Act
      const result = await service.importUsers(users, config);

      // Assert
      expect(result.success).toBe(false);
      expect(result.imported).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toBe('創建失敗');
    });

    it('應該驗證配置並返回錯誤', async () => {
      // Arrange
      const users: ImportUserData[] = [];
      const config: UserImportConfig = {
        defaultRole: 'user',
        skipDuplicates: true,
        updateExisting: false,
        sendWelcomeEmail: true,
        generatePasswords: true,
        organizationId: '' // 無效配置
      };

      mockValidator.validateImportConfig.mockReturnValue({
        isValid: false,
        errors: ['組織 ID 為必填']
      });

      // Act & Assert
      await expect(service.importUsers(users, config)).rejects.toThrow();
    });

    it('應該提供詳細的進度回調', async () => {
      // Arrange
      const users: ImportUserData[] = [
        {
          id: 'user-1',
          email: 'test1@example.com',
          name: '測試用戶1',
          role: 'user',
          isValid: true,
          validationErrors: [],
          isDuplicate: false,
          isEdited: false,
          isSelected: true
        },
        {
          id: 'user-2',
          email: 'test2@example.com',
          name: '測試用戶2',
          role: 'user',
          isValid: true,
          validationErrors: [],
          isDuplicate: false,
          isEdited: false,
          isSelected: true
        }
      ];

      const config: UserImportConfig = {
        defaultRole: 'user',
        skipDuplicates: true,
        updateExisting: false,
        sendWelcomeEmail: true,
        generatePasswords: true,
        organizationId: 'org-123'
      };

      vi.mocked(userCreationService.userCreationService.createUser)
        .mockResolvedValue({ uid: 'uid', email: 'test@example.com', success: true });

      mockValidator.validateImportConfig.mockReturnValue({
        isValid: true,
        errors: []
      });

      const progressCallback = vi.fn();

      // Act
      await service.importUsers(users, config, progressCallback);

      // Assert
      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          isImporting: true,
          totalUsers: 2,
          processedUsers: expect.any(Number),
          currentUser: expect.stringContaining('正在創建:')
        })
      );

      // 確保最終調用標記匯入完成
      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          isImporting: false
        })
      );
    });
  });

  describe('checkExistingUsers', () => {
    it('應該檢查現有用戶並標記重複', async () => {
      // Arrange
      const users: ImportUserData[] = [
        {
          id: 'user-1',
          email: 'existing@example.com',
          name: '現有用戶',
          role: 'user',
          isValid: true,
          validationErrors: [],
          isDuplicate: false,
          isEdited: false,
          isSelected: true
        },
        {
          id: 'user-2',
          email: 'new@example.com',
          name: '新用戶',
          role: 'user',
          isValid: true,
          validationErrors: [],
          isDuplicate: false,
          isEdited: false,
          isSelected: true
        }
      ];

      vi.mocked(userCreationService.userCreationService.checkUserExists)
        .mockImplementation(async (email: string) => {
          return email === 'existing@example.com';
        });

      mockValidator.revalidateUser.mockImplementation((user, allUsers) => ({
        ...user,
        isDuplicate: user.email === 'existing@example.com',
        validationErrors: user.email === 'existing@example.com' ? ['電子郵件重複'] : []
      }));

      // Act
      const result = await service.checkExistingUsers(users);

      // Assert
      expect(result[0].isDuplicate).toBe(true);
      expect(result[1].isDuplicate).toBe(false);
      expect(mockValidator.revalidateUser).toHaveBeenCalledTimes(1);
    });
  });

  describe('validateImportConfig', () => {
    it('應該委派給 validator 驗證配置', () => {
      // Arrange
      const config: UserImportConfig = {
        defaultRole: 'user',
        skipDuplicates: true,
        updateExisting: false,
        sendWelcomeEmail: true,
        generatePasswords: true,
        organizationId: 'org-123'
      };

      const expectedResult = {
        isValid: true,
        errors: []
      };

      mockValidator.validateImportConfig.mockReturnValue(expectedResult);

      // Act
      const result = service.validateImportConfig(config);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockValidator.validateImportConfig).toHaveBeenCalledWith({
        organizationId: config.organizationId,
        defaultRole: config.defaultRole
      });
    });
  });

  describe('revalidateUser', () => {
    it('應該委派給 validator 重新驗證用戶', () => {
      // Arrange
      const user: ImportUserData = {
        id: 'user-1',
        email: 'test@example.com',
        name: '測試用戶',
        role: 'user',
        isValid: true,
        validationErrors: [],
        isDuplicate: false,
        isEdited: false,
        isSelected: true
      };

      const allUsers = [user];
      const expectedResult = { ...user, isEdited: true };

      mockValidator.revalidateUser.mockReturnValue(expectedResult);

      // Act
      const result = service.revalidateUser(user, allUsers);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockValidator.revalidateUser).toHaveBeenCalledWith(user, allUsers);
    });
  });

  describe('getImportStatistics', () => {
    it('應該委派給 validator 獲取統計', () => {
      // Arrange
      const users: ImportUserData[] = [];
      const expectedStats = {
        total: 0,
        valid: 0,
        invalid: 0,
        duplicates: 0,
        selected: 0,
        errors: 0
      };

      mockValidator.getImportStats.mockReturnValue(expectedStats);

      // Act
      const result = service.getImportStatistics(users);

      // Assert
      expect(result).toEqual(expectedStats);
      expect(mockValidator.getImportStats).toHaveBeenCalledWith(users);
    });
  });

  describe('batchSetRole', () => {
    it('應該批量設定用戶角色', () => {
      // Arrange
      const users: ImportUserData[] = [
        {
          id: 'user-1',
          email: 'test1@example.com',
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
          email: 'test2@example.com',
          name: '用戶2',
          role: 'user',
          isValid: true,
          validationErrors: [],
          isDuplicate: false,
          isEdited: false,
          isSelected: true
        }
      ];

      mockValidator.revalidateUser.mockImplementation((user) => ({
        ...user,
        role: 'admin',
        isEdited: true
      }));

      // Act
      const result = service.batchSetRole(users, 'admin', ['user-1']);

      // Assert
      expect(result[0].role).toBe('admin');
      expect(result[0].isEdited).toBe(true);
      expect(result[1].role).toBe('user'); // 未選中的用戶保持不變
      expect(mockValidator.revalidateUser).toHaveBeenCalledTimes(1);
    });
  });

  describe('batchSetDepartment', () => {
    it('應該批量設定用戶部門', () => {
      // Arrange
      const users: ImportUserData[] = [
        {
          id: 'user-1',
          email: 'test1@example.com',
          name: '用戶1',
          role: 'user',
          department: '舊部門',
          isValid: true,
          validationErrors: [],
          isDuplicate: false,
          isEdited: false,
          isSelected: true
        }
      ];

      mockValidator.revalidateUser.mockImplementation((user) => ({
        ...user,
        department: '新部門',
        isEdited: true
      }));

      // Act
      const result = service.batchSetDepartment(users, '新部門', ['user-1']);

      // Assert
      expect(result[0].department).toBe('新部門');
      expect(result[0].isEdited).toBe(true);
    });
  });

  describe('batchToggleSelection', () => {
    it('應該批量切換選擇狀態', () => {
      // Arrange
      const users: ImportUserData[] = [
        {
          id: 'user-1',
          email: 'test1@example.com',
          name: '用戶1',
          role: 'user',
          isValid: true,
          validationErrors: [],
          isDuplicate: false,
          isEdited: false,
          isSelected: false
        },
        {
          id: 'user-2',
          email: 'test2@example.com',
          name: '用戶2',
          role: 'user',
          isValid: true,
          validationErrors: [],
          isDuplicate: false,
          isEdited: false,
          isSelected: false
        }
      ];

      // Act
      const result = service.batchToggleSelection(users, true, ['user-1']);

      // Assert
      expect(result[0].isSelected).toBe(true);
      expect(result[1].isSelected).toBe(false); // 未指定的用戶保持不變
    });

    it('應該對所有用戶應用切換（當沒有指定 targetIds）', () => {
      // Arrange
      const users: ImportUserData[] = [
        {
          id: 'user-1',
          email: 'test1@example.com',
          name: '用戶1',
          role: 'user',
          isValid: true,
          validationErrors: [],
          isDuplicate: false,
          isEdited: false,
          isSelected: false
        },
        {
          id: 'user-2',
          email: 'test2@example.com',
          name: '用戶2',
          role: 'user',
          isValid: true,
          validationErrors: [],
          isDuplicate: false,
          isEdited: false,
          isSelected: false
        }
      ];

      // Act
      const result = service.batchToggleSelection(users, true);

      // Assert
      expect(result[0].isSelected).toBe(true);
      expect(result[1].isSelected).toBe(true);
    });
  });
});