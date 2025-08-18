/**
 * 認證配置
 * NextAuth.js 配置和權限設定
 */

import { NextAuthOptions } from 'next-auth';
import { AuthService } from '@/services/firebase/auth.service';

export const authOptions: NextAuthOptions = {
  // 使用 JWT 策略（Firebase Admin SDK 驗證）
  session: {
    strategy: 'jwt',
  },
  
  providers: [
    // 這裡可以添加各種認證提供者
    // 目前使用 Firebase 自訂認證
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      // 初始登入時設定用戶資料
      if (user) {
        token.uid = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }

      // 每次請求時都驗證 token 並獲取最新的權限資訊
      if (token.uid) {
        try {
          const userResult = await AuthService.getUser(token.uid as string);
          if (userResult.success && userResult.data) {
            const userData = userResult.data;
            
            // 更新基本用戶資訊
            token.email = userData.email;
            token.name = userData.displayName;
            token.picture = userData.photoURL;
            token.emailVerified = userData.emailVerified;
            token.disabled = userData.disabled;
            
            // 設定自訂權限（從 customClaims 獲取）
            token.role = userData.customClaims?.role || 'user';
            token.permissions = userData.customClaims?.permissions || [];
            token.organizationId = userData.customClaims?.organizationId;
            token.departments = userData.customClaims?.departments || [];
            token.accessLevel = userData.customClaims?.accessLevel || 'basic';
            
            // 設定資料範圍權限
            token.dataScope = userData.customClaims?.dataScope || {
              canViewAllData: false,
              canViewOrgData: false,
              canViewDeptData: false,
              canViewOwnData: true
            };
          }
        } catch (error) {
          console.error('Error fetching user data in JWT callback:', error);
          // 如果獲取用戶資料失敗，保持現有 token 資料
        }
      }

      return token;
    },

    async session({ session, token }) {
      // 將 JWT 中的資料傳遞到 session
      if (token) {
        session.user = {
          ...session.user,
          uid: token.uid as string,
          role: token.role as string,
          permissions: token.permissions as string[],
          organizationId: token.organizationId as string,
          departments: token.departments as string[],
          accessLevel: token.accessLevel as string,
          dataScope: token.dataScope as any,
          emailVerified: token.emailVerified as boolean,
          disabled: token.disabled as boolean,
        };
      }
      
      return session;
    },
  },

  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },

  // JWT 設定
  jwt: {
    // JWT 有效期限（1 天）
    maxAge: 24 * 60 * 60,
  },

  // Session 設定
  session: {
    // Session 有效期限（7 天）
    maxAge: 7 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60, // 每天更新一次
  },

  // 除錯模式（僅開發環境）
  debug: process.env.NODE_ENV === 'development',
};

// 擴展 NextAuth 類型
declare module 'next-auth' {
  interface Session {
    user: {
      uid: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      permissions: string[];
      organizationId: string;
      departments: string[];
      accessLevel: string;
      dataScope: {
        canViewAllData: boolean;
        canViewOrgData: boolean;
        canViewDeptData: boolean;
        canViewOwnData: boolean;
      };
      emailVerified: boolean;
      disabled: boolean;
    };
  }

  interface User {
    uid: string;
    role: string;
    permissions: string[];
    organizationId: string;
    departments: string[];
    accessLevel: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    uid?: string;
    role?: string;
    permissions?: string[];
    organizationId?: string;
    departments?: string[];
    accessLevel?: string;
    dataScope?: {
      canViewAllData: boolean;
      canViewOrgData: boolean;
      canViewDeptData: boolean;
      canViewOwnData: boolean;
    };
    emailVerified?: boolean;
    disabled?: boolean;
  }
}