/**
 * 多模態輸入系統測試介面
 * 執行並顯示所有功能測試結果
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Layout } from '@/components/common/Layout';
import { runCompleteTestSuite, TestSuite, TestResult } from '@/utils/testValidator';
import { generateCompleteTestDataSet } from '@/utils/testData';

interface TestScreenState {
  isRunning: boolean;
  testResults: TestSuite[] | null;
  overallResult: any;
  showDetails: Set<string>;
}

export const TestScreen: React.FC = () => {
  const [state, setState] = useState<TestScreenState>({
    isRunning: false,
    testResults: null,
    overallResult: null,
    showDetails: new Set(),
  });

  // 執行測試
  const runTests = async () => {
    setState(prev => ({ ...prev, isRunning: true, testResults: null }));
    
    try {
      const results = await runCompleteTestSuite();
      setState(prev => ({
        ...prev,
        isRunning: false,
        testResults: results.suites,
        overallResult: results.overallResult,
      }));
    } catch (error) {
      console.error('測試執行失敗:', error);
      Alert.alert('測試失敗', `無法執行測試: ${error}`);
      setState(prev => ({ ...prev, isRunning: false }));
    }
  };

  // 生成測試資料
  const generateTestData = () => {
    try {
      const testData = generateCompleteTestDataSet();
      Alert.alert(
        '測試資料已生成',
        `客戶: ${testData.summary.customers} 筆\n` +
        `記錄: ${testData.summary.records} 筆\n` +
        `任務: ${testData.summary.tasks} 筆\n` +
        `音頻: ${testData.summary.audioFiles} 個\n` +
        `CSV: ${testData.summary.csvRows} 行`,
        [{ text: '確定' }]
      );
    } catch (error) {
      Alert.alert('生成失敗', `無法生成測試資料: ${error}`);
    }
  };

  // 切換詳細資訊顯示
  const toggleDetails = (suiteId: string) => {
    setState(prev => {
      const newShowDetails = new Set(prev.showDetails);
      if (newShowDetails.has(suiteId)) {
        newShowDetails.delete(suiteId);
      } else {
        newShowDetails.add(suiteId);
      }
      return { ...prev, showDetails: newShowDetails };
    });
  };

  // 渲染測試結果圖示
  const renderResultIcon = (passed: boolean) => (
    <Ionicons
      name={passed ? 'checkmark-circle' : 'close-circle'}
      size={20}
      color={passed ? '#28A745' : '#DC3545'}
    />
  );

  // 渲染測試套件
  const renderTestSuite = (suite: TestSuite) => {
    const isExpanded = state.showDetails.has(suite.name);
    
    return (
      <View key={suite.name} style={styles.testSuite}>
        <TouchableOpacity
          style={styles.suiteHeader}
          onPress={() => toggleDetails(suite.name)}
          activeOpacity={0.7}
        >
          <View style={styles.suiteInfo}>
            {renderResultIcon(suite.passed)}
            <Text style={[styles.suiteName, !suite.passed && styles.failedText]}>
              {suite.name}
            </Text>
          </View>
          <View style={styles.suiteStats}>
            <Text style={styles.suiteStatsText}>
              {suite.passedTests}/{suite.totalTests}
            </Text>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="#666666"
            />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.suiteDetails}>
            {suite.results.map(result => renderTestResult(result))}
          </View>
        )}
      </View>
    );
  };

  // 渲染測試結果
  const renderTestResult = (result: TestResult) => (
    <View key={result.name} style={styles.testResult}>
      <View style={styles.resultHeader}>
        {renderResultIcon(result.passed)}
        <Text style={[styles.resultName, !result.passed && styles.failedText]}>
          {result.name}
        </Text>
      </View>
      <Text style={styles.resultMessage}>{result.message}</Text>
      {result.details && (
        <View style={styles.resultDetails}>
          <Text style={styles.detailsText}>
            {JSON.stringify(result.details, null, 2)}
          </Text>
        </View>
      )}
    </View>
  );

  // 渲染總結
  const renderOverallSummary = () => {
    if (!state.overallResult) return null;

    const { overallResult } = state;
    
    return (
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>測試總結</Text>
        <View style={styles.summaryStats}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>測試套件:</Text>
            <Text style={[
              styles.summaryValue,
              overallResult.passed ? styles.passedText : styles.failedText
            ]}>
              {overallResult.passedSuites}/{overallResult.totalSuites}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>測試項目:</Text>
            <Text style={[
              styles.summaryValue,
              overallResult.passed ? styles.passedText : styles.failedText
            ]}>
              {overallResult.passedTests}/{overallResult.totalTests}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>整體結果:</Text>
            <View style={styles.summaryResultContainer}>
              {renderResultIcon(overallResult.passed)}
              <Text style={[
                styles.summaryResult,
                overallResult.passed ? styles.passedText : styles.failedText
              ]}>
                {overallResult.passed ? '全部通過' : '部分失敗'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Layout style={styles.container} scrollable={false}>
      <View style={styles.header}>
        <Text style={styles.title}>多模態輸入系統測試</Text>
        <Text style={styles.subtitle}>驗證所有輸入方式和功能</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={runTests}
          disabled={state.isRunning}
          activeOpacity={0.7}
        >
          {state.isRunning ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="play" size={20} color="#FFFFFF" />
          )}
          <Text style={styles.primaryButtonText}>
            {state.isRunning ? '測試執行中...' : '執行全部測試'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={generateTestData}
          activeOpacity={0.7}
        >
          <Ionicons name="database" size={20} color="#1A1A1A" />
          <Text style={styles.secondaryButtonText}>生成測試資料</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.results} showsVerticalScrollIndicator={true}>
        {renderOverallSummary()}

        {state.testResults && state.testResults.map(suite => renderTestSuite(suite))}

        {state.testResults && (
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              測試完成時間: {new Date().toLocaleString('zh-TW')}
            </Text>
          </View>
        )}
      </ScrollView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E3E1DC',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#7A7A7A',
  },
  controls: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E3E1DC',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#1A1A1A',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E3E1DC',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  results: {
    flex: 1,
  },
  summary: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  summaryStats: {
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 16,
    color: '#7A7A7A',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  summaryResultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryResult: {
    fontSize: 16,
    fontWeight: '600',
  },
  testSuite: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  suiteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  suiteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  suiteName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  suiteStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  suiteStatsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7A7A7A',
  },
  suiteDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  testResult: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#E3E1DC',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  resultMessage: {
    fontSize: 14,
    color: '#7A7A7A',
    marginBottom: 8,
  },
  resultDetails: {
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E3E1DC',
  },
  detailsText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#666666',
  },
  passedText: {
    color: '#28A745',
  },
  failedText: {
    color: '#DC3545',
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#7A7A7A',
  },
});