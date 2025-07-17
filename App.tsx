/**
 * DonnaAI - AI 業務助理應用程式
 * 主要應用程式入口點
 */

import React, { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { AppNavigator } from '@/navigation/AppNavigator';
import { ErrorBoundary } from '@/services/error/ErrorBoundary';
import { DeveloperMenu } from '@/components/developer/DeveloperMenu';
import { errorLogger } from '@/services/error/ErrorLogger';
import { environmentManager } from '@/config/environment';

// 防止自動隱藏啟動畫面
SplashScreen.preventAutoHideAsync();

// 全域錯誤處理
if (__DEV__) {
  // 開發模式下的錯誤處理
  const originalConsoleError = console.error;
  console.error = (...args) => {
    originalConsoleError(...args);
    
    // 過濾一些不需要記錄的警告
    const message = args[0]?.toString() || '';
    if (message.includes('Warning:') || 
        message.includes('VirtualizedLists') ||
        message.includes('Each child in a list')) {
      return;
    }
    
    // 記錄真正的錯誤
    if (args[0] instanceof Error) {
      errorLogger.logError(args[0], { 
        context: { source: 'console.error' } 
      });
    }
  };
}

export default function App() {
  useEffect(() => {
    // 初始化應用程式
    const initializeApp = async () => {
      try {
        // 驗證環境配置
        environmentManager.getConfig();
        
        // 隱藏啟動畫面
        await SplashScreen.hideAsync();
        
        if (__DEV__) {
          console.log('🚀 DonnaAI 已啟動 - 環境:', environmentManager.getConfig().name);
        }
      } catch (error) {
        console.error('應用程式初始化失敗:', error);
        // 即使初始化失敗也要隱藏啟動畫面
        await SplashScreen.hideAsync();
      }
    };
    
    initializeApp();
  }, []);

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // 在開發模式下記錄更多資訊
        if (__DEV__) {
          console.error('應用程式最頂層錯誤:', error);
          console.error('錯誤資訊:', errorInfo);
        }
      }}
    >
      <AppNavigator />
      {/* 開發者工具（只在開發模式顯示） */}
      {environmentManager.isDevToolsEnabled() && <DeveloperMenu />}
    </ErrorBoundary>
  );
}