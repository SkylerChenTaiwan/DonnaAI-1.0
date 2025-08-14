/**
 * 審計儀表板元件
 * 提供即時監控和統計分析視覺化
 */

import React, { useState, useEffect, useCallback } from 'react';
import { DesignSystem } from '@/theme/designSystem';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Platform } from 'react-native';
import {
  AuditStatistics,
  TimeRange,
  RiskAssessment,
  Anomaly,
  SecurityIncident,
  AuditLog } from '@/types/audit';
import { auditLogQuery } from '@/services/audit/AuditLogQuery';
import { auditAnalytics } from '@/services/audit/AuditAnalytics';
// Icon import removed - using platform-specific Icon component;
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { format, subDays, subHours, startOfDay, endOfDay } from 'date-fns';
import { zhTW } from 'date-fns/locale';

interface AuditDashboardProps {
  organizationId: string;
  onAnomalyClick?: (anomaly: Anomaly) => void;
  onIncidentClick?: (incident: SecurityIncident) => void;
  onViewDetails?: () => void;
}

/**
 * 審計儀表板
 */
export const AuditDashboard: React.FC<AuditDashboardProps> = ({
  organizationId,
  onAnomalyClick,
  onIncidentClick,
  onViewDetails }) => {
  // 狀態管理
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'24h' | '7d' | '30d'>('24h');
  
  // 資料狀態
  const [statistics, setStatistics] = useState<AuditStatistics | null>(null);
  const [recentActivity, setRecentActivity] = useState<AuditLog[]>([]);
  const [highRiskEvents, setHighRiskEvents] = useState<AuditLog[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  
  // 自動更新計時器
  const [autoRefresh, setAutoRefresh] = useState(true);
  const refreshInterval = 30000; // 30 秒

  /**
   * 計算時間範圍
   */
  const getTimeRange = useCallback((): TimeRange => {
    const now = new Date();
    let start: Date;
    let granularity: 'hour' | 'day' | 'week' | 'month';

    switch (selectedPeriod) {
      case '24h':
        start = subHours(now, 24);
        granularity = 'hour';
        break;
      case '7d':
        start = subDays(now, 7);
        granularity = 'day';
        break;
      case '30d':
        start = subDays(now, 30);
        granularity = 'day';
        break;
    }

    return {
      start,
      end: now,
      granularity };
  }, [selectedPeriod]);

  /**
   * 載入儀表板資料
   */
  const loadDashboardData = useCallback(async () => {
    if (loading && !refreshing) return;
    
    setError(null);

    try {
      const timeRange = getTimeRange();
      
      // 並行載入所有資料
      const [
        statsData,
        recentData,
        highRiskData,
        logsForAnalysis,
      ] = await Promise.all([
        auditLogQuery.getStatistics(organizationId, timeRange),
        auditLogQuery.getRecentActivity(organizationId, 10),
        auditLogQuery.getHighRiskEvents(organizationId, 5),
        auditLogQuery.search({
          organizationId,
          dateRange: { start: timeRange.start, end: timeRange.end },
          limit: 1000 }),
      ]);

      // 分析資料
      const anomaliesData = await auditAnalytics.detectAnomalies(logsForAnalysis.logs);
      const riskData = auditAnalytics.assessRisk(logsForAnalysis.logs);
      const incidentsData = auditAnalytics.identifyIncidents(logsForAnalysis.logs);

      // 更新狀態
      setStatistics(statsData);
      setRecentActivity(recentData);
      setHighRiskEvents(highRiskData);
      setAnomalies(anomaliesData.slice(0, 5)); // 只顯示前 5 個異常
      setRiskAssessment(riskData);
      setIncidents(incidentsData.filter(i => i.status === 'open').slice(0, 5)); // 只顯示未解決的事件
    } catch (err) {
      console.error('載入儀表板資料失敗:', err);
      setError('載入失敗，請稍後再試');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [organizationId, selectedPeriod, getTimeRange, loading, refreshing]);

  /**
   * 重新整理
   */
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboardData();
  }, [loadDashboardData]);

  /**
   * 初始載入和自動更新
   */
  useEffect(() => {
    loadDashboardData();

    if (autoRefresh) {
      const interval = setInterval(() => {
        loadDashboardData();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [selectedPeriod, autoRefresh]);

  /**
   * 渲染統計卡片
   */
  const renderStatCard = (title: string, value: string | number, icon: string, color: string, trend?: string) => (
    <View style={StyleSheet.flatten([styles.statCard, { borderLeftColor: color }])}>
      <View style={styles.statCardHeader}>
        <Icon name={icon} size={24} color={color} />
        <Text style={styles.statCardTitle}>{title}</Text>
      </View>
      <Text style={styles.statCardValue}>{value}</Text>
      {trend && (
        <View style={styles.statCardTrend}>
          <Icon name={trend === 'up' ? 'trending-up' : 'trending-down'} 
            size={16} 
            color={trend === 'up' ? '#F44336' : '#4CAF50'} 
          />
          <Text style={StyleSheet.flatten([styles.statCardTrendText, { color: trend === 'up' ? '#F44336' : '#4CAF50' }])}>
            {trend === 'up' ? '增加' : '減少'}
          </Text>
        </View>
      )}
    </View>
  );

  /**
   * 渲染時間線圖表
   */
  const renderTimelineChart = () => {
    if (!statistics?.timeline) return null;

    const labels = statistics.timeline.buckets.map(b => {
      const date = new Date(b.time);
      return selectedPeriod === '24h' 
        ? format(date, 'HH:mm')
        : format(date, 'MM/dd');
    });

    const data = {
      labels: labels.slice(-10), // 只顯示最近 10 個數據點
      datasets: [{
        data: statistics.timeline.buckets.slice(-10).map(b => b.count) }] };

    const screenWidth = Dimensions.get('window').width;
    const chartWidth = screenWidth - 32;

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>活動趨勢</Text>
        <LineChart
          data={data}
          width={chartWidth}
          height={200}
          yAxisLabel=""
          yAxisSuffix=""
          chartConfig={{
            backgroundColor: '#FFFFFF',
            backgroundGradientFrom: '#FFFFFF',
            backgroundGradientTo: '#FFFFFF',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 102, 204, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16 },
            propsForDots: {
              r: '4',
              strokeWidth: '2',
              stroke: '#2C2C2C' } }}
          bezier
          style={{
            marginVertical: 8,
            borderRadius: 16 }}
        />
      </View>
    );
  };

  /**
   * 渲染風險分布圖
   */
  const renderRiskDistribution = () => {
    if (!statistics?.riskDistribution) return null;

    const data = [
      {
        name: '低',
        population: statistics.riskDistribution.low,
        color: '#4CAF50',
        legendFontColor: '#7F7F7F',
        legendFontSize: 12 },
      {
        name: '中',
        population: statistics.riskDistribution.medium,
        color: '#FFC107',
        legendFontColor: '#7F7F7F',
        legendFontSize: 12 },
      {
        name: '高',
        population: statistics.riskDistribution.high,
        color: '#FF9800',
        legendFontColor: '#7F7F7F',
        legendFontSize: 12 },
      {
        name: '關鍵',
        population: statistics.riskDistribution.critical,
        color: '#F44336',
        legendFontColor: '#7F7F7F',
        legendFontSize: 12 },
    ];

    const screenWidth = Dimensions.get('window').width;
    const chartWidth = screenWidth - 32;

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>風險分布</Text>
        <PieChart
          data={data}
          width={chartWidth}
          height={200}
          chartConfig={{
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})` }}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
      </View>
    );
  };

  /**
   * 渲染頂部用戶
   */
  const renderTopUsers = () => {
    if (!statistics?.topUsers || statistics.topUsers.length === 0) return null;

    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>最活躍用戶</Text>
        {statistics.topUsers.map((user, index) => (
          <View key={user.userId} style={styles.userItem}>
            <View style={styles.userRank}>
              <Text style={styles.userRankText}>{index + 1}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.userName}</Text>
              <Text style={styles.userStats}>{user.eventCount} 個事件</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  /**
   * 渲染異常警報
   */
  const renderAnomalies = () => {
    if (anomalies.length === 0) return null;

    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>異常偵測</Text>
          <View style={styles.alertBadge}>
            <Text style={styles.alertBadgeText}>{anomalies.length}</Text>
          </View>
        </View>
        {anomalies.map((anomaly, index) => (
          <TouchableOpacity
            key={index}
            style={styles.anomalyItem}
            onPress={() => onAnomalyClick?.(anomaly)}
          >
            <View style={StyleSheet.flatten([styles.anomalyIndicator, { backgroundColor: getRiskColor(anomaly.severity) }])} />
            <View style={styles.anomalyContent}>
              <Text style={styles.anomalyType}>{anomaly.type}</Text>
              <Text style={styles.anomalyDescription}>{anomaly.description}</Text>
              <View style={styles.anomalyMeta}>
                <Text style={styles.anomalyTime}>
                  {format(anomaly.timestamp.toDate(), 'HH:mm:ss')}
                </Text>
                <Text style={styles.anomalyConfidence}>
                  信心度: {Math.round(anomaly.confidence * 100)}%
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  /**
   * 渲染安全事件
   */
  const renderIncidents = () => {
    if (incidents.length === 0) return null;

    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>未解決事件</Text>
          <View style={StyleSheet.flatten([styles.alertBadge, { backgroundColor: '#F44336' }])}>
            <Text style={styles.alertBadgeText}>{incidents.length}</Text>
          </View>
        </View>
        {incidents.map((incident) => (
          <TouchableOpacity
            key={incident.id}
            style={styles.incidentItem}
            onPress={() => onIncidentClick?.(incident)}
          >
            <View style={styles.incidentHeader}>
              <Text style={styles.incidentType}>{incident.type}</Text>
              <View style={StyleSheet.flatten([styles.severityBadge, { backgroundColor: getRiskColor(incident.severity) }])}>
                <Text style={styles.severityBadgeText}>{incident.severity}</Text>
              </View>
            </View>
            <Text style={styles.incidentDescription}>{incident.description}</Text>
            <Text style={styles.incidentTime}>
              {format(incident.timestamp.toDate(), 'yyyy-MM-dd HH:mm:ss')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  /**
   * 渲染最近活動
   */
  const renderRecentActivity = () => {
    if (recentActivity.length === 0) return null;

    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>最近活動</Text>
        {recentActivity.map((log) => (
          <View key={log.id} style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Icon name={getActionIcon(log.action.type)} 
                size={20} 
                color={getStatusColor(log.result.status)} 
              />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityAction}>{log.action.type}</Text>
              <Text style={styles.activityUser}>{log.actor.userName}</Text>
              <Text style={styles.activityTime}>
                {format(log.timestamp.toDate(), 'HH:mm:ss')}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2C2C2C" />
        <Text style={styles.loadingText}>載入儀表板...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* 標題欄 */}
      <View style={styles.header}>
        <Text style={styles.title}>審計監控儀表板</Text>
        <View style={styles.headerActions}>
          {/* 期間選擇器 */}
          <View style={styles.periodSelector}>
            {(['24h', '7d', '30d'] as const).map((period) => (
              <TouchableOpacity
                key={period}
                style={StyleSheet.flatten([
                  styles.periodButton,
                  selectedPeriod === period && styles.periodButtonActive,
                ])}
                onPress={() => setSelectedPeriod(period)}
              >
                <Text
                  style={StyleSheet.flatten([
                    styles.periodButtonText,
                    selectedPeriod === period && styles.periodButtonTextActive,
                  ])}
                >
                  {period === '24h' ? '24 小時' : period === '7d' ? '7 天' : '30 天'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* 自動更新開關 */}
          <TouchableOpacity
            style={styles.autoRefreshButton}
            onPress={() => setAutoRefresh(!autoRefresh)}
          >
            <Icon name={autoRefresh ? 'sync' : 'sync-outline'} 
              size={20} 
              color={autoRefresh ? '#2C2C2C' : '#666666'} 
            />
          </TouchableOpacity>
          
          {/* 查看詳情按鈕 */}
          {onViewDetails && (
            <TouchableOpacity style={styles.viewDetailsButton} onPress={onViewDetails}>
              <Text style={styles.viewDetailsButtonText}>查看詳情</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 錯誤提示 */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      )}

      {/* 風險評估摘要 */}
      {riskAssessment && (
        <View style={StyleSheet.flatten([styles.riskSummary, { backgroundColor: getRiskBackgroundColor(riskAssessment.overallRisk) }])}>
          <View style={styles.riskSummaryHeader}>
            <Text style={styles.riskSummaryTitle}>整體風險評估</Text>
            <View style={StyleSheet.flatten([styles.riskBadge, { backgroundColor: getRiskColor(riskAssessment.overallRisk) }])}>
              <Text style={styles.riskBadgeText}>{riskAssessment.overallRisk.toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.riskSummaryContent}>
            <Text style={styles.riskScore}>風險分數: {riskAssessment.riskScore.toFixed(2)}</Text>
            <View style={styles.riskTrend}>
              <Icon name={
                  riskAssessment.trend === 'increasing' ? 'trending-up' :
                  riskAssessment.trend === 'decreasing' ? 'trending-down' :
                  'remove'
                } 
                size={20} 
                color={
                  riskAssessment.trend === 'increasing' ? '#F44336' :
                  riskAssessment.trend === 'decreasing' ? '#4CAF50' :
                  '#666666'
                } 
              />
              <Text style={styles.riskTrendText}>
                {riskAssessment.trend === 'increasing' ? '風險上升' :
                 riskAssessment.trend === 'decreasing' ? '風險下降' :
                 '風險穩定'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* 統計卡片 */}
      {statistics && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsContainer}>
          {renderStatCard(
            '總事件數',
            statistics.totalEvents.toLocaleString(),
            'analytics',
            '#2C2C2C'
          )}
          {renderStatCard(
            '活躍用戶',
            statistics.uniqueUsers.toString(),
            'people',
            '#4CAF50'
          )}
          {renderStatCard(
            '失敗率',
            `${statistics.failureRate.toFixed(1)}%`,
            'warning',
            '#FF9800',
            statistics.failureRate > 10 ? 'up' : 'down'
          )}
          {renderStatCard(
            '平均回應',
            `${Math.round(statistics.averageResponseTime)}ms`,
            'speedometer',
            '#9C27B0'
          )}
        </ScrollView>
      )}

      {/* 圖表區域 */}
      {renderTimelineChart()}
      {renderRiskDistribution()}

      {/* 異常和事件 */}
      <View style={styles.alertsContainer}>
        {renderAnomalies()}
        {renderIncidents()}
      </View>

      {/* 用戶和活動 */}
      <View style={styles.activityContainer}>
        {renderTopUsers()}
        {renderRecentActivity()}
      </View>

      {/* 高風險事件 */}
      {highRiskEvents.length > 0 && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>高風險事件</Text>
          {highRiskEvents.map((event) => (
            <View key={event.id} style={styles.highRiskItem}>
              <View style={styles.highRiskIndicator} />
              <View style={styles.highRiskContent}>
                <Text style={styles.highRiskAction}>{event.action.type}</Text>
                <Text style={styles.highRiskResource}>{event.action.resource}</Text>
                <Text style={styles.highRiskUser}>
                  {event.actor.userName} - {format(event.timestamp.toDate(), 'HH:mm:ss')}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

/**
 * 輔助函數
 */
const getRiskColor = (risk: string): string => {
  const colors: Record<string, string> = {
    critical: '#D32F2F',
    high: '#F57C00',
    medium: '#FBC02D',
    low: '#388E3C' };
  return colors[risk] || '#757575';
};

const getRiskBackgroundColor = (risk: string): string => {
  const colors: Record<string, string> = {
    critical: '#FFEBEE',
    high: '#FFF3E0',
    medium: '#FFFDE7',
    low: '#E8F5E9' };
  return colors[risk] || 'DesignSystem.colors.gray50';
};

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    success: '#4CAF50',
    failure: '#F44336',
    partial: '#FF9800' };
  return colors[status] || '#757575';
};

const getActionIcon = (actionType: string): string => {
  if (actionType.includes('LOGIN')) return 'log-in';
  if (actionType.includes('LOGOUT')) return 'log-out';
  if (actionType.includes('CREATE')) return 'add-circle';
  if (actionType.includes('UPDATE')) return 'create';
  if (actionType.includes('DELETE')) return 'trash';
  if (actionType.includes('EXPORT')) return 'download';
  if (actionType.includes('IMPORT')) return 'cloud-upload';
  return 'ellipse';
};

/**
 * 樣式定義
 */
const styles: any = {
  container: {
    flex: 1,
    backgroundColor: 'DesignSystem.colors.gray50' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'DesignSystem.colors.gray50' },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666' },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center' },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333' },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center' },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'DesignSystem.colors.gray50',
    borderRadius: 8,
    padding: 2 },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6 },
  periodButtonActive: {
    backgroundColor: '#2C2C2C' },
  periodButtonText: {
    fontSize: 12,
    color: '#666666' },
  periodButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600' },
  autoRefreshButton: {
    marginLeft: 12,
    padding: 8 },
  viewDetailsButton: {
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#2C2C2C',
    borderRadius: 4 },
  viewDetailsButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600' },
  errorBanner: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 4 },
  errorBannerText: {
    color: '#C62828',
    fontSize: 14 },
  riskSummary: {
    margin: 8,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0' },
  riskSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12 },
  riskSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333' },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12 },
  riskBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600' },
  riskSummaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center' },
  riskScore: {
    fontSize: 14,
    color: '#666666' },
  riskTrend: {
    flexDirection: 'row',
    alignItems: 'center' },
  riskTrendText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666666' },
  statsContainer: {
    paddingVertical: 8 },
  statCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 4,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    minWidth: 150,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        ...(Platform.OS === 'web' ? {} : { shadowOffset: { width: 0, height: 2 } }),
        shadowOpacity: 0.1,
        shadowRadius: 4 },
      android: {
        elevation: 2 } }) },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8 },
  statCardTitle: {
    marginLeft: 8,
    fontSize: 12,
    color: '#666666' },
  statCardValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333333' },
  statCardTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4 },
  statCardTrendText: {
    marginLeft: 4,
    fontSize: 12 },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    margin: 8,
    padding: 16,
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        ...(Platform.OS === 'web' ? {} : { shadowOffset: { width: 0, height: 2 } }),
        shadowOpacity: 0.1,
        shadowRadius: 4 },
      android: {
        elevation: 2 } }) },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12 },
  alertsContainer: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column' },
  activityContainer: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column' },
  sectionContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    margin: 8,
    padding: 16,
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        ...(Platform.OS === 'web' ? {} : { shadowOffset: { width: 0, height: 2 } }),
        shadowOpacity: 0.1,
        shadowRadius: 4 },
      android: {
        elevation: 2 } }) },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12 },
  alertBadge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center' },
  alertBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600' },
  anomalyItem: {
    flexDirection: 'row',
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#FFF9F0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE0B2' },
  anomalyIndicator: {
    width: 4,
    marginRight: 12,
    borderRadius: 2 },
  anomalyContent: {
    flex: 1 },
  anomalyType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4 },
  anomalyDescription: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 4 },
  anomalyMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between' },
  anomalyTime: {
    fontSize: 12,
    color: '#999999' },
  anomalyConfidence: {
    fontSize: 12,
    color: '#999999' },
  incidentItem: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFCDD2' },
  incidentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8 },
  incidentType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333' },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10 },
  severityBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600' },
  incidentDescription: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 4 },
  incidentTime: {
    fontSize: 12,
    color: '#999999' },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12 },
  userRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12 },
  userRankText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1976D2' },
  userInfo: {
    flex: 1 },
  userName: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 2 },
  userStats: {
    fontSize: 12,
    color: '#666666' },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0' },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'DesignSystem.colors.gray50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12 },
  activityContent: {
    flex: 1 },
  activityAction: {
    fontSize: 13,
    color: '#333333',
    marginBottom: 2 },
  activityUser: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2 },
  activityTime: {
    fontSize: 11,
    color: '#999999' },
  highRiskItem: {
    flexDirection: 'row',
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#FFEBEE',
    borderRadius: 8 },
  highRiskIndicator: {
    width: 4,
    backgroundColor: '#F44336',
    marginRight: 12,
    borderRadius: 2 },
  highRiskContent: {
    flex: 1 },
  highRiskAction: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4 },
  highRiskResource: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 4 },
  highRiskUser: {
    fontSize: 12,
    color: '#999999' } };