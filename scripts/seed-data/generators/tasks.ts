/**
 * 任務資料生成器
 * 產生符合真實情境的任務測試資料
 */

import { faker } from '@faker-js/faker/locale/zh_TW';
import * as admin from 'firebase-admin';
import { generateId, getTimestamp, getBatch } from '../utils/firebase';

export interface TaskData {
  id: string;
  title: string;
  description?: string;
  type: 'scheduled' | 'unscheduled' | 'pending';
  scheduledAt?: admin.firestore.Timestamp;
  dueDate?: admin.firestore.Timestamp;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  assigneeId: string;
  assignerId?: string;
  customerIds?: string[];
  recordId?: string;
  source: 'manual' | 'ai_extracted' | 'calendar_sync';
  tags?: string[];
  teamId: string;
  organizationId: string;
  completedAt?: admin.firestore.Timestamp;
  completedBy?: string;
  createdAt: admin.firestore.FieldValue;
  updatedAt: admin.firestore.FieldValue;
  createdBy: string;
}

/**
 * 產生單個任務資料
 */
export function generateTask(
  userId: string,
  teamId: string,
  organizationId: string,
  customerIds: string[]
): TaskData {
  const taskId = generateId('task');
  const status = faker.helpers.weightedArrayElement([
    { value: 'todo' as const, weight: 40 },
    { value: 'in_progress' as const, weight: 30 },
    { value: 'completed' as const, weight: 25 },
    { value: 'cancelled' as const, weight: 5 }
  ]);
  
  const type = faker.helpers.arrayElement(['scheduled', 'unscheduled', 'pending'] as const);
  const priority = faker.helpers.weightedArrayElement([
    { value: 'low' as const, weight: 20 },
    { value: 'medium' as const, weight: 50 },
    { value: 'high' as const, weight: 25 },
    { value: 'urgent' as const, weight: 5 }
  ]);
  
  const taskData: TaskData = {
    id: taskId,
    title: generateTaskTitle(),
    description: faker.helpers.maybe(() => generateTaskDescription(), { probability: 0.7 }),
    type,
    priority,
    status,
    assigneeId: userId,
    assignerId: userId, // 自己指派給自己
    source: 'manual',
    teamId,
    organizationId,
    tags: generateTaskTags(),
    createdAt: getTimestamp(),
    updatedAt: getTimestamp(),
    createdBy: userId
  };
  
  // 根據類型設定時間
  if (type === 'scheduled') {
    taskData.scheduledAt = admin.firestore.Timestamp.fromDate(
      faker.date.future({ years: 0.1 })
    );
  }
  
  // 設定截止日期（80% 機率）
  if (faker.datatype.boolean({ probability: 0.8 })) {
    taskData.dueDate = admin.firestore.Timestamp.fromDate(
      faker.date.future({ years: 0.2 })
    );
  }
  
  // 關聯客戶（60% 機率）
  if (faker.datatype.boolean({ probability: 0.6 }) && customerIds.length > 0) {
    taskData.customerIds = faker.helpers.arrayElements(
      customerIds,
      { min: 1, max: Math.min(2, customerIds.length) }
    );
  }
  
  // 如果是已完成狀態，加入完成資訊
  if (status === 'completed') {
    const completedDate = faker.date.recent({ days: 7 });
    taskData.completedAt = admin.firestore.Timestamp.fromDate(completedDate);
    taskData.completedBy = userId;
  }
  
  return taskData;
}

/**
 * 產生任務標題
 */
function generateTaskTitle(): string {
  const titles = [
    // 客戶相關
    '聯繫客戶確認需求',
    '準備客戶提案簡報',
    '發送報價單給客戶',
    '安排客戶拜訪行程',
    '更新客戶資料',
    '準備客戶合約',
    '跟進客戶意見',
    
    // 業務相關
    '完成月度業績報告',
    '參加產品培訓',
    '更新銷售預測',
    '準備競爭對手分析',
    '製作產品比較表',
    '規劃下季度目標',
    
    // 行政相關
    '提交費用報銷單',
    '更新CRM資料',
    '整理會議記錄',
    '預約會議室',
    '確認出差行程',
    
    // 技術支援
    '協助客戶解決技術問題',
    '安排產品Demo',
    '提供技術文件',
    '測試新功能',
    
    // 售後服務
    '客戶滿意度調查',
    '處理客戶投訴',
    '安排售後服務',
    '收集產品反饋'
  ];
  
  return faker.helpers.arrayElement(titles);
}

/**
 * 產生任務描述
 */
function generateTaskDescription(): string {
  const descriptions = [
    '需要在本週內完成，請確保所有細節都處理妥當。',
    '這是重要客戶的需求，請優先處理。',
    '請參考上次會議記錄，確保符合客戶期待。',
    '完成後請通知相關部門同事。',
    '如有問題請隨時與主管討論。',
    faker.lorem.sentence(),
    faker.lorem.sentences(2)
  ];
  
  return faker.helpers.arrayElement(descriptions);
}

/**
 * 產生任務標籤
 */
function generateTaskTags(): string[] {
  const tags = [
    '客戶', '業務', '行政', '技術', '售後',
    '緊急', '重要', '例行', '專案',
    'Q1目標', 'Q2目標', 'Q3目標', 'Q4目標',
    '新客戶', '既有客戶', 'VIP客戶',
    '內部', '外部', '合作夥伴'
  ];
  
  return faker.helpers.arrayElements(tags, { min: 1, max: 3 });
}

/**
 * 批次建立任務資料
 */
export async function createTasks(
  db: admin.firestore.Firestore,
  userId: string,
  teamId: string,
  organizationId: string,
  customerIds: string[],
  count: number
): Promise<string[]> {
  console.log(`📝 開始建立 ${count} 個任務...`);
  
  const taskIds: string[] = [];
  const tasksRef = db.collection('tasks');
  const batchSize = 500;
  
  // 分批處理
  for (let i = 0; i < count; i += batchSize) {
    const batch = getBatch(db);
    const currentBatchSize = Math.min(batchSize, count - i);
    
    for (let j = 0; j < currentBatchSize; j++) {
      const taskData = generateTask(userId, teamId, organizationId, customerIds);
      const docRef = tasksRef.doc(taskData.id);
      
      batch.set(docRef, taskData);
      taskIds.push(taskData.id);
      
      // 顯示進度
      if ((i + j + 1) % 10 === 0) {
        console.log(`   已產生 ${i + j + 1}/${count} 個任務`);
      }
    }
    
    // 提交批次
    await batch.commit();
    console.log(`   ✅ 批次 ${Math.floor(i / batchSize) + 1} 提交成功`);
  }
  
  // 顯示任務統計
  console.log(`✅ 成功建立 ${count} 個任務`);
  
  return taskIds;
}

/**
 * 產生任務統計資訊（用於測試）
 */
export function generateTaskStats(tasks: TaskData[]): void {
  const stats = {
    total: tasks.length,
    byStatus: {
      todo: tasks.filter(t => t.status === 'todo').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      cancelled: tasks.filter(t => t.status === 'cancelled').length
    },
    byPriority: {
      urgent: tasks.filter(t => t.priority === 'urgent').length,
      high: tasks.filter(t => t.priority === 'high').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      low: tasks.filter(t => t.priority === 'low').length
    },
    withCustomers: tasks.filter(t => t.customerIds && t.customerIds.length > 0).length,
    withDueDate: tasks.filter(t => t.dueDate).length
  };
  
  console.log('\n📊 任務統計：');
  console.log(`   總數: ${stats.total}`);
  console.log(`   狀態分布: 待辦(${stats.byStatus.todo}) | 進行中(${stats.byStatus.in_progress}) | 已完成(${stats.byStatus.completed}) | 已取消(${stats.byStatus.cancelled})`);
  console.log(`   優先級分布: 緊急(${stats.byPriority.urgent}) | 高(${stats.byPriority.high}) | 中(${stats.byPriority.medium}) | 低(${stats.byPriority.low})`);
  console.log(`   關聯客戶: ${stats.withCustomers}`);
  console.log(`   有截止日期: ${stats.withDueDate}`);
}