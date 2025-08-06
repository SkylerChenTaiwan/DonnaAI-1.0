/**
 * 欄位映射配置 Modal
 * 讓用戶可以指定 CSV 欄位與系統欄位的對應關係
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Icon } from '@/components/common/Icon';
import { DesignSystem } from '@/theme/designSystem';
import { parseImportFile } from '@/services/firebase/admin/dataImportService';

export interface FieldMapping {
  fileIndex: number;
  fileName: string;
  fileType: 'users' | 'customers' | 'records' | 'hierarchy' | 'unknown';
  mappings: {
    [systemField: string]: string; // 系統欄位 -> CSV 欄位
  };
  keyField?: string; // 此檔案的關鍵欄位（用於關聯）
}

export interface RelationMapping {
  sourceFile: number;
  sourceField: string;
  targetFile: number;
  targetField: string;
  description: string;
}

interface Props {
  visible: boolean;
  files: Array<{ uri: string; name: string; mimeType?: string }>;
  onConfirm: (fieldMappings: FieldMapping[], relations: RelationMapping[]) => void;
  onCancel: () => void;
}

export const FieldMappingModal: React.FC<Props> = ({
  visible,
  files,
  onConfirm,
  onCancel,
}) => {
  const [loading, setLoading] = useState(true);
  const [fileHeaders, setFileHeaders] = useState<Array<{ fileName: string; headers: string[] }>>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [relationMappings, setRelationMappings] = useState<RelationMapping[]>([]);
  const [activeTab, setActiveTab] = useState(0);

  // 系統欄位定義
  const systemFields = {
    users: {
      name: '姓名',
      email: '電子郵件',
      phone: '電話',
      department: '部門',
      jobTitle: '職稱',
      supervisor: '主管',
      userCode: '員工代碼', // 關鍵欄位
    },
    customers: {
      name: '客戶姓名',
      company: '公司',
      phone: '電話',
      email: '電子郵件',
      jobTitle: '職稱',
      salesperson: '負責業務員', // 需要關聯
      tags: '標籤',
      notes: '備註',
      customerCode: '客戶代碼', // 關鍵欄位
    },
    records: {
      date: '日期',
      customer: '客戶', // 需要關聯
      salesperson: '業務員', // 需要關聯
      type: '類型',
      content: '內容',
      followUp: '跟進日期',
    },
    hierarchy: {
      code: '代碼',
      name: '姓名',
      level: '層級',
      parentCode: '上級代碼',
      team: '團隊',
    },
  };

  // 分析檔案並初始化映射
  useEffect(() => {
    if (!visible || files.length === 0) return;

    const analyzeFiles = async () => {
      setLoading(true);
      const headers: Array<{ fileName: string; headers: string[] }> = [];
      const mappings: FieldMapping[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          // 解析檔案取得欄位
          const data = await parseImportFile(file.uri, file.mimeType || 'text/csv');
          if (data.length > 0) {
            const fileHeaders = Object.keys(data[0]);
            headers.push({ fileName: file.name, headers: fileHeaders });

            // 自動判斷檔案類型
            const fileType = detectFileType(fileHeaders, file.name);
            
            // 自動映射欄位
            const autoMapping = createAutoMapping(fileHeaders, fileType);
            
            mappings.push({
              fileIndex: i,
              fileName: file.name,
              fileType,
              mappings: autoMapping,
              keyField: findKeyField(fileHeaders, fileType),
            });
          }
        } catch (error) {
          console.error(`無法解析檔案 ${file.name}:`, error);
        }
      }

      setFileHeaders(headers);
      setFieldMappings(mappings);

      // 自動建立關聯
      const autoRelations = createAutoRelations(mappings);
      setRelationMappings(autoRelations);

      setLoading(false);
    };

    analyzeFiles();
  }, [visible, files]);

  // 自動判斷檔案類型
  const detectFileType = (headers: string[], fileName: string): FieldMapping['fileType'] => {
    const lowerHeaders = headers.map(h => h.toLowerCase());
    const lowerName = fileName.toLowerCase();

    if (lowerName.includes('業務') || lowerName.includes('員工') || 
        lowerHeaders.some(h => h.includes('員工') || h.includes('職稱'))) {
      return 'users';
    }
    if (lowerName.includes('客戶') || lowerName.includes('customer') ||
        lowerHeaders.some(h => h.includes('客戶') || h.includes('公司'))) {
      return 'customers';
    }
    if (lowerName.includes('訪談') || lowerName.includes('紀錄') ||
        lowerHeaders.some(h => h.includes('訪談') || h.includes('紀錄'))) {
      return 'records';
    }
    if (lowerName.includes('層級') || lowerName.includes('hierarchy') ||
        lowerHeaders.some(h => h.includes('層級') || h.includes('上級'))) {
      return 'hierarchy';
    }
    
    return 'unknown';
  };

  // 自動映射欄位
  const createAutoMapping = (headers: string[], fileType: FieldMapping['fileType']): { [key: string]: string } => {
    if (fileType === 'unknown') return {};

    const mapping: { [key: string]: string } = {};
    const fields = systemFields[fileType as keyof typeof systemFields];
    
    if (!fields) return mapping;

    // 對每個系統欄位，嘗試找到最匹配的 CSV 欄位
    Object.keys(fields).forEach(systemField => {
      const fieldName = fields[systemField as keyof typeof fields];
      const matchedHeader = findBestMatch(headers, fieldName);
      if (matchedHeader) {
        mapping[systemField] = matchedHeader;
      }
    });

    return mapping;
  };

  // 尋找最佳匹配的欄位
  const findBestMatch = (headers: string[], target: string): string | null => {
    const lowerTarget = target.toLowerCase();
    
    // 完全匹配
    const exact = headers.find(h => h.toLowerCase() === lowerTarget);
    if (exact) return exact;
    
    // 包含匹配
    const contains = headers.find(h => h.toLowerCase().includes(lowerTarget) || lowerTarget.includes(h.toLowerCase()));
    if (contains) return contains;
    
    // 部分匹配
    const partial = headers.find(h => {
      const lowerH = h.toLowerCase();
      return target.split('').some(char => lowerH.includes(char.toLowerCase()));
    });
    if (partial) return partial;
    
    return null;
  };

  // 尋找關鍵欄位（用於關聯）
  const findKeyField = (headers: string[], fileType: FieldMapping['fileType']): string | undefined => {
    // 優先尋找代碼、編號、ID 等唯一識別欄位
    const keyPatterns = ['代碼', '編號', 'code', 'id', 'number', '工號', '客編'];
    
    for (const pattern of keyPatterns) {
      const found = headers.find(h => h.toLowerCase().includes(pattern));
      if (found) return found;
    }
    
    // 次選：姓名欄位
    const nameField = headers.find(h => h.includes('姓名') || h.includes('name'));
    if (nameField) return nameField;
    
    // 預設第一個欄位
    return headers[0];
  };

  // 自動建立關聯
  const createAutoRelations = (mappings: FieldMapping[]): RelationMapping[] => {
    const relations: RelationMapping[] = [];
    
    // 找出各類型檔案的索引
    const userFileIndex = mappings.findIndex(m => m.fileType === 'users');
    const customerFileIndex = mappings.findIndex(m => m.fileType === 'customers');
    const recordFileIndex = mappings.findIndex(m => m.fileType === 'records');
    const hierarchyFileIndex = mappings.findIndex(m => m.fileType === 'hierarchy');
    
    // 客戶 -> 業務員 關聯
    if (customerFileIndex >= 0 && userFileIndex >= 0) {
      const customerMapping = mappings[customerFileIndex];
      const userMapping = mappings[userFileIndex];
      
      if (customerMapping.mappings.salesperson && userMapping.keyField) {
        relations.push({
          sourceFile: customerFileIndex,
          sourceField: customerMapping.mappings.salesperson,
          targetFile: userFileIndex,
          targetField: userMapping.keyField,
          description: '客戶的負責業務員',
        });
      }
    }
    
    // 訪談紀錄 -> 客戶 關聯
    if (recordFileIndex >= 0 && customerFileIndex >= 0) {
      const recordMapping = mappings[recordFileIndex];
      const customerMapping = mappings[customerFileIndex];
      
      if (recordMapping.mappings.customer && customerMapping.keyField) {
        relations.push({
          sourceFile: recordFileIndex,
          sourceField: recordMapping.mappings.customer,
          targetFile: customerFileIndex,
          targetField: customerMapping.keyField,
          description: '訪談紀錄的客戶',
        });
      }
    }
    
    // 訪談紀錄 -> 業務員 關聯
    if (recordFileIndex >= 0 && userFileIndex >= 0) {
      const recordMapping = mappings[recordFileIndex];
      const userMapping = mappings[userFileIndex];
      
      if (recordMapping.mappings.salesperson && userMapping.keyField) {
        relations.push({
          sourceFile: recordFileIndex,
          sourceField: recordMapping.mappings.salesperson,
          targetFile: userFileIndex,
          targetField: userMapping.keyField,
          description: '訪談紀錄的業務員',
        });
      }
    }
    
    // 層級 -> 上級 關聯
    if (hierarchyFileIndex >= 0) {
      const hierarchyMapping = mappings[hierarchyFileIndex];
      
      if (hierarchyMapping.mappings.parentCode && hierarchyMapping.mappings.code) {
        relations.push({
          sourceFile: hierarchyFileIndex,
          sourceField: hierarchyMapping.mappings.parentCode,
          targetFile: hierarchyFileIndex,
          targetField: hierarchyMapping.mappings.code,
          description: '層級結構的上下級關係',
        });
      }
    }
    
    return relations;
  };

  // 更新欄位映射
  const updateFieldMapping = (fileIndex: number, systemField: string, csvField: string) => {
    setFieldMappings(prev => {
      const newMappings = [...prev];
      newMappings[fileIndex].mappings[systemField] = csvField;
      return newMappings;
    });
  };

  // 更新關鍵欄位
  const updateKeyField = (fileIndex: number, keyField: string) => {
    setFieldMappings(prev => {
      const newMappings = [...prev];
      newMappings[fileIndex].keyField = keyField;
      return newMappings;
    });
  };

  // 新增關聯
  const addRelation = () => {
    setRelationMappings(prev => [...prev, {
      sourceFile: 0,
      sourceField: '',
      targetFile: 0,
      targetField: '',
      description: '',
    }]);
  };

  // 更新關聯
  const updateRelation = (index: number, field: keyof RelationMapping, value: any) => {
    setRelationMappings(prev => {
      const newRelations = [...prev];
      newRelations[index] = { ...newRelations[index], [field]: value };
      return newRelations;
    });
  };

  // 刪除關聯
  const removeRelation = (index: number) => {
    setRelationMappings(prev => prev.filter((_, i) => i !== index));
  };

  // 渲染欄位映射表
  const renderFieldMapping = (mapping: FieldMapping, index: number) => {
    const headers = fileHeaders[index]?.headers || [];
    const fields = systemFields[mapping.fileType as keyof typeof systemFields] || {};
    
    return (
      <View key={index} style={styles.fileSection}>
        <Text style={styles.fileName}>{mapping.fileName}</Text>
        <Text style={styles.fileType}>類型: {mapping.fileType}</Text>
        
        {/* 關鍵欄位選擇 */}
        <View style={styles.mappingRow}>
          <Text style={styles.labelText}>關鍵欄位 (用於關聯):</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={mapping.keyField}
              onValueChange={(value) => updateKeyField(index, value)}
              style={styles.picker}
            >
              <Picker.Item label="選擇欄位" value="" />
              {headers.map(header => (
                <Picker.Item key={header} label={header} value={header} />
              ))}
            </Picker>
          </View>
        </View>
        
        {/* 欄位映射 */}
        {Object.entries(fields).map(([systemField, fieldLabel]) => (
          <View key={systemField} style={styles.mappingRow}>
            <Text style={styles.labelText}>{fieldLabel}:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={mapping.mappings[systemField] || ''}
                onValueChange={(value) => updateFieldMapping(index, systemField, value)}
                style={styles.picker}
              >
                <Picker.Item label="不映射" value="" />
                {headers.map(header => (
                  <Picker.Item key={header} label={header} value={header} />
                ))}
              </Picker>
            </View>
          </View>
        ))}
      </View>
    );
  };

  // 渲染關聯設定
  const renderRelations = () => {
    return (
      <View style={styles.relationsSection}>
        <View style={styles.relationsHeader}>
          <Text style={styles.sectionTitle}>資料關聯設定</Text>
          <TouchableOpacity onPress={addRelation} style={styles.addButton}>
            <Icon name="add-circle-outline" size={24} color={DesignSystem.colors.primary} />
            <Text style={styles.addButtonText}>新增關聯</Text>
          </TouchableOpacity>
        </View>
        
        {relationMappings.map((relation, index) => (
          <View key={index} style={styles.relationCard}>
            <View style={styles.relationHeader}>
              <Text style={styles.relationTitle}>關聯 {index + 1}</Text>
              <TouchableOpacity onPress={() => removeRelation(index)}>
                <Icon name="close-circle-outline" size={20} color={DesignSystem.colors.error} />
              </TouchableOpacity>
            </View>
            
            {/* 來源檔案和欄位 */}
            <View style={styles.relationRow}>
              <Text style={styles.relationLabel}>來源:</Text>
              <View style={styles.relationPickers}>
                <Picker
                  selectedValue={relation.sourceFile}
                  onValueChange={(value) => updateRelation(index, 'sourceFile', value)}
                  style={[styles.picker, styles.halfPicker]}
                >
                  {fieldMappings.map((m, i) => (
                    <Picker.Item key={i} label={m.fileName} value={i} />
                  ))}
                </Picker>
                <Picker
                  selectedValue={relation.sourceField}
                  onValueChange={(value) => updateRelation(index, 'sourceField', value)}
                  style={[styles.picker, styles.halfPicker]}
                >
                  <Picker.Item label="選擇欄位" value="" />
                  {fileHeaders[relation.sourceFile]?.headers.map(h => (
                    <Picker.Item key={h} label={h} value={h} />
                  ))}
                </Picker>
              </View>
            </View>
            
            {/* 目標檔案和欄位 */}
            <View style={styles.relationRow}>
              <Text style={styles.relationLabel}>目標:</Text>
              <View style={styles.relationPickers}>
                <Picker
                  selectedValue={relation.targetFile}
                  onValueChange={(value) => updateRelation(index, 'targetFile', value)}
                  style={[styles.picker, styles.halfPicker]}
                >
                  {fieldMappings.map((m, i) => (
                    <Picker.Item key={i} label={m.fileName} value={i} />
                  ))}
                </Picker>
                <Picker
                  selectedValue={relation.targetField}
                  onValueChange={(value) => updateRelation(index, 'targetField', value)}
                  style={[styles.picker, styles.halfPicker]}
                >
                  <Picker.Item label="選擇欄位" value="" />
                  {fileHeaders[relation.targetFile]?.headers.map(h => (
                    <Picker.Item key={h} label={h} value={h} />
                  ))}
                </Picker>
              </View>
            </View>
            
            {/* 描述 */}
            <TextInput
              style={styles.descriptionInput}
              placeholder="關聯描述（選填）"
              value={relation.description}
              onChangeText={(text) => updateRelation(index, 'description', text)}
            />
          </View>
        ))}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onCancel}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel}>
            <Icon name="close" size={24} color={DesignSystem.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>欄位映射設定</Text>
          <TouchableOpacity onPress={() => onConfirm(fieldMappings, relationMappings)}>
            <Text style={styles.confirmText}>確認</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={DesignSystem.colors.primary} />
            <Text style={styles.loadingText}>分析檔案中...</Text>
          </View>
        ) : (
          <>
            {/* Tabs */}
            <View style={styles.tabs}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 0 && styles.activeTab]}
                onPress={() => setActiveTab(0)}
              >
                <Text style={[styles.tabText, activeTab === 0 && styles.activeTabText]}>
                  欄位映射
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 1 && styles.activeTab]}
                onPress={() => setActiveTab(1)}
              >
                <Text style={[styles.tabText, activeTab === 1 && styles.activeTabText]}>
                  資料關聯
                </Text>
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView style={styles.content}>
              {activeTab === 0 ? (
                fieldMappings.map((mapping, index) => renderFieldMapping(mapping, index))
              ) : (
                renderRelations()
              )}
            </ScrollView>
          </>
        )}
      </View>
    </Modal>
  );
};

// 補充 TextInput import
import { TextInput } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: DesignSystem.spacing.lg,
    backgroundColor: DesignSystem.colors.background.surface,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light,
  },
  title: {
    ...DesignSystem.typography.h2,
    color: DesignSystem.colors.text.primary,
  },
  confirmText: {
    ...DesignSystem.typography.button,
    color: DesignSystem.colors.primary,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: DesignSystem.colors.background.surface,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light,
  },
  tab: {
    flex: 1,
    paddingVertical: DesignSystem.spacing.md,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: DesignSystem.colors.primary,
  },
  tabText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.secondary,
  },
  activeTabText: {
    color: DesignSystem.colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: DesignSystem.spacing.lg,
  },
  fileSection: {
    backgroundColor: DesignSystem.colors.background.surface,
    padding: DesignSystem.spacing.lg,
    marginBottom: DesignSystem.spacing.md,
    borderRadius: 12,
  },
  fileName: {
    ...DesignSystem.typography.h3,
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.xs,
  },
  fileType: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    marginBottom: DesignSystem.spacing.md,
  },
  mappingRow: {
    marginBottom: DesignSystem.spacing.md,
  },
  labelText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.xs,
  },
  pickerContainer: {
    backgroundColor: DesignSystem.colors.background.elevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.light,
  },
  picker: {
    height: 44,
  },
  halfPicker: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.secondary,
    marginTop: DesignSystem.spacing.md,
  },
  relationsSection: {
    paddingBottom: DesignSystem.spacing.xl,
  },
  relationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.lg,
  },
  sectionTitle: {
    ...DesignSystem.typography.h3,
    color: DesignSystem.colors.text.primary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSystem.spacing.xs,
  },
  addButtonText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.primary,
  },
  relationCard: {
    backgroundColor: DesignSystem.colors.background.surface,
    padding: DesignSystem.spacing.lg,
    marginBottom: DesignSystem.spacing.md,
    borderRadius: 12,
  },
  relationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.md,
  },
  relationTitle: {
    ...DesignSystem.typography.h4,
    color: DesignSystem.colors.text.primary,
  },
  relationRow: {
    marginBottom: DesignSystem.spacing.md,
  },
  relationLabel: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    marginBottom: DesignSystem.spacing.xs,
  },
  relationPickers: {
    flexDirection: 'row',
    gap: DesignSystem.spacing.sm,
  },
  descriptionInput: {
    backgroundColor: DesignSystem.colors.background.elevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.light,
    padding: DesignSystem.spacing.sm,
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary,
  },
});