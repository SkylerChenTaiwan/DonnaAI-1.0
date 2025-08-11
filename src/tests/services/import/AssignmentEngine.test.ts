/**
 * AssignmentEngine 單元測試
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AssignmentEngine } from '@/services/import/AssignmentEngine';
import { UserMatcher } from '@/services/import/UserMatcher';
import { 
  mockUsers, 
  mockCSVData,
  mockDepartmentRules,
  mockAssignmentConfig,
  edgeCaseData
} from '../../utils/assignmentMocks';
import { 
  generateTestData, 
  generateTestUsers,
  generateLargeDataset 
} from '../../utils/testDataGenerator';
import { ImportAssignmentConfig } from '@/types/assignment';

// Mock Firebase
vi.mock('@/services/firebase/config', () => ({
  getFirebaseDb: vi.fn(() => ({}))
}));

// Mock Firestore functions
const mockGetDocs = vi.fn(() => ({
  forEach: vi.fn((callback: any) => {
    mockUsers.forEach(user => {
      callback({ id: user.id, data: () => user });
    });
  })
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: mockGetDocs,
  doc: vi.fn(),
  getDoc: vi.fn()
}));

// Mock UserMatcher
vi.mock('@/services/import/UserMatcher');

describe('AssignmentEngine', () => {
  let engine: AssignmentEngine;
  let mockUserMatcher: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Setup UserMatcher mock
    mockUserMatcher = {
      findBestMatch: vi.fn()
    };
    vi.mocked(UserMatcher).mockImplementation(() => mockUserMatcher);
    
    engine = new AssignmentEngine('test-org');
    await engine.initialize();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialize', () => {
    it('應該正確初始化並載入組織用戶', async () => {
      const newEngine = new AssignmentEngine('test-org');
      await newEngine.initialize();
      
      // 驗證已載入用戶
      const preview = await newEngine.generatePreview([], {
        strategy: 'single_user',
        assigneeId: 'user1'
      });
      
      expect(preview).toBeDefined();
    });

    it('應該處理無用戶的組織', async () => {
      mockGetDocs.mockResolvedValueOnce({
        forEach: vi.fn()
      } as any);
      
      const newEngine = new AssignmentEngine('empty-org');
      await newEngine.initialize();
      
      const preview = await newEngine.generatePreview(mockCSVData, {
        strategy: 'single_user',
        assigneeId: 'user1'
      });
      
      expect(preview).toEqual([]);
    });
  });

  describe('generatePreview', () => {
    describe('single_user 策略', () => {
      it('應該將所有資料分配給單一用戶', async () => {
        const config: ImportAssignmentConfig = {
          strategy: 'single_user',
          assigneeId: 'user1'
        };
        
        const preview = await engine.generatePreview(mockCSVData, config);
        
        expect(preview).toHaveLength(1);
        expect(preview[0].userId).toBe('user1');
        expect(preview[0].assignedCount).toBe(mockCSVData.length);
        expect(preview[0].workloadPercentage).toBe(100);
      });

      it('應該處理無效的 assigneeId', async () => {
        const config: ImportAssignmentConfig = {
          strategy: 'single_user',
          assigneeId: 'invalid-user'
        };
        
        const preview = await engine.generatePreview(mockCSVData, config);
        
        expect(preview).toEqual([]);
      });
    });

    describe('round_robin 策略', () => {
      it('應該平均分配資料給多個用戶', async () => {
        const config: ImportAssignmentConfig = {
          strategy: 'round_robin',
          assigneeIds: ['user1', 'user2', 'user3']
        };
        
        const preview = await engine.generatePreview(mockCSVData, config);
        
        expect(preview).toHaveLength(3);
        
        // 驗證分配是否平均
        const counts = preview.map(p => p.assignedCount);
        const min = Math.min(...counts);
        const max = Math.max(...counts);
        expect(max - min).toBeLessThanOrEqual(1);
        
        // 驗證總數
        const total = preview.reduce((sum, p) => sum + p.assignedCount, 0);
        expect(total).toBe(mockCSVData.length);
      });

      it('應該處理空的 assigneeIds', async () => {
        const config: ImportAssignmentConfig = {
          strategy: 'round_robin',
          assigneeIds: []
        };
        
        const preview = await engine.generatePreview(mockCSVData, config);
        
        expect(preview).toEqual([]);
      });
    });

    describe('csv_column 策略', () => {
      it('應該根據 CSV 欄位分配資料', async () => {
        mockUserMatcher.findBestMatch
          .mockReturnValueOnce({ user: mockUsers[0], confidence: 100 })
          .mockReturnValueOnce({ user: mockUsers[0], confidence: 85 })
          .mockReturnValueOnce({ user: mockUsers[2], confidence: 90 })
          .mockReturnValueOnce({ user: mockUsers[1], confidence: 95 })
          .mockReturnValueOnce({ user: mockUsers[2], confidence: 80 });
        
        const config: ImportAssignmentConfig = {
          strategy: 'csv_column',
          csvColumn: 'assignee',
          matchingStrategy: 'smart'
        };
        
        const preview = await engine.generatePreview(mockCSVData, config);
        
        expect(preview.length).toBeGreaterThan(0);
        expect(mockUserMatcher.findBestMatch).toHaveBeenCalledTimes(mockCSVData.length);
      });

      it('應該處理不存在的 CSV 欄位', async () => {
        const config: ImportAssignmentConfig = {
          strategy: 'csv_column',
          csvColumn: 'nonexistent_column'
        };
        
        const preview = await engine.generatePreview(mockCSVData, config);
        
        expect(preview).toEqual([]);
      });

      it('應該使用預設用戶處理無法匹配的資料', async () => {
        mockUserMatcher.findBestMatch.mockReturnValue(null);
        
        const config: ImportAssignmentConfig = {
          strategy: 'csv_column',
          csvColumn: 'assignee',
          defaultAssignee: 'user3'
        };
        
        const preview = await engine.generatePreview(mockCSVData, config);
        
        expect(preview).toHaveLength(1);
        expect(preview[0].userId).toBe('user3');
        expect(preview[0].assignedCount).toBe(mockCSVData.length);
      });
    });

    describe('department_rule 策略', () => {
      it('應該根據部門規則分配資料', async () => {
        const testData = [
          { name: '客戶A', customerType: 'enterprise', region: 'north' },
          { name: '客戶B', customerType: 'vip', region: 'south' },
          { name: '客戶C', customerType: 'standard', region: 'east' }
        ];
        
        const config: ImportAssignmentConfig = {
          strategy: 'department_rule',
          departmentRules: mockDepartmentRules
        };
        
        const preview = await engine.generatePreview(testData, config);
        
        expect(preview.length).toBeGreaterThan(0);
      });

      it('應該處理無匹配規則的資料', async () => {
        const testData = [
          { name: '客戶A', customerType: 'unknown', region: 'unknown' }
        ];
        
        const config: ImportAssignmentConfig = {
          strategy: 'department_rule',
          departmentRules: mockDepartmentRules,
          defaultAssignee: 'user4'
        };
        
        const preview = await engine.generatePreview(testData, config);
        
        expect(preview).toHaveLength(1);
        expect(preview[0].userId).toBe('user4');
      });
    });

    describe('manual_mapping 策略', () => {
      it('應該根據手動映射分配資料', async () => {
        const config: ImportAssignmentConfig = {
          strategy: 'manual_mapping',
          assigneeMapping: new Map([
            ['客戶A', 'user1'],
            ['客戶B', 'user2'],
            ['客戶C', 'user3']
          ])
        };
        
        const testData = [
          { name: '客戶A' },
          { name: '客戶B' },
          { name: '客戶C' }
        ];
        
        const preview = await engine.generatePreview(testData, config);
        
        expect(preview).toHaveLength(3);
        expect(preview.find(p => p.userId === 'user1')?.assignedCount).toBe(1);
        expect(preview.find(p => p.userId === 'user2')?.assignedCount).toBe(1);
        expect(preview.find(p => p.userId === 'user3')?.assignedCount).toBe(1);
      });

      it('應該處理無映射的資料', async () => {
        const config: ImportAssignmentConfig = {
          strategy: 'manual_mapping',
          assigneeMapping: new Map([
            ['客戶A', 'user1']
          ]),
          defaultAssignee: 'user2'
        };
        
        const testData = [
          { name: '客戶A' },
          { name: '客戶B' },
          { name: '客戶C' }
        ];
        
        const preview = await engine.generatePreview(testData, config);
        
        expect(preview).toHaveLength(2);
        expect(preview.find(p => p.userId === 'user1')?.assignedCount).toBe(1);
        expect(preview.find(p => p.userId === 'user2')?.assignedCount).toBe(2);
      });
    });
  });

  describe('executeAssignment', () => {
    it('應該執行分配並返回結果', async () => {
      const config: ImportAssignmentConfig = {
        strategy: 'round_robin',
        assigneeIds: ['user1', 'user2']
      };
      
      const result = await engine.executeAssignment(mockCSVData, config);
      
      expect(result).toHaveLength(2);
      expect(result[0].assigneeId).toBe('user1');
      expect(result[1].assigneeId).toBe('user2');
      
      // 驗證總數
      const total = result.reduce((sum, r) => sum + r.items.length, 0);
      expect(total).toBe(mockCSVData.length);
    });

    it('應該包含正確的信心度分數', async () => {
      mockUserMatcher.findBestMatch.mockReturnValue({
        user: mockUsers[0],
        confidence: 85
      });
      
      const config: ImportAssignmentConfig = {
        strategy: 'csv_column',
        csvColumn: 'assignee'
      };
      
      const result = await engine.executeAssignment(mockCSVData, config);
      
      expect(result[0].confidence).toBeDefined();
      expect(result[0].confidence).toBeGreaterThan(0);
      expect(result[0].confidence).toBeLessThanOrEqual(100);
    });

    it('應該處理 skipUnassigned 選項', async () => {
      mockUserMatcher.findBestMatch.mockReturnValue(null);
      
      const config: ImportAssignmentConfig = {
        strategy: 'csv_column',
        csvColumn: 'assignee',
        skipUnassigned: true
      };
      
      const result = await engine.executeAssignment(mockCSVData, config);
      
      expect(result).toEqual([]);
    });
  });

  describe('validateAssignment', () => {
    it('應該驗證有效的分配', async () => {
      const config: ImportAssignmentConfig = {
        strategy: 'single_user',
        assigneeId: 'user1'
      };
      
      const validation = await engine.validateAssignment(mockCSVData, config);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.stats.totalData).toBe(mockCSVData.length);
      expect(validation.stats.assignedData).toBe(mockCSVData.length);
    });

    it('應該檢測無效的配置', async () => {
      const config: ImportAssignmentConfig = {
        strategy: 'single_user',
        assigneeId: undefined as any
      };
      
      const validation = await engine.validateAssignment(mockCSVData, config);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('應該警告未分配的資料', async () => {
      mockUserMatcher.findBestMatch.mockReturnValue(null);
      
      const config: ImportAssignmentConfig = {
        strategy: 'csv_column',
        csvColumn: 'assignee'
      };
      
      const validation = await engine.validateAssignment(mockCSVData, config);
      
      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.stats.unassignedData).toBeGreaterThan(0);
    });
  });

  describe('邊界情況處理', () => {
    it('應該處理空資料集', async () => {
      const config: ImportAssignmentConfig = {
        strategy: 'round_robin',
        assigneeIds: ['user1', 'user2']
      };
      
      const preview = await engine.generatePreview([], config);
      
      expect(preview).toEqual([]);
    });

    it('應該處理無效的策略', async () => {
      const config: ImportAssignmentConfig = {
        strategy: 'invalid_strategy' as any
      };
      
      const preview = await engine.generatePreview(mockCSVData, config);
      
      expect(preview).toEqual([]);
    });

    it('應該處理非活躍用戶', async () => {
      const inactiveUsers = mockUsers.map(u => ({ ...u, isActive: false }));
      mockGetDocs.mockResolvedValueOnce({
        forEach: vi.fn((callback: any) => {
          inactiveUsers.forEach(user => {
            callback({ id: user.id, data: () => user });
          });
        })
      } as any);
      
      const newEngine = new AssignmentEngine('test-org');
      await newEngine.initialize();
      
      const config: ImportAssignmentConfig = {
        strategy: 'single_user',
        assigneeId: 'user1'
      };
      
      const preview = await newEngine.generatePreview(mockCSVData, config);
      
      expect(preview).toEqual([]);
    });

    it('應該處理混合語言資料', async () => {
      const mixedData = edgeCaseData.mixedLanguageData;
      
      mockUserMatcher.findBestMatch
        .mockReturnValueOnce({ user: mockUsers[0], confidence: 100 })
        .mockReturnValueOnce({ user: mockUsers[2], confidence: 90 })
        .mockReturnValueOnce({ user: mockUsers[1], confidence: 85 });
      
      const config: ImportAssignmentConfig = {
        strategy: 'csv_column',
        csvColumn: 'assignee'
      };
      
      const preview = await engine.generatePreview(mixedData, config);
      
      expect(preview.length).toBeGreaterThan(0);
    });

    it('應該處理特殊字元資料', async () => {
      const specialData = edgeCaseData.specialCharData;
      
      mockUserMatcher.findBestMatch.mockReturnValue({
        user: mockUsers[0],
        confidence: 70
      });
      
      const config: ImportAssignmentConfig = {
        strategy: 'csv_column',
        csvColumn: 'assignee'
      };
      
      const preview = await engine.generatePreview(specialData, config);
      
      expect(preview.length).toBeGreaterThan(0);
    });
  });

  describe('效能測試', () => {
    it('應該在合理時間內處理大量資料', async () => {
      const largeData = generateLargeDataset(1000);
      const config: ImportAssignmentConfig = {
        strategy: 'round_robin',
        assigneeIds: ['user1', 'user2', 'user3']
      };
      
      const startTime = performance.now();
      const preview = await engine.generatePreview(largeData, config);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(1000); // 1秒內
      expect(preview).toHaveLength(3);
      
      const total = preview.reduce((sum, p) => sum + p.assignedCount, 0);
      expect(total).toBe(largeData.length);
    });

    it('應該高效處理多用戶輪流分配', async () => {
      const data = generateTestData(500);
      const users = generateTestUsers(50);
      const config: ImportAssignmentConfig = {
        strategy: 'round_robin',
        assigneeIds: users.map(u => u.id)
      };
      
      const startTime = performance.now();
      const result = await engine.executeAssignment(data, config);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(500); // 0.5秒內
      expect(result).toHaveLength(50);
    });
  });
});