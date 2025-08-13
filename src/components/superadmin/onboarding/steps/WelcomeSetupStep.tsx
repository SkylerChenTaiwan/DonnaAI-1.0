import { Icon } from '../../../../components/common/Icon';
import {
  AdaptiveInput,
  AdaptiveSwitch
} from '@/components/adaptive';
/**
 * 步驟 4: 歡迎設定
 * Step 4: Welcome Setup
 */

import React, { useState, useEffect } from 'react';
import { View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform   } from 'react-native';
// Icon import removed - using platform-specific Icon component;
import { DesignSystem } from '@/theme/designSystem';
import {
  StepProps,
  WelcomeSetupData } from '@/types/onboarding';
import DateTimePicker from '@react-native-community/datetimepicker';
import { withAlpha } from '@/utils/colorUtils';

const WelcomeSetupStep: React.FC<StepProps> = ({
  data,
  onChange,
  onValidate,
  isActive }) => {
  const colors = DesignSystem.colors;
  
  // 初始化資料
  const [formData, setFormData] = useState<WelcomeSetupData>({
    emailTemplate: {
      subject: '歡迎加入 ${organizationName}！',
      body: `親愛的 \${userName}：

歡迎您加入 \${organizationName}！

您的帳號已經建立完成，以下是您的登入資訊：
- 登入網址：\${loginUrl}
- Email：\${userEmail}
- 密碼：\${password}

首次登入後，建議您立即變更密碼。

如有任何問題，請聯絡我們的支援團隊。

祝您使用愉快！

\${organizationName} 團隊`,
      includeLoginGuide: true,
      includeCompanyLogo: true },
    firstLoginExperience: {
      showTour: true,
      showGettingStarted: true,
      defaultDashboard: 'home' },
    scheduledSend: {
      enabled: false,
      sendAt: new Date() },
    ...data });
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // 當資料變更時通知父元件
  useEffect(() => {
    if (isActive) {
      onChange(formData);
    }
  }, [formData, isActive]);

  // 更新表單資料
  const updateField = (path: string, value: any) => {
    const keys = path.split('.');
    setFormData(prev => {
      const newData = { ...prev };
      let current: any = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  // 插入變數
  const insertVariable = (variable: string) => {
    const currentBody = formData.emailTemplate.body;
    const cursorPosition = currentBody.length; // 簡單起見，插入到最後
    const newBody = currentBody + ` \${${variable}}`;
    updateField('emailTemplate.body', newBody);
  };

  // 渲染郵件模板編輯器
  const renderEmailTemplateEditor = () => {
    const variables = [
      { key: 'userName', label: '用戶姓名' },
      { key: 'userEmail', label: '用戶 Email' },
      { key: 'organizationName', label: '組織名稱' },
      { key: 'loginUrl', label: '登入網址' },
      { key: 'password', label: '臨時密碼' },
      { key: 'currentDate', label: '目前日期' },
    ];
    
    return (
      <View style={styles.templateEditor}>
        <View style={styles.editorHeader}>
          <Text style={styles.editorTitle}>郵件模板</Text>
          <TouchableOpacity
            style={styles.previewButton}
            onPress={() => setPreviewMode(!previewMode)}
          >
            <Icon name={previewMode ? 'edit' : 'preview'} 
              size={20} 
              color={colors.primary}
            />
            <Text style={styles.previewButtonText}>
              {previewMode ? '編輯' : '預覽'}
            </Text>
          </TouchableOpacity>
        </View>
        
        {previewMode ? (
          <View style={styles.previewContainer}>
            <View style={styles.emailPreview}>
              <Text style={styles.previewSubject}>
                {formData.emailTemplate.subject.replace('${organizationName}', 'Acme Corp')}
              </Text>
              <View style={styles.previewDivider} />
              <Text style={styles.previewBody}>
                {formData.emailTemplate.body
                  .replace(/\$\{userName\}/g, '張三')
                  .replace(/\$\{userEmail\}/g, 'user@example.com')
                  .replace(/\$\{organizationName\}/g, 'Acme Corp')
                  .replace(/\$\{loginUrl\}/g, 'https://app.donnaai.com')
                  .replace(/\$\{password\}/g, 'TempPass123')
                  .replace(/\$\{currentDate\}/g, new Date().toLocaleDateString())}
              </Text>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>郵件主旨</Text>
              <AdaptiveInput
                style={styles.input}
                value={formData.emailTemplate.subject}
                onChangeText={(text) => updateField('emailTemplate.subject', text)}
                placeholder="請輸入郵件主旨"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>郵件內容</Text>
              <AdaptiveInput
                style={StyleSheet.flatten([styles.input, styles.textArea])}
                value={formData.emailTemplate.body}
                onChangeText={(text) => updateField('emailTemplate.body', text)}
                placeholder="請輸入郵件內容..."
                multiline
                numberOfLines={10}
                textAlignVertical="top"
              />
            </View>
            
            <View style={styles.variablesContainer}>
              <Text style={styles.variablesTitle}>可用變數：</Text>
              <View style={styles.variablesList}>
                {variables.map(variable => (
                  <TouchableOpacity
                    key={variable.key}
                    style={styles.variableChip}
                    onPress={() => insertVariable(variable.key)}
                  >
                    <Text style={styles.variableText}>{variable.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}
        
        <View style={styles.templateOptions}>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>包含登入指引</Text>
            <AdaptiveSwitch
              value={formData.emailTemplate.includeLoginGuide}
              onValueChange={(value) => updateField('emailTemplate.includeLoginGuide', value)}
              trackColor={{ false: colors.gray300, true: colors.primary }}
            />
          </View>
          
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>包含公司 Logo</Text>
            <AdaptiveSwitch
              value={formData.emailTemplate.includeCompanyLogo}
              onValueChange={(value) => updateField('emailTemplate.includeCompanyLogo', value)}
              trackColor={{ false: colors.gray300, true: colors.primary }}
            />
          </View>
        </View>
      </View>
    );
  };

  // 渲染首次登入體驗設定
  const renderFirstLoginExperience = () => {
    const dashboardOptions = [
      { value: 'home', label: '首頁儀表板', icon: 'home' },
      { value: 'tasks', label: '任務列表', icon: 'assignment' },
      { value: 'customers', label: '客戶管理', icon: 'people' },
      { value: 'reports', label: '報表分析', icon: 'bar-chart' },
    ];
    
    return (
      <View style={styles.experienceSection}>
        <View style={styles.sectionHeader}>
          <Icon name="explore" size={20} color={colors.primary}  />
          <Text style={styles.sectionTitle}>首次登入體驗</Text>
        </View>
        
        <View style={styles.switchRow}>
          <View style={styles.switchContent}>
            <Text style={styles.switchLabel}>顯示導覽教學</Text>
            <Text style={styles.switchHint}>協助新用戶熟悉系統介面</Text>
          </View>
          <AdaptiveSwitch
            value={formData.firstLoginExperience.showTour}
            onValueChange={(value) => updateField('firstLoginExperience.showTour', value)}
            trackColor={{ false: colors.gray300, true: colors.primary }}
          />
        </View>
        
        <View style={styles.switchRow}>
          <View style={styles.switchContent}>
            <Text style={styles.switchLabel}>顯示快速開始指南</Text>
            <Text style={styles.switchHint}>提供系統使用的基本步驟</Text>
          </View>
          <AdaptiveSwitch
            value={formData.firstLoginExperience.showGettingStarted}
            onValueChange={(value) => updateField('firstLoginExperience.showGettingStarted', value)}
            trackColor={{ false: colors.gray300, true: colors.primary }}
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>預設儀表板</Text>
          <View style={styles.dashboardOptions}>
            {dashboardOptions.map(option => (
              <TouchableOpacity
                key={option.value}
                style={StyleSheet.flatten([
                  styles.dashboardOption,
                  formData.firstLoginExperience.defaultDashboard === option.value && 
                  styles.dashboardOptionActive,
                ])}
                onPress={() => updateField('firstLoginExperience.defaultDashboard', option.value)}
              >
                <Icon name={option.icon}
                  size={24}
                  color={formData.firstLoginExperience.defaultDashboard === option.value 
                    ? colors.primary 
                    : colors.gray600}
                />
                <Text style={StyleSheet.flatten([
                  styles.dashboardText,
                  formData.firstLoginExperience.defaultDashboard === option.value && 
                  styles.dashboardTextActive,
                ])}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  };

  // 渲染排程發送設定
  const renderScheduledSend = () => {
    return (
      <View style={styles.scheduleSection}>
        <View style={styles.sectionHeader}>
          <Icon name="schedule" size={20} color={colors.primary}  />
          <Text style={styles.sectionTitle}>發送設定</Text>
        </View>
        
        <View style={styles.switchRow}>
          <View style={styles.switchContent}>
            <Text style={styles.switchLabel}>排程發送</Text>
            <Text style={styles.switchHint}>在指定時間發送歡迎郵件</Text>
          </View>
          <AdaptiveSwitch
            value={formData.scheduledSend?.enabled}
            onValueChange={(value) => updateField('scheduledSend.enabled', value)}
            trackColor={{ false: colors.gray300, true: colors.primary }}
          />
        </View>
        
        {formData.scheduledSend?.enabled && (
          <View style={styles.scheduleOptions}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>發送時間</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Icon name="event" size={20} color={colors.gray600}  />
                <Text style={styles.datePickerText}>
                  {formData.scheduledSend.sendAt?.toLocaleString() || '選擇時間'}
                </Text>
              </TouchableOpacity>
            </View>
            
            {Platform.OS !== 'web' && showDatePicker && (
              <DateTimePicker
                value={formData.scheduledSend.sendAt || new Date()}
                mode="datetime"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    updateField('scheduledSend.sendAt', selectedDate);
                  }
                }}
              />
            )}
            
            {Platform.OS === 'web' && showDatePicker && (
              <input
                type="datetime-local"
                value={formData.scheduledSend.sendAt?.toISOString().slice(0, 16)}
                onChange={(e) => {
                  updateField('scheduledSend.sendAt', new Date(e.target.value));
                  setShowDatePicker(false);
                }}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: `1px solid ${colors.gray300}`,
                  fontSize: '14px',
                  marginTop: '8px' }}
              />
            )}
          </View>
        )}
        
        {!formData.scheduledSend?.enabled && (
          <View style={styles.infoBox}>
            <Icon name="information-circle-outline" size={16} color={colors.info}  />
            <Text style={styles.infoText}>
              歡迎郵件將在完成設置後立即發送
            </Text>
          </View>
        )}
      </View>
    );
  };

  // 渲染摘要
  const renderSummary = () => {
    const settings = [
      {
        icon: 'email',
        label: '歡迎郵件',
        value: '已設定',
        color: colors.success },
      {
        icon: 'login',
        label: '登入指引',
        value: formData.emailTemplate.includeLoginGuide ? '包含' : '不包含',
        color: formData.emailTemplate.includeLoginGuide ? colors.success : colors.gray600 },
      {
        icon: 'tour',
        label: '導覽教學',
        value: formData.firstLoginExperience.showTour ? '啟用' : '停用',
        color: formData.firstLoginExperience.showTour ? colors.success : colors.gray600 },
      {
        icon: 'schedule',
        label: '發送時間',
        value: formData.scheduledSend?.enabled 
          ? formData.scheduledSend.sendAt?.toLocaleString() 
          : '立即發送',
        color: colors.primary },
    ];
    
    return (
      <View style={styles.summarySection}>
        <Text style={styles.summaryTitle}>設定摘要</Text>
        <View style={styles.summaryGrid}>
          {settings.map(setting => (
            <View key={setting.label} style={styles.summaryItem}>
              <Icon name={setting.icon} 
                size={20} 
                color={setting.color}
              />
              <Text style={styles.summaryLabel}>{setting.label}</Text>
              <Text style={StyleSheet.flatten([styles.summaryValue, { color: setting.color }])}>
                {setting.value}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 郵件模板編輯器 */}
      {renderEmailTemplateEditor()}
      
      {/* 首次登入體驗 */}
      {renderFirstLoginExperience()}
      
      {/* 排程發送 */}
      {renderScheduledSend()}
      
      {/* 設定摘要 */}
      {renderSummary()}
      
      {/* 提示訊息 */}
      <View style={styles.tipBox}>
        <Icon name="lightbulb-outline" size={20} color={colors.warning}  />
        <View style={styles.tipContent}>
          <Text style={styles.tipTitle}>小提示</Text>
          <Text style={styles.tipText}>
            • 歡迎郵件是用戶對系統的第一印象，請確保內容清晰友善
          </Text>
          <Text style={styles.tipText}>
            • 建議包含登入指引和導覽教學，幫助新用戶快速上手
          </Text>
          <Text style={styles.tipText}>
            • 可以稍後在組織設定中修改這些設定
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1 },
  templateEditor: {
    marginBottom: 24 },
  editorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16 },
  editorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4 },
  previewButtonText: {
    fontSize: 13,
    color: DesignSystem.colors.primary,
    fontWeight: '500' },
  inputGroup: {
    marginBottom: 16 },
  inputLabel: {
    fontSize: 14,
    color: DesignSystem.colors.gray700,
    marginBottom: 8,
    fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderColor: DesignSystem.colors.gray300,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: DesignSystem.colors.text.primary,
    backgroundColor: DesignSystem.colors.background.surface },
  textArea: {
    minHeight: 200,
    textAlignVertical: 'top' },
  variablesContainer: {
    marginBottom: 16 },
  variablesTitle: {
    fontSize: 13,
    color: DesignSystem.colors.gray700,
    marginBottom: 8,
    fontWeight: '500' },
  variablesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8 },
  variableChip: {
    backgroundColor: withAlpha(DesignSystem.colors.primary, 0.063),
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: withAlpha(DesignSystem.colors.primary, 0.188) },
  variableText: {
    fontSize: 12,
    color: DesignSystem.colors.primary,
    fontWeight: '500' },
  previewContainer: {
    marginBottom: 16 },
  emailPreview: {
    backgroundColor: DesignSystem.colors.background.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: DesignSystem.colors.gray200,
    padding: 20 },
  previewSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
    marginBottom: 12 },
  previewDivider: {
    height: 1,
    backgroundColor: DesignSystem.colors.gray200,
    marginBottom: 12 },
  previewBody: {
    fontSize: 14,
    color: DesignSystem.colors.gray700,
    lineHeight: 20 },
  templateOptions: {
    gap: 8 },
  experienceSection: {
    marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12 },
  switchContent: {
    flex: 1,
    marginRight: 12 },
  switchLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: DesignSystem.colors.text.primary },
  switchHint: {
    fontSize: 12,
    color: DesignSystem.colors.gray600,
    marginTop: 2 },
  dashboardOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12 },
  dashboardOption: {
    flex: 1,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: DesignSystem.colors.gray300,
    backgroundColor: DesignSystem.colors.background.surface,
    gap: 8 },
  dashboardOptionActive: {
    borderColor: DesignSystem.colors.primary,
    backgroundColor: withAlpha(DesignSystem.colors.primary, 0.063) },
  dashboardText: {
    fontSize: 12,
    color: DesignSystem.colors.gray700,
    fontWeight: '500' },
  dashboardTextActive: {
    color: DesignSystem.colors.primary },
  scheduleSection: {
    marginBottom: 24 },
  scheduleOptions: {
    marginTop: 12,
    paddingLeft: 20 },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DesignSystem.colors.gray300,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: DesignSystem.colors.background.surface,
    gap: 8 },
  datePickerText: {
    fontSize: 14,
    color: DesignSystem.colors.text.primary },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: withAlpha(DesignSystem.colors.status.info, 0.063),
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    gap: 8 },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: DesignSystem.colors.status.info,
    lineHeight: 18 },
  summarySection: {
    backgroundColor: DesignSystem.colors.gray50,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24 },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
    marginBottom: 16 },
  summaryGrid: {
    gap: 12 },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12 },
  summaryLabel: {
    flex: 1,
    fontSize: 14,
    color: DesignSystem.colors.gray700 },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500' },
  tipBox: {
    flexDirection: 'row',
    backgroundColor: withAlpha(DesignSystem.colors.status.warning, 0.063),
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    gap: 12 },
  tipContent: {
    flex: 1 },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: DesignSystem.colors.status.warning,
    marginBottom: 8 },
  tipText: {
    fontSize: 13,
    color: DesignSystem.colors.gray700,
    lineHeight: 18,
    marginBottom: 4 } });

export default WelcomeSetupStep;