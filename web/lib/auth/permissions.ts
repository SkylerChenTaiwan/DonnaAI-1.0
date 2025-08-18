/**
 * 權限管理系統
 * 定義角色、權限和資料存取控制
 */

// 系統角色定義
export enum UserRole {
  SUPER_ADMIN = 'super_admin',      // 超級管理員
  ORG_ADMIN = 'org_admin',          // 組織管理員
  DEPT_MANAGER = 'dept_manager',    // 部門經理
  TEAM_LEAD = 'team_lead',          // 團隊主管
  USER = 'user',                    // 一般使用者
  VIEWER = 'viewer',                // 唯讀使用者
  GUEST = 'guest'                   // 訪客
}

// 權限類型定義
export enum Permission {
  // 系統管理權限
  SYSTEM_ADMIN = 'system:admin',
  SYSTEM_CONFIG = 'system:config',
  SYSTEM_MONITOR = 'system:monitor',
  
  // 組織管理權限
  ORG_MANAGE = 'org:manage',
  ORG_VIEW = 'org:view',
  ORG_SETTINGS = 'org:settings',
  ORG_USERS = 'org:users',
  
  // 部門管理權限
  DEPT_MANAGE = 'dept:manage',
  DEPT_VIEW = 'dept:view',
  DEPT_USERS = 'dept:users',
  
  // 使用者管理權限
  USER_MANAGE = 'user:manage',
  USER_VIEW = 'user:view',
  USER_INVITE = 'user:invite',
  USER_ROLES = 'user:roles',
  
  // 儀表板權限
  DASHBOARD_VIEW = 'dashboard:view',
  DASHBOARD_ADMIN = 'dashboard:admin',
  DASHBOARD_EXPORT = 'dashboard:export',
  DASHBOARD_SHARE = 'dashboard:share',
  
  // 資料權限
  DATA_VIEW_ALL = 'data:view:all',
  DATA_VIEW_ORG = 'data:view:org',
  DATA_VIEW_DEPT = 'data:view:dept',
  DATA_VIEW_TEAM = 'data:view:team',
  DATA_VIEW_OWN = 'data:view:own',
  DATA_EXPORT = 'data:export',
  DATA_IMPORT = 'data:import',
  
  // 報告權限
  REPORT_VIEW = 'report:view',
  REPORT_CREATE = 'report:create',
  REPORT_EDIT = 'report:edit',
  REPORT_DELETE = 'report:delete',
  REPORT_SHARE = 'report:share',
  
  // AI 功能權限
  AI_QUERY = 'ai:query',
  AI_ANALYTICS = 'ai:analytics',
  AI_ADMIN = 'ai:admin',
  
  // 客戶資料權限
  CUSTOMER_VIEW = 'customer:view',
  CUSTOMER_EDIT = 'customer:edit',
  CUSTOMER_DELETE = 'customer:delete',
  CUSTOMER_EXPORT = 'customer:export',
  
  // 任務權限
  TASK_VIEW = 'task:view',
  TASK_CREATE = 'task:create',
  TASK_EDIT = 'task:edit',
  TASK_DELETE = 'task:delete',
  TASK_ASSIGN = 'task:assign',
  
  // 會議權限
  MEETING_VIEW = 'meeting:view',
  MEETING_CREATE = 'meeting:create',
  MEETING_EDIT = 'meeting:edit',
  MEETING_DELETE = 'meeting:delete',
  
  // 設定權限
  SETTINGS_VIEW = 'settings:view',
  SETTINGS_EDIT = 'settings:edit',
}

// 資料存取層級
export enum DataAccessLevel {
  NONE = 'none',           // 無存取權限
  OWN = 'own',            // 只能存取自己的資料
  TEAM = 'team',          // 可存取團隊資料
  DEPARTMENT = 'dept',    // 可存取部門資料
  ORGANIZATION = 'org',   // 可存取組織資料
  ALL = 'all'             // 可存取所有資料
}

// 預設角色權限對應
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: [
    // 擁有所有權限
    ...Object.values(Permission)
  ],
  
  [UserRole.ORG_ADMIN]: [
    Permission.ORG_MANAGE,
    Permission.ORG_VIEW,
    Permission.ORG_SETTINGS,
    Permission.ORG_USERS,
    Permission.DEPT_MANAGE,
    Permission.DEPT_VIEW,
    Permission.DEPT_USERS,
    Permission.USER_MANAGE,
    Permission.USER_VIEW,
    Permission.USER_INVITE,
    Permission.USER_ROLES,
    Permission.DASHBOARD_VIEW,
    Permission.DASHBOARD_ADMIN,
    Permission.DASHBOARD_EXPORT,
    Permission.DASHBOARD_SHARE,
    Permission.DATA_VIEW_ORG,
    Permission.DATA_EXPORT,
    Permission.DATA_IMPORT,
    Permission.REPORT_VIEW,
    Permission.REPORT_CREATE,
    Permission.REPORT_EDIT,
    Permission.REPORT_DELETE,
    Permission.REPORT_SHARE,
    Permission.AI_QUERY,
    Permission.AI_ANALYTICS,
    Permission.CUSTOMER_VIEW,
    Permission.CUSTOMER_EDIT,
    Permission.CUSTOMER_DELETE,
    Permission.CUSTOMER_EXPORT,
    Permission.TASK_VIEW,
    Permission.TASK_CREATE,
    Permission.TASK_EDIT,
    Permission.TASK_DELETE,
    Permission.TASK_ASSIGN,
    Permission.MEETING_VIEW,
    Permission.MEETING_CREATE,
    Permission.MEETING_EDIT,
    Permission.MEETING_DELETE,
    Permission.SETTINGS_VIEW,
    Permission.SETTINGS_EDIT,
  ],
  
  [UserRole.DEPT_MANAGER]: [
    Permission.DEPT_VIEW,
    Permission.DEPT_USERS,
    Permission.USER_VIEW,
    Permission.USER_INVITE,
    Permission.DASHBOARD_VIEW,
    Permission.DASHBOARD_EXPORT,
    Permission.DATA_VIEW_DEPT,
    Permission.DATA_EXPORT,
    Permission.REPORT_VIEW,
    Permission.REPORT_CREATE,
    Permission.REPORT_EDIT,
    Permission.REPORT_SHARE,
    Permission.AI_QUERY,
    Permission.AI_ANALYTICS,
    Permission.CUSTOMER_VIEW,
    Permission.CUSTOMER_EDIT,
    Permission.CUSTOMER_EXPORT,
    Permission.TASK_VIEW,
    Permission.TASK_CREATE,
    Permission.TASK_EDIT,
    Permission.TASK_ASSIGN,
    Permission.MEETING_VIEW,
    Permission.MEETING_CREATE,
    Permission.MEETING_EDIT,
    Permission.SETTINGS_VIEW,
  ],
  
  [UserRole.TEAM_LEAD]: [
    Permission.USER_VIEW,
    Permission.DASHBOARD_VIEW,
    Permission.DATA_VIEW_TEAM,
    Permission.DATA_EXPORT,
    Permission.REPORT_VIEW,
    Permission.REPORT_CREATE,
    Permission.REPORT_EDIT,
    Permission.AI_QUERY,
    Permission.CUSTOMER_VIEW,
    Permission.CUSTOMER_EDIT,
    Permission.TASK_VIEW,
    Permission.TASK_CREATE,
    Permission.TASK_EDIT,
    Permission.TASK_ASSIGN,
    Permission.MEETING_VIEW,
    Permission.MEETING_CREATE,
    Permission.MEETING_EDIT,
    Permission.SETTINGS_VIEW,
  ],
  
  [UserRole.USER]: [
    Permission.DASHBOARD_VIEW,
    Permission.DATA_VIEW_OWN,
    Permission.REPORT_VIEW,
    Permission.AI_QUERY,
    Permission.CUSTOMER_VIEW,
    Permission.TASK_VIEW,
    Permission.TASK_CREATE,
    Permission.TASK_EDIT,
    Permission.MEETING_VIEW,
    Permission.MEETING_CREATE,
    Permission.SETTINGS_VIEW,
  ],
  
  [UserRole.VIEWER]: [
    Permission.DASHBOARD_VIEW,
    Permission.DATA_VIEW_OWN,
    Permission.REPORT_VIEW,
    Permission.CUSTOMER_VIEW,
    Permission.TASK_VIEW,
    Permission.MEETING_VIEW,
  ],
  
  [UserRole.GUEST]: [
    Permission.DASHBOARD_VIEW,
    Permission.REPORT_VIEW,
  ]
};

// 資料存取層級對應
export const ROLE_DATA_ACCESS: Record<UserRole, DataAccessLevel> = {
  [UserRole.SUPER_ADMIN]: DataAccessLevel.ALL,
  [UserRole.ORG_ADMIN]: DataAccessLevel.ORGANIZATION,
  [UserRole.DEPT_MANAGER]: DataAccessLevel.DEPARTMENT,
  [UserRole.TEAM_LEAD]: DataAccessLevel.TEAM,
  [UserRole.USER]: DataAccessLevel.OWN,
  [UserRole.VIEWER]: DataAccessLevel.OWN,
  [UserRole.GUEST]: DataAccessLevel.NONE
};

/**
 * 權限檢查工具類
 */
export class PermissionChecker {
  /**
   * 檢查使用者是否擁有指定權限
   */
  static hasPermission(userPermissions: string[], requiredPermission: Permission): boolean {
    return userPermissions.includes(requiredPermission);
  }

  /**
   * 檢查使用者是否擁有任一權限
   */
  static hasAnyPermission(userPermissions: string[], requiredPermissions: Permission[]): boolean {
    return requiredPermissions.some(permission => userPermissions.includes(permission));
  }

  /**
   * 檢查使用者是否擁有所有權限
   */
  static hasAllPermissions(userPermissions: string[], requiredPermissions: Permission[]): boolean {
    return requiredPermissions.every(permission => userPermissions.includes(permission));
  }

  /**
   * 檢查角色是否可以存取指定的資料層級
   */
  static canAccessDataLevel(userRole: UserRole, requiredLevel: DataAccessLevel): boolean {
    const userLevel = ROLE_DATA_ACCESS[userRole];
    const levelHierarchy = [
      DataAccessLevel.NONE,
      DataAccessLevel.OWN,
      DataAccessLevel.TEAM,
      DataAccessLevel.DEPARTMENT,
      DataAccessLevel.ORGANIZATION,
      DataAccessLevel.ALL
    ];

    const userLevelIndex = levelHierarchy.indexOf(userLevel);
    const requiredLevelIndex = levelHierarchy.indexOf(requiredLevel);

    return userLevelIndex >= requiredLevelIndex;
  }

  /**
   * 獲取使用者的資料存取範圍
   */
  static getDataAccessScope(userRole: UserRole, organizationId: string, departments: string[]) {
    const accessLevel = ROLE_DATA_ACCESS[userRole];

    switch (accessLevel) {
      case DataAccessLevel.ALL:
        return {
          canViewAllData: true,
          canViewOrgData: true,
          canViewDeptData: true,
          canViewOwnData: true,
          organizations: ['*'],
          departments: ['*']
        };

      case DataAccessLevel.ORGANIZATION:
        return {
          canViewAllData: false,
          canViewOrgData: true,
          canViewDeptData: true,
          canViewOwnData: true,
          organizations: [organizationId],
          departments: ['*']
        };

      case DataAccessLevel.DEPARTMENT:
        return {
          canViewAllData: false,
          canViewOrgData: false,
          canViewDeptData: true,
          canViewOwnData: true,
          organizations: [organizationId],
          departments
        };

      case DataAccessLevel.TEAM:
      case DataAccessLevel.OWN:
        return {
          canViewAllData: false,
          canViewOrgData: false,
          canViewDeptData: false,
          canViewOwnData: true,
          organizations: [organizationId],
          departments
        };

      default:
        return {
          canViewAllData: false,
          canViewOrgData: false,
          canViewDeptData: false,
          canViewOwnData: false,
          organizations: [],
          departments: []
        };
    }
  }

  /**
   * 檢查使用者是否可以存取指定組織的資料
   */
  static canAccessOrganization(
    userRole: UserRole,
    userOrgId: string,
    targetOrgId: string
  ): boolean {
    if (userRole === UserRole.SUPER_ADMIN) {
      return true;
    }
    
    return userOrgId === targetOrgId;
  }

  /**
   * 檢查使用者是否可以存取指定部門的資料
   */
  static canAccessDepartment(
    userRole: UserRole,
    userDepartments: string[],
    targetDepartment: string
  ): boolean {
    const accessLevel = ROLE_DATA_ACCESS[userRole];

    if (accessLevel === DataAccessLevel.ALL || 
        accessLevel === DataAccessLevel.ORGANIZATION) {
      return true;
    }

    if (accessLevel === DataAccessLevel.DEPARTMENT) {
      return userDepartments.includes(targetDepartment);
    }

    return false;
  }
}

/**
 * 權限裝飾器工廠
 */
export function requirePermission(permission: Permission) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      // 這裡可以加入權限檢查邏輯
      // 實際實作會在中介軟體中處理
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * 角色檢查裝飾器工廠
 */
export function requireRole(roles: UserRole[]) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      // 這裡可以加入角色檢查邏輯
      // 實際實作會在中介軟體中處理
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}