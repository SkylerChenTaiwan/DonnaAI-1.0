/**
 * App Store 審核測試帳號準備腳本
 * 建立測試帳號並預載範例資料
 */

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  updateProfile 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  collection, 
  addDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

// 使用生產環境配置
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

// 測試帳號資訊
const REVIEW_ACCOUNT = {
  email: 'reviewer@donnaai.app',
  password: 'ReviewTest2025!',
  displayName: 'Apple Reviewer'
};

async function createReviewAccount() {
  console.log('🚀 開始準備 App Store 審核測試帳號...');
  
  // 初始化 Firebase
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  
  try {
    // 1. 建立測試帳號
    console.log('📧 建立測試帳號...');
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      REVIEW_ACCOUNT.email,
      REVIEW_ACCOUNT.password
    );
    
    const user = userCredential.user;
    
    // 更新顯示名稱
    await updateProfile(user, {
      displayName: REVIEW_ACCOUNT.displayName
    });
    
    console.log('✅ 測試帳號建立成功:', user.uid);
    
    // 2. 建立用戶資料
    console.log('👤 建立用戶資料...');
    await setDoc(doc(db, 'users', user.uid), {
      email: REVIEW_ACCOUNT.email,
      displayName: REVIEW_ACCOUNT.displayName,
      role: 'user',
      organizationId: `org_${user.uid}`,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: true,
      settings: {
        notifications: true,
        soundEffects: true,
        theme: 'light'
      }
    });
    
    // 3. 建立組織資料
    console.log('🏢 建立組織資料...');
    await setDoc(doc(db, 'organizations', `org_${user.uid}`), {
      name: 'Apple Review Organization',
      adminUserId: user.uid,
      subscription: 'premium',
      maxUsers: 10,
      currentUsers: 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: true
    });
    
    // 4. 建立範例客戶資料
    console.log('👥 建立範例客戶...');
    const customers = [
      {
        name: '王小明',
        company: '台灣科技股份有限公司',
        email: 'wang@taiwan-tech.com',
        phone: '0912-345-678',
        industry: '科技業',
        address: '台北市信義區信義路五段7號',
        tags: ['重要客戶', 'AI專案'],
        notes: '對 AI 解決方案有高度興趣，預計下季導入',
        lastContactDate: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000))
      },
      {
        name: '李美華',
        company: '創新金融科技有限公司',
        email: 'lee@fintech-innovation.com',
        phone: '0923-456-789',
        industry: '金融業',
        address: '台北市內湖區瑞光路100號',
        tags: ['潛在客戶', '金融科技'],
        notes: '正在評估數位轉型方案',
        lastContactDate: Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000))
      },
      {
        name: '張志豪',
        company: '綠能環保股份有限公司',
        email: 'chang@green-energy.com.tw',
        phone: '0934-567-890',
        industry: '能源業',
        address: '新竹縣竹北市高鐵七路65號',
        tags: ['合作夥伴', 'ESG'],
        notes: '長期合作夥伴，注重永續發展',
        lastContactDate: Timestamp.fromDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000))
      },
      {
        name: '陳雅婷',
        company: '智慧零售集團',
        email: 'chen@smart-retail.com',
        phone: '0945-678-901',
        industry: '零售業',
        address: '台中市西屯區市政北路66號',
        tags: ['VIP', '數位轉型'],
        notes: '全台最大零售集團，積極推動數位化',
        lastContactDate: Timestamp.fromDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000))
      },
      {
        name: '林俊傑',
        company: '創意設計工作室',
        email: 'lin@creative-studio.tw',
        phone: '0956-789-012',
        industry: '設計業',
        address: '台北市大安區敦化南路二段200號',
        tags: ['新客戶', '創意產業'],
        notes: '新創公司，需要效率工具',
        lastContactDate: Timestamp.fromDate(new Date())
      }
    ];
    
    for (const customer of customers) {
      await addDoc(collection(db, 'customers'), {
        ...customer,
        userId: user.uid,
        organizationId: `org_${user.uid}`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    console.log(`✅ 建立了 ${customers.length} 個範例客戶`);
    
    // 5. 建立範例會議記錄
    console.log('📝 建立範例會議記錄...');
    const records = [
      {
        title: '台灣科技 - AI 解決方案討論',
        content: '## 會議重點\n\n1. 討論 AI 導入可行性\n2. 預算規劃：約 500 萬\n3. 時程：Q2 開始導入\n\n## 行動項目\n- 準備詳細提案\n- 安排技術演示\n- 提供參考案例',
        customerId: '由實際客戶 ID 替換',
        type: 'meeting',
        tags: ['AI專案', '重要會議'],
        audioRecordingState: {
          duration: 1800,
          fileSize: 3600000,
          status: 'completed'
        },
        aiAnalysis: {
          summary: '客戶對 AI 解決方案展現高度興趣，預算充足，需要在下次會議前準備詳細提案。',
          keyPoints: ['預算 500 萬', 'Q2 導入', '需要技術演示'],
          actionItems: ['準備提案', '安排演示', '提供案例'],
          sentiment: 'positive'
        }
      },
      {
        title: '創新金融科技 - 初次拜訪',
        content: '## 客戶需求\n\n- 數位轉型諮詢\n- 流程自動化\n- 資料分析平台\n\n## 下一步\n\n安排產品演示',
        customerId: '由實際客戶 ID 替換',
        type: 'meeting',
        tags: ['潛在客戶', '金融科技'],
        audioRecordingState: {
          duration: 2400,
          fileSize: 4800000,
          status: 'completed'
        }
      },
      {
        title: '綠能環保 - 季度檢討會議',
        content: '## 合作成果\n\n- 系統使用率提升 40%\n- 效率改善明顯\n- 團隊滿意度高\n\n## 未來規劃\n\n考慮擴大導入範圍',
        customerId: '由實際客戶 ID 替換',
        type: 'review',
        tags: ['合作夥伴', '成功案例']
      }
    ];
    
    for (const record of records) {
      await addDoc(collection(db, 'records'), {
        ...record,
        userId: user.uid,
        organizationId: `org_${user.uid}`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    console.log(`✅ 建立了 ${records.length} 個範例會議記錄`);
    
    // 6. 建立範例任務
    console.log('✅ 建立範例任務...');
    const tasks = [
      {
        title: '準備台灣科技 AI 提案',
        description: '包含技術架構、預算規劃、時程安排',
        customerId: '由實際客戶 ID 替換',
        dueDate: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
        priority: 'high',
        status: 'pending',
        type: 'proposal'
      },
      {
        title: '安排金融科技產品演示',
        description: '展示自動化流程和資料分析功能',
        customerId: '由實際客戶 ID 替換',
        dueDate: Timestamp.fromDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)),
        priority: 'medium',
        status: 'pending',
        type: 'demo'
      },
      {
        title: '發送綠能環保合作報告',
        description: '整理季度成果和未來建議',
        customerId: '由實際客戶 ID 替換',
        dueDate: Timestamp.fromDate(new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)),
        priority: 'high',
        status: 'completed',
        type: 'report'
      }
    ];
    
    for (const task of tasks) {
      await addDoc(collection(db, 'tasks'), {
        ...task,
        userId: user.uid,
        organizationId: `org_${user.uid}`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    console.log(`✅ 建立了 ${tasks.length} 個範例任務`);
    
    // 7. 建立 AI 分析報告
    console.log('📊 建立 AI 分析報告...');
    const analysisReports = [
      {
        title: '本月業務表現分析',
        type: 'monthly_performance',
        data: {
          totalMeetings: 15,
          newCustomers: 5,
          conversionRate: 0.33,
          topIndustries: ['科技業', '金融業', '零售業']
        },
        insights: [
          '本月新客戶開發表現優異',
          '科技業客戶佔比最高',
          '建議加強金融業開發'
        ],
        chartData: {
          type: 'pie',
          data: [
            { label: '科技業', value: 40 },
            { label: '金融業', value: 30 },
            { label: '零售業', value: 20 },
            { label: '其他', value: 10 }
          ]
        }
      },
      {
        title: '客戶互動趨勢分析',
        type: 'interaction_trend',
        data: {
          weeklyTrend: [12, 15, 18, 14, 20, 22, 25],
          averageResponseTime: 2.5,
          satisfactionScore: 4.5
        },
        insights: [
          '客戶互動頻率持續上升',
          '回應時間維持在理想範圍',
          '客戶滿意度保持高水準'
        ]
      }
    ];
    
    for (const report of analysisReports) {
      await addDoc(collection(db, 'analysisReports'), {
        ...report,
        userId: user.uid,
        organizationId: `org_${user.uid}`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    console.log(`✅ 建立了 ${analysisReports.length} 個 AI 分析報告`);
    
    console.log('\n🎉 測試帳號準備完成！');
    console.log('====================');
    console.log('帳號：', REVIEW_ACCOUNT.email);
    console.log('密碼：', REVIEW_ACCOUNT.password);
    console.log('====================');
    console.log('\n包含的測試資料：');
    console.log('- 5 個範例客戶');
    console.log('- 3 個會議記錄');
    console.log('- 3 個任務');
    console.log('- 2 個 AI 分析報告');
    
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('⚠️ 測試帳號已存在，跳過建立');
    } else {
      console.error('❌ 錯誤:', error);
    }
  }
}

// 執行腳本
if (require.main === module) {
  createReviewAccount()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('腳本執行失敗:', error);
      process.exit(1);
    });
}

export { createReviewAccount };