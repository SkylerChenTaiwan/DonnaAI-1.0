/**
 * 會議記錄主畫面
 * 整合錄音、會議列表、補救錄音等功能
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Layout } from '@/components/common/Layout';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { MakeupRecording } from '@/components/meetings/MakeupRecording';
import { ConfirmationInterface } from '@/components/ai/ConfirmationInterface';
import { useRecordStore } from '@/stores/recordStore';
import { useAuthStore } from '@/stores/authStore';
import { notificationService, initializeNotifications, scheduleMeetingReminder } from '@/services/notifications';
import { RecordDoc } from '@/types/record';

type RootStackParamList = {
  Recording: {
    recordId?: string;
    meetingTitle?: string;
    isNewRecording?: boolean;
  };
  AIConfirmation: {
    recordId: string;
  };
};

type MeetingsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface MeetingQuickAction {
  id: string;
  title: string;
  description: string;
  action: () => void;
  color: string;
  icon: string;
}

export const MeetingsScreen: React.FC = () => {
  const navigation = useNavigation<MeetingsScreenNavigationProp>();
  const { user } = useAuthStore();
  const { 
    records, 
    isLoading, 
    fetchRecords, 
    subscribeToRecords,
    unsubscribeFromRecords 
  } = useRecordStore();

  const [showMakeupRecording, setShowMakeupRecording] = useState(false);
  const [showAIConfirmation, setShowAIConfirmation] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [notificationsInitialized, setNotificationsInitialized] = useState(false);

  // 初始化
  useEffect(() => {
    initializeScreen();
    
    return () => {
      unsubscribeFromRecords();
    };
  }, [user]);

  // 初始化畫面
  const initializeScreen = async () => {
    if (!user) return;

    try {
      // 初始化通知服務
      const notificationSuccess = await initializeNotifications();
      if (notificationSuccess) {
        await notificationService.registerUserToken(user.uid);
        setNotificationsInitialized(true);
      }

      // 載入會議記錄
      await fetchRecords(user.uid);
      
      // 訂閱即時更新
      if (user.teamId) {
        subscribeToRecords(user.teamId, user.uid);
      }

    } catch (error) {
      console.error('初始化會議畫面失敗:', error);
    }
  };

  // 開始新錄音
  const handleStartNewRecording = () => {
    navigation.navigate('Recording', {
      isNewRecording: true,
      meetingTitle: `會議記錄 - ${new Date().toLocaleDateString('zh-TW')}`
    });
  };

  // 開始補救錄音
  const handleStartMakeupRecording = () => {
    setShowMakeupRecording(true);
  };

  // 排程會議提醒
  const handleScheduleReminder = async () => {
    try {
      const meetingTitle = `預定會議 - ${new Date().toLocaleDateString('zh-TW')}`;
      const meetingTime = new Date();
      meetingTime.setMinutes(meetingTime.getMinutes() + 5); // 5分鐘後的提醒

      if (user) {
        await scheduleMeetingReminder(
          `meeting_${Date.now()}`,
          user.uid,
          meetingTitle,
          meetingTime,
          2 // 提前2分鐘提醒
        );
        
        Alert.alert(
          '提醒已設定',
          `會議提醒已設定，將在 ${meetingTime.toLocaleTimeString('zh-TW')} 提醒您開始錄音。`
        );
      }
    } catch (error) {
      console.error('設定會議提醒失敗:', error);
      Alert.alert('設定失敗', '無法設定會議提醒');
    }
  };

  // 查看會議記錄詳情
  const handleViewRecord = (record: RecordDoc) => {
    if (record.aiConfirmationStatus === 'pending') {
      setSelectedRecordId(record.id!);
      setShowAIConfirmation(true);
    } else {
      // 導航到記錄詳情頁面
      console.log('查看會議記錄:', record.id);
    }
  };

  // 補救錄音完成
  const handleMakeupRecordingComplete = (recordId: string) => {
    setShowMakeupRecording(false);
    setSelectedRecordId(recordId);
    setShowAIConfirmation(true);
  };

  // AI 確認完成
  const handleAIConfirmationComplete = () => {
    setShowAIConfirmation(false);
    setSelectedRecordId(null);
    // 重新載入記錄列表
    if (user) {
      fetchRecords(user.uid);
    }
  };

  // 快速操作項目
  const quickActions: MeetingQuickAction[] = [
    {
      id: 'new_recording',
      title: '開始錄音',
      description: '立即開始會議錄音',
      action: handleStartNewRecording,
      color: '#22c55e',
      icon: '🎙️'
    },
    {
      id: 'makeup_recording',
      title: '補救錄音',
      description: '為已結束的會議建立記錄',
      action: handleStartMakeupRecording,
      color: '#3b82f6',
      icon: '📝'
    },
    {
      id: 'schedule_reminder',
      title: '設定提醒',
      description: '排程會議錄音提醒',
      action: handleScheduleReminder,
      color: '#f59e0b',
      icon: '⏰'
    }
  ];

  // 格式化記錄狀態
  const getRecordStatusText = (record: RecordDoc): string => {
    if (record.audioRecordingState?.status === 'processing') return '處理中';
    if (record.aiConfirmationStatus === 'pending') return '待確認';
    if (record.status === 'completed') return '已完成';
    return '草稿';
  };

  // 獲取記錄狀態顏色
  const getRecordStatusColor = (record: RecordDoc): string => {
    if (record.audioRecordingState?.status === 'processing') return '#f59e0b';
    if (record.aiConfirmationStatus === 'pending') return '#3b82f6';
    if (record.status === 'completed') return '#22c55e';
    return '#6b7280';
  };

  // 渲染快速操作
  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Text style={styles.sectionTitle}>快速操作</Text>
      <View style={styles.quickActionsGrid}>
        {quickActions.map((action) => (
          <Button
            key={action.id}
            title={`${action.icon} ${action.title}`}
            onPress={action.action}
            style={[styles.quickActionButton, { backgroundColor: action.color }]}
            textStyle={styles.quickActionText}
          />
        ))}
      </View>
    </View>
  );

  // 渲染會議記錄列表
  const renderRecordsList = () => (
    <View style={styles.recordsContainer}>
      <Text style={styles.sectionTitle}>最近的會議記錄</Text>
      
      {records.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>尚無會議記錄</Text>
          <Text style={styles.emptyStateSubtext}>點擊上方按鈕開始您的第一個會議錄音</Text>
        </View>
      ) : (
        <ScrollView style={styles.recordsList}>
          {records.slice(0, 10).map((record) => (
            <View key={record.id} style={styles.recordItem}>
              <View style={styles.recordHeader}>
                <Text style={styles.recordTitle}>{record.title}</Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getRecordStatusColor(record) }
                ]}>
                  <Text style={styles.statusText}>
                    {getRecordStatusText(record)}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.recordDate}>
                {record.createdAt?.toDate?.()?.toLocaleDateString('zh-TW') || ''}
              </Text>
              
              {record.recordingType && (
                <Text style={styles.recordType}>
                  類型：{record.recordingType === 'live' ? '實時錄音' : 
                        record.recordingType === 'voice_summary' ? '語音摘要' : '文字摘要'}
                </Text>
              )}
              
              <Button
                title={record.aiConfirmationStatus === 'pending' ? '待確認 AI 建議' : '查看詳情'}
                onPress={() => handleViewRecord(record)}
                style={[
                  styles.recordActionButton,
                  record.aiConfirmationStatus === 'pending' && styles.pendingActionButton
                ]}
                textStyle={styles.recordActionText}
              />
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );

  if (isLoading && records.length === 0) {
    return (
      <Layout>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" />
          <Text style={styles.loadingText}>載入會議記錄...</Text>
        </View>
      </Layout>
    );
  }

  return (
    <Layout>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>會議記錄</Text>
          <Text style={styles.subtitle}>
            智能會議記錄與 AI 分析系統
          </Text>
          {notificationsInitialized && (
            <Text style={styles.notificationStatus}>📱 推播通知已啟用</Text>
          )}
        </View>

        {renderQuickActions()}
        {renderRecordsList()}
      </ScrollView>

      {/* 補救錄音模態框 */}
      <Modal
        visible={showMakeupRecording}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <MakeupRecording
          meetingTitle="補救會議記錄"
          onComplete={handleMakeupRecordingComplete}
          onCancel={() => setShowMakeupRecording(false)}
        />
      </Modal>

      {/* AI 確認模態框 */}
      <Modal
        visible={showAIConfirmation}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        {selectedRecordId && (
          <ConfirmationInterface
            recordId={selectedRecordId}
            onComplete={handleAIConfirmationComplete}
            onCancel={() => setShowAIConfirmation(false)}
          />
        )}
      </Modal>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  notificationStatus: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  quickActionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionsGrid: {
    gap: 12,
  },
  quickActionButton: {
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  quickActionText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  recordsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  recordsList: {
    maxHeight: 400,
  },
  recordItem: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ffffff',
  },
  recordDate: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  recordType: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 12,
  },
  recordActionButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  pendingActionButton: {
    backgroundColor: '#f59e0b',
  },
  recordActionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});