/**
 * 認證和用戶上下文類型定義
 */

import { User, UserRole } from './user';

/**
 * 用戶上下文
 * 用於查詢和權限驗證
 */
export interface UserContext {
  userId: string;
  role: UserRole;
  organizationId: string;
  teamIds: string[];
}

/**
 * 從 User 物件創建 UserContext
 */
export function createUserContext(user: User): UserContext {
  return {
    userId: user.id,
    role: user.role,
    organizationId: user.organizationId,
    teamIds: user.teamIds || []
  };
}

/**
 * 認證狀態
 */
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export type { User, UserRole } from './user';