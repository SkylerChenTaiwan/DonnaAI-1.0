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

const Stack = createStackNavigator();

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
          <Stack.Screen
            name="Main"
            component={MainTabNavigator}
            options={{
              animationTypeForReplace: 'push',
            }}
          />
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