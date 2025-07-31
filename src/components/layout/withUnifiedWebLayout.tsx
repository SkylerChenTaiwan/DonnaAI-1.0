/**
 * 高階元件：為頁面添加統一的 Web 佈局
 * 
 * Created by: backend-architect agent
 * Purpose: 簡化 Web 響應式佈局的應用
 */

import React from 'react';
import { Platform } from 'react-native';
import { isDesktopWeb, isTabletWeb } from '@/utils/web-detector';
import { UnifiedWebLayout } from './UnifiedWebLayout';

export interface WithWebLayoutOptions {
  scrollable?: boolean;
  maxWidth?: number;
  showSidebar?: boolean;
}

export function withUnifiedWebLayout<P extends object>(
  Component: React.ComponentType<P>,
  options: WithWebLayoutOptions = {}
): React.ComponentType<P> {
  const {
    scrollable = true,
    maxWidth = 1200,
    showSidebar = true,
  } = options;

  return (props: P) => {
    // 檢查是否應該使用 Web 佈局
    const shouldUseWebLayout = 
      Platform.OS === 'web' && 
      (isDesktopWeb() || isTabletWeb());

    if (shouldUseWebLayout) {
      return (
        <UnifiedWebLayout
          scrollable={scrollable}
          maxWidth={maxWidth}
          showSidebar={showSidebar}
        >
          <Component {...props} />
        </UnifiedWebLayout>
      );
    }

    // 其他平台直接返回原始元件
    return <Component {...props} />;
  };
}