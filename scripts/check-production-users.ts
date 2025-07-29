/**
 * 檢查生產環境 Firebase 的使用者帳號
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 載入生產環境變數
dotenv.config({ path: path.join(__dirname, '..', '.env.production') });

// 使用生產環境配置
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

async function checkProductionUsers() {
  console.log('🔍 檢查生產環境 Firebase 使用者...');
  console.log('📍 Firebase Project:', firebaseConfig.projectId);
  console.log('');

  // 初始化 Firebase
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  try {
    // 檢查 Firestore 中的 users 集合
    console.log('📋 檢查 Firestore users 集合...');
    const usersSnapshot = await getDocs(collection(db, 'users'));
    
    if (usersSnapshot.empty) {
      console.log('❌ users 集合是空的，沒有找到任何使用者');
    } else {
      console.log(`✅ 找到 ${usersSnapshot.size} 個使用者：`);
      console.log('');
      
      let index = 0;
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        console.log(`使用者 ${index + 1}:`);
        console.log(`  ID: ${doc.id}`);
        console.log(`  Email: ${userData.email || '未設定'}`);
        console.log(`  顯示名稱: ${userData.displayName || '未設定'}`);
        console.log(`  角色: ${userData.role || '未設定'}`);
        console.log(`  組織 ID: ${userData.organizationId || '未設定'}`);
        console.log(`  建立時間: ${userData.createdAt?.toDate?.()?.toLocaleString() || '未知'}`);
        console.log('');
        index++;
      });
    }

    // 檢查組織
    console.log('🏢 檢查 organizations 集合...');
    const orgsSnapshot = await getDocs(collection(db, 'organizations'));
    
    if (orgsSnapshot.empty) {
      console.log('❌ organizations 集合是空的');
    } else {
      console.log(`✅ 找到 ${orgsSnapshot.size} 個組織`);
    }

  } catch (error: any) {
    console.error('❌ 錯誤:', error.message);
    
    if (error.code === 'permission-denied') {
      console.log('\n⚠️  權限被拒絕。這可能是因為：');
      console.log('1. Firestore 規則限制了直接查詢');
      console.log('2. 需要使用 Service Account 進行查詢');
      console.log('\n建議：直接在 Firebase Console 查看使用者列表');
      console.log(`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/users`);
    }
  }

  process.exit(0);
}

// 執行檢查
checkProductionUsers();