/**
 * 安全的用戶導入器
 * 確保不會影響當前登入狀態
 */

import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  where, 
  writeBatch,
  setDoc,
  Timestamp 
} from 'firebase/firestore';
import { getFirebaseDb } from '@/services/firebase/config';
import { getAuth } from 'firebase/auth';
import { LegacyUser, ImportError, ImportWarning } from '@/types/legacy-import';

/**
 * 安全的批量建立用戶（只建立 Firestore 文檔）
 * 絕對不會影響當前登入狀態
 */
export async function safeCreateUsers(
  usersToCreate: any[],
  organizationId: string,
  teamId: string,
  onProgress?: (msg: string) => void
): Promise<{
  userMappings: Map<string, string>;
  successCount: number;
  failureCount: number;
  errors: ImportError[];
  warnings: ImportWarning[];
}> {
  const db = getFirebaseDb();
  const auth = getAuth();
  const currentUser = auth.currentUser;
  
  // 記錄當前登入用戶，確保不會被改變
  console.log('🔒 當前登入用戶:', currentUser?.email);
  console.log('🔒 當前用戶 UID:', currentUser?.uid);
  
  const userMappings = new Map<string, string>();
  const errors: ImportError[] = [];
  const warnings: ImportWarning[] = [];
  let successCount = 0;
  let failureCount = 0;
  
  // 警告：只建立 Firestore 文檔
  console.warn('⚠️ 安全模式：只建立 Firestore 文檔，不建立 Auth 帳號');
  console.warn('⚠️ 用戶需要後續手動建立登入憑證');
  
  let batch = writeBatch(db);
  let batchCount = 0;
  
  for (let i = 0; i < usersToCreate.length; i++) {
    const userData = usersToCreate[i];
    
    try {
      onProgress?.(`處理用戶 ${i + 1}/${usersToCreate.length}: ${userData.email}`);
      
      // 檢查是否已存在
      const existingQuery = query(
        collection(db, 'users'),
        where('email', '==', userData.email),
        where('organizationId', '==', organizationId)
      );
      const existingDocs = await getDocs(existingQuery);
      
      if (!existingDocs.empty) {
        // 用戶已存在，使用現有 ID
        const existingId = existingDocs.docs[0].id;
        userMappings.set(userData.originalBusinessId || userData.email, existingId);
        
        warnings.push({
          type: 'users',
          row: userData.row || i + 1,
          field: 'email',
          message: `用戶已存在: ${userData.email}`,
          suggestion: '使用現有用戶 ID'
        });
        
        continue;
      }
      
      // 生成安全的文檔 ID（不是 Auth UID）
      const safeDocId = `imported_${organizationId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 建立 Firestore 文檔
      const userRef = doc(db, 'users', safeDocId);
      const userDocData = {
        id: safeDocId,
        uid: safeDocId, // 使用相同的 ID
        email: userData.email,
        name: userData.name || userData.businessName,
        role: userData.role || 'salesperson',
        organizationId: organizationId,
        teamIds: [teamId],
        department: userData.department || null,
        phone: userData.phone || null,
        isActive: false, // 明確標記為未啟用
        createdAt: Timestamp.now(),
        lastLoginAt: null,
        supervisorId: userData.supervisorId || null,
        personalGoals: {},
        customFields: userData.customFields || {},
        // 重要標記
        isImported: true,
        needsAuthAccount: true,
        importedAt: Timestamp.now(),
        importedBy: currentUser?.uid || 'unknown'
      };
      
      batch.set(userRef, userDocData);
      batchCount++;
      
      // 記錄映射
      userMappings.set(userData.originalBusinessId || userData.email, safeDocId);
      successCount++;
      
      // 每 500 筆提交一次（Firestore 批次限制）
      if (batchCount >= 500) {
        await batch.commit();
        batch = writeBatch(db); // 重新建立新的批次
        batchCount = 0;
        
        // 驗證當前用戶沒有改變
        const stillCurrentUser = auth.currentUser;
        if (stillCurrentUser?.uid !== currentUser?.uid) {
          console.error('❌ 警告：登入狀態被改變！');
          throw new Error('登入狀態被意外改變，停止導入');
        }
      }
      
    } catch (error) {
      failureCount++;
      errors.push({
        type: 'users',
        row: userData.row || i + 1,
        field: 'general',
        message: error instanceof Error ? error.message : '建立用戶文檔失敗',
        data: userData });
    }
  }
  
  // 提交剩餘的批次
  if (batchCount > 0) {
    await batch.commit();
  }
  
  // 最終驗證
  const finalUser = auth.currentUser;
  if (finalUser?.uid !== currentUser?.uid) {
    console.error('❌ 嚴重錯誤：登入狀態被改變！');
    console.error('原始用戶:', currentUser?.email);
    console.error('當前用戶:', finalUser?.email);
    
    errors.push({
      type: 'users',
      row: 0,
      field: 'auth',
      message: '登入狀態被意外改變',
      data: null
    });
  } else {
    console.log('✅ 登入狀態保持不變:', currentUser?.email);
  }
  
  // 添加總結警告
  warnings.push({
    type: 'users',
    row: 0,
    field: 'general',
    message: `已建立 ${successCount} 個用戶文檔（僅 Firestore），未建立登入憑證`,
    suggestion: '用戶需要後續設定密碼才能登入'
  });
  
  return {
    userMappings,
    successCount,
    failureCount,
    errors,
    warnings
  };
}