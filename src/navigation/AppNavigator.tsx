/**
 * 主應用程式導航器
 */

import React, { useEffect, useState } from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { DesignSystem } from '@/theme/designSystem';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
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
import { EditProfileModal } from '@/screens/modals/EditProfileModal';
import { AddRecordModal } from '@/components/database/AddRecordModal';
import { AddUserModal } from '@/components/personnel/AddUserModal';
import { CreateUserModal } from '@/screens/admin/modals/CreateUserModal';
import { EditUserModal } from '@/screens/admin/modals/EditUserModal';
import { CustomerDetailScreen } from '@/screens/database/CustomerDetailScreen';
import { RecordDetailScreen } from '@/screens/database/RecordDetailScreen';
import { TaskDetailScreen } from '@/screens/database/TaskDetailScreen';
import { StateInspector } from '@/components/developer/StateInspector';
import { ErrorLogsScreen } from '@/screens/developer/ErrorLogsScreen';
import { PerformanceMonitorScreen } from '@/screens/developer/PerformanceMonitorScreen';
import { TestScreen } from '@/screens/developer/TestScreen';
import { HelpSupportScreen } from '@/screens/settings/HelpSupportScreen';
import { PrivacyPolicyScreen } from '@/screens/settings/PrivacyPolicyScreen';
import { environmentManager } from '@/config/environment';

// Admin 頁面導入
// Super Admin 頁面
import { SuperAdminDashboard } from '@/screens/superadmin/SuperAdminDashboard';
import { OrganizationsScreen } from '@/screens/superadmin/OrganizationsScreen';
import { CreateOrganizationScreen } from '@/screens/superadmin/CreateOrganizationScreen';
import { OrganizationDetailScreen } from '@/screens/superadmin/OrganizationDetailScreen';
import { PlatformDashboard } from '@/screens/superadmin/PlatformDashboard';

// Enterprise Admin 頁面
import { AdminDashboard } from '@/screens/admin/AdminDashboard';
import { UserManagementScreen } from '@/screens/admin/UserManagementScreen';
import { ToolManagementScreen } from '@/screens/admin/ToolManagementScreen';
import { DataImportScreen } from '@/screens/admin/DataImportScreen';
import { UsageReportsScreen } from '@/screens/admin/UsageReportsScreen';

// Admin 通用頁面
import { AdminSettings } from '@/screens/admin/AdminSettings';

// WebApp 容器
import { WebAppContainer } from '@/screens/tools/WebAppContainer';

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
        style={{ backgroundColor: '#FFFFFF' }}
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
            {/* 設定相關頁面 */}
            <Stack.Screen
              name="HelpSupport"
              component={HelpSupportScreen}
              options={{ 
                headerShown: true,
                title: '說明與支援',
                headerTintColor: '#1A1A1A',
                headerBackTitleVisible: false,
              }}
            />
            <Stack.Screen
              name="PrivacyPolicy"
              component={PrivacyPolicyScreen}
              options={{ 
                headerShown: true,
                title: '隱私權政策',
                headerTintColor: '#1A1A1A',
                headerBackTitleVisible: false,
              }}
            />
            
            {/* Admin 頁面路由 */}
            {/* Super Admin 頁面 */}
            <Stack.Screen
              name="SuperAdminDashboard"
              component={SuperAdminDashboard}
              options={{ 
                headerShown: true,
                title: 'Super Admin 控制台',
                headerTintColor: '#1A1A1A',
                headerBackTitleVisible: false,
              }}
            />
            <Stack.Screen
              name="OrganizationsScreen"
              component={OrganizationsScreen}
              options={({ navigation }) => ({ 
                headerShown: true,
                title: '組織管理',
                headerTintColor: '#1A1A1A',
                headerBackTitleVisible: false,
                headerRight: () => (
                  <TouchableOpacity
                    style={{
                      marginRight: 16,
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: DesignSystem.colors.primary,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                    onPress={() => navigation.navigate('CreateOrganizationScreen')}
                  >
                    <Ionicons name="add" size={20} color={DesignSystem.colors.text.inverse} />
                  </TouchableOpacity>
                ),
              })}
            />
            <Stack.Screen
              name="CreateOrganizationScreen"
              component={CreateOrganizationScreen}
              options={{ 
                headerShown: true,
                title: '建立組織',
                headerTintColor: '#1A1A1A',
                headerBackTitleVisible: false,
              }}
            />
            <Stack.Screen
              name="OrganizationDetailScreen"
              component={OrganizationDetailScreen}
              options={{ 
                headerShown: true,
                title: '組織詳情',
                headerTintColor: '#1A1A1A',
                headerBackTitleVisible: false,
              }}
            />
            <Stack.Screen
              name="PlatformDashboard"
              component={PlatformDashboard}
              options={{ 
                headerShown: true,
                title: '平台統計',
                headerTintColor: '#1A1A1A',
                headerBackTitleVisible: false,
              }}
            />
            
            {/* Enterprise Admin 頁面 */}
            <Stack.Screen
              name="AdminDashboard"
              component={AdminDashboard}
              options={{ 
                headerShown: true,
                title: '管理中心',
                headerTintColor: '#1A1A1A',
                headerBackTitleVisible: false,
              }}
            />
            <Stack.Screen
              name="UserManagementScreen"
              component={UserManagementScreen}
              options={{ 
                headerShown: true,
                title: '用戶管理',
                headerTintColor: '#1A1A1A',
                headerBackTitleVisible: false,
              }}
            />
            <Stack.Screen
              name="ToolManagementScreen"
              component={ToolManagementScreen}
              options={{ 
                headerShown: true,
                title: '工具管理',
                headerTintColor: '#1A1A1A',
                headerBackTitleVisible: false,
              }}
            />
            <Stack.Screen
              name="DataImportScreen"
              component={DataImportScreen}
              options={{ 
                headerShown: true,
                title: '資料匯入',
                headerTintColor: '#1A1A1A',
                headerBackTitleVisible: false,
              }}
            />
            <Stack.Screen
              name="UsageReportsScreen"
              component={UsageReportsScreen}
              options={{ 
                headerShown: true,
                title: '使用報表',
                headerTintColor: '#1A1A1A',
                headerBackTitleVisible: false,
              }}
            />
            
            {/* Admin 通用頁面 */}
            <Stack.Screen
              name="AdminSettings"
              component={AdminSettings}
              options={{ 
                headerShown: true,
                title: '管理員設定',
                headerTintColor: '#1A1A1A',
                headerBackTitleVisible: false,
              }}
            />
            
            {/* WebApp 容器 */}
            <Stack.Screen
              name="WebApp"
              component={WebAppContainer}
              options={{ 
                headerShown: false, // WebAppContainer 已有自己的 header
              }}
            />
            
            <Stack.Group screenOptions={{ 
              presentation: 'modal', 
              headerShown: true,
              headerTintColor: '#1A1A1A',  // 設定返回按鈕和標題顏色為灰黑色
              headerBackTitleVisible: false,  // 隱藏返回按鈕旁的文字
            }}>
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
              <Stack.Screen
                name="EditProfileModal"
                component={EditProfileModal}
                options={{ 
                  title: '編輯個人資料'
                }}
              />
              <Stack.Screen
                name="AddRecordModal"
                component={AddRecordModal}
                options={{ title: '新增記錄' }}
              />
              <Stack.Screen
                name="AddUserModal"
                component={AddUserModal}
                options={{ title: '新增下屬' }}
              />
              
              {/* Admin Modals */}
              <Stack.Screen
                name="CreateUserModal"
                component={CreateUserModal}
                options={{ title: '建立新用戶' }}
              />
              <Stack.Screen
                name="EditUserModal"
                component={EditUserModal}
                options={{ title: '編輯用戶' }}
              />
            </Stack.Group>
            
            {/* 開發者工具畫面（只在開發模式顯示） */}
            {environmentManager.isDevToolsEnabled() && (
              <Stack.Group screenOptions={{ 
                headerShown: true,
                headerTintColor: '#1A1A1A',  // 設定返回按鈕和標題顏色為灰黑色
                headerBackTitleVisible: false,  // 隱藏返回按鈕旁的文字
              }}>
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
                <Stack.Screen
                  name="TestScreen"
                  component={TestScreen}
                  options={{ title: '系統測試' }}
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