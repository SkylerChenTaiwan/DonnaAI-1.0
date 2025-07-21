/**
 * 設定頁面
 */

import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Layout } from '@/components/common/Layout';
import { SettingSection } from '@/components/settings/SettingSection';
import { useAuthStore } from '@/stores/authStore';
import { SettingSection as SettingSectionType } from '@/types/settings';

export const SettingsScreen: React.FC = () => {
  const { user, mode, signOut } = useAuthStore();
  const [settings, setSettings] = useState({
    notifications: true,
    soundEffects: true,
    autoSync: true,
    dataUsage: 'wifi',
    theme: 'auto',
  });

  const handleSettingChange = (settingId: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [settingId]: value,
    }));
  };

  const handleSignOut = () => {
    Alert.alert(
      '登出確認',
      '確定要登出嗎？',
      [
        { text: '取消', style: 'cancel' },
        { text: '登出', style: 'destructive', onPress: signOut },
      ],
      { cancelable: true }
    );
  };

  // 根據模式顯示不同的設定項目
  const businessSections: SettingSectionType[] = [
    {
      id: 'general',
      title: '一般設定',
      items: [
        {
          id: 'notifications',
          title: '推播通知',
          subtitle: '接收任務提醒和客戶更新',
          type: 'switch',
          value: settings.notifications,
          icon: 'notifications-outline',
        },
        {
          id: 'soundEffects',
          title: '音效',
          subtitle: '操作音效和提示音',
          type: 'switch',
          value: settings.soundEffects,
          icon: 'volume-high-outline',
        },
        {
          id: 'theme',
          title: '外觀主題',
          subtitle: '自動',
          type: 'select',
          value: settings.theme,
          icon: 'color-palette-outline',
          action: () => console.log('Select theme'),
        },
      ],
    },
    {
      id: 'data',
      title: '資料與同步',
      items: [
        {
          id: 'autoSync',
          title: '自動同步',
          subtitle: '自動備份資料到雲端',
          type: 'switch',
          value: settings.autoSync,
          icon: 'cloud-outline',
        },
        {
          id: 'dataUsage',
          title: '資料使用',
          subtitle: '僅 Wi-Fi',
          type: 'select',
          value: settings.dataUsage,
          icon: 'wifi-outline',
          action: () => console.log('Select data usage'),
        },
        {
          id: 'export',
          title: '匯出資料',
          type: 'action',
          icon: 'download-outline',
          action: () => Alert.alert('匯出資料', '功能開發中'),
        },
      ],
    },
    {
      id: 'about',
      title: '關於',
      items: [
        {
          id: 'help',
          title: '說明與支援',
          type: 'navigation',
          icon: 'help-circle-outline',
          action: () => console.log('Open help'),
        },
        {
          id: 'privacy',
          title: '隱私權政策',
          type: 'navigation',
          icon: 'shield-outline',
          action: () => console.log('Open privacy'),
        },
        {
          id: 'version',
          title: '版本',
          subtitle: '1.0.0',
          type: 'navigation',
          icon: 'information-circle-outline',
        },
      ],
    },
  ];

  const managerSections: SettingSectionType[] = [
    ...businessSections,
    {
      id: 'management',
      title: '管理功能',
      items: [
        {
          id: 'teamNotifications',
          title: '團隊通知',
          subtitle: '接收團隊成員的活動更新',
          type: 'switch',
          value: true,
          icon: 'people-outline',
        },
        {
          id: 'approvalAlerts',
          title: '審批提醒',
          subtitle: '待審批項目的即時通知',
          type: 'switch',
          value: true,
          icon: 'checkmark-done-outline',
        },
        {
          id: 'reportFrequency',
          title: '報表頻率',
          subtitle: '每週',
          type: 'select',
          value: 'weekly',
          icon: 'bar-chart-outline',
          action: () => console.log('Select report frequency'),
        },
      ],
    },
  ];

  const sections = mode === 'manager' ? managerSections : businessSections;

  return (
    <Layout style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 使用者資訊 */}
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user?.name || '使用者'}</Text>
            <Text style={styles.userEmail}>{user?.email || ''}</Text>
            <Text style={styles.userRole}>
              {mode === 'manager' ? '主管模式' : '業務模式'}
            </Text>
          </View>
        </View>

        {/* 設定區塊 */}
        {sections.map((section) => (
          <SettingSection
            key={section.id}
            {...section}
            onItemValueChange={handleSettingChange}
          />
        ))}

        {/* 登出按鈕 */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>登出</Text>
        </TouchableOpacity>

        <View style={styles.footer} />
      </ScrollView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 12,
    fontWeight: '500',
    color: '#007AFF',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  signOutButton: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
  footer: {
    height: 40,
  },
});