/**
 * 自訂欄位管理服務
 * 處理自訂欄位定義的 CRUD 操作和權限管理
 */

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
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { getFirebaseDb } from './config';
import { 
  CustomFieldDefinition, 
  CustomFieldValidationError 
} from '../../types/custom-fields';

const CUSTOM_FIELDS_COLLECTION = 'customFieldDefinitions';

/**
 * 建立自訂欄位定義
 */
export async function createCustomFieldDefinition(
  field: Omit<CustomFieldDefinition, 'id' | 'createdAt'>,
  userId: string
): Promise<CustomFieldDefinition> {
  try {
    // 檢查權限
    const hasPermission = await checkFieldDefinitionPermission(userId, field.organizationId, 'create');
    if (!hasPermission) {
      throw new Error('您沒有權限建立自訂欄位');
    }
    
    // 檢查欄位鍵值唯一性
    const isUnique = await checkFieldKeyUniqueness(
      field.fieldKey, 
      field.organizationId, 
      field.entityType
    );
    if (!isUnique) {
      throw new Error(`欄位鍵值 "${field.fieldKey}" 已存在`);
    }
    
    // 產生文件 ID
    const fieldId = `field_${Date.now()}`;
    
    // 建立欄位定義
    const fieldDefinition: CustomFieldDefinition = {
      ...field,
      id: fieldId,
      createdAt: Timestamp.now(),
      createdBy: userId
    };
    
    // 如果有 AI 欄位解釋，處理使用者描述
    if (field.aiFieldInterpretation?.userDescription) {
      fieldDefinition.aiFieldInterpretation = {
        ...field.aiFieldInterpretation,
        aiProcessedDescription: await processFieldDescription(
          field.aiFieldInterpretation.userDescription,
          field.fieldType
        )
      };
    }
    
    // 儲存到 Firestore
    await setDoc(
      doc(getFirebaseDb(), CUSTOM_FIELDS_COLLECTION, fieldId), 
      fieldDefinition
    );
    
    return fieldDefinition;
  } catch (error) {
    console.error('建立自訂欄位定義失敗:', error);
    throw error;
  }
}

/**
 * 更新自訂欄位定義
 */
export async function updateCustomFieldDefinition(
  fieldId: string,
  updates: Partial<CustomFieldDefinition>,
  userId: string
): Promise<void> {
  try {
    // 獲取現有欄位定義
    const fieldDoc = await getDoc(doc(getFirebaseDb(), CUSTOM_FIELDS_COLLECTION, fieldId));
    if (!fieldDoc.exists()) {
      throw new Error('找不到指定的欄位定義');
    }
    
    const fieldData = fieldDoc.data() as CustomFieldDefinition;
    
    // 檢查權限
    const hasPermission = await checkFieldDefinitionPermission(
      userId, 
      fieldData.organizationId, 
      'update',
      fieldData
    );
    if (!hasPermission) {
      throw new Error('您沒有權限更新此欄位');
    }
    
    // 如果要更新欄位鍵值，檢查唯一性
    if (updates.fieldKey && updates.fieldKey !== fieldData.fieldKey) {
      const isUnique = await checkFieldKeyUniqueness(
        updates.fieldKey,
        fieldData.organizationId,
        fieldData.entityType
      );
      if (!isUnique) {
        throw new Error(`欄位鍵值 "${updates.fieldKey}" 已存在`);
      }
    }
    
    // 如果更新 AI 欄位解釋
    if (updates.aiFieldInterpretation?.userDescription) {
      updates.aiFieldInterpretation = {
        ...updates.aiFieldInterpretation,
        aiProcessedDescription: await processFieldDescription(
          updates.aiFieldInterpretation.userDescription,
          updates.fieldType || fieldData.fieldType
        )
      };
    }
    
    // 更新文件
    await updateDoc(
      doc(getFirebaseDb(), CUSTOM_FIELDS_COLLECTION, fieldId),
      {
        ...updates,
        updatedAt: serverTimestamp()
      }
    );
  } catch (error) {
    console.error('更新自訂欄位定義失敗:', error);
    throw error;
  }
}

/**
 * 刪除自訂欄位定義
 */
export async function deleteCustomFieldDefinition(
  fieldId: string,
  userId: string
): Promise<void> {
  try {
    // 獲取欄位定義
    const fieldDoc = await getDoc(doc(getFirebaseDb(), CUSTOM_FIELDS_COLLECTION, fieldId));
    if (!fieldDoc.exists()) {
      throw new Error('找不到指定的欄位定義');
    }
    
    const fieldData = fieldDoc.data() as CustomFieldDefinition;
    
    // 檢查權限
    const hasPermission = await checkFieldDefinitionPermission(
      userId,
      fieldData.organizationId,
      'delete',
      fieldData
    );
    if (!hasPermission) {
      throw new Error('您沒有權限刪除此欄位');
    }
    
    // 檢查是否有資料使用此欄位
    const isInUse = await checkFieldUsage(fieldData);
    if (isInUse) {
      throw new Error('此欄位正在使用中，無法刪除');
    }
    
    // 刪除文件
    await deleteDoc(doc(getFirebaseDb(), CUSTOM_FIELDS_COLLECTION, fieldId));
  } catch (error) {
    console.error('刪除自訂欄位定義失敗:', error);
    throw error;
  }
}

/**
 * 獲取組織的自訂欄位定義
 */
export async function getCustomFieldDefinitions(
  organizationId: string,
  entityType?: 'customer' | 'record'
): Promise<CustomFieldDefinition[]> {
  try {
    let q = query(
      collection(getFirebaseDb(), CUSTOM_FIELDS_COLLECTION),
      where('organizationId', '==', organizationId),
      orderBy('createdAt', 'desc')
    );
    
    if (entityType) {
      q = query(
        collection(getFirebaseDb(), CUSTOM_FIELDS_COLLECTION),
        where('organizationId', '==', organizationId),
        where('entityType', '==', entityType),
        orderBy('createdAt', 'desc')
      );
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as CustomFieldDefinition);
  } catch (error) {
    console.error('獲取自訂欄位定義失敗:', error);
    throw error;
  }
}

/**
 * 驗證自訂欄位值
 */
export function validateCustomFieldValue(
  fieldDef: CustomFieldDefinition,
  value: any
): CustomFieldValidationError | null {
  // 必填檢查
  if (fieldDef.required && (value === null || value === undefined || value === '')) {
    return {
      fieldKey: fieldDef.fieldKey,
      error: `${fieldDef.fieldName} 為必填欄位`
    };
  }
  
  // 如果值為空且非必填，直接通過
  if (!value && !fieldDef.required) {
    return null;
  }
  
  // 根據欄位類型驗證
  switch (fieldDef.fieldType) {
    case 'text':
      if (typeof value !== 'string') {
        return {
          fieldKey: fieldDef.fieldKey,
          error: `${fieldDef.fieldName} 必須為文字`
        };
      }
      break;
      
    case 'number':
      if (typeof value !== 'number' || isNaN(value)) {
        return {
          fieldKey: fieldDef.fieldKey,
          error: `${fieldDef.fieldName} 必須為數字`
        };
      }
      break;
      
    case 'date':
      if (!(value instanceof Date) && !Date.parse(value)) {
        return {
          fieldKey: fieldDef.fieldKey,
          error: `${fieldDef.fieldName} 必須為有效日期`
        };
      }
      break;
      
    case 'boolean':
      if (typeof value !== 'boolean') {
        return {
          fieldKey: fieldDef.fieldKey,
          error: `${fieldDef.fieldName} 必須為是/否值`
        };
      }
      break;
      
    case 'select':
      if (!fieldDef.options?.includes(value)) {
        return {
          fieldKey: fieldDef.fieldKey,
          error: `${fieldDef.fieldName} 的值必須是預設選項之一`
        };
      }
      break;
      
    case 'multiselect':
      if (!Array.isArray(value)) {
        return {
          fieldKey: fieldDef.fieldKey,
          error: `${fieldDef.fieldName} 必須為陣列`
        };
      }
      const invalidOptions = value.filter(v => !fieldDef.options?.includes(v));
      if (invalidOptions.length > 0) {
        return {
          fieldKey: fieldDef.fieldKey,
          error: `${fieldDef.fieldName} 包含無效選項: ${invalidOptions.join(', ')}`
        };
      }
      break;
  }
  
  return null;
}

/**
 * 批次驗證自訂欄位
 */
export function validateCustomFields(
  fieldDefinitions: CustomFieldDefinition[],
  values: Record<string, any>
): CustomFieldValidationError[] {
  const errors: CustomFieldValidationError[] = [];
  
  for (const fieldDef of fieldDefinitions) {
    const value = values[fieldDef.fieldKey];
    const error = validateCustomFieldValue(fieldDef, value);
    if (error) {
      errors.push(error);
    }
  }
  
  return errors;
}

/**
 * 檢查欄位定義權限
 */
async function checkFieldDefinitionPermission(
  userId: string,
  organizationId: string,
  action: 'create' | 'update' | 'delete',
  fieldDef?: CustomFieldDefinition
): Promise<boolean> {
  const { canDefineCustomFields, canEditCustomFieldDefinition } = await import('./permissions');
  
  if (action === 'create') {
    // 使用權限服務檢查是否可以建立自訂欄位
    return await canDefineCustomFields(userId, organizationId);
  }
  
  if (fieldDef && (action === 'update' || action === 'delete')) {
    // 使用權限服務檢查是否可以編輯欄位定義
    return await canEditCustomFieldDefinition(
      userId,
      fieldDef.createdBy,
      fieldDef.permissions
    );
  }
  
  return false;
}

/**
 * 檢查欄位鍵值唯一性
 */
async function checkFieldKeyUniqueness(
  fieldKey: string,
  organizationId: string,
  entityType: 'customer' | 'record'
): Promise<boolean> {
  const q = query(
    collection(getFirebaseDb(), CUSTOM_FIELDS_COLLECTION),
    where('organizationId', '==', organizationId),
    where('entityType', '==', entityType),
    where('fieldKey', '==', fieldKey)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.empty;
}

/**
 * 檢查欄位是否被使用
 */
async function checkFieldUsage(_fieldDef: CustomFieldDefinition): Promise<boolean> {
  // TODO: 實作檢查邏輯
  // 需要查詢相應的 customers 或 records 集合
  // 檢查是否有文件的 customFields 包含此欄位鍵值
  return false;
}

/**
 * 處理欄位描述（呼叫 AI 服務）
 */
async function processFieldDescription(
  userDescription: string,
  fieldType: string
): Promise<string> {
  // TODO: 整合 AI 服務處理描述
  // 目前先返回原始描述
  return `[AI 處理] ${userDescription} (類型: ${fieldType})`;
}

/**
 * 獲取欄位定義（含權限檢查）
 */
export async function getCustomFieldDefinition(
  fieldId: string,
  _userId: string
): Promise<CustomFieldDefinition | null> {
  try {
    const fieldDoc = await getDoc(doc(getFirebaseDb(), CUSTOM_FIELDS_COLLECTION, fieldId));
    if (!fieldDoc.exists()) {
      return null;
    }
    
    const fieldData = fieldDoc.data() as CustomFieldDefinition;
    
    // TODO: 檢查讀取權限
    // 目前假設同組織的使用者都可以讀取
    
    return fieldData;
  } catch (error) {
    console.error('獲取自訂欄位定義失敗:', error);
    throw error;
  }
}