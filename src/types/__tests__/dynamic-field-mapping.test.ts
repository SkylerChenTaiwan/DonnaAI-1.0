/**
 * 動態欄位映射系統類型測試
 */

import { 
  DynamicFieldConfig,
  FieldDataType,
  CSVAnalysisResult,
  FieldMappingConfig,
  ImportConfig,
  ValidationResult,
  ShardingConfig,
  isValidFieldDataType,
  isValidImportStatus,
  isValidationError,
  isFieldValueEmpty,
  requiresSharding,
  FIRESTORE_LIMITS,
  DEFAULT_SHARDING_CONFIG,
  DEFAULT_IMPORT_OPTIONS,
  FIELD_TYPE_VALIDATION_RULES
} from '../dynamic-field-mapping';
import { Timestamp } from 'firebase/firestore';

describe('動態欄位映射類型測試', () => {
  
  describe('Type Guards', () => {
    
    describe('isValidFieldDataType', () => {
      it('應該正確識別有效的欄位類型', () => {
        expect(isValidFieldDataType('text')).toBe(true);
        expect(isValidFieldDataType('number')).toBe(true);
        expect(isValidFieldDataType('date')).toBe(true);
        expect(isValidFieldDataType('email')).toBe(true);
        expect(isValidFieldDataType('phone')).toBe(true);
        expect(isValidFieldDataType('boolean')).toBe(true);
        expect(isValidFieldDataType('currency')).toBe(true);
        expect(isValidFieldDataType('percentage')).toBe(true);
      });
      
      it('應該拒絕無效的欄位類型', () => {
        expect(isValidFieldDataType('invalid')).toBe(false);
        expect(isValidFieldDataType(123)).toBe(false);
        expect(isValidFieldDataType(null)).toBe(false);
        expect(isValidFieldDataType(undefined)).toBe(false);
        expect(isValidFieldDataType({})).toBe(false);
      });
    });
    
    describe('isValidImportStatus', () => {
      it('應該正確識別有效的匯入狀態', () => {
        expect(isValidImportStatus('pending')).toBe(true);
        expect(isValidImportStatus('analyzing')).toBe(true);
        expect(isValidImportStatus('completed')).toBe(true);
        expect(isValidImportStatus('failed')).toBe(true);
      });
      
      it('應該拒絕無效的匯入狀態', () => {
        expect(isValidImportStatus('invalid_status')).toBe(false);
        expect(isValidImportStatus(123)).toBe(false);
        expect(isValidImportStatus(null)).toBe(false);
      });
    });
    
    describe('isValidationError', () => {
      it('應該正確識別驗證錯誤物件', () => {
        const validError = {
          code: 'FIELD_REQUIRED',
          message: '此欄位為必填',
          field: 'email'
        };
        expect(isValidationError(validError)).toBe(true);
      });
      
      it('應該拒絕無效的錯誤物件', () => {
        expect(isValidationError({})).toBe(false);
        expect(isValidationError({ code: 'ERROR' })).toBe(false);
        expect(isValidationError({ message: 'Error' })).toBe(false);
        expect(isValidationError(null)).toBe(false);
        expect(isValidationError('error')).toBe(false);
      });
    });
    
    describe('isFieldValueEmpty', () => {
      it('應該正確識別空值', () => {
        expect(isFieldValueEmpty(null)).toBe(true);
        expect(isFieldValueEmpty(undefined)).toBe(true);
        expect(isFieldValueEmpty('')).toBe(true);
        expect(isFieldValueEmpty([])).toBe(true);
        expect(isFieldValueEmpty({})).toBe(true);
      });
      
      it('應該正確識別非空值', () => {
        expect(isFieldValueEmpty('text')).toBe(false);
        expect(isFieldValueEmpty(0)).toBe(false);
        expect(isFieldValueEmpty(false)).toBe(false);
        expect(isFieldValueEmpty([1, 2, 3])).toBe(false);
        expect(isFieldValueEmpty({ key: 'value' })).toBe(false);
      });
    });
    
    describe('requiresSharding', () => {
      const config: ShardingConfig = {
        enabled: true,
        strategy: 'size',
        maxShardSize: 1000,
        maxRecordsPerShard: 10
      };
      
      it('應該在資料超過大小限制時返回 true', () => {
        const largeData = 'x'.repeat(2000);
        expect(requiresSharding(largeData, config)).toBe(true);
      });
      
      it('應該在資料未超過限制時返回 false', () => {
        const smallData = 'small';
        expect(requiresSharding(smallData, config)).toBe(false);
      });
      
      it('應該在分片禁用時返回 false', () => {
        const disabledConfig = { ...config, enabled: false };
        const largeData = 'x'.repeat(2000);
        expect(requiresSharding(largeData, disabledConfig)).toBe(false);
      });
      
      it('應該正確處理陣列計數策略', () => {
        const countConfig: ShardingConfig = {
          enabled: true,
          strategy: 'count',
          maxShardSize: 1000,
          maxRecordsPerShard: 5
        };
        
        expect(requiresSharding([1, 2, 3], countConfig)).toBe(false);
        expect(requiresSharding([1, 2, 3, 4, 5, 6], countConfig)).toBe(true);
      });
    });
  });
  
  describe('類型完整性測試', () => {
    
    it('應該能創建完整的 DynamicFieldConfig', () => {
      const fieldConfig: DynamicFieldConfig = {
        id: 'field-1',
        fieldKey: 'customer_name',
        displayName: '客戶姓名',
        dataType: 'text',
        description: '客戶的全名',
        defaultValue: '',
        isSystem: false,
        isActive: true,
        isSearchable: true,
        isSortable: true,
        validationRules: [
          {
            type: 'required',
            message: '客戶姓名為必填',
            severity: 'error'
          },
          {
            type: 'maxLength',
            value: 100,
            message: '姓名不能超過 100 字元',
            severity: 'warning'
          }
        ],
        formatting: {
          textTransform: 'capitalize'
        },
        security: {
          level: 'internal',
          readRoles: ['admin', 'user'],
          writeRoles: ['admin'],
          encrypted: false,
          auditLog: true,
          isPII: true
        },
        usage: {
          usageCount: 150,
          lastUsedAt: Timestamp.now(),
          nullRatio: 0.05,
          uniqueValueCount: 120,
          topValues: [
            { value: '王小明', count: 5 },
            { value: '李大華', count: 3 }
          ]
        },
        metadata: {
          createdBy: 'user-123',
          createdAt: Timestamp.now(),
          updatedBy: 'user-123',
          updatedAt: Timestamp.now(),
          source: 'customers.csv',
          originalName: 'Name',
          tags: ['customer', 'required']
        }
      };
      
      expect(fieldConfig).toBeDefined();
      expect(fieldConfig.dataType).toBe('text');
      expect(fieldConfig.security.isPII).toBe(true);
    });
    
    it('應該能創建 CSVAnalysisResult', () => {
      const analysisResult: CSVAnalysisResult = {
        id: 'analysis-1',
        fileInfo: {
          fileName: 'customers.csv',
          fileSize: 1024000,
          encoding: 'UTF-8',
          delimiter: ',',
          hasHeader: true,
          rowCount: 1000,
          columnCount: 10,
          fileHash: 'abc123'
        },
        detectedFields: [
          {
            index: 0,
            originalName: 'Customer Name',
            cleanedName: 'customer_name',
            inferredType: 'text',
            typeConfidence: 0.95,
            sampleValues: ['王小明', '李大華', '張三'],
            nullCount: 5,
            uniqueCount: 950,
            possibleFormats: ['full_name'],
            semanticType: 'person_name'
          }
        ],
        dataPreview: [
          { customer_name: '王小明', email: 'wang@example.com' },
          { customer_name: '李大華', email: 'lee@example.com' }
        ],
        statistics: {
          totalRecords: 1000,
          validRecords: 990,
          errorRecords: 5,
          duplicateRecords: 5,
          completeness: 0.95,
          fieldStatistics: {
            customer_name: {
              nullRatio: 0.005,
              uniqueRatio: 0.95
            }
          }
        },
        dataQuality: {
          overallScore: 85,
          issues: [
            {
              type: 'missing_value',
              severity: 'low',
              affectedFields: ['phone'],
              affectedRecords: 50,
              description: '50 筆記錄缺少電話號碼',
              suggestedFix: '考慮將電話設為選填欄位'
            }
          ],
          recommendations: [
            '建議清理重複記錄',
            '建議驗證電子郵件格式'
          ]
        },
        analyzedAt: Timestamp.now(),
        processingTime: 1500
      };
      
      expect(analysisResult).toBeDefined();
      expect(analysisResult.fileInfo.rowCount).toBe(1000);
      expect(analysisResult.dataQuality.overallScore).toBe(85);
    });
    
    it('應該能創建 FieldMappingConfig', () => {
      const mappingConfig: FieldMappingConfig = {
        id: 'mapping-1',
        name: '客戶資料映射',
        sourceSystem: 'CRM',
        targetEntity: 'customer',
        mappings: [
          {
            sourceField: 'Name',
            targetField: 'customer_name',
            isRequired: true,
            transformer: 'trim',
            defaultValue: '',
            aiAssisted: {
              confidence: 0.95,
              alternativeMappings: ['name', 'full_name'],
              reasoning: '欄位名稱和內容都符合客戶姓名'
            }
          }
        ],
        transformations: [
          {
            id: 'trans-1',
            name: '格式化電話號碼',
            type: 'format',
            inputFields: ['phone'],
            outputField: 'formatted_phone',
            parameters: {
              format: 'international'
            },
            order: 1
          }
        ],
        validation: {
          enabled: true,
          rules: [],
          onFailure: 'flag',
          errorThreshold: 0.1
        },
        errorHandling: {
          onError: 'skip',
          maxRetries: 3,
          retryDelay: 1000,
          fallbackStrategy: 'default',
          logErrors: true,
          notifyAdmin: false
        },
        version: 1,
        isActive: true,
        metadata: {
          createdAt: Timestamp.now(),
          createdBy: 'user-123',
          updatedAt: Timestamp.now(),
          updatedBy: 'user-123',
          usageCount: 10,
          lastUsedAt: Timestamp.now()
        }
      };
      
      expect(mappingConfig).toBeDefined();
      expect(mappingConfig.targetEntity).toBe('customer');
      expect(mappingConfig.mappings[0].aiAssisted?.confidence).toBe(0.95);
    });
    
    it('應該能創建 ImportConfig', () => {
      const importConfig: ImportConfig = {
        id: 'import-1',
        name: '每日客戶資料匯入',
        description: '從 CRM 系統匯入客戶資料',
        dataSource: {
          type: 'api',
          config: {
            endpoint: 'https://api.crm.com/customers',
            authentication: {
              type: 'bearer',
              credentials: {
                token: 'secret-token'
              }
            },
            parameters: {
              page_size: 100
            }
          }
        },
        mappingConfigId: 'mapping-1',
        options: {
          batchSize: 100,
          allowDuplicates: false,
          duplicateStrategy: 'update',
          useTransaction: true,
          parallel: true,
          parallelWorkers: 4,
          timeout: 30000,
          dryRun: false
        },
        schedule: {
          type: 'cron',
          startAt: Timestamp.now(),
          cronExpression: '0 2 * * *',
          timezone: 'Asia/Taipei'
        },
        notifications: {
          onSuccess: true,
          onFailure: true,
          onWarning: false,
          channels: ['email', 'inapp'],
          recipients: ['admin@example.com']
        },
        permissions: {
          allowedUsers: ['user-123'],
          allowedRoles: ['admin', 'data_manager'],
          requiresApproval: false
        },
        status: 'active',
        metadata: {
          createdAt: Timestamp.now(),
          createdBy: 'user-123',
          updatedAt: Timestamp.now(),
          updatedBy: 'user-123',
          lastRunAt: Timestamp.now(),
          runCount: 5
        }
      };
      
      expect(importConfig).toBeDefined();
      expect(importConfig.dataSource.type).toBe('api');
      expect(importConfig.schedule?.type).toBe('cron');
    });
  });
  
  describe('常量測試', () => {
    
    it('應該有正確的 Firestore 限制常量', () => {
      expect(FIRESTORE_LIMITS.MAX_DOCUMENT_SIZE).toBe(1048576);
      expect(FIRESTORE_LIMITS.MAX_FIELD_NAME_LENGTH).toBe(1500);
      expect(FIRESTORE_LIMITS.MAX_BATCH_SIZE).toBe(500);
    });
    
    it('應該有合理的預設分片配置', () => {
      expect(DEFAULT_SHARDING_CONFIG.enabled).toBe(true);
      expect(DEFAULT_SHARDING_CONFIG.strategy).toBe('size');
      expect(DEFAULT_SHARDING_CONFIG.maxShardSize).toBeLessThan(FIRESTORE_LIMITS.MAX_DOCUMENT_SIZE);
    });
    
    it('應該有合理的預設匯入選項', () => {
      expect(DEFAULT_IMPORT_OPTIONS.batchSize).toBe(100);
      expect(DEFAULT_IMPORT_OPTIONS.duplicateStrategy).toBe('skip');
      expect(DEFAULT_IMPORT_OPTIONS.useTransaction).toBe(true);
    });
    
    it('應該為每個欄位類型定義驗證規則', () => {
      const fieldTypes: FieldDataType[] = [
        'text', 'number', 'date', 'datetime', 'email',
        'phone', 'url', 'boolean', 'json', 'array',
        'currency', 'percentage'
      ];
      
      fieldTypes.forEach(type => {
        expect(FIELD_TYPE_VALIDATION_RULES[type]).toBeDefined();
        expect(Array.isArray(FIELD_TYPE_VALIDATION_RULES[type])).toBe(true);
        expect(FIELD_TYPE_VALIDATION_RULES[type].length).toBeGreaterThan(0);
      });
    });
  });
  
  describe('邊界情況測試', () => {
    
    it('應該正確處理巨大的資料量', () => {
      const largeData = new Array(10000).fill({ field: 'value' });
      const config: ShardingConfig = {
        enabled: true,
        strategy: 'count',
        maxShardSize: 1000000,
        maxRecordsPerShard: 1000
      };
      
      expect(requiresSharding(largeData, config)).toBe(true);
    });
    
    it('應該正確處理特殊字元的欄位名稱', () => {
      const fieldName = 'field.with-special_chars!@#';
      const cleanedName = fieldName.replace(/[^a-zA-Z0-9_]/g, '_');
      
      expect(cleanedName).toBe('field_with_special_chars___');
      expect(cleanedName.length).toBeLessThanOrEqual(FIRESTORE_LIMITS.MAX_FIELD_NAME_LENGTH);
    });
    
    it('應該能處理深度嵌套的物件', () => {
      const deepObject = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: {
                  value: 'deep'
                }
              }
            }
          }
        }
      };
      
      expect(isFieldValueEmpty(deepObject)).toBe(false);
    });
  });
});