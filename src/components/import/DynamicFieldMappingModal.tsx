/**
 * 動態欄位映射配置 Modal
 * 整合動態欄位系統，支援自訂欄位映射和配置
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Platform, ScrollView, Alert } from 'react-native';
import {
  AdaptiveModal,
  AdaptiveView,
  AdaptiveText,
  AdaptiveButton,
  AdaptiveInput,
  AdaptiveSelect,
} from '@/components/adaptive';
import { withAlpha } from '@/utils/colors';
import {
  DynamicFieldConfig,
  FieldDataType,
  CSVAnalysisResult,
  FieldMappingConfig,
  FieldMapping,
} from '@/types/dynamic-field-mapping';
import FileUploader from '@/components/dynamic-fields/FileUploader';
import DynamicFieldList from '@/components/dynamic-fields/DynamicFieldList';
import FieldConfigurator from '@/components/dynamic-fields/FieldConfigurator';
import DataPreviewTable from '@/components/dynamic-fields/DataPreviewTable';
import { CSVAnalysisService } from '@/services/dynamic-fields/CSVAnalysisService';
import { DynamicFieldService } from '@/services/dynamic-fields/DynamicFieldService';
import { Timestamp } from 'firebase/firestore';

interface DynamicFieldMappingModalProps {
  visible: boolean;
  orgId: string;
  onConfirm: (mappingConfig: FieldMappingConfig) => void;
  onCancel: () => void;
  existingFields?: DynamicFieldConfig[];
  targetEntity?: 'customer' | 'record' | 'product' | 'custom';
}

interface MappingStep {
  step: 'upload' | 'analyze' | 'configure' | 'preview' | 'confirm';
  title: string;
  description: string;
}

const MAPPING_STEPS: MappingStep[] = [
  {
    step: 'upload',
    title: '上傳檔案',
    description: '選擇要匯入的 CSV 檔案',
  },
  {
    step: 'analyze',
    title: '分析欄位',
    description: '自動分析檔案結構和欄位類型',
  },
  {
    step: 'configure',
    title: '配置映射',
    description: '設定欄位映射和驗證規則',
  },
  {
    step: 'preview',
    title: '預覽資料',
    description: '檢查映射結果和資料品質',
  },
  {
    step: 'confirm',
    title: '確認匯入',
    description: '確認設定並開始匯入',
  },
];

export const DynamicFieldMappingModal: React.FC<DynamicFieldMappingModalProps> = ({
  visible,
  orgId,
  onConfirm,
  onCancel,
  existingFields = [],
  targetEntity = 'customer',
}) => {
  const [currentStep, setCurrentStep] = useState<MappingStep['step']>('upload');
  const [loading, setLoading] = useState(false);
  
  // 檔案和分析相關狀態
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<CSVAnalysisResult | null>(null);
  const [csvData, setCsvData] = useState<Record<string, unknown>[]>([]);
  
  // 欄位配置相關狀態
  const [dynamicFields, setDynamicFields] = useState<DynamicFieldConfig[]>(existingFields);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [showFieldConfigurator, setShowFieldConfigurator] = useState(false);
  const [editingField, setEditingField] = useState<DynamicFieldConfig | null>(null);

  // 映射配置
  const [mappingConfig, setMappingConfig] = useState<FieldMappingConfig>({
    id: '',
    name: '',
    sourceSystem: 'CSV Import',
    targetEntity,
    mappings: [],
    metadata: {
      createdBy: '',
      createdAt: Timestamp.now(),
      updatedBy: '',
      updatedAt: Timestamp.now(),
    },
  });

  /**
   * 處理檔案上傳
   */
  const handleFileUpload = useCallback(async (file: File) => {
    setLoading(true);
    try {
      setSelectedFile(file);
      
      // 使用 CSVAnalysisService 分析檔案
      const analysisService = new CSVAnalysisService();
      const result = await analysisService.analyzeFile(file);
      
      setAnalysisResult(result);
      
      // 解析 CSV 資料（前 100 筆作為預覽）
      const text = await file.text();
      const lines = text.split('\n').slice(0, 101); // 標題 + 100 筆資料
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      const data = lines.slice(1).filter(line => line.trim()).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row: Record<string, unknown> = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || null;
        });
        return row;
      });
      
      setCsvData(data);
      
      // 自動進入下一步
      setCurrentStep('analyze');
    } catch (error) {
      Alert.alert('錯誤', `檔案分析失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 處理欄位分析完成
   */
  const handleAnalysisComplete = useCallback(async () => {
    if (!analysisResult) return;
    
    setLoading(true);
    try {
      // 建立動態欄位配置
      const newFields: DynamicFieldConfig[] = analysisResult.suggestedFields.map((field, index) => ({
        id: `field_${Date.now()}_${index}`,
        fieldKey: field.fieldKey,
        displayName: field.displayName,
        dataType: field.dataType,
        description: field.description,
        defaultValue: field.defaultValue,
        isSystem: false,
        isActive: true,
        isSearchable: true,
        isSortable: true,
        validationRules: field.validationRules || [],
        formatting: {},
        security: {
          level: 'public',
          readRoles: [],
          writeRoles: [],
          encrypted: false,
          auditLog: false,
          isPII: field.security?.isPII || false,
          piiType: field.security?.piiType,
        },
        usage: {
          usageCount: 0,
          nullRatio: field.statistics?.nullRatio || 0,
          uniqueValueCount: field.statistics?.uniqueValues || 0,
        },
        metadata: {
          createdBy: orgId,
          createdAt: Timestamp.now(),
          updatedBy: orgId,
          updatedAt: Timestamp.now(),
          source: selectedFile?.name,
          originalName: field.originalName,
        },
      }));
      
      // 合併現有欄位和新分析的欄位
      const allFields = [...existingFields, ...newFields];
      setDynamicFields(allFields);
      
      // 建立預設映射
      const defaultMappings: FieldMapping[] = analysisResult.suggestedFields.map(field => ({
        sourceField: field.originalName || field.fieldKey,
        targetField: field.fieldKey,
        transformFunction: field.transformFunction,
        isRequired: field.validationRules?.some(rule => rule.type === 'required') || false,
        confidence: field.confidence || 0.8,
        metadata: {
          autoGenerated: true,
          analysisResult: field,
        },
      }));
      
      setFieldMappings(defaultMappings);
      setCurrentStep('configure');
    } catch (error) {
      Alert.alert('錯誤', `欄位分析失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  }, [analysisResult, selectedFile, existingFields, orgId]);

  /**
   * 處理欄位配置更新
   */
  const handleFieldUpdate = useCallback((field: DynamicFieldConfig) => {
    setDynamicFields(prev => prev.map(f => f.id === field.id ? field : f));
  }, []);

  /**
   * 處理欄位刪除
   */
  const handleFieldDelete = useCallback((fieldId: string) => {
    setDynamicFields(prev => prev.filter(f => f.id !== fieldId));
    setFieldMappings(prev => prev.filter(m => m.targetField !== fieldId));
  }, []);

  /**
   * 處理映射配置完成
   */
  const handleConfigurationComplete = useCallback(() => {
    // 更新映射配置
    setMappingConfig(prev => ({
      ...prev,
      name: selectedFile?.name ? `${selectedFile.name} 映射` : '動態欄位映射',
      mappings: fieldMappings,
      metadata: {
        ...prev.metadata,
        updatedAt: Timestamp.now(),
      },
    }));
    
    setCurrentStep('preview');
  }, [fieldMappings, selectedFile]);

  /**
   * 處理預覽確認
   */
  const handlePreviewConfirm = useCallback(() => {
    setCurrentStep('confirm');
  }, []);

  /**
   * 處理最終確認
   */
  const handleFinalConfirm = useCallback(async () => {
    setLoading(true);
    try {
      // 儲存動態欄位配置
      const fieldService = new DynamicFieldService();
      await fieldService.createDefinitions(dynamicFields);
      
      // 確認映射配置
      onConfirm(mappingConfig);
    } catch (error) {
      Alert.alert('錯誤', `配置儲存失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  }, [dynamicFields, mappingConfig, onConfirm]);

  /**
   * 渲染步驟指示器
   */
  const renderStepIndicator = () => (
    <AdaptiveView style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#E3E1DC',
    }}>
      {MAPPING_STEPS.map((step, index) => {
        const isActive = step.step === currentStep;
        const isCompleted = MAPPING_STEPS.findIndex(s => s.step === currentStep) > index;
        
        return (
          <AdaptiveView key={step.step} style={{ flex: 1, alignItems: 'center' }}>
            <AdaptiveView style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: isCompleted ? '#34C759' : isActive ? '#007AFF' : '#E3E1DC',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 8,
            }}>
              <AdaptiveText style={{
                color: isCompleted || isActive ? '#FFFFFF' : '#8E8E93',
                fontWeight: '600',
                fontSize: 14,
              }}>
                {isCompleted ? '✓' : index + 1}
              </AdaptiveText>
            </AdaptiveView>
            
            <AdaptiveText style={{
              fontSize: 12,
              fontWeight: isActive ? '600' : '400',
              color: isActive ? '#007AFF' : '#8E8E93',
              textAlign: 'center',
            }}>
              {step.title}
            </AdaptiveText>
          </AdaptiveView>
        );
      })}
    </AdaptiveView>
  );

  /**
   * 渲染上傳步驟
   */
  const renderUploadStep = () => (
    <AdaptiveView style={{ flex: 1, padding: 24 }}>
      <AdaptiveText style={{ fontSize: 18, fontWeight: '600', marginBottom: 8, textAlign: 'center' }}>
        上傳 CSV 檔案
      </AdaptiveText>
      <AdaptiveText style={{ fontSize: 14, color: '#8E8E93', marginBottom: 24, textAlign: 'center' }}>
        選擇包含客戶資料的 CSV 檔案，系統將自動分析欄位結構
      </AdaptiveText>
      
      <FileUploader
        onFileSelect={handleFileUpload}
        maxSize={50 * 1024 * 1024} // 50MB
        acceptedFormats={['.csv', '.txt']}
        isLoading={loading}
        style={{ flex: 1 }}
      />
    </AdaptiveView>
  );

  /**
   * 渲染分析步驟
   */
  const renderAnalyzeStep = () => (
    <AdaptiveView style={{ flex: 1, padding: 24 }}>
      <AdaptiveText style={{ fontSize: 18, fontWeight: '600', marginBottom: 8, textAlign: 'center' }}>
        檔案分析結果
      </AdaptiveText>
      
      {analysisResult && (
        <AdaptiveView style={{ marginBottom: 24 }}>
          <AdaptiveView style={{
            backgroundColor: '#F2F2F7',
            borderRadius: 8,
            padding: 16,
            marginBottom: 16,
          }}>
            <AdaptiveText style={{ fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
              檔案資訊
            </AdaptiveText>
            <AdaptiveView style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <AdaptiveText style={{ color: '#8E8E93' }}>檔案名稱：</AdaptiveText>
              <AdaptiveText>{selectedFile?.name}</AdaptiveText>
            </AdaptiveView>
            <AdaptiveView style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <AdaptiveText style={{ color: '#8E8E93' }}>總記錄數：</AdaptiveText>
              <AdaptiveText>{analysisResult.totalRecords.toLocaleString()}</AdaptiveText>
            </AdaptiveView>
            <AdaptiveView style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <AdaptiveText style={{ color: '#8E8E93' }}>欄位數量：</AdaptiveText>
              <AdaptiveText>{analysisResult.suggestedFields.length}</AdaptiveText>
            </AdaptiveView>
          </AdaptiveView>
          
          <AdaptiveText style={{ fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
            識別的欄位 ({analysisResult.suggestedFields.length})
          </AdaptiveText>
          
          <ScrollView style={{ maxHeight: 300 }}>
            {analysisResult.suggestedFields.map((field, index) => (
              <AdaptiveView key={index} style={{
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#E3E1DC',
                borderRadius: 8,
                padding: 12,
                marginBottom: 8,
              }}>
                <AdaptiveView style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <AdaptiveText style={{ fontWeight: '600' }}>{field.displayName}</AdaptiveText>
                  <AdaptiveText style={{ fontSize: 12, color: '#007AFF' }}>{field.dataType}</AdaptiveText>
                </AdaptiveView>
                <AdaptiveText style={{ fontSize: 12, color: '#8E8E93' }}>
                  原始名稱: {field.originalName}
                </AdaptiveText>
                {field.description && (
                  <AdaptiveText style={{ fontSize: 12, color: '#8E8E93', marginTop: 4 }}>
                    {field.description}
                  </AdaptiveText>
                )}
              </AdaptiveView>
            ))}
          </ScrollView>
        </AdaptiveView>
      )}
      
      <AdaptiveView style={{ flexDirection: 'row', gap: 12 }}>
        <AdaptiveButton
          onPress={() => setCurrentStep('upload')}
          style={{
            flex: 1,
            backgroundColor: '#8E8E93',
            paddingVertical: 12,
            borderRadius: 8,
          }}
        >
          <AdaptiveText style={{ color: '#FFFFFF', textAlign: 'center', fontWeight: '600' }}>
            重新上傳
          </AdaptiveText>
        </AdaptiveButton>
        
        <AdaptiveButton
          onPress={handleAnalysisComplete}
          disabled={loading}
          style={{
            flex: 1,
            backgroundColor: '#007AFF',
            paddingVertical: 12,
            borderRadius: 8,
          }}
        >
          <AdaptiveText style={{ color: '#FFFFFF', textAlign: 'center', fontWeight: '600' }}>
            {loading ? '處理中...' : '確認分析'}
          </AdaptiveText>
        </AdaptiveButton>
      </AdaptiveView>
    </AdaptiveView>
  );

  /**
   * 渲染配置步驟
   */
  const renderConfigureStep = () => (
    <AdaptiveView style={{ flex: 1 }}>
      <AdaptiveView style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#E3E1DC' }}>
        <AdaptiveText style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>
          欄位映射配置
        </AdaptiveText>
        <AdaptiveText style={{ fontSize: 14, color: '#8E8E93' }}>
          檢查並調整欄位映射，可以修改欄位屬性或新增額外配置
        </AdaptiveText>
      </AdaptiveView>
      
      <DynamicFieldList
        fields={dynamicFields}
        onFieldUpdate={handleFieldUpdate}
        onBatchSelect={() => {}} // 暫時不需要批次選擇
        onFieldDelete={handleFieldDelete}
        style={{ flex: 1 }}
      />
      
      <AdaptiveView style={{
        flexDirection: 'row',
        gap: 12,
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E3E1DC',
      }}>
        <AdaptiveButton
          onPress={() => setCurrentStep('analyze')}
          style={{
            flex: 1,
            backgroundColor: '#8E8E93',
            paddingVertical: 12,
            borderRadius: 8,
          }}
        >
          <AdaptiveText style={{ color: '#FFFFFF', textAlign: 'center', fontWeight: '600' }}>
            上一步
          </AdaptiveText>
        </AdaptiveButton>
        
        <AdaptiveButton
          onPress={handleConfigurationComplete}
          style={{
            flex: 1,
            backgroundColor: '#007AFF',
            paddingVertical: 12,
            borderRadius: 8,
          }}
        >
          <AdaptiveText style={{ color: '#FFFFFF', textAlign: 'center', fontWeight: '600' }}>
            下一步
          </AdaptiveText>
        </AdaptiveButton>
      </AdaptiveView>
    </AdaptiveView>
  );

  /**
   * 渲染預覽步驟
   */
  const renderPreviewStep = () => (
    <AdaptiveView style={{ flex: 1 }}>
      <AdaptiveView style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#E3E1DC' }}>
        <AdaptiveText style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>
          資料預覽
        </AdaptiveText>
        <AdaptiveText style={{ fontSize: 14, color: '#8E8E93' }}>
          預覽映射後的資料，檢查是否有任何問題
        </AdaptiveText>
      </AdaptiveView>
      
      <DataPreviewTable
        data={csvData}
        fields={dynamicFields}
        errors={[]} // TODO: 實際驗證錯誤
        style={{ flex: 1 }}
      />
      
      <AdaptiveView style={{
        flexDirection: 'row',
        gap: 12,
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E3E1DC',
      }}>
        <AdaptiveButton
          onPress={() => setCurrentStep('configure')}
          style={{
            flex: 1,
            backgroundColor: '#8E8E93',
            paddingVertical: 12,
            borderRadius: 8,
          }}
        >
          <AdaptiveText style={{ color: '#FFFFFF', textAlign: 'center', fontWeight: '600' }}>
            修改配置
          </AdaptiveText>
        </AdaptiveButton>
        
        <AdaptiveButton
          onPress={handlePreviewConfirm}
          style={{
            flex: 1,
            backgroundColor: '#007AFF',
            paddingVertical: 12,
            borderRadius: 8,
          }}
        >
          <AdaptiveText style={{ color: '#FFFFFF', textAlign: 'center', fontWeight: '600' }}>
            確認無誤
          </AdaptiveText>
        </AdaptiveButton>
      </AdaptiveView>
    </AdaptiveView>
  );

  /**
   * 渲染確認步驟
   */
  const renderConfirmStep = () => (
    <AdaptiveView style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
      <AdaptiveView style={{
        backgroundColor: '#F2F2F7',
        borderRadius: 12,
        padding: 24,
        alignItems: 'center',
      }}>
        <AdaptiveText style={{ fontSize: 20, fontWeight: '600', marginBottom: 16, textAlign: 'center' }}>
          確認匯入設定
        </AdaptiveText>
        
        <AdaptiveView style={{ width: '100%', marginBottom: 24 }}>
          <AdaptiveView style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <AdaptiveText style={{ color: '#8E8E93' }}>檔案：</AdaptiveText>
            <AdaptiveText>{selectedFile?.name}</AdaptiveText>
          </AdaptiveView>
          <AdaptiveView style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <AdaptiveText style={{ color: '#8E8E93' }}>記錄數：</AdaptiveText>
            <AdaptiveText>{analysisResult?.totalRecords.toLocaleString()}</AdaptiveText>
          </AdaptiveView>
          <AdaptiveView style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <AdaptiveText style={{ color: '#8E8E93' }}>欄位數：</AdaptiveText>
            <AdaptiveText>{dynamicFields.length}</AdaptiveText>
          </AdaptiveView>
          <AdaptiveView style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <AdaptiveText style={{ color: '#8E8E93' }}>目標實體：</AdaptiveText>
            <AdaptiveText>{targetEntity}</AdaptiveText>
          </AdaptiveView>
        </AdaptiveView>
        
        <AdaptiveText style={{ fontSize: 14, color: '#8E8E93', textAlign: 'center', marginBottom: 24 }}>
          點擊確認開始匯入，這個過程可能需要幾分鐘時間
        </AdaptiveText>
        
        <AdaptiveView style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
          <AdaptiveButton
            onPress={() => setCurrentStep('preview')}
            style={{
              flex: 1,
              backgroundColor: '#8E8E93',
              paddingVertical: 12,
              borderRadius: 8,
            }}
          >
            <AdaptiveText style={{ color: '#FFFFFF', textAlign: 'center', fontWeight: '600' }}>
              返回預覽
            </AdaptiveText>
          </AdaptiveButton>
          
          <AdaptiveButton
            onPress={handleFinalConfirm}
            disabled={loading}
            style={{
              flex: 1,
              backgroundColor: '#34C759',
              paddingVertical: 12,
              borderRadius: 8,
            }}
          >
            <AdaptiveText style={{ color: '#FFFFFF', textAlign: 'center', fontWeight: '600' }}>
              {loading ? '處理中...' : '開始匯入'}
            </AdaptiveText>
          </AdaptiveButton>
        </AdaptiveView>
      </AdaptiveView>
    </AdaptiveView>
  );

  /**
   * 渲染當前步驟內容
   */
  const renderStepContent = () => {
    switch (currentStep) {
      case 'upload':
        return renderUploadStep();
      case 'analyze':
        return renderAnalyzeStep();
      case 'configure':
        return renderConfigureStep();
      case 'preview':
        return renderPreviewStep();
      case 'confirm':
        return renderConfirmStep();
      default:
        return null;
    }
  };

  return (
    <AdaptiveModal
      visible={visible}
      onRequestClose={onCancel}
      size="large"
      animationType="slide"
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
            動態欄位映射精靈
          </AdaptiveText>
          <AdaptiveButton onPress={onCancel}>
            <AdaptiveText style={{ color: '#8E8E93', fontSize: 16 }}>✕</AdaptiveText>
          </AdaptiveButton>
        </AdaptiveView>

        {/* 步驟指示器 */}
        {renderStepIndicator()}

        {/* 步驟內容 */}
        {renderStepContent()}

        {/* 欄位配置器 */}
        {showFieldConfigurator && editingField && (
          <FieldConfigurator
            field={editingField}
            onSave={(field) => {
              handleFieldUpdate(field);
              setShowFieldConfigurator(false);
              setEditingField(null);
            }}
            onCancel={() => {
              setShowFieldConfigurator(false);
              setEditingField(null);
            }}
            visible={showFieldConfigurator}
            mode="edit"
          />
        )}
      </AdaptiveView>
    </AdaptiveModal>
  );
};

export default DynamicFieldMappingModal;