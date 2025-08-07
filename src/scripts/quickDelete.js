/**
 * 快速刪除今天匯入的客戶資料
 * 使用方法：node src/scripts/quickDelete.js
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  writeBatch,
  doc,
  Timestamp
} = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const dotenv = require('dotenv');
const readline = require('readline');

// 載入環境變數
dotenv.config({ path: '.env.local' });
dotenv.config();

// Firebase 配置
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// 建立命令行介面
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

async function deleteCustomers() {
  try {
    // 登入
    console.log('=================================');
    console.log('   快速刪除客戶資料工具');
    console.log('=================================\n');
    
    const email = await question('請輸入您的 Email: ');
    const password = await question('請輸入您的密碼: ');
    
    console.log('\n🔐 登入中...');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log(`✅ 登入成功！用戶 ID: ${userCredential.user.uid}\n`);
    
    // 設定時間範圍（2025/8/7）
    const targetDate = new Date('2025-08-07');
    targetDate.setHours(0, 0, 0, 0);
    const targetTimestamp = Timestamp.fromDate(targetDate);
    
    // 設定結束時間（2025/8/8 凌晨）
    const endDate = new Date('2025-08-08');
    endDate.setHours(0, 0, 0, 0);
    const endTimestamp = Timestamp.fromDate(endDate);
    
    console.log(`📅 將刪除 2025/8/7 建立的客戶資料\n`);
    
    // 查詢 8/7 的客戶資料
    console.log('🔍 查詢客戶資料...');
    const q = query(
      collection(db, 'customers'),
      where('createdAt', '>=', targetTimestamp),
      where('createdAt', '<', endTimestamp)
    );
    
    const snapshot = await getDocs(q);
    console.log(`📊 找到 ${snapshot.size} 筆客戶資料\n`);
    
    if (snapshot.size === 0) {
      console.log('✅ 沒有需要刪除的資料');
      rl.close();
      process.exit(0);
    }
    
    // 顯示前 10 筆資料作為預覽
    console.log('📋 資料預覽（前 10 筆）：');
    const preview = snapshot.docs.slice(0, 10);
    preview.forEach((doc, index) => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate?.()?.toLocaleString('zh-TW') || 'N/A';
      console.log(`  ${index + 1}. ${data.name || '(無名稱)'} - 建立時間: ${createdAt}`);
    });
    
    if (snapshot.size > 10) {
      console.log(`  ... 還有 ${snapshot.size - 10} 筆資料\n`);
    } else {
      console.log('');
    }
    
    // 確認刪除
    console.log('⚠️  警告：此操作無法復原！');
    const confirm = await question(`確定要刪除這 ${snapshot.size} 筆客戶資料嗎？(yes/no): `);
    
    if (confirm.toLowerCase() !== 'yes') {
      console.log('\n❌ 已取消刪除操作');
      rl.close();
      process.exit(0);
    }
    
    // 執行批量刪除
    console.log('\n🗑️  開始刪除資料...');
    const batchSize = 500;
    let deletedCount = 0;
    let batch = writeBatch(db);
    let batchCount = 0;
    
    for (const docSnapshot of snapshot.docs) {
      batch.delete(doc(db, 'customers', docSnapshot.id));
      batchCount++;
      deletedCount++;
      
      // 每 500 筆提交一次
      if (batchCount === batchSize) {
        await batch.commit();
        console.log(`  已刪除 ${deletedCount}/${snapshot.size} 筆...`);
        batch = writeBatch(db);
        batchCount = 0;
      }
    }
    
    // 提交最後一批
    if (batchCount > 0) {
      await batch.commit();
    }
    
    console.log('\n=================================');
    console.log('     刪除完成');
    console.log('=================================');
    console.log(`✅ 成功刪除 ${deletedCount} 筆客戶資料`);
    console.log('\n您現在可以重新匯入資料了！');
    
  } catch (error) {
    console.error('\n❌ 發生錯誤:', error);
    if (error.code === 'auth/invalid-credential') {
      console.log('請確認您的帳號密碼是否正確');
    }
  } finally {
    rl.close();
    process.exit(0);
  }
}

// 執行刪除
deleteCustomers();