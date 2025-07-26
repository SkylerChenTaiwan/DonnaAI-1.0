/**
 * WebApp 容器元件
 * 用於在小工具中載入和顯示 WebApp
 */

import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Layout } from '@/components/common/Layout';
import { useAuthStore } from '@/stores/authStore';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/navigation';
import { RouteProp } from '@react-navigation/native';

type WebAppRouteProp = RouteProp<RootStackParamList, 'WebApp'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const WebAppContainer: React.FC = () => {
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<WebAppRouteProp>();
  
  const { toolId, title, source } = route.params;

  // JavaScript 注入腳本，建立與原生應用的通訊橋接
  const injectedJavaScript = `
    (function() {
      // 建立全域 DonnaAI 物件
      window.DonnaAI = {
        // 使用者資訊
        user: ${JSON.stringify({
          id: user?.uid,
          email: user?.email,
          organizationId: user?.organizationId,
        })},
        
        // 傳送訊息到原生應用
        sendMessage: function(type, data) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: type,
            data: data,
            timestamp: new Date().toISOString()
          }));
        },
        
        // 常用功能
        showToast: function(message) {
          this.sendMessage('toast', { message });
        },
        
        saveData: function(key, value) {
          this.sendMessage('saveData', { key, value });
        },
        
        getData: function(key) {
          this.sendMessage('getData', { key });
        },
        
        navigateBack: function() {
          this.sendMessage('navigate', { action: 'back' });
        }
      };
      
      // 通知 WebApp 已準備就緒
      if (window.onDonnaAIReady) {
        window.onDonnaAIReady();
      }
      
      true; // 注入成功
    })();
  `;

  // 處理來自 WebApp 的訊息
  const handleMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      switch (message.type) {
        case 'toast':
          Alert.alert('提示', message.data.message);
          break;
          
        case 'saveData':
          // 儲存資料到本地或 Firebase
          console.log('保存資料:', message.data);
          break;
          
        case 'getData':
          // 讀取資料並回傳給 WebApp
          console.log('讀取資料:', message.data.key);
          break;
          
        case 'navigate':
          if (message.data.action === 'back') {
            navigation.goBack();
          }
          break;
          
        default:
          console.log('未處理的訊息類型:', message);
      }
    } catch (error) {
      console.error('訊息處理錯誤:', error);
    }
  };

  return (
    <Layout
      headerProps={{
        title,
        showBackButton: true,
      }}
      style={styles.container}
    >
      <SafeAreaView style={styles.container}>
        <WebView
          ref={webViewRef}
          source={source}
          style={styles.webView}
          injectedJavaScript={injectedJavaScript}
          onMessage={handleMessage}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('WebView 錯誤:', nativeEvent);
            Alert.alert('載入錯誤', '無法載入應用程式');
          }}
          // 安全設定
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          // 限制只能在 WebView 內導航
          originWhitelist={['*']}
          // 混合內容設定（開發時使用）
          mixedContentMode="compatibility"
        />
        
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        )}
      </SafeAreaView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});