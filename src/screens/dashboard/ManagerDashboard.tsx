/**
 * 主管儀表板
 * 基於單色灰階設計系統，專注於報表顯示
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Layout } from '@/components/common/Layout';
import { ModeToggle } from '@/components/common/ModeToggle';
import { useAuthStore } from '@/stores/authStore';
import { useAuth } from '@/hooks/useAuth';
import { AnnouncementModal } from '@/screens/manager/AnnouncementModal';
import { TaskAssignmentModal } from '@/screens/manager/TaskAssignmentModal';
import { SavedReportsGrid } from '@/components/manager/SavedReportsGrid';
import { colors } from '@/theme/colors';
import { DesignSystem } from '@/theme/designSystem';

export const ManagerDashboard: React.FC = () => {
  const { user: authUser } = useAuth();
  const { user, mode, toggleMode } = useAuthStore();
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showTaskAssignmentModal, setShowTaskAssignmentModal] = useState(false);

  // 簡化的團隊統計 - 使用灰階顏色
  const teamStats = [
    { label: '團隊成員', value: '8', color: colors.text },
    { label: '本月會議', value: '45', color: colors.textSecondary },
    { label: '活躍客戶', value: '32', color: colors.text },
    { label: 'AI 使用量', value: '156min', color: colors.textSecondary },
  ];

  return (
    <Layout scrollable={false}>
      <SafeAreaView style={styles.safeArea}>
        {/* 固定頭部 */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || authUser?.displayName || '使用者'}</Text>
            <Text style={styles.userEmail}>{user?.email || authUser?.email}</Text>
          </View>
          <ModeToggle
            value={mode}
            onToggle={toggleMode}
            label={mode === 'business' ? '業務模式' : '主管模式'}
          />
        </View>
        
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* 快速操作按鈕 - 使用深灰色 */}
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={[styles.quickActionButton, styles.primaryButton]}
              onPress={() => setShowAnnouncementModal(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="megaphone-outline" size={24} color={colors.background} />
              <Text style={styles.quickActionText}>佈達</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickActionButton, styles.primaryButton]}
              onPress={() => setShowTaskAssignmentModal(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="person-add-outline" size={24} color={colors.background} />
              <Text style={styles.quickActionText}>指派</Text>
            </TouchableOpacity>
          </View>

          {/* 主要內容 - 統計報表 */}
          <View style={styles.mainContent}>
            <Text style={styles.mainTitle}>數據分析</Text>
            <Text style={styles.mainSubtitle}>查看團隊績效與業務洞察</Text>
            
            {/* 報表網格 - 作為主要內容 */}
            <View style={styles.reportsContainer}>
              <SavedReportsGrid fullScreen={true} />
            </View>
          </View>
          
          {/* 團隊統計 - 移到次要位置 */}
          <View style={styles.statsSection}>
            <Text style={styles.statsSectionTitle}>快速統計</Text>
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
          </View>
        </ScrollView>
      </SafeAreaView>
      
      {/* 模態框 */}
      <AnnouncementModal
        visible={showAnnouncementModal}
        onClose={() => setShowAnnouncementModal(false)}
      />
      
      <TaskAssignmentModal
        visible={showTaskAssignmentModal}
        onClose={() => setShowTaskAssignmentModal(false)}
      />
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background.primary,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingVertical: DesignSystem.spacing.md,
    backgroundColor: DesignSystem.colors.background.surface,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...DesignSystem.typography.h3,
    color: DesignSystem.colors.text.primary,
    marginBottom: 2,
  },
  userEmail: {
    ...DesignSystem.typography.bodySmall,
    color: DesignSystem.colors.text.secondary,
  },
  quickActions: {
    flexDirection: 'row',
    padding: DesignSystem.spacing.md,
    gap: DesignSystem.spacing.sm,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.sm,
    gap: DesignSystem.spacing.sm,
    ...DesignSystem.shadows.md,
  },
  primaryButton: {
    backgroundColor: DesignSystem.colors.primary,
  },
  quickActionText: {
    ...DesignSystem.typography.button,
    color: DesignSystem.colors.text.inverse,
  },
  mainContent: {
    padding: DesignSystem.spacing.md,
  },
  mainTitle: {
    ...DesignSystem.typography.h2,
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.xs,
  },
  mainSubtitle: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.secondary,
    marginBottom: DesignSystem.spacing.lg,
  },
  reportsContainer: {
    minHeight: 400,
  },
  statsSection: {
    padding: DesignSystem.spacing.md,
    paddingTop: 0,
  },
  statsSectionTitle: {
    ...DesignSystem.typography.h4,
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.md,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: DesignSystem.spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background.surface,
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.sm,
    alignItems: 'center',
    ...DesignSystem.shadows.sm,
  },
  statValue: {
    ...DesignSystem.typography.h3,
    marginBottom: DesignSystem.spacing.xs,
  },
  statLabel: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.tertiary,
    textAlign: 'center',
  },
});