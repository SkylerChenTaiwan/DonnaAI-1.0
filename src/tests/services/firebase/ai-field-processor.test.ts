/**
 * AI 欄位處理服務單元測試
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import {
  extractFieldsFromRecord,
  autoFillCustomerFields,
  generateFieldSuggestions,
  processFieldDescription,
  updateCustomerFieldsWithAI
} from '../../../services/firebase/ai-field-processor';
import { RecordDoc } from '../../../types/record';
import { CustomFieldDefinition, AIFieldMapping } from '../../../types/custom-fields';
import * as aiIntegrationService from '../../../services/api/ai-integration';
import * as customFieldsService from '../../../services/firebase/custom-fields';
import * as customersService from '../../../services/firebase/customers';
import * as aiConfirmationsService from '../../../services/firebase/ai-confirmations';

// Mock dependencies
vi.mock('../../../services/api/ai-integration');
vi.mock('../../../services/firebase/custom-fields');
vi.mock('../../../services/firebase/customers');
vi.mock('../../../services/firebase/ai-confirmations');

describe('AI Field Processor Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('extractFieldsFromRecord', () => {
    it('應該從紀錄中提取欄位值', async () => {
      // Arrange
      const record: RecordDoc = {
        id: 'record123',
        type: 'meeting',
        title: '產品會議',
        content: '討論了新產品的價格策略，決定將產品定價設為 $999',
        aiSummary: '會議討論了新產品定價策略',
        transcription: '我們決定新產品的價格是 999 美元',
        status: 'completed',
        teamId: 'team123',
        organizationId: 'org123',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user123'
      };

      const fieldDefinitions: CustomFieldDefinition[] = [
        {
          id: 'field1',
          fieldKey: 'productPrice',
          fieldName: '產品價格',
          fieldType: 'number',
          required: false,
          organizationId: 'org123',
          entityType: 'customer',
          createdBy: 'user123',
          createdAt: new Date(),
          permissions: { canEdit: [] },
          aiFieldInterpretation: {
            userDescription: '產品的定價',
            aiProcessedDescription: '從會議或對話中提取產品價格資訊',
            extractionRules: ['尋找價格相關的數字'],
            examples: ['$1000', '999美元']
          }
        }
      ];

      vi.mocked(customFieldsService.getCustomFieldDefinitions).mockResolvedValue(fieldDefinitions);

      const mockAIResponse = {
        fieldMappings: [
          {
            fieldKey: 'productPrice',
            confidence: 0.9,
            extractedValue: 999,
            reason: '從轉錄文字中找到明確的價格資訊',
            requiresConfirmation: false
          }
        ],
        processingMetadata: {
          modelUsed: 'gpt-4',
          processingTime: 1500,
          totalConfidence: 0.9
        }
      };

      vi.mocked(aiIntegrationService.extractFieldsFromContent).mockResolvedValue(mockAIResponse);

      // Act
      const result = await extractFieldsFromRecord(record, 'org123');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        fieldKey: 'productPrice',
        confidence: 0.9,
        extractedValue: 999,
        reason: '從轉錄文字中找到明確的價格資訊'
      });
    });

    it('應該處理沒有 AI 處理內容的紀錄', async () => {
      // Arrange
      const record: RecordDoc = {
        id: 'record123',
        type: 'note',
        title: '簡單筆記',
        content: '今天天氣很好',
        status: 'completed',
        teamId: 'team123',
        organizationId: 'org123',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user123'
      };

      vi.mocked(customFieldsService.getCustomFieldDefinitions).mockResolvedValue([]);

      // Act
      const result = await extractFieldsFromRecord(record, 'org123');

      // Assert
      expect(result).toHaveLength(0);
    });
  });

  describe('autoFillCustomerFields', () => {
    it('應該自動填入高信心度的欄位', async () => {
      // Arrange
      const fieldMappings: AIFieldMapping[] = [
        {
          fieldKey: 'industry',
          confidence: 0.95,
          extractedValue: '科技業',
          requiresConfirmation: false
        },
        {
          fieldKey: 'revenue',
          confidence: 0.85,
          extractedValue: 1000000,
          requiresConfirmation: false
        },
        {
          fieldKey: 'employeeCount',
          confidence: 0.6,
          extractedValue: 50,
          requiresConfirmation: true
        }
      ];

      vi.mocked(customersService.updateCustomerAIFields).mockResolvedValue(undefined);
      vi.mocked(aiConfirmationsService.createConfirmationRequest).mockResolvedValue('confirmation123');

      // Act
      const result = await autoFillCustomerFields('customer123', fieldMappings, 'record123', 'org123');

      // Assert
      expect(result).toMatchObject({
        autoFilledFields: ['industry', 'revenue'],
        pendingConfirmationFields: ['employeeCount'],
        confirmationId: 'confirmation123'
      });

      // 驗證只有高信心度的欄位被自動填入
      expect(customersService.updateCustomerAIFields).toHaveBeenCalledWith(
        'customer123',
        {
          industry: '科技業',
          revenue: 1000000
        },
        'record123'
      );
    });

    it('應該處理所有欄位都需要確認的情況', async () => {
      // Arrange
      const fieldMappings: AIFieldMapping[] = [
        {
          fieldKey: 'industry',
          confidence: 0.5,
          extractedValue: '可能是製造業',
          requiresConfirmation: true
        }
      ];

      vi.mocked(aiConfirmationsService.createConfirmationRequest).mockResolvedValue('confirmation123');

      // Act
      const result = await autoFillCustomerFields('customer123', fieldMappings, 'record123', 'org123');

      // Assert
      expect(result).toMatchObject({
        autoFilledFields: [],
        pendingConfirmationFields: ['industry'],
        confirmationId: 'confirmation123'
      });

      expect(customersService.updateCustomerAIFields).not.toHaveBeenCalled();
    });
  });

  describe('generateFieldSuggestions', () => {
    it('應該生成欄位建議值', async () => {
      // Arrange
      const content = '客戶在台北市信義區，主要業務是軟體開發';
      const fieldDef: CustomFieldDefinition = {
        id: 'field1',
        fieldKey: 'location',
        fieldName: '地點',
        fieldType: 'text',
        required: false,
        organizationId: 'org123',
        entityType: 'customer',
        createdBy: 'user123',
        createdAt: new Date(),
        permissions: { canEdit: [] }
      };

      const mockAIResponse = {
        suggestions: [
          { value: '台北市信義區', confidence: 0.95 },
          { value: '信義區', confidence: 0.8 },
          { value: '台北', confidence: 0.7 }
        ]
      };

      vi.mocked(aiIntegrationService.generateSuggestions).mockResolvedValue(mockAIResponse);

      // Act
      const result = await generateFieldSuggestions(content, fieldDef);

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({
        value: '台北市信義區',
        confidence: 0.95
      });
    });
  });

  describe('processFieldDescription', () => {
    it('應該處理使用者的欄位描述', async () => {
      // Arrange
      const userDescription = '我想追蹤每個客戶最後一次購買的產品名稱和日期';

      const mockAIResponse = {
        structuredDescription: '追蹤客戶的最後購買紀錄',
        fieldType: 'text',
        extractionHints: [
          '尋找產品名稱關鍵字',
          '識別購買或訂購相關的日期'
        ],
        examples: ['iPhone 14 - 2024/01/15', '筆記型電腦 - 2023/12/20'],
        synonyms: ['購買', '訂購', '採購', '買']
      };

      vi.mocked(aiIntegrationService.interpretFieldDescription).mockResolvedValue(mockAIResponse);

      // Act
      const result = await processFieldDescription(userDescription);

      // Assert
      expect(result).toMatchObject({
        aiProcessedDescription: '追蹤客戶的最後購買紀錄',
        extractionRules: expect.arrayContaining(['尋找產品名稱關鍵字']),
        examples: expect.arrayContaining(['iPhone 14 - 2024/01/15']),
        synonyms: expect.arrayContaining(['購買', '訂購'])
      });
    });
  });

  describe('updateCustomerFieldsWithAI', () => {
    it('應該批量更新多個客戶的欄位', async () => {
      // Arrange
      const customerIds = ['customer1', 'customer2'];
      const fieldMappings: AIFieldMapping[] = [
        {
          fieldKey: 'status',
          confidence: 0.9,
          extractedValue: '活躍',
          requiresConfirmation: false
        }
      ];

      vi.mocked(customersService.batchUpdateCustomers).mockResolvedValue(undefined);

      // Act
      await updateCustomerFieldsWithAI(customerIds, fieldMappings, 'user123');

      // Assert
      expect(customersService.batchUpdateCustomers).toHaveBeenCalledWith(
        customerIds,
        {
          customFields: {
            status: '活躍'
          }
        },
        'user123'
      );
    });

    it('應該過濾低信心度的欄位', async () => {
      // Arrange
      const customerIds = ['customer1'];
      const fieldMappings: AIFieldMapping[] = [
        {
          fieldKey: 'highConfidence',
          confidence: 0.85,
          extractedValue: '高',
          requiresConfirmation: false
        },
        {
          fieldKey: 'lowConfidence',
          confidence: 0.4,
          extractedValue: '低',
          requiresConfirmation: true
        }
      ];

      vi.mocked(customersService.batchUpdateCustomers).mockResolvedValue(undefined);

      // Act
      await updateCustomerFieldsWithAI(customerIds, fieldMappings, 'user123');

      // Assert
      expect(customersService.batchUpdateCustomers).toHaveBeenCalledWith(
        customerIds,
        {
          customFields: {
            highConfidence: '高'
            // lowConfidence 被過濾掉了
          }
        },
        'user123'
      );
    });
  });
});