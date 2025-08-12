/**
 * 自訂欄位查看 Modal
 * 顯示各個資料庫的自訂欄位配置
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  RefreshControl,
} from 'react-native';
import { Icon } from '@/components/common/Icon';
import { Organization } from '@/types/entities';  
import { DesignSystem } from '@/theme/designSystem';
import { toast } from '@/utils/toast';
import { getCustomFieldConfig, CustomFieldConfig } from '@/services/firebase/admin/userAssistService';
import { withAlpha } from '@/utils/colorUtils';

interface CustomFieldsModalProps {
  visible: boolean;
  organization: Organization;
  onClose: () => void;
}

type EntityType = 'users' | 'customers' | 'tasks';

interface DatabaseInfo {
  key: EntityType;
  title: string;
  description: string;
  icon: string;
  color: string;
}

const DATABASES: DatabaseInfo[] = [
  {
    key: 'users',
    title: '用戶資料庫',
    description: '員工和團隊成員的自訂欄位',
    icon: 'people-outline',
    color: DesignSystem.colors.primary,
  },
  {
    key: 'customers',
    title: '客戶資料庫',
    description: '客戶資訊的自訂欄位',
    icon: 'business-outline',
    color: DesignSystem.colors.success,
  },
  {
    key: 'tasks',
    title: '任務資料庫',
    description: '任務和待辦事項的自訂欄位',
    icon: 'checkbox-outline',
    color: DesignSystem.colors.warning,
  },
];

export const CustomFieldsModal: React.FC<CustomFieldsModalProps> = ({
  visible,
  organization,
  onClose,
}) => {
  const [selectedDatabase, setSelectedDatabase] = useState<EntityType | null>(null);
  const [customFields, setCustomFields] = useState<CustomFieldConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (selectedDatabase) {
      loadCustomFields(selectedDatabase);
    }
  }, [selectedDatabase]);

  const loadCustomFields = async (entityType: EntityType) => {
    try {
      setIsLoading(true);
      const fields = await getCustomFieldConfig(entityType);
      setCustomFields(fields);
    } catch (error) {
      console.error('載入自訂欄位失敗:', error);
      toast.error('載入自訂欄位失敗');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!selectedDatabase) return;
    
    setRefreshing(true);
    await loadCustomFields(selectedDatabase);
    setRefreshing(false);
  };

  const handleSelectDatabase = (database: EntityType) => {
    setSelectedDatabase(database);
    setCustomFields([]);
  };

  const handleBack = () => {
    setSelectedDatabase(null);
    setCustomFields([]);
  };

  const handleClose = () => {
    setSelectedDatabase(null);
    setCustomFields([]);
    onClose();
  };

  const getFieldTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      text: '文字',
      number: '數字',
      date: '日期',
      select: '單選',
      multiselect: '多選',
      boolean: '是/否',
    };
    return typeLabels[type] || type;
  };

  const getFieldTypeIcon = (type: string) => {
    const typeIcons: Record<string, string> = {
      text: 'text-outline',
      number: 'calculator-outline',
      date: 'calendar-outline',
      select: 'list-outline',
      multiselect: 'checkbox-outline',
      boolean: 'toggle-outline',
    };
    return typeIcons[type] || 'help-outline';
  };

  const renderDatabaseList = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>選擇資料庫</Text>
      <Text style={styles.stepDesc}>
        選擇要查看自訂欄位的資料庫類型
      </Text>

      {DATABASES.map((database) => (
        <TouchableOpacity
          key={database.key}
          style={styles.databaseCard}
          onPress={() => handleSelectDatabase(database.key)}
        >
          <View style={[styles.databaseIcon, { backgroundColor: database.color + '20' }]}>
            <Icon name={database.icon as any} size={24} color={database.color} />
          </View>
          <View style={styles.databaseContent}>
            <Text style={styles.databaseTitle}>{database.title}</Text>
            <Text style={styles.databaseDesc}>{database.description}</Text>
          </View>
          <Icon name="chevron-forward" size={20} color={DesignSystem.colors.text.secondary} />
        </TouchableOpacity>
      ))}

      <View style={styles.infoBox}>
        <Icon name="information-circle-outline" size={20} color={DesignSystem.colors.primary} />
        <Text style={styles.infoText}>
          自訂欄位允許您為不同類型的資料添加額外的屬性。
          這些欄位可以在匯入資料時使用，也可以在應用程式中顯示和編輯。
        </Text>
      </View>
    </View>
  );

  const renderFieldList = () => {
    const selectedDb = DATABASES.find(db => db.key === selectedDatabase);
    
    return (
      <View style={styles.stepContent}>
        <View style={styles.backHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
          >
            <Icon name="chevron-back" size={20} color={DesignSystem.colors.primary} />
            <Text style={styles.backButtonText}>返回</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.databaseHeader}>
          <View style={[styles.databaseIcon, { backgroundColor: selectedDb?.color + '20' }]}>
            <Icon name={selectedDb?.icon as any} size={24} color={selectedDb?.color} />
          </View>
          <View>
            <Text style={styles.databaseHeaderTitle}>{selectedDb?.title}</Text>
            <Text style={styles.databaseHeaderDesc}>
              {customFields.length > 0 ? `${customFields.length} 個自訂欄位` : '尚未設定自訂欄位'}
            </Text>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>載入中...</Text>
          </View>
        ) : customFields.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="folder-open-outline" size={48} color={DesignSystem.colors.text.secondary} />
            <Text style={styles.emptyTitle}>尚未設定自訂欄位</Text>
            <Text style={styles.emptyDesc}>
              此資料庫目前沒有設定任何自訂欄位。
              您可以聯繫系統管理員來設定自訂欄位。
            </Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.fieldsList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
          >
            {customFields.map((field, index) => (
              <View key={field.id || index} style={styles.fieldCard}>
                <View style={styles.fieldHeader}>
                  <View style={styles.fieldIconContainer}>
                    <Icon 
                      name={getFieldTypeIcon(field.type) as any} 
                      size={20} 
                      color={DesignSystem.colors.primary} 
                    />
                  </View>
                  <View style={styles.fieldInfo}>
                    <Text style={styles.fieldName}>{field.name}</Text>
                    <Text style={styles.fieldType}>{getFieldTypeLabel(field.type)}</Text>
                  </View>
                  {field.required && (
                    <View style={styles.requiredBadge}>
                      <Text style={styles.requiredText}>必填</Text>
                    </View>
                  )}
                </View>

                {field.options && field.options.length > 0 && (
                  <View style={styles.fieldOptions}>
                    <Text style={styles.optionsLabel}>選項:</Text>
                    <View style={styles.optionsList}>
                      {field.options.map((option, optIndex) => (
                        <View key={optIndex} style={styles.optionTag}>
                          <Text style={styles.optionText}>{option}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {field.defaultValue && (
                  <View style={styles.fieldDefault}>
                    <Text style={styles.defaultLabel}>預設值: </Text>
                    <Text style={styles.defaultValue}>{String(field.defaultValue)}</Text>
                  </View>
                )}

                {field.validation && (
                  <View style={styles.fieldValidation}>
                    <Text style={styles.validationLabel}>驗證規則:</Text>
                    {field.validation.min && (
                      <Text style={styles.validationRule}>• 最小值: {field.validation.min}</Text>
                    )}
                    {field.validation.max && (
                      <Text style={styles.validationRule}>• 最大值: {field.validation.max}</Text>
                    )}
                    {field.validation.pattern && (
                      <Text style={styles.validationRule}>• 格式驗證已設定</Text>
                    )}
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.closeButton}
          >
            <Icon name="close" size={24} color={DesignSystem.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>自訂欄位查看</Text>
        </View>

        {/* Content */}
        {selectedDatabase ? renderFieldList() : renderDatabaseList()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingVertical: DesignSystem.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light,
  },
  closeButton: {
    padding: DesignSystem.spacing.sm,
    marginRight: DesignSystem.spacing.sm,
  },
  headerTitle: {
    ...DesignSystem.typography.h4,
    color: DesignSystem.colors.text.primary,
  },
  stepContent: {
    flex: 1,
    padding: DesignSystem.spacing.lg,
  },
  stepTitle: {
    ...DesignSystem.typography.h3,
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.sm,
  },
  stepDesc: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.secondary,
    marginBottom: DesignSystem.spacing.lg,
    lineHeight: 20,
  },
  databaseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DesignSystem.colors.background.surface,
    padding: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.borderRadius.md,
    marginBottom: DesignSystem.spacing.md,
    ...DesignSystem.shadows.sm,
  },
  databaseIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: DesignSystem.spacing.md,
  },
  databaseContent: {
    flex: 1,
  },
  databaseTitle: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary,
    fontWeight: '600',
    marginBottom: DesignSystem.spacing.xs,
  },
  databaseDesc: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: withAlpha(DesignSystem.colors.primary, 0.063),
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.sm,
    marginTop: DesignSystem.spacing.lg,
  },
  infoText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    marginLeft: DesignSystem.spacing.sm,
    flex: 1,
    lineHeight: 18,
  },
  backHeader: {
    marginBottom: DesignSystem.spacing.lg,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  backButtonText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.primary,
    marginLeft: DesignSystem.spacing.xs,
  },
  databaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.lg,
    paddingBottom: DesignSystem.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light,
  },
  databaseHeaderTitle: {
    ...DesignSystem.typography.h4,
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.xs,
  },
  databaseHeaderDesc: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: DesignSystem.spacing.xl,
  },
  emptyTitle: {
    ...DesignSystem.typography.h4,
    color: DesignSystem.colors.text.primary,
    marginTop: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.sm,
  },
  emptyDesc: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  fieldsList: {
    flex: 1,
  },
  fieldCard: {
    backgroundColor: DesignSystem.colors.background.surface,
    padding: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.borderRadius.md,
    marginBottom: DesignSystem.spacing.md,
    ...DesignSystem.shadows.sm,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.sm,
  },
  fieldIconContainer: {
    width: 32,
    height: 32,
    backgroundColor: withAlpha(DesignSystem.colors.primary, 0.125),
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: DesignSystem.spacing.md,
  },
  fieldInfo: {
    flex: 1,
  },
  fieldName: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary,
    fontWeight: '600',
    marginBottom: DesignSystem.spacing.xs,
  },
  fieldType: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
  },
  requiredBadge: {
    backgroundColor: DesignSystem.colors.error,
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.xs,
    borderRadius: DesignSystem.borderRadius.sm,
  },
  requiredText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.inverse,
    fontWeight: '600',
  },
  fieldOptions: {
    marginTop: DesignSystem.spacing.sm,
  },
  optionsLabel: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    marginBottom: DesignSystem.spacing.xs,
  },
  optionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignSystem.spacing.xs,
  },
  optionTag: {
    backgroundColor: DesignSystem.colors.background.primary,
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.xs,
    borderRadius: DesignSystem.borderRadius.sm,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.light,
  },
  optionText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.primary,
  },
  fieldDefault: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: DesignSystem.spacing.sm,
  },
  defaultLabel: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
  },
  defaultValue: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.primary,
    fontWeight: '500',
  },
  fieldValidation: {
    marginTop: DesignSystem.spacing.sm,
  },
  validationLabel: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    marginBottom: DesignSystem.spacing.xs,
  },
  validationRule: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.primary,
    marginLeft: DesignSystem.spacing.sm,
  },
});