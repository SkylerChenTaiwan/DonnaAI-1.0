/**
 * 優化的紀錄管理服務 V2
 * 使用查詢層級權限，避免 N+1 查詢問題
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
  onSnapshot,
  Timestamp,
  serverTimestamp,
  Unsubscribe,
  limit
} from 'firebase/firestore';
import { 
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { getFirebaseDb, getFirebaseStorage } from './config';
import { 
  RecordDoc,
  RecordStatus,
  RecordFilter,
  RecordProcessingResult
} from '../../types/record';
import { 
  AIFieldMapping 
} from '../../types/custom-fields';
import { 
  getCustomFieldDefinitions,
  validateCustomFields 
} from './custom-fields';
import { 
  processRecordForFieldExtraction,
  autoFillCustomerFields 
} from './ai-field-processor';
import { 
  createConfirmationRequest 
} from './ai-confirmations';
import { processAIRequest } from '../api/ai-integration';
import { User } from '../../types/user';
import { getUserPermissionContext, buildQueryConstraints } from './permissions-v2';

const RECORDS_COLLECTION = 'records';
const AUDIO_STORAGE_PATH = 'record-audio';

/**
 * 建立新紀錄（保持原有邏輯）
 */
export async function createRecord(
  record: Omit<RecordDoc, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>,
  userId: string,
  audioFile?: File
): Promise<RecordDoc> {
  try {
    // 驗證必填欄位
    if (!record.title || !record.type) {
      throw new Error('紀錄標題和類型為必填欄位');
    }
    
    // 驗證自訂欄位（如果有）
    if (record.customFields) {
      const fieldDefinitions = await getCustomFieldDefinitions(
        record.organizationId,
        'record'
      );
      const validationErrors = validateCustomFields(
        fieldDefinitions,
        record.customFields
      );
      
      if (validationErrors.length > 0) {
        const errorMessages = validationErrors.map(e => e.error).join(', ');
        throw new Error(`自訂欄位驗證失敗: ${errorMessages}`);
      }
    }
    
    // 產生文件 ID
    const recordId = `record_${Date.now()}`;
    
    // 建立紀錄文件
    const recordDoc: RecordDoc = {
      ...record,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy: userId,
      status: audioFile ? 'processing' : record.status || 'draft'
    };
    
    // 處理音訊檔案上傳
    if (audioFile) {
      const audioUrl = await uploadAudioFile(recordId, audioFile);
      recordDoc.audioFileUrl = audioUrl;
    }
    
    // 儲存到 Firestore
    await setDoc(
      doc(getFirebaseDb(), RECORDS_COLLECTION, recordId),
      recordDoc
    );
    
    // 如果有音訊檔案，觸發 AI 處理
    if (audioFile) {
      triggerAIProcessing(recordId, recordDoc);
    }
    
    return { ...recordDoc, id: recordId };
  } catch (error) {
    console.error('建立紀錄失敗:', error);
    throw error;
  }
}

/**
 * 更新紀錄（保持原有邏輯）
 */
export async function updateRecord(
  recordId: string,
  updates: Partial<RecordDoc>,
  userId: string
): Promise<void> {
  try {
    // 獲取現有紀錄
    const recordDoc = await getDoc(doc(getFirebaseDb(), RECORDS_COLLECTION, recordId));
    if (!recordDoc.exists()) {
      throw new Error('找不到指定的紀錄');
    }
    
    const existingRecord = recordDoc.data() as RecordDoc;
    
    // 權限檢查 - 這裡仍需要個別檢查
    // TODO: 考慮使用批量權限檢查
    if (existingRecord.createdBy !== userId && 
        !existingRecord.participantIds?.includes(userId)) {
      throw new Error('您沒有權限編輯此紀錄');
    }
    
    // 驗證自訂欄位更新
    if (updates.customFields) {
      const fieldDefinitions = await getCustomFieldDefinitions(
        existingRecord.organizationId,
        'record'
      );
      
      // 合併現有和新的自訂欄位
      const mergedCustomFields = {
        ...existingRecord.customFields,
        ...updates.customFields
      };
      
      const validationErrors = validateCustomFields(
        fieldDefinitions,
        mergedCustomFields
      );
      
      if (validationErrors.length > 0) {
        const errorMessages = validationErrors.map(e => e.error).join(', ');
        throw new Error(`自訂欄位驗證失敗: ${errorMessages}`);
      }
    }
    
    // 更新文件
    await updateDoc(
      doc(getFirebaseDb(), RECORDS_COLLECTION, recordId),
      {
        ...updates,
        updatedAt: serverTimestamp()
      }
    );
    
    // 如果狀態變更為 completed 且有 AI 處理結果，觸發欄位提取
    if (updates.status === 'completed' && 
        (existingRecord.aiSummary || existingRecord.transcription)) {
      await processRecordForCustomerFields(recordId);
    }
  } catch (error) {
    console.error('更新紀錄失敗:', error);
    throw error;
  }
}

/**
 * 刪除紀錄（保持原有邏輯）
 */
export async function deleteRecord(
  recordId: string,
  userId: string
): Promise<void> {
  try {
    // 獲取紀錄以刪除相關檔案
    const recordDoc = await getDoc(doc(getFirebaseDb(), RECORDS_COLLECTION, recordId));
    if (!recordDoc.exists()) {
      throw new Error('找不到指定的紀錄');
    }
    
    const record = recordDoc.data() as RecordDoc;
    
    // 權限檢查
    if (record.createdBy !== userId) {
      throw new Error('您沒有權限刪除此紀錄');
    }
    
    // 刪除音訊檔案（如果有）
    if (record.audioFileUrl) {
      try {
        const audioRef = ref(getFirebaseStorage(), record.audioFileUrl);
        await deleteObject(audioRef);
      } catch (error) {
        console.error('刪除音訊檔案失敗:', error);
      }
    }
    
    // 刪除文件
    await deleteDoc(doc(getFirebaseDb(), RECORDS_COLLECTION, recordId));
  } catch (error) {
    console.error('刪除紀錄失敗:', error);
    throw error;
  }
}

/**
 * 獲取單一紀錄（仍需要個別權限檢查）
 */
export async function getRecord(
  recordId: string,
  user: User
): Promise<RecordDoc | null> {
  try {
    const recordDoc = await getDoc(doc(getFirebaseDb(), RECORDS_COLLECTION, recordId));
    if (!recordDoc.exists()) {
      return null;
    }
    
    const data = recordDoc.data() as Omit<RecordDoc, 'id'>;
    const record = {
      id: recordDoc.id,
      ...data
    };
    
    // 簡化的權限檢查
    const permissionContext = await getUserPermissionContext(user);
    
    // 管理員可以看所有
    if (permissionContext.role === 'admin') {
      return record;
    }
    
    // 檢查團隊權限
    if (record.teamId && permissionContext.teamIds.includes(record.teamId)) {
      return record;
    }
    
    // 檢查參與者權限
    if (record.participantIds?.includes(user.id)) {
      return record;
    }
    
    // 檢查創建者權限
    if (record.createdBy === user.id) {
      return record;
    }
    
    throw new Error('您沒有權限查看此紀錄');
  } catch (error) {
    console.error('獲取紀錄失敗:', error);
    throw error;
  }
}

/**
 * 優化的獲取紀錄列表
 * 使用查詢層級權限過濾
 */
export async function getRecordsOptimized(
  user: User,
  filter?: RecordFilter
): Promise<RecordDoc[]> {
  try {
    // 取得權限上下文（帶快取）
    const permissionContext = await getUserPermissionContext(user);
    
    // 建立基礎查詢
    let q = query(collection(getFirebaseDb(), RECORDS_COLLECTION));
    
    // 根據權限加入查詢條件
    const constraints = buildQueryConstraints(permissionContext, 'records');
    constraints.forEach(([field, op, value]) => {
      q = query(q, where(field as string, op as any, value));
    });
    
    // 套用額外過濾條件
    if (filter) {
      if (filter.type) {
        const types = Array.isArray(filter.type) ? filter.type : [filter.type];
        q = query(q, where('type', 'in', types));
      }
      
      if (filter.status) {
        const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
        q = query(q, where('status', 'in', statuses));
      }
      
      if (filter.customerIds && filter.customerIds.length > 0) {
        q = query(q, where('customerIds', 'array-contains-any', filter.customerIds));
      }
      
      if (filter.participantIds && filter.participantIds.length > 0) {
        q = query(q, where('participantIds', 'array-contains-any', filter.participantIds));
      }
      
      if (filter.dateFrom || filter.dateTo) {
        if (filter.dateFrom) {
          q = query(q, where('scheduledAt', '>=', Timestamp.fromDate(filter.dateFrom)));
        }
        if (filter.dateTo) {
          q = query(q, where('scheduledAt', '<=', Timestamp.fromDate(filter.dateTo)));
        }
      }
    }
    
    // 排序
    q = query(q, orderBy('updatedAt', 'desc'));
    
    // 執行查詢
    const snapshot = await getDocs(q);
    const records: RecordDoc[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as RecordDoc));
    
    console.log(`✅ 獲取到 ${records.length} 個紀錄（優化版）`);
    return records;
    
  } catch (error) {
    console.error('獲取紀錄列表失敗:', error);
    throw error;
  }
}

/**
 * 優化的訂閱紀錄變更
 * 使用查詢層級權限
 */
export function subscribeToRecordsOptimized(
  user: User,
  callback: (records: RecordDoc[]) => void,
  filter?: RecordFilter
): Unsubscribe {
  let unsubscribe: Unsubscribe | null = null;
  
  // 取得權限上下文
  getUserPermissionContext(user).then(permissionContext => {
    // 建立查詢
    let q = query(collection(getFirebaseDb(), RECORDS_COLLECTION));
    
    // 根據權限加入查詢條件
    const constraints = buildQueryConstraints(permissionContext, 'records');
    constraints.forEach(([field, op, value]) => {
      q = query(q, where(field as string, op as any, value));
    });
    
    // 套用額外過濾
    if (filter?.type) {
      const types = Array.isArray(filter.type) ? filter.type : [filter.type];
      q = query(q, where('type', 'in', types));
    }
    
    // 排序和限制
    q = query(q, orderBy('updatedAt', 'desc'), limit(50));
    
    // 訂閱
    unsubscribe = onSnapshot(q, (snapshot) => {
      const records: RecordDoc[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as RecordDoc));
      
      callback(records);
    }, (error) => {
      console.error('訂閱紀錄失敗:', error);
    });
  }).catch(error => {
    console.error('獲取權限上下文失敗:', error);
  });
  
  // 返回 unsubscribe 函數
  return () => {
    if (unsubscribe) {
      unsubscribe();
    }
  };
}

/**
 * 獲取客戶相關的紀錄（優化版）
 */
export async function getRecordsByCustomerOptimized(
  customerId: string,
  user: User,
  limitCount: number = 50
): Promise<RecordDoc[]> {
  try {
    // 取得權限上下文
    const permissionContext = await getUserPermissionContext(user);
    
    // 建立查詢
    let q = query(
      collection(getFirebaseDb(), RECORDS_COLLECTION),
      where('customerIds', 'array-contains', customerId)
    );
    
    // 根據權限加入查詢條件
    const constraints = buildQueryConstraints(permissionContext, 'records');
    constraints.forEach(([field, op, value]) => {
      q = query(q, where(field as string, op as any, value));
    });
    
    // 排序和限制
    q = query(q, orderBy('scheduledAt', 'desc'), limit(limitCount));
    
    const snapshot = await getDocs(q);
    const records: RecordDoc[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as RecordDoc));
    
    return records;
  } catch (error) {
    console.error('獲取客戶相關紀錄失敗:', error);
    throw error;
  }
}

/**
 * 處理紀錄的 AI 欄位提取（保持原有邏輯）
 */
export async function processRecordForCustomerFields(
  recordId: string,
  autoApply: boolean = false
): Promise<RecordProcessingResult> {
  const startTime = Date.now();
  
  try {
    // 獲取紀錄
    const recordDoc = await getDoc(doc(getFirebaseDb(), RECORDS_COLLECTION, recordId));
    if (!recordDoc.exists()) {
      throw new Error('找不到指定的紀錄');
    }
    
    const data = recordDoc.data() as Omit<RecordDoc, 'id'>;
    const record: RecordDoc = {
      id: recordDoc.id,
      ...data
    };
    
    // 執行欄位提取
    const { customerFieldMappings, recordFieldMappings, suggestedActions } = 
      await processRecordForFieldExtraction(record);
    
    // 更新紀錄的 AI 欄位對應
    await updateDoc(
      doc(getFirebaseDb(), RECORDS_COLLECTION, recordId),
      {
        aiFieldMappings: customerFieldMappings,
        aiProcessingMetadata: {
          processedAt: Timestamp.now(),
          modelUsed: 'gpt-4',
          totalConfidence: calculateAverageConfidence(customerFieldMappings)
        },
        customFields: recordFieldMappings.reduce((acc, mapping) => {
          if (mapping.extractedValue && mapping.confidence > 0.7) {
            acc[mapping.fieldKey] = mapping.extractedValue;
          }
          return acc;
        }, {} as Record<string, any>),
        updatedAt: serverTimestamp()
      }
    );
    
    // 處理客戶欄位自動填入
    const customerResults = new Map<string, any>();
    
    for (const customerId of record.customerIds) {
      const result = await autoFillCustomerFields(
        customerId,
        customerFieldMappings,
        recordId,
        !autoApply // 需要確認（除非明確設定自動套用）
      );
      
      customerResults.set(customerId, result);
      
      // 如果有需要確認的欄位，建立確認請求
      if (result.needsConfirmation) {
        await createConfirmationRequest(result.needsConfirmation);
      }
    }
    
    const processingTime = Date.now() - startTime;
    
    return {
      recordId,
      aiSummary: record.aiSummary,
      aiActionItems: suggestedActions,
      aiFieldMappings: customerFieldMappings,
      processingTime,
      success: true
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    return {
      recordId,
      processingTime,
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤'
    };
  }
}

// === 私有輔助函數 ===

/**
 * 上傳音訊檔案
 */
async function uploadAudioFile(recordId: string, file: File): Promise<string> {
  try {
    const fileName = `${recordId}_${Date.now()}_${file.name}`;
    const storageRef = ref(getFirebaseStorage(), `${AUDIO_STORAGE_PATH}/${fileName}`);
    
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        recordId,
        originalName: file.name,
        uploadedAt: new Date().toISOString()
      }
    });
    
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (error) {
    console.error('上傳音訊檔案失敗:', error);
    throw new Error('音訊檔案上傳失敗');
  }
}

/**
 * 觸發 AI 處理
 */
async function triggerAIProcessing(recordId: string, record: RecordDoc): Promise<void> {
  try {
    // TODO: 實際應用中應該使用 Cloud Functions 觸發器
    // 這裡簡化為直接呼叫 AI 處理
    
    if (record.audioFileUrl) {
      // 觸發音訊轉文字
      const transcriptionResult = await processAIRequest({
        id: `ai_${recordId}_transcription`,
        taskType: 'transcription',
        input: {
          audioUrl: record.audioFileUrl
        },
        priority: 'high',
        requestedBy: record.createdBy,
        requestedAt: Timestamp.now(),
        organizationId: record.organizationId
      });
      
      if (transcriptionResult.success && transcriptionResult.output.transcription) {
        // 更新紀錄的轉錄文字
        await updateDoc(
          doc(getFirebaseDb(), RECORDS_COLLECTION, recordId),
          {
            transcription: transcriptionResult.output.transcription,
            status: 'processing' as RecordStatus
          }
        );
        
        // 觸發摘要生成
        const summaryResult = await processAIRequest({
          id: `ai_${recordId}_summary`,
          taskType: 'summary',
          input: {
            text: transcriptionResult.output.transcription
          },
          priority: 'normal',
          requestedBy: record.createdBy,
          requestedAt: Timestamp.now(),
          organizationId: record.organizationId
        });
        
        if (summaryResult.success && summaryResult.output.summary) {
          // 更新紀錄的 AI 摘要和狀態
          await updateDoc(
            doc(getFirebaseDb(), RECORDS_COLLECTION, recordId),
            {
              aiSummary: summaryResult.output.summary,
              status: 'completed' as RecordStatus,
              updatedAt: serverTimestamp()
            }
          );
          
          // 處理欄位提取
          await processRecordForCustomerFields(recordId);
        }
      }
    }
  } catch (error) {
    console.error('AI 處理失敗:', error);
    
    // 更新狀態為失敗
    await updateDoc(
      doc(getFirebaseDb(), RECORDS_COLLECTION, recordId),
      {
        status: 'completed' as RecordStatus,
        updatedAt: serverTimestamp()
      }
    );
  }
}

/**
 * 計算平均信心分數
 */
function calculateAverageConfidence(mappings: AIFieldMapping[]): number {
  if (mappings.length === 0) return 0;
  const sum = mappings.reduce((acc, mapping) => acc + mapping.confidence, 0);
  return sum / mappings.length;
}

// 匯出舊版函數名稱以保持向後相容
export {
  getRecordsOptimized as getRecords,
  subscribeToRecordsOptimized as subscribeToRecords,
  getRecordsByCustomerOptimized as getRecordsByCustomer
};