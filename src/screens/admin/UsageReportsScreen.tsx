/**
 * 使用報表頁面（Enterprise Admin）
 * 檢視組織使用情況和統計
 */

import React, { useState, useEffect } from 'react';
import { View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions, Platform  } from 'react-native';
import {
  AdaptiveModal
} from '@/components/adaptive';
import { Layout } from '@/components/common/Layout';
import { Icon } from '@/components/common/Icon';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/stores/authStore';
import { useAdminStore } from '@/stores/adminStore';
import { showToast } from '@/utils/toast';
import { DesignSystem } from '@/theme/designSystem';
import { LineChart, BarChart } from '@/components/admin/charts';
import { Period } from '@/types/admin';
import { 
  ExportFormat, 
  exportUsageReport,
  generateReportSummary } from '@/services/firebase/admin/reportExportService';
import { withAlpha } from '@/utils/colorUtils';

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 40;

export const UsageReportsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { usageReport, fetchUsageReport, isLoading } = useAdminStore();
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('daily');
  const [selectedMetric, setSelectedMetric] = useState<'ai' | 'users' | 'storage' | 'records'>('ai');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('excel');
  const [isExporting, setIsExporting] = useState(false);
  
  // 載入報表資料
  useEffect(() => {
    if (user?.organizationId) {
      fetchUsageReport(user.organizationId, selectedPeriod);
    }
  }, [user?.organizationId, selectedPeriod]);
  
  // 期間選項
  const periodOptions = [
    { id: 'daily', label: '每日' },
    { id: 'weekly', label: '每週' },
    { id: 'monthly', label: '每月' },
  ];
  
  // 指標選項
  const metricOptions = [
    { id: 'ai', label: 'AI 使用量', icon: 'chatbubbles-outline' },
    { id: 'users', label: '活躍用戶', icon: 'people-outline' },
    { id: 'storage', label: '儲存空間', icon: 'cloud-outline' },
    { id: 'records', label: '記錄數量', icon: 'document-text-outline' },
  ];
  
  // 模擬圖表資料
  const getChartData = () => {
    if (!usageReport) {
      // 返回模擬資料
      const days = selectedPeriod === 'daily' ? 7 : selectedPeriod === 'weekly' ? 4 : 12;
      return Array.from({ length: days }, (_, i) => ({
        x: i + 1,
        y: Math.floor(Math.random() * 100) + 20 }));
    }
    
    // TODO: 轉換實際的 usageReport 資料
    return [];
  };
  
  // 匯出報表
  const handleExport = () => {
    if (!usageReport) {
      showToast('error', '沒有可匯出的報表資料');
      return;
    }
    setShowExportModal(true);
  };
  
  // 執行匯出
  const performExport = async () => {
    if (!usageReport) return;
    
    setIsExporting(true);
    try {
      await exportUsageReport(
        usageReport,
        `${selectedPeriod}_${new Date().toLocaleDateString('zh-TW')}`,
        {
          format: exportFormat,
          includeCharts: false, // 暫時不支援圖表匯出
          includeDetails: true }
      );
      
      showToast('success', '報表匯出成功');
      setShowExportModal(false);
    } catch (error) {
      showToast('error', `匯出失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setIsExporting(false);
    }
  };
  
  // 統計卡片資料
  const statsCards = [
    {
      label: '本月 AI 使用量',
      value: '1,234',
      unit: '分鐘',
      change: '+12%',
      isPositive: true },
    {
      label: '活躍用戶數',
      value: '156',
      unit: '人',
      change: '+5%',
      isPositive: true },
    {
      label: '儲存使用量',
      value: '45.2',
      unit: 'GB',
      change: '+8%',
      isPositive: false },
    {
      label: '本月記錄數',
      value: '3,421',
      unit: '筆',
      change: '+23%',
      isPositive: true },
  ];
  
  if (isLoading && !usageReport) {
    return (
      <Layout>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={DesignSystem.colors.primary} />
          <Text style={styles.loadingText}>載入報表資料...</Text>
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
          <Text style={styles.title}>使用報表</Text>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={handleExport}
          >
            <Icon name="download-outline" size={24} color={DesignSystem.colors.primary} />
          </TouchableOpacity>
        </View>
        
        {/* 期間選擇器 */}
        <View style={styles.periodSelector}>
          {periodOptions.map((period) => (
            <TouchableOpacity
              key={period.id}
              style={StyleSheet.flatten([
                styles.periodButton,
                selectedPeriod === period.id && styles.periodButtonActive,
              ])}
              onPress={() => setSelectedPeriod(period.id as Period)}
            >
              <Text style={StyleSheet.flatten([
                styles.periodButtonText,
                selectedPeriod === period.id && styles.periodButtonTextActive,
              ])}>
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* 統計卡片 */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.statsContainer}
        >
          {statsCards.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <View style={styles.statValueContainer}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statUnit}>{stat.unit}</Text>
              </View>
              <View style={styles.statChangeContainer}>
                <Icon
                  name={stat.isPositive ? "trending-up" : "trending-down"}
                  size={16}
                  color={stat.isPositive ? DesignSystem.colors.success : DesignSystem.colors.error}
                />
                <Text style={StyleSheet.flatten([
                  styles.statChange,
                  { color: stat.isPositive ? DesignSystem.colors.success : DesignSystem.colors.error }
                ])}>
                  {stat.change}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
        
        {/* 指標選擇 */}
        <View style={styles.metricSelector}>
          {metricOptions.map((metric) => (
            <TouchableOpacity
              key={metric.id}
              style={StyleSheet.flatten([
                styles.metricButton,
                selectedMetric === metric.id && styles.metricButtonActive,
              ])}
              onPress={() => setSelectedMetric(metric.id as any)}
            >
              <Icon
                name={metric.icon as any}
                size={20}
                color={selectedMetric === metric.id ? DesignSystem.colors.primary : DesignSystem.colors.text.secondary}
              />
              <Text style={StyleSheet.flatten([
                styles.metricButtonText,
                selectedMetric === metric.id && styles.metricButtonTextActive,
              ])}>
                {metric.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* 主要圖表 */}
        <View style={styles.chartContainer}>
          <LineChart
            data={getChartData()}
            title={`${metricOptions.find(m => m.id === selectedMetric)?.label} - ${periodOptions.find(p => p.id === selectedPeriod)?.label}趨勢`}
            color={DesignSystem.colors.primary}
            height={250}
          />
        </View>
        
        {/* 次要圖表 - 長條圖 */}
        <View style={styles.chartContainer}>
          <BarChart
            data={[
              { x: "業務部", y: 65 },
              { x: "行銷部", y: 45 },
              { x: "客服部", y: 38 },
              { x: "研發部", y: 28 },
            ]}
            title="各部門使用量分布"
            color={DesignSystem.colors.primary}
            height={200}
          />
        </View>
      </ScrollView>
      
      {/* 匯出選項 Modal */}
      <AdaptiveModal
        visible={showExportModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowExportModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={() => setShowExportModal(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>匯出報表</Text>
            
            {/* 格式選擇 */}
            <View style={styles.exportOptions}>
              <TouchableOpacity
                style={StyleSheet.flatten([
                  styles.exportOption,
                  exportFormat === 'csv' && styles.exportOptionActive,
                ])}
                onPress={() => setExportFormat('csv')}
              >
                <Icon 
                  name="document-text-outline" 
                  size={24} 
                  color={exportFormat === 'csv' ? DesignSystem.colors.primary : DesignSystem.colors.text.secondary} 
                />
                <Text style={StyleSheet.flatten([
                  styles.exportOptionText,
                  exportFormat === 'csv' && styles.exportOptionTextActive,
                ])}>
                  CSV
                </Text>
                <Text style={styles.exportOptionDesc}>
                  適合資料分析
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={StyleSheet.flatten([
                  styles.exportOption,
                  exportFormat === 'excel' && styles.exportOptionActive,
                ])}
                onPress={() => setExportFormat('excel')}
              >
                <Icon 
                  name="grid-outline" 
                  size={24} 
                  color={exportFormat === 'excel' ? DesignSystem.colors.primary : DesignSystem.colors.text.secondary} 
                />
                <Text style={StyleSheet.flatten([
                  styles.exportOptionText,
                  exportFormat === 'excel' && styles.exportOptionTextActive,
                ])}>
                  Excel
                </Text>
                <Text style={styles.exportOptionDesc}>
                  包含多個工作表
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={StyleSheet.flatten([
                  styles.exportOption,
                  exportFormat === 'pdf' && styles.exportOptionActive,
                  { opacity: 0.5 }, // 暫時停用
                ])}
                onPress={() => showToast('info', 'PDF 匯出即將推出')}
                disabled
              >
                <Icon 
                  name="document-outline" 
                  size={24} 
                  color={DesignSystem.colors.text.disabled} 
                />
                <Text style={StyleSheet.flatten([styles.exportOptionText, { color: DesignSystem.colors.text.disabled }])}>
                  PDF
                </Text>
                <Text style={StyleSheet.flatten([styles.exportOptionDesc, { color: DesignSystem.colors.text.disabled }])}>
                  即將推出
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* 報表預覽 */}
            {usageReport && (
              <View style={styles.previewContainer}>
                <Text style={styles.previewTitle}>報表內容預覽</Text>
                <ScrollView style={styles.previewContent}>
                  <Text style={styles.previewText}>
                    {generateReportSummary(usageReport).slice(0, 200)}...
                  </Text>
                </ScrollView>
              </View>
            )}
            
            {/* 操作按鈕 */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={StyleSheet.flatten([styles.modalButton, styles.cancelButton])}
                onPress={() => setShowExportModal(false)}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={StyleSheet.flatten([styles.modalButton, styles.exportButton])}
                onPress={performExport}
                disabled={isExporting}
              >
                {isExporting ? (
                  <ActivityIndicator color={DesignSystem.colors.text.inverse} size="small" />
                ) : (
                  <>
                    <Icon name="download" size={20} color={DesignSystem.colors.text.inverse} />
                    <Text style={styles.exportButtonText}>匯出</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </AdaptiveModal>
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
    color: DesignSystem.colors.text.primary,
    flex: 1 },
  exportButton: {
    padding: 8 },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8 },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: DesignSystem.colors.background.elevated },
  periodButtonActive: {
    backgroundColor: DesignSystem.colors.primary },
  periodButtonText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary },
  periodButtonTextActive: {
    color: DesignSystem.colors.text.inverse,
    fontWeight: '600' },
  statsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16 },
  statCard: {
    backgroundColor: DesignSystem.colors.background.surface,
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 150,
    shadowColor: '#000',
    ...(Platform.OS === 'web' ? {} : { ...(Platform.OS === 'web' ? {} : { shadowOffset: { width: 0, height: 2 } }) }),
    shadowOpacity: 0.05,
    shadowRadius: 4,
    ...(Platform.OS === 'web' ? {} : { elevation: 2 }) },
  statLabel: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    marginBottom: 8 },
  statValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4 },
  statValue: {
    ...DesignSystem.typography.h1,
    color: DesignSystem.colors.text.primary,
    fontWeight: '700' },
  statUnit: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    marginLeft: 4 },
  statChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4 },
  statChange: {
    ...DesignSystem.typography.caption,
    fontWeight: '600' },
  metricSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8 },
  metricButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: DesignSystem.colors.background.elevated,
    gap: 6 },
  metricButtonActive: {
    backgroundColor: withAlpha(DesignSystem.colors.primary, 0.125),
    borderWidth: 1,
    borderColor: DesignSystem.colors.primary },
  metricButtonText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary },
  metricButtonTextActive: {
    color: DesignSystem.colors.primary,
    fontWeight: '600' },
  chartContainer: {
    backgroundColor: DesignSystem.colors.background.surface,
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    ...(Platform.OS === 'web' ? {} : { ...(Platform.OS === 'web' ? {} : { shadowOffset: { width: 0, height: 2 } }) }),
    shadowOpacity: 0.05,
    shadowRadius: 4,
    ...(Platform.OS === 'web' ? {} : { elevation: 2 }) },
  chartTitle: {
    ...DesignSystem.typography.h3,
    color: DesignSystem.colors.text.primary,
    marginBottom: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: DesignSystem.colors.background.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    maxHeight: '80%' },
  modalTitle: {
    ...DesignSystem.typography.h2,
    color: DesignSystem.colors.text.primary,
    textAlign: 'center',
    marginBottom: 24 },
  exportOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24 },
  exportOption: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    backgroundColor: DesignSystem.colors.background.elevated,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: DesignSystem.colors.border.light },
  exportOptionActive: {
    borderColor: DesignSystem.colors.primary,
    backgroundColor: withAlpha(DesignSystem.colors.primary, 0.063) },
  exportOptionText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary,
    fontWeight: '600',
    marginTop: 8 },
  exportOptionTextActive: {
    color: DesignSystem.colors.primary },
  exportOptionDesc: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    marginTop: 4,
    textAlign: 'center' },
  previewContainer: {
    backgroundColor: DesignSystem.colors.background.elevated,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24 },
  previewTitle: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    marginBottom: 8 },
  previewContent: {
    maxHeight: 100 },
  previewText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary,
    lineHeight: 20 },
  modalActions: {
    flexDirection: 'row',
    gap: 12 },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8 },
  cancelButton: {
    backgroundColor: DesignSystem.colors.background.elevated,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.default },
  cancelButtonText: {
    ...DesignSystem.typography.button,
    color: DesignSystem.colors.text.primary },
  exportButton: {
    backgroundColor: DesignSystem.colors.primary },
  exportButtonText: {
    ...DesignSystem.typography.button,
    color: DesignSystem.colors.text.inverse,
    fontWeight: '600' } });