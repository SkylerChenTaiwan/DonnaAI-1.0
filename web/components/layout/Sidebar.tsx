/**
 * 側邊導航欄元件
 * 提供可摺疊的導航選單，支援響應式設計
 */
"use client";

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  DashboardIcon, 
  UsersIcon, 
  DocumentIcon, 
  TaskIcon, 
  TeamIcon, 
  SettingsIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XIcon
} from '@/components/ui/icons';

interface SidebarProps {
  children?: ReactNode;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onClose?: () => void;
  className?: string;
}

export function Sidebar({
  children,
  isCollapsed = false,
  onToggleCollapse,
  onClose,
  className,
}: SidebarProps) {
  return (
    <div
      className={cn(
        'h-full bg-white border-r border-gray-200',
        'flex flex-col',
        className
      )}
    >
      {/* 側邊欄標題區域 */}
      <div
        className={cn(
          'flex items-center justify-between',
          'px-4 py-6 border-b border-gray-200',
          isCollapsed && 'px-2'
        )}
      >
        {/* Logo 和標題 */}
        <div className={cn('flex items-center', isCollapsed && 'justify-center')}>
          <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">D</span>
          </div>
          {!isCollapsed && (
            <div className="ml-3">
              <h2 className="text-lg font-semibold text-gray-900">DonnaAI</h2>
              <p className="text-xs text-gray-500">管理平台</p>
            </div>
          )}
        </div>

        {/* 桌面版摺疊按鈕 */}
        {onToggleCollapse && (
          <button
            type="button"
            className={cn(
              'hidden lg:block p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100',
              'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-500',
              isCollapsed && 'mx-auto'
            )}
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? '展開側邊欄' : '摺疊側邊欄'}
          >
            {isCollapsed ? (
              <ChevronRightIcon className="h-4 w-4" />
            ) : (
              <ChevronLeftIcon className="h-4 w-4" />
            )}
          </button>
        )}

        {/* 手機版關閉按鈕 */}
        {onClose && (
          <button
            type="button"
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-500"
            onClick={onClose}
            aria-label="關閉選單"
          >
            <XIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* 導航內容 */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {children || <DefaultNavigation isCollapsed={isCollapsed} />}
      </nav>

      {/* 底部區域 */}
      <div
        className={cn(
          'border-t border-gray-200 p-4',
          isCollapsed && 'p-2'
        )}
      >
        <UserProfile isCollapsed={isCollapsed} />
      </div>
    </div>
  );
}

// 預設導航項目
function DefaultNavigation({ isCollapsed }: { isCollapsed: boolean }) {
  const pathname = usePathname();

  const navigationItems = [
    {
      name: '儀表板',
      href: '/dashboard',
      icon: DashboardIcon,
    },
    {
      name: '客戶管理',
      href: '/customers',
      icon: UsersIcon,
    },
    {
      name: '記錄管理',
      href: '/records',
      icon: DocumentIcon,
    },
    {
      name: '任務管理',
      href: '/tasks',
      icon: TaskIcon,
    },
    {
      name: '人員管理',
      href: '/personnel',
      icon: TeamIcon,
    },
    {
      name: '設定',
      href: '/settings',
      icon: SettingsIcon,
    },
  ];

  return (
    <>
      {navigationItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'group flex items-center rounded-lg px-3 py-2 text-sm font-medium',
              'transition-colors duration-200',
              isActive
                ? 'bg-gray-900 text-white'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
              isCollapsed && 'justify-center px-2'
            )}
            title={isCollapsed ? item.name : undefined}
          >
            <Icon
              className={cn(
                'h-5 w-5 flex-shrink-0',
                isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-500',
                !isCollapsed && 'mr-3'
              )}
            />
            {!isCollapsed && item.name}
          </Link>
        );
      })}
    </>
  );
}

// 用戶資料顯示
function UserProfile({ isCollapsed }: { isCollapsed: boolean }) {
  // 這裡應該從認證上下文獲取用戶資訊
  const user = {
    name: '管理員',
    email: 'admin@donna.ai',
    avatar: null,
  };

  if (isCollapsed) {
    return (
      <div className="flex justify-center">
        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
          <span className="text-sm font-medium text-gray-700">
            {user.name.charAt(0)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
        <span className="text-sm font-medium text-gray-700">
          {user.name.charAt(0)}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
        <p className="text-xs text-gray-500 truncate">{user.email}</p>
      </div>
    </div>
  );
}


// 預設導出
export default Sidebar;