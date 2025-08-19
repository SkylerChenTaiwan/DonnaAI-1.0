/**
 * PRP-125: Notion 風格資料庫管理系統 - CRUD 操作引擎
 * 
 * @description 完整的 CRUD 操作引擎，包含樂觀更新、錯誤恢復、批量操作等功能
 * @version 1.0.0
 * @date 2025-08-19
 * 
 * 主要功能：
 * - 單一和批量 CRUD 操作
 * - 樂觀更新機制
 * - 錯誤恢復和回滾
 * - 資料驗證和完整性檢查
 * - 即時同步支援
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { 
  Row,
  Field,
  CellValue,
  DataChange,
  ValidationResult,
  TableError,
  PendingChange,
  ConflictResolution
} from '@/docs/types/database-table-types';
import { tableQueryKeys } from './table-store';
import { validateFieldValue } from '../components/database/field-renderers';

/**
 * CRUD 操作結果介面
 */
interface CRUDResult<T = any> {
  success: boolean;
  data?: T;
  error?: TableError;
  changes?: DataChange[];
}

/**
 * 批量操作結果
 */
interface BulkResult {
  success: boolean;
  totalItems: number;
  successCount: number;
  failureCount: number;
  errors: Array<{ index: number; error: TableError }>;
  rollbackData?: any[];
}

/**
 * 衝突解決策略
 */
type ConflictStrategy = 'overwrite' | 'merge' | 'skip' | 'prompt';

/**
 * CRUD 操作配置
 */
interface CRUDConfig {
  optimisticUpdate: boolean;
  conflictStrategy: ConflictStrategy;
  validateBeforeSave: boolean;
  autoRetry: boolean;
  maxRetries: number;
  timeout: number;
}

/**
 * 預設 CRUD 配置
 */
const DEFAULT_CRUD_CONFIG: CRUDConfig = {
  optimisticUpdate: true,
  conflictStrategy: 'prompt',
  validateBeforeSave: true,
  autoRetry: true,
  maxRetries: 3,
  timeout: 5000
};

/**
 * 模擬 API 延遲
 */
const simulateApiDelay = (ms: number = 100) => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * 資料驗證服務
 */
class ValidationService {
  static validateRow(row: Partial<Row>, fields: Field[]): ValidationResult {
    const errors: string[] = [];
    
    fields.forEach(field => {
      const value = row.data?.[field.id];
      const fieldValidation = validateFieldValue(field, value);
      
      if (!fieldValidation.isValid) {
        errors.push(...fieldValidation.errors);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors: errors.map(error => ({ message: error, field: undefined }))
    };
  }
  
  static validateBulkRows(rows: Partial<Row>[], fields: Field[]): ValidationResult[] {
    return rows.map(row => this.validateRow(row, fields));
  }
}

/**
 * 衝突解決服務
 */
class ConflictResolutionService {
  static async resolveConflict(
    localData: any,
    remoteData: any,
    strategy: ConflictStrategy
  ): Promise<ConflictResolution> {
    switch (strategy) {
      case 'overwrite':
        return {
          strategy,
          resolution: { selectedValue: 'local', mergedValue: localData }
        };
      
      case 'merge':
        // 簡單的物件合併策略
        const mergedValue = { ...remoteData, ...localData };
        return {
          strategy,
          resolution: { selectedValue: 'merged', mergedValue }
        };
      
      case 'skip':
        return {
          strategy,
          resolution: { selectedValue: 'remote', mergedValue: remoteData }
        };
      
      case 'prompt':
        // TODO: 實作使用者介面提示
        console.log('Conflict detected, user intervention required');
        return {
          strategy,
          conflictData: {
            localValue: localData,
            remoteValue: remoteData
          }
        };
      
      default:
        throw new Error(`Unknown conflict strategy: ${strategy}`);
    }
  }
}

/**
 * 儲存格更新操作
 */
export const useCellUpdate = (config: Partial<CRUDConfig> = {}) => {
  const queryClient = useQueryClient();
  const finalConfig = { ...DEFAULT_CRUD_CONFIG, ...config };
  
  return useMutation({
    mutationFn: async ({
      tableId,
      rowId,
      fieldId,
      value,
      fields
    }: {
      tableId: string;
      rowId: string;
      fieldId: string;
      value: CellValue;
      fields?: Field[];
    }): Promise<CRUDResult> => {
      try {
        // 資料驗證
        if (finalConfig.validateBeforeSave && fields) {
          const field = fields.find(f => f.id === fieldId);
          if (field) {
            const validation = validateFieldValue(field, value);
            if (!validation.isValid) {
              return {
                success: false,
                error: {
                  type: 'validation',
                  message: validation.errors.join(', '),
                  recoverable: true
                }
              };
            }
          }
        }
        
        // 模擬 API 呼叫
        await simulateApiDelay(100);
        
        // 模擬隨機失敗 (5% 機率)
        if (Math.random() < 0.05) {
          throw new Error('Network error');
        }
        
        const change: DataChange = {
          type: 'update',
          target: 'cell',
          targetId: `${rowId}-${fieldId}`,
          newValue: value,
          timestamp: new Date()
        };
        
        return {
          success: true,
          data: { rowId, fieldId, value },
          changes: [change]
        };
        
      } catch (error) {
        return {
          success: false,
          error: {
            type: 'network',
            message: error instanceof Error ? error.message : 'Unknown error',
            recoverable: true
          }
        };
      }
    },
    
    onMutate: async ({ tableId, rowId, fieldId, value }) => {
      if (!finalConfig.optimisticUpdate) return;
      
      // 取消進行中的查詢
      await queryClient.cancelQueries({
        queryKey: tableQueryKeys.tableData(tableId)
      });
      
      // 保存當前資料以供回滾
      const previousData = queryClient.getQueryData(tableQueryKeys.tableData(tableId));
      
      // 樂觀更新
      queryClient.setQueryData(tableQueryKeys.tableData(tableId), (oldData: any) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          rows: oldData.rows.map((row: Row) =>
            row.id === rowId
              ? {
                  ...row,
                  data: {
                    ...row.data,
                    [fieldId]: value
                  },
                  updatedAt: new Date()
                }
              : row
          )
        };
      });
      
      return { previousData };
    },
    
    onError: (error, variables, context) => {
      // 回滾樂觀更新
      if (context?.previousData) {
        queryClient.setQueryData(
          tableQueryKeys.tableData(variables.tableId),
          context.previousData
        );
      }
      
      toast.error('儲存失敗，請重試');
    },
    
    onSuccess: (result, variables) => {
      if (result.success) {
        toast.success('已儲存');
        
        // 重新獲取資料以確保同步
        queryClient.invalidateQueries({
          queryKey: tableQueryKeys.tableData(variables.tableId)
        });
      } else {
        toast.error(result.error?.message || '儲存失敗');
      }
    }
  });
};

/**
 * 列新增操作
 */
export const useRowCreate = (config: Partial<CRUDConfig> = {}) => {
  const queryClient = useQueryClient();
  const finalConfig = { ...DEFAULT_CRUD_CONFIG, ...config };
  
  return useMutation({
    mutationFn: async ({
      tableId,
      rowData,
      fields
    }: {
      tableId: string;
      rowData: Partial<Row>;
      fields: Field[];
    }): Promise<CRUDResult<Row>> => {
      try {
        // 資料驗證
        if (finalConfig.validateBeforeSave) {
          const validation = ValidationService.validateRow(rowData, fields);
          if (!validation.isValid) {
            return {
              success: false,
              error: {
                type: 'validation',
                message: validation.errors?.map(e => e.message).join(', ') || '驗證失敗',
                recoverable: true
              }
            };
          }
        }
        
        // 模擬 API 呼叫
        await simulateApiDelay(200);
        
        const newRow: Row = {
          id: `row-${Date.now()}`,
          tableId,
          data: rowData.data || {},
          metadata: { index: Date.now() },
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'current-user',
          updatedBy: 'current-user',
          version: 1
        };
        
        return {
          success: true,
          data: newRow,
          changes: [{
            type: 'create',
            target: 'row',
            targetId: newRow.id,
            newValue: newRow,
            timestamp: new Date()
          }]
        };
        
      } catch (error) {
        return {
          success: false,
          error: {
            type: 'network',
            message: error instanceof Error ? error.message : 'Unknown error',
            recoverable: true
          }
        };
      }
    },
    
    onSuccess: (result, variables) => {
      if (result.success && result.data) {
        // 更新快取
        queryClient.setQueryData(
          tableQueryKeys.tableData(variables.tableId),
          (oldData: any) => {
            if (!oldData) return oldData;
            
            return {
              ...oldData,
              rows: [...oldData.rows, result.data]
            };
          }
        );
        
        toast.success('已新增列');
      } else {
        toast.error(result.error?.message || '新增失敗');
      }
    }
  });
};

/**
 * 列刪除操作
 */
export const useRowDelete = (config: Partial<CRUDConfig> = {}) => {
  const queryClient = useQueryClient();
  const finalConfig = { ...DEFAULT_CRUD_CONFIG, ...config };
  
  return useMutation({
    mutationFn: async ({
      tableId,
      rowId
    }: {
      tableId: string;
      rowId: string;
    }): Promise<CRUDResult> => {
      try {
        // 模擬 API 呼叫
        await simulateApiDelay(150);
        
        return {
          success: true,
          changes: [{
            type: 'delete',
            target: 'row',
            targetId: rowId,
            timestamp: new Date()
          }]
        };
        
      } catch (error) {
        return {
          success: false,
          error: {
            type: 'network',
            message: error instanceof Error ? error.message : 'Unknown error',
            recoverable: true
          }
        };
      }
    },
    
    onMutate: async ({ tableId, rowId }) => {
      if (!finalConfig.optimisticUpdate) return;
      
      await queryClient.cancelQueries({
        queryKey: tableQueryKeys.tableData(tableId)
      });
      
      const previousData = queryClient.getQueryData(tableQueryKeys.tableData(tableId));
      
      // 樂觀刪除
      queryClient.setQueryData(tableQueryKeys.tableData(tableId), (oldData: any) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          rows: oldData.rows.filter((row: Row) => row.id !== rowId)
        };
      });
      
      return { previousData };
    },
    
    onError: (error, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          tableQueryKeys.tableData(variables.tableId),
          context.previousData
        );
      }
      
      toast.error('刪除失敗，請重試');
    },
    
    onSuccess: (result, variables) => {
      if (result.success) {
        toast.success('已刪除');
      } else {
        toast.error(result.error?.message || '刪除失敗');
      }
    }
  });
};

/**
 * 批量操作
 */
export const useBulkOperations = (config: Partial<CRUDConfig> = {}) => {
  const queryClient = useQueryClient();
  const finalConfig = { ...DEFAULT_CRUD_CONFIG, ...config };
  
  return useMutation({
    mutationFn: async ({
      tableId,
      operation,
      rowIds,
      updateData,
      fields
    }: {
      tableId: string;
      operation: 'update' | 'delete';
      rowIds: string[];
      updateData?: Record<string, CellValue>;
      fields?: Field[];
    }): Promise<BulkResult> => {
      try {
        let successCount = 0;
        let failureCount = 0;
        const errors: Array<{ index: number; error: TableError }> = [];
        const changes: DataChange[] = [];
        
        // 批量驗證（如果是更新操作）
        if (operation === 'update' && updateData && fields && finalConfig.validateBeforeSave) {
          for (const field of fields) {
            if (updateData[field.id] !== undefined) {
              const validation = validateFieldValue(field, updateData[field.id]);
              if (!validation.isValid) {
                return {
                  success: false,
                  totalItems: rowIds.length,
                  successCount: 0,
                  failureCount: rowIds.length,
                  errors: [{
                    index: 0,
                    error: {
                      type: 'validation',
                      message: validation.errors.join(', '),
                      recoverable: true
                    }
                  }]
                };
              }
            }
          }
        }
        
        // 處理每一列
        for (let i = 0; i < rowIds.length; i++) {
          const rowId = rowIds[i];
          
          try {
            // 模擬單一操作
            await simulateApiDelay(50);
            
            // 模擬 2% 的失敗率
            if (Math.random() < 0.02) {
              throw new Error(`Row ${rowId} operation failed`);
            }
            
            changes.push({
              type: operation === 'delete' ? 'delete' : 'update',
              target: 'row',
              targetId: rowId,
              newValue: operation === 'update' ? updateData : undefined,
              timestamp: new Date()
            });
            
            successCount++;
            
          } catch (error) {
            errors.push({
              index: i,
              error: {
                type: 'network',
                message: error instanceof Error ? error.message : 'Unknown error',
                recoverable: true
              }
            });
            failureCount++;
          }
        }
        
        return {
          success: failureCount === 0,
          totalItems: rowIds.length,
          successCount,
          failureCount,
          errors
        };
        
      } catch (error) {
        return {
          success: false,
          totalItems: rowIds.length,
          successCount: 0,
          failureCount: rowIds.length,
          errors: [{
            index: 0,
            error: {
              type: 'network',
              message: error instanceof Error ? error.message : 'Unknown error',
              recoverable: true
            }
          }]
        };
      }
    },
    
    onSuccess: (result, variables) => {
      if (result.success) {
        // 更新快取
        queryClient.setQueryData(
          tableQueryKeys.tableData(variables.tableId),
          (oldData: any) => {
            if (!oldData) return oldData;
            
            if (variables.operation === 'delete') {
              return {
                ...oldData,
                rows: oldData.rows.filter((row: Row) => !variables.rowIds.includes(row.id))
              };
            } else {
              return {
                ...oldData,
                rows: oldData.rows.map((row: Row) =>
                  variables.rowIds.includes(row.id)
                    ? {
                        ...row,
                        data: { ...row.data, ...variables.updateData },
                        updatedAt: new Date()
                      }
                    : row
                )
              };
            }
          }
        );
        
        toast.success(`批量${variables.operation === 'delete' ? '刪除' : '更新'}完成：${result.successCount} 項成功`);
      } else {
        toast.error(`批量操作失敗：${result.failureCount} 項失敗`);
      }
    }
  });
};

/**
 * 復原操作
 */
export const useUndoOperation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      tableId,
      change
    }: {
      tableId: string;
      change: DataChange;
    }): Promise<CRUDResult> => {
      try {
        // 模擬復原 API 呼叫
        await simulateApiDelay(100);
        
        return {
          success: true,
          changes: [{
            ...change,
            type: change.type === 'create' ? 'delete' : 
                  change.type === 'delete' ? 'create' : 'update',
            timestamp: new Date()
          }]
        };
        
      } catch (error) {
        return {
          success: false,
          error: {
            type: 'network',
            message: error instanceof Error ? error.message : 'Unknown error',
            recoverable: true
          }
        };
      }
    },
    
    onSuccess: (result, variables) => {
      if (result.success) {
        // 無效化快取以重新獲取資料
        queryClient.invalidateQueries({
          queryKey: tableQueryKeys.tableData(variables.tableId)
        });
        
        toast.success('已復原操作');
      } else {
        toast.error('復原失敗');
      }
    }
  });
};

/**
 * 匯出工具函數
 */
export {
  ValidationService,
  ConflictResolutionService,
  DEFAULT_CRUD_CONFIG,
  type CRUDResult,
  type BulkResult,
  type CRUDConfig,
  type ConflictStrategy
};