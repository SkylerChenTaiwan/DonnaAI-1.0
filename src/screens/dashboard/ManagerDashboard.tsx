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
  Platform } from 'react-native';
import { Icon } from '@/components/common/Icon';
import { Layout } from '@/components/common/Layout';
import { ResponsiveLayout } from '@/components/common/ResponsiveLayout';
import { isWebPlatform, isDesktopWeb, isTabletWeb } from '@/utils/web-detector';
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
  
  const isWeb = isWebPlatform();
  const isDesktop = isDesktopWeb();
  const isTablet = isTabletWeb();
  const useResponsiveLayout = isWeb && (isDesktop || isTablet);
  
  const headerContent = (
    <View style={StyleSheet.flatten([styles.header, useResponsiveLayout && styles.webHeader])}>
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
  );
  
  const mainContent = (
    <>
      {/* 快速操作按鈕 - 使用深灰色 */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={StyleSheet.flatten([styles.quickActionButton, styles.primaryButton])}
          onPress={() => setShowAnnouncementModal(true)}
          activeOpacity={0.7}
        >
          <Icon name="megaphone-outline" size={24} color={colors.background} />
          <Text style={styles.quickActionText}>資訊佈達</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={StyleSheet.flatten([styles.quickActionButton, styles.primaryButton])}
          onPress={() => setShowTaskAssignmentModal(true)}
          activeOpacity={0.7}
        >
          <Icon name="person-add-outline" size={24} color={colors.background} />
          <Text style={styles.quickActionText}>任務指派</Text>
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
    </>
  );
  
  // Web 桌面/平板版使用響應式佈局
  if (useResponsiveLayout) {
    return (
      <>
        <ResponsiveLayout
          style={styles.container}
          header={headerContent}
          padding={false}
        >
          <View style={styles.webContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {mainContent}
            </ScrollView>
          </View>
        </ResponsiveLayout>
        
        {/* 模態框 */}
        <AnnouncementModal
          visible={showAnnouncementModal}
          onClose={() => setShowAnnouncementModal(false)}
        />
        
        <TaskAssignmentModal
          visible={showTaskAssignmentModal}
          onClose={() => setShowTaskAssignmentModal(false)}
        />
      </>
    );
  }

  // 原生平台維持原有佈局
  return (
    <Layout scrollable={false}>
      <SafeAreaView style={styles.safeArea}>
        {headerContent}
        
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {mainContent}
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
    backgroundColor: DesignSystem.colors.background.primary },
  safeArea: {
    flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingVertical: DesignSystem.spacing.md,
    backgroundColor: DesignSystem.colors.background.surface,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light },
  userInfo: {
    flex: 1 },
  userName: {
    ...DesignSystem.typography.h3,
    color: DesignSystem.colors.text.primary,
    marginBottom: 2 },
  userEmail: {
    ...DesignSystem.typography.bodySmall,
    color: DesignSystem.colors.text.secondary },
  quickActions: {
    flexDirection: 'row',
    padding: DesignSystem.spacing.md,
    gap: DesignSystem.spacing.sm },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: DesignSystem.spacing.md,
    borderRadius: 20,
    gap: DesignSystem.spacing.sm,
    ...DesignSystem.shadows.none },
  primaryButton: {
    backgroundColor: DesignSystem.colors.gray[600], // 使用較淺的灰色
  },
  quickActionText: {
    ...DesignSystem.typography.button,
    color: DesignSystem.colors.text.inverse },
  mainContent: {
    padding: DesignSystem.spacing.md },
  mainTitle: {
    ...DesignSystem.typography.h2,
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.xs },
  mainSubtitle: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.secondary,
    marginBottom: DesignSystem.spacing.lg },
  reportsContainer: {
    minHeight: 400 },
  // Web 響應式樣式
  webHeader: {
    ...Platform.select({
      web: {
        paddingHorizontal: 32,
        paddingVertical: 20 },
      default: {} }) },
  webContent: {
    flex: 1,
    ...Platform.select({
      web: {
        maxWidth: 1200,
        width: '100%',
        marginHorizontal: 'auto' as any,
        paddingHorizontal: 32,
        paddingVertical: 24 },
      default: {} }) } });