/**
 * 工具管理頁面（Enterprise Admin）
 * 管理組織可用的工具和功能
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert } from 'react-native';
import { Layout } from '@/components/common/Layout';
import { Icon } from '@/components/common/Icon';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/stores/authStore';
import { useAdminStore } from '@/stores/adminStore';
import { showToast } from '@/utils/toast';
import { DesignSystem } from '@/theme/designSystem';
import { Tool } from '@/types/admin';

export const ToolManagementScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { 
    enterpriseConfig, 
    fetchEnterpriseConfig, 
    toggleTool,
    updateSubscriptionDetails,
    isLoading 
  } = useAdminStore();
  
  const [expandedSections, setExpandedSections] = useState<string[]>(['tools']);
  
  // 載入企業配置
  useEffect(() => {
    if (user?.organizationId) {
      fetchEnterpriseConfig(user.organizationId);
    }
  }, [user?.organizationId]);
  
  // 處理工具開關
  const handleToggleTool = async (toolId: string, currentState: boolean) => {
    if (!enterpriseConfig?.id) return;
    
    try {
      await toggleTool(enterpriseConfig.id, toolId, !currentState);
      showToast('success', `工具已${!currentState ? '啟用' : '停用'}`);
    } catch (error) {
      showToast('error', '更新工具狀態失敗');
    }
  };
  
  // 處理用量限制更新
  const handleUpdateLimit = (toolId: string, newLimit: number) => {
    Alert.prompt(
      '更新用量限制',
      `請輸入新的每月用量限制`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '確定',
          onPress: async (value) => {
            if (!value || !enterpriseConfig?.id) return;
            
            const limit = parseInt(value);
            if (isNaN(limit) || limit < 0) {
              showToast('error', '請輸入有效的數字');
              return;
            }
            
            try {
              // TODO: 實作更新工具用量限制的 API
              showToast('success', '用量限制已更新');
            } catch (error) {
              showToast('error', '更新用量限制失敗');
            }
          } },
      ],
      'plain-text',
      newLimit.toString()
    );
  };
  
  // 切換展開/收起區塊
  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };
  
  // 根據工具類別分組
  const groupedTools = enterpriseConfig?.enabledTools.reduce((acc, tool) => {
    const category = tool.category || '其他';
    if (!acc[category]) acc[category] = [];
    acc[category].push(tool);
    return acc;
  }, {} as Record<string, Tool[]>) || {};
  
  if (isLoading && !enterpriseConfig) {
    return (
      <Layout>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={DesignSystem.colors.primary} />
          <Text style={styles.loadingText}>載入工具設定...</Text>
        </View>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <ScrollView style={styles.container}>
        {/* 頁面標題 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={DesignSystem.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>工具管理</Text>
        </View>
        
        {/* 訂閱資訊 */}
        {enterpriseConfig?.subscriptionDetails && (
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.sectionHeader}
              onPress={() => toggleSection('subscription')}
            >
              <View style={styles.sectionTitleContainer}>
                <Icon name="card-outline" size={24} color={DesignSystem.colors.primary} />
                <Text style={styles.sectionTitle}>訂閱資訊</Text>
              </View>
              <Icon 
                name={expandedSections.includes('subscription') ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={DesignSystem.colors.text.secondary} 
              />
            </TouchableOpacity>
            
            {expandedSections.includes('subscription') && (
              <View style={styles.subscriptionContent}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>目前方案</Text>
                  <Text style={styles.infoValue}>
                    {enterpriseConfig.subscriptionDetails.plan || '基本方案'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>付費週期</Text>
                  <Text style={styles.infoValue}>
                    {enterpriseConfig.subscriptionDetails.billingCycle === 'monthly' ? '月付' : '年付'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>到期日期</Text>
                  <Text style={styles.infoValue}>
                    {enterpriseConfig.subscriptionDetails.expiresAt
                      ? new Date(enterpriseConfig.subscriptionDetails.expiresAt).toLocaleDateString('zh-TW')
                      : '未設定'
                    }
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>用戶數限制</Text>
                  <Text style={styles.infoValue}>
                    {enterpriseConfig.subscriptionDetails.userLimit || '無限制'}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}
        
        {/* 工具列表 */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => toggleSection('tools')}
          >
            <View style={styles.sectionTitleContainer}>
              <Icon name="construct-outline" size={24} color={DesignSystem.colors.primary} />
              <Text style={styles.sectionTitle}>可用工具</Text>
            </View>
            <Icon 
              name={expandedSections.includes('tools') ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={DesignSystem.colors.text.secondary} 
            />
          </TouchableOpacity>
          
          {expandedSections.includes('tools') && (
            <View style={styles.toolsContent}>
              {Object.entries(groupedTools).map(([category, tools]) => (
                <View key={category} style={styles.categoryContainer}>
                  <Text style={styles.categoryTitle}>{category}</Text>
                  {tools.map((tool) => (
                    <View key={tool.id} style={styles.toolItem}>
                      <View style={styles.toolInfo}>
                        <Text style={styles.toolName}>{tool.name}</Text>
                        {tool.description && (
                          <Text style={styles.toolDescription}>{tool.description}</Text>
                        )}
                        {tool.monthlyLimit && (
                          <TouchableOpacity
                            onPress={() => handleUpdateLimit(tool.id, tool.monthlyLimit!)}
                          >
                            <Text style={styles.toolLimit}>
                              每月限制: {tool.monthlyLimit} 次
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      <Switch
                        value={tool.enabled}
                        onValueChange={() => handleToggleTool(tool.id, tool.enabled)}
                        trackColor={{ 
                          false: DesignSystem.colors.gray300, 
                          true: DesignSystem.colors.primary 
                        }}
                        thumbColor={DesignSystem.colors.white}
                      />
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}
        </View>
        
        {/* 自訂設定 */}
        {enterpriseConfig?.customSettings && (
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.sectionHeader}
              onPress={() => toggleSection('custom')}
            >
              <View style={styles.sectionTitleContainer}>
                <Icon name="settings-outline" size={24} color={DesignSystem.colors.primary} />
                <Text style={styles.sectionTitle}>自訂設定</Text>
              </View>
              <Icon 
                name={expandedSections.includes('custom') ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={DesignSystem.colors.text.secondary} 
              />
            </TouchableOpacity>
            
            {expandedSections.includes('custom') && (
              <View style={styles.customContent}>
                <View style={styles.settingItem}>
                  <Text style={styles.settingLabel}>允許外部 API 整合</Text>
                  <Switch
                    value={enterpriseConfig.customSettings.allowExternalAPI}
                    onValueChange={(value) => {
                      // TODO: 實作更新自訂設定
                      showToast('info', '此功能尚未完成');
                    }}
                    trackColor={{ 
                      false: DesignSystem.colors.gray300, 
                      true: DesignSystem.colors.primary 
                    }}
                    thumbColor={DesignSystem.colors.white}
                  />
                </View>
                
                <View style={styles.settingItem}>
                  <Text style={styles.settingLabel}>啟用自訂品牌</Text>
                  <Switch
                    value={enterpriseConfig.customSettings.customBranding}
                    onValueChange={(value) => {
                      // TODO: 實作更新自訂設定
                      showToast('info', '此功能尚未完成');
                    }}
                    trackColor={{ 
                      false: DesignSystem.colors.gray300, 
                      true: DesignSystem.colors.primary 
                    }}
                    thumbColor={DesignSystem.colors.white}
                  />
                </View>
                
                <View style={styles.settingItem}>
                  <Text style={styles.settingLabel}>使用進階報表</Text>
                  <Switch
                    value={enterpriseConfig.customSettings.advancedReporting}
                    onValueChange={(value) => {
                      // TODO: 實作更新自訂設定
                      showToast('info', '此功能尚未完成');
                    }}
                    trackColor={{ 
                      false: DesignSystem.colors.gray300, 
                      true: DesignSystem.colors.primary 
                    }}
                    thumbColor={DesignSystem.colors.white}
                  />
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center' },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: DesignSystem.colors.text.secondary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignSystem.spacing.lg,
    backgroundColor: DesignSystem.colors.background.surface,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light },
  backButton: {
    marginRight: DesignSystem.spacing.md },
  title: {
    ...DesignSystem.typography.h1,
    color: DesignSystem.colors.text.primary },
  section: {
    backgroundColor: DesignSystem.colors.background.surface,
    marginVertical: 8 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: DesignSystem.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12 },
  sectionTitle: {
    ...DesignSystem.typography.h2,
    color: DesignSystem.colors.text.primary },
  subscriptionContent: {
    padding: DesignSystem.spacing.lg },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8 },
  infoLabel: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.secondary },
  infoValue: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary,
    fontWeight: '500' },
  toolsContent: {
    padding: DesignSystem.spacing.lg },
  categoryContainer: {
    marginBottom: 24 },
  categoryTitle: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    marginBottom: 12,
    textTransform: 'uppercase' },
  toolItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light },
  toolInfo: {
    flex: 1,
    marginRight: 16 },
  toolName: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary,
    fontWeight: '500' },
  toolDescription: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    marginTop: 4 },
  toolLimit: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.primary,
    marginTop: 4 },
  customContent: {
    padding: DesignSystem.spacing.lg },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12 },
  settingLabel: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary } });