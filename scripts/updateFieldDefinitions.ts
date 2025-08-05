/**
 * 更新欄位定義腳本
 * 將現有的8個欄位更新為4個基本欄位
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { DEFAULT_CUSTOMER_FIELDS } from '../src/types/fieldDefinitions';
import * as path from 'path';

// 初始化 Firebase Admin
const serviceAccountPath = path.join(__dirname, 'seed-data/service-account-key.json');

initializeApp({
  credential: cert(serviceAccountPath),
  databaseURL: 'https://donnaai-5e601-default-rtdb.firebaseio.com'
});

const db = getFirestore();

/**
 * 更新所有組織的客戶欄位定義
 */
async function updateAllCustomerFieldDefinitions() {
  console.log('🔄 開始更新客戶欄位定義...\n');
  
  try {
    // 查詢所有客戶欄位定義
    const snapshot = await db.collection('field_definitions')
      .where('collectionName', '==', 'customers')
      .where('isActive', '==', true)
      .get();
    
    console.log(`找到 ${snapshot.size} 個需要更新的欄位定義\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      console.log(`更新組織 ${data.organizationId} 的欄位定義...`);
      
      try {
        // 先停用當前版本
        await doc.ref.update({ isActive: false });
        
        // 建立新版本，只包含4個基本欄位
        const newDefinition = {
          collectionName: 'customers',
          organizationId: data.organizationId,
          fields: DEFAULT_CUSTOMER_FIELDS, // 現在只有4個欄位
          version: data.version + 1,
          isActive: true,
          createdAt: data.createdAt,
          updatedAt: FieldValue.serverTimestamp(),
          createdBy: data.createdBy,
          updatedBy: 'update-script',
          description: '簡化為4個基本欄位（客戶姓名、公司名稱、聯絡電話、電子郵件）'
        };
        
        await db.collection('field_definitions').add(newDefinition);
        console.log('✅ 更新成功\n');
        successCount++;
      } catch (error) {
        console.error('❌ 更新失敗:', error, '\n');
        errorCount++;
      }
    }
    
    console.log('\n📊 更新完成統計:');
    console.log(`✅ 成功更新: ${successCount} 個`);
    console.log(`❌ 失敗: ${errorCount} 個`);
    
  } catch (error) {
    console.error('💥 腳本執行失敗:', error);
    process.exit(1);
  }
}

// 執行更新
updateAllCustomerFieldDefinitions()
  .then(() => {
    console.log('\n✨ 欄位定義更新完成！');
    console.log('現在客戶表單只會顯示4個基本欄位。');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 未預期的錯誤:', error);
    process.exit(1);
  });