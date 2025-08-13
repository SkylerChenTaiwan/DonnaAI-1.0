/**
 * 錯誤日誌檢視畫面
 * 顯示應用程式的歷史錯誤記錄
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { errorLogger } from '@/services/error/ErrorLogger';
import { ErrorDisplay } from '@/components/developer/ErrorDisplay';
import { ErrorReporter } from '@/services/error/ErrorReporter';
import { ErrorReport } from '@/types/error';
import { formatDistanceToNow } from '@/utils/dateHelpers';

export const ErrorLogsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [logs, setLogs] = useState<ErrorReport[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedError, setSelectedError] = useState<string | null>(null);
  const [showReporter, setShowReporter] = useState(false);
  
  /**
   * 載入錯誤日誌
   */
  const loadLogs = async () => {
    try {
      const allLogs = await errorLogger.getAllLogs();
      setLogs(allLogs);
    } catch (error) {
      console.error('載入錯誤日誌失敗:', error);
      Alert.alert('錯誤', '無法載入錯誤日誌');
    }
  };
  
  /**
   * 重新整理
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadLogs();
    setRefreshing(false);
  };
  
  /**
   * 清除所有日誌
   */
  const handleClearLogs = () => {
    Alert.alert(
      '確認清除',
      '確定要清除所有錯誤日誌嗎？此操作無法復原。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '清除',
          style: 'destructive',
          onPress: async () => {
            await errorLogger.clearLogs();
            setLogs([]);
            Alert.alert('成功', '錯誤日誌已清除');
          }
        }
      ]
    );
  };
  
  /**
   * 處理錯誤項目點擊
   */
  const handleErrorPress = (errorId: string) => {
    setSelectedError(errorId);
    setShowReporter(true);
  };
  
  /**
   * 取得嚴重程度顏色
   */
  const getSeverityColor = (severity: ErrorReport['severity']) => {
    switch (severity) {
      case 'critical': return '#E53E3E';
      case 'high': return '#ED8936';
      case 'medium': return '#F6E05E';
      case 'low': return '#48BB78';
      default: return '#A0AEC0';
    }
  };
  
  /**
   * 渲染錯誤項目
   */
  const renderErrorItem = ({ item }: { item: ErrorReport }) => {
    return (
      <TouchableOpacity
        style={styles.errorItem}
        onPress={() => handleErrorPress(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.errorHeader}>
          <View style={StyleSheet.flatten([
            styles.severityIndicator,
            { backgroundColor: getSeverityColor(item.severity) }
          ])} />
          <View style={styles.errorInfo}>
            <Text style={styles.errorMessage} numberOfLines={2}>
              {item.error.message}
            </Text>
            <View style={styles.errorMeta}>
              <Text style={styles.errorTime}>
                {formatDistanceToNow(item.timestamp)}
              </Text>
              {item.context.screen && (
                <Text style={styles.errorScreen}>
                  📍 {item.context.screen}
                </Text>
              )}
            </View>
          </View>
          <Text style={styles.chevron}>›</Text>
        </View>
      </TouchableOpacity>
    );
  };
  
  /**
   * 渲染空狀態
   */
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🎉</Text>
      <Text style={styles.emptyTitle}>沒有錯誤記錄</Text>
      <Text style={styles.emptyDescription}>
        太好了！目前沒有任何錯誤發生
      </Text>
    </View>
  );
  
  /**
   * 渲染統計資訊
   */
  const renderStatistics = () => {
    const stats = errorLogger.getStatistics();
    
    return (
      <View style={styles.statistics}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>總錯誤數</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.last24Hours}</Text>
          <Text style={styles.statLabel}>24小時內</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={StyleSheet.flatten([
            styles.statValue,
            { color: getSeverityColor('critical') }
          ])}>
            {stats.bySeverity.critical}
          </Text>
          <Text style={styles.statLabel}>關鍵錯誤</Text>
        </View>
      </View>
    );
  };
  
  useEffect(() => {
    loadLogs();
  }, []);
  
  useEffect(() => {
    // 設定導航標題
    navigation.setOptions({
      title: '錯誤日誌',
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleClearLogs}
          disabled={logs.length === 0}
        >
          <Text style={StyleSheet.flatten([
            styles.headerButtonText,
            logs.length === 0 && styles.disabledText
          ])}>
            清除
          </Text>
        </TouchableOpacity>
      )
    });
  }, [navigation, logs.length]);
  
  return (
    <SafeAreaView style={styles.container}>
      {/* 統計資訊 */}
      {logs.length > 0 && renderStatistics()}
      
      {/* 錯誤列表 */}
      <FlatList
        data={logs}
        keyExtractor={item => item.id}
        renderItem={renderErrorItem}
        contentContainerStyle={[
          styles.listContent,
          logs.length === 0 && styles.emptyListContent
        ]}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#3182CE"
          />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
      
      {/* 錯誤報告工具 */}
      {selectedError && (
        <ErrorReporter
          errorId={selectedError}
          visible={showReporter}
          onClose={() => {
            setShowReporter(false);
            setSelectedError(null);
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC'
  },
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  headerButtonText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500'
  },
  disabledText: {
    color: '#CBD5E0'
  },
  statistics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  statItem: {
    alignItems: 'center'
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 4
  },
  statLabel: {
    fontSize: 12,
    color: '#718096'
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 100
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center'
  },
  errorItem: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  severityIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12
  },
  errorInfo: {
    flex: 1
  },
  errorMessage: {
    fontSize: 15,
    color: '#2D3748',
    fontWeight: '500',
    marginBottom: 4
  },
  errorMeta: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  errorTime: {
    fontSize: 13,
    color: '#718096',
    marginRight: 12
  },
  errorScreen: {
    fontSize: 13,
    color: '#4A5568'
  },
  chevron: {
    fontSize: 20,
    color: '#CBD5E0',
    marginLeft: 8
  },
  separator: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginLeft: 32
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 40
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 8
  },
  emptyDescription: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 20
  }
});