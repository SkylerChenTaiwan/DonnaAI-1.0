/**
 * 用戶相關型別定義
 */

// 用戶角色列舉
export enum UserRole {
  SUPER_ADMIN = 'superAdmin',
  ORG_ADMIN = 'orgAdmin',
  TEAM_ADMIN = 'teamAdmin',
  MEMBER = 'member',
  GUEST = 'guest',
}

// 用戶狀態列舉
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

// 用戶基本資料介面
export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
  role: UserRole;
  status: UserStatus;
  organizationId?: string;
  teamIds?: string[];
  metadata: UserMetadata;
  preferences?: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

// 用戶元資料介面
export interface UserMetadata {
  lastLoginAt?: Date;
  lastActivityAt?: Date;
  loginCount: number;
  ipAddress?: string;
  userAgent?: string;
  locale?: string;
  timezone?: string;
}

// 用戶偏好設定介面
export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  notifications?: NotificationPreferences;
  privacy?: PrivacySettings;
}

// 通知偏好設定介面
export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  inApp: boolean;
  frequency?: 'realtime' | 'daily' | 'weekly' | 'never';
  categories?: {
    marketing: boolean;
    updates: boolean;
    security: boolean;
    social: boolean;
  };
}

// 隱私設定介面
export interface PrivacySettings {
  profileVisibility: 'public' | 'organization' | 'team' | 'private';
  showEmail: boolean;
  showPhone: boolean;
  allowAnalytics: boolean;
}

// 用戶建立輸入介面
export interface CreateUserInput {
  email: string;
  password: string;
  displayName?: string;
  role?: UserRole;
  organizationId?: string;
  teamIds?: string[];
}

// 用戶更新輸入介面
export interface UpdateUserInput {
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
  role?: UserRole;
  status?: UserStatus;
  organizationId?: string;
  teamIds?: string[];
  preferences?: Partial<UserPreferences>;
}

// 用戶查詢過濾器介面
export interface UserFilter {
  role?: UserRole;
  status?: UserStatus;
  organizationId?: string;
  teamId?: string;
  email?: string;
  searchTerm?: string;
}

// 用戶排序選項介面
export interface UserSortOptions {
  field: 'email' | 'displayName' | 'role' | 'status' | 'createdAt' | 'updatedAt' | 'lastLoginAt';
  direction: 'asc' | 'desc';
}

// 用戶查詢選項介面
export interface UserQueryOptions {
  filter?: UserFilter;
  sort?: UserSortOptions;
  pagination?: {
    page: number;
    pageSize: number;
  };
}

// 用戶列表回應介面
export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// 用戶認證上下文介面
export interface AuthContext {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: UserPermissions;
}

// 用戶權限介面
export interface UserPermissions {
  canCreateUser: boolean;
  canUpdateUser: boolean;
  canDeleteUser: boolean;
  canManageOrganization: boolean;
  canManageTeam: boolean;
  canViewAnalytics: boolean;
  canManageSettings: boolean;
  canAccessAdmin: boolean;
}

// 用戶活動記錄介面
export interface UserActivity {
  id: string;
  userId: string;
  action: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

// 用戶邀請介面
export interface UserInvitation {
  id: string;
  email: string;
  role: UserRole;
  organizationId?: string;
  teamIds?: string[];
  invitedBy: string;
  invitedAt: Date;
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  token: string;
}

// 用戶 Session 介面
export interface UserSession {
  id: string;
  userId: string;
  token: string;
  refreshToken?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  expiresAt: Date;
  lastActivityAt: Date;
}

// 用戶統計介面
export interface UserStatistics {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  usersByRole: Record<UserRole, number>;
  usersByStatus: Record<UserStatus, number>;
  averageSessionDuration: number;
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
}