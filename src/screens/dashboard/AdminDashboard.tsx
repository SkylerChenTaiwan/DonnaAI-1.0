/**
 * 管理員儀表板
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity, Platform } from 'react-native';
// Icon import removed - using platform-specific Icon component;
import { Icon } from '@/components/common/Icon';
import { Layout } from '@/components/common/Layout';

export const AdminDashboard: React.FC = () => {

  const adminActions = [
    {
      id: 'organization-management',
      title: '組織管理',
      subtitle: '管理組織設定',
      icon: 'business' as string,
      color: '#007AFF',
      onPress: () => {
        console.log('組織管理');
      } },
    {
      id: 'user-management',
      title: '使用者管理',
      subtitle: '新增/編輯使用者',
      icon: 'people' as string,
      color: '#34C759',
      onPress: () => {
        console.log('使用者管理');
      } },
    {
      id: 'ai-usage',
      title: 'AI 使用統計',
      subtitle: '查看 AI 使用情況',
      icon: 'analytics' as string,
      color: '#FF9500',
      onPress: () => {
        console.log('AI 使用統計');
      } },
    {
      id: 'billing',
      title: '計費管理',
      subtitle: '訂閱與帳單',
      icon: 'card' as string,
      color: '#FF3B30',
      onPress: () => {
        console.log('計費管理');
      } },
  ];

  const organizationStats = [
    { label: '總使用者', value: '24', color: '#007AFF' },
    { label: 'AI 配額', value: '1440min', color: '#34C759' },
    { label: '已使用', value: '856min', color: '#FF9500' },
    { label: '剩餘配額', value: '584min', color: '#FF3B30' },
  ];

  return (
    <Layout scrollable={false}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* 歡迎區塊 */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>
            管理中心 ⚙️
          </Text>
          <Text style={styles.welcomeSubtext}>
            管理整個組織的 DonnaAI 系統
          </Text>
        </View>

        {/* 組織統計 */}
        <View style={styles.statsContainer}>
          {organizationStats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <Text style={[styles.statValue, { color: stat.color }]}>
                {stat.value}
              </Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* 管理功能 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>系統管理</Text>
          <View style={styles.actionsGrid}>
            {adminActions.map((action) => (
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

        {/* 系統狀態 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>系統狀態</Text>
          <View style={styles.statusCard}>
            <View style={styles.statusItem}>
              <View style={styles.statusIndicator}>
                <View style={[styles.statusDot, { backgroundColor: '#34C759' }]} />
                <Text style={styles.statusTitle}>Firebase 連線</Text>
              </View>
              <Text style={styles.statusValue}>正常</Text>
            </View>
            
            <View style={styles.statusItem}>
              <View style={styles.statusIndicator}>
                <View style={[styles.statusDot, { backgroundColor: '#34C759' }]} />
                <Text style={styles.statusTitle}>AI 服務</Text>
              </View>
              <Text style={styles.statusValue}>運行中</Text>
            </View>
            
            <View style={styles.statusItem}>
              <View style={styles.statusIndicator}>
                <View style={[styles.statusDot, { backgroundColor: '#FF9500' }]} />
                <Text style={styles.statusTitle}>儲存空間</Text>
              </View>
              <Text style={styles.statusValue}>68% 使用</Text>
            </View>
          </View>
        </View>

        {/* 最近活動 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>系統活動</Text>
          <View style={styles.activityCard}>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Icon name="person-add" size={16} color="#34C759" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>新使用者註冊</Text>
                <Text style={styles.activityTime}>30 分鐘前</Text>
              </View>
            </View>
            
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Icon name="warning" size={16} color="#FF9500" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>AI 配額警告</Text>
                <Text style={styles.activityTime}>2 小時前</Text>
              </View>
            </View>
            
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Icon name="checkmark-circle" size={16} color="#1A1A1A" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>系統備份完成</Text>
                <Text style={styles.activityTime}>4 小時前</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 快速統計 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>使用統計</Text>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>本月概況</Text>
            <View style={styles.summaryStats}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>新增會議</Text>
                <Text style={styles.summaryValue}>145</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>AI 轉錄</Text>
                <Text style={styles.summaryValue}>89</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>新客戶</Text>
                <Text style={styles.summaryValue}>32</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA' },
  welcomeSection: {
    padding: 24,
    backgroundColor: '#FFFFFF' },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4 },
  welcomeSubtext: {
    fontSize: 16,
    color: '#8E8E93' },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    ...(Platform.OS === 'web' ? {} : { ...(Platform.OS === 'web' ? {} : { shadowOffset: { width: 0, height: 1 } }) }),
    shadowOpacity: 0.05,
    shadowRadius: 2,
    ...(Platform.OS === 'web' ? {} : { elevation: 1 }) },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4 },
  statLabel: {
    fontSize: 10,
    color: '#8E8E93',
    textAlign: 'center' },
  section: {
    padding: 16 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16 },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12 },
  actionCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    ...(Platform.OS === 'web' ? {} : { ...(Platform.OS === 'web' ? {} : { shadowOffset: { width: 0, height: 1 } }) }),
    shadowOpacity: 0.05,
    shadowRadius: 2,
    ...(Platform.OS === 'web' ? {} : { elevation: 1 }) },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12 },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
    textAlign: 'center' },
  actionSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center' },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    ...(Platform.OS === 'web' ? {} : { ...(Platform.OS === 'web' ? {} : { shadowOffset: { width: 0, height: 1 } }) }),
    shadowOpacity: 0.05,
    shadowRadius: 2,
    ...(Platform.OS === 'web' ? {} : { elevation: 1 }) },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7' },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center' },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12 },
  statusTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E' },
  statusValue: {
    fontSize: 14,
    color: '#8E8E93' },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    ...(Platform.OS === 'web' ? {} : { ...(Platform.OS === 'web' ? {} : { shadowOffset: { width: 0, height: 1 } }) }),
    shadowOpacity: 0.05,
    shadowRadius: 2,
    ...(Platform.OS === 'web' ? {} : { elevation: 1 }) },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7' },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12 },
  activityContent: {
    flex: 1 },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 2 },
  activityTime: {
    fontSize: 12,
    color: '#8E8E93' },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    ...(Platform.OS === 'web' ? {} : { ...(Platform.OS === 'web' ? {} : { shadowOffset: { width: 0, height: 1 } }) }),
    shadowOpacity: 0.05,
    shadowRadius: 2,
    ...(Platform.OS === 'web' ? {} : { elevation: 1 }) },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16 },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between' },
  summaryItem: {
    alignItems: 'center' },
  summaryLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4 },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF' } });