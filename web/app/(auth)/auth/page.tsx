/**
 * 統一認證頁面
 * 處理登入、註冊和密碼重設
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { AuthForm, type AuthFormType } from '@/components/auth/auth-form';

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();

  // 從 URL 參數獲取認證類型，預設為登入
  const initialType = (searchParams.get('type') as AuthFormType) || 'signin';
  const [authType, setAuthType] = useState<AuthFormType>(initialType);

  // 認證成功後的重導向
  const redirectPath = searchParams.get('redirect') || '/dashboard';

  // 如果用戶已登入，重導向到儀表板
  useEffect(() => {
    if (!loading && user) {
      router.push(redirectPath);
    }
  }, [user, loading, router, redirectPath]);

  // 認證成功的處理函數
  const handleAuthSuccess = () => {
    router.push(redirectPath);
  };

  // 更新 URL 參數
  const handleTypeChange = (type: AuthFormType) => {
    setAuthType(type);
    const params = new URLSearchParams(searchParams.toString());
    params.set('type', type);
    router.replace(`/auth?${params.toString()}`);
  };

  // 載入中狀態
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">DonnaAI</h1>
          <p className="mt-2 text-gray-600">企業級 CRM 管理平台</p>
        </div>
        
        <AuthForm 
          type={authType}
          onTypeChange={handleTypeChange}
          onSuccess={handleAuthSuccess}
        />
        
        {/* 額外功能連結 */}
        <div className="mt-8 text-center">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">或</span>
            </div>
          </div>
          
          <div className="mt-6">
            <p className="text-sm text-gray-600 mb-2">需要協助？</p>
            <div className="space-x-4">
              <a 
                href="mailto:support@donnaai.com" 
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                聯絡客服
              </a>
              <a 
                href="/help" 
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                使用說明
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}