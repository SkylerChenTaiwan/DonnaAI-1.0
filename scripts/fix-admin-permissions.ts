/**
 * 修復 admin@donnaai-app.com 的 Super Admin 權限
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  updateDoc,
  getDoc
} from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// Firebase 配置（staging）
const firebaseConfig = {
  apiKey: "AIzaSyC2v4IIGR-hF_HGZlWfp_Ct0xS3fPFQEQ0",
  authDomain: "donnaai-5e601.firebaseapp.com",
  projectId: "donnaai-5e601",
  storageBucket: "donnaai-5e601.appspot.com",
  messagingSenderId: "748876929238",
  appId: "1:748876929238:web:1a1f0a8b5c0b9c0b9c0b9c"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function fixAdminPermissions() {
  try {
    console.log('🔧 開始修復 admin@donnaai-app.com 的權限...');

    // 查詢 admin@donnaai-app.com 用戶
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', 'admin@donnaai-app.com'));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.error('❌ 找不到 admin@donnaai-app.com 用戶');
      
      // 嘗試使用不同的查詢方式
      console.log('嘗試搜尋所有用戶...');
      const allUsersSnapshot = await getDocs(usersRef);
      
      allUsersSnapshot.forEach(doc => {
        const userData = doc.data();
        if (userData.email?.toLowerCase() === 'admin@donnaai-app.com') {
          console.log('找到用戶:', doc.id, userData);
        }
      });
      return;
    }

    // 更新用戶權限
    for (const userDoc of querySnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      console.log('找到用戶:', {
        id: userId,
        email: userData.email,
        currentRole: userData.role,
        currentIsSuperAdmin: userData.isSuperAdmin
      });

      // 更新為 Super Admin
      const updates = {
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
      };

      await updateDoc(doc(db, 'users', userId), updates);
      
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

    console.log('✅ 權限修復完成！');
    console.log('請重新登入以套用新權限。');
    
  } catch (error) {
    console.error('❌ 修復權限時發生錯誤:', error);
  }
}

// 執行修復
fixAdminPermissions()
  .then(() => {
    console.log('腳本執行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('腳本執行失敗:', error);
    process.exit(1);
  });