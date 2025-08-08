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
  ActivityIndicator,
  Platform,
  Modal,
  Pressable
} from 'react-native';
import { MaterialIcon } from '@/components/common/MaterialIcon';
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
import RelationshipVisualizer from '../RelationshipVisualizer';

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
  const [showFieldSelector, setShowFieldSelector] = useState(false);
  const [currentMappingIndex, setCurrentMappingIndex] = useState<number>(-1);

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

  // 偵錯用：監聽狀態變化
  useEffect(() => {
    console.log('🔄 showFieldSelector 狀態變更:', showFieldSelector);
    console.log('🔄 currentMappingIndex:', currentMappingIndex);
  }, [showFieldSelector, currentMappingIndex]);

  useEffect(() => {
    console.log('🔄 showRelationEditor 狀態變更:', showRelationEditor);
    console.log('🔄 selectedMapping:', selectedMapping);
  }, [showRelationEditor, selectedMapping]);

  const loadExistingFields = async () => {
    setLoading(true);
    try {
      const fields = await getFieldDefinitions(targetDatabase, organizationId);
      
      // 對於 users 類型，如果沒有自訂欄位，使用預設欄位
      if (targetDatabase === 'users' && (!fields || fields.length === 0)) {
        console.log('⚠️ 用戶類型無自訂欄位，使用預設欄位定義');
        const defaultFields = getDefaultFields('users');
        setExistingFields(defaultFields);
        console.log('✅ 使用預設用戶欄位:', defaultFields.length);
      } else {
        setExistingFields(fields);
        console.log('✅ 成功載入欄位定義:', fields.length);
      }
    } catch (error: any) {
      console.error('❌ 載入欄位定義失敗:', error);
      
      // 如果是權限錯誤或任何錯誤，使用預設欄位
      if (error?.message?.includes('permission') || targetDatabase === 'users') {
        console.log('⚠️ 使用預設欄位定義');
        const defaultFields = getDefaultFields(targetDatabase);
        setExistingFields(defaultFields);
      } else {
        showErrorToast('載入欄位定義失敗');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadExistingRelations = async () => {
    try {
      const relations = await getFieldRelations(organizationId, targetDatabase);
      setExistingRelations(relations);
      console.log('✅ 成功載入欄位關聯:', relations.length);
    } catch (error: any) {
      console.error('❌ 取得欄位關聯失敗:', error);
      
      // 如果是權限錯誤，不顯示錯誤，直接使用空陣列
      if (error?.message?.includes('permission')) {
        console.log('⚠️ 權限不足，無法載入現有關聯');
        setExistingRelations([]);
      }
    }
  };

  // 取得預設欄位定義
  const getDefaultFields = (database: DatabaseType): FieldConfig[] => {
    const defaultFields: Record<DatabaseType, FieldConfig[]> = {
      customers: [
        { key: 'name', label: '客戶姓名', type: 'text' as FieldType, isRequired: true, isSystem: false },
        { key: 'phone', label: '電話', type: 'text' as FieldType, isRequired: false, isSystem: false },
        { key: 'email', label: '電子郵件', type: 'text' as FieldType, isRequired: false, isSystem: false },
        { key: 'company', label: '公司', type: 'text' as FieldType, isRequired: false, isSystem: false },
        { key: 'address', label: '地址', type: 'text' as FieldType, isRequired: false, isSystem: false },
        { key: 'notes', label: '備註', type: 'text' as FieldType, isRequired: false, isSystem: false },
        { key: 'customField1', label: '自訂欄位1', type: 'text' as FieldType, isRequired: false, isSystem: false },
        { key: 'customField2', label: '自訂欄位2', type: 'text' as FieldType, isRequired: false, isSystem: false },
        { key: 'customField3', label: '自訂欄位3', type: 'text' as FieldType, isRequired: false, isSystem: false }
      ],
      records: [
        { key: 'title', label: '標題', type: 'text' as FieldType, isRequired: true, isSystem: false },
        { key: 'content', label: '內容', type: 'text' as FieldType, isRequired: false, isSystem: false },
        { key: 'date', label: '日期', type: 'date' as FieldType, isRequired: false, isSystem: false },
        { key: 'amount', label: '金額', type: 'number' as FieldType, isRequired: false, isSystem: false },
        { key: 'status', label: '狀態', type: 'text' as FieldType, isRequired: false, isSystem: false }
      ],
      tasks: [
        { key: 'title', label: '任務名稱', type: 'text' as FieldType, isRequired: true, isSystem: false },
        { key: 'description', label: '描述', type: 'text' as FieldType, isRequired: false, isSystem: false },
        { key: 'dueDate', label: '到期日', type: 'date' as FieldType, isRequired: false, isSystem: false },
        { key: 'priority', label: '優先級', type: 'text' as FieldType, isRequired: false, isSystem: false },
        { key: 'status', label: '狀態', type: 'text' as FieldType, isRequired: false, isSystem: false }
      ],
      users: [
        { key: 'email', label: 'Email', type: 'text' as FieldType, isRequired: true, isSystem: false },
        { key: 'name', label: '姓名', type: 'text' as FieldType, isRequired: true, isSystem: false },
        { key: 'role', label: '角色', type: 'text' as FieldType, isRequired: true, isSystem: false },
        { key: 'department', label: '部門', type: 'text' as FieldType, isRequired: false, isSystem: false },
        { key: 'position', label: '職位', type: 'text' as FieldType, isRequired: false, isSystem: false },
        { key: 'phoneNumber', label: '電話', type: 'text' as FieldType, isRequired: false, isSystem: false },
        { key: 'isActive', label: '啟用狀態', type: 'boolean' as FieldType, isRequired: false, isSystem: false }
      ]
    };

    return defaultFields[database] || [];
  };

  // 初始化欄位映射
  const initializeMappings = () => {
    const initialMappings: FieldMapping[] = [];
    
    console.log('初始化欄位映射，現有欄位數:', existingFields.length);
    console.log('CSV 欄位:', mergedTable.headers);
    
    mergedTable.headers.forEach(header => {
      // 取得欄位統計資訊
      const stats = getFieldStatistics(mergedTable.data, header);
      
      // 嘗試自動匹配現有欄位
      const matchedField = existingFields.find(field => {
        const fieldLabel = field.label.toLowerCase();
        const fieldKey = field.key.toLowerCase();
        const headerLower = header.toLowerCase();
        
        // 完全匹配 label 或 key
        if (fieldLabel === headerLower || fieldKey === headerLower) return true;
        
        // 常見別名匹配（擴展匹配規則）
        const aliases: Record<string, string[]> = {
          'name': ['姓名', '客戶姓名', '名稱', '客戶名稱', 'customer_name', '客戶', '用戶姓名', '員工姓名'],
          'phone': ['電話', '手機', '聯絡電話', 'mobile', 'tel', '電話號碼', '聯絡方式'],
          'phoneNumber': ['電話', '手機', '聯絡電話', 'mobile', 'tel', '電話號碼', '聯絡方式'],
          'email': ['郵件', '電子郵件', 'mail', 'e-mail', '郵箱', 'email'],
          'company': ['公司', '公司名稱', '企業', 'organization', '單位'],
          'address': ['地址', '住址', '聯絡地址', '地點'],
          'title': ['標題', '主題', '任務名稱', '名稱'],
          'description': ['描述', '說明', '內容', '備註', '記錄'],
          'notes': ['備註', '筆記', '註記', '說明'],
          'role': ['角色', '權限', '身份', '職級', 'permission', 'level'],
          'department': ['部門', '部門名稱', 'dept', 'division', '單位'],
          'position': ['職位', '職稱', '崗位', 'title', 'job'],
          'customField1': ['負責業務', '業務', '業務員', '銷售', '銷售員'],
          'customField2': ['建議方案', '方案', '建議', '推薦'],
          'customField3': ['客戶等級', '等級', '級別', 'VIP']
        };
        
        for (const [key, values] of Object.entries(aliases)) {
          if (field.key === key) {
            // 檢查 header 是否包含任何別名
            if (values.some(v => headerLower.includes(v) || v.includes(headerLower))) {
              return true;
            }
          }
        }
        
        return false;
      });

      // 總是生成一個有效的 fieldKey
      let fieldKey = generateFieldKey(header);
      
      // 確保 fieldKey 不為空
      if (!fieldKey || fieldKey === '') {
        console.error(`無法生成欄位鍵值 for "${header}"`);
        fieldKey = 'field_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      }

      if (matchedField) {
        // 匹配到現有欄位 - 預設啟用
        console.log(`欄位 "${header}" 匹配到 "${matchedField.key}"`);
        initialMappings.push({
          sourceColumn: header,
          targetField: matchedField.key,  // 使用匹配的欄位
          isNew: false,
          customLabel: matchedField.label,
          fieldType: stats.type
        });
      } else {
        // 新建欄位 - 預設啟用所有欄位
        console.log(`欄位 "${header}" 將建立新欄位 "${fieldKey}"`);
        
        initialMappings.push({
          sourceColumn: header,
          targetField: fieldKey,  // 確保有值
          isNew: true,
          fieldType: stats.type,
          customLabel: header
        });
      }
    });

    console.log('初始化映射完成:', initialMappings);
    setMappings(initialMappings);
    onMappingsChanged(initialMappings);
  };

  // 生成欄位鍵值
  const generateFieldKey = (label: string): string => {
    // 處理中文欄位名稱
    const chineseToEnglish: Record<string, string> = {
      '負責業務': 'salesRep',
      '建議方案': 'suggestedPlan',
      '客戶名稱': 'customerName',
      '客戶姓名': 'customerName',
      '理財習慣': 'financialHabits',
      '婚姻狀況': 'maritalStatus',
      '負責業務': 'responsible',
      '銷售階段': 'salesStage',
      '客戶來源': 'customerSource',
      '性別': 'gender',
      '匯入時間': 'importTime',
      '名單等級': 'listGrade',
      '8/31講座': 'seminar0831',
      '已成交': 'completed',
      '建議方案': 'suggestion',
      '銷售階段': 'salesPhase',
      '名單等級': 'customerGrade'
    };
    
    // 檢查是否有對應的英文欄位名
    if (chineseToEnglish[label]) {
      return chineseToEnglish[label];
    }
    
    // 如果是純中文，生成有意義的自訂欄位名稱
    if (/^[\u4e00-\u9fa5\s]+$/.test(label)) {
      // 清理標籤，移除空格並截短
      const cleanLabel = label.replace(/\s+/g, '').substring(0, 10);
      return `customField_${cleanLabel}`;
    }
    
    // 處理英文或混合的欄位名
    const cleaned = label.replace(/[^\w\s\u4e00-\u9fa5]/g, '').trim();
    const words = cleaned.split(/[\s_]+/).filter(w => w.length > 0);
    
    if (words.length === 0) {
      return `customField_${Date.now()}`;
    }
    
    // 如果第一個字是中文，使用中文作為標識
    if (/^[\u4e00-\u9fa5]/.test(words[0])) {
      const cleanLabel = words.join('').replace(/\s+/g, '').substring(0, 10);
      return `customField_${cleanLabel}`;
    }
    
    // 轉換為 camelCase
    return words[0].toLowerCase() + 
           words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
  };

  // 更新單個映射
  const updateMapping = (index: number, updates: Partial<FieldMapping>) => {
    console.log(`更新映射 [${index}]:`, updates);
    const newMappings = [...mappings];
    newMappings[index] = { ...newMappings[index], ...updates };
    console.log('更新後的映射:', newMappings[index]);
    setMappings(newMappings);
    onMappingsChanged(newMappings);
  };

  // 切換映射啟用狀態
  const toggleMappingEnabled = (index: number) => {
    const mapping = mappings[index];
    console.log('切換映射狀態:', mapping.sourceColumn, '當前 targetField:', mapping.targetField);
    
    if (!mapping.targetField || mapping.targetField === '') {
      // 如果當前是禁用狀態，恢復為啟用
      const stats = getFieldStatistics(mergedTable.data, mapping.sourceColumn);
      let fieldKey = generateFieldKey(mapping.sourceColumn);
      
      // 確保 fieldKey 有效
      if (!fieldKey || fieldKey === '') {
        console.error(`generateFieldKey 返回空值 for "${mapping.sourceColumn}"`);
        fieldKey = 'field_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      }
      
      console.log('生成的 fieldKey:', fieldKey);
      
      // 嘗試找到匹配的現有欄位
      const matchedField = existingFields.find(field => {
        const fieldLabel = field.label.toLowerCase();
        const headerLower = mapping.sourceColumn.toLowerCase();
        return fieldLabel === headerLower || field.key === fieldKey;
      });
      
      if (matchedField) {
        // 使用現有欄位
        console.log('啟用映射 - 使用現有欄位:', matchedField.key);
        updateMapping(index, {
          targetField: matchedField.key,
          isNew: false,
          customLabel: matchedField.label,
          fieldType: stats.type
        });
      } else {
        // 建立新欄位
        console.log('啟用映射 - 建立新欄位:', fieldKey);
        updateMapping(index, {
          targetField: fieldKey,
          isNew: true,
          fieldType: stats.type,
          customLabel: mapping.sourceColumn
        });
      }
    } else {
      // 禁用映射
      console.log('禁用映射');
      updateMapping(index, {
        targetField: '',
        isNew: false,
        fieldType: undefined,
        customLabel: undefined
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
            <TouchableOpacity
              onPress={() => toggleMappingEnabled(index)}
              style={[
                {
                  width: 48,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: isEnabled ? '#4F46E5' : '#E5E7EB',
                  borderWidth: 1,
                  borderColor: isEnabled ? '#4F46E5' : '#D1D5DB',
                  justifyContent: 'center',
                  padding: 2,
                  position: 'relative'
                }
              ]}
            >
              <View
                style={[
                  {
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: '#FFFFFF',
                    position: 'absolute',
                    transform: [{ translateX: isEnabled ? 22 : 2 }],
                    top: 2,
                    elevation: 2,
                    shadowColor: '#000000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.15,
                    shadowRadius: 2
                  }
                ]}
              />
            </TouchableOpacity>
          </View>
          <Text style={[styles.sourceFieldName, { color: colors.text }]}>
            {mapping.sourceColumn}
          </Text>
          <Text style={[styles.fieldStats, { color: colors.gray400 }]}>
            {stats.nonNullCount} 筆資料 • {stats.type}
          </Text>
        </View>

        {/* 映射箭頭 */}
        <MaterialIcon 
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
                    <MaterialIcon name="add-circle" size={12} color={colors.success} />
                    <Text style={[styles.newFieldText, { color: colors.success }]}>
                      新建欄位
                    </Text>
                  </View>
                </View>
              ) : (
                // 現有欄位 - 使用 Pressable for better Web compatibility
                Platform.OS === 'web' ? (
                  <Pressable
                    style={({ pressed }) => [
                      styles.existingFieldButton, 
                      { 
                        borderColor: colors.gray200,
                        backgroundColor: pressed ? colors.gray50 : 'transparent',
                        opacity: pressed ? 0.8 : 1
                      }
                    ]}
                    onPress={() => {
                      console.log('🔍 [Pressable] 打開欄位選擇器 for mapping:', index);
                      console.log('Current mapping:', mapping);
                      console.log('Setting showFieldSelector to true');
                      setCurrentMappingIndex(index);
                      setShowFieldSelector(true);
                    }}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.existingFieldName, { color: colors.text }]}>
                      {existingFields.find(f => f.key === mapping.targetField)?.label || mapping.targetField}
                    </Text>
                    <MaterialIcon name="arrow-drop-down" size={20} color={colors.gray500} />
                  </Pressable>
                ) : (
                  <TouchableOpacity
                    style={[styles.existingFieldButton, { borderColor: colors.gray200 }]}
                    onPress={() => {
                      console.log('🔍 打開欄位選擇器 for mapping:', index);
                      console.log('Current mapping:', mapping);
                      console.log('Setting showFieldSelector to true');
                      setCurrentMappingIndex(index);
                      setShowFieldSelector(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.existingFieldName, { color: colors.text }]}>
                      {existingFields.find(f => f.key === mapping.targetField)?.label || mapping.targetField}
                    </Text>
                    <MaterialIcon name="arrow-drop-down" size={20} color={colors.gray500} />
                  </TouchableOpacity>
                )
              )}

              {/* 關聯設定按鈕 */}
              {Platform.OS === 'web' ? (
                <Pressable
                  style={({ pressed }) => [
                    styles.relationButton, 
                    { 
                      borderColor: colors.primary,
                      backgroundColor: pressed ? colors.primary + '10' : 'transparent',
                      opacity: pressed ? 0.8 : 1
                    }
                  ]}
                  onPress={() => {
                    setSelectedMapping(mapping);
                    setShowRelationEditor(true);
                    // 暫時顯示提示，因為關聯編輯器尚未實作
                    showSuccessToast('關聯設定功能開發中');
                  }}
                  accessibilityRole="button"
                >
                  <MaterialIcon name="link" size={16} color={colors.primary} />
                  <Text style={[styles.relationButtonText, { color: colors.primary }]}>
                    設定關聯
                  </Text>
                </Pressable>
              ) : (
                <TouchableOpacity
                  style={[styles.relationButton, { borderColor: colors.primary }]}
                  onPress={() => {
                    setSelectedMapping(mapping);
                    setShowRelationEditor(true);
                    // 暫時顯示提示，因為關聯編輯器尚未實作
                    showSuccessToast('關聯設定功能開發中');
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialIcon name="link" size={16} color={colors.primary} />
                  <Text style={[styles.relationButtonText, { color: colors.primary }]}>
                    設定關聯
                  </Text>
                </TouchableOpacity>
              )}
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
          <MaterialIcon name="link-off" size={48} color={colors.gray300} />
          <Text style={[styles.emptyText, { color: colors.gray500 }]}>
            尚未設定跨資料庫關聯
          </Text>
          <Text style={[styles.emptyHint, { color: colors.gray400 }]}>
            點擊欄位的「設定關聯」按鈕來建立關聯
          </Text>
        </View>
      );
    }

    // 收集來源和目標欄位
    const sourceFields = [...new Set(relations.map(r => r.sourceField))];
    const targetFields = [...new Set(relations.map(r => r.targetField))];
    const databases = {
      source: relations[0]?.sourceDatabase || targetDatabase,
      target: relations[0]?.targetDatabase || targetDatabase
    };

    return (
      <View>
        {/* 視覺化關聯圖 */}
        <RelationshipVisualizer
          relations={relations}
          databases={databases}
          sourceFields={sourceFields}
          targetFields={targetFields}
          onRelationSelect={(relation) => {
            // 可以顯示詳細資訊或編輯
            showSuccessToast(`已選擇關聯: ${relation.sourceField} → ${relation.targetField}`);
          }}
          onRelationDelete={removeRelation}
          height={300}
        />
        
        {/* 關聯列表 */}
        <View style={styles.relationsList}>
          <Text style={[styles.relationsListTitle, { color: colors.text }]}>
            關聯詳情
          </Text>
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
                    <MaterialIcon name="swap-horiz" size={20} color={colors.gray500} />
                  ) : (
                    <MaterialIcon name="arrow-forward" size={20} color={colors.gray500} />
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
                    <MaterialIcon name="sync" size={12} color={colors.success} />
                    <Text style={[styles.bidirectionalText, { color: colors.success }]}>
                      雙向
                    </Text>
                  </View>
                )}
                
                <TouchableOpacity
                  onPress={() => removeRelation(relation.id)}
                  style={styles.removeRelationButton}
                >
                  <MaterialIcon name="close" size={16} color={colors.gray500} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
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

  // 選擇欄位的函數
  const selectField = (fieldKey: string) => {
    if (currentMappingIndex >= 0) {
      console.log(`選擇欄位: ${fieldKey} for mapping ${currentMappingIndex}`);
      const existingField = existingFields.find(f => f.key === fieldKey);
      if (existingField) {
        updateMapping(currentMappingIndex, {
          targetField: fieldKey,
          isNew: false,
          customLabel: existingField.label
        });
        showSuccessToast(`已將「${mappings[currentMappingIndex].sourceColumn}」映射到「${existingField.label}」`);
      } else if (fieldKey === 'new_field') {
        // 建立新欄位
        const stats = getFieldStatistics(mergedTable.data, mappings[currentMappingIndex].sourceColumn);
        const newFieldKey = generateFieldKey(mappings[currentMappingIndex].sourceColumn);
        updateMapping(currentMappingIndex, {
          targetField: newFieldKey,
          isNew: true,
          fieldType: stats.type,
          customLabel: mappings[currentMappingIndex].sourceColumn
        });
        showSuccessToast(`已建立新欄位「${mappings[currentMappingIndex].sourceColumn}」`);
      }
    }
    setShowFieldSelector(false);
    setCurrentMappingIndex(-1);
  };

  // 調試訊息
  useEffect(() => {
    console.log('🔍 FieldMapper 收到的資料:', {
      targetDatabase,
      mergedTable: mergedTable ? {
        headers: mergedTable.headers,
        dataLength: mergedTable.data?.length,
        firstRow: mergedTable.data?.[0]
      } : null,
      existingFields: existingFields.length,
      mappings: mappings.length
    });
  }, [targetDatabase, mergedTable, existingFields, mappings]);

  // 如果沒有合併的資料表，顯示提示
  if (!mergedTable || !mergedTable.headers || mergedTable.headers.length === 0) {
    console.log('⚠️ FieldMapper: 沒有 mergedTable 資料');
    return (
      <View style={[styles.container, { padding: 20, alignItems: 'center', justifyContent: 'center' }]}>
        <MaterialIcon name="info-outline" size={48} color={colors.gray400} />
        <Text style={[styles.emptyText, { color: colors.gray600, marginTop: 16, textAlign: 'center' }]}>
          請先上傳並處理檔案
        </Text>
        <Text style={[styles.emptyDescription, { color: colors.gray500, marginTop: 8, textAlign: 'center' }]}>
          完成檔案上傳後，即可進行欄位映射設定
        </Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 欄位映射區塊 */}
      <TouchableOpacity
        style={[styles.sectionHeader, { borderBottomColor: colors.gray200 }]}
        onPress={() => toggleSection('mapping')}
        activeOpacity={0.7}
      >
        <View style={styles.sectionTitle}>
          <MaterialIcon name="table-chart" size={20} color={colors.primary} />
          <Text style={[styles.sectionTitleText, { color: colors.text }]}>
            欄位映射設定
          </Text>
          <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.badgeText, { color: colors.primary }]}>
              {mappings.filter(m => m.targetField).length} / {mappings.length}
            </Text>
          </View>
        </View>
        <MaterialIcon 
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
          <MaterialIcon name="link" size={20} color={colors.primary} />
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
        <MaterialIcon 
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
          <MaterialIcon name="preview" size={20} color={colors.primary} />
          <Text style={[styles.sectionTitleText, { color: colors.text }]}>
            匯入預覽
          </Text>
        </View>
        <MaterialIcon 
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
    
    {/* 欄位選擇器 Modal */}
    {Platform.OS === 'web' ? (
      // Web 平台使用絕對定位的 div 代替 Modal
      showFieldSelector && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.white }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                選擇系統欄位
              </Text>
              <TouchableOpacity
                onPress={() => {
                  console.log('關閉欄位選擇器');
                  setShowFieldSelector(false);
                }}
                style={styles.modalCloseButton}
                activeOpacity={0.7}
              >
                <MaterialIcon name="close" size={24} color={colors.gray500} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              {/* 現有欄位 */}
              <Text style={[styles.modalSectionTitle, { color: colors.text }]}>
                現有欄位
              </Text>
              {existingFields.map((field) => (
                <TouchableOpacity
                  key={field.key}
                  style={[
                    styles.fieldOption,
                    { 
                      backgroundColor: colors.gray50,
                      borderColor: colors.gray200,
                    }
                  ]}
                  onPress={() => {
                    console.log('選擇欄位:', field.key);
                    selectField(field.key);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.fieldOptionContent}>
                    <Text style={[styles.fieldOptionLabel, { color: colors.text }]}>
                      {field.label}
                    </Text>
                    <Text style={[styles.fieldOptionKey, { color: colors.gray500 }]}>
                      {field.key}
                    </Text>
                    <Text style={[styles.fieldOptionType, { color: colors.gray400 }]}>
                      {field.type}
                    </Text>
                  </View>
                  <MaterialIcon name="chevron-right" size={20} color={colors.gray400} />
                </TouchableOpacity>
              ))}
              
              {/* 建立新欄位 */}
              <Text style={[styles.modalSectionTitle, { color: colors.text, marginTop: 24 }]}>
                其他選項
              </Text>
              <TouchableOpacity
                style={[
                  styles.fieldOption,
                  { 
                    backgroundColor: colors.success + '10',
                    borderColor: colors.success + '40',
                  }
                ]}
                onPress={() => {
                  console.log('建立新欄位');
                  selectField('new_field');
                }}
                activeOpacity={0.7}
              >
                <View style={styles.fieldOptionContent}>
                  <Text style={[styles.fieldOptionLabel, { color: colors.success }]}>
                    建立新欄位
                  </Text>
                  <Text style={[styles.fieldOptionKey, { color: colors.success + 'CC' }]}>
                    使用原 CSV 欄位名稱
                  </Text>
                </View>
                <MaterialIcon name="add-circle" size={20} color={colors.success} />
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      )
    ) : (
      // Native 平台使用 Modal
      <Modal
        visible={showFieldSelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFieldSelector(false)}
      >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.white }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              選擇系統欄位
            </Text>
            <TouchableOpacity
              onPress={() => setShowFieldSelector(false)}
              style={styles.modalCloseButton}
            >
              <MaterialIcon name="close" size={24} color={colors.gray500} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody}>
            {/* 現有欄位 */}
            <Text style={[styles.modalSectionTitle, { color: colors.text }]}>
              現有欄位
            </Text>
            {existingFields.map((field) => (
              <TouchableOpacity
                key={field.key}
                style={[
                  styles.fieldOption,
                  { 
                    backgroundColor: colors.gray50,
                    borderColor: colors.gray200,
                  }
                ]}
                onPress={() => selectField(field.key)}
              >
                <View style={styles.fieldOptionContent}>
                  <Text style={[styles.fieldOptionLabel, { color: colors.text }]}>
                    {field.label}
                  </Text>
                  <Text style={[styles.fieldOptionKey, { color: colors.gray500 }]}>
                    {field.key}
                  </Text>
                  <Text style={[styles.fieldOptionType, { color: colors.gray400 }]}>
                    {field.type}
                  </Text>
                </View>
                <MaterialIcon name="chevron-right" size={20} color={colors.gray400} />
              </TouchableOpacity>
            ))}
            
            {/* 建立新欄位 */}
            <Text style={[styles.modalSectionTitle, { color: colors.text, marginTop: 24 }]}>
              其他選項
            </Text>
            <TouchableOpacity
              style={[
                styles.fieldOption,
                { 
                  backgroundColor: colors.success + '10',
                  borderColor: colors.success + '40',
                }
              ]}
              onPress={() => selectField('new_field')}
            >
              <View style={styles.fieldOptionContent}>
                <Text style={[styles.fieldOptionLabel, { color: colors.success }]}>
                  建立新欄位
                </Text>
                <Text style={[styles.fieldOptionKey, { color: colors.success + 'CC' }]}>
                  使用原 CSV 欄位名稱
                </Text>
              </View>
              <MaterialIcon name="add-circle" size={20} color={colors.success} />
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
    )}
    </>
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
  toggleButton: {
    width: 48,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    padding: 2
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    position: 'absolute',
    left: 3,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2
  },
  existingFieldButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'background-color 0.2s'
      }
    })
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
    alignSelf: 'flex-start',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'background-color 0.2s'
      }
    })
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
  relationsListTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    ...Platform.select({
      web: {
        position: 'fixed' as any,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999
      }
    })
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 12,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600'
  },
  modalCloseButton: {
    padding: 4
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    maxHeight: 400
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12
  },
  fieldOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    marginBottom: 1
  },
  fieldOptionType: {
    fontSize: 10,
    textTransform: 'uppercase'
  }
});

export default FieldMapper;