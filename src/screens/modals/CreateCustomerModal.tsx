/**
 * 新增客戶 Modal
 * 支援表單輸入和 CSV 批量匯入
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { CustomerForm } from '@/components/forms/CustomerForm';
import { CSVUploader } from '@/components/input/CSVUploader';
import { Layout } from '@/components/common/Layout';
import { createCustomer, createMultipleCustomers } from '@/services/firebase/customers';
import { CustomerFormData } from '@/services/validation/form-schemas';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { showToast } from '../../utils/toast';

type RouteParams = {
  CreateCustomerModal: {
    mode?: 'form' | 'csv';
  };
};

export const CreateCustomerModal: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'CreateCustomerModal'>>();
  const { user } = useAuth();
  const { currentOrganization, currentTeam } = useOrganization();
  
  // 從路由參數獲取模式，預設為表單
  const initialMode = route.params?.mode || 'form';
  const [mode, setMode] = useState<'form' | 'csv'>(initialMode);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async (formData: CustomerFormData) => {
    if (!user || !currentOrganization || !currentTeam) {
      showToast('error', '請先登入');
      return;
    }

    try {
      setLoading(true);

      // 準備客戶數據，添加系統需要的欄位
      const customerData = {
        ...formData,
        assignedTo: user.uid, // 指定給當前用戶
        teamId: currentTeam.id, // 當前用戶的團隊
        organizationId: currentOrganization.id, // 當前用戶的組織
        // 處理可選欄位
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        industry: formData.industry || undefined,
        address: formData.address || undefined,
        notes: formData.notes || undefined,
      };

      // 呼叫 Firebase 服務創建客戶
      const newCustomer = await createCustomer(customerData, user.uid);
      
      showToast('success', '客戶創建成功');
      navigation.goBack();
      
    } catch (error) {
      console.error('創建客戶失敗:', error);
      
      // 顯示具體的錯誤訊息
      let errorMessage = '創建客戶失敗，請稍後再試';
      
      if (error instanceof Error) {
        if (error.message.includes('客戶姓名和公司名稱為必填')) {
          errorMessage = '請填寫客戶姓名和公司名稱';
        } else if (error.message.includes('權限')) {
          errorMessage = '您沒有權限創建客戶，請聯繫管理員';
        } else if (error.message.includes('網路')) {
          errorMessage = '網路連線異常，請檢查網路後重試';
        } else {
          errorMessage = error.message;
        }
      }
      
      showToast('error', errorMessage);
      throw error; // 讓 CustomerForm 知道提交失敗
    } finally {
      setLoading(false);
    }
  }, [user, currentOrganization, currentTeam, navigation]);

  // 處理 CSV 匯入完成
  const handleCSVImportComplete = useCallback(async (customers: CustomerFormData[]) => {
    if (!user || !currentOrganization || !currentTeam) {
      showToast('error', '請先登入');
      return;
    }

    try {
      setLoading(true);

      // 準備批量客戶數據
      const customersData = customers.map(customer => ({
        ...customer,
        assignedTo: user.uid,
        teamId: currentTeam.id,
        organizationId: currentOrganization.id,
      }));

      // 批量創建客戶
      const results = await createMultipleCustomers(customersData, user.uid);
      
      showToast('success', `成功匯入 ${results.success.length} 位客戶`);
      
      if (results.errors.length > 0) {
        showToast('warning', `${results.errors.length} 位客戶匯入失敗`);
      }
      
      navigation.goBack();
      
    } catch (error) {
      console.error('CSV 匯入失敗:', error);
      showToast('error', 'CSV 匯入失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  }, [user, currentOrganization, currentTeam, navigation]);

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <Layout style={styles.container}>
      {/* 標題欄 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.title}>新增客戶</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* 模式切換標籤 */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, mode === 'form' && styles.activeTab]}
          onPress={() => setMode('form')}
        >
          <Ionicons 
            name="document-text" 
            size={20} 
            color={mode === 'form' ? '#FF6B35' : '#8E8E93'} 
          />
          <Text style={[styles.tabText, mode === 'form' && styles.activeTabText]}>
            表格填寫
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, mode === 'csv' && styles.activeTab]}
          onPress={() => setMode('csv')}
        >
          <Ionicons 
            name="cloud-upload" 
            size={20} 
            color={mode === 'csv' ? '#FF6B35' : '#8E8E93'} 
          />
          <Text style={[styles.tabText, mode === 'csv' && styles.activeTabText]}>
            CSV 匯入
          </Text>
        </TouchableOpacity>
      </View>

      {/* 內容區域 */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {mode === 'form' && (
          <CustomerForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={loading}
            mode="create"
          />
        )}
        
        {mode === 'csv' && (
          <CSVUploader
            onComplete={handleCSVImportComplete}
            loading={loading}
            dataType="customer"
          />
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
  content: {
    flex: 1,
  },
});