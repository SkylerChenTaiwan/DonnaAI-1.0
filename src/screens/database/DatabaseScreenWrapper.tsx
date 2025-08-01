/**
 * DatabaseScreen 包裝元件 - 用於診斷路由問題
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DatabaseScreen } from './DatabaseScreen';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';

export const DatabaseScreenWrapper: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  
  // 記錄每次進入此頁面
  useEffect(() => {
    console.log('🔍 DatabaseScreenWrapper - 掛載', {
      routeName: route.name,
      params: route.params,
      navigationState: navigation.getState(),
      timestamp: new Date().toISOString(),
    });
    
    return () => {
      console.log('👋 DatabaseScreenWrapper - 卸載');
    };
  }, []);
  
  // 記錄焦點變化
  useFocusEffect(
    React.useCallback(() => {
      console.log('✅ DatabaseScreenWrapper - 獲得焦點');
      return () => {
        console.log('❌ DatabaseScreenWrapper - 失去焦點');
      };
    }, [])
  );
  
  // 正常渲染 DatabaseScreen
  return <DatabaseScreen />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  debugInfo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    padding: 10,
    zIndex: 9999,
  },
  debugText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'monospace',
  },
});