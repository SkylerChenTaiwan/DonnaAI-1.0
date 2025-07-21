/**
 * 優化的客戶管理服務 V2
 * 使用查詢層級權限，避免 N+1 查詢問題
 */

import { 
  collection, 
  query, 
  where, 
  getDocs,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { getFirebaseDb } from './config';
import { CustomerDoc } from '../../types/firebase';
import { User } from '../../types/user';
import { getUserPermissionContext, buildQueryConstraints } from './permissions-v2';

/**
 * 優化的獲取客戶列表
 * 直接在查詢層級過濾，不需要逐一檢查權限
 */
export async function getCustomersOptimized(
  user: User,
  filters?: {
    searchTerm?: string;
    tags?: string[];
  }
): Promise<CustomerDoc[]> {
  try {
    // 取得權限上下文（帶快取）
    const permissionContext = await getUserPermissionContext(user);
    
    // 建立基礎查詢
    let q = query(collection(getFirebaseDb(), 'customers'));
    
    // 根據權限加入查詢條件
    const constraints = buildQueryConstraints(permissionContext, 'customers');
    constraints.forEach(([field, op, value]) => {
      q = query(q, where(field as string, op as any, value));
    });
    
    // 執行查詢
    const snapshot = await getDocs(q);
    let customers: CustomerDoc[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CustomerDoc));
    
    // 客戶端過濾（搜尋、標籤等）
    if (filters?.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      customers = customers.filter(c => 
        c.name.toLowerCase().includes(searchLower) ||
        c.company?.toLowerCase().includes(searchLower) ||
        c.email?.toLowerCase().includes(searchLower) ||
        c.phone?.includes(filters.searchTerm)
      );
    }
    
    if (filters?.tags && filters.tags.length > 0) {
      customers = customers.filter(c => 
        c.tags?.some(tag => filters.tags!.includes(tag))
      );
    }
    
    console.log(`✅ 獲取到 ${customers.length} 個客戶（優化版）`);
    return customers;
    
  } catch (error) {
    console.error('獲取客戶列表失敗:', error);
    throw error;
  }
}

/**
 * 優化的訂閱客戶資料
 * 使用查詢層級權限
 */
export function subscribeToCustomersOptimized(
  user: User,
  callback: (customers: CustomerDoc[]) => void
): Unsubscribe {
  // 取得權限上下文
  getUserPermissionContext(user).then(permissionContext => {
    // 建立查詢
    let q = query(collection(getFirebaseDb(), 'customers'));
    
    const constraints = buildQueryConstraints(permissionContext, 'customers');
    constraints.forEach(([field, op, value]) => {
      q = query(q, where(field as string, op as any, value));
    });
    
    // 訂閱
    return onSnapshot(q, (snapshot) => {
      const customers: CustomerDoc[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as CustomerDoc));
      
      callback(customers);
    }, (error) => {
      console.error('訂閱客戶資料失敗:', error);
    });
  });
  
  // 返回空的 unsubscribe（實際的會在 Promise 中設定）
  return () => {};
}