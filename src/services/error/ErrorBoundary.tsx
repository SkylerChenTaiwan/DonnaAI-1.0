/**
 * 全域錯誤邊界元件
 * 捕捉並處理應用程式中的錯誤
 */

import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { errorLogger } from './ErrorLogger';
import { ErrorBoundaryState, ErrorInfo } from '../../types/error';
import { environmentManager } from '../../config/environment';
import { UI_CONSTANTS } from '../../config/constants';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

/**
 * 錯誤邊界元件
 * 捕捉子元件樹中的錯誤並顯示友善的錯誤介面
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }
  
  /**
   * 捕捉錯誤並更新狀態
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }
  
  /**
   * 記錄錯誤詳情
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 更新錯誤資訊
    this.setState({ errorInfo });
    
    // 記錄錯誤
    errorLogger.logComponentError(
      error,
      errorInfo,
      this.constructor.name
    );
    
    // 呼叫自定義錯誤處理器
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // 開發模式輸出詳細錯誤
    if (__DEV__) {
      console.error('錯誤邊界捕捉到錯誤:', error);
      console.error('元件堆疊:', errorInfo.componentStack);
    }
  }
  
  /**
   * 重置錯誤狀態
   */
  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };
  
  /**
   * 複製錯誤資訊
   */
  handleCopyError = async () => {
    if (!this.state.errorId) return;
    
    try {
      const Clipboard = await import('expo-clipboard');
      const errorText = errorLogger.formatErrorForSharing(this.state.errorId);
      await Clipboard.setStringAsync(errorText);
      
      // TODO: 顯示複製成功提示
      if (__DEV__) {
        console.log('✅ 錯誤資訊已複製到剪貼簿');
      }
    } catch (error) {
      console.error('複製錯誤失敗:', error);
    }
  };
  
  /**
   * 分享錯誤報告
   */
  handleShareError = async () => {
    if (!this.state.errorId) return;
    
    try {
      const { Share } = await import('react-native');
      const errorText = errorLogger.formatErrorForSharing(this.state.errorId);
      
      await Share.share({
        message: errorText,
        title: 'Donna AI 錯誤報告'
      });
    } catch (error) {
      console.error('分享錯誤失敗:', error);
    }
  };
  
  /**
   * 渲染錯誤介面
   */
  renderErrorUI() {
    const { error, errorInfo, errorId } = this.state;
    const isDev = environmentManager.isDevelopment();
    
    // 如果有自定義的 fallback，使用它
    if (this.props.fallback) {
      return this.props.fallback;
    }
    
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 錯誤標題 */}
          <View style={styles.header}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.title}>糟糕！發生錯誤了</Text>
            <Text style={styles.subtitle}>
              我們遇到了一些問題，請稍後再試
            </Text>
          </View>
          
          {/* 錯誤訊息 */}
          <View style={styles.errorCard}>
            <Text style={styles.errorMessage}>
              {error?.message || '發生未知錯誤'}
            </Text>
            {isDev && errorId && (
              <Text style={styles.errorId}>錯誤 ID: {errorId}</Text>
            )}
          </View>
          
          {/* 開發模式顯示堆疊追蹤 */}
          {isDev && error?.stack && (
            <View style={styles.stackContainer}>
              <Text style={styles.stackTitle}>堆疊追蹤</Text>
              <ScrollView 
                horizontal 
                style={styles.stackScroll}
                showsHorizontalScrollIndicator={true}
              >
                <Text style={styles.stackTrace}>{error.stack}</Text>
              </ScrollView>
            </View>
          )}
          
          {/* 開發模式顯示元件堆疊 */}
          {isDev && errorInfo?.componentStack && (
            <View style={styles.stackContainer}>
              <Text style={styles.stackTitle}>元件堆疊</Text>
              <ScrollView 
                horizontal 
                style={styles.stackScroll}
                showsHorizontalScrollIndicator={true}
              >
                <Text style={styles.stackTrace}>{errorInfo.componentStack}</Text>
              </ScrollView>
            </View>
          )}
          
          {/* 操作按鈕 */}
          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]}
              onPress={this.handleReset}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>重試</Text>
            </TouchableOpacity>
            
            {isDev && (
              <View style={styles.devActions}>
                <TouchableOpacity 
                  style={[styles.button, styles.secondaryButton]}
                  onPress={this.handleCopyError}
                  activeOpacity={0.8}
                >
                  <Text style={styles.secondaryButtonText}>複製錯誤</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.button, styles.secondaryButton]}
                  onPress={this.handleShareError}
                  activeOpacity={0.8}
                >
                  <Text style={styles.secondaryButtonText}>分享報告</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          {/* 提示文字 */}
          <Text style={styles.helpText}>
            如果問題持續發生，請聯絡技術支援
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }
  
  render() {
    if (this.state.hasError) {
      return this.renderErrorUI();
    }
    
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA'
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  header: {
    alignItems: 'center',
    marginBottom: 30
  },
  errorIcon: {
    fontSize: 60,
    marginBottom: 20
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 10
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center'
  },
  errorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    width: '100%' },
  errorMessage: {
    fontSize: 16,
    color: '#E53E3E',
    marginBottom: 10
  },
  errorId: {
    fontSize: 12,
    color: '#999999',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace'
  },
  stackContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    width: '100%',
    maxHeight: 200
  },
  stackTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 10
  },
  stackScroll: {
    flexGrow: 0
  },
  stackTrace: {
    fontSize: 12,
    color: '#333333',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 18
  },
  actions: {
    width: '100%',
    marginTop: 20
  },
  button: {
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
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
  devActions: {
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
  helpText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    marginTop: 20
  }
});