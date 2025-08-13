/**
 * 動態新增記錄 Modal
 * 根據表格欄位定義動態生成表單
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform } from 'react-native';
import { Button } from '@/components/common/Button';
import { Layout } from '@/components/common/Layout';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { FormField } from '@/components/forms/FormField';
import { columnsToFormFields, validateFormData, FormFieldConfig } from '@/utils/formGenerator';
import { TableColumn } from '@/components/common/DataTable';
import { showToast } from '@/utils/toast';
import { Icon } from '@/components/common/Icon';
import { colors } from '@/theme/colors';

type RouteParams = {
  AddRecordModal: {
    tableType: 'customers' | 'records' | 'tasks';
    columns: TableColumn[];
    onSubmit: (data: Record<string, any>) => Promise<void>;
  };
};

export const AddRecordModal: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'AddRecordModal'>>();
  
  const { tableType, columns, onSubmit } = route.params || {};
  
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // 將表格欄位轉換為表單欄位
  const formFields = useMemo(() => {
    if (!columns) return [];
    return columnsToFormFields(columns);
  }, [columns]);

  // 處理欄位變更
  const handleFieldChange = useCallback((key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    // 清除該欄位的錯誤
    if (errors[key]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  }, [errors]);

  // 處理表單提交
  const handleSubmit = useCallback(async () => {
    // 驗證表單
    const validationErrors = validateFormData(formData, formFields);
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      showToast('success', '記錄新增成功');
      navigation.goBack();
    } catch (error) {
      console.error('Error creating record:', error);
      showToast('error', '新增記錄失敗');
    } finally {
      setLoading(false);
    }
  }, [formData, formFields, onSubmit, navigation]);

  // 取得表格類型的中文名稱
  const getTableTypeName = () => {
    switch (tableType) {
      case 'customers':
        return '客戶';
      case 'records':
        return '記錄';
      case 'tasks':
        return '任務';
      default:
        return '記錄';
    }
  };

  // 渲染表單欄位
  const renderFormField = (field: FormFieldConfig) => {
    return (
      <View key={field.key} style={styles.fieldContainer}>
        <FormField
          label={field.label}
          type={field.type as any}
          value={formData[field.key]}
          onChange={(value) => handleFieldChange(field.key, value)}
          error={errors[field.key]}
          placeholder={field.placeholder}
          required={field.required}
          options={field.options?.map(opt => ({ label: opt, value: opt }))}
        />
      </View>
    );
  };

  return (
    <Layout>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.closeButton}
            activeOpacity={0.7}
          >
            <Icon name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>新增{getTableTypeName()}</Text>
        </View>
        <Button
          title="儲存"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          size="small"
          variant="primary"
        />
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {formFields.length > 0 ? (
            formFields.map(renderFormField)
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>無可用的表單欄位</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center' },
  closeButton: {
    padding: 8,
    marginRight: 8 },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text },
  container: {
    flex: 1,
    backgroundColor: colors.background },
  content: {
    flex: 1 },
  contentContainer: {
    paddingVertical: 24,
    paddingHorizontal: 16 },
  fieldContainer: {
    marginBottom: 20 },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40 },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary } });