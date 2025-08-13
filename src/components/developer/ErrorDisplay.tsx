/**
 * 錯誤顯示元件
 * 提供美觀的錯誤詳情展示介面
 */

import React, { useState } from 'react';
import { View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Animated
 } from 'react-native';
import { AdaptiveModal } from '@/components/adaptive';
import { ErrorReport } from '../../types/error';
import { UI_CONSTANTS, ERROR_CONSTANTS } from '../../config/constants';
import { formatDistanceToNow } from '../../utils/dateHelpers';

interface ErrorDisplayProps {
  error: Error;
  errorInfo?: { componentStack: string };
  errorId?: string;
  onReset?: () => void;
  onCopy?: () => void;
  onShare?: () => void;
  compact?: boolean;
}

/**
 * 錯誤顯示元件
 * 根據 compact 模式決定顯示簡潔版或詳細版
 */
export const ErrorDisplay = ({
  error,
  errorInfo,
  errorId,
  onReset,
  onCopy,
  onShare,
  compact = false
}: ErrorDisplayProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showStackTrace, setShowStackTrace] = useState(false);
  const animatedHeight = useState(new Animated.Value(0))[0];
  
  /**
   * 切換展開/收合狀態
   */
  const toggleExpanded = () => {
    const toValue = isExpanded ? 0 : 1;
    
    Animated.timing(animatedHeight, {
      toValue,
      duration: UI_CONSTANTS.ANIMATION_DURATION,
      useNativeDriver: false
    }).start();
    
    setIsExpanded(!isExpanded);
  };
  
  /**
   * 格式化堆疊追蹤
   */
  const formatStackTrace = (stack?: string) => {
    if (!stack) return '無堆疊資訊';
    
    // 限制堆疊行數
    const lines = stack.split('\n');
    const limitedLines = lines.slice(0, ERROR_CONSTANTS.MAX_STACK_LINES);
    
    // 高亮關鍵資訊
    return limitedLines.map((line, index) => {
      const isAppCode = line.includes('/src/') && !line.includes('node_modules');
      return (
        <Text 
          key={index} 
          style={StyleSheet.flatten([
            styles.stackLine,
            isAppCode && styles.appCodeLine
          ])}
        >
          {line.trim()}
        </Text>
      );
    });
  };
  
  if (compact) {
    // 簡潔版錯誤顯示
    return (
      <TouchableOpacity 
        style={styles.compactContainer}
        onPress={toggleExpanded}
        activeOpacity={0.8}
      >
        <View style={styles.compactHeader}>
          <Text style={styles.compactIcon}>⚠️</Text>
          <View style={styles.compactInfo}>
            <Text style={styles.compactMessage} numberOfLines={2}>
              {error.message}
            </Text>
            {errorId && (
              <Text style={styles.compactId}>ID: {errorId}</Text>
            )}
          </View>
          <Text style={styles.expandIcon}>
            {isExpanded ? '▼' : '▶'}
          </Text>
        </View>
        
        <Animated.View 
          style={StyleSheet.flatten([
            styles.expandedContent,
            {
              maxHeight: animatedHeight.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 500]
              }),
              opacity: animatedHeight
            }
          ])}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.stackTrace}>
              {formatStackTrace(error.stack)}
            </Text>
            
            <View style={styles.compactActions}>
              {onCopy && (
                <TouchableOpacity 
                  style={styles.compactButton}
                  onPress={onCopy}
                >
                  <Text style={styles.compactButtonText}>複製</Text>
                </TouchableOpacity>
              )}
              {onShare && (
                <TouchableOpacity 
                  style={styles.compactButton}
                  onPress={onShare}
                >
                  <Text style={styles.compactButtonText}>分享</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </Animated.View>
      </TouchableOpacity>
    );
  }
  
  // 詳細版錯誤顯示
  return (
    <View style={styles.container}>
      {/* 錯誤概要 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>🚨</Text>
          <Text style={styles.sectionTitle}>錯誤詳情</Text>
        </View>
        
        <View style={styles.errorInfo}>
          <Text style={styles.errorName}>{error.name || 'Error'}</Text>
          <Text style={styles.errorMessage}>{error.message}</Text>
          {errorId && (
            <Text style={styles.errorMeta}>錯誤 ID: {errorId}</Text>
          )}
        </View>
      </View>
      
      {/* 堆疊追蹤 */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.sectionHeader}
          onPress={() => setShowStackTrace(!showStackTrace)}
          activeOpacity={0.7}
        >
          <Text style={styles.sectionIcon}>📍</Text>
          <Text style={styles.sectionTitle}>堆疊追蹤</Text>
          <Text style={styles.toggleIcon}>
            {showStackTrace ? '隱藏' : '顯示'}
          </Text>
        </TouchableOpacity>
        
        {showStackTrace && (
          <ScrollView 
            style={styles.stackContainer}
            horizontal
            showsHorizontalScrollIndicator={true}
          >
            <View style={styles.stackContent}>
              {formatStackTrace(error.stack)}
            </View>
          </ScrollView>
        )}
      </View>
      
      {/* 元件堆疊 */}
      {errorInfo?.componentStack && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🧩</Text>
            <Text style={styles.sectionTitle}>元件堆疊</Text>
          </View>
          
          <ScrollView 
            style={styles.componentStackContainer}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.componentStack}>
              {errorInfo.componentStack}
            </Text>
          </ScrollView>
        </View>
      )}
      
      {/* 操作按鈕 */}
      <View style={styles.actions}>
        {onReset && (
          <TouchableOpacity 
            style={StyleSheet.flatten([styles.button, styles.primaryButton])}
            onPress={onReset}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>🔄 重試</Text>
          </TouchableOpacity>
        )}
        
        <View style={styles.secondaryActions}>
          {onCopy && (
            <TouchableOpacity 
              style={StyleSheet.flatten([styles.button, styles.secondaryButton])}
              onPress={onCopy}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>📋 複製</Text>
            </TouchableOpacity>
          )}
          
          {onShare && (
            <TouchableOpacity 
              style={StyleSheet.flatten([styles.button, styles.secondaryButton])}
              onPress={onShare}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>📤 分享</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // 詳細版樣式
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    ...(Platform.OS === 'web' ? {} : { ...(Platform.OS === 'web' ? {} : { shadowOffset: { width: 0, height: 4 } }) }),
    shadowOpacity: 0.1,
    shadowRadius: 8,
    ...(Platform.OS === 'web' ? {} : { elevation: 5 })
  },
  section: {
    marginBottom: 20
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: 8
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    flex: 1
  },
  toggleIcon: {
    fontSize: 14,
    color: '#3182CE'
  },
  errorInfo: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F56565'
  },
  errorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C53030',
    marginBottom: 4
  },
  errorMessage: {
    fontSize: 15,
    color: '#742A2A',
    lineHeight: 22
  },
  errorMeta: {
    fontSize: 12,
    color: '#975A5A',
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace'
  },
  stackContainer: {
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    maxHeight: 200
  },
  stackContent: {
    padding: 12
  },
  stackLine: {
    fontSize: 12,
    color: '#4A5568',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 18,
    marginBottom: 4
  },
  appCodeLine: {
    color: '#2B6CB0',
    fontWeight: '600',
    backgroundColor: '#E6F2FF',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4
  },
  componentStackContainer: {
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    padding: 12,
    maxHeight: 150
  },
  componentStack: {
    fontSize: 12,
    color: '#4A5568',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 18
  },
  actions: {
    marginTop: 20
  },
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  primaryButton: {
    backgroundColor: '#3182CE',
    marginBottom: 10
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600'
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  secondaryButton: {
    backgroundColor: '#E2E8F0',
    flex: 1,
    marginHorizontal: 5
  },
  secondaryButtonText: {
    color: '#2D3748',
    fontSize: 14,
    fontWeight: '500'
  },
  
  // 簡潔版樣式
  compactContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  compactIcon: {
    fontSize: 24,
    marginRight: 12
  },
  compactInfo: {
    flex: 1
  },
  compactMessage: {
    fontSize: 14,
    color: '#2D3748',
    marginBottom: 2
  },
  compactId: {
    fontSize: 11,
    color: '#718096'
  },
  expandIcon: {
    fontSize: 12,
    color: '#A0AEC0',
    marginLeft: 8
  },
  expandedContent: {
    overflow: 'hidden',
    marginTop: 12
  },
  compactActions: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0'
  },
  compactButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    backgroundColor: '#EDF2F7',
    borderRadius: 6
  },
  compactButtonText: {
    fontSize: 12,
    color: '#4A5568',
    fontWeight: '500'
  }
});