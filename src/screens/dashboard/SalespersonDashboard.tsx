/**
 * 業務員儀表板
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Icon } from '@/components/common/Icon';
import { Layout } from '@/components/common/Layout';
import { useAuthStore } from '@/stores/authStore';

export const SalespersonDashboard: React.FC = () => {
  const { user } = useAuthStore();

  const quickActions = [
    {
      id: 'new-meeting',
      title: '新增會議',
      subtitle: '記錄客戶會議',
      icon: 'add-circle' as keyof typeof Ionicons.glyphMap,
      color: '#007AFF',
      onPress: () => {
        // TODO: 導航到新增會議畫面
        console.log('導航到新增會議');
      },
    },
    {
      id: 'record-audio',
      title: 'AI 錄音',
      subtitle: '會議錄音轉文字',
      icon: 'mic' as keyof typeof Ionicons.glyphMap,
      color: '#FF3B30',
      onPress: () => {
        // TODO: 開始錄音功能
        console.log('開始錄音');
      },
    },
    {
      id: 'view-customers',
      title: '我的客戶',
      subtitle: '查看客戶列表',
      icon: 'people' as keyof typeof Ionicons.glyphMap,
      color: '#34C759',
      onPress: () => {
        // TODO: 導航到客戶列表
        console.log('查看客戶');
      },
    },
    {
      id: 'quick-note',
      title: '快速筆記',
      subtitle: '記錄重要事項',
      icon: 'document-text' as keyof typeof Ionicons.glyphMap,
      color: '#FF9500',
      onPress: () => {
        // TODO: 開啟筆記功能
        console.log('快速筆記');
      },
    },
  ];

  const stats = [
    { label: '本月會議', value: '12', color: '#007AFF' },
    { label: '活躍客戶', value: '8', color: '#34C759' },
    { label: 'AI 分析', value: '5', color: '#FF9500' },
    { label: '待跟進', value: '3', color: '#FF3B30' },
  ];

  return (
    <Layout scrollable={false}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* 歡迎區塊 */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>
            哈囉 {user?.name} 👋
          </Text>
          <Text style={styles.welcomeSubtext}>
            今天準備好征服業務目標了嗎？
          </Text>
        </View>

        {/* 統計卡片 */}
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <Text style={[styles.statValue, { color: stat.color }]}>
                {stat.value}
              </Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
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
                style={styles.actionCard}
                onPress={action.onPress}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIcon, { backgroundColor: `${action.color}15` }]}>
                  <Icon
                    name={action.icon}
                    size={24}
                    color={action.color}
                  />
                </View>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 最近活動 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>最近活動</Text>
          <View style={styles.activityCard}>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Icon name="calendar" size={16} color="#1A1A1A" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>與王先生會議</Text>
                <Text style={styles.activityTime}>2 小時前</Text>
              </View>
            </View>
            
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Icon name="person-add" size={16} color="#34C759" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>新增客戶：李小姐</Text>
                <Text style={styles.activityTime}>昨天</Text>
              </View>
            </View>
            
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Icon name="mic" size={16} color="#FF9500" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>AI 轉錄完成</Text>
                <Text style={styles.activityTime}>2 天前</Text>
              </View>
            </View>
          </View>
        </View>

        {/* AI 建議 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI 智能建議</Text>
          <View style={styles.suggestionCard}>
            <View style={styles.suggestionHeader}>
              <Icon name="bulb" size={20} color="#FF9500" />
              <Text style={styles.suggestionTitle}>今日建議</Text>
            </View>
            <Text style={styles.suggestionText}>
              根據您的客戶互動模式，建議在下午 2-4 點聯繫王先生，此時段回應率較高。
            </Text>
          </View>
        </View>
      </ScrollView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  welcomeSection: {
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  welcomeSubtext: {
    fontSize: 16,
    color: '#8E8E93',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#8E8E93',
  },
  suggestionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginLeft: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: '#3C3C43',
    lineHeight: 20,
  },
});