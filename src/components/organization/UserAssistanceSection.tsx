/**
 * 用戶協助區塊組件
 * 提供資料匯入、自訂欄位設定、舊系統遷移等協助功能
 */

import React, { useState, useEffect } from 'react';
import {
  AdaptiveModal,
  AdaptiveInput
} from '@/components/adaptive';
import { View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput as RNTextInput } from 'react-native';
import { Icon } from '@/components/common/Icon';
import DocumentPicker from 'expo-document-picker';
import ImportWizard from '@/components/import/ImportWizard';
import {
  importUserData,
  setupCustomFields,
  getCustomFieldConfig,
  SUPPORTED_FORMATS,
  CustomFieldConfig } from '@/services/firebase/admin/userAssistService';
import { Organization, ImportResult, FieldMapping } from '@/types/entities';
import { DesignSystem } from '@/theme/designSystem';
import { toast } from '@/utils/toast';
import { withAlpha } from '@/utils/colorUtils';

interface UserAssistanceSectionProps {
  organization: Organization;
  onUpdate?: () => void;
}

interface ImportWizardState {
  step: 'select' | 'mapping' | 'preview' | 'importing';
  selectedFile: any;
  dataType: 'users' | 'customers' | 'tasks';
  fieldMappings: FieldMapping[];
  previewData: any[];
}

interface CustomFieldWizardState {
  fields: CustomFieldConfig[];
  entityType: 'users' | 'customers' | 'tasks';
}

export const UserAssistanceSection: React.FC<UserAssistanceSectionProps> = ({
  organization,
  onUpdate }) => {
  const [activeAssistance, setActiveAssistance] = useState<'import' | 'fields' | null>(null);
  const [importWizard, setImportWizard] = useState<ImportWizardState>({
    step: 'select',
    selectedFile: null,
    dataType: 'users',
    fieldMappings: [],
    previewData: [] });
  const [customFieldWizard, setCustomFieldWizard] = useState<CustomFieldWizardState>({
    fields: [],
    entityType: 'users' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [importHistory, setImportHistory] = useState<ImportResult[]>([]);

  useEffect(() => {
    loadImportHistory();
  }, []);

  const loadImportHistory = async () => {
    // 這裡應該從 Firestore 載入匯入歷史
    // 暫時使用空陣列
    setImportHistory([]);
  };


  const handleFileSelection = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        copyToCacheDirectory: true });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        setImportWizard(prev => ({
          ...prev,
          selectedFile: file,
          step: 'mapping' }));
        
        // 這裡應該解析檔案並獲取欄位列表
        // 暫時使用示例資料
        const sampleMappings: FieldMapping[] = [
          { sourceField: '姓名', targetField: 'name', transform: 'none' },
          { sourceField: '電子郵件', targetField: 'email', transform: 'lowercase' },
        ];
        setImportWizard(prev => ({
          ...prev,
          fieldMappings: sampleMappings }));
      }
    } catch (error) {
      console.error('選擇檔案失敗:', error);
      toast.error('選擇檔案失敗');
    }
  };

  const handleImportData = async () => {
    setIsProcessing(true);
    try {
      setImportWizard(prev => ({ ...prev, step: 'importing' }));
      
      // 這裡應該解析檔案內容
      const mockData = [
        { '姓名': '張三', '電子郵件': 'zhang@example.com' },
        { '姓名': '李四', '電子郵件': 'li@example.com' },
      ];

      const result = await importUserData(
        mockData,
        importWizard.dataType,
        importWizard.fieldMappings
      );

      if (result.success) {
        toast.success(`成功匯入 ${result.imported} 筆資料`);
        setActiveAssistance(null);
        onUpdate?.();
      } else {
        toast.error(`匯入失敗，錯誤: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      console.error('匯入資料失敗:', error);
      toast.error('匯入失敗');
    } finally {
      setIsProcessing(false);
    }
  };

  // === 自訂欄位助手 ===

  const handleStartCustomFields = (entityType: 'users' | 'customers' | 'tasks') => {
    setCustomFieldWizard({
      fields: [],
      entityType });
    setActiveAssistance('fields');
    loadExistingCustomFields(entityType);
  };

  const loadExistingCustomFields = async (entityType: string) => {
    try {
      const existingFields = await getCustomFieldConfig(entityType as any);
      setCustomFieldWizard(prev => ({
        ...prev,
        fields: existingFields }));
    } catch (error) {
      console.error('載入自訂欄位失敗:', error);
    }
  };

  const handleAddCustomField = () => {
    const newField: CustomFieldConfig = {
      id: `field_${Date.now()}`,
      name: '',
      type: 'text',
      required: false };
    setCustomFieldWizard(prev => ({
      ...prev,
      fields: [...prev.fields, newField] }));
  };

  const handleUpdateCustomField = (index: number, updates: Partial<CustomFieldConfig>) => {
    setCustomFieldWizard(prev => ({
      ...prev,
      fields: prev.fields.map((field, i) => 
        i === index ? { ...field, ...updates } : field
      ) }));
  };

  const handleRemoveCustomField = (index: number) => {
    setCustomFieldWizard(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index) }));
  };

  const handleSaveCustomFields = async () => {
    setIsProcessing(true);
    try {
      await setupCustomFields(customFieldWizard.entityType, customFieldWizard.fields);
      toast.success('自訂欄位設定已保存');
      setActiveAssistance(null);
      onUpdate?.();
    } catch (error) {
      console.error('儲存自訂欄位失敗:', error);
      toast.error('儲存失敗');
    } finally {
      setIsProcessing(false);
    }
  };


  const renderImportWizard = () => (
    <AdaptiveModal
      visible={activeAssistance === 'import'}
      animationType="slide"
      presentationStyle="fullScreen"
      size="fullscreen"  // Web 需要 size 屬性來實現全螢幕
      contentStyle={{ backgroundColor: '#FFFFFF' }}  // 確保白色背景
    >
      <ImportWizard
        organizationId={organization.id}
        teamId={organization.defaultTeamId}
        onComplete={(result) => {
          toast.success(`成功匯入 ${result.importedCount} 筆資料到 ${result.targetDatabase}`);
          setActiveAssistance(null);
          onUpdate?.();
          loadImportHistory();
        }}
        onCancel={() => setActiveAssistance(null)}
      />
    </AdaptiveModal>
  );

  const renderCustomFieldWizard = () => (
    <AdaptiveModal
      visible={activeAssistance === 'fields'}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>自訂欄位設定</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setActiveAssistance(null)}
          >
            <Icon name="close" size={24} color={DesignSystem.colors.text.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.wizardStep}>
            <Text style={styles.stepTitle}>管理自訂欄位</Text>
            <Text style={styles.stepDesc}>為 {customFieldWizard.entityType} 建立自訂欄位</Text>
            
            {customFieldWizard.fields.map((field, index) => (
              <View key={field.id} style={styles.fieldRow}>
                <RNTextInput
                  style={styles.fieldInput}
                  placeholder="欄位名稱"
                  value={field.name}
                  onChangeText={(text) => handleUpdateCustomField(index, { name: text })}
                />
                <TouchableOpacity
                  style={styles.removeFieldButton}
                  onPress={() => handleRemoveCustomField(index)}
                >
                  <Icon name="trash-outline" size={16} color={DesignSystem.colors.gray500} />
                </TouchableOpacity>
              </View>
            ))}
            
            <TouchableOpacity
              style={styles.addFieldButton}
              onPress={handleAddCustomField}
            >
              <Icon name="add" size={16} color={DesignSystem.colors.primary} />
              <Text style={styles.addFieldText}>新增欄位</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleSaveCustomFields}
              disabled={isProcessing}
            >
              <Text style={styles.primaryButtonText}>
                {isProcessing ? '儲存中...' : '儲存設定'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </AdaptiveModal>
  );


  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 資料匯入區塊 */}
      <View style={styles.assistanceCard}>
        <View style={styles.cardHeader}>
          <Icon name="cloud-upload-outline" size={32} color={DesignSystem.colors.primary} />
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>資料匯入協助</Text>
            <Text style={styles.cardDesc}>協助匯入 CSV/Excel 資料到系統中</Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={StyleSheet.flatten([styles.primaryButton, { marginTop: 12 }])}
          onPress={() => setActiveAssistance('import')}
        >
          <Icon name="cloud-upload" size={20} color={DesignSystem.colors.background.primary} />
          <Text style={styles.primaryButtonText}>開始資料匯入精靈</Text>
        </TouchableOpacity>
      </View>

      {/* 自訂欄位區塊 */}
      <View style={styles.assistanceCard}>
        <View style={styles.cardHeader}>
          <Icon name="settings-outline" size={32} color={DesignSystem.colors.primary} />
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>自訂欄位設定</Text>
            <Text style={styles.cardDesc}>建立和管理客製化欄位</Text>
          </View>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleStartCustomFields('users')}
          >
            <Text style={styles.actionButtonText}>用戶欄位</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleStartCustomFields('customers')}
          >
            <Text style={styles.actionButtonText}>客戶欄位</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleStartCustomFields('tasks')}
          >
            <Text style={styles.actionButtonText}>任務欄位</Text>
          </TouchableOpacity>
        </View>
      </View>


      {/* 協助資源 */}
      <View style={styles.resourcesCard}>
        <Text style={styles.resourcesTitle}>協助資源</Text>
        
        <TouchableOpacity style={styles.resourceItem}>
          <Icon name="document-text-outline" size={20} color={DesignSystem.colors.primary} />
          <Text style={styles.resourceText}>資料匯入格式說明</Text>
          <Icon name="chevron-forward" size={16} color={DesignSystem.colors.text.secondary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.resourceItem}>
          <Icon name="help-circle-outline" size={20} color={DesignSystem.colors.primary} />
          <Text style={styles.resourceText}>常見問題與解答</Text>
          <Icon name="chevron-forward" size={16} color={DesignSystem.colors.text.secondary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.resourceItem}>
          <Icon name="call-outline" size={20} color={DesignSystem.colors.primary} />
          <Text style={styles.resourceText}>聯繫技術支援</Text>
          <Icon name="chevron-forward" size={16} color={DesignSystem.colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* 渲染模態窗口 */}
      {renderImportWizard()}
      {renderCustomFieldWizard()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1 },
  assistanceCard: {
    backgroundColor: DesignSystem.colors.background.surface,
    padding: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.borderRadius.md,
    marginBottom: DesignSystem.spacing.md,
    ...DesignSystem.shadows.sm },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.md },
  cardInfo: {
    flex: 1,
    marginLeft: DesignSystem.spacing.md },
  cardTitle: {
    ...DesignSystem.typography.h4,
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.xs },
  cardDesc: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.secondary },
  actionButtons: {
    flexDirection: 'row',
    gap: DesignSystem.spacing.sm,
    flexWrap: 'wrap' },
  actionButton: {
    backgroundColor: withAlpha(DesignSystem.colors.primary, 0.125),
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borderRadius.sm,
    borderWidth: 1,
    borderColor: DesignSystem.colors.primary },
  actionButtonText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.primary,
    fontWeight: '500' },
  resourcesCard: {
    backgroundColor: DesignSystem.colors.background.surface,
    padding: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.borderRadius.md,
    ...DesignSystem.shadows.sm },
  resourcesTitle: {
    ...DesignSystem.typography.h4,
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.md },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: DesignSystem.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light },
  resourceText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary,
    flex: 1,
    marginLeft: DesignSystem.spacing.sm },
  modalContainer: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background.primary },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: DesignSystem.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light },
  modalTitle: {
    ...DesignSystem.typography.h3,
    color: DesignSystem.colors.text.primary },
  closeButton: {
    padding: DesignSystem.spacing.sm },
  modalContent: {
    flex: 1,
    padding: DesignSystem.spacing.lg },
  wizardStep: {
    alignItems: 'center' },
  stepTitle: {
    ...DesignSystem.typography.h4,
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.sm,
    textAlign: 'center' },
  stepDesc: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.secondary,
    marginBottom: DesignSystem.spacing.xl,
    textAlign: 'center' },
  fileSelectButton: {
    alignItems: 'center',
    padding: DesignSystem.spacing.xl,
    borderWidth: 2,
    borderColor: DesignSystem.colors.primary,
    borderStyle: 'dashed',
    borderRadius: DesignSystem.borderRadius.md,
    backgroundColor: withAlpha(DesignSystem.colors.primary, 0.063) },
  fileSelectText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.primary,
    marginTop: DesignSystem.spacing.sm,
    fontWeight: '500' },
  mappingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    width: '100%' },
  sourceField: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary,
    flex: 1,
    textAlign: 'right' },
  targetField: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary,
    flex: 1 },
  primaryButton: {
    backgroundColor: DesignSystem.colors.primary,
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.xl,
    borderRadius: DesignSystem.borderRadius.sm,
    marginTop: DesignSystem.spacing.xl },
  primaryButtonText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.inverse,
    fontWeight: '500',
    textAlign: 'center' },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSystem.spacing.sm,
    marginBottom: DesignSystem.spacing.md,
    width: '100%' },
  fieldInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.default,
    borderRadius: DesignSystem.borderRadius.sm,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    ...DesignSystem.typography.body },
  removeFieldButton: {
    padding: DesignSystem.spacing.sm },
  addFieldButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSystem.spacing.xs,
    paddingVertical: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.lg },
  addFieldText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.primary,
    fontWeight: '500' },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: DesignSystem.colors.primary,
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: DesignSystem.spacing.sm },
  primaryButtonText: {
    ...DesignSystem.typography.button,
    color: DesignSystem.colors.background.primary,
    fontWeight: '600' } });