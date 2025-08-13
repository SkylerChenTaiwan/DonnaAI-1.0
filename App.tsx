// 樣式系統包裝器（必須最先載入）
import './src/utils/arrayStyleFixer';
import './src/utils/styleWrapper';
import './src/utils/componentWrapper';
import './src/utils/globalCleaner';

/**
 * DonnaAI - AI 業務助理應用程式
 * 主要應用程式入口點
 */

// 最先載入全域錯誤處理器
import './src/utils/globalErrorHandler';

// 導入 Metro runtime 以支援 Web 版的 HMR
import '@expo/metro-runtime';

// 導入 Web 平台專用樣式
import './src/components/database/web/styles/NotionDatabaseV4.css';

// 導入 Web 字體 polyfill
import './src/utils/webFontPolyfill';

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { AppWithDeveloperMenu } from '@/navigation/AppWithDeveloperMenu';
import { ErrorBoundary } from '@/services/error/ErrorBoundary';
import { errorLogger } from '@/services/error/ErrorLogger';
import { environmentManager } from '@/config/environment';
import { initializeMonitoring } from '@/services/firebase/monitoring';
import { NetworkStatusBar } from '@/components/NetworkStatusBar';


// 載入強制登出工具（用於緊急情況）
import '@/utils/force-logout';
// 載入權限修復工具
import '@/utils/fix-admin-permissions-browser';
// 載入緊急權限修復工具（統一權限系統）
import '@/utils/emergency-permission-fix';

// 開發模式下載入除錯工具
// 暫時停用：這些工具會在頂層執行 Firebase 操作，導致初始化錯誤
if (__DEV__) {
  console.log('🔧 開發工具已停用自動載入，請在登入後手動執行需要的工具');
  console.log('💡 如需強制登出，請在 Console 執行: forceLogout()');
  /*
  import('@/utils/quick-fix-team-sync').catch(err => 
    console.warn('團隊同步修復工具載入失敗:', err)
  );
  import('@/utils/diagnose-permission').catch(err => 
    console.warn('權限診斷工具載入失敗:', err)
  );
  import('@/utils/fix-test-data-permissions').catch(err => 
    console.warn('權限修復工具載入失敗:', err)
  );
  // 自動設置管理員（測試環境）
  import('@/utils/auto-admin-setup').catch(err => 
    console.warn('自動管理員設置失敗:', err)
  );
  // 立即修復權限
  import('@/utils/immediate-permission-fix').catch(err => 
    console.warn('立即權限修復失敗:', err)
  );
  // 載入權限調試工具
  import('@/utils/debug-permission-mismatch').catch(err => 
    console.warn('權限調試工具載入失敗:', err)
  );
  */
}

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
        additionalData: { source: 'console.error' } 
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
        
        // 初始化監控服務（Crashlytics 和 Performance）
        await initializeMonitoring();
        
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
      <View style={styles.container}>
        <NetworkStatusBar />
        <AppWithDeveloperMenu />
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});