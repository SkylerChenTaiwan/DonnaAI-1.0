/**
 * 效能監控畫面
 * 顯示應用程式的效能指標
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PerformanceMetrics {
  fps: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  jsThreadUsage: number;
  uiThreadUsage: number;
  networkRequests: {
    pending: number;
    completed: number;
    failed: number;
  };
}

export const PerformanceMonitorScreen: React.FC = () => {
  const navigation = useNavigation();
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memory: { used: 0, total: 0, percentage: 0 },
    jsThreadUsage: 0,
    uiThreadUsage: 0,
    networkRequests: { pending: 0, completed: 0, failed: 0 }
  });
  
  const [fpsHistory, setFpsHistory] = useState<number[]>([]);
  const frameCount = useRef(0);
  const lastFrameTime = useRef(performance.now());
  const animationFrameId = useRef<number>();
  
  /**
   * 計算 FPS
   */
  const calculateFPS = () => {
    const now = performance.now();
    const delta = now - lastFrameTime.current;
    
    if (delta >= 1000) {
      const fps = Math.round((frameCount.current * 1000) / delta);
      frameCount.current = 0;
      lastFrameTime.current = now;
      
      setMetrics(prev => ({ ...prev, fps }));
      setFpsHistory(prev => {
        const newHistory = [...prev, fps];
        if (newHistory.length > 60) {
          newHistory.shift();
        }
        return newHistory;
      });
    }
    
    frameCount.current++;
    animationFrameId.current = requestAnimationFrame(calculateFPS);
  };
  
  /**
   * 取得記憶體資訊（模擬）
   */
  const updateMemoryInfo = () => {
    // 注意：React Native 沒有直接的記憶體 API，這裡是模擬數據
    const totalMemory = 2048; // MB
    const usedMemory = Math.random() * 1024 + 512; // 512-1536 MB
    const percentage = (usedMemory / totalMemory) * 100;
    
    setMetrics(prev => ({
      ...prev,
      memory: {
        used: Math.round(usedMemory),
        total: totalMemory,
        percentage: Math.round(percentage)
      }
    }));
  };
  
  /**
   * 更新執行緒使用率（模擬）
   */
  const updateThreadUsage = () => {
    setMetrics(prev => ({
      ...prev,
      jsThreadUsage: Math.round(Math.random() * 100),
      uiThreadUsage: Math.round(Math.random() * 100)
    }));
  };
  
  /**
   * 取得 FPS 顏色
   */
  const getFPSColor = (fps: number) => {
    if (fps >= 55) return '#48BB78';
    if (fps >= 45) return '#ED8936';
    return '#E53E3E';
  };
  
  /**
   * 取得使用率顏色
   */
  const getUsageColor = (percentage: number) => {
    if (percentage <= 50) return '#48BB78';
    if (percentage <= 75) return '#ED8936';
    return '#E53E3E';
  };
  
  /**
   * 渲染 FPS 圖表
   */
  const renderFPSChart = () => {
    const maxFPS = 60;
    const chartHeight = 100;
    const barWidth = (SCREEN_WIDTH - 40) / 60;
    
    return (
      <View style={styles.chart}>
        <View style={styles.chartContent}>
          {fpsHistory.map((fps, index) => {
            const height = (fps / maxFPS) * chartHeight;
            return (
              <View
                key={index}
                style={StyleSheet.flatten([
                  styles.chartBar,
                  {
                    height,
                    width: barWidth - 1,
                    backgroundColor: getFPSColor(fps),
                    left: index * barWidth
                  }
                ])}
              />
            );
          })}
        </View>
        <View style={styles.chartLabels}>
          <Text style={styles.chartLabel}>0</Text>
          <Text style={styles.chartLabel}>30</Text>
          <Text style={styles.chartLabel}>60 FPS</Text>
        </View>
      </View>
    );
  };
  
  /**
   * 渲染進度條
   */
  const renderProgressBar = (value: number, maxValue: number, color: string) => {
    const percentage = (value / maxValue) * 100;
    
    return (
      <View style={styles.progressBar}>
        <View
          style={StyleSheet.flatten([
            styles.progressFill,
            {
              width: `${percentage}%`,
              backgroundColor: color
            }
          ])}
        />
      </View>
    );
  };
  
  useEffect(() => {
    // 設定導航標題
    navigation.setOptions({
      title: '效能監控',
      headerTitleStyle: { fontSize: 18 }
    });
    
    // 開始監控
    calculateFPS();
    
    const memoryInterval = setInterval(updateMemoryInfo, 1000);
    const threadInterval = setInterval(updateThreadUsage, 2000);
    
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      clearInterval(memoryInterval);
      clearInterval(threadInterval);
    };
  }, [navigation]);
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* FPS 監控 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>畫面更新率</Text>
            <Text style={StyleSheet.flatten([
              styles.fpsValue,
              { color: getFPSColor(metrics.fps) }
            ])}>
              {metrics.fps} FPS
            </Text>
          </View>
          {renderFPSChart()}
        </View>
        
        {/* 記憶體使用 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>記憶體使用</Text>
            <Text style={styles.memoryText}>
              {metrics.memory.used} / {metrics.memory.total} MB
            </Text>
          </View>
          {renderProgressBar(
            metrics.memory.used,
            metrics.memory.total,
            getUsageColor(metrics.memory.percentage)
          )}
          <Text style={styles.percentageText}>
            {metrics.memory.percentage}%
          </Text>
        </View>
        
        {/* 執行緒使用率 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>執行緒使用率</Text>
          
          <View style={styles.threadItem}>
            <Text style={styles.threadLabel}>JS 執行緒</Text>
            {renderProgressBar(
              metrics.jsThreadUsage,
              100,
              getUsageColor(metrics.jsThreadUsage)
            )}
            <Text style={styles.threadValue}>{metrics.jsThreadUsage}%</Text>
          </View>
          
          <View style={styles.threadItem}>
            <Text style={styles.threadLabel}>UI 執行緒</Text>
            {renderProgressBar(
              metrics.uiThreadUsage,
              100,
              getUsageColor(metrics.uiThreadUsage)
            )}
            <Text style={styles.threadValue}>{metrics.uiThreadUsage}%</Text>
          </View>
        </View>
        
        {/* 系統資訊 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>系統資訊</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>平台</Text>
            <Text style={styles.infoValue}>{Platform.OS}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>版本</Text>
            <Text style={styles.infoValue}>{Platform.Version}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>React Native</Text>
            <Text style={styles.infoValue}>{Platform.constants?.reactNativeVersion?.major}.{Platform.constants?.reactNativeVersion?.minor}.{Platform.constants?.reactNativeVersion?.patch}</Text>
          </View>
        </View>
        
        {/* 效能建議 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>效能建議</Text>
          <View style={styles.suggestion}>
            <Text style={styles.suggestionIcon}>💡</Text>
            <Text style={styles.suggestionText}>
              保持 FPS 在 55 以上以獲得流暢體驗
            </Text>
          </View>
          <View style={styles.suggestion}>
            <Text style={styles.suggestionIcon}>🔧</Text>
            <Text style={styles.suggestionText}>
              避免在主執行緒執行耗時操作
            </Text>
          </View>
          <View style={styles.suggestion}>
            <Text style={styles.suggestionIcon}>📱</Text>
            <Text style={styles.suggestionText}>
              使用 React.memo 優化元件渲染
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC'
  },
  scrollView: {
    flex: 1
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    ...(Platform.OS === 'web' ? {} : { ...(Platform.OS === 'web' ? {} : { shadowOffset: { width: 0, height: 2 } }) }),
    shadowOpacity: 0.05,
    shadowRadius: 4,
    ...(Platform.OS === 'web' ? {} : { elevation: 2 })
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748'
  },
  fpsValue: {
    fontSize: 24,
    fontWeight: 'bold'
  },
  chart: {
    height: 120,
    marginTop: 8
  },
  chartContent: {
    height: 100,
    position: 'relative',
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    overflow: 'hidden'
  },
  chartBar: {
    position: 'absolute',
    bottom: 0,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4
  },
  chartLabel: {
    fontSize: 10,
    color: '#718096'
  },
  memoryText: {
    fontSize: 14,
    color: '#4A5568'
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    borderRadius: 4
  },
  percentageText: {
    fontSize: 12,
    color: '#718096',
    marginTop: 4,
    textAlign: 'right'
  },
  threadItem: {
    marginVertical: 8
  },
  threadLabel: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 4
  },
  threadValue: {
    fontSize: 12,
    color: '#718096',
    marginTop: 4,
    textAlign: 'right'
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  infoLabel: {
    fontSize: 14,
    color: '#718096'
  },
  infoValue: {
    fontSize: 14,
    color: '#2D3748',
    fontWeight: '500'
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8
  },
  suggestionIcon: {
    fontSize: 20,
    marginRight: 12
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20
  }
});