/**
 * 客戶詳細資料頁面
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
import { Ionicons } from '@expo/vector-icons';
import { Layout } from '@/components/common/Layout';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useCustomerStore } from '@/stores/customerStore';
import { useRecordStore } from '@/stores/recordStore';
import { useTaskStore } from '@/stores/taskStore';
import { RootStackParamList } from '@/types/navigation';

type CustomerDetailRouteProp = RouteProp<RootStackParamList, 'CustomerDetail'>;
type CustomerDetailNavigationProp = StackNavigationProp<RootStackParamList, 'CustomerDetail'>;

// 輔助函數
const getTaskStatusStyle = (status: string) => {
  switch (status) {
    case 'completed':
      return styles.taskStatuscompleted;
    case 'in_progress':
      return styles.taskStatusinProgress;
    case 'cancelled':
      return styles.taskStatuscancelled;
    default:
      return styles.taskStatustodo;
  }
};

const getTaskStatusText = (status: string) => {
  switch (status) {
    case 'completed':
      return '已完成';
    case 'in_progress':
      return '進行中';
    case 'cancelled':
      return '已取消';
    case 'todo':
      return '待開始';
    default:
      return status;
  }
};

export const CustomerDetailScreen: React.FC = () => {
  const navigation = useNavigation<CustomerDetailNavigationProp>();
  const route = useRoute<CustomerDetailRouteProp>();
  const { customerId } = route.params;
  
  const { customers, isLoading: customerLoading } = useCustomerStore();
  const { records } = useRecordStore();
  const { tasks } = useTaskStore();
  
  const customer = customers.find(c => c.id === customerId);
  const customerRecords = records?.filter(r => r.customerIds?.includes(customerId)) || [];
  const customerTasks = tasks?.filter(t => t.customerIds?.includes(customerId)) || [];

  // 處理返回
  const handleBack = () => {
    navigation.goBack();
  };

  if (customerLoading || !customer) {
    return (
      <Layout style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1A1A1A" />
          <Text style={styles.loadingText}>載入中...</Text>
        </View>
      </Layout>
    );
  }

  return (
    <Layout style={styles.container} scrollable={false}>
      {/* 自定義標題列 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {customer.name}
        </Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => navigation.navigate('EditCustomer', { customerId })}
        >
          <Ionicons name="create-outline" size={24} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 基本資訊區塊 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>基本資訊</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>姓名</Text>
            <Text style={styles.value}>{customer.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>公司</Text>
            <Text style={styles.value}>{customer.company || '-'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>電話</Text>
            <Text style={styles.value}>{customer.phone || '-'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>電子郵件</Text>
            <Text style={styles.value}>{customer.email || '-'}</Text>
          </View>
          {customer.lastContactDate && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>最後聯絡</Text>
              <Text style={styles.value}>
                {new Date(customer.lastContactDate.seconds * 1000).toLocaleDateString('zh-TW')}
              </Text>
            </View>
          )}
        </View>

        {/* 相關紀錄區塊 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>相關紀錄</Text>
            <Text style={styles.sectionCount}>({customerRecords.length})</Text>
          </View>
          {customerRecords.length === 0 ? (
            <Text style={styles.emptyText}>暫無相關紀錄</Text>
          ) : (
            customerRecords.slice(0, 5).map((record) => (
              <TouchableOpacity key={record.id} style={styles.relatedItem}>
                <View style={styles.relatedItemContent}>
                  <Text style={styles.relatedItemTitle}>
                    {record.type === 'meeting' ? '會議' : '通話'}
                  </Text>
                  <Text style={styles.relatedItemSubtitle} numberOfLines={1}>
                    {record.aiSummary || '無摘要'}
                  </Text>
                </View>
                <Text style={styles.relatedItemDate}>
                  {new Date(record.createdAt.seconds * 1000).toLocaleDateString('zh-TW')}
                </Text>
              </TouchableOpacity>
            ))
          )}
          {customerRecords.length > 5 && (
            <TouchableOpacity style={styles.viewMoreButton}>
              <Text style={styles.viewMoreText}>查看全部</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 相關任務區塊 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>相關任務</Text>
            <Text style={styles.sectionCount}>({customerTasks.length})</Text>
          </View>
          {customerTasks.length === 0 ? (
            <Text style={styles.emptyText}>暫無相關任務</Text>
          ) : (
            customerTasks.slice(0, 5).map((task) => (
              <TouchableOpacity key={task.id} style={styles.relatedItem}>
                <View style={styles.relatedItemContent}>
                  <Text style={styles.relatedItemTitle}>{task.title}</Text>
                  <Text style={styles.relatedItemSubtitle}>
                    {task.description || '無描述'}
                  </Text>
                </View>
                <View style={[styles.taskStatusBadge, getTaskStatusStyle(task.status)]}>
                  <Text style={styles.taskStatusText}>
                    {getTaskStatusText(task.status)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
          {customerTasks.length > 5 && (
            <TouchableOpacity style={styles.viewMoreButton}>
              <Text style={styles.viewMoreText}>查看全部</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </Layout>
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    paddingHorizontal: 16,
  },
  sectionCount: {
    fontSize: 16,
    color: '#8E8E93',
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
  statusBadge: {
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  statusActive: {
    backgroundColor: '#E3F2E6',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  relatedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  relatedItemContent: {
    flex: 1,
  },
  relatedItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  relatedItemSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  relatedItemDate: {
    fontSize: 14,
    color: '#8E8E93',
  },
  taskStatusBadge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  taskStatustodo: {
    backgroundColor: '#FEF3E2',
  },
  taskStatusinProgress: {
    backgroundColor: '#E8F0FF',
  },
  taskStatuscompleted: {
    backgroundColor: '#E3F2E6',
  },
  taskStatuscancelled: {
    backgroundColor: '#FFE5E5',
  },
  taskStatusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    paddingVertical: 24,
  },
  viewMoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  viewMoreText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
});