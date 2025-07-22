/**
 * 新增記錄 Modal - 支援多模態輸入
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Layout } from '@/components/common/Layout';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RecordForm } from '@/components/forms/RecordForm';
import { SimplifiedAudioInput } from '@/components/input/SimplifiedAudioInput';
import { RecordPurposeSelector } from '@/components/modals/RecordPurposeSelector';
import { InputMethodLink } from '@/components/modals/InputMethodLink';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { createRecord } from '@/services/firebase/records';
import { RecordCreateRequest } from '@/types/record';
import { showToast } from '../../utils/toast';
import { Ionicons } from '@expo/vector-icons';
import type { AudioPurpose } from '@/components/input/AudioInput';

type RouteParams = {
  CreateRecordModal: {
    mode?: 'audio' | 'text';
    customerId?: string;
  };
};

export const CreateRecordModal: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'CreateRecordModal'>>();
  const { user } = useAuth();
  const { currentOrganization, currentTeam } = useOrganization();
  
  // 從路由參數獲取模式，預設為音頻
  const mode = route.params?.mode || 'audio';
  const customerId = route.params?.customerId;
  
  const [loading, setLoading] = useState(false);
  const [showPurposeSelector, setShowPurposeSelector] = useState(false);
  const [recordingData, setRecordingData] = useState<{ audioUri: string; duration: number } | null>(null);
  
  // 切換到文字輸入模式
  const switchToText = useCallback(() => {
    navigation.setParams({ mode: 'text' });
  }, [navigation]);
  
  // 切換到音頻錄製模式
  const switchToAudio = useCallback(() => {
    navigation.setParams({ mode: 'audio' });
  }, [navigation]);

  // 處理表單提交
  const handleFormSubmit = useCallback(async (data: RecordCreateRequest) => {
    if (!user || !currentOrganization || !currentTeam) {
      showToast('error', '請先登入');
      return;
    }

    setLoading(true);
    try {
      await createRecord(data);
      showToast('success', '紀錄建立成功');
      navigation.goBack();
    } catch (error) {
      console.error('Error creating record:', error);
      showToast('error', '建立紀錄失敗');
    } finally {
      setLoading(false);
    }
  }, [user, currentOrganization, currentTeam, navigation]);

  // 處理音頻錄製完成 - 顯示用途選擇器
  const handleAudioComplete = useCallback((audioUri: string, duration: number) => {
    setRecordingData({ audioUri, duration });
    setShowPurposeSelector(true);
  }, []);

  // 處理用途選擇
  const handlePurposeSelect = useCallback(async (purpose: AudioPurpose) => {
    if (!user || !currentOrganization || !currentTeam || !recordingData) {
      showToast('error', '請先登入');
      return;
    }

    setLoading(true);
    setShowPurposeSelector(false);
    
    try {
      // TODO: 上傳音頻到 Firebase Storage
      // TODO: 呼叫 Cloud Function 進行語音轉文字
      
      // 根據用途決定記錄類型
      const recordType = purpose === 'meeting' ? 'meeting' : 
                        purpose === 'customer' ? 'call' : 
                        'note';
      
      const recordData: RecordCreateRequest = {
        type: recordType,
        content: `[${getPurposeLabel(purpose)}] 音頻紀錄處理中...`,
        audioUrl: recordingData.audioUri,
        audioDuration: recordingData.duration,
        customerIds: customerId ? [customerId] : [],
        organizationId: currentOrganization.id,
        teamId: currentTeam.id,
        metadata: {
          audioPurpose: purpose,
        },
      };
      
      await createRecord(recordData);
      showToast('success', '音頻紀錄已儲存');
      navigation.goBack();
    } catch (error) {
      console.error('Error saving audio record:', error);
      showToast('error', '儲存音頻失敗');
    } finally {
      setLoading(false);
    }
  }, [user, currentOrganization, currentTeam, customerId, recordingData, navigation]);

  // 取消用途選擇
  const handlePurposeCancel = useCallback(() => {
    setShowPurposeSelector(false);
    setRecordingData(null);
  }, []);

  // 獲取用途標籤
  const getPurposeLabel = (purpose: AudioPurpose): string => {
    const labels: Record<AudioPurpose, string> = {
      meeting: '會議記錄',
      note: '補充記錄',
      task: '任務說明',
      customer: '客戶通話',
      other: '其他用途',
    };
    return labels[purpose] || '錄音';
  };

  return (
    <Layout style={styles.container}>
      {/* 內容區域 */}
      {mode === 'audio' ? (
        <View style={styles.audioContent}>
          {/* 文字輸入連結 - 小而不突兀 */}
          <TouchableOpacity
            style={styles.textInputLink}
            onPress={switchToText}
            activeOpacity={0.7}
          >
            <Text style={styles.linkText}>使用文字輸入</Text>
            <Ionicons name="arrow-forward" size={16} color="#FF6B35" />
          </TouchableOpacity>
          
          {/* 簡化的錄音介面 */}
          <SimplifiedAudioInput
            onComplete={handleAudioComplete}
            disabled={loading}
          />
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 切換到語音錄製的連結 */}
          <InputMethodLink
            targetLabel="改用語音錄製 →"
            onSwitch={switchToAudio}
          />
          <RecordForm 
            onSubmit={handleFormSubmit}
            initialData={customerId ? { customerIds: [customerId] } : undefined}
            isSubmitting={loading}
            userId={user?.uid || ''}
            organizationId={currentOrganization?.id || ''}
            teamId={currentTeam?.id || ''}
          />
        </ScrollView>
      )}

      {/* 錄音用途選擇器 */}
      <RecordPurposeSelector
        visible={showPurposeSelector}
        onSelect={handlePurposeSelect}
        onCancel={handlePurposeCancel}
        audioUri={recordingData?.audioUri || ''}
        duration={recordingData?.duration || 0}
      />
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
  },
  audioContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  textInputLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 20,
    gap: 6,
  },
  linkText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '500',
  },
});