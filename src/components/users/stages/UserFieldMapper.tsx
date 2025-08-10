/**
 * 階段 2: 用戶欄位映射
 * 提供智能欄位對應功能，支援 AI 輔助和手動調整
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Icon } from '@/components/common/Icon';
import { DesignSystem } from '@/theme/designSystem';
import { UserFieldMapping } from '@/types/userImport';
import { UploadedFile, MergedTable } from '@/types/import';
import { showSuccessToast, showErrorToast } from '@/utils/toast';

interface UserFieldMapperProps {
  files: UploadedFile[];
  mergedTable: MergedTable | null;
  mappings: UserFieldMapping[];
  mode: 'simple' | 'advanced';
  useIntelligentMapping: boolean;
  onMappingUpdate: (mappings: UserFieldMapping[]) => void;
}

// 用戶系統的目標欄位 - 所有欄位都是選填的，由使用者自行決定映射
const TARGET_FIELDS = [
  { key: 'email', label: '電子郵件', required: false, type: 'email' as const },
  { key: 'name', label: '姓名', required: false, type: 'text' as const },
  { key: 'role', label: '角色', required: false, type: 'select' as const },
  { key: 'department', label: '部門', required: false, type: 'text' as const },
  { key: 'position', label: '職位', required: false, type: 'text' as const },
  { key: 'phoneNumber', label: '電話號碼', required: false, type: 'phone' as const },
];

const UserFieldMapper: React.FC<UserFieldMapperProps> = ({
  files,
  mergedTable,
  mappings,
  mode,
  useIntelligentMapping,
  onMappingUpdate,
}) => {
  const [localMappings, setLocalMappings] = useState<UserFieldMapping[]>(mappings);
  const [isProcessing, setIsProcessing] = useState(false);
  const [draggedField, setDraggedField] = useState<string | null>(null);
  const [hoveredTarget, setHoveredTarget] = useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // 取得來源欄位
  const sourceFields = mergedTable?.headers || files[0]?.headers || [];

  // 初始化映射
  useEffect(() => {
    if (localMappings.length === 0 && sourceFields.length > 0) {
      initializeMappings();
    }
  }, [sourceFields]);

  // 同步映射變更
  useEffect(() => {
    setLocalMappings(mappings);
  }, [mappings]);

  /**
   * 初始化映射
   */
  const initializeMappings = () => {
    const initialMappings: UserFieldMapping[] = TARGET_FIELDS.map(target => ({
      sourceField: '',
      targetField: target.key,
      confidence: 0,
      isRequired: target.required,
      dataType: target.type,
      method: 'manual',
    }));

    // 簡易模式：自動匹配明顯的欄位
    if (mode === 'simple') {
      autoMatchFields(initialMappings);
    } else {
      setLocalMappings(initialMappings);
      onMappingUpdate(initialMappings);
    }
  };

  /**
   * 自動匹配欄位（基於模式匹配）
   */
  const autoMatchFields = (baseMappings: UserFieldMapping[]) => {
    const patterns: Record<string, RegExp[]> = {
      email: [
        /^(email|mail|電子郵件|電郵|信箱|e-mail|郵箱|用戶郵件|使用者信箱|帳號)$/i,
        /^(user_?email|member_?email|account_?email)$/i,
      ],
      name: [
        /^(name|姓名|名字|全名|用戶名|使用者名稱|員工姓名|成員名稱|人員姓名)$/i,
        /^(full_?name|user_?name|member_?name|display_?name)$/i,
      ],
      department: [
        /^(department|dept|部門|單位|處室|科別|所屬部門|隸屬單位)$/i,
        /^(division|section|team|group)$/i,
      ],
      position: [
        /^(position|title|職位|職稱|職務|頭銜|工作職稱|職級)$/i,
        /^(job_?title|role_?title|designation)$/i,
      ],
      phoneNumber: [
        /^(phone|phoneNumber|電話|手機|聯絡電話|行動電話|聯絡方式)$/i,
        /^(mobile|cell|contact_?number|tel)$/i,
      ],
      role: [
        /^(role|角色|權限|權限等級|用戶類型|使用者類型)$/i,
        /^(permission|access_?level|user_?type|member_?type)$/i,
      ],
    };

    const updatedMappings = baseMappings.map(mapping => {
      const targetPatterns = patterns[mapping.targetField];
      if (!targetPatterns) return mapping;

      // 尋找最佳匹配
      let bestMatch: { field: string; confidence: number } | null = null;

      for (const sourceField of sourceFields) {
        for (const pattern of targetPatterns) {
          if (pattern.test(sourceField)) {
            const confidence = sourceField.toLowerCase() === mapping.targetField.toLowerCase() ? 1 : 0.9;
            if (!bestMatch || confidence > bestMatch.confidence) {
              bestMatch = { field: sourceField, confidence };
            }
          }
        }
      }

      if (bestMatch) {
        return {
          ...mapping,
          sourceField: bestMatch.field,
          confidence: bestMatch.confidence,
          method: 'pattern' as const,
        };
      }

      return mapping;
    });

    setLocalMappings(updatedMappings);
    onMappingUpdate(updatedMappings);
    
    const matchedCount = updatedMappings.filter(m => m.sourceField).length;
    if (matchedCount > 0) {
      showSuccessToast(`自動匹配了 ${matchedCount} 個欄位`);
    }
  };

  /**
   * 使用 AI 建議映射
   */
  const handleAISuggestion = async () => {
    if (!useIntelligentMapping) {
      showErrorToast('AI 映射功能未啟用');
      return;
    }

    setIsProcessing(true);
    try {
      // 這裡應該調用 UserFieldMappingEngine
      // 暫時使用模擬實現
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 模擬 AI 建議
      const aiMappings = localMappings.map(mapping => {
        // 使用更智能的匹配邏輯
        const sourceField = findBestMatch(mapping.targetField);
        return {
          ...mapping,
          sourceField: sourceField || mapping.sourceField,
          confidence: sourceField ? 0.85 : mapping.confidence,
          method: 'ai' as const,
        };
      });

      setLocalMappings(aiMappings);
      onMappingUpdate(aiMappings);
      showSuccessToast('AI 映射建議已生成');
    } catch (error) {
      console.error('AI 建議失敗:', error);
      showErrorToast('AI 建議生成失敗');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * 尋找最佳匹配（簡化版）
   */
  const findBestMatch = (targetField: string): string | null => {
    // 計算編輯距離
    const calculateSimilarity = (s1: string, s2: string): number => {
      const longer = s1.length > s2.length ? s1 : s2;
      const shorter = s1.length > s2.length ? s2 : s1;
      
      if (longer.length === 0) return 1.0;
      
      const editDistance = levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
      return (longer.length - editDistance) / longer.length;
    };

    let bestMatch: { field: string; score: number } | null = null;

    for (const sourceField of sourceFields) {
      const similarity = calculateSimilarity(targetField, sourceField);
      if (similarity > 0.6 && (!bestMatch || similarity > bestMatch.score)) {
        bestMatch = { field: sourceField, score: similarity };
      }
    }

    return bestMatch?.field || null;
  };

  /**
   * Levenshtein 編輯距離
   */
  const levenshteinDistance = (s1: string, s2: string): number => {
    const matrix: number[][] = [];

    for (let i = 0; i <= s2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= s1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= s2.length; i++) {
      for (let j = 1; j <= s1.length; j++) {
        if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[s2.length][s1.length];
  };

  /**
   * 處理欄位映射變更
   */
  const handleMappingChange = (targetField: string, sourceField: string) => {
    const updatedMappings = localMappings.map(mapping => {
      if (mapping.targetField === targetField) {
        return {
          ...mapping,
          sourceField,
          confidence: sourceField ? 0.9 : 0,
          method: 'manual' as const,
        };
      }
      // 清除其他映射到相同來源欄位的映射（避免重複）
      if (mapping.sourceField === sourceField && sourceField !== '') {
        return {
          ...mapping,
          sourceField: '',
          confidence: 0,
        };
      }
      return mapping;
    });

    setLocalMappings(updatedMappings);
    onMappingUpdate(updatedMappings);
  };

  /**
   * 清除所有映射
   */
  const handleClearAll = () => {
    const clearedMappings = localMappings.map(mapping => ({
      ...mapping,
      sourceField: '',
      confidence: 0,
      method: 'manual' as const,
    }));
    setLocalMappings(clearedMappings);
    onMappingUpdate(clearedMappings);
  };

  /**
   * 渲染映射項目
   */
  const renderMappingItem = (mapping: UserFieldMapping) => {
    const targetField = TARGET_FIELDS.find(f => f.key === mapping.targetField);
    if (!targetField) return null;

    return (
      <View key={mapping.targetField} style={styles.mappingItem}>
        <View style={styles.targetField}>
          <Text style={styles.targetFieldLabel}>
            {targetField.label}
            {targetField.required && <Text style={styles.required}> *</Text>}
          </Text>
          <Text style={styles.targetFieldKey}>{mapping.targetField}</Text>
        </View>

        <Icon
          name="arrow-forward"
          size={20}
          color={mapping.sourceField ? DesignSystem.colors.success : DesignSystem.colors.text.tertiary}
        />

        {Platform.OS === 'web' ? (
          <div style={{ position: 'relative', flex: 1, marginLeft: 16 }}>
            <select
              value={mapping.sourceField}
              onChange={(e) => handleMappingChange(mapping.targetField, e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: `1px solid ${mapping.sourceField ? DesignSystem.colors.border.light : DesignSystem.colors.border.medium}`,
                borderRadius: DesignSystem.borderRadius.sm,
                backgroundColor: DesignSystem.colors.background.surface,
                color: mapping.sourceField ? DesignSystem.colors.text.primary : DesignSystem.colors.text.tertiary,
                fontSize: 14,
                cursor: mode === 'simple' ? 'not-allowed' : 'pointer',
                outline: 'none',
                appearance: 'none',
                WebkitAppearance: 'none',
                backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23666\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                paddingRight: '36px',
              }}
              disabled={mode === 'simple'}
            >
              <option value="" style={{ color: DesignSystem.colors.text.tertiary }}>
                {mode === 'simple' ? '未映射' : '選擇欄位...'}
              </option>
              {sourceFields.map(field => {
                // 檢查此欄位是否已被其他目標欄位使用
                const isUsed = localMappings.some(m => 
                  m.targetField !== mapping.targetField && m.sourceField === field
                );
                return (
                  <option 
                    key={field} 
                    value={field}
                    disabled={isUsed}
                    style={{ 
                      color: isUsed ? DesignSystem.colors.text.tertiary : DesignSystem.colors.text.primary 
                    }}
                  >
                    {field} {isUsed ? '(已使用)' : ''}
                  </option>
                );
              })}
            </select>
            {mapping.sourceField && mapping.confidence > 0 && (
              <span style={{
                position: 'absolute',
                right: '40px',
                top: '50%',
                transform: 'translateY(-50%)',
                padding: '2px 6px',
                borderRadius: 4,
                backgroundColor: mapping.confidence > 0.8 
                  ? `${DesignSystem.colors.success}20`
                  : `${DesignSystem.colors.warning}20`,
                fontSize: 10,
                fontWeight: 600,
                color: mapping.confidence > 0.8 
                  ? DesignSystem.colors.success
                  : DesignSystem.colors.warning,
              }}>
                {Math.round(mapping.confidence * 100)}%
              </span>
            )}
          </div>
        ) : (
          <TouchableOpacity
            style={[
              styles.sourceField,
              !mapping.sourceField && styles.sourceFieldEmpty,
              hoveredTarget === mapping.targetField && styles.sourceFieldHovered,
            ]}
            onPress={() => {
              if (mode === 'simple') return;
              setOpenDropdown(openDropdown === mapping.targetField ? null : mapping.targetField);
            }}
          >
          {mapping.sourceField ? (
            <>
              <Text style={styles.sourceFieldText}>{mapping.sourceField}</Text>
              {mapping.confidence > 0 && (
                <View style={[
                  styles.confidenceBadge,
                  mapping.confidence > 0.8 && styles.confidenceBadgeHigh,
                  mapping.confidence > 0.5 && mapping.confidence <= 0.8 && styles.confidenceBadgeMedium,
                ]}>
                  <Text style={styles.confidenceText}>
                    {Math.round(mapping.confidence * 100)}%
                  </Text>
                </View>
              )}
            </>
            ) : (
              <Text style={styles.sourceFieldPlaceholder}>
                {mode === 'simple' ? '未映射' : '點擊選擇欄位'}
              </Text>
            )}
          </TouchableOpacity>
        )}

        {mode === 'advanced' && mapping.sourceField && Platform.OS !== 'web' && (
          <TouchableOpacity
            onPress={() => handleMappingChange(mapping.targetField, '')}
            style={styles.clearButton}
          >
            <Icon name="close-circle" size={20} color={DesignSystem.colors.text.tertiary} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  /**
   * 渲染可用欄位列表（進階模式）
   */
  const renderAvailableFields = () => {
    if (mode === 'simple') return null;

    const usedFields = new Set(localMappings.map(m => m.sourceField).filter(Boolean));
    const availableFields = sourceFields.filter(f => !usedFields.has(f));

    return (
      <View style={styles.availableFieldsSection}>
        <Text style={styles.sectionTitle}>可用欄位</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.availableFieldsList}>
            {availableFields.map(field => (
              <TouchableOpacity
                key={field}
                style={styles.availableField}
                onPress={() => {
                  // 找到第一個未映射的必填欄位
                  const unmappedRequired = localMappings.find(
                    m => m.isRequired && !m.sourceField
                  );
                  if (unmappedRequired) {
                    handleMappingChange(unmappedRequired.targetField, field);
                  }
                }}
              >
                <Text style={styles.availableFieldText}>{field}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 工具欄 */}
      <View style={styles.toolbar}>
        {useIntelligentMapping && (
          <TouchableOpacity
            style={[styles.toolButton, isProcessing && styles.toolButtonDisabled]}
            onPress={handleAISuggestion}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color={DesignSystem.colors.primary} />
            ) : (
              <Icon name="bulb-outline" size={20} color={DesignSystem.colors.primary} />
            )}
            <Text style={styles.toolButtonText}>AI 建議</Text>
          </TouchableOpacity>
        )}
        
        {mode === 'advanced' && (
          <>
            <TouchableOpacity
              style={styles.toolButton}
              onPress={() => autoMatchFields(localMappings)}
            >
              <Icon name="git-compare-outline" size={20} color={DesignSystem.colors.primary} />
              <Text style={styles.toolButtonText}>自動匹配</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.toolButton}
              onPress={handleClearAll}
            >
              <Icon name="trash-outline" size={20} color={DesignSystem.colors.text.secondary} />
              <Text style={styles.toolButtonText}>清除全部</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* 映射列表 */}
      <ScrollView style={styles.mappingList} showsVerticalScrollIndicator={false}>
        <View style={styles.mappingHeader}>
          <Text style={styles.mappingHeaderText}>目標欄位</Text>
          <Text style={styles.mappingHeaderText}></Text>
          <Text style={styles.mappingHeaderText}>來源欄位</Text>
        </View>
        
        {localMappings.map(renderMappingItem)}
      </ScrollView>

      {/* 可用欄位（進階模式） */}
      {renderAvailableFields()}

      {/* 統計資訊 */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Icon name="checkmark-circle" size={16} color={DesignSystem.colors.success} />
          <Text style={styles.statText}>
            已映射: {localMappings.filter(m => m.sourceField).length}/{localMappings.length}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Icon name="alert-circle" size={16} color={DesignSystem.colors.warning} />
          <Text style={styles.statText}>
            必填: {localMappings.filter(m => m.isRequired && !m.sourceField).length} 個未映射
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toolbar: {
    flexDirection: 'row',
    marginBottom: DesignSystem.spacing.lg,
    gap: DesignSystem.spacing.sm,
  },
  toolButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    backgroundColor: DesignSystem.colors.background.surface,
    borderRadius: DesignSystem.borderRadius.sm,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.light,
  },
  toolButtonDisabled: {
    opacity: 0.5,
  },
  toolButtonText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.primary,
    marginLeft: DesignSystem.spacing.xs,
  },
  mappingList: {
    flex: 1,
  },
  mappingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: DesignSystem.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light,
    marginBottom: DesignSystem.spacing.md,
  },
  mappingHeaderText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    flex: 1,
    textAlign: 'center',
  },
  mappingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: DesignSystem.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light,
  },
  targetField: {
    flex: 1,
  },
  targetFieldLabel: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary,
  },
  targetFieldKey: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.tertiary,
    marginTop: DesignSystem.spacing.xxs,
  },
  required: {
    color: DesignSystem.colors.error,
  },
  sourceField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    backgroundColor: DesignSystem.colors.background.surface,
    borderRadius: DesignSystem.borderRadius.sm,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.light,
    marginLeft: DesignSystem.spacing.md,
  },
  sourceFieldEmpty: {
    borderStyle: 'dashed',
  },
  sourceFieldHovered: {
    borderColor: DesignSystem.colors.primary,
    backgroundColor: `${DesignSystem.colors.primary}10`,
  },
  sourceFieldText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary,
    flex: 1,
  },
  sourceFieldPlaceholder: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.tertiary,
  },
  confidenceBadge: {
    paddingHorizontal: DesignSystem.spacing.xs,
    paddingVertical: 2,
    borderRadius: DesignSystem.borderRadius.xs,
    backgroundColor: DesignSystem.colors.warning + '20',
  },
  confidenceBadgeHigh: {
    backgroundColor: DesignSystem.colors.success + '20',
  },
  confidenceBadgeMedium: {
    backgroundColor: DesignSystem.colors.warning + '20',
  },
  confidenceText: {
    ...DesignSystem.typography.caption,
    fontSize: 10,
    fontWeight: '600',
  },
  clearButton: {
    marginLeft: DesignSystem.spacing.sm,
  },
  availableFieldsSection: {
    marginTop: DesignSystem.spacing.lg,
    paddingTop: DesignSystem.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: DesignSystem.colors.border.light,
  },
  sectionTitle: {
    ...DesignSystem.typography.h5,
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.md,
  },
  availableFieldsList: {
    flexDirection: 'row',
    gap: DesignSystem.spacing.sm,
  },
  availableField: {
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    backgroundColor: DesignSystem.colors.background.surface,
    borderRadius: DesignSystem.borderRadius.sm,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.medium,
  },
  availableFieldText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.primary,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: DesignSystem.spacing.lg,
    marginTop: DesignSystem.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: DesignSystem.colors.border.light,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    marginLeft: DesignSystem.spacing.xs,
  },
});

export default UserFieldMapper;