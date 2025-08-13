/**
 * 個人資料畫面
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
// Icon import removed - using platform-specific Icon component;
import { Icon } from '@/components/common/Icon';
import { Layout } from '@/components/common/Layout';
import { Button } from '@/components/common/Button';
import { useAuthStore } from '@/stores/authStore';

export const ProfileScreen: React.FC = () => {
  const { user, signOut } = useAuthStore();

  const handleSignOut = () => {
    Alert.alert(
      '確認登出',
      '您確定要登出嗎？',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '登出', 
          style: 'destructive',
          onPress: () => signOut()
        },
      ]
    );
  };

  const profileItems = [
    {
      icon: 'person-outline' as string,
      title: '編輯個人資料',
      subtitle: '更新您的基本資訊',
      onPress: () => console.log('編輯個人資料') },
    {
      icon: 'notifications-outline' as string,
      title: '通知設定',
      subtitle: '管理推播通知偏好',
      onPress: () => console.log('通知設定') },
    {
      icon: 'lock-closed-outline' as string,
      title: '隱私設定',
      subtitle: '資料安全與隱私控制',
      onPress: () => console.log('隱私設定') },
    {
      icon: 'help-circle-outline' as string,
      title: '幫助與支援',
      subtitle: '常見問題與聯絡客服',
      onPress: () => console.log('幫助與支援') },
  ];

  return (
    <Layout>
      <View style={styles.container}>
        {/* 使用者資訊卡片 */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>
                {user?.role === 'admin' ? '管理員' : 
                 user?.role === 'manager' ? '主管' : '業務員'}
              </Text>
            </View>
          </View>
        </View>

        {/* 設定選項 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>設定</Text>
          <View style={styles.settingsCard}>
            {profileItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.settingItem}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.settingLeft}>
                  <View style={styles.settingIcon}>
                    <Icon name={item.icon} size={20} color="#1A1A1A" />
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingTitle}>{item.title}</Text>
                    <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                  </View>
                </View>
                <Icon name="chevron-forward" size={20} color="#8E8E93" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 應用程式資訊 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>應用程式</Text>
          <View style={styles.appInfoCard}>
            <View style={styles.appInfoItem}>
              <Text style={styles.appInfoLabel}>版本</Text>
              <Text style={styles.appInfoValue}>1.0.0</Text>
            </View>
            <View style={styles.appInfoItem}>
              <Text style={styles.appInfoLabel}>組織</Text>
              <Text style={styles.appInfoValue}>{user?.organizationId}</Text>
            </View>
          </View>
        </View>

        {/* 登出按鈕 */}
        <View style={styles.logoutSection}>
          <Button
            title="登出"
            onPress={handleSignOut}
            variant="outline"
            style={styles.logoutButton}
            textStyle={styles.logoutButtonText}
          />
        </View>
      </View>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA' },
  userCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2C2C2C',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16 },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF' },
  userInfo: {
    flex: 1 },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4 },
  userEmail: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 8 },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#2C2C2C15',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12 },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2C2C2C' },
  section: {
    padding: 16 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12 },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden' },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7' },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1 },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12 },
  settingContent: {
    flex: 1 },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 2 },
  settingSubtitle: {
    fontSize: 12,
    color: '#8E8E93' },
  appInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16 },
  appInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8 },
  appInfoLabel: {
    fontSize: 16,
    color: '#1C1C1E' },
  appInfoValue: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500' },
  logoutSection: {
    padding: 16,
    marginTop: 'auto' },
  logoutButton: {
    borderColor: '#FF3B30' },
  logoutButtonText: {
    color: '#FF3B30' } });