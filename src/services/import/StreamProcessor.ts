/**
 * 串流處理器
 * 用於處理大型檔案的批次匯入
 */

import {
  IStreamProcessor,
  BatchProcessOptions,
  ImportProgress,
  ImportError,
} from '@/types/intelligentImport';
import { db } from '@/config/firebase';
import { 
  collection, 
  doc, 
  writeBatch,
  serverTimestamp,
  WriteBatch 
} from 'firebase/firestore';
import Papa from 'papaparse';

export class StreamProcessor implements IStreamProcessor {
  private isPaused: boolean = false;
  private isCancelled: boolean = false;
  private currentProgress: ImportProgress;
  private currentBatch: WriteBatch | null = null;
  private batchOperationCount: number = 0;
  private readonly MAX_BATCH_SIZE = 500; // Firestore 批次寫入限制
  private startTime: number = 0;
  private peakMemoryUsage: number = 0;
  private retryQueue: Array<{ data: any; attempts: number }> = [];

  constructor(
    private targetCollection: string,
    private transformFunction?: (row: any) => any
  ) {
    this.currentProgress = {
      stage: 'parsing',
      processed: 0,
      total: 0,
      percentage: 0,
      errors: 0,
      warnings: 0,
    };
  }

  /**
   * 處理大型檔案
   */
  async processLargeFile(
    file: File,
    options: BatchProcessOptions
  ): Promise<void> {
    this.reset();
    this.startTime = Date.now();
    
    const chunkSize = options.chunkSize || 1000;
    const estimatedTotal = options.estimatedTotal || this.estimateFileRows(file);
    
    this.currentProgress.total = estimatedTotal;
    this.currentProgress.currentFile = file.name;

    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        chunk: async (results, parser) => {
          // 檢查是否暫停或取消
          if (this.isPaused) {
            parser.pause();
            await this.waitForResume();
            parser.resume();
          }

          if (this.isCancelled) {
            parser.abort();
            reject(new Error('處理已取消'));
            return;
          }

          // 處理資料塊
          try {
            await this.processChunk(results.data, options);
          } catch (error) {
            if (options.onError) {
              options.onError({
                type: 'import',
                message: `處理資料塊失敗: ${error}`,
                recoverable: true,
              });
            }
            
            // 決定是否繼續
            if (options.retryAttempts && options.retryAttempts > 0) {
              this.addToRetryQueue(results.data, options.retryAttempts);
            } else {
              parser.abort();
              reject(error);
              return;
            }
          }

          // 更新記憶體使用情況
          this.updateMemoryUsage();
        },
        complete: async () => {
          try {
            // 處理最後的批次
            await this.flushBatch();
            
            // 處理重試佇列
            await this.processRetryQueue(options);
            
            // 更新進度
            this.currentProgress.stage = 'complete';
            this.currentProgress.percentage = 100;
            
            if (options.onProgress) {
              options.onProgress(this.currentProgress);
            }

            resolve();
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => {
          if (options.onError) {
            options.onError({
              type: 'parse',
              message: `解析檔案失敗: ${error.message}`,
              recoverable: false,
            });
          }
          reject(error);
        }
      });
    });
  }

  /**
   * 處理資料塊
   */
  private async processChunk(
    data: any[],
    options: BatchProcessOptions
  ): Promise<void> {
    // 驗證階段
    this.currentProgress.stage = 'validating';
    
    for (const row of data) {
      try {
        // 轉換資料
        const transformedRow = this.transformFunction 
          ? this.transformFunction(row) 
          : row;

        // 添加到批次
        await this.addToBatch(transformedRow);
        
        // 更新進度
        this.currentProgress.processed++;
        this.updateProgress(options);
        
      } catch (error: any) {
        this.currentProgress.errors++;
        
        if (options.onError) {
          options.onError({
            type: 'validation',
            message: error.message,
            row: this.currentProgress.processed,
            value: row,
            recoverable: true,
          });
        }
      }
    }

    // 檢查記憶體限制
    if (options.memoryLimit && this.peakMemoryUsage > options.memoryLimit) {
      await this.flushBatch();
      
      // 強制垃圾回收（如果可用）
      if (global.gc) {
        global.gc();
      }
    }
  }

  /**
   * 添加到批次
   */
  private async addToBatch(data: any): Promise<void> {
    if (!this.currentBatch) {
      this.currentBatch = writeBatch(db);
      this.batchOperationCount = 0;
    }

    const docRef = doc(collection(db, this.targetCollection));
    
    this.currentBatch.set(docRef, {
      ...data,
      _importedAt: serverTimestamp(),
      _importBatch: Math.floor(this.currentProgress.processed / this.MAX_BATCH_SIZE),
    });

    this.batchOperationCount++;

    // 如果批次已滿，執行寫入
    if (this.batchOperationCount >= this.MAX_BATCH_SIZE) {
      await this.flushBatch();
    }
  }

  /**
   * 執行批次寫入
   */
  private async flushBatch(): Promise<void> {
    if (!this.currentBatch || this.batchOperationCount === 0) {
      return;
    }

    this.currentProgress.stage = 'importing';

    try {
      await this.currentBatch.commit();
      
      // 重置批次
      this.currentBatch = null;
      this.batchOperationCount = 0;
      
    } catch (error: any) {
      // 處理批次寫入錯誤
      console.error('批次寫入失敗:', error);
      
      // 可以選擇重試或跳過
      throw new Error(`批次寫入失敗: ${error.message}`);
    }
  }

  /**
   * 處理重試佇列
   */
  private async processRetryQueue(
    options: BatchProcessOptions
  ): Promise<void> {
    if (this.retryQueue.length === 0) {
      return;
    }

    const maxRetries = options.retryAttempts || 3;
    const retryDelay = options.retryDelay || 1000;
    const failedItems: any[] = [];

    for (const item of this.retryQueue) {
      if (item.attempts >= maxRetries) {
        failedItems.push(item.data);
        continue;
      }

      // 等待重試延遲
      await new Promise(resolve => setTimeout(resolve, retryDelay));

      try {
        await this.addToBatch(item.data);
      } catch (error) {
        item.attempts++;
        
        if (item.attempts < maxRetries) {
          // 重新加入佇列
          this.retryQueue.push(item);
        } else {
          failedItems.push(item.data);
        }
      }
    }

    // 最後一次刷新批次
    await this.flushBatch();

    // 報告失敗的項目
    if (failedItems.length > 0 && options.onError) {
      options.onError({
        type: 'import',
        message: `${failedItems.length} 筆資料匯入失敗`,
        value: failedItems,
        recoverable: false,
      });
    }
  }

  /**
   * 添加到重試佇列
   */
  private addToRetryQueue(data: any[], maxAttempts: number): void {
    for (const row of data) {
      this.retryQueue.push({
        data: row,
        attempts: 0,
      });
    }
  }

  /**
   * 更新進度
   */
  private updateProgress(options: BatchProcessOptions): void {
    const elapsed = Date.now() - this.startTime;
    const speed = this.currentProgress.processed / (elapsed / 1000);
    
    this.currentProgress.percentage = Math.min(
      100,
      (this.currentProgress.processed / this.currentProgress.total) * 100
    );
    
    this.currentProgress.speed = Math.round(speed);
    
    // 估算剩餘時間
    if (speed > 0) {
      const remaining = this.currentProgress.total - this.currentProgress.processed;
      this.currentProgress.estimatedTimeRemaining = Math.round(remaining / speed);
    }

    // 批次資訊
    this.currentProgress.currentBatch = Math.floor(
      this.currentProgress.processed / (options.chunkSize || 1000)
    );
    this.currentProgress.totalBatches = Math.ceil(
      this.currentProgress.total / (options.chunkSize || 1000)
    );

    // 回調進度更新
    if (options.onProgress) {
      options.onProgress(this.currentProgress);
    }
  }

  /**
   * 更新記憶體使用情況
   */
  private updateMemoryUsage(): void {
    if (performance && 'memory' in performance) {
      const memoryInfo = (performance as any).memory;
      const usedMemory = (memoryInfo.usedJSHeapSize / 1048576); // 轉換為 MB
      
      this.peakMemoryUsage = Math.max(this.peakMemoryUsage, usedMemory);
      this.currentProgress.memoryUsage = Math.round(usedMemory);
    }
  }

  /**
   * 估算檔案行數
   */
  private estimateFileRows(file: File): number {
    // 基於檔案大小的粗略估算
    // 假設平均每行 100 bytes
    return Math.ceil(file.size / 100);
  }

  /**
   * 等待恢復
   */
  private async waitForResume(): Promise<void> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (!this.isPaused || this.isCancelled) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }

  /**
   * 暫停處理
   */
  pause(): void {
    this.isPaused = true;
  }

  /**
   * 恢復處理
   */
  resume(): void {
    this.isPaused = false;
  }

  /**
   * 取消處理
   */
  cancel(): void {
    this.isCancelled = true;
    this.isPaused = false;
  }

  /**
   * 獲取當前進度
   */
  getProgress(): ImportProgress {
    return { ...this.currentProgress };
  }

  /**
   * 重置處理器
   */
  private reset(): void {
    this.isPaused = false;
    this.isCancelled = false;
    this.currentBatch = null;
    this.batchOperationCount = 0;
    this.retryQueue = [];
    this.peakMemoryUsage = 0;
    
    this.currentProgress = {
      stage: 'parsing',
      processed: 0,
      total: 0,
      percentage: 0,
      errors: 0,
      warnings: 0,
    };
  }

  /**
   * 獲取處理統計
   */
  getStatistics(): {
    totalProcessed: number;
    totalErrors: number;
    processingTime: number;
    averageSpeed: number;
    peakMemoryUsage: number;
  } {
    const processingTime = (Date.now() - this.startTime) / 1000;
    
    return {
      totalProcessed: this.currentProgress.processed,
      totalErrors: this.currentProgress.errors,
      processingTime: Math.round(processingTime),
      averageSpeed: Math.round(this.currentProgress.processed / processingTime),
      peakMemoryUsage: Math.round(this.peakMemoryUsage),
    };
  }
}

/**
 * 檔案串流讀取器
 */
export class FileStreamReader {
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private decoder = new TextDecoder('utf-8');
  private buffer = '';

  constructor(private file: File) {}

  /**
   * 按塊讀取檔案
   */
  async readByChunks(
    onChunk: (lines: string[]) => Promise<void>,
    chunkSize: number = 65536 // 64KB
  ): Promise<void> {
    const stream = this.file.stream();
    this.reader = stream.getReader();

    try {
      while (true) {
        const { done, value } = await this.reader.read();
        
        if (done) {
          // 處理最後的緩衝區
          if (this.buffer.length > 0) {
            await onChunk([this.buffer]);
          }
          break;
        }

        // 解碼並處理資料
        const text = this.decoder.decode(value, { stream: true });
        this.buffer += text;

        // 按行分割
        const lines = this.buffer.split('\n');
        
        // 保留最後一行（可能不完整）
        this.buffer = lines.pop() || '';

        if (lines.length > 0) {
          await onChunk(lines);
        }
      }
    } finally {
      this.reader.releaseLock();
    }
  }

  /**
   * 取消讀取
   */
  cancel(): void {
    if (this.reader) {
      this.reader.cancel();
    }
  }
}