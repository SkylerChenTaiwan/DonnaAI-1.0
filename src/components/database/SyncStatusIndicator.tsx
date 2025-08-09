import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Icon } from '@/components/common/Icon';
// Icon import removed - using platform-specific Icon component;

interface SyncStatusIndicatorProps {
  syncStatus: {
    isSyncing: boolean;
    pendingCount: number;
    lastSyncTime?: number;
    error?: string;
  };
}

export function SyncStatusIndicator({ syncStatus }: SyncStatusIndicatorProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  // 格式化最後同步時間
  const formatLastSyncTime = (timestamp?: number) => {
    if (!timestamp) return '尚未同步';
    
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) {
      return '剛剛';
    } else if (diff < 3600000) {
      return `${Math.floor(diff / 60000)} 分鐘前`;
    } else if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)} 小時前`;
    } else {
      return new Date(timestamp).toLocaleDateString('zh-TW');
    }
  };
  
  // 根據狀態顯示不同顏色
  const getStatusColor = () => {
    if (syncStatus.error) return '#ff4444';
    if (syncStatus.isSyncing) return '#1890ff';
    if (syncStatus.pendingCount > 0) return '#faad14';
    return '#52c41a';
  };
  
  // 獲取狀態圖示
  const getStatusIcon = () => {
    if (syncStatus.error) return 'alert-circle';
    if (syncStatus.isSyncing) return 'sync';
    if (syncStatus.pendingCount > 0) return 'time';
    return 'checkmark-circle';
  };
  
  // 獲取狀態文字
  const getStatusText = () => {
    if (syncStatus.error) return '同步錯誤';
    if (syncStatus.isSyncing) return '同步中...';
    if (syncStatus.pendingCount > 0) return `${syncStatus.pendingCount} 項待同步`;
    return '已同步';
  };

  return (
    <View style={styles.container}>
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
        <Icon name={getStatusIcon()} 
          size={16} 
          color={getStatusColor()} 
        />
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
        {syncStatus.isSyncing && (
          <ActivityIndicator size="small" color={getStatusColor()} style={styles.spinner} />
        )}
      </View>
      
      {/* 最後同步時間 */}
      <Text style={styles.lastSyncText}>
        最後同步: {formatLastSyncTime(syncStatus.lastSyncTime)}
      </Text>
      
      {/* 錯誤訊息 */}
      {syncStatus.error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{syncStatus.error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  spinner: {
    marginLeft: 4,
  },
  lastSyncText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  errorContainer: {
    backgroundColor: '#ff444420',
    padding: 8,
    borderRadius: 4,
    marginTop: 4,
    maxWidth: 200,
  },
  errorText: {
    fontSize: 12,
    color: '#ff4444',
  },
});