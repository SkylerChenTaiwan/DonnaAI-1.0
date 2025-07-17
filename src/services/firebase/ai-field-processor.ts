/**
 * AI 欄位處理服務
 * 處理紀錄內容的欄位提取和客戶欄位自動填入
 */

import { Timestamp } from 'firebase/firestore';
import { RecordDoc } from '../../types/record';
import { 
  CustomFieldDefinition,
  AIFieldMapping,
  AIFieldExtractionRequest,
  AIProcessingConfirmation
} from '../../types/custom-fields';
import { 
  getSystemFieldInterpretations,
  mergeFieldInterpretations,
  calculateFieldRelevance
} from './field-interpretation';
import { 
  callAIFieldExtraction,
  validateAIResponse 
} from '../api/ai-integration';
import { 
  getCustomFieldDefinitions 
} from './custom-fields';
import { 
  updateCustomerAIFields 
} from './customers';

// 配置
const AI_FIELD_CONFIG = {
  minConfidenceForAutoUpdate: 0.85,    // 自動更新的最低信心分數
  minConfidenceForSuggestion: 0.6,     // 建議的最低信心分數
  maxFieldsPerRequest: 20,              // 每次請求的最大欄位數
  enableSystemFields: true,             // 是否包含系統預設欄位
  enableCustomFields: true              // 是否包含自訂欄位
};

/**
 * 從紀錄中提取欄位值
 */
export async function extractFieldsFromRecord(
  record: RecordDoc,
  organizationId: string,
  entityType: 'customer' | 'record' = 'customer'
): Promise<AIFieldMapping[]> {
  try {
    // 獲取要提取的欄位定義
    const fieldDefinitions = await getFieldDefinitionsForExtraction(
      organizationId,
      entityType
    );
    
    if (fieldDefinitions.length === 0) {
      return [];
    }
    
    // 準備內容（優先使用 AI 摘要，其次是轉錄文字，最後是內容）
    const content = record.aiSummary || record.transcription || record.content || '';
    if (!content) {
      console.warn('紀錄沒有可用於提取的內容');
      return [];
    }
    
    // 分批處理欄位（避免單次請求過大）
    const batches = chunkArray(fieldDefinitions, AI_FIELD_CONFIG.maxFieldsPerRequest);
    const allMappings: AIFieldMapping[] = [];
    
    for (const batch of batches) {
      const request: AIFieldExtractionRequest = {
        content,
        fieldDefinitions: batch.map(field => ({
          fieldKey: field.fieldKey,
          fieldName: field.fieldName,
          fieldType: field.fieldType,
          aiInterpretation: field.aiFieldInterpretation?.aiProcessedDescription,
          examples: field.aiFieldInterpretation?.examples
        })),
        contextualInfo: {
          customerName: record.title, // 可能包含客戶名稱
          previousRecords: [] // TODO: 可以加入相關紀錄的摘要
        }
      };
      
      const response = await callAIFieldExtraction(request);
      
      if (validateAIResponse(response)) {
        allMappings.push(...response.fieldMappings);
      }
    }
    
    // 根據內容相關性調整信心分數
    const adjustedMappings = adjustFieldMappingsByRelevance(
      allMappings,
      content,
      fieldDefinitions
    );
    
    return adjustedMappings;
  } catch (error) {
    console.error('提取欄位失敗:', error);
    throw error;
  }
}

/**
 * 自動填入客戶欄位
 */
export async function autoFillCustomerFields(
  customerId: string,
  fieldMappings: AIFieldMapping[],
  recordId: string,
  requireConfirmation: boolean = true
): Promise<{
  autoUpdated: string[];
  needsConfirmation: AIProcessingConfirmation | null;
}> {
  try {
    const autoUpdatedFields: string[] = [];
    const fieldsNeedingConfirmation: AIFieldMapping[] = [];
    const fieldsToUpdate: Record<string, any> = {};
    
    // 分類欄位對應
    for (const mapping of fieldMappings) {
      if (!mapping.extractedValue) {
        continue;
      }
      
      if (mapping.confidence >= AI_FIELD_CONFIG.minConfidenceForAutoUpdate && !requireConfirmation) {
        // 高信心分數且不需要確認，直接更新
        fieldsToUpdate[mapping.fieldKey] = mapping.extractedValue;
        autoUpdatedFields.push(mapping.fieldKey);
      } else if (mapping.confidence >= AI_FIELD_CONFIG.minConfidenceForSuggestion) {
        // 中等信心分數或需要確認，加入確認清單
        fieldsNeedingConfirmation.push(mapping);
      }
      // 低信心分數的欄位會被忽略
    }
    
    // 執行自動更新
    if (Object.keys(fieldsToUpdate).length > 0) {
      await updateCustomerAIFields(customerId, fieldsToUpdate, recordId);
    }
    
    // 建立確認請求（如果有需要）
    let confirmationRequest: AIProcessingConfirmation | null = null;
    if (fieldsNeedingConfirmation.length > 0) {
      confirmationRequest = {
        id: `confirm_${Date.now()}`,
        recordId,
        customerId,
        fieldMappings: fieldsNeedingConfirmation,
        status: 'pending',
        createdAt: Timestamp.now()
      };
      
      // TODO: 儲存確認請求到資料庫
    }
    
    return {
      autoUpdated: autoUpdatedFields,
      needsConfirmation: confirmationRequest
    };
  } catch (error) {
    console.error('自動填入客戶欄位失敗:', error);
    throw error;
  }
}

/**
 * 生成欄位建議值
 */
export async function generateFieldSuggestions(
  content: string,
  fieldDef: CustomFieldDefinition
): Promise<Array<{ value: any; confidence: number }>> {
  try {
    const request: AIFieldExtractionRequest = {
      content,
      fieldDefinitions: [{
        fieldKey: fieldDef.fieldKey,
        fieldName: fieldDef.fieldName,
        fieldType: fieldDef.fieldType,
        aiInterpretation: fieldDef.aiFieldInterpretation?.aiProcessedDescription,
        examples: fieldDef.aiFieldInterpretation?.examples
      }]
    };
    
    const response = await callAIFieldExtraction(request);
    
    if (response.fieldMappings.length > 0) {
      const mapping = response.fieldMappings[0];
      const suggestions: Array<{ value: any; confidence: number }> = [];
      
      // 主要建議
      if (mapping.extractedValue) {
        suggestions.push({
          value: mapping.extractedValue,
          confidence: mapping.confidence
        });
      }
      
      // 替代建議
      if (mapping.alternatives) {
        suggestions.push(...mapping.alternatives);
      }
      
      return suggestions;
    }
    
    return [];
  } catch (error) {
    console.error('生成欄位建議失敗:', error);
    return [];
  }
}

/**
 * 處理紀錄並提取所有相關欄位
 */
export async function processRecordForFieldExtraction(
  record: RecordDoc
): Promise<{
  customerFieldMappings: AIFieldMapping[];
  recordFieldMappings: AIFieldMapping[];
  suggestedActions: string[];
}> {
  try {
    // 並行提取客戶和紀錄欄位
    const [customerMappings, recordMappings] = await Promise.all([
      extractFieldsFromRecord(record, record.organizationId, 'customer'),
      extractFieldsFromRecord(record, record.organizationId, 'record')
    ]);
    
    // 從 AI 提取行動項目（如果有）
    const suggestedActions = record.aiActionItems || [];
    
    return {
      customerFieldMappings: customerMappings,
      recordFieldMappings: recordMappings,
      suggestedActions
    };
  } catch (error) {
    console.error('處理紀錄欄位提取失敗:', error);
    throw error;
  }
}

/**
 * 批次處理多個紀錄的欄位提取
 */
export async function batchProcessRecordsForFields(
  records: RecordDoc[],
  customerIds: string[]
): Promise<Map<string, AIFieldMapping[]>> {
  const customerFieldsMap = new Map<string, AIFieldMapping[]>();
  
  // 初始化每個客戶的欄位對應
  customerIds.forEach(customerId => {
    customerFieldsMap.set(customerId, []);
  });
  
  // 處理每個紀錄
  for (const record of records) {
    try {
      const { customerFieldMappings } = await processRecordForFieldExtraction(record);
      
      // 將欄位對應分配給相關客戶
      record.customerIds.forEach(customerId => {
        const existingMappings = customerFieldsMap.get(customerId) || [];
        const mergedMappings = mergeFieldMappings(existingMappings, customerFieldMappings);
        customerFieldsMap.set(customerId, mergedMappings);
      });
    } catch (error) {
      console.error(`處理紀錄 ${record.id} 失敗:`, error);
    }
  }
  
  return customerFieldsMap;
}

// === 私有輔助函數 ===

/**
 * 獲取要提取的欄位定義
 */
async function getFieldDefinitionsForExtraction(
  organizationId: string,
  entityType: 'customer' | 'record'
): Promise<CustomFieldDefinition[]> {
  const fieldDefinitions: CustomFieldDefinition[] = [];
  
  // 獲取系統預設欄位
  if (AI_FIELD_CONFIG.enableSystemFields) {
    const systemFields = getSystemFieldInterpretations(entityType);
    // 轉換系統欄位為 CustomFieldDefinition 格式
    systemFields.forEach(sysField => {
      fieldDefinitions.push({
        id: `sys_${sysField.fieldKey}`,
        fieldKey: sysField.fieldKey,
        fieldName: sysField.fieldName,
        fieldType: 'text', // 簡化處理
        required: false,
        organizationId,
        entityType,
        createdBy: 'system',
        createdAt: Timestamp.now(),
        permissions: { canEdit: [] },
        aiFieldInterpretation: {
          userDescription: sysField.aiDescription,
          aiProcessedDescription: sysField.aiDescription,
          extractionRules: sysField.extractionHints,
          examples: sysField.examples
        }
      } as CustomFieldDefinition);
    });
  }
  
  // 獲取自訂欄位
  if (AI_FIELD_CONFIG.enableCustomFields) {
    const customFields = await getCustomFieldDefinitions(organizationId, entityType);
    fieldDefinitions.push(...customFields);
  }
  
  return fieldDefinitions;
}

/**
 * 根據內容相關性調整欄位對應的信心分數
 */
function adjustFieldMappingsByRelevance(
  mappings: AIFieldMapping[],
  content: string,
  fieldDefinitions: CustomFieldDefinition[]
): AIFieldMapping[] {
  return mappings.map(mapping => {
    const fieldDef = fieldDefinitions.find(f => f.fieldKey === mapping.fieldKey);
    if (!fieldDef) {
      return mapping;
    }
    
    // 計算相關性分數
    const relevance = calculateFieldRelevance(content, fieldDef);
    
    // 調整信心分數（相關性低的降低信心分數）
    const adjustedConfidence = mapping.confidence * (0.7 + 0.3 * relevance);
    
    return {
      ...mapping,
      confidence: Math.min(adjustedConfidence, 1),
      reason: mapping.reason || `相關性分數: ${relevance.toFixed(2)}`
    };
  });
}

/**
 * 合併欄位對應（用於批次處理）
 */
function mergeFieldMappings(
  existing: AIFieldMapping[],
  newMappings: AIFieldMapping[]
): AIFieldMapping[] {
  const mergedMap = new Map<string, AIFieldMapping>();
  
  // 先加入現有的對應
  existing.forEach(mapping => {
    mergedMap.set(mapping.fieldKey, mapping);
  });
  
  // 合併新的對應（如果信心分數更高則替換）
  newMappings.forEach(mapping => {
    const existing = mergedMap.get(mapping.fieldKey);
    if (!existing || mapping.confidence > existing.confidence) {
      mergedMap.set(mapping.fieldKey, mapping);
    }
  });
  
  return Array.from(mergedMap.values());
}

/**
 * 分割陣列為多個批次
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}