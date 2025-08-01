/**
 * Pending Changes Hook
 * 追蹤未儲存的表格變更，提供驗證和離開頁面提示
 */

import { useState, useCallback, useEffect } from 'react';
import { CustomerFormSchema, RecordFormSchema, TaskFormSchema } from '@/services/validation/form-schemas';
import { z } from 'zod';

interface DraftRow {
  id: string;
  data: Record<string, any>;
  validationErrors: Record<string, string>;
  isNew: boolean;
}

interface PendingChange {
  rowId: string;
  columnKey: string;
  value: any;
  originalValue: any;
  validationError?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function usePendingChanges(tableType: 'customers' | 'records' | 'tasks') {
  const [pendingChanges, setPendingChanges] = useState<Map<string, DraftRow>>(new Map());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // 取得對應的驗證 schema
  const getSchema = useCallback(() => {
    const schemas = {
      customers: CustomerFormSchema,
      records: RecordFormSchema,
      tasks: TaskFormSchema,
    };
    return schemas[tableType];
  }, [tableType]);

  // 驗證函數
  const validateRow = useCallback((row: Record<string, any>): ValidationResult => {
    const schema = getSchema();
    
    try {
      // 對於新增的列，只驗證已填寫的欄位
      // 不強制要求必填欄位立即填寫
      const partialSchema = schema.partial();
      partialSchema.parse(row);
      
      // 檢查必填欄位是否有值
      const errors: Record<string, string> = {};
      
      // 根據不同的表格類型檢查必填欄位
      if (tableType === 'customers') {
        if (!row.name) errors.name = '客戶姓名為必填';
        if (!row.company) errors.company = '公司名稱為必填';
      } else if (tableType === 'records') {
        if (!row.title) errors.title = '紀錄標題為必填';
        if (!row.content) errors.content = '紀錄內容為必填';
      } else if (tableType === 'tasks') {
        if (!row.title) errors.title = '任務標題為必填';
      }
      
      return { 
        isValid: Object.keys(errors).length === 0, 
        errors 
      };
    } catch (error) {
      // 解析 Zod 錯誤
      const errors: Record<string, string> = {};
      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          const field = err.path[0] as string;
          errors[field] = err.message;
        });
      }
      return { isValid: false, errors };
    }
  }, [tableType, getSchema]);

  // 新增或更新 pending change
  const updatePendingChange = useCallback((rowId: string, field: string, value: any) => {
    setPendingChanges(prev => {
      const updated = new Map(prev);
      const existing = updated.get(rowId) || { 
        id: rowId, 
        data: {}, 
        validationErrors: {},
        isNew: rowId.startsWith('draft_')
      };
      
      existing.data[field] = value;
      
      // 重新驗證整列
      const validation = validateRow(existing.data);
      existing.validationErrors = validation.errors;
      
      updated.set(rowId, existing);
      setHasUnsavedChanges(true);
      return updated;
    });
  }, [validateRow]);

  // 新增草稿列
  const addDraftRow = useCallback(() => {
    const draftId = `draft_${Date.now()}`;
    const newRow: DraftRow = {
      id: draftId,
      data: {},
      validationErrors: {},
      isNew: true
    };
    
    setPendingChanges(prev => {
      const updated = new Map(prev);
      updated.set(draftId, newRow);
      setHasUnsavedChanges(true);
      return updated;
    });
    
    return draftId;
  }, []);

  // 取得驗證錯誤
  const getValidationError = useCallback((rowId: string, columnKey: string): string | undefined => {
    const row = pendingChanges.get(rowId);
    return row?.validationErrors[columnKey];
  }, [pendingChanges]);

  // 取得所有草稿列
  const getDraftRows = useCallback(() => {
    return Array.from(pendingChanges.values()).filter(row => row.isNew);
  }, [pendingChanges]);

  // 儲存前驗證所有變更
  const validateAllChanges = useCallback((): boolean => {
    let allValid = true;
    
    setPendingChanges(prev => {
      const updated = new Map(prev);
      
      updated.forEach((row, rowId) => {
        const validation = validateRow(row.data);
        row.validationErrors = validation.errors;
        if (!validation.isValid) {
          allValid = false;
        }
      });
      
      return updated;
    });
    
    return allValid;
  }, [validateRow]);

  // 清除所有 pending changes
  const clearPendingChanges = useCallback(() => {
    setPendingChanges(new Map());
    setHasUnsavedChanges(false);
  }, []);

  // 移除特定的草稿列
  const removeDraftRow = useCallback((rowId: string) => {
    setPendingChanges(prev => {
      const updated = new Map(prev);
      updated.delete(rowId);
      setHasUnsavedChanges(updated.size > 0);
      return updated;
    });
  }, []);

  // 頁面離開提示
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '您有未儲存的變更，確定要離開嗎？';
        return '您有未儲存的變更，確定要離開嗎？';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  return {
    pendingChanges,
    hasUnsavedChanges,
    updatePendingChange,
    addDraftRow,
    getDraftRows,
    getValidationError,
    validateRow,
    validateAllChanges,
    clearPendingChanges,
    removeDraftRow,
  };
}