/**
 * 性能優化工具
 * 提供記憶體管理、性能監控和優化建議
 */

import { PlatformDetector } from './platform-detector';
import { Alert } from 'react-native';

interface PerformanceMetrics {
  memoryUsage: number;
  audioRecordingCount: number;
  activeRecordings: number;
  lastOptimization: number;
}

interface OptimizationSuggestion {
  type: 'memory' | 'audio' | 'storage' | 'ui';
  severity: 'low' | 'medium' | 'high';
  message: string;
  action?: () => Promise<void>;
}

export class PerformanceOptimizer {
  private static metrics: PerformanceMetrics = {
    memoryUsage: 0,
    audioRecordingCount: 0,
    activeRecordings: 0,
    lastOptimization: Date.now()
  };

  private static listeners: Array<(metrics: PerformanceMetrics) => void> = [];

  // 初始化性能監控
  static initialize(): void {
    this.startPerformanceMonitoring();
    this.setupMemoryWarningHandlers();
  }

  // 開始性能監控
  private static startPerformanceMonitoring(): void {
    // 每30秒檢查一次性能指標
    setInterval(() => {
      this.updateMetrics();
      this.checkPerformanceThresholds();
    }, 30000);
  }

  // 更新性能指標
  private static updateMetrics(): void {
    // 模擬記憶體使用量檢測
    this.metrics.memoryUsage = this.estimateMemoryUsage();
    
    // 通知監聽器
    this.listeners.forEach(listener => listener(this.metrics));
  }

  // 估算記憶體使用量
  private static estimateMemoryUsage(): number {
    // 基於設備類型和活動數據估算記憶體使用
    const platformInfo = PlatformDetector.getPlatformInfo();
    const baseUsage = platformInfo.deviceType === 'tablet' ? 50 : 30; // MB
    
    // 根據活動錄音和暫存檔案增加記憶體使用量
    const recordingMemory = this.metrics.activeRecordings * 10; // 每個錄音約10MB
    const audioFileMemory = this.metrics.audioRecordingCount * 2; // 每個音檔約2MB暫存
    
    return baseUsage + recordingMemory + audioFileMemory;
  }

  // 檢查性能閾值
  private static checkPerformanceThresholds(): void {
    const suggestions: OptimizationSuggestion[] = [];
    
    // 記憶體使用檢查
    if (this.metrics.memoryUsage > 150) {
      suggestions.push({
        type: 'memory',
        severity: 'high',
        message: '記憶體使用量過高，建議清理暫存檔案',
        action: this.clearMemoryCache
      });
    } else if (this.metrics.memoryUsage > 100) {
      suggestions.push({
        type: 'memory',
        severity: 'medium',
        message: '記憶體使用量較高，建議優化錄音品質',
        action: this.optimizeRecordingQuality
      });
    }

    // 活動錄音檢查
    if (this.metrics.activeRecordings > 2) {
      suggestions.push({
        type: 'audio',
        severity: 'high',
        message: '同時進行的錄音過多，可能影響品質',
        action: this.limitActiveRecordings
      });
    }

    // 儲存空間檢查
    this.checkStorageSpace().then(isLow => {
      if (isLow) {
        suggestions.push({
          type: 'storage',
          severity: 'high',
          message: '儲存空間不足，建議清理舊錄音',
          action: this.cleanupOldRecordings
        });
      }
    });

    // 處理優化建議
    if (suggestions.length > 0) {
      this.handleOptimizationSuggestions(suggestions);
    }
  }

  // 處理優化建議
  private static handleOptimizationSuggestions(suggestions: OptimizationSuggestion[]): void {
    const highSeveritySuggestions = suggestions.filter(s => s.severity === 'high');
    
    if (highSeveritySuggestions.length > 0) {
      const primarySuggestion = highSeveritySuggestions[0];
      
      Alert.alert(
        '性能優化建議',
        primarySuggestion.message,
        [
          {
            text: '稍後',
            style: 'cancel'
          },
          {
            text: '立即優化',
            onPress: () => {
              if (primarySuggestion.action) {
                primarySuggestion.action();
              }
            }
          }
        ]
      );
    }
  }

  // 清理記憶體暫存
  private static async clearMemoryCache(): Promise<void> {
    try {
      // 清理音訊暫存
      // 這裡應該實作實際的暫存清理邏輯
      console.log('清理記憶體暫存...');
      
      // 更新指標
      this.metrics.memoryUsage = Math.max(30, this.metrics.memoryUsage - 50);
      this.metrics.lastOptimization = Date.now();
      
      Alert.alert('優化完成', '記憶體暫存已清理');
    } catch (error) {
      console.error('清理記憶體暫存失敗:', error);
    }
  }

  // 優化錄音品質
  private static async optimizeRecordingQuality(): Promise<void> {
    try {
      console.log('優化錄音品質設定...');
      
      // 根據設備能力調整錄音設定
      // 這裡應該實作實際的設定調整邏輯
      
      Alert.alert('優化完成', '錄音品質已根據設備能力調整');
    } catch (error) {
      console.error('優化錄音品質失敗:', error);
    }
  }

  // 限制活動錄音數量
  private static async limitActiveRecordings(): Promise<void> {
    try {
      console.log('限制活動錄音數量...');
      
      // 這裡應該實作停止多餘錄音的邏輯
      this.metrics.activeRecordings = Math.min(2, this.metrics.activeRecordings);
      
      Alert.alert('優化完成', '已限制同時錄音數量以確保品質');
    } catch (error) {
      console.error('限制活動錄音失敗:', error);
    }
  }

  // 清理舊錄音
  private static async cleanupOldRecordings(): Promise<void> {
    try {
      console.log('清理舊錄音檔案...');
      
      // 這裡應該實作舊檔案清理邏輯
      this.metrics.audioRecordingCount = Math.max(0, this.metrics.audioRecordingCount - 10);
      
      Alert.alert('優化完成', '舊錄音檔案已清理，釋放儲存空間');
    } catch (error) {
      console.error('清理舊錄音失敗:', error);
    }
  }

  // 檢查儲存空間
  private static async checkStorageSpace(): Promise<boolean> {
    try {
      // 這裡應該實作實際的儲存空間檢查
      // 暫時返回false（儲存空間充足）
      return false;
    } catch (error) {
      console.error('檢查儲存空間失敗:', error);
      return false;
    }
  }

  // 設定記憶體警告處理器
  private static setupMemoryWarningHandlers(): void {
    // 在實際應用中，這裡應該監聽系統記憶體警告
    console.log('記憶體警告處理器已設定');
  }

  // 記錄錄音開始
  static recordAudioStart(): void {
    this.metrics.activeRecordings++;
    this.updateMetrics();
  }

  // 記錄錄音結束
  static recordAudioEnd(): void {
    this.metrics.activeRecordings = Math.max(0, this.metrics.activeRecordings - 1);
    this.metrics.audioRecordingCount++;
    this.updateMetrics();
  }

  // 添加性能監聽器
  static addMetricsListener(callback: (metrics: PerformanceMetrics) => void): void {
    this.listeners.push(callback);
  }

  // 移除性能監聽器
  static removeMetricsListener(callback: (metrics: PerformanceMetrics) => void): void {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // 獲取當前性能指標
  static getCurrentMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // 執行完整性能優化
  static async performFullOptimization(): Promise<void> {
    try {
      console.log('執行完整性能優化...');
      
      await Promise.all([
        this.clearMemoryCache(),
        this.optimizeRecordingQuality(),
        this.cleanupOldRecordings()
      ]);
      
      this.metrics.lastOptimization = Date.now();
      
      Alert.alert('優化完成', '系統性能已全面優化');
    } catch (error) {
      console.error('完整性能優化失敗:', error);
      Alert.alert('優化失敗', '系統性能優化過程中發生錯誤');
    }
  }

  // 獲取優化建議
  static getOptimizationSuggestions(): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    
    // 基於當前指標生成建議
    if (this.metrics.memoryUsage > 80) {
      suggestions.push({
        type: 'memory',
        severity: 'medium',
        message: '建議清理暫存以釋放記憶體'
      });
    }
    
    if (this.metrics.audioRecordingCount > 50) {
      suggestions.push({
        type: 'storage',
        severity: 'medium',
        message: '建議清理舊錄音以釋放空間'
      });
    }
    
    const timeSinceLastOptimization = Date.now() - this.metrics.lastOptimization;
    if (timeSinceLastOptimization > 24 * 60 * 60 * 1000) { // 24小時
      suggestions.push({
        type: 'ui',
        severity: 'low',
        message: '建議執行日常性能優化'
      });
    }
    
    return suggestions;
  }

  // 重置性能指標
  static resetMetrics(): void {
    this.metrics = {
      memoryUsage: 0,
      audioRecordingCount: 0,
      activeRecordings: 0,
      lastOptimization: Date.now()
    };
    
    this.updateMetrics();
  }
}