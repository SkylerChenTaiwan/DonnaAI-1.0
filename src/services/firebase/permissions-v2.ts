/**
 * 優化的權限管理服務 V2
 * 使用查詢層級權限和快取來提升效能
 */

import { User } from '../../types/user';

interface UserPermissionContext {
  userId: string;
  role: 'salesperson' | 'manager' | 'admin' | 'system-admin';
  organizationId: string;
  teamIds: string[];
  managedTeamIds: string[];
  cachedAt: number;
}

// 權限快取（記憶體快取）
const permissionCache = new Map<string, UserPermissionContext>();
const CACHE_TTL = 5 * 60 * 1000; // 5 分鐘

/**
 * 取得使用者權限上下文（帶快取）
 */
export async function getUserPermissionContext(user: User): Promise<UserPermissionContext> {
  const cacheKey = user.id;
  const cached = permissionCache.get(cacheKey);
  
  // 檢查快取是否有效
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL) {
    return cached;
  }
  
  // 建立權限上下文
  const context: UserPermissionContext = {
    userId: user.id,
    role: user.role,
    organizationId: user.organizationId,
    teamIds: user.teamIds || [],
    managedTeamIds: user.managedTeamIds || [],
    cachedAt: Date.now()
  };
  
  // 快取結果
  permissionCache.set(cacheKey, context);
  
  return context;
}

/**
 * 清除使用者權限快取
 */
export function clearUserPermissionCache(userId?: string) {
  if (userId) {
    permissionCache.delete(userId);
  } else {
    permissionCache.clear();
  }
}

/**
 * 根據權限上下文建立查詢條件
 */
export function buildQueryConstraints(context: UserPermissionContext, dataType: 'customers' | 'records' | 'tasks') {
  const constraints = [];
  
  switch (context.role) {
    case 'system-admin':
      // 系統管理員：不應該看到任何業務資料，返回一個永遠不匹配的條件
      constraints.push(['id', '==', '__SYSTEM_ADMIN_NO_DATA__']);
      break;
      
    case 'admin':
      // 管理員：看組織內所有資料
      constraints.push(['organizationId', '==', context.organizationId]);
      break;
      
    case 'manager':
      // 主管：看管理團隊的資料
      if (context.managedTeamIds.length > 0) {
        constraints.push(['teamId', 'in', context.managedTeamIds]);
      } else if (context.teamIds.length > 0) {
        // 沒有管理團隊，只看自己團隊
        constraints.push(['teamId', 'in', context.teamIds]);
      } else {
        // 如果沒有任何團隊，根據資料類型決定
        if (dataType === 'customers') {
          constraints.push(['assignedTo', '==', context.userId]);
        } else if (dataType === 'records') {
          constraints.push(['createdBy', '==', context.userId]);
        } else if (dataType === 'tasks') {
          constraints.push(['assigneeId', '==', context.userId]);
        }
      }
      break;
      
    case 'salesperson':
      // 業務員：根據資料類型有不同權限
      if (dataType === 'customers') {
        // 客戶：看自己團隊或自己負責的
        if (context.teamIds.length > 0) {
          constraints.push(['teamId', 'in', context.teamIds]);
        } else {
          // 如果沒有團隊，只看自己負責的客戶
          constraints.push(['assignedTo', '==', context.userId]);
        }
      } else if (dataType === 'records') {
        // 紀錄：看自己參與的或團隊的
        if (context.teamIds.length > 0) {
          constraints.push(['teamId', 'in', context.teamIds]);
        } else {
          // 如果沒有團隊，只看自己建立的紀錄
          constraints.push(['createdBy', '==', context.userId]);
        }
      } else if (dataType === 'tasks') {
        // 任務：看自己負責的
        constraints.push(['assigneeId', '==', context.userId]);
      }
      break;
  }
  
  return constraints;
}

/**
 * 批量檢查權限（用於特殊情況）
 */
export async function batchCheckPermissions(
  context: UserPermissionContext,
  items: { id: string; teamId?: string; assignedTo?: string }[],
  _dataType: 'customers' | 'records' | 'tasks'
): Promise<Map<string, boolean>> {
  const results = new Map<string, boolean>();
  
  // 系統管理員不能看任何業務資料
  if (context.role === 'system-admin') {
    items.forEach(item => results.set(item.id, false));
    return results;
  }
  
  // 管理員可以看所有
  if (context.role === 'admin') {
    items.forEach(item => results.set(item.id, true));
    return results;
  }
  
  // 批量檢查
  items.forEach(item => {
    let hasPermission = false;
    
    // 檢查團隊權限
    if (item.teamId) {
      if (context.role === 'manager' && context.managedTeamIds.includes(item.teamId)) {
        hasPermission = true;
      } else if (context.teamIds.includes(item.teamId)) {
        hasPermission = true;
      }
    }
    
    // 檢查負責人權限
    if (item.assignedTo === context.userId) {
      hasPermission = true;
    }
    
    results.set(item.id, hasPermission);
  });
  
  return results;
}