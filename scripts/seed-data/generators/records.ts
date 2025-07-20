/**
 * 紀錄資料生成器
 * 產生符合真實情境的會議、通話、筆記等紀錄
 */

import { faker } from '@faker-js/faker/locale/zh_TW';
import * as admin from 'firebase-admin';
import { generateId, getTimestamp, getBatch } from '../utils/firebase';

export interface RecordData {
  id: string;
  type: 'meeting' | 'call' | 'note' | 'other';
  title: string;
  customerIds: string[];
  participantIds: string[];
  scheduledAt?: admin.firestore.Timestamp;
  duration?: number;
  location?: string;
  content?: string;
  audioFileUrl?: string;
  transcription?: string;
  aiSummary?: string;
  aiActionItems?: string[];
  status: 'draft' | 'processing' | 'completed';
  customFields?: Record<string, any>;
  teamId: string;
  organizationId: string;
  createdAt: admin.firestore.FieldValue;
  updatedAt: admin.firestore.FieldValue;
  createdBy: string;
}

/**
 * 產生單筆紀錄資料
 */
export function generateRecord(
  userId: string,
  teamId: string,
  organizationId: string,
  customerIds: string[]
): RecordData {
  const recordId = generateId('record');
  const type = faker.helpers.arrayElement(['meeting', 'call', 'note', 'other'] as const);
  
  // 隨機選擇 1-3 個客戶
  const selectedCustomerIds = faker.helpers.arrayElements(
    customerIds,
    { min: 1, max: Math.min(3, customerIds.length) }
  );
  
  // 基本資料
  const recordData: RecordData = {
    id: recordId,
    type,
    title: generateTitle(type),
    customerIds: selectedCustomerIds,
    participantIds: [userId], // 包含建立者
    status: 'completed', // 測試資料都設為已完成
    teamId,
    organizationId,
    createdAt: getTimestamp(),
    updatedAt: getTimestamp(),
    createdBy: userId
  };
  
  // 根據類型加入特定欄位
  switch (type) {
    case 'meeting':
      Object.assign(recordData, generateMeetingFields());
      break;
    case 'call':
      Object.assign(recordData, generateCallFields());
      break;
    case 'note':
      Object.assign(recordData, generateNoteFields());
      break;
    case 'other':
      Object.assign(recordData, generateOtherFields());
      break;
  }
  
  // 自訂欄位
  recordData.customFields = generateRecordCustomFields(type);
  
  return recordData;
}

/**
 * 產生標題
 */
function generateTitle(type: RecordData['type']): string {
  const titles = {
    meeting: [
      '產品Demo會議',
      '需求討論會議',
      '合約洽談會議',
      '專案啟動會議',
      '季度業務檢討',
      '客戶拜訪會議',
      '技術支援會議'
    ],
    call: [
      '初次聯繫電話',
      '跟進電話',
      '客戶關懷電話',
      '技術支援電話',
      '訂單確認電話',
      '售後服務電話'
    ],
    note: [
      '客戶需求筆記',
      '競爭對手分析',
      '產品反饋紀錄',
      '市場調查筆記',
      '客戶問題紀錄'
    ],
    other: [
      'Email往來紀錄',
      '展覽會接觸',
      '社群媒體互動',
      '客戶推薦紀錄'
    ]
  };
  
  return faker.helpers.arrayElement(titles[type]);
}

/**
 * 產生會議相關欄位
 */
function generateMeetingFields() {
  const duration = faker.number.int({ min: 30, max: 180 });
  const scheduledAt = faker.date.recent({ days: 30 });
  
  return {
    scheduledAt: admin.firestore.Timestamp.fromDate(scheduledAt),
    duration,
    location: faker.helpers.arrayElement([
      '客戶辦公室',
      '我方會議室',
      '線上會議 (Zoom)',
      '線上會議 (Google Meet)',
      '線上會議 (Teams)',
      '咖啡廳',
      '餐廳'
    ]),
    content: generateMeetingContent(),
    aiSummary: generateAISummary('meeting'),
    aiActionItems: generateActionItems()
  };
}

/**
 * 產生通話相關欄位
 */
function generateCallFields() {
  const duration = faker.number.int({ min: 5, max: 60 });
  
  return {
    duration,
    content: generateCallContent(),
    aiSummary: generateAISummary('call'),
    aiActionItems: faker.helpers.maybe(() => generateActionItems(), { probability: 0.5 })
  };
}

/**
 * 產生筆記相關欄位
 */
function generateNoteFields() {
  return {
    content: generateNoteContent(),
    aiSummary: generateAISummary('note')
  };
}

/**
 * 產生其他類型相關欄位
 */
function generateOtherFields() {
  return {
    content: faker.lorem.paragraphs(2, '\n\n')
  };
}

/**
 * 產生會議內容
 */
function generateMeetingContent(): string {
  const topics = [
    '1. 產品功能介紹與Demo\n2. 客戶需求討論\n3. 價格方案說明\n4. 後續合作流程',
    '1. 專案進度更新\n2. 問題與挑戰\n3. 解決方案討論\n4. 下階段計劃',
    '1. 合約條款討論\n2. 付款方式確認\n3. 服務範圍定義\n4. 時程安排'
  ];
  
  return faker.helpers.arrayElement(topics);
}

/**
 * 產生通話內容
 */
function generateCallContent(): string {
  const contents = [
    '客戶詢問產品功能細節，已詳細說明並安排Demo會議',
    '跟進上次報價，客戶表示需要內部討論',
    '客戶反映使用問題，已協助解決並記錄改善建議',
    '確認訂單細節，預計下週交貨'
  ];
  
  return faker.helpers.arrayElement(contents);
}

/**
 * 產生筆記內容
 */
function generateNoteContent(): string {
  return faker.lorem.paragraphs(2, '\n\n');
}

/**
 * 產生 AI 摘要
 */
function generateAISummary(type: string): string {
  const summaries: Record<string, string[]> = {
    meeting: [
      '本次會議主要討論產品導入方案，客戶對功能表示滿意，但對價格有疑慮。已同意提供試用版本，並於兩週後進行評估。',
      '專案進度檢討會議，目前進度符合預期。客戶提出三項新需求，評估後可納入第二階段執行。',
      '技術支援會議，解決了客戶反映的系統整合問題。建議客戶升級至企業版以獲得更好的支援。'
    ],
    call: [
      '初次接觸電話，了解客戶基本需求。客戶主要尋找CRM解決方案，已安排下週進行產品Demo。',
      '售後關懷電話，客戶對產品整體滿意，但希望增加報表功能。已記錄需求並轉交產品團隊。'
    ],
    note: [
      '記錄客戶在使用過程中的問題和建議。主要集中在介面操作和報表客製化需求。'
    ]
  };
  
  return faker.helpers.arrayElement(summaries[type] || ['內容摘要']);
}

/**
 * 產生行動項目
 */
function generateActionItems(): string[] {
  const items = [
    '準備詳細的產品報價單',
    '安排技術團隊進行Demo',
    '發送會議記錄給所有參與者',
    '追蹤客戶決策進度',
    '準備客製化方案',
    '更新CRM系統中的客戶資訊',
    '安排下次會議時間',
    '提供試用帳號',
    '整理競爭對手比較表',
    '準備合約草案'
  ];
  
  return faker.helpers.arrayElements(items, { min: 2, max: 5 });
}

/**
 * 產生紀錄自訂欄位
 */
function generateRecordCustomFields(type: string): Record<string, any> {
  return {
    // 會議/通話品質
    quality: faker.helpers.arrayElement(['優秀', '良好', '普通', '待改善']),
    
    // 客戶反應
    customerResponse: faker.helpers.arrayElement([
      '非常感興趣', '感興趣', '考慮中', '暫無興趣', '已拒絕'
    ]),
    
    // 下一步行動
    nextStep: faker.helpers.arrayElement([
      '等待客戶回覆', '準備報價', '安排下次會議', 
      '發送資料', '內部討論', '結案'
    ]),
    
    // 商機評估
    opportunity: type === 'meeting' || type === 'call' ? 
      faker.helpers.arrayElement(['高', '中', '低']) : undefined,
    
    // 重要程度
    importance: faker.helpers.arrayElement(['高', '中', '低']),
    
    // 相關部門
    relatedDepartments: faker.helpers.maybe(() => 
      faker.helpers.arrayElements(
        ['業務部', '技術部', '客服部', '產品部', '財務部'],
        { min: 1, max: 2 }
      ), { probability: 0.5 }
    )
  };
}

/**
 * 批次建立紀錄資料
 */
export async function createRecords(
  db: admin.firestore.Firestore,
  userId: string,
  teamId: string,
  organizationId: string,
  customerIds: string[],
  recordsPerCustomer: number
): Promise<string[]> {
  const totalRecords = customerIds.length * recordsPerCustomer;
  console.log(`📝 開始建立 ${totalRecords} 筆紀錄（每個客戶 ${recordsPerCustomer} 筆）...`);
  
  const recordIds: string[] = [];
  const recordsRef = db.collection('records');
  const batchSize = 500;
  let recordCount = 0;
  
  // 為每個客戶建立紀錄
  for (let i = 0; i < customerIds.length; i += Math.floor(batchSize / recordsPerCustomer)) {
    const batch = getBatch(db);
    const customersInBatch = customerIds.slice(i, i + Math.floor(batchSize / recordsPerCustomer));
    
    for (const customerId of customersInBatch) {
      // 為每個客戶建立指定數量的紀錄
      for (let j = 0; j < recordsPerCustomer; j++) {
        const recordData = generateRecord(userId, teamId, organizationId, [customerId]);
        const docRef = recordsRef.doc(recordData.id);
        
        batch.set(docRef, recordData);
        recordIds.push(recordData.id);
        recordCount++;
        
        // 顯示進度
        if (recordCount % 10 === 0) {
          console.log(`   已產生 ${recordCount}/${totalRecords} 筆紀錄`);
        }
      }
    }
    
    // 提交批次
    await batch.commit();
    console.log(`   ✅ 批次提交成功`);
  }
  
  console.log(`✅ 成功建立 ${totalRecords} 筆紀錄資料`);
  return recordIds;
}