/**
 * 測試資料生成器
 */

import { User } from '@/types/user';
import { DatabaseType } from '@/types/import';
import { DepartmentAssignmentRule } from '@/types/assignment';

/**
 * 生成測試客戶資料
 */
export function generateTestData(count: number): any[] {
  return Array.from({ length: count }, (_, i) => ({
    name: `客戶${i}`,
    company: `公司${i}`,
    email: `customer${i}@test.com`,
    phone: `0900${String(i).padStart(6, '0')}`,
    address: `地址${i}`,
    tags: `標籤${i % 5}`,
    notes: `備註${i}`,
    assignee: i % 3 === 0 ? '張三' : i % 3 === 1 ? '李四' : 'John Doe',
    department: i % 2 === 0 ? '業務部' : '管理部',
    customerType: i % 10 === 0 ? 'vip' : i % 5 === 0 ? 'enterprise' : 'standard',
    region: i % 4 === 0 ? 'north' : i % 4 === 1 ? 'south' : i % 4 === 2 ? 'east' : 'west'
  }));
}

/**
 * 生成測試用戶資料
 */
export function generateTestUsers(count: number): User[] {
  const departments = ['業務部', '管理部', '技術部', '行銷部', '財務部'];
  const roles = ['salesperson', 'manager', 'admin'] as const;
  
  return Array.from({ length: count }, (_, i) => ({
    id: `user${i}`,
    uid: `user${i}`,
    name: `用戶${i}`,
    email: `user${i}@test.com`,
    role: roles[i % 3],
    organizationId: 'test-org',
    teamIds: [`team${i % 3}`],
    managedTeamIds: i % 3 === 1 ? [`team${i % 3}`] : undefined,
    isActive: i % 10 !== 9, // 10% 非活躍用戶
    createdAt: new Date(2024, 0, 1 + i),
    lastLoginAt: new Date(2024, 2, 1 + (i % 28)),
    phoneNumber: `09${String(10000000 + i).padStart(8, '0')}`,
    department: departments[i % 5],
    employeeId: `EMP${String(i).padStart(3, '0')}`,
    photoURL: `https://example.com/avatar/${i}.jpg`
  }));
}

/**
 * 生成測試記錄資料
 */
export function generateTestRecords(count: number): any[] {
  const types = ['會議', '電話', '郵件', '拜訪'];
  const statuses = ['待處理', '進行中', '已完成'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `record${i}`,
    title: `記錄標題${i}`,
    type: types[i % 4],
    status: statuses[i % 3],
    customer: `客戶${i % 10}`,
    date: new Date(2024, 2, 1 + (i % 28)).toISOString(),
    content: `記錄內容${i}...`.repeat(10),
    assignee: i % 3 === 0 ? '張三' : i % 3 === 1 ? '李四' : 'John Doe',
    tags: [`標籤${i % 5}`, `標籤${(i + 1) % 5}`]
  }));
}

/**
 * 生成測試任務資料
 */
export function generateTestTasks(count: number): any[] {
  const priorities = ['low', 'medium', 'high'];
  const statuses = ['pending', 'in_progress', 'completed', 'cancelled'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `task${i}`,
    title: `任務${i}`,
    description: `任務描述${i}...`,
    priority: priorities[i % 3],
    status: statuses[i % 4],
    assignee: i % 3 === 0 ? '張三' : i % 3 === 1 ? '李四' : 'John Doe',
    dueDate: new Date(2024, 3, 1 + (i % 30)).toISOString(),
    tags: [`標籤${i % 5}`],
    completed: i % 4 === 2
  }));
}

/**
 * 生成大量測試資料（用於效能測試）
 */
export function generateLargeDataset(count: number, type: DatabaseType = 'customers'): any[] {
  switch (type) {
    case 'customers':
      return generateTestData(count);
    case 'records':
      return generateTestRecords(count);
    case 'tasks':
      return generateTestTasks(count);
    case 'users':
      return generateTestUsers(count);
    default:
      return generateTestData(count);
  }
}

/**
 * 生成部門規則
 */
export function generateDepartmentRules(departmentCount: number = 5): DepartmentAssignmentRule[] {
  const departments = ['業務部', '管理部', '技術部', '行銷部', '財務部'];
  const customerTypes = ['vip', 'enterprise', 'standard', 'trial'];
  const regions = ['north', 'south', 'east', 'west', 'central'];
  
  return Array.from({ length: Math.min(departmentCount, departments.length) }, (_, i) => ({
    department: departments[i],
    conditions: {
      customerType: customerTypes[i % customerTypes.length],
      region: regions[i % regions.length]
    },
    assigneeIds: Array.from({ length: 2 + (i % 3) }, (_, j) => `user${i * 3 + j}`),
    priority: i + 1
  }));
}

/**
 * 生成混合語言測試資料
 */
export function generateMixedLanguageData(count: number): any[] {
  const names = [
    // 中文
    '張三', '李四', '王五', '趙六',
    // 英文
    'John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Brown',
    // 日文
    '田中太郎', '山田花子', '佐藤次郎', '鈴木一郎',
    // 混合
    'David 陳', 'Mary 林', 'Tom 王', 'Lisa 張'
  ];
  
  return Array.from({ length: count }, (_, i) => ({
    name: `客戶${i}`,
    company: `公司${i}`,
    assignee: names[i % names.length],
    email: `customer${i}@test.com`
  }));
}

/**
 * 生成特殊字元測試資料
 */
export function generateSpecialCharData(count: number): any[] {
  const specialNames = [
    '張@三', '李#四', '王$五', '趙%六',
    'John&Doe', 'Jane*Smith', 'Bob(Johnson)', 'Alice[Brown]',
    '用戶-測試', '客戶_資料', '公司.名稱', '部門/單位'
  ];
  
  return Array.from({ length: count }, (_, i) => ({
    name: specialNames[i % specialNames.length],
    company: `公司${i}!@#$`,
    assignee: specialNames[(i + 1) % specialNames.length],
    email: `customer.test+${i}@test.com`
  }));
}

/**
 * 生成重複名稱的用戶資料
 */
export function generateDuplicateUsers(baseName: string = '張三', count: number = 5): User[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `dup_user${i}`,
    uid: `dup_user${i}`,
    name: baseName, // 相同名稱
    email: `${baseName.toLowerCase().replace(/\s/g, '')}${i}@test.com`,
    role: 'salesperson',
    organizationId: 'test-org',
    teamIds: [`team${i % 3}`],
    isActive: true,
    createdAt: new Date(2024, 0, 1 + i),
    lastLoginAt: new Date(2024, 2, 1),
    phoneNumber: `09${String(20000000 + i).padStart(8, '0')}`,
    department: '業務部',
    employeeId: `DUP${String(i).padStart(3, '0')}`
  }));
}

/**
 * 生成無效分配資料（用於錯誤測試）
 */
export function generateInvalidAssignmentData(count: number): any[] {
  return Array.from({ length: count }, (_, i) => ({
    name: i % 3 === 0 ? null : `客戶${i}`,
    company: i % 4 === 0 ? undefined : `公司${i}`,
    assignee: i % 5 === 0 ? '' : i % 5 === 1 ? null : 'NonExistentUser',
    email: i % 6 === 0 ? 'invalid-email' : `customer${i}@test.com`
  }));
}

/**
 * 生成效能測試資料集
 */
export function generatePerformanceTestData(size: 'small' | 'medium' | 'large' | 'xlarge' = 'medium'): {
  data: any[],
  users: User[],
  expectedTime: number
} {
  const sizes = {
    small: { dataCount: 100, userCount: 10, expectedTime: 1000 },
    medium: { dataCount: 1000, userCount: 50, expectedTime: 3000 },
    large: { dataCount: 10000, userCount: 100, expectedTime: 10000 },
    xlarge: { dataCount: 100000, userCount: 500, expectedTime: 30000 }
  };
  
  const config = sizes[size];
  
  return {
    data: generateTestData(config.dataCount),
    users: generateTestUsers(config.userCount),
    expectedTime: config.expectedTime
  };
}