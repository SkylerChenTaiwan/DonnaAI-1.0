/**
 * 遷移腳本：建立預設欄位定義
 * 為所有現有組織建立預設的欄位定義
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { DEFAULT_CUSTOMER_FIELDS, DEFAULT_TASK_FIELDS } from '../src/types/fieldDefinitions';
import * as path from 'path';

// 初始化 Firebase Admin
const serviceAccountPath = path.join(__dirname, 'seed-data/service-account-key.json');

initializeApp({
  credential: cert(serviceAccountPath),
  databaseURL: 'https://donnaai-5e601-default-rtdb.firebaseio.com'
});

const db = getFirestore();

/**
 * 為組織建立預設欄位定義
 */
async function createDefaultFieldDefinitions(organizationId: string, collectionName: 'customers' | 'tasks') {
  console.log(`📝 為組織 ${organizationId} 建立 ${collectionName} 欄位定義`);
  
  const fields = collectionName === 'customers' ? DEFAULT_CUSTOMER_FIELDS : DEFAULT_TASK_FIELDS;
  
  const fieldDefinitionData = {
    collectionName,
    organizationId,
    fields,
    version: 1,
    isActive: true,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    createdBy: 'migration-script',
    updatedBy: 'migration-script',
    description: '系統預設欄位定義 (遷移腳本建立)'
  };
  
  try {
    const docRef = await db.collection('field_definitions').add(fieldDefinitionData);
    console.log(`✅ 建立成功: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error(`❌ 建立失敗:`, error);
    throw error;
  }
}

/**
 * 檢查組織是否已有欄位定義
 */
async function hasFieldDefinitions(organizationId: string, collectionName: string): Promise<boolean> {
  const snapshot = await db.collection('field_definitions')
    .where('organizationId', '==', organizationId)
    .where('collectionName', '==', collectionName)
    .where('isActive', '==', true)
    .limit(1)
    .get();
    
  return !snapshot.empty;
}

/**
 * 主要遷移函數
 */
async function migrate() {
  console.log('🚀 開始遷移到動態欄位定義系統...\n');
  
  try {
    // 取得所有組織
    console.log('📋 取得所有組織...');
    const orgsSnapshot = await db.collection('organizations').get();
    console.log(`找到 ${orgsSnapshot.size} 個組織\n`);
    
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    // 為每個組織建立預設欄位定義
    for (const orgDoc of orgsSnapshot.docs) {
      const orgId = orgDoc.id;
      const orgData = orgDoc.data();
      console.log(`\n🏢 處理組織: ${orgData.name || orgId}`);
      
      try {
        // 檢查並建立客戶欄位定義
        if (await hasFieldDefinitions(orgId, 'customers')) {
          console.log('⏭️  已有客戶欄位定義，跳過');
          skipCount++;
        } else {
          await createDefaultFieldDefinitions(orgId, 'customers');
          successCount++;
        }
        
        // 檢查並建立任務欄位定義
        if (await hasFieldDefinitions(orgId, 'tasks')) {
          console.log('⏭️  已有任務欄位定義，跳過');
          skipCount++;
        } else {
          await createDefaultFieldDefinitions(orgId, 'tasks');
          successCount++;
        }
        
      } catch (error) {
        console.error(`❌ 處理組織 ${orgId} 時發生錯誤:`, error);
        errorCount++;
      }
    }
    
    // 顯示統計
    console.log('\n📊 遷移完成統計:');
    console.log(`✅ 成功建立: ${successCount} 個欄位定義`);
    console.log(`⏭️  跳過已存在: ${skipCount} 個`);
    console.log(`❌ 錯誤: ${errorCount} 個`);
    
    // 建立測試組織的欄位定義（如果沒有組織存在）
    if (orgsSnapshot.empty) {
      console.log('\n⚠️  沒有找到任何組織，建立測試組織的欄位定義...');
      
      // 建立測試組織
      const testOrgRef = await db.collection('organizations').add({
        name: '測試組織',
        adminUserId: 'test-admin',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });
      
      console.log(`✅ 建立測試組織: ${testOrgRef.id}`);
      
      // 為測試組織建立欄位定義
      await createDefaultFieldDefinitions(testOrgRef.id, 'customers');
      await createDefaultFieldDefinitions(testOrgRef.id, 'tasks');
    }
    
    console.log('\n✨ 遷移腳本執行完成！');
    
  } catch (error) {
    console.error('\n💥 遷移過程中發生錯誤:', error);
    process.exit(1);
  }
}

// 執行遷移
migrate()
  .then(() => {
    console.log('\n👋 程式結束');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 未預期的錯誤:', error);
    process.exit(1);
  });

/**
 * 使用方式：
 * 1. 確保 service-account-key.json 存在於 scripts/seed-data/ 目錄
 * 2. 執行: npx ts-node scripts/migrateToFieldDefinitions.ts
 * 
 * 注意事項：
 * - 此腳本會為所有現有組織建立預設的欄位定義
 * - 如果組織已有欄位定義，會跳過該組織
 * - 建立的欄位定義將使用預設的欄位配置
 */