/**
 * 審計日誌查詢服務
 * 提供高效的查詢和搜尋功能
 */

import {
  AuditLog,
  SearchCriteria,
  SearchResult,
  AuditStatistics,
  TimeRange,
  TimelineData,
  AuditActionType,
  ActionCategory,
  RiskLevel } from '@/types/audit';
import { getFirebaseDb } from '@/services/firebase/config';
const db = getFirebaseDb();
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  getCountFromServer,
  QueryConstraint,
  DocumentSnapshot,
  Timestamp } from 'firebase/firestore';
import { format, startOfDay, endOfDay, differenceInHours, differenceInDays } from 'date-fns';

/**
 * 審計日誌查詢服務
 */
export class AuditLogQueryService {
  private static instance: AuditLogQueryService;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 分鐘快取

  private constructor() {}

  /**
   * 獲取單例實例
   */
  static getInstance(): AuditLogQueryService {
    if (!AuditLogQueryService.instance) {
      AuditLogQueryService.instance = new AuditLogQueryService();
    }
    return AuditLogQueryService.instance;
  }

  /**
   * 搜尋審計日誌
   */
  async search(criteria: SearchCriteria): Promise<SearchResult> {
    // 檢查快取
    const cacheKey = this.getCacheKey(criteria);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // 建立查詢條件
      const constraints = this.buildQueryConstraints(criteria);
      
      // 執行查詢
      const q = query(collection(db, 'auditLogs'), ...constraints);
      const snapshot = await getDocs(q);
      
      // 轉換結果
      const logs = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id } as AuditLog));
      
      // 獲取總數
      const totalCount = await this.getTotalCount(criteria);
      
      const result: SearchResult = {
        logs,
        totalCount,
        hasMore: logs.length === (criteria.limit || 50),
        lastDoc: snapshot.docs[snapshot.docs.length - 1] };
      
      // 快取結果
      this.setCache(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('搜尋審計日誌失敗:', error);
      throw error;
    }
  }

  /**
   * 建立查詢條件
   */
  private buildQueryConstraints(criteria: SearchCriteria): QueryConstraint[] {
    const constraints: QueryConstraint[] = [];
    
    // 組織 ID
    if (criteria.organizationId) {
      constraints.push(where('context.organizationId', '==', criteria.organizationId));
    }
    
    // 用戶 ID
    if (criteria.userId) {
      constraints.push(where('actor.userId', '==', criteria.userId));
    }
    
    // 動作類型
    if (criteria.actionTypes && criteria.actionTypes.length > 0) {
      constraints.push(where('action.type', 'in', criteria.actionTypes));
    }
    
    // 分類
    if (criteria.categories && criteria.categories.length > 0) {
      constraints.push(where('action.category', 'in', criteria.categories));
    }
    
    // 日期範圍
    if (criteria.dateRange) {
      constraints.push(
        where('timestamp', '>=', Timestamp.fromDate(criteria.dateRange.start)),
        where('timestamp', '<=', Timestamp.fromDate(criteria.dateRange.end))
      );
    }
    
    // 風險等級
    if (criteria.riskLevels && criteria.riskLevels.length > 0) {
      constraints.push(where('metadata.risk', 'in', criteria.riskLevels));
    }
    
    // 狀態
    if (criteria.status) {
      constraints.push(where('result.status', '==', criteria.status));
    }
    
    // 資源
    if (criteria.resource) {
      constraints.push(where('action.resource', '==', criteria.resource));
    }
    
    // 排序
    constraints.push(orderBy('timestamp', criteria.sortOrder || 'desc'));
    
    // 限制數量
    if (criteria.limit) {
      constraints.push(limit(criteria.limit));
    }
    
    // 分頁
    if (criteria.startAfter) {
      constraints.push(startAfter(criteria.startAfter));
    }
    
    return constraints;
  }

  /**
   * 獲取總數
   */
  private async getTotalCount(criteria: SearchCriteria): Promise<number> {
    try {
      const constraints = this.buildQueryConstraints(criteria)
        .filter(c => !(c.type === 'limit' || c.type === 'startAfter'));
      
      const q = query(collection(db, 'auditLogs'), ...constraints);
      const countSnapshot = await getCountFromServer(q);
      
      return countSnapshot.data().count;
    } catch (error) {
      console.error('獲取總數失敗:', error);
      return 0;
    }
  }

  /**
   * 獲取統計資料
   */
  async getStatistics(
    organizationId: string,
    timeRange: TimeRange
  ): Promise<AuditStatistics> {
    // 檢查快取
    const cacheKey = `stats_${organizationId}_${timeRange.start.getTime()}_${timeRange.end.getTime()}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // 獲取時間範圍內的所有日誌
      const logs = await this.getLogsInRange(organizationId, timeRange);
      
      // 計算統計
      const statistics: AuditStatistics = {
        totalEvents: logs.length,
        uniqueUsers: this.countUniqueUsers(logs),
        eventsByType: this.groupByType(logs),
        eventsByCategory: this.groupByCategory(logs),
        failureRate: this.calculateFailureRate(logs),
        averageResponseTime: this.calculateAverageResponseTime(logs),
        topUsers: this.getTopUsers(logs),
        riskDistribution: this.getRiskDistribution(logs),
        timeline: this.generateTimeline(logs, timeRange) };
      
      // 快取結果
      this.setCache(cacheKey, statistics);
      
      return statistics;
    } catch (error) {
      console.error('獲取統計資料失敗:', error);
      throw error;
    }
  }

  /**
   * 獲取時間範圍內的日誌
   */
  private async getLogsInRange(
    organizationId: string,
    timeRange: TimeRange
  ): Promise<AuditLog[]> {
    const q = query(
      collection(db, 'auditLogs'),
      where('context.organizationId', '==', organizationId),
      where('timestamp', '>=', Timestamp.fromDate(timeRange.start)),
      where('timestamp', '<=', Timestamp.fromDate(timeRange.end)),
      orderBy('timestamp', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id } as AuditLog));
  }

  /**
   * 計算唯一用戶數
   */
  private countUniqueUsers(logs: AuditLog[]): number {
    const userSet = new Set(logs.map(log => log.actor.userId));
    return userSet.size;
  }

  /**
   * 按類型分組
   */
  private groupByType(logs: AuditLog[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    
    logs.forEach(log => {
      const type = log.action.type;
      grouped[type] = (grouped[type] || 0) + 1;
    });
    
    return grouped;
  }

  /**
   * 按分類分組
   */
  private groupByCategory(logs: AuditLog[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    
    logs.forEach(log => {
      const category = log.action.category;
      grouped[category] = (grouped[category] || 0) + 1;
    });
    
    return grouped;
  }

  /**
   * 計算失敗率
   */
  private calculateFailureRate(logs: AuditLog[]): number {
    if (logs.length === 0) return 0;
    
    const failures = logs.filter(log => log.result.status === 'failure').length;
    return (failures / logs.length) * 100;
  }

  /**
   * 計算平均響應時間
   */
  private calculateAverageResponseTime(logs: AuditLog[]): number {
    const logsWithDuration = logs.filter(log => log.result.duration);
    
    if (logsWithDuration.length === 0) return 0;
    
    const totalDuration = logsWithDuration.reduce(
      (sum, log) => sum + (log.result.duration || 0),
      0
    );
    
    return totalDuration / logsWithDuration.length;
  }

  /**
   * 獲取最活躍用戶
   */
  private getTopUsers(logs: AuditLog[], topN: number = 5): Array<{
    userId: string;
    userName: string;
    eventCount: number;
  }> {
    const userCounts: Record<string, { name: string; count: number }> = {};
    
    logs.forEach(log => {
      const userId = log.actor.userId;
      if (!userCounts[userId]) {
        userCounts[userId] = {
          name: log.actor.userName,
          count: 0 };
      }
      userCounts[userId].count++;
    });
    
    return Object.entries(userCounts)
      .map(([userId, data]) => ({
        userId,
        userName: data.name,
        eventCount: data.count }))
      .sort((a, b) => b.eventCount - a.eventCount)
      .slice(0, topN);
  }

  /**
   * 獲取風險分布
   */
  private getRiskDistribution(logs: AuditLog[]): {
    low: number;
    medium: number;
    high: number;
    critical: number;
  } {
    const distribution = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0 };
    
    logs.forEach(log => {
      const risk = log.metadata?.risk || 'low';
      distribution[risk]++;
    });
    
    return distribution;
  }

  /**
   * 生成時間線資料
   */
  private generateTimeline(logs: AuditLog[], timeRange: TimeRange): TimelineData {
    const buckets = this.createTimeBuckets(timeRange);
    
    logs.forEach(log => {
      const bucketKey = this.getBucketKey(log.timestamp, timeRange.granularity);
      if (buckets[bucketKey]) {
        buckets[bucketKey].count++;
        buckets[bucketKey].events.add(log.action.type);
      }
    });
    
    return {
      buckets: Object.entries(buckets).map(([time, data]) => ({
        time,
        count: data.count,
        uniqueEvents: data.events.size })) };
  }

  /**
   * 建立時間桶
   */
  private createTimeBuckets(timeRange: TimeRange): Record<string, {
    count: number;
    events: Set<string>;
  }> {
    const buckets: Record<string, { count: number; events: Set<string> }> = {};
    const { start, end, granularity } = timeRange;
    
    let current = new Date(start);
    
    while (current <= end) {
      const key = this.formatBucketKey(current, granularity);
      buckets[key] = { count: 0, events: new Set() };
      
      // 移至下一個時間桶
      switch (granularity) {
        case 'hour':
          current.setHours(current.getHours() + 1);
          break;
        case 'day':
          current.setDate(current.getDate() + 1);
          break;
        case 'week':
          current.setDate(current.getDate() + 7);
          break;
        case 'month':
          current.setMonth(current.getMonth() + 1);
          break;
      }
    }
    
    return buckets;
  }

  /**
   * 獲取時間桶鍵
   */
  private getBucketKey(timestamp: Timestamp, granularity: 'hour' | 'day' | 'week' | 'month'): string {
    const date = timestamp.toDate();
    return this.formatBucketKey(date, granularity);
  }

  /**
   * 格式化時間桶鍵
   */
  private formatBucketKey(date: Date, granularity: 'hour' | 'day' | 'week' | 'month'): string {
    switch (granularity) {
      case 'hour':
        return format(date, 'yyyy-MM-dd HH:00');
      case 'day':
        return format(date, 'yyyy-MM-dd');
      case 'week':
        return format(date, 'yyyy-ww');
      case 'month':
        return format(date, 'yyyy-MM');
      default:
        return format(date, 'yyyy-MM-dd');
    }
  }

  /**
   * 搜尋最近的活動
   */
  async getRecentActivity(
    organizationId: string,
    limit: number = 10
  ): Promise<AuditLog[]> {
    const q = query(
      collection(db, 'auditLogs'),
      where('context.organizationId', '==', organizationId),
      orderBy('timestamp', 'desc'),
      limit(limit)
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id } as AuditLog));
  }

  /**
   * 搜尋高風險事件
   */
  async getHighRiskEvents(
    organizationId: string,
    limit: number = 20
  ): Promise<AuditLog[]> {
    const q = query(
      collection(db, 'auditLogs'),
      where('context.organizationId', '==', organizationId),
      where('metadata.risk', 'in', ['high', 'critical']),
      orderBy('timestamp', 'desc'),
      limit(limit)
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id } as AuditLog));
  }

  /**
   * 搜尋失敗的操作
   */
  async getFailedOperations(
    organizationId: string,
    limit: number = 20
  ): Promise<AuditLog[]> {
    const q = query(
      collection(db, 'auditLogs'),
      where('context.organizationId', '==', organizationId),
      where('result.status', '==', 'failure'),
      orderBy('timestamp', 'desc'),
      limit(limit)
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id } as AuditLog));
  }

  /**
   * 快取管理
   */
  private getCacheKey(criteria: SearchCriteria): string {
    return JSON.stringify(criteria);
  }

  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now() });
    
    // 限制快取大小
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  /**
   * 清除快取
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// 導出單例實例
export const auditLogQuery = AuditLogQueryService.getInstance();