/**
 * 緊急權限修復工具
 * 可在瀏覽器 Console 中執行的緊急修復功能
 * 
 * 使用方法：
 * 1. 打開瀏覽器開發者工具 (F12)
 * 2. 切換到 Console 標籤
 * 3. 執行 window.emergencyPermissionFix()
 */

import { getAuth } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getFirebaseDb } from '@/services/firebase/config';
import { 
  SUPER_ADMIN_EMAILS, 
  PLATFORM_PERMISSIONS,
  ORG_PERMISSIONS,
  Role 
} from '@/constants/permissions';

// 定義全域 window 介面
declare global {
  interface Window {
    emergencyPermissionFix: () => Promise<void>;
    forceGrantSuperAdmin: (email?: string) => Promise<void>;
    checkMyPermissions: () => Promise<void>;
    repairAllSuperAdmins: () => Promise<void>;
    clearPermissionCache: () => void;
    debugPermissions: (email?: string) => Promise<void>;
  }
}

/**
 * 緊急修復當前用戶權限
 */
export const emergencyPermissionFix = async (): Promise<void> => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) {
    console.error('❌ 沒有登入的用戶');
    return;
  }
  
  console.log('🔧 開始緊急權限修復...');
  console.log('📧 當前用戶:', user.email);
  
  try {
    const db = getFirebaseDb();
    const userRef = doc(db, 'users', user.uid);
    
    // 檢查是否為 Super Admin email
    const isSuperAdminEmail = user.email && SUPER_ADMIN_EMAILS.includes(user.email);
    
    if (isSuperAdminEmail) {
      console.log('✅ 檢測到 Super Admin email，授予完整權限...');
      
      // 授予完整的 Super Admin 權限
      await setDoc(userRef, {
        email: user.email,
        role: Role.SUPER_ADMIN,
        isSuperAdmin: true,
        platformPermissions: Object.values(PLATFORM_PERMISSIONS),
        organizationId: 'system',
        lastPermissionRepair: serverTimestamp(),
        repairedBy: 'emergency_fix',
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      console.log('✅ Super Admin 權限已修復！');
    } else {
      // 一般用戶權限修復
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        console.log('⚠️ 用戶文檔不存在，建立基本文檔...');
        
        await setDoc(userRef, {
          id: user.uid,
          email: user.email,
          name: user.displayName || user.email?.split('@')[0] || 'User',
          role: Role.TEAM_MEMBER,
          platformPermissions: [],
          createdAt: serverTimestamp(),
          createdBy: 'emergency_fix'
        });
        
        console.log('✅ 基本用戶文檔已建立');
      } else {
        console.log('📋 修復現有用戶權限...');
        
        const userData = userDoc.data();
        const role = userData.role || Role.TEAM_MEMBER;
        
        // 根據角色修復權限
        let permissions: string[] = [];
        switch (role) {
          case 'super_admin':
          case 'system-admin':
            permissions = Object.values(PLATFORM_PERMISSIONS);
            break;
          case 'admin':
          case 'org_admin':
            permissions = Object.values(ORG_PERMISSIONS);
            break;
          default:
            permissions = userData.platformPermissions || [];
        }
        
        await updateDoc(userRef, {
          platformPermissions: permissions,
          lastPermissionRepair: serverTimestamp(),
          repairedBy: 'emergency_fix'
        });
        
        console.log('✅ 權限已根據角色修復');
      }
    }
    
    console.log('🎉 權限修復完成！請重新整理頁面。');
    console.log('💡 提示：按 F5 或 Cmd+R 重新整理');
    
  } catch (error) {
    console.error('❌ 權限修復失敗:', error);
    console.log('💡 請嘗試執行 window.forceGrantSuperAdmin()');
  }
};

/**
 * 強制授予 Super Admin 權限
 */
export const forceGrantSuperAdmin = async (email?: string): Promise<void> => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) {
    console.error('❌ 沒有登入的用戶');
    return;
  }
  
  const targetEmail = email || user.email;
  console.log('👑 強制授予 Super Admin 權限給:', targetEmail);
  
  try {
    const db = getFirebaseDb();
    const userRef = doc(db, 'users', user.uid);
    
    // 授予完整的 Super Admin 權限
    await setDoc(userRef, {
      email: targetEmail,
      role: Role.SUPER_ADMIN,
      isSuperAdmin: true,
      platformPermissions: [
        ...Object.values(PLATFORM_PERMISSIONS),
        ...Object.values(ORG_PERMISSIONS)
      ],
      organizationId: 'system',
      forceGranted: true,
      grantedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    console.log('✅ Super Admin 權限已強制授予！');
    console.log('🎉 請重新整理頁面以套用變更。');
    
  } catch (error) {
    console.error('❌ 授予權限失敗:', error);
  }
};

/**
 * 檢查當前用戶權限
 */
export const checkMyPermissions = async (): Promise<void> => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) {
    console.error('❌ 沒有登入的用戶');
    return;
  }
  
  console.log('🔍 檢查權限狀態...');
  console.log('=====================================');
  console.log('📧 Email:', user.email);
  console.log('🆔 UID:', user.uid);
  
  try {
    const db = getFirebaseDb();
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      console.log('❌ 用戶文檔不存在！');
      console.log('💡 執行 window.emergencyPermissionFix() 來建立');
      return;
    }
    
    const userData = userDoc.data();
    console.log('=====================================');
    console.log('📋 用戶資料:');
    console.log('  角色:', userData.role || '未設定');
    console.log('  是否為 Super Admin:', userData.isSuperAdmin || false);
    console.log('  組織 ID:', userData.organizationId || '未設定');
    console.log('=====================================');
    console.log('🔑 權限列表:');
    
    const permissions = userData.platformPermissions || [];
    if (permissions.length === 0) {
      console.log('  ❌ 沒有任何權限');
    } else {
      permissions.forEach((p: string) => console.log('  ✅', p));
    }
    
    console.log('=====================================');
    
    // 檢查是否應該是 Super Admin
    if (user.email && SUPER_ADMIN_EMAILS.includes(user.email)) {
      if (!userData.isSuperAdmin) {
        console.log('⚠️ 警告：您的 email 在 Super Admin 列表中，但權限不正確！');
        console.log('💡 執行 window.emergencyPermissionFix() 來修復');
      } else {
        console.log('✅ Super Admin 權限正確');
      }
    }
    
  } catch (error) {
    console.error('❌ 檢查權限失敗:', error);
  }
};

/**
 * 修復所有 Super Admin 權限
 */
export const repairAllSuperAdmins = async (): Promise<void> => {
  console.log('🔧 開始修復所有 Super Admin 權限...');
  console.log('📧 Super Admin 列表:', SUPER_ADMIN_EMAILS);
  
  const auth = getAuth();
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    console.error('❌ 需要先登入');
    return;
  }
  
  try {
    const db = getFirebaseDb();
    
    // 只能修復當前登入用戶的權限
    if (currentUser.email && SUPER_ADMIN_EMAILS.includes(currentUser.email)) {
      console.log(`修復 ${currentUser.email} 的權限...`);
      
      await setDoc(doc(db, 'users', currentUser.uid), {
        email: currentUser.email,
        role: Role.SUPER_ADMIN,
        isSuperAdmin: true,
        platformPermissions: Object.values(PLATFORM_PERMISSIONS),
        organizationId: 'system',
        lastPermissionRepair: serverTimestamp(),
        repairedBy: 'repair_all_super_admins'
      }, { merge: true });
      
      console.log(`✅ ${currentUser.email} 權限已修復`);
    } else {
      console.log('⚠️ 當前用戶不在 Super Admin 列表中');
    }
    
    console.log('🎉 修復完成！請重新整理頁面。');
    
  } catch (error) {
    console.error('❌ 修復失敗:', error);
  }
};

/**
 * 清除權限快取
 */
export const clearPermissionCache = (): void => {
  console.log('🧹 清除權限快取...');
  
  try {
    // 清除 localStorage
    const keysToRemove = Object.keys(localStorage).filter(key => 
      key.includes('permission') || 
      key.includes('auth') || 
      key.includes('user')
    );
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`  已清除: ${key}`);
    });
    
    // 清除 sessionStorage
    const sessionKeysToRemove = Object.keys(sessionStorage).filter(key => 
      key.includes('permission') || 
      key.includes('auth') || 
      key.includes('user')
    );
    
    sessionKeysToRemove.forEach(key => {
      sessionStorage.removeItem(key);
      console.log(`  已清除: ${key}`);
    });
    
    console.log('✅ 快取清除完成！請重新整理頁面。');
    
  } catch (error) {
    console.error('❌ 清除快取失敗:', error);
  }
};

/**
 * 偵錯權限問題
 */
export const debugPermissions = async (email?: string): Promise<void> => {
  console.log('🐛 開始權限偵錯...');
  console.log('=====================================');
  
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) {
    console.error('❌ 沒有登入的用戶');
    return;
  }
  
  const targetEmail = email || user.email;
  console.log('🎯 目標用戶:', targetEmail);
  
  // 1. 檢查 Firebase Auth 狀態
  console.log('\n1️⃣ Firebase Auth 狀態:');
  console.log('  UID:', user.uid);
  console.log('  Email:', user.email);
  console.log('  Email 已驗證:', user.emailVerified);
  console.log('  顯示名稱:', user.displayName);
  
  // 2. 檢查 Firestore 用戶文檔
  console.log('\n2️⃣ Firestore 用戶文檔:');
  try {
    const db = getFirebaseDb();
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      console.log('  文檔存在: ✅');
      console.log('  資料:', JSON.stringify(data, null, 2));
    } else {
      console.log('  文檔存在: ❌');
    }
  } catch (error) {
    console.error('  讀取失敗:', error);
  }
  
  // 3. 檢查是否應該是 Super Admin
  console.log('\n3️⃣ Super Admin 檢查:');
  console.log('  在 Super Admin 列表中:', 
    targetEmail && SUPER_ADMIN_EMAILS.includes(targetEmail) ? '✅' : '❌'
  );
  console.log('  Super Admin 列表:', SUPER_ADMIN_EMAILS);
  
  // 4. 建議修復方案
  console.log('\n4️⃣ 建議修復方案:');
  if (targetEmail && SUPER_ADMIN_EMAILS.includes(targetEmail)) {
    console.log('  💡 執行: window.emergencyPermissionFix()');
  } else {
    console.log('  💡 聯繫管理員授予適當權限');
  }
  
  console.log('=====================================');
};

// 初始化：將函數掛載到 window 物件
if (typeof window !== 'undefined') {
  window.emergencyPermissionFix = emergencyPermissionFix;
  window.forceGrantSuperAdmin = forceGrantSuperAdmin;
  window.checkMyPermissions = checkMyPermissions;
  window.repairAllSuperAdmins = repairAllSuperAdmins;
  window.clearPermissionCache = clearPermissionCache;
  window.debugPermissions = debugPermissions;
  
  console.log('🚨 緊急權限修復工具已載入！');
  console.log('可用命令：');
  console.log('  window.emergencyPermissionFix() - 修復當前用戶權限');
  console.log('  window.forceGrantSuperAdmin() - 強制授予 Super Admin');
  console.log('  window.checkMyPermissions() - 檢查權限狀態');
  console.log('  window.repairAllSuperAdmins() - 修復所有 Super Admin');
  console.log('  window.clearPermissionCache() - 清除權限快取');
  console.log('  window.debugPermissions() - 偵錯權限問題');
}