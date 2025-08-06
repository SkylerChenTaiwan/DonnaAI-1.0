/**
 * 自動管理員權限設置服務
 * 確保 admin@donnaai-app.com 永遠擁有 Super Admin 權限
 */

import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { getFirebaseDb } from '../config';

// Super Admin 的固定 email
const SUPER_ADMIN_EMAILS = [
  'admin@donnaai-app.com',
  'admin@donnaai.com',
  'skyler@donnaai.com' // 加入你的個人 email 作為備份
];

/**
 * 檢查並自動設置 Super Admin 權限
 * 在用戶登入時自動執行
 */
export async function ensureSuperAdminPermissions(user: User): Promise<boolean> {
  // 檢查是否為預設的 Super Admin email
  if (!user.email || !SUPER_ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    return false;
  }

  try {
    const db = getFirebaseDb();
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      // 如果用戶文檔不存在，建立新的 Super Admin 文檔
      console.log(`🔧 建立 Super Admin 文檔: ${user.email}`);
      
      await setDoc(userRef, {
        id: user.uid,
        uid: user.uid,
        email: user.email,
        name: user.displayName || 'System Administrator',
        role: 'super_admin',
        isSuperAdmin: true,
        isActive: true,
        organizationId: 'platform', // 特殊的平台級組織 ID
        platformPermissions: [
          'manage_organizations',
          'manage_users',
          'view_analytics',
          'manage_billing',
          'access_admin_panel',
          'platform_admin',
          'super_admin_access'
        ],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        autoCreated: true,
        lastVerified: serverTimestamp()
      });

      console.log(`✅ Super Admin 文檔建立成功: ${user.email}`);
      return true;
    }

    // 檢查現有文檔是否有正確的權限
    const userData = userDoc.data();
    const needsUpdate = 
      userData.role !== 'super_admin' || 
      userData.isSuperAdmin !== true ||
      !userData.platformPermissions?.includes('super_admin_access');

    if (needsUpdate) {
      console.log(`🔧 更新 Super Admin 權限: ${user.email}`);
      
      await updateDoc(userRef, {
        role: 'super_admin',
        isSuperAdmin: true,
        isActive: true,
        organizationId: userData.organizationId || 'platform',
        platformPermissions: [
          'manage_organizations',
          'manage_users',
          'view_analytics',
          'manage_billing',
          'access_admin_panel',
          'platform_admin',
          'super_admin_access'
        ],
        updatedAt: serverTimestamp(),
        lastVerified: serverTimestamp()
      });

      console.log(`✅ Super Admin 權限更新成功: ${user.email}`);
      return true;
    }

    // 更新最後驗證時間
    await updateDoc(userRef, {
      lastVerified: serverTimestamp()
    });

    console.log(`✅ Super Admin 權限已驗證: ${user.email}`);
    return true;

  } catch (error) {
    console.error('❌ 設置 Super Admin 權限時發生錯誤:', error);
    return false;
  }
}

/**
 * 檢查用戶是否為 Super Admin
 */
export function isSuperAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * 獲取所有 Super Admin emails
 */
export function getSuperAdminEmails(): string[] {
  return [...SUPER_ADMIN_EMAILS];
}