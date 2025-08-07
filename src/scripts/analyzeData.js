/**
 * 自動分析資料分布
 * 使用方法：FIREBASE_EMAIL=your@email.com FIREBASE_PASSWORD=yourpass node src/scripts/analyzeData.js
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  getDocs
} = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const dotenv = require('dotenv');
const readline = require('readline');

// 載入環境變數 - 優先使用 .env.local
dotenv.config({ path: '.env.local' });
// 如果 .env.local 沒有需要的變數，再載入 .env
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

async function analyzeData() {
  try {
    // 詢問帳號密碼
    console.log('請輸入您的 Firebase 帳號資訊：');
    const email = await question('Email: ');
    const password = await question('密碼: ');
    
    console.log('\n🔐 登入中...');
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const currentUserId = userCredential.user.uid;
    console.log('✅ 登入成功！');
    console.log('您的用戶 ID:', currentUserId);
    console.log('');
    
    console.log('=================================');
    console.log('    分析 CreatedBy 分布');
    console.log('=================================\n');
    
    const snapshot = await getDocs(collection(db, 'customers'));
    const createdByMap = new Map();
    const sampleData = new Map();
    let noCreatedByCount = 0;
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const createdBy = data.createdBy || 'NO_CREATED_BY';
      
      if (!data.createdBy) {
        noCreatedByCount++;
      }
      
      // 計數
      createdByMap.set(createdBy, (createdByMap.get(createdBy) || 0) + 1);
      
      // 收集樣本（每個 createdBy 最多 5 筆）
      if (!sampleData.has(createdBy)) {
        sampleData.set(createdBy, []);
      }
      const samples = sampleData.get(createdBy);
      if (samples.length < 5) {
        samples.push({
          id: doc.id,
          name: data.name,
          createdAt: data.createdAt?.toDate?.()?.toLocaleString('zh-TW') || 'N/A',
          organizationId: data.organizationId || 'N/A',
          teamId: data.teamId || 'N/A',
          assignedTo: data.assignedTo || 'N/A',
          customFields: data.customFields || {}
        });
      }
    });
    
    // 排序並顯示
    const sorted = Array.from(createdByMap.entries()).sort((a, b) => b[1] - a[1]);
    
    console.log('📊 統計結果：');
    console.log('─────────────────────────────────');
    console.log(`總資料數: ${snapshot.size} 筆`);
    console.log(`沒有 createdBy 的資料: ${noCreatedByCount} 筆`);
    console.log(`不同的 createdBy 值: ${createdByMap.size} 個`);
    console.log('─────────────────────────────────\n');
    
    console.log('📋 詳細分布：\n');
    sorted.forEach(([userId, count], index) => {
      console.log(`${index + 1}. 用戶 ID: ${userId}`);
      console.log(`   數量: ${count} 筆 (${((count/snapshot.size)*100).toFixed(2)}%)`);
      
      if (userId === currentUserId) {
        console.log('   ⭐ 這是您的帳號');
      }
      
      // 顯示樣本資料
      const samples = sampleData.get(userId) || [];
      if (samples.length > 0) {
        console.log('   樣本資料:');
        samples.forEach((sample, idx) => {
          console.log(`     ${idx + 1}. ${sample.name || '(無名稱)'}`);
          console.log(`        建立時間: ${sample.createdAt}`);
          console.log(`        組織 ID: ${sample.organizationId}`);
          
          // 顯示重要的自訂欄位
          const importantFields = ['responsible', 'salesRep', 'responsible_sales', '負責業務'];
          importantFields.forEach(field => {
            if (sample.customFields[field]) {
              console.log(`        ${field}: ${sample.customFields[field]}`);
            }
          });
        });
      }
      console.log('');
    });
    
    // 分析可能的問題
    console.log('🔍 問題分析：');
    console.log('─────────────────────────────────');
    
    if (noCreatedByCount > 0) {
      console.log(`⚠️  有 ${noCreatedByCount} 筆資料沒有 createdBy 欄位`);
    }
    
    const yourDataCount = createdByMap.get(currentUserId) || 0;
    if (yourDataCount === 110) {
      console.log(`✅ 您的帳號確實有 110 筆資料`);
    } else {
      console.log(`❓ 您的帳號有 ${yourDataCount} 筆資料（不是 110 筆）`);
    }
    
    if (createdByMap.size === 1 && createdByMap.has(currentUserId)) {
      console.log('📌 所有資料都是用您的帳號建立的');
    } else if (createdByMap.size > 1) {
      console.log(`📌 資料分散在 ${createdByMap.size} 個不同的用戶 ID`);
    }
    
  } catch (error) {
    console.error('❌ 發生錯誤:', error);
    if (error.code === 'auth/invalid-credentials') {
      console.log('\n請確認您的帳號密碼是否正確');
      console.log('或使用環境變數設定：');
      console.log('FIREBASE_EMAIL=your@email.com FIREBASE_PASSWORD=yourpass node src/scripts/analyzeData.js');
    }
  }
  
  rl.close();
  process.exit(0);
}

// 執行分析
analyzeData();