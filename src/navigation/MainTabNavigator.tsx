/**
 * 主要標籤導航器
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { SalespersonDashboard } from '@/screens/dashboard/SalespersonDashboard';
import { ManagerDashboard } from '@/screens/dashboard/ManagerDashboard';
import { AdminDashboard } from '@/screens/dashboard/AdminDashboard';
import { CustomersScreen } from '@/screens/customers/CustomersScreen';
import { MeetingsScreen } from '@/screens/meetings/MeetingsScreen';
import { ProfileScreen } from '@/screens/profile/ProfileScreen';

export type MainTabParamList = {
  Dashboard: undefined;
  Customers: undefined;
  Meetings: undefined;
  Tools: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabNavigator: React.FC = () => {
  const { user } = useAuthStore();

  // 根據使用者角色決定儀表板元件
  const getDashboardComponent = () => {
    switch (user?.role) {
      case 'admin':
        return AdminDashboard;
      case 'manager':
        return ManagerDashboard;
      case 'salesperson':
      default:
        return SalespersonDashboard;
    }
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'analytics' : 'analytics-outline';
              break;
            case 'Customers':
              iconName = focused ? 'people' : 'people-outline';
              break;
            case 'Meetings':
              iconName = focused ? 'calendar' : 'calendar-outline';
              break;
            case 'Tools':
              iconName = focused ? 'build' : 'build-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'ellipse-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
          paddingTop: 8,
          paddingBottom: 8,
          height: 88,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#E5E5EA',
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '600',
          color: '#1C1C1E',
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={getDashboardComponent()}
        options={{
          title: '儀表板',
          headerTitle: `歡迎回來，${user?.name || ''}`,
        }}
      />

      <Tab.Screen
        name="Customers"
        component={CustomersScreen}
        options={{
          title: '客戶',
          headerTitle: '客戶管理',
        }}
      />

      <Tab.Screen
        name="Meetings"
        component={MeetingsScreen}
        options={{
          title: '會議',
          headerTitle: '會議記錄',
        }}
      />

      <Tab.Screen
        name="Tools"
        component={ProfileScreen} // 暫時使用 ProfileScreen，稍後會建立 ToolsScreen
        options={{
          title: '工具',
          headerTitle: '業務工具',
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: '個人',
          headerTitle: '個人資料',
        }}
      />
    </Tab.Navigator>
  );
};