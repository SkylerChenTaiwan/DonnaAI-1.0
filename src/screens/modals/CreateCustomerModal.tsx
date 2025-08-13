/**
 * 新增客戶 Modal
 * 支援表單輸入和 CSV 批量匯入
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity, Platform  } from 'react-native';
import {
  AdaptiveModal
} from '@/components/adaptive';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Icon } from '@/components/common/Icon';

import { DynamicFormBuilder, DynamicFormBuilderRef } from '@/components/database/forms/DynamicFormBuilder';
import { CSVUploader } from '@/components/input/CSVUploader';
import { InputMethodLink } from '@/components/modals/InputMethodLink';
import { Layout } from '@/components/common/Layout';
import { WebModal } from '@/components/web/WebModal';
import { createCustomer, createMultipleCustomers } from '@/services/firebase/customers';
import { CustomerFormData } from '@/services/validation/form-schemas';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { showToast } from '../../utils/toast';
import { subscribeToFieldDefinitions } from '@/services/firebase/fieldDefinitions';
import { FieldConfig, DynamicFormData } from '@/types/fieldDefinitions';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

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
  const [fields, setFields] = useState<FieldConfig[] | null>(null);
  const formRef = useRef<DynamicFormBuilderRef>(null);
  
  // 切換到 CSV 模式
  const switchToCSV = useCallback(() => {
    navigation.setParams({ mode: 'csv' });
  }, [navigation]);
  
  // 切換到表單模式
  const switchToForm = useCallback(() => {
    navigation.setParams({ mode: 'form' });
  }, [navigation]);

  // 訂閱欄位定義
  useEffect(() => {
    if (!currentOrganization) return;
    
    console.log('訂閱客戶欄位定義');
    const unsubscribe = subscribeToFieldDefinitions(
      'customers',
      currentOrganization.id,
      (fieldConfigs) => {
        console.log('收到欄位定義:', fieldConfigs);
        console.log('欄位數量:', fieldConfigs.length);
        console.log('欄位詳情:', fieldConfigs.map(f => ({ key: f.key, label: f.label })));
        setFields(fieldConfigs);
      }
    );
    
    return () => {
      unsubscribe();
    };
  }, [currentOrganization]);

  const handleSubmit = useCallback(async (formData: DynamicFormData) => {
    if (!user || !currentOrganization || !currentTeam) {
      showToast('error', '請先登入');
      return;
    }

    try {
      setLoading(true);

      // 準備客戶數據，添加系統需要的欄位
      const customerData: any = {
        // 基本必填欄位
        name: formData.name || '',
        company: formData.company || '',
        // 系統欄位
        assignedTo: user.uid, // 指定給當前用戶
        teamId: currentTeam.id, // 當前用戶的團隊
        organizationId: currentOrganization.id, // 當前用戶的組織
      };
      
      // 處理動態欄位
      if (fields) {
        fields.forEach(field => {
          if (field.key in formData) {
            // 根據欄位類型處理值
            if (field.type === 'tags' || field.type === 'multiselect') {
              customerData[field.key] = formData[field.key] || [];
            } else if (formData[field.key] !== '' && formData[field.key] !== null && formData[field.key] !== undefined) {
              customerData[field.key] = formData[field.key];
            }
          }
        });
      }

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
      throw error; // 讓 DynamicFormBuilder 知道提交失敗
    } finally {
      setLoading(false);
    }
  }, [user, currentOrganization, currentTeam, navigation, fields]);

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
        organizationId: currentOrganization.id }));

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
            <Text style={StyleSheet.flatten([styles.headerButtonText, loading && styles.disabledText])}>
              儲存
            </Text>
          </TouchableOpacity>
        ) });
    } else {
      navigation.setOptions({
        headerRight: undefined });
    }
  }, [navigation, handleSavePress, loading, mode]);

  // Web 平台使用 Modal 元件包裝
  if (Platform.OS === 'web') {
    return (
      <AdaptiveModal
        visible={true}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>新增客戶</Text>
              <TouchableOpacity
                onPress={handleCancel}
                style={styles.modalCloseButton}
              >
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {/* 模式切換 */}
            <View style={styles.modeSwitchContainer}>
              <Text style={styles.modeLabel}>
                {mode === 'form' ? '請填寫客戶的基本資訊，標有 * 的欄位為必填項目' : ''}
              </Text>
              <InputMethodLink
                activeMethod={mode}
                alternativeMethod={mode === 'form' ? 'csv' : 'form'}
                onSwitch={mode === 'form' ? switchToCSV : switchToForm}
              />
            </View>

            {/* 內容區域 */}
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {mode === 'form' ? (
                fields ? (
                  <DynamicFormBuilder
                    ref={formRef}
                    fields={fields}
                    onSubmit={handleSubmit}
                    disabled={loading}
                    mode="create"
                  />
                ) : (
                  <View style={styles.loadingContainer}>
                    <LoadingSpinner size="large" />
                    <Text style={styles.loadingText}>載入欄位定義中...</Text>
                  </View>
                )
              ) : (
                <>
                  <CSVUploader
                    onComplete={handleCSVImportComplete}
                    loading={loading}
                    dataType="customer"
                  />
                </>
              )}
            </ScrollView>
            
            {/* 底部按鈕區域 */}
            {mode === 'form' && (
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={StyleSheet.flatten([styles.modalButton, styles.cancelButton])}
                  onPress={handleCancel}
                >
                  <Text style={styles.cancelButtonText}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={StyleSheet.flatten([styles.modalButton, styles.saveButton, loading && styles.disabledButton])}
                  onPress={handleSavePress}
                  disabled={loading}
                >
                  <Text style={styles.saveButtonText}>
                    {loading ? '儲存中...' : '儲存'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </AdaptiveModal>
    );
  }

  // 非 Web 平台維持原有設計
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
              {fields ? (
                <DynamicFormBuilder
                  ref={formRef}
                  fields={fields}
                  onSubmit={handleSubmit}
                  disabled={loading}
                  mode="create"
                />
              ) : (
                <View style={styles.loadingContainer}>
                  <LoadingSpinner size="large" />
                  <Text style={styles.loadingText}>載入欄位定義中...</Text>
                </View>
              )}
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
    backgroundColor: '#F8F9FA' },
  content: {
    flex: 1 },
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8 },
  headerButtonText: {
    fontSize: 17,
    color: '#1A1A1A',
    fontWeight: '600' },
  disabledText: {
    color: '#C7C7CC' },
  
  // Modal 樣式
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center' },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    width: '90%',
    maxWidth: 600,
    maxHeight: '80%',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)' },
      default: {
        ...(Platform.OS === 'web' ? {} : { elevation: 8 }) } }) },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0' },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333' },
  modalCloseButton: {
    padding: 4 },
  modalContent: {
    flex: 1,
    padding: 20 },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12 },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8 },
  cancelButton: {
    backgroundColor: '#f0f0f0' },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500' },
  saveButton: {
    backgroundColor: 'rgb(46, 170, 220)' },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600' },
  disabledButton: {
    opacity: 0.6 },
  modeSwitchContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 5 },
  modeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60 },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7A7A7A' } });