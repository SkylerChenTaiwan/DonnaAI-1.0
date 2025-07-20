/**
 * 調試客戶資料問題
 */

import { initializeFirebase } from './utils/firebase';

async function debugCustomers() {
  const db = initializeFirebase();
  
  // 統計所有客戶
  const allCustomers = await db.collection('customers').get();
  console.log('\n📊 客戶資料統計:');
  console.log('總數:', allCustomers.size);
  
  let withTeamId = 0;
  let withoutTeamId = 0;
  const byTeam: Record<string, number> = {};
  
  allCustomers.forEach(doc => {
    const data = doc.data();
    if (data.teamId) {
      withTeamId++;
      byTeam[data.teamId] = (byTeam[data.teamId] || 0) + 1;
    } else {
      withoutTeamId++;
    }
  });
  
  console.log('\n有 teamId 的客戶:', withTeamId);
  console.log('沒有 teamId 的客戶:', withoutTeamId);
  console.log('\n按團隊分組:');
  Object.entries(byTeam).forEach(([teamId, count]) => {
    console.log(`- ${teamId}: ${count} 個客戶`);
  });
  
  // 檢查特定團隊的客戶
  const teamCustomers = await db.collection('customers')
    .where('teamId', '==', 'team_1753014959300')
    .get();
    
  console.log('\n團隊 team_1753014959300 的客戶數:', teamCustomers.size);
  
  // 顯示前3個
  console.log('\n前3個客戶:');
  let count = 0;
  teamCustomers.forEach(doc => {
    if (count++ < 3) {
      const data = doc.data();
      console.log(`- ${data.name} (${data.company})`);
    }
  });
  
  // 清理建議
  if (withoutTeamId > 0) {
    console.log('\n⚠️  發現問題：有 ' + withoutTeamId + ' 個客戶沒有 teamId');
    console.log('建議執行清理指令：npm run seed -- --clean');
    console.log('然後重新生成資料：npm run seed');
  }
}

debugCustomers()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('錯誤:', error);
    process.exit(1);
  });