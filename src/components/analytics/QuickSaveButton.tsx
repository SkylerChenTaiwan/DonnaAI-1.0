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
  Switch } from 'react-native';
import { Icon } from '@/components/common/Icon';
import { colors } from '../../theme/colors';
import { DesignSystem } from '../../theme/designSystem';

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
        <Icon name="bookmark-outline" size={24} color="white" />
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
                trackColor={{ false: colors.border, true: colors.success }}
                thumbColor={isPublic ? colors.success : colors.backgroundSecondary}
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
    backgroundColor: DesignSystem.colors.button.primary.default,
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingVertical: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    ...DesignSystem.shadows.none },
  floatingButtonText: {
    color: colors.background,
    ...DesignSystem.typography.button,
    marginLeft: DesignSystem.spacing.xs },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 26, 26, 0.5)',
    justifyContent: 'center',
    alignItems: 'center' },
  dialogContainer: {
    backgroundColor: colors.background,
    borderRadius: DesignSystem.borderRadius.lg,
    padding: DesignSystem.spacing.lg,
    width: '85%',
    maxWidth: 400 },
  dialogTitle: {
    ...DesignSystem.typography.h4,
    color: colors.text,
    marginBottom: DesignSystem.spacing.lg,
    textAlign: 'center' },
  inputContainer: {
    marginBottom: DesignSystem.spacing.md },
  label: {
    ...DesignSystem.typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: DesignSystem.spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: DesignSystem.borderRadius.sm,
    padding: DesignSystem.spacing.sm,
    ...DesignSystem.typography.body,
    color: colors.text },
  publicContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.sm },
  hint: {
    ...DesignSystem.typography.caption,
    color: colors.textTertiary,
    marginBottom: DesignSystem.spacing.lg },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between' },
  button: {
    flex: 1,
    paddingVertical: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borderRadius.button,
    alignItems: 'center' },
  cancelButton: {
    backgroundColor: DesignSystem.colors.button.secondary.default,
    marginRight: DesignSystem.spacing.sm },
  saveButton: {
    backgroundColor: DesignSystem.colors.button.primary.default,
    marginLeft: DesignSystem.spacing.sm },
  disabledButton: {
    opacity: 0.6 },
  cancelButtonText: {
    color: colors.textSecondary,
    ...DesignSystem.typography.button },
  saveButtonText: {
    color: colors.background,
    ...DesignSystem.typography.button } });