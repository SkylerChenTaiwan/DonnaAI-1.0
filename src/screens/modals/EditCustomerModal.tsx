/**
 * 編輯客戶 Modal
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert } from 'react-native';
import { Icon } from '@/components/common/Icon';
import { Layout } from '@/components/common/Layout';
import { WebModal } from '@/components/web/WebModal';
import { Button } from '@/components/common/Button';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useCustomerStore } from '@/stores/customerStore';
import { useAuthStore } from '@/stores/authStore';
import { useOrganization } from '@/hooks/useOrganization';
import { RootStackParamList } from '@/types/navigation';
import { CustomerDoc } from '@/types/customer';
import { DynamicFormBuilder, DynamicFormBuilderRef } from '@/components/database/forms/DynamicFormBuilder';
import { subscribeToFieldDefinitions } from '@/services/firebase/fieldDefinitions';
import { FieldConfig, DynamicFormData } from '@/types/fieldDefinitions';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { showToast } from '@/utils/toast';

type EditCustomerRouteProp = RouteProp<RootStackParamList, 'EditCustomer'>;
type EditCustomerNavigationProp = StackNavigationProp<RootStackParamList, 'EditCustomer'>;

export const EditCustomerModal: React.FC = () => {
  const navigation = useNavigation<EditCustomerNavigationProp>();
  const route = useRoute<EditCustomerRouteProp>();
  const { customerId } = route.params;
  
  const { user } = useAuthStore();
  const { currentOrganization } = useOrganization();
  const { customers, updateCustomer, isLoading } = useCustomerStore();
  const customer = customers.find(c => c.id === customerId);
  
  const [fields, setFields] = useState<FieldConfig[] | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const formRef = useRef<DynamicFormBuilderRef>(null);

  // 訂閱欄位定義
  useEffect(() => {
    if (!currentOrganization) return;
    
    console.log('訂閱客戶欄位定義 (編輯)');
    const unsubscribe = subscribeToFieldDefinitions(
      'customers',
      currentOrganization.id,
      (fieldConfigs) => {
        console.log('收到欄位定義:', fieldConfigs);
        setFields(fieldConfigs);
      }
    );
    
    return () => {
      unsubscribe();
    };
  }, [currentOrganization]);

  const handleSave = useCallback(async (formData: DynamicFormData) => {
    if (!user || !customer || !fields) return;
    
    if (!formData.name || !String(formData.name).trim()) {
      showToast('error', '請輸入客戶姓名');
      return;
    }
    
    setIsSaving(true);
    
    try {
      const updates: Partial<CustomerDoc> = {
        name: String(formData.name).trim(),
        company: formData.company ? String(formData.company).trim() : '' };
      
      // 處理動態欄位
      fields.forEach(field => {
        if (field.key in formData) {
          // 根據欄位類型處理值
          if (field.type === 'tags' || field.type === 'multiselect') {
            updates[field.key] = formData[field.key] || [];
          } else if (formData[field.key] !== '' && formData[field.key] !== null && formData[field.key] !== undefined) {
            updates[field.key] = formData[field.key];
          }
        }
      });
      
      await updateCustomer(customerId, updates, user.id);
      showToast('success', '客戶更新成功');
      navigation.goBack();
    } catch (error) {
      console.error('更新客戶失敗:', error);
      showToast('error', '更新客戶失敗，請稍後再試');
    } finally {
      setIsSaving(false);
    }
  }, [user, customer, fields, customerId, updateCustomer, navigation]);

  // 處理儲存按鈕點擊
  const handleSavePress = useCallback(() => {
    if (formRef.current) {
      formRef.current.submit();
    }
  }, []);

  if (isLoading || !customer) {
    return (
      <WebModal>
        <Layout style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1A1A1A" />
            <Text style={styles.loadingText}>載入中...</Text>
          </View>
        </Layout>
      </WebModal>
    );
  }

  return (
    <WebModal>
      <Layout style={styles.container} scrollable={false}>
      {/* 標題列 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Icon name="close" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>編輯客戶</Text>
        <TouchableOpacity 
          onPress={handleSavePress} 
          style={styles.headerButton}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#1A1A1A" />
          ) : (
            <Text style={styles.saveButtonText}>儲存</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {fields ? (
          <DynamicFormBuilder
            ref={formRef}
            fields={fields}
            data={customer}
            onSubmit={handleSave}
            disabled={isSaving}
            mode="edit"
          />
        ) : (
          <View style={styles.loadingContainer}>
            <LoadingSpinner size="large" />
            <Text style={styles.loadingText}>載入欄位定義中...</Text>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center' },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA' },
  headerButton: {
    padding: 4 },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E' },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF' },
  scrollView: {
    flex: 1 },
  form: {
    padding: 16 },
  formGroup: {
    marginBottom: 24 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8 },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#E5E5EA' },
  textArea: {
    minHeight: 100,
    paddingTop: 12 },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8 },
  tagInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#E5E5EA' },
  addTagButton: {
    padding: 4 },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E5EA',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4 },
  tagText: {
    fontSize: 14,
    color: '#1C1C1E' } });