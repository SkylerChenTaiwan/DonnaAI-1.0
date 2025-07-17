/**
 * 紀錄管理服務
 * 處理紀錄的 CRUD 操作、音訊上傳和 AI 處理觸發
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
import { db, storage } from './config';
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
  canViewRecord,
  canEditRecord 
} from './permissions';
import { 
  processRecordForFieldExtraction,
  autoFillCustomerFields 
} from './ai-field-processor';
import { 
  createConfirmationRequest 
} from './ai-confirmations';
import { processAIRequest } from '../api/ai-integration';

const RECORDS_COLLECTION = 'records';
const AUDIO_STORAGE_PATH = 'record-audio';

/**
 * 建立新紀錄
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
    let recordDoc: RecordDoc = {
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
      doc(db, RECORDS_COLLECTION, recordId),
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
 * 更新紀錄
 */
export async function updateRecord(
  recordId: string,
  updates: Partial<RecordDoc>,
  userId: string
): Promise<void> {
  try {
    // 檢查權限
    const hasPermission = await canEditRecord(userId, recordId);
    if (!hasPermission) {
      throw new Error('您沒有權限編輯此紀錄');
    }
    
    // 獲取現有紀錄
    const recordDoc = await getDoc(doc(db, RECORDS_COLLECTION, recordId));
    if (!recordDoc.exists()) {
      throw new Error('找不到指定的紀錄');
    }
    
    const existingRecord = recordDoc.data() as RecordDoc;
    
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
      doc(db, RECORDS_COLLECTION, recordId),
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
 * 刪除紀錄
 */
export async function deleteRecord(
  recordId: string,
  userId: string
): Promise<void> {
  try {
    // 檢查權限
    const hasPermission = await canEditRecord(userId, recordId);
    if (!hasPermission) {
      throw new Error('您沒有權限刪除此紀錄');
    }
    
    // 獲取紀錄以刪除相關檔案
    const recordDoc = await getDoc(doc(db, RECORDS_COLLECTION, recordId));
    if (recordDoc.exists()) {
      const record = recordDoc.data() as RecordDoc;
      
      // 刪除音訊檔案（如果有）
      if (record.audioFileUrl) {
        try {
          const audioRef = ref(storage, record.audioFileUrl);
          await deleteObject(audioRef);
        } catch (error) {
          console.error('刪除音訊檔案失敗:', error);
        }
      }
    }
    
    // 刪除文件
    await deleteDoc(doc(db, RECORDS_COLLECTION, recordId));
  } catch (error) {
    console.error('刪除紀錄失敗:', error);
    throw error;
  }
}

/**
 * 獲取單一紀錄
 */
export async function getRecord(
  recordId: string,
  userId: string
): Promise<RecordDoc | null> {
  try {
    // 檢查權限
    const hasPermission = await canViewRecord(userId, recordId);
    if (!hasPermission) {
      throw new Error('您沒有權限查看此紀錄');
    }
    
    const recordDoc = await getDoc(doc(db, RECORDS_COLLECTION, recordId));
    if (!recordDoc.exists()) {
      return null;
    }
    
    const data = recordDoc.data() as Omit<RecordDoc, 'id'>;
    return {
      id: recordDoc.id,
      ...data
    };
  } catch (error) {
    console.error('獲取紀錄失敗:', error);
    throw error;
  }
}

/**
 * 獲取紀錄列表
 */
export async function getRecords(
  userId: string,
  filter?: RecordFilter
): Promise<RecordDoc[]> {
  try {
    let q = query(collection(db, RECORDS_COLLECTION));
    
    // 套用過濾條件
    if (filter) {
      if (filter.type) {
        const types = Array.isArray(filter.type) ? filter.type : [filter.type];
        q = query(q, where('type', 'in', types));
      }
      
      if (filter.status) {
        const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
        q = query(q, where('status', 'in', statuses));
      }
      
      if (filter.teamId) {
        q = query(q, where('teamId', '==', filter.teamId));
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
    
    const snapshot = await getDocs(q);
    const records: RecordDoc[] = [];
    
    // 逐一檢查權限
    for (const doc of snapshot.docs) {
      const hasPermission = await canViewRecord(userId, doc.id);
      if (hasPermission) {
        const data = doc.data() as Omit<RecordDoc, 'id'>;
        records.push({
          id: doc.id,
          ...data
        });
      }
    }
    
    return records;
  } catch (error) {
    console.error('獲取紀錄列表失敗:', error);
    throw error;
  }
}

/**
 * 訂閱紀錄變更
 */
export function subscribeToRecords(
  teamId: string,
  userId: string,
  callback: (records: RecordDoc[]) => void,
  filter?: RecordFilter
): Unsubscribe {
  let q = query(
    collection(db, RECORDS_COLLECTION),
    where('teamId', '==', teamId),
    orderBy('updatedAt', 'desc'),
    limit(50) // 限制數量以提升效能
  );
  
  // 套用額外過濾
  if (filter?.type) {
    const types = Array.isArray(filter.type) ? filter.type : [filter.type];
    q = query(q, where('type', 'in', types));
  }
  
  return onSnapshot(q, async (snapshot) => {
    const records: RecordDoc[] = [];
    
    // 逐一檢查權限
    for (const doc of snapshot.docs) {
      const hasPermission = await canViewRecord(userId, doc.id);
      if (hasPermission) {
        const data = doc.data() as Omit<RecordDoc, 'id'>;
        records.push({
          id: doc.id,
          ...data
        });
      }
    }
    
    callback(records);
  }, (error) => {
    console.error('訂閱紀錄失敗:', error);
  });
}

/**
 * 處理紀錄的 AI 欄位提取
 */
export async function processRecordForCustomerFields(
  recordId: string,
  autoApply: boolean = false
): Promise<RecordProcessingResult> {
  const startTime = Date.now();
  
  try {
    // 獲取紀錄
    const recordDoc = await getDoc(doc(db, RECORDS_COLLECTION, recordId));
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
      doc(db, RECORDS_COLLECTION, recordId),
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

/**
 * 獲取客戶相關的紀錄
 */
export async function getRecordsByCustomer(
  customerId: string,
  userId: string,
  limitCount: number = 50
): Promise<RecordDoc[]> {
  try {
    const q = query(
      collection(db, RECORDS_COLLECTION),
      where('customerIds', 'array-contains', customerId),
      orderBy('scheduledAt', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    const records: RecordDoc[] = [];
    
    for (const doc of snapshot.docs) {
      const hasPermission = await canViewRecord(userId, doc.id);
      if (hasPermission) {
        const data = doc.data() as Omit<RecordDoc, 'id'>;
        records.push({
          id: doc.id,
          ...data
        });
      }
    }
    
    return records;
  } catch (error) {
    console.error('獲取客戶相關紀錄失敗:', error);
    throw error;
  }
}

// === 私有輔助函數 ===

/**
 * 上傳音訊檔案
 */
async function uploadAudioFile(recordId: string, file: File): Promise<string> {
  try {
    const fileName = `${recordId}_${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `${AUDIO_STORAGE_PATH}/${fileName}`);
    
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
          doc(db, RECORDS_COLLECTION, recordId),
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
            doc(db, RECORDS_COLLECTION, recordId),
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
      doc(db, RECORDS_COLLECTION, recordId),
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