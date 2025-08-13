/**
 * 查詢介面元件
 * 主要的自然語言查詢入口點
 */

import React, { useState } from 'react';
import { View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator
 } from 'react-native';
import { AdaptiveInput } from '@/components/adaptive';
import { useQueryStore, useCurrentChart } from '../../stores/queryStore';
import { ClarificationForm } from './ClarificationForm';
import { ChartDisplay } from '../charts/ChartDisplay';
import { QuerySuggestions } from './QuerySuggestions';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../theme/colors';
import { DesignSystem } from '../../theme/designSystem';

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
          <ActivityIndicator size="large" color={colors.primary} />
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
      {/* 查詢輸入區域 - 移到頂部 */}
      {(!currentSession || currentSession.status === 'error') && (
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <AdaptiveInput
              style={styles.textInput}
              value={queryText}
              onChangeText={setQueryText}
              placeholder="詢問您想查看的資料，例如：本月銷售表現如何？團隊任務完成率？客戶分佈情況？"
              placeholderTextColor={colors.textTertiary}
              multiline
              maxLength={500}
              returnKeyType="search"
              onSubmitEditing={handleSubmitQuery}
            />
            <TouchableOpacity
              style={StyleSheet.flatten([
                styles.submitButton,
                (!queryText.trim() || isLoading) && styles.submitButtonDisabled
              ])}
              onPress={handleSubmitQuery}
              disabled={!queryText.trim() || isLoading}
            >
              <Text style={StyleSheet.flatten([
                styles.submitButtonText,
                (!queryText.trim() || isLoading) && styles.submitButtonTextDisabled
              ])}>
                分析
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* 字數限制提示 */}
          {queryText.length > 400 && (
            <Text style={styles.charCount}>
              {queryText.length}/500
            </Text>
          )}
        </View>
      )}
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderContent()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary
  },
  content: {
    flex: 1
  },
  inputContainer: {
    padding: DesignSystem.spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...DesignSystem.shadows.sm
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: DesignSystem.spacing.sm
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: DesignSystem.borderRadius.md,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.md,
    ...DesignSystem.typography.body,
    minHeight: 120,
    maxHeight: 200,
    backgroundColor: colors.backgroundTertiary,
    textAlignVertical: 'top'
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingVertical: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.sm,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44
  },
  submitButtonDisabled: {
    backgroundColor: colors.gray300
  },
  submitButtonText: {
    color: colors.background,
    ...DesignSystem.typography.button
  },
  submitButtonTextDisabled: {
    color: colors.textTertiary
  },
  charCount: {
    ...DesignSystem.typography.caption,
    color: colors.textTertiary,
    textAlign: 'right',
    marginTop: DesignSystem.spacing.xs
  },
  chartContainer: {
    flex: 1
  },
  newQueryButton: {
    margin: DesignSystem.spacing.md,
    backgroundColor: colors.primary,
    paddingVertical: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borderRadius.sm,
    alignItems: 'center'
  },
  newQueryButtonText: {
    color: colors.background,
    ...DesignSystem.typography.button
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DesignSystem.spacing.lg
  },
  loadingText: {
    marginTop: DesignSystem.spacing.md,
    ...DesignSystem.typography.body,
    color: colors.textSecondary,
    textAlign: 'center'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DesignSystem.spacing.lg
  },
  errorTitle: {
    ...DesignSystem.typography.h4,
    color: colors.error,
    marginBottom: DesignSystem.spacing.sm
  },
  errorMessage: {
    ...DesignSystem.typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: DesignSystem.spacing.lg,
    lineHeight: 20
  },
  errorButtons: {
    flexDirection: 'row',
    gap: DesignSystem.spacing.sm
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingVertical: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borderRadius.sm
  },
  retryButtonText: {
    color: colors.background,
    ...DesignSystem.typography.button
  }
});