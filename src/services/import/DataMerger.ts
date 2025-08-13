/**
 * 進階資料合併器
 * 支援多種 join 策略和資料合併操作
 */

import {
  IDataMerger,
  FileRelation,
  MergeStrategy } from '@/types/intelligentImport';

interface ParsedFile {
  name: string;
  headers: string[];
  data: any[][];
  rowCount: number;
}

interface DataTable {
  headers: string[];
  data: any[][];
  metadata?: {
    sourceFiles: string[];
    mergeDate: Date;
    totalRows: number;
    duplicatesRemoved?: number;
    missingValuesFilled?: number;
  };
}

interface IndexedData {
  [key: string]: any[][];
}

export class DataMerger implements IDataMerger {
  private readonly maxPreviewRows: number = 100;
  private readonly defaultFillValue: any = null;

  /**
   * 合併多個檔案
   */
  merge(
    files: ParsedFile[],
    relations: FileRelation[],
    strategy: MergeStrategy
  ): DataTable {
    if (files.length === 0) {
      return { headers: [], data: [] };
    }

    // 如果只有一個檔案，直接處理
    if (files.length === 1) {
      return this.processSingleFile(files[0], strategy);
    }

    // 建立基礎表格
    let result = this.prepareBaseTable(files[0]);

    // 執行關聯合併
    for (const relation of relations) {
      if (relation.targetFile < files.length) {
        result = this.applyJoin(
          result,
          files[relation.targetFile],
          relation
        );
      }
    }

    // 後處理
    result = this.applyPostProcessing(result, strategy);

    // 添加元資料
    result.metadata = {
      sourceFiles: files.map(f => f.name),
      mergeDate: new Date(),
      totalRows: result.data.length };

    return result;
  }

  /**
   * 預覽合併結果
   */
  preview(
    files: ParsedFile[],
    relations: FileRelation[],
    limit: number = 100
  ): DataTable {
    // 使用有限的資料進行預覽
    const previewFiles = files.map(file => ({
      ...file,
      data: file.data.slice(0, Math.min(limit, file.data.length)) }));

    const result = this.merge(previewFiles, relations, {
      removeDuplicates: false,
      fillMissingValues: false });

    // 限制結果行數
    if (result.data.length > limit) {
      result.data = result.data.slice(0, limit);
    }

    return result;
  }

  /**
   * 估算合併結果大小
   */
  estimateResultSize(
    files: ParsedFile[],
    relations: FileRelation[]
  ): number {
    if (files.length === 0) return 0;
    if (files.length === 1) return files[0].rowCount;

    let estimatedSize = files[0].rowCount;

    for (const relation of relations) {
      const targetFile = files[relation.targetFile];
      
      switch (relation.relationType) {
        case 'one-to-one':
          // 一對一關聯，行數不變
          break;
        
        case 'one-to-many':
          // 一對多關聯，可能增加行數
          estimatedSize *= 1.5;
          break;
        
        case 'many-to-many':
          // 多對多關聯，可能大幅增加行數
          estimatedSize *= 2;
          break;
      }

      // 根據 join 類型調整
      switch (relation.joinType) {
        case 'inner':
          // inner join 可能減少行數
          estimatedSize *= 0.8;
          break;
        
        case 'full':
          // full join 可能增加行數
          estimatedSize += targetFile.rowCount * 0.3;
          break;
      }
    }

    return Math.ceil(estimatedSize);
  }

  /**
   * 準備基礎表格
   */
  private prepareBaseTable(file: ParsedFile): DataTable {
    return {
      headers: [...file.headers],
      data: file.data.map(row => [...row]) };
  }

  /**
   * 處理單一檔案
   */
  private processSingleFile(
    file: ParsedFile,
    strategy: MergeStrategy
  ): DataTable {
    let result = this.prepareBaseTable(file);
    return this.applyPostProcessing(result, strategy);
  }

  /**
   * 執行 join 操作
   */
  private applyJoin(
    left: DataTable,
    right: ParsedFile,
    relation: FileRelation
  ): DataTable {
    const leftFieldIndex = left.headers.indexOf(relation.sourceField);
    
    if (leftFieldIndex === -1) {
      console.warn(`找不到來源欄位: ${relation.sourceField}`);
      return left;
    }

    const rightFieldIndex = right.headers.indexOf(relation.targetField);
    
    if (rightFieldIndex === -1) {
      console.warn(`找不到目標欄位: ${relation.targetField}`);
      return left;
    }

    // 根據 join 類型執行不同的合併策略
    switch (relation.joinType) {
      case 'inner':
        return this.innerJoin(left, right, leftFieldIndex, rightFieldIndex);
      
      case 'left':
        return this.leftJoin(left, right, leftFieldIndex, rightFieldIndex);
      
      case 'right':
        return this.rightJoin(left, right, leftFieldIndex, rightFieldIndex);
      
      case 'full':
        return this.fullJoin(left, right, leftFieldIndex, rightFieldIndex);
      
      default:
        return this.leftJoin(left, right, leftFieldIndex, rightFieldIndex);
    }
  }

  /**
   * Inner Join
   */
  private innerJoin(
    left: DataTable,
    right: ParsedFile,
    leftKeyIndex: number,
    rightKeyIndex: number
  ): DataTable {
    const result: DataTable = {
      headers: this.mergeHeaders(left.headers, right.headers, right.name),
      data: [] };

    // 建立右表索引
    const rightIndex = this.buildIndex(right.data, rightKeyIndex);

    // 執行 inner join
    for (const leftRow of left.data) {
      const key = this.normalizeKey(leftRow[leftKeyIndex]);
      const rightRows = rightIndex.get(key);

      if (rightRows && rightRows.length > 0) {
        for (const rightRow of rightRows) {
          result.data.push(this.mergeRows(leftRow, rightRow, right.headers));
        }
      }
    }

    return result;
  }

  /**
   * Left Join
   */
  private leftJoin(
    left: DataTable,
    right: ParsedFile,
    leftKeyIndex: number,
    rightKeyIndex: number
  ): DataTable {
    const result: DataTable = {
      headers: this.mergeHeaders(left.headers, right.headers, right.name),
      data: [] };

    // 建立右表索引
    const rightIndex = this.buildIndex(right.data, rightKeyIndex);
    const rightNullRow = new Array(right.headers.length).fill(null);

    // 執行 left join
    for (const leftRow of left.data) {
      const key = this.normalizeKey(leftRow[leftKeyIndex]);
      const rightRows = rightIndex.get(key);

      if (rightRows && rightRows.length > 0) {
        for (const rightRow of rightRows) {
          result.data.push(this.mergeRows(leftRow, rightRow, right.headers));
        }
      } else {
        // 沒有匹配，使用 null 值
        result.data.push(this.mergeRows(leftRow, rightNullRow, right.headers));
      }
    }

    return result;
  }

  /**
   * Right Join
   */
  private rightJoin(
    left: DataTable,
    right: ParsedFile,
    leftKeyIndex: number,
    rightKeyIndex: number
  ): DataTable {
    const result: DataTable = {
      headers: this.mergeHeaders(left.headers, right.headers, right.name),
      data: [] };

    // 建立左表索引
    const leftIndex = this.buildIndex(left.data, leftKeyIndex);
    const leftNullRow = new Array(left.headers.length).fill(null);
    const processedRightKeys = new Set<string>();

    // 先處理有匹配的記錄
    for (const rightRow of right.data) {
      const key = this.normalizeKey(rightRow[rightKeyIndex]);
      processedRightKeys.add(key);
      
      const leftRows = leftIndex.get(key);

      if (leftRows && leftRows.length > 0) {
        for (const leftRow of leftRows) {
          result.data.push(this.mergeRows(leftRow, rightRow, right.headers));
        }
      } else {
        // 沒有匹配，使用 null 值
        result.data.push(this.mergeRows(leftNullRow, rightRow, right.headers));
      }
    }

    return result;
  }

  /**
   * Full Join
   */
  private fullJoin(
    left: DataTable,
    right: ParsedFile,
    leftKeyIndex: number,
    rightKeyIndex: number
  ): DataTable {
    const result: DataTable = {
      headers: this.mergeHeaders(left.headers, right.headers, right.name),
      data: [] };

    // 建立索引
    const rightIndex = this.buildIndex(right.data, rightKeyIndex);
    const rightNullRow = new Array(right.headers.length).fill(null);
    const leftNullRow = new Array(left.headers.length).fill(null);
    const processedRightKeys = new Set<string>();

    // 處理左表的所有記錄
    for (const leftRow of left.data) {
      const key = this.normalizeKey(leftRow[leftKeyIndex]);
      const rightRows = rightIndex.get(key);

      if (rightRows && rightRows.length > 0) {
        for (const rightRow of rightRows) {
          result.data.push(this.mergeRows(leftRow, rightRow, right.headers));
          processedRightKeys.add(key);
        }
      } else {
        result.data.push(this.mergeRows(leftRow, rightNullRow, right.headers));
      }
    }

    // 處理右表中沒有匹配的記錄
    for (const rightRow of right.data) {
      const key = this.normalizeKey(rightRow[rightKeyIndex]);
      
      if (!processedRightKeys.has(key)) {
        result.data.push(this.mergeRows(leftNullRow, rightRow, right.headers));
      }
    }

    return result;
  }

  /**
   * 建立資料索引
   */
  private buildIndex(data: any[][], keyIndex: number): Map<string, any[][]> {
    const index = new Map<string, any[][]>();

    for (const row of data) {
      const key = this.normalizeKey(row[keyIndex]);
      
      if (!index.has(key)) {
        index.set(key, []);
      }
      
      index.get(key)!.push(row);
    }

    return index;
  }

  /**
   * 標準化鍵值
   */
  private normalizeKey(value: any): string {
    if (value == null) return '';
    
    return String(value)
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');
  }

  /**
   * 合併欄位標題
   */
  private mergeHeaders(
    leftHeaders: string[],
    rightHeaders: string[],
    rightTableName: string
  ): string[] {
    const headers = [...leftHeaders];
    const existingHeaders = new Set(leftHeaders);

    for (const header of rightHeaders) {
      let newHeader = header;
      
      // 如果欄位已存在，添加表格名稱作為前綴
      if (existingHeaders.has(header)) {
        newHeader = `${rightTableName}.${header}`;
        
        // 確保新名稱也不重複
        let counter = 1;
        while (existingHeaders.has(newHeader)) {
          newHeader = `${rightTableName}.${header}_${counter}`;
          counter++;
        }
      }

      headers.push(newHeader);
      existingHeaders.add(newHeader);
    }

    return headers;
  }

  /**
   * 合併兩行資料
   */
  private mergeRows(
    leftRow: any[],
    rightRow: any[],
    rightHeaders: string[]
  ): any[] {
    return [...leftRow, ...rightRow];
  }

  /**
   * 應用後處理策略
   */
  private applyPostProcessing(
    data: DataTable,
    strategy: MergeStrategy
  ): DataTable {
    let result = { ...data };

    // 移除重複
    if (strategy.removeDuplicates) {
      result = this.removeDuplicates(
        result,
        strategy.duplicateKeyFields || []
      );
    }

    // 填充缺失值
    if (strategy.fillMissingValues) {
      result = this.fillMissingValues(
        result,
        strategy.fillStrategy || 'default'
      );
    }

    // 解決衝突
    if (strategy.conflictResolution) {
      result = this.resolveConflicts(
        result,
        strategy.conflictResolution
      );
    }

    return result;
  }

  /**
   * 移除重複記錄
   */
  private removeDuplicates(
    data: DataTable,
    keyFields: string[]
  ): DataTable {
    if (keyFields.length === 0) {
      // 如果沒有指定鍵，使用所有欄位
      keyFields = data.headers;
    }

    const keyIndices = keyFields.map(field => 
      data.headers.indexOf(field)
    ).filter(idx => idx !== -1);

    if (keyIndices.length === 0) {
      return data;
    }

    const seen = new Set<string>();
    const uniqueRows: any[][] = [];
    let duplicatesRemoved = 0;

    for (const row of data.data) {
      const key = keyIndices
        .map(idx => this.normalizeKey(row[idx]))
        .join('|');

      if (!seen.has(key)) {
        seen.add(key);
        uniqueRows.push(row);
      } else {
        duplicatesRemoved++;
      }
    }

    const result = {
      ...data,
      data: uniqueRows };

    if (result.metadata) {
      result.metadata.duplicatesRemoved = duplicatesRemoved;
    }

    return result;
  }

  /**
   * 填充缺失值
   */
  private fillMissingValues(
    data: DataTable,
    strategy: 'default' | 'previous' | 'next' | 'average' | 'custom'
  ): DataTable {
    const filledData = data.data.map((row, rowIndex) => {
      return row.map((value, colIndex) => {
        if (value == null || value === '') {
          return this.getFillValue(
            data.data,
            rowIndex,
            colIndex,
            strategy
          );
        }
        return value;
      });
    });

    let missingValuesFilled = 0;
    for (let i = 0; i < data.data.length; i++) {
      for (let j = 0; j < data.data[i].length; j++) {
        if (data.data[i][j] == null && filledData[i][j] != null) {
          missingValuesFilled++;
        }
      }
    }

    const result = {
      ...data,
      data: filledData };

    if (result.metadata) {
      result.metadata.missingValuesFilled = missingValuesFilled;
    }

    return result;
  }

  /**
   * 獲取填充值
   */
  private getFillValue(
    data: any[][],
    rowIndex: number,
    colIndex: number,
    strategy: string
  ): any {
    switch (strategy) {
      case 'previous':
        // 使用前一行的值
        if (rowIndex > 0) {
          return data[rowIndex - 1][colIndex];
        }
        return this.defaultFillValue;

      case 'next':
        // 使用後一行的值
        if (rowIndex < data.length - 1) {
          return data[rowIndex + 1][colIndex];
        }
        return this.defaultFillValue;

      case 'average':
        // 計算平均值（僅適用於數字）
        const columnValues = data
          .map(row => row[colIndex])
          .filter(v => v != null && !isNaN(Number(v)))
          .map(v => Number(v));

        if (columnValues.length > 0) {
          const avg = columnValues.reduce((a, b) => a + b, 0) / columnValues.length;
          return Math.round(avg * 100) / 100;
        }
        return this.defaultFillValue;

      case 'default':
      default:
        return this.defaultFillValue;
    }
  }

  /**
   * 解決衝突
   */
  private resolveConflicts(
    data: DataTable,
    resolution: 'keep-first' | 'keep-last' | 'merge' | 'custom'
  ): DataTable {
    // 這裡可以實作更複雜的衝突解決邏輯
    // 目前簡單實作 keep-first 和 keep-last
    
    if (resolution === 'keep-last') {
      // 反轉資料，保留最後出現的值
      return {
        ...data,
        data: data.data.reverse() };
    }

    return data;
  }

  /**
   * 獲取合併統計
   */
  getMergeStatistics(result: DataTable): {
    totalRows: number;
    totalColumns: number;
    nullValues: number;
    duplicates?: number;
    sourceFiles: string[];
  } {
    let nullValues = 0;
    
    for (const row of result.data) {
      for (const value of row) {
        if (value == null || value === '') {
          nullValues++;
        }
      }
    }

    return {
      totalRows: result.data.length,
      totalColumns: result.headers.length,
      nullValues,
      duplicates: result.metadata?.duplicatesRemoved,
      sourceFiles: result.metadata?.sourceFiles || [] };
  }
}