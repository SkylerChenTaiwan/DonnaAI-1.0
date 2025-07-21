/**
 * 主應用程式導航器
 */

import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAuthStore } from '@/stores/authStore';
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { RootStackParamList } from '@/types/navigation';
import { CreateCustomerModal } from '@/screens/modals/CreateCustomerModal';
import { CreateRecordModal } from '@/screens/modals/CreateRecordModal';
import { CreateTaskModal } from '@/screens/modals/CreateTaskModal';
import { EditCustomerModal } from '@/screens/modals/EditCustomerModal';
import { EditRecordModal } from '@/screens/modals/EditRecordModal';
import { EditTaskModal } from '@/screens/modals/EditTaskModal';
import { CustomerDetailScreen } from '@/screens/database/CustomerDetailScreen';
import { RecordDetailScreen } from '@/screens/database/RecordDetailScreen';
import { TaskDetailScreen } from '@/screens/database/TaskDetailScreen';
import { StateInspector } from '@/components/developer/StateInspector';
import { ErrorLogsScreen } from '@/screens/developer/ErrorLogsScreen';
import { PerformanceMonitorScreen } from '@/screens/developer/PerformanceMonitorScreen';
import { environmentManager } from '@/config/environment';

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  const { isAuthenticated, isLoading, initializeAuth } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // 初始化認證監聽器
    const unsubscribe = initializeAuth();
    setIsInitialized(true);

    return () => {
      unsubscribe();
    };
  }, [initializeAuth]);

  // 顯示載入畫面直到認證狀態確定
  if (!isInitialized || isLoading) {
    return (
      <LoadingSpinner 
        message="正在載入 DonnaAI..." 
        style={{ backgroundColor: '#F7F6F3' }}
      />
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
          headerShown: false,
          animationTypeForReplace: isAuthenticated ? 'push' : 'pop',
        }}
      >
        {isAuthenticated ? (
          <>
            <Stack.Screen
              name="MainTabs"
              component={MainTabNavigator}
              options={{
                headerShown: false,
                animationTypeForReplace: 'push',
              }}
            />
            {/* 詳細檢視頁面 */}
            <Stack.Screen
              name="CustomerDetail"
              component={CustomerDetailScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="RecordDetail"
              component={RecordDetailScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="TaskDetail"
              component={TaskDetailScreen}
              options={{ headerShown: false }}
            />
            <Stack.Group screenOptions={{ presentation: 'modal', headerShown: true }}>
              <Stack.Screen
                name="CreateCustomerModal"
                component={CreateCustomerModal}
                options={{ title: '新增客戶' }}
              />
              <Stack.Screen
                name="CreateRecordModal"
                component={CreateRecordModal}
                options={{ title: '新增紀錄' }}
              />
              <Stack.Screen
                name="CreateTaskModal"
                component={CreateTaskModal}
                options={{ title: '新增任務' }}
              />
              <Stack.Screen
                name="EditCustomer"
                component={EditCustomerModal}
                options={{ title: '編輯客戶' }}
              />
              <Stack.Screen
                name="EditRecord"
                component={EditRecordModal}
                options={{ title: '編輯紀錄' }}
              />
              <Stack.Screen
                name="EditTask"
                component={EditTaskModal}
                options={{ title: '編輯任務' }}
              />
            </Stack.Group>
            
            {/* 開發者工具畫面（只在開發模式顯示） */}
            {environmentManager.isDevToolsEnabled() && (
              <Stack.Group screenOptions={{ headerShown: true }}>
                <Stack.Screen
                  name="StateInspector"
                  component={StateInspector}
                  options={{ title: '狀態檢查工具' }}
                />
                <Stack.Screen
                  name="ErrorLogs"
                  component={ErrorLogsScreen}
                  options={{ title: '錯誤日誌' }}
                />
                <Stack.Screen
                  name="PerformanceMonitor"
                  component={PerformanceMonitorScreen}
                  options={{ title: '效能監控' }}
                />
              </Stack.Group>
            )}
          </>
        ) : (
          <Stack.Screen
            name="Auth"
            component={AuthNavigator}
            options={{
              animationTypeForReplace: 'pop',
            }}
          />
        )}
      </Stack.Navigator>
  );
};