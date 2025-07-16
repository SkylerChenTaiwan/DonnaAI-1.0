/**
 * DonnaAI - AI 業務助理應用程式
 * 主要應用程式入口點
 */

import React, { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { AppNavigator } from '@/navigation/AppNavigator';

// 防止自動隱藏啟動畫面
SplashScreen.preventAutoHideAsync();

export default function App() {
  useEffect(() => {
    // 應用程式載入完成後隱藏啟動畫面
    const hideSplashScreen = async () => {
      await SplashScreen.hideAsync();
    };
    
    hideSplashScreen();
  }, []);

  return <AppNavigator />;
}