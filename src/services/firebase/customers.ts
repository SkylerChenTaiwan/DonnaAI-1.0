/**
 * 客戶管理服務
 * 處理客戶資料的 CRUD 操作、自訂欄位和權限管理
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
  Unsubscribe
} from 'firebase/firestore';
import { db } from './config';
import { CustomerDoc } from '../../types/firebase';
import { 
  CustomFieldDefinition
} from '../../types/custom-fields';
import { 
  getCustomFieldDefinitions,
  validateCustomFields 
} from './custom-fields';
import { 
  canEditCustomer,
  canViewCustomer,
  isOrgAdmin 
} from './permissions';

const CUSTOMERS_COLLECTION = 'customers';

/**
 * 建立新客戶
 */
export async function createCustomer(
  customer: Omit<CustomerDoc, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>,
  userId: string
): Promise<CustomerDoc> {
  try {
    // 驗證必填欄位
    if (!customer.name || !customer.company) {
      throw new Error('客戶姓名和公司名稱為必填欄位');
    }
    
    // 驗證自訂欄位（如果有）
    if (customer.customFields) {
      const fieldDefinitions = await getCustomFieldDefinitions(
        customer.organizationId,
        'customer'
      );
      const validationErrors = validateCustomFields(
        fieldDefinitions,
        customer.customFields
      );
      
      if (validationErrors.length > 0) {
        const errorMessages = validationErrors.map(e => e.error).join(', ');
        throw new Error(`自訂欄位驗證失敗: ${errorMessages}`);
      }
    }
    
    // 產生文件 ID
    const customerId = `customer_${Date.now()}`;
    
    // 建立客戶文件
    const customerDoc: CustomerDoc = {
      ...customer,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy: userId
    };
    
    // 儲存到 Firestore
    await setDoc(
      doc(db, CUSTOMERS_COLLECTION, customerId),
      customerDoc
    );
    
    return { ...customerDoc, id: customerId };
  } catch (error) {
    console.error('建立客戶失敗:', error);
    throw error;
  }
}

/**
 * 更新客戶資料
 */
export async function updateCustomer(
  customerId: string,
  updates: Partial<CustomerDoc>,
  userId: string
): Promise<void> {
  try {
    // 檢查權限
    const hasPermission = await canEditCustomer(userId, customerId);
    if (!hasPermission) {
      throw new Error('您沒有權限編輯此客戶');
    }
    
    // 獲取現有客戶資料
    const customerDoc = await getDoc(doc(db, CUSTOMERS_COLLECTION, customerId));
    if (!customerDoc.exists()) {
      throw new Error('找不到指定的客戶');
    }
    
    const existingCustomer = customerDoc.data() as CustomerDoc;
    
    // 驗證自訂欄位更新
    if (updates.customFields) {
      const fieldDefinitions = await getCustomFieldDefinitions(
        existingCustomer.organizationId,
        'customer'
      );
      
      // 合併現有和新的自訂欄位
      const mergedCustomFields = {
        ...existingCustomer.customFields,
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
      doc(db, CUSTOMERS_COLLECTION, customerId),
      {
        ...updates,
        updatedAt: serverTimestamp()
      }
    );
  } catch (error) {
    console.error('更新客戶失敗:', error);
    throw error;
  }
}

/**
 * 刪除客戶
 */
export async function deleteCustomer(
  customerId: string,
  userId: string
): Promise<void> {
  try {
    // 檢查權限（只有管理員可以刪除客戶）
    const isAdmin = await isOrgAdmin(userId);
    if (!isAdmin) {
      throw new Error('只有管理員可以刪除客戶');
    }
    
    // TODO: 檢查是否有相關的紀錄或任務
    // 如果有，可能需要先處理或警告使用者
    
    // 刪除文件
    await deleteDoc(doc(db, CUSTOMERS_COLLECTION, customerId));
  } catch (error) {
    console.error('刪除客戶失敗:', error);
    throw error;
  }
}

/**
 * 獲取單一客戶資料
 */
export async function getCustomer(
  customerId: string,
  userId: string
): Promise<CustomerDoc | null> {
  try {
    // 檢查權限
    const hasPermission = await canViewCustomer(userId, customerId);
    if (!hasPermission) {
      throw new Error('您沒有權限查看此客戶');
    }
    
    const customerDoc = await getDoc(doc(db, CUSTOMERS_COLLECTION, customerId));
    if (!customerDoc.exists()) {
      return null;
    }
    
    const data = customerDoc.data() as Omit<CustomerDoc, 'id'>;
    return {
      id: customerDoc.id,
      ...data
    };
  } catch (error) {
    console.error('獲取客戶失敗:', error);
    throw error;
  }
}

/**
 * 獲取客戶列表（根據權限過濾）
 */
export async function getCustomers(
  userId: string,
  teamId?: string,
  filters?: {
    assignedTo?: string;
    tags?: string[];
    searchTerm?: string;
  }
): Promise<CustomerDoc[]> {
  try {
    let q = query(collection(db, CUSTOMERS_COLLECTION));
    
    // 根據團隊過濾
    if (teamId) {
      q = query(q, where('teamId', '==', teamId));
    }
    
    // 根據負責人過濾
    if (filters?.assignedTo) {
      q = query(q, where('assignedTo', '==', filters.assignedTo));
    }
    
    // 根據標籤過濾
    if (filters?.tags && filters.tags.length > 0) {
      q = query(q, where('tags', 'array-contains-any', filters.tags));
    }
    
    // 排序
    q = query(q, orderBy('updatedAt', 'desc'));
    
    const snapshot = await getDocs(q);
    const customers: CustomerDoc[] = [];
    
    // 逐一檢查權限
    for (const doc of snapshot.docs) {
      const hasPermission = await canViewCustomer(userId, doc.id);
      if (hasPermission) {
        const data = doc.data() as Omit<CustomerDoc, 'id'>;
        const customer: CustomerDoc = {
          id: doc.id,
          ...data
        };
        
        // 客戶端搜尋過濾（因為 Firestore 不支援全文搜尋）
        if (filters?.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase();
          if (
            customer.name.toLowerCase().includes(searchLower) ||
            customer.company.toLowerCase().includes(searchLower) ||
            customer.email?.toLowerCase().includes(searchLower) ||
            customer.phone?.includes(filters.searchTerm)
          ) {
            customers.push(customer);
          }
        } else {
          customers.push(customer);
        }
      }
    }
    
    return customers;
  } catch (error) {
    console.error('獲取客戶列表失敗:', error);
    throw error;
  }
}

/**
 * 訂閱客戶資料變更
 */
export function subscribeToCustomers(
  teamId: string,
  userId: string,
  callback: (customers: CustomerDoc[]) => void
): Unsubscribe {
  const q = query(
    collection(db, CUSTOMERS_COLLECTION),
    where('teamId', '==', teamId),
    orderBy('updatedAt', 'desc')
  );
  
  return onSnapshot(q, async (snapshot) => {
    const customers: CustomerDoc[] = [];
    
    // 逐一檢查權限
    for (const doc of snapshot.docs) {
      const hasPermission = await canViewCustomer(userId, doc.id);
      if (hasPermission) {
        const data = doc.data() as Omit<CustomerDoc, 'id'>;
        customers.push({
          id: doc.id,
          ...data
        });
      }
    }
    
    callback(customers);
  }, (error) => {
    console.error('訂閱客戶資料失敗:', error);
  });
}

/**
 * 獲取客戶及其相關資料
 */
export async function getCustomerWithRelations(
  customerId: string,
  userId: string
): Promise<{
  customer: CustomerDoc;
  relatedRecords?: import('../types/record').RecordDoc[];
  relatedTasks?: import('../types/task').TaskDoc[];
  customFieldDefinitions?: CustomFieldDefinition[];
} | null> {
  try {
    // 檢查權限
    const hasPermission = await canViewCustomer(userId, customerId);
    if (!hasPermission) {
      throw new Error('您沒有權限查看此客戶');
    }
    
    // 獲取客戶資料
    const customer = await getCustomer(customerId, userId);
    if (!customer) {
      return null;
    }
    
    // 獲取自訂欄位定義
    const customFieldDefinitions = await getCustomFieldDefinitions(
      customer.organizationId,
      'customer'
    );
    
    // 並行查詢相關紀錄和任務
    const [relatedRecords, relatedTasks] = await Promise.all([
      (await import('./records')).getRecordsByCustomer(customerId, userId),
      (await import('./tasks')).getTasksByCustomer(customerId, userId)
    ]);
    
    return {
      customer,
      customFieldDefinitions,
      relatedRecords,
      relatedTasks
    };
  } catch (error) {
    console.error('獲取客戶相關資料失敗:', error);
    throw error;
  }
}

/**
 * 批次更新客戶資料
 */
export async function batchUpdateCustomers(
  customerIds: string[],
  updates: Partial<CustomerDoc>,
  userId: string
): Promise<void> {
  try {
    // 檢查是否為管理員
    const isAdmin = await isOrgAdmin(userId);
    if (!isAdmin && !updates.assignedTo) {
      throw new Error('只有管理員可以執行批次更新');
    }
    
    // 逐一檢查權限並更新
    const updatePromises = customerIds.map(async (customerId) => {
      const hasPermission = await canEditCustomer(userId, customerId);
      if (hasPermission) {
        await updateCustomer(customerId, updates, userId);
      }
    });
    
    await Promise.all(updatePromises);
  } catch (error) {
    console.error('批次更新客戶失敗:', error);
    throw error;
  }
}

/**
 * 更新客戶的 AI 自動更新記錄
 */
export async function updateCustomerAIFields(
  customerId: string,
  fieldUpdates: Record<string, any>,
  sourceRecordId: string
): Promise<void> {
  try {
    // AI 更新不需要使用者權限檢查
    const updates: Partial<CustomerDoc> = {
      customFields: fieldUpdates,
      aiAutoUpdates: {
        lastUpdated: Timestamp.now(),
        updatedFields: Object.keys(fieldUpdates),
        updateSource: sourceRecordId
      }
    };
    
    await updateDoc(
      doc(db, CUSTOMERS_COLLECTION, customerId),
      {
        ...updates,
        updatedAt: serverTimestamp()
      }
    );
  } catch (error) {
    console.error('更新客戶 AI 欄位失敗:', error);
    throw error;
  }
}

/**
 * 匯出客戶資料
 */
export async function exportCustomers(
  customerIds: string[],
  userId: string,
  includeCustomFields: boolean = true
): Promise<CustomerDoc[]> {
  try {
    const customers: CustomerDoc[] = [];
    
    for (const customerId of customerIds) {
      const customer = await getCustomer(customerId, userId);
      if (customer) {
        if (!includeCustomFields) {
          // 移除自訂欄位
          const { customFields, ...customerWithoutCustomFields } = customer;
          customers.push(customerWithoutCustomFields as CustomerDoc);
        } else {
          customers.push(customer);
        }
      }
    }
    
    return customers;
  } catch (error) {
    console.error('匯出客戶資料失敗:', error);
    throw error;
  }
}