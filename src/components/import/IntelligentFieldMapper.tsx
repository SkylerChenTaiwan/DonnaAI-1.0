/**
 * 智能欄位映射元件
 * 提供視覺化的欄位映射介面，支援 AI 建議和手動調整
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform } from 'react-native';
import { MaterialIcon } from '@/components/common/MaterialIcon';
import { Dropdown } from '@/components/common/Dropdown';
import { 
  FieldMappingEngine 
} from '@/services/import/FieldMappingEngine';
import { 
  DataTypeInferrer 
} from '@/services/import/DataTypeInferrer';
import {
  FieldAnalysis,
  MappingSuggestion,
  DataType } from '@/types/intelligentImport';
import { FieldDefinition } from '@/types/organization';
import { styles } from './styles/IntelligentFieldMapperStyles';

interface Props {
  sourceHeaders: string[];
  sampleData?: any[][];
  targetFields: FieldDefinition[];
  onMappingChange: (mappings: FieldMapping[]) => void;
  onCreateField?: (fieldName: string, fieldType: DataType) => void;
  openAIKey?: string;
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  confidence: number;
  transform?: string;
  isNew?: boolean;
}

export const IntelligentFieldMapper: React.FC<Props> = ({
  sourceHeaders,
  sampleData = [],
  targetFields,
  onMappingChange,
  onCreateField,
  openAIKey }) => {
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [fieldAnalyses, setFieldAnalyses] = useState<FieldAnalysis[]>([]);
  const [suggestions, setSuggestions] = useState<Map<string, MappingSuggestion>>(new Map());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [unmappedRequired, setUnmappedRequired] = useState<FieldDefinition[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedMapping, setSelectedMapping] = useState<string | null>(null);

  const mappingEngine = useMemo(
    () => new FieldMappingEngine(openAIKey),
    [openAIKey]
  );

  const typeInferrer = useMemo(
    () => new DataTypeInferrer(),
    []
  );

  // 初始化分析
  useEffect(() => {
    analyzeFields();
  }, [sourceHeaders, sampleData]);

  // 分析欄位並生成建議
  const analyzeFields = async () => {
    setIsAnalyzing(true);

    try {
      // 分析欄位類型
      const analyses = await mappingEngine.analyzeHeaders(
        sourceHeaders,
        sampleData
      );
      setFieldAnalyses(analyses);

      // 生成映射建議
      const newSuggestions = new Map<string, MappingSuggestion>();
      const newMappings: FieldMapping[] = [];

      for (const header of sourceHeaders) {
        const suggestion = await mappingEngine.suggestMapping(
          header,
          targetFields
        );
        newSuggestions.set(header, suggestion);

        // 如果信心度高，自動映射
        if (suggestion.bestMatch.confidence >= 0.8) {
          newMappings.push({
            sourceField: header,
            targetField: suggestion.bestMatch.targetField,
            confidence: suggestion.bestMatch.confidence });
        }
      }

      setSuggestions(newSuggestions);
      setMappings(newMappings);

      // 找出未映射的必填欄位
      const mappedTargets = new Set(newMappings.map(m => m.targetField));
      const unmapped = targetFields.filter(
        field => field.required && !mappedTargets.has(field.name)
      );
      setUnmappedRequired(unmapped);

    } catch (error) {
      console.error('分析欄位失敗:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 更新映射
  const updateMapping = (sourceField: string, targetField: string) => {
    const newMappings = [...mappings];
    const existingIndex = newMappings.findIndex(
      m => m.sourceField === sourceField
    );

    if (targetField === '') {
      // 移除映射
      if (existingIndex !== -1) {
        newMappings.splice(existingIndex, 1);
      }
    } else {
      const mapping: FieldMapping = {
        sourceField,
        targetField,
        confidence: 1.0, // 手動映射信心度為 100%
      };

      if (existingIndex !== -1) {
        newMappings[existingIndex] = mapping;
      } else {
        newMappings.push(mapping);
      }
    }

    setMappings(newMappings);
    onMappingChange(newMappings);
  };

  // 套用所有 AI 建議
  const applyAllSuggestions = () => {
    const newMappings: FieldMapping[] = [];

    suggestions.forEach((suggestion, sourceField) => {
      if (suggestion.bestMatch.targetField) {
        newMappings.push({
          sourceField,
          targetField: suggestion.bestMatch.targetField,
          confidence: suggestion.bestMatch.confidence });
      }
    });

    setMappings(newMappings);
    onMappingChange(newMappings);
  };

  // 重置映射
  const resetMappings = () => {
    setMappings([]);
    onMappingChange([]);
  };

  // 建立新欄位
  const handleCreateField = (sourceField: string) => {
    const analysis = fieldAnalyses.find(a => a.header === sourceField);
    const fieldType = analysis?.detectedType || 'text';

    if (onCreateField) {
      onCreateField(sourceField, fieldType);
      
      // 添加映射
      updateMapping(sourceField, sourceField);
    }
  };

  // 獲取信心度顏色
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.9) return '#4CAF50';
    if (confidence >= 0.7) return '#FF9800';
    return '#F44336';
  };

  // 獲取信心度圖示
  const getConfidenceIcon = (confidence: number): string => {
    if (confidence >= 0.9) return 'check-circle';
    if (confidence >= 0.7) return 'warning';
    return 'error';
  };

  // 渲染映射行
  const renderMappingRow = (header: string, index: number) => {
    const mapping = mappings.find(m => m.sourceField === header);
    const suggestion = suggestions.get(header);
    const analysis = fieldAnalyses.find(a => a.header === header);
    const isSelected = selectedMapping === header;

    return (
      <TouchableOpacity
        key={index}
        style={StyleSheet.flatten([styles.mappingRow, isSelected && styles.selectedRow])}
        onPress={() => setSelectedMapping(isSelected ? null : header)}
      >
        <View style={styles.sourceField}>
          <Text style={styles.fieldName}>{header}</Text>
          {analysis && (
            <Text style={styles.fieldType}>
              {analysis.detectedType}
            </Text>
          )}
          {analysis?.samples && analysis.samples.length > 0 && (
            <Text style={styles.sampleData} numberOfLines={1}>
              範例: {analysis.samples[0]}
            </Text>
          )}
        </View>

        <View style={styles.arrow}>
          <MaterialIcon name="arrow-forward" size={20} color="#666" />
        </View>

        <View style={styles.targetField}>
          <Dropdown
            options={[
              ...targetFields.map(field => ({
                value: field.name,
                label: field.label
              })),
              { value: '__new__', label: '建立新欄位' }
            ]}
            value={mapping?.targetField || ''}
            placeholder="選擇欄位"
            onChange={(value) => {
              if (value === '__new__') {
                handleCreateField(header);
              } else {
                updateMapping(header, value);
              }
            }}
            style={Platform.OS === 'web' ? {} : styles.picker}
          />

          {suggestion && !mapping && (
            <TouchableOpacity
              style={styles.suggestionChip}
              onPress={() => updateMapping(
                header,
                suggestion.bestMatch.targetField
              )}
            >
              <Text style={styles.suggestionText}>
                建議: {targetFields.find(
                  f => f.name === suggestion.bestMatch.targetField
                )?.label}
              </Text>
              <View style={StyleSheet.flatten([
                styles.confidenceBadge,
                { backgroundColor: getConfidenceColor(suggestion.bestMatch.confidence) }
              ])}>
                <Text style={styles.confidenceText}>
                  {Math.round(suggestion.bestMatch.confidence * 100)}%
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {mapping && (
            <View style={styles.mappingInfo}>
              <MaterialIcons
                name={getConfidenceIcon(mapping.confidence)}
                size={16}
                color={getConfidenceColor(mapping.confidence)}
              />
              <Text style={StyleSheet.flatten([
                styles.confidenceText,
                { color: getConfidenceColor(mapping.confidence) }
              ])}>
                {Math.round(mapping.confidence * 100)}%
              </Text>
            </View>
          )}
        </View>

        {isSelected && suggestion?.alternatives && suggestion.alternatives.length > 0 && (
          <View style={styles.alternativesSection}>
            <Text style={styles.alternativesTitle}>其他建議:</Text>
            {suggestion.alternatives.map((alt, i) => (
              <TouchableOpacity
                key={i}
                style={styles.alternativeOption}
                onPress={() => updateMapping(header, alt.targetField)}
              >
                <Text style={styles.alternativeText}>
                  {targetFields.find(f => f.name === alt.targetField)?.label}
                </Text>
                <Text style={styles.alternativeConfidence}>
                  {Math.round(alt.confidence * 100)}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // 渲染未映射的必填欄位
  const renderUnmappedRequired = () => {
    if (unmappedRequired.length === 0) return null;

    return (
      <View style={styles.unmappedSection}>
        <Text style={styles.unmappedTitle}>
          <MaterialIcon name="info" size={16} color="#FF9800" />
          {' '}未映射的必填欄位
        </Text>
        {unmappedRequired.map(field => (
          <View key={field.name} style={styles.unmappedField}>
            <Text style={styles.unmappedFieldName}>• {field.label}</Text>
            <View style={styles.defaultValuePicker}>
              <Text style={styles.defaultLabel}>設定預設值:</Text>
              {Platform.OS === 'web' ? (
                <select style={styles.webPickerSmall}>
                  <option>自動填入</option>
                  <option>匯入日期</option>
                  <option>空值</option>
                </select>
              ) : (
                <Picker style={styles.pickerSmall}>
                  <Picker.Item label="自動填入" value="auto" />
                  <Picker.Item label="匯入日期" value="date" />
                  <Picker.Item label="空值" value="null" />
                </Picker>
              )}
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔄 智能欄位映射</Text>
        <View style={styles.headerInfo}>
          <Text style={styles.infoText}>
            來源欄位: {sourceHeaders.length}
          </Text>
          <Text style={styles.infoText}>
            目標欄位: {targetFields.length}
          </Text>
          <Text style={styles.infoText}>
            已映射: {mappings.length}
          </Text>
        </View>
      </View>

      {isAnalyzing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2C2C2C" />
          <Text style={styles.loadingText}>正在分析欄位...</Text>
        </View>
      ) : (
        <>
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={applyAllSuggestions}
            >
              <MaterialIcon name="auto-awesome" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>AI 建議全部</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={StyleSheet.flatten([styles.actionButton, styles.secondaryButton])}
              onPress={resetMappings}
            >
              <MaterialIcon name="refresh" size={20} color="#666" />
              <Text style={StyleSheet.flatten([styles.actionButtonText, styles.secondaryText])}>
                重置
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={StyleSheet.flatten([styles.actionButton, styles.secondaryButton])}
              onPress={() => setShowAdvanced(!showAdvanced)}
            >
              <MaterialIcon 
                name={showAdvanced ? 'expand-less' : 'expand-more'} 
                size={20} 
                color="#666" 
              />
              <Text style={StyleSheet.flatten([styles.actionButtonText, styles.secondaryText])}>
                進階選項
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.mappingList}>
            <View style={styles.mappingHeader}>
              <Text style={styles.columnHeader}>來源欄位</Text>
              <Text style={styles.columnHeader}></Text>
              <Text style={styles.columnHeader}>目標欄位</Text>
            </View>

            {sourceHeaders.map((header, index) => 
              renderMappingRow(header, index)
            )}

            {renderUnmappedRequired()}
          </ScrollView>

          {showAdvanced && (
            <View style={styles.advancedSection}>
              <Text style={styles.advancedTitle}>進階設定</Text>
              <View style={styles.advancedOption}>
                <Text style={styles.advancedLabel}>信心度閾值:</Text>
                <Text style={styles.advancedValue}>
                  {Math.round(mappingEngine.getConfidenceThreshold() * 100)}%
                </Text>
              </View>
              <View style={styles.advancedOption}>
                <Text style={styles.advancedLabel}>自動建立新欄位:</Text>
                <Text style={styles.advancedValue}>
                  {onCreateField ? '啟用' : '停用'}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>映射摘要</Text>
            <View style={styles.summaryStats}>
              <View style={styles.statItem}>
                <MaterialIcon name="check-circle" size={20} color="#4CAF50" />
                <Text style={styles.statLabel}>高信心度</Text>
                <Text style={styles.statValue}>
                  {mappings.filter(m => m.confidence >= 0.9).length}
                </Text>
              </View>
              <View style={styles.statItem}>
                <MaterialIcon name="warning" size={20} color="#FF9800" />
                <Text style={styles.statLabel}>中信心度</Text>
                <Text style={styles.statValue}>
                  {mappings.filter(m => m.confidence >= 0.7 && m.confidence < 0.9).length}
                </Text>
              </View>
              <View style={styles.statItem}>
                <MaterialIcon name="error" size={20} color="#F44336" />
                <Text style={styles.statLabel}>需確認</Text>
                <Text style={styles.statValue}>
                  {sourceHeaders.length - mappings.length}
                </Text>
              </View>
            </View>
          </View>
        </>
      )}
    </View>
  );
};