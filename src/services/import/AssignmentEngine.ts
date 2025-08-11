/**
 * 資料分配引擎
 * 處理各種分配策略的核心邏輯
 */

import { 
  ImportAssignmentConfig, 
  AssignmentResult, 
  AssignmentPreview,
  AssignmentPreviewItem,
  AssignmentValidation,
  DepartmentAssignmentRule
} from '@/types/assignment';
import { DatabaseType } from '@/types/import';
import { User } from '@/types/user';
import { UserMatcher } from './UserMatcher';
import { getFirebaseDb } from '@/config/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

export class AssignmentEngine {
  private userMatcher: UserMatcher;
  private organizationUsers: Map<string, User> = new Map();
  
  constructor(private organizationId: string) {
    this.userMatcher = new UserMatcher(organizationId);
  }

  /**
   * 初始化引擎，載入組織用戶
   */
  async initialize(): Promise<void> {
    await this.loadOrganizationUsers();
    await this.userMatcher.initialize();
  }

  /**
   * 載入組織內所有用戶
   */
  private async loadOrganizationUsers(): Promise<void> {
    const db = getFirebaseDb();
    const usersQuery = query(
      collection(db, 'users'),
      where('organizationId', '==', this.organizationId),
      where('isActive', '==', true)
    );
    
    const snapshot = await getDocs(usersQuery);
    snapshot.forEach(doc => {
      const user = { id: doc.id, ...doc.data() } as User;
      this.organizationUsers.set(doc.id, user);
    });
  }

  /**
   * 處理資料分配
   */
  async processAssignments(
    data: any[],
    config: ImportAssignmentConfig
  ): Promise<AssignmentResult[]> {
    switch (config.strategy) {
      case 'single_user':
        return this.assignToSingleUser(data, config.assigneeId!);
      
      case 'round_robin':
        return this.assignRoundRobin(data, config.assigneeIds || []);
      
      case 'csv_column':
        return await this.assignFromCSV(data, config);
      
      case 'department_rule':
        return this.assignByDepartmentRules(data, config.departmentRules || []);
      
      case 'manual_mapping':
        return this.assignByManualMapping(data, config.assigneeMapping || new Map());
      
      default:
        throw new Error(`不支援的分配策略: ${config.strategy}`);
    }
  }

  /**
   * 單一用戶分配
   */
  private assignToSingleUser(data: any[], assigneeId: string): AssignmentResult[] {
    const user = this.organizationUsers.get(assigneeId);
    if (!user) {
      throw new Error(`找不到用戶 ID: ${assigneeId}`);
    }

    return data.map(() => ({
      assigneeId,
      assigneeName: user.name || user.email,
      teamId: user.teamId,
      department: user.department,
      matchConfidence: 100,
      matchedBy: 'csvColumn' as const
    }));
  }

  /**
   * 輪流分配
   */
  private assignRoundRobin(data: any[], assigneeIds: string[]): AssignmentResult[] {
    if (assigneeIds.length === 0) {
      throw new Error('輪流分配需要至少一個用戶');
    }

    const results: AssignmentResult[] = [];
    let currentIndex = 0;

    for (let i = 0; i < data.length; i++) {
      const assigneeId = assigneeIds[currentIndex];
      const user = this.organizationUsers.get(assigneeId);
      
      if (user) {
        results.push({
          assigneeId,
          assigneeName: user.name || user.email,
          teamId: user.teamId,
          department: user.department,
          matchConfidence: 100,
          matchedBy: 'rule' as const
        });
      } else {
        results.push({
          assigneeId: '',
          matchConfidence: 0,
          matchedBy: 'default' as const
        });
      }
      
      currentIndex = (currentIndex + 1) % assigneeIds.length;
    }

    return results;
  }

  /**
   * 從 CSV 欄位分配
   */
  private async assignFromCSV(
    data: any[],
    config: ImportAssignmentConfig
  ): Promise<AssignmentResult[]> {
    if (!config.csvColumn) {
      throw new Error('CSV 欄位分配需要指定欄位名稱');
    }

    const results: AssignmentResult[] = [];
    
    for (const row of data) {
      const assigneeValue = row[config.csvColumn];
      
      if (!assigneeValue) {
        // 使用預設分配
        if (config.defaultAssignee) {
          const defaultUser = this.organizationUsers.get(config.defaultAssignee);
          results.push({
            assigneeId: config.defaultAssignee,
            assigneeName: defaultUser?.name || defaultUser?.email,
            teamId: defaultUser?.teamId,
            department: defaultUser?.department,
            matchConfidence: 50,
            matchedBy: 'default' as const
          });
        } else {
          results.push({
            assigneeId: '',
            matchConfidence: 0,
            matchedBy: 'default' as const
          });
        }
        continue;
      }

      // 嘗試匹配用戶
      const matchResult = await this.userMatcher.matchUser(
        assigneeValue.toString(),
        config.matchingStrategy || 'smart'
      );

      if (matchResult) {
        const user = this.organizationUsers.get(matchResult.userId);
        results.push({
          assigneeId: matchResult.userId,
          assigneeName: user?.name || user?.email,
          teamId: user?.teamId,
          department: user?.department,
          matchConfidence: matchResult.confidence,
          matchedBy: matchResult.matchField as any
        });
      } else if (config.defaultAssignee) {
        const defaultUser = this.organizationUsers.get(config.defaultAssignee);
        results.push({
          assigneeId: config.defaultAssignee,
          assigneeName: defaultUser?.name || defaultUser?.email,
          teamId: defaultUser?.teamId,
          department: defaultUser?.department,
          matchConfidence: 30,
          matchedBy: 'default' as const
        });
      } else {
        results.push({
          assigneeId: '',
          matchConfidence: 0,
          matchedBy: 'default' as const
        });
      }
    }

    return results;
  }

  /**
   * 按部門規則分配
   */
  private assignByDepartmentRules(
    data: any[],
    rules: DepartmentAssignmentRule[]
  ): AssignmentResult[] {
    const sortedRules = [...rules].sort((a, b) => a.priority - b.priority);
    const results: AssignmentResult[] = [];

    for (const row of data) {
      let assigned = false;

      for (const rule of sortedRules) {
        if (this.matchesRule(row, rule)) {
          const user = this.organizationUsers.get(rule.assigneeId);
          results.push({
            assigneeId: rule.assigneeId,
            assigneeName: user?.name || user?.email,
            teamId: user?.teamId,
            department: rule.departmentName,
            matchConfidence: 90,
            matchedBy: 'rule' as const
          });
          assigned = true;
          break;
        }
      }

      if (!assigned) {
        results.push({
          assigneeId: '',
          matchConfidence: 0,
          matchedBy: 'default' as const
        });
      }
    }

    return results;
  }

  /**
   * 檢查資料是否符合規則
   */
  private matchesRule(row: any, rule: DepartmentAssignmentRule): boolean {
    if (!rule.conditions || rule.conditions.length === 0) {
      return true;
    }

    return rule.conditions.every(condition => {
      const value = row[condition.fieldName];
      if (!value) return false;

      const stringValue = value.toString().toLowerCase();
      const conditionValue = condition.value.toLowerCase();

      switch (condition.operator) {
        case 'equals':
          return stringValue === conditionValue;
        case 'contains':
          return stringValue.includes(conditionValue);
        case 'startsWith':
          return stringValue.startsWith(conditionValue);
        case 'endsWith':
          return stringValue.endsWith(conditionValue);
        default:
          return false;
      }
    });
  }

  /**
   * 手動映射分配
   */
  private assignByManualMapping(
    data: any[],
    mapping: Map<string, string>
  ): AssignmentResult[] {
    return data.map((row, index) => {
      const assigneeId = mapping.get(index.toString()) || '';
      const user = assigneeId ? this.organizationUsers.get(assigneeId) : null;

      if (user) {
        return {
          assigneeId,
          assigneeName: user.name || user.email,
          teamId: user.teamId,
          department: user.department,
          matchConfidence: 100,
          matchedBy: 'csvColumn' as const
        };
      }

      return {
        assigneeId: '',
        matchConfidence: 0,
        matchedBy: 'default' as const
      };
    });
  }

  /**
   * 生成分配預覽
   */
  async generatePreview(
    data: any[],
    config: ImportAssignmentConfig
  ): Promise<AssignmentPreview[]> {
    const assignments = await this.processAssignments(data, config);
    const userAssignments = new Map<string, AssignmentPreviewItem[]>();

    // 分組統計
    assignments.forEach((assignment, index) => {
      if (assignment.assigneeId) {
        if (!userAssignments.has(assignment.assigneeId)) {
          userAssignments.set(assignment.assigneeId, []);
        }
        
        userAssignments.get(assignment.assigneeId)!.push({
          rowIndex: index,
          rowData: data[index],
          assignedTo: assignment.assigneeId,
          assigneeName: assignment.assigneeName,
          matchConfidence: assignment.matchConfidence,
          matchReason: this.getMatchReason(assignment.matchedBy!)
        });
      }
    });

    // 生成預覽
    const previews: AssignmentPreview[] = [];
    const totalRows = data.length;

    for (const [userId, items] of userAssignments) {
      const user = this.organizationUsers.get(userId);
      if (user) {
        previews.push({
          userId,
          userName: user.name || user.email,
          userEmail: user.email,
          department: user.department,
          assignedCount: items.length,
          assignedItems: items.slice(0, 5), // 只顯示前 5 筆預覽
          workloadPercentage: (items.length / totalRows) * 100
        });
      }
    }

    return previews.sort((a, b) => b.assignedCount - a.assignedCount);
  }

  /**
   * 獲取匹配原因說明
   */
  private getMatchReason(matchedBy: string): string {
    const reasons: Record<string, string> = {
      email: '透過 Email 匹配',
      name: '透過姓名匹配',
      employeeId: '透過員工編號匹配',
      csvColumn: '透過 CSV 欄位指定',
      rule: '透過部門規則分配',
      default: '預設分配'
    };
    return reasons[matchedBy] || '未知';
  }

  /**
   * 驗證分配配置
   */
  async validateAssignment(
    data: any[],
    config: ImportAssignmentConfig
  ): Promise<AssignmentValidation> {
    const errors: AssignmentValidation['errors'] = [];
    const warnings: AssignmentValidation['warnings'] = [];
    const userDistribution = new Map<string, number>();
    
    try {
      const assignments = await this.processAssignments(data, config);
      
      let assignableRows = 0;
      let totalConfidence = 0;
      
      assignments.forEach((assignment, index) => {
        if (assignment.assigneeId) {
          assignableRows++;
          totalConfidence += assignment.matchConfidence || 0;
          
          const count = userDistribution.get(assignment.assigneeId) || 0;
          userDistribution.set(assignment.assigneeId, count + 1);
        }
        
        // 檢查低信心度匹配
        if (assignment.matchConfidence && assignment.matchConfidence < 50) {
          warnings.push({
            type: 'low_confidence',
            message: `第 ${index + 1} 列的匹配信心度較低 (${assignment.matchConfidence}%)`,
            affectedRows: [index]
          });
        }
      });

      // 檢查分配平衡性
      if (userDistribution.size > 1) {
        const counts = Array.from(userDistribution.values());
        const max = Math.max(...counts);
        const min = Math.min(...counts);
        
        if (max - min > data.length * 0.3) {
          warnings.push({
            type: 'unbalanced',
            message: '資料分配不平衡，某些用戶獲得的資料量差異過大'
          });
        }
      }

      // 檢查未分配的資料
      const unassignedRows = data.length - assignableRows;
      if (unassignedRows > 0) {
        warnings.push({
          type: 'no_match',
          message: `有 ${unassignedRows} 筆資料無法分配`
        });
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        statistics: {
          totalRows: data.length,
          assignableRows,
          unassignedRows,
          averageConfidence: assignableRows > 0 ? totalConfidence / assignableRows : 0,
          userDistribution
        }
      };
    } catch (error: any) {
      errors.push({
        type: 'invalid_config',
        message: error.message,
        details: error
      });
      
      return {
        isValid: false,
        errors,
        warnings,
        statistics: {
          totalRows: data.length,
          assignableRows: 0,
          unassignedRows: data.length,
          averageConfidence: 0,
          userDistribution
        }
      };
    }
  }

  /**
   * 批次處理分配（用於大量資料）
   */
  async *processBatch(
    data: any[],
    config: ImportAssignmentConfig,
    batchSize: number = 100
  ): AsyncGenerator<AssignmentResult[], void, unknown> {
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const results = await this.processAssignments(batch, config);
      yield results;
    }
  }
}