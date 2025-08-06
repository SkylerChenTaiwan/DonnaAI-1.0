/**
 * 統一權限常數定義
 * 這是所有權限相關的單一真實來源
 */

// 統一的 Super Admin emails
export const SUPER_ADMIN_EMAILS = [
  'admin@donnaai-app.com',
  'admin@donnaai.com',
  'skyler@donnaai.com'
];

// 權限層級
export enum Role {
  SUPER_ADMIN = 'super_admin',
  ORG_ADMIN = 'org_admin',
  TEAM_MANAGER = 'team_manager',
  TEAM_MEMBER = 'team_member'
}

// 舊版角色對應（向後相容）
export const LEGACY_ROLE_MAPPING: Record<string, Role> = {
  'system-admin': Role.SUPER_ADMIN,
  'super_admin': Role.SUPER_ADMIN,
  'admin': Role.ORG_ADMIN,
  'manager': Role.TEAM_MANAGER,
  'salesperson': Role.TEAM_MEMBER
};

// 平台權限（Super Admin 專用）
export const PLATFORM_PERMISSIONS = {
  MANAGE_ORGANIZATIONS: 'manage_organizations',
  MANAGE_ALL_USERS: 'manage_all_users',
  VIEW_ALL_ANALYTICS: 'view_all_analytics',
  MANAGE_BILLING: 'manage_billing',
  ACCESS_ADMIN_PANEL: 'access_admin_panel',
  PLATFORM_SETTINGS: 'platform_settings',
  MANAGE_SYSTEM: 'manage_system',
  DEBUG_MODE: 'debug_mode'
} as const;

// 組織權限（Org Admin 專用）
export const ORG_PERMISSIONS = {
  MANAGE_USERS: 'manage_users',
  MANAGE_TEAMS: 'manage_teams',
  VIEW_ANALYTICS: 'view_analytics',
  MANAGE_SETTINGS: 'manage_settings',
  EXPORT_DATA: 'export_data',
  MANAGE_CUSTOM_FIELDS: 'manage_custom_fields',
  MANAGE_INTEGRATIONS: 'manage_integrations',
  MANAGE_WORKFLOWS: 'manage_workflows'
} as const;

// 團隊權限（Team Manager 專用）
export const TEAM_PERMISSIONS = {
  MANAGE_TEAM_MEMBERS: 'manage_team_members',
  ASSIGN_TASKS: 'assign_tasks',
  VIEW_TEAM_ANALYTICS: 'view_team_analytics',
  MANAGE_TEAM_SETTINGS: 'manage_team_settings',
  APPROVE_RECORDS: 'approve_records',
  MANAGE_TEAM_GOALS: 'manage_team_goals'
} as const;

// 基本權限（所有用戶）
export const BASIC_PERMISSIONS = {
  VIEW_OWN_DATA: 'view_own_data',
  EDIT_OWN_PROFILE: 'edit_own_profile',
  CREATE_RECORDS: 'create_records',
  CREATE_TASKS: 'create_tasks',
  VIEW_TEAM_DATA: 'view_team_data',
  USE_AI_TOOLS: 'use_ai_tools'
} as const;

// 權限層級對應表
export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  [Role.SUPER_ADMIN]: [
    ...Object.values(PLATFORM_PERMISSIONS),
    ...Object.values(ORG_PERMISSIONS),
    ...Object.values(TEAM_PERMISSIONS),
    ...Object.values(BASIC_PERMISSIONS)
  ],
  [Role.ORG_ADMIN]: [
    ...Object.values(ORG_PERMISSIONS),
    ...Object.values(TEAM_PERMISSIONS),
    ...Object.values(BASIC_PERMISSIONS)
  ],
  [Role.TEAM_MANAGER]: [
    ...Object.values(TEAM_PERMISSIONS),
    ...Object.values(BASIC_PERMISSIONS)
  ],
  [Role.TEAM_MEMBER]: [
    ...Object.values(BASIC_PERMISSIONS)
  ]
};

// 權限繼承關係
export const PERMISSION_HIERARCHY: Record<Role, Role[]> = {
  [Role.SUPER_ADMIN]: [Role.ORG_ADMIN, Role.TEAM_MANAGER, Role.TEAM_MEMBER],
  [Role.ORG_ADMIN]: [Role.TEAM_MANAGER, Role.TEAM_MEMBER],
  [Role.TEAM_MANAGER]: [Role.TEAM_MEMBER],
  [Role.TEAM_MEMBER]: []
};

// 類型定義
export type PlatformPermission = typeof PLATFORM_PERMISSIONS[keyof typeof PLATFORM_PERMISSIONS];
export type OrgPermission = typeof ORG_PERMISSIONS[keyof typeof ORG_PERMISSIONS];
export type TeamPermission = typeof TEAM_PERMISSIONS[keyof typeof TEAM_PERMISSIONS];
export type BasicPermission = typeof BASIC_PERMISSIONS[keyof typeof BASIC_PERMISSIONS];
export type Permission = PlatformPermission | OrgPermission | TeamPermission | BasicPermission;

// 輔助函數：將舊角色轉換為新角色
export function normalizeRole(role: string | undefined): Role {
  if (!role) return Role.TEAM_MEMBER;
  
  // 檢查是否為新角色
  if (Object.values(Role).includes(role as Role)) {
    return role as Role;
  }
  
  // 轉換舊角色
  return LEGACY_ROLE_MAPPING[role] || Role.TEAM_MEMBER;
}

// 輔助函數：檢查是否為 Super Admin email
export function isSuperAdminEmail(email: string | undefined): boolean {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase());
}

// 輔助函數：獲取角色的所有權限
export function getRolePermissions(role: Role): string[] {
  return ROLE_PERMISSIONS[role] || [];
}

// 輔助函數：檢查角色是否包含特定權限
export function roleHasPermission(role: Role, permission: string): boolean {
  return getRolePermissions(role).includes(permission);
}

// 輔助函數：比較角色層級
export function isRoleHigherOrEqual(roleA: Role, roleB: Role): boolean {
  if (roleA === roleB) return true;
  const hierarchy = PERMISSION_HIERARCHY[roleA];
  return hierarchy ? hierarchy.includes(roleB) : false;
}

// 權限驗證錯誤訊息
export const PERMISSION_ERROR_MESSAGES = {
  INSUFFICIENT_PERMISSIONS: '權限不足，無法執行此操作',
  NOT_AUTHENTICATED: '請先登入',
  NOT_SUPER_ADMIN: '需要 Super Admin 權限',
  NOT_ORG_ADMIN: '需要組織管理員權限',
  NOT_TEAM_MANAGER: '需要團隊主管權限',
  PERMISSION_DENIED: '權限被拒絕',
  SESSION_EXPIRED: '登入已過期，請重新登入'
} as const;

// 權限變更審計類型
export const PERMISSION_AUDIT_ACTIONS = {
  GRANT: 'grant',
  REVOKE: 'revoke',
  REPAIR: 'repair',
  INITIALIZE: 'initialize',
  UPDATE: 'update'
} as const;

export type PermissionAuditAction = typeof PERMISSION_AUDIT_ACTIONS[keyof typeof PERMISSION_AUDIT_ACTIONS];