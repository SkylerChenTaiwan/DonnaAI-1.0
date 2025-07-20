#!/usr/bin/env node

/**
 * 測試資料生成器主程式
 * 為 DonnaAI 產生真實的測試資料
 */

import { program } from 'commander';
import * as admin from 'firebase-admin';
import { initializeFirebase } from './utils/firebase';
import { getOrCreateAdminUser } from './utils/user';
import { createCustomers } from './generators/customers';
import { createRecords } from './generators/records';
import { createTasks } from './generators/tasks';

// 設定命令列介面
program
  .version('1.0.0')
  .description('DonnaAI 測試資料生成器')
  .option('--email <email>', '指定使用者信箱', 'admin@donnaai.ai')
  .option('--customers <number>', '客戶數量', '20')
  .option('--records <number>', '每個客戶的紀錄數量', '5')
  .option('--tasks <number>', '任務數量', '30')
  .option('--clean', '清理測試資料')
  .option('--dry-run', '模擬執行（不實際寫入資料）')
  .parse(process.argv);

const options = program.opts();

/**
 * 主要執行函數 - 建立測試資料
 */
async function seedData() {
  console.log('🚀 DonnaAI 測試資料生成器');
  console.log('========================');
  console.log(`📧 使用者: ${options.email}`);
  console.log(`👥 客戶數量: ${options.customers}`);
  console.log(`📋 每個客戶紀錄數: ${options.records}`);
  console.log(`✅ 任務數量: ${options.tasks}`);
  console.log('========================\n');
  
  if (options.dryRun) {
    console.log('⚠️  模擬執行模式 - 不會實際寫入資料');
    return;
  }
  
  try {
    // 初始化 Firebase
    const db = initializeFirebase();
    
    // 取得或建立管理員使用者
    const adminUser = await getOrCreateAdminUser(options.email, db);
    const userId = adminUser.id;
    const teamId = adminUser.teamIds[0];
    const organizationId = adminUser.organizationId;
    
    console.log('\n🌱 開始建立測試資料...\n');
    
    // 1. 建立客戶
    const startTime = Date.now();
    const customerIds = await createCustomers(
      db,
      userId,
      teamId,
      organizationId,
      parseInt(options.customers)
    );
    
    // 2. 為每個客戶建立紀錄
    const recordIds = await createRecords(
      db,
      userId,
      teamId,
      organizationId,
      customerIds,
      parseInt(options.records)
    );
    
    // 3. 建立任務
    const taskIds = await createTasks(
      db,
      userId,
      teamId,
      organizationId,
      customerIds,
      parseInt(options.tasks)
    );
    
    // 計算執行時間
    const executionTime = ((Date.now() - startTime) / 1000).toFixed(2);
    
    // 顯示總結
    console.log('\n✨ 測試資料建立完成！');
    console.log('========================');
    console.log(`👤 使用者: ${adminUser.name} (${adminUser.email})`);
    console.log(`🏢 組織: ${organizationId}`);
    console.log(`👥 建立了 ${customerIds.length} 個客戶`);
    console.log(`📋 建立了 ${recordIds.length} 筆紀錄`);
    console.log(`✅ 建立了 ${taskIds.length} 個任務`);
    console.log(`⏱️  執行時間: ${executionTime} 秒`);
    console.log('========================');
    
    console.log('\n💡 提示：');
    console.log('- 可以在 Firebase Console 查看資料');
    console.log('- 使用 --clean 參數可以清理測試資料');
    console.log('- 登入應用程式使用: admin@donnaai.ai');
    
  } catch (error) {
    console.error('\n❌ 錯誤:', error);
    process.exit(1);
  }
}

/**
 * 清理測試資料
 */
async function cleanTestData() {
  console.log('🧹 開始清理測試資料...\n');
  
  if (options.dryRun) {
    console.log('⚠️  模擬執行模式 - 不會實際刪除資料');
    return;
  }
  
  try {
    const db = initializeFirebase();
    const adminUser = await getOrCreateAdminUser(options.email, db);
    
    let totalDeleted = 0;
    
    // 清理客戶資料
    console.log('🗑️  清理客戶資料...');
    const customersQuery = await db.collection('customers')
      .where('createdBy', '==', adminUser.id)
      .get();
    
    const customerBatch = db.batch();
    customersQuery.forEach(doc => {
      customerBatch.delete(doc.ref);
      totalDeleted++;
    });
    
    if (customersQuery.size > 0) {
      await customerBatch.commit();
      console.log(`   ✅ 刪除了 ${customersQuery.size} 個客戶`);
    } else {
      console.log('   ℹ️  沒有找到客戶資料');
    }
    
    // 清理紀錄資料
    console.log('🗑️  清理紀錄資料...');
    const recordsQuery = await db.collection('records')
      .where('createdBy', '==', adminUser.id)
      .get();
    
    const recordBatch = db.batch();
    recordsQuery.forEach(doc => {
      recordBatch.delete(doc.ref);
      totalDeleted++;
    });
    
    if (recordsQuery.size > 0) {
      await recordBatch.commit();
      console.log(`   ✅ 刪除了 ${recordsQuery.size} 筆紀錄`);
    } else {
      console.log('   ℹ️  沒有找到紀錄資料');
    }
    
    // 清理任務資料
    console.log('🗑️  清理任務資料...');
    const tasksQuery = await db.collection('tasks')
      .where('createdBy', '==', adminUser.id)
      .get();
    
    const taskBatch = db.batch();
    tasksQuery.forEach(doc => {
      taskBatch.delete(doc.ref);
      totalDeleted++;
    });
    
    if (tasksQuery.size > 0) {
      await taskBatch.commit();
      console.log(`   ✅ 刪除了 ${tasksQuery.size} 個任務`);
    } else {
      console.log('   ℹ️  沒有找到任務資料');
    }
    
    console.log(`\n✅ 清理完成！總共刪除了 ${totalDeleted} 筆資料`);
    
  } catch (error) {
    console.error('\n❌ 清理失敗:', error);
    process.exit(1);
  }
}

/**
 * 顯示使用說明
 */
function showHelp() {
  console.log(`
DonnaAI 測試資料生成器使用說明
==============================

建立測試資料:
  npm run seed

指定參數:
  npm run seed -- --customers 50 --records 10 --tasks 100

清理測試資料:
  npm run seed -- --clean

模擬執行（不實際寫入）:
  npm run seed -- --dry-run

參數說明:
  --email <email>      指定使用者信箱 (預設: admin@donnaai.ai)
  --customers <n>      客戶數量 (預設: 20)
  --records <n>        每個客戶的紀錄數量 (預設: 5)
  --tasks <n>          任務數量 (預設: 30)
  --clean              清理測試資料
  --dry-run            模擬執行

注意事項:
  1. 需要設定 Firebase 服務帳號金鑰
  2. 確保有適當的 Firestore 寫入權限
  3. 測試資料會關聯到指定的使用者帳號
  `);
}

// 主程式執行
async function main() {
  if (program.args.length === 0 && !options.clean) {
    // 如果沒有參數，顯示說明
    const hasOptions = Object.keys(options).some(key => 
      key !== 'email' && key !== 'version' && options[key] !== undefined
    );
    
    if (!hasOptions) {
      showHelp();
      return;
    }
  }
  
  if (options.clean) {
    await cleanTestData();
  } else {
    await seedData();
  }
}

// 執行主程式
main().catch(error => {
  console.error('❌ 程式執行失敗:', error);
  process.exit(1);
});