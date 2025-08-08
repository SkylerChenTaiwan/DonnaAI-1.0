# PRP: 組織審計日誌系統（Organization Audit Logging System）

## 概述
建立完整的審計日誌系統，追蹤和記錄所有重要的組織操作，提供合規性報告、安全監控和操作歷史查詢功能。

## 背景與需求
企業級應用需要完整的審計追蹤以滿足：
- 合規性要求（GDPR、SOC 2 等）
- 安全事件調查
- 操作歷史回溯
- 使用模式分析
- 計費和使用量追蹤

目前系統缺乏統一的審計機制，需要建立中央化的日誌系統。

## 範圍定義
本 PRP 包含：
- 審計日誌架構設計
- 自動日誌收集機制
- 查詢和報告介面
- 日誌保留和歸檔策略

不包含：
- 組織入職流程（PRP-84）
- 資料匯入功能（PRP-85）

## 實施計畫

### 階段 1：審計架構設計

#### 1.1 日誌資料模型
```typescript
interface AuditLog {
  // 基本資訊
  id: string;
  timestamp: Timestamp;
  
  // 執行者資訊
  actor: {
    userId: string;
    userEmail: string;
    userName: string;
    userRole: string;
    ipAddress: string;
    userAgent: string;
    sessionId: string;
  };
  
  // 組織上下文
  context: {
    organizationId: string;
    organizationName: string;
    teamId?: string;
    environment: 'production' | 'staging' | 'development';
  };
  
  // 動作資訊
  action: {
    type: AuditActionType;
    category: ActionCategory;
    resource: string;
    resourceId?: string;
    method: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXECUTE';
    
  };
  
  // 變更詳情
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
    diff?: Array<{
      field: string;
      oldValue: any;
      newValue: any;
    }>;
  };
  
  // 結果
  result: {
    status: 'success' | 'failure' | 'partial';
    errorCode?: string;
    errorMessage?: string;
    duration?: number; // ms
  };
  
  // 額外資訊
  metadata?: {
    source: 'web' | 'mobile' | 'api' | 'system';
    correlationId?: string; // 關聯多個相關操作
    tags?: string[];
    risk?: 'low' | 'medium' | 'high' | 'critical';
  };
}

// 審計動作類型
enum AuditActionType {
  // 認證相關
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  USER_LOGIN_FAILED = 'USER_LOGIN_FAILED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  PASSWORD_RESET = 'PASSWORD_RESET',
  MFA_ENABLED = 'MFA_ENABLED',
  MFA_DISABLED = 'MFA_DISABLED',
  
  // 用戶管理
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_ACTIVATED = 'USER_ACTIVATED',
  USER_DEACTIVATED = 'USER_DEACTIVATED',
  USER_ROLE_CHANGED = 'USER_ROLE_CHANGED',
  
  // 資料操作
  DATA_CREATED = 'DATA_CREATED',
  DATA_UPDATED = 'DATA_UPDATED',
  DATA_DELETED = 'DATA_DELETED',
  DATA_EXPORTED = 'DATA_EXPORTED',
  DATA_IMPORTED = 'DATA_IMPORTED',
  BULK_OPERATION = 'BULK_OPERATION',
  
  // 權限變更
  PERMISSION_GRANTED = 'PERMISSION_GRANTED',
  PERMISSION_REVOKED = 'PERMISSION_REVOKED',
  ROLE_CREATED = 'ROLE_CREATED',
  ROLE_UPDATED = 'ROLE_UPDATED',
  ROLE_DELETED = 'ROLE_DELETED',
  
  // 組織管理
  ORG_CREATED = 'ORG_CREATED',
  ORG_UPDATED = 'ORG_UPDATED',
  ORG_SUSPENDED = 'ORG_SUSPENDED',
  ORG_ACTIVATED = 'ORG_ACTIVATED',
  ORG_DELETED = 'ORG_DELETED',
  BILLING_CHANGED = 'BILLING_CHANGED',
  
  // 系統事件
  SYSTEM_CONFIG_CHANGED = 'SYSTEM_CONFIG_CHANGED',
  INTEGRATION_CONNECTED = 'INTEGRATION_CONNECTED',
  INTEGRATION_DISCONNECTED = 'INTEGRATION_DISCONNECTED',
  BACKUP_CREATED = 'BACKUP_CREATED',
  BACKUP_RESTORED = 'BACKUP_RESTORED',
  
  // 安全事件
  SECURITY_ALERT = 'SECURITY_ALERT',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  ACCESS_DENIED = 'ACCESS_DENIED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}

// 動作分類
enum ActionCategory {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  USER_MANAGEMENT = 'USER_MANAGEMENT',
  DATA_MANAGEMENT = 'DATA_MANAGEMENT',
  SYSTEM_ADMINISTRATION = 'SYSTEM_ADMINISTRATION',
  SECURITY = 'SECURITY',
  BILLING = 'BILLING',
  COMPLIANCE = 'COMPLIANCE'
}
```

#### 1.2 日誌收集策略
```typescript
// 自動日誌收集裝飾器
function Audited(options?: AuditOptions) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      const auditContext = await prepareAuditContext(options, args);
      
      try {
        const result = await originalMethod.apply(this, args);
        
        await logAuditEvent({
          ...auditContext,
          result: {
            status: 'success',
            duration: Date.now() - startTime
          }
        });
        
        return result;
      } catch (error) {
        await logAuditEvent({
          ...auditContext,
          result: {
            status: 'failure',
            errorMessage: error.message,
            duration: Date.now() - startTime
          }
        });
        
        throw error;
      }
    };
    
    return descriptor;
  };
}

// 使用範例
class UserService {
  @Audited({ 
    action: AuditActionType.USER_CREATED,
    category: ActionCategory.USER_MANAGEMENT,
    risk: 'low'
  })
  async createUser(userData: UserData): Promise<User> {
    // 建立用戶邏輯
  }
  
  @Audited({ 
    action: AuditActionType.USER_ROLE_CHANGED,
    category: ActionCategory.AUTHORIZATION,
    risk: 'high'
  })
  async changeUserRole(userId: string, newRole: string): Promise<void> {
    // 變更角色邏輯
  }
}
```

### 階段 2：日誌儲存與索引

#### 2.1 儲存架構
```typescript
// Firestore 集合結構
interface AuditLogCollection {
  // 主要日誌集合（近期資料）
  auditLogs: {
    [logId: string]: AuditLog;
  };
  
  // 歸檔集合（舊資料）
  auditLogsArchive: {
    [year: string]: {
      [month: string]: {
        [logId: string]: AuditLog;
      };
    };
  };
  
  // 索引集合（快速查詢）
  auditLogIndices: {
    byUser: {
      [userId: string]: string[]; // logIds
    };
    byOrganization: {
      [orgId: string]: string[]; // logIds
    };
    byAction: {
      [action: string]: string[]; // logIds
    };
    byDate: {
      [date: string]: string[]; // logIds
    };
  };
}

// 複合索引配置
const AUDIT_LOG_INDICES = [
  ['context.organizationId', 'timestamp'],
  ['actor.userId', 'timestamp'],
  ['action.type', 'timestamp'],
  ['result.status', 'timestamp'],
  ['metadata.risk', 'timestamp']
];
```

#### 2.2 高效寫入服務
```typescript
class AuditLogWriter {
  private buffer: AuditLog[] = [];
  private flushInterval: NodeJS.Timer;
  
  constructor(
    private readonly batchSize: number = 100,
    private readonly flushIntervalMs: number = 5000
  ) {
    this.startFlushTimer();
  }
  
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
  
  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    
    const logs = [...this.buffer];
    this.buffer = [];
    
    const batch = writeBatch(db);
    
    logs.forEach(log => {
      // 寫入主集合
      const logRef = doc(collection(db, 'auditLogs'));
      batch.set(logRef, log);
      
      // 更新索引
      this.updateIndices(batch, log);
    });
    
    await batch.commit();
    
    // 非同步歸檔舊資料
    this.archiveOldLogs();
  }
  
  private updateIndices(batch: WriteBatch, log: AuditLog): void {
    // 更新用戶索引
    const userIndexRef = doc(db, 'auditLogIndices', 'byUser', log.actor.userId);
    batch.update(userIndexRef, {
      logs: arrayUnion(log.id)
    });
    
    // 更新組織索引
    const orgIndexRef = doc(db, 'auditLogIndices', 'byOrganization', log.context.organizationId);
    batch.update(orgIndexRef, {
      logs: arrayUnion(log.id)
    });
    
    // 更新日期索引
    const dateKey = format(log.timestamp.toDate(), 'yyyy-MM-dd');
    const dateIndexRef = doc(db, 'auditLogIndices', 'byDate', dateKey);
    batch.update(dateIndexRef, {
      logs: arrayUnion(log.id)
    });
  }
  
  private async archiveOldLogs(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const q = query(
      collection(db, 'auditLogs'),
      where('timestamp', '<', thirtyDaysAgo),
      limit(1000)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return;
    
    const batch = writeBatch(db);
    
    snapshot.docs.forEach(doc => {
      const log = doc.data() as AuditLog;
      const date = log.timestamp.toDate();
      const year = date.getFullYear().toString();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      
      // 移至歸檔集合
      const archiveRef = doc(db, 'auditLogsArchive', year, month, doc.id);
      batch.set(archiveRef, log);
      
      // 刪除原始記錄
      batch.delete(doc.ref);
    });
    
    await batch.commit();
  }
}
```

### 階段 3：查詢與分析

#### 3.1 查詢服務
```typescript
class AuditLogQueryService {
  async search(criteria: SearchCriteria): Promise<SearchResult> {
    let q = collection(db, 'auditLogs') as Query;
    
    // 建立查詢條件
    if (criteria.organizationId) {
      q = query(q, where('context.organizationId', '==', criteria.organizationId));
    }
    
    if (criteria.userId) {
      q = query(q, where('actor.userId', '==', criteria.userId));
    }
    
    if (criteria.actionTypes && criteria.actionTypes.length > 0) {
      q = query(q, where('action.type', 'in', criteria.actionTypes));
    }
    
    if (criteria.dateRange) {
      q = query(q, 
        where('timestamp', '>=', criteria.dateRange.start),
        where('timestamp', '<=', criteria.dateRange.end)
      );
    }
    
    if (criteria.riskLevels && criteria.riskLevels.length > 0) {
      q = query(q, where('metadata.risk', 'in', criteria.riskLevels));
    }
    
    // 排序和分頁
    q = query(q, orderBy('timestamp', criteria.sortOrder || 'desc'));
    
    if (criteria.limit) {
      q = query(q, limit(criteria.limit));
    }
    
    if (criteria.startAfter) {
      q = query(q, startAfter(criteria.startAfter));
    }
    
    const snapshot = await getDocs(q);
    
    return {
      logs: snapshot.docs.map(doc => doc.data() as AuditLog),
      totalCount: await this.getTotalCount(criteria),
      hasMore: snapshot.docs.length === criteria.limit
    };
  }
  
  async getStatistics(
    organizationId: string,
    timeRange: TimeRange
  ): Promise<AuditStatistics> {
    const logs = await this.getLogsInRange(organizationId, timeRange);
    
    return {
      totalEvents: logs.length,
      uniqueUsers: new Set(logs.map(l => l.actor.userId)).size,
      eventsByType: this.groupByType(logs),
      eventsByCategory: this.groupByCategory(logs),
      failureRate: this.calculateFailureRate(logs),
      averageResponseTime: this.calculateAverageResponseTime(logs),
      topUsers: this.getTopUsers(logs),
      riskDistribution: this.getRiskDistribution(logs),
      timeline: this.generateTimeline(logs, timeRange)
    };
  }
  
  private generateTimeline(
    logs: AuditLog[],
    timeRange: TimeRange
  ): TimelineData {
    const buckets = this.createTimeBuckets(timeRange);
    
    logs.forEach(log => {
      const bucketKey = this.getBucketKey(log.timestamp, timeRange.granularity);
      if (buckets[bucketKey]) {
        buckets[bucketKey].count++;
        buckets[bucketKey].events.push(log.action.type);
      }
    });
    
    return {
      buckets: Object.entries(buckets).map(([time, data]) => ({
        time,
        count: data.count,
        uniqueEvents: new Set(data.events).size
      }))
    };
  }
}
```

#### 3.2 分析報告生成
```typescript
class AuditReportGenerator {
  async generateComplianceReport(
    organizationId: string,
    period: ReportPeriod
  ): Promise<ComplianceReport> {
    const logs = await this.getRelevantLogs(organizationId, period);
    
    return {
      period,
      organization: await this.getOrganizationInfo(organizationId),
      summary: {
        totalEvents: logs.length,
        criticalEvents: logs.filter(l => l.metadata?.risk === 'critical').length,
        failedAuthentications: this.countFailedAuth(logs),
        dataExports: this.countDataExports(logs),
        permissionChanges: this.countPermissionChanges(logs),
        userModifications: this.countUserModifications(logs)
      },
      userActivity: this.analyzeUserActivity(logs),
      dataAccess: this.analyzeDataAccess(logs),
      securityEvents: this.analyzeSecurityEvents(logs),
      recommendations: this.generateRecommendations(logs),
      generatedAt: new Date(),
      signature: await this.generateReportSignature(logs)
    };
  }
  
  async generateSecurityReport(
    organizationId: string,
    period: ReportPeriod
  ): Promise<SecurityReport> {
    const logs = await this.getSecurityLogs(organizationId, period);
    
    return {
      threats: this.identifyThreats(logs),
      anomalies: await this.detectAnomalies(logs),
      accessPatterns: this.analyzeAccessPatterns(logs),
      riskAssessment: this.assessRisk(logs),
      incidents: this.identifyIncidents(logs),
      recommendations: this.generateSecurityRecommendations(logs)
    };
  }
  
  private async detectAnomalies(logs: AuditLog[]): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];
    
    // 偵測異常登入時間
    const loginsByUser = this.groupByUser(logs.filter(l => l.action.type === 'USER_LOGIN'));
    
    for (const [userId, userLogs] of Object.entries(loginsByUser)) {
      const loginTimes = userLogs.map(l => l.timestamp.toDate().getHours());
      const avgTime = loginTimes.reduce((a, b) => a + b, 0) / loginTimes.length;
      
      loginTimes.forEach((time, index) => {
        if (Math.abs(time - avgTime) > 6) { // 超過平均6小時
          anomalies.push({
            type: 'UNUSUAL_LOGIN_TIME',
            severity: 'medium',
            userId,
            timestamp: userLogs[index].timestamp,
            description: `異常登入時間: ${time}:00 (平均: ${avgTime.toFixed(0)}:00)`
          });
        }
      });
    }
    
    // 偵測大量資料匯出
    const exports = logs.filter(l => l.action.type === 'DATA_EXPORTED');
    const exportsByDay = this.groupByDay(exports);
    
    for (const [day, dayLogs] of Object.entries(exportsByDay)) {
      if (dayLogs.length > 10) { // 一天超過10次匯出
        anomalies.push({
          type: 'EXCESSIVE_DATA_EXPORT',
          severity: 'high',
          timestamp: dayLogs[0].timestamp,
          description: `${day} 有 ${dayLogs.length} 次資料匯出`
        });
      }
    }
    
    return anomalies;
  }
}
```

### 階段 4：UI 介面設計

#### 4.1 審計日誌檢視器
```
+----------------------------------------------------------+
| 📋 審計日誌                                   [匯出報告] |
+----------------------------------------------------------+
| 篩選條件：                                               |
| 時間範圍: [最近7天 ▼]  用戶: [全部 ▼]  風險: [全部 ▼]  |
| 動作類型: [全部 ▼]     狀態: [全部 ▼]  [套用] [重置]   |
+----------------------------------------------------------+
| 📊 統計摘要                                              |
| 總事件: 1,234 | 失敗率: 2.3% | 高風險: 5 | 活躍用戶: 45 |
+----------------------------------------------------------+
| 時間         用戶        動作          資源      狀態    |
| ────────────────────────────────────────────────────── |
| 10:32:15    張三        登入系統      -         ✅       |
|             IP: 192.168.1.100                           |
| 10:28:43    李四        匯出資料      客戶資料  ✅       |
|             匯出 500 筆記錄                              |
| 10:15:22    王五        變更權限      張三      ⚠️       |
|             角色: user → admin                          |
| 09:45:11    系統        自動備份      全部資料  ✅       |
|             備份大小: 1.2GB                              |
| 09:30:55    陳六        登入失敗      -         ❌       |
|             錯誤: 密碼錯誤 (第3次)                       |
+----------------------------------------------------------+
| [上一頁] 第 1/25 頁 [下一頁]                            |
+----------------------------------------------------------+
```

#### 4.2 即時監控儀表板
```
+----------------------------------------------------------+
| 🔍 即時監控                              [自動更新: ON]  |
+----------------------------------------------------------+
| ┌─────────────────────┬─────────────────────┐          |
| │ 🔴 即時事件流       │ 📈 活動趨勢         │          |
| │                     │                      │          |
| │ • 10:32 張三登入    │     ╱╲              │          |
| │ • 10:31 資料匯出    │    ╱  ╲             │          |
| │ • 10:30 權限變更    │   ╱    ╲___         │          |
| │ • 10:29 API 呼叫    │  ╱          ╲       │          |
| │ • 10:28 檔案上傳    │ ╱            ╲      │          |
| └─────────────────────┴─────────────────────┘          |
| ┌─────────────────────┬─────────────────────┐          |
| │ ⚠️ 風險警報         │ 👥 活躍用戶 TOP 5   │          |
| │                     │                      │          |
| │ • 異常登入時間      │ 1. 張三 (125 動作)  │          |
| │ • 大量資料匯出      │ 2. 李四 (98 動作)   │          |
| │ • 連續登入失敗      │ 3. 王五 (76 動作)   │          |
| │                     │ 4. 趙六 (65 動作)   │          |
| │                     │ 5. 錢七 (54 動作)   │          |
| └─────────────────────┴─────────────────────┘          |
+----------------------------------------------------------+
```

#### 4.3 合規報告介面
```
+----------------------------------------------------------+
| 📊 合規報告生成器                                        |
+----------------------------------------------------------+
| 報告類型: [合規性報告 ▼]                                |
| 時間範圍: [2024年1月 ▼] 至 [2024年1月 ▼]               |
| 包含項目:                                                |
| ☑️ 用戶活動摘要    ☑️ 資料存取記錄                      |
| ☑️ 權限變更追蹤    ☑️ 安全事件分析                      |
| ☑️ 系統配置變更    ☑️ 異常行為偵測                      |
|                                                          |
| 報告格式: ○ PDF  ● Excel  ○ CSV                        |
|                                                          |
| [預覽報告] [生成並下載] [排程定期生成]                    |
|                                                          |
| 📄 最近生成的報告：                                      |
| • 2024-01 合規報告.pdf (2024-02-01) [下載]              |
| • 2023-12 合規報告.pdf (2024-01-01) [下載]              |
| • 2023-11 合規報告.pdf (2023-12-01) [下載]              |
+----------------------------------------------------------+
```

### 階段 5：效能優化

#### 5.1 快取策略
```typescript
class AuditLogCache {
  private cache = new Map<string, CacheEntry>();
  private readonly TTL = 5 * 60 * 1000; // 5分鐘
  
  async get(key: string): Promise<any | null> {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    // 限制快取大小
    if (this.cache.size > 1000) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }
}
```

#### 5.2 查詢優化
```typescript
class QueryOptimizer {
  optimizeQuery(criteria: SearchCriteria): OptimizedQuery {
    // 選擇最佳索引
    const index = this.selectBestIndex(criteria);
    
    // 重新排序查詢條件
    const reorderedConditions = this.reorderConditions(criteria, index);
    
    // 分割大查詢
    if (this.shouldSplitQuery(criteria)) {
      return this.splitIntoSubqueries(criteria);
    }
    
    return {
      index,
      conditions: reorderedConditions,
      estimatedCost: this.estimateQueryCost(criteria)
    };
  }
}
```

## 實作步驟

### 第一天：基礎架構
1. 建立審計日誌資料模型
2. 實作日誌收集機制
3. 建立儲存結構

### 第二天：自動收集
1. 實作審計裝飾器
2. 整合現有服務
3. 建立寫入服務

### 第三天：查詢系統
1. 實作查詢服務
2. 建立索引系統
3. 實作快取機制

### 第四天：分析報告
1. 實作統計分析
2. 建立報告生成器
3. 實作異常偵測

### 第五天：UI 整合
1. 建立日誌檢視器
2. 實作即時監控
3. 整合報告介面

## 成功指標

1. **效能指標**
   - [ ] 日誌寫入 < 100ms
   - [ ] 查詢響應 < 500ms
   - [ ] 支援 > 1M 日誌記錄

2. **功能完整性**
   - [ ] 涵蓋所有關鍵操作
   - [ ] 自動收集無需手動
   - [ ] 報告生成自動化

3. **合規性**
   - [ ] 符合 GDPR 要求
   - [ ] 支援資料保留政策
   - [ ] 可匯出完整記錄

## 風險與緩解

1. **儲存成本**
   - 風險：大量日誌造成高儲存成本
   - 緩解：實作歸檔和壓縮策略

2. **查詢效能**
   - 風險：大量資料影響查詢速度
   - 緩解：優化索引和快取策略

3. **隱私合規**
   - 風險：日誌包含敏感資料
   - 緩解：實作資料遮罩和加密

## 相關 PRP

- PRP-03: SuperAdmin 組織管理中心
- PRP-84: 組織入職精靈
- PRP-85: 批量資料匯入

---

**優先級**: 高
**預估時間**: 5 天
**依賴項**: 現有認證和權限系統
**實作信心度**: 9/10