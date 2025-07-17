/**
 * 開發者選單元件
 * 提供開發和除錯功能的快捷入口
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  Platform,
  Animated,
  Vibration,
  DevSettings
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Accelerometer } from 'expo-sensors';
import { environmentManager } from '../../config/environment';
import { errorLogger } from '../../services/error/ErrorLogger';
import { DEV_TOOLS_CONSTANTS, STORAGE_KEYS } from '../../config/constants';

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  description: string;
  action: () => void | Promise<void>;
  destructive?: boolean;
  requiresConfirm?: boolean;
}

/**
 * 開發者選單元件
 * 通過搖晃手勢或其他方式觸發
 */
export const DeveloperMenu: React.FC = () => {
  const navigation = useNavigation<any>();
  const [visible, setVisible] = useState(false);
  const [shakeCount, setShakeCount] = useState(0);
  const slideAnim = useRef(new Animated.Value(300)).current;
  const lastShake = useRef<number>(0);
  
  /**
   * 設定搖晃偵測
   */
  useEffect(() => {
    if (!environmentManager.isDevToolsEnabled()) {
      return;
    }
    
    let subscription: any = null;
    
    const setupAccelerometer = async () => {
      try {
        // 檢查是否可用
        const isAvailable = await Accelerometer.isAvailableAsync();
        if (!isAvailable) {
          console.log('加速度計不可用');
          return;
        }
        
        // 設定更新間隔
        Accelerometer.setUpdateInterval(100);
        
        // 訂閱加速度計數據
        subscription = Accelerometer.addListener(({ x, y, z }) => {
          const acceleration = Math.sqrt(x * x + y * y + z * z);
          const threshold = DEV_TOOLS_CONSTANTS.SHAKE_THRESHOLD;
          
          if (acceleration > threshold) {
            const now = Date.now();
            
            // 防止過於頻繁的觸發
            if (now - lastShake.current > 1000) {
              lastShake.current = now;
              setShakeCount(prev => {
                const newCount = prev + 1;
                
                // 連續搖晃 3 次開啟選單
                if (newCount >= 3) {
                  setVisible(true);
                  Vibration.vibrate(50); // 短暫震動反饋
                  return 0;
                }
                
                // 2 秒後重置計數
                setTimeout(() => setShakeCount(0), 2000);
                return newCount;
              });
            }
          }
        });
      } catch (error) {
        console.error('設定加速度計失敗:', error);
      }
    };
    
    setupAccelerometer();
    
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);
  
  /**
   * 顯示/隱藏動畫
   */
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : 300,
      duration: 300,
      useNativeDriver: true
    }).start();
  }, [visible, slideAnim]);
  
  /**
   * 選單項目定義
   */
  const menuItems: MenuItem[] = [
    {
      id: 'reload',
      title: '重新載入',
      icon: '🔄',
      description: '重新載入應用程式',
      action: () => {
        if (__DEV__) {
          DevSettings.reload();
        } else {
          Alert.alert('提示', '此功能僅在開發模式可用');
        }
      }
    },
    {
      id: 'state',
      title: '檢查狀態',
      icon: '🔍',
      description: '查看應用程式狀態',
      action: () => {
        setVisible(false);
        navigation.navigate('StateInspector');
      }
    },
    {
      id: 'errors',
      title: '錯誤日誌',
      icon: '🐛',
      description: '查看歷史錯誤記錄',
      action: async () => {
        const stats = errorLogger.getStatistics();
        Alert.alert(
          '錯誤統計',
          `總錯誤數: ${stats.total}\n` +
          `最近 24 小時: ${stats.last24Hours}\n` +
          `嚴重程度:\n` +
          `  - 低: ${stats.bySeverity.low}\n` +
          `  - 中: ${stats.bySeverity.medium}\n` +
          `  - 高: ${stats.bySeverity.high}\n` +
          `  - 關鍵: ${stats.bySeverity.critical}`,
          [
            { text: '查看詳情', onPress: () => {
              setVisible(false);
              navigation.navigate('ErrorLogs');
            }},
            { text: '關閉', style: 'cancel' }
          ]
        );
      }
    },
    {
      id: 'cache',
      title: '清除快取',
      icon: '🗑️',
      description: '清理本地快取資料',
      destructive: true,
      requiresConfirm: true,
      action: async () => {
        try {
          const keys = await AsyncStorage.getAllKeys();
          await AsyncStorage.multiRemove(keys);
          Alert.alert('成功', '快取已清除');
        } catch (error) {
          Alert.alert('錯誤', '清除快取失敗');
        }
      }
    },
    {
      id: 'env',
      title: '環境資訊',
      icon: '🌍',
      description: '查看環境配置',
      action: () => {
        Alert.alert(
          '環境配置',
          environmentManager.getSummary(),
          [{ text: '確定' }]
        );
      }
    },
    {
      id: 'performance',
      title: '效能監控',
      icon: '📊',
      description: 'FPS 和記憶體使用',
      action: () => {
        setVisible(false);
        navigation.navigate('PerformanceMonitor');
      }
    },
    {
      id: 'network',
      title: '網路檢查',
      icon: '🌐',
      description: '測試 API 連接',
      action: async () => {
        try {
          const config = environmentManager.getConfig();
          const response = await fetch(`${config.apiUrl}/health`);
          const status = response.ok ? '正常' : '異常';
          Alert.alert(
            '網路狀態',
            `API 伺服器: ${status}\n` +
            `狀態碼: ${response.status}\n` +
            `URL: ${config.apiUrl}`
          );
        } catch (error) {
          Alert.alert('網路錯誤', '無法連接到 API 伺服器');
        }
      }
    },
    {
      id: 'test-error',
      title: '測試錯誤',
      icon: '💥',
      description: '觸發測試錯誤',
      destructive: true,
      action: () => {
        setVisible(false);
        setTimeout(() => {
          throw new Error('這是一個測試錯誤！');
        }, 100);
      }
    }
  ];
  
  /**
   * 處理選單項目點擊
   */
  const handleItemPress = (item: MenuItem) => {
    if (item.requiresConfirm) {
      Alert.alert(
        '確認操作',
        `確定要${item.title}嗎？`,
        [
          { text: '取消', style: 'cancel' },
          { 
            text: '確定', 
            style: item.destructive ? 'destructive' : 'default',
            onPress: () => {
              item.action();
              if (!item.id.includes('error')) {
                setVisible(false);
              }
            }
          }
        ]
      );
    } else {
      item.action();
      if (!item.id.includes('error')) {
        setVisible(false);
      }
    }
  };
  
  // 非開發環境不渲染
  if (!environmentManager.isDevToolsEnabled()) {
    return null;
  }
  
  return (
    <>
      {/* 浮動按鈕（開發環境備用觸發方式） */}
      {__DEV__ && (
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => setVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.floatingButtonText}>🛠️</Text>
        </TouchableOpacity>
      )}
      
      {/* 選單模態框 */}
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity 
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <Animated.View 
            style={[
              styles.menuContainer,
              { transform: [{ translateX: slideAnim }] }
            ]}
          >
            <TouchableOpacity activeOpacity={1}>
              {/* 標題 */}
              <View style={styles.header}>
                <Text style={styles.title}>開發者選單</Text>
                <TouchableOpacity
                  onPress={() => setVisible(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>
              
              {/* 搖晃狀態指示器 */}
              {shakeCount > 0 && (
                <View style={styles.shakeIndicator}>
                  <Text style={styles.shakeText}>
                    搖晃計數: {shakeCount}/3
                  </Text>
                </View>
              )}
              
              {/* 選單項目 */}
              <ScrollView 
                style={styles.menuScroll}
                showsVerticalScrollIndicator={false}
              >
                {menuItems.map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.menuItem,
                      item.destructive && styles.destructiveItem
                    ]}
                    onPress={() => handleItemPress(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.menuIcon}>{item.icon}</Text>
                    <View style={styles.menuContent}>
                      <Text style={[
                        styles.menuTitle,
                        item.destructive && styles.destructiveText
                      ]}>
                        {item.title}
                      </Text>
                      <Text style={styles.menuDescription}>
                        {item.description}
                      </Text>
                    </View>
                    <Text style={styles.chevron}>›</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              {/* 底部資訊 */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  環境: {environmentManager.getConfig().name}
                </Text>
                <Text style={styles.footerText}>
                  搖晃裝置 3 次開啟
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3182CE',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 999
  },
  floatingButtonText: {
    fontSize: 24
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  menuContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '80%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A202C'
  },
  closeButton: {
    fontSize: 24,
    color: '#718096',
    padding: 5
  },
  shakeIndicator: {
    backgroundColor: '#BEE3F8',
    paddingVertical: 8,
    paddingHorizontal: 20
  },
  shakeText: {
    fontSize: 14,
    color: '#2B6CB0',
    textAlign: 'center'
  },
  menuScroll: {
    flex: 1
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F7FAFC'
  },
  destructiveItem: {
    backgroundColor: '#FFF5F5'
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 16
  },
  menuContent: {
    flex: 1
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 2
  },
  destructiveText: {
    color: '#E53E3E'
  },
  menuDescription: {
    fontSize: 13,
    color: '#718096'
  },
  chevron: {
    fontSize: 20,
    color: '#CBD5E0'
  },
  footer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0'
  },
  footerText: {
    fontSize: 12,
    color: '#A0AEC0',
    textAlign: 'center',
    marginBottom: 4
  }
});