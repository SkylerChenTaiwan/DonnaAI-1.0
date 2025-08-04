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
  console.log('📥 getCustomersOptimized 開始', { userEmail: user.email, userId: user.uid });
  
  try {
    // 取得權限上下文（帶快取）
    const permissionContext = await getUserPermissionContext(user);
    console.log('🔑 權限上下文:', permissionContext);
    
    // 建立基礎查詢
    let q = query(collection(getFirebaseDb(), 'customers'));
    
    // 根據權限加入查詢條件
    const constraints = buildQueryConstraints(permissionContext, 'customers');
    console.log('🔍 查詢條件:', constraints);
    
    constraints.forEach(([field, op, value]) => {
      q = query(q, where(field as string, op as any, value));
    });
    
    // 執行查詢
    const snapshot = await getDocs(q);
    console.log(`📊 查詢結果: ${snapshot.size} 個文件`);
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
  console.log('📡 訂閱客戶資料優化版 - 開始', { userEmail: user.email });
  
  let unsubscribeFunction: Unsubscribe | null = null;
  
  // 取得權限上下文
  getUserPermissionContext(user).then(permissionContext => {
    console.log('🔑 權限上下文:', permissionContext);
    
    // 建立查詢
    let q = query(collection(getFirebaseDb(), 'customers'));
    
    const constraints = buildQueryConstraints(permissionContext, 'customers');
    console.log('🔍 查詢條件:', constraints);
    
    constraints.forEach(([field, op, value]) => {
      q = query(q, where(field as string, op as any, value));
    });
    
    // 訂閱
    unsubscribeFunction = onSnapshot(q, (snapshot) => {
      const customers: CustomerDoc[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as CustomerDoc));
      
      console.log(`✅ 訂閱收到客戶資料更新，數量: ${customers.length}`);
      callback(customers);
    }, (error) => {
      console.error('❌ 訂閱客戶資料失敗:', error);
      // 如果是權限錯誤，嘗試更寬鬆的查詢
      if (error.code === 'permission-denied') {
        console.log('🔄 嘗試使用更寬鬆的查詢條件...');
        const fallbackQuery = query(
          collection(getFirebaseDb(), 'customers'),
          where('createdBy', '==', user.uid)
        );
        
        unsubscribeFunction = onSnapshot(fallbackQuery, (snapshot) => {
          const customers: CustomerDoc[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as CustomerDoc));
          
          console.log(`✅ 後備查詢成功，數量: ${customers.length}`);
          callback(customers);
        }, (fallbackError) => {
          console.error('❌ 後備查詢也失敗:', fallbackError);
        });
      }
    });
  }).catch(error => {
    console.error('❌ 獲取權限上下文失敗:', error);
  });
  
  // 返回一個可以正確清理訂閱的函數
  return () => {
    console.log('🔌 取消訂閱客戶資料');
    if (unsubscribeFunction) {
      unsubscribeFunction();
    }
  };
}