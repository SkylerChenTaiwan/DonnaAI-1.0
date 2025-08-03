/**
 * Firebase 使用量檢查腳本
 * 用於快速查看 Firebase 各項服務的使用狀況
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getCountFromServer,
  doc,
  getDoc
} from 'firebase/firestore';
import { getStorage, ref, listAll } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

// Firebase 配置
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyAxEU8MuVZdZqXd6dDpBYL6Iu-TRD3vblI",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "donnaai-5e601.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "donnaai-5e601",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "donnaai-5e601.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "748876929238",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:748876929238:web:fbbe5fd030a68765ea9177"
};

async function checkFirebaseUsage() {
  console.log('🔍 檢查 Firebase 使用狀況...\n');
  
  // 初始化 Firebase
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const storage = getStorage(app);
  const auth = getAuth(app);

  console.log(`📌 專案 ID: ${firebaseConfig.projectId}`);
  console.log(`📌 專案網址: https://console.firebase.google.com/project/${firebaseConfig.projectId}\n`);

  try {
    // 檢查 Firestore 集合大小
    console.log('📊 Firestore 資料統計：');
    const collections = [
      'users', 'organizations', 'customers', 'tasks', 'records',
      'communications', 'templates', 'notes', 'reminders', 'reports'
    ];

    let totalDocuments = 0;
    for (const collectionName of collections) {
      try {
        const snapshot = await getCountFromServer(collection(db, collectionName));
        const count = snapshot.data().count;
        totalDocuments += count;
        console.log(`   - ${collectionName}: ${count} 個文件`);
      } catch (error) {
        console.log(`   - ${collectionName}: 無法存取或不存在`);
      }
    }
    console.log(`   📄 總文件數: ${totalDocuments}\n`);

    // 檢查 Storage 使用量（只能列出檔案，無法直接取得大小）
    console.log('💾 Storage 使用狀況：');
    try {
      const audioRef = ref(storage, 'audio-files');
      const audioList = await listAll(audioRef);
      console.log(`   - 音訊檔案數量: ${audioList.items.length}`);
      
      const tempRef = ref(storage, 'temp');
      const tempList = await listAll(tempRef);
      console.log(`   - 暫存檔案數量: ${tempList.items.length}`);
      
      if (tempList.items.length > 0) {
        console.log('   ⚠️  建議清理暫存檔案以節省成本');
      }
    } catch (error) {
      console.log('   無法存取 Storage 或沒有檔案');
    }

    // 成本優化建議
    console.log('\n💡 成本優化建議：');
    console.log('1. 🔴 Functions - 檢查 Cloud Console 中的執行次數和持續時間');
    console.log('2. 🟡 Firestore - 目前有 ' + totalDocuments + ' 個文件，注意讀寫頻率');
    console.log('3. 🟡 Storage - 定期清理暫存檔案和舊音訊');
    console.log('4. 🟢 Authentication - 低成本服務');
    console.log('5. 🟢 Hosting - 低成本服務\n');

    // 提供有用的連結
    console.log('🔗 相關連結：');
    console.log(`- Firebase Console: https://console.firebase.google.com/project/${firebaseConfig.projectId}`);
    console.log(`- GCP 計費: https://console.cloud.google.com/billing`);
    console.log(`- Firebase 使用量: https://console.firebase.google.com/project/${firebaseConfig.projectId}/usage`);
    console.log(`- Functions 日誌: https://console.cloud.google.com/functions/list?project=${firebaseConfig.projectId}`);

  } catch (error) {
    console.error('❌ 檢查過程中發生錯誤:', error);
    console.log('\n可能原因：');
    console.log('1. 需要先登入 Firebase');
    console.log('2. 權限不足');
    console.log('3. 網路連線問題');
  }
}

// 執行檢查
checkFirebaseUsage().then(() => {
  console.log('\n✅ 檢查完成！');
  process.exit(0);
}).catch((error) => {
  console.error('❌ 執行失敗:', error);
  process.exit(1);
});