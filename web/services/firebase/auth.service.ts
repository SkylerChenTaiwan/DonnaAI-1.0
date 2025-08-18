/**
 * Firebase 認證服務
 * 處理所有認證相關的操作
 */

import { DecodedIdToken } from 'firebase-admin/auth';
import { adminAuth } from '@/lib/firebase-admin';

// 認證結果介面
export interface AuthResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

// 用戶資料介面
export interface UserRecord {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
  disabled: boolean;
  emailVerified: boolean;
  metadata: {
    creationTime?: string;
    lastSignInTime?: string;
  };
  customClaims?: Record<string, any>;
}

export class AuthService {
  /**
   * 驗證 ID Token
   */
  static async verifyIdToken(token: string): Promise<AuthResult<DecodedIdToken>> {
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      return {
        success: true,
        data: decodedToken,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Token verification failed';
      console.error('[AuthService] Token verification failed:', error);
      
      // 分析錯誤類型
      let errorCode = 'INVALID_TOKEN';
      if (errorMessage.includes('expired')) {
        errorCode = 'TOKEN_EXPIRED';
      } else if (errorMessage.includes('revoked')) {
        errorCode = 'TOKEN_REVOKED';
      }
      
      return {
        success: false,
        error: errorMessage,
        code: errorCode,
      };
    }
  }

  /**
   * 驗證 Session Cookie
   */
  static async verifySessionCookie(
    cookie: string,
    checkRevoked = true
  ): Promise<AuthResult<DecodedIdToken>> {
    try {
      const decodedClaims = await adminAuth.verifySessionCookie(cookie, checkRevoked);
      return {
        success: true,
        data: decodedClaims,
      };
    } catch (error) {
      console.error('[AuthService] Session cookie verification failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Session verification failed',
        code: 'INVALID_SESSION',
      };
    }
  }

  /**
   * 取得用戶資料
   */
  static async getUser(uid: string): Promise<AuthResult<UserRecord>> {
    try {
      const userRecord = await adminAuth.getUser(uid);
      return {
        success: true,
        data: {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName,
          photoURL: userRecord.photoURL,
          phoneNumber: userRecord.phoneNumber,
          disabled: userRecord.disabled,
          emailVerified: userRecord.emailVerified,
          metadata: {
            creationTime: userRecord.metadata.creationTime,
            lastSignInTime: userRecord.metadata.lastSignInTime,
          },
          customClaims: userRecord.customClaims,
        },
      };
    } catch (error) {
      console.error('[AuthService] Get user failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'User not found',
        code: 'USER_NOT_FOUND',
      };
    }
  }

  /**
   * 取得用戶（透過 Email）
   */
  static async getUserByEmail(email: string): Promise<AuthResult<UserRecord>> {
    try {
      const userRecord = await adminAuth.getUserByEmail(email);
      return {
        success: true,
        data: {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName,
          photoURL: userRecord.photoURL,
          phoneNumber: userRecord.phoneNumber,
          disabled: userRecord.disabled,
          emailVerified: userRecord.emailVerified,
          metadata: {
            creationTime: userRecord.metadata.creationTime,
            lastSignInTime: userRecord.metadata.lastSignInTime,
          },
          customClaims: userRecord.customClaims,
        },
      };
    } catch (error) {
      console.error('[AuthService] Get user by email failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'User not found',
        code: 'USER_NOT_FOUND',
      };
    }
  }

  /**
   * 建立新用戶
   */
  static async createUser(userData: {
    email: string;
    password: string;
    displayName?: string;
    phoneNumber?: string;
    photoURL?: string;
    disabled?: boolean;
    emailVerified?: boolean;
  }): Promise<AuthResult<UserRecord>> {
    try {
      const userRecord = await adminAuth.createUser(userData);
      return {
        success: true,
        data: {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName,
          photoURL: userRecord.photoURL,
          phoneNumber: userRecord.phoneNumber,
          disabled: userRecord.disabled,
          emailVerified: userRecord.emailVerified,
          metadata: {
            creationTime: userRecord.metadata.creationTime,
            lastSignInTime: userRecord.metadata.lastSignInTime,
          },
        },
      };
    } catch (error) {
      console.error('[AuthService] Create user failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create user',
        code: 'CREATE_USER_ERROR',
      };
    }
  }

  /**
   * 更新用戶資料
   */
  static async updateUser(
    uid: string,
    userData: Partial<{
      email: string;
      password: string;
      displayName: string;
      phoneNumber: string;
      photoURL: string;
      disabled: boolean;
      emailVerified: boolean;
    }>
  ): Promise<AuthResult<UserRecord>> {
    try {
      const userRecord = await adminAuth.updateUser(uid, userData);
      return {
        success: true,
        data: {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName,
          photoURL: userRecord.photoURL,
          phoneNumber: userRecord.phoneNumber,
          disabled: userRecord.disabled,
          emailVerified: userRecord.emailVerified,
          metadata: {
            creationTime: userRecord.metadata.creationTime,
            lastSignInTime: userRecord.metadata.lastSignInTime,
          },
        },
      };
    } catch (error) {
      console.error('[AuthService] Update user failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update user',
        code: 'UPDATE_USER_ERROR',
      };
    }
  }

  /**
   * 刪除用戶
   */
  static async deleteUser(uid: string): Promise<AuthResult<void>> {
    try {
      await adminAuth.deleteUser(uid);
      return {
        success: true,
      };
    } catch (error) {
      console.error('[AuthService] Delete user failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete user',
        code: 'DELETE_USER_ERROR',
      };
    }
  }

  /**
   * 設定自訂聲明 (Custom Claims)
   */
  static async setCustomUserClaims(
    uid: string,
    customClaims: Record<string, any>
  ): Promise<AuthResult<void>> {
    try {
      await adminAuth.setCustomUserClaims(uid, customClaims);
      return {
        success: true,
      };
    } catch (error) {
      console.error('[AuthService] Set custom claims failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to set custom claims',
        code: 'SET_CLAIMS_ERROR',
      };
    }
  }

  /**
   * 撤銷用戶的 Refresh Tokens
   */
  static async revokeRefreshTokens(uid: string): Promise<AuthResult<void>> {
    try {
      await adminAuth.revokeRefreshTokens(uid);
      return {
        success: true,
      };
    } catch (error) {
      console.error('[AuthService] Revoke refresh tokens failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to revoke tokens',
        code: 'REVOKE_TOKENS_ERROR',
      };
    }
  }

  /**
   * 產生 Email 驗證連結
   */
  static async generateEmailVerificationLink(
    email: string,
    actionCodeSettings?: {
      url: string;
      handleCodeInApp?: boolean;
      iOS?: { bundleId: string };
      android?: { packageName: string; installApp?: boolean; minimumVersion?: string };
      dynamicLinkDomain?: string;
    }
  ): Promise<AuthResult<string>> {
    try {
      const link = await adminAuth.generateEmailVerificationLink(email, actionCodeSettings);
      return {
        success: true,
        data: link,
      };
    } catch (error) {
      console.error('[AuthService] Generate email verification link failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate link',
        code: 'GENERATE_LINK_ERROR',
      };
    }
  }

  /**
   * 產生密碼重設連結
   */
  static async generatePasswordResetLink(
    email: string,
    actionCodeSettings?: {
      url: string;
      handleCodeInApp?: boolean;
      iOS?: { bundleId: string };
      android?: { packageName: string; installApp?: boolean; minimumVersion?: string };
      dynamicLinkDomain?: string;
    }
  ): Promise<AuthResult<string>> {
    try {
      const link = await adminAuth.generatePasswordResetLink(email, actionCodeSettings);
      return {
        success: true,
        data: link,
      };
    } catch (error) {
      console.error('[AuthService] Generate password reset link failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate link',
        code: 'GENERATE_LINK_ERROR',
      };
    }
  }

  /**
   * 建立 Session Cookie
   */
  static async createSessionCookie(
    idToken: string,
    expiresIn: number = 60 * 60 * 24 * 5 * 1000 // 5 days
  ): Promise<AuthResult<string>> {
    try {
      const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
      return {
        success: true,
        data: sessionCookie,
      };
    } catch (error) {
      console.error('[AuthService] Create session cookie failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create session',
        code: 'CREATE_SESSION_ERROR',
      };
    }
  }

  /**
   * 批量取得用戶
   */
  static async getUsers(
    identifiers: Array<{ uid?: string; email?: string; phoneNumber?: string; providerId?: string }>
  ): Promise<AuthResult<UserRecord[]>> {
    try {
      const getUsersResult = await adminAuth.getUsers(identifiers);
      
      const users = getUsersResult.users.map(user => ({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        phoneNumber: user.phoneNumber,
        disabled: user.disabled,
        emailVerified: user.emailVerified,
        metadata: {
          creationTime: user.metadata.creationTime,
          lastSignInTime: user.metadata.lastSignInTime,
        },
        customClaims: user.customClaims,
      }));

      return {
        success: true,
        data: users,
      };
    } catch (error) {
      console.error('[AuthService] Get users failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get users',
        code: 'GET_USERS_ERROR',
      };
    }
  }

  /**
   * 列出所有用戶（分頁）
   */
  static async listUsers(
    maxResults = 1000,
    pageToken?: string
  ): Promise<AuthResult<{ users: UserRecord[]; pageToken?: string }>> {
    try {
      const listUsersResult = await adminAuth.listUsers(maxResults, pageToken);
      
      const users = listUsersResult.users.map(user => ({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        phoneNumber: user.phoneNumber,
        disabled: user.disabled,
        emailVerified: user.emailVerified,
        metadata: {
          creationTime: user.metadata.creationTime,
          lastSignInTime: user.metadata.lastSignInTime,
        },
        customClaims: user.customClaims,
      }));

      return {
        success: true,
        data: {
          users,
          pageToken: listUsersResult.pageToken,
        },
      };
    } catch (error) {
      console.error('[AuthService] List users failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list users',
        code: 'LIST_USERS_ERROR',
      };
    }
  }
}