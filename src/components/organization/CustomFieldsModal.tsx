/**
 * 自訂欄位管理 Modal
 * 顯示和管理組織的動態欄位配置
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  AdaptiveModal,
  AdaptiveButton,
  AdaptiveText,
  AdaptiveView,
  AdaptiveInput,
} from '@/components/adaptive';
import {
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Icon } from '@/components/common/Icon';
import { DesignSystem } from '@/theme/designSystem';
import { withAlpha } from '@/utils/colorUtils';
import { toast } from '@/utils/toast';

// 動態欄位元件
import { DynamicFieldList } from '@/components/dynamic-fields/DynamicFieldList';
import { FieldConfigurator } from '@/components/dynamic-fields/FieldConfigurator';
import { FileUploader } from '@/components/dynamic-fields/FileUploader';

// 服務和類型
import { DynamicFieldService } from '@/services/dynamic-fields/DynamicFieldService';
import { CSVAnalysisService } from '@/services/dynamic-fields/CSVAnalysisService';
import { 
  DynamicFieldConfig,
  FieldDataType,
  CSVAnalysisResult 
} from '@/types/dynamic-field-mapping';
import { Organization } from '@/types/entities';

interface CustomFieldsModalProps {
  visible: boolean;
  organization: Organization;
  onClose: () => void;
  onFieldsUpdated?: () => void;
}

export const CustomFieldsModal: React.FC<CustomFieldsModalProps> = ({
  visible,
  organization,
  onClose,
  onFieldsUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'view' | 'import' | 'configure'>('view');
  const [fields, setFields] = useState<DynamicFieldConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedField, setSelectedField] = useState<DynamicFieldConfig | null>(null);
  const [showFieldEditor, setShowFieldEditor] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 服務實例
  const fieldService = new DynamicFieldService();
  const csvService = new CSVAnalysisService();

  // 載入欄位
  useEffect(() => {
    if (visible) {
      loadFields();
    }
  }, [visible, organization.id]);

  const loadFields = async () => {
    try {
      setIsLoading(true);
      const loadedFields = await fieldService.searchFields({
        organizationId: organization.id,
        isActive: true,
      });
      setFields(loadedFields);
    } catch (error) {
      console.error('載入欄位失敗:', error);
      toast.error('載入欄位配置失敗');
    } finally {
      setIsLoading(false);
    }
  };

  // 處理檔案上傳
  const handleFileUpload = async (file: File) => {
    try {
      setIsLoading(true);
      
      // 分析 CSV 檔案
      const analysisResult: CSVAnalysisResult = await csvService.analyzeFile(file);
      
      // 根據分析結果建立欄位配置
      const newFields: DynamicFieldConfig[] = analysisResult.columns.map(col => ({
        fieldId: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        organizationId: organization.id,
        entityType: 'customers', // 預設為客戶資料
        originalName: col.name,
        fieldKey: col.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        displayName: col.name,
        dataType: col.inferredType as FieldDataType,
        isActive: true,
        isSystem: false,
        isRequired: false,
        isUnique: false,
        isIndexed: false,
        isSearchable: true,
        isSortable: true,
        defaultValue: null,
        validationRules: [],
        formatting: {},
        security: {
          level: 'public',
          readRoles: [],
          writeRoles: [],
          encrypted: false,
          auditLog: false,
          isPII: col.confidence && col.confidence.isPII > 0.7,
        },
        usage: {
          usageCount: 0,
          nullRatio: col.statistics?.nullRatio || 0,
          uniqueValueCount: col.statistics?.uniqueValueCount || 0,
        },
        metadata: {
          createdBy: 'system',
          createdAt: new Date(),
          updatedBy: 'system',
          updatedAt: new Date(),
          source: 'csv_import',
          originalFile: file.name,
        },
      }));

      // 批次建立欄位
      await fieldService.batchCreateFields(newFields, organization.id);
      
      toast.success(`成功匯入 ${newFields.length} 個欄位定義`);
      await loadFields();
      setActiveTab('view');
    } catch (error) {
      console.error('處理檔案失敗:', error);
      toast.error('檔案處理失敗，請檢查格式');
    } finally {
      setIsLoading(false);
    }
  };

  // 儲存欄位設定
  const handleSaveField = async (field: DynamicFieldConfig) => {
    try {
      setIsLoading(true);
      if (selectedField) {
        // 更新現有欄位
        await fieldService.updateField(selectedField.fieldId, field, organization.id);
        toast.success('欄位更新成功');
      } else {
        // 建立新欄位
        await fieldService.createField(field, organization.id);
        toast.success('欄位建立成功');
      }
      
      setShowFieldEditor(false);
      setSelectedField(null);
      await loadFields();
      onFieldsUpdated?.();
    } catch (error) {
      console.error('儲存欄位失敗:', error);
      toast.error('儲存欄位失敗');
    } finally {
      setIsLoading(false);
    }
  };

  // 刪除欄位
  const handleDeleteField = async (fieldId: string) => {
    Alert.alert(
      '確認刪除',
      '確定要刪除這個欄位嗎？此操作無法復原。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '刪除',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await fieldService.deleteField(fieldId, organization.id);
              toast.success('欄位已刪除');
              await loadFields();
              onFieldsUpdated?.();
            } catch (error) {
              console.error('刪除欄位失敗:', error);
              toast.error('刪除欄位失敗');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  // 過濾欄位
  const filteredFields = fields.filter(field =>
    field.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    field.fieldKey.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 除錯資訊
  console.log('🔍 CustomFieldsModal render:', { 
    visible, 
    organization: organization?.id,
    typeofVisible: typeof visible,
    visibleValue: visible 
  });
  console.trace('CustomFieldsModal render trace');
  
  // 確保只在 visible 為 true 時渲染
  if (!visible || visible === false) {
    console.log('❌ CustomFieldsModal not visible, returning null');
    return null;
  }
  
  return (
    <AdaptiveModal
      visible={visible}
      onClose={onClose}
      size="medium"
      animationType="fade"
      portal={true}
      preventScroll={true}
    >
      <AdaptiveView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        {/* 標題欄 */}
        <AdaptiveView style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#E3E1DC',
        }}>
          <AdaptiveText style={{ fontSize: 18, fontWeight: '600' }}>
            自訂欄位管理
          </AdaptiveText>
          <AdaptiveButton onPress={onClose}>
            <AdaptiveText style={{ color: '#8E8E93', fontSize: 16 }}>✕</AdaptiveText>
          </AdaptiveButton>
        </AdaptiveView>

        {/* 標籤頁 */}
        <AdaptiveView style={{ 
          flexDirection: 'row', 
          borderBottomWidth: 1, 
          borderBottomColor: '#E3E1DC' 
        }}>
          {[
            { key: 'view', label: '檢視欄位', icon: 'list-outline' },
            { key: 'import', label: 'CSV 匯入', icon: 'cloud-upload-outline' },
            { key: 'configure', label: '新增欄位', icon: 'add-circle-outline' },
          ].map((tab) => (
            <AdaptiveButton
              key={tab.key}
              onPress={() => setActiveTab(tab.key as any)}
              style={{
                flex: 1,
                paddingVertical: 12,
                backgroundColor: activeTab === tab.key ? '#007AFF' : 'transparent',
                borderRadius: 0,
              }}
            >
              <AdaptiveView style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={tab.icon} size={18} color={activeTab === tab.key ? '#FFFFFF' : '#1C1C1E'} />
                <AdaptiveText
                  style={{
                    marginLeft: 8,
                    fontWeight: activeTab === tab.key ? '600' : '400',
                    color: activeTab === tab.key ? '#FFFFFF' : '#1C1C1E',
                  }}
                >
                  {tab.label}
                </AdaptiveText>
              </AdaptiveView>
            </AdaptiveButton>
          ))}
        </AdaptiveView>

        {/* 內容區域 */}
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <AdaptiveView style={{ padding: 32, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#007AFF" />
              <AdaptiveText style={{ marginTop: 16, color: '#8E8E93' }}>載入中...</AdaptiveText>
            </AdaptiveView>
          ) : (
            <>
              {/* 檢視欄位標籤 */}
              {activeTab === 'view' && (
                <AdaptiveView style={{ padding: 16 }}>
                  {/* 搜尋欄 */}
                  <AdaptiveView style={{ marginBottom: 16 }}>
                    <AdaptiveInput
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholder="搜尋欄位..."
                      style={{
                        borderWidth: 1,
                        borderColor: '#E3E1DC',
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                      }}
                    />
                  </AdaptiveView>

                  {/* 欄位統計 */}
                  <AdaptiveView style={{
                    backgroundColor: '#F2F2F7',
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 16,
                  }}>
                    <AdaptiveText style={{ fontSize: 14, color: '#8E8E93' }}>
                      共 {filteredFields.length} 個欄位 • {fields.filter(f => f.isSystem).length} 個系統欄位 • {fields.filter(f => !f.isSystem).length} 個自訂欄位
                    </AdaptiveText>
                  </AdaptiveView>

                  {/* 欄位列表 */}
                  <DynamicFieldList
                    fields={filteredFields}
                    onFieldSelect={(field) => {
                      setSelectedField(field);
                      setShowFieldEditor(true);
                    }}
                    onFieldUpdate={(field) => handleSaveField(field)}
                    onBatchSelect={() => {}}
                    virtualScrolling={filteredFields.length > 50}
                    viewMode="list"
                  />

                  {filteredFields.length === 0 && (
                    <AdaptiveView style={{ padding: 32, alignItems: 'center' }}>
                      <Icon name="folder-open-outline" size={48} color="#C7C7CC" />
                      <AdaptiveText style={{ marginTop: 16, color: '#8E8E93', textAlign: 'center' }}>
                        {searchQuery ? '沒有符合的欄位' : '尚未建立自訂欄位'}
                      </AdaptiveText>
                    </AdaptiveView>
                  )}
                </AdaptiveView>
              )}

              {/* CSV 匯入標籤 */}
              {activeTab === 'import' && (
                <AdaptiveView style={{ padding: 16 }}>
                  <AdaptiveText style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
                    從 CSV 檔案匯入欄位
                  </AdaptiveText>
                  <AdaptiveText style={{ fontSize: 14, color: '#8E8E93', marginBottom: 24 }}>
                    上傳 CSV 檔案，系統會自動分析並建立對應的欄位定義
                  </AdaptiveText>

                  <FileUploader
                    onFileSelect={handleFileUpload}
                    maxSize={50 * 1024 * 1024} // 50MB
                    acceptedFormats={['.csv', '.txt']}
                  />

                  <AdaptiveView style={{
                    marginTop: 24,
                    padding: 16,
                    backgroundColor: '#F2F2F7',
                    borderRadius: 8,
                  }}>
                    <AdaptiveText style={{ fontWeight: '600', marginBottom: 8 }}>使用說明</AdaptiveText>
                    <AdaptiveText style={{ fontSize: 14, color: '#3C3C43', lineHeight: 20 }}>
                      1. CSV 檔案第一列應為欄位名稱{'\n'}
                      2. 系統會自動推斷資料類型{'\n'}
                      3. 支援文字、數字、日期、電話等多種格式{'\n'}
                      4. 自動檢測個人識別資訊（PII）{'\n'}
                      5. 檔案大小限制 50MB
                    </AdaptiveText>
                  </AdaptiveView>
                </AdaptiveView>
              )}

              {/* 新增欄位標籤 */}
              {activeTab === 'configure' && (
                <AdaptiveView style={{ padding: 16 }}>
                  <AdaptiveButton
                    onPress={() => {
                      setSelectedField({
                        fieldId: '',
                        organizationId: organization.id,
                        entityType: 'customers',
                        originalName: '',
                        fieldKey: '',
                        displayName: '',
                        dataType: 'text',
                        isActive: true,
                        isSystem: false,
                        isRequired: false,
                        isUnique: false,
                        isIndexed: false,
                        isSearchable: true,
                        isSortable: true,
                        defaultValue: null,
                        validationRules: [],
                        formatting: {},
                        security: {
                          level: 'public',
                          readRoles: [],
                          writeRoles: [],
                          encrypted: false,
                          auditLog: false,
                          isPII: false,
                        },
                        usage: {
                          usageCount: 0,
                          nullRatio: 0,
                          uniqueValueCount: 0,
                        },
                        metadata: {
                          createdBy: 'user',
                          createdAt: new Date(),
                          updatedBy: 'user',
                          updatedAt: new Date(),
                        },
                      } as DynamicFieldConfig);
                      setShowFieldEditor(true);
                    }}
                    style={{
                      backgroundColor: '#007AFF',
                      paddingVertical: 12,
                      paddingHorizontal: 24,
                      borderRadius: 8,
                      alignSelf: 'center',
                    }}
                  >
                    <AdaptiveText style={{ color: '#FFFFFF', fontWeight: '600' }}>
                      建立新欄位
                    </AdaptiveText>
                  </AdaptiveButton>

                  <AdaptiveView style={{
                    marginTop: 24,
                    padding: 16,
                    backgroundColor: '#F2F2F7',
                    borderRadius: 8,
                  }}>
                    <AdaptiveText style={{ fontWeight: '600', marginBottom: 8 }}>快速提示</AdaptiveText>
                    <AdaptiveText style={{ fontSize: 14, color: '#3C3C43', lineHeight: 20 }}>
                      • 欄位鍵值必須唯一且只能包含字母、數字和底線{'\n'}
                      • 系統欄位無法刪除或修改鍵值{'\n'}
                      • 可以設定驗證規則確保資料品質{'\n'}
                      • 啟用加密儲存保護敏感資料{'\n'}
                      • 支援 100+ 個自訂欄位
                    </AdaptiveText>
                  </AdaptiveView>
                </AdaptiveView>
              )}
            </>
          )}
        </ScrollView>

        {/* 欄位編輯器 */}
        {selectedField && (
          <FieldConfigurator
            visible={showFieldEditor}
            field={selectedField}
            onSave={handleSaveField}
            onCancel={() => {
              setShowFieldEditor(false);
              setSelectedField(null);
            }}
            mode={selectedField.fieldId ? 'edit' : 'create'}
          />
        )}
      </AdaptiveView>
    </AdaptiveModal>
  );
};

export default CustomFieldsModal;