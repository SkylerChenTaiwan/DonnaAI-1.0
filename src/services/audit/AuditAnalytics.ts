/**
 * 審計分析與異常偵測服務
 * 提供統計分析、異常偵測和風險評估功能
 */

import {
  AuditLog,
  Anomaly,
  Threat,
  AccessPattern,
  RiskAssessment,
  SecurityIncident,
  AuditActionType,
  RiskLevel,
} from '@/types/audit';
import { Timestamp } from 'firebase/firestore';
import { differenceInHours, differenceInDays, format, subDays, subHours } from 'date-fns';

/**
 * 審計分析服務
 */
export class AuditAnalyticsService {
  private static instance: AuditAnalyticsService;
  
  // 異常偵測閾值
  private readonly thresholds = {
    loginTimeDeviation: 6, // 小時
    dailyExportLimit: 10,
    failedLoginLimit: 5,
    rapidAccessLimit: 100, // 每小時請求數
    suspiciousIPScore: 0.7,
    unusualLocationScore: 0.8,
  };

  private constructor() {}

  /**
   * 獲取單例實例
   */
  static getInstance(): AuditAnalyticsService {
    if (!AuditAnalyticsService.instance) {
      AuditAnalyticsService.instance = new AuditAnalyticsService();
    }
    return AuditAnalyticsService.instance;
  }

  /**
   * 偵測異常
   */
  async detectAnomalies(logs: AuditLog[]): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];
    
    // 執行各種異常偵測
    anomalies.push(...this.detectUnusualLoginTimes(logs));
    anomalies.push(...this.detectExcessiveDataExports(logs));
    anomalies.push(...this.detectFailedLoginAttempts(logs));
    anomalies.push(...this.detectRapidAccess(logs));
    anomalies.push(...this.detectPermissionEscalation(logs));
    anomalies.push(...this.detectDataDeletion(logs));
    anomalies.push(...this.detectUnusualAccess(logs));
    
    // 排序（按嚴重程度和時間）
    anomalies.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      
      if (severityDiff !== 0) return severityDiff;
      
      return b.timestamp.toMillis() - a.timestamp.toMillis();
    });
    
    return anomalies;
  }

  /**
   * 偵測異常登入時間
   */
  private detectUnusualLoginTimes(logs: AuditLog[]): Anomaly[] {
    const anomalies: Anomaly[] = [];
    const loginLogs = logs.filter(log => log.action.type === AuditActionType.USER_LOGIN);
    
    // 按用戶分組
    const userLogins = this.groupByUser(loginLogs);
    
    for (const [userId, userLogs] of Object.entries(userLogins)) {
      // 計算平均登入時間
      const loginHours = userLogs.map(log => log.timestamp.toDate().getHours());
      const avgHour = loginHours.reduce((sum, hour) => sum + hour, 0) / loginHours.length;
      
      // 檢測異常時間
      userLogs.forEach(log => {
        const hour = log.timestamp.toDate().getHours();
        const deviation = Math.abs(hour - avgHour);
        
        if (deviation > this.thresholds.loginTimeDeviation) {
          anomalies.push({
            type: 'UNUSUAL_LOGIN_TIME',
            severity: this.assessLoginTimeSeverity(hour),
            userId: log.actor.userId,
            timestamp: log.timestamp,
            description: `異常登入時間 ${hour}:00 (平均 ${Math.round(avgHour)}:00)`,
            confidence: Math.min(deviation / 12, 1), // 信心度基於偏差
          });
        }
      });
    }
    
    return anomalies;
  }

  /**
   * 偵測過量資料匯出
   */
  private detectExcessiveDataExports(logs: AuditLog[]): Anomaly[] {
    const anomalies: Anomaly[] = [];
    const exportLogs = logs.filter(log => log.action.type === AuditActionType.DATA_EXPORTED);
    
    // 按日期分組
    const exportsByDay = this.groupByDay(exportLogs);
    
    for (const [day, dayLogs] of Object.entries(exportsByDay)) {
      if (dayLogs.length > this.thresholds.dailyExportLimit) {
        // 計算匯出的資料量
        const totalRecords = dayLogs.reduce((sum, log) => {
          const recordCount = log.metadata?.recordCount || 0;
          return sum + recordCount;
        }, 0);
        
        anomalies.push({
          type: 'EXCESSIVE_DATA_EXPORT',
          severity: this.assessDataExportSeverity(dayLogs.length, totalRecords),
          timestamp: dayLogs[0].timestamp,
          description: `${day} 有 ${dayLogs.length} 次資料匯出，共 ${totalRecords} 筆記錄`,
          confidence: Math.min(dayLogs.length / this.thresholds.dailyExportLimit, 1),
        });
      }
    }
    
    return anomalies;
  }

  /**
   * 偵測失敗登入嘗試
   */
  private detectFailedLoginAttempts(logs: AuditLog[]): Anomaly[] {
    const anomalies: Anomaly[] = [];
    const failedLogins = logs.filter(log => log.action.type === AuditActionType.USER_LOGIN_FAILED);
    
    // 按用戶和時間窗口分組
    const userFailures = this.groupByUserAndTimeWindow(failedLogins, 60); // 60 分鐘窗口
    
    for (const [key, attempts] of Object.entries(userFailures)) {
      if (attempts.length >= this.thresholds.failedLoginLimit) {
        const [userId] = key.split('_');
        
        anomalies.push({
          type: 'BRUTE_FORCE_ATTEMPT',
          severity: 'critical',
          userId,
          timestamp: attempts[attempts.length - 1].timestamp,
          description: `${attempts.length} 次失敗登入嘗試`,
          confidence: Math.min(attempts.length / 10, 1),
        });
      }
    }
    
    return anomalies;
  }

  /**
   * 偵測快速存取
   */
  private detectRapidAccess(logs: AuditLog[]): Anomaly[] {
    const anomalies: Anomaly[] = [];
    
    // 按用戶和小時分組
    const userHourlyAccess = this.groupByUserAndHour(logs);
    
    for (const [key, hourLogs] of Object.entries(userHourlyAccess)) {
      if (hourLogs.length > this.thresholds.rapidAccessLimit) {
        const [userId, hour] = key.split('_');
        
        anomalies.push({
          type: 'RAPID_ACCESS',
          severity: 'high',
          userId,
          timestamp: hourLogs[0].timestamp,
          description: `${hour} 有 ${hourLogs.length} 次存取（超過限制 ${this.thresholds.rapidAccessLimit}）`,
          confidence: Math.min(hourLogs.length / (this.thresholds.rapidAccessLimit * 2), 1),
        });
      }
    }
    
    return anomalies;
  }

  /**
   * 偵測權限提升
   */
  private detectPermissionEscalation(logs: AuditLog[]): Anomaly[] {
    const anomalies: Anomaly[] = [];
    
    const permissionChanges = logs.filter(log => 
      log.action.type === AuditActionType.USER_ROLE_CHANGED ||
      log.action.type === AuditActionType.PERMISSION_GRANTED
    );
    
    permissionChanges.forEach(log => {
      // 檢查是否提升到管理員權限
      if (log.changes?.after?.role === 'admin' || log.changes?.after?.role === 'super_admin') {
        anomalies.push({
          type: 'PRIVILEGE_ESCALATION',
          severity: 'high',
          userId: log.actor.userId,
          timestamp: log.timestamp,
          description: `權限提升至 ${log.changes.after.role}`,
          confidence: 0.9,
        });
      }
    });
    
    return anomalies;
  }

  /**
   * 偵測資料刪除
   */
  private detectDataDeletion(logs: AuditLog[]): Anomaly[] {
    const anomalies: Anomaly[] = [];
    
    const deleteLogs = logs.filter(log => log.action.type === AuditActionType.DATA_DELETED);
    
    // 按用戶分組
    const userDeletions = this.groupByUser(deleteLogs);
    
    for (const [userId, userLogs] of Object.entries(userDeletions)) {
      // 檢查大量刪除
      if (userLogs.length > 10) {
        anomalies.push({
          type: 'MASS_DELETION',
          severity: 'high',
          userId,
          timestamp: userLogs[userLogs.length - 1].timestamp,
          description: `刪除了 ${userLogs.length} 筆資料`,
          confidence: Math.min(userLogs.length / 20, 1),
        });
      }
    }
    
    return anomalies;
  }

  /**
   * 偵測異常存取模式
   */
  private detectUnusualAccess(logs: AuditLog[]): Anomaly[] {
    const anomalies: Anomaly[] = [];
    
    // 分析存取模式
    const patterns = this.analyzeAccessPatterns(logs);
    
    patterns.forEach(pattern => {
      if (pattern.risk === 'high' || pattern.risk === 'critical') {
        anomalies.push({
          type: 'UNUSUAL_ACCESS_PATTERN',
          severity: pattern.risk,
          userId: pattern.userId,
          timestamp: Timestamp.now(),
          description: pattern.description,
          confidence: 0.7,
        });
      }
    });
    
    return anomalies;
  }

  /**
   * 識別威脅
   */
  identifyThreats(logs: AuditLog[]): Threat[] {
    const threats: Threat[] = [];
    const anomalies = this.detectAnomalies(logs);
    
    // 將異常轉換為威脅
    const threatGroups = this.groupAnomaliesByType(anomalies);
    
    for (const [type, typeAnomalies] of Object.entries(threatGroups)) {
      if (typeAnomalies.length >= 3) {
        // 多個相同類型的異常構成威脅
        threats.push({
          id: `threat_${Date.now()}_${type}`,
          type: this.mapAnomalyToThreatType(type),
          severity: this.assessThreatSeverity(typeAnomalies),
          description: this.generateThreatDescription(type, typeAnomalies),
          detectedAt: new Date(),
          affectedUsers: this.extractAffectedUsers(typeAnomalies),
          mitigationSteps: this.generateMitigationSteps(type),
        });
      }
    }
    
    return threats;
  }

  /**
   * 分析存取模式
   */
  analyzeAccessPatterns(logs: AuditLog[]): AccessPattern[] {
    const patterns: AccessPattern[] = [];
    const userLogs = this.groupByUser(logs);
    
    for (const [userId, userLogList] of Object.entries(userLogs)) {
      // 分析存取時間模式
      const timePattern = this.analyzeTimePattern(userLogList);
      if (timePattern) {
        patterns.push(timePattern);
      }
      
      // 分析資源存取模式
      const resourcePattern = this.analyzeResourcePattern(userId, userLogList);
      if (resourcePattern) {
        patterns.push(resourcePattern);
      }
      
      // 分析操作頻率模式
      const frequencyPattern = this.analyzeFrequencyPattern(userId, userLogList);
      if (frequencyPattern) {
        patterns.push(frequencyPattern);
      }
    }
    
    return patterns;
  }

  /**
   * 分析時間模式
   */
  private analyzeTimePattern(logs: AuditLog[]): AccessPattern | null {
    const hours = logs.map(log => log.timestamp.toDate().getHours());
    const nightAccess = hours.filter(h => h < 6 || h > 22).length;
    
    if (nightAccess / logs.length > 0.5) {
      return {
        userId: logs[0].actor.userId,
        pattern: 'NIGHT_ACCESS',
        frequency: nightAccess,
        risk: 'medium',
        description: '頻繁的夜間存取',
      };
    }
    
    return null;
  }

  /**
   * 分析資源存取模式
   */
  private analyzeResourcePattern(userId: string, logs: AuditLog[]): AccessPattern | null {
    const resources = logs.map(log => log.action.resource);
    const uniqueResources = new Set(resources);
    
    if (uniqueResources.size > 20 && logs.length < 100) {
      return {
        userId,
        pattern: 'RESOURCE_SCANNING',
        frequency: uniqueResources.size,
        risk: 'high',
        description: `短時間內存取了 ${uniqueResources.size} 個不同資源`,
      };
    }
    
    return null;
  }

  /**
   * 分析操作頻率模式
   */
  private analyzeFrequencyPattern(userId: string, logs: AuditLog[]): AccessPattern | null {
    if (logs.length === 0) return null;
    
    const timeSpan = logs[0].timestamp.toMillis() - logs[logs.length - 1].timestamp.toMillis();
    const hours = timeSpan / (1000 * 60 * 60);
    const opsPerHour = logs.length / Math.max(hours, 1);
    
    if (opsPerHour > 100) {
      return {
        userId,
        pattern: 'HIGH_FREQUENCY',
        frequency: Math.round(opsPerHour),
        risk: 'high',
        description: `每小時 ${Math.round(opsPerHour)} 次操作`,
      };
    }
    
    return null;
  }

  /**
   * 評估風險
   */
  assessRisk(logs: AuditLog[]): RiskAssessment {
    const factors = [
      { factor: '失敗操作率', weight: 0.2, score: this.calculateFailureRate(logs) },
      { factor: '高風險事件', weight: 0.3, score: this.calculateHighRiskScore(logs) },
      { factor: '異常活動', weight: 0.25, score: this.calculateAnomalyScore(logs) },
      { factor: '權限變更', weight: 0.15, score: this.calculatePermissionChangeScore(logs) },
      { factor: '資料存取', weight: 0.1, score: this.calculateDataAccessScore(logs) },
    ];
    
    const totalScore = factors.reduce((sum, f) => sum + f.weight * f.score, 0);
    
    // 計算趨勢
    const trend = this.calculateRiskTrend(logs);
    
    return {
      overallRisk: this.scoreToRiskLevel(totalScore),
      riskScore: Math.round(totalScore * 100) / 100,
      factors,
      trend,
    };
  }

  /**
   * 識別安全事件
   */
  identifyIncidents(logs: AuditLog[]): SecurityIncident[] {
    const incidents: SecurityIncident[] = [];
    const anomalies = this.detectAnomalies(logs);
    
    // 將嚴重異常轉換為事件
    const criticalAnomalies = anomalies.filter(a => a.severity === 'critical');
    
    criticalAnomalies.forEach(anomaly => {
      incidents.push({
        id: `incident_${Date.now()}_${anomaly.type}`,
        type: anomaly.type,
        severity: anomaly.severity,
        timestamp: anomaly.timestamp,
        description: anomaly.description,
        affectedResources: this.extractAffectedResources(logs, anomaly),
        responseActions: this.generateResponseActions(anomaly.type),
        status: 'open',
      });
    });
    
    return incidents;
  }

  /**
   * 輔助方法
   */
  private groupByUser(logs: AuditLog[]): Record<string, AuditLog[]> {
    const grouped: Record<string, AuditLog[]> = {};
    
    logs.forEach(log => {
      const userId = log.actor.userId;
      if (!grouped[userId]) {
        grouped[userId] = [];
      }
      grouped[userId].push(log);
    });
    
    return grouped;
  }

  private groupByDay(logs: AuditLog[]): Record<string, AuditLog[]> {
    const grouped: Record<string, AuditLog[]> = {};
    
    logs.forEach(log => {
      const day = format(log.timestamp.toDate(), 'yyyy-MM-dd');
      if (!grouped[day]) {
        grouped[day] = [];
      }
      grouped[day].push(log);
    });
    
    return grouped;
  }

  private groupByUserAndTimeWindow(logs: AuditLog[], windowMinutes: number): Record<string, AuditLog[]> {
    const grouped: Record<string, AuditLog[]> = {};
    
    logs.forEach(log => {
      const userId = log.actor.userId;
      const windowKey = Math.floor(log.timestamp.toMillis() / (windowMinutes * 60 * 1000));
      const key = `${userId}_${windowKey}`;
      
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(log);
    });
    
    return grouped;
  }

  private groupByUserAndHour(logs: AuditLog[]): Record<string, AuditLog[]> {
    const grouped: Record<string, AuditLog[]> = {};
    
    logs.forEach(log => {
      const userId = log.actor.userId;
      const hour = format(log.timestamp.toDate(), 'yyyy-MM-dd HH:00');
      const key = `${userId}_${hour}`;
      
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(log);
    });
    
    return grouped;
  }

  private groupAnomaliesByType(anomalies: Anomaly[]): Record<string, Anomaly[]> {
    const grouped: Record<string, Anomaly[]> = {};
    
    anomalies.forEach(anomaly => {
      if (!grouped[anomaly.type]) {
        grouped[anomaly.type] = [];
      }
      grouped[anomaly.type].push(anomaly);
    });
    
    return grouped;
  }

  private assessLoginTimeSeverity(hour: number): RiskLevel {
    if (hour >= 0 && hour < 4) return 'high';
    if (hour >= 4 && hour < 6) return 'medium';
    if (hour >= 22 && hour <= 23) return 'medium';
    return 'low';
  }

  private assessDataExportSeverity(count: number, records: number): RiskLevel {
    if (count > 50 || records > 10000) return 'critical';
    if (count > 20 || records > 5000) return 'high';
    if (count > 10 || records > 1000) return 'medium';
    return 'low';
  }

  private assessThreatSeverity(anomalies: Anomaly[]): RiskLevel {
    const severityScores = { critical: 4, high: 3, medium: 2, low: 1 };
    const avgScore = anomalies.reduce((sum, a) => sum + severityScores[a.severity], 0) / anomalies.length;
    
    if (avgScore >= 3.5) return 'critical';
    if (avgScore >= 2.5) return 'high';
    if (avgScore >= 1.5) return 'medium';
    return 'low';
  }

  private mapAnomalyToThreatType(anomalyType: string): string {
    const mapping: Record<string, string> = {
      'UNUSUAL_LOGIN_TIME': '異常存取時間',
      'EXCESSIVE_DATA_EXPORT': '資料外洩風險',
      'BRUTE_FORCE_ATTEMPT': '暴力攻擊',
      'RAPID_ACCESS': '異常高頻存取',
      'PRIVILEGE_ESCALATION': '權限提升',
      'MASS_DELETION': '大量資料刪除',
      'UNUSUAL_ACCESS_PATTERN': '異常存取模式',
    };
    
    return mapping[anomalyType] || '未知威脅';
  }

  private generateThreatDescription(type: string, anomalies: Anomaly[]): string {
    return `偵測到 ${anomalies.length} 個 ${this.mapAnomalyToThreatType(type)} 相關的異常活動`;
  }

  private extractAffectedUsers(anomalies: Anomaly[]): string[] {
    const users = new Set<string>();
    anomalies.forEach(a => {
      if (a.userId) users.add(a.userId);
    });
    return Array.from(users);
  }

  private generateMitigationSteps(type: string): string[] {
    const steps: Record<string, string[]> = {
      'BRUTE_FORCE_ATTEMPT': [
        '暫時鎖定受影響的帳戶',
        '要求用戶重設密碼',
        '啟用多因素認證',
        '檢查 IP 封鎖清單',
      ],
      'EXCESSIVE_DATA_EXPORT': [
        '審查資料匯出權限',
        '設定匯出限制',
        '檢查資料分類政策',
        '啟用資料遺失防護',
      ],
      'PRIVILEGE_ESCALATION': [
        '審查權限變更',
        '確認授權流程',
        '檢查角色定義',
        '實施最小權限原則',
      ],
    };
    
    return steps[type] || ['調查異常活動', '聯絡安全團隊', '記錄事件詳情'];
  }

  private extractAffectedResources(logs: AuditLog[], anomaly: Anomaly): string[] {
    const resources = new Set<string>();
    
    logs.forEach(log => {
      if (log.actor.userId === anomaly.userId) {
        resources.add(log.action.resource);
      }
    });
    
    return Array.from(resources);
  }

  private generateResponseActions(type: string): string[] {
    const actions: Record<string, string[]> = {
      'BRUTE_FORCE_ATTEMPT': ['鎖定帳戶', '通知用戶', '增加監控'],
      'EXCESSIVE_DATA_EXPORT': ['限制匯出', '審查活動', '通知管理員'],
      'PRIVILEGE_ESCALATION': ['審查權限', '確認授權', '記錄變更'],
    };
    
    return actions[type] || ['調查', '記錄', '監控'];
  }

  private calculateFailureRate(logs: AuditLog[]): number {
    if (logs.length === 0) return 0;
    const failures = logs.filter(log => log.result.status === 'failure').length;
    return failures / logs.length;
  }

  private calculateHighRiskScore(logs: AuditLog[]): number {
    const highRiskLogs = logs.filter(log => 
      log.metadata?.risk === 'high' || log.metadata?.risk === 'critical'
    );
    return highRiskLogs.length / Math.max(logs.length, 1);
  }

  private calculateAnomalyScore(logs: AuditLog[]): number {
    const anomalies = this.detectAnomalies(logs);
    return Math.min(anomalies.length / 10, 1);
  }

  private calculatePermissionChangeScore(logs: AuditLog[]): number {
    const permissionLogs = logs.filter(log => 
      log.action.type.includes('PERMISSION') || log.action.type.includes('ROLE')
    );
    return permissionLogs.length / Math.max(logs.length, 1);
  }

  private calculateDataAccessScore(logs: AuditLog[]): number {
    const dataLogs = logs.filter(log => 
      log.action.type.includes('DATA_')
    );
    return dataLogs.length / Math.max(logs.length, 1);
  }

  private calculateRiskTrend(logs: AuditLog[]): 'increasing' | 'stable' | 'decreasing' {
    if (logs.length < 2) return 'stable';
    
    // 分成兩半比較
    const midpoint = Math.floor(logs.length / 2);
    const firstHalf = logs.slice(0, midpoint);
    const secondHalf = logs.slice(midpoint);
    
    const firstScore = this.calculateHighRiskScore(firstHalf);
    const secondScore = this.calculateHighRiskScore(secondHalf);
    
    if (secondScore > firstScore * 1.2) return 'increasing';
    if (secondScore < firstScore * 0.8) return 'decreasing';
    return 'stable';
  }

  private scoreToRiskLevel(score: number): RiskLevel {
    if (score >= 0.75) return 'critical';
    if (score >= 0.5) return 'high';
    if (score >= 0.25) return 'medium';
    return 'low';
  }
}

// 導出單例實例
export const auditAnalytics = AuditAnalyticsService.getInstance();