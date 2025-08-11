/**
 * 審計日誌寫入服務
 * 負責批量寫入和歸檔管理
 */

import {
  AuditLog,
  RetentionPolicy,
} from '@/types/audit';
import { getFirebaseDb } from '@/services/firebase/config';
const db = getFirebaseDb();
import {
  collection,
  doc,
  writeBatch,
  query,
  where,
  getDocs,
  limit,
  Timestamp,
  arrayUnion,
  setDoc,
  updateDoc,
  WriteBatch,
} from 'firebase/firestore';
import { format } from 'date-fns';

/**
 * 審計日誌寫入器
 */
export class AuditLogWriter {
  private static instance: AuditLogWriter;
  private buffer: AuditLog[] = [];
  private flushTimer: NodeJS.Timer | null = null;
  private readonly batchSize: number = 100;
  private readonly flushIntervalMs: number = 5000;
  private isArchiving: boolean = false;
  
  // 預設保留政策
  private retentionPolicy: RetentionPolicy = {
    enabled: true,
    retentionDays: 30,
    archiveEnabled: true,
    deleteAfterArchive: true,
    compressArchive: false,
  };

  private constructor() {
    this.startFlushTimer();
    this.startArchiveScheduler();
  }

  /**
   * 獲取單例實例
   */
  static getInstance(): AuditLogWriter {
    if (!AuditLogWriter.instance) {
      AuditLogWriter.instance = new AuditLogWriter();
    }
    return AuditLogWriter.instance;
  }

  /**
   * 寫入審計日誌
   */
  async write(log: AuditLog): Promise<void> {
    // 加入緩衝區
    this.buffer.push(log);
    
    // 高風險事件立即寫入
    if (log.metadata?.risk === 'critical' || log.metadata?.risk === 'high') {
      await this.flush();
      return;
    }
    
    // 緩衝區滿時寫入
    if (this.buffer.length >= this.batchSize) {
      await this.flush();
    }
  }

  /**
   * 批量寫入審計日誌
   */
  async writeBatch(logs: AuditLog[]): Promise<void> {
    this.buffer.push(...logs);
    
    // 如果超過批次大小，立即刷新
    if (this.buffer.length >= this.batchSize) {
      await this.flush();
    }
  }

  /**
   * 刷新緩衝區
   */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    
    const logs = [...this.buffer];
    this.buffer = [];
    
    try {
      const batch = writeBatch(db);
      
      for (const log of logs) {
        // 寫入主集合
        const logRef = doc(collection(db, 'auditLogs'));
        batch.set(logRef, {
          ...log,
          id: logRef.id, // 使用 Firestore 生成的 ID
        });
        
        // 更新索引
        await this.updateIndices(batch, log, logRef.id);
      }
      
      // 提交批次
      await batch.commit();
      
      console.log(`成功寫入 ${logs.length} 條審計日誌`);
    } catch (error) {
      console.error('寫入審計日誌失敗:', error);
      
      // 恢復日誌到緩衝區
      this.buffer = [...logs, ...this.buffer];
      
      // 如果是配額錯誤，等待後重試
      if (this.isQuotaError(error)) {
        setTimeout(() => this.flush(), 10000); // 10 秒後重試
      }
    }
  }

  /**
   * 更新索引
   */
  private async updateIndices(batch: WriteBatch, log: AuditLog, logId: string): Promise<void> {
    try {
      // 更新用戶索引
      const userIndexId = `user_${log.actor.userId}_${format(log.timestamp.toDate(), 'yyyy-MM')}`;
      const userIndexRef = doc(db, 'auditLogIndices', 'byUser', userIndexId);
      
      // 使用 setDoc 並合併，避免覆蓋現有資料
      await this.safeUpdateIndex(batch, userIndexRef, logId);
      
      // 更新組織索引
      const orgIndexId = `org_${log.context.organizationId}_${format(log.timestamp.toDate(), 'yyyy-MM')}`;
      const orgIndexRef = doc(db, 'auditLogIndices', 'byOrganization', orgIndexId);
      await this.safeUpdateIndex(batch, orgIndexRef, logId);
      
      // 更新動作類型索引
      const actionIndexId = `action_${log.action.type}_${format(log.timestamp.toDate(), 'yyyy-MM-dd')}`;
      const actionIndexRef = doc(db, 'auditLogIndices', 'byAction', actionIndexId);
      await this.safeUpdateIndex(batch, actionIndexRef, logId);
      
      // 更新日期索引
      const dateKey = format(log.timestamp.toDate(), 'yyyy-MM-dd');
      const dateIndexRef = doc(db, 'auditLogIndices', 'byDate', dateKey);
      await this.safeUpdateIndex(batch, dateIndexRef, logId);
      
      // 如果是高風險事件，更新風險索引
      if (log.metadata?.risk === 'high' || log.metadata?.risk === 'critical') {
        const riskIndexId = `risk_${log.metadata.risk}_${format(log.timestamp.toDate(), 'yyyy-MM-dd')}`;
        const riskIndexRef = doc(db, 'auditLogIndices', 'byRisk', riskIndexId);
        await this.safeUpdateIndex(batch, riskIndexRef, logId);
      }
    } catch (error) {
      console.error('更新索引失敗:', error);
    }
  }

  /**
   * 安全更新索引
   */
  private async safeUpdateIndex(batch: WriteBatch, indexRef: any, logId: string): Promise<void> {
    try {
      // 嘗試更新現有文檔
      batch.update(indexRef, {
        logs: arrayUnion(logId),
        lastUpdated: Timestamp.now(),
      });
    } catch {
      // 如果文檔不存在，創建新文檔
      batch.set(indexRef, {
        logs: [logId],
        createdAt: Timestamp.now(),
        lastUpdated: Timestamp.now(),
      }, { merge: true });
    }
  }

  /**
   * 歸檔舊日誌
   */
  async archiveOldLogs(): Promise<void> {
    if (this.isArchiving || !this.retentionPolicy.enabled) {
      return;
    }
    
    this.isArchiving = true;
    
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionPolicy.retentionDays);
      
      // 查詢需要歸檔的日誌
      const q = query(
        collection(db, 'auditLogs'),
        where('timestamp', '<', Timestamp.fromDate(cutoffDate)),
        limit(1000)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        console.log('沒有需要歸檔的審計日誌');
        return;
      }
      
      console.log(`準備歸檔 ${snapshot.size} 條審計日誌`);
      
      const batch = writeBatch(db);
      let archiveCount = 0;
      
      for (const docSnap of snapshot.docs) {
        const log = docSnap.data() as AuditLog;
        const date = log.timestamp.toDate();
        const year = date.getFullYear().toString();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        
        if (this.retentionPolicy.archiveEnabled) {
          // 移至歸檔集合
          const archivePath = `auditLogsArchive/${year}/${month}/${docSnap.id}`;
          const archiveRef = doc(db, ...archivePath.split('/'));
          
          // 如果需要壓縮，這裡可以壓縮日誌內容
          const archiveData = this.retentionPolicy.compressArchive 
            ? this.compressLog(log)
            : log;
          
          batch.set(archiveRef, {
            ...archiveData,
            archivedAt: Timestamp.now(),
          });
        }
        
        if (this.retentionPolicy.deleteAfterArchive) {
          // 刪除原始記錄
          batch.delete(docSnap.ref);
        }
        
        archiveCount++;
        
        // 每 100 條提交一次
        if (archiveCount % 100 === 0) {
          await batch.commit();
          console.log(`已歸檔 ${archiveCount} 條日誌`);
        }
      }
      
      // 提交剩餘的批次
      if (archiveCount % 100 !== 0) {
        await batch.commit();
      }
      
      console.log(`成功歸檔 ${archiveCount} 條審計日誌`);
      
      // 清理舊索引
      await this.cleanupOldIndices(cutoffDate);
      
    } catch (error) {
      console.error('歸檔審計日誌失敗:', error);
    } finally {
      this.isArchiving = false;
    }
  }

  /**
   * 清理舊索引
   */
  private async cleanupOldIndices(cutoffDate: Date): Promise<void> {
    try {
      const cutoffKey = format(cutoffDate, 'yyyy-MM-dd');
      
      // 清理日期索引
      const dateIndicesQuery = query(
        collection(db, 'auditLogIndices', 'byDate'),
        where('__name__', '<', cutoffKey),
        limit(100)
      );
      
      const dateIndicesSnapshot = await getDocs(dateIndicesQuery);
      
      const batch = writeBatch(db);
      dateIndicesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      if (!dateIndicesSnapshot.empty) {
        await batch.commit();
        console.log(`清理了 ${dateIndicesSnapshot.size} 個舊日期索引`);
      }
    } catch (error) {
      console.error('清理索引失敗:', error);
    }
  }

  /**
   * 壓縮日誌
   */
  private compressLog(log: AuditLog): any {
    // 簡單的壓縮策略：移除一些冗餘資訊
    const compressed = {
      ...log,
      // 移除一些詳細資訊
      actor: {
        userId: log.actor.userId,
        userEmail: log.actor.userEmail,
        // 省略 userAgent 等
      },
      // 簡化 changes
      changes: log.changes ? {
        hasChanges: true,
        changeCount: log.changes.diff?.length || 0,
      } : undefined,
    };
    
    return compressed;
  }

  /**
   * 檢查是否為配額錯誤
   */
  private isQuotaError(error: any): boolean {
    const errorMessage = error?.message || '';
    return errorMessage.includes('quota') || 
           errorMessage.includes('limit') ||
           errorMessage.includes('too many');
  }

  /**
   * 啟動定期刷新計時器
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushIntervalMs);
  }

  /**
   * 啟動歸檔排程器
   */
  private startArchiveScheduler(): void {
    // 每天凌晨 2 點執行歸檔
    const scheduleArchive = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(2, 0, 0, 0);
      
      const timeUntilArchive = tomorrow.getTime() - now.getTime();
      
      setTimeout(() => {
        this.archiveOldLogs();
        scheduleArchive(); // 重新排程下一次
      }, timeUntilArchive);
    };
    
    scheduleArchive();
  }

  /**
   * 停止服務
   */
  stop(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    
    // 立即刷新剩餘的日誌
    this.flush();
  }

  /**
   * 更新保留政策
   */
  updateRetentionPolicy(policy: RetentionPolicy): void {
    this.retentionPolicy = policy;
  }

  /**
   * 獲取寫入統計
   */
  getStatistics(): {
    bufferSize: number;
    isArchiving: boolean;
    retentionDays: number;
  } {
    return {
      bufferSize: this.buffer.length,
      isArchiving: this.isArchiving,
      retentionDays: this.retentionPolicy.retentionDays,
    };
  }

  /**
   * 強制歸檔（用於測試或手動觸發）
   */
  async forceArchive(): Promise<void> {
    console.log('強制執行歸檔...');
    await this.archiveOldLogs();
  }

  /**
   * 強制刷新（用於測試或手動觸發）
   */
  async forceFlush(): Promise<void> {
    console.log('強制刷新緩衝區...');
    await this.flush();
  }
}

// 導出單例實例
export const auditLogWriter = AuditLogWriter.getInstance();