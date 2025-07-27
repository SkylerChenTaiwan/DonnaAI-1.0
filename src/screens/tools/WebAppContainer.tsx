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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Layout } from '@/components/common/Layout';
import { useAuthStore } from '@/stores/authStore';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/navigation';
import { RouteProp } from '@react-navigation/native';
import { dialogueEngine } from '@/services/roleplay/dialogueEngine';
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
    
    // 初始化對話引擎會話
    const session = await dialogueEngine.initializeSession(
      user?.uid || 'anonymous',
      personaId
    );
    
    setCurrentSessionId(session.sessionId);
    setIsPaused(false);
    
    // 獲取開場白
    const greeting = await dialogueEngine.getInitialGreeting();
    
    return {
      sessionId: session.sessionId,
      persona: session.persona,
      greeting,
      metrics: {
        trust: session.currentState.behaviors.trust,
        interest: session.currentState.behaviors.openness,
        turnCount: 0
      }
    };
  };

  // 處理 RolePlay 訊息
  const processRolePlayMessage = async (data: { content: string }) => {
    if (!currentSessionId) {
      throw new Error('沒有活躍的會話');
    }
    
    const { content } = data;
    
    // 處理用戶訊息
    const result = await dialogueEngine.processUserInput(content);
    
    // 檢查是否達到終止狀態
    const currentState = dialogueEngine.getCurrentState();
    const isTerminalState = currentState?.currentState === 'WON' || currentState?.currentState === 'LOST';
    
    let report = null;
    if (isTerminalState) {
      // 自動生成訓練報告
      const session = await dialogueEngine.endSession();
      report = generateTrainingReport(session);
    }
    
    return {
      response: result.customerResponse,
      hint: result.hint,
      metrics: {
        trust: currentState?.emotions?.trust || 5,
        interest: currentState?.emotions?.interest || 5,
        turnCount: currentState?.turns || 0
      },
      stateChange: result.stateChange,
      autoEnd: isTerminalState,
      outcome: isTerminalState ? currentState?.currentState.toLowerCase() : undefined,
      report
    };
  };

  // 結束 RolePlay 會話
  const endRolePlaySession = async () => {
    if (currentSessionId) {
      // 結束會話並儲存記錄
      const session = await dialogueEngine.endSession();
      
      // 清理暫存資料
      await AsyncStorage.removeItem(`@roleplay_current_session`);
      
      // 清理狀態
      setCurrentSessionId(null);
      setIsPaused(false);
      
      return {
        success: true,
        summary: generateTrainingReport(session)
      };
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
    
    setIsPaused(true);
    
    return {
      success: true,
      sessionId: currentSessionId
    };
  };
  
  // 恢復會話
  const resumeRolePlaySession = async (data: { sessionData: any }) => {
    const { sessionData } = data;
    
    // 恢復會話狀態
    setCurrentSessionId(sessionData.sessionId);
    setIsPaused(false);
    
    // 重新初始化對話引擎
    await dialogueEngine.initializeSession(
      user?.uid || 'anonymous',
      sessionData.personaId
    );
    
    return {
      success: true,
      sessionId: sessionData.sessionId
    };
  };
  
  // 獲取 AI 教練建議
  const getCoachAdvice = async (data: { 
    recentMessages: any[];
    currentState: string;
    metrics: any;
  }) => {
    try {
      // 獲取引擎狀態
      const engineState = dialogueEngine.getCurrentState();
      
      // 準備最近對話的格式化字串
      const formattedMessages = data.recentMessages
        .map(msg => `${msg.sender === 'user' ? '業務' : '客戶'}: ${msg.content}`)
        .join('\n');
      
      // 獲取專家分析
      const analysis = dialogueEngine.getSessionAnalysis();
      
      // 識別關鍵情境
      const keyScenarios = {
        lowTrust: data.metrics.trust <= 3,
        highDefense: engineState?.currentState === 'SKEPTICAL' || engineState?.currentState === 'OBJECTION',
        priceShock: engineState?.currentState === 'PRICE_SHOCK',
        readyToBuy: engineState?.currentState === 'READY_TO_BUY' || engineState?.currentState === 'CLOSING',
        negotiating: engineState?.currentState === 'NEGOTIATING',
        lost: engineState?.currentState === 'LOST'
      };
      
      // 生成針對性建議
      let content = '';
      let advice = [];
      
      if (keyScenarios.lost) {
        content = '🔴 客戶已經失去興趣';
        advice = [
          '分析失敗原因，記取教訓',
          '回顧對話中的轉折點',
          '練習異議處理技巧'
        ];
      } else if (keyScenarios.readyToBuy) {
        content = '🟢 客戶準備購買！';
        advice = [
          '簡化流程，避免節外生枝',
          '確認關鍵細節',
          '保持熱情和專業'
        ];
      } else if (keyScenarios.priceShock) {
        content = '💰 客戶對價格有疑慮';
        advice = [
          '強調價值和投資報酬',
          '提供彈性方案',
          '分享成功案例'
        ];
      } else if (keyScenarios.negotiating) {
        content = '🤝 正在談判階段';
        advice = [
          '保持彈性但有原則',
          '創造雙贏局面',
          '了解客戶真正需求'
        ];
      } else if (keyScenarios.highDefense) {
        content = '🚫 客戶防衛心很重';
        advice = [
          '放慢節奏，建立信任',
          '傾聽理解，不要爭辯',
          '提供證據和案例'
        ];
      } else if (keyScenarios.lowTrust) {
        content = '⚠️ 信任度偏低';
        advice = [
          '展現真誠和專業',
          '避免強勢推銷',
          '分享其他客戶的正面經驗'
        ];
      } else {
        // 一般建議
        content = '💡 持續建立關係';
        advice = analysis?.suggestions || [
          '了解客戶需求',
          '展示產品價值',
          '保持專業態度'
        ];
      }
      
      // 加入動態建議
      if (data.metrics.turnCount > 20) {
        advice.push('對話太長，考慮加快推進');
      }
      
      return {
        type: 'analysis',
        content: `${content}\n\n🎯 建議：\n${advice.map((a, i) => `${i + 1}. ${a}`).join('\n')}`,
        context: {
          currentState: data.currentState,
          trustLevel: data.metrics.trust,
          interestLevel: data.metrics.interest,
          scenario: Object.keys(keyScenarios).find(key => keyScenarios[key]) || 'general'
        }
      };
    } catch (error) {
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