/**
 * assignmentHistory 服務單元測試
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  createAssignmentHistory,
  createBatchAssignmentHistory,
  getAssignmentHistory,
  getUserAssignmentHistory,
  getOrganizationAssignmentHistory,
  getImportSessionAssignmentHistory,
  generateAssignmentReport,
  getAssignmentStatistics
} from '@/services/firebase/assignmentHistory';
import { AssignmentHistory, AssignmentReport } from '@/types/assignment';
import { Timestamp } from 'firebase/firestore';
import * as permissions from '@/services/firebase/permissions';

// 使用 vi.hoisted 確保 mock 函數在模組載入前就存在
const { mockDoc, mockCollection, mockSetDoc, mockGetDoc, mockGetDocs, mockQuery, mockWhere, mockOrderBy, mockLimit, mockServerTimestamp, mockDb } = vi.hoisted(() => {
  const mockDoc = vi.fn();
  const mockCollection = vi.fn();
  const mockSetDoc = vi.fn();
  const mockGetDoc = vi.fn();
  const mockGetDocs = vi.fn();
  const mockQuery = vi.fn();
  const mockWhere = vi.fn();
  const mockOrderBy = vi.fn();
  const mockLimit = vi.fn();
  const mockServerTimestamp = vi.fn(() => ({
    toDate: () => new Date(),
    toMillis: () => Date.now(),
    seconds: Math.floor(Date.now() / 1000),
    nanoseconds: 0
  }));
  
  const mockDb = {
    collection: mockCollection
  };
  
  return {
    mockDoc,
    mockCollection,
    mockSetDoc,
    mockGetDoc,
    mockGetDocs,
    mockQuery,
    mockWhere,
    mockOrderBy,
    mockLimit,
    mockServerTimestamp,
    mockDb
  };
});

// Mock Firebase
vi.mock('@/services/firebase/config', () => ({
  getFirebaseDb: vi.fn(() => mockDb)
}));

vi.mock('firebase/firestore', () => ({
  collection: mockCollection,
  doc: mockDoc,
  setDoc: mockSetDoc,
  getDoc: mockGetDoc,
  getDocs: mockGetDocs,
  query: mockQuery,
  where: mockWhere,
  orderBy: mockOrderBy,
  limit: mockLimit,
  serverTimestamp: mockServerTimestamp,
  Timestamp: {
    now: vi.fn(() => ({
      toDate: () => new Date(),
      toMillis: () => Date.now(),
      seconds: Math.floor(Date.now() / 1000),
      nanoseconds: 0
    })),
    fromDate: vi.fn((date: Date) => ({
      toDate: () => date,
      toMillis: () => date.getTime(),
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: 0
    }))
  }
}));

// Mock 權限模組
vi.mock('@/services/firebase/permissions', () => ({
  canAccessAssignmentHistory: vi.fn()
}));

describe('assignmentHistory Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // 設定預設 mock 返回值
    mockDoc.mockReturnValue({ id: 'test-doc-id' });
    mockCollection.mockReturnValue({ id: 'test-collection' });
    mockSetDoc.mockResolvedValue(undefined);
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: 'test-doc-id',
      data: () => ({
        id: 'test-doc-id',
        organizationId: 'test-org',
        assigneeId: 'user1',
        assignerId: 'admin1',
        dataType: 'customers',
        dataCount: 10,
        assignedAt: Timestamp.now()
      })
    });
    mockGetDocs.mockResolvedValue({
      forEach: vi.fn((callback: any) => {
        // 模擬多筆資料
        [1, 2, 3].forEach(i => {
          callback({
            id: `history-${i}`,
            data: () => ({
              id: `history-${i}`,
              organizationId: 'test-org',
              assigneeId: `user${i}`,
              assignerId: 'admin1',
              dataType: 'customers',
              dataCount: 10 * i,
              assignedAt: Timestamp.now(),
              strategy: 'round_robin',
              successRate: 90 + i
            })
          });
        });
      })
    });
    mockQuery.mockReturnValue('mock-query');
    mockWhere.mockReturnValue('mock-where');
    mockOrderBy.mockReturnValue('mock-orderby');
    mockLimit.mockReturnValue('mock-limit');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createAssignmentHistory', () => {
    it('應該成功建立分配歷史記錄', async () => {
      const historyData = {
        organizationId: 'test-org',
        importSessionId: 'import-123',
        dataType: 'customers' as const,
        dataCount: 50,
        assignerId: 'admin1',
        assignerName: 'Admin User',
        assigneeId: 'user1',
        assigneeName: '張三',
        strategy: 'round_robin' as const,
        successRate: 95,
        errors: []
      };

      const result = await createAssignmentHistory(historyData);

      expect(result).toBe('test-doc-id');
      expect(mockDoc).toHaveBeenCalled();
      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          ...historyData,
          id: 'test-doc-id',
          assignedAt: expect.anything()
        })
      );
    });

    it('應該處理建立失敗的情況', async () => {
      mockSetDoc.mockRejectedValueOnce(new Error('Firebase error'));

      const historyData = {
        organizationId: 'test-org',
        importSessionId: 'import-123',
        dataType: 'customers' as const,
        dataCount: 50,
        assignerId: 'admin1',
        assignerName: 'Admin User',
        assigneeId: 'user1',
        assigneeName: '張三',
        strategy: 'single_user' as const
      };

      await expect(createAssignmentHistory(historyData)).rejects.toThrow('無法建立分配歷史記錄');
    });
  });

  describe('createBatchAssignmentHistory', () => {
    it('應該批量建立分配歷史記錄', async () => {
      const histories = [
        {
          organizationId: 'test-org',
          importSessionId: 'import-123',
          dataType: 'customers' as const,
          dataCount: 25,
          assignerId: 'admin1',
          assignerName: 'Admin User',
          assigneeId: 'user1',
          assigneeName: '張三',
          strategy: 'round_robin' as const
        },
        {
          organizationId: 'test-org',
          importSessionId: 'import-123',
          dataType: 'customers' as const,
          dataCount: 25,
          assignerId: 'admin1',
          assignerName: 'Admin User',
          assigneeId: 'user2',
          assigneeName: '李四',
          strategy: 'round_robin' as const
        }
      ];

      const result = await createBatchAssignmentHistory(histories);

      expect(result).toHaveLength(2);
      expect(result[0]).toBe('test-doc-id');
      expect(mockSetDoc).toHaveBeenCalledTimes(2);
    });

    it('應該處理空陣列', async () => {
      const result = await createBatchAssignmentHistory([]);
      
      expect(result).toEqual([]);
      expect(mockSetDoc).not.toHaveBeenCalled();
    });
  });

  describe('getAssignmentHistory', () => {
    it('應該取得有權限的分配歷史', async () => {
      vi.mocked(permissions.canAccessAssignmentHistory).mockResolvedValue(true);

      const result = await getAssignmentHistory('history-1', 'user1');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('test-doc-id');
      expect(permissions.canAccessAssignmentHistory).toHaveBeenCalledWith('user1', 'history-1');
    });

    it('應該拒絕無權限的存取', async () => {
      vi.mocked(permissions.canAccessAssignmentHistory).mockResolvedValue(false);

      await expect(getAssignmentHistory('history-1', 'unauthorized-user'))
        .rejects.toThrow('沒有權限查看此分配歷史');
    });

    it('應該處理不存在的記錄', async () => {
      vi.mocked(permissions.canAccessAssignmentHistory).mockResolvedValue(true);
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false
      });

      const result = await getAssignmentHistory('non-existent', 'user1');

      expect(result).toBeNull();
    });
  });

  describe('getUserAssignmentHistory', () => {
    it('應該取得用戶作為被分配者的歷史', async () => {
      const result = await getUserAssignmentHistory('user1', 'assignee', 10);

      expect(mockQuery).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalledWith('assigneeId', '==', 'user1');
      expect(mockOrderBy).toHaveBeenCalledWith('assignedAt', 'desc');
      expect(mockLimit).toHaveBeenCalledWith(10);
      expect(result).toHaveLength(3); // 根據 mock 資料
    });

    it('應該取得用戶作為分配者的歷史', async () => {
      const result = await getUserAssignmentHistory('admin1', 'assigner', 10);

      expect(mockWhere).toHaveBeenCalledWith('assignerId', '==', 'admin1');
      expect(result).toHaveLength(3);
    });

    it('應該取得用戶的所有相關歷史', async () => {
      const result = await getUserAssignmentHistory('user1', 'both', 20);

      // 應該查詢兩次（assignee 和 assigner）
      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(mockGetDocs).toHaveBeenCalledTimes(2);
      expect(result).toBeDefined();
    });
  });

  describe('getOrganizationAssignmentHistory', () => {
    it('應該取得組織的分配歷史', async () => {
      const result = await getOrganizationAssignmentHistory('test-org', {
        dataType: 'customers',
        limitCount: 50
      });

      expect(mockWhere).toHaveBeenCalledWith('organizationId', '==', 'test-org');
      expect(mockWhere).toHaveBeenCalledWith('dataType', '==', 'customers');
      expect(mockLimit).toHaveBeenCalledWith(50);
      expect(result).toHaveLength(3);
    });

    it('應該支援日期範圍篩選', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      await getOrganizationAssignmentHistory('test-org', {
        startDate,
        endDate
      });

      expect(mockWhere).toHaveBeenCalledWith(
        'assignedAt',
        '>=',
        expect.anything()
      );
      expect(mockWhere).toHaveBeenCalledWith(
        'assignedAt',
        '<=',
        expect.anything()
      );
    });

    it('應該處理無選項的查詢', async () => {
      const result = await getOrganizationAssignmentHistory('test-org');

      expect(mockWhere).toHaveBeenCalledWith('organizationId', '==', 'test-org');
      expect(mockOrderBy).toHaveBeenCalledWith('assignedAt', 'desc');
      expect(result).toHaveLength(3);
    });
  });

  describe('getImportSessionAssignmentHistory', () => {
    it('應該取得匯入會話的分配歷史', async () => {
      const result = await getImportSessionAssignmentHistory('import-123');

      expect(mockWhere).toHaveBeenCalledWith('importSessionId', '==', 'import-123');
      expect(mockOrderBy).toHaveBeenCalledWith('assignedAt', 'desc');
      expect(result).toHaveLength(3);
    });
  });

  describe('generateAssignmentReport', () => {
    it('應該生成分配報告', async () => {
      const result = await generateAssignmentReport(
        'import-123',
        'test-org',
        'admin1'
      );

      expect(result).toBeDefined();
      expect(result.importSessionId).toBe('import-123');
      expect(result.organizationId).toBe('test-org');
      expect(result.createdBy).toBe('admin1');
      expect(result.summary).toBeDefined();
      expect(result.summary.totalImported).toBe(60); // 10 + 20 + 30
      expect(result.summary.totalAssigned).toBe(60);
      expect(result.summary.topAssignees).toHaveLength(3);
    });

    it('應該處理無分配歷史的情況', async () => {
      mockGetDocs.mockResolvedValueOnce({
        forEach: vi.fn() // 空結果
      });

      await expect(generateAssignmentReport('empty-session', 'test-org', 'admin1'))
        .rejects.toThrow('找不到相關的分配歷史');
    });

    it('應該正確計算統計資料', async () => {
      mockGetDocs.mockResolvedValueOnce({
        forEach: vi.fn((callback: any) => {
          // 模擬有錯誤的資料
          callback({
            id: 'history-with-errors',
            data: () => ({
              id: 'history-with-errors',
              organizationId: 'test-org',
              assigneeId: 'user1',
              assigneeName: '張三',
              assignerId: 'admin1',
              dataType: 'customers',
              dataCount: 100,
              assignedAt: Timestamp.now(),
              strategy: 'csv_column',
              successRate: 75,
              errors: ['Error 1', 'Error 2']
            })
          });
        })
      });

      const result = await generateAssignmentReport(
        'import-with-errors',
        'test-org',
        'admin1'
      );

      expect(result.summary.averageConfidence).toBe(75);
      expect(result.errors).toHaveLength(2);
    });
  });

  describe('getAssignmentStatistics', () => {
    it('應該取得分配統計資料', async () => {
      const result = await getAssignmentStatistics('test-org');

      expect(result).toBeDefined();
      expect(result.totalAssignments).toBe(3);
      expect(result.totalDataAssigned).toBe(60);
      expect(result.uniqueAssignees).toBe(3);
      expect(result.averagePerAssignee).toBe(20);
      expect(result.topAssignees).toHaveLength(3);
    });

    it('應該支援日期範圍', async () => {
      const dateRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-12-31')
      };

      await getAssignmentStatistics('test-org', dateRange);

      expect(mockWhere).toHaveBeenCalledWith(
        'assignedAt',
        '>=',
        expect.anything()
      );
      expect(mockWhere).toHaveBeenCalledWith(
        'assignedAt',
        '<=',
        expect.anything()
      );
    });

    it('應該正確分類資料類型和策略', async () => {
      mockGetDocs.mockResolvedValueOnce({
        forEach: vi.fn((callback: any) => {
          // 模擬不同類型和策略的資料
          const histories = [
            { dataType: 'customers', strategy: 'single_user', dataCount: 10 },
            { dataType: 'customers', strategy: 'round_robin', dataCount: 20 },
            { dataType: 'records', strategy: 'csv_column', dataCount: 15 },
            { dataType: 'tasks', strategy: 'department_rule', dataCount: 5 }
          ];
          
          histories.forEach((history, i) => {
            callback({
              id: `history-${i}`,
              data: () => ({
                ...history,
                id: `history-${i}`,
                organizationId: 'test-org',
                assigneeId: `user${i % 2 + 1}`,
                assignerId: 'admin1',
                assignedAt: Timestamp.now()
              })
            });
          });
        })
      });

      const result = await getAssignmentStatistics('test-org');

      expect(result.byDataType.customers).toBe(30);
      expect(result.byDataType.records).toBe(15);
      expect(result.byDataType.tasks).toBe(5);
      expect(result.byStrategy.single_user).toBe(1);
      expect(result.byStrategy.round_robin).toBe(1);
      expect(result.byStrategy.csv_column).toBe(1);
      expect(result.byStrategy.department_rule).toBe(1);
    });
  });

  describe('錯誤處理', () => {
    it('應該處理 Firebase 連線錯誤', async () => {
      mockGetDocs.mockRejectedValueOnce(new Error('Network error'));

      await expect(getUserAssignmentHistory('user1'))
        .rejects.toThrow('無法取得用戶分配歷史');
    });

    it('應該處理無效的資料格式', async () => {
      mockGetDocs.mockResolvedValueOnce({
        forEach: vi.fn((callback: any) => {
          callback({
            id: 'invalid-data',
            data: () => null // 無效資料
          });
        })
      });

      const result = await getUserAssignmentHistory('user1');
      
      // 應該略過無效資料
      expect(result).toBeDefined();
    });
  });
});