/**
 * 客戶服務單元測試
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import {
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomer,
  getCustomers,
  getCustomerWithRelations
} from '../../../services/firebase/customers';
import { CustomerDoc } from '../../../types/firebase';
import * as customFieldsService from '../../../services/firebase/custom-fields';
import * as permissionsService from '../../../services/firebase/permissions';

// Mock Firebase
vi.mock('firebase/firestore');
vi.mock('../../../services/firebase/config', () => ({
  db: {}
}));
vi.mock('../../../services/firebase/custom-fields');
vi.mock('../../../services/firebase/permissions');
vi.mock('../../../services/firebase/records');
vi.mock('../../../services/firebase/tasks');

describe('Customers Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCustomer', () => {
    it('應該成功建立客戶', async () => {
      // Arrange
      const mockValidateCustomFields = vi.fn().mockReturnValue([]);
      vi.mocked(customFieldsService.validateCustomFields).mockImplementation(mockValidateCustomFields);
      
      const mockFieldDefinitions = [
        { fieldKey: 'industry', fieldType: 'text', required: false }
      ];
      vi.mocked(customFieldsService.getCustomFieldDefinitions).mockResolvedValue(mockFieldDefinitions as any);
      
      (setDoc as Mock).mockResolvedValue(undefined);

      const customerData: Omit<CustomerDoc, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> = {
        name: '王小明',
        company: 'ABC 公司',
        email: 'wang@abc.com',
        phone: '0912345678',
        address: '台北市信義區',
        teamId: 'team123',
        assignedTo: 'user456',
        tags: ['重要客戶'],
        customFields: {
          industry: '科技業'
        },
        organizationId: 'org123'
      };

      // Act
      const result = await createCustomer(customerData, 'user123');

      // Assert
      expect(setDoc).toHaveBeenCalled();
      expect(result).toMatchObject({
        ...customerData,
        id: expect.stringMatching(/^customer_/),
        createdBy: 'user123',
        createdAt: expect.any(Timestamp),
        updatedAt: expect.any(Timestamp)
      });
    });

    it('應該驗證必填欄位', async () => {
      // Arrange
      const customerData = {
        email: 'test@example.com'
      } as any;

      // Act & Assert
      await expect(createCustomer(customerData, 'user123'))
        .rejects.toThrow('客戶姓名和公司名稱為必填欄位');
    });

    it('應該驗證自訂欄位', async () => {
      // Arrange
      const mockValidateCustomFields = vi.fn().mockReturnValue([
        { fieldKey: 'industry', error: '產業別為必填欄位' }
      ]);
      vi.mocked(customFieldsService.validateCustomFields).mockImplementation(mockValidateCustomFields);
      
      vi.mocked(customFieldsService.getCustomFieldDefinitions).mockResolvedValue([
        { fieldKey: 'industry', fieldType: 'text', required: true }
      ] as any);

      const customerData: Omit<CustomerDoc, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> = {
        name: '測試客戶',
        company: '測試公司',
        customFields: {},
        organizationId: 'org123',
        teamId: 'team123'
      };

      // Act & Assert
      await expect(createCustomer(customerData, 'user123'))
        .rejects.toThrow('自訂欄位驗證失敗: 產業別為必填欄位');
    });
  });

  describe('updateCustomer', () => {
    it('應該成功更新客戶資料', async () => {
      // Arrange
      vi.mocked(permissionsService.canEditCustomer).mockResolvedValue(true);
      
      const mockDoc = {
        exists: () => true,
        data: () => ({
          name: '原始客戶',
          company: '原始公司',
          organizationId: 'org123',
          customFields: { industry: '製造業' }
        })
      };
      (getDoc as Mock).mockResolvedValue(mockDoc);
      
      vi.mocked(customFieldsService.getCustomFieldDefinitions).mockResolvedValue([]);
      vi.mocked(customFieldsService.validateCustomFields).mockReturnValue([]);
      
      (updateDoc as Mock).mockResolvedValue(undefined);

      const updates = {
        name: '更新的客戶名稱',
        customFields: { industry: '服務業' }
      };

      // Act
      await updateCustomer('customer123', updates, 'user123');

      // Assert
      expect(updateDoc).toHaveBeenCalled();
      expect(permissionsService.canEditCustomer).toHaveBeenCalledWith('user123', 'customer123');
    });

    it('應該拒絕沒有權限的更新', async () => {
      // Arrange
      vi.mocked(permissionsService.canEditCustomer).mockResolvedValue(false);

      // Act & Assert
      await expect(updateCustomer('customer123', {}, 'user123'))
        .rejects.toThrow('您沒有權限編輯此客戶');
    });
  });

  describe('getCustomer', () => {
    it('應該獲取客戶資料', async () => {
      // Arrange
      vi.mocked(permissionsService.canViewCustomer).mockResolvedValue(true);
      
      const mockDoc = {
        exists: () => true,
        id: 'customer123',
        data: () => ({
          name: '測試客戶',
          company: '測試公司',
          email: 'test@example.com'
        })
      };
      (getDoc as Mock).mockResolvedValue(mockDoc);

      // Act
      const result = await getCustomer('customer123', 'user123');

      // Assert
      expect(result).toMatchObject({
        id: 'customer123',
        name: '測試客戶',
        company: '測試公司',
        email: 'test@example.com'
      });
    });

    it('應該返回 null 當客戶不存在', async () => {
      // Arrange
      vi.mocked(permissionsService.canViewCustomer).mockResolvedValue(true);
      
      const mockDoc = {
        exists: () => false
      };
      (getDoc as Mock).mockResolvedValue(mockDoc);

      // Act
      const result = await getCustomer('nonexistent', 'user123');

      // Assert
      expect(result).toBeNull();
    });

    it('應該拒絕沒有權限的查看', async () => {
      // Arrange
      vi.mocked(permissionsService.canViewCustomer).mockResolvedValue(false);

      // Act & Assert
      await expect(getCustomer('customer123', 'user123'))
        .rejects.toThrow('您沒有權限查看此客戶');
    });
  });

  describe('getCustomers', () => {
    it('應該獲取客戶列表並過濾權限', async () => {
      // Arrange
      const mockDocs = [
        {
          id: 'customer1',
          data: () => ({
            name: '客戶1',
            company: '公司1',
            email: 'customer1@example.com',
            teamId: 'team123'
          })
        },
        {
          id: 'customer2',
          data: () => ({
            name: '客戶2',
            company: '公司2',
            email: 'customer2@example.com',
            teamId: 'team123'
          })
        },
        {
          id: 'customer3',
          data: () => ({
            name: '客戶3',
            company: '公司3',
            email: 'customer3@example.com',
            teamId: 'team456'
          })
        }
      ];

      const mockQuerySnapshot = {
        docs: mockDocs
      };

      (getDocs as Mock).mockResolvedValue(mockQuerySnapshot);
      
      // 模擬權限檢查：只能查看 customer1 和 customer2
      vi.mocked(permissionsService.canViewCustomer)
        .mockImplementation(async (userId: string, customerId: string) => {
          return customerId !== 'customer3';
        });

      // Act
      const result = await getCustomers('user123', 'team123');

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('customer1');
      expect(result[1].id).toBe('customer2');
    });

    it('應該支援搜尋過濾', async () => {
      // Arrange
      const mockDocs = [
        {
          id: 'customer1',
          data: () => ({
            name: '王小明',
            company: 'ABC 公司',
            email: 'wang@abc.com',
            phone: '0912345678'
          })
        },
        {
          id: 'customer2',
          data: () => ({
            name: '李大華',
            company: 'XYZ 公司',
            email: 'lee@xyz.com',
            phone: '0987654321'
          })
        }
      ];

      const mockQuerySnapshot = {
        docs: mockDocs
      };

      (getDocs as Mock).mockResolvedValue(mockQuerySnapshot);
      vi.mocked(permissionsService.canViewCustomer).mockResolvedValue(true);

      // Act
      const result = await getCustomers('user123', undefined, {
        searchTerm: '王小明'
      });

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('王小明');
    });
  });

  describe('getCustomerWithRelations', () => {
    it('應該獲取客戶及相關資料', async () => {
      // Arrange
      vi.mocked(permissionsService.canViewCustomer).mockResolvedValue(true);
      
      const mockCustomer = {
        id: 'customer123',
        name: '測試客戶',
        company: '測試公司',
        organizationId: 'org123'
      };
      
      vi.mocked(getCustomer).mockResolvedValue(mockCustomer as any);
      
      const mockFieldDefinitions = [
        { fieldKey: 'industry', fieldName: '產業別' }
      ];
      vi.mocked(customFieldsService.getCustomFieldDefinitions).mockResolvedValue(mockFieldDefinitions as any);
      
      const mockRecords = [
        { id: 'record1', title: '會議紀錄1' },
        { id: 'record2', title: '會議紀錄2' }
      ];
      vi.mocked(require('../../../services/firebase/records').getRecordsByCustomer).mockResolvedValue(mockRecords);
      
      const mockTasks = [
        { id: 'task1', title: '任務1' }
      ];
      vi.mocked(require('../../../services/firebase/tasks').getTasksByCustomer).mockResolvedValue(mockTasks);

      // Act
      const result = await getCustomerWithRelations('customer123', 'user123');

      // Assert
      expect(result).toMatchObject({
        customer: mockCustomer,
        customFieldDefinitions: mockFieldDefinitions,
        relatedRecords: mockRecords,
        relatedTasks: mockTasks
      });
    });

    it('應該返回 null 當客戶不存在', async () => {
      // Arrange
      vi.mocked(permissionsService.canViewCustomer).mockResolvedValue(true);
      vi.mocked(getCustomer).mockResolvedValue(null);

      // Act
      const result = await getCustomerWithRelations('nonexistent', 'user123');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('deleteCustomer', () => {
    it('應該允許管理員刪除客戶', async () => {
      // Arrange
      vi.mocked(permissionsService.isOrgAdmin).mockResolvedValue(true);
      (deleteDoc as Mock).mockResolvedValue(undefined);

      // Act
      await deleteCustomer('customer123', 'admin123');

      // Assert
      expect(deleteDoc).toHaveBeenCalled();
      expect(permissionsService.isOrgAdmin).toHaveBeenCalledWith('admin123');
    });

    it('應該拒絕非管理員刪除客戶', async () => {
      // Arrange
      vi.mocked(permissionsService.isOrgAdmin).mockResolvedValue(false);

      // Act & Assert
      await expect(deleteCustomer('customer123', 'user123'))
        .rejects.toThrow('只有管理員可以刪除客戶');
    });
  });
});