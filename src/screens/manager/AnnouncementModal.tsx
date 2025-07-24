/**
 * 公告發佈模態框
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TeamMemberSelector } from '@/components/manager/TeamMemberSelector';
import { createAnnouncement } from '@/services/firebase/managerActions';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { showToast } from '@/utils/toast';
import { colors } from '@/theme/colors';
import { DesignSystem } from '@/theme/designSystem';

interface AnnouncementModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AnnouncementModal: React.FC<AnnouncementModalProps> = ({
  visible,
  onClose,
}) => {
  const { user } = useAuth();
  const { currentOrganization, currentTeam } = useOrganization();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'high' | 'normal' | 'low'>('normal');
  const [targetUsers, setTargetUsers] = useState<string[]>([]);
  const [expiresInDays, setExpiresInDays] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setPriority('normal');
    setTargetUsers([]);
    setExpiresInDays('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    // 驗證必填欄位
    if (!title.trim()) {
      showToast('error', '請輸入公告標題');
      return;
    }

    if (!content.trim()) {
      showToast('error', '請輸入公告內容');
      return;
    }

    if (targetUsers.length === 0) {
      showToast('error', '請選擇至少一位接收者');
      return;
    }

    if (!user || !currentOrganization) {
      showToast('error', '無法獲取用戶資訊');
      return;
    }

    try {
      setIsSubmitting(true);

      // 計算過期時間
      let expiresAt: Date | undefined;
      if (expiresInDays) {
        const days = parseInt(expiresInDays);
        if (!isNaN(days) && days > 0) {
          expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + days);
        }
      }

      // 創建公告
      await createAnnouncement(
        {
          title: title.trim(),
          content: content.trim(),
          priority,
          targetUsers,
          targetTeams: currentTeam ? [currentTeam.id] : undefined,
          organizationId: currentOrganization.id,
          teamId: currentTeam?.id,
          expiresAt: expiresAt ? expiresAt : undefined,
        },
        user.uid,
        user.displayName || user.email || '管理員'
      );

      handleClose();
    } catch (error) {
      console.error('發佈公告失敗:', error);
      showToast('error', '發佈公告失敗，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  const priorityOptions = [
    { value: 'high', label: '高', color: colors.error },
    { value: 'normal', label: '中', color: colors.warning },
    { value: 'low', label: '低', color: colors.success },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.modalContent}>
          {/* 標題欄 */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>發佈公告</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666666" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* 公告標題 */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>標題 *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="輸入公告標題..."
                placeholderTextColor="#9CA3AF"
                maxLength={100}
              />
            </View>

            {/* 公告內容 */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>內容 *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={content}
                onChangeText={setContent}
                placeholder="輸入公告內容..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* 優先級 */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>優先級</Text>
              <View style={styles.priorityContainer}>
                {priorityOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.priorityButton,
                      priority === option.value && {
                        backgroundColor: option.color,
                        borderColor: option.color,
                      },
                    ]}
                    onPress={() => setPriority(option.value as typeof priority)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.priorityText,
                        priority === option.value && styles.priorityTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 過期天數 */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>過期天數（選填）</Text>
              <TextInput
                style={styles.input}
                value={expiresInDays}
                onChangeText={setExpiresInDays}
                placeholder="留空表示永不過期"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
              />
            </View>

            {/* 接收者選擇 */}
            <View style={styles.formGroup}>
              <TeamMemberSelector
                value={targetUsers}
                onChange={setTargetUsers}
                placeholder="選擇接收者 *"
                allowSelectAll={true}
                allowTeamSelection={true}
              />
            </View>
          </ScrollView>

          {/* 操作按鈕 */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>取消</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.button,
                styles.submitButton,
                isSubmitting && styles.disabledButton,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.7}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="megaphone" size={20} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>發佈</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  formGroup: {
    marginVertical: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  priorityTextActive: {
    color: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  submitButton: {
    backgroundColor: colors.primary,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.6,
  },
});