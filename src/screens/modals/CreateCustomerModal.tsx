/**
 * 新增客戶 Modal
 * 支援表單輸入和 CSV 批量匯入
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Icon } from '@/components/common/Icon';

import { CustomerForm } from '@/components/forms/CustomerForm';
import { CSVUploader } from '@/components/input/CSVUploader';
import { InputMethodLink } from '@/components/modals/InputMethodLink';
import { Layout } from '@/components/common/Layout';
import { WebModal } from '@/components/web/WebModal';
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
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'CreateCustomerModal'>>();
  const { user } = useAuth();
  const { currentOrganization, currentTeam } = useOrganization();
  
  // 從路由參數獲取模式，預設為表單
  const mode = route.params?.mode || 'form';
  const [loading, setLoading] = useState(false);
  const formRef = useRef<any>(null);
  
  // 切換到 CSV 模式
  const switchToCSV = useCallback(() => {
    navigation.setParams({ mode: 'csv' });
  }, [navigation]);
  
  // 切換到表單模式
  const switchToForm = useCallback(() => {
    navigation.setParams({ mode: 'form' });
  }, [navigation]);

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

  // 處理儲存按鈕點擊
  const handleSavePress = useCallback(() => {
    if (mode === 'form' && formRef.current) {
      formRef.current.submit();
    }
  }, [mode]);

  // 設置導航欄右側按鈕
  useEffect(() => {
    if (mode === 'form') {
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity 
            onPress={handleSavePress}
            style={styles.headerButton}
            disabled={loading}
          >
            <Text style={[styles.headerButtonText, loading && styles.disabledText]}>
              儲存
            </Text>
          </TouchableOpacity>
        ),
      });
    } else {
      navigation.setOptions({
        headerRight: undefined,
      });
    }
  }, [navigation, handleSavePress, loading, mode]);

  return (
    <WebModal>
      <Layout style={styles.container}>

        {/* 內容區域 */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {mode === 'form' ? (
            <>
              {/* 切換到 CSV 的連結 */}
              <InputMethodLink
                targetLabel="改用 CSV 批量匯入"
                onSwitch={switchToCSV}
              />
              <CustomerForm
                ref={formRef}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                loading={loading}
                mode="create"
              />
            </>
          ) : (
            <>
              {/* 切換到表單的連結 */}
              <InputMethodLink
                targetLabel="改用表格填寫"
                onSwitch={switchToForm}
              />
              <CSVUploader
                onComplete={handleCSVImportComplete}
                loading={loading}
                dataType="customer"
              />
            </>
          )}
        </ScrollView>
      </Layout>
    </WebModal>
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
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerButtonText: {
    fontSize: 17,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  disabledText: {
    color: '#C7C7CC',
  },
});