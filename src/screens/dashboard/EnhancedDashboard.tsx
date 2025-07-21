/**
 * 增強版首頁（含模式切換）
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Layout } from '@/components/common/Layout';
import { ModeToggle } from '@/components/common/ModeToggle';
import { useAuthStore } from '@/stores/authStore';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const EnhancedDashboard: React.FC = () => {
  const { user, mode, toggleMode } = useAuthStore();
  const navigation = useNavigation<NavigationProp>();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // 模擬重新整理
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  // 統計卡片資料
  const statsCards = mode === 'business' 
    ? [
        { id: '1', title: '本月業績', value: '$125,000', change: '+12%', icon: 'trending-up-outline' as const },
        { id: '2', title: '拜訪次數', value: '48', change: '+5', icon: 'people-outline' as const },
        { id: '3', title: '待辦任務', value: '12', change: '3 逾期', icon: 'checkbox-outline' as const },
        { id: '4', title: '成交率', value: '68%', change: '+3%', icon: 'checkmark-circle-outline' as const },
      ]
    : [
        { id: '1', title: '團隊業績', value: '$850,000', change: '+15%', icon: 'trending-up-outline' as const },
        { id: '2', title: '團隊人數', value: '12', change: '活躍 10', icon: 'people-outline' as const },
        { id: '3', title: '待審批', value: '5', change: '2 緊急', icon: 'time-outline' as const },
        { id: '4', title: '達成率', value: '87%', change: '+8%', icon: 'stats-chart-outline' as const },
      ];

  // 快速操作
  const quickActions = mode === 'business'
    ? [
        { id: '1', title: '新增客戶', icon: 'person-add-outline' as const, action: () => navigation.navigate('CreateCustomerModal') },
        { id: '2', title: '記錄拜訪', icon: 'document-text-outline' as const, action: () => navigation.navigate('CreateRecordModal') },
        { id: '3', title: '建立任務', icon: 'checkbox-outline' as const, action: () => navigation.navigate('CreateTaskModal') },
        { id: '4', title: '查看行程', icon: 'calendar-outline' as const, action: () => {} },
      ]
    : [
        { id: '1', title: '團隊報表', icon: 'bar-chart-outline' as const, action: () => {} },
        { id: '2', title: '審批中心', icon: 'checkmark-done-outline' as const, action: () => {} },
        { id: '3', title: '指派任務', icon: 'send-outline' as const, action: () => {} },
        { id: '4', title: '團隊行程', icon: 'calendar-outline' as const, action: () => {} },
      ];

  // 最近活動
  const recentActivities = [
    { id: '1', type: 'visit', title: '拜訪了客戶 張小明', time: '2 小時前', icon: 'people-outline' as const },
    { id: '2', type: 'deal', title: '完成訂單 #12345', time: '4 小時前', icon: 'cart-outline' as const },
    { id: '3', type: 'task', title: '完成任務：聯繫新客戶', time: '昨天', icon: 'checkbox-outline' as const },
    { id: '4', type: 'meeting', title: '參加產品培訓會議', time: '昨天', icon: 'calendar-outline' as const },
  ];

  return (
    <Layout style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 頭部區域 */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || '使用者'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
          </View>
          <ModeToggle
            value={mode}
            onToggle={toggleMode}
            label={mode === 'business' ? '業務模式' : '主管模式'}
          />
        </View>

        {/* 統計卡片 */}
        <View style={styles.statsContainer}>
          {statsCards.map((card) => (
            <View key={card.id} style={styles.statsCard}>
              <View style={styles.statsCardHeader}>
                <Ionicons name={card.icon} size={20} color="#1A1A1A" />
                <Text style={styles.statsChange}>{card.change}</Text>
              </View>
              <Text style={styles.statsValue}>{card.value}</Text>
              <Text style={styles.statsTitle}>{card.title}</Text>
            </View>
          ))}
        </View>

        {/* 快速操作 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>快速操作</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionCard}
                onPress={action.action}
                activeOpacity={0.7}
              >
                <View style={styles.quickActionIcon}>
                  <Ionicons name={action.icon} size={24} color="#1A1A1A" />
                </View>
                <Text style={styles.quickActionTitle}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 最近活動 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>最近活動</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>查看全部</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.activitiesList}>
            {recentActivities.map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Ionicons name={activity.icon} size={20} color="#999999" />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityTime}>{activity.time}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 提醒卡片 */}
        <View style={styles.section}>
          <View style={styles.reminderCard}>
            <Ionicons name="notifications-outline" size={24} color="#F59E0B" />
            <View style={styles.reminderContent}>
              <Text style={styles.reminderTitle}>今日提醒</Text>
              <Text style={styles.reminderText}>
                您有 3 個待跟進的客戶和 2 個即將到期的任務
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999999" />
          </View>
        </View>
      </ScrollView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#666666',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
  },
  statsCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statsCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statsTitle: {
    fontSize: 14,
    color: '#666666',
  },
  statsChange: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',  // 改為中灰色，更柔和
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  seeAllText: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  activitiesList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    color: '#1A1A1A',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 14,
    color: '#666666',
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  reminderContent: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  reminderText: {
    fontSize: 14,
    color: '#666666',
  },
});