/**
 * 批量刪除匯入的資料
 * 使用方法：npx ts-node src/scripts/deleteImportedData.ts
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  writeBatch,
  doc,
  Timestamp
} from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import * as dotenv from 'dotenv';
import * as readline from 'readline';

// 載入環境變數
dotenv.config();

// Firebase 配置
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
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

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

/**
 * 刪除特定時間後的資料
 */
async function deleteDataAfterTime(
  collectionName: string,
  afterTime: Date,
  organizationId?: string
) {
  console.log(`\n📊 準備刪除 ${collectionName} 中的資料...`);
  
  try {
    let q = query(collection(db, collectionName));
    
    // 加入時間過濾
    q = query(q, where('createdAt', '>=', Timestamp.fromDate(afterTime)));
    
    // 如果提供組織 ID，加入組織過濾
    if (organizationId) {
      q = query(q, where('organizationId', '==', organizationId));
    }
    
    const snapshot = await getDocs(q);
    console.log(`🔍 找到 ${snapshot.size} 筆資料`);
    
    if (snapshot.size === 0) {
      console.log('✅ 沒有需要刪除的資料');
      return 0;
    }
    
    // 批量刪除（每批最多 500 筆）
    const batchSize = 500;
    let deletedCount = 0;
    let batch = writeBatch(db);
    let batchCount = 0;
    
    for (const docSnapshot of snapshot.docs) {
      batch.delete(doc(db, collectionName, docSnapshot.id));
      batchCount++;
      deletedCount++;
      
      if (batchCount === batchSize) {
        await batch.commit();
        console.log(`🗑️ 已刪除 ${deletedCount} 筆...`);
        batch = writeBatch(db);
        batchCount = 0;
      }
    }
    
    // 提交最後一批
    if (batchCount > 0) {
      await batch.commit();
    }
    
    console.log(`✅ 成功刪除 ${deletedCount} 筆 ${collectionName} 資料`);
    return deletedCount;
    
  } catch (error) {
    console.error(`❌ 刪除 ${collectionName} 時發生錯誤:`, error);
    return 0;
  }
}

/**
 * 查看資料統計
 */
async function showDataStats(
  collectionName: string,
  afterTime: Date,
  organizationId?: string
) {
  console.log(`\n📊 ${collectionName} 資料統計：`);
  
  try {
    // 查詢總數
    const totalSnapshot = await getDocs(collection(db, collectionName));
    console.log(`  總數：${totalSnapshot.size} 筆`);
    
    // 查詢指定時間後的資料
    let q = query(
      collection(db, collectionName),
      where('createdAt', '>=', Timestamp.fromDate(afterTime))
    );
    
    if (organizationId) {
      q = query(q, where('organizationId', '==', organizationId));
    }
    
    const recentSnapshot = await getDocs(q);
    console.log(`  ${afterTime.toLocaleString()} 後：${recentSnapshot.size} 筆`);
    
    // 顯示前 5 筆資料的詳細資訊
    if (recentSnapshot.size > 0) {
      console.log('\n  最近 5 筆資料：');
      const docs = recentSnapshot.docs.slice(0, 5);
      docs.forEach((doc, index) => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate?.()?.toLocaleString() || 'N/A';
        const name = data.name || data.title || 'N/A';
        const createdBy = data.createdBy || 'N/A';
        console.log(`    ${index + 1}. ${name} (建立者: ${createdBy}, 時間: ${createdAt})`);
      });
    }
    
  } catch (error) {
    console.error(`❌ 查詢 ${collectionName} 統計時發生錯誤:`, error);
  }
}

/**
 * 主程式
 */
async function main() {
  console.log('=================================');
  console.log('   批量刪除匯入資料工具');
  console.log('=================================\n');
  
  try {
    // 登入
    const email = await question('請輸入您的 Email: ');
    const password = await question('請輸入您的密碼: ');
    
    console.log('\n🔐 登入中...');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log(`✅ 登入成功！用戶 ID: ${userCredential.user.uid}`);
    
    // 詢問組織 ID（選填）
    const organizationId = await question('\n請輸入組織 ID (選填，直接按 Enter 跳過): ');
    
    // 詢問時間範圍
    console.log('\n請選擇刪除範圍：');
    console.log('1. 刪除今天的資料');
    console.log('2. 刪除最近 1 小時的資料');
    console.log('3. 刪除最近 24 小時的資料');
    console.log('4. 自訂時間');
    
    const choice = await question('請選擇 (1-4): ');
    
    let afterTime: Date;
    const now = new Date();
    
    switch (choice) {
      case '1':
        afterTime = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case '2':
        afterTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '3':
        afterTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '4':
        const dateStr = await question('請輸入日期時間 (YYYY-MM-DD HH:mm): ');
        afterTime = new Date(dateStr);
        break;
      default:
        console.log('❌ 無效的選擇');
        process.exit(1);
    }
    
    console.log(`\n⏰ 將刪除 ${afterTime.toLocaleString()} 之後的資料`);
    
    // 顯示資料統計
    console.log('\n=== 資料統計 ===');
    await showDataStats('customers', afterTime, organizationId || undefined);
    await showDataStats('records', afterTime, organizationId || undefined);
    await showDataStats('tasks', afterTime, organizationId || undefined);
    
    // 確認刪除
    const confirm = await question('\n⚠️  確定要刪除這些資料嗎？(yes/no): ');
    
    if (confirm.toLowerCase() !== 'yes') {
      console.log('❌ 已取消刪除操作');
      process.exit(0);
    }
    
    // 執行刪除
    console.log('\n=== 開始刪除資料 ===');
    const customersDeleted = await deleteDataAfterTime('customers', afterTime, organizationId || undefined);
    const recordsDeleted = await deleteDataAfterTime('records', afterTime, organizationId || undefined);
    const tasksDeleted = await deleteDataAfterTime('tasks', afterTime, organizationId || undefined);
    
    // 顯示結果
    console.log('\n=== 刪除完成 ===');
    console.log(`客戶資料：${customersDeleted} 筆`);
    console.log(`訪談記錄：${recordsDeleted} 筆`);
    console.log(`任務資料：${tasksDeleted} 筆`);
    console.log(`總計：${customersDeleted + recordsDeleted + tasksDeleted} 筆`);
    
  } catch (error) {
    console.error('❌ 發生錯誤:', error);
  } finally {
    rl.close();
    process.exit(0);
  }
}

// 執行主程式
main();