/**
 * 主管儀表板
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
import { Layout } from '@/components/common/Layout';

export const ManagerDashboard: React.FC = () => {

  const managementActions = [
    {
      id: 'team-performance',
      title: '團隊績效',
      subtitle: '查看團隊表現',
      icon: 'analytics' as keyof typeof Ionicons.glyphMap,
      color: '#007AFF',
      onPress: () => {
        console.log('查看團隊績效');
      },
    },
    {
      id: 'assign-customers',
      title: '分配客戶',
      subtitle: '客戶分配管理',
      icon: 'people' as keyof typeof Ionicons.glyphMap,
      color: '#34C759',
      onPress: () => {
        console.log('分配客戶');
      },
    },
    {
      id: 'team-meetings',
      title: '團隊會議',
      subtitle: '檢視會議記錄',
      icon: 'calendar' as keyof typeof Ionicons.glyphMap,
      color: '#FF9500',
      onPress: () => {
        console.log('團隊會議');
      },
    },
    {
      id: 'ai-insights',
      title: 'AI 洞察',
      subtitle: '業務智能分析',
      icon: 'bulb' as keyof typeof Ionicons.glyphMap,
      color: '#FF3B30',
      onPress: () => {
        console.log('AI 洞察');
      },
    },
  ];

  const teamStats = [
    { label: '團隊成員', value: '8', color: '#007AFF' },
    { label: '本月會議', value: '45', color: '#34C759' },
    { label: '活躍客戶', value: '32', color: '#FF9500' },
    { label: 'AI 使用量', value: '156min', color: '#FF3B30' },
  ];

  const teamMembers = [
    { name: '王小明', role: '資深業務', meetings: 12, customers: 8, status: 'active' },
    { name: '李小華', role: '業務專員', meetings: 8, customers: 6, status: 'active' },
    { name: '張大同', role: '業務專員', meetings: 6, customers: 4, status: 'warning' },
  ];

  return (
    <Layout scrollable={false}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* 歡迎區塊 */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>
            主管面板 📊
          </Text>
          <Text style={styles.welcomeSubtext}>
            管理您的團隊，掌握業務動態
          </Text>
        </View>

        {/* 團隊統計 */}
        <View style={styles.statsContainer}>
          {teamStats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <Text style={[styles.statValue, { color: stat.color }]}>
                {stat.value}
              </Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* 管理操作 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>管理功能</Text>
          <View style={styles.actionsGrid}>
            {managementActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionCard}
                onPress={action.onPress}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIcon, { backgroundColor: `${action.color}15` }]}>
                  <Ionicons
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

        {/* 團隊成員概覽 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>團隊成員</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>查看全部</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.teamCard}>
            {teamMembers.map((member, index) => (
              <View key={index} style={styles.memberItem}>
                <View style={styles.memberInfo}>
                  <View style={styles.memberHeader}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: member.status === 'active' ? '#34C759' : '#FF9500' }
                    ]}>
                      <Text style={styles.statusText}>
                        {member.status === 'active' ? '活躍' : '注意'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.memberRole}>{member.role}</Text>
                  <View style={styles.memberStats}>
                    <Text style={styles.memberStatText}>
                      {member.meetings} 場會議 • {member.customers} 位客戶
                    </Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.memberAction}>
                  <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* AI 推薦 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>管理建議</Text>
          <View style={styles.suggestionCard}>
            <View style={styles.suggestionHeader}>
              <Ionicons name="trending-up" size={20} color="#34C759" />
              <Text style={styles.suggestionTitle}>績效提升建議</Text>
            </View>
            <Text style={styles.suggestionText}>
              張大同本月會議數量較低，建議安排額外培訓或分配更多潛在客戶。
            </Text>
          </View>
          
          <View style={[styles.suggestionCard, { marginTop: 12 }]}>
            <View style={styles.suggestionHeader}>
              <Ionicons name="time" size={20} color="#FF9500" />
              <Text style={styles.suggestionTitle}>時間管理優化</Text>
            </View>
            <Text style={styles.suggestionText}>
              團隊平均會議時長較長，建議制定會議效率指南以提升生產力。
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  viewAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  actionsGrid: {
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
  teamCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  memberInfo: {
    flex: 1,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  memberRole: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  memberStats: {
    marginTop: 4,
  },
  memberStatText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  memberAction: {
    padding: 8,
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