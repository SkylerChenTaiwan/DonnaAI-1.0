/**
 * 儀表板主頁面
 * 展示業務關鍵指標和完整分析功能
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Button } from '@/components/ui/Button';
import { DashboardLayout, LayoutConfig, WidgetConfig, LayoutMode, LayoutManager } from '@/components/dashboard/dashboard-layout';
import { WidgetSelector } from '@/components/dashboard/widget-selector';
import { WidgetRegistry } from '@/components/dashboard/widget-registry';
import { User, Settings, LogOut, Bell, Plus, Edit3, Eye, Save } from 'lucide-react';

function DashboardContent() {
  const { user, logout } = useAuth();
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('view');
  const [currentLayout, setCurrentLayout] = useState<LayoutConfig | null>(null);
  const [showWidgetSelector, setShowWidgetSelector] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化佈局
  useEffect(() => {
    const initializeLayout = async () => {
      try {
        // 嘗試載入使用者的預設佈局
        let layout = LayoutManager.loadLayout('user_default');
        
        if (!layout) {
          // 建立預設佈局
          layout = {
            ...LayoutManager.createDefaultLayout(),
            id: 'user_default',
            name: '我的儀表板',
            widgets: [
              {
                id: 'metrics-1',
                type: 'metrics-overview',
                title: '關鍵指標',
                position: { x: 0, y: 0, width: 6, height: 3 },
                props: {},
                isVisible: true,
                isLocked: false,
              },
              {
                id: 'revenue-chart-1',
                type: 'revenue-chart',
                title: '營收趨勢',
                position: { x: 6, y: 0, width: 6, height: 4 },
                props: {},
                isVisible: true,
                isLocked: false,
              },
              {
                id: 'tasks-1',
                type: 'task-summary',
                title: '任務概覽',
                position: { x: 0, y: 3, width: 3, height: 4 },
                props: {},
                isVisible: true,
                isLocked: false,
              },
              {
                id: 'notifications-1',
                type: 'notifications',
                title: '通知中心',
                position: { x: 3, y: 3, width: 3, height: 4 },
                props: {},
                isVisible: true,
                isLocked: false,
              },
              {
                id: 'quick-actions-1',
                type: 'quick-actions',
                title: '快速操作',
                position: { x: 6, y: 4, width: 2, height: 2 },
                props: {},
                isVisible: true,
                isLocked: false,
              },
              {
                id: 'ai-insights-1',
                type: 'ai-insights',
                title: 'AI 洞察',
                position: { x: 8, y: 4, width: 4, height: 3 },
                props: {},
                isVisible: true,
                isLocked: false,
              },
            ],
          };
          
          LayoutManager.saveLayout(layout);
        }
        
        setCurrentLayout(layout);
      } catch (error) {
        console.error('Failed to initialize layout:', error);
        // 使用最小預設佈局
        setCurrentLayout(LayoutManager.createDefaultLayout());
      } finally {
        setIsLoading(false);
      }
    };

    initializeLayout();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('登出失敗:', error);
    }
  };

  // 處理佈局模式切換
  const handleModeChange = (mode: LayoutMode) => {
    setLayoutMode(mode);
  };

  // 處理佈局變更
  const handleLayoutChange = (layout: LayoutConfig) => {
    setCurrentLayout(layout);
    LayoutManager.saveLayout(layout);
  };

  // 處理添加小工具
  const handleAddWidget = (widget: Omit<WidgetConfig, 'id'>) => {
    if (!currentLayout) return;

    const newWidget: WidgetConfig = {
      ...widget,
      id: `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    const updatedLayout = {
      ...currentLayout,
      widgets: [...currentLayout.widgets, newWidget],
      updatedAt: new Date(),
    };

    handleLayoutChange(updatedLayout);
    setShowWidgetSelector(false);
  };

  // 處理刪除小工具
  const handleRemoveWidget = (widgetId: string) => {
    if (!currentLayout) return;

    const updatedLayout = {
      ...currentLayout,
      widgets: currentLayout.widgets.filter(w => w.id !== widgetId),
      updatedAt: new Date(),
    };

    handleLayoutChange(updatedLayout);
  };

  // 處理編輯小工具
  const handleEditWidget = (widgetId: string, updates: Partial<WidgetConfig>) => {
    if (!currentLayout) return;

    const updatedLayout = {
      ...currentLayout,
      widgets: currentLayout.widgets.map(w => 
        w.id === widgetId ? { ...w, ...updates } : w
      ),
      updatedAt: new Date(),
    };

    handleLayoutChange(updatedLayout);
  };

  // 模擬資料載入
  const mockData = {
    metrics: [
      { name: '本月營收', description: '當月總營收', value: '$125,430', change: 12.5 },
      { name: '新增客戶', description: '本月新增', value: '34', change: 8.3 },
      { name: '完成任務', description: '本週完成', value: '89', change: -3.2 },
      { name: '團隊效率', description: '平均完成率', value: '94%', change: 2.1 },
    ],
    tasks: [
      { title: '完成季度報告', dueDate: '今天', completed: false },
      { title: '客戶會議準備', dueDate: '明天', completed: false },
      { title: '產品功能規劃', dueDate: '本週五', completed: true },
      { title: '團隊績效評估', dueDate: '下週一', completed: false },
    ],
    activities: [
      { description: '張三完成了客戶資料更新', timestamp: '2 分鐘前' },
      { description: '新增了 3 筆客戶記錄', timestamp: '15 分鐘前' },
      { description: '李四完成了月度報告', timestamp: '1 小時前' },
      { description: '系統備份已完成', timestamp: '2 小時前' },
    ],
    notifications: [
      { title: '新的客戶訊息', time: '剛才', read: false },
      { title: '會議提醒：下午 2 點', time: '10 分鐘前', read: false },
      { title: '報告已生成完成', time: '1 小時前', read: true },
      { title: '系統維護通知', time: '昨天', read: true },
    ],
    insights: [
      {
        title: '客戶流失風險',
        description: '檢測到 3 位客戶可能流失，建議主動聯繫',
        confidence: 85,
        category: '客戶分析'
      },
      {
        title: '最佳銷售時機',
        description: '本週三下午是聯繫潛在客戶的最佳時間',
        confidence: 72,
        category: '銷售優化'
      },
    ],
  };

  if (isLoading || !currentLayout) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">載入儀表板中...</p>
        </div>
      </div>
    );
  }

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
              {/* 儀表板控制 */}
              <div className="flex items-center space-x-2">
                {layoutMode === 'view' && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowWidgetSelector(true)}
                      className="flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">添加</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleModeChange('edit')}
                      className="flex items-center space-x-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span className="hidden sm:inline">編輯</span>
                    </Button>
                  </>
                )}
                
                {layoutMode === 'edit' && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowWidgetSelector(true)}
                      className="flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">添加小工具</span>
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => handleModeChange('view')}
                      className="flex items-center space-x-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="hidden sm:inline">完成編輯</span>
                    </Button>
                  </>
                )}
              </div>

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

      {/* 主要內容：響應式儀表板 */}
      <DashboardLayout
        layoutConfig={currentLayout}
        mode={layoutMode}
        onLayoutChange={handleLayoutChange}
        onWidgetAdd={handleAddWidget}
        onWidgetRemove={handleRemoveWidget}
        onWidgetEdit={handleEditWidget}
      >
        {/* 這裡會根據小工具類型渲染不同的內容 */}
        {currentLayout.widgets.map((widget) => (
          <div key={widget.id}>
            {WidgetRegistry.renderWidget(widget, {
              data: mockData,
              isLoading: false,
              onConfigChange: (updates: Partial<WidgetConfig>) => 
                handleEditWidget(widget.id, updates)
            })}
          </div>
        ))}
      </DashboardLayout>

      {/* 小工具選擇器 */}
      <WidgetSelector
        isOpen={showWidgetSelector}
        onClose={() => setShowWidgetSelector(false)}
        onAddWidget={handleAddWidget}
        existingWidgets={currentLayout.widgets}
      />
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