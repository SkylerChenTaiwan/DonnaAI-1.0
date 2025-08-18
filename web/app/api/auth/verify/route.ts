/**
 * POST /api/auth/verify
 * 驗證用戶的 Firebase ID Token
 */

import { NextRequest } from 'next/server';
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/middleware';

interface VerifyTokenRequest {
  token: string;
}

interface VerifyTokenResponse {
  uid: string;
  email: string | undefined;
  verified: boolean;
}

export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    // 如果到達這裡，表示 token 已經通過驗證
    const response: VerifyTokenResponse = {
      uid: user.uid,
      email: user.email,
      verified: true,
    };

    return createSuccessResponse(response, 'Token verified successfully');
  } catch (error) {
    console.error('Token verification error:', error);
    return createErrorResponse(
      'Token verification failed',
      500,
      'VERIFICATION_ERROR'
    );
  }
});

// 支援 OPTIONS 請求（CORS preflight）
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}