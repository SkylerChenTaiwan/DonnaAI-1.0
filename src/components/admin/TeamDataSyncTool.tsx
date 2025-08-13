import { Icon } from '../../components/common/Icon';
import { withAlpha } from '@/utils/colorUtils';
/**
 * 團隊資料同步工具元件
 * 用於管理員檢查和修復團隊成員資料不一致的問題
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert as RNAlert, Platform } from 'react-native';
// Icon import removed - using platform-specific Icon component;
import { useAuthStore } from '@/stores/authStore';
import {
  checkTeamDataConsistency,
  syncOrganizationTeamData,
  syncUserTeams,
  syncTeamMembers
} from '../../utils/team-data-sync';

export const TeamDataSyncTool: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [inconsistencies, setInconsistencies] = useState<Array<{
    type: 'user_missing_team' | 'team_missing_user';
    userId: string;
    teamId: string;
    userName?: string;
    teamName?: string;
  }>>([]);
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);
  const [expanded, setExpanded] = useState(true);

  // 檢查資料一致性
  const handleCheckConsistency = async () => {
    if (!user?.organizationId) return;
    
    setLoading(true);
    setMessage(null);
    
    try {
      const result = await checkTeamDataConsistency(user.organizationId);
      setInconsistencies(result.inconsistencies);
      
      if (result.inconsistencies.length === 0) {
        setMessage({
          type: 'success',
          text: '✅ 團隊資料完全一致，無需同步！'
        });
      } else {
        setMessage({
          type: 'info',
          text: `發現 ${result.inconsistencies.length} 個資料不一致的情況`
        });
      }
    } catch (error) {
      console.error('檢查資料一致性失敗:', error);
      setMessage({
        type: 'error',
        text: '檢查失敗，請稍後再試'
      });
    } finally {
      setLoading(false);
    }
  };

  // 執行完整同步
  const handleFullSync = async () => {
    if (!user?.organizationId) return;
    
    setSyncing(true);
    setMessage(null);
    
    try {
      await syncOrganizationTeamData(user.organizationId);
      setMessage({
        type: 'success',
        text: '✅ 團隊資料同步完成！'
      });
      
      // 重新檢查一致性
      await handleCheckConsistency();
    } catch (error) {
      console.error('同步失敗:', error);
      setMessage({
        type: 'error',
        text: '同步失敗，請稍後再試'
      });
    } finally {
      setSyncing(false);
    }
  };

  // 同步單一項目
  const handleSyncItem = async (item: typeof inconsistencies[0]) => {
    setMessage(null);
    
    try {
      if (item.type === 'user_missing_team') {
        await syncUserTeams(item.userId);
      } else {
        await syncTeamMembers(item.teamId);
      }
      
      setMessage({
        type: 'success',
        text: '✅ 項目同步成功'
      });
      
      // 重新檢查一致性
      await handleCheckConsistency();
    } catch (error) {
      console.error('同步項目失敗:', error);
      setMessage({
        type: 'error',
        text: '同步失敗，請稍後再試'
      });
    }
  };

  // 根據類型獲取圖示和說明
  const getInconsistencyInfo = (type: string) => {
    if (type === 'user_missing_team') {
      return {
        icon: 'person-add',
        color: '#ff9800',
        description: '使用者的 teamIds 缺少此團隊'
      };
    } else {
      return {
        icon: 'people',
        color: '#2196f3',
        description: '團隊的 memberIds 缺少此使用者'
      };
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>團隊資料同步工具</Text>
        <TouchableOpacity
          onPress={() => setExpanded(!expanded)}
          style={styles.expandButton}
        >
          <Icon name={expanded ? 'chevron-up' : 'chevron-down'}
            size={24}
            color="#666"
          />
        </TouchableOpacity>
      </View>

      {expanded && (
        <View style={styles.content}>
          <Text style={styles.description}>
            此工具用於檢查和修復使用者團隊資料（User.teamIds 和 Team.memberIds）的不一致問題。
          </Text>

          {message && (
            <View style={StyleSheet.flatten([styles.alert, message.type === 'success' ? styles.alertsuccess : message.type === 'error' ? styles.alerterror : styles.alertinfo])}>
              <Text style={styles.alertText}>{message.text}</Text>
              <TouchableOpacity
                onPress={() => setMessage(null)}
                style={styles.alertClose}
              >
                <Icon name="close" size={20} color="#666"  />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={StyleSheet.flatten([styles.button, styles.outlineButton, (loading || syncing) && styles.buttonDisabled])}
              onPress={handleCheckConsistency}
              disabled={loading || syncing}
            >
              <Icon name="sync" size={20} color="#1976d2" style={{ marginRight: 8 }}  />
              <Text style={styles.outlineButtonText}>檢查一致性</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={StyleSheet.flatten([styles.button, styles.primaryButton, (syncing || loading || inconsistencies.length === 0) && styles.buttonDisabled])}
              onPress={handleFullSync}
              disabled={syncing || loading || inconsistencies.length === 0}
            >
              <Icon name="sync" size={20} color="white" style={{ marginRight: 8 }}  />
              <Text style={styles.primaryButtonText}>執行完整同步</Text>
            </TouchableOpacity>
          </View>

          {(loading || syncing) && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1976d2" />
            </View>
          )}

          {inconsistencies.length > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={styles.subtitle}>發現的不一致項目：</Text>
              
              <ScrollView style={styles.list}>
                {inconsistencies.map((item, index) => {
                  const info = getInconsistencyInfo(item.type);
                  return (
                    <View key={index} style={styles.listItem}>
                      <View style={styles.listItemContent}>
                        <View style={styles.chipContainer}>
                          <View style={StyleSheet.flatten([styles.chip, { backgroundColor: withAlpha(info.color, 0.125) }])}>
                            <Icon name={info.icon} size={16} color={info.color} />
                            <Text style={StyleSheet.flatten([styles.chipText, { color: info.color }])}>
                              {item.type === 'user_missing_team' ? '使用者缺少團隊' : '團隊缺少使用者'}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.itemText}>
                          {item.userName || item.userId} - {item.teamName || item.teamId}
                        </Text>
                        <Text style={styles.itemDescription}>{info.description}</Text>
                      </View>
                      <TouchableOpacity
                        style={StyleSheet.flatten([styles.syncButton, syncing && styles.buttonDisabled])}
                        onPress={() => handleSyncItem(item)}
                        disabled={syncing}
                      >
                        <Icon name="sync" size={16} color="#1976d2" style={{ marginRight: 4 }}  />
                        <Text style={styles.syncButtonText}>同步</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </ScrollView>
            </>
          )}

          {inconsistencies.length === 0 && !loading && (
            <View style={styles.successContainer}>
              <Icon name="checkmark-circle" size={48} color="#4caf50"  />
              <Text style={styles.successText}>
                資料檢查完成，所有團隊成員資料都是一致的！
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    ...(Platform.OS === 'web' ? {} : { ...(Platform.OS === 'web' ? {} : { shadowOffset: { width: 0, height: 2 } }) }),
    shadowOpacity: 0.1,
    shadowRadius: 4,
    ...(Platform.OS === 'web' ? {} : { elevation: 3 }),
    margin: 16,
    padding: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16 },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333' },
  expandButton: {
    padding: 4 },
  content: {
    flex: 1 },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20 },
  alert: {
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between' },
  alertsuccess: {
    backgroundColor: '#e8f5e9' },
  alerterror: {
    backgroundColor: '#ffebee' },
  alertinfo: {
    backgroundColor: '#e3f2fd' },
  alertText: {
    flex: 1,
    fontSize: 14,
    color: '#333' },
  alertClose: {
    padding: 4 },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    flex: 1 },
  outlineButton: {
    borderWidth: 1,
    borderColor: '#1976d2',
    backgroundColor: 'transparent' },
  primaryButton: {
    backgroundColor: '#1976d2' },
  buttonDisabled: {
    opacity: 0.5 },
  outlineButtonText: {
    color: '#1976d2',
    fontSize: 14,
    fontWeight: '500' },
  primaryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500' },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center' },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16 },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 12 },
  list: {
    maxHeight: 300 },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0' },
  listItemContent: {
    flex: 1 },
  chipContainer: {
    flexDirection: 'row',
    marginBottom: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4 },
  chipText: {
    fontSize: 12,
    fontWeight: '500' },
  itemText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4 },
  itemDescription: {
    fontSize: 12,
    color: '#666' },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#1976d2' },
  syncButtonText: {
    fontSize: 12,
    color: '#1976d2' },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 32 },
  successText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
    textAlign: 'center' } });