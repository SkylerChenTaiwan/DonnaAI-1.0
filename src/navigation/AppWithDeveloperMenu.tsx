/**
 * 包含開發者選單的導航容器
 */

import React from 'react';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { AppNavigator } from './AppNavigator';
import { DeveloperMenu } from '@/components/developer/DeveloperMenu';
import { environmentManager } from '@/config/environment';
import { RootStackParamList } from '@/types/navigation';
import { Platform } from 'react-native';

const linking: LinkingOptions<RootStackParamList> = {
  enabled: Platform.OS === 'web',
  prefixes: ['https://donnaai-5e601.web.app', 'http://localhost:3002'],
  config: {
    screens: {
      // Auth screens
      Login: 'login',
      Register: 'register',
      ForgotPassword: 'forgot-password',
      
      // Main tabs
      MainTabs: {
        screens: {
          Home: 'home',
          Database: 'database',
          Tools: 'tools',
          Personnel: 'personnel',
          Settings: 'settings',
        },
      },
      
      // Detail screens
      CustomerDetail: 'customer/:customerId',
      RecordDetail: 'record/:recordId',
      TaskDetail: 'task/:taskId',
      
      // Admin screens
      SuperAdminDashboard: 'admin/super',
      OrganizationsScreen: 'admin/organizations',
      OrganizationDetailScreen: 'admin/organization/:organizationId',
      AdminDashboard: 'admin/dashboard',
      UserManagementScreen: 'admin/users',
      
      // Other screens
      ProfileScreen: 'profile',
      HelpSupport: 'help',
      PrivacyPolicy: 'privacy',
    },
  },
};

export const AppWithDeveloperMenu = () => {
  return (
    <NavigationContainer linking={linking}>
      <AppNavigator />
      {/* 開發者工具（只在開發模式顯示） */}
      {/* {environmentManager.isDevToolsEnabled() && <DeveloperMenu />} */}
    </NavigationContainer>
  );
};