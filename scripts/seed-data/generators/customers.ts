/**
 * 客戶資料生成器
 * 產生符合真實情境的客戶測試資料
 */

import { faker } from '@faker-js/faker/locale/zh_TW';
import * as admin from 'firebase-admin';
import { generateId, getTimestamp, getBatch } from '../utils/firebase';

export interface CustomerData {
  id: string;
  name: string;
  company: string;
  email?: string;
  phone?: string;
  assignedTo: string;
  teamId: string;
  organizationId: string;
  notes?: string;
  customFields?: Record<string, any>;
  tags?: string[];
  lastContactDate?: admin.firestore.Timestamp;
  nextFollowUpDate?: admin.firestore.Timestamp;
  createdAt: admin.firestore.FieldValue;
  updatedAt: admin.firestore.FieldValue;
  createdBy: string;
}

/**
 * 產生單個客戶資料
 */
export function generateCustomer(
  userId: string,
  teamId: string,
  organizationId: string
): CustomerData {
  const customerId = generateId('customer');
  
  // 產生真實的台灣公司名稱
  const companyTypes = ['科技', '貿易', '製造', '服務', '金融', '生技', '電子', '資訊'];
  const companySuffixes = ['股份有限公司', '有限公司', '企業', '實業', '集團'];
  const companyType = faker.helpers.arrayElement(companyTypes);
  const companySuffix = faker.helpers.arrayElement(companySuffixes);
  const companyName = `${faker.company.name()}${companyType}${companySuffix}`;
  
  // 產生電話號碼（台灣格式）
  const phoneFormats = [
    '02-####-####',  // 台北
    '04-####-####',  // 台中
    '07-###-####',   // 高雄
    '03-###-####',   // 新竹、桃園
    '09##-###-###'   // 手機
  ];
  
  const customerData: CustomerData = {
    id: customerId,
    name: faker.person.fullName(),
    company: companyName,
    email: faker.internet.email(),
    phone: faker.helpers.replaceSymbols(faker.helpers.arrayElement(phoneFormats)),
    assignedTo: userId,
    teamId,
    organizationId,
    notes: faker.helpers.maybe(() => 
      faker.helpers.arrayElement([
        '重要客戶，需要特別關注',
        '新客戶，正在評估產品',
        '長期合作夥伴',
        '潛在大單客戶',
        '需要定期跟進'
      ]), { probability: 0.3 }
    ) || undefined,
    tags: faker.helpers.arrayElements(
      ['重要客戶', '潛在客戶', '新客戶', 'VIP', '長期客戶', '大型企業', '中小企業'],
      { min: 1, max: 3 }
    ),
    lastContactDate: admin.firestore.Timestamp.fromDate(
      faker.date.recent({ days: 30 })
    ),
    nextFollowUpDate: admin.firestore.Timestamp.fromDate(
      faker.date.future({ years: 0.1 })
    ),
    customFields: generateCustomFields(),
    createdAt: getTimestamp(),
    updatedAt: getTimestamp(),
    createdBy: userId
  };
  
  return customerData;
}

/**
 * 產生自訂欄位資料
 */
function generateCustomFields(): Record<string, any> {
  return {
    // 產業別
    industry: faker.helpers.arrayElement([
      '科技業', '製造業', '服務業', '金融業', '零售業', 
      '生技醫療', '傳統產業', '電子商務', '教育產業'
    ]),
    
    // 公司規模
    companySize: faker.helpers.arrayElement([
      '1-10人', '11-50人', '51-200人', '201-500人', '500人以上'
    ]),
    
    // 年度預算
    budget: faker.number.int({ min: 100000, max: 10000000 }),
    
    // 決策者
    decisionMaker: faker.person.fullName(),
    
    // 採購週期
    purchaseCycle: faker.helpers.arrayElement([
      '立即採購', '1個月內', '3個月內', '6個月內', '1年內', '評估中'
    ]),
    
    // 客戶來源
    source: faker.helpers.arrayElement([
      '網路搜尋', '展覽會', '轉介紹', '電話開發', '廣告', '舊客戶'
    ]),
    
    // 客戶狀態
    status: faker.helpers.arrayElement([
      '初次接觸', '需求確認', '報價中', '議價中', '成交', '售後服務'
    ]),
    
    // 競爭對手
    competitors: faker.helpers.maybe(() => 
      faker.helpers.arrayElements(
        ['競爭對手A', '競爭對手B', '競爭對手C', '競爭對手D'],
        { min: 1, max: 2 }
      ).join(', '), 
      { probability: 0.5 }
    ),
    
    // 特殊需求
    specialRequirements: faker.helpers.maybe(() => 
      faker.lorem.sentence(), 
      { probability: 0.3 }
    )
  };
}

/**
 * 批次建立客戶資料
 */
export async function createCustomers(
  db: admin.firestore.Firestore,
  userId: string,
  teamId: string,
  organizationId: string,
  count: number
): Promise<string[]> {
  console.log(`📝 開始建立 ${count} 個客戶資料...`);
  
  const customerIds: string[] = [];
  const customersRef = db.collection('customers');
  const batchSize = 500; // Firestore 批次操作限制
  
  // 分批處理
  for (let i = 0; i < count; i += batchSize) {
    const batch = getBatch(db);
    const currentBatchSize = Math.min(batchSize, count - i);
    
    for (let j = 0; j < currentBatchSize; j++) {
      const customerData = generateCustomer(userId, teamId, organizationId);
      const docRef = customersRef.doc(customerData.id);
      
      batch.set(docRef, customerData);
      customerIds.push(customerData.id);
      
      // 顯示進度
      if ((i + j + 1) % 10 === 0) {
        console.log(`   已產生 ${i + j + 1}/${count} 個客戶`);
      }
    }
    
    // 提交批次
    await batch.commit();
    console.log(`   ✅ 批次 ${Math.floor(i / batchSize) + 1} 提交成功`);
  }
  
  console.log(`✅ 成功建立 ${count} 個客戶資料`);
  return customerIds;
}