/**
 * 活動詳情彈窗 - 顯示使用者活動統計和日誌
 */

import React, { useState, useEffect } from 'react';
import { View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator, Platform  } from 'react-native';
import {
  AdaptiveModal
} from '@/components/adaptive';
// Icon import removed - using platform-specific Icon component;
import { Icon } from '@/components/common/Icon';
import { DesignSystem } from '../../theme/DesignSystem';
import { User } from '../../types/user';
import { format, formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { ActivityChart } from '../personnel/ActivityChart';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';

interface ActivityLog {
  id: string;
  action: string;
  timestamp: Date;
  details?: string;
  module?: string;
}

interface ActivityModalProps {
  visible: boolean;
  user: User & {
    isOnline?: boolean;
    lastActiveAt?: Date;
    activityStats?: {
      dailyLogins: number[];
      totalActions: number;
      lastActions: string[];
    };
  };
  onClose: () => void;
}

export const ActivityModal: React.FC<ActivityModalProps> = ({
  visible,
  user,
  onClose }) => {
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'logs'>('overview');

  useEffect(() => {
    if (visible && user) {
      loadActivityLogs();
    }
  }, [visible, user]);

  const loadActivityLogs = async () => {
    setIsLoading(true);
    try {
      const logsRef = collection(db, 'users', user.id, 'activity');
      const q = query(
        logsRef,
        orderBy('timestamp', 'desc'),
        limit(50)
      );
      
      const snapshot = await getDocs(q);
      const logs: ActivityLog[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        logs.push({
          id: doc.id,
          action: data.action,
          timestamp: data.timestamp?.toDate() || new Date(),
          details: data.details,
          module: data.module });
      });
      
      setActivityLogs(logs);
    } catch (error) {
      console.error('載入活動日誌失敗:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionIcon = (action: string): string => {
    switch (action) {
      case 'login':
        return 'log-in-outline';
      case 'logout':
        return 'log-out-outline';
      case 'create':
        return 'add-circle-outline';
      case 'update':
        return 'create-outline';
      case 'delete':
        return 'trash-outline';
      case 'view':
        return 'eye-outline';
      default:
        return 'ellipse-outline';
    }
  };

  const getActionColor = (action: string): string => {
    switch (action) {
      case 'login':
        return DesignSystem.colors.success;
      case 'logout':
        return DesignSystem.colors.gray500;
      case 'create':
        return DesignSystem.colors.info;
      case 'update':
        return DesignSystem.colors.warning;
      case 'delete':
        return DesignSystem.colors.error;
      default:
        return DesignSystem.colors.text.secondary;
    }
  };

  const renderOverview = () => (
    <View style={styles.overviewContainer}>
      {/* 狀態卡片 */}
      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <View style={styles.statusItem}>
            <View style={StyleSheet.flatten([styles.statusDot, user.isOnline ? styles.onlineDot : styles.offlineDot])} />
            <Text style={styles.statusLabel}>
              {user.isOnline ? '線上' : '離線'}
            </Text>
          </View>
          <View style={styles.statusItem}>
            <Icon name="time-outline" size={16} color={DesignSystem.colors.text.secondary} />
            <Text style={styles.statusLabel}>
              {user.lastActiveAt
                ? formatDistanceToNow(user.lastActiveAt, { addSuffix: true, locale: zhTW })
                : '無活動記錄'}
            </Text>
          </View>
        </View>
      </View>

      {/* 統計資訊 */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {user.activityStats?.totalActions || 0}
          </Text>
          <Text style={styles.statLabel}>總操作次數</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {user.activityStats?.dailyLogins.filter(v => v > 0).length || 0}
          </Text>
          <Text style={styles.statLabel}>登入天數</Text>
        </View>
      </View>

      {/* 活動圖表 */}
      {user.activityStats?.dailyLogins && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>30 天登入趨勢</Text>
          <ActivityChart
            data={user.activityStats.dailyLogins}
            height={200}
          />
        </View>
      )}
    </View>
  );

  const renderLogs = () => (
    <View style={styles.logsContainer}>
      {isLoading ? (
        <ActivityIndicator size="large" color={DesignSystem.colors.primary} />
      ) : activityLogs.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="file-tray-outline" size={48} color={DesignSystem.colors.text.tertiary} />
          <Text style={styles.emptyText}>暫無活動記錄</Text>
        </View>
      ) : (
        activityLogs.map(log => (
          <View key={log.id} style={styles.logItem}>
            <View style={StyleSheet.flatten([styles.logIcon, { backgroundColor: `${getActionColor(log.action)}15` }])}>
              <Icon
                name={getActionIcon(log.action)}
                size={20}
                color={getActionColor(log.action)}
              />
            </View>
            <View style={styles.logContent}>
              <Text style={styles.logAction}>{log.action}</Text>
              {log.details && (
                <Text style={styles.logDetails}>{log.details}</Text>
              )}
              <Text style={styles.logTime}>
                {format(log.timestamp, 'yyyy/MM/dd HH:mm', { locale: zhTW })}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );

  return (
    <AdaptiveModal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* 標題列 */}
          <View style={styles.header}>
            <Text style={styles.title}>活動詳情</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={DesignSystem.colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* 使用者資訊 */}
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.displayName}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
          </View>

          {/* 標籤切換 */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={StyleSheet.flatten([styles.tab, selectedTab === 'overview' && styles.tabActive])}
              onPress={() => setSelectedTab('overview')}
            >
              <Text style={StyleSheet.flatten([styles.tabText, selectedTab === 'overview' && styles.tabTextActive])}>
                總覽
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={StyleSheet.flatten([styles.tab, selectedTab === 'logs' && styles.tabActive])}
              onPress={() => setSelectedTab('logs')}
            >
              <Text style={StyleSheet.flatten([styles.tabText, selectedTab === 'logs' && styles.tabTextActive])}>
                活動日誌
              </Text>
            </TouchableOpacity>
          </View>

          {/* 內容區域 */}
          <ScrollView
            style={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {selectedTab === 'overview' ? renderOverview() : renderLogs()}
          </ScrollView>
        </View>
      </View>
    </AdaptiveModal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center' },
  modalContent: {
    backgroundColor: DesignSystem.colors.background.surface,
    borderRadius: DesignSystem.radius.lg,
    width: '90%',
    maxWidth: 600,
    maxHeight: '85%',
    ...(Platform.OS === 'web' ? {} : { ...(Platform.OS === 'web' ? {} : { shadowOffset: { width: 0, height: 4 } }) }),
    shadowOpacity: 0.15,
    shadowRadius: 12,
    ...(Platform.OS === 'web' ? {} : { elevation: 8 }) },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: DesignSystem.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light },
  title: {
    fontSize: DesignSystem.typography.title.fontSize,
    fontWeight: DesignSystem.typography.title.fontWeight as any,
    color: DesignSystem.colors.text.primary },
  closeButton: {
    padding: DesignSystem.spacing.sm },
  userInfo: {
    padding: DesignSystem.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light },
  userName: {
    fontSize: DesignSystem.typography.heading.fontSize,
    fontWeight: DesignSystem.typography.heading.fontWeight as any,
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.xs },
  userEmail: {
    fontSize: DesignSystem.typography.body.fontSize,
    color: DesignSystem.colors.text.secondary },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light },
  tab: {
    flex: 1,
    paddingVertical: DesignSystem.spacing.md,
    alignItems: 'center' },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: DesignSystem.colors.primary },
  tabText: {
    fontSize: DesignSystem.typography.body.fontSize,
    color: DesignSystem.colors.text.secondary,
    fontWeight: '500' },
  tabTextActive: {
    color: DesignSystem.colors.primary,
    fontWeight: '600' },
  contentContainer: {
    flex: 1 },
  overviewContainer: {
    padding: DesignSystem.spacing.lg },
  statusCard: {
    backgroundColor: DesignSystem.colors.background.elevated,
    borderRadius: DesignSystem.radius.md,
    padding: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.lg },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around' },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSystem.spacing.sm },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4 },
  onlineDot: {
    backgroundColor: DesignSystem.colors.success },
  offlineDot: {
    backgroundColor: DesignSystem.colors.gray400 },
  statusLabel: {
    fontSize: DesignSystem.typography.body.fontSize,
    color: DesignSystem.colors.text.secondary },
  statsGrid: {
    flexDirection: 'row',
    gap: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.lg },
  statCard: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background.elevated,
    borderRadius: DesignSystem.radius.md,
    padding: DesignSystem.spacing.md,
    alignItems: 'center' },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: DesignSystem.colors.primary,
    marginBottom: DesignSystem.spacing.xs },
  statLabel: {
    fontSize: DesignSystem.typography.caption.fontSize,
    color: DesignSystem.colors.text.secondary },
  chartContainer: {
    backgroundColor: DesignSystem.colors.background.elevated,
    borderRadius: DesignSystem.radius.md,
    padding: DesignSystem.spacing.md },
  chartTitle: {
    fontSize: DesignSystem.typography.subheading.fontSize,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.md },
  logsContainer: {
    padding: DesignSystem.spacing.lg },
  logItem: {
    flexDirection: 'row',
    marginBottom: DesignSystem.spacing.md,
    gap: DesignSystem.spacing.md },
  logIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center' },
  logContent: {
    flex: 1 },
  logAction: {
    fontSize: DesignSystem.typography.body.fontSize,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
    marginBottom: 2 },
  logDetails: {
    fontSize: DesignSystem.typography.caption.fontSize,
    color: DesignSystem.colors.text.secondary,
    marginBottom: 4 },
  logTime: {
    fontSize: DesignSystem.typography.caption.fontSize,
    color: DesignSystem.colors.text.tertiary },
  emptyState: {
    alignItems: 'center',
    paddingVertical: DesignSystem.spacing.xxl },
  emptyText: {
    fontSize: DesignSystem.typography.body.fontSize,
    color: DesignSystem.colors.text.tertiary,
    marginTop: DesignSystem.spacing.md } });