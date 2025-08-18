/**
 * 應用程式頂部導航元件
 * 包含標題、麵包屑導航、用戶操作和響應式選單
 */

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { MenuIcon, ChevronRightIcon } from '@/components/ui/icons';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface HeaderProps {
  title?: string;
  breadcrumbs?: Breadcrumb[];
  onMenuClick?: () => void;
  actions?: ReactNode;
  showMenuButton?: boolean;
  className?: string;
}

export function Header({
  title,
  breadcrumbs,
  onMenuClick,
  actions,
  showMenuButton = true,
  className,
}: HeaderProps) {
  return (
    <header
      className={cn(
        'bg-white border-b border-gray-200',
        'px-4 lg:px-6 py-4',
        'flex items-center justify-between',
        'sticky top-0 z-30',
        className
      )}
    >
      <div className="flex items-center space-x-4">
        {/* 手機版選單按鈕 */}
        {showMenuButton && onMenuClick && (
          <button
            type="button"
            className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-500"
            onClick={onMenuClick}
            aria-label="開啟選單"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
        )}

        <div className="flex flex-col">
          {/* 麵包屑導航 */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                  {index > 0 && (
                    <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                  )}
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="hover:text-gray-700 transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-gray-900 font-medium">
                      {crumb.label}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          )}

          {/* 頁面標題 */}
          {title && (
            <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">
              {title}
            </h1>
          )}
        </div>
      </div>

      {/* 右側操作區域 */}
      {actions && (
        <div className="flex items-center space-x-3">
          {actions}
        </div>
      )}
    </header>
  );
}


// 預設導出
export default Header;