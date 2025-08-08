/**
 * 檢查 Firestore 中匯入的使用者資料
 * 驗證用戶的組織 ID 和必要欄位是否正確設定
 */

const admin = require('firebase-admin');
const path = require('path');

// 初始化 Firebase Admin
const serviceAccount = require(path.join(__dirname, '../serviceAccountKey.json.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// 必要欄位定義
const REQUIRED_FIELDS = [
  'email',
  'name', 
  'role',
  'organizationId',
  'createdAt'
];

// 可選但重要的欄位
const IMPORTANT_FIELDS = [
  'teamIds',
  'department',
  'jobTitle',
  'phoneNumber',
  'isActive'
];

// 有效的角色列表
const VALID_ROLES = ['salesperson', 'manager', 'admin', 'super_admin', 'system-admin'];

/**
 * 主要檢查函數
 */
async function checkImportedUsers() {
  console.log('🔍 開始檢查 Firestore 中的使用者資料...\n');
  
  try {
    // 1. 取得所有使用者
    console.log('📋 正在讀取 users 集合...');
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('❌ users 集合是空的，沒有找到任何使用者');
      return;
    }

    const totalUsers = usersSnapshot.size;
    console.log(`✅ 找到 ${totalUsers} 個使用者文件\n`);

    // 2. 取得所有組織以供驗證
    console.log('🏢 正在讀取 organizations 集合...');
    const organizationsSnapshot = await db.collection('organizations').get();
    const validOrgIds = new Set();
    
    if (!organizationsSnapshot.empty) {
      organizationsSnapshot.forEach(doc => {
        validOrgIds.add(doc.id);
      });
      console.log(`✅ 找到 ${validOrgIds.size} 個有效組織`);
    } else {
      console.log('⚠️  沒有找到任何組織文件');
    }

    // 3. 分析使用者資料
    console.log('\n📊 使用者資料分析:\n');
    console.log('=' .repeat(80));
    
    let validUsers = 0;
    let usersWithIssues = 0;
    const issuesSummary = {
      missingRequiredFields: [],
      invalidOrganizationId: [],
      invalidRole: [],
      missingImportantFields: []
    };

    let userIndex = 0;
    usersSnapshot.forEach((doc) => {
      userIndex++;
      const userData = doc.data();
      const userId = doc.id;
      
      // 簡化顯示 - 只顯示進度
      if (userIndex % 10 === 0 || userIndex === 1) {
        console.log(`正在檢查使用者 ${userIndex}/${totalUsers}...`);
      }

      // 驗證必要欄位
      let hasAllRequired = true;
      const missingFields = [];
      
      for (const field of REQUIRED_FIELDS) {
        if (!userData[field]) {
          hasAllRequired = false;
          missingFields.push(field);
        }
      }

      // 驗證組織 ID
      let validOrgId = true;
      if (userData.organizationId && !validOrgIds.has(userData.organizationId)) {
        validOrgId = false;
      }

      // 驗證角色
      let validRole = true;
      if (userData.role && !VALID_ROLES.includes(userData.role)) {
        validRole = false;
      }

      // 計算問題
      const userIssues = [];
      if (!hasAllRequired) {
        userIssues.push(`缺少必要欄位: ${missingFields.join(', ')}`);
        issuesSummary.missingRequiredFields.push({userId, email: userData.email, missingFields});
      }
      if (!validOrgId) {
        userIssues.push('組織 ID 無效或不存在');
        issuesSummary.invalidOrganizationId.push({userId, email: userData.email, orgId: userData.organizationId});
      }
      if (!validRole) {
        userIssues.push(`角色無效: ${userData.role}`);
        issuesSummary.invalidRole.push({userId, email: userData.email, role: userData.role});
      }

      // 檢查重要但非必要欄位
      const missingImportant = [];
      for (const field of IMPORTANT_FIELDS) {
        if (!userData[field]) {
          missingImportant.push(field);
        }
      }
      if (missingImportant.length > 0) {
        issuesSummary.missingImportantFields.push({userId, email: userData.email, missingImportant});
      }

      // 計算狀態
      if (userIssues.length === 0) {
        validUsers++;
      } else {
        usersWithIssues++;
      }
    });

    // 4. 顯示總結
    console.log('\n' + '='.repeat(80));
    console.log('📈 檢查總結:');
    console.log('='.repeat(80));
    console.log(`總使用者數量: ${totalUsers}`);
    console.log(`✅ 完全有效的使用者: ${validUsers}`);
    console.log(`❌ 有問題的使用者: ${usersWithIssues}`);
    console.log(`📊 有效率: ${((validUsers / totalUsers) * 100).toFixed(1)}%`);

    // 5. 詳細問題分析
    if (usersWithIssues > 0) {
      console.log('\n🔍 問題詳細分析:');
      console.log('-'.repeat(50));
      
      if (issuesSummary.missingRequiredFields.length > 0) {
        console.log(`\n❌ 缺少必要欄位的使用者 (${issuesSummary.missingRequiredFields.length} 個):`);
        issuesSummary.missingRequiredFields.forEach(issue => {
          console.log(`  - ${issue.email || issue.userId}: 缺少 [${issue.missingFields.join(', ')}]`);
        });
      }

      if (issuesSummary.invalidOrganizationId.length > 0) {
        console.log(`\n🏢 組織 ID 無效的使用者 (${issuesSummary.invalidOrganizationId.length} 個):`);
        issuesSummary.invalidOrganizationId.forEach(issue => {
          console.log(`  - ${issue.email || issue.userId}: 組織 ID "${issue.orgId}"`);
        });
      }

      if (issuesSummary.invalidRole.length > 0) {
        console.log(`\n🎭 角色無效的使用者 (${issuesSummary.invalidRole.length} 個):`);
        issuesSummary.invalidRole.forEach(issue => {
          console.log(`  - ${issue.email || issue.userId}: 角色 "${issue.role}"`);
        });
      }

      if (issuesSummary.missingImportantFields.length > 0) {
        console.log(`\n⚠️  缺少重要欄位的使用者 (${issuesSummary.missingImportantFields.length} 個):`);
        issuesSummary.missingImportantFields.forEach(issue => {
          console.log(`  - ${issue.email || issue.userId}: 缺少 [${issue.missingImportant.join(', ')}]`);
        });
      }
    }

    // 6. 組織分布統計
    console.log('\n🏢 使用者組織分布:');
    console.log('-'.repeat(50));
    const orgDistribution = {};
    usersSnapshot.forEach(doc => {
      const orgId = doc.data().organizationId || '未設定';
      orgDistribution[orgId] = (orgDistribution[orgId] || 0) + 1;
    });

    for (const [orgId, count] of Object.entries(orgDistribution)) {
      const isValid = validOrgIds.has(orgId) ? '✅' : (orgId === '未設定' ? '❌' : '⚠️');
      console.log(`  ${isValid} ${orgId}: ${count} 個使用者`);
    }

    // 7. 角色分布統計
    console.log('\n🎭 使用者角色分布:');
    console.log('-'.repeat(50));
    const roleDistribution = {};
    usersSnapshot.forEach(doc => {
      const role = doc.data().role || '未設定';
      roleDistribution[role] = (roleDistribution[role] || 0) + 1;
    });

    for (const [role, count] of Object.entries(roleDistribution)) {
      const isValid = VALID_ROLES.includes(role) ? '✅' : '❌';
      console.log(`  ${isValid} ${role}: ${count} 個使用者`);
    }

    // 8. 建議修復動作
    if (usersWithIssues > 0) {
      console.log('\n💡 建議修復動作:');
      console.log('-'.repeat(50));
      
      if (issuesSummary.missingRequiredFields.length > 0) {
        console.log('1. 補充缺少的必要欄位（email, name, role, organizationId）');
      }
      
      if (issuesSummary.invalidOrganizationId.length > 0) {
        console.log('2. 修正或建立對應的組織文件');
      }
      
      if (issuesSummary.invalidRole.length > 0) {
        console.log('3. 將角色修正為有效值：' + VALID_ROLES.join(', '));
      }
      
      if (issuesSummary.missingImportantFields.length > 0) {
        console.log('4. 考慮補充重要欄位以提升使用體驗');
      }
    }

  } catch (error) {
    console.error('❌ 檢查過程中發生錯誤:', error.message);
    console.error('完整錯誤:', error);
  }
}

// 執行檢查
checkImportedUsers().then(() => {
  console.log('\n✅ 檢查完成');
  process.exit(0);
}).catch(err => {
  console.error('❌ 執行錯誤:', err);
  process.exit(1);
});