/**
 * 建立測試任務的工具腳本
 */

import { Timestamp } from 'firebase/firestore';
import { createTask } from '@/services/firebase/tasks';
import { TaskCreateRequest } from '@/types/task';

export async function createTestTask(userId: string, organizationId: string) {
  console.log('📝 建立測試任務...');
  
  const testTask: TaskCreateRequest = {
    title: 'NotionTable 測試任務',
    description: '這是一個用來測試 NotionTable 元件的任務',
    status: 'todo',
    priority: 'medium',
    dueDate: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 一週後
    assigneeId: userId,
    organizationId: organizationId,
    tags: ['測試', 'NotionTable'],
  };
  
  try {
    const result = await createTask(testTask, userId);
    console.log('✅ 測試任務建立成功:', result);
    return result;
  } catch (error) {
    console.error('❌ 建立測試任務失敗:', error);
    throw error;
  }
}

// 在瀏覽器控制台執行的函數
(window as any).createTestTask = async () => {
  const user = JSON.parse(localStorage.getItem('auth-store') || '{}')?.state?.user;
  if (!user) {
    console.error('請先登入');
    return;
  }
  
  await createTestTask(user.id, user.organizationId);
  console.log('🔄 請重新整理頁面查看新任務');
};