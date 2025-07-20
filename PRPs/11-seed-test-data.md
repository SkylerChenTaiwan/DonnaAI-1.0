# PRP: 建立測試資料生成器

## 執行摘要
建立一個資料種子生成器，為 admin@donnaai.ai 帳號產生真實的測試資料到 Firestore 資料庫中。

## 功能需求
- 為 admin@donnaai.ai 帳號建立測試資料
- 包含客戶、紀錄、任務等主要實體
- 資料要符合現有的資料結構和驗證規則
- 支援批次建立以提高效率
- 提供清理功能以移除測試資料

## 技術脈絡

### 資料模型參考
關鍵檔案位置：
- `/src/types/` - 所有資料類型定義
- `/src/services/firebase/` - Firebase 操作範例
- `/functions/src/` - Firebase Admin SDK 使用範例

### Firebase Admin SDK 初始化模式
參考 `functions/src/audio-processing.ts`:
```typescript
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
```

### 批次操作範例
參考 `functions/src/audio-processing.ts` 的批次更新：
```typescript
const batch = db.batch();
// 添加多個操作
await batch.commit();
```

### 資料結構關鍵點

#### User (admin@donnaai.ai)
```typescript
{
  id: "admin_user_id", // 需要先找到或建立
  email: "admin@donnaai.ai",
  name: "系統管理員",
  role: "admin",
  organizationId: "default_org",
  teamIds: ["default_team"]
}
```

#### CustomerDoc
```typescript
{
  id: string,
  name: string, // 必填
  company: string, // 必填
  email?: string,
  phone?: string,
  assignedTo: string, // admin user ID
  teamId: string,
  organizationId: string,
  customFields?: Record<string, any>,
  tags?: string[],
  lastContactDate?: Timestamp,
  nextFollowUpDate?: Timestamp,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  createdBy: string
}
```

#### RecordDoc
```typescript
{
  id: string,
  type: 'meeting' | 'call' | 'note' | 'other',
  title: string,
  customerIds: string[], // 關聯到客戶
  participantIds: string[], // 包含 admin user
  status: 'completed',
  content?: string,
  aiSummary?: string,
  aiActionItems?: string[],
  teamId: string,
  organizationId: string,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  createdBy: string
}
```

#### TaskDoc
```typescript
{
  id: string,
  title: string,
  type: 'scheduled' | 'unscheduled' | 'pending',
  priority: 'low' | 'medium' | 'high' | 'urgent',
  status: 'todo' | 'in_progress' | 'completed',
  assigneeId: string, // admin user ID
  customerIds?: string[],
  dueDate?: Timestamp,
  teamId: string,
  organizationId: string,
  source: 'manual',
  createdAt: Timestamp,
  updatedAt: Timestamp,
  createdBy: string
}
```

## 實作藍圖

### 1. 專案結構
```
scripts/
  seed-data/
    index.ts        # 主程式入口
    config.ts       # 配置設定
    generators/     # 資料生成器
      customers.ts
      records.ts
      tasks.ts
    utils/
      faker.ts      # 假資料生成工具
      firebase.ts   # Firebase 連接
```

### 2. 實作步驟

#### 步驟 1: 建立基礎架構
```typescript
// scripts/seed-data/index.ts
import * as admin from 'firebase-admin';
import { program } from 'commander';

// 設定命令列介面
program
  .option('--email <email>', '指定使用者信箱', 'admin@donnaai.ai')
  .option('--customers <number>', '客戶數量', '20')
  .option('--records <number>', '每個客戶的紀錄數量', '5')
  .option('--tasks <number>', '任務數量', '30')
  .option('--clean', '清理測試資料')
  .parse();
```

#### 步驟 2: Firebase 初始化
```typescript
// scripts/seed-data/utils/firebase.ts
export function initializeFirebase() {
  // 檢查環境變數或使用服務帳號金鑰
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp();
  } else {
    // 使用本地服務帳號金鑰
    const serviceAccount = require('../../service-account-key.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
  
  return admin.firestore();
}
```

#### 步驟 3: 使用者查詢/建立
```typescript
// scripts/seed-data/utils/user.ts
export async function getOrCreateAdminUser(email: string, db: admin.firestore.Firestore) {
  // 查詢現有使用者
  const usersRef = db.collection('users');
  const query = await usersRef.where('email', '==', email).limit(1).get();
  
  if (!query.empty) {
    return query.docs[0].data();
  }
  
  // 建立新使用者
  const userId = `user_${Date.now()}`;
  const userData = {
    id: userId,
    email,
    name: '系統管理員',
    role: 'admin',
    organizationId: 'default_org',
    teamIds: ['default_team'],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };
  
  await usersRef.doc(userId).set(userData);
  return userData;
}
```

#### 步驟 4: 資料生成器
```typescript
// scripts/seed-data/generators/customers.ts
import { faker } from '@faker-js/faker/locale/zh_TW';

export function generateCustomer(userId: string, teamId: string, organizationId: string) {
  const customerId = `customer_${Date.now()}_${faker.string.alphanumeric(6)}`;
  
  return {
    id: customerId,
    name: faker.person.fullName(),
    company: faker.company.name(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    assignedTo: userId,
    teamId,
    organizationId,
    tags: faker.helpers.arrayElements(['重要客戶', '潛在客戶', '新客戶', 'VIP'], { min: 1, max: 3 }),
    lastContactDate: faker.date.recent({ days: 30 }),
    nextFollowUpDate: faker.date.future({ years: 0.1 }),
    customFields: {
      industry: faker.helpers.arrayElement(['科技業', '製造業', '服務業', '金融業']),
      companySize: faker.helpers.arrayElement(['1-10人', '11-50人', '51-200人', '200人以上']),
      budget: faker.number.int({ min: 100000, max: 5000000 })
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: userId
  };
}
```

#### 步驟 5: 批次建立邏輯
```typescript
// scripts/seed-data/index.ts
async function seedData() {
  const db = initializeFirebase();
  const options = program.opts();
  
  // 取得或建立管理員使用者
  const adminUser = await getOrCreateAdminUser(options.email, db);
  
  console.log(`🌱 開始為 ${options.email} 建立測試資料...`);
  
  // 1. 建立客戶
  const customerIds = await createCustomers(
    db, 
    adminUser.id, 
    adminUser.teamIds[0], 
    adminUser.organizationId,
    parseInt(options.customers)
  );
  
  // 2. 為每個客戶建立紀錄
  const recordIds = await createRecords(
    db,
    adminUser.id,
    adminUser.teamIds[0],
    adminUser.organizationId,
    customerIds,
    parseInt(options.records)
  );
  
  // 3. 建立任務
  await createTasks(
    db,
    adminUser.id,
    adminUser.teamIds[0],
    adminUser.organizationId,
    customerIds,
    parseInt(options.tasks)
  );
  
  console.log('✅ 測試資料建立完成！');
}
```

#### 步驟 6: 清理功能
```typescript
async function cleanTestData() {
  const db = initializeFirebase();
  const adminUser = await getOrCreateAdminUser(program.opts().email, db);
  
  console.log('🧹 開始清理測試資料...');
  
  // 批次刪除
  const batch = db.batch();
  let deleteCount = 0;
  
  // 刪除客戶
  const customers = await db.collection('customers')
    .where('createdBy', '==', adminUser.id)
    .where('name', '>=', '測試')
    .where('name', '<=', '測試\uf8ff')
    .get();
    
  customers.forEach(doc => {
    batch.delete(doc.ref);
    deleteCount++;
  });
  
  // 類似地刪除紀錄和任務...
  
  await batch.commit();
  console.log(`✅ 已刪除 ${deleteCount} 筆測試資料`);
}
```

## 實作任務清單

1. **建立專案結構** (30分鐘)
   - 建立 scripts/seed-data 目錄結構
   - 設定 TypeScript 配置
   - 安裝必要套件 (@faker-js/faker, commander, firebase-admin)

2. **實作 Firebase 連接** (30分鐘)
   - 建立 Firebase 初始化函數
   - 處理認證（服務帳號金鑰）
   - 建立資料庫連接工具

3. **實作使用者管理** (20分鐘)
   - 查詢/建立 admin 使用者
   - 取得組織和團隊資訊

4. **實作資料生成器** (1小時)
   - 客戶資料生成器（包含自訂欄位）
   - 紀錄資料生成器（不同類型）
   - 任務資料生成器（不同狀態和優先級）

5. **實作批次建立邏輯** (45分鐘)
   - 批次建立客戶
   - 批次建立紀錄（關聯到客戶）
   - 批次建立任務（部分關聯到客戶）

6. **實作清理功能** (30分鐘)
   - 識別測試資料
   - 批次刪除邏輯
   - 錯誤處理

7. **測試和文件** (30分鐘)
   - 編寫使用說明
   - 測試各種情境
   - 錯誤處理優化

## 驗證門檻

```bash
# 1. TypeScript 編譯檢查
cd scripts/seed-data && npx tsc --noEmit

# 2. 執行測試資料建立
npm run seed -- --email admin@donnaai.ai --customers 10 --records 3 --tasks 15

# 3. 驗證資料已建立
# 在 Firebase Console 檢查：
# - users 集合中有 admin@donnaai.ai
# - customers 集合中有 10 筆新資料
# - records 集合中有相關紀錄
# - tasks 集合中有 15 筆任務

# 4. 測試清理功能
npm run seed -- --clean --email admin@donnaai.ai

# 5. 驗證資料已清理
# 再次檢查 Firebase Console 確認測試資料已移除
```

## 注意事項

1. **Firebase 認證**
   - 需要服務帳號金鑰或設定 GOOGLE_APPLICATION_CREDENTIALS
   - 確保有適當的 Firestore 寫入權限

2. **資料一致性**
   - 確保所有關聯 ID 都是有效的
   - 時間戳記使用 serverTimestamp()
   - 遵循現有的資料驗證規則

3. **效能考量**
   - 使用批次操作（最多 500 個操作per batch）
   - 避免過多的並發請求
   - 提供進度顯示

4. **安全性**
   - 不要將服務帳號金鑰提交到版本控制
   - 測試資料應該易於識別和清理
   - 避免覆蓋真實資料

## 參考資源

- [Firebase Admin SDK 文件](https://firebase.google.com/docs/admin/setup)
- [Faker.js 中文文件](https://fakerjs.dev/guide/localization.html#available-locales)
- [Commander.js 文件](https://github.com/tj/commander.js)
- 現有程式碼範例：
  - `/functions/src/audio-processing.ts` - 批次操作範例
  - `/src/types/` - 資料類型定義
  - `/src/services/firebase/` - Firebase 操作模式

## 預期成果

執行後應該在 Firestore 中看到：
- 1 個管理員使用者（admin@donnaai.ai）
- 20 個測試客戶（含豐富的自訂欄位）
- 100 筆紀錄（每個客戶 5 筆）
- 30 個任務（各種狀態和優先級）

所有資料都應該：
- 符合現有的資料結構
- 包含合理的中文內容
- 有正確的關聯關係
- 可以被應用程式正常顯示和操作

## 信心評分：8/10

扣分原因：
- 需要處理 Firebase 認證設定（-1）
- 可能需要根據實際資料庫規則調整（-1）

這個 PRP 提供了完整的實作指引，包含所有必要的上下文和程式碼範例，應該能夠一次性成功實作。