/**
 * 關聯編輯器 Modal 內容元件
 * 從 FieldMapper.tsx 抽取出來的 Modal 內容
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput
} from 'react-native';
import { MaterialIcon } from '@/components/common/MaterialIcon';
import { AdaptiveSwitch } from '@/components/adaptive';
import { DesignSystem } from '@/theme/designSystem';
import { FieldMapping, FieldRelation, RelationType, DatabaseType } from '@/types/import';
import { FieldConfig } from '@/types/fieldDefinitions';
import { withAlpha } from '@/utils/colorUtils';

interface RelationEditorModalContentProps {
  selectedMapping: FieldMapping | null;
  existingRelations: FieldRelation[];
  onSaveRelation: (relation: FieldRelation) => void;
  onRemoveRelation: (relation: FieldRelation) => void;
}

const RELATION_TYPES = [
  { value: 'one-to-one', label: '一對一', icon: 'link' },
  { value: 'one-to-many', label: '一對多', icon: 'share' },
  { value: 'many-to-one', label: '多對一', icon: 'merge' },
  { value: 'many-to-many', label: '多對多', icon: 'shuffle' }
] as const;

const DATABASE_OPTIONS = [
  { value: 'customers', label: '客戶' },
  { value: 'records', label: '紀錄' },
  { value: 'tasks', label: '任務' },
  { value: 'users', label: '業務' }
] as const;

export const RelationEditorModalContent: React.FC<RelationEditorModalContentProps> = ({
  selectedMapping,
  existingRelations,
  onSaveRelation,
  onRemoveRelation
}) => {
  const colors = DesignSystem.colors;
  const [relationType, setRelationType] = useState<RelationType>('one-to-one');
  const [targetDatabase, setTargetDatabase] = useState<DatabaseType>('customers');
  const [targetField, setTargetField] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [autoCreate, setAutoCreate] = useState(false);
  const [cascadeDelete, setCascadeDelete] = useState(false);

  // 檢查是否已有相同關聯
  const existingRelation = existingRelations.find(
    rel => rel.sourceField === selectedMapping?.targetField
  );

  useEffect(() => {
    if (existingRelation) {
      setRelationType(existingRelation.type);
      setTargetDatabase(existingRelation.targetDatabase);
      setTargetField(existingRelation.targetField);
      setIsRequired(existingRelation.required || false);
      setAutoCreate(existingRelation.autoCreate || false);
      setCascadeDelete(existingRelation.cascadeDelete || false);
    }
  }, [existingRelation]);

  const handleSave = () => {
    if (!selectedMapping || !targetField) return;

    const relation: FieldRelation = {
      id: existingRelation?.id || `rel_${Date.now()}`,
      sourceField: selectedMapping.targetField,
      targetDatabase,
      targetField,
      type: relationType,
      required: isRequired,
      autoCreate,
      cascadeDelete
    };

    onSaveRelation(relation);
  };

  const handleRemove = () => {
    if (existingRelation) {
      onRemoveRelation(existingRelation);
    }
  };

  if (!selectedMapping) return null;

  return (
    <ScrollView style={styles.modalBody}>
      {/* 來源欄位資訊 */}
      <View style={[styles.infoSection, { backgroundColor: colors.background.elevated }]}>
        <Text style={[styles.infoLabel, { color: colors.text.secondary }]}>
          來源欄位
        </Text>
        <Text style={[styles.infoValue, { color: colors.text.primary }]}>
          {selectedMapping.sourceField} → {selectedMapping.targetField}
        </Text>
      </View>

      {/* 關聯類型選擇 */}
      <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
        關聯類型
      </Text>
      <View style={styles.typeGrid}>
        {RELATION_TYPES.map(type => (
          <TouchableOpacity
            key={type.value}
            style={[
              styles.typeOption,
              {
                backgroundColor: colors.background.surface,
                borderColor: relationType === type.value 
                  ? colors.primary 
                  : colors.border.light
              },
              relationType === type.value && styles.typeOptionSelected
            ]}
            onPress={() => setRelationType(type.value as RelationType)}
            activeOpacity={0.7}
          >
            <MaterialIcon 
              name={type.icon} 
              size={20} 
              color={relationType === type.value ? colors.primary : colors.text.secondary} 
            />
            <Text style={[
              styles.typeLabel,
              { color: relationType === type.value ? colors.primary : colors.text.primary }
            ]}>
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 目標資料庫選擇 */}
      <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
        目標資料庫
      </Text>
      <View style={styles.databaseOptions}>
        {DATABASE_OPTIONS.map(db => (
          <TouchableOpacity
            key={db.value}
            style={[
              styles.databaseOption,
              {
                backgroundColor: targetDatabase === db.value 
                  ? colors.primary 
                  : colors.background.surface,
                borderColor: targetDatabase === db.value 
                  ? colors.primary 
                  : colors.border.light
              }
            ]}
            onPress={() => setTargetDatabase(db.value as DatabaseType)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.databaseLabel,
              { color: targetDatabase === db.value ? '#FFFFFF' : colors.text.primary }
            ]}>
              {db.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 目標欄位輸入 */}
      <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
        目標欄位
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.background.surface,
            borderColor: colors.border.light,
            color: colors.text.primary
          }
        ]}
        placeholder="例如：id, name, email"
        placeholderTextColor={colors.text.tertiary}
        value={targetField}
        onChangeText={setTargetField}
      />

      {/* 進階選項 */}
      <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
        進階選項
      </Text>
      
      <View style={[styles.optionRow, { borderBottomColor: colors.border.light }]}>
        <View style={styles.optionInfo}>
          <Text style={[styles.optionLabel, { color: colors.text.primary }]}>
            必填關聯
          </Text>
          <Text style={[styles.optionDescription, { color: colors.text.secondary }]}>
            匯入時必須有對應的關聯資料
          </Text>
        </View>
        <AdaptiveSwitch
          value={isRequired}
          onValueChange={setIsRequired}
          trackColor={{ false: colors.border.light, true: colors.primary }}
          thumbColor="#FFFFFF"
        />
      </View>

      <View style={[styles.optionRow, { borderBottomColor: colors.border.light }]}>
        <View style={styles.optionInfo}>
          <Text style={[styles.optionLabel, { color: colors.text.primary }]}>
            自動建立
          </Text>
          <Text style={[styles.optionDescription, { color: colors.text.secondary }]}>
            若關聯資料不存在則自動建立
          </Text>
        </View>
        <AdaptiveSwitch
          value={autoCreate}
          onValueChange={setAutoCreate}
          trackColor={{ false: colors.border.light, true: colors.primary }}
          thumbColor="#FFFFFF"
        />
      </View>

      <View style={[styles.optionRow, { borderBottomColor: colors.border.light }]}>
        <View style={styles.optionInfo}>
          <Text style={[styles.optionLabel, { color: colors.text.primary }]}>
            串聯刪除
          </Text>
          <Text style={[styles.optionDescription, { color: colors.text.secondary }]}>
            刪除主資料時一併刪除關聯資料
          </Text>
        </View>
        <AdaptiveSwitch
          value={cascadeDelete}
          onValueChange={setCascadeDelete}
          trackColor={{ false: colors.border.light, true: colors.primary }}
          thumbColor="#FFFFFF"
        />
      </View>

      {/* 操作按鈕 */}
      <View style={styles.actionButtons}>
        {existingRelation && (
          <TouchableOpacity
            style={[styles.removeButton, { backgroundColor: colors.semantic.error }]}
            onPress={handleRemove}
            activeOpacity={0.7}
          >
            <MaterialIcon name="delete" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>移除關聯</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: targetField ? colors.primary : colors.border.light }
          ]}
          onPress={handleSave}
          disabled={!targetField}
          activeOpacity={0.7}
        >
          <MaterialIcon name="save" size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>
            {existingRelation ? '更新關聯' : '建立關聯'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  modalBody: {
    flex: 1,
    paddingHorizontal: 16
  },
  infoSection: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 4
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500'
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 8
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16
  },
  typeOption: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8
  },
  typeOptionSelected: {
    borderWidth: 2
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '500'
  },
  databaseOptions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16
  },
  databaseOption: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center'
  },
  databaseLabel: {
    fontSize: 14,
    fontWeight: '500'
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    marginBottom: 16
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginBottom: 8
  },
  optionInfo: {
    flex: 1,
    marginRight: 16
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2
  },
  optionDescription: {
    fontSize: 12
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 16
  },
  removeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600'
  }
});