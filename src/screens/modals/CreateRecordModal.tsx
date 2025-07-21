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
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { createRecord } from '@/services/firebase/records';
import { RecordCreateRequest } from '@/types/record';
import { showToast } from '@/utils/toast';
import { Ionicons } from '@expo/vector-icons';

type RouteParams = {
  CreateRecordModal: {
    mode?: 'audio' | 'text' | 'upload';
    customerId?: string;
  };
};

export const CreateRecordModal: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'CreateRecordModal'>>();
  const { user } = useAuth();
  const { currentOrganization, currentTeam } = useOrganization();
  
  // 從路由參數獲取模式，預設為音頻
  const initialMode = route.params?.mode || 'audio';
  const customerId = route.params?.customerId;
  
  const [mode, setMode] = useState<'audio' | 'text' | 'upload'>(initialMode);
  const [loading, setLoading] = useState(false);

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

      {/* 模式切換標籤 */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, mode === 'audio' && styles.activeTab]}
          onPress={() => setMode('audio')}
        >
          <Ionicons 
            name="mic" 
            size={20} 
            color={mode === 'audio' ? '#FF6B35' : '#8E8E93'} 
          />
          <Text style={[styles.tabText, mode === 'audio' && styles.activeTabText]}>
            語音錄製
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, mode === 'text' && styles.activeTab]}
          onPress={() => setMode('text')}
        >
          <Ionicons 
            name="create" 
            size={20} 
            color={mode === 'text' ? '#FF6B35' : '#8E8E93'} 
          />
          <Text style={[styles.tabText, mode === 'text' && styles.activeTabText]}>
            文字輸入
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, mode === 'upload' && styles.activeTab]}
          onPress={() => setMode('upload')}
          disabled // 暫時停用
        >
          <Ionicons 
            name="cloud-upload" 
            size={20} 
            color={mode === 'upload' ? '#FF6B35' : '#D1D1D6'} 
          />
          <Text style={[styles.tabText, mode === 'upload' && styles.activeTabText, styles.disabledTab]}>
            音檔上傳
          </Text>
        </TouchableOpacity>
      </View>

      {/* 內容區域 */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {mode === 'audio' && (
          <AudioInput 
            onComplete={handleAudioComplete}
            disabled={loading}
          />
        )}
        
        {mode === 'text' && (
          <RecordForm 
            onSubmit={handleFormSubmit}
            initialCustomerId={customerId}
            loading={loading}
          />
        )}
        
        {mode === 'upload' && (
          <View style={styles.uploadPlaceholder}>
            <Ionicons name="cloud-upload-outline" size={64} color="#D1D1D6" />
            <Text style={styles.placeholderText}>音檔上傳功能即將推出</Text>
          </View>
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: '#FFF5F0',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#FF6B35',
  },
  disabledTab: {
    color: '#D1D1D6',
  },
  content: {
    flex: 1,
  },
  uploadPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  placeholderText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 16,
    textAlign: 'center',
  },
});