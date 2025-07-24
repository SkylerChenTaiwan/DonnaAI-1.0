import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  Modal,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface QuickSaveButtonProps {
  onSave: (name: string, isPublic: boolean) => Promise<void>;
}

export default function QuickSaveButton({ onSave }: QuickSaveButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [reportName, setReportName] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSavePress = () => {
    // 生成預設名稱
    const now = new Date();
    const defaultName = `分析報表 ${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    setReportName(defaultName);
    setShowDialog(true);
  };

  const handleConfirmSave = async () => {
    if (!reportName.trim()) {
      Alert.alert('請輸入報表名稱');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(reportName.trim(), isPublic);
      setShowDialog(false);
      setReportName('');
      setIsPublic(false);
    } catch (error) {
      console.error('保存失敗:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setShowDialog(false);
    setReportName('');
    setIsPublic(false);
  };

  return (
    <>
      {/* 浮動保存按鈕 */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={handleSavePress}
        activeOpacity={0.8}
      >
        <Ionicons name="bookmark-outline" size={24} color="white" />
        <Text style={styles.floatingButtonText}>保存</Text>
      </TouchableOpacity>

      {/* 命名對話框 */}
      <Modal
        visible={showDialog}
        transparent
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleCancel}
        >
          <View style={styles.dialogContainer} onStartShouldSetResponder={() => true}>
            <Text style={styles.dialogTitle}>保存分析報表</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>報表名稱</Text>
              <TextInput
                style={styles.input}
                value={reportName}
                onChangeText={setReportName}
                placeholder="輸入報表名稱"
                autoFocus
                editable={!isSaving}
                maxLength={50}
              />
            </View>

            <View style={styles.publicContainer}>
              <Text style={styles.label}>公開報表</Text>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                disabled={isSaving}
                trackColor={{ false: '#E0E0E0', true: '#81C784' }}
                thumbColor={isPublic ? '#4CAF50' : '#F5F5F5'}
              />
            </View>
            
            <Text style={styles.hint}>
              {isPublic ? '團隊成員都可以查看此報表' : '只有您可以查看此報表'}
            </Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
                disabled={isSaving}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.saveButton, isSaving && styles.disabledButton]}
                onPress={handleConfirmSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.saveButtonText}>保存</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  floatingButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  publicContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});