/**
 * 設定頁面
 */

import React, { useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { Layout } from '@/components/common/Layout';
import { SettingSection } from '@/components/settings/SettingSection';
import { useAuthStore } from '@/stores/authStore';
import { SettingSection as SettingSectionType } from '@/types/settings';
import { useSettings, useNotificationSettings, useSoundSettings } from '@/hooks/useSettings';
import { soundManager } from '@/utils/sounds';
import { enableNotifications, disableNotifications } from '@/services/notifications';
import { exportUserData, estimateExportSize } from '@/services/dataExport';
import Constants from 'expo-constants';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation';
import { Ionicons } from '@expo/vector-icons';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const SettingsScreen: React.FC = () => {
  const { user, mode, signOut } = useAuthStore();
  const navigation = useNavigation<NavigationProp>();
  const { settings, loading: settingsLoading } = useSettings();
  const { enabled: notificationsEnabled, toggleNotifications } = useNotificationSettings();
  const { enabled: soundsEnabled, toggleSounds } = useSoundSettings();

  // 初始化音效管理器
  useEffect(() => {
    soundManager.initialize().catch(console.error);
  }, []);

  // 當音效設定變更時更新音效管理器
  useEffect(() => {
    soundManager.setEnabled(soundsEnabled);
  }, [soundsEnabled]);

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

  const handleExportData = async () => {
    try {
      // 先估算檔案大小
      const sizeEstimate = await estimateExportSize(['all'], 'json');
      
      // 使用 ActionSheet 讓使用者選擇格式
      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: ['取消', 'CSV 格式', 'JSON 格式'],
            cancelButtonIndex: 0,
            message: `預估檔案大小：${sizeEstimate}`,
          },
          async (buttonIndex) => {
            if (buttonIndex === 1) {
              // CSV 格式
              await exportUserData({
                format: 'csv',
                dataTypes: ['all'],
              });
            } else if (buttonIndex === 2) {
              // JSON 格式
              await exportUserData({
                format: 'json',
                dataTypes: ['all'],
              });
            }
          }
        );
      } else {
        // Android 使用 Alert
        Alert.alert(
          '選擇匯出格式',
          `請選擇資料匯出格式\n預估檔案大小：${sizeEstimate}`,
          [
            { text: '取消', style: 'cancel' },
            { 
              text: 'CSV 格式', 
              onPress: async () => {
                await exportUserData({
                  format: 'csv',
                  dataTypes: ['all'],
                });
              }
            },
            { 
              text: 'JSON 格式', 
              onPress: async () => {
                await exportUserData({
                  format: 'json',
                  dataTypes: ['all'],
                });
              }
            },
          ]
        );
      }
    } catch (error) {
      console.error('準備匯出資料失敗:', error);
      Alert.alert('匯出失敗', '無法準備匯出資料，請稍後再試', [{ text: '確定' }]);
    }
  };

  const handleOpenHelp = () => {
    navigation.navigate('HelpSupport');
  };

  const handleOpenPrivacy = () => {
    navigation.navigate('PrivacyPolicy');
  };

  // 設定區塊
  const sections: SettingSectionType[] = [
    {
      id: 'general',
      title: '一般設定',
      items: [
        {
          id: 'notifications',
          title: '推播通知',
          subtitle: '接收任務提醒和客戶更新',
          type: 'switch',
          value: notificationsEnabled,
          icon: 'notifications-outline',
        },
        {
          id: 'soundEffects',
          title: '音效',
          subtitle: '操作音效和提示音',
          type: 'switch',
          value: soundsEnabled,
          icon: 'volume-high-outline',
        },
      ],
    },
    {
      id: 'data',
      title: '資料管理',
      items: [
        {
          id: 'export',
          title: '匯出資料',
          type: 'action',
          icon: 'download-outline',
          action: handleExportData,
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
          action: handleOpenHelp,
        },
        {
          id: 'privacy',
          title: '隱私權政策',
          type: 'navigation',
          icon: 'shield-outline',
          action: handleOpenPrivacy,
        },
        {
          id: 'version',
          title: '版本',
          subtitle: Constants.expoConfig?.version || '1.0.0',
          type: 'navigation',
          icon: 'information-circle-outline',
        },
      ],
    },
  ];

  const handleSettingChange = async (settingId: string, value: any) => {
    switch (settingId) {
      case 'notifications':
        if (value) {
          // 啟用通知 - 需要檢查權限
          const success = await enableNotifications();
          if (success) {
            await toggleNotifications(true);
          } else {
            // 如果權限請求失敗，不更新設定
            Alert.alert(
              '無法啟用通知',
              '請在系統設定中允許通知權限',
              [{ text: '確定' }]
            );
          }
        } else {
          // 停用通知
          await disableNotifications();
          await toggleNotifications(false);
        }
        break;
      case 'soundEffects':
        await toggleSounds(value);
        break;
      default:
        console.log(`Setting ${settingId} changed to ${value}`);
    }
  };

  return (
    <Layout style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 使用者資訊 */}
        <View style={styles.userInfo}>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user?.name || '使用者'}</Text>
            <Text style={styles.userEmail}>{user?.email || ''}</Text>
            <Text style={styles.userRole}>
              {isSuperAdmin ? 'Super Admin' : isEnterpriseAdmin ? '企業管理員' : mode === 'manager' ? '主管模式' : '業務模式'}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => navigation.navigate('EditProfileModal' as any)}
          >
            <Ionicons name="pencil" size={20} color="#007AFF" />
          </TouchableOpacity>
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
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userDetails: {
    flex: 1,
  },
  editButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginLeft: 12,
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