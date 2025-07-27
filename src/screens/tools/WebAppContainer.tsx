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
import { DialogueEngine } from '@/services/roleplay/dialogueEngine';
import { customerPersonas } from '@/services/roleplay/customerPersonas';

type WebAppRouteProp = RouteProp<RootStackParamList, 'WebApp'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const WebAppContainer: React.FC = () => {
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<WebAppRouteProp>();
  
  const { toolId, title, source } = route.params;
  
  // RolePlay 會話狀態
  const [rolePlayEngine, setRolePlayEngine] = useState<DialogueEngine | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

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
          
        case 'roleplay':
          handleRolePlayMessage(message.data);
          break;
          
        default:
          console.log('未處理的訊息類型:', message);
      }
    } catch (error) {
      console.error('訊息處理錯誤:', error);
    }
  };

  // 處理 RolePlay 訊息
  const handleRolePlayMessage = async (data: any) => {
    const { action, callbackId } = data;
    
    try {
      let result: any;
      
      switch (action) {
        case 'getPersonas':
          result = await getRolePlayPersonas();
          break;
          
        case 'startSession':
          result = await startRolePlaySession(data.data);
          break;
          
        case 'sendMessage':
          result = await processRolePlayMessage(data.data);
          break;
          
        case 'endSession':
          result = await endRolePlaySession();
          break;
          
        default:
          throw new Error(`未知的 RolePlay 動作: ${action}`);
      }
      
      // 回調 WebApp
      if (callbackId && webViewRef.current) {
        webViewRef.current.postMessage(JSON.stringify({
          type: 'roleplayCallback',
          callbackId,
          success: true,
          data: result
        }));
      }
    } catch (error: any) {
      // 錯誤回調
      if (callbackId && webViewRef.current) {
        webViewRef.current.postMessage(JSON.stringify({
          type: 'roleplayCallback',
          callbackId,
          success: false,
          error: error.message || '處理失敗'
        }));
      }
    }
  };

  // 取得客戶原型列表
  const getRolePlayPersonas = async () => {
    return {
      personas: customerPersonas.map(persona => ({
        id: persona.id,
        name: persona.name,
        icon: persona.icon || '👤',
        color: persona.industry === 'tech' ? '#007AFF' : 
               persona.industry === 'retail' ? '#FF3B30' : 
               persona.industry === 'manufacturing' ? '#34C759' : '#FF9500',
        description: persona.background,
        type: persona.industry
      }))
    };
  };

  // 開始 RolePlay 會話
  const startRolePlaySession = async (data: { personaId: string }) => {
    const { personaId } = data;
    const sessionId = `session_${Date.now()}`;
    
    // 建立新的對話引擎
    const engine = new DialogueEngine();
    const initResult = await engine.initializeSession(personaId, sessionId);
    
    setRolePlayEngine(engine);
    setCurrentSessionId(sessionId);
    
    return {
      sessionId,
      persona: customerPersonas.find(p => p.id === personaId),
      greeting: initResult.message,
      metrics: {
        trust: 5,
        interest: 5,
        turnCount: 0
      }
    };
  };

  // 處理 RolePlay 訊息
  const processRolePlayMessage = async (data: { content: string }) => {
    if (!rolePlayEngine || !currentSessionId) {
      throw new Error('沒有活躍的會話');
    }
    
    const { content } = data;
    
    // 處理用戶訊息
    const result = await rolePlayEngine.processUserMessage(content);
    
    return {
      response: result.message,
      hint: result.hint,
      metrics: {
        trust: result.state.trust,
        interest: result.state.interest,
        turnCount: result.turnCount || 0
      },
      stateChange: result.stateChange
    };
  };

  // 結束 RolePlay 會話
  const endRolePlaySession = async () => {
    if (rolePlayEngine && currentSessionId) {
      // 結束會話並儲存記錄
      const summary = await rolePlayEngine.endSession();
      
      // 清理狀態
      setRolePlayEngine(null);
      setCurrentSessionId(null);
      
      return {
        success: true,
        summary
      };
    }
    
    return { success: true };
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