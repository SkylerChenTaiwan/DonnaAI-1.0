/**
 * 增強版批量匯入用戶 Modal
 * 完整的五階段用戶匯入流程：上傳、預覽、配置、匯入、完成
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { 
  ImportUserData,
  UserImportStage,
  UserImportConfig,
  UserImportProgress,
  UserImportResult,
  RawUserData,
  UserEditEvent,
  BatchOperationOptions,
  UserCSVParseResult
} from '@/types/userImport';
import { Organization } from '@/types/entities';
import { DesignSystem } from '@/theme/designSystem';
import { Icon } from '@/components/common/Icon';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { toast } from '@/utils/toast';

import UserImportStageIndicator from './UserImportStageIndicator';
import UserDataPreviewTable from './UserDataPreviewTable';
import { userImportService } from '@/services/users/UserImportService';
import { UserDataValidator } from '@/services/users/UserDataValidator';
import { pickDocument } from '@/utils/web-file-picker';

export interface EnhancedBulkImportModalProps {
  visible: boolean;
  organization: Organization;
  onClose: () => void;
  onImportComplete?: (result: UserImportResult) => void;
}

const CSV_TEMPLATE = `email,name,role,department,position,phoneNumber
john@example.com,張小明,user,業務部,業務專員,0912-345-678
mary@example.com,李小華,admin,管理部,經理,0987-654-321
bob@example.com,王小強,user,技術部,工程師,0923-456-789`;

/**
 * 增強版批量匯入用戶 Modal
 */
export const EnhancedBulkImportModal: React.FC<EnhancedBulkImportModalProps> = ({
  visible,
  organization,
  onClose,
  onImportComplete,
}) => {
  // 主要狀態
  const [currentStage, setCurrentStage] = useState<UserImportStage>('upload');
  const [completedStages, setCompletedStages] = useState<UserImportStage[]>([]);
  
  // 檔案和資料狀態
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [users, setUsers] = useState<ImportUserData[]>([]);
  const [importConfig, setImportConfig] = useState<UserImportConfig>({
    defaultRole: 'user',
    skipDuplicates: true,
    updateExisting: false,
    sendWelcomeEmail: true,
    generatePasswords: true,
    organizationId: organization.id
  });
  
  // 進度和結果狀態
  const [importProgress, setImportProgress] = useState<UserImportProgress>({
    isImporting: false,
    totalUsers: 0,
    processedUsers: 0,
    successCount: 0,
    errorCount: 0,
    currentUser: '',
    errors: []
  });
  const [importResult, setImportResult] = useState<UserImportResult | null>(null);
  
  // 處理狀態
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 服務實例
  const validator = useRef(new UserDataValidator()).current;

  /**
   * 重置所有狀態
   */
  const resetStates = useCallback(() => {
    setCurrentStage('upload');
    setCompletedStages([]);
    setSelectedFile(null);
    setUsers([]);
    setImportResult(null);
    setIsProcessing(false);
    setError(null);
    setImportProgress({
      isImporting: false,
      totalUsers: 0,
      processedUsers: 0,
      successCount: 0,
      errorCount: 0,
      currentUser: '',
      errors: []
    });
  }, []);

  /**
   * 關閉 Modal
   */
  const handleClose = useCallback(() => {
    if (importProgress.isImporting) {
      Alert.alert('警告', '匯入正在進行中，確定要關閉嗎？', [
        { text: '取消', style: 'cancel' },
        { text: '確定', onPress: () => {
          resetStates();
          onClose();
        }}
      ]);
    } else {
      resetStates();
      onClose();
    }
  }, [importProgress.isImporting, resetStates, onClose]);

  /**
   * 解析 CSV 檔案 - 移到 handleSelectFile 之前以避免初始化錯誤
   */
  const parseCSVFile = useCallback(async (fileUri: string): Promise<UserCSVParseResult> => {
    try {
      setIsProcessing(true);
      setError(null);
      
      const result = await pickDocument({
        type: ['text/csv', 'text/comma-separated-values'],
        multiple: false
      });

      if (result.canceled || !result.assets?.[0]) {
        setIsProcessing(false);
        return;
      }

      const file = result.assets[0];
      setSelectedFile(file);
      
      // 解析 CSV 檔案
      const parseResult = await parseCSVFile(file.uri);
      
      if (parseResult.data.length === 0) {
        throw new Error('CSV 檔案沒有有效資料');
      }
      
      setUsers(parseResult.data);
      
      // 標記上傳階段完成，進入預覽階段
      setCompletedStages(['upload']);
      setCurrentStage('preview');
      
      toast.success(`成功解析 ${parseResult.data.length} 筆用戶資料`);
    } catch (error) {
      console.error('選擇檔案失敗:', error);
      const errorMessage = error instanceof Error ? error.message : '選擇檔案失敗';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [parseCSVFile]);

  /**
   * 選擇 CSV 檔案
   */
  const handleSelectFile = useCallback(async () => {
    try {
      // 讀取檔案內容
      let csvText: string;
      
      if (Platform.OS === 'web') {
        // Web 平台，fileUri 是 data URL
        const response = await fetch(fileUri);
        csvText = await response.text();
      } else {
        // Native 平台
        const response = await fetch(fileUri);
        csvText = await response.text();
      }
      
      // 解析 CSV
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) {
        throw new Error('CSV 檔案格式不正確，至少需要標題行和一行資料');
      }
      
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      // 檢查必要的欄位
      if (!headers.includes('email')) {
        throw new Error('CSV 檔案必須包含 email 欄位');
      }
      if (!headers.includes('name')) {
        throw new Error('CSV 檔案必須包含 name 欄位');
      }
      
      // 解析資料行
      const rawUsers: RawUserData[] = lines.slice(1).map((line) => {
        const values = line.split(',').map(v => v.trim());
        const row: RawUserData = {};
        
        headers.forEach((header, i) => {
          const value = values[i] || '';
          
          // 映射常見的欄位名稱變體
          switch (header) {
            case 'email':
            case 'e-mail':
            case 'mail':
              row.email = value;
              break;
            case 'name':
            case 'fullname':
            case 'full_name':
            case 'username':
              row.name = value;
              break;
            case 'role':
            case 'permission':
            case 'level':
              row.role = value;
              break;
            case 'department':
            case 'dept':
            case 'division':
              row.department = value;
              break;
            case 'position':
            case 'title':
            case 'job':
            case 'jobtitle':
            case 'job_title':
              row.position = value;
              row.title = value; // 備用欄位
              break;
            case 'phone':
            case 'phonenumber':
            case 'phone_number':
            case 'mobile':
            case 'tel':
              row.phoneNumber = value;
              row.phone = value; // 備用欄位
              break;
            default:
              row[header] = value;
          }
        });
        
        return row;
      });
      
      // 驗證並轉換資料
      const validatedUsers = validator.validateBatch(rawUsers);
      
      return {
        data: validatedUsers,
        errors: [],
        totalRows: rawUsers.length,
        validRows: validatedUsers.filter(u => u.isValid).length,
        invalidRows: validatedUsers.filter(u => !u.isValid).length,
        duplicateCount: validatedUsers.filter(u => u.isDuplicate).length
      };
    } catch (error) {
      throw new Error(`解析 CSV 檔案失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  }, [validator, userImportService]);

  /**
   * 處理用戶編輯
   */
  const handleUserEdit = useCallback((event: UserEditEvent) => {
    setUsers(prevUsers => {
      const newUsers = [...prevUsers];
      const userIndex = newUsers.findIndex(u => u.id === event.userId);
      
      if (userIndex !== -1) {
        // 更新用戶資料
        const updatedUser = {
          ...newUsers[userIndex],
          [event.field]: event.value
        };
        
        // 重新驗證
        const revalidatedUser = validator.revalidateUser(updatedUser, newUsers);
        newUsers[userIndex] = revalidatedUser;
      }
      
      return newUsers;
    });
  }, [validator]);

  /**
   * 處理批量操作
   */
  const handleBatchOperation = useCallback((operation: BatchOperationOptions) => {
    setUsers(prevUsers => {
      switch (operation.operation) {
        case 'setRole':
          return userImportService.batchSetRole(
            prevUsers,
            operation.value as 'user' | 'admin',
            operation.targetIds
          );
        case 'setDepartment':
          return userImportService.batchSetDepartment(
            prevUsers,
            operation.value as string,
            operation.targetIds
          );
        case 'toggleSelection':
          return userImportService.batchToggleSelection(
            prevUsers,
            operation.value === 'true',
            operation.targetIds
          );
        case 'clearErrors':
          // 清除錯誤的實現可能需要重新驗證
          return prevUsers.map(user => {
            if (operation.targetIds?.includes(user.id)) {
              return validator.revalidateUser(user, prevUsers);
            }
            return user;
          });
        default:
          return prevUsers;
      }
    });
  }, [validator]);

  /**
   * 處理用戶選擇
   */
  const handleUserSelect = useCallback((userId: string, selected: boolean) => {
    handleBatchOperation({
      operation: 'toggleSelection',
      value: String(selected),
      targetIds: [userId]
    });
  }, [handleBatchOperation]);

  /**
   * 全選/取消全選
   */
  const handleSelectAll = useCallback((selected: boolean) => {
    handleBatchOperation({
      operation: 'toggleSelection',
      value: String(selected)
    });
  }, [handleBatchOperation]);

  /**
   * 進入配置階段
   */
  const handleEnterConfigStage = useCallback(async () => {
    setIsProcessing(true);
    
    try {
      // 檢查是否有現有用戶（重複檢查）
      const updatedUsers = await userImportService.checkExistingUsers(users);
      setUsers(updatedUsers);
      
      // 標記預覽階段完成，進入配置階段
      setCompletedStages(['upload', 'preview']);
      setCurrentStage('configure');
    } catch (error) {
      console.error('檢查現有用戶失敗:', error);
      toast.error('檢查現有用戶時發生錯誤');
    } finally {
      setIsProcessing(false);
    }
  }, [users]);

  /**
   * 開始匯入
   */
  const handleStartImport = useCallback(async () => {
    // 驗證配置
    const configValidation = userImportService.validateImportConfig(importConfig);
    if (!configValidation.isValid) {
      Alert.alert('配置錯誤', configValidation.errors.join('\n'));
      return;
    }

    // 檢查是否有選中的用戶
    const selectedUsers = users.filter(u => u.isSelected);
    if (selectedUsers.length === 0) {
      Alert.alert('提示', '請選擇要匯入的用戶');
      return;
    }

    // 標記配置階段完成，進入匯入階段
    setCompletedStages(['upload', 'preview', 'configure']);
    setCurrentStage('importing');

    try {
      // 開始匯入
      const result = await userImportService.importUsers(
        users,
        importConfig,
        setImportProgress
      );

      setImportResult(result);
      
      // 標記匯入階段完成，進入完成階段
      setCompletedStages(['upload', 'preview', 'configure', 'importing']);
      setCurrentStage('complete');

      if (result.success) {
        toast.success(`成功匯入 ${result.imported} 個用戶`);
      } else {
        toast.error(`匯入完成，但有 ${result.failed} 個用戶失敗`);
      }

      onImportComplete?.(result);
    } catch (error) {
      console.error('匯入失敗:', error);
      setError(error instanceof Error ? error.message : '匯入失敗');
      toast.error('匯入失敗');
    }
  }, [users, importConfig, onImportComplete]);

  /**
   * 下載 CSV 範本
   */
  const handleDownloadTemplate = useCallback(() => {
    if (Platform.OS === 'web') {
      // Web 平台，創建下載連結
      const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = '用戶匯入範本.csv';
      link.click();
    } else {
      // Native 平台，顯示範本內容
      Alert.alert(
        'CSV 範本格式',
        'CSV 檔案應包含以下欄位：\n\n' +
        '• email (必填): 用戶電子郵件\n' +
        '• name (必填): 用戶姓名\n' +
        '• role (選填): user 或 admin\n' +
        '• department (選填): 部門\n' +
        '• position (選填): 職位\n' +
        '• phoneNumber (選填): 電話號碼\n\n' +
        '範例：\n' + CSV_TEMPLATE,
        [{ text: '知道了', style: 'default' }]
      );
    }
  }, []);

  /**
   * 獲取統計資訊
   */
  const stats = userImportService.getImportStatistics(users);

  /**
   * 渲染階段內容
   */
  const renderStageContent = () => {
    switch (currentStage) {
      case 'upload':
        return (
          <View style={styles.stageContent}>
            <View style={styles.uploadArea}>
              <Icon name="cloud-upload-outline" size={64} color={DesignSystem.colors.primary} />
              <Text style={styles.uploadTitle}>選擇 CSV 檔案</Text>
              <Text style={styles.uploadDesc}>
                上傳包含用戶資料的 CSV 檔案，系統將自動解析和驗證
              </Text>
              
              {error && (
                <View style={styles.errorContainer}>
                  <Icon name="alert-circle-outline" size={20} color={DesignSystem.colors.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
              
              <Button
                title="選擇檔案"
                onPress={handleSelectFile}
                disabled={isProcessing}
                style={styles.uploadButton}
              />
              
              <TouchableOpacity onPress={handleDownloadTemplate} style={styles.templateLink}>
                <Icon name="download-outline" size={16} color={DesignSystem.colors.primary} />
                <Text style={styles.templateText}>下載 CSV 範本</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'preview':
        return (
          <View style={styles.stageContent}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>
                檔案：{selectedFile?.name}
              </Text>
            </View>

            <UserDataPreviewTable
              users={users}
              onUserEdit={handleUserEdit}
              onBatchOperation={handleBatchOperation}
              onUserSelect={handleUserSelect}
              onSelectAll={handleSelectAll}
              stats={stats}
              showSelection={true}
              maxHeight={400}
            />

            <View style={styles.stageActions}>
              <Button
                title="重新選擇檔案"
                onPress={() => {
                  setCurrentStage('upload');
                  setCompletedStages([]);
                  setSelectedFile(null);
                  setUsers([]);
                }}
                variant="outline"
                style={styles.actionButton}
              />
              <Button
                title="繼續"
                onPress={handleEnterConfigStage}
                disabled={users.filter(u => u.isSelected).length === 0 || isProcessing}
                style={styles.actionButton}
              />
            </View>
          </View>
        );

      case 'configure':
        return (
          <View style={styles.stageContent}>
            <Text style={styles.configTitle}>匯入設定</Text>
            
            <View style={styles.configSection}>
              <Text style={styles.configSectionTitle}>基本設定</Text>
              
              <View style={styles.configRow}>
                <Text style={styles.configLabel}>預設角色</Text>
                <View style={styles.roleButtons}>
                  <TouchableOpacity
                    onPress={() => setImportConfig(prev => ({ ...prev, defaultRole: 'user' }))}
                    style={[
                      styles.roleButton,
                      importConfig.defaultRole === 'user' && styles.roleButtonActive
                    ]}
                  >
                    <Text style={[
                      styles.roleButtonText,
                      importConfig.defaultRole === 'user' && styles.roleButtonTextActive
                    ]}>一般用戶</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setImportConfig(prev => ({ ...prev, defaultRole: 'admin' }))}
                    style={[
                      styles.roleButton,
                      importConfig.defaultRole === 'admin' && styles.roleButtonActive
                    ]}
                  >
                    <Text style={[
                      styles.roleButtonText,
                      importConfig.defaultRole === 'admin' && styles.roleButtonTextActive
                    ]}>管理員</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.configSection}>
              <Text style={styles.configSectionTitle}>重複處理</Text>
              
              <TouchableOpacity
                onPress={() => setImportConfig(prev => ({ ...prev, skipDuplicates: !prev.skipDuplicates }))}
                style={styles.checkboxRow}
              >
                <View style={[
                  styles.checkbox,
                  importConfig.skipDuplicates && styles.checkboxChecked
                ]}>
                  {importConfig.skipDuplicates && (
                    <Icon name="checkmark" size={14} color={DesignSystem.colors.text.inverse} />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>跳過重複用戶</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => setImportConfig(prev => ({ ...prev, updateExisting: !prev.updateExisting }))}
                style={styles.checkboxRow}
              >
                <View style={[
                  styles.checkbox,
                  importConfig.updateExisting && styles.checkboxChecked
                ]}>
                  {importConfig.updateExisting && (
                    <Icon name="checkmark" size={14} color={DesignSystem.colors.text.inverse} />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>更新現有用戶資料</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.configSection}>
              <Text style={styles.configSectionTitle}>其他選項</Text>
              
              <TouchableOpacity
                onPress={() => setImportConfig(prev => ({ ...prev, sendWelcomeEmail: !prev.sendWelcomeEmail }))}
                style={styles.checkboxRow}
              >
                <View style={[
                  styles.checkbox,
                  importConfig.sendWelcomeEmail && styles.checkboxChecked
                ]}>
                  {importConfig.sendWelcomeEmail && (
                    <Icon name="checkmark" size={14} color={DesignSystem.colors.text.inverse} />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>發送歡迎郵件</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => setImportConfig(prev => ({ ...prev, generatePasswords: !prev.generatePasswords }))}
                style={styles.checkboxRow}
              >
                <View style={[
                  styles.checkbox,
                  importConfig.generatePasswords && styles.checkboxChecked
                ]}>
                  {importConfig.generatePasswords && (
                    <Icon name="checkmark" size={14} color={DesignSystem.colors.text.inverse} />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>自動生成密碼</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.stageActions}>
              <Button
                title="返回"
                onPress={() => {
                  setCurrentStage('preview');
                  setCompletedStages(['upload']);
                }}
                variant="outline"
                style={styles.actionButton}
              />
              <Button
                title="開始匯入"
                onPress={handleStartImport}
                style={styles.actionButton}
              />
            </View>
          </View>
        );

      case 'importing':
        return (
          <View style={styles.stageContent}>
            <View style={styles.importingContainer}>
              <LoadingSpinner size="large" />
              <Text style={styles.importingTitle}>正在匯入用戶...</Text>
              
              {importProgress.currentUser && (
                <Text style={styles.importingCurrent}>
                  {importProgress.currentUser}
                </Text>
              )}
              
              <View style={styles.progressStats}>
                <Text style={styles.progressText}>
                  進度：{importProgress.processedUsers}/{importProgress.totalUsers}
                </Text>
                <Text style={styles.progressText}>
                  成功：{importProgress.successCount} | 失敗：{importProgress.errorCount}
                </Text>
              </View>
              
              {importProgress.errors.length > 0 && (
                <View style={styles.importErrors}>
                  <Text style={styles.importErrorsTitle}>錯誤資訊：</Text>
                  {importProgress.errors.slice(-3).map((error, index) => (
                    <Text key={index} style={styles.importErrorItem}>
                      • {error.error}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          </View>
        );

      case 'complete':
        return (
          <View style={styles.stageContent}>
            <View style={styles.resultContainer}>
              <Icon
                name={importResult?.success ? "checkmark-circle-outline" : "alert-circle-outline"}
                size={64}
                color={importResult?.success ? DesignSystem.colors.success : DesignSystem.colors.warning}
              />
              
              <Text style={styles.resultTitle}>
                匯入{importResult?.success ? '完成' : '部分完成'}
              </Text>
              
              {importResult && (
                <View style={styles.resultStats}>
                  <View style={styles.resultStatItem}>
                    <Text style={styles.resultStatNumber}>{importResult.imported}</Text>
                    <Text style={styles.resultStatLabel}>成功匯入</Text>
                  </View>
                  <View style={styles.resultStatItem}>
                    <Text style={[styles.resultStatNumber, styles.resultStatNumberError]}>
                      {importResult.failed}
                    </Text>
                    <Text style={styles.resultStatLabel}>匯入失敗</Text>
                  </View>
                  <View style={styles.resultStatItem}>
                    <Text style={[styles.resultStatNumber, styles.resultStatNumberSkipped]}>
                      {importResult.skipped}
                    </Text>
                    <Text style={styles.resultStatLabel}>跳過</Text>
                  </View>
                </View>
              )}
              
              {importResult?.errors && importResult.errors.length > 0 && (
                <View style={styles.resultErrors}>
                  <Text style={styles.resultErrorsTitle}>錯誤詳情：</Text>
                  <ScrollView style={styles.resultErrorsList} showsVerticalScrollIndicator={false}>
                    {importResult.errors.map((error, index) => (
                      <Text key={index} style={styles.resultErrorItem}>
                        第 {error.row} 行: {error.error}
                      </Text>
                    ))}
                  </ScrollView>
                </View>
              )}
              
              {importResult?.warnings && importResult.warnings.length > 0 && (
                <View style={styles.resultWarnings}>
                  <Text style={styles.resultWarningsTitle}>提醒：</Text>
                  {importResult.warnings.map((warning, index) => (
                    <Text key={index} style={styles.resultWarningItem}>
                      • {warning}
                    </Text>
                  ))}
                </View>
              )}
              
              <Button
                title="完成"
                onPress={handleClose}
                style={styles.completeButton}
              />
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              disabled={importProgress.isImporting}
            >
              <Icon name="close" size={24} color={DesignSystem.colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>增強版用戶匯入</Text>
          </View>
          <Text style={styles.organizationName}>{organization.name}</Text>
        </View>

        {/* Stage Indicator */}
        <UserImportStageIndicator
          currentStage={currentStage}
          completedStages={completedStages}
        />

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderStageContent()}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingVertical: DesignSystem.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  closeButton: {
    marginRight: DesignSystem.spacing.sm,
  },
  headerTitle: {
    ...DesignSystem.typography.h3,
    color: DesignSystem.colors.text.primary,
  },
  organizationName: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.secondary,
  },
  content: {
    flex: 1,
  },
  stageContent: {
    flex: 1,
    padding: DesignSystem.spacing.lg,
  },
  
  // Upload Stage
  uploadArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: DesignSystem.colors.border.light,
    borderStyle: 'dashed',
    borderRadius: DesignSystem.borderRadius.lg,
    padding: DesignSystem.spacing.xl,
  },
  uploadTitle: {
    ...DesignSystem.typography.h2,
    color: DesignSystem.colors.text.primary,
    marginTop: DesignSystem.spacing.lg,
    marginBottom: DesignSystem.spacing.md,
  },
  uploadDesc: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.secondary,
    textAlign: 'center',
    marginBottom: DesignSystem.spacing.xl,
    lineHeight: 24,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${DesignSystem.colors.error}10`,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borderRadius.sm,
    marginBottom: DesignSystem.spacing.lg,
  },
  errorText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.error,
    marginLeft: DesignSystem.spacing.xs,
    flex: 1,
  },
  uploadButton: {
    marginBottom: DesignSystem.spacing.md,
    minWidth: 120,
  },
  templateLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSystem.spacing.xs,
  },
  templateText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.primary,
  },

  // Preview Stage
  previewHeader: {
    marginBottom: DesignSystem.spacing.lg,
  },
  previewTitle: {
    ...DesignSystem.typography.h4,
    color: DesignSystem.colors.text.primary,
  },

  // Configure Stage
  configTitle: {
    ...DesignSystem.typography.h3,
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.lg,
  },
  configSection: {
    marginBottom: DesignSystem.spacing.lg,
  },
  configSectionTitle: {
    ...DesignSystem.typography.h5,
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.md,
  },
  configRow: {
    marginBottom: DesignSystem.spacing.md,
  },
  configLabel: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.sm,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: DesignSystem.spacing.sm,
  },
  roleButton: {
    flex: 1,
    paddingVertical: DesignSystem.spacing.sm,
    paddingHorizontal: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.sm,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.medium,
    backgroundColor: DesignSystem.colors.background.surface,
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: DesignSystem.colors.primary,
    borderColor: DesignSystem.colors.primary,
  },
  roleButtonText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary,
  },
  roleButtonTextActive: {
    color: DesignSystem.colors.text.inverse,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: DesignSystem.colors.border.medium,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DesignSystem.colors.background.primary,
    marginRight: DesignSystem.spacing.sm,
  },
  checkboxChecked: {
    backgroundColor: DesignSystem.colors.primary,
    borderColor: DesignSystem.colors.primary,
  },
  checkboxLabel: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary,
    flex: 1,
  },

  // Importing Stage
  importingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  importingTitle: {
    ...DesignSystem.typography.h3,
    color: DesignSystem.colors.text.primary,
    marginTop: DesignSystem.spacing.lg,
    marginBottom: DesignSystem.spacing.md,
  },
  importingCurrent: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.secondary,
    textAlign: 'center',
    marginBottom: DesignSystem.spacing.lg,
  },
  progressStats: {
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.lg,
  },
  progressText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.xs,
  },
  importErrors: {
    width: '100%',
    maxWidth: 300,
  },
  importErrorsTitle: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.error,
    fontWeight: '600',
    marginBottom: DesignSystem.spacing.xs,
  },
  importErrorItem: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.error,
    marginBottom: 2,
  },

  // Complete Stage
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultTitle: {
    ...DesignSystem.typography.h2,
    color: DesignSystem.colors.text.primary,
    marginTop: DesignSystem.spacing.lg,
    marginBottom: DesignSystem.spacing.lg,
  },
  resultStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 300,
    marginBottom: DesignSystem.spacing.lg,
  },
  resultStatItem: {
    alignItems: 'center',
  },
  resultStatNumber: {
    ...DesignSystem.typography.h3,
    color: DesignSystem.colors.success,
    fontWeight: '600',
  },
  resultStatNumberError: {
    color: DesignSystem.colors.error,
  },
  resultStatNumberSkipped: {
    color: DesignSystem.colors.warning,
  },
  resultStatLabel: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    marginTop: DesignSystem.spacing.xxs,
  },
  resultErrors: {
    width: '100%',
    maxWidth: 400,
    marginBottom: DesignSystem.spacing.lg,
  },
  resultErrorsTitle: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.error,
    fontWeight: '600',
    marginBottom: DesignSystem.spacing.sm,
  },
  resultErrorsList: {
    maxHeight: 150,
  },
  resultErrorItem: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.error,
    marginBottom: DesignSystem.spacing.xxs,
  },
  resultWarnings: {
    width: '100%',
    maxWidth: 400,
    marginBottom: DesignSystem.spacing.lg,
  },
  resultWarningsTitle: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.warning,
    fontWeight: '600',
    marginBottom: DesignSystem.spacing.sm,
  },
  resultWarningItem: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.warning,
    marginBottom: DesignSystem.spacing.xxs,
  },
  completeButton: {
    minWidth: 120,
  },

  // Common
  stageActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: DesignSystem.spacing.xl,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: DesignSystem.spacing.xs,
  },
});

export default EnhancedBulkImportModal;