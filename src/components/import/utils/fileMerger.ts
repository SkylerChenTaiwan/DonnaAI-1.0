/**
 * 檔案合併工具
 * 支援多個 CSV/Excel 檔案根據關鍵欄位合併
 */

import {
  UploadedFile,
  MergedTable,
  MergeConfig,
  MergeStrategy,
  KeyFieldCandidate,
  FieldStatistics
} from '@/types/import';

/**
 * 合併多個檔案
 * 根據關鍵欄位將多個檔案合併為單一表格
 */
export function mergeFiles(
  files: UploadedFile[],
  config: MergeConfig
): MergedTable {
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

  if (files.length === 1) {
    // 只有一個檔案，不需要合併
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

  // 使用第一個檔案作為基底
  const baseFile = files.find(f => f.id === config.files[0].id);
  if (!baseFile) {
    throw new Error('找不到基底檔案');
  }

  const baseKeyField = config.files[0].keyField;
  let mergedData = baseFile.data.map(row => ({ ...row }));
  let allHeaders = [...baseFile.headers];
  const duplicateColumns: string[] = [];
  let matchedRows = 0;
  let unmatchedRows = 0;

  // 逐一合併其他檔案
  for (let i = 1; i < config.files.length; i++) {
    const fileConfig = config.files[i];
    const file = files.find(f => f.id === fileConfig.id);
    if (!file) continue;

    const keyField = fileConfig.keyField;
    
    // 建立查詢索引
    const lookupMap = new Map<string, any>();
    file.data.forEach(row => {
      const keyValue = normalizeKeyValue(row[keyField], config.caseSensitive);
      if (keyValue !== null && keyValue !== undefined && keyValue !== '') {
        lookupMap.set(keyValue, row);
      }
    });

    // 處理新檔案的標題
    const newHeaders: string[] = [];
    file.headers.forEach(header => {
      if (header === keyField) {
        // 跳過關鍵欄位（已存在）
        return;
      }

      let finalHeader = header;
      if (allHeaders.includes(header)) {
        // 處理重複欄位
        duplicateColumns.push(header);
        
        if (config.handleDuplicates === 'rename') {
          // 重新命名：加上檔案名稱前綴
          finalHeader = `${file.name}_${header}`;
          let counter = 1;
          while (allHeaders.includes(finalHeader)) {
            finalHeader = `${file.name}_${header}_${counter}`;
            counter++;
          }
        } else if (config.handleDuplicates === 'skip') {
          // 跳過重複欄位
          return;
        }
        // 如果是 'override'，則覆蓋原有欄位的值
      }

      if (!allHeaders.includes(finalHeader)) {
        allHeaders.push(finalHeader);
        newHeaders.push(finalHeader);
      }
    });

    // 根據合併策略處理資料
    const processedBaseKeys = new Set<string>();
    
    // 合併匹配的資料
    mergedData = mergedData.map(baseRow => {
      const baseKeyValue = normalizeKeyValue(
        baseRow[baseKeyField], 
        config.caseSensitive
      );
      
      if (baseKeyValue === null || baseKeyValue === undefined || baseKeyValue === '') {
        return baseRow;
      }

      processedBaseKeys.add(baseKeyValue);
      const matchedRow = lookupMap.get(baseKeyValue);
      
      if (matchedRow) {
        matchedRows++;
        // 合併欄位
        const mergedRow = { ...baseRow };
        
        file.headers.forEach((header, index) => {
          if (header === keyField) return;
          
          let targetHeader = header;
          if (allHeaders.includes(header) && !newHeaders.includes(header)) {
            if (config.handleDuplicates === 'rename') {
              targetHeader = `${file.name}_${header}`;
            } else if (config.handleDuplicates === 'skip') {
              return;
            }
          }
          
          mergedRow[targetHeader] = matchedRow[header];
        });
        
        return mergedRow;
      } else {
        unmatchedRows++;
        
        if (config.mergeStrategy === 'inner') {
          // 內連接：沒有匹配的資料會被過濾掉
          return null;
        }
        
        // 左連接或外連接：保留基底資料，新欄位填充 null
        const mergedRow = { ...baseRow };
        newHeaders.forEach(header => {
          mergedRow[header] = null;
        });
        return mergedRow;
      }
    }).filter(row => row !== null);

    // 處理外連接：加入右側未匹配的資料
    if (config.mergeStrategy === 'outer') {
      file.data.forEach(fileRow => {
        const keyValue = normalizeKeyValue(fileRow[keyField], config.caseSensitive);
        if (!processedBaseKeys.has(keyValue)) {
          unmatchedRows++;
          const newRow: any = {};
          
          // 填充基底檔案的欄位為 null
          baseFile.headers.forEach(header => {
            newRow[header] = header === baseKeyField ? fileRow[keyField] : null;
          });
          
          // 加入當前檔案的資料
          file.headers.forEach(header => {
            if (header !== keyField) {
              let targetHeader = header;
              if (allHeaders.includes(header) && !newHeaders.includes(header)) {
                if (config.handleDuplicates === 'rename') {
                  targetHeader = `${file.name}_${header}`;
                }
              }
              newRow[targetHeader] = fileRow[header];
            }
          });
          
          mergedData.push(newRow);
        }
      });
    }
  }

  return {
    headers: allHeaders,
    data: mergedData,
    mergeInfo: {
      totalRows: mergedData.length,
      matchedRows,
      unmatchedRows,
      duplicateColumns: [...new Set(duplicateColumns)]
    }
  };
}

/**
 * 標準化關鍵值
 * 用於比對時統一格式
 */
function normalizeKeyValue(value: any, caseSensitive?: boolean): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  let normalized = String(value).trim();
  
  if (!caseSensitive) {
    normalized = normalized.toLowerCase();
  }
  
  return normalized;
}

/**
 * 自動偵測可能的關鍵欄位
 * 分析欄位的唯一性來推薦合適的關鍵欄位
 */
export function detectKeyFields(file: UploadedFile): KeyFieldCandidate[] {
  const candidates: KeyFieldCandidate[] = [];
  
  file.headers.forEach(header => {
    const values = file.data.map(row => row[header]);
    const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
    const uniqueValues = new Set(nonNullValues);
    
    const uniquenessRatio = nonNullValues.length > 0 
      ? uniqueValues.size / nonNullValues.length 
      : 0;
    
    const hasNulls = values.length > nonNullValues.length;
    
    // 判斷信心度
    let confidence: 'high' | 'medium' | 'low' = 'low';
    let reason = '';
    
    if (uniquenessRatio >= 0.95 && !hasNulls) {
      confidence = 'high';
      reason = '高唯一性且無空值';
    } else if (uniquenessRatio >= 0.8 && !hasNulls) {
      confidence = 'medium';
      reason = '中等唯一性且無空值';
    } else if (uniquenessRatio >= 0.95 && hasNulls) {
      confidence = 'medium';
      reason = '高唯一性但有空值';
    } else {
      confidence = 'low';
      reason = uniquenessRatio < 0.5 ? '唯一性過低' : '可能有重複值';
    }
    
    // 根據欄位名稱提升信心度
    const keyFieldPatterns = [
      /^id$/i,
      /^.*_id$/i,
      /^uuid$/i,
      /^guid$/i,
      /^key$/i,
      /^code$/i,
      /^編號$/,
      /^序號$/,
      /^代碼$/,
      /^客戶編號$/,
      /^員工編號$/
    ];
    
    if (keyFieldPatterns.some(pattern => pattern.test(header))) {
      if (confidence === 'low') confidence = 'medium';
      if (confidence === 'medium') confidence = 'high';
      reason += '（欄位名稱符合關鍵欄位模式）';
    }
    
    candidates.push({
      field: header,
      uniqueCount: uniqueValues.size,
      totalCount: nonNullValues.length,
      uniquenessRatio,
      hasNulls,
      confidence,
      reason
    });
  });
  
  // 按信心度和唯一性排序
  candidates.sort((a, b) => {
    const confidenceOrder = { high: 3, medium: 2, low: 1 };
    const confidenceDiff = confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
    if (confidenceDiff !== 0) return confidenceDiff;
    return b.uniquenessRatio - a.uniquenessRatio;
  });
  
  return candidates;
}

/**
 * 處理重複欄位名稱
 * 在合併前重新命名重複的欄位
 */
export function handleDuplicateColumns(
  files: UploadedFile[],
  strategy: 'rename' | 'override' | 'skip' = 'rename'
): UploadedFile[] {
  if (files.length <= 1) return files;
  
  const allHeaders = new Map<string, number>();
  const processedFiles = [...files];
  
  // 統計所有欄位出現次數
  files.forEach(file => {
    file.headers.forEach(header => {
      allHeaders.set(header, (allHeaders.get(header) || 0) + 1);
    });
  });
  
  // 找出重複的欄位
  const duplicates = Array.from(allHeaders.entries())
    .filter(([_, count]) => count > 1)
    .map(([header, _]) => header);
  
  if (duplicates.length === 0) return processedFiles;
  
  // 根據策略處理重複欄位
  if (strategy === 'rename') {
    processedFiles.forEach((file, fileIndex) => {
      if (fileIndex === 0) return; // 保留第一個檔案的欄位名稱
      
      const newHeaders = [...file.headers];
      const newData = file.data.map(row => ({ ...row }));
      
      duplicates.forEach(dupHeader => {
        const headerIndex = file.headers.indexOf(dupHeader);
        if (headerIndex === -1) return;
        
        const newHeader = `${file.name}_${dupHeader}`;
        newHeaders[headerIndex] = newHeader;
        
        // 更新資料中的欄位名稱
        newData.forEach(row => {
          row[newHeader] = row[dupHeader];
          delete row[dupHeader];
        });
      });
      
      file.headers = newHeaders;
      file.data = newData;
    });
  }
  
  return processedFiles;
}

/**
 * 驗證合併結果
 * 檢查合併後的資料完整性
 */
export function validateMerge(mergedTable: MergedTable): {
  isValid: boolean;
  issues: string[];
  warnings: string[];
} {
  const issues: string[] = [];
  const warnings: string[] = [];
  let isValid = true;
  
  // 檢查是否有資料
  if (mergedTable.data.length === 0) {
    issues.push('合併結果沒有資料');
    isValid = false;
  }
  
  // 檢查是否有欄位
  if (mergedTable.headers.length === 0) {
    issues.push('合併結果沒有欄位');
    isValid = false;
  }
  
  // 檢查重複欄位
  if (mergedTable.mergeInfo.duplicateColumns.length > 0) {
    warnings.push(
      `發現 ${mergedTable.mergeInfo.duplicateColumns.length} 個重複欄位：${
        mergedTable.mergeInfo.duplicateColumns.join(', ')
      }`
    );
  }
  
  // 檢查未匹配的資料
  const unmatchedRatio = mergedTable.mergeInfo.unmatchedRows / mergedTable.mergeInfo.totalRows;
  if (unmatchedRatio > 0.5) {
    warnings.push(`超過 50% 的資料未能匹配 (${mergedTable.mergeInfo.unmatchedRows}/${mergedTable.mergeInfo.totalRows})`);
  }
  
  // 檢查空值比例
  const nullCounts = new Map<string, number>();
  mergedTable.headers.forEach(header => {
    nullCounts.set(header, 0);
  });
  
  mergedTable.data.forEach(row => {
    mergedTable.headers.forEach(header => {
      if (row[header] === null || row[header] === undefined || row[header] === '') {
        nullCounts.set(header, (nullCounts.get(header) || 0) + 1);
      }
    });
  });
  
  nullCounts.forEach((count, header) => {
    const nullRatio = count / mergedTable.data.length;
    if (nullRatio > 0.8) {
      warnings.push(`欄位 "${header}" 有超過 80% 的空值`);
    }
  });
  
  return {
    isValid,
    issues,
    warnings
  };
}

/**
 * 取得欄位統計資訊
 * 分析欄位的資料類型、範圍等
 */
export function getFieldStatistics(
  data: any[],
  field: string
): FieldStatistics {
  const values = data.map(row => row[field]);
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
  const uniqueValues = new Set(nonNullValues);
  
  // 推測欄位類型 - 檢查所有值而非只看第一個
  let fieldType: any = 'text';
  if (nonNullValues.length > 0) {
    // 統計各種類型的出現次數
    const typeVotes: Record<string, number> = {
      boolean: 0,
      number: 0,
      date: 0,
      email: 0,
      url: 0,
      phone: 0,
      text: 0
    };
    
    // 檢查前100個值（避免處理太多資料）
    const samplesToCheck = nonNullValues.slice(0, Math.min(100, nonNullValues.length));
    
    samplesToCheck.forEach(sample => {
      if (typeof sample === 'boolean') {
        typeVotes.boolean++;
      } else if (typeof sample === 'number') {
        typeVotes.number++;
      } else if (typeof sample === 'string') {
        const stringSample = String(sample).trim();
        
        // 檢查是否為純數字（但排除包含中文的情況）
        if (/^-?\d+(\.\d+)?$/.test(stringSample) && !/[\u4e00-\u9fa5]/.test(stringSample)) {
          typeVotes.number++;
        } else if (/^\d{4}-\d{2}-\d{2}/.test(stringSample)) {
          typeVotes.date++;
        } else if (/^[\w.-]+@[\w.-]+\.\w+$/.test(stringSample)) {
          typeVotes.email++;
        } else if (/^https?:\/\//.test(stringSample)) {
          typeVotes.url++;
        } else if (/^[\d\s()+-]+$/.test(stringSample) && stringSample.length >= 7) {
          typeVotes.phone++;
        } else {
          typeVotes.text++;
        }
      } else {
        typeVotes.text++;
      }
    });
    
    // 找出最常見的類型（至少要有70%的一致性才判定為特定類型）
    const threshold = samplesToCheck.length * 0.7;
    let maxVotes = 0;
    let detectedType = 'text';
    
    Object.entries(typeVotes).forEach(([type, votes]) => {
      if (votes > maxVotes && votes >= threshold) {
        maxVotes = votes;
        detectedType = type;
      }
    });
    
    // 如果沒有明確的類型佔優勢，預設為文字
    fieldType = detectedType;
  }
  
  // 計算統計資訊
  const stats: FieldStatistics = {
    field,
    type: fieldType,
    nonNullCount: nonNullValues.length,
    nullCount: values.length - nonNullValues.length,
    uniqueValues: uniqueValues.size,
    sampleValues: Array.from(uniqueValues).slice(0, 5)
  };
  
  // 根據類型計算額外統計
  if (fieldType === 'number') {
    // 只計算真正是數字的值（排除包含中文或其他非數字字元的值）
    const numbers = nonNullValues
      .filter(v => {
        const str = String(v).trim();
        return /^-?\d+(\.\d+)?$/.test(str) && !/[\u4e00-\u9fa5]/.test(str);
      })
      .map(v => Number(v))
      .filter(n => !isNaN(n));
    
    if (numbers.length > 0) {
      stats.minValue = Math.min(...numbers);
      stats.maxValue = Math.max(...numbers);
    }
  } else if (fieldType === 'text') {
    const lengths = nonNullValues.map(v => String(v).length);
    if (lengths.length > 0) {
      stats.minLength = Math.min(...lengths);
      stats.maxLength = Math.max(...lengths);
    }
  }
  
  return stats;
}

/**
 * 預覽合併結果
 * 返回前 N 行資料供預覽
 */
export function previewMergedData(
  mergedTable: MergedTable,
  rows: number = 10
): {
  headers: string[];
  data: any[];
  hasMore: boolean;
} {
  return {
    headers: mergedTable.headers,
    data: mergedTable.data.slice(0, rows),
    hasMore: mergedTable.data.length > rows
  };
}

/**
 * 匯出合併結果為 CSV
 */
export function exportMergedTableToCSV(mergedTable: MergedTable): string {
  if (mergedTable.data.length === 0) {
    return '';
  }
  
  // 生成標題行
  const headers = mergedTable.headers.map(h => escapeCSVField(h));
  const lines = [headers.join(',')];
  
  // 生成資料行
  mergedTable.data.forEach(row => {
    const values = mergedTable.headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) {
        return '';
      }
      return escapeCSVField(String(value));
    });
    lines.push(values.join(','));
  });
  
  return lines.join('\n');
}

/**
 * 轉義 CSV 欄位值
 */
function escapeCSVField(value: string): string {
  if (value.includes(',') || value.includes('\n') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}