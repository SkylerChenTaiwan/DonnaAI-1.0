/**
 * 紀錄詳細資料頁面
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Icon } from '@/components/common/Icon';
import { SmartLayout } from '@/components/layout/SmartLayout';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useRecordStore } from '@/stores/recordStore';
import { useCustomerStore } from '@/stores/customerStore';
import { RootStackParamList } from '@/types/navigation';

type RecordDetailRouteProp = RouteProp<RootStackParamList, 'RecordDetail'>;
type RecordDetailNavigationProp = StackNavigationProp<RootStackParamList, 'RecordDetail'>;

export const RecordDetailScreen: React.FC = () => {
  const navigation = useNavigation<RecordDetailNavigationProp>();
  const route = useRoute<RecordDetailRouteProp>();
  const { recordId } = route.params;
  
  const { records, isLoading: recordLoading } = useRecordStore();
  const { customers } = useCustomerStore();
  
  const record = records?.find(r => r.id === recordId);
  const customer = record && record.customerIds?.length > 0 
    ? customers.find(c => record.customerIds.includes(c.id!)) 
    : null;

  // 處理返回
  const handleBack = () => {
    navigation.goBack();
  };

  if (recordLoading || !record) {
    return (
      <SmartLayout style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1A1A1A" />
          <Text style={styles.loadingText}>載入中...</Text>
        </View>
      </SmartLayout>
    );
  }

  return (
    <SmartLayout style={styles.container} scrollable={false}>
      {/* 自定義標題列 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="chevron-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {record.type === 'meeting' ? '會議紀錄' : '通話紀錄'}
        </Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => navigation.navigate('EditRecord', { recordId })}
        >
          <Icon name="create-outline" size={24} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 基本資訊區塊 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>基本資訊</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>類型</Text>
            <View style={[styles.typeBadge, record.type === 'meeting' && styles.typeMeeting]}>
              <Icon 
                name={record.type === 'meeting' ? 'people' : 'call'} 
                size={16} 
                color="#1C1C1E" 
              />
              <Text style={styles.typeText}>
                {record.type === 'meeting' ? '會議' : '通話'}
              </Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>客戶</Text>
            <TouchableOpacity 
              onPress={() => customer && navigation.navigate('CustomerDetail', { customerId: customer.id! })}
            >
              <Text style={[styles.value, styles.linkText]}>
                {customer?.name || '多位客戶'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>日期</Text>
            <Text style={styles.value}>
              {new Date(record.createdAt.seconds * 1000).toLocaleDateString('zh-TW')}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>時間</Text>
            <Text style={styles.value}>
              {new Date(record.createdAt.seconds * 1000).toLocaleTimeString('zh-TW', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>

        {/* 內容區塊 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>紀錄內容</Text>
          <View style={styles.contentContainer}>
            <Text style={styles.contentText}>
              {record.content || '無內容'}
            </Text>
          </View>
        </View>

        {/* 摘要區塊 */}
        {record.aiSummary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI 摘要</Text>
            <View style={styles.contentContainer}>
              <Text style={styles.contentText}>
                {record.aiSummary}
              </Text>
            </View>
          </View>
        )}

        {/* 後續行動區塊 */}
        {record.aiActionItems && record.aiActionItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>行動項目</Text>
            {record.aiActionItems.map((item, index) => (
              <View key={index} style={styles.nextStepItem}>
                <Icon name="checkmark-circle-outline" size={20} color="#1A1A1A" />
                <Text style={styles.nextStepText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 建立資訊 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>建立資訊</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>建立者</Text>
            <Text style={styles.value}>{record.createdBy || '-'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>建立時間</Text>
            <Text style={styles.value}>
              {new Date(record.createdAt.seconds * 1000).toLocaleString('zh-TW')}
            </Text>
          </View>
          {record.updatedAt && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>最後更新</Text>
              <Text style={styles.value}>
                {new Date(record.updatedAt.seconds * 1000).toLocaleString('zh-TW')}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SmartLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginHorizontal: 16,
    textAlign: 'center',
  },
  editButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E5EA',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  label: {
    fontSize: 16,
    color: '#8E8E93',
    width: 100,
  },
  value: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
  },
  linkText: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    alignSelf: 'flex-start',
  },
  typeMeeting: {
    backgroundColor: '#E8F0FF',
  },
  typeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  contentContainer: {
    paddingHorizontal: 16,
  },
  contentText: {
    fontSize: 16,
    color: '#1C1C1E',
    lineHeight: 24,
  },
  nextStepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  nextStepText: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
    lineHeight: 20,
  },
});