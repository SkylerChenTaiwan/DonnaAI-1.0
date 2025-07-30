/**
 * 任務指派模態框
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
import { Icon } from '@/components/common/Icon';
import DateTimePicker from '@react-native-community/datetimepicker';
// @ts-ignore - Picker type issues
import { Picker } from '@react-native-picker/picker';
import { TeamMemberSelector } from '@/components/manager/TeamMemberSelector';
import { bulkAssignTasks } from '@/services/firebase/managerActions';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { showToast } from '@/utils/toast';
import { colors } from '@/theme/colors';
import { DesignSystem } from '@/theme/designSystem';

interface TaskAssignmentModalProps {
  visible: boolean;
  onClose: () => void;
}

export const TaskAssignmentModal: React.FC<TaskAssignmentModalProps> = ({
  visible,
  onClose,
}) => {
  const { user } = useAuth();
  const { currentTeam } = useOrganization();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [taskType, setTaskType] = useState('follow_up');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const taskTypes = [
    { value: 'follow_up', label: '客戶跟進' },
    { value: 'meeting', label: '會議' },
    { value: 'report', label: '報告' },
    { value: 'call', label: '電話聯繫' },
    { value: 'visit', label: '拜訪' },
    { value: 'proposal', label: '提案準備' },
    { value: 'other', label: '其他' },
  ];

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setTaskType('follow_up');
    setDueDate(null);
    setAssigneeIds([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    // 驗證必填欄位
    if (!title.trim()) {
      showToast('error', '請輸入任務標題');
      return;
    }

    if (assigneeIds.length === 0) {
      showToast('error', '請選擇至少一位受派人');
      return;
    }

    if (!user || !currentTeam) {
      showToast('error', '無法獲取用戶資訊');
      return;
    }

    try {
      setIsSubmitting(true);

      // 批量指派任務
      await bulkAssignTasks(
        {
          title: title.trim(),
          description: description.trim(),
          priority,
          type: taskType,
          dueDate: dueDate || undefined,
        },
        assigneeIds,
        user.uid,
        user.displayName || user.email || '管理員',
        currentTeam.id
      );

      handleClose();
    } catch (error) {
      console.error('指派任務失敗:', error);
      showToast('error', '指派任務失敗，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  const priorityOptions = [
    { value: 'high', label: '高', color: colors.error },
    { value: 'medium', label: '中', color: colors.warning },
    { value: 'low', label: '低', color: colors.success },
  ];

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

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
            <Text style={styles.headerTitle}>指派任務</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#666666" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* 任務標題 */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>任務標題 *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="輸入任務標題..."
                placeholderTextColor="#9CA3AF"
                maxLength={100}
              />
            </View>

            {/* 任務描述 */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>任務描述</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="輸入任務詳細描述..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* 任務類型 */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>任務類型</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={taskType}
                  onValueChange={setTaskType}
                  style={styles.picker}
                >
                  {taskTypes.map((type) => (
                    <Picker.Item
                      key={type.value}
                      label={type.label}
                      value={type.value}
                    />
                  ))}
                </Picker>
              </View>
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

            {/* 到期日期 */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>到期日期</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <Icon name="calendar-outline" size={20} color="#666666" />
                <Text style={styles.dateText}>
                  {dueDate ? formatDate(dueDate) : '選擇日期（選填）'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 受派人選擇 */}
            <View style={styles.formGroup}>
              <TeamMemberSelector
                value={assigneeIds}
                onChange={setAssigneeIds}
                placeholder="選擇受派人 *"
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
                  <Icon name="person-add" size={20} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>指派</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* 日期選擇器 */}
        {showDatePicker && (
          <DateTimePicker
            value={dueDate || new Date()}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                setDueDate(selectedDate);
              }
            }}
            minimumDate={new Date()}
          />
        )}
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
    minHeight: 80,
    paddingTop: 12,
  },
  pickerContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
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
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  dateText: {
    fontSize: 16,
    color: '#1A1A1A',
    flex: 1,
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