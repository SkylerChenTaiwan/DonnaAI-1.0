import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import * as Network from 'expo-network';
import { Ionicons } from '@expo/vector-icons';

export function NetworkStatusBar() {
  const [isOnline, setIsOnline] = useState(true);
  const [showBar, setShowBar] = useState(false);
  const slideAnim = new Animated.Value(-50);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const checkNetworkStatus = async () => {
      try {
        const networkState = await Network.getNetworkStateAsync();
        const online = networkState.isConnected === true && networkState.isInternetReachable === true;
        
        if (online !== isOnline) {
          setIsOnline(online);
          setShowBar(!online);
          
          // 動畫效果
          if (!online) {
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }).start();
          } else {
            // 線上時顯示綠色提示 2 秒後隱藏
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }).start();
            
            setTimeout(() => {
              Animated.timing(slideAnim, {
                toValue: -50,
                duration: 300,
                useNativeDriver: true,
              }).start(() => setShowBar(false));
            }, 2000);
          }
        }
      } catch (error) {
        console.error('檢查網路狀態失敗:', error);
      }
    };

    // 立即檢查一次
    checkNetworkStatus();

    // 每 5 秒檢查一次網路狀態
    intervalId = setInterval(checkNetworkStatus, 5000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isOnline]);

  if (!showBar) return null;

  return (
    <Animated.View 
      style={[
        styles.container,
        isOnline ? styles.online : styles.offline,
        { transform: [{ translateY: slideAnim }] }
      ]}
    >
      <View style={styles.content}>
        <Ionicons 
          name={isOnline ? "wifi" : "wifi-outline"} 
          size={16} 
          color="white" 
          style={styles.icon}
        />
        <Text style={styles.text}>
          {isOnline ? '已恢復網路連線' : '目前離線中 - 資料將在連線後自動同步'}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingTop: 50, // 留出狀態列空間
    paddingBottom: 10,
    paddingHorizontal: 15,
  },
  online: {
    backgroundColor: '#10B981', // 綠色
  },
  offline: {
    backgroundColor: '#EF4444', // 紅色
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});