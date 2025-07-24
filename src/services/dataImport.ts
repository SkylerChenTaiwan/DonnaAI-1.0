/**
 * 資料匯入服務
 * 支援 CSV 和 Excel 檔案匯入客戶、任務等資料
 */

import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {
  ImportJob,
  ImportSource,
  FieldMapping,
  ImportProgress,
  ImportResult,
  ImportError,
} from '@/types/admin';
import { CustomerDoc } from '@/types/firebase';
import { Task } from '@/types';
import { createCustomer } from './firebase/customers';
import { createTask } from './firebase/tasks';
import { createRecord } from './firebase/records';
import { doc, setDoc, updateDoc, serverTimestamp, collection } from 'firebase/firestore';
import { getFirebaseDb } from './firebase/config';

export interface ParsedData {
  headers: string[];
  rows: any[];
  totalRows: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ImportError[];
  warnings: ImportError[];
}

export interface MappedData {
  type: 'customers' | 'records' | 'tasks';
  items: any[];
}

export interface ImportOptions {
  skipDuplicates: boolean;
  updateExisting: boolean;
  validateBeforeImport: boolean;
  organizationId: string;
  teamId: string;
  userId: string;
}

export class DataImportService {
  // 解析 CSV 檔案
  async parseCSV(file: File): Promise<ParsedData> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve({
            headers: results.meta.fields || [],
            rows: results.data,
            totalRows: results.data.length,
          });
        },
        error: (error) => {
          reject(new Error(`CSV 解析失敗: ${error.message}`));
        },
      });
    });
  }

  // 解析 Excel 檔案
  async parseExcel(file: File): Promise<ParsedData> {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      
      // 預設讀取第一個工作表
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];
      
      if (jsonData.length === 0) {
        throw new Error('Excel 檔案為空');
      }

      const headers = jsonData[0] as string[];
      const rows = jsonData.slice(1).map(row => {
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = row[index];
        });
        return obj;
      });

      return {
        headers,
        rows,
        totalRows: rows.length,
      };
    } catch (error) {
      throw new Error(`Excel 解析失敗: ${(error as Error).message}`);
    }
  }

  // 驗證資料
  async validateData(
    data: ParsedData,
    type: 'customers' | 'records' | 'tasks'
  ): Promise<ValidationResult> {
    const errors: ImportError[] = [];
    const warnings: ImportError[] = [];

    // 檢查必填欄位
    const requiredFields = this.getRequiredFields(type);
    const missingFields = requiredFields.filter(field => !data.headers.includes(field));
    
    if (missingFields.length > 0) {
      errors.push({
        row: 0,
        error: `缺少必填欄位: ${missingFields.join(', ')}`,
        severity: 'error',
      });
    }

    // 驗證每一行資料
    data.rows.forEach((row, index) => {
      const rowNum = index + 2; // 加上標題行和從1開始計數

      // 檢查必填值
      requiredFields.forEach(field => {
        if (!row[field] || row[field].toString().trim() === '') {
          errors.push({
            row: rowNum,
            field,
            value: row[field],
            error: `${field} 不能為空`,
            severity: 'error',
          });
        }
      });

      // 類型特定驗證
      switch (type) {
        case 'customers':
          // 驗證 Email 格式
          if (row.email && !this.isValidEmail(row.email)) {
            errors.push({
              row: rowNum,
              field: 'email',
              value: row.email,
              error: '無效的 Email 格式',
              severity: 'error',
            });
          }
          
          // 驗證電話格式
          if (row.phone && !this.isValidPhone(row.phone)) {
            warnings.push({
              row: rowNum,
              field: 'phone',
              value: row.phone,
              error: '電話格式可能不正確',
              severity: 'warning',
            });
          }
          break;

        case 'tasks':
          // 驗證日期格式
          if (row.dueDate && !this.isValidDate(row.dueDate)) {
            errors.push({
              row: rowNum,
              field: 'dueDate',
              value: row.dueDate,
              error: '無效的日期格式',
              severity: 'error',
            });
          }
          
          // 驗證優先級
          if (row.priority && !['low', 'medium', 'high', 'urgent'].includes(row.priority)) {
            warnings.push({
              row: rowNum,
              field: 'priority',
              value: row.priority,
              error: '無效的優先級，將使用預設值 medium',
              severity: 'warning',
            });
          }
          break;
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // 映射欄位
  async mapFields(
    data: ParsedData,
    mapping: FieldMapping,
    type: 'customers' | 'records' | 'tasks'
  ): Promise<MappedData> {
    const mappedItems = data.rows.map(row => {
      const mappedItem: any = {};
      
      Object.entries(mapping).forEach(([sourceField, config]) => {
        let value = row[sourceField];
        
        // 應用轉換
        if (config.transform && value !== undefined && value !== null) {
          value = this.transformValue(value, config.transform);
        }
        
        // 使用預設值
        if ((value === undefined || value === null || value === '') && config.defaultValue !== undefined) {
          value = config.defaultValue;
        }
        
        mappedItem[config.targetField] = value;
      });
      
      return mappedItem;
    });

    return {
      type,
      items: mappedItems,
    };
  }

  // 批次匯入
  async importBatch(
    data: MappedData,
    options: ImportOptions,
    jobId: string
  ): Promise<ImportResult> {
    const db = getFirebaseDb();
    const jobRef = doc(db, 'import_jobs', jobId);
    
    const result: ImportResult = {
      totalProcessed: 0,
      totalSucceeded: 0,
      totalFailed: 0,
      totalSkipped: 0,
      errors: [],
      duplicates: [],
      createdIds: [],
    };

    const updateProgress = async (progress: ImportProgress) => {
      await updateDoc(jobRef, {
        progress,
        'updatedAt': serverTimestamp(),
      });
    };

    try {
      const totalItems = data.items.length;
      
      for (let i = 0; i < totalItems; i++) {
        const item = data.items[i];
        result.totalProcessed++;

        try {
          // 檢查重複
          if (options.skipDuplicates) {
            const isDuplicate = await this.checkDuplicate(item, data.type, options);
            if (isDuplicate) {
              result.totalSkipped++;
              result.duplicates?.push(item.name || item.title || `Row ${i + 1}`);
              continue;
            }
          }

          // 建立記錄
          const createdId = await this.createItem(item, data.type, options);
          result.totalSucceeded++;
          result.createdIds?.push(createdId);
        } catch (error) {
          result.totalFailed++;
          result.errors?.push({
            row: i + 1,
            error: (error as Error).message,
            severity: 'error',
          });
        }

        // 更新進度（每10筆或最後一筆）
        if (i % 10 === 0 || i === totalItems - 1) {
          await updateProgress({
            total: totalItems,
            processed: result.totalProcessed,
            succeeded: result.totalSucceeded,
            failed: result.totalFailed,
            skipped: result.totalSkipped,
            percentage: Math.round((result.totalProcessed / totalItems) * 100),
          });
        }
      }

      // 更新任務狀態為完成
      await updateDoc(jobRef, {
        status: result.totalFailed === 0 ? 'completed' : 'completed',
        result,
        completedAt: serverTimestamp(),
      });

      // logOperation('data_import_completed', {
      //   jobId,
      //   type: data.type,
      //   succeeded: result.totalSucceeded,
      //   failed: result.totalFailed,
      // });

      return result;
    } catch (error) {
      // 更新任務狀態為失敗
      await updateDoc(jobRef, {
        status: 'failed',
        result,
        error: (error as Error).message,
        completedAt: serverTimestamp(),
      });

      console.error('importBatch 錯誤:', error);
      throw error;
    }
  }

  // 建立匯入任務
  async createImportJob(
    type: 'customers' | 'records' | 'tasks',
    source: ImportSource,
    options: ImportOptions
  ): Promise<string> {
    const db = getFirebaseDb();
    const jobRef = doc(collection(db, 'import_jobs'));
    
    const job: ImportJob = {
      id: jobRef.id,
      organizationId: options.organizationId,
      type,
      status: 'pending',
      source,
      progress: {
        total: 0,
        processed: 0,
        succeeded: 0,
        failed: 0,
        skipped: 0,
        percentage: 0,
      },
      createdBy: options.userId,
      createdAt: serverTimestamp() as any,
    };

    await setDoc(jobRef, job);
    
    // logOperation('create_import_job', {
    //   jobId: jobRef.id,
    //   type,
    //   sourceType: source.type,
    // });

    return jobRef.id;
  }

  // 私有輔助方法

  private getRequiredFields(type: 'customers' | 'records' | 'tasks'): string[] {
    switch (type) {
      case 'customers':
        return ['name', 'company'];
      case 'tasks':
        return ['title'];
      case 'records':
        return ['title', 'type'];
      default:
        return [];
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\d\s\-+()]{8,}$/;
    return phoneRegex.test(phone);
  }

  private isValidDate(dateStr: string): boolean {
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  }

  private transformValue(value: any, transform: string): any {
    switch (transform) {
      case 'date':
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date;
      
      case 'number':
        const num = parseFloat(value);
        return isNaN(num) ? 0 : num;
      
      case 'boolean':
        return ['true', '1', 'yes', '是'].includes(value.toString().toLowerCase());
      
      default:
        return value;
    }
  }

  private async checkDuplicate(
    item: any,
    type: 'customers' | 'records' | 'tasks',
    options: ImportOptions
  ): Promise<boolean> {
    // TODO: 實作重複檢查邏輯
    // 可以根據 name, email, phone 等欄位檢查
    return false;
  }

  private async createItem(
    item: any,
    type: 'customers' | 'records' | 'tasks',
    options: ImportOptions
  ): Promise<string> {
    switch (type) {
      case 'customers':
        return await createCustomer({
          ...item,
          organizationId: options.organizationId,
          teamId: options.teamId,
          assignedTo: options.userId,
          createdBy: options.userId,
          tags: item.tags ? item.tags.split(',').map((t: string) => t.trim()) : [],
        });

      case 'tasks':
        const task = await createTask({
          ...item,
          organizationId: options.organizationId,
          teamId: options.teamId,
          assigneeId: options.userId,
          assignerId: options.userId,
          type: 'unscheduled',
          priority: item.priority || 'medium',
          status: 'todo',
          source: 'import',
          dueDate: item.dueDate ? new Date(item.dueDate) : undefined,
        }, options.userId);
        return task.id!;

      case 'records':
        const record = await createRecord({
          ...item,
          organizationId: options.organizationId,
          teamId: options.teamId,
          type: item.type || 'note',
          status: 'completed',
          createdBy: options.userId,
          participantIds: [options.userId],
        }, options.userId);
        return record.id!;

      default:
        throw new Error(`不支援的類型: ${type}`);
    }
  }
}

// 建立單例
export const dataImportService = new DataImportService();