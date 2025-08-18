/**
 * 角色管理 API
 * GET /api/auth/roles - 獲取角色列表
 * POST /api/auth/roles - 設定使用者角色
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/auth-middleware';
import { Permission, UserRole, ROLE_PERMISSIONS } from '@/lib/auth/permissions';
import { AuthService } from '@/services/firebase/auth.service';

/**
 * 獲取角色和權限資訊
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await withAuth(request, {
      requireAuth: true,
      requiredPermissions: [Permission.USER_ROLES],
      resource: 'users',
      action: 'admin'
    });

    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.error!.status }
      );
    }

    const { session } = authResult;
    const startTime = Date.now();

    // 獲取所有角色和權限資訊
    const rolesInfo = Object.values(UserRole).map(role => ({
      role,
      permissions: ROLE_PERMISSIONS[role],
      description: getRoleDescription(role),
      level: getRoleLevel(role)
    }));

    // 獲取所有權限類別
    const permissionCategories = getPermissionCategories();

    const response = {
      success: true,
      data: {
        roles: rolesInfo,
        permissions: permissionCategories,
        currentUserRole: session.user.role,
        canManageRoles: session.user.permissions.includes(Permission.USER_ROLES)
      },
      metadata: {
        requestId: crypto.randomUUID(),
        timestamp: new Date(),
        processingTime: Date.now() - startTime,
        version: '1.0.0'
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Roles API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '獲取角色資訊失敗',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }
      },
      { status: 500 }
    );
  }
}

/**
 * 設定使用者角色和權限
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await withAuth(request, {
      requireAuth: true,
      requiredPermissions: [Permission.USER_ROLES],
      resource: 'users',
      action: 'admin'
    });

    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.error!.status }
      );
    }

    const { session } = authResult;
    const body = await request.json();
    
    const {
      userId,
      role,
      permissions = [],
      organizationId,
      departments = []
    } = body;

    // 驗證必要參數
    if (!userId || !role) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_PARAMS', message: '缺少必要參數' } },
        { status: 400 }
      );
    }

    // 檢查角色有效性
    if (!Object.values(UserRole).includes(role)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ROLE', message: '無效的角色' } },
        { status: 400 }
      );
    }

    // 檢查權限：不能設定比自己更高級的角色
    const currentUserLevel = getRoleLevel(session.user.role);
    const targetRoleLevel = getRoleLevel(role);
    
    if (targetRoleLevel > currentUserLevel) {
      return NextResponse.json(
        { success: false, error: { code: 'INSUFFICIENT_LEVEL', message: '無法設定比自己更高級的角色' } },
        { status: 403 }
      );
    }

    const startTime = Date.now();

    // 獲取角色的預設權限
    const defaultPermissions = ROLE_PERMISSIONS[role] || [];
    
    // 合併自訂權限（不能超過角色的預設權限）
    const finalPermissions = permissions.filter((perm: string) => 
      defaultPermissions.includes(perm as Permission)
    );

    // 建立自訂聲明
    const customClaims = {
      role,
      permissions: finalPermissions,
      organizationId: organizationId || session.user.organizationId,
      departments,
      accessLevel: role,
      dataScope: getDataScopeForRole(role, organizationId || session.user.organizationId, departments),
      updatedBy: session.user.uid,
      updatedAt: new Date().toISOString()
    };

    // 設定 Firebase 自訂聲明
    const result = await AuthService.setCustomUserClaims(userId, customClaims);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: 'SET_CLAIMS_FAILED', message: result.error } },
        { status: 500 }
      );
    }

    // 記錄操作（可選）
    await logRoleChange({
      targetUserId: userId,
      operatorUserId: session.user.uid,
      fromRole: null, // TODO: 獲取之前的角色
      toRole: role,
      permissions: finalPermissions,
      timestamp: new Date()
    });

    const response = {
      success: true,
      data: {
        userId,
        role,
        permissions: finalPermissions,
        organizationId: customClaims.organizationId,
        departments,
        updatedAt: customClaims.updatedAt
      },
      metadata: {
        requestId: crypto.randomUUID(),
        timestamp: new Date(),
        processingTime: Date.now() - startTime,
        version: '1.0.0'
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Set role API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '設定角色失敗',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }
      },
      { status: 500 }
    );
  }
}

/**
 * 獲取角色描述
 */
function getRoleDescription(role: UserRole): string {
  const descriptions = {
    [UserRole.SUPER_ADMIN]: '系統超級管理員，擁有所有權限',
    [UserRole.ORG_ADMIN]: '組織管理員，可管理整個組織',
    [UserRole.DEPT_MANAGER]: '部門經理，可管理所屬部門',
    [UserRole.TEAM_LEAD]: '團隊主管，可管理團隊成員',
    [UserRole.USER]: '一般使用者，基本操作權限',
    [UserRole.VIEWER]: '唯讀使用者，只能查看資料',
    [UserRole.GUEST]: '訪客使用者，非常有限的權限'
  };

  return descriptions[role] || '未知角色';
}

/**
 * 獲取角色層級（數字越大層級越高）
 */
function getRoleLevel(role: string): number {
  const levels = {
    [UserRole.GUEST]: 1,
    [UserRole.VIEWER]: 2,
    [UserRole.USER]: 3,
    [UserRole.TEAM_LEAD]: 4,
    [UserRole.DEPT_MANAGER]: 5,
    [UserRole.ORG_ADMIN]: 6,
    [UserRole.SUPER_ADMIN]: 7
  };

  return levels[role as UserRole] || 0;
}

/**
 * 獲取權限分類
 */
function getPermissionCategories() {
  return {
    system: {
      name: '系統管理',
      permissions: [Permission.SYSTEM_ADMIN, Permission.SYSTEM_CONFIG, Permission.SYSTEM_MONITOR]
    },
    organization: {
      name: '組織管理',
      permissions: [Permission.ORG_MANAGE, Permission.ORG_VIEW, Permission.ORG_SETTINGS, Permission.ORG_USERS]
    },
    department: {
      name: '部門管理',
      permissions: [Permission.DEPT_MANAGE, Permission.DEPT_VIEW, Permission.DEPT_USERS]
    },
    user: {
      name: '使用者管理',
      permissions: [Permission.USER_MANAGE, Permission.USER_VIEW, Permission.USER_INVITE, Permission.USER_ROLES]
    },
    dashboard: {
      name: '儀表板',
      permissions: [Permission.DASHBOARD_VIEW, Permission.DASHBOARD_ADMIN, Permission.DASHBOARD_EXPORT, Permission.DASHBOARD_SHARE]
    },
    data: {
      name: '資料存取',
      permissions: [Permission.DATA_VIEW_ALL, Permission.DATA_VIEW_ORG, Permission.DATA_VIEW_DEPT, Permission.DATA_VIEW_TEAM, Permission.DATA_VIEW_OWN, Permission.DATA_EXPORT, Permission.DATA_IMPORT]
    },
    ai: {
      name: 'AI 功能',
      permissions: [Permission.AI_QUERY, Permission.AI_ANALYTICS, Permission.AI_ADMIN]
    }
  };
}

/**
 * 根據角色獲取資料範圍
 */
function getDataScopeForRole(role: UserRole, organizationId: string, departments: string[]) {
  switch (role) {
    case UserRole.SUPER_ADMIN:
      return {
        canViewAllData: true,
        canViewOrgData: true,
        canViewDeptData: true,
        canViewOwnData: true
      };
    case UserRole.ORG_ADMIN:
      return {
        canViewAllData: false,
        canViewOrgData: true,
        canViewDeptData: true,
        canViewOwnData: true
      };
    case UserRole.DEPT_MANAGER:
      return {
        canViewAllData: false,
        canViewOrgData: false,
        canViewDeptData: true,
        canViewOwnData: true
      };
    default:
      return {
        canViewAllData: false,
        canViewOrgData: false,
        canViewDeptData: false,
        canViewOwnData: true
      };
  }
}

/**
 * 記錄角色變更
 */
async function logRoleChange(params: {
  targetUserId: string;
  operatorUserId: string;
  fromRole: string | null;
  toRole: string;
  permissions: string[];
  timestamp: Date;
}) {
  try {
    // 這裡可以記錄到審計日誌
    console.log('Role change logged:', params);
  } catch (error) {
    console.error('Failed to log role change:', error);
  }
}