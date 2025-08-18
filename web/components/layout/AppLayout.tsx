/**
 * 應用程式主佈局元件
 * 提供響應式導航、側邊欄和主內容區域
 */
"use client";

import React, { ReactNode, useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  showSidebar?: boolean;
  sidebarContent?: ReactNode;
  headerActions?: ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  className?: string;
}

export function AppLayout({
  children,
  title,
  showSidebar = true,
  sidebarContent,
  headerActions,
  breadcrumbs,
  className,
}: AppLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const collapseSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="min-h-screen bg-white flex">
      {/* 側邊欄 */}
      {showSidebar && (
        <>
          {/* 桌面版側邊欄 */}
          <div
            className={cn(
              'hidden lg:flex lg:flex-shrink-0 transition-all duration-300',
              isSidebarCollapsed ? 'lg:w-16' : 'lg:w-64'
            )}
          >
            <Sidebar
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={collapseSidebar}
              className="hidden lg:flex"
            >
              {sidebarContent}
            </Sidebar>
          </div>

          {/* 手機版側邊欄覆蓋層 */}
          {isSidebarOpen && (
            <div
              className="fixed inset-0 z-40 lg:hidden"
              onClick={closeSidebar}
            >
              <div className="absolute inset-0 bg-gray-600 bg-opacity-75" />
            </div>
          )}

          {/* 手機版側邊欄 */}
          <div
            className={cn(
              'fixed inset-y-0 left-0 z-50 w-64 lg:hidden transition-transform duration-300',
              isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            )}
          >
            <Sidebar onClose={closeSidebar} className="lg:hidden">
              {sidebarContent}
            </Sidebar>
          </div>
        </>
      )}

      {/* 主內容區域 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 頂部導航 */}
        <Header
          title={title}
          breadcrumbs={breadcrumbs}
          onMenuClick={showSidebar ? toggleSidebar : undefined}
          actions={headerActions}
          showMenuButton={showSidebar}
        />

        {/* 主要內容 */}
        <main
          className={cn(
            'flex-1 overflow-auto',
            'bg-gray-50', // 淺灰背景
            className
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

// 預設導出
export default AppLayout;