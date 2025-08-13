/**
 * 審計日誌收集服務
 * 提供裝飾器和自動收集機制
 */

import {
  AuditLog,
  AuditOptions,
  AuditContext,
  AuditActionType,
  ActionCategory,
  HttpMethod,
  OperationStatus,
  DataSource } from '@/types/audit';
import { Timestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { v4 as uuidv4 } from 'uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 審計收集器類
 */
export class AuditCollector {
  private static instance: AuditCollector;
  private currentContext: AuditContext | null = null;
  private logBuffer: AuditLog[] = [];
  private flushTimer: NodeJS.Timer | null = null;

  private constructor() {
    // 啟動定期刷新
    this.startFlushTimer();
  }

  /**
   * 獲取單例實例
   */
  static getInstance(): AuditCollector {
    if (!AuditCollector.instance) {
      AuditCollector.instance = new AuditCollector();
    }
    return AuditCollector.instance;
  }

  /**
   * 開始新的審計上下文
   */
  startContext(correlationId?: string): AuditContext {
    this.currentContext = {
      correlationId: correlationId || uuidv4(),
      startTime: Date.now(),
      metadata: {} };
    return this.currentContext;
  }

  /**
   * 結束當前審計上下文
   */
  endContext(): void {
    this.currentContext = null;
  }

  /**
   * 獲取當前上下文
   */
  getContext(): AuditContext | null {
    return this.currentContext;
  }

  /**
   * 收集審計日誌
   */
  async collect(
    options: AuditOptions,
    result: OperationStatus,
    error?: Error,
    changes?: any,
    duration?: number
  ): Promise<void> {
    try {
      const log = await this.buildAuditLog(options, result, error, changes, duration);
      
      // 加入緩衝區
      this.logBuffer.push(log);
      
      // 高風險事件立即寫入
      if (log.metadata?.risk === 'critical' || log.metadata?.risk === 'high') {
        await this.flush();
      }
      
      // 緩衝區滿時寫入
      if (this.logBuffer.length >= 50) {
        await this.flush();
      }
    } catch (error) {
      console.error('審計日誌收集失敗:', error);
    }
  }

  /**
   * 建立審計日誌
   */
  private async buildAuditLog(
    options: AuditOptions,
    status: OperationStatus,
    error?: Error,
    changes?: any,
    duration?: number
  ): Promise<AuditLog> {
    const auth = getAuth();
    const user = auth.currentUser;
    const context = this.currentContext;
    
    // 獲取用戶資訊
    const userInfo = await this.getUserInfo();
    
    // 獲取組織資訊
    const orgInfo = await this.getOrganizationInfo();
    
    // 獲取設備資訊
    const deviceInfo = await this.getDeviceInfo();
    
    // 生成日誌 ID
    const logId = uuidv4();
    
    return {
      id: logId,
      timestamp: Timestamp.now(),
      
      // 執行者資訊
      actor: {
        userId: user?.uid || 'anonymous',
        userEmail: user?.email || 'unknown',
        userName: userInfo?.name || 'Unknown User',
        userRole: userInfo?.role || 'unknown',
        ipAddress: deviceInfo.ipAddress,
        userAgent: deviceInfo.userAgent,
        sessionId: deviceInfo.sessionId },
      
      // 組織上下文
      context: {
        organizationId: orgInfo?.id || 'unknown',
        organizationName: orgInfo?.name || 'Unknown Org',
        teamId: userInfo?.teamId,
        environment: this.getEnvironment() },
      
      // 動作資訊
      action: {
        type: options.action,
        category: options.category,
        resource: options.resource || 'unknown',
        resourceId: this.extractResourceId(options, changes),
        method: this.determineMethod(options.action) },
      
      // 變更詳情
      changes: changes ? this.processChanges(changes, options.sensitiveFields) : undefined,
      
      // 結果
      result: {
        status,
        errorCode: error?.name,
        errorMessage: error?.message,
        duration: duration || (context ? Date.now() - context.startTime : undefined) },
      
      // 額外資訊
      metadata: {
        source: this.getDataSource(),
        correlationId: context?.correlationId,
        tags: this.generateTags(options),
        risk: options.risk || this.assessRisk(options.action, status) } };
  }

  /**
   * 獲取用戶資訊
   */
  private async getUserInfo(): Promise<any> {
    try {
      const userStr = await AsyncStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  /**
   * 獲取組織資訊
   */
  private async getOrganizationInfo(): Promise<any> {
    try {
      const orgStr = await AsyncStorage.getItem('currentOrganization');
      return orgStr ? JSON.parse(orgStr) : null;
    } catch {
      return null;
    }
  }

  /**
   * 獲取設備資訊
   */
  private async getDeviceInfo(): Promise<any> {
    try {
      // 在 Web 環境
      if (typeof window !== 'undefined') {
        const sessionId = await AsyncStorage.getItem('sessionId') || uuidv4();
        
        // 如果沒有 sessionId，創建一個新的
        if (!await AsyncStorage.getItem('sessionId')) {
          await AsyncStorage.setItem('sessionId', sessionId);
        }
        
        return {
          ipAddress: await this.getIPAddress(),
          userAgent: navigator.userAgent,
          sessionId };
      }
      
      // 在 React Native 環境
      return {
        ipAddress: 'mobile',
        userAgent: 'DonnaAI Mobile App',
        sessionId: await AsyncStorage.getItem('sessionId') || uuidv4() };
    } catch {
      return {
        ipAddress: 'unknown',
        userAgent: 'unknown',
        sessionId: 'unknown' };
    }
  }

  /**
   * 獲取 IP 地址
   */
  private async getIPAddress(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }

  /**
   * 獲取環境
   */
  private getEnvironment(): 'production' | 'staging' | 'development' {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
      return 'development';
    } else if (hostname.includes('staging')) {
      return 'staging';
    }
    return 'production';
  }

  /**
   * 獲取資料來源
   */
  private getDataSource(): DataSource {
    if (typeof window !== 'undefined') {
      return 'web';
    }
    // 可以通過檢測 React Native 環境來判斷
    return 'mobile';
  }

  /**
   * 提取資源 ID
   */
  private extractResourceId(options: AuditOptions, changes?: any): string | undefined {
    if (changes?.id) return changes.id;
    if (changes?.after?.id) return changes.after.id;
    if (changes?.before?.id) return changes.before.id;
    return undefined;
  }

  /**
   * 判斷 HTTP 方法
   */
  private determineMethod(action: AuditActionType): HttpMethod {
    if (action.includes('CREATE')) return 'CREATE';
    if (action.includes('UPDATE') || action.includes('CHANGE')) return 'UPDATE';
    if (action.includes('DELETE')) return 'DELETE';
    if (action.includes('LOGIN') || action.includes('LOGOUT')) return 'EXECUTE';
    return 'READ';
  }

  /**
   * 處理變更資料
   */
  private processChanges(changes: any, sensitiveFields?: string[]): any {
    if (!changes) return undefined;
    
    // 深度複製
    const processed = JSON.parse(JSON.stringify(changes));
    
    // 遮罩敏感欄位
    if (sensitiveFields && sensitiveFields.length > 0) {
      this.maskSensitiveFields(processed, sensitiveFields);
    }
    
    // 計算差異
    if (processed.before && processed.after) {
      processed.diff = this.calculateDiff(processed.before, processed.after);
    }
    
    return processed;
  }

  /**
   * 遮罩敏感欄位
   */
  private maskSensitiveFields(obj: any, fields: string[]): void {
    for (const field of fields) {
      if (obj[field] !== undefined) {
        obj[field] = '***MASKED***';
      }
      
      // 遞迴處理嵌套對象
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          this.maskSensitiveFields(obj[key], fields);
        }
      }
    }
  }

  /**
   * 計算變更差異
   */
  private calculateDiff(before: any, after: any): any[] {
    const diff: any[] = [];
    
    // 檢查所有欄位
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
    
    for (const key of allKeys) {
      if (before[key] !== after[key]) {
        diff.push({
          field: key,
          oldValue: before[key],
          newValue: after[key] });
      }
    }
    
    return diff;
  }

  /**
   * 生成標籤
   */
  private generateTags(options: AuditOptions): string[] {
    const tags: string[] = [];
    
    // 根據動作類型添加標籤
    if (options.action.includes('LOGIN')) tags.push('authentication');
    if (options.action.includes('CREATE') || options.action.includes('UPDATE') || options.action.includes('DELETE')) {
      tags.push('data-modification');
    }
    if (options.action.includes('PERMISSION') || options.action.includes('ROLE')) {
      tags.push('authorization');
    }
    if (options.action.includes('EXPORT') || options.action.includes('IMPORT')) {
      tags.push('data-transfer');
    }
    
    // 添加風險標籤
    if (options.risk === 'critical' || options.risk === 'high') {
      tags.push('high-risk');
    }
    
    return tags;
  }

  /**
   * 評估風險等級
   */
  private assessRisk(action: AuditActionType, status: OperationStatus): 'low' | 'medium' | 'high' | 'critical' {
    // 失敗的認證嘗試
    if (action === AuditActionType.USER_LOGIN_FAILED) {
      return 'high';
    }
    
    // 權限相關操作
    if (action.includes('PERMISSION') || action.includes('ROLE')) {
      return status === 'success' ? 'high' : 'critical';
    }
    
    // 資料匯出
    if (action === AuditActionType.DATA_EXPORTED) {
      return 'medium';
    }
    
    // 刪除操作
    if (action.includes('DELETE')) {
      return 'medium';
    }
    
    // 系統配置變更
    if (action === AuditActionType.SYSTEM_CONFIG_CHANGED) {
      return 'high';
    }
    
    // 安全事件
    if (action === AuditActionType.SECURITY_ALERT || action === AuditActionType.SUSPICIOUS_ACTIVITY) {
      return 'critical';
    }
    
    return 'low';
  }

  /**
   * 刷新日誌緩衝區
   */
  private async flush(): Promise<void> {
    if (this.logBuffer.length === 0) return;
    
    const logs = [...this.logBuffer];
    this.logBuffer = [];
    
    try {
      // 這裡將調用 AuditLogWriter 服務來批量寫入
      const { AuditLogWriter } = await import('./AuditLogWriter');
      const writer = AuditLogWriter.getInstance();
      
      for (const log of logs) {
        await writer.write(log);
      }
    } catch (error) {
      console.error('刷新審計日誌失敗:', error);
      // 恢復日誌到緩衝區
      this.logBuffer = [...logs, ...this.logBuffer];
    }
  }

  /**
   * 啟動定期刷新計時器
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, 5000); // 每 5 秒刷新一次
  }

  /**
   * 停止刷新計時器
   */
  stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    // 立即刷新剩餘的日誌
    this.flush();
  }
}

/**
 * 審計裝飾器
 * 用於自動收集方法執行的審計日誌
 */
export function Audited(options: AuditOptions) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      const collector = AuditCollector.getInstance();
      
      // 開始審計上下文
      const context = collector.startContext();
      
      try {
        // 處理變更前資料
        let beforeData: any;
        if (options.includeRequestBody && args.length > 0) {
          beforeData = JSON.parse(JSON.stringify(args[0]));
        }
        
        // 執行原始方法
        const result = await originalMethod.apply(this, args);
        
        // 處理變更後資料
        let changes: any;
        if (beforeData || (options.includeResponseData && result)) {
          changes = {
            before: beforeData,
            after: options.includeResponseData ? result : undefined };
        }
        
        // 收集審計日誌
        await collector.collect(
          options,
          'success',
          undefined,
          changes,
          Date.now() - startTime
        );
        
        return result;
      } catch (error) {
        // 收集錯誤日誌
        if (!options.skipOnError) {
          await collector.collect(
            options,
            'failure',
            error as Error,
            undefined,
            Date.now() - startTime
          );
        }
        
        throw error;
      } finally {
        // 結束審計上下文
        collector.endContext();
      }
    };
    
    return descriptor;
  };
}

/**
 * 手動審計日誌記錄
 */
export async function logAuditEvent(
  action: AuditActionType,
  category: ActionCategory,
  resource: string,
  result: OperationStatus,
  changes?: any,
  error?: Error
): Promise<void> {
  const collector = AuditCollector.getInstance();
  
  await collector.collect(
    {
      action,
      category,
      resource },
    result,
    error,
    changes
  );
}

// 導出單例實例
export const auditCollector = AuditCollector.getInstance();