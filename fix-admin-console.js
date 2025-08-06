// 直接在瀏覽器 Console 執行此程式碼
async function fixAdminNow() {
  try {
    // 獲取 Firebase 實例
    const { getFirestore, collection, query, where, getDocs, doc, updateDoc, getDoc } = await import('firebase/firestore');
    const { getAuth } = await import('firebase/auth');
    
    const auth = getAuth();
    const db = getFirestore();
    
    // 確認當前登入用戶
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error('❌ 請先登入');
      return;
    }
    
    console.log('🔍 當前登入用戶:', currentUser.email);
    console.log('🔍 當前用戶 UID:', currentUser.uid);
    
    // 直接使用 UID 更新
    const userRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.log('❌ 找不到用戶文檔，需要建立新的');
      
      // 使用 setDoc 建立完整的用戶文檔
      const { setDoc } = await import('firebase/firestore');
      await setDoc(userRef, {
        id: currentUser.uid,
        uid: currentUser.uid,
        email: currentUser.email || 'admin@donnaai-app.com',
        name: 'System Administrator',
        role: 'super_admin',
        isSuperAdmin: true,
        isActive: true,
        organizationId: 'platform', // 特殊組織 ID
        platformPermissions: [
          'manage_organizations',
          'manage_users', 
          'view_analytics',
          'manage_billing',
          'access_admin_panel',
          'platform_admin'
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('✅ 已建立 Super Admin 用戶文檔');
    } else {
      const currentData = userDoc.data();
      console.log('找到現有用戶文檔:', currentData);
      
      // 更新為 Super Admin
      await updateDoc(userRef, {
        role: 'super_admin',
        isSuperAdmin: true,
        isActive: true,
        organizationId: currentData.organizationId || 'platform',
        platformPermissions: [
          'manage_organizations',
          'manage_users',
          'view_analytics', 
          'manage_billing',
          'access_admin_panel',
          'platform_admin'
        ],
        updatedAt: new Date()
      });
      
      console.log('✅ 已更新為 Super Admin');
    }
    
    // 驗證更新
    const verifyDoc = await getDoc(userRef);
    const verifyData = verifyDoc.data();
    
    console.log('📋 最終權限狀態:', {
      uid: currentUser.uid,
      email: verifyData?.email,
      role: verifyData?.role,
      isSuperAdmin: verifyData?.isSuperAdmin,
      platformPermissions: verifyData?.platformPermissions
    });
    
    console.log('✅ 權限修復完成！請重新整理頁面 (F5)');
    
  } catch (error) {
    console.error('❌ 修復權限時發生錯誤:', error);
  }
}

// 執行修復
fixAdminNow();