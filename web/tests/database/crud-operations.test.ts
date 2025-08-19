/**
 * PRP-125: CRUD 操作引擎單元測試
 * 
 * @description 測試 CRUD 操作、樂觀更新、錯誤恢復等功能
 * @version 1.0.0
 * @date 2025-08-19
 */

import React, { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import {
  ValidationService,
  ConflictResolutionService,
  DEFAULT_CRUD_CONFIG,
  CRUDConfig,
  ConflictStrategy
} from '../../lib/database/crud-operations';

import type {
  Row,
  Field,
  TextField,
  NumberField,
  CellValue
} from '../../docs/types/database-table-types';

// Mock toast 通知
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

// 測試工具函數
const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
});

const createWrapper = () => {
  const queryClient = createQueryClient();
  return ({ children }: { children: ReactNode }) => 
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

// 測試資料
const mockFields: Field[] = [
  {
    id: 'name',
    name: '姓名',
    type: 'text',
    required: true
  } as TextField,
  {
    id: 'age',
    name: '年齡',
    type: 'number',
    required: false
  } as NumberField,
  {
    id: 'email',
    name: '電子郵件',
    type: 'email',
    required: true
  } as TextField
];

const mockRow: Row = {
  id: 'row-1',
  tableId: 'table-1',
  data: {
    name: '張三',
    age: 25,
    email: 'zhang@example.com'
  },
  metadata: { index: 0 },
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'user-1',
  updatedBy: 'user-1',
  version: 1
};

describe('CRUD Operations', () => {
  
  describe('ValidationService', () => {
    
    test('應該驗證有效的列資料', () => {
      const result = ValidationService.validateRow(mockRow, mockFields);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('應該檢測必填欄位缺失', () => {
      const invalidRow: Partial<Row> = {
        ...mockRow,
        data: {
          age: 25,
          email: 'zhang@example.com'
          // 缺少必填的 name 欄位
        }
      };

      const result = ValidationService.validateRow(invalidRow, mockFields);
      
      expect(result.isValid).toBe(false);
      expect(result.errors?.length).toBeGreaterThan(0);
      expect(result.errors?.[0].message).toContain('必填欄位');
    });

    test('應該檢測無效的資料類型', () => {
      const invalidRow: Partial<Row> = {
        ...mockRow,
        data: {
          name: '張三',
          age: 'not-a-number', // 應該是數字
          email: 'zhang@example.com'
        }
      };

      const result = ValidationService.validateRow(invalidRow, mockFields);
      
      expect(result.isValid).toBe(false);
      expect(result.errors?.[0].message).toContain('必須是數字');
    });

    test('應該檢測無效的電子郵件格式', () => {
      const invalidRow: Partial<Row> = {
        ...mockRow,
        data: {
          name: '張三',
          age: 25,
          email: 'invalid-email'
        }
      };

      const result = ValidationService.validateRow(invalidRow, mockFields);
      
      expect(result.isValid).toBe(false);
      expect(result.errors?.[0].message).toContain('格式不正確');
    });

    test('應該驗證批量列資料', () => {
      const rows = [mockRow, mockRow];
      const results = ValidationService.validateBulkRows(rows, mockFields);
      
      expect(results).toHaveLength(2);
      expect(results[0].isValid).toBe(true);
      expect(results[1].isValid).toBe(true);
    });
  });

  describe('ConflictResolutionService', () => {
    
    test('應該使用覆寫策略解決衝突', async () => {
      const localData = { name: '本地值' };
      const remoteData = { name: '遠端值' };
      
      const resolution = await ConflictResolutionService.resolveConflict(
        localData,
        remoteData,
        'overwrite'
      );
      
      expect(resolution.strategy).toBe('overwrite');
      expect(resolution.resolution?.selectedValue).toBe('local');
      expect(resolution.resolution?.mergedValue).toEqual(localData);
    });

    test('應該使用合併策略解決衝突', async () => {
      const localData = { name: '本地值', age: 25 };
      const remoteData = { name: '遠端值', email: 'test@example.com' };
      
      const resolution = await ConflictResolutionService.resolveConflict(
        localData,
        remoteData,
        'merge'
      );
      
      expect(resolution.strategy).toBe('merge');
      expect(resolution.resolution?.selectedValue).toBe('merged');
      expect(resolution.resolution?.mergedValue).toEqual({
        name: '本地值', // 本地值優先
        age: 25,
        email: 'test@example.com'
      });
    });

    test('應該使用跳過策略解決衝突', async () => {
      const localData = { name: '本地值' };
      const remoteData = { name: '遠端值' };
      
      const resolution = await ConflictResolutionService.resolveConflict(
        localData,
        remoteData,
        'skip'
      );
      
      expect(resolution.strategy).toBe('skip');
      expect(resolution.resolution?.selectedValue).toBe('remote');
      expect(resolution.resolution?.mergedValue).toEqual(remoteData);
    });

    test('應該處理提示策略', async () => {
      const localData = { name: '本地值' };
      const remoteData = { name: '遠端值' };
      
      const resolution = await ConflictResolutionService.resolveConflict(
        localData,
        remoteData,
        'prompt'
      );
      
      expect(resolution.strategy).toBe('prompt');
      expect(resolution.conflictData?.localValue).toEqual(localData);
      expect(resolution.conflictData?.remoteValue).toEqual(remoteData);
    });

    test('應該拋出未知策略錯誤', async () => {
      const localData = { name: '本地值' };
      const remoteData = { name: '遠端值' };
      
      await expect(
        ConflictResolutionService.resolveConflict(
          localData,
          remoteData,
          'unknown' as ConflictStrategy
        )
      ).rejects.toThrow('Unknown conflict strategy');
    });
  });

  describe('DEFAULT_CRUD_CONFIG', () => {
    
    test('應該有正確的預設配置', () => {
      expect(DEFAULT_CRUD_CONFIG.optimisticUpdate).toBe(true);
      expect(DEFAULT_CRUD_CONFIG.conflictStrategy).toBe('prompt');
      expect(DEFAULT_CRUD_CONFIG.validateBeforeSave).toBe(true);
      expect(DEFAULT_CRUD_CONFIG.autoRetry).toBe(true);
      expect(DEFAULT_CRUD_CONFIG.maxRetries).toBe(3);
      expect(DEFAULT_CRUD_CONFIG.timeout).toBe(5000);
    });

    test('應該能夠覆寫配置', () => {
      const customConfig: Partial<CRUDConfig> = {
        optimisticUpdate: false,
        maxRetries: 5
      };

      const finalConfig = { ...DEFAULT_CRUD_CONFIG, ...customConfig };
      
      expect(finalConfig.optimisticUpdate).toBe(false);
      expect(finalConfig.maxRetries).toBe(5);
      expect(finalConfig.conflictStrategy).toBe('prompt'); // 保持預設值
    });
  });

  describe('邊界條件測試', () => {
    
    test('應該處理空的列資料', () => {
      const emptyRow: Partial<Row> = {
        id: 'empty',
        tableId: 'table-1',
        data: {}
      };

      const result = ValidationService.validateRow(emptyRow, mockFields);
      
      // 應該檢測出必填欄位缺失
      expect(result.isValid).toBe(false);
    });

    test('應該處理空的欄位列表', () => {
      const result = ValidationService.validateRow(mockRow, []);
      
      // 沒有欄位要驗證，應該是有效的
      expect(result.isValid).toBe(true);
    });

    test('應該處理 null 和 undefined 值', () => {
      const rowWithNulls: Partial<Row> = {
        ...mockRow,
        data: {
          name: null,
          age: undefined,
          email: ''
        }
      };

      const result = ValidationService.validateRow(rowWithNulls, mockFields);
      
      // 應該檢測出必填欄位的問題
      expect(result.isValid).toBe(false);
    });

    test('應該處理大量列資料', () => {
      const manyRows = Array.from({ length: 1000 }, () => mockRow);
      
      const start = performance.now();
      const results = ValidationService.validateBulkRows(manyRows, mockFields);
      const end = performance.now();
      
      expect(results).toHaveLength(1000);
      expect(end - start).toBeLessThan(100); // 應該在 100ms 內完成
    });
  });

  describe('錯誤處理測試', () => {
    
    test('應該處理畸形的欄位配置', () => {
      const badFields = [
        null,
        undefined,
        { id: '', name: '', type: 'invalid' }
      ] as any[];

      expect(() => {
        ValidationService.validateRow(mockRow, badFields);
      }).not.toThrow();
    });

    test('應該處理循環引用的資料', () => {
      const circularData: any = { name: '測試' };
      circularData.self = circularData;

      const rowWithCircular: Partial<Row> = {
        ...mockRow,
        data: circularData
      };

      expect(() => {
        ValidationService.validateRow(rowWithCircular, mockFields);
      }).not.toThrow();
    });

    test('應該處理非常深的巢狀物件', () => {
      let deepObject: any = {};
      let current = deepObject;
      
      // 建立 100 層深的巢狀物件
      for (let i = 0; i < 100; i++) {
        current.next = {};
        current = current.next;
      }

      const rowWithDeepObject: Partial<Row> = {
        ...mockRow,
        data: {
          name: '測試',
          deep: deepObject
        }
      };

      expect(() => {
        ValidationService.validateRow(rowWithDeepObject, mockFields);
      }).not.toThrow();
    });
  });

  describe('效能測試', () => {
    
    test('大量資料驗證應該在合理時間內完成', () => {
      const largeFields = Array.from({ length: 50 }, (_, i) => ({
        id: `field-${i}`,
        name: `欄位 ${i}`,
        type: 'text' as const,
        required: i % 2 === 0
      }));

      const largeRowData: Record<string, CellValue> = {};
      largeFields.forEach(field => {
        largeRowData[field.id] = `值 ${field.id}`;
      });

      const largeRow: Partial<Row> = {
        ...mockRow,
        data: largeRowData
      };

      const start = performance.now();
      const result = ValidationService.validateRow(largeRow, largeFields);
      const end = performance.now();

      expect(result.isValid).toBe(true);
      expect(end - start).toBeLessThan(50); // 應該在 50ms 內完成
    });

    test('衝突解決應該快速執行', async () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        [`field${i}`]: `value${i}`
      })).reduce((acc, curr) => ({ ...acc, ...curr }), {});

      const start = performance.now();
      await ConflictResolutionService.resolveConflict(
        largeData,
        largeData,
        'merge'
      );
      const end = performance.now();

      expect(end - start).toBeLessThan(10); // 應該在 10ms 內完成
    });
  });
});