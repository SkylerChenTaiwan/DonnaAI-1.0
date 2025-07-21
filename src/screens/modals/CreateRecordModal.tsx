/**
 * 新增紀錄 Modal
 * 支援多模態輸入（文字、語音）的記錄創建界面
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Alert, Text } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Timestamp } from 'firebase/firestore';

import { Layout } from '@/components/common/Layout';
import { RecordForm } from '@/components/forms/RecordForm';
import { RecordFormData } from '@/services/validation/form-schemas';
import { createRecord } from '@/services/firebase/records';
import { RecordDoc, RecordType, RecordStatus } from '@/types/record';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';

interface CreateRecordModalParams {
  customerId?: string;
  initialData?: Partial<RecordFormData>;
}

type CreateRecordRouteProp = RouteProp<{
  CreateRecordModal: CreateRecordModalParams;
}, 'CreateRecordModal'>;

export const CreateRecordModal: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<CreateRecordRouteProp>();
  const { user } = useAuth();
  const { currentOrganization, currentTeam } = useOrganization();
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 從路由參數取得初始資料
  const { customerId, initialData } = route.params || {};

  // 轉換表單資料為 RecordDoc 格式
  const convertFormDataToRecordDoc = (
    formData: RecordFormData
  ): Omit<RecordDoc, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> => {
    // 處理客戶 ID 陣列
    let customerIds: string[] = [];
    if (formData.customerIds && formData.customerIds.length > 0) {
      customerIds = formData.customerIds;
    } else if (formData.customerId) {
      customerIds = [formData.customerId];
    } else if (customerId) {
      customerIds = [customerId];
    }

    // 處理排程時間
    let scheduledAt: Timestamp | undefined;
    if (formData.scheduledAt) {
      try {
        scheduledAt = Timestamp.fromDate(new Date(formData.scheduledAt));
      } catch (error) {
        console.error('排程時間格式錯誤:', error);
      }
    }

    return {
      type: formData.type as RecordType,
      title: formData.title,
      content: formData.content,
      customerIds,
      participantIds: formData.participantIds || [],
      scheduledAt,
      duration: formData.duration,
      location: formData.location,
      status: mapFormStatusToRecordStatus(formData.status),
      processingPreference: formData.processingPreference || 'immediate',
      teamId: currentTeam!.id,
      organizationId: currentOrganization!.id,
    };
  };

  // 狀態映射函數
  const mapFormStatusToRecordStatus = (formStatus: string): RecordStatus => {
    switch (formStatus) {
      case 'pending':
      case 'in_progress':
        return 'processing';
      case 'completed':
      case 'archived':
        return 'completed';
      case 'draft':
      default:
        return 'draft';
    }
  };

  const handleSubmit = useCallback(async (data: RecordFormData) => {
    if (!user || !currentOrganization || !currentTeam) {
      Alert.alert('錯誤', '缺少必要的使用者資訊');
      return;
    }

    try {
      setIsSubmitting(true);

      // 轉換表單資料為 RecordDoc 格式
      const recordData = convertFormDataToRecordDoc(data);

      // 創建記錄
      const createdRecord = await createRecord(recordData, user.uid);

      // 顯示成功訊息
      Alert.alert(
        '成功',
        '記錄已成功創建',
        [
          {
            text: '確定',
            onPress: () => {
              navigation.goBack();
              // TODO: 可以在這裡導航到記錄詳細頁面
              // navigation.navigate('RecordDetail', { recordId: createdRecord.id });
            }
          }
        ]
      );

    } catch (error) {
      console.error('創建記錄失敗:', error);
      Alert.alert(
        '創建失敗',
        error instanceof Error ? error.message : '記錄創建失敗，請重試'
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [user, currentOrganization, currentTeam, customerId, navigation]);

  const handleCancel = useCallback(() => {
    if (isSubmitting) {
      Alert.alert(
        '確認取消',
        '正在創建記錄中，確定要取消嗎？',
        [
          { text: '繼續創建', style: 'cancel' },
          { text: '取消', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  }, [isSubmitting, navigation]);

  if (!user || !currentOrganization || !currentTeam) {
    return (
      <Layout style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>載入中...</Text>
        </View>
      </Layout>
    );
  }

  return (
    <Layout style={styles.container}>
      <RecordForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        initialData={initialData}
        isSubmitting={isSubmitting}
        userId={user.uid}
        organizationId={currentOrganization.id}
        teamId={currentTeam.id}
      />
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#7A7A7A',
    textAlign: 'center',
  },
});