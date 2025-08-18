/**
 * 資料過濾服務
 * 根據使用者權限過濾和限制資料存取
 */

import { Session } from 'next-auth';
import { UserRole, DataAccessLevel, ROLE_DATA_ACCESS, PermissionChecker } from './permissions';

// 查詢條件介面
export interface FilterConditions {
  organizationId?: string | string[];
  departments?: string | string[];
  userId?: string | string[];
  assigneeId?: string | string[];
  createdBy?: string | string[];
  customFilters?: Record<string, any>;
}

// 資料範圍配置
export interface DataScopeConfig {
  enforceOrganization?: boolean;
  enforceDepartment?: boolean;
  enforceUser?: boolean;
  allowCrossOrganization?: boolean;
  allowCrossDepartment?: boolean;
}

/**
 * 資料過濾器類
 */
export class DataFilter {
  private user: Session['user'];
  private dataScope: ReturnType<typeof PermissionChecker.getDataAccessScope>;

  constructor(session: Session) {
    this.user = session.user;
    this.dataScope = PermissionChecker.getDataAccessScope(
      session.user.role as UserRole,
      session.user.organizationId,
      session.user.departments
    );
  }

  /**
   * 為 Firestore 查詢添加權限過濾條件
   */
  applyFirestoreFilters<T = any>(
    query: FirebaseFirestore.Query<T>,
    collection: string,
    config: DataScopeConfig = {}
  ): FirebaseFirestore.Query<T> {
    let filteredQuery = query;

    // 預設配置
    const {
      enforceOrganization = true,
      enforceDepartment = false,
      enforceUser = false,
      allowCrossOrganization = false,
      allowCrossDepartment = true,
    } = config;

    // 1. 組織層級過濾
    if (enforceOrganization && !this.dataScope.canViewAllData) {
      if (!allowCrossOrganization) {
        filteredQuery = filteredQuery.where('organizationId', '==', this.user.organizationId);
      } else if (this.dataScope.organizations.length > 0 && !this.dataScope.organizations.includes('*')) {
        filteredQuery = filteredQuery.where('organizationId', 'in', this.dataScope.organizations);
      }
    }

    // 2. 部門層級過濾
    if (enforceDepartment && !this.dataScope.canViewOrgData) {
      if (this.dataScope.canViewDeptData) {
        if (!allowCrossDepartment && this.user.departments.length === 1) {
          filteredQuery = filteredQuery.where('departmentId', '==', this.user.departments[0]);
        } else if (this.user.departments.length > 0) {
          // 限制最多 10 個部門（Firestore 'in' 查詢限制）
          const departments = this.user.departments.slice(0, 10);
          filteredQuery = filteredQuery.where('departmentId', 'in', departments);
        }
      }
    }

    // 3. 使用者層級過濾
    if (enforceUser && !this.dataScope.canViewDeptData) {
      // 根據不同集合使用不同的使用者欄位
      const userFields = this.getUserFieldsForCollection(collection);
      
      if (userFields.length === 1) {
        filteredQuery = filteredQuery.where(userFields[0], '==', this.user.uid);
      } else if (userFields.length > 1) {
        // 多個可能的使用者欄位，需要使用複合查詢或分別查詢
        // 這裡使用第一個欄位作為主要過濾條件
        filteredQuery = filteredQuery.where(userFields[0], '==', this.user.uid);
      }
    }

    return filteredQuery;
  }

  /**
   * 為自訂條件添加權限檢查
   */
  validateCustomConditions(conditions: FilterConditions): FilterConditions {
    const validatedConditions = { ...conditions };

    // 驗證組織 ID
    if (conditions.organizationId && !this.dataScope.canViewAllData) {
      const requestedOrgs = Array.isArray(conditions.organizationId) 
        ? conditions.organizationId 
        : [conditions.organizationId];

      // 檢查是否可以存取請求的組織
      const allowedOrgs = requestedOrgs.filter(orgId => 
        this.canAccessOrganization(orgId)
      );

      if (allowedOrgs.length === 0) {
        // 如果沒有允許的組織，強制使用使用者的組織
        validatedConditions.organizationId = this.user.organizationId;
      } else if (allowedOrgs.length === 1) {
        validatedConditions.organizationId = allowedOrgs[0];
      } else {
        validatedConditions.organizationId = allowedOrgs;
      }
    }

    // 驗證部門 ID
    if (conditions.departments && !this.dataScope.canViewOrgData) {
      const requestedDepts = Array.isArray(conditions.departments) 
        ? conditions.departments 
        : [conditions.departments];

      const allowedDepts = requestedDepts.filter(deptId => 
        this.canAccessDepartment(deptId)
      );

      if (allowedDepts.length > 0) {
        validatedConditions.departments = allowedDepts.length === 1 ? allowedDepts[0] : allowedDepts;
      } else {
        // 如果沒有允許的部門，使用使用者的部門
        validatedConditions.departments = this.user.departments.length === 1 
          ? this.user.departments[0] 
          : this.user.departments;
      }
    }

    // 驗證使用者 ID
    if (conditions.userId && !this.dataScope.canViewDeptData) {
      // 只能查看自己的資料
      validatedConditions.userId = this.user.uid;
    }

    // 驗證指派人 ID
    if (conditions.assigneeId && !this.dataScope.canViewDeptData) {
      // 只能查看指派給自己的項目
      validatedConditions.assigneeId = this.user.uid;
    }

    // 驗證建立者 ID
    if (conditions.createdBy && !this.dataScope.canViewDeptData) {
      // 只能查看自己建立的項目
      validatedConditions.createdBy = this.user.uid;
    }

    return validatedConditions;
  }

  /**
   * 過濾陣列資料
   */
  filterArrayData<T extends Record<string, any>>(
    data: T[],
    collection: string,
    config: DataScopeConfig = {}
  ): T[] {
    return data.filter(item => this.canAccessDataItem(item, collection, config));
  }

  /**
   * 檢查是否可以存取單筆資料
   */
  canAccessDataItem<T extends Record<string, any>>(
    item: T,
    collection: string,
    config: DataScopeConfig = {}
  ): boolean {
    const {
      enforceOrganization = true,
      enforceDepartment = false,
      enforceUser = false,
    } = config;

    // 超級管理員可以存取所有資料
    if (this.dataScope.canViewAllData) {
      return true;
    }

    // 檢查組織權限
    if (enforceOrganization && item.organizationId) {
      if (!this.canAccessOrganization(item.organizationId)) {
        return false;
      }
    }

    // 檢查部門權限
    if (enforceDepartment && item.departmentId) {
      if (!this.canAccessDepartment(item.departmentId)) {
        return false;
      }
    }

    // 檢查使用者權限
    if (enforceUser) {
      const userFields = this.getUserFieldsForCollection(collection);
      const hasUserAccess = userFields.some(field => {
        const fieldValue = item[field];
        return fieldValue === this.user.uid || 
               (Array.isArray(fieldValue) && fieldValue.includes(this.user.uid));
      });

      if (!hasUserAccess) {
        return false;
      }
    }

    return true;
  }

  /**
   * 建立資料範圍查詢條件
   */
  buildScopeQuery(collection: string): Record<string, any> {
    const query: Record<string, any> = {};

    if (!this.dataScope.canViewAllData) {
      // 組織限制
      if (!this.dataScope.canViewAllData) {
        query.organizationId = this.user.organizationId;
      }

      // 部門限制
      if (!this.dataScope.canViewOrgData && this.dataScope.canViewDeptData) {
        query.departmentId = { $in: this.user.departments };
      }

      // 使用者限制
      if (!this.dataScope.canViewDeptData) {
        const userFields = this.getUserFieldsForCollection(collection);
        if (userFields.length > 0) {
          // 使用 $or 查詢支援多個使用者欄位
          query.$or = userFields.map(field => ({
            [field]: this.user.uid
          }));
        }
      }
    }

    return query;
  }

  /**
   * 檢查是否可以存取指定組織
   */
  private canAccessOrganization(organizationId: string): boolean {
    if (this.dataScope.canViewAllData) {
      return true;
    }

    return this.dataScope.organizations.includes('*') || 
           this.dataScope.organizations.includes(organizationId);
  }

  /**
   * 檢查是否可以存取指定部門
   */
  private canAccessDepartment(departmentId: string): boolean {
    if (this.dataScope.canViewAllData || this.dataScope.canViewOrgData) {
      return true;
    }

    return this.dataScope.departments.includes('*') || 
           this.dataScope.departments.includes(departmentId);
  }

  /**
   * 根據集合名稱獲取相關的使用者欄位
   */
  private getUserFieldsForCollection(collection: string): string[] {
    const userFieldsMap: Record<string, string[]> = {
      customers: ['createdBy', 'assigneeId', 'ownerId'],
      tasks: ['assigneeId', 'createdBy', 'participants'],
      records: ['createdBy', 'participants', 'assigneeId'],
      meetings: ['organizer', 'participants', 'createdBy'],
      reports: ['createdBy', 'sharedWith', 'assigneeId'],
      projects: ['ownerId', 'members', 'createdBy'],
      'team-status': ['userId'],
      'ai-query-history': ['userId'],
      'user-performance': ['userId'],
    };

    return userFieldsMap[collection] || ['createdBy', 'userId'];
  }

  /**
   * 獲取使用者的資料統計權限
   */
  getMetricsAccessLevel(): {
    canViewGlobal: boolean;
    canViewOrganization: boolean;
    canViewDepartment: boolean;
    canViewPersonal: boolean;
    scopeDescription: string;
  } {
    return {
      canViewGlobal: this.dataScope.canViewAllData,
      canViewOrganization: this.dataScope.canViewOrgData,
      canViewDepartment: this.dataScope.canViewDeptData,
      canViewPersonal: this.dataScope.canViewOwnData,
      scopeDescription: this.getScopeDescription()
    };
  }

  /**
   * 獲取資料範圍描述
   */
  private getScopeDescription(): string {
    if (this.dataScope.canViewAllData) {
      return '全系統資料存取';
    } else if (this.dataScope.canViewOrgData) {
      return '組織資料存取';
    } else if (this.dataScope.canViewDeptData) {
      return '部門資料存取';
    } else if (this.dataScope.canViewOwnData) {
      return '個人資料存取';
    } else {
      return '無資料存取權限';
    }
  }
}

/**
 * 建立資料過濾器
 */
export function createDataFilter(session: Session): DataFilter {
  return new DataFilter(session);
}

/**
 * 中介軟體輔助函數：檢查 API 路由權限
 */
export function checkApiAccess(
  session: Session,
  resource: string,
  action: 'read' | 'write' | 'delete' | 'admin'
): {
  hasAccess: boolean;
  filter: DataFilter;
  reason?: string;
} {
  if (!session?.user) {
    return {
      hasAccess: false,
      filter: null as any,
      reason: '使用者未登入'
    };
  }

  if (session.user.disabled) {
    return {
      hasAccess: false,
      filter: null as any,
      reason: '使用者帳戶已停用'
    };
  }

  const filter = createDataFilter(session);
  const accessLevel = filter.getMetricsAccessLevel();

  // 根據資源和動作檢查權限
  const resourcePermissions = {
    dashboard: {
      read: accessLevel.canViewPersonal,
      write: false,
      delete: false,
      admin: accessLevel.canViewOrganization
    },
    metrics: {
      read: accessLevel.canViewPersonal,
      write: false,
      delete: false,
      admin: accessLevel.canViewOrganization
    },
    reports: {
      read: accessLevel.canViewPersonal,
      write: accessLevel.canViewPersonal,
      delete: accessLevel.canViewDepartment,
      admin: accessLevel.canViewOrganization
    },
    users: {
      read: accessLevel.canViewDepartment,
      write: accessLevel.canViewDepartment,
      delete: accessLevel.canViewOrganization,
      admin: accessLevel.canViewOrganization
    }
  };

  const permission = resourcePermissions[resource as keyof typeof resourcePermissions];
  const hasAccess = permission ? permission[action] : false;

  return {
    hasAccess,
    filter,
    reason: hasAccess ? undefined : `權限不足：無法${action}${resource}資源`
  };
}