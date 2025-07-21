/**
 * 新增客戶 Modal
 * 整合 CustomerForm 組件，提供完整的客戶創建功能
 */

import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { CustomerForm } from '@/components/forms/CustomerForm';
import { Layout } from '@/components/common/Layout';
import { createCustomer } from '@/services/firebase/customers';
import { CustomerFormData } from '@/services/validation/form-schemas';

// TODO: 獲取當前用戶資訊的 Hook 需要實作
const useCurrentUser = () => {
  // 這是暫時的模擬實現，實際應該從認證 store 或 context 獲取
  return {
    user: {
      id: 'current-user-id',
      teamId: 'default-team',
      organizationId: 'default-org',
    },
  };
};

export const CreateCustomerModal: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const { user } = useCurrentUser();

  const handleSubmit = async (formData: CustomerFormData) => {
    try {
      setLoading(true);

      // 準備客戶數據，添加系統需要的欄位
      const customerData = {
        ...formData,
        assignedTo: user.id, // 指定給當前用戶
        teamId: user.teamId, // 當前用戶的團隊
        organizationId: user.organizationId, // 當前用戶的組織
        // 處理可選欄位
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        industry: formData.industry || undefined,
        address: formData.address || undefined,
        notes: formData.notes || undefined,
      };

      // 呼叫 Firebase 服務創建客戶
      const newCustomer = await createCustomer(customerData, user.id);

      console.log('客戶創建成功:', newCustomer);
      
      // 導航回上一頁
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
      
      Alert.alert('創建失敗', errorMessage);
      throw error; // 讓 CustomerForm 知道提交失敗
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <Layout style={styles.container}>
      <CustomerForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        mode="create"
      />
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0',
  },
});