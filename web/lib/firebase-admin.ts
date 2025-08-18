/**
 * Firebase Admin SDK 配置
 * 用於 Next.js API Routes 的伺服器端 Firebase 操作
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Firebase Admin SDK 配置介面
interface FirebaseConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

// 從環境變數讀取配置
function getFirebaseConfig(): FirebaseConfig {
  const projectId = process.env['FIREBASE_PROJECT_ID'];
  const clientEmail = process.env['FIREBASE_CLIENT_EMAIL'];
  const privateKey = process.env['FIREBASE_PRIVATE_KEY'];

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Missing Firebase Admin SDK configuration. Please check your environment variables.'
    );
  }

  return {
    projectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, '\n'), // 處理換行符
  };
}

// 初始化 Firebase Admin SDK（單例模式）
function initializeFirebaseAdmin() {
  // 避免重複初始化
  if (getApps().length > 0) {
    return getApps()[0]!;
  }

  const config = getFirebaseConfig();

  const app = initializeApp({
    credential: cert({
      projectId: config.projectId,
      clientEmail: config.clientEmail,
      privateKey: config.privateKey,
    }),
    projectId: config.projectId,
    storageBucket: `${config.projectId}.appspot.com`,
  });

  return app;
}

// 初始化 Firebase Admin 應用
const firebaseAdmin = initializeFirebaseAdmin();

// 匯出 Firebase Admin 服務
export const adminAuth = getAuth(firebaseAdmin);
export const adminDb = getFirestore(firebaseAdmin);
export const adminStorage = getStorage(firebaseAdmin);

// 驗證用戶 Token 的輔助函數
export async function verifyIdToken(token: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return { success: true, user: decodedToken };
  } catch (error) {
    console.error('Token verification failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// 取得用戶資料的輔助函數
export async function getUser(uid: string) {
  try {
    const userRecord = await adminAuth.getUser(uid);
    return { success: true, user: userRecord };
  } catch (error) {
    console.error('Get user failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Firestore 操作輔助函數
export class FirestoreService {
  /**
   * 取得集合中的所有文檔
   */
  static async getCollection(collectionName: string) {
    try {
      const snapshot = await adminDb.collection(collectionName).get();
      const data = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }) as Record<string, unknown>);
      return { success: true, data };
    } catch (error) {
      console.error(`Get collection ${collectionName} failed:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * 取得特定文檔
   */
  static async getDocument(collectionName: string, documentId: string) {
    try {
      const doc = await adminDb.collection(collectionName).doc(documentId).get();
      if (!doc.exists) {
        return { success: false, error: 'Document not found' };
      }
      return { success: true, data: { id: doc.id, ...doc.data() } as Record<string, unknown> };
    } catch (error) {
      console.error(`Get document ${collectionName}/${documentId} failed:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * 建立新文檔
   */
  static async createDocument(
    collectionName: string, 
    data: Record<string, unknown>, 
    customId?: string
  ) {
    try {
      const timestamp = new Date();
      const docData = {
        ...data,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      let docRef;
      if (customId) {
        docRef = adminDb.collection(collectionName).doc(customId);
        await docRef.set(docData);
      } else {
        docRef = await adminDb.collection(collectionName).add(docData);
      }

      return { success: true, data: { id: docRef.id, ...docData } };
    } catch (error) {
      console.error(`Create document in ${collectionName} failed:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * 更新文檔
   */
  static async updateDocument(
    collectionName: string, 
    documentId: string, 
    data: Record<string, unknown>
  ) {
    try {
      const docRef = adminDb.collection(collectionName).doc(documentId);
      const updateData = {
        ...data,
        updatedAt: new Date(),
      };

      await docRef.update(updateData);
      return { success: true, data: { id: documentId, ...updateData } };
    } catch (error) {
      console.error(`Update document ${collectionName}/${documentId} failed:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * 刪除文檔
   */
  static async deleteDocument(collectionName: string, documentId: string) {
    try {
      await adminDb.collection(collectionName).doc(documentId).delete();
      return { success: true };
    } catch (error) {
      console.error(`Delete document ${collectionName}/${documentId} failed:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * 查詢文檔（帶條件）
   */
  static async queryDocuments(
    collectionName: string,
    field: string,
    operator: FirebaseFirestore.WhereFilterOp,
    value: unknown,
    limit?: number
  ) {
    try {
      let query = adminDb.collection(collectionName).where(field, operator, value);
      
      if (limit) {
        query = query.limit(limit);
      }

      const snapshot = await query.get();
      const data = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }) as Record<string, unknown>);
      
      return { success: true, data };
    } catch (error) {
      console.error(`Query documents in ${collectionName} failed:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

// 權限檢查輔助函數
export class PermissionService {
  /**
   * 檢查用戶是否為 Super Admin
   */
  static async isSuperAdmin(uid: string): Promise<boolean> {
    try {
      const result = await FirestoreService.getDocument('users', uid);
      if (result.success && result.data) {
        const userData = result.data as Record<string, unknown>;
        return userData['role'] === 'superAdmin';
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * 檢查用戶是否為組織管理員
   */
  static async isOrganizationAdmin(uid: string, organizationId: string): Promise<boolean> {
    try {
      const result = await FirestoreService.getDocument('users', uid);
      if (result.success && result.data) {
        const userData = result.data as Record<string, unknown>;
        return userData['role'] === 'orgAdmin' && userData['organizationId'] === organizationId;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * 檢查用戶是否可以訪問特定組織的資料
   */
  static async canAccessOrganization(uid: string, organizationId: string): Promise<boolean> {
    try {
      const result = await FirestoreService.getDocument('users', uid);
      if (result.success && result.data) {
        const userData = result.data as Record<string, unknown>;
        return (
          userData['role'] === 'superAdmin' ||
          userData['organizationId'] === organizationId
        );
      }
      return false;
    } catch {
      return false;
    }
  }
}

// 匯出預設實例
export default firebaseAdmin;