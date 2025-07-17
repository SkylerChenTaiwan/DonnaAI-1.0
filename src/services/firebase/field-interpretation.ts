/**
 * 欄位解釋服務
 * 處理系統預設欄位解釋和 AI 欄位理解
 */

import { 
  SystemFieldInterpretation,
  FieldInterpretationConfig,
  FieldInterpretationResult,
  CUSTOMER_FIELD_INTERPRETATIONS,
  RECORD_FIELD_INTERPRETATIONS
} from '../../types/field-interpretations';
import { CustomFieldDefinition } from '../../types/custom-fields';

// 預設配置
const DEFAULT_CONFIG: FieldInterpretationConfig = {
  enableAIInterpretation: true,
  confidenceThreshold: 0.7,
  requireConfirmation: true,
  autoUpdateFields: false
};

/**
 * 獲取系統預設欄位解釋
 */
export function getSystemFieldInterpretations(
  entityType: 'customer' | 'record'
): SystemFieldInterpretation[] {
  switch (entityType) {
    case 'customer':
      return CUSTOMER_FIELD_INTERPRETATIONS;
    case 'record':
      return RECORD_FIELD_INTERPRETATIONS;
    default:
      return [];
  }
}

/**
 * 根據欄位鍵值獲取系統解釋
 */
export function getFieldInterpretation(
  entityType: 'customer' | 'record',
  fieldKey: string
): SystemFieldInterpretation | null {
  const interpretations = getSystemFieldInterpretations(entityType);
  return interpretations.find(i => i.fieldKey === fieldKey) || null;
}

/**
 * 將使用者的欄位描述轉換為 AI 可理解的格式
 */
export function formatFieldDescriptionForAI(
  fieldDef: CustomFieldDefinition
): string {
  const { fieldName, fieldType, aiFieldInterpretation } = fieldDef;
  
  let description = `欄位名稱: ${fieldName}\n`;
  description += `欄位類型: ${fieldType}\n`;
  
  if (aiFieldInterpretation?.userDescription) {
    description += `使用者說明: ${aiFieldInterpretation.userDescription}\n`;
  }
  
  if (aiFieldInterpretation?.examples && aiFieldInterpretation.examples.length > 0) {
    description += `範例值: ${aiFieldInterpretation.examples.join(', ')}\n`;
  }
  
  if (aiFieldInterpretation?.synonyms && aiFieldInterpretation.synonyms.length > 0) {
    description += `同義詞: ${aiFieldInterpretation.synonyms.join(', ')}\n`;
  }
  
  return description;
}

/**
 * 生成 AI 提取提示
 */
export function generateAIExtractionPrompt(
  content: string,
  fieldDefinitions: CustomFieldDefinition[],
  entityType: 'customer' | 'record'
): string {
  let prompt = `請從以下${entityType === 'customer' ? '客戶' : '紀錄'}內容中提取相關欄位資訊：\n\n`;
  prompt += `內容：\n${content}\n\n`;
  prompt += `需要提取的欄位：\n`;
  
  fieldDefinitions.forEach((fieldDef, index) => {
    prompt += `\n${index + 1}. ${formatFieldDescriptionForAI(fieldDef)}`;
  });
  
  prompt += '\n\n請以 JSON 格式返回提取結果，包含每個欄位的值和信心分數（0-1）。';
  prompt += '如果無法確定某個欄位的值，請將 confidence 設為低於 0.7，並提供可能的替代值。';
  
  return prompt;
}

/**
 * 解析 AI 回應並生成欄位解釋結果
 */
export function parseAIFieldInterpretation(
  aiResponse: any,
  fieldDefinitions: CustomFieldDefinition[],
  config: FieldInterpretationConfig = DEFAULT_CONFIG
): FieldInterpretationResult[] {
  const results: FieldInterpretationResult[] = [];
  
  try {
    // 假設 AI 回應格式為 { fieldKey: { value, confidence, alternatives? } }
    for (const fieldDef of fieldDefinitions) {
      const fieldData = aiResponse[fieldDef.fieldKey];
      
      if (fieldData) {
        const result: FieldInterpretationResult = {
          fieldKey: fieldDef.fieldKey,
          interpretation: fieldData.value || '',
          confidence: fieldData.confidence || 0,
          source: 'ai',
          timestamp: new Date()
        };
        
        // 只有當信心分數超過門檻時才加入結果
        if (result.confidence >= config.confidenceThreshold) {
          results.push(result);
        }
      }
    }
  } catch (error) {
    console.error('解析 AI 欄位解釋時發生錯誤:', error);
  }
  
  return results;
}

/**
 * 合併系統和自訂欄位解釋
 */
export function mergeFieldInterpretations(
  systemInterpretations: SystemFieldInterpretation[],
  customDefinitions: CustomFieldDefinition[]
): Array<SystemFieldInterpretation | CustomFieldDefinition> {
  const merged: Array<SystemFieldInterpretation | CustomFieldDefinition> = [];
  
  // 先加入系統解釋
  merged.push(...systemInterpretations);
  
  // 加入自訂欄位（排除已有系統解釋的欄位）
  const systemFieldKeys = new Set(systemInterpretations.map(i => i.fieldKey));
  customDefinitions.forEach(customDef => {
    if (!systemFieldKeys.has(customDef.fieldKey)) {
      merged.push(customDef);
    }
  });
  
  return merged;
}

/**
 * 驗證欄位值是否符合解釋
 */
export function validateFieldValue(
  value: any,
  fieldType: string,
  _interpretation?: SystemFieldInterpretation
): boolean {
  // 基本類型驗證
  switch (fieldType) {
    case 'text':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && !isNaN(value);
    case 'date':
      return value instanceof Date || !isNaN(Date.parse(value));
    case 'boolean':
      return typeof value === 'boolean';
    case 'select':
    case 'multiselect':
      return Array.isArray(value) || typeof value === 'string';
    default:
      return true;
  }
}

/**
 * 提取欄位的關鍵詞（用於 AI 匹配）
 */
export function extractFieldKeywords(
  fieldDef: CustomFieldDefinition | SystemFieldInterpretation
): string[] {
  const keywords: string[] = [];
  
  // 從欄位名稱提取
  if ('fieldName' in fieldDef) {
    keywords.push(fieldDef.fieldName);
  }
  
  // 從 AI 解釋提取
  if ('aiFieldInterpretation' in fieldDef && fieldDef.aiFieldInterpretation) {
    const { synonyms, userDescription } = fieldDef.aiFieldInterpretation;
    if (synonyms) {
      keywords.push(...synonyms);
    }
    if (userDescription) {
      // 簡單的關鍵詞提取（可以用更複雜的 NLP 方法）
      const words = userDescription.split(/[\s，。、]+/).filter(w => w.length > 1);
      keywords.push(...words);
    }
  }
  
  // 從系統解釋提取
  if ('extractionHints' in fieldDef) {
    keywords.push(...fieldDef.extractionHints);
  }
  
  // 去重並返回
  return [...new Set(keywords)];
}

/**
 * 計算欄位相關性分數
 */
export function calculateFieldRelevance(
  content: string,
  fieldDef: CustomFieldDefinition | SystemFieldInterpretation
): number {
  const keywords = extractFieldKeywords(fieldDef);
  const contentLower = content.toLowerCase();
  
  let score = 0;
  let matchCount = 0;
  
  keywords.forEach(keyword => {
    if (contentLower.includes(keyword.toLowerCase())) {
      matchCount++;
      // 完全匹配得分更高
      if (contentLower.includes(` ${keyword.toLowerCase()} `)) {
        score += 2;
      } else {
        score += 1;
      }
    }
  });
  
  // 正規化分數到 0-1
  return keywords.length > 0 ? Math.min(score / (keywords.length * 2), 1) : 0;
}