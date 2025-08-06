/**
 * 在瀏覽器中修復 admin@donnaai-app.com 的權限
 * 需要先用有權限的帳號登入
 */

import { getFirestore, collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export async function fixAdminPermissions() {
  try {
    const auth = getAuth();
    const db = getFirestore();
    
    // 確認當前登入用戶
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error('❌ 請先登入');
      return;
    }
    
    console.log('🔍 當前登入用戶:', currentUser.email);
    
    // 查詢 admin@donnaai-app.com
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', 'admin@donnaai-app.com'));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.error('❌ 找不到 admin@donnaai-app.com 用戶');
      
      // 如果找不到，可能是因為 email 欄位大小寫問題
      // 嘗試使用 UID 直接查詢
      if (currentUser.email === 'admin@donnaai-app.com') {
        console.log('使用當前用戶 UID 更新:', currentUser.uid);
        
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          console.log('找到當前用戶文檔:', userDoc.data());
          
          // 更新權限
          await updateDoc(userRef, {
            role: 'super_admin',
            isSuperAdmin: true,
            platformPermissions: [
              'manage_organizations',
              'manage_users',
              'view_analytics', 
              'manage_billing',
              'access_admin_panel'
            ],
            updatedAt: new Date()
          });
          
          console.log('✅ 已更新當前用戶為 Super Admin');
          console.log('請重新整理頁面以套用新權限');
          return;
        }
      }
      return;
    }
    
    // 更新找到的用戶
    for (const userDoc of querySnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      console.log('找到用戶:', {
        id: userId,
        email: userData.email,
        currentRole: userData.role,
        currentIsSuperAdmin: userData.isSuperAdmin
      });
      
      // 更新權限
      await updateDoc(doc(db, 'users', userId), {
        role: 'super_admin',
        isSuperAdmin: true,
        platformPermissions: [
          'manage_organizations',
          'manage_users',
          'view_analytics',
          'manage_billing', 
          'access_admin_panel'
        ],
        updatedAt: new Date()
      });
      
      console.log('✅ 已更新用戶權限為 Super Admin');
      
      // 驗證更新
      const updatedDoc = await getDoc(doc(db, 'users', userId));
      const updatedData = updatedDoc.data();
      
      console.log('驗證更新結果:', {
        id: userId,
        email: updatedData?.email,
        newRole: updatedData?.role,
        newIsSuperAdmin: updatedData?.isSuperAdmin
      });
    }
    
    console.log('✅ 權限修復完成！請重新整理頁面。');
    
  } catch (error) {
    console.error('❌ 修復權限時發生錯誤:', error);
  }
}

// 將函數暴露到全域
if (typeof window !== 'undefined') {
  (window as any).fixAdminPermissions = fixAdminPermissions;
}