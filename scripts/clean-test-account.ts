import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 載入生產環境變數
dotenv.config({ path: path.join(__dirname, '..', '.env.production') });

const REVIEW_EMAIL = 'reviewer@donnaai.app';

async function cleanTestAccount() {
  console.log('🧹 清理現有測試帳號...');
  
  // 初始化 Admin SDK
  const app = initializeApp({
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID
  });
  
  const auth = getAuth(app);
  const db = getFirestore(app);
  
  try {
    // 嘗試取得用戶
    const user = await auth.getUserByEmail(REVIEW_EMAIL);
    console.log('找到現有帳號:', user.uid);
    
    // 刪除 Firestore 資料
    await db.collection('users').doc(user.uid).delete();
    await db.collection('organizations').doc(`org_${user.uid}`).delete();
    
    // 刪除認證帳號
    await auth.deleteUser(user.uid);
    
    console.log('✅ 已清理測試帳號');
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      console.log('✅ 沒有找到現有測試帳號');
    } else {
      console.error('❌ 清理錯誤:', error);
    }
  }
}

// 執行腳本
if (require.main === module) {
  cleanTestAccount()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('腳本執行失敗:', error);
      process.exit(1);
    });
}