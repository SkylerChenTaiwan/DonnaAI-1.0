/**
 * 測試資料生成工具
 * 為多模態輸入系統生成測試資料
 */

import { CustomerDoc, RecordDoc, TaskDoc } from '@/types/database';

// 生成隨機 ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// 生成隨機日期
const generateRandomDate = (daysBack: number = 30) => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  return date;
};

// 客戶測試資料
export const generateTestCustomers = (): Partial<CustomerDoc>[] => {
  const companies = [
    '科技創新有限公司', '綠能科技股份有限公司', '智慧製造企業',
    '數位行銷公司', '生技醫療集團', '金融科技新創',
    '文創設計工作室', '電商平台公司', '教育科技公司', '物聯網解決方案'
  ];

  const firstNames = ['志明', '春嬌', '小美', '大雄', '靜香', '胖虎', '小夫', '阿華', '美玲', '建宏'];
  const lastNames = ['王', '李', '陳', '張', '劉', '楊', '黃', '林', '吳', '許'];

  const tags = ['VIP客戶', '潛在客戶', '長期合作', '新客戶', '重要客戶', '企業客戶', '個人客戶'];

  return Array.from({ length: 20 }, (_, i) => ({
    id: generateId(),
    name: `${lastNames[i % lastNames.length]}${firstNames[i % firstNames.length]}`,
    company: companies[i % companies.length],
    email: `customer${i + 1}@${companies[i % companies.length].replace(/[\u4e00-\u9fa5\s]/g, '')}.com`.toLowerCase(),
    phone: `09${Math.floor(Math.random() * 90000000) + 10000000}`,
    address: `台北市信義區${Math.floor(Math.random() * 999) + 1}號`,
    tags: [tags[Math.floor(Math.random() * tags.length)]],
    notes: `這是${companies[i % companies.length]}的聯絡人，主要負責業務洽談。`,
    assignedTo: 'test-user-id',
    createdAt: generateRandomDate(60),
    updatedAt: generateRandomDate(30),
    organizationId: 'test-org-id',
    teamId: 'test-team-id' }));
};

// 紀錄測試資料
export const generateTestRecords = (customerIds: string[]): Partial<RecordDoc>[] => {
  const recordTypes: Array<RecordDoc['type']> = ['meeting', 'call', 'note', 'todo', 'idea', 'other'];
  const locations = ['台北辦公室', '客戶現場', '視訊會議', '電話會議', '咖啡廳', '展覽會場'];
  
  const titles = [
    '產品需求討論', '合作方案提案', '技術架構規劃', '價格商談',
    '項目進度回報', '客戶需求收集', '解決方案設計', '售後服務討論'
  ];

  const contents = [
    '客戶對我們的產品表現出濃厚興趣，特別是 AI 自動化功能。討論了具體的實作細節和時程安排。',
    '提出了完整的合作提案，包含技術方案、實施計劃和預算評估。客戶要求一週內回覆。',
    '深入討論了系統架構設計，確認了主要功能模組和整合方式。需要進一步的技術驗證。',
    '就價格和服務內容進行協商，客戶希望能提供更靈活的計費方式和長期合作方案。',
    '回報了項目當前進度，討論了遇到的技術挑戰和解決方案。客戶表示滿意當前進展。',
  ];

  return Array.from({ length: 30 }, (_, i) => ({
    id: generateId(),
    type: recordTypes[Math.floor(Math.random() * recordTypes.length)],
    title: titles[Math.floor(Math.random() * titles.length)],
    content: contents[Math.floor(Math.random() * contents.length)],
    customerIds: [customerIds[Math.floor(Math.random() * customerIds.length)]],
    location: locations[Math.floor(Math.random() * locations.length)],
    duration: Math.floor(Math.random() * 120) + 30, // 30-150 分鐘
    audioUrl: i % 3 === 0 ? `https://example.com/audio/record_${i}.mp3` : undefined,
    aiSummary: `AI 摘要：本次${recordTypes[Math.floor(Math.random() * recordTypes.length)] === 'meeting' ? '會議' : '通話'}主要討論了...`,
    aiExtractedFields: {
      sentiment: Math.random() > 0.3 ? 'positive' : Math.random() > 0.5 ? 'neutral' : 'negative',
      keyTopics: ['產品討論', '價格協商', '技術方案'],
      actionItems: ['準備提案', '安排下次會議', '技術驗證'],
      nextSteps: '一週內提供正式報價單' },
    createdBy: 'test-user-id',
    createdAt: generateRandomDate(45),
    updatedAt: generateRandomDate(15),
    organizationId: 'test-org-id',
    teamId: 'test-team-id' }));
};

// 任務測試資料
export const generateTestTasks = (customerIds: string[], recordIds: string[]): Partial<TaskDoc>[] => {
  const priorities: Array<TaskDoc['priority']> = ['low', 'medium', 'high', 'urgent'];
  const statuses: Array<TaskDoc['status']> = ['todo', 'in_progress', 'completed', 'cancelled'];
  
  const taskTitles = [
    '準備產品展示簡報', '撰寫技術規格文件', '安排客戶拜訪', '進行價格分析',
    '更新合約條款', '準備專案提案', '安排技術驗證', '客戶需求調研',
    '競爭對手分析', '制定實施計劃', '準備測試環境', '用戶培訓規劃'
  ];

  const descriptions = [
    '根據客戶需求準備詳細的產品展示材料，重點突出技術優勢和商業價值。',
    '撰寫完整的技術規格文件，包含系統架構、API 接口和性能要求。',
    '安排與客戶的面談，討論具體合作細節和實施方案。',
    '分析市場價格趨勢，制定具有競爭力的報價策略。',
    '根據法務建議更新合約條款，確保雙方權益得到保障。',
  ];

  return Array.from({ length: 25 }, (_, i) => ({
    id: generateId(),
    title: taskTitles[Math.floor(Math.random() * taskTitles.length)],
    description: descriptions[Math.floor(Math.random() * descriptions.length)],
    priority: priorities[Math.floor(Math.random() * priorities.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    dueDate: generateRandomDate(-30), // 未來 30 天內
    assigneeId: 'test-user-id',
    customerIds: Math.random() > 0.3 ? [customerIds[Math.floor(Math.random() * customerIds.length)]] : undefined,
    recordId: Math.random() > 0.5 ? recordIds[Math.floor(Math.random() * recordIds.length)] : undefined,
    tags: ['重要', '緊急', '客戶相關'].filter(() => Math.random() > 0.6),
    estimatedHours: Math.floor(Math.random() * 16) + 2, // 2-18 小時
    actualHours: Math.random() > 0.5 ? Math.floor(Math.random() * 20) + 1 : undefined,
    createdBy: 'test-user-id',
    createdAt: generateRandomDate(30),
    updatedAt: generateRandomDate(10),
    organizationId: 'test-org-id',
    teamId: 'test-team-id' }));
};

// CSV 測試資料
export const generateTestCSVData = () => {
  const csvCustomers = `姓名,公司,電子郵件,電話,地址,標籤,備註
張志明,創新科技公司,chang@tech.com,0912345678,台北市中山區100號,VIP客戶,重要客戶
李美玲,數位行銷,li@digital.com,0923456789,新北市板橋區200號,新客戶,潛力客戶
王大明,綠能科技,wang@green.com,0934567890,台中市西屯區300號,長期合作,穩定客戶
陳小華,智慧製造,chen@smart.com,0945678901,高雄市前鎮區400號,企業客戶,大客戶
林靜香,生技醫療,lin@biotech.com,0956789012,桃園市中壢區500號,潛在客戶,需要追蹤`;

  return {
    customers: csvCustomers };
};

// 音頻測試資料結構
export interface MockAudioData {
  id: string;
  filename: string;
  duration: number; // 秒
  size: number; // bytes
  transcription: string;
  extractedTasks: Array<{
    title: string;
    priority: 'low' | 'medium' | 'high';
    dueDate?: string;
  }>;
  extractedCustomerInfo?: {
    name?: string;
    company?: string;
    phone?: string;
    email?: string;
  };
}

// 模擬音頻測試資料
export const generateMockAudioData = (): MockAudioData[] => [
  {
    id: 'audio_001',
    filename: 'meeting_recording_001.m4a',
    duration: 1200, // 20 分鐘
    size: 15728640, // 15MB
    transcription: '今天與 ABC 科技公司的張經理討論了我們的 AI 解決方案。他們對自動化流程很感興趣，特別是客戶管理系統。我們約定下週提供詳細的技術提案，並且要在月底前完成價格評估。張經理的聯絡方式是 0912-345-678，email 是 zhang@abc-tech.com。',
    extractedTasks: [
      {
        title: '準備 ABC 科技的技術提案',
        priority: 'high',
        dueDate: '2024-02-15' },
      {
        title: '完成 ABC 科技的價格評估',
        priority: 'medium',
        dueDate: '2024-02-28' },
    ],
    extractedCustomerInfo: {
      name: '張經理',
      company: 'ABC 科技公司',
      phone: '0912-345-678',
      email: 'zhang@abc-tech.com' } },
  {
    id: 'audio_002',
    filename: 'client_call_002.m4a',
    duration: 900, // 15 分鐘
    size: 11796480, // 11.25MB
    transcription: '剛剛接到客戶 XYZ 公司的緊急電話，他們的系統出現了異常，需要立即處理。我已經安排技術團隊今天下午進行遠端診斷。同時要記得明天早上 10 點與他們的 IT 主管開會討論預防措施。',
    extractedTasks: [
      {
        title: '處理 XYZ 公司系統異常',
        priority: 'urgent' },
      {
        title: '與 XYZ 公司 IT 主管開會',
        priority: 'high',
        dueDate: '2024-02-10' },
    ],
    extractedCustomerInfo: {
      company: 'XYZ 公司' } },
  {
    id: 'audio_003',
    filename: 'project_notes_003.m4a',
    duration: 600, // 10 分鐘
    size: 7864320, // 7.5MB
    transcription: '專案進度回顧：目前開發進度達到 80%，測試階段預計下週開始。需要準備用戶使用手冊和培訓材料。李小姐負責文件撰寫，我來處理培訓規劃。月底前要完成所有交付項目。',
    extractedTasks: [
      {
        title: '開始專案測試階段',
        priority: 'high',
        dueDate: '2024-02-12' },
      {
        title: '準備用戶使用手冊',
        priority: 'medium',
        dueDate: '2024-02-25' },
      {
        title: '規劃用戶培訓',
        priority: 'medium',
        dueDate: '2024-02-28' },
    ] },
];

// 驗證資料完整性
export const validateTestData = () => {
  const customers = generateTestCustomers();
  const customerIds = customers.map(c => c.id!);
  const records = generateTestRecords(customerIds);
  const recordIds = records.map(r => r.id!);
  const tasks = generateTestTasks(customerIds, recordIds);
  const audioData = generateMockAudioData();
  const csvData = generateTestCSVData();

  return {
    summary: {
      customers: customers.length,
      records: records.length,
      tasks: tasks.length,
      audioFiles: audioData.length,
      csvRows: csvData.customers.split('\n').length - 1, // 排除標題行
    },
    data: {
      customers,
      records,
      tasks,
      audioData,
      csvData },
    validation: {
      customersHaveValidEmails: customers.every(c => c.email?.includes('@')),
      customersHaveValidPhones: customers.every(c => c.phone?.match(/^09\d{8}$/)),
      recordsHaveCustomers: records.every(r => r.customerIds && r.customerIds.length > 0),
      tasksHaveValidPriorities: tasks.every(t => ['low', 'medium', 'high', 'urgent'].includes(t.priority!)),
      audioHasTranscriptions: audioData.every(a => a.transcription.length > 0) } };
};

// 生成完整測試資料集
export const generateCompleteTestDataSet = () => {
  return validateTestData();
};