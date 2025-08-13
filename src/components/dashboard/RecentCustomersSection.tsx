/**
 * 近期接觸客戶區塊 - 顯示最近互動的客戶
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator } from 'react-native';
// Icon import removed - using platform-specific Icon component;
import { Icon } from '@/components/common/Icon';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { CustomerDoc } from '@/types/firebase';
import { RecordDoc } from '@/types/record';
import { useCustomerStore } from '@/stores/customerStore';
import { useRecordStore } from '@/stores/recordStore';
import { RootStackParamList } from '@/types/navigation';
// TODO: Install date-fns for better date formatting
// import { formatDistanceToNow } from 'date-fns';
// import { zhTW } from 'date-fns/locale';

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface RecentCustomersProps {
  userId: string;
  organizationId: string;
  teamId: string;
  limit?: number;
}

interface CustomerWithLastInteraction extends CustomerDoc {
  lastInteractionDate?: Date;
  lastInteractionType?: string;
}

export const RecentCustomersSection: React.FC<RecentCustomersProps> = ({
  userId,
  organizationId,
  teamId,
  limit = 5 }) => {
  const navigation = useNavigation<NavigationProp>();
  const { customers, fetchCustomers } = useCustomerStore();
  const { records, fetchRecords } = useRecordStore();
  const [customersLoading, setCustomersLoading] = useState(false);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 載入客戶和紀錄
  useEffect(() => {
    const loadData = async () => {
      setCustomersLoading(true);
      setRecordsLoading(true);
      await Promise.all([
        fetchCustomers({}).finally(() => setCustomersLoading(false)),
        fetchRecords({}).finally(() => setRecordsLoading(false)),
      ]);
    };
    loadData();
  }, [fetchCustomers, fetchRecords]);

  // 下拉重新整理
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchCustomers({}), fetchRecords({})]);
    setRefreshing(false);
  }, [fetchCustomers, fetchRecords]);

  // 計算最近接觸的客戶
  const recentCustomers = useMemo(() => {
    // 建立客戶 ID 到最後互動時間的映射
    const customerLastInteraction = new Map<string, { date: Date; type: string }>();

    // 遍歷所有紀錄，找出每個客戶的最後互動時間
    records.forEach(record => {
      record.customerIds?.forEach(customerId => {
        const recordDate = record.createdAt.toDate();
        const existing = customerLastInteraction.get(customerId);
        
        if (!existing || recordDate > existing.date) {
          customerLastInteraction.set(customerId, {
            date: recordDate,
            type: record.type });
        }
      });
    });

    // 過濾並排序客戶
    const customersWithInteraction: CustomerWithLastInteraction[] = customers
      .filter(customer => customerLastInteraction.has(customer.id))
      .map(customer => {
        const interaction = customerLastInteraction.get(customer.id)!;
        return {
          ...customer,
          lastInteractionDate: interaction.date,
          lastInteractionType: interaction.type };
      })
      .sort((a, b) => {
        const dateA = a.lastInteractionDate?.getTime() || 0;
        const dateB = b.lastInteractionDate?.getTime() || 0;
        return dateB - dateA;
      });

    return customersWithInteraction.slice(0, limit);
  }, [customers, records, limit]);

  // 導航到客戶詳情
  const navigateToCustomer = useCallback((customerId: string) => {
    navigation.navigate('CustomerDetail', { customerId });
  }, [navigation]);

  // 取得互動類型圖標
  const getInteractionIcon = (type: string): string => {
    switch (type) {
      case 'call':
        return 'call-outline';
      case 'meeting':
        return 'people-outline';
      case 'note':
        return 'document-text-outline';
      default:
        return 'chatbubble-outline';
    }
  };

  // 取得互動類型文字
  const getInteractionText = (type: string): string => {
    switch (type) {
      case 'call':
        return '通話';
      case 'meeting':
        return '會議';
      case 'note':
        return '筆記';
      default:
        return '互動';
    }
  };

  // 渲染客戶項目
  const renderCustomerItem = ({ item }: { item: CustomerWithLastInteraction }) => (
    <TouchableOpacity
      style={styles.customerItem}
      onPress={() => navigateToCustomer(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.customerAvatar}>
        <Text style={styles.avatarText}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>

      <View style={styles.customerInfo}>
        <Text style={styles.customerName}>{item.name}</Text>
        {item.lastInteractionDate && (
          <View style={styles.interactionInfo}>
            <Icon 
              name={getInteractionIcon(item.lastInteractionType || '')} 
              size={14} 
              color="#6B7280" 
            />
            <Text style={styles.interactionText}>
              {getInteractionText(item.lastInteractionType || '')} · {' '}
              {/* TODO: Add date-fns for formatting */}
              {item.lastInteractionDate.toLocaleDateString('zh-TW')}
            </Text>
          </View>
        )}
      </View>

      <Icon name="chevron-forward" size={20} color="#D1D5DB" />
    </TouchableOpacity>
  );

  // 空狀態
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="people-outline" size={48} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>尚無客戶互動</Text>
      <Text style={styles.emptyDescription}>開始記錄客戶互動以查看最近接觸</Text>
    </View>
  );

  const loading = customersLoading || recordsLoading;

  if (loading && customers.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>近期接觸客戶</Text>
        {recentCustomers.length > 0 && (
          <TouchableOpacity
            onPress={() => navigation.navigate('MainTabs')}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>查看全部</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={recentCustomers}
        keyExtractor={(item) => item.id}
        renderItem={renderCustomerItem}
        ListEmptyComponent={renderEmptyState}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    overflow: 'hidden' },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB' },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A' },
  viewAllText: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '500' },
  customerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6' },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12 },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B' },
  customerInfo: {
    flex: 1 },
  customerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 2 },
  interactionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4 },
  interactionText: {
    fontSize: 13,
    color: '#6B7280' },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 12,
    marginBottom: 4 },
  emptyDescription: {
    fontSize: 14,
    color: '#6B7280' } });