/**
 * 保存的報表網格組件
 * 支援預設報表顯示和單色灰階設計系統
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl } from 'react-native';
// Icon import removed - using platform-specific Icon component;
import { Icon } from '@/components/common/Icon';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { getSavedReports, SavedReport, saveReport } from '@/services/firebase/managerActions';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation';
import { showToast } from '@/utils/toast';
import { colors } from '@/theme/colors';
import { DesignSystem } from '@/theme/designSystem';
import { useAnalyticsStore } from '@/stores/analyticsStore';
import {
  defaultReportTemplates,
  createDefaultReport,
  hasDefaultReports } from '@/services/reports/defaultReports';

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface SavedReportsGridProps {
  limit?: number;
  onReportPress?: (report: SavedReport) => void;
  fullScreen?: boolean;
  showDefault?: boolean;
}

export const SavedReportsGrid: React.FC<SavedReportsGridProps> = ({
  limit = 6,
  onReportPress,
  fullScreen = false,
  showDefault = true }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [initializingDefaults, setInitializingDefaults] = useState(false);
  
  const { user } = useAuth();
  const { currentTeam, organization } = useOrganization();
  const navigation = useNavigation<NavigationProp>();
  const { openDialog } = useAnalyticsStore();

  // 初始化預設報表
  const initializeDefaultReports = async () => {
    if (!user || !organization) return;
    
    setInitializingDefaults(true);
    try {
      // 創建所有預設報表
      const promises = defaultReportTemplates.map(async (template) => {
        const reportData = createDefaultReport(
          template,
          organization.id,
          currentTeam?.id
        );
        
        return saveReport(
          {
            ...reportData,
            createdByName: 'DonnaAI 系統',
            userId: user.uid },
          user.uid,
          'DonnaAI 系統'
        );
      });
      
      await Promise.all(promises);
      showToast('success', '已載入預設報表');
      
      // 重新獲取報表
      await fetchReports();
    } catch (error) {
      console.error('初始化預設報表失敗:', error);
      showToast('error', '無法創建預設報表');
    } finally {
      setInitializingDefaults(false);
    }
  };

  // 獲取保存的報表
  const fetchReports = async () => {
    if (!user) return;

    try {
      const savedReports = await getSavedReports(user.uid, {
        teamId: currentTeam?.id,
        limit: fullScreen ? undefined : limit });
      
      // 檢查是否需要初始化預設報表
      if (showDefault && savedReports.length === 0 && !hasDefaultReports(savedReports)) {
        // 不等待初始化完成，先顯示空狀態
        setReports([]);
        setLoading(false);
        setRefreshing(false);
        // 背景初始化預設報表
        initializeDefaultReports();
      } else {
        setReports(savedReports);
        setLoading(false);
        setRefreshing(false);
      }
    } catch (error) {
      console.error('獲取報表失敗:', error);
      showToast('error', '無法載入報表');
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [user, currentTeam, limit]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchReports();
  }, []);

  // 處理報表點擊
  const handleReportPress = (report: SavedReport) => {
    if (onReportPress) {
      onReportPress(report);
    } else {
      // 打開智能分析對話框並載入報表
      openDialog();
      // TODO: 未來可以預載入報表數據到對話框
      showToast('info', '已開啟智能分析');
    }
  };

  // 獲取圖表類型圖標
  const getChartIcon = (chartType: string): string => {
    switch (chartType) {
      case 'bar':
        return 'bar-chart';
      case 'line':
        return 'trending-up';
      case 'pie':
        return 'pie-chart';
      case 'scatter':
        return 'scatter-chart';
      default:
        return 'analytics';
    }
  };

  // 獲取圖表類型顏色 - 使用灰階系統
  const getChartColor = (chartType: string, isDefault?: boolean): string => {
    // 預設報表使用較淺的灰色
    if (isDefault) {
      return colors.gray600;
    }
    
    // 用戶報表使用深灰黑
    return colors.primary;
  };

  if (loading && !initializingDefaults) {
    return (
      <View style={[styles.loadingContainer, fullScreen && styles.fullScreenContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>載入報表...</Text>
      </View>
    );
  }

  if (reports.length === 0 && !initializingDefaults) {
    return (
      <View style={[styles.emptyContainer, fullScreen && styles.fullScreenEmptyContainer]}>
        <Icon name="bar-chart-outline" size={48} color={colors.border} />
        <Text style={styles.emptyText}>還沒有保存的報表</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={openDialog}
          activeOpacity={0.7}
        >
          <Text style={styles.createButtonText}>創建報表</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  if (initializingDefaults) {
    return (
      <View style={[styles.loadingContainer, fullScreen && styles.fullScreenContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>正在載入預設報表...</Text>
      </View>
    );
  }

  const containerStyle = fullScreen ? styles.fullScreenGrid : styles.reportsGrid;
  
  return (
    <ScrollView
      style={styles.container}
      horizontal={!fullScreen}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={containerStyle}>
        {reports.map((report) => {
          const chartIcon = getChartIcon(report.chartType);
          const chartColor = getChartColor(report.chartType, report.isDefault);
          const cardStyle = fullScreen ? styles.fullScreenReportCard : styles.reportCard;
          
          return (
            <TouchableOpacity
              key={report.id}
              style={[cardStyle, report.isDefault && styles.defaultReportCard]}
              onPress={() => handleReportPress(report)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.chartIconContainer,
                  { backgroundColor: `${chartColor}15` },
                ]}
              >
                <Icon
                  name={chartIcon}
                  size={32}
                  color={chartColor}
                />
              </View>
              
              <View style={styles.reportHeader}>
                <Text style={styles.reportName} numberOfLines={2}>
                  {report.name}
                </Text>
                {report.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>預設</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.reportMeta}>
                <Text style={styles.reportDate}>
                  {report.createdAt?.toDate().toLocaleDateString('zh-TW')}
                </Text>
                {report.isPublic && (
                  <View style={styles.publicBadge}>
                    <Icon name="people" size={12} color="#FFFFFF" />
                  </View>
                )}
              </View>
              
              {report.tags && report.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {report.tags.slice(0, 2).map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                  {report.tags.length > 2 && (
                    <Text style={styles.moreTagsText}>
                      +{report.tags.length - 2}
                    </Text>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
        
        {/* 查看更多按鈕 - 只在非全屏模式顯示 */}
        {!fullScreen && reports.length >= limit && (
          <TouchableOpacity
            style={styles.viewMoreCard}
            onPress={openDialog}
            activeOpacity={0.7}
          >
            <Icon name="add-circle" size={48} color={colors.primary} />
            <Text style={styles.viewMoreText}>創建新報表</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1 },
  loadingContainer: {
    padding: DesignSystem.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center' },
  fullScreenContainer: {
    minHeight: 300 },
  loadingText: {
    marginTop: DesignSystem.spacing.sm,
    ...DesignSystem.typography.body,
    color: colors.textSecondary },
  emptyContainer: {
    padding: DesignSystem.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center' },
  fullScreenEmptyContainer: {
    minHeight: 300 },
  emptyText: {
    ...DesignSystem.typography.body,
    color: colors.textSecondary,
    marginTop: DesignSystem.spacing.sm,
    marginBottom: DesignSystem.spacing.sm },
  createButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingVertical: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borderRadius.full,
    marginTop: DesignSystem.spacing.md },
  createButtonText: {
    color: colors.background,
    ...DesignSystem.typography.button },
  reportsGrid: {
    flexDirection: 'row',
    paddingVertical: DesignSystem.spacing.sm,
    gap: DesignSystem.spacing.sm },
  fullScreenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: DesignSystem.spacing.sm,
    gap: DesignSystem.spacing.sm },
  reportCard: {
    width: 160,
    backgroundColor: colors.background,
    borderRadius: DesignSystem.borderRadius.md,
    padding: DesignSystem.spacing.md,
    ...DesignSystem.shadows.sm },
  fullScreenReportCard: {
    width: '48%',
    backgroundColor: colors.background,
    borderRadius: DesignSystem.borderRadius.md,
    padding: DesignSystem.spacing.md,
    ...DesignSystem.shadows.sm },
  defaultReportCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed' },
  chartIconContainer: {
    width: 64,
    height: 64,
    borderRadius: DesignSystem.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DesignSystem.spacing.sm,
    alignSelf: 'center' },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: DesignSystem.spacing.sm,
    minHeight: 40 },
  reportName: {
    ...DesignSystem.typography.body,
    fontWeight: '600',
    color: colors.text,
    flex: 1 },
  defaultBadge: {
    backgroundColor: colors.gray200,
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: 2,
    borderRadius: DesignSystem.borderRadius.sm,
    marginLeft: DesignSystem.spacing.xs },
  defaultBadgeText: {
    ...DesignSystem.typography.caption,
    color: colors.textSecondary,
    fontSize: 10 },
  reportMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: DesignSystem.spacing.sm },
  reportDate: {
    ...DesignSystem.typography.caption,
    color: colors.textTertiary },
  publicBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center' },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignSystem.spacing.xs },
  tag: {
    backgroundColor: colors.gray100,
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.xs,
    borderRadius: DesignSystem.borderRadius.sm },
  tagText: {
    ...DesignSystem.typography.caption,
    fontSize: 10,
    color: colors.textSecondary },
  moreTagsText: {
    ...DesignSystem.typography.caption,
    fontSize: 10,
    color: colors.textTertiary,
    paddingHorizontal: DesignSystem.spacing.xs,
    paddingVertical: DesignSystem.spacing.xs },
  viewMoreCard: {
    width: 160,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: DesignSystem.borderRadius.md,
    padding: DesignSystem.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed' },
  viewMoreText: {
    ...DesignSystem.typography.buttonSmall,
    color: colors.primary,
    marginTop: DesignSystem.spacing.sm } });