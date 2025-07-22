/**
 * 查詢介面元件
 * 主要的自然語言查詢入口點
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { useQueryStore, useCurrentChart } from '../../stores/queryStore';
import { ClarificationForm } from './ClarificationForm';
import { ChartDisplay } from '../charts/ChartDisplay';
import { QuerySuggestions } from './QuerySuggestions';
import { useAuth } from '../../hooks/useAuth';
// 移除不存在的 colors 模組引用

export const QueryInterface: React.FC = () => {
  const [queryText, setQueryText] = useState('');
  const { user } = useAuth();
  
  // Store hooks
  const {
    currentSession,
    isLoading,
    error,
    startQuery,
    submitClarification,
    clearCurrentSession,
    retryQuery
  } = useQueryStore();
  
  const currentChart = useCurrentChart();

  // 提交查詢
  const handleSubmitQuery = async () => {
    if (!queryText.trim() || !user) return;
    
    const userContext = {
      userId: user.uid,
      role: user.role || 'salesperson',
      organizationId: user.organizationId || '',
      teamIds: user.teamIds || []
    };
    
    await startQuery(queryText.trim(), userContext);
  };

  // 提交澄清表單
  const handleSubmitClarification = async (formData: any) => {
    if (!user) return;
    
    const userContext = {
      userId: user.uid,
      role: user.role || 'salesperson',
      organizationId: user.organizationId || '',
      teamIds: user.teamIds || []
    };
    
    await submitClarification(formData, userContext);
  };

  // 選擇建議查詢
  const handleSelectSuggestion = (suggestion: string) => {
    setQueryText(suggestion);
  };

  // 重新開始查詢
  const handleNewQuery = () => {
    clearCurrentSession();
    setQueryText('');
  };

  // 重試查詢
  const handleRetryQuery = async () => {
    if (!user) return;
    
    const userContext = {
      userId: user.uid,
      role: user.role || 'salesperson',
      organizationId: user.organizationId || '',
      teamIds: user.teamIds || []
    };
    
    await retryQuery(userContext);
  };

  // 渲染內容
  const renderContent = () => {
    // 顯示澄清表單
    if (currentSession?.status === 'clarifying' && currentSession.clarificationForm) {
      return (
        <ClarificationForm
          request={currentSession.clarificationForm}
          onSubmit={handleSubmitClarification}
          onCancel={handleNewQuery}
        />
      );
    }

    // 顯示圖表
    if (currentSession?.status === 'completed' && currentChart) {
      return (
        <View style={styles.chartContainer}>
          <ChartDisplay
            chartData={currentChart}
            isLoading={false}
            error={null}
          />
          
          {/* 新查詢按鈕 */}
          <TouchableOpacity
            style={styles.newQueryButton}
            onPress={handleNewQuery}
          >
            <Text style={styles.newQueryButtonText}>
              新查詢
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    // 顯示載入中
    if (isLoading || currentSession?.status === 'processing' || currentSession?.status === 'generating') {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF5C00" />
          <Text style={styles.loadingText}>
            {currentSession?.status === 'processing' ? '正在理解您的查詢...' :
             currentSession?.status === 'generating' ? '正在生成圖表...' :
             '處理中...'}
          </Text>
        </View>
      );
    }

    // 顯示錯誤
    if (error || currentSession?.status === 'error') {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>查詢失敗</Text>
          <Text style={styles.errorMessage}>
            {error || currentSession?.error || '未知錯誤'}
          </Text>
          <View style={styles.errorButtons}>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetryQuery}
            >
              <Text style={styles.retryButtonText}>重試</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.newQueryButton}
              onPress={handleNewQuery}
            >
              <Text style={styles.newQueryButtonText}>新查詢</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // 預設狀態：顯示查詢建議
    return (
      <QuerySuggestions onSelectSuggestion={handleSelectSuggestion} />
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {renderContent()}
      </View>

      {/* 查詢輸入區域 */}
      {(!currentSession || currentSession.status === 'error') && (
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={queryText}
              onChangeText={setQueryText}
              placeholder="詢問您想查看的資料..."
              placeholderTextColor="#999"
              multiline
              maxLength={200}
              returnKeyType="search"
              onSubmitEditing={handleSubmitQuery}
            />
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!queryText.trim() || isLoading) && styles.submitButtonDisabled
              ]}
              onPress={handleSubmitQuery}
              disabled={!queryText.trim() || isLoading}
            >
              <Text style={[
                styles.submitButtonText,
                (!queryText.trim() || isLoading) && styles.submitButtonTextDisabled
              ]}>
                查詢
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* 字數限制提示 */}
          {queryText.length > 150 && (
            <Text style={styles.charCount}>
              {queryText.length}/200
            </Text>
          )}
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  content: {
    flex: 1
  },
  inputContainer: {
    padding: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0'
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: '#f5f5f5'
  },
  submitButton: {
    backgroundColor: '#FF5C00',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center'
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc'
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  submitButtonTextDisabled: {
    color: '#999'
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 5
  },
  chartContainer: {
    flex: 1
  },
  newQueryButton: {
    margin: 15,
    backgroundColor: '#FF5C00',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  newQueryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
    textAlign: 'center'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF3B30',
    marginBottom: 10
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20
  },
  errorButtons: {
    flexDirection: 'row',
    gap: 10
  },
  retryButton: {
    backgroundColor: '#FF5C00',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  }
});