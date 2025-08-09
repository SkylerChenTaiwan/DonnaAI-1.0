import { Icon } from '../../components/common/Icon';
/**
 * 審計日誌檢視器元件
 * 提供審計日誌的搜尋、檢視和過濾功能
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  AuditLog,
  SearchCriteria,
  SearchResult,
  AuditActionType,
  ActionCategory,
  RiskLevel,
  OperationStatus,
} from '@/types/audit';
import { auditLogQuery } from '@/services/audit/AuditLogQuery';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
// Icon import removed - using platform-specific Icon component;
import { DocumentSnapshot } from 'firebase/firestore';

interface AuditLogViewerProps {
  organizationId: string;
  userId?: string;
  showFilters?: boolean;
  pageSize?: number;
  onLogSelect?: (log: AuditLog) => void;
}

/**
 * 審計日誌檢視器
 */
export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({
  organizationId,
  userId,
  showFilters = true,
  pageSize = 20,
  onLogSelect,
}) => {
  // 狀態管理
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // 過濾條件
  const [filters, setFilters] = useState<SearchCriteria>({
    organizationId,
    userId,
    limit: pageSize,
    sortOrder: 'desc',
  });
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ActionCategory | ''>('');
  const [selectedRisk, setSelectedRisk] = useState<RiskLevel | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<OperationStatus | ''>('');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 預設最近 7 天
    end: new Date(),
  });

  /**
   * 載入審計日誌
   */
  const loadLogs = useCallback(async (append = false) => {
    if (loading) return;
    
    setLoading(true);
    setError(null);

    try {
      const criteria: SearchCriteria = {
        ...filters,
        searchText: searchText || undefined,
        categories: selectedCategory ? [selectedCategory] : undefined,
        riskLevels: selectedRisk ? [selectedRisk] : undefined,
        status: selectedStatus || undefined,
        dateRange,
        startAfter: append ? lastDoc : undefined,
      };

      const result: SearchResult = await auditLogQuery.search(criteria);
      
      if (append) {
        setLogs(prev => [...prev, ...result.logs]);
      } else {
        setLogs(result.logs);
      }
      
      setHasMore(result.hasMore);
      setLastDoc(result.lastDoc || null);
    } catch (err) {
      console.error('載入審計日誌失敗:', err);
      setError('載入失敗，請稍後再試');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters, searchText, selectedCategory, selectedRisk, selectedStatus, dateRange, lastDoc, loading]);

  /**
   * 重新整理
   */
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setLastDoc(null);
    loadLogs(false);
  }, [loadLogs]);

  /**
   * 載入更多
   */
  const handleLoadMore = useCallback(() => {
    if (hasMore && !loading) {
      loadLogs(true);
    }
  }, [hasMore, loading, loadLogs]);

  /**
   * 套用過濾條件
   */
  const applyFilters = useCallback(() => {
    setLastDoc(null);
    loadLogs(false);
  }, [loadLogs]);

  /**
   * 重設過濾條件
   */
  const resetFilters = useCallback(() => {
    setSearchText('');
    setSelectedCategory('');
    setSelectedRisk('');
    setSelectedStatus('');
    setDateRange({
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      end: new Date(),
    });
    setLastDoc(null);
    
    const defaultFilters: SearchCriteria = {
      organizationId,
      userId,
      limit: pageSize,
      sortOrder: 'desc',
    };
    setFilters(defaultFilters);
  }, [organizationId, userId, pageSize]);

  /**
   * 處理日期選擇
   */
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(null);
    if (selectedDate) {
      if (showDatePicker === 'start') {
        setDateRange(prev => ({ ...prev, start: selectedDate }));
      } else {
        setDateRange(prev => ({ ...prev, end: selectedDate }));
      }
    }
  };

  /**
   * 初始載入
   */
  useEffect(() => {
    loadLogs(false);
  }, []);

  /**
   * 渲染過濾器
   */
  const renderFilters = () => {
    if (!showFilters) return null;

    return (
      <View style={styles.filtersContainer}>
        {/* 搜尋輸入 */}
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#666" style={styles.searchIcon}  />
          <TextInput
            style={styles.searchInput}
            placeholder="搜尋審計日誌..."
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={applyFilters}
          />
        </View>

        {/* 過濾選項 */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {/* 日期範圍 */}
          <TouchableOpacity 
            style={styles.filterChip}
            onPress={() => setShowDatePicker('start')}
          >
            <Text style={styles.filterChipText}>
              開始: {format(dateRange.start, 'MM/dd', { locale: zhTW })}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.filterChip}
            onPress={() => setShowDatePicker('end')}
          >
            <Text style={styles.filterChipText}>
              結束: {format(dateRange.end, 'MM/dd', { locale: zhTW })}
            </Text>
          </TouchableOpacity>

          {/* 分類過濾 */}
          {Platform.OS === 'web' ? (
            <select
              style={styles.filterSelect}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as ActionCategory | '')}
            >
              <option value="">所有分類</option>
              {Object.values(ActionCategory).map(cat => (
                <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
              ))}
            </select>
          ) : (
            <View style={styles.filterChip}>
              <Picker
                selectedValue={selectedCategory}
                onValueChange={setSelectedCategory}
                style={styles.picker}
              >
                <Picker.Item label="所有分類" value="" />
                {Object.values(ActionCategory).map(cat => (
                  <Picker.Item key={cat} label={getCategoryLabel(cat)} value={cat} />
                ))}
              </Picker>
            </View>
          )}

          {/* 風險等級過濾 */}
          {Platform.OS === 'web' ? (
            <select
              style={styles.filterSelect}
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value as RiskLevel | '')}
            >
              <option value="">所有風險</option>
              <option value="critical">關鍵</option>
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>
          ) : (
            <View style={styles.filterChip}>
              <Picker
                selectedValue={selectedRisk}
                onValueChange={setSelectedRisk}
                style={styles.picker}
              >
                <Picker.Item label="所有風險" value="" />
                <Picker.Item label="關鍵" value="critical" />
                <Picker.Item label="高" value="high" />
                <Picker.Item label="中" value="medium" />
                <Picker.Item label="低" value="low" />
              </Picker>
            </View>
          )}

          {/* 狀態過濾 */}
          {Platform.OS === 'web' ? (
            <select
              style={styles.filterSelect}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as OperationStatus | '')}
            >
              <option value="">所有狀態</option>
              <option value="success">成功</option>
              <option value="failure">失敗</option>
              <option value="partial">部分成功</option>
            </select>
          ) : (
            <View style={styles.filterChip}>
              <Picker
                selectedValue={selectedStatus}
                onValueChange={setSelectedStatus}
                style={styles.picker}
              >
                <Picker.Item label="所有狀態" value="" />
                <Picker.Item label="成功" value="success" />
                <Picker.Item label="失敗" value="failure" />
                <Picker.Item label="部分成功" value="partial" />
              </Picker>
            </View>
          )}
        </ScrollView>

        {/* 操作按鈕 */}
        <View style={styles.filterActions}>
          <TouchableOpacity style={styles.filterButton} onPress={applyFilters}>
            <Text style={styles.filterButtonText}>套用過濾</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterButton, styles.resetButton]} onPress={resetFilters}>
            <Text style={styles.resetButtonText}>重設</Text>
          </TouchableOpacity>
        </View>

        {/* 日期選擇器 */}
        {showDatePicker && (
          <DateTimePicker
            value={showDatePicker === 'start' ? dateRange.start : dateRange.end}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}
      </View>
    );
  };

  /**
   * 渲染日誌項目
   */
  const renderLogItem = (log: AuditLog) => {
    const isSelected = selectedLog?.id === log.id;
    const riskColor = getRiskColor(log.metadata?.risk);
    const statusColor = getStatusColor(log.result.status);

    return (
      <TouchableOpacity
        key={log.id}
        style={[styles.logItem, isSelected && styles.selectedLogItem]}
        onPress={() => {
          setSelectedLog(log);
          onLogSelect?.(log);
        }}
      >
        {/* 時間戳記 */}
        <View style={styles.logHeader}>
          <Text style={styles.timestamp}>
            {format(log.timestamp.toDate(), 'yyyy-MM-dd HH:mm:ss', { locale: zhTW })}
          </Text>
          <View style={styles.badges}>
            {log.metadata?.risk && (
              <View style={[styles.badge, { backgroundColor: riskColor }]}>
                <Text style={styles.badgeText}>{getRiskLabel(log.metadata.risk)}</Text>
              </View>
            )}
            <View style={[styles.badge, { backgroundColor: statusColor }]}>
              <Text style={styles.badgeText}>{getStatusLabel(log.result.status)}</Text>
            </View>
          </View>
        </View>

        {/* 動作資訊 */}
        <View style={styles.logContent}>
          <Text style={styles.actionType}>{getActionLabel(log.action.type)}</Text>
          <Text style={styles.resource}>{log.action.resource}</Text>
        </View>

        {/* 執行者資訊 */}
        <View style={styles.logFooter}>
          <Text style={styles.actor}>
            <Icon name="person" size={12} color="#666"  />
            {' '}{log.actor.userName} ({log.actor.userEmail})
          </Text>
          {log.result.duration && (
            <Text style={styles.duration}>
              <Icon name="time" size={12} color="#666"  />
              {' '}{log.result.duration}ms
            </Text>
          )}
        </View>

        {/* 錯誤訊息 */}
        {log.result.status === 'failure' && log.result.errorMessage && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{log.result.errorMessage}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  /**
   * 渲染日誌詳情
   */
  const renderLogDetails = () => {
    if (!selectedLog) return null;

    return (
      <View style={styles.detailsContainer}>
        <View style={styles.detailsHeader}>
          <Text style={styles.detailsTitle}>審計日誌詳情</Text>
          <TouchableOpacity onPress={() => setSelectedLog(null)}>
            <Icon name="close" size={24} color="#666"  />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.detailsContent}>
          {/* 基本資訊 */}
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>基本資訊</Text>
            <DetailRow label="ID" value={selectedLog.id} />
            <DetailRow label="時間" value={format(selectedLog.timestamp.toDate(), 'yyyy-MM-dd HH:mm:ss')} />
            <DetailRow label="動作類型" value={getActionLabel(selectedLog.action.type)} />
            <DetailRow label="分類" value={getCategoryLabel(selectedLog.action.category)} />
            <DetailRow label="資源" value={selectedLog.action.resource} />
            {selectedLog.action.resourceId && (
              <DetailRow label="資源 ID" value={selectedLog.action.resourceId} />
            )}
          </View>

          {/* 執行者資訊 */}
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>執行者</Text>
            <DetailRow label="用戶 ID" value={selectedLog.actor.userId} />
            <DetailRow label="用戶名稱" value={selectedLog.actor.userName} />
            <DetailRow label="電子郵件" value={selectedLog.actor.userEmail} />
            <DetailRow label="角色" value={selectedLog.actor.userRole} />
            <DetailRow label="IP 地址" value={selectedLog.actor.ipAddress} />
            <DetailRow label="Session ID" value={selectedLog.actor.sessionId} />
          </View>

          {/* 組織上下文 */}
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>組織上下文</Text>
            <DetailRow label="組織 ID" value={selectedLog.context.organizationId} />
            <DetailRow label="組織名稱" value={selectedLog.context.organizationName} />
            <DetailRow label="環境" value={selectedLog.context.environment} />
          </View>

          {/* 結果 */}
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>結果</Text>
            <DetailRow label="狀態" value={getStatusLabel(selectedLog.result.status)} />
            {selectedLog.result.errorCode && (
              <DetailRow label="錯誤代碼" value={selectedLog.result.errorCode} />
            )}
            {selectedLog.result.errorMessage && (
              <DetailRow label="錯誤訊息" value={selectedLog.result.errorMessage} />
            )}
            {selectedLog.result.duration && (
              <DetailRow label="執行時間" value={`${selectedLog.result.duration}ms`} />
            )}
          </View>

          {/* 變更詳情 */}
          {selectedLog.changes && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>變更詳情</Text>
              {selectedLog.changes.diff?.map((diff, index) => (
                <View key={index} style={styles.diffItem}>
                  <Text style={styles.diffField}>{diff.field}:</Text>
                  <Text style={styles.diffOld}>{JSON.stringify(diff.oldValue)}</Text>
                  <Text style={styles.diffArrow}>→</Text>
                  <Text style={styles.diffNew}>{JSON.stringify(diff.newValue)}</Text>
                </View>
              ))}
            </View>
          )}

          {/* 額外資訊 */}
          {selectedLog.metadata && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>額外資訊</Text>
              <DetailRow label="來源" value={selectedLog.metadata.source} />
              {selectedLog.metadata.correlationId && (
                <DetailRow label="關聯 ID" value={selectedLog.metadata.correlationId} />
              )}
              {selectedLog.metadata.risk && (
                <DetailRow label="風險等級" value={getRiskLabel(selectedLog.metadata.risk)} />
              )}
              {selectedLog.metadata.tags && selectedLog.metadata.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  <Text style={styles.detailLabel}>標籤:</Text>
                  <View style={styles.tags}>
                    {selectedLog.metadata.tags.map((tag, index) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderFilters()}
      
      {/* 錯誤提示 */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      )}

      {/* 日誌列表 */}
      <ScrollView
        style={styles.logsContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
          if (isCloseToBottom) {
            handleLoadMore();
          }
        }}
        scrollEventThrottle={400}
      >
        {logs.map(renderLogItem)}
        
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#0066CC" />
            <Text style={styles.loadingText}>載入中...</Text>
          </View>
        )}
        
        {!loading && logs.length === 0 && (
          <View style={styles.emptyContainer}>
            <Icon name="document-text-outline" size={48} color="#999"  />
            <Text style={styles.emptyText}>沒有找到審計日誌</Text>
          </View>
        )}
      </ScrollView>

      {/* 日誌詳情 */}
      {selectedLog && renderLogDetails()}
    </View>
  );
};

/**
 * 詳情行元件
 */
const DetailRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}:</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

/**
 * 輔助函數
 */
const getActionLabel = (action: AuditActionType): string => {
  const labels: Record<AuditActionType, string> = {
    [AuditActionType.USER_LOGIN]: '用戶登入',
    [AuditActionType.USER_LOGOUT]: '用戶登出',
    [AuditActionType.USER_LOGIN_FAILED]: '登入失敗',
    [AuditActionType.PASSWORD_CHANGED]: '密碼變更',
    [AuditActionType.PASSWORD_RESET]: '密碼重設',
    [AuditActionType.MFA_ENABLED]: '啟用 MFA',
    [AuditActionType.MFA_DISABLED]: '停用 MFA',
    [AuditActionType.USER_CREATED]: '建立用戶',
    [AuditActionType.USER_UPDATED]: '更新用戶',
    [AuditActionType.USER_DELETED]: '刪除用戶',
    [AuditActionType.USER_ACTIVATED]: '啟用用戶',
    [AuditActionType.USER_DEACTIVATED]: '停用用戶',
    [AuditActionType.USER_ROLE_CHANGED]: '角色變更',
    [AuditActionType.DATA_CREATED]: '建立資料',
    [AuditActionType.DATA_UPDATED]: '更新資料',
    [AuditActionType.DATA_DELETED]: '刪除資料',
    [AuditActionType.DATA_EXPORTED]: '匯出資料',
    [AuditActionType.DATA_IMPORTED]: '匯入資料',
    [AuditActionType.BULK_OPERATION]: '批量操作',
    [AuditActionType.PERMISSION_GRANTED]: '授予權限',
    [AuditActionType.PERMISSION_REVOKED]: '撤銷權限',
    [AuditActionType.ROLE_CREATED]: '建立角色',
    [AuditActionType.ROLE_UPDATED]: '更新角色',
    [AuditActionType.ROLE_DELETED]: '刪除角色',
    [AuditActionType.ORG_CREATED]: '建立組織',
    [AuditActionType.ORG_UPDATED]: '更新組織',
    [AuditActionType.ORG_SUSPENDED]: '暫停組織',
    [AuditActionType.ORG_ACTIVATED]: '啟用組織',
    [AuditActionType.ORG_DELETED]: '刪除組織',
    [AuditActionType.BILLING_CHANGED]: '帳單變更',
    [AuditActionType.SYSTEM_CONFIG_CHANGED]: '系統配置變更',
    [AuditActionType.INTEGRATION_CONNECTED]: '整合連接',
    [AuditActionType.INTEGRATION_DISCONNECTED]: '整合斷開',
    [AuditActionType.BACKUP_CREATED]: '建立備份',
    [AuditActionType.BACKUP_RESTORED]: '還原備份',
    [AuditActionType.SECURITY_ALERT]: '安全警報',
    [AuditActionType.SUSPICIOUS_ACTIVITY]: '可疑活動',
    [AuditActionType.ACCESS_DENIED]: '存取拒絕',
    [AuditActionType.RATE_LIMIT_EXCEEDED]: '超過速率限制',
  };
  return labels[action] || action;
};

const getCategoryLabel = (category: ActionCategory): string => {
  const labels: Record<ActionCategory, string> = {
    [ActionCategory.AUTHENTICATION]: '認證',
    [ActionCategory.AUTHORIZATION]: '授權',
    [ActionCategory.USER_MANAGEMENT]: '用戶管理',
    [ActionCategory.DATA_MANAGEMENT]: '資料管理',
    [ActionCategory.SYSTEM_ADMINISTRATION]: '系統管理',
    [ActionCategory.SECURITY]: '安全',
    [ActionCategory.BILLING]: '帳單',
    [ActionCategory.COMPLIANCE]: '合規',
  };
  return labels[category] || category;
};

const getRiskLabel = (risk: RiskLevel): string => {
  const labels: Record<RiskLevel, string> = {
    critical: '關鍵',
    high: '高',
    medium: '中',
    low: '低',
  };
  return labels[risk] || risk;
};

const getStatusLabel = (status: OperationStatus): string => {
  const labels: Record<OperationStatus, string> = {
    success: '成功',
    failure: '失敗',
    partial: '部分成功',
  };
  return labels[status] || status;
};

const getRiskColor = (risk?: RiskLevel): string => {
  const colors: Record<RiskLevel, string> = {
    critical: '#D32F2F',
    high: '#F57C00',
    medium: '#FBC02D',
    low: '#388E3C',
  };
  return risk ? colors[risk] : '#757575';
};

const getStatusColor = (status: OperationStatus): string => {
  const colors: Record<OperationStatus, string> = {
    success: '#4CAF50',
    failure: '#F44336',
    partial: '#FF9800',
  };
  return colors[status] || '#757575';
};

/**
 * 樣式定義
 */
const styles: any = {
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
  },
  filterScroll: {
    marginBottom: 12,
  },
  filterChip: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 13,
    color: '#1976D2',
  },
  filterSelect: {
    height: 32,
    paddingHorizontal: 12,
    marginRight: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  picker: {
    width: 120,
    height: 32,
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  filterButton: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  filterButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  resetButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  resetButtonText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '600',
  },
  logsContainer: {
    flex: 1,
  },
  logItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedLogItem: {
    borderColor: '#0066CC',
    borderWidth: 2,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#666666',
  },
  badges: {
    flexDirection: 'row',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 4,
  },
  badgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  logContent: {
    marginBottom: 8,
  },
  actionType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  resource: {
    fontSize: 13,
    color: '#666666',
  },
  logFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actor: {
    fontSize: 12,
    color: '#666666',
    flex: 1,
  },
  duration: {
    fontSize: 12,
    color: '#666666',
  },
  errorContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#FFEBEE',
    borderRadius: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#C62828',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999999',
  },
  errorBanner: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 4,
  },
  errorBannerText: {
    color: '#C62828',
    fontSize: 14,
  },
  detailsContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: Platform.OS === 'web' ? 400 : '100%',
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderLeftColor: '#E0E0E0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: -2, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  detailsContent: {
    flex: 1,
    padding: 16,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: '#666666',
    width: 100,
  },
  detailValue: {
    fontSize: 13,
    color: '#333333',
    flex: 1,
  },
  diffItem: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
  },
  diffField: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  diffOld: {
    fontSize: 12,
    color: '#D32F2F',
  },
  diffArrow: {
    fontSize: 12,
    color: '#666666',
    marginVertical: 2,
  },
  diffNew: {
    fontSize: 12,
    color: '#388E3C',
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
  },
  tag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 4,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 11,
    color: '#1976D2',
  },
};