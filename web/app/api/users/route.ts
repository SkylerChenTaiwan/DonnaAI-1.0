/**
 * GET /api/users
 * 取得用戶列表（需要 Super Admin 權限）
 */

import { NextRequest } from 'next/server';
import { withSuperAdmin, createSuccessResponse, createErrorResponse } from '@/lib/middleware';
import { FirestoreService } from '@/lib/firebase-admin';

interface UserData {
  id: string;
  email: string | undefined;
  displayName: string | undefined;
  role: string | undefined;
  organizationId: string | undefined;
  createdAt: Date | undefined;
  updatedAt: Date | undefined;
}

export const GET = withSuperAdmin(async (request: NextRequest, user) => {
  try {
    // 取得 query parameters
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit');
    const role = url.searchParams.get('role');

    let result;

    if (role) {
      // 按角色過濾用戶
      result = await FirestoreService.queryDocuments(
        'users',
        'role',
        '==',
        role,
        limit ? parseInt(limit) : undefined
      );
    } else {
      // 取得所有用戶
      result = await FirestoreService.getCollection('users');
    }

    if (!result.success) {
      return createErrorResponse(
        result.error || 'Failed to fetch users',
        500,
        'FETCH_ERROR'
      );
    }

    // 格式化用戶資料
    const users: UserData[] = result.data ? result.data.map((user: Record<string, unknown>) => ({
      id: user['id'] as string,
      email: user['email'] as string | undefined,
      displayName: user['displayName'] as string | undefined,
      role: user['role'] as string | undefined,
      organizationId: user['organizationId'] as string | undefined,
      createdAt: user['createdAt'] as Date | undefined,
      updatedAt: user['updatedAt'] as Date | undefined,
    })) : [];

    return createSuccessResponse(
      users,
      `Successfully retrieved ${users.length} users`
    );
  } catch (error) {
    console.error('Get users error:', error);
    return createErrorResponse(
      'Failed to retrieve users',
      500,
      'INTERNAL_ERROR'
    );
  }
});

// 支援 OPTIONS 請求（CORS preflight）
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}