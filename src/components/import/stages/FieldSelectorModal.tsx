/**
 * 欄位選擇器 Modal 內容元件
 * 從 FieldMapper.tsx 抽取出來的 Modal 內容
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { MaterialIcon } from '@/components/common/MaterialIcon';
import { DesignSystem } from '@/theme/designSystem';
import { FieldConfig } from '@/types/fieldDefinitions';
import { withAlpha } from '@/utils/colorUtils';

interface FieldSelectorModalContentProps {
  existingFields: FieldConfig[];
  onSelectField: (fieldKey: string) => void;
}

export const FieldSelectorModalContent: React.FC<FieldSelectorModalContentProps> = ({
  existingFields,
  onSelectField
}) => {
  const colors = DesignSystem.colors;

  return (
    <ScrollView style={styles.modalBody}>
      {/* 現有欄位 */}
      <Text style={[styles.modalSectionTitle, { color: colors.text.primary }]}>
        現有欄位
      </Text>
      {existingFields.map((field) => (
        <TouchableOpacity
          key={field.key}
          style={[
            styles.fieldOption,
            { 
              backgroundColor: colors.background.surface,
              borderColor: colors.border.light
            }
          ]}
          onPress={() => {
            console.log('選擇欄位:', field.key);
            onSelectField(field.key);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.fieldOptionContent}>
            <Text style={[styles.fieldOptionLabel, { color: colors.text.primary }]}>
              {field.label}
            </Text>
            <Text style={[styles.fieldOptionKey, { color: colors.text.secondary }]}>
              {field.key}
            </Text>
            <Text style={[styles.fieldOptionType, { color: colors.text.tertiary }]}>
              {field.type}
            </Text>
          </View>
          <MaterialIcon name="chevron-right" size={20} color={colors.text.tertiary} />
        </TouchableOpacity>
      ))}
      
      {/* 建立新欄位 */}
      <Text style={[styles.modalSectionTitle, { color: colors.text.primary, marginTop: 24 }]}>
        其他選項
      </Text>
      <TouchableOpacity
        style={[
          styles.fieldOption,
          { 
            backgroundColor: withAlpha(colors.semantic.success, 0.063),
            borderColor: withAlpha(colors.semantic.success, 0.25)
          }
        ]}
        onPress={() => {
          console.log('建立新欄位');
          onSelectField('new_field');
        }}
        activeOpacity={0.7}
      >
        <View style={styles.fieldOptionContent}>
          <Text style={[styles.fieldOptionLabel, { color: colors.semantic.success }]}>
            建立新欄位
          </Text>
          <Text style={[styles.fieldOptionKey, { color: withAlpha(colors.semantic.success, 0.8) }]}>
            使用原 CSV 欄位名稱
          </Text>
        </View>
        <MaterialIcon name="add-circle" size={20} color={colors.semantic.success} />
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  modalBody: {
    flex: 1,
    paddingHorizontal: 16
  },
  modalSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 16
  },
  fieldOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8
  },
  fieldOptionContent: {
    flex: 1
  },
  fieldOptionLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2
  },
  fieldOptionKey: {
    fontSize: 12,
    marginBottom: 2
  },
  fieldOptionType: {
    fontSize: 11,
    textTransform: 'uppercase'
  }
});