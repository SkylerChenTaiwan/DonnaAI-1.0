/**
 * 用戶檔案合併工具
 * 從 ImportWizard 遷移過來的檔案合併功能
 */

import { 
  UploadedFile, 
  MergeConfig, 
  MergedTable,
  MergeStrategy,
  FieldStatistics 
} from '@/types/import';

/**
 * 合併多個檔案
 */
export const mergeFiles = (
  files: UploadedFile[], 
  config: MergeConfig
): MergedTable => {
  if (files.length === 0) {
    return {
      headers: [],
      data: [],
      mergeInfo: {
        totalRows: 0,
        matchedRows: 0,
        unmatchedRows: 0,
        duplicateColumns: []
      }
    };
  }

  // 單檔案直接返回
  if (files.length === 1) {
    return {
      headers: files[0].headers,
      data: files[0].data,
      mergeInfo: {
        totalRows: files[0].data.length,
        matchedRows: files[0].data.length,
        unmatchedRows: 0,
        duplicateColumns: []
      }
    };
  }

  // 多檔案合併
  const baseFile = files[0];
  const mergedData: any[] = [...baseFile.data];
  let matchedRows = 0;
  let unmatchedRows = 0;
  
  // 檢測重複欄位
  const allHeaders = files.flatMap(f => f.headers);
  const duplicateColumns = allHeaders.filter((header, index) => 
    allHeaders.indexOf(header) !== index
  );
  
  // 根據合併策略處理
  for (let i = 1; i < files.length; i++) {
    const file = files[i];
    
    if (config.strategy === 'append') {
      // 追加模式：直接添加所有資料
      mergedData.push(...file.data);
      matchedRows += file.data.length;
    } else if (config.strategy === 'merge' && config.keyField) {
      // 合併模式：根據 key 欄位合併
      const existingKeys = new Set(
        mergedData.map(row => row[config.keyField!])
      );
      
      for (const row of file.data) {
        const key = row[config.keyField];
        if (!existingKeys.has(key)) {
          mergedData.push(row);
          existingKeys.add(key);
          unmatchedRows++;
        } else if (config.conflictResolution === 'overwrite') {
          // 覆蓋現有資料
          const index = mergedData.findIndex(
            r => r[config.keyField!] === key
          );
          if (index !== -1) {
            mergedData[index] = { ...mergedData[index], ...row };
            matchedRows++;
          }
        } else {
          // skip 模式：計算匹配但跳過的資料
          matchedRows++;
        }
      }
    }
  }

  return {
    headers: baseFile.headers,
    data: mergedData,
    mergeInfo: {
      totalRows: mergedData.length,
      matchedRows: matchedRows,
      unmatchedRows: unmatchedRows,
      duplicateColumns: [...new Set(duplicateColumns)]
    }
  };
};

/**
 * 偵測可能的 key 欄位
 */
export const detectKeyFields = (file: UploadedFile): string[] => {
  const candidates: string[] = [];
  
  if (!file.headers || file.headers.length === 0) {
    return candidates;
  }

  // 檢查每個欄位的唯一性
  for (const header of file.headers) {
    const values = file.data.map(row => row[header]);
    const uniqueValues = new Set(values);
    
    // 如果唯一值數量接近總數量，可能是 key 欄位
    const uniqueRatio = uniqueValues.size / values.length;
    if (uniqueRatio > 0.95) {
      candidates.push(header);
    }
  }

  // 優先順序：包含 id、key、code、email 的欄位
  const priorityKeywords = ['id', 'key', 'code', 'email', '編號', '代碼'];
  candidates.sort((a, b) => {
    const aPriority = priorityKeywords.some(kw => 
      a.toLowerCase().includes(kw)
    ) ? 0 : 1;
    const bPriority = priorityKeywords.some(kw => 
      b.toLowerCase().includes(kw)
    ) ? 0 : 1;
    return aPriority - bPriority;
  });

  return candidates;
};

/**
 * 驗證合併結果
 */
export const validateMerge = (mergedTable: MergedTable): {
  isValid: boolean;
  warnings: string[];
  errors: string[];
} => {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  // 檢查資料完整性
  if (!mergedTable.data || mergedTable.data.length === 0) {
    errors.push('合併後無資料');
  }
  
  if (!mergedTable.headers || mergedTable.headers.length === 0) {
    errors.push('合併後無欄位標題');
  }
  
  // 檢查重複資料
  if (mergedTable.keyColumn) {
    const keys = mergedTable.data.map(row => row[mergedTable.keyColumn!]);
    const uniqueKeys = new Set(keys);
    if (uniqueKeys.size < keys.length) {
      warnings.push(
        `發現 ${keys.length - uniqueKeys.size} 筆重複的 ${mergedTable.keyColumn}`
      );
    }
  }
  
  // 檢查空值
  const emptyFields: { [key: string]: number } = {};
  for (const row of mergedTable.data) {
    for (const header of mergedTable.headers) {
      if (!row[header] || row[header] === '') {
        emptyFields[header] = (emptyFields[header] || 0) + 1;
      }
    }
  }
  
  for (const [field, count] of Object.entries(emptyFields)) {
    const ratio = count / mergedTable.data.length;
    if (ratio > 0.5) {
      warnings.push(`欄位 "${field}" 有 ${Math.round(ratio * 100)}% 空值`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    warnings,
    errors
  };
};

/**
 * 預覽合併後的資料
 */
export const previewMergedData = (
  mergedTable: MergedTable,
  limit: number = 10
): any[] => {
  return mergedTable.data.slice(0, limit);
};

/**
 * 取得欄位統計資訊
 */
export const getFieldStatistics = (
  data: any[],
  field: string
): FieldStatistics => {
  const values = data.map(row => row[field]);
  const nonEmptyValues = values.filter(v => v !== null && v !== undefined && v !== '');
  const uniqueValues = new Set(nonEmptyValues);
  
  // 偵測資料類型
  let dataType: 'string' | 'number' | 'date' | 'boolean' | 'mixed' = 'string';
  const types = new Set<string>();
  
  for (const value of nonEmptyValues) {
    if (typeof value === 'number') {
      types.add('number');
    } else if (typeof value === 'boolean') {
      types.add('boolean');
    } else if (typeof value === 'string') {
      // 檢查是否為日期
      const datePattern = /^\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}/;
      if (datePattern.test(value)) {
        types.add('date');
      } else if (/^\d+(\.\d+)?$/.test(value)) {
        types.add('number');
      } else {
        types.add('string');
      }
    }
  }
  
  if (types.size > 1) {
    dataType = 'mixed';
  } else if (types.has('date')) {
    dataType = 'date';
  } else if (types.has('number')) {
    dataType = 'number';
  } else if (types.has('boolean')) {
    dataType = 'boolean';
  }
  
  // 取得範例值
  const sampleValues = uniqueValues.size > 5
    ? Array.from(uniqueValues).slice(0, 5)
    : Array.from(uniqueValues);
  
  return {
    field,
    totalCount: data.length,
    nonEmptyCount: nonEmptyValues.length,
    uniqueCount: uniqueValues.size,
    dataType,
    sampleValues,
    isEmpty: nonEmptyValues.length === 0,
    isUnique: uniqueValues.size === nonEmptyValues.length && nonEmptyValues.length > 0
  };
};