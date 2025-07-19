/**
 * 包含開發者選單的導航容器
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AppNavigator } from './AppNavigator';
import { DeveloperMenu } from '@/components/developer/DeveloperMenu';
import { environmentManager } from '@/config/environment';

export const AppWithDeveloperMenu = () => {
  return (
    <NavigationContainer>
      <AppNavigator />
      {/* 開發者工具（只在開發模式顯示） */}
      {environmentManager.isDevToolsEnabled() && <DeveloperMenu />}
    </NavigationContainer>
  );
};