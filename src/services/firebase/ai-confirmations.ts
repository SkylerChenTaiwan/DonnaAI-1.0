/**
 * AI 確認管理服務
 * 處理 AI 處理結果的確認流程和使用者修改
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
  Unsubscribe
} from 'firebase/firestore';
import { getFirebaseDb } from './config';
import { 
  AIProcessingConfirmation
} from '../../types/custom-fields';
import { updateCustomerAIFields } from './customers';
import { canViewRecord, canEditRecord } from './permissions';

const CONFIRMATIONS_COLLECTION = 'aiConfirmations';

/**
 * 建立確認請求
 */
export async function createConfirmationRequest(
  confirmation: Omit<AIProcessingConfirmation, 'id' | 'createdAt'>,
  notifyUser: boolean = true
): Promise<AIProcessingConfirmation> {
  try {
    // 產生文件 ID
    const confirmationId = `confirm_${Date.now()}`;
    
    // 建立確認文件
    const confirmationDoc: AIProcessingConfirmation = {
      ...confirmation,
      id: confirmationId,
      createdAt: Timestamp.now(),
      status: 'pending'
    };
    
    // 儲存到 Firestore
    await setDoc(
      doc(getFirebaseDb(), CONFIRMATIONS_COLLECTION, confirmationId),
      confirmationDoc
    );
    
    // 發送通知（如果需要）
    if (notifyUser && confirmation.recordId) {
      await sendConfirmationNotification(confirmationDoc);
    }
    
    return confirmationDoc;
  } catch (error) {
    console.error('建立確認請求失敗:', error);
    throw error;
  }
}

/**
 * 更新確認狀態
 */
export async function updateConfirmationStatus(
  confirmationId: string,
  status: 'confirmed' | 'rejected' | 'modified',
  userId: string,
  modifications?: Record<string, any>
): Promise<void> {
  try {
    // 獲取確認請求
    const confirmDoc = await getDoc(doc(getFirebaseDb(), CONFIRMATIONS_COLLECTION, confirmationId));
    if (!confirmDoc.exists()) {
      throw new Error('找不到指定的確認請求');
    }
    
    const confirmation = confirmDoc.data() as AIProcessingConfirmation;
    
    // 檢查權限（需要能編輯相關紀錄）
    if (confirmation.recordId) {
      const hasPermission = await canEditRecord(userId, confirmation.recordId);
      if (!hasPermission) {
        throw new Error('您沒有權限處理此確認請求');
      }
    }
    
    // 更新確認狀態
    const updates: Partial<AIProcessingConfirmation> = {
      status,
      reviewedAt: Timestamp.now(),
      reviewedBy: userId
    };
    
    if (status === 'modified' && modifications) {
      updates.userModifications = modifications;
    }
    
    await updateDoc(
      doc(getFirebaseDb(), CONFIRMATIONS_COLLECTION, confirmationId),
      updates
    );
    
    // 如果確認或修改，應用變更
    if ((status === 'confirmed' || status === 'modified') && confirmation.customerId) {
      await applyConfirmedMappings(confirmationId, userId);
    }
  } catch (error) {
    console.error('更新確認狀態失敗:', error);
    throw error;
  }
}

/**
 * 應用已確認的欄位對應
 */
export async function applyConfirmedMappings(
  confirmationId: string,
  _userId: string
): Promise<void> {
  try {
    // 獲取確認請求
    const confirmDoc = await getDoc(doc(getFirebaseDb(), CONFIRMATIONS_COLLECTION, confirmationId));
    if (!confirmDoc.exists()) {
      throw new Error('找不到指定的確認請求');
    }
    
    const confirmation = confirmDoc.data() as AIProcessingConfirmation;
    
    if (!confirmation.customerId) {
      throw new Error('確認請求沒有關聯的客戶');
    }
    
    // 準備要更新的欄位
    const fieldsToUpdate: Record<string, any> = {};
    
    // 處理每個欄位對應
    for (const mapping of confirmation.fieldMappings) {
      let finalValue = mapping.extractedValue;
      
      // 如果有使用者修改，使用修改後的值
      if (confirmation.userModifications && 
          confirmation.userModifications[mapping.fieldKey] !== undefined) {
        finalValue = confirmation.userModifications[mapping.fieldKey];
      }
      
      if (finalValue !== null && finalValue !== undefined) {
        fieldsToUpdate[mapping.fieldKey] = finalValue;
      }
    }
    
    // 更新客戶欄位
    if (Object.keys(fieldsToUpdate).length > 0) {
      await updateCustomerAIFields(
        confirmation.customerId,
        fieldsToUpdate,
        confirmation.recordId
      );
    }
  } catch (error) {
    console.error('應用確認的欄位對應失敗:', error);
    throw error;
  }
}

/**
 * 獲取待確認的請求列表
 */
export async function getPendingConfirmations(
  userId: string,
  _teamId?: string
): Promise<AIProcessingConfirmation[]> {
  try {
    let q = query(
      collection(getFirebaseDb(), CONFIRMATIONS_COLLECTION),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const confirmations: AIProcessingConfirmation[] = [];
    
    // 逐一檢查權限
    for (const doc of snapshot.docs) {
      const confirmation = doc.data() as AIProcessingConfirmation;
      
      // 檢查是否有權限查看相關紀錄
      if (confirmation.recordId) {
        const hasPermission = await canViewRecord(userId, confirmation.recordId);
        if (hasPermission) {
          confirmations.push(confirmation);
        }
      }
    }
    
    return confirmations;
  } catch (error) {
    console.error('獲取待確認請求失敗:', error);
    throw error;
  }
}

/**
 * 獲取單一確認請求
 */
export async function getConfirmation(
  confirmationId: string,
  userId: string
): Promise<AIProcessingConfirmation | null> {
  try {
    const confirmDoc = await getDoc(doc(getFirebaseDb(), CONFIRMATIONS_COLLECTION, confirmationId));
    if (!confirmDoc.exists()) {
      return null;
    }
    
    const confirmation = confirmDoc.data() as AIProcessingConfirmation;
    
    // 檢查權限
    if (confirmation.recordId) {
      const hasPermission = await canViewRecord(userId, confirmation.recordId);
      if (!hasPermission) {
        throw new Error('您沒有權限查看此確認請求');
      }
    }
    
    return confirmation;
  } catch (error) {
    console.error('獲取確認請求失敗:', error);
    throw error;
  }
}

/**
 * 訂閱待確認請求的變更
 */
export function subscribeToPendingConfirmations(
  userId: string,
  callback: (confirmations: AIProcessingConfirmation[]) => void
): Unsubscribe {
  const q = query(
    collection(getFirebaseDb(), CONFIRMATIONS_COLLECTION),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, async (snapshot) => {
    const confirmations: AIProcessingConfirmation[] = [];
    
    // 逐一檢查權限
    for (const doc of snapshot.docs) {
      const confirmation = doc.data() as AIProcessingConfirmation;
      
      if (confirmation.recordId) {
        const hasPermission = await canViewRecord(userId, confirmation.recordId);
        if (hasPermission) {
          confirmations.push(confirmation);
        }
      }
    }
    
    callback(confirmations);
  }, (error) => {
    console.error('訂閱確認請求失敗:', error);
  });
}

/**
 * 批次確認多個請求
 */
export async function batchConfirmRequests(
  confirmationIds: string[],
  userId: string,
  action: 'confirm' | 'reject'
): Promise<void> {
  try {
    const promises = confirmationIds.map(confirmationId => 
      updateConfirmationStatus(
        confirmationId,
        action === 'confirm' ? 'confirmed' : 'rejected',
        userId
      )
    );
    
    await Promise.all(promises);
  } catch (error) {
    console.error('批次確認請求失敗:', error);
    throw error;
  }
}

/**
 * 獲取確認請求的統計資料
 */
export async function getConfirmationStats(
  _organizationId: string,
  _dateFrom?: Date,
  _dateTo?: Date
): Promise<{
  total: number;
  pending: number;
  confirmed: number;
  rejected: number;
  modified: number;
  averageConfidenceScore: number;
  topFields: Array<{ fieldKey: string; count: number }>;
}> {
  try {
    let q = query(collection(getFirebaseDb(), CONFIRMATIONS_COLLECTION));
    
    // TODO: 加入組織和日期過濾
    
    const snapshot = await getDocs(q);
    
    const stats = {
      total: 0,
      pending: 0,
      confirmed: 0,
      rejected: 0,
      modified: 0,
      totalConfidence: 0,
      fieldCounts: new Map<string, number>()
    };
    
    snapshot.docs.forEach(doc => {
      const confirmation = doc.data() as AIProcessingConfirmation;
      stats.total++;
      
      // 統計狀態
      switch (confirmation.status) {
        case 'pending':
          stats.pending++;
          break;
        case 'confirmed':
          stats.confirmed++;
          break;
        case 'rejected':
          stats.rejected++;
          break;
        case 'modified':
          stats.modified++;
          break;
      }
      
      // 統計欄位和信心分數
      confirmation.fieldMappings.forEach(mapping => {
        stats.totalConfidence += mapping.confidence;
        const count = stats.fieldCounts.get(mapping.fieldKey) || 0;
        stats.fieldCounts.set(mapping.fieldKey, count + 1);
      });
    });
    
    // 計算平均信心分數
    const totalMappings = Array.from(stats.fieldCounts.values()).reduce((a, b) => a + b, 0);
    const averageConfidenceScore = totalMappings > 0 ? stats.totalConfidence / totalMappings : 0;
    
    // 取得前幾個最常出現的欄位
    const topFields = Array.from(stats.fieldCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([fieldKey, count]) => ({ fieldKey, count }));
    
    return {
      total: stats.total,
      pending: stats.pending,
      confirmed: stats.confirmed,
      rejected: stats.rejected,
      modified: stats.modified,
      averageConfidenceScore,
      topFields
    };
  } catch (error) {
    console.error('獲取確認統計失敗:', error);
    throw error;
  }
}

/**
 * 清理過期的確認請求
 */
export async function cleanupExpiredConfirmations(
  daysToKeep: number = 30
): Promise<number> {
  try {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() - daysToKeep);
    
    const q = query(
      collection(getFirebaseDb(), CONFIRMATIONS_COLLECTION),
      where('createdAt', '<', Timestamp.fromDate(expirationDate)),
      where('status', 'in', ['confirmed', 'rejected'])
    );
    
    const snapshot = await getDocs(q);
    
    const deletePromises = snapshot.docs.map(doc => 
      deleteDoc(doc.ref)
    );
    
    await Promise.all(deletePromises);
    
    return snapshot.size;
  } catch (error) {
    console.error('清理過期確認請求失敗:', error);
    throw error;
  }
}

/**
 * 發送確認通知（私有函數）
 */
async function sendConfirmationNotification(
  confirmation: AIProcessingConfirmation
): Promise<void> {
  // TODO: 實作通知邏輯
  // 可以使用 Firebase Cloud Messaging 或其他通知服務
  console.log('發送確認通知:', confirmation.id);
}