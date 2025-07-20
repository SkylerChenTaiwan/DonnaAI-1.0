/**
 * 客戶管理畫面
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Layout } from '@/components/common/Layout';
import { useCustomerStore } from '@/stores/customerStore';
import { useAuthStore } from '@/stores/authStore';
import { CustomerDoc } from '@/types/firebase';
import { Ionicons } from '@expo/vector-icons';

export const CustomersScreen: React.FC = () => {
  const { user } = useAuthStore();
  const { 
    customers, 
    isLoading, 
    error, 
    fetchCustomers,
    subscribeToCustomers,
    unsubscribeFromCustomers 
  } = useCustomerStore();

  useEffect(() => {
    if (user) {
      console.log('🔍 CustomersScreen - 使用者資料:', {
        id: user.id,
        email: user.email,
        teamId: user.teamId,
        teamIds: user.teamIds,
        role: user.role
      });
      
      // 初始載入客戶資料
      fetchCustomers(user.id, user.teamId);
      
      // 訂閱即時更新
      if (user.teamId) {
        subscribeToCustomers(user.teamId, user.id);
      }
    } else {
      console.log('⚠️ CustomersScreen - 使用者未登入');
    }

    // 清理訂閱
    return () => {
      unsubscribeFromCustomers();
    };
  }, [user]);

  const renderCustomerItem = ({ item }: { item: CustomerDoc }) => (
    <TouchableOpacity style={styles.customerCard} activeOpacity={0.7}>
      <View style={styles.customerHeader}>
        <Text style={styles.customerName}>{item.name}</Text>
        {item.assignedTo === user?.id && (
          <View style={styles.assignedBadge}>
            <Text style={styles.assignedText}>我的客戶</Text>
          </View>
        )}
      </View>
      <Text style={styles.companyName}>{item.company}</Text>
      <View style={styles.customerInfo}>
        {item.email && (
          <View style={styles.infoItem}>
            <Ionicons name="mail-outline" size={14} color="#8E8E93" />
            <Text style={styles.infoText}>{item.email}</Text>
          </View>
        )}
        {item.phone && (
          <View style={styles.infoItem}>
            <Ionicons name="call-outline" size={14} color="#8E8E93" />
            <Text style={styles.infoText}>{item.phone}</Text>
          </View>
        )}
      </View>
      {item.tags && item.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {item.tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <Layout>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>載入客戶資料中...</Text>
        </View>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => user && fetchCustomers(user.id, user.teamId)}
          >
            <Text style={styles.retryText}>重試</Text>
          </TouchableOpacity>
        </View>
      </Layout>
    );
  }

  return (
    <Layout>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>客戶管理</Text>
          <Text style={styles.customerCount}>
            共 {customers.length} 位客戶
          </Text>
        </View>
        
        {customers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#C7C7CC" />
            <Text style={styles.emptyText}>尚無客戶資料</Text>
            <Text style={styles.emptySubtext}>點擊右下角的 + 新增客戶</Text>
          </View>
        ) : (
          <FlatList
            data={customers}
            renderItem={renderCustomerItem}
            keyExtractor={(item) => item.id || ''}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </View>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  customerCount: {
    fontSize: 14,
    color: '#8E8E93',
  },
  listContent: {
    padding: 16,
  },
  customerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  assignedBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  assignedText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  companyName: {
    fontSize: 16,
    color: '#3C3C43',
    marginBottom: 8,
  },
  customerInfo: {
    marginTop: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 6,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  tag: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#3C3C43',
  },
  separator: {
    height: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3C3C43',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    marginTop: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});