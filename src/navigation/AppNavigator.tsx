/**
 * 主應用程式導航器
 */

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAuthStore } from '@/stores/authStore';
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { RootStackParamList } from '@/types/navigation';
import { CreateCustomerModal } from '@/screens/modals/CreateCustomerModal';
import { CreateRecordModal } from '@/screens/modals/CreateRecordModal';
import { CreateTaskModal } from '@/screens/modals/CreateTaskModal';

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
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
        style={{ backgroundColor: '#FFFFFF' }}
      />
    );
  }

  return (
    <NavigationContainer>
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
            </Stack.Group>
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
    </NavigationContainer>
  );
};