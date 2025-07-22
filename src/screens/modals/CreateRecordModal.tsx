/**
 * 新增記錄 Modal - 支援多模態輸入
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Button } from '@/components/common/Button';
import { Layout } from '@/components/common/Layout';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RecordForm } from '@/components/forms/RecordForm';
import { AudioInput } from '@/components/input/AudioInput';
import { InputMethodLink } from '@/components/modals/InputMethodLink';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { createRecord } from '@/services/firebase/records';
import { RecordCreateRequest } from '@/types/record';
import { showToast } from '../../utils/toast';
import { Ionicons } from '@expo/vector-icons';

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

  // 處理音頻錄製完成
  const handleAudioComplete = useCallback(async (audioUri: string, duration: number) => {
    if (!user || !currentOrganization || !currentTeam) {
      showToast('error', '請先登入');
      return;
    }

    setLoading(true);
    try {
      // TODO: 上傳音頻到 Firebase Storage
      // TODO: 呼叫 Cloud Function 進行語音轉文字
      
      const recordData: RecordCreateRequest = {
        type: 'meeting',
        content: '音頻紀錄處理中...',
        audioUrl: audioUri,
        audioDuration: duration,
        customerIds: customerId ? [customerId] : [],
        organizationId: currentOrganization.id,
        teamId: currentTeam.id,
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
  }, [user, currentOrganization, currentTeam, customerId, navigation]);

  return (
    <Layout style={styles.container}>
      {/* 標題欄 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.title}>建立紀錄</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* 內容區域 */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {mode === 'audio' ? (
          <>
            {/* 切換到文字輸入的連結 */}
            <InputMethodLink
              targetLabel="改用文字輸入 →"
              onSwitch={switchToText}
            />
            <AudioInput 
              onComplete={handleAudioComplete}
              disabled={loading}
            />
          </>
        ) : (
          <>
            {/* 切換到語音錄製的連結 */}
            <InputMethodLink
              targetLabel="改用語音錄製 →"
              onSwitch={switchToAudio}
            />
            <RecordForm 
              onSubmit={handleFormSubmit}
              initialCustomerId={customerId}
              loading={loading}
            />
          </>
        )}
      </ScrollView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
});