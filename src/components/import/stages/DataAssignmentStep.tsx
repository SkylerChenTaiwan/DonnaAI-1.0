/**
 * 資料分配步驟元件
 * 匯入精靈的第四步：分配資料給特定用戶
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  Platform
} from 'react-native';
import { Button } from '@/components/common/Button';
import { MaterialIcon } from '@/components/common/MaterialIcon';
import { DesignSystem } from '@/theme/designSystem';
import {
  ImportAssignmentConfig,
  AssignmentStrategy,
  AssignmentPreview,
  AssignmentValidation
} from '@/types/assignment';
import { DatabaseType } from '@/types/import';
import { User } from '@/types/user';
import UserSelector from '../assignment/UserSelector';
import AssignmentPreviewComponent from '../assignment/AssignmentPreview';
import AssignmentStrategySelector from '../assignment/AssignmentStrategySelector';
import { AssignmentEngine } from '@/services/import/AssignmentEngine';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { useOrganization } from '@/hooks/useOrganization';

interface DataAssignmentStepProps {
  data: any[];
  targetDatabase: DatabaseType;
  organizationId: string;
  currentUserId: string;
  onAssignmentChange: (config: ImportAssignmentConfig | undefined) => void;
  onSkipAssignment?: (skip: boolean) => void;
}

const DataAssignmentStep: React.FC<DataAssignmentStepProps> = ({
  data,
  targetDatabase,
  organizationId,
  currentUserId,
  onAssignmentChange,
  onSkipAssignment
}) => {
  const colors = DesignSystem.colors;
  const { organizationUsers, loading: loadingUsers } = useOrganization();
  
  const [strategy, setStrategy] = useState<AssignmentStrategy>('single_user');
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [csvColumn, setCsvColumn] = useState<string>('');
  const [defaultAssignee, setDefaultAssignee] = useState<string>('');
  const [skipUnassigned, setSkipUnassigned] = useState(false);
  const [skipAssignment, setSkipAssignment] = useState(false);
  
  const [preview, setPreview] = useState<AssignmentPreview[]>([]);
  const [validation, setValidation] = useState<AssignmentValidation | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const [assignmentEngine, setAssignmentEngine] = useState<AssignmentEngine | null>(null);

  // 初始化分配引擎
  useEffect(() => {
    const initEngine = async () => {
      const engine = new AssignmentEngine(organizationId);
      await engine.initialize();
      setAssignmentEngine(engine);
    };
    
    initEngine();
  }, [organizationId]);

  // 更新分配配置
  useEffect(() => {
    if (skipAssignment) {
      onAssignmentChange(undefined);
      if (onSkipAssignment) {
        onSkipAssignment(true);
      }
      return;
    }

    const config: ImportAssignmentConfig = {
      strategy,
      skipUnassigned,
      matchingStrategy: 'smart'
    };

    switch (strategy) {
      case 'single_user':
        if (selectedUsers.length > 0) {
          config.assigneeId = selectedUsers[0].id;
        }
        break;
      
      case 'round_robin':
        config.assigneeIds = selectedUsers.map(u => u.id);
        break;
      
      case 'csv_column':
        config.csvColumn = csvColumn;
        config.defaultAssignee = defaultAssignee;
        break;
    }

    onAssignmentChange(config);
    
    if (onSkipAssignment) {
      onSkipAssignment(false);
    }
  }, [strategy, selectedUsers, csvColumn, defaultAssignee, skipUnassigned, skipAssignment]);

  // 生成預覽
  const generatePreview = useCallback(async () => {
    if (!assignmentEngine || skipAssignment) return;

    setLoading(true);
    try {
      const config: ImportAssignmentConfig = {
        strategy,
        skipUnassigned,
        matchingStrategy: 'smart'
      };

      switch (strategy) {
        case 'single_user':
          if (selectedUsers.length === 0) {
            showErrorToast('請選擇一個用戶');
            setLoading(false);
            return;
          }
          config.assigneeId = selectedUsers[0].id;
          break;
        
        case 'round_robin':
          if (selectedUsers.length === 0) {
            showErrorToast('請選擇至少一個用戶');
            setLoading(false);
            return;
          }
          config.assigneeIds = selectedUsers.map(u => u.id);
          break;
        
        case 'csv_column':
          if (!csvColumn) {
            showErrorToast('請選擇 CSV 欄位');
            setLoading(false);
            return;
          }
          config.csvColumn = csvColumn;
          config.defaultAssignee = defaultAssignee;
          break;
      }

      // 生成預覽
      const previewResult = await assignmentEngine.generatePreview(data, config);
      setPreview(previewResult);

      // 驗證分配
      const validationResult = await assignmentEngine.validateAssignment(data, config);
      setValidation(validationResult);

      setShowPreview(true);
      
      if (validationResult.warnings.length > 0) {
        showErrorToast(`注意：${validationResult.warnings[0].message}`);
      } else {
        showSuccessToast('分配預覽已生成');
      }
    } catch (error: any) {
      console.error('生成預覽失敗:', error);
      showErrorToast(error.message || '生成預覽失敗');
    } finally {
      setLoading(false);
    }
  }, [assignmentEngine, data, strategy, selectedUsers, csvColumn, defaultAssignee, skipUnassigned, skipAssignment]);

  // 切換跳過分配
  const handleToggleSkip = (value: boolean) => {
    setSkipAssignment(value);
    if (value) {
      setShowPreview(false);
      setPreview([]);
      setValidation(null);
    }
  };

  // 渲染統計資訊
  const renderStatistics = () => {
    if (!validation) return null;

    const { statistics } = validation;
    const assignmentRate = (statistics.assignableRows / statistics.totalRows) * 100;

    return (
      <View style={[styles.statsCard, { backgroundColor: colors.gray50 }]}>
        <Text style={[styles.statsTitle, { color: colors.text }]}>
          分配統計
        </Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.gray500 }]}>
              總資料數
            </Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {statistics.totalRows}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.gray500 }]}>
              可分配
            </Text>
            <Text style={[styles.statValue, { color: colors.success }]}>
              {statistics.assignableRows}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.gray500 }]}>
              未分配
            </Text>
            <Text style={[styles.statValue, { color: colors.error }]}>
              {statistics.unassignedRows}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.gray500 }]}>
              分配率
            </Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {assignmentRate.toFixed(1)}%
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // 渲染警告訊息
  const renderWarnings = () => {
    if (!validation || validation.warnings.length === 0) return null;

    return (
      <View style={[styles.warningsCard, { backgroundColor: colors.warning + '10' }]}>
        <View style={styles.warningHeader}>
          <MaterialIcon name="warning" size={20} color={colors.warning} />
          <Text style={[styles.warningTitle, { color: colors.warning }]}>
            注意事項
          </Text>
        </View>
        {validation.warnings.map((warning, index) => (
          <Text 
            key={index} 
            style={[styles.warningText, { color: colors.gray700 }]}
          >
            • {warning.message}
          </Text>
        ))}
      </View>
    );
  };

  if (loadingUsers) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.gray500 }]}>
          載入用戶資料中...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 跳過分配選項 */}
      <View style={[styles.skipSection, { backgroundColor: colors.gray50 }]}>
        <View style={styles.skipContent}>
          <Text style={[styles.skipLabel, { color: colors.text }]}>
            跳過資料分配
          </Text>
          <Text style={[styles.skipDescription, { color: colors.gray500 }]}>
            資料將分配給匯入者（您）
          </Text>
        </View>
        <Switch
          value={skipAssignment}
          onValueChange={handleToggleSkip}
          trackColor={{ false: colors.gray200, true: colors.primary }}
          thumbColor={colors.white}
        />
      </View>

      {!skipAssignment && (
        <>
          {/* 分配策略選擇 */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              選擇分配策略
            </Text>
            <AssignmentStrategySelector
              strategy={strategy}
              onStrategyChange={setStrategy}
              dataCount={data.length}
            />
          </View>

          {/* 策略配置 */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              策略配置
            </Text>
            
            {(strategy === 'single_user' || strategy === 'round_robin') && (
              <UserSelector
                organizationId={organizationId}
                currentUserId={currentUserId}
                multiple={strategy === 'round_robin'}
                selectedUsers={selectedUsers}
                onSelection={setSelectedUsers}
                filterByRole={['salesperson', 'manager']}
              />
            )}

            {strategy === 'csv_column' && (
              <View style={styles.csvConfig}>
                <Text style={[styles.fieldLabel, { color: colors.gray700 }]}>
                  選擇負責人欄位
                </Text>
                <View style={[styles.selectBox, { borderColor: colors.gray200 }]}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {Object.keys(data[0] || {}).map(column => (
                      <TouchableOpacity
                        key={column}
                        style={[
                          styles.columnOption,
                          { 
                            backgroundColor: csvColumn === column 
                              ? colors.primary 
                              : colors.gray100,
                            borderColor: csvColumn === column 
                              ? colors.primary 
                              : colors.gray200
                          }
                        ]}
                        onPress={() => setCsvColumn(column)}
                      >
                        <Text
                          style={[
                            styles.columnText,
                            { 
                              color: csvColumn === column 
                                ? colors.white 
                                : colors.text 
                            }
                          ]}
                        >
                          {column}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <Text style={[styles.fieldLabel, { color: colors.gray700, marginTop: 16 }]}>
                  預設負責人（找不到匹配時）
                </Text>
                <UserSelector
                  organizationId={organizationId}
                  currentUserId={currentUserId}
                  multiple={false}
                  selectedUsers={defaultAssignee ? [{ id: defaultAssignee } as User] : []}
                  onSelection={(users) => setDefaultAssignee(users[0]?.id || '')}
                  filterByRole={['salesperson', 'manager']}
                />
              </View>
            )}
          </View>

          {/* 額外選項 */}
          <View style={styles.section}>
            <View style={styles.optionRow}>
              <Text style={[styles.optionLabel, { color: colors.text }]}>
                跳過無法分配的資料
              </Text>
              <Switch
                value={skipUnassigned}
                onValueChange={setSkipUnassigned}
                trackColor={{ false: colors.gray200, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
          </View>

          {/* 生成預覽按鈕 */}
          <Button
            variant="primary"
            style={styles.previewButton}
            onPress={generatePreview}
            disabled={loading}
            loading={loading}
            icon={!loading && <MaterialIcon name="preview" size={20} color={colors.white} />}
            iconPosition="left"
            title="生成分配預覽"
          />

          {/* 預覽結果 */}
          {showPreview && preview.length > 0 && (
            <>
              {renderStatistics()}
              {renderWarnings()}
              
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  分配預覽
                </Text>
                <AssignmentPreviewComponent
                  preview={preview}
                  data={data}
                  onAdjustment={(adjustments) => {
                    console.log('分配調整:', adjustments);
                    // TODO: 實作分配調整邏輯
                  }}
                />
              </View>
            </>
          )}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14
  },
  skipSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20
  },
  skipContent: {
    flex: 1
  },
  skipLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4
  },
  skipDescription: {
    fontSize: 12
  },
  section: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12
  },
  csvConfig: {
    marginTop: 8
  },
  fieldLabel: {
    fontSize: 14,
    marginBottom: 8
  },
  selectBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8
  },
  columnOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    marginRight: 8
  },
  columnText: {
    fontSize: 14
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8
  },
  optionLabel: {
    fontSize: 14
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 20
  },
  previewButtonText: {
    fontSize: 16,
    fontWeight: '600'
  },
  statsCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  statItem: {
    width: '50%',
    marginBottom: 12
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600'
  },
  warningsCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600'
  },
  warningText: {
    fontSize: 12,
    lineHeight: 18,
    marginLeft: 28
  }
});

export default DataAssignmentStep;