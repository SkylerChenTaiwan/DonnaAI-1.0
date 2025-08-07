import React, { Component, ErrorInfo } from 'react';
import { View, Text } from 'react-native';

interface State {
  hasError: boolean;
  error?: Error;
}

export class NetworkErrorBoundary extends Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // 忽略網路和字體載入錯誤
    if (error.message?.includes('NetworkError') || 
        error.message?.includes('Failed to decode') ||
        error.message?.includes('OTS parsing')) {
      console.warn('Non-critical resource loading error:', error.message);
      return { hasError: false }; // 不顯示錯誤畫面
    }
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 記錄錯誤但不中斷應用
    console.warn('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ padding: 20 }}>
          <Text>載入時發生錯誤，請重新整理頁面</Text>
        </View>
      );
    }

    return this.props.children;
  }
}
EOF < /dev/null
