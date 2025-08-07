/**
 * Firebase 資料清理服務
 * 用於清理重複的客戶資料
 */

import { collection, getDocs, writeBatch, doc, Timestamp, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { getFirebaseDb } from './config';

interface Customer {
  id: string;
  name?: string;
  company?: string;
  createdAt?: Timestamp;
  [key: string]: any;
}

interface CleanupResult {
  totalRecords: number;
  duplicatesFound: number;
  duplicatesRemoved: number;
  finalRecords: number;
}

export async function cleanupDuplicateCustomers(
  organizationId: string,
  onProgress?: (progress: { message: string; percent: number }) => void
): Promise<CleanupResult> {
  console.log('🧹 cleanupDuplicateCustomers 開始執行...');
  console.log('📋 參數:', { organizationId, hasProgressCallback: !!onProgress });
  
  const db = getFirebaseDb();
  console.log('🔥 Firebase DB 實例獲取成功');
  console.log('🔥 DB 實例詳情:', { 
    app: db.app.name,
    type: db.type,
    toJSON: typeof db.toJSON
  });
  
  try {
    console.log('📊 發送進度更新: 正在載入客戶資料...');
    onProgress?.({ message: '正在載入客戶資料...', percent: 10 });
    
    // 取得所有客戶資料 - 先嘗試組織內路徑
    console.log('📂 建立客戶集合引用...');
    console.log('🔍 嘗試路徑: /organizations/' + organizationId + '/customers');
    const customersRef = collection(db, 'organizations', organizationId, 'customers');
    console.log('🔍 執行查詢，取得所有客戶資料...');
    
    const snapshot = await getDocs(customersRef);
    console.log('📊 查詢完成，結果:', { size: snapshot.size, empty: snapshot.empty });
    
    // 如果組織內路徑沒有資料，嘗試舊版路徑
    if (snapshot.empty) {
      console.log('⚠️ 組織內路徑無資料，嘗試舊版路徑: /customers');
      const oldCustomersRef = collection(db, 'customers');
      const oldSnapshot = await getDocs(oldCustomersRef);
      console.log('📊 舊版路徑查詢結果:', { size: oldSnapshot.size, empty: oldSnapshot.empty });
      
      if (!oldSnapshot.empty) {
        console.log('✅ 在舊版路徑找到資料，使用舊版路徑進行清理');
        // 使用舊版路徑的資料
        const totalRecords = oldSnapshot.size;
        console.log(`📈 總記錄數: ${totalRecords}`);
        onProgress?.({ message: `找到 ${totalRecords} 筆記錄，正在分析重複項目...`, percent: 30 });
        
        // 處理舊版路徑的邏輯...
        return await cleanupOldPathCustomers(db, oldSnapshot, onProgress);
      }
    }
    
    const totalRecords = snapshot.size;
    console.log(`📈 總記錄數: ${totalRecords}`);
    onProgress?.({ message: `找到 ${totalRecords} 筆記錄，正在分析重複項目...`, percent: 30 });
    
    // 按照 name + company 分組
    const customerGroups = new Map<string, Customer[]>();
    const allCustomers: Customer[] = [];
    
    snapshot.forEach(docSnapshot => {
      const data = docSnapshot.data();
      const customer: Customer = { 
        id: docSnapshot.id, 
        ...data,
        createdAt: data.createdAt || Timestamp.now()
      };
      allCustomers.push(customer);
      
      const key = `${data.name || ''}_${data.company || ''}`;
      if (!customerGroups.has(key)) {
        customerGroups.set(key, []);
      }
      customerGroups.get(key)!.push(customer);
    });
    
    // 找出重複項目
    let duplicatesFound = 0;
    const toDelete: Customer[] = [];
    
    for (const [key, customers] of customerGroups) {
      if (customers.length > 1) {
        duplicatesFound += customers.length - 1;
        
        // 按照建立時間排序，保留最新的
        customers.sort((a, b) => {
          const aTime = a.createdAt?.toDate() || new Date(0);
          const bTime = b.createdAt?.toDate() || new Date(0);
          return bTime.getTime() - aTime.getTime();
        });
        
        // 標記要刪除的項目（除了第一個）
        for (let i = 1; i < customers.length; i++) {
          toDelete.push(customers[i]);
        }
      }
    }
    
    onProgress?.({ message: `發現 ${duplicatesFound} 筆重複資料，正在清理...`, percent: 50 });
    
    if (toDelete.length === 0) {
      return {
        totalRecords,
        duplicatesFound: 0,
        duplicatesRemoved: 0,
        finalRecords: totalRecords
      };
    }
    
    // 執行刪除（分批處理）
    const batchSize = 5; // 最保守的批次大小避免 Firebase 寫入佇列耗盡
    let deletedCount = 0;
    
    for (let i = 0; i < toDelete.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchItems = toDelete.slice(i, i + batchSize);
      
      for (const customer of batchItems) {
        const customerDoc = doc(db, 'organizations', organizationId, 'customers', customer.id);
        batch.delete(customerDoc);
      }
      
      try {
        await batch.commit();
        deletedCount += batchItems.length;
        
        const progress = Math.floor(50 + (deletedCount / toDelete.length) * 40);
        onProgress?.({ 
          message: `已清理 ${deletedCount}/${toDelete.length} 筆重複資料...`, 
          percent: progress 
        });
        
        // 增加批次間延遲，避免 Firebase 限制
        if (i + batchSize < toDelete.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error('清理批次失敗:', error);
        
        // 如果是 resource-exhausted 錯誤，等待更長時間後重試
        if (error instanceof Error && error.message.includes('resource-exhausted')) {
          onProgress?.({ 
            message: `Firebase 資源限制，等待重試中...`, 
            percent: Math.floor(50 + (deletedCount / toDelete.length) * 40) 
          });
          
          await new Promise(resolve => setTimeout(resolve, 15000));
          
          try {
            await batch.commit();
            deletedCount += batchItems.length;
            console.log('清理重試成功');
          } catch (retryError) {
            console.error('清理重試失敗:', retryError);
            throw new Error(`批次清理失敗: ${retryError instanceof Error ? retryError.message : '未知錯誤'}`);
          }
        } else {
          throw error;
        }
      }
    }
    
    const finalRecords = totalRecords - deletedCount;
    onProgress?.({ message: '清理完成！', percent: 100 });
    
    return {
      totalRecords,
      duplicatesFound,
      duplicatesRemoved: deletedCount,
      finalRecords
    };
    
  } catch (error) {
    console.error('❌ 清理重複資料時發生錯誤:', error);
    console.error('❌ 錯誤類型:', typeof error);
    console.error('❌ 錯誤詳情:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    
    const errorMessage = error instanceof Error ? error.message : '未知錯誤';
    console.error('❌ 拋出錯誤:', errorMessage);
    throw new Error(`清理失敗: ${errorMessage}`);
  }
}

/**
 * 清理舊版路徑的重複客戶資料 (/customers)
 */
async function cleanupOldPathCustomers(
  db: any,
  snapshot: QuerySnapshot<DocumentData>,
  onProgress?: (progress: { message: string; percent: number }) => void
): Promise<CleanupResult> {
  console.log('🛠️ 處理舊版路徑的客戶資料清理...');
  
  const totalRecords = snapshot.size;
  
  // 按照 name + company 分組
  const customerGroups = new Map<string, Customer[]>();
  const allCustomers: Customer[] = [];
  
  snapshot.forEach(docSnapshot => {
    const data = docSnapshot.data();
    const customer: Customer = { 
      id: docSnapshot.id, 
      ...data,
      createdAt: data.createdAt || Timestamp.now()
    };
    allCustomers.push(customer);
    
    const key = `${data.name || ''}_${data.company || ''}`;
    if (!customerGroups.has(key)) {
      customerGroups.set(key, []);
    }
    customerGroups.get(key)!.push(customer);
  });
  
  // 找出重複項目
  let duplicatesFound = 0;
  const toDelete: Customer[] = [];
  
  for (const [key, customers] of customerGroups) {
    if (customers.length > 1) {
      duplicatesFound += customers.length - 1;
      
      // 按照建立時間排序，保留最新的
      customers.sort((a, b) => {
        const aTime = a.createdAt?.toDate() || new Date(0);
        const bTime = b.createdAt?.toDate() || new Date(0);
        return bTime.getTime() - aTime.getTime();
      });
      
      // 標記要刪除的項目（除了第一個）
      for (let i = 1; i < customers.length; i++) {
        toDelete.push(customers[i]);
      }
      
      console.log(`🔄 ${key}: 發現 ${customers.length} 筆重複，將保留最新的`);
    }
  }
  
  onProgress?.({ message: `發現 ${duplicatesFound} 筆重複資料，正在清理...`, percent: 50 });
  
  if (toDelete.length === 0) {
    return {
      totalRecords,
      duplicatesFound: 0,
      duplicatesRemoved: 0,
      finalRecords: totalRecords
    };
  }
  
  // 執行刪除（分批處理）- 舊版路徑
  const batchSize = 5;
  let deletedCount = 0;
  
  for (let i = 0; i < toDelete.length; i += batchSize) {
    const batch = writeBatch(db);
    const batchItems = toDelete.slice(i, i + batchSize);
    
    for (const customer of batchItems) {
      const customerDoc = doc(db, 'customers', customer.id); // 舊版路徑
      batch.delete(customerDoc);
    }
    
    try {
      await batch.commit();
      deletedCount += batchItems.length;
      
      const progress = Math.floor(50 + (deletedCount / toDelete.length) * 40);
      onProgress?.({ 
        message: `已清理 ${deletedCount}/${toDelete.length} 筆重複資料...`, 
        percent: progress 
      });
      
      if (i + batchSize < toDelete.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error('清理批次失敗:', error);
      
      if (error instanceof Error && error.message.includes('resource-exhausted')) {
        onProgress?.({ 
          message: `Firebase 資源限制，等待重試中...`, 
          percent: Math.floor(50 + (deletedCount / toDelete.length) * 40) 
        });
        
        await new Promise(resolve => setTimeout(resolve, 15000));
        
        try {
          await batch.commit();
          deletedCount += batchItems.length;
          console.log('清理重試成功');
        } catch (retryError) {
          console.error('清理重試失敗:', retryError);
          throw new Error(`批次清理失敗: ${retryError instanceof Error ? retryError.message : '未知錯誤'}`);
        }
      } else {
        throw error;
      }
    }
  }
  
  const finalRecords = totalRecords - deletedCount;
  onProgress?.({ message: '清理完成！', percent: 100 });
  
  return {
    totalRecords,
    duplicatesFound,
    duplicatesRemoved: deletedCount,
    finalRecords
  };
}