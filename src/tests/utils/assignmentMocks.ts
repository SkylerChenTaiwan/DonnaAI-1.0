/**
 * 分配系統測試 Mock 工具函數
 */

import { vi } from 'vitest';
import { 
  ImportAssignmentConfig, 
  AssignmentPreview,
  AssignmentHistory,
  DepartmentAssignmentRule,
  AssignmentValidation,
  AssignmentAdjustment,
  AssignmentResult
} from '@/types/assignment';
import { User } from '@/types/user';
import { Timestamp } from 'firebase/firestore';

// Mock 用戶資料
export const mockUsers: User[] = [
  { 
    id: 'user1', 
    uid: 'user1',
    name: '張三', 
    email: 'zhang@test.com', 
    role: 'salesperson',
    organizationId: 'test-org',
    teamIds: ['team1'],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    lastLoginAt: new Date('2024-03-01'),
    phoneNumber: '0912345678',
    department: '業務部',
    employeeId: 'EMP001'
  },
  { 
    id: 'user2',
    uid: 'user2', 
    name: '李四', 
    email: 'li@test.com', 
    role: 'salesperson',
    organizationId: 'test-org',
    teamIds: ['team1'],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    lastLoginAt: new Date('2024-03-01'),
    phoneNumber: '0923456789',
    department: '業務部',
    employeeId: 'EMP002'
  },
  { 
    id: 'user3',
    uid: 'user3',
    name: 'John Doe', 
    email: 'john@test.com', 
    role: 'manager',
    organizationId: 'test-org',
    teamIds: ['team1', 'team2'],
    managedTeamIds: ['team1'],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    lastLoginAt: new Date('2024-03-01'),
    phoneNumber: '0934567890',
    department: '管理部',
    employeeId: 'EMP003'
  },
  {
    id: 'user4',
    uid: 'user4',
    name: '王五',
    email: 'wang@test.com',
    role: 'admin',
    organizationId: 'test-org',
    teamIds: ['team1', 'team2'],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    lastLoginAt: new Date('2024-03-01'),
    phoneNumber: '0945678901',
    department: '管理部',
    employeeId: 'EMP004'
  }
];

// Mock CSV 資料
export const mockCSVData = [
  { name: '客戶A', company: '公司A', assignee: '張三', email: 'customerA@test.com' },
  { name: '客戶B', company: '公司B', assignee: 'zhang@test.com', email: 'customerB@test.com' },
  { name: '客戶C', company: '公司C', assignee: 'John', email: 'customerC@test.com' },
  { name: '客戶D', company: '公司D', assignee: '李四', email: 'customerD@test.com' },
  { name: '客戶E', company: '公司E', assignee: 'EMP003', email: 'customerE@test.com' }
];

// Mock 部門規則
export const mockDepartmentRules: DepartmentAssignmentRule[] = [
  {
    departmentId: 'dept1',
    departmentName: '業務部',
    assigneeId: 'user1',
    assigneeName: '張三',
    priority: 1,
    conditions: [
      {
        fieldName: 'customerType',
        operator: 'equals' as const,
        value: 'enterprise'
      },
      {
        fieldName: 'region',
        operator: 'equals' as const,
        value: 'north'
      }
    ]
  },
  {
    departmentId: 'dept2',
    departmentName: '管理部',
    assigneeId: 'user3',
    assigneeName: 'John Doe',
    priority: 2,
    conditions: [
      {
        fieldName: 'customerType',
        operator: 'equals' as const,
        value: 'vip'
      }
    ]
  }
];

// Mock 分配配置
export const mockAssignmentConfig: ImportAssignmentConfig = {
  strategy: 'round_robin',
  assigneeIds: ['user1', 'user2'],
  skipUnassigned: false,
  matchingStrategy: 'smart',
  defaultAssignee: 'user3'
};

// Mock 分配預覽
export const mockAssignmentPreview: AssignmentPreview[] = [
  {
    userId: 'user1',
    userName: '張三',
    userEmail: 'zhang@test.com',
    assignedCount: 2,
    workloadPercentage: 40,
    assignedItems: [
      { rowIndex: 0, rowData: mockCSVData[0], matchConfidence: 100 },
      { rowIndex: 3, rowData: mockCSVData[3], matchConfidence: 90 }
    ]
  },
  {
    userId: 'user2',
    userName: '李四',
    userEmail: 'li@test.com',
    assignedCount: 2,
    workloadPercentage: 40,
    assignedItems: [
      { rowIndex: 1, rowData: mockCSVData[1], matchConfidence: 85 },
      { rowIndex: 4, rowData: mockCSVData[4], matchConfidence: 75 }
    ]
  },
  {
    userId: 'user3',
    userName: 'John Doe',
    userEmail: 'john@test.com',
    assignedCount: 1,
    workloadPercentage: 20,
    assignedItems: [
      { rowIndex: 2, rowData: mockCSVData[2], matchConfidence: 95 }
    ]
  }
];

// Mock 分配歷史
export const mockAssignmentHistory: AssignmentHistory = {
  id: 'history1',
  organizationId: 'test-org',
  importSessionId: 'import-123456',
  dataType: 'customers',
  dataCount: 5,
  assignerId: 'admin1',
  assignerName: 'Admin User',
  assigneeId: 'user1',
  assigneeName: '張三',
  strategy: 'csv_column',
  successRate: 90,
  assignedAt: Timestamp.now(),
  errors: []
};

// 建立 Mock AssignmentEngine
export const createMockAssignmentEngine = () => ({
  initialize: vi.fn().mockResolvedValue(undefined),
  generatePreview: vi.fn().mockResolvedValue(mockAssignmentPreview),
  executeAssignment: vi.fn().mockResolvedValue([
    {
      assigneeId: 'user1',
      assigneeName: '張三',
      items: mockCSVData.slice(0, 2),
      confidence: 95
    },
    {
      assigneeId: 'user2',
      assigneeName: '李四',
      items: mockCSVData.slice(2, 4),
      confidence: 85
    }
  ] as AssignmentResult[]),
  validateAssignment: vi.fn().mockResolvedValue({
    isValid: true,
    errors: [],
    warnings: [],
    stats: {
      totalData: 5,
      assignedData: 5,
      unassignedData: 0,
      uniqueAssignees: 2
    }
  } as AssignmentValidation)
});

// 建立 Mock UserMatcher
export const createMockUserMatcher = () => ({
  findBestMatch: vi.fn().mockReturnValue({
    user: mockUsers[0],
    confidence: 95,
    matchedField: 'name'
  }),
  findAllMatches: vi.fn().mockReturnValue([
    { user: mockUsers[0], confidence: 95, matchedField: 'name' },
    { user: mockUsers[1], confidence: 75, matchedField: 'email' }
  ]),
  normalizeString: vi.fn((str: string) => str.toLowerCase().trim()),
  levenshteinDistance: vi.fn((s1: string, s2: string) => {
    if (s1 === s2) return 0;
    return Math.abs(s1.length - s2.length) + 1;
  })
});

// 建立 Mock assignmentHistory 服務
export const createMockAssignmentHistoryService = () => ({
  createAssignmentHistory: vi.fn().mockResolvedValue('history-id-123'),
  createBatchAssignmentHistory: vi.fn().mockResolvedValue(['history-id-123', 'history-id-124']),
  getAssignmentHistory: vi.fn().mockResolvedValue(mockAssignmentHistory),
  getUserAssignmentHistory: vi.fn().mockResolvedValue([mockAssignmentHistory]),
  getOrganizationAssignmentHistory: vi.fn().mockResolvedValue([mockAssignmentHistory]),
  getImportSessionAssignmentHistory: vi.fn().mockResolvedValue([mockAssignmentHistory]),
  generateAssignmentReport: vi.fn().mockResolvedValue({
    id: 'report-123',
    createdAt: Timestamp.now(),
    createdBy: 'admin1',
    organizationId: 'test-org',
    importSessionId: 'import-123456',
    summary: {
      totalImported: 5,
      totalAssigned: 5,
      assignmentRate: 100,
      averageConfidence: 90,
      topAssignees: [
        { userId: 'user1', userName: '張三', count: 3, percentage: 60 },
        { userId: 'user2', userName: '李四', count: 2, percentage: 40 }
      ],
      strategyUsed: 'csv_column',
      duration: 2500
    },
    details: [mockAssignmentHistory],
    errors: []
  }),
  getAssignmentStatistics: vi.fn().mockResolvedValue({
    totalAssignments: 10,
    totalDataAssigned: 50,
    uniqueAssignees: 3,
    averagePerAssignee: 16.67,
    topAssignees: [
      { userId: 'user1', count: 20 },
      { userId: 'user2', count: 18 },
      { userId: 'user3', count: 12 }
    ],
    byDataType: {
      customers: 30,
      records: 15,
      tasks: 5,
      users: 0
    },
    byStrategy: {
      single_user: 2,
      round_robin: 4,
      csv_column: 3,
      department_rule: 1,
      manual_mapping: 0
    }
  })
});

// 邊界情況測試資料
export const edgeCaseData = {
  emptyData: [],
  noUsers: [],
  unauthorizedUsers: mockUsers.map(u => ({ ...u, isActive: false })),
  mixedLanguageData: [
    { name: '客戶A', assignee: '張三' },
    { name: 'Customer B', assignee: 'John Doe' },
    { name: 'クライアント C', assignee: '李四' }
  ],
  specialCharData: [
    { name: '客戶@#$', assignee: '張三!@#' },
    { name: '客戶(ABC)', assignee: 'user.name@test.com' },
    { name: '客戶[123]', assignee: '李-四' }
  ],
  duplicateUserNames: [
    { ...mockUsers[0], id: 'dup1', name: '張三' },
    { ...mockUsers[0], id: 'dup2', name: '張三' },
    { ...mockUsers[0], id: 'dup3', name: '張三' }
  ]
};

// Mock Firebase 時間戳
export const mockTimestamp = {
  now: () => ({
    toDate: () => new Date(),
    toMillis: () => Date.now(),
    seconds: Math.floor(Date.now() / 1000),
    nanoseconds: 0
  }),
  fromDate: (date: Date) => ({
    toDate: () => date,
    toMillis: () => date.getTime(),
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: 0
  })
};