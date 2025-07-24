/**
 * 保存的報表網格組件
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { getSavedReports, SavedReport } from '@/services/firebase/managerActions';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation';
import { showToast } from '@/utils/toast';

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface SavedReportsGridProps {
  limit?: number;
  onReportPress?: (report: SavedReport) => void;
}

export const SavedReportsGrid: React.FC<SavedReportsGridProps> = ({
  limit = 6,
  onReportPress,
}) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reports, setReports] = useState<SavedReport[]>([]);
  
  const { user } = useAuth();
  const { currentTeam } = useOrganization();
  const navigation = useNavigation<NavigationProp>();

  // 獲取保存的報表
  const fetchReports = async () => {
    if (!user) return;

    try {
      const savedReports = await getSavedReports(user.uid, {
        teamId: currentTeam?.id,
        limit,
      });
      
      setReports(savedReports);
    } catch (error) {
      console.error('獲取報表失敗:', error);
      showToast('error', '無法載入報表');
    } finally {
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
      // 導航到智能分析頁面並顯示報表
      // @ts-ignore - Navigation type not updated
      navigation.navigate('SmartAnalytics', {
        savedReportId: report.id,
        query: report.query,
        chartData: report.chartData,
      });
    }
  };

  // 獲取圖表類型圖標
  const getChartIcon = (chartType: string): keyof typeof Ionicons.glyphMap => {
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

  // 獲取圖表類型顏色
  const getChartColor = (chartType: string): string => {
    switch (chartType) {
      case 'bar':
        return '#007AFF';
      case 'line':
        return '#34C759';
      case 'pie':
        return '#FF9500';
      case 'scatter':
        return '#AF52DE';
      default:
        return '#5856D6';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>載入報表...</Text>
      </View>
    );
  }

  if (reports.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="bar-chart-outline" size={48} color="#D1D5DB" />
        <Text style={styles.emptyText}>還沒有保存的報表</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('SmartAnalytics')}
          activeOpacity={0.7}
        >
          <Text style={styles.createButtonText}>創建報表</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      horizontal
      showsHorizontalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.reportsGrid}>
        {reports.map((report) => {
          const chartIcon = getChartIcon(report.chartType);
          const chartColor = getChartColor(report.chartType);
          
          return (
            <TouchableOpacity
              key={report.id}
              style={styles.reportCard}
              onPress={() => handleReportPress(report)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.chartIconContainer,
                  { backgroundColor: `${chartColor}15` },
                ]}
              >
                <Ionicons
                  name={chartIcon}
                  size={32}
                  color={chartColor}
                />
              </View>
              
              <Text style={styles.reportName} numberOfLines={2}>
                {report.name}
              </Text>
              
              <View style={styles.reportMeta}>
                <Text style={styles.reportDate}>
                  {report.createdAt?.toDate().toLocaleDateString('zh-TW')}
                </Text>
                {report.isPublic && (
                  <View style={styles.publicBadge}>
                    <Ionicons name="people" size={12} color="#FFFFFF" />
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
        
        {/* 查看更多按鈕 */}
        <TouchableOpacity
          style={styles.viewMoreCard}
          // @ts-ignore - Navigation type not updated
          onPress={() => navigation.navigate('SmartAnalytics', { showSaved: true })}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-forward-circle" size={48} color="#007AFF" />
          <Text style={styles.viewMoreText}>查看全部</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 16,
  },
  createButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 20,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  reportsGrid: {
    flexDirection: 'row',
    paddingVertical: 8,
    gap: 12,
  },
  reportCard: {
    width: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chartIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    alignSelf: 'center',
  },
  reportName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
    minHeight: 40,
  },
  reportMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reportDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  publicBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  tag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 10,
    color: '#666666',
  },
  moreTagsText: {
    fontSize: 10,
    color: '#8E8E93',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  viewMoreCard: {
    width: 160,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginTop: 8,
  },
});