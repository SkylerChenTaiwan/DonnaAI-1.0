/**
 * 儀表板主頁面
 * 展示業務關鍵指標和完整分析功能
 */

'use client';

import React from 'react';
import { useAuth } from '@/providers/auth-provider';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Button } from '@/components/ui/Button';
import { AnalyticsDashboard } from '@/components/dashboard/analytics-dashboard';
import { User, Settings, LogOut, Bell } from 'lucide-react';

function DashboardContent() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('登出失敗:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頂部導航欄 */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* 左側：品牌和導航 */}
            <div className="flex items-center space-x-8">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">D</span>
                </div>
                <h1 className="ml-3 text-xl font-semibold text-gray-900">DonnaAI</h1>
              </div>

              {/* 主要導航 */}
              <nav className="hidden md:flex space-x-6">
                <a href="/dashboard" className="text-blue-600 font-medium">儀表板</a>
                <a href="/customers" className="text-gray-600 hover:text-gray-900">客戶管理</a>
                <a href="/analytics" className="text-gray-600 hover:text-gray-900">深度分析</a>
                <a href="/reports" className="text-gray-600 hover:text-gray-900">報告中心</a>
              </nav>
            </div>

            {/* 右側：用戶操作 */}
            <div className="flex items-center space-x-4">
              {/* 通知按鈕 */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </Button>

              {/* 用戶選單 */}
              <div className="relative group">
                <Button variant="ghost" className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                  <span className="hidden sm:block text-sm text-gray-700 max-w-[120px] truncate">
                    {user?.displayName || user?.email}
                  </span>
                </Button>
                
                {/* 下拉選單 */}
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <div className="p-3 border-b">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user?.displayName || '用戶'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <div className="py-1">
                    <button className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <User className="w-4 h-4 mr-2" />
                      個人設定
                    </button>
                    <button className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <Settings className="w-4 h-4 mr-2" />
                      系統設定
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      登出
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 主要內容 */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* 分析儀表板 */}
        <AnalyticsDashboard 
          organizationId={user?.customClaims?.organizationId}
          defaultTimeRange="30d"
        />
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}