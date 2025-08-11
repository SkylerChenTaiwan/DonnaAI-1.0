/**
 * 審計報告生成服務
 * 生成合規和安全報告
 */

import {
  AuditLog,
  ComplianceReport,
  SecurityReport,
  ReportPeriod,
  SearchCriteria,
  TimeRange,
  ActionCategory,
  AuditActionType,
  RiskLevel,
} from '@/types/audit';
import { auditLogQuery } from './AuditLogQuery';
import { auditAnalytics } from './AuditAnalytics';
import { getFirebaseDb } from '@/services/firebase/config';
const db = getFirebaseDb();
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import * as XLSX from 'xlsx';

// 註冊 PDF 字型
if (typeof window !== 'undefined') {
  pdfMake.vfs = pdfFonts.pdfMake.vfs;
}

/**
 * 審計報告生成器
 */
export class AuditReportGenerator {
  private static instance: AuditReportGenerator;

  private constructor() {}

  /**
   * 獲取單例實例
   */
  static getInstance(): AuditReportGenerator {
    if (!AuditReportGenerator.instance) {
      AuditReportGenerator.instance = new AuditReportGenerator();
    }
    return AuditReportGenerator.instance;
  }

  /**
   * 生成合規報告
   */
  async generateComplianceReport(
    organizationId: string,
    period: ReportPeriod
  ): Promise<ComplianceReport> {
    try {
      // 計算報告期間的日期範圍
      const dateRange = this.calculateDateRange(period);
      
      // 獲取組織資訊
      const orgInfo = await this.getOrganizationInfo(organizationId);
      
      // 獲取期間內的所有審計日誌
      const logs = await this.getLogsForPeriod(organizationId, dateRange);
      
      // 生成報告摘要
      const summary = this.generateComplianceSummary(logs);
      
      // 分析用戶活動
      const userActivity = this.analyzeUserActivity(logs);
      
      // 分析資料存取
      const dataAccess = this.analyzeDataAccess(logs);
      
      // 分析安全事件
      const securityEvents = this.analyzeSecurityEvents(logs);
      
      // 生成建議
      const recommendations = this.generateComplianceRecommendations(summary, securityEvents);
      
      const report: ComplianceReport = {
        period,
        organization: {
          id: organizationId,
          name: orgInfo.name,
          totalUsers: orgInfo.totalUsers,
        },
        summary,
        userActivity,
        dataAccess,
        securityEvents,
        recommendations,
        generatedAt: new Date(),
        signature: this.generateReportSignature(),
      };
      
      return report;
    } catch (error) {
      console.error('生成合規報告失敗:', error);
      throw error;
    }
  }

  /**
   * 生成安全報告
   */
  async generateSecurityReport(
    organizationId: string,
    dateRange: TimeRange
  ): Promise<SecurityReport> {
    try {
      // 獲取期間內的審計日誌
      const logs = await this.getLogsForDateRange(organizationId, dateRange);
      
      // 使用分析服務進行安全分析
      const anomalies = await auditAnalytics.detectAnomalies(logs);
      const threats = auditAnalytics.identifyThreats(logs);
      const accessPatterns = auditAnalytics.analyzeAccessPatterns(logs);
      const riskAssessment = auditAnalytics.assessRisk(logs);
      const incidents = auditAnalytics.identifyIncidents(logs);
      
      // 生成安全建議
      const recommendations = this.generateSecurityRecommendations(
        threats,
        anomalies,
        incidents,
        riskAssessment
      );
      
      const report: SecurityReport = {
        threats,
        anomalies,
        accessPatterns,
        riskAssessment,
        incidents,
        recommendations,
      };
      
      return report;
    } catch (error) {
      console.error('生成安全報告失敗:', error);
      throw error;
    }
  }

  /**
   * 匯出報告為 PDF
   */
  async exportToPDF(report: ComplianceReport | SecurityReport, type: 'compliance' | 'security'): Promise<Blob> {
    const docDefinition: any = {
      content: [],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          margin: [0, 0, 0, 10],
        },
        subheader: {
          fontSize: 14,
          bold: true,
          margin: [0, 10, 0, 5],
        },
        tableHeader: {
          bold: true,
          fontSize: 10,
          color: 'black',
          fillColor: '#f3f3f3',
        },
      },
      defaultStyle: {
        font: 'Roboto',
      },
    };

    if (type === 'compliance') {
      const compReport = report as ComplianceReport;
      docDefinition.content = this.buildCompliancePDFContent(compReport);
    } else {
      const secReport = report as SecurityReport;
      docDefinition.content = this.buildSecurityPDFContent(secReport);
    }

    return new Promise((resolve) => {
      pdfMake.createPdf(docDefinition).getBlob((blob) => {
        resolve(blob);
      });
    });
  }

  /**
   * 匯出報告為 Excel
   */
  async exportToExcel(report: ComplianceReport | SecurityReport, type: 'compliance' | 'security'): Promise<Blob> {
    const workbook = XLSX.utils.book_new();

    if (type === 'compliance') {
      const compReport = report as ComplianceReport;
      
      // 摘要頁
      const summaryData = [
        ['合規報告摘要'],
        [''],
        ['組織名稱', compReport.organization.name],
        ['報告期間', this.formatReportPeriod(compReport.period)],
        ['總事件數', compReport.summary.totalEvents],
        ['關鍵事件', compReport.summary.criticalEvents],
        ['失敗認證', compReport.summary.failedAuthentications],
        ['資料匯出', compReport.summary.dataExports],
        ['權限變更', compReport.summary.permissionChanges],
        ['用戶修改', compReport.summary.userModifications],
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, '摘要');

      // 用戶活動頁
      const userActivityData = [
        ['用戶ID', '用戶名稱', '登入次數', '操作次數', '最後活動時間'],
        ...compReport.userActivity.map(u => [
          u.userId,
          u.userName,
          u.loginCount,
          u.actionCount,
          format(u.lastActive, 'yyyy-MM-dd HH:mm:ss'),
        ]),
      ];
      const userActivitySheet = XLSX.utils.aoa_to_sheet(userActivityData);
      XLSX.utils.book_append_sheet(workbook, userActivitySheet, '用戶活動');

      // 資料存取頁
      const dataAccessData = [
        ['資源', '存取次數', '唯一用戶數', '匯出次數'],
        ...compReport.dataAccess.map(d => [
          d.resource,
          d.accessCount,
          d.uniqueUsers,
          d.exportCount,
        ]),
      ];
      const dataAccessSheet = XLSX.utils.aoa_to_sheet(dataAccessData);
      XLSX.utils.book_append_sheet(workbook, dataAccessSheet, '資料存取');

      // 安全事件頁
      const securityEventsData = [
        ['事件類型', '發生次數', '嚴重程度', '最後發生時間'],
        ...compReport.securityEvents.map(e => [
          e.type,
          e.count,
          e.severity,
          format(e.lastOccurrence, 'yyyy-MM-dd HH:mm:ss'),
        ]),
      ];
      const securityEventsSheet = XLSX.utils.aoa_to_sheet(securityEventsData);
      XLSX.utils.book_append_sheet(workbook, securityEventsSheet, '安全事件');
    } else {
      const secReport = report as SecurityReport;
      
      // 威脅頁
      const threatsData = [
        ['威脅ID', '類型', '嚴重程度', '描述', '偵測時間'],
        ...secReport.threats.map(t => [
          t.id,
          t.type,
          t.severity,
          t.description,
          format(t.detectedAt, 'yyyy-MM-dd HH:mm:ss'),
        ]),
      ];
      const threatsSheet = XLSX.utils.aoa_to_sheet(threatsData);
      XLSX.utils.book_append_sheet(workbook, threatsSheet, '威脅');

      // 異常頁
      const anomaliesData = [
        ['類型', '嚴重程度', '用戶ID', '描述', '信心度'],
        ...secReport.anomalies.map(a => [
          a.type,
          a.severity,
          a.userId || 'N/A',
          a.description,
          `${Math.round(a.confidence * 100)}%`,
        ]),
      ];
      const anomaliesSheet = XLSX.utils.aoa_to_sheet(anomaliesData);
      XLSX.utils.book_append_sheet(workbook, anomaliesSheet, '異常');

      // 風險評估頁
      const riskData = [
        ['風險評估'],
        [''],
        ['整體風險等級', secReport.riskAssessment.overallRisk],
        ['風險分數', secReport.riskAssessment.riskScore],
        ['趨勢', secReport.riskAssessment.trend],
        [''],
        ['風險因子', '權重', '分數'],
        ...secReport.riskAssessment.factors.map(f => [
          f.factor,
          f.weight,
          f.score,
        ]),
      ];
      const riskSheet = XLSX.utils.aoa_to_sheet(riskData);
      XLSX.utils.book_append_sheet(workbook, riskSheet, '風險評估');
    }

    // 轉換為 Blob
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  /**
   * 排程報告生成
   */
  async scheduleReport(
    organizationId: string,
    reportType: 'compliance' | 'security',
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly',
    recipients: string[]
  ): Promise<void> {
    // 儲存排程設定到 Firestore
    const scheduleDoc = {
      organizationId,
      reportType,
      frequency,
      recipients,
      enabled: true,
      createdAt: Timestamp.now(),
      lastRun: null,
      nextRun: this.calculateNextRun(frequency),
    };

    try {
      await db.collection('auditReportSchedules').add(scheduleDoc);
      console.log('報告排程已建立');
    } catch (error) {
      console.error('建立報告排程失敗:', error);
      throw error;
    }
  }

  /**
   * 輔助方法
   */
  private calculateDateRange(period: ReportPeriod): TimeRange {
    const year = period.year;
    let start: Date;
    let end: Date;

    if (period.month) {
      // 月報告
      start = startOfMonth(new Date(year, period.month - 1));
      end = endOfMonth(new Date(year, period.month - 1));
    } else if (period.quarter) {
      // 季報告
      const quarterStart = (period.quarter - 1) * 3;
      start = startOfQuarter(new Date(year, quarterStart));
      end = endOfQuarter(new Date(year, quarterStart));
    } else {
      // 年報告
      start = startOfYear(new Date(year, 0));
      end = endOfYear(new Date(year, 0));
    }

    return {
      start,
      end,
      granularity: period.month ? 'day' : period.quarter ? 'week' : 'month',
    };
  }

  private async getOrganizationInfo(organizationId: string): Promise<any> {
    try {
      const orgDoc = await db.collection('organizations').doc(organizationId).get();
      const orgData = orgDoc.data();
      
      // 獲取用戶數
      const usersSnapshot = await db.collection('users')
        .where('organizationId', '==', organizationId)
        .get();
      
      return {
        name: orgData?.name || 'Unknown Organization',
        totalUsers: usersSnapshot.size,
      };
    } catch (error) {
      console.error('獲取組織資訊失敗:', error);
      return {
        name: 'Unknown Organization',
        totalUsers: 0,
      };
    }
  }

  private async getLogsForPeriod(organizationId: string, dateRange: TimeRange): Promise<AuditLog[]> {
    const criteria: SearchCriteria = {
      organizationId,
      dateRange: {
        start: dateRange.start,
        end: dateRange.end,
      },
    };

    const result = await auditLogQuery.search(criteria);
    return result.logs;
  }

  private async getLogsForDateRange(organizationId: string, dateRange: TimeRange): Promise<AuditLog[]> {
    return this.getLogsForPeriod(organizationId, dateRange);
  }

  private generateComplianceSummary(logs: AuditLog[]): any {
    return {
      totalEvents: logs.length,
      criticalEvents: logs.filter(l => l.metadata?.risk === 'critical').length,
      failedAuthentications: logs.filter(l => l.action.type === AuditActionType.USER_LOGIN_FAILED).length,
      dataExports: logs.filter(l => l.action.type === AuditActionType.DATA_EXPORTED).length,
      permissionChanges: logs.filter(l => 
        l.action.type === AuditActionType.PERMISSION_GRANTED ||
        l.action.type === AuditActionType.PERMISSION_REVOKED ||
        l.action.type === AuditActionType.USER_ROLE_CHANGED
      ).length,
      userModifications: logs.filter(l => 
        l.action.type === AuditActionType.USER_CREATED ||
        l.action.type === AuditActionType.USER_UPDATED ||
        l.action.type === AuditActionType.USER_DELETED
      ).length,
    };
  }

  private analyzeUserActivity(logs: AuditLog[]): any[] {
    const userMap = new Map<string, any>();

    logs.forEach(log => {
      const userId = log.actor.userId;
      
      if (!userMap.has(userId)) {
        userMap.set(userId, {
          userId,
          userName: log.actor.userName,
          loginCount: 0,
          actionCount: 0,
          lastActive: log.timestamp.toDate(),
        });
      }

      const user = userMap.get(userId);
      user.actionCount++;
      
      if (log.action.type === AuditActionType.USER_LOGIN) {
        user.loginCount++;
      }

      if (log.timestamp.toDate() > user.lastActive) {
        user.lastActive = log.timestamp.toDate();
      }
    });

    return Array.from(userMap.values())
      .sort((a, b) => b.actionCount - a.actionCount)
      .slice(0, 20); // 前 20 名用戶
  }

  private analyzeDataAccess(logs: AuditLog[]): any[] {
    const resourceMap = new Map<string, any>();

    logs.forEach(log => {
      if (log.action.category === ActionCategory.DATA_MANAGEMENT) {
        const resource = log.action.resource;
        
        if (!resourceMap.has(resource)) {
          resourceMap.set(resource, {
            resource,
            accessCount: 0,
            uniqueUsers: new Set(),
            exportCount: 0,
          });
        }

        const res = resourceMap.get(resource);
        res.accessCount++;
        res.uniqueUsers.add(log.actor.userId);
        
        if (log.action.type === AuditActionType.DATA_EXPORTED) {
          res.exportCount++;
        }
      }
    });

    return Array.from(resourceMap.values())
      .map(r => ({
        ...r,
        uniqueUsers: r.uniqueUsers.size,
      }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 20); // 前 20 個資源
  }

  private analyzeSecurityEvents(logs: AuditLog[]): any[] {
    const eventMap = new Map<string, any>();

    logs.forEach(log => {
      if (log.action.category === ActionCategory.SECURITY || log.metadata?.risk === 'high' || log.metadata?.risk === 'critical') {
        const type = log.action.type;
        
        if (!eventMap.has(type)) {
          eventMap.set(type, {
            type,
            count: 0,
            severity: log.metadata?.risk || 'low',
            lastOccurrence: log.timestamp.toDate(),
          });
        }

        const event = eventMap.get(type);
        event.count++;
        
        if (log.timestamp.toDate() > event.lastOccurrence) {
          event.lastOccurrence = log.timestamp.toDate();
        }
      }
    });

    return Array.from(eventMap.values())
      .sort((a, b) => b.count - a.count);
  }

  private generateComplianceRecommendations(summary: any, securityEvents: any[]): string[] {
    const recommendations: string[] = [];

    // 基於摘要的建議
    if (summary.failedAuthentications > 10) {
      recommendations.push('實施更強的密碼政策和多因素認證');
    }

    if (summary.dataExports > 50) {
      recommendations.push('審查資料匯出權限並實施資料分類政策');
    }

    if (summary.permissionChanges > 20) {
      recommendations.push('實施權限變更審批流程');
    }

    if (summary.criticalEvents > 5) {
      recommendations.push('加強安全監控和事件響應程序');
    }

    // 基於安全事件的建議
    const suspiciousActivities = securityEvents.find(e => e.type === AuditActionType.SUSPICIOUS_ACTIVITY);
    if (suspiciousActivities && suspiciousActivities.count > 0) {
      recommendations.push('調查可疑活動並更新安全政策');
    }

    // 通用建議
    recommendations.push('定期審查用戶權限和角色');
    recommendations.push('實施安全意識培訓計劃');
    recommendations.push('定期執行安全稽核和漏洞評估');

    return recommendations;
  }

  private generateSecurityRecommendations(
    threats: any[],
    anomalies: any[],
    incidents: any[],
    riskAssessment: any
  ): string[] {
    const recommendations: string[] = [];

    // 基於威脅的建議
    if (threats.length > 0) {
      const criticalThreats = threats.filter(t => t.severity === 'critical');
      if (criticalThreats.length > 0) {
        recommendations.push('立即處理關鍵威脅並啟動事件響應程序');
      }
      recommendations.push('審查並實施威脅緩解措施');
    }

    // 基於異常的建議
    const bruteForceAttempts = anomalies.filter(a => a.type === 'BRUTE_FORCE_ATTEMPT');
    if (bruteForceAttempts.length > 0) {
      recommendations.push('實施帳戶鎖定政策和 IP 封鎖機制');
    }

    const dataExports = anomalies.filter(a => a.type === 'EXCESSIVE_DATA_EXPORT');
    if (dataExports.length > 0) {
      recommendations.push('實施資料遺失防護 (DLP) 解決方案');
    }

    // 基於風險評估的建議
    if (riskAssessment.overallRisk === 'critical' || riskAssessment.overallRisk === 'high') {
      recommendations.push('執行全面的安全審計');
      recommendations.push('增強監控和告警系統');
      recommendations.push('審查並更新安全政策');
    }

    if (riskAssessment.trend === 'increasing') {
      recommendations.push('調查風險增加的原因並採取預防措施');
    }

    // 基於事件的建議
    const openIncidents = incidents.filter(i => i.status === 'open');
    if (openIncidents.length > 0) {
      recommendations.push(`優先處理 ${openIncidents.length} 個未解決的安全事件`);
    }

    // 通用安全建議
    recommendations.push('實施零信任架構');
    recommendations.push('加強端點安全和網路分段');
    recommendations.push('定期進行滲透測試和紅隊演練');

    return recommendations;
  }

  private generateReportSignature(): string {
    // 生成報告簽名（用於驗證報告完整性）
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `${timestamp}-${random}`;
  }

  private formatReportPeriod(period: ReportPeriod): string {
    if (period.month) {
      return format(new Date(period.year, period.month - 1), 'yyyy年MM月', { locale: zhTW });
    }
    if (period.quarter) {
      return `${period.year}年第${period.quarter}季`;
    }
    return `${period.year}年`;
  }

  private buildCompliancePDFContent(report: ComplianceReport): any[] {
    return [
      { text: '合規報告', style: 'header' },
      { text: `組織: ${report.organization.name}` },
      { text: `期間: ${this.formatReportPeriod(report.period)}` },
      { text: `生成時間: ${format(report.generatedAt, 'yyyy-MM-dd HH:mm:ss')}` },
      
      { text: '執行摘要', style: 'subheader' },
      {
        table: {
          body: [
            ['指標', '數值'],
            ['總事件數', report.summary.totalEvents],
            ['關鍵事件', report.summary.criticalEvents],
            ['失敗認證', report.summary.failedAuthentications],
            ['資料匯出', report.summary.dataExports],
            ['權限變更', report.summary.permissionChanges],
            ['用戶修改', report.summary.userModifications],
          ],
        },
      },
      
      { text: '建議事項', style: 'subheader' },
      {
        ul: report.recommendations,
      },
    ];
  }

  private buildSecurityPDFContent(report: SecurityReport): any[] {
    return [
      { text: '安全報告', style: 'header' },
      { text: `風險等級: ${report.riskAssessment.overallRisk}` },
      { text: `風險分數: ${report.riskAssessment.riskScore}` },
      { text: `趨勢: ${report.riskAssessment.trend}` },
      
      { text: '威脅摘要', style: 'subheader' },
      {
        table: {
          body: [
            ['威脅類型', '嚴重程度', '描述'],
            ...report.threats.slice(0, 10).map(t => [t.type, t.severity, t.description]),
          ],
        },
      },
      
      { text: '異常活動', style: 'subheader' },
      {
        table: {
          body: [
            ['類型', '嚴重程度', '描述'],
            ...report.anomalies.slice(0, 10).map(a => [a.type, a.severity, a.description]),
          ],
        },
      },
      
      { text: '建議事項', style: 'subheader' },
      {
        ul: report.recommendations,
      },
    ];
  }

  private calculateNextRun(frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly'): Date {
    const now = new Date();
    
    switch (frequency) {
      case 'daily':
        now.setDate(now.getDate() + 1);
        now.setHours(2, 0, 0, 0);
        break;
      case 'weekly':
        now.setDate(now.getDate() + 7);
        now.setHours(2, 0, 0, 0);
        break;
      case 'monthly':
        now.setMonth(now.getMonth() + 1);
        now.setDate(1);
        now.setHours(2, 0, 0, 0);
        break;
      case 'quarterly':
        now.setMonth(now.getMonth() + 3);
        now.setDate(1);
        now.setHours(2, 0, 0, 0);
        break;
    }
    
    return now;
  }
}

// 導出單例實例
export const auditReportGenerator = AuditReportGenerator.getInstance();