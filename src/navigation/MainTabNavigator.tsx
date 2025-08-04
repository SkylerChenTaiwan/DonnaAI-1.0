/**
 * 主要標籤導航器
 */

import React, { useState, useRef, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from '@/components/common/Icon';
import { View, StyleSheet } from 'react-native';
import { useAuthStore } from '@/stores/authStore';
import { useAnalyticsStore } from '@/stores/analyticsStore';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeScreen } from '@/screens/home/HomeScreen';
import { DatabaseScreen } from '@/screens/database/DatabaseScreen';
import { ToolsScreen } from '@/screens/tools/ToolsScreen';
import { PersonnelScreen } from '@/screens/personnel/PersonnelScreen';
import { SettingsScreen } from '@/screens/settings/SettingsScreen';
import { FirebaseTestScreen } from '@/screens/test/FirebaseTestScreen';
import { ActionPopover } from '@/components/common/ActionPopover';
import AnalyticsDialog from '@/components/analytics/AnalyticsDialog';
import { MainTabParamList, RootStackParamList } from '@/types/navigation';
import { DesignSystem } from '@/theme/designSystem';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabNavigator = () => {
  const { user, mode } = useAuthStore();
  const { isDialogOpen, openDialog, closeDialog } = useAnalyticsStore();
  const navigation = useNavigation<NavigationProp>();
  const [showActionModal, setShowActionModal] = useState(false);
  const addButtonRef = useRef<View>(null);
  const tabBarRef = useRef<View>(null);
  const [tabBarHeight, setTabBarHeight] = useState(88);

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

  const handleManagerActionPress = () => {
    // 主管模式下點擊中間按鈕，顯示智能分析對話框
    openDialog();
  };

  return (
    <>
      <View 
        ref={tabBarRef}
        onLayout={(event) => {
          const { height } = event.nativeEvent.layout;
          setTabBarHeight(height);
        }}
        style={{ flex: 1 }}
      >
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
                  if (mode === 'manager') {
                    return (
                      <View style={styles.addButtonContainer} ref={addButtonRef}>
                        <View style={[styles.searchButton]}>
                          <Icon name="search" size={20} color={DesignSystem.colors.text.inverse} />
                        </View>
                      </View>
                    );
                  }
                  return (
                    <View style={styles.addButtonContainer} ref={addButtonRef}>
                      <View style={styles.addButton}>
                        <View style={styles.plusIcon}>
                          <View style={styles.plusHorizontal} />
                          <View style={styles.plusVertical} />
                        </View>
                      </View>
                    </View>
                  );
                case 'Tools':
                  // 主管模式下顯示人事圖標
                  if (mode === 'manager') {
                    iconName = focused ? 'people-circle' : 'people-circle-outline';
                  } else {
                    iconName = focused ? 'build' : 'build-outline';
                  }
                  break;
                case 'Settings':
                  iconName = focused ? 'person' : 'person-outline';
                  break;
                default:
                  iconName = 'ellipse-outline';
              }

              return <Icon name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: DesignSystem.colors.text.primary,
            tabBarInactiveTintColor: '#999999',
            tabBarStyle: {
              height: 88,
              paddingBottom: 20, // 增加底部安全間距
              paddingTop: 10,
              backgroundColor: '#FFFFFF',
              borderTopWidth: 1,
              borderTopColor: '#E5E7EB',
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
              borderBottomColor: '#E3E1DC',
            },
            headerTitleStyle: {
              fontSize: 18,
              fontWeight: '600',
              color: '#1A1A1A',
            },
          })}
        >
          <Tab.Screen
            name="Home"
            component={HomeScreen}
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
            }}
            listeners={{
              tabPress: (e) => {
                e.preventDefault();
                if (mode === 'manager') {
                  handleManagerActionPress();
                } else {
                  setShowActionModal(true);
                }
              },
            }}
          />

          <Tab.Screen
            name="Tools"
            component={mode === 'manager' ? PersonnelScreen : ToolsScreen}
            options={{
              title: mode === 'manager' ? '人事' : '小工具',
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

          {__DEV__ && (
            <Tab.Screen
              name="FirebaseTest"
              component={FirebaseTestScreen}
              options={{
                title: '測試',
                headerTitle: 'Firebase 測試',
              }}
            />
          )}
        </Tab.Navigator>
      </View>

      <ActionPopover
        visible={showActionModal}
        onClose={() => setShowActionModal(false)}
        onAction={handleActionSelect}
        fromRef={addButtonRef}
        tabBarHeight={tabBarHeight}
      />
      
      <AnalyticsDialog
        visible={isDialogOpen}
        onClose={closeDialog}
      />
    </>
  );
};

// 空元件用於 AddAction tab
const EmptyComponent = () => null;

const styles = StyleSheet.create({
  addButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DesignSystem.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: DesignSystem.colors.gray[700], // #404040 深灰色以保持辨識度
    alignItems: 'center',
    justifyContent: 'center',
    // 較輕的陰影以配合灰色調
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  plusIcon: {
    width: 20,
    height: 20,
    position: 'relative',
  },
  plusHorizontal: {
    position: 'absolute',
    left: 0,
    top: '50%',
    width: '100%',
    height: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 1.5,
    transform: [{ translateY: -1.5 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  plusVertical: {
    position: 'absolute',
    left: '50%',
    top: 0,
    width: 3,
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 1.5,
    transform: [{ translateX: -1.5 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
});