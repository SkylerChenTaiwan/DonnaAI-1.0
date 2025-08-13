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
  SafeAreaView } from 'react-native';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Layout } from '@/components/common/Layout';
import { useAuthStore } from '@/stores/authStore';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/navigation';
import { RouteProp } from '@react-navigation/native';
import { 
  startRolePlaySession as startSession, 
  processUserMessage as processMessage,
  endSession,
  pauseSession,
  resumeSession,
  getCoachAdvice as getAdvice
} from '@/services/roleplay/roleplayService';
import { customerPersonas, getPersonaById } from '@/services/roleplay/customerPersonas';

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
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  // JavaScript 注入腳本，建立與原生應用的通訊橋接
  const injectedJavaScript = `
    (function() {
      // 建立全域 DonnaAI 物件
      window.DonnaAI = {
        // 使用者資訊
        user: ${JSON.stringify({
          id: user?.uid,
          email: user?.email,
          organizationId: user?.organizationId })},
        
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
          handleSaveData(message.data);
          break;
          
        case 'getData':
          handleGetData(message.data);
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
          
        case 'pauseSession':
          result = await pauseRolePlaySession();
          break;
          
        case 'resumeSession':
          result = await resumeRolePlaySession(data.data);
          break;
          
        case 'getCoachAdvice':
          result = await getCoachAdvice(data.data);
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
        // 檢查是否為 API Key 錯誤
        let errorMessage = error.message || '處理失敗';
        let needsApiKey = false;
        
        if (error.message?.includes('Gemini API Key')) {
          errorMessage = '請先設定 Gemini API Key\n請聯繫管理員或查看設定說明';
          needsApiKey = true;
        }
        
        webViewRef.current.postMessage(JSON.stringify({
          type: 'roleplayCallback',
          callbackId,
          success: false,
          error: errorMessage,
          needsApiKey
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
    
    try {
      // 使用新的 roleplayService
      const result = await startSession(personaId);
      
      setCurrentSessionId(result.sessionId);
      setIsPaused(false);
      
      return {
        sessionId: result.sessionId,
        persona: result.persona,
        greeting: result.greeting,
        metrics: {
          trust: 5,
          interest: 5,
          turnCount: 0
        }
      };
    } catch (error: any) {
      console.error('開始會話失敗:', error);
      throw error;
    }
  };

  // 處理 RolePlay 訊息
  const processRolePlayMessage = async (data: { content: string }) => {
    if (!currentSessionId) {
      throw new Error('沒有活躍的會話');
    }
    
    const { content } = data;
    
    try {
      // 使用新的 roleplayService
      const result = await processMessage(content, { enableHints: true });
      
      return {
        response: result.customerResponse,
        hint: result.hint,
        metrics: result.metrics || {
          trust: 5,
          interest: 5,
          turnCount: 0
        },
        stateChange: result.stateChange,
        autoEnd: result.autoEnd,
        outcome: result.outcome,
        report: result.report
      };
    } catch (error: any) {
      console.error('處理訊息失敗:', error);
      throw error;
    }
  };

  // 結束 RolePlay 會話
  const endRolePlaySession = async () => {
    if (currentSessionId) {
      try {
        // 使用新的 roleplayService
        const session = endSession();
        
        // 清理暫存資料
        await AsyncStorage.removeItem(`@roleplay_current_session`);
        
        // 清理狀態
        setCurrentSessionId(null);
        setIsPaused(false);
        
        return {
          success: true,
          summary: session ? generateTrainingReport(session) : null
        };
      } catch (error: any) {
        console.error('結束會話失敗:', error);
        throw error;
      }
    }
    
    return { success: true };
  };
  
  // 處理資料儲存
  const handleSaveData = async (data: { key: string; value: any }) => {
    try {
      await AsyncStorage.setItem(
        `@roleplay_${data.key}`,
        JSON.stringify(data.value)
      );
      
      // 回調成功
      if (webViewRef.current) {
        webViewRef.current.postMessage(JSON.stringify({
          type: 'saveDataCallback',
          key: data.key,
          success: true
        }));
      }
    } catch (error) {
      console.error('儲存資料錯誤:', error);
      // 回調錯誤
      if (webViewRef.current) {
        webViewRef.current.postMessage(JSON.stringify({
          type: 'saveDataCallback',
          key: data.key,
          success: false,
          error: '儲存失敗'
        }));
      }
    }
  };
  
  // 處理資料讀取
  const handleGetData = async (data: { key: string }) => {
    try {
      const value = await AsyncStorage.getItem(`@roleplay_${data.key}`);
      
      if (webViewRef.current) {
        webViewRef.current.postMessage(JSON.stringify({
          type: 'getDataCallback',
          key: data.key,
          value: value ? JSON.parse(value) : null
        }));
      }
    } catch (error) {
      console.error('讀取資料錯誤:', error);
      if (webViewRef.current) {
        webViewRef.current.postMessage(JSON.stringify({
          type: 'getDataCallback',
          key: data.key,
          value: null,
          error: '讀取失敗'
        }));
      }
    }
  };
  
  // 暫停會話
  const pauseRolePlaySession = async () => {
    if (!currentSessionId) {
      throw new Error('沒有活躍的會話');
    }
    
    try {
      // 使用新的 roleplayService
      const session = pauseSession();
      setIsPaused(true);
      
      return {
        success: true,
        sessionId: currentSessionId,
        sessionData: session
      };
    } catch (error: any) {
      console.error('暫停會話失敗:', error);
      throw error;
    }
  };
  
  // 恢復會話
  const resumeRolePlaySession = async (data: { sessionData: any }) => {
    const { sessionData } = data;
    
    try {
      // 使用新的 roleplayService
      resumeSession(sessionData);
      
      // 恢復會話狀態
      setCurrentSessionId(sessionData.id);
      setIsPaused(false);
      
      return {
        success: true,
        sessionId: sessionData.id
      };
    } catch (error: any) {
      console.error('恢復會話失敗:', error);
      throw error;
    }
  };
  
  // 獲取 AI 教練建議
  const getCoachAdvice = async (data: { 
    recentMessages: any[];
    currentState: string;
    metrics: any;
  }) => {
    try {
      // 使用新的 roleplayService 取得建議
      const result = await getAdvice(data);
      return result.advice;
    } catch (error: any) {
      console.error('AI 教練錯誤:', error);
      return {
        type: 'suggestion',
        content: '正在分析中...請稍後再試。'
      };
    }
  };  
  // 生成訓練報告
  const generateTrainingReport = (session: any) => {
    const duration = session.endTime 
      ? Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000)
      : 0;
      
    return {
      sessionId: session.sessionId,
      duration,
      outcome: session.metrics.finalOutcome || 'paused',
      metrics: {
        finalTrust: session.metrics.trustProgression[session.metrics.trustProgression.length - 1] || 5,
        finalInterest: session.currentState.behaviors.openness || 5,
        totalTurns: session.metrics.totalTurns,
        stateChanges: session.metrics.stateChanges.length
      },
      keyMoments: session.metrics.keyMoments || [],
      suggestions: [
        '練習建立信任的開場白',
        '學習處理價格異議的技巧',
        '改善需求探索的提問方式'
      ]
    };
  };

  return (
    <Layout
      headerProps={{
        title,
        showBackButton: true }}
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
          // iOS 特定設定
          hideKeyboardAccessoryView={true}
          keyboardDisplayRequiresUserAction={false}
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
    backgroundColor: '#FFFFFF' },
  webView: {
    flex: 1 },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center' } });