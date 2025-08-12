import { Icon } from '../../../../components/common/Icon';
/**
 * 步驟 3: 用戶匯入（含 Google 整合）
 * Step 3: User Import with Google Integration
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  Platform,
} from 'react-native';
// Icon import removed - using platform-specific Icon component;
import { DesignSystem } from '@/theme/designSystem';
import {
  StepProps,
  UserImportData,
  UserData,
  GoogleAuthConfig,
  PasswordStrategy,
} from '@/types/onboarding';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { withAlpha } from '@/utils/colorUtils';

const UserImportStep: React.FC<StepProps> = ({
  data,
  onChange,
  onValidate,
  isActive,
}) => {
  const colors = DesignSystem.colors;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 初始化資料
  const [formData, setFormData] = useState<UserImportData>({
    importMethod: 'csv',
    users: [],
    googleAuthConfig: {
      enabled: false,
      domain: '',
      autoCreateUsers: true,
      syncGroups: false,
      groupMappings: [],
    },
    passwordStrategy: {
      type: 'auto-generate',
      requireChange: true,
    },
    sendWelcomeEmail: true,
    ...data,
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [manualInput, setManualInput] = useState({
    email: '',
    name: '',
    role: 'user',
    department: '',
  });

  // 當資料變更時通知父元件
  useEffect(() => {
    if (isActive) {
      onChange(formData);
    }
  }, [formData, isActive]);

  // 處理檔案上傳
  const handleFileUpload = async (event: any) => {
    const file = Platform.OS === 'web' 
      ? event.target.files?.[0]
      : event.nativeEvent?.file;
    
    if (!file) return;
    
    setIsProcessing(true);
    
    try {
      const text = await file.text();
      const users = parseCSV(text);
      
      setFormData(prev => ({
        ...prev,
        users: [...prev.users, ...users],
      }));
      
      showSuccessToast(`成功匯入 ${users.length} 個用戶`);
    } catch (error) {
      console.error('檔案處理失敗:', error);
      showErrorToast('檔案格式不正確');
    } finally {
      setIsProcessing(false);
    }
  };

  // 解析 CSV
  const parseCSV = (text: string): UserData[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const users: UserData[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const user: any = {};
      
      headers.forEach((header, index) => {
        const value = values[index];
        
        // 智能欄位映射
        if (header.includes('email') || header.includes('mail')) {
          user.email = value;
        } else if (header.includes('name') || header.includes('姓名')) {
          user.name = value;
        } else if (header.includes('role') || header.includes('角色')) {
          user.role = value;
        } else if (header.includes('department') || header.includes('部門')) {
          user.department = value;
        } else if (header.includes('phone') || header.includes('電話')) {
          user.phone = value;
        }
      });
      
      if (user.email && user.name) {
        users.push({
          email: user.email,
          name: user.name,
          role: user.role || 'user',
          department: user.department,
          phone: user.phone,
        });
      }
    }
    
    return users;
  };

  // 處理 JSON 輸入
  const handleJSONSubmit = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      const users = Array.isArray(parsed) ? parsed : [parsed];
      
      const validUsers = users.filter(u => u.email && u.name).map(u => ({
        email: u.email,
        name: u.name,
        role: u.role || 'user',
        department: u.department,
        phone: u.phone,
      }));
      
      setFormData(prev => ({
        ...prev,
        users: [...prev.users, ...validUsers],
      }));
      
      setJsonInput('');
      showSuccessToast(`成功新增 ${validUsers.length} 個用戶`);
    } catch (error) {
      showErrorToast('JSON 格式不正確');
    }
  };

  // 處理手動新增
  const handleManualAdd = () => {
    if (!manualInput.email || !manualInput.name) {
      showErrorToast('請填寫必要欄位');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      users: [...prev.users, {
        ...manualInput,
        authMethod: 'password',
      }],
    }));
    
    setManualInput({
      email: '',
      name: '',
      role: 'user',
      department: '',
    });
    
    showSuccessToast('用戶已新增');
  };

  // 移除用戶
  const removeUser = (index: number) => {
    setFormData(prev => ({
      ...prev,
      users: prev.users.filter((_, i) => i !== index),
    }));
  };

  // 清空所有用戶
  const clearAllUsers = () => {
    setFormData(prev => ({
      ...prev,
      users: [],
    }));
  };

  // 渲染匯入方式選擇
  const renderImportMethodSelector = () => {
    const methods = [
      { value: 'csv', label: 'CSV 檔案', icon: 'document-text-outline' },
      { value: 'json', label: 'JSON 格式', icon: 'code-slash-outline' },
      { value: 'google', label: 'Google Workspace', icon: 'logo-google' },
      { value: 'manual', label: '手動輸入', icon: 'create-outline' },
    ];
    
    return (
      <View style={styles.methodSelector}>
        {methods.map(method => (
          <TouchableOpacity
            key={method.value}
            style={[
              styles.methodCard,
              formData.importMethod === method.value && styles.methodCardActive,
            ]}
            onPress={() => setFormData(prev => ({ 
              ...prev, 
              importMethod: method.value as any 
            }))}
          >
            <Icon name={method.icon}
              size={32}
              color={formData.importMethod === method.value ? colors.primary : colors.gray600}
            />
            <Text style={[
              styles.methodLabel,
              formData.importMethod === method.value && styles.methodLabelActive,
            ]}>
              {method.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // 渲染 CSV 上傳區域
  const renderCSVUpload = () => {
    if (formData.importMethod !== 'csv') return null;
    
    return (
      <View style={styles.uploadContainer}>
        <TouchableOpacity
          style={styles.uploadBox}
          onPress={() => {
            if (Platform.OS === 'web' && fileInputRef.current) {
              fileInputRef.current.click();
            }
          }}
        >
          <Icon name="cloud-upload-outline" size={48} color={colors.gray400}  />
          <Text style={styles.uploadText}>點擊或拖放 CSV 檔案</Text>
          <Text style={styles.uploadHint}>支援 .csv 格式，最大 10MB</Text>
        </TouchableOpacity>
        
        {Platform.OS === 'web' && (
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
        )}
        
        <View style={styles.csvExample}>
          <Text style={styles.exampleTitle}>CSV 範例格式：</Text>
          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>
              Email,姓名,部門,角色{'\n'}
              john@example.com,John Doe,業務部,user{'\n'}
              mary@example.com,Mary Lee,行銷部,admin
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // 渲染 JSON 輸入區域
  const renderJSONInput = () => {
    if (formData.importMethod !== 'json') return null;
    
    return (
      <View style={styles.jsonContainer}>
        <TextInput
          style={styles.jsonInput}
          value={jsonInput}
          onChangeText={setJsonInput}
          placeholder={`[
  {
    "email": "user@example.com",
    "name": "用戶姓名",
    "role": "user",
    "department": "部門"
  }
]`}
          multiline
          numberOfLines={10}
          textAlignVertical="top"
        />
        
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleJSONSubmit}
        >
          <Text style={styles.submitButtonText}>解析並新增</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // 渲染 Google 整合設定
  const renderGoogleIntegration = () => {
    if (formData.importMethod !== 'google') return null;
    
    return (
      <View style={styles.googleContainer}>
        <View style={styles.googleNotice}>
          <Icon name="info" size={20} color={colors.info}  />
          <Text style={styles.googleNoticeText}>
            需要設定 Google OAuth 2.0 憑證才能使用此功能
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.googleButton}
          onPress={() => {
            // TODO: 實作 Google OAuth 流程
            showErrorToast('Google 整合功能開發中');
          }}
        >
          <Icon name="link" size={20} color={colors.white}  />
          <Text style={styles.googleButtonText}>連接 Google Workspace</Text>
        </TouchableOpacity>
        
        <View style={styles.googleSettings}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>網域限制</Text>
            <TextInput
              style={styles.input}
              value={formData.googleAuthConfig?.domain}
              onChangeText={(text) => setFormData(prev => ({
                ...prev,
                googleAuthConfig: {
                  ...prev.googleAuthConfig!,
                  domain: text,
                },
              }))}
              placeholder="@example.com"
            />
          </View>
          
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>首次登入自動建立用戶</Text>
            <Switch
              value={formData.googleAuthConfig?.autoCreateUsers}
              onValueChange={(value) => setFormData(prev => ({
                ...prev,
                googleAuthConfig: {
                  ...prev.googleAuthConfig!,
                  autoCreateUsers: value,
                },
              }))}
              trackColor={{ false: colors.gray300, true: colors.primary }}
            />
          </View>
          
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>同步 Google Groups</Text>
            <Switch
              value={formData.googleAuthConfig?.syncGroups}
              onValueChange={(value) => setFormData(prev => ({
                ...prev,
                googleAuthConfig: {
                  ...prev.googleAuthConfig!,
                  syncGroups: value,
                },
              }))}
              trackColor={{ false: colors.gray300, true: colors.primary }}
            />
          </View>
        </View>
      </View>
    );
  };

  // 渲染手動輸入區域
  const renderManualInput = () => {
    if (formData.importMethod !== 'manual') return null;
    
    return (
      <View style={styles.manualContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email *</Text>
          <TextInput
            style={styles.input}
            value={manualInput.email}
            onChangeText={(text) => setManualInput(prev => ({ ...prev, email: text }))}
            placeholder="user@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>姓名 *</Text>
          <TextInput
            style={styles.input}
            value={manualInput.name}
            onChangeText={(text) => setManualInput(prev => ({ ...prev, name: text }))}
            placeholder="請輸入姓名"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>部門</Text>
          <TextInput
            style={styles.input}
            value={manualInput.department}
            onChangeText={(text) => setManualInput(prev => ({ ...prev, department: text }))}
            placeholder="請輸入部門"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>角色</Text>
          <View style={styles.roleSelector}>
            {['user', 'admin', 'manager'].map(role => (
              <TouchableOpacity
                key={role}
                style={[
                  styles.roleOption,
                  manualInput.role === role && styles.roleOptionActive,
                ]}
                onPress={() => setManualInput(prev => ({ ...prev, role }))}
              >
                <Text style={[
                  styles.roleText,
                  manualInput.role === role && styles.roleTextActive,
                ]}>
                  {role === 'user' ? '一般用戶' : role === 'admin' ? '管理員' : '主管'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleManualAdd}
        >
          <Icon name="add" size={20} color={colors.white}  />
          <Text style={styles.addButtonText}>新增用戶</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // 渲染用戶列表
  const renderUserList = () => {
    if (formData.users.length === 0) {
      return (
        <View style={styles.emptyList}>
          <Icon name="people-outline" size={48} color={colors.gray400}  />
          <Text style={styles.emptyText}>尚未新增任何用戶</Text>
          <Text style={styles.emptyHint}>請選擇上方的匯入方式開始新增用戶</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.userList}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            已新增 {formData.users.length} 個用戶
          </Text>
          <TouchableOpacity onPress={clearAllUsers}>
            <Text style={styles.clearLink}>清空全部</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.listScroll} showsVerticalScrollIndicator={false}>
          {formData.users.map((user, index) => (
            <View key={index} style={styles.userItem}>
              <View style={styles.userAvatar}>
                <Text style={styles.avatarText}>
                  {user.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                {user.department && (
                  <Text style={styles.userDepartment}>{user.department}</Text>
                )}
              </View>
              
              <View style={styles.userRole}>
                <Text style={styles.roleTag}>
                  {user.role === 'admin' ? '管理員' : user.role === 'manager' ? '主管' : '用戶'}
                </Text>
              </View>
              
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeUser(index)}
              >
                <Icon name="close" size={20} color={colors.gray600}  />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  // 渲染 Google 登入設定
  const renderGoogleAuthSettings = () => {
    return (
      <View style={styles.authSection}>
        <View style={styles.sectionHeader}>
          <Icon name="security" size={20} color={colors.primary}  />
          <Text style={styles.sectionTitle}>Google 登入設定</Text>
        </View>
        
        <View style={styles.switchRow}>
          <View style={styles.switchContent}>
            <Text style={styles.switchLabel}>啟用 Google 登入</Text>
            <Text style={styles.switchHint}>允許用戶使用 Google 帳號登入</Text>
          </View>
          <Switch
            value={formData.googleAuthConfig?.enabled}
            onValueChange={(value) => setFormData(prev => ({
              ...prev,
              googleAuthConfig: {
                ...prev.googleAuthConfig!,
                enabled: value,
              },
            }))}
            trackColor={{ false: colors.gray300, true: colors.primary }}
          />
        </View>
        
        {formData.googleAuthConfig?.enabled && (
          <View style={styles.googleOptions}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>網域限制（選填）</Text>
              <TextInput
                style={styles.input}
                value={formData.googleAuthConfig?.domain}
                onChangeText={(text) => setFormData(prev => ({
                  ...prev,
                  googleAuthConfig: {
                    ...prev.googleAuthConfig!,
                    domain: text,
                  },
                }))}
                placeholder="@example.com"
              />
              <Text style={styles.inputHint}>
                僅允許特定網域的 Google 帳號登入
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  // 渲染密碼策略
  const renderPasswordStrategy = () => {
    const strategies = [
      { value: 'google-only', label: '使用 Google 登入（推薦）', icon: 'domain' },
      { value: 'auto-generate', label: '自動產生並發送密碼', icon: 'vpn-key' },
      { value: 'same-for-all', label: '設定統一密碼', icon: 'lock' },
      { value: 'send-reset', label: '發送密碼重設連結', icon: 'email' },
    ];
    
    return (
      <View style={styles.passwordSection}>
        <View style={styles.sectionHeader}>
          <Icon name="lock-closed-outline" size={20} color={colors.primary}  />
          <Text style={styles.sectionTitle}>密碼設定</Text>
        </View>
        
        <View style={styles.strategyOptions}>
          {strategies.map(strategy => (
            <TouchableOpacity
              key={strategy.value}
              style={[
                styles.strategyOption,
                formData.passwordStrategy.type === strategy.value && styles.strategyOptionActive,
              ]}
              onPress={() => setFormData(prev => ({
                ...prev,
                passwordStrategy: {
                  ...prev.passwordStrategy,
                  type: strategy.value as any,
                },
              }))}
            >
              <Icon name={strategy.icon}
                size={20}
                color={formData.passwordStrategy.type === strategy.value ? colors.primary : colors.gray600}
              />
              <Text style={[
                styles.strategyText,
                formData.passwordStrategy.type === strategy.value && styles.strategyTextActive,
              ]}>
                {strategy.label}
              </Text>
              {formData.passwordStrategy.type === strategy.value && (
                <Icon name="checkmark-circle" size={16} color={colors.primary}  />
              )}
            </TouchableOpacity>
          ))}
        </View>
        
        {formData.passwordStrategy.type === 'same-for-all' && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>統一密碼</Text>
            <TextInput
              style={styles.input}
              value={formData.passwordStrategy.value}
              onChangeText={(text) => setFormData(prev => ({
                ...prev,
                passwordStrategy: {
                  ...prev.passwordStrategy,
                  value: text,
                },
              }))}
              placeholder="請輸入至少 8 個字元"
              secureTextEntry
            />
          </View>
        )}
        
        {formData.passwordStrategy.type !== 'google-only' && (
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>要求首次登入時變更密碼</Text>
            <Switch
              value={formData.passwordStrategy.requireChange}
              onValueChange={(value) => setFormData(prev => ({
                ...prev,
                passwordStrategy: {
                  ...prev.passwordStrategy,
                  requireChange: value,
                },
              }))}
              trackColor={{ false: colors.gray300, true: colors.primary }}
            />
          </View>
        )}
      </View>
    );
  };

  // 渲染歡迎郵件設定
  const renderWelcomeEmailSettings = () => {
    return (
      <View style={styles.emailSection}>
        <View style={styles.switchRow}>
          <View style={styles.switchContent}>
            <Text style={styles.switchLabel}>發送歡迎郵件</Text>
            <Text style={styles.switchHint}>向新用戶發送帳號資訊和登入指引</Text>
          </View>
          <Switch
            value={formData.sendWelcomeEmail}
            onValueChange={(value) => setFormData(prev => ({
              ...prev,
              sendWelcomeEmail: value,
            }))}
            trackColor={{ false: colors.gray300, true: colors.primary }}
          />
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 匯入方式選擇 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>選擇匯入方式</Text>
        {renderImportMethodSelector()}
      </View>
      
      {/* 根據選擇顯示對應的匯入區域 */}
      {renderCSVUpload()}
      {renderJSONInput()}
      {renderGoogleIntegration()}
      {renderManualInput()}
      
      {/* 已新增的用戶列表 */}
      {renderUserList()}
      
      {/* Google 登入設定 */}
      {renderGoogleAuthSettings()}
      
      {/* 密碼策略 */}
      {renderPasswordStrategy()}
      
      {/* 歡迎郵件設定 */}
      {renderWelcomeEmailSettings()}
      
      {/* 處理中指示器 */}
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.processingText}>處理中...</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
  },
  methodSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  methodCard: {
    flex: 1,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: DesignSystem.colors.gray[300],
    backgroundColor: DesignSystem.colors.background.surface,
  },
  methodCardActive: {
    borderColor: DesignSystem.colors.primary,
    backgroundColor: withAlpha(DesignSystem.colors.primary, 0.063),
  },
  methodLabel: {
    fontSize: 12,
    color: DesignSystem.colors.gray[700],
    marginTop: 8,
    fontWeight: '500',
  },
  methodLabelActive: {
    color: DesignSystem.colors.primary,
  },
  uploadContainer: {
    marginBottom: 24,
  },
  uploadBox: {
    borderWidth: 2,
    borderColor: DesignSystem.colors.gray[300],
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignSystem.colors.gray[50],
  },
  uploadText: {
    fontSize: 14,
    color: DesignSystem.colors.gray[700],
    marginTop: 12,
    fontWeight: '500',
  },
  uploadHint: {
    fontSize: 12,
    color: DesignSystem.colors.gray[500],
    marginTop: 4,
  },
  csvExample: {
    marginTop: 16,
  },
  exampleTitle: {
    fontSize: 13,
    color: DesignSystem.colors.gray[700],
    marginBottom: 8,
    fontWeight: '500',
  },
  codeBlock: {
    backgroundColor: DesignSystem.colors.gray[100],
    borderRadius: 6,
    padding: 12,
  },
  codeText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: DesignSystem.colors.gray[800],
  },
  jsonContainer: {
    marginBottom: 24,
  },
  jsonInput: {
    borderWidth: 1,
    borderColor: DesignSystem.colors.gray[300],
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: DesignSystem.colors.text.primary,
    backgroundColor: DesignSystem.colors.background.surface,
    minHeight: 200,
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: DesignSystem.colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  submitButtonText: {
    color: DesignSystem.colors.background.surface,
    fontSize: 14,
    fontWeight: '500',
  },
  googleContainer: {
    marginBottom: 24,
  },
  googleNotice: {
    flexDirection: 'row',
    backgroundColor: withAlpha(DesignSystem.colors.status.info, 0.063),
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  googleNoticeText: {
    flex: 1,
    fontSize: 13,
    color: DesignSystem.colors.status.info,
    lineHeight: 18,
  },
  googleButton: {
    flexDirection: 'row',
    backgroundColor: DesignSystem.colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  googleButtonText: {
    color: DesignSystem.colors.background.surface,
    fontSize: 14,
    fontWeight: '500',
  },
  googleSettings: {
    marginTop: 16,
  },
  googleOptions: {
    marginTop: 12,
    paddingLeft: 20,
  },
  manualContainer: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: DesignSystem.colors.gray[700],
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: DesignSystem.colors.gray[300],
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: DesignSystem.colors.text.primary,
    backgroundColor: DesignSystem.colors.background.surface,
    minHeight: 48,
    lineHeight: 20,
  },
  inputHint: {
    fontSize: 12,
    color: DesignSystem.colors.gray[500],
    marginTop: 4,
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: DesignSystem.colors.gray[300],
    alignItems: 'center',
  },
  roleOptionActive: {
    borderColor: DesignSystem.colors.primary,
    backgroundColor: withAlpha(DesignSystem.colors.primary, 0.063),
  },
  roleText: {
    fontSize: 13,
    color: DesignSystem.colors.gray[700],
  },
  roleTextActive: {
    color: DesignSystem.colors.primary,
    fontWeight: '500',
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: DesignSystem.colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addButtonText: {
    color: DesignSystem.colors.background.surface,
    fontSize: 14,
    fontWeight: '500',
  },
  userList: {
    marginBottom: 24,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
  },
  clearLink: {
    fontSize: 13,
    color: DesignSystem.colors.status.error,
    fontWeight: '500',
  },
  listScroll: {
    maxHeight: 300,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DesignSystem.colors.background.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: DesignSystem.colors.gray[200],
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: withAlpha(DesignSystem.colors.primary, 0.125),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignSystem.colors.primary,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
    color: DesignSystem.colors.text.primary,
  },
  userEmail: {
    fontSize: 12,
    color: DesignSystem.colors.gray[600],
    marginTop: 2,
  },
  userDepartment: {
    fontSize: 12,
    color: DesignSystem.colors.gray[500],
    marginTop: 2,
  },
  userRole: {
    marginRight: 8,
  },
  roleTag: {
    fontSize: 11,
    color: DesignSystem.colors.primary,
    backgroundColor: withAlpha(DesignSystem.colors.primary, 0.063),
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontWeight: '500',
  },
  removeButton: {
    padding: 4,
  },
  emptyList: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: DesignSystem.colors.gray[50],
    borderRadius: 8,
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 14,
    color: DesignSystem.colors.gray[700],
    marginTop: 12,
    fontWeight: '500',
  },
  emptyHint: {
    fontSize: 12,
    color: DesignSystem.colors.gray[500],
    marginTop: 4,
  },
  authSection: {
    marginBottom: 24,
  },
  passwordSection: {
    marginBottom: 24,
  },
  emailSection: {
    marginBottom: 24,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  switchContent: {
    flex: 1,
    marginRight: 12,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: DesignSystem.colors.text.primary,
  },
  switchHint: {
    fontSize: 12,
    color: DesignSystem.colors.gray[600],
    marginTop: 2,
  },
  strategyOptions: {
    gap: 8,
    marginBottom: 16,
  },
  strategyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: DesignSystem.colors.gray[300],
    backgroundColor: DesignSystem.colors.background.surface,
    gap: 12,
  },
  strategyOptionActive: {
    borderColor: DesignSystem.colors.primary,
    backgroundColor: withAlpha(DesignSystem.colors.primary, 0.063),
  },
  strategyText: {
    flex: 1,
    fontSize: 14,
    color: DesignSystem.colors.gray[700],
  },
  strategyTextActive: {
    color: DesignSystem.colors.primary,
    fontWeight: '500',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    marginTop: 12,
    fontSize: 14,
    color: DesignSystem.colors.gray[600],
  },
});

export default UserImportStep;