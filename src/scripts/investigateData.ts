/**
 * 調查資料庫中的資料
 * 使用方法：npx ts-node src/scripts/investigateData.ts
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit
} = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const dotenv = require('dotenv');
const readline = require('readline');

// 載入環境變數
dotenv.config();

// Firebase 配置
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID };

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

/**
 * 分析 createdBy 分布
 */
async function analyzeCreatedByDistribution() {
  console.log('\n=== 分析 createdBy 分布 ===\n');
  
  const snapshot = await getDocs(collection(db, 'customers'));
  const createdByMap = new Map<string, number>();
  const sampleData = new Map<string, any[]>();
  
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    const createdBy = data.createdBy || 'UNKNOWN';
    
    // 計數
    createdByMap.set(createdBy, (createdByMap.get(createdBy) || 0) + 1);
    
    // 收集樣本（每個 createdBy 最多 3 筆）
    if (!sampleData.has(createdBy)) {
      sampleData.set(createdBy, []);
    }
    const samples = sampleData.get(createdBy)!;
    if (samples.length < 3) {
      samples.push({
        id: doc.id,
        name: data.name,
        createdAt: data.createdAt?.toDate?.()?.toLocaleString() || 'N/A',
        organizationId: data.organizationId || 'N/A',
        teamId: data.teamId || 'N/A',
        assignedTo: data.assignedTo || 'N/A'
      });
    }
  });
  
  // 排序並顯示
  const sorted = Array.from(createdByMap.entries()).sort((a, b) => b[1] - a[1]);
  
  console.log('📊 CreatedBy 分布統計：\n');
  sorted.forEach(([userId, count]) => {
    console.log(`用戶 ID: ${userId}`);
    console.log(`  數量: ${count} 筆`);
    
    // 顯示樣本資料
    const samples = sampleData.get(userId) || [];
    if (samples.length > 0) {
      console.log('  樣本資料:');
      samples.forEach((sample, index) => {
        console.log(`    ${index + 1}. ${sample.name}`);
        console.log(`       ID: ${sample.id}`);
        console.log(`       建立時間: ${sample.createdAt}`);
        console.log(`       組織: ${sample.organizationId}`);
        console.log(`       團隊: ${sample.teamId}`);
        console.log(`       負責人: ${sample.assignedTo}`);
      });
    }
    console.log('');
  });
  
  console.log(`總計: ${snapshot.size} 筆客戶資料\n`);
}

/**
 * 查看特定用戶的資料
 */
async function investigateUserData(userId: string) {
  console.log(`\n=== 調查用戶 ${userId} 的資料 ===\n`);
  
  // 查詢該用戶建立的客戶
  const customersQuery = query(
    collection(db, 'customers'),
    where('createdBy', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(10)
  );
  
  const customersSnapshot = await getDocs(customersQuery);
  console.log(`📊 找到 ${customersSnapshot.size} 筆客戶資料（顯示最近 10 筆）：\n`);
  
  customersSnapshot.docs.forEach((doc, index) => {
    const data = doc.data();
    console.log(`${index + 1}. ${data.name || 'N/A'}`);
    console.log(`   ID: ${doc.id}`);
    console.log(`   公司: ${data.company || 'N/A'}`);
    console.log(`   電話: ${data.phone || 'N/A'}`);
    console.log(`   Email: ${data.email || 'N/A'}`);
    console.log(`   建立時間: ${data.createdAt?.toDate?.()?.toLocaleString() || 'N/A'}`);
    console.log(`   組織 ID: ${data.organizationId || 'N/A'}`);
    console.log(`   團隊 ID: ${data.teamId || 'N/A'}`);
    console.log(`   負責人: ${data.assignedTo || 'N/A'}`);
    
    // 顯示自訂欄位
    if (data.customFields) {
      console.log('   自訂欄位:');
      Object.entries(data.customFields).forEach(([key, value]) => {
        console.log(`     ${key}: ${value}`);
      });
    }
    console.log('');
  });
}

/**
 * 分析匯入時間分布
 */
async function analyzeImportTiming() {
  console.log('\n=== 分析匯入時間分布 ===\n');
  
  const snapshot = await getDocs(collection(db, 'customers'));
  const timeMap = new Map<string, number>();
  
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    const createdAt = data.createdAt?.toDate?.();
    if (createdAt) {
      // 按小時分組
      const hourKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}-${String(createdAt.getDate()).padStart(2, '0')} ${String(createdAt.getHours()).padStart(2, '0')}:00`;
      timeMap.set(hourKey, (timeMap.get(hourKey) || 0) + 1);
    }
  });
  
  // 排序並顯示
  const sorted = Array.from(timeMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  
  console.log('📊 按小時統計匯入數量：\n');
  sorted.forEach(([time, count]) => {
    console.log(`${time} - ${count} 筆`);
  });
  
  console.log(`\n總計: ${snapshot.size} 筆客戶資料\n`);
}

/**
 * 主程式
 */
async function main() {
  console.log('=================================');
  console.log('     資料庫調查工具');
  console.log('=================================\n');
  
  try {
    // 登入
    const email = await question('請輸入您的 Email: ');
    const password = await question('請輸入您的密碼: ');
    
    console.log('\n🔐 登入中...');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const currentUserId = userCredential.user.uid;
    console.log(`✅ 登入成功！`);
    console.log(`您的用戶 ID: ${currentUserId}`);
    
    let running = true;
    while (running) {
      console.log('\n=== 選擇調查項目 ===');
      console.log('1. 分析 createdBy 分布');
      console.log('2. 查看我的資料（您建立的）');
      console.log('3. 查看特定用戶的資料');
      console.log('4. 分析匯入時間分布');
      console.log('5. 離開');
      
      const choice = await question('\n請選擇 (1-5): ');
      
      switch (choice) {
        case '1':
          await analyzeCreatedByDistribution();
          break;
          
        case '2':
          await investigateUserData(currentUserId);
          break;
          
        case '3':
          const userId = await question('請輸入要調查的用戶 ID: ');
          await investigateUserData(userId);
          break;
          
        case '4':
          await analyzeImportTiming();
          break;
          
        case '5':
          running = false;
          break;
          
        default:
          console.log('❌ 無效的選擇');
      }
    }
    
  } catch (error) {
    console.error('❌ 發生錯誤:', error);
  } finally {
    rl.close();
    process.exit(0);
  }
}

// 執行主程式
main();