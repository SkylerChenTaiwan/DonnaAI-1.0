import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Icon } from '@/components/common/Icon';
import { useQueryStore } from '../../stores/queryStore';
import { useAuthStore } from '../../stores/authStore';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'error';
  text: string;
  timestamp: Date;
}

export default function QueryChat() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const { startQuery, currentSession } = useQueryStore();
  const { user } = useAuthStore();
  
  const isProcessing = currentSession?.status === 'processing' || 
                      currentSession?.status === 'generating' ||
                      currentSession?.status === 'clarifying';

  // 監聽查詢狀態變化
  useEffect(() => {
    if (currentSession?.status === 'completed' && currentSession.interpretation) {
      const interpretation = currentSession.interpretation;
      const metrics = interpretation.entities.metrics.join('、');
      const dimensions = interpretation.entities.dimensions.join('、');
      const chartType = interpretation.suggestedChartType;
      
      let message = `已理解您的查詢。將分析 ${metrics}`;
      if (dimensions.length > 0) {
        message += `，按 ${dimensions} 分組`;
      }
      message += `，建議使用${chartType}圖表呈現。`;
      
      addMessage({
        type: 'assistant',
        text: message,
      });
    } else if (currentSession?.status === 'error') {
      addMessage({
        type: 'error',
        text: currentSession.error || '處理查詢時發生錯誤',
      });
    }
  }, [currentSession?.status, currentSession?.interpretation, currentSession?.error]);

  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
    
    // 自動滾動到底部
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSend = async () => {
    if (!query.trim() || isProcessing || !user) return;
    
    // 添加用戶訊息
    addMessage({
      type: 'user',
      text: query,
    });
    
    // 清空輸入框
    const queryText = query;
    setQuery('');
    
    // 建構用戶上下文
    const userContext = {
      userId: user.id,
      role: user.role || 'manager',
      organizationId: user.organizationId || '',
      teamIds: user.teamIds || [],
    };
    
    try {
      // 開始查詢
      await startQuery(queryText, userContext);
    } catch (error) {
      console.error('查詢失敗:', error);
      addMessage({
        type: 'error',
        text: '無法處理您的查詢，請稍後再試',
      });
    }
  };

  const renderMessage = (message: Message) => {
    const isUser = message.type === 'user';
    const isError = message.type === 'error';
    
    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.assistantMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.assistantBubble,
            isError && styles.errorBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isUser ? styles.userText : styles.assistantText,
            ]}
          >
            {message.text}
          </Text>
        </View>
      </View>
    );
  };

  const renderProcessingIndicator = () => {
    if (!isProcessing) return null;
    
    let statusText = '處理中...';
    if (currentSession?.status === 'processing') {
      statusText = '正在解析您的查詢...';
    } else if (currentSession?.status === 'generating') {
      statusText = '正在生成圖表...';
    } else if (currentSession?.status === 'clarifying') {
      statusText = '需要更多資訊...';
    }
    
    return (
      <View style={styles.processingContainer}>
        <ActivityIndicator size="small" color="#666" />
        <Text style={styles.processingText}>{statusText}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 歡迎訊息 */}
      {messages.length === 0 && (
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>智能分析助手</Text>
          <Text style={styles.welcomeText}>
            詢問關於您的業務數據，例如：
          </Text>
          <View style={styles.exampleContainer}>
            <TouchableOpacity
              style={styles.exampleButton}
              onPress={() => setQuery('本月的銷售趨勢如何？')}
            >
              <Text style={styles.exampleText}>📈 本月的銷售趨勢如何？</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.exampleButton}
              onPress={() => setQuery('哪個團隊表現最好？')}
            >
              <Text style={styles.exampleText}>🏆 哪個團隊表現最好？</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.exampleButton}
              onPress={() => setQuery('客戶分布情況')}
            >
              <Text style={styles.exampleText}>🗺️ 客戶分布情況</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* 對話歷史 */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map(renderMessage)}
        {renderProcessingIndicator()}
      </ScrollView>
      
      {/* 輸入區域 */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="詢問關於您的業務數據..."
          placeholderTextColor="#999"
          onSubmitEditing={handleSend}
          returnKeyType="send"
          editable={!isProcessing}
          multiline
          maxLength={200}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!query.trim() || isProcessing) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!query.trim() || isProcessing}
        >
          <Icon
            name="send"
            size={20}
            color={!query.trim() || isProcessing ? '#CCC' : '#007AFF'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  welcomeContainer: {
    padding: 20,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  exampleContainer: {
    width: '100%',
  },
  exampleButton: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 14,
    color: '#333',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  messageContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  assistantMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#007AFF',
  },
  assistantBubble: {
    backgroundColor: '#F0F0F0',
  },
  errorBubble: {
    backgroundColor: '#FFE5E5',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: 'white',
  },
  assistantText: {
    color: '#333',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  processingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    marginRight: 8,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});