/**
 * 自訂欄位服務單元測試
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
  orderBy
} from 'firebase/firestore';
import {
  createCustomFieldDefinition,
  updateCustomFieldDefinition,
  deleteCustomFieldDefinition,
  getCustomFieldDefinitions,
  validateCustomFields
} from '../../../services/firebase/custom-fields';
import { CustomFieldDefinition } from '../../../types/custom-fields';

// Mock Firebase
vi.mock('firebase/firestore');
vi.mock('../../../services/firebase/config', () => ({
  db: {}
}));
vi.mock('../../../services/firebase/permissions', () => ({
  canDefineCustomFields: vi.fn(),
  isOrgAdmin: vi.fn()
}));

describe('Custom Fields Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCustomFieldDefinition', () => {
    it('應該成功建立自訂欄位定義', async () => {
      // Arrange
      const mockCanDefineCustomFields = vi.fn().mockResolvedValue(true);
      vi.mocked(require('../../../services/firebase/permissions').canDefineCustomFields).mockImplementation(mockCanDefineCustomFields);
      
      const mockQuerySnapshot = {
        empty: true
      };
      (getDocs as Mock).mockResolvedValue(mockQuerySnapshot);
      (setDoc as Mock).mockResolvedValue(undefined);

      const fieldDef: Omit<CustomFieldDefinition, 'id' | 'createdAt'> = {
        fieldKey: 'contactPerson',
        fieldName: '聯絡人',
        fieldType: 'text',
        required: true,
        organizationId: 'org123',
        entityType: 'customer',
        createdBy: 'user123',
        permissions: {
          canEdit: ['admin', 'user123']
        }
      };

      // Act
      const result = await createCustomFieldDefinition(fieldDef, 'user123');

      // Assert
      expect(mockCanDefineCustomFields).toHaveBeenCalledWith('user123', 'org123');
      expect(setDoc).toHaveBeenCalled();
      expect(result).toMatchObject({
        ...fieldDef,
        id: expect.any(String),
        createdAt: expect.any(Object)
      });
    });

    it('應該拒絕沒有權限的使用者', async () => {
      // Arrange
      const mockCanDefineCustomFields = vi.fn().mockResolvedValue(false);
      vi.mocked(require('../../../services/firebase/permissions').canDefineCustomFields).mockImplementation(mockCanDefineCustomFields);

      const fieldDef: Omit<CustomFieldDefinition, 'id' | 'createdAt'> = {
        fieldKey: 'testField',
        fieldName: '測試欄位',
        fieldType: 'text',
        required: false,
        organizationId: 'org123',
        entityType: 'customer',
        createdBy: 'user123',
        permissions: {
          canEdit: []
        }
      };

      // Act & Assert
      await expect(createCustomFieldDefinition(fieldDef, 'user123'))
        .rejects.toThrow('您沒有權限定義自訂欄位');
    });

    it('應該防止重複的欄位鍵值', async () => {
      // Arrange
      const mockCanDefineCustomFields = vi.fn().mockResolvedValue(true);
      vi.mocked(require('../../../services/firebase/permissions').canDefineCustomFields).mockImplementation(mockCanDefineCustomFields);
      
      const mockQuerySnapshot = {
        empty: false
      };
      (getDocs as Mock).mockResolvedValue(mockQuerySnapshot);

      const fieldDef: Omit<CustomFieldDefinition, 'id' | 'createdAt'> = {
        fieldKey: 'duplicateKey',
        fieldName: '重複欄位',
        fieldType: 'text',
        required: false,
        organizationId: 'org123',
        entityType: 'customer',
        createdBy: 'user123',
        permissions: {
          canEdit: []
        }
      };

      // Act & Assert
      await expect(createCustomFieldDefinition(fieldDef, 'user123'))
        .rejects.toThrow('欄位鍵值已存在');
    });
  });

  describe('validateCustomFields', () => {
    it('應該驗證必填欄位', () => {
      // Arrange
      const fieldDefinitions: CustomFieldDefinition[] = [
        {
          id: 'field1',
          fieldKey: 'requiredField',
          fieldName: '必填欄位',
          fieldType: 'text',
          required: true,
          organizationId: 'org123',
          entityType: 'customer',
          createdBy: 'user123',
          createdAt: new Date(),
          permissions: { canEdit: [] }
        }
      ];

      const customFields = {};

      // Act
      const errors = validateCustomFields(fieldDefinitions, customFields);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0]).toMatchObject({
        fieldKey: 'requiredField',
        error: '必填欄位 為必填項目'
      });
    });

    it('應該驗證欄位類型', () => {
      // Arrange
      const fieldDefinitions: CustomFieldDefinition[] = [
        {
          id: 'field1',
          fieldKey: 'numberField',
          fieldName: '數字欄位',
          fieldType: 'number',
          required: false,
          organizationId: 'org123',
          entityType: 'customer',
          createdBy: 'user123',
          createdAt: new Date(),
          permissions: { canEdit: [] }
        }
      ];

      const customFields = {
        numberField: 'not a number'
      };

      // Act
      const errors = validateCustomFields(fieldDefinitions, customFields);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0]).toMatchObject({
        fieldKey: 'numberField',
        error: '數字欄位 必須是數字'
      });
    });

    it('應該驗證選項欄位', () => {
      // Arrange
      const fieldDefinitions: CustomFieldDefinition[] = [
        {
          id: 'field1',
          fieldKey: 'selectField',
          fieldName: '選擇欄位',
          fieldType: 'select',
          required: false,
          options: ['選項1', '選項2', '選項3'],
          organizationId: 'org123',
          entityType: 'customer',
          createdBy: 'user123',
          createdAt: new Date(),
          permissions: { canEdit: [] }
        }
      ];

      const customFields = {
        selectField: '無效選項'
      };

      // Act
      const errors = validateCustomFields(fieldDefinitions, customFields);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0]).toMatchObject({
        fieldKey: 'selectField',
        error: '選擇欄位 的值必須是有效選項'
      });
    });

    it('應該通過有效的自訂欄位', () => {
      // Arrange
      const fieldDefinitions: CustomFieldDefinition[] = [
        {
          id: 'field1',
          fieldKey: 'textField',
          fieldName: '文字欄位',
          fieldType: 'text',
          required: true,
          organizationId: 'org123',
          entityType: 'customer',
          createdBy: 'user123',
          createdAt: new Date(),
          permissions: { canEdit: [] }
        },
        {
          id: 'field2',
          fieldKey: 'numberField',
          fieldName: '數字欄位',
          fieldType: 'number',
          required: false,
          organizationId: 'org123',
          entityType: 'customer',
          createdBy: 'user123',
          createdAt: new Date(),
          permissions: { canEdit: [] }
        }
      ];

      const customFields = {
        textField: '有效文字',
        numberField: 123
      };

      // Act
      const errors = validateCustomFields(fieldDefinitions, customFields);

      // Assert
      expect(errors).toHaveLength(0);
    });
  });

  describe('getCustomFieldDefinitions', () => {
    it('應該獲取組織的自訂欄位定義', async () => {
      // Arrange
      const mockDocs = [
        {
          id: 'field1',
          data: () => ({
            fieldKey: 'field1',
            fieldName: '欄位1',
            fieldType: 'text'
          })
        },
        {
          id: 'field2',
          data: () => ({
            fieldKey: 'field2',
            fieldName: '欄位2',
            fieldType: 'number'
          })
        }
      ];

      const mockQuerySnapshot = {
        docs: mockDocs
      };

      (getDocs as Mock).mockResolvedValue(mockQuerySnapshot);

      // Act
      const result = await getCustomFieldDefinitions('org123', 'customer');

      // Assert
      expect(query).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'field1',
        fieldKey: 'field1',
        fieldName: '欄位1'
      });
    });
  });

  describe('updateCustomFieldDefinition', () => {
    it('應該更新自訂欄位定義', async () => {
      // Arrange
      const mockDoc = {
        exists: () => true,
        data: () => ({
          organizationId: 'org123',
          createdBy: 'user123'
        })
      };
      (getDoc as Mock).mockResolvedValue(mockDoc);

      const mockCanEdit = vi.fn().mockResolvedValue(true);
      vi.mocked(require('../../../services/firebase/permissions').canEditCustomFieldDefinition).mockImplementation(mockCanEdit);

      (updateDoc as Mock).mockResolvedValue(undefined);

      const updates = {
        fieldName: '更新的欄位名稱',
        required: true
      };

      // Act
      await updateCustomFieldDefinition('field123', updates, 'user123');

      // Assert
      expect(updateDoc).toHaveBeenCalled();
      expect(mockCanEdit).toHaveBeenCalledWith('user123', 'field123');
    });

    it('應該拒絕沒有權限的更新', async () => {
      // Arrange
      const mockDoc = {
        exists: () => true,
        data: () => ({
          organizationId: 'org123',
          createdBy: 'otherUser'
        })
      };
      (getDoc as Mock).mockResolvedValue(mockDoc);

      const mockCanEdit = vi.fn().mockResolvedValue(false);
      vi.mocked(require('../../../services/firebase/permissions').canEditCustomFieldDefinition).mockImplementation(mockCanEdit);

      // Act & Assert
      await expect(updateCustomFieldDefinition('field123', {}, 'user123'))
        .rejects.toThrow('您沒有權限編輯此欄位定義');
    });
  });
});