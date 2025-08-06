/**
 * 階段 3: 欄位映射與關聯
 * 設定欄位對應關係和跨資料庫關聯
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { DesignSystem } from '@/theme/designSystem';
import {
  DatabaseType,
  MergedTable,
  FieldMapping,
  FieldRelation,
  RelationType
} from '@/types/import';
import { FieldConfig, FieldType } from '@/types/fieldDefinitions';
import { getFieldDefinitions } from '@/services/firebase/fieldDefinitions';
import { getFieldRelations } from '@/services/firebase/fieldRelations';
import { getFieldStatistics } from '../utils/fileMerger';
import { showSuccessToast, showErrorToast } from '@/utils/toast';

interface FieldMapperProps {
  targetDatabase: DatabaseType;
  mergedTable: MergedTable;
  fieldMappings: FieldMapping[];
  fieldRelations: FieldRelation[];
  onMappingsChanged: (mappings: FieldMapping[]) => void;
  onRelationsChanged: (relations: FieldRelation[]) => void;
  organizationId: string;
}

const FieldMapper: React.FC<FieldMapperProps> = ({
  targetDatabase,
  mergedTable,
  fieldMappings,
  fieldRelations,
  onMappingsChanged,
  onRelationsChanged,
  organizationId
}) => {
  const colors = DesignSystem.colors;
  const [loading, setLoading] = useState(false);
  const [existingFields, setExistingFields] = useState<FieldConfig[]>([]);
  const [existingRelations, setExistingRelations] = useState<FieldRelation[]>([]);
  const [mappings, setMappings] = useState<FieldMapping[]>(fieldMappings);
  const [relations, setRelations] = useState<FieldRelation[]>(fieldRelations);
  const [showRelationEditor, setShowRelationEditor] = useState(false);
  const [selectedMapping, setSelectedMapping] = useState<FieldMapping | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    mapping: true,
    relations: false,
    preview: false
  });

  // 載入現有欄位定義
  useEffect(() => {
    loadExistingFields();
    loadExistingRelations();
  }, [targetDatabase, organizationId]);

  // 初始化映射
  useEffect(() => {
    if (existingFields.length > 0 && mappings.length === 0) {
      initializeMappings();
    }
  }, [existingFields, mergedTable]);

  const loadExistingFields = async () => {
    setLoading(true);
    try {
      const fields = await getFieldDefinitions(targetDatabase, organizationId);
      setExistingFields(fields);
    } catch (error) {
      console.error('載入欄位定義失敗:', error);
      showErrorToast('載入欄位定義失敗');
    } finally {
      setLoading(false);
    }
  };

  const loadExistingRelations = async () => {
    try {
      const relations = await getFieldRelations(organizationId, targetDatabase);
      setExistingRelations(relations);
    } catch (error) {
      console.error('載入關聯失敗:', error);
    }
  };

  // 初始化欄位映射
  const initializeMappings = () => {
    const initialMappings: FieldMapping[] = [];
    
    mergedTable.headers.forEach(header => {
      // 嘗試自動匹配現有欄位
      const matchedField = existingFields.find(field => {
        const fieldLabel = field.label.toLowerCase();
        const headerLower = header.toLowerCase();
        
        // 完全匹配
        if (fieldLabel === headerLower) return true;
        
        // 常見別名匹配
        const aliases: Record<string, string[]> = {
          'name': ['姓名', '客戶姓名', '名稱', 'customer_name'],
          'phone': ['電話', '手機', '聯絡電話', 'mobile', 'tel'],
          'email': ['郵件', '電子郵件', 'mail', 'e-mail'],
          'company': ['公司', '公司名稱', '企業', 'organization'],
          'address': ['地址', '住址', '聯絡地址'],
          'title': ['標題', '主題', '任務名稱'],
          'description': ['描述', '說明', '內容', '備註']
        };
        
        for (const [key, values] of Object.entries(aliases)) {
          if (field.key === key && values.some(v => headerLower.includes(v))) {
            return true;
          }
        }
        
        return false;
      });

      if (matchedField) {
        // 匹配到現有欄位
        initialMappings.push({
          sourceColumn: header,
          targetField: matchedField.key,
          isNew: false
        });
      } else {
        // 新建欄位
        const stats = getFieldStatistics(mergedTable.data, header);
        initialMappings.push({
          sourceColumn: header,
          targetField: generateFieldKey(header),
          isNew: true,
          fieldType: stats.type,
          customLabel: header
        });
      }
    });

    setMappings(initialMappings);
    onMappingsChanged(initialMappings);
  };

  // 生成欄位鍵值
  const generateFieldKey = (label: string): string => {
    // 移除特殊字符，轉換為 camelCase
    const cleaned = label.replace(/[^\w\s]/g, '').trim();
    const words = cleaned.split(/\s+/);
    
    if (words.length === 0) return 'field_' + Date.now();
    
    return words[0].toLowerCase() + 
           words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
  };

  // 更新單個映射
  const updateMapping = (index: number, updates: Partial<FieldMapping>) => {
    const newMappings = [...mappings];
    newMappings[index] = { ...newMappings[index], ...updates };
    setMappings(newMappings);
    onMappingsChanged(newMappings);
  };

  // 切換映射啟用狀態
  const toggleMappingEnabled = (index: number) => {
    const mapping = mappings[index];
    if (!mapping.targetField) {
      // 如果當前是禁用狀態，恢復預設值
      updateMapping(index, {
        targetField: generateFieldKey(mapping.sourceColumn),
        isNew: true
      });
    } else {
      // 禁用映射
      updateMapping(index, {
        targetField: '',
        isNew: false
      });
    }
  };

  // 添加關聯
  const addRelation = (sourceField: string, targetDatabase: DatabaseType, targetField: string) => {
    const newRelation: FieldRelation = {
      id: `temp-${Date.now()}`,
      sourceDatabase: targetDatabase as DatabaseType,
      sourceField,
      targetDatabase,
      targetField,
      relationType: 'one-to-many',
      bidirectional: true,
      createdAt: new Date() as any,
      organizationId,
      createdBy: '' // 將在實際儲存時設定
    };
    
    const newRelations = [...relations, newRelation];
    setRelations(newRelations);
    onRelationsChanged(newRelations);
    
    showSuccessToast('已新增關聯');
  };

  // 移除關聯
  const removeRelation = (relationId: string) => {
    const newRelations = relations.filter(r => r.id !== relationId);
    setRelations(newRelations);
    onRelationsChanged(newRelations);
  };

  // 渲染欄位映射項目
  const renderMappingItem = (mapping: FieldMapping, index: number) => {
    const isEnabled = !!mapping.targetField;
    const stats = getFieldStatistics(mergedTable.data, mapping.sourceColumn);
    
    return (
      <View 
        key={index} 
        style={[
          styles.mappingItem,
          { 
            backgroundColor: colors.white,
            borderColor: isEnabled ? colors.gray200 : colors.gray100,
            opacity: isEnabled ? 1 : 0.6
          }
        ]}
      >
        {/* 來源欄位 */}
        <View style={styles.sourceField}>
          <View style={styles.fieldHeader}>
            <Text style={[styles.sourceLabel, { color: colors.gray500 }]}>
              CSV 欄位
            </Text>
            <Switch
              value={isEnabled}
              onValueChange={() => toggleMappingEnabled(index)}
              trackColor={{ false: colors.gray200, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
          <Text style={[styles.sourceFieldName, { color: colors.text }]}>
            {mapping.sourceColumn}
          </Text>
          <Text style={[styles.fieldStats, { color: colors.gray400 }]}>
            {stats.nonNullCount} 筆資料 • {stats.type}
          </Text>
        </View>

        {/* 映射箭頭 */}
        <MaterialIcons 
          name="arrow-forward" 
          size={20} 
          color={isEnabled ? colors.primary : colors.gray300} 
        />

        {/* 目標欄位 */}
        <View style={styles.targetField}>
          <Text style={[styles.targetLabel, { color: colors.gray500 }]}>
            系統欄位
          </Text>
          
          {isEnabled ? (
            <>
              {mapping.isNew ? (
                // 新建欄位
                <View>
                  <TextInput
                    style={[styles.fieldInput, { 
                      color: colors.text,
                      borderColor: colors.gray200
                    }]}
                    value={mapping.customLabel || mapping.targetField}
                    onChangeText={(text) => updateMapping(index, { customLabel: text })}
                    placeholder="欄位名稱"
                    placeholderTextColor={colors.gray400}
                  />
                  <View style={[styles.newFieldBadge, { backgroundColor: colors.success + '20' }]}>
                    <MaterialIcons name="add-circle" size={12} color={colors.success} />
                    <Text style={[styles.newFieldText, { color: colors.success }]}>
                      新建欄位
                    </Text>
                  </View>
                </View>
              ) : (
                // 現有欄位
                <TouchableOpacity
                  style={[styles.existingFieldButton, { borderColor: colors.gray200 }]}
                  onPress={() => {
                    // TODO: 顯示欄位選擇器
                  }}
                >
                  <Text style={[styles.existingFieldName, { color: colors.text }]}>
                    {existingFields.find(f => f.key === mapping.targetField)?.label || mapping.targetField}
                  </Text>
                  <MaterialIcons name="arrow-drop-down" size={20} color={colors.gray500} />
                </TouchableOpacity>
              )}

              {/* 關聯設定按鈕 */}
              <TouchableOpacity
                style={[styles.relationButton, { borderColor: colors.primary }]}
                onPress={() => {
                  setSelectedMapping(mapping);
                  setShowRelationEditor(true);
                }}
              >
                <MaterialIcons name="link" size={16} color={colors.primary} />
                <Text style={[styles.relationButtonText, { color: colors.primary }]}>
                  設定關聯
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={[styles.disabledText, { color: colors.gray400 }]}>
              不匯入此欄位
            </Text>
          )}
        </View>
      </View>
    );
  };

  // 渲染關聯列表
  const renderRelations = () => {
    if (relations.length === 0) {
      return (
        <View style={styles.emptyRelations}>
          <MaterialIcons name="link-off" size={48} color={colors.gray300} />
          <Text style={[styles.emptyText, { color: colors.gray500 }]}>
            尚未設定跨資料庫關聯
          </Text>
          <Text style={[styles.emptyHint, { color: colors.gray400 }]}>
            點擊欄位的「設定關聯」按鈕來建立關聯
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.relationsList}>
        {relations.map((relation, index) => (
          <View 
            key={relation.id} 
            style={[styles.relationItem, { backgroundColor: colors.white }]}
          >
            <View style={styles.relationInfo}>
              <View style={styles.relationPath}>
                <Text style={[styles.relationDatabase, { color: colors.primary }]}>
                  {relation.sourceDatabase}
                </Text>
                <Text style={[styles.relationField, { color: colors.text }]}>
                  .{relation.sourceField}
                </Text>
              </View>
              
              <View style={styles.relationArrow}>
                {relation.bidirectional ? (
                  <MaterialIcons name="swap-horiz" size={20} color={colors.gray500} />
                ) : (
                  <MaterialIcons name="arrow-forward" size={20} color={colors.gray500} />
                )}
              </View>
              
              <View style={styles.relationPath}>
                <Text style={[styles.relationDatabase, { color: colors.primary }]}>
                  {relation.targetDatabase}
                </Text>
                <Text style={[styles.relationField, { color: colors.text }]}>
                  .{relation.targetField}
                </Text>
              </View>
            </View>
            
            <View style={styles.relationMeta}>
              <View style={[styles.relationTypeBadge, { backgroundColor: colors.gray100 }]}>
                <Text style={[styles.relationTypeText, { color: colors.gray600 }]}>
                  {relation.relationType}
                </Text>
              </View>
              
              {relation.bidirectional && (
                <View style={[styles.bidirectionalBadge, { backgroundColor: colors.success + '20' }]}>
                  <MaterialIcons name="sync" size={12} color={colors.success} />
                  <Text style={[styles.bidirectionalText, { color: colors.success }]}>
                    雙向
                  </Text>
                </View>
              )}
              
              <TouchableOpacity
                onPress={() => removeRelation(relation.id)}
                style={styles.removeRelationButton}
              >
                <MaterialIcons name="close" size={16} color={colors.gray500} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    );
  };

  // 切換區塊展開狀態
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 欄位映射區塊 */}
      <TouchableOpacity
        style={[styles.sectionHeader, { borderBottomColor: colors.gray200 }]}
        onPress={() => toggleSection('mapping')}
        activeOpacity={0.7}
      >
        <View style={styles.sectionTitle}>
          <MaterialIcons name="table-chart" size={20} color={colors.primary} />
          <Text style={[styles.sectionTitleText, { color: colors.text }]}>
            欄位映射設定
          </Text>
          <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.badgeText, { color: colors.primary }]}>
              {mappings.filter(m => m.targetField).length} / {mappings.length}
            </Text>
          </View>
        </View>
        <MaterialIcons 
          name={expandedSections.mapping ? 'expand-less' : 'expand-more'} 
          size={24} 
          color={colors.gray500} 
        />
      </TouchableOpacity>
      
      {expandedSections.mapping && (
        <View style={styles.sectionContent}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            mappings.map((mapping, index) => renderMappingItem(mapping, index))
          )}
        </View>
      )}

      {/* 關聯設定區塊 */}
      <TouchableOpacity
        style={[styles.sectionHeader, { borderBottomColor: colors.gray200 }]}
        onPress={() => toggleSection('relations')}
        activeOpacity={0.7}
      >
        <View style={styles.sectionTitle}>
          <MaterialIcons name="link" size={20} color={colors.primary} />
          <Text style={[styles.sectionTitleText, { color: colors.text }]}>
            跨資料庫關聯
          </Text>
          {relations.length > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.badgeText, { color: colors.primary }]}>
                {relations.length}
              </Text>
            </View>
          )}
        </View>
        <MaterialIcons 
          name={expandedSections.relations ? 'expand-less' : 'expand-more'} 
          size={24} 
          color={colors.gray500} 
        />
      </TouchableOpacity>
      
      {expandedSections.relations && (
        <View style={styles.sectionContent}>
          {renderRelations()}
        </View>
      )}

      {/* 匯入預覽區塊 */}
      <TouchableOpacity
        style={[styles.sectionHeader, { borderBottomColor: colors.gray200 }]}
        onPress={() => toggleSection('preview')}
        activeOpacity={0.7}
      >
        <View style={styles.sectionTitle}>
          <MaterialIcons name="preview" size={20} color={colors.primary} />
          <Text style={[styles.sectionTitleText, { color: colors.text }]}>
            匯入預覽
          </Text>
        </View>
        <MaterialIcons 
          name={expandedSections.preview ? 'expand-less' : 'expand-more'} 
          size={24} 
          color={colors.gray500} 
        />
      </TouchableOpacity>
      
      {expandedSections.preview && (
        <View style={styles.sectionContent}>
          <View style={[styles.previewCard, { backgroundColor: colors.gray50 }]}>
            <Text style={[styles.previewTitle, { color: colors.text }]}>
              匯入摘要
            </Text>
            <View style={styles.previewStats}>
              <View style={styles.previewStat}>
                <Text style={[styles.previewStatLabel, { color: colors.gray500 }]}>
                  目標資料庫
                </Text>
                <Text style={[styles.previewStatValue, { color: colors.text }]}>
                  {targetDatabase}
                </Text>
              </View>
              <View style={styles.previewStat}>
                <Text style={[styles.previewStatLabel, { color: colors.gray500 }]}>
                  總筆數
                </Text>
                <Text style={[styles.previewStatValue, { color: colors.text }]}>
                  {mergedTable.data.length}
                </Text>
              </View>
              <View style={styles.previewStat}>
                <Text style={[styles.previewStatLabel, { color: colors.gray500 }]}>
                  匯入欄位
                </Text>
                <Text style={[styles.previewStatValue, { color: colors.text }]}>
                  {mappings.filter(m => m.targetField).length}
                </Text>
              </View>
              <View style={styles.previewStat}>
                <Text style={[styles.previewStatLabel, { color: colors.gray500 }]}>
                  新建欄位
                </Text>
                <Text style={[styles.previewStatValue, { color: colors.text }]}>
                  {mappings.filter(m => m.isNew && m.targetField).length}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1
  },
  sectionTitleText: {
    fontSize: 16,
    fontWeight: '600'
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600'
  },
  sectionContent: {
    paddingVertical: 16
  },
  mappingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12
  },
  sourceField: {
    flex: 1
  },
  targetField: {
    flex: 1
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  sourceLabel: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase'
  },
  targetLabel: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    marginBottom: 8
  },
  sourceFieldName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2
  },
  fieldStats: {
    fontSize: 11
  },
  fieldInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14
  },
  newFieldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 6,
    alignSelf: 'flex-start'
  },
  newFieldText: {
    fontSize: 10,
    fontWeight: '600'
  },
  existingFieldButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6
  },
  existingFieldName: {
    fontSize: 14,
    flex: 1
  },
  disabledText: {
    fontSize: 14,
    fontStyle: 'italic'
  },
  relationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 8,
    alignSelf: 'flex-start'
  },
  relationButtonText: {
    fontSize: 12,
    fontWeight: '500'
  },
  emptyRelations: {
    alignItems: 'center',
    paddingVertical: 32
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12
  },
  emptyHint: {
    fontSize: 12,
    marginTop: 4
  },
  relationsList: {
    gap: 8
  },
  relationItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8
  },
  relationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  relationPath: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  relationDatabase: {
    fontSize: 12,
    fontWeight: '600'
  },
  relationField: {
    fontSize: 12
  },
  relationArrow: {
    marginHorizontal: 8
  },
  relationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  relationTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  relationTypeText: {
    fontSize: 10
  },
  bidirectionalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  bidirectionalText: {
    fontSize: 10,
    fontWeight: '500'
  },
  removeRelationButton: {
    padding: 4,
    marginLeft: 'auto'
  },
  previewCard: {
    padding: 16,
    borderRadius: 8
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12
  },
  previewStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16
  },
  previewStat: {
    minWidth: 80
  },
  previewStatLabel: {
    fontSize: 10,
    marginBottom: 2
  },
  previewStatValue: {
    fontSize: 16,
    fontWeight: '600'
  }
});

export default FieldMapper;