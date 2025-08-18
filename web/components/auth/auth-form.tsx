/**
 * 認證表單組件
 * 統一的登入/註冊表單介面
 */

'use client';

import React, { useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { LoadingIndicator } from '@/components/ui/loading-indicator';

// 表單類型
export type AuthFormType = 'signin' | 'signup' | 'reset';

// 表單狀態
interface FormState {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
}

// 組件屬性
interface AuthFormProps {
  type: AuthFormType;
  onTypeChange: (type: AuthFormType) => void;
  onSuccess?: () => void;
}

export function AuthForm({ type, onTypeChange, onSuccess }: AuthFormProps) {
  const { signIn, signUp, resetPassword, loading, error, clearError } = useAuth();
  
  const [form, setForm] = useState<FormState>({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
  });

  const [formErrors, setFormErrors] = useState<Partial<FormState>>({});
  const [resetEmailSent, setResetEmailSent] = useState(false);

  // 清除錯誤
  React.useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // 表單驗證
  const validateForm = (): boolean => {
    const errors: Partial<FormState> = {};

    // Email 驗證
    if (!form.email) {
      errors.email = 'Email 為必填欄位';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      errors.email = 'Email 格式不正確';
    }

    // 密碼驗證（登入和註冊需要）
    if (type !== 'reset') {
      if (!form.password) {
        errors.password = '密碼為必填欄位';
      } else if (form.password.length < 6) {
        errors.password = '密碼至少需要 6 個字元';
      }

      // 註冊時的額外驗證
      if (type === 'signup') {
        if (!form.displayName) {
          errors.displayName = '顯示名稱為必填欄位';
        }

        if (form.password !== form.confirmPassword) {
          errors.confirmPassword = '密碼確認不一致';
        }
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 處理表單提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      switch (type) {
        case 'signin':
          await signIn(form.email, form.password);
          break;
        
        case 'signup':
          await signUp(form.email, form.password, form.displayName);
          break;
        
        case 'reset':
          await resetPassword(form.email);
          setResetEmailSent(true);
          return;
      }

      // 成功後的回調
      onSuccess?.();
    } catch (err) {
      // 錯誤已由 AuthProvider 處理
      console.error('Auth form error:', err);
    }
  };

  // 更新表單狀態
  const updateForm = (field: keyof FormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    
    // 清除該欄位的錯誤
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // 表單標題
  const getTitle = () => {
    switch (type) {
      case 'signin': return '登入系統';
      case 'signup': return '建立帳號';
      case 'reset': return '重設密碼';
      default: return '';
    }
  };

  // 密碼重設成功訊息
  if (type === 'reset' && resetEmailSent) {
    return (
      <Card className="w-full max-w-md mx-auto p-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">重設連結已發送</h3>
          <p className="text-gray-600 mb-4">
            我們已將密碼重設連結發送到您的 Email：{form.email}
          </p>
          <Button 
            variant="outline" 
            onClick={() => onTypeChange('signin')}
            className="w-full"
          >
            返回登入
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{getTitle()}</h2>
        <p className="text-gray-600">
          {type === 'signin' && '輸入您的登入資訊'}
          {type === 'signup' && '建立您的新帳號'}
          {type === 'reset' && '輸入您的 Email 以重設密碼'}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 顯示名稱（僅註冊時顯示） */}
        {type === 'signup' && (
          <div>
            <Input
              id="displayName"
              type="text"
              placeholder="顯示名稱"
              value={form.displayName}
              onChange={(e) => updateForm('displayName', e.target.value)}
              disabled={loading}
            />
            {formErrors.displayName && (
              <p className="mt-1 text-sm text-red-600">{formErrors.displayName}</p>
            )}
          </div>
        )}

        {/* Email */}
        <div>
          <Input
            id="email"
            type="email"
            placeholder="Email 地址"
            value={form.email}
            onChange={(e) => updateForm('email', e.target.value)}
            disabled={loading}
            autoComplete="email"
          />
          {formErrors.email && (
            <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
          )}
        </div>

        {/* 密碼（密碼重設時不顯示） */}
        {type !== 'reset' && (
          <div>
            <Input
              id="password"
              type="password"
              placeholder="密碼"
              value={form.password}
              onChange={(e) => updateForm('password', e.target.value)}
              disabled={loading}
              autoComplete={type === 'signin' ? 'current-password' : 'new-password'}
            />
            {formErrors.password && (
              <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
            )}
          </div>
        )}

        {/* 確認密碼（僅註冊時顯示） */}
        {type === 'signup' && (
          <div>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="確認密碼"
              value={form.confirmPassword}
              onChange={(e) => updateForm('confirmPassword', e.target.value)}
              disabled={loading}
              autoComplete="new-password"
            />
            {formErrors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{formErrors.confirmPassword}</p>
            )}
          </div>
        )}

        {/* 提交按鈕 */}
        <Button 
          type="submit" 
          className="w-full" 
          disabled={loading}
        >
          {loading ? (
            <>
              <LoadingIndicator size={16} className="mr-2" />
              處理中...
            </>
          ) : (
            <>
              {type === 'signin' && '登入'}
              {type === 'signup' && '建立帳號'}
              {type === 'reset' && '發送重設連結'}
            </>
          )}
        </Button>
      </form>

      {/* 切換連結 */}
      <div className="mt-6 text-center space-y-2">
        {type === 'signin' && (
          <>
            <button
              type="button"
              className="text-sm text-blue-600 hover:text-blue-500"
              onClick={() => onTypeChange('reset')}
            >
              忘記密碼？
            </button>
            <div>
              <span className="text-sm text-gray-600">還沒有帳號？</span>
              <button
                type="button"
                className="ml-1 text-sm text-blue-600 hover:text-blue-500"
                onClick={() => onTypeChange('signup')}
              >
                立即註冊
              </button>
            </div>
          </>
        )}

        {type === 'signup' && (
          <div>
            <span className="text-sm text-gray-600">已經有帳號？</span>
            <button
              type="button"
              className="ml-1 text-sm text-blue-600 hover:text-blue-500"
              onClick={() => onTypeChange('signin')}
            >
              立即登入
            </button>
          </div>
        )}

        {type === 'reset' && (
          <button
            type="button"
            className="text-sm text-blue-600 hover:text-blue-500"
            onClick={() => onTypeChange('signin')}
          >
            返回登入
          </button>
        )}
      </div>
    </Card>
  );
}