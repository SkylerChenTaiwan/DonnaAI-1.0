/**
 * CSV 分析服務 - 串流處理版本
 * 支援大檔案（50MB+）的高效分析，使用串流和批次處理
 */

import {
  CSVAnalysisResult,
  CSVData,
  CSVRow,
  CSVCellValue,
  DetectedField,
  FieldStatistics,
  DataQualityIssue,
  AnalyzeCSVRequest,
  AnalyzeCSVResponse,
  CSVFileInfo,
  CSVStatistics,
  DataQualityAssessment,
} from '@/types/dynamic-field-mapping';
import { DynamicFieldAnalyzer } from './DynamicFieldAnalyzer';
import { Timestamp } from 'firebase/firestore';

/**
 * CSV 解析選項
 */
interface CSVParseOptions {
  encoding?: string;       // 檔案編碼
  delimiter?: string;      // 分隔符
  maxRows?: number;        // 最大處理行數
  targetEntity?: string;   // 目標實體
}

/**
 * CSV 串流分析配置
 */
interface StreamConfig extends CSVParseOptions {
  chunkSize: number;      // 每批處理的行數
  maxSampleSize: number;   // 用於類型推測的最大樣本數
  progressInterval: number; // 進度回報間隔（毫秒）
}

/**
 * 映射建議
 */
interface MappingSuggestion {
  sourceField: string;     // 來源欄位
  targetField: string;     // 目標欄位
  confidence: number;      // 信心度
  transformer?: string;    // 轉換器
  reason?: string;         // 建議原因
}

/**
 * 進度回調函數
 */
type ProgressCallback = (progress: {
  current: number;
  total: number;
  phase: string;
  message: string;
  percentage: number;
}) => void;

/**
 * CSV 分析服務
 */
export class CSVAnalysisService {
  private fieldAnalyzer: DynamicFieldAnalyzer;
  private defaultConfig: StreamConfig = {
    chunkSize: 1000,
    maxSampleSize: 5000,
    progressInterval: 500,
    encoding: 'UTF-8',
    delimiter: ',',
  };

  constructor() {
    this.fieldAnalyzer = new DynamicFieldAnalyzer();
  }

  /**
   * 分析 CSV 檔案（支援串流）
   */
  async analyzeCSV(
    request: AnalyzeCSVRequest,
    onProgress?: ProgressCallback
  ): Promise<AnalyzeCSVResponse> {
    const startTime = Date.now();

    try {
      // 根據檔案類型處理
      let headers: string[];
      let dataStream: AsyncIterable<CSVRow>;
      let fileInfo: CSVFileInfo;

      if (request.fileType === 'base64') {
        const result = await this.parseBase64CSV(request.fileData, request.options);
        headers = result.headers;
        dataStream = this.createStreamFromData(result.data);
        fileInfo = result.fileInfo;
      } else {
        // URL 處理（需要 fetch）
        const result = await this.parseURLCSV(request.fileData, request.options);
        headers = result.headers;
        dataStream = result.stream;
        fileInfo = result.fileInfo;
      }

      // 串流分析
      const analysisResult = await this.performStreamAnalysis(
        headers,
        dataStream,
        fileInfo,
        request.options,
        onProgress
      );

      // 建議映射
      const suggestedMappings = await this.generateMappingSuggestions(
        analysisResult.detectedFields,
        request.options?.targetEntity
      );

      return {
        result: analysisResult,
        suggestedMappings,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      throw this.handleAnalysisError(error);
    }
  }

  /**
   * 執行串流分析
   */
  private async performStreamAnalysis(
    headers: string[],
    dataStream: AsyncIterable<CSVRow>,
    fileInfo: CSVFileInfo,
    options?: CSVParseOptions,
    onProgress?: ProgressCallback
  ): Promise<CSVAnalysisResult> {
    const startTime = Date.now();
    const config = { ...this.defaultConfig, ...options };
    
    // 收集樣本用於類型推測
    const samples: CSVData = [];
    const columnStats = new Map<number, ColumnStatCollector>();
    let totalRows = 0;
    let errorRows = 0;
    let lastProgressTime = Date.now();

    // 初始化欄位統計收集器
    for (let i = 0; i < headers.length; i++) {
      columnStats.set(i, new ColumnStatCollector());
    }

    // 串流處理資料
    for await (const row of dataStream) {
      totalRows++;

      // 收集樣本（限制數量）
      if (samples.length < config.maxSampleSize) {
        samples.push(row);
      }

      // 更新欄位統計
      row.forEach((value, index) => {
        const collector = columnStats.get(index);
        if (collector) {
          collector.add(value);
        }
      });

      // 進度回報
      if (onProgress && Date.now() - lastProgressTime > config.progressInterval) {
        onProgress({
          current: totalRows,
          total: fileInfo.rowCount || 0,
          phase: 'analyzing',
          message: `分析中... 已處理 ${totalRows} 行`,
          percentage: fileInfo.rowCount ? (totalRows / fileInfo.rowCount) * 100 : 0,
        });
        lastProgressTime = Date.now();
      }
    }

    // 使用 DynamicFieldAnalyzer 分析欄位
    const fieldAnalysisResult = await this.fieldAnalyzer.analyzeCSV(
      headers,
      samples,
      { maxRows: config.maxSampleSize }
    );

    // 合併統計結果
    const detectedFields = this.mergeFieldAnalysis(
      fieldAnalysisResult.detectedFields,
      columnStats
    );

    // 建立最終結果
    return {
      id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fileInfo: {
        ...fileInfo,
        rowCount: totalRows,
      },
      detectedFields,
      dataPreview: samples.slice(0, 10).map(row => {
        const obj: Record<string, CSVCellValue> = {};
        headers.forEach((h, i) => {
          obj[h] = row[i];
        });
        return obj;
      }),
      statistics: {
        totalRecords: totalRows,
        validRecords: totalRows - errorRows,
        errorRecords: errorRows,
        duplicateRecords: 0, // 串流模式下不計算重複
        completeness: this.calculateCompleteness(columnStats, totalRows),
        fieldStatistics: this.buildFieldStatistics(headers, columnStats),
      },
      dataQuality: fieldAnalysisResult.dataQuality,
      analyzedAt: Timestamp.fromDate(new Date()),
      processingTime: Date.now() - startTime,
    };
  }

  /**
   * 解析 Base64 CSV
   */
  private async parseBase64CSV(
    base64Data: string,
    options?: CSVParseOptions
  ): Promise<{
    headers: string[];
    data: CSVData;
    fileInfo: CSVFileInfo;
  }> {
    // 解碼 base64
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // 解析 CSV
    const text = new TextDecoder(options?.encoding || 'UTF-8').decode(bytes);
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    
    if (lines.length === 0) {
      throw new Error('CSV 檔案為空');
    }

    const delimiter = options?.delimiter || ',';
    const headers = this.parseCSVLine(lines[0], delimiter);
    const data: CSVData = [];

    for (let i = 1; i < lines.length; i++) {
      const row = this.parseCSVLine(lines[i], delimiter);
      if (row.length === headers.length) {
        data.push(row);
      }
    }

    return {
      headers,
      data,
      fileInfo: {
        fileName: 'upload.csv',
        fileSize: bytes.length,
        encoding: options?.encoding || 'UTF-8',
        delimiter,
        hasHeader: true,
        rowCount: data.length,
        columnCount: headers.length,
        fileHash: this.generateHash(text),
      },
    };
  }

  /**
   * 解析 URL CSV（模擬，實際需要後端支援）
   */
  private async parseURLCSV(
    url: string,
    options?: CSVParseOptions
  ): Promise<{
    headers: string[];
    stream: AsyncIterable<CSVRow>;
    fileInfo: CSVFileInfo;
  }> {
    // 這裡需要實際的 fetch 實作
    // 暫時返回模擬資料
    throw new Error('URL CSV 解析需要後端支援');
  }

  /**
   * 建立資料串流
   */
  private async* createStreamFromData(data: CSVData): AsyncIterable<CSVRow> {
    for (const row of data) {
      yield row;
    }
  }

  /**
   * 解析 CSV 行
   */
  private parseCSVLine(line: string, delimiter: string): CSVRow {
    const result: CSVRow = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(this.parseValue(current.trim()));
        current = '';
      } else {
        current += char;
      }
    }

    result.push(this.parseValue(current.trim()));
    return result;
  }

  /**
   * 解析值
   */
  private parseValue(value: string): CSVCellValue {
    if (value === '' || value === 'null' || value === 'NULL') {
      return null;
    }

    // 移除引號
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1).replace(/""/g, '"');
    }

    // 嘗試解析為數字
    const num = Number(value);
    if (!isNaN(num) && value !== '') {
      return num;
    }

    // 嘗試解析為布林值
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;

    return value;
  }

  /**
   * 合併欄位分析結果
   */
  private mergeFieldAnalysis(
    detectedFields: DetectedField[],
    columnStats: Map<number, ColumnStatCollector>
  ): DetectedField[] {
    return detectedFields.map((field, index) => {
      const stats = columnStats.get(index);
      if (stats) {
        return {
          ...field,
          nullCount: stats.nullCount,
          uniqueCount: stats.uniqueValues.size,
        };
      }
      return field;
    });
  }

  /**
   * 計算完整度
   */
  private calculateCompleteness(
    columnStats: Map<number, ColumnStatCollector>,
    totalRows: number
  ): number {
    if (totalRows === 0) return 0;

    let totalNulls = 0;
    columnStats.forEach(stats => {
      totalNulls += stats.nullCount;
    });

    const totalCells = totalRows * columnStats.size;
    const filledCells = totalCells - totalNulls;
    
    return totalCells > 0 ? filledCells / totalCells : 0;
  }

  /**
   * 建立欄位統計
   */
  private buildFieldStatistics(
    headers: string[],
    columnStats: Map<number, ColumnStatCollector>
  ): Record<string, FieldStatistics> {
    const result: Record<string, FieldStatistics> = {};

    headers.forEach((header, index) => {
      const stats = columnStats.get(index);
      if (stats) {
        result[header] = stats.getStatistics();
      }
    });

    return result;
  }

  /**
   * 產生映射建議
   */
  private async generateMappingSuggestions(
    detectedFields: DetectedField[],
    targetEntity?: string
  ): Promise<MappingSuggestion[]> {
    // 這裡可以加入智慧映射邏輯
    const suggestions: MappingSuggestion[] = [];
    
    // TODO: 實作智慧映射邏輯
    // 1. 基於欄位名稱相似度
    // 2. 基於資料類型匹配
    // 3. 基於語意分析
    
    return suggestions;
  }

  /**
   * 處理錯誤
   */
  private handleAnalysisError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }
    return new Error('CSV 分析失敗: ' + String(error));
  }

  /**
   * 產生檔案雜湊
   */
  private generateHash(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = Math.imul(31, hash) + char;
    }
    return Math.abs(hash).toString(36);
  }
}

/**
 * 欄位統計收集器
 */
class ColumnStatCollector {
  nullCount = 0;
  uniqueValues = new Set<string>();
  private values: number[] = [];
  private stringLengths: number[] = [];

  add(value: CSVCellValue): void {
    if (value == null || value === '') {
      this.nullCount++;
    } else {
      this.uniqueValues.add(String(value));
      
      // 數值統計
      if (typeof value === 'number') {
        this.values.push(value);
      }
      
      // 字串長度統計
      if (typeof value === 'string') {
        this.stringLengths.push(value.length);
      }
    }
  }

  getStatistics(): FieldStatistics {
    const stats: FieldStatistics = {
      nullRatio: 0,
      uniqueRatio: 0,
    };

    const total = this.nullCount + this.uniqueValues.size;
    if (total > 0) {
      stats.nullRatio = this.nullCount / total;
      stats.uniqueRatio = this.uniqueValues.size / total;
    }

    // 數值統計
    if (this.values.length > 0) {
      const sorted = [...this.values].sort((a, b) => a - b);
      stats.min = sorted[0];
      stats.max = sorted[sorted.length - 1];
      stats.mean = this.values.reduce((a, b) => a + b, 0) / this.values.length;
      
      const mid = Math.floor(sorted.length / 2);
      stats.median = sorted.length % 2 
        ? sorted[mid] 
        : (sorted[mid - 1] + sorted[mid]) / 2;
    }

    // 字串長度統計
    if (this.stringLengths.length > 0) {
      stats.min = Math.min(...this.stringLengths);
      stats.max = Math.max(...this.stringLengths);
    }

    return stats;
  }
}