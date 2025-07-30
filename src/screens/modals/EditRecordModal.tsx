/**
 * 編輯紀錄 Modal
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Icon } from '@/components/common/Icon';
import { Layout } from '@/components/common/Layout';
import { WebModal } from '@/components/web/WebModal';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useRecordStore } from '@/stores/recordStore';
import { useAuthStore } from '@/stores/authStore';
import { RootStackParamList } from '@/types/navigation';
import { RecordDoc } from '@/types/record';

type EditRecordRouteProp = RouteProp<RootStackParamList, 'EditRecord'>;
type EditRecordNavigationProp = StackNavigationProp<RootStackParamList, 'EditRecord'>;

export const EditRecordModal: React.FC = () => {
  const navigation = useNavigation<EditRecordNavigationProp>();
  const route = useRoute<EditRecordRouteProp>();
  const { recordId } = route.params;
  
  const { user } = useAuthStore();
  const { records, updateRecord, isLoading } = useRecordStore();
  const record = records?.find(r => r.id === recordId);
  
  const [formData, setFormData] = useState({
    title: '',
    type: 'meeting' as 'meeting' | 'call' | 'note' | 'other',
    content: '',
    location: '',
    aiSummary: '',
  });
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (record) {
      setFormData({
        title: record.title || '',
        type: record.type || 'meeting',
        content: record.content || '',
        location: record.location || '',
        aiSummary: record.aiSummary || '',
      });
    }
  }, [record]);

  const handleSave = async () => {
    if (!user || !record) return;
    
    if (!formData.title.trim()) {
      Alert.alert('錯誤', '請輸入紀錄標題');
      return;
    }
    
    setIsSaving(true);
    
    try {
      const updates: Partial<RecordDoc> = {
        title: formData.title.trim(),
        type: formData.type,
        content: formData.content.trim(),
        location: formData.location.trim(),
        aiSummary: formData.aiSummary.trim(),
      };
      
      await updateRecord(recordId, updates, user.id);
      navigation.goBack();
    } catch (error) {
      console.error('更新紀錄失敗:', error);
      Alert.alert('錯誤', '更新紀錄失敗，請稍後再試');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !record) {
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
        <Text style={styles.headerTitle}>編輯紀錄</Text>
        <TouchableOpacity 
          onPress={handleSave} 
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
        <View style={styles.form}>
          {/* 標題 */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>標題 *</Text>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
              placeholder="請輸入紀錄標題"
              placeholderTextColor="#C7C7CC"
            />
          </View>

          {/* 類型 */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>類型</Text>
            <View style={styles.typeContainer}>
              {[
                { value: 'meeting', label: '會議' },
                { value: 'call', label: '電話' },
                { value: 'note', label: '筆記' },
                { value: 'other', label: '其他' },
              ].map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeButton,
                    formData.type === type.value && styles.typeButtonActive,
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, type: type.value as any }))}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      formData.type === type.value && styles.typeButtonTextActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 地點 */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>地點</Text>
            <TextInput
              style={styles.input}
              value={formData.location}
              onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
              placeholder="請輸入地點"
              placeholderTextColor="#C7C7CC"
            />
          </View>

          {/* 內容 */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>內容</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.content}
              onChangeText={(text) => setFormData(prev => ({ ...prev, content: text }))}
              placeholder="請輸入紀錄內容"
              placeholderTextColor="#C7C7CC"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          {/* AI 摘要 */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>AI 摘要</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.aiSummary}
              onChangeText={(text) => setFormData(prev => ({ ...prev, aiSummary: text }))}
              placeholder="AI 生成的摘要"
              placeholderTextColor="#C7C7CC"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>
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
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
});