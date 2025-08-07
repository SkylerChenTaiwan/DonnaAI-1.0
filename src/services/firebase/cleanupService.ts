/**
 * Firebase 資料清理服務
 * 用於清理重複的客戶資料
 */

import { collection, getDocs, writeBatch, doc, Timestamp } from 'firebase/firestore';
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
  const db = getFirebaseDb();
  
  try {
    onProgress?.({ message: '正在載入客戶資料...', percent: 10 });
    
    // 取得所有客戶資料
    const customersRef = collection(db, 'organizations', organizationId, 'customers');
    const snapshot = await getDocs(customersRef);
    
    const totalRecords = snapshot.size;
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
    const batchSize = 10; // 降低批次大小避免 Firebase 寫入佇列耗盡
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
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error('清理批次失敗:', error);
        
        // 如果是 resource-exhausted 錯誤，等待更長時間後重試
        if (error instanceof Error && error.message.includes('resource-exhausted')) {
          onProgress?.({ 
            message: `Firebase 資源限制，等待重試中...`, 
            percent: Math.floor(50 + (deletedCount / toDelete.length) * 40) 
          });
          
          await new Promise(resolve => setTimeout(resolve, 10000));
          
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
    console.error('清理重複資料時發生錯誤:', error);
    throw new Error(`清理失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
  }
}