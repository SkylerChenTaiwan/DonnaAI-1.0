/**
 * 使用報表頁面（Enterprise Admin）
 * 檢視組織使用情況和統計
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Layout } from '@/components/common/Layout';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/stores/authStore';
import { useAdminStore } from '@/stores/adminStore';
import { showToast } from '@/utils/toast';
import { DesignSystem } from '@/theme/designSystem';
import {
  VictoryChart,
  VictoryLine,
  VictoryBar,
  VictoryAxis,
  VictoryTheme,
  VictoryContainer,
  VictoryLabel,
  VictoryArea,
} from 'victory-native';
import { Period } from '@/types/admin';

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 40;

export const UsageReportsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { usageReport, fetchUsageReport, isLoading } = useAdminStore();
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('daily');
  const [selectedMetric, setSelectedMetric] = useState<'ai' | 'users' | 'storage' | 'records'>('ai');
  
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
        y: Math.floor(Math.random() * 100) + 20,
      }));
    }
    
    // TODO: 轉換實際的 usageReport 資料
    return [];
  };
  
  // 匯出報表
  const handleExport = () => {
    showToast('info', '此功能尚未完成');
    // TODO: 實作匯出功能
  };
  
  // 統計卡片資料
  const statsCards = [
    {
      label: '本月 AI 使用量',
      value: '1,234',
      unit: '分鐘',
      change: '+12%',
      isPositive: true,
    },
    {
      label: '活躍用戶數',
      value: '156',
      unit: '人',
      change: '+5%',
      isPositive: true,
    },
    {
      label: '儲存使用量',
      value: '45.2',
      unit: 'GB',
      change: '+8%',
      isPositive: false,
    },
    {
      label: '本月記錄數',
      value: '3,421',
      unit: '筆',
      change: '+23%',
      isPositive: true,
    },
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
            <Ionicons name="arrow-back" size={24} color={DesignSystem.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>使用報表</Text>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={handleExport}
          >
            <Ionicons name="download-outline" size={24} color={DesignSystem.colors.primary} />
          </TouchableOpacity>
        </View>
        
        {/* 期間選擇器 */}
        <View style={styles.periodSelector}>
          {periodOptions.map((period) => (
            <TouchableOpacity
              key={period.id}
              style={[
                styles.periodButton,
                selectedPeriod === period.id && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod(period.id as Period)}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period.id && styles.periodButtonTextActive,
              ]}>
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
                <Ionicons
                  name={stat.isPositive ? "trending-up" : "trending-down"}
                  size={16}
                  color={stat.isPositive ? DesignSystem.colors.success : DesignSystem.colors.error}
                />
                <Text style={[
                  styles.statChange,
                  { color: stat.isPositive ? DesignSystem.colors.success : DesignSystem.colors.error }
                ]}>
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
              style={[
                styles.metricButton,
                selectedMetric === metric.id && styles.metricButtonActive,
              ]}
              onPress={() => setSelectedMetric(metric.id as any)}
            >
              <Ionicons
                name={metric.icon as any}
                size={20}
                color={selectedMetric === metric.id ? DesignSystem.colors.primary : DesignSystem.colors.text.secondary}
              />
              <Text style={[
                styles.metricButtonText,
                selectedMetric === metric.id && styles.metricButtonTextActive,
              ]}>
                {metric.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* 主要圖表 */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>
            {metricOptions.find(m => m.id === selectedMetric)?.label} - {periodOptions.find(p => p.id === selectedPeriod)?.label}趨勢
          </Text>
          <VictoryChart
            width={chartWidth}
            height={250}
            theme={VictoryTheme.material}
            padding={{ left: 50, top: 20, right: 30, bottom: 50 }}
          >
            <VictoryAxis
              dependentAxis
              style={{
                axis: { stroke: DesignSystem.colors.border.light },
                tickLabels: { 
                  fontSize: 12, 
                  fill: DesignSystem.colors.text.secondary,
                  padding: 5
                },
                grid: { stroke: DesignSystem.colors.border.light, strokeDasharray: "3,3" },
              }}
            />
            <VictoryAxis
              style={{
                axis: { stroke: DesignSystem.colors.border.light },
                tickLabels: { 
                  fontSize: 12, 
                  fill: DesignSystem.colors.text.secondary,
                  padding: 5
                },
              }}
            />
            <VictoryArea
              data={getChartData()}
              style={{
                data: { 
                  fill: DesignSystem.colors.primary + "30",
                  stroke: DesignSystem.colors.primary,
                  strokeWidth: 2
                },
              }}
              interpolation="catmullRom"
            />
          </VictoryChart>
        </View>
        
        {/* 次要圖表 - 長條圖 */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>各部門使用量分布</Text>
          <VictoryChart
            width={chartWidth}
            height={200}
            theme={VictoryTheme.material}
            padding={{ left: 80, top: 20, right: 30, bottom: 50 }}
            domainPadding={{ x: 20 }}
          >
            <VictoryAxis
              dependentAxis
              style={{
                axis: { stroke: DesignSystem.colors.border.light },
                tickLabels: { 
                  fontSize: 12, 
                  fill: DesignSystem.colors.text.secondary,
                  padding: 5
                },
                grid: { stroke: DesignSystem.colors.border.light, strokeDasharray: "3,3" },
              }}
            />
            <VictoryAxis
              style={{
                axis: { stroke: DesignSystem.colors.border.light },
                tickLabels: { 
                  fontSize: 12, 
                  fill: DesignSystem.colors.text.secondary,
                  padding: 5,
                  angle: -45,
                  textAnchor: 'end'
                },
              }}
              fixLabelOverlap={true}
            />
            <VictoryBar
              data={[
                { x: "業務部", y: 65 },
                { x: "行銷部", y: 45 },
                { x: "客服部", y: 38 },
                { x: "研發部", y: 28 },
              ]}
              style={{
                data: { fill: DesignSystem.colors.primary },
              }}
            />
          </VictoryChart>
        </View>
      </ScrollView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: DesignSystem.colors.text.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignSystem.spacing.lg,
    backgroundColor: DesignSystem.colors.background.surface,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light,
  },
  backButton: {
    marginRight: DesignSystem.spacing.md,
  },
  title: {
    ...DesignSystem.typography.h1,
    color: DesignSystem.colors.text.primary,
    flex: 1,
  },
  exportButton: {
    padding: 8,
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: DesignSystem.colors.background.elevated,
  },
  periodButtonActive: {
    backgroundColor: DesignSystem.colors.primary,
  },
  periodButtonText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
  },
  periodButtonTextActive: {
    color: DesignSystem.colors.white,
    fontWeight: '600',
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  statCard: {
    backgroundColor: DesignSystem.colors.background.surface,
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statLabel: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    marginBottom: 8,
  },
  statValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  statValue: {
    ...DesignSystem.typography.h1,
    color: DesignSystem.colors.text.primary,
    fontWeight: '700',
  },
  statUnit: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    marginLeft: 4,
  },
  statChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statChange: {
    ...DesignSystem.typography.caption,
    fontWeight: '600',
  },
  metricSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  metricButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: DesignSystem.colors.background.elevated,
    gap: 6,
  },
  metricButtonActive: {
    backgroundColor: DesignSystem.colors.primary + '20',
    borderWidth: 1,
    borderColor: DesignSystem.colors.primary,
  },
  metricButtonText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
  },
  metricButtonTextActive: {
    color: DesignSystem.colors.primary,
    fontWeight: '600',
  },
  chartContainer: {
    backgroundColor: DesignSystem.colors.background.surface,
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    ...DesignSystem.typography.h3,
    color: DesignSystem.colors.text.primary,
    marginBottom: 16,
  },
});