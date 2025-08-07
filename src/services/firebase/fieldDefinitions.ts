/**
 * 欄位定義 Firebase 服務
 * 處理欄位定義的讀取、訂閱、快取和管理
 */

import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  Unsubscribe,
  Timestamp
} from 'firebase/firestore';
import { getFirebaseDb } from './config';
import { 
  FieldDefinition, 
  FieldConfig, 
  FieldDefinitionCache,
  getDefaultFieldDefinitions
} from '@/types/fieldDefinitions';

/**
 * 欄位定義快取
 * 使用 Map 結構快取不同集合的欄位定義
 */
const fieldDefinitionCache = new Map<string, FieldDefinitionCache>();


/**
 * 快取時效 (5分鐘)
 */
const CACHE_TTL = 5 * 60 * 1000;

/**
 * 訂閱欄位定義即時更新
 * @param collectionName 集合名稱
 * @param organizationId 組織 ID
 * @param callback 資料更新回調
 * @returns 取消訂閱函數
 */
export function subscribeToFieldDefinitions(
  collectionName: 'customers' | 'tasks' | 'records',
  organizationId: string,
  callback: (fields: FieldConfig[]) => void
): Unsubscribe {
  console.log(`📡 訂閱欄位定義: ${collectionName} (組織: ${organizationId})`);
  
  // 建立快取鍵值
  const cacheKey = `${organizationId}:${collectionName}`;
  
  // 清除舊快取（暫時停用快取以確保取得最新資料）
  fieldDefinitionCache.delete(cacheKey);
  
  // 先檢查快取（暫時停用）
  // const cached = fieldDefinitionCache.get(cacheKey);
  // if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
  //   console.log('🎯 使用快取的欄位定義');
  //   callback(cached.fields);
  // }
  
  // 建立查詢
  const q = query(
    collection(getFirebaseDb(), 'field_definitions'),
    where('collectionName', '==', collectionName),
    where('organizationId', '==', organizationId),
    where('isActive', '==', true),
    orderBy('version', 'desc'),
    limit(1)
  );
  
  // 訂閱即時更新
  return onSnapshot(
    q,
    (snapshot) => {
      if (!snapshot.empty) {
        const definition = snapshot.docs[0].data() as FieldDefinition;
        console.log(`📋 取得欄位定義 v${definition.version}`);
        
        // 過濾並排序可見欄位
        const sortedFields = definition.fields
          .filter(f => f.visible)
          .sort((a, b) => a.order - b.order);
        
        // 更新快取
        fieldDefinitionCache.set(cacheKey, {
          fields: sortedFields,
          timestamp: Date.now()
        });
        
        callback(sortedFields);
      } else {
        console.log('⚠️ 找不到欄位定義，使用預設值');
        
        // 使用預設欄位定義
        const defaultFields = getDefaultFieldDefinitions(collectionName);
        
        // 快取預設值
        fieldDefinitionCache.set(cacheKey, {
          fields: defaultFields,
          timestamp: Date.now()
        });
        
        callback(defaultFields);
        
        // 自動建立預設欄位定義文檔
        createDefaultFieldDefinition(collectionName, organizationId, defaultFields)
          .catch(error => console.error('建立預設欄位定義失敗:', error));
      }
    },
    (error) => {
      console.error('訂閱欄位定義失敗:', error);
      
      // 錯誤時使用預設值
      const defaultFields = getDefaultFieldDefinitions(collectionName);
      callback(defaultFields);
    }
  );
}

/**
 * 取得欄位定義（一次性查詢）
 * @param collectionName 集合名稱
 * @param organizationId 組織 ID
 * @returns 欄位配置陣列
 */
export async function getFieldDefinitions(
  collectionName: 'customers' | 'tasks' | 'records',
  organizationId: string
): Promise<FieldConfig[]> {
  console.log(`📥 取得欄位定義: ${collectionName} (組織: ${organizationId})`);
  
  const cacheKey = `${organizationId}:${collectionName}`;
  
  // 檢查快取
  const cached = fieldDefinitionCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('🎯 使用快取的欄位定義');
    return cached.fields;
  }
  
  try {
    const q = query(
      collection(getFirebaseDb(), 'field_definitions'),
      where('collectionName', '==', collectionName),
      where('organizationId', '==', organizationId),
      where('isActive', '==', true),
      orderBy('version', 'desc'),
      limit(1)
    );
    
    const { getDocs } = await import('firebase/firestore');
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const definition = snapshot.docs[0].data() as FieldDefinition;
      
      const sortedFields = definition.fields
        .filter(f => f.visible)
        .sort((a, b) => a.order - b.order);
      
      // 更新快取
      fieldDefinitionCache.set(cacheKey, {
        fields: sortedFields,
        timestamp: Date.now()
      });
      
      return sortedFields;
    } else {
      // 使用預設值
      const defaultFields = getDefaultFieldDefinitions(collectionName);
      
      // 建立預設欄位定義
      await createDefaultFieldDefinition(collectionName, organizationId, defaultFields);
      
      return defaultFields;
    }
  } catch (error) {
    console.error('取得欄位定義失敗:', error);
    // 返回預設值
    return getDefaultFieldDefinitions(collectionName);
  }
}

/**
 * 建立預設欄位定義文檔
 * @param collectionName 集合名稱
 * @param organizationId 組織 ID
 * @param fields 欄位配置
 */
async function createDefaultFieldDefinition(
  collectionName: 'customers' | 'tasks' | 'records',
  organizationId: string,
  fields: FieldConfig[]
): Promise<void> {
  console.log(`🔨 建立預設欄位定義: ${collectionName}`);
  
  try {
    const fieldDefinitionData: Omit<FieldDefinition, 'id'> = {
      collectionName,
      organizationId,
      fields,
      version: 1,
      isActive: true,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
      createdBy: 'system',
      updatedBy: 'system',
      description: '系統預設欄位定義'
    };
    
    await addDoc(collection(getFirebaseDb(), 'field_definitions'), fieldDefinitionData);
    console.log('✅ 預設欄位定義建立成功');
  } catch (error) {
    console.error('建立預設欄位定義失敗:', error);
    throw error;
  }
}

/**
 * 更新欄位定義
 * @param definitionId 欄位定義 ID
 * @param fields 新的欄位配置
 * @param userId 更新者 ID
 * @param description 版本說明
 */
export async function updateFieldDefinition(
  definitionId: string,
  fields: FieldConfig[],
  userId: string,
  description?: string
): Promise<void> {
  console.log(`📝 更新欄位定義: ${definitionId}`);
  
  try {
    const docRef = doc(getFirebaseDb(), 'field_definitions', definitionId);
    
    // 取得當前版本號
    const { getDoc } = await import('firebase/firestore');
    const currentDoc = await getDoc(docRef);
    
    if (!currentDoc.exists()) {
      throw new Error('欄位定義不存在');
    }
    
    const currentData = currentDoc.data() as FieldDefinition;
    
    // 停用當前版本
    await updateDoc(docRef, { isActive: false });
    
    // 建立新版本
    const newVersionData: Omit<FieldDefinition, 'id'> = {
      ...currentData,
      fields,
      version: currentData.version + 1,
      isActive: true,
      createdAt: currentData.createdAt, // 保留原始建立時間
      updatedAt: serverTimestamp() as Timestamp,
      updatedBy: userId,
      description: description || `更新至版本 ${currentData.version + 1}`
    };
    
    await addDoc(collection(getFirebaseDb(), 'field_definitions'), newVersionData);
    
    // 清除快取
    const cacheKey = `${currentData.organizationId}:${currentData.collectionName}`;
    fieldDefinitionCache.delete(cacheKey);
    
    console.log('✅ 欄位定義更新成功');
  } catch (error) {
    console.error('更新欄位定義失敗:', error);
    throw error;
  }
}

/**
 * 建立新的欄位定義
 * @param collectionName 集合名稱
 * @param organizationId 組織 ID
 * @param fields 欄位配置
 * @param userId 建立者 ID
 * @param description 說明
 */
export async function createFieldDefinition(
  collectionName: 'customers' | 'tasks' | 'records',
  organizationId: string,
  fields: FieldConfig[],
  userId: string,
  description?: string
): Promise<string> {
  console.log(`➕ 建立新欄位定義: ${collectionName}`);
  
  try {
    // 停用現有的所有版本
    const q = query(
      collection(getFirebaseDb(), 'field_definitions'),
      where('collectionName', '==', collectionName),
      where('organizationId', '==', organizationId),
      where('isActive', '==', true)
    );
    
    const { getDocs } = await import('firebase/firestore');
    const snapshot = await getDocs(q);
    
    // 停用所有現有版本
    const promises = snapshot.docs.map(doc => 
      updateDoc(doc.ref, { isActive: false })
    );
    await Promise.all(promises);
    
    // 建立新版本
    const fieldDefinitionData: Omit<FieldDefinition, 'id'> = {
      collectionName,
      organizationId,
      fields,
      version: snapshot.size + 1,
      isActive: true,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
      createdBy: userId,
      updatedBy: userId,
      description: description || `版本 ${snapshot.size + 1}`
    };
    
    const docRef = await addDoc(collection(getFirebaseDb(), 'field_definitions'), fieldDefinitionData);
    
    // 清除快取
    const cacheKey = `${organizationId}:${collectionName}`;
    fieldDefinitionCache.delete(cacheKey);
    
    console.log('✅ 新欄位定義建立成功');
    return docRef.id;
  } catch (error) {
    console.error('建立欄位定義失敗:', error);
    throw error;
  }
}

/**
 * 清除快取
 * @param organizationId 組織 ID (可選)
 * @param collectionName 集合名稱 (可選)
 */
export function clearFieldDefinitionCache(
  organizationId?: string,
  collectionName?: string
): void {
  if (organizationId && collectionName) {
    const cacheKey = `${organizationId}:${collectionName}`;
    fieldDefinitionCache.delete(cacheKey);
  } else {
    fieldDefinitionCache.clear();
  }
  console.log('🧹 欄位定義快取已清除');
}

/**
 * 更新欄位定義（透過組織和集合名稱）
 * @param collectionName 集合名稱
 * @param organizationId 組織 ID
 * @param fields 更新後的欄位配置
 * @param userId 更新者 ID
 * @param description 說明
 */
export async function updateFieldDefinitionByOrganization(
  collectionName: 'customers' | 'tasks' | 'records',
  organizationId: string,
  fields: FieldConfig[],
  userId: string,
  description?: string
): Promise<void> {
  console.log(`📝 更新欄位定義: ${collectionName} (組織: ${organizationId})`);
  
  try {
    // 查詢當前 active 的欄位定義
    const q = query(
      collection(getFirebaseDb(), 'field_definitions'),
      where('collectionName', '==', collectionName),
      where('organizationId', '==', organizationId),
      where('isActive', '==', true),
      limit(1)
    );
    
    const { getDocs } = await import('firebase/firestore');
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      // 如果沒有現有定義，建立新的
      await createFieldDefinition(collectionName, organizationId, fields, userId, description);
      return;
    }
    
    // 取得當前版本
    const currentDoc = snapshot.docs[0];
    const currentData = currentDoc.data() as FieldDefinition;
    
    // 停用當前版本
    await updateDoc(currentDoc.ref, { isActive: false });
    
    // 建立新版本
    const newVersionData: Omit<FieldDefinition, 'id'> = {
      ...currentData,
      fields,
      version: currentData.version + 1,
      isActive: true,
      createdAt: currentData.createdAt, // 保留原始建立時間
      updatedAt: serverTimestamp() as Timestamp,
      updatedBy: userId,
      description: description || `版本 ${currentData.version + 1}`
    };
    
    await addDoc(collection(getFirebaseDb(), 'field_definitions'), newVersionData);
    
    // 清除快取
    const cacheKey = `${organizationId}:${collectionName}`;
    fieldDefinitionCache.delete(cacheKey);
    
    console.log('✅ 欄位定義更新成功');
  } catch (error) {
    console.error('更新欄位定義失敗:', error);
    throw error;
  }
}