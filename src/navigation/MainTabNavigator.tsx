/**
 * 主要標籤導航器
 */

import React, { useState, useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import { useAuthStore } from '@/stores/authStore';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { EnhancedDashboard } from '@/screens/dashboard/EnhancedDashboard';
import { DatabaseScreen } from '@/screens/database/DatabaseScreen';
import { ToolsScreen } from '@/screens/tools/ToolsScreen';
import { SettingsScreen } from '@/screens/settings/SettingsScreen';
import { ActionPopover } from '@/components/common/ActionPopover';
import { MainTabParamList, RootStackParamList } from '@/types/navigation';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabNavigator: React.FC = () => {
  const { user } = useAuthStore();
  const navigation = useNavigation<NavigationProp>();
  const [showActionModal, setShowActionModal] = useState(false);
  const addButtonRef = useRef<View>(null);

  const handleActionSelect = (action: { id: string; type: string }) => {
    setShowActionModal(false);
    
    switch (action.type) {
      case 'customer':
        navigation.navigate('CreateCustomerModal');
        break;
      case 'record':
        navigation.navigate('CreateRecordModal');
        break;
      case 'task':
        navigation.navigate('CreateTaskModal');
        break;
    }
  };

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            switch (route.name) {
              case 'Home':
                iconName = focused ? 'analytics' : 'analytics-outline';
                break;
              case 'Database':
                iconName = focused ? 'people' : 'people-outline';
                break;
              case 'AddAction':
                return (
                  <View style={styles.addButtonContainer} ref={addButtonRef}>
                    <View style={styles.addButton}>
                      <Ionicons name="add" size={24} color="#FFFFFF" />
                    </View>
                  </View>
                );
              case 'Tools':
                iconName = focused ? 'build' : 'build-outline';
                break;
              case 'Settings':
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
          height: 88,
          paddingBottom: 20, // 增加底部安全間距
          paddingTop: 10,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
          position: 'absolute',
          bottom: 0,
          elevation: 0,
          shadowOpacity: 0,
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
          name="Home"
          component={EnhancedDashboard}
          options={{
            title: '首頁',
            headerShown: false,
          }}
        />

        <Tab.Screen
          name="Database"
          component={DatabaseScreen}
          options={{
            title: '資料庫',
            headerShown: false,
          }}
        />

        <Tab.Screen
          name="AddAction"
          component={EmptyComponent}
          options={{
            title: '',
            tabBarLabel: () => null,
            tabBarOnPress: (e) => {
              e.preventDefault();
              setShowActionModal(true);
            },
          }}
        />

        <Tab.Screen
          name="Tools"
          component={ToolsScreen}
          options={{
            title: '小工具',
            headerShown: false,
          }}
        />

        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            title: '設定',
            headerTitle: '設定',
          }}
        />
      </Tab.Navigator>

      <ActionPopover
        visible={showActionModal}
        onClose={() => setShowActionModal(false)}
        onAction={handleActionSelect}
        fromRef={addButtonRef}
      />
    </>
  );
};

// 空元件用於 AddAction tab
const EmptyComponent: React.FC = () => null;

const styles = StyleSheet.create({
  addButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});