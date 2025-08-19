/**
 * PRP-124: 查詢生成器單元測試
 * 
 * @description 測試動態 Firestore 查詢生成和執行功能
 * @version 1.0.0
 * @date 2025-08-19
 * @author DonnaAI Team
 */

import { QueryGenerator } from '../query-generator';
import type { QueryIntent, ExtractedEntity, DatabaseQuery } from '../../../docs/types/ai-query-data-models';

// Mock Firestore
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  getDocs: jest.fn(),
  Timestamp: {
    now: jest.fn(() => new Date()),
    fromDate: jest.fn((date) => date)
  }
}));

jest.mock('@/lib/firebase-client', () => ({
  db: {}
}));

describe('QueryGenerator', () => {
  let queryGenerator: QueryGenerator;
  
  const mockUserContext = {
    userId: 'test-user',
    organizationId: 'test-org',
    permissions: ['read:orders', 'read:customers']
  };

  beforeEach(() => {
    queryGenerator = new QueryGenerator();
    jest.clearAllMocks();
  });

  describe('generateAndExecuteQuery', () => {
    // 1. 預期使用測試
    it('should generate and execute basic metric query', async () => {
      const intent: QueryIntent = {
        primary: 'query',
        secondary: [],
        confidence: 0.9,
        entities: [
          {
            type: 'metric',
            value: '營收',
            normalizedValue: 'revenue',
            confidence: 0.9
          },
          {
            type: 'time_period',
            value: '這個月',
            normalizedValue: {
              start: new Date(2025, 7, 1),
              end: new Date(2025, 7, 31),
              granularity: 'month'
            },
            confidence: 0.8
          }
        ],
        reasoning: 'Basic revenue query',
        suggestions: []
      };

      // Mock Firestore response
      const mockSnapshot = {
        docs: [
          {
            id: 'order1',
            data: () => ({
              amount: 1000,
              customerId: 'cust1',
              createdAt: new Date()
            })
          }
        ]
      };

      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValue(mockSnapshot);

      const result = await queryGenerator.generateAndExecuteQuery(intent, mockUserContext);

      expect(result.status).toBe('success');
      expect(result.data.rows).toHaveLength(1);
      expect(result.data.columns).toBeDefined();
      expect(result.metadata.executionTime).toBeDefined();
    });

    it('should generate comparison query with multiple time periods', async () => {
      const intent: QueryIntent = {
        primary: 'comparison',
        secondary: [],
        confidence: 0.85,
        entities: [
          {
            type: 'metric',
            value: '銷售額',
            normalizedValue: 'sales',
            confidence: 0.9
          },
          {
            type: 'time_period',
            value: '這個月',
            normalizedValue: {
              start: new Date(2025, 7, 1),
              end: new Date(2025, 7, 31),
              granularity: 'month'
            },
            confidence: 0.8
          },
          {
            type: 'time_period',
            value: '上個月',
            normalizedValue: {
              start: new Date(2025, 6, 1),
              end: new Date(2025, 6, 30),
              granularity: 'month'
            },
            confidence: 0.8
          }
        ],
        reasoning: 'Comparison query',
        suggestions: []
      };

      const mockSnapshot = {
        docs: [
          {
            id: 'order1',
            data: () => ({ amount: 1500, createdAt: new Date() })
          }
        ]
      };

      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValue(mockSnapshot);

      const result = await queryGenerator.generateAndExecuteQuery(intent, mockUserContext);

      expect(result.status).toBe('success');
      expect(result.data.aggregations).toBeDefined();
      expect(result.data.aggregations!.length).toBeGreaterThan(0);
    });

    it('should generate trend analysis query', async () => {
      const intent: QueryIntent = {
        primary: 'trend',
        secondary: [],
        confidence: 0.8,
        entities: [
          {
            type: 'metric',
            value: '客戶數',
            normalizedValue: 'customer_count',
            confidence: 0.9
          },
          {
            type: 'time_period',
            value: '過去六個月',
            normalizedValue: {
              start: new Date(2025, 1, 1),
              end: new Date(2025, 7, 31),
              granularity: 'month'
            },
            confidence: 0.8
          }
        ],
        reasoning: 'Trend analysis query',
        suggestions: []
      };

      const mockSnapshot = {
        docs: Array.from({ length: 10 }, (_, i) => ({
          id: `customer${i}`,
          data: () => ({ 
            id: `cust${i}`,
            createdAt: new Date(2025, Math.floor(i / 2), 1)
          })
        }))
      };

      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValue(mockSnapshot);

      const result = await queryGenerator.generateAndExecuteQuery(intent, mockUserContext);

      expect(result.status).toBe('success');
      expect(result.data.aggregations).toBeDefined();
      expect(result.data.aggregations![0].groupBy).toBeDefined();
    });

    it('should generate ranking query with sorting', async () => {
      const intent: QueryIntent = {
        primary: 'ranking',
        secondary: [],
        confidence: 0.8,
        entities: [
          {
            type: 'metric',
            value: '業績',
            normalizedValue: 'sales',
            confidence: 0.9
          },
          {
            type: 'dimension',
            value: '地區',
            normalizedValue: 'region',
            confidence: 0.8
          }
        ],
        reasoning: 'Ranking query',
        suggestions: []
      };

      const mockSnapshot = {
        docs: [
          { id: 'order1', data: () => ({ amount: 2000, region: 'north' }) },
          { id: 'order2', data: () => ({ amount: 1500, region: 'south' }) }
        ]
      };

      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValue(mockSnapshot);

      const result = await queryGenerator.generateAndExecuteQuery(intent, mockUserContext);

      expect(result.status).toBe('success');
      expect(result.data.aggregations).toBeDefined();
    });

    // 2. 邊界條件測試
    it('should handle empty entity list', async () => {
      const intent: QueryIntent = {
        primary: 'query',
        secondary: [],
        confidence: 0.5,
        entities: [],
        reasoning: 'Empty query',
        suggestions: []
      };

      const mockSnapshot = { docs: [] };
      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValue(mockSnapshot);

      const result = await queryGenerator.generateAndExecuteQuery(intent, mockUserContext);

      expect(result.status).toBe('success');
      expect(result.data.rows).toHaveLength(0);
    });

    it('should handle unknown intent type', async () => {
      const intent: QueryIntent = {
        primary: 'unknown_type' as any,
        secondary: [],
        confidence: 0.3,
        entities: [],
        reasoning: 'Unknown intent',
        suggestions: []
      };

      const mockSnapshot = { docs: [] };
      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValue(mockSnapshot);

      const result = await queryGenerator.generateAndExecuteQuery(intent, mockUserContext);

      expect(result.status).toBe('success');
      // 應該使用降級查詢
    });

    // 3. 失敗情況測試
    it('should handle Firestore query errors', async () => {
      const intent: QueryIntent = {
        primary: 'query',
        secondary: [],
        confidence: 0.9,
        entities: [
          {
            type: 'metric',
            value: '營收',
            normalizedValue: 'revenue',
            confidence: 0.9
          }
        ],
        reasoning: 'Basic query',
        suggestions: []
      };

      const { getDocs } = require('firebase/firestore');
      getDocs.mockRejectedValue(new Error('Firestore connection error'));

      await expect(
        queryGenerator.generateAndExecuteQuery(intent, mockUserContext)
      ).rejects.toThrow('查詢執行失敗');
    });
  });

  describe('validateQueryPermissions', () => {
    it('should allow query with proper permissions', () => {
      const query: DatabaseQuery = {
        type: 'firestore',
        collection: 'orders',
        filters: [],
        orderBy: []
      };

      const result = queryGenerator.validateQueryPermissions(query, mockUserContext);

      expect(result.allowed).toBe(true);
      expect(result.modifiedQuery).toBeDefined();
      expect(result.modifiedQuery!.filters).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'organizationId',
            operator: '=',
            value: 'test-org'
          })
        ])
      );
    });

    it('should deny query without proper permissions', () => {
      const query: DatabaseQuery = {
        type: 'firestore',
        collection: 'admin_data',
        filters: [],
        orderBy: []
      };

      const userContextWithoutPermissions = {
        ...mockUserContext,
        permissions: ['read:customers'] // 沒有 admin_data 權限
      };

      const result = queryGenerator.validateQueryPermissions(query, userContextWithoutPermissions);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('沒有權限存取');
    });

    it('should allow admin users to access any collection', () => {
      const query: DatabaseQuery = {
        type: 'firestore',
        collection: 'sensitive_data',
        filters: [],
        orderBy: []
      };

      const adminContext = {
        ...mockUserContext,
        permissions: ['admin']
      };

      const result = queryGenerator.validateQueryPermissions(query, adminContext);

      expect(result.allowed).toBe(true);
    });
  });

  describe('estimateQueryCost', () => {
    it('should estimate cost for simple query', () => {
      const queries: DatabaseQuery[] = [
        {
          type: 'firestore',
          collection: 'orders',
          filters: [
            { field: 'createdAt', operator: '>=', value: new Date() }
          ],
          orderBy: [{ field: 'createdAt', direction: 'desc' }],
          limit: 100
        }
      ];

      const cost = queryGenerator.estimateQueryCost(queries);

      expect(cost.readOperations).toBeGreaterThan(0);
      expect(cost.estimatedLatency).toBeGreaterThan(0);
      expect(cost.cacheHitProbability).toBeBetween(0, 1);
    });

    it('should estimate higher cost for complex queries', () => {
      const simpleQuery: DatabaseQuery = {
        type: 'firestore',
        collection: 'orders',
        filters: [],
        orderBy: [],
        limit: 10
      };

      const complexQuery: DatabaseQuery = {
        type: 'firestore',
        collection: 'orders',
        filters: [
          { field: 'amount', operator: '>', value: 1000 },
          { field: 'status', operator: '=', value: 'completed' },
          { field: 'createdAt', operator: '>=', value: new Date() }
        ],
        orderBy: [
          { field: 'amount', direction: 'desc' },
          { field: 'createdAt', direction: 'desc' }
        ],
        limit: 1000
      };

      const simpleCost = queryGenerator.estimateQueryCost([simpleQuery]);
      const complexCost = queryGenerator.estimateQueryCost([complexQuery]);

      expect(complexCost.readOperations).toBeGreaterThan(simpleCost.readOperations);
      expect(complexCost.estimatedLatency).toBeGreaterThan(simpleCost.estimatedLatency);
    });
  });

  describe('query optimization', () => {
    it('should apply optimization rules', () => {
      const originalQuery: DatabaseQuery = {
        type: 'firestore',
        collection: 'orders',
        filters: [
          { field: 'field1', operator: '=', value: 'value1' },
          { field: 'field2', operator: '=', value: 'value2' },
          { field: 'field3', operator: '=', value: 'value3' },
          { field: 'field4', operator: '=', value: 'value4' } // 超過3個篩選條件
        ],
        orderBy: [],
        limit: 2000 // 超過限制
      };

      // 使用私有方法進行測試（實際實作中可能需要公開這個方法）
      const optimized = (queryGenerator as any).optimizeQuery(originalQuery);

      expect(optimized.filters.length).toBeLessThanOrEqual(3);
      expect(optimized.limit).toBeLessThanOrEqual(1000);
    });
  });

  describe('collection and field mapping', () => {
    it('should map metrics to correct collections', () => {
      const revenueCollection = (queryGenerator as any).getCollectionForMetric('revenue');
      const customerCollection = (queryGenerator as any).getCollectionForMetric('customer_count');

      expect(revenueCollection).toBe('orders');
      expect(customerCollection).toBe('customers');
    });

    it('should map metrics to correct fields', () => {
      const revenueField = (queryGenerator as any).getFieldForMetric('revenue');
      const customerField = (queryGenerator as any).getFieldForMetric('customer_count');

      expect(revenueField).toBe('amount');
      expect(customerField).toBe('id');
    });

    it('should use default mapping for unknown metrics', () => {
      const unknownCollection = (queryGenerator as any).getCollectionForMetric('unknown_metric');
      const unknownField = (queryGenerator as any).getFieldForMetric('unknown_metric');

      expect(unknownCollection).toBe('orders');
      expect(unknownField).toBe('amount');
    });
  });

  describe('aggregation processing', () => {
    it('should process aggregations correctly', () => {
      const data = [
        { amount: 100, region: 'north' },
        { amount: 200, region: 'north' },
        { amount: 150, region: 'south' }
      ];

      const aggregationConfigs = [
        {
          type: 'sum' as const,
          field: 'amount',
          alias: 'total_amount'
        },
        {
          type: 'avg' as const,
          field: 'amount',
          alias: 'average_amount'
        }
      ];

      const results = (queryGenerator as any).processAggregations(data, aggregationConfigs);

      expect(results).toEqual([
        expect.objectContaining({
          type: 'sum',
          field: 'amount',
          value: 450
        }),
        expect.objectContaining({
          type: 'avg',
          field: 'amount',
          value: 150
        })
      ]);
    });

    it('should handle empty data in aggregations', () => {
      const data: any[] = [];
      const aggregationConfigs = [
        {
          type: 'sum' as const,
          field: 'amount',
          alias: 'total_amount'
        }
      ];

      const results = (queryGenerator as any).processAggregations(data, aggregationConfigs);

      expect(results[0].value).toBe(0);
    });
  });

  describe('performance', () => {
    it('should execute queries within time limit', async () => {
      const intent: QueryIntent = {
        primary: 'query',
        secondary: [],
        confidence: 0.9,
        entities: [
          {
            type: 'metric',
            value: '營收',
            normalizedValue: 'revenue',
            confidence: 0.9
          }
        ],
        reasoning: 'Performance test',
        suggestions: []
      };

      const mockSnapshot = { docs: [] };
      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValue(mockSnapshot);

      const startTime = Date.now();
      await queryGenerator.generateAndExecuteQuery(intent, mockUserContext);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000); // 5秒內完成
    });

    it('should handle large result sets efficiently', async () => {
      const intent: QueryIntent = {
        primary: 'query',
        secondary: [],
        confidence: 0.9,
        entities: [
          {
            type: 'metric',
            value: '訂單',
            normalizedValue: 'order_count',
            confidence: 0.9
          }
        ],
        reasoning: 'Large dataset test',
        suggestions: []
      };

      // Mock large dataset
      const mockSnapshot = {
        docs: Array.from({ length: 1000 }, (_, i) => ({
          id: `order${i}`,
          data: () => ({ 
            amount: Math.random() * 1000,
            createdAt: new Date()
          })
        }))
      };

      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValue(mockSnapshot);

      const result = await queryGenerator.generateAndExecuteQuery(intent, mockUserContext);

      expect(result.status).toBe('success');
      expect(result.data.rows).toHaveLength(1000);
      expect(result.data.summary.totalRows).toBe(1000);
    });
  });
});

// 輔助函數
expect.extend({
  toBeBetween(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeBetween(floor: number, ceiling: number): R;
    }
  }
}