/**
 * 錯誤日誌服務
 * 負責收集、儲存和查詢錯誤日誌
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { Platform } from 'react-native';
import { ErrorReport, DeviceInfo, ErrorCategory } from '../../types/error';
import { STORAGE_KEYS, ERROR_CONSTANTS } from '../../config/constants';
import { environmentManager } from '../../config/environment';

/**
 * 錯誤日誌管理器
 */
class ErrorLogger {
  private static instance: ErrorLogger;
  private errorQueue: ErrorReport[] = [];
  private isInitialized = false;
  
  private constructor() {
    this.initialize();
  }
  
  /**
   * 取得錯誤日誌管理器實例
   */
  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }
  
  /**
   * 初始化錯誤日誌系統
   */
  private async initialize() {
    try {
      // 載入現有的錯誤日誌
      await this.loadErrorLogs();
      
      // 清理過期的錯誤日誌
      await this.cleanupOldLogs();
      
      this.isInitialized = true;
      
      if (__DEV__) {
        console.log('✅ 錯誤日誌系統已初始化');
      }
    } catch (error) {
      console.error('錯誤日誌系統初始化失敗:', error);
    }
  }
  
  /**
   * 記錄錯誤
   */
  async logError(
    error: Error,
    context?: Partial<ErrorReport['context']>,
    severity: ErrorReport['severity'] = 'medium'
  ): Promise<string> {
    const errorId = this.generateErrorId();
    
    const errorReport: ErrorReport = {
      id: errorId,
      timestamp: new Date(),
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: (error as any).code
      },
      context: {
        ...context,
        deviceInfo: await this.getDeviceInfo()
      },
      handled: true,
      severity
    };
    
    // 加入錯誤佇列
    this.errorQueue.push(errorReport);
    
    // 儲存到本地
    await this.saveErrorLogs();
    
    // 在開發環境輸出詳細錯誤
    if (__DEV__) {
      console.group(`🚨 錯誤 #${errorId}`);
      console.error('訊息:', error.message);
      console.error('堆疊:', error.stack);
      console.error('上下文:', context);
      console.error('嚴重程度:', severity);
      console.groupEnd();
    }
    
    // 如果是生產環境且是高嚴重性錯誤，可以發送到遠端
    if (environmentManager.isProduction() && 
        (severity === 'high' || severity === 'critical')) {
      this.sendErrorToRemote(errorReport);
    }
    
    return errorId;
  }
  
  /**
   * 記錄元件錯誤
   */
  async logComponentError(
    error: Error,
    errorInfo: { componentStack: string },
    componentName?: string
  ): Promise<string> {
    return this.logError(
      error,
      {
        screen: componentName,
        additionalData: {
          componentStack: errorInfo.componentStack
        }
      },
      'high'
    );
  }
  
  /**
   * 取得裝置資訊
   */
  private async getDeviceInfo(): Promise<DeviceInfo> {
    return {
      platform: Platform.OS as 'ios' | 'android' | 'web',
      version: Platform.Version ? Platform.Version.toString() : 'unknown',
      model: Device.modelName || undefined,
      isDevice: Device.isDevice ?? false
    };
  }
  
  /**
   * 產生錯誤 ID
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * 載入錯誤日誌
   */
  private async loadErrorLogs() {
    try {
      const logs = await AsyncStorage.getItem(STORAGE_KEYS.ERROR_LOGS);
      if (logs) {
        this.errorQueue = JSON.parse(logs).map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }));
      }
    } catch (error) {
      console.error('載入錯誤日誌失敗:', error);
    }
  }
  
  /**
   * 儲存錯誤日誌
   */
  private async saveErrorLogs() {
    try {
      // 限制錯誤日誌數量
      if (this.errorQueue.length > ERROR_CONSTANTS.MAX_ERROR_LOGS) {
        this.errorQueue = this.errorQueue.slice(-ERROR_CONSTANTS.MAX_ERROR_LOGS);
      }
      
      await AsyncStorage.setItem(
        STORAGE_KEYS.ERROR_LOGS,
        JSON.stringify(this.errorQueue)
      );
    } catch (error) {
      console.error('儲存錯誤日誌失敗:', error);
    }
  }
  
  /**
   * 清理過期的錯誤日誌
   */
  private async cleanupOldLogs() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - ERROR_CONSTANTS.ERROR_RETENTION_DAYS);
    
    this.errorQueue = this.errorQueue.filter(
      log => log.timestamp > cutoffDate
    );
    
    await this.saveErrorLogs();
  }
  
  /**
   * 發送錯誤到遠端（未來實作）
   */
  private async sendErrorToRemote(errorReport: ErrorReport) {
    // TODO: 整合 Firebase Crashlytics 或其他錯誤追蹤服務
    if (__DEV__) {
      console.log('🚀 將發送錯誤到遠端:', errorReport.id);
    }
  }
  
  /**
   * 取得所有錯誤日誌
   */
  async getAllLogs(): Promise<ErrorReport[]> {
    return [...this.errorQueue].reverse(); // 最新的在前
  }
  
  /**
   * 取得特定錯誤日誌
   */
  getLog(errorId: string): ErrorReport | undefined {
    return this.errorQueue.find(log => log.id === errorId);
  }
  
  /**
   * 清除所有錯誤日誌
   */
  async clearLogs() {
    this.errorQueue = [];
    await AsyncStorage.removeItem(STORAGE_KEYS.ERROR_LOGS);
    
    if (__DEV__) {
      console.log('🗑️ 已清除所有錯誤日誌');
    }
  }
  
  /**
   * 取得錯誤統計資訊
   */
  getStatistics() {
    const stats = {
      total: this.errorQueue.length,
      bySeverity: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      },
      byCategory: {} as Record<string, number>,
      last24Hours: 0
    };
    
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    this.errorQueue.forEach(log => {
      stats.bySeverity[log.severity]++;
      
      if (log.timestamp > oneDayAgo) {
        stats.last24Hours++;
      }
      
      // 分類統計（需要實作錯誤分類邏輯）
      const category = this.categorizeError(log.error);
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
    });
    
    return stats;
  }
  
  /**
   * 分類錯誤
   */
  private categorizeError(error: ErrorReport['error']): string {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return ErrorCategory.NETWORK;
    } else if (message.includes('auth') || message.includes('permission')) {
      return ErrorCategory.AUTH;
    } else if (message.includes('firebase')) {
      return ErrorCategory.FIREBASE;
    } else if (message.includes('storage')) {
      return ErrorCategory.STORAGE;
    } else if (message.includes('validation')) {
      return ErrorCategory.VALIDATION;
    }
    
    return ErrorCategory.UNKNOWN;
  }
  
  /**
   * 格式化錯誤為可分享的文字
   */
  formatErrorForSharing(errorId: string): string {
    const log = this.getLog(errorId);
    if (!log) return '找不到錯誤日誌';
    
    const deviceInfo = log.context.deviceInfo;
    const appVersion = Application.nativeApplicationVersion || '未知';
    
    return `
📱 Donna AI 錯誤報告
━━━━━━━━━━━━━━━━━━━━━━━━━━

🆔 錯誤 ID: ${log.id}
📅 時間: ${log.timestamp.toLocaleString('zh-TW')}
⚠️ 嚴重程度: ${log.severity}

💬 錯誤訊息:
${log.error.message}

📍 發生位置:
${log.context.screen || '未知頁面'}
${log.context.action ? `執行動作: ${log.context.action}` : ''}

📱 裝置資訊:
- 平台: ${deviceInfo?.platform || '未知'}
- 版本: ${deviceInfo?.version || '未知'}
- 型號: ${deviceInfo?.model || '未知'}
- App 版本: ${appVersion}

🔍 堆疊追蹤:
${log.error.stack || '無堆疊資訊'}

━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();
  }
}

// 匯出單例實例
export const errorLogger = ErrorLogger.getInstance();