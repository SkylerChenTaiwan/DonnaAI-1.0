/**
 * 分配預覽元件
 * 顯示資料分配的預覽結果和統計
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform
} from 'react-native';
import { MaterialIcon } from '@/components/common/MaterialIcon';
import { DesignSystem } from '@/theme/designSystem';
import { AssignmentPreview as AssignmentPreviewType, AssignmentAdjustment } from '@/types/assignment';
import { withAlpha } from '@/utils/colorUtils';

interface AssignmentPreviewProps {
  preview: AssignmentPreviewType[];
  data: any[];
  onAdjustment?: (adjustments: AssignmentAdjustment[]) => void;
}

const AssignmentPreview: React.FC<AssignmentPreviewProps> = ({
  preview,
  data,
  onAdjustment
}) => {
  const colors = DesignSystem.colors;
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [selectedView, setSelectedView] = useState<'chart' | 'list'>('chart');

  // 切換用戶展開狀態
  const toggleUserExpansion = (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  // 計算總體統計
  const totalAssigned = preview.reduce((sum, user) => sum + user.assignedCount, 0);
  const totalData = data.length;
  const unassigned = totalData - totalAssigned;
  const maxCount = Math.max(...preview.map(u => u.assignedCount));

  // 渲染工作負載圖表
  const renderWorkloadChart = () => {
    return (
      <View style={styles.chartContainer}>
        {preview.map((user, index) => {
          const percentage = (user.assignedCount / maxCount) * 100;
          
          return (
            <View key={user.userId} style={styles.chartRow}>
              <View style={styles.chartLabel}>
                <Text 
                  style={[styles.chartUserName, { color: colors.text }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {user.userName}
                </Text>
                <Text style={[styles.chartCount, { color: colors.gray500 }]}>
                  {user.assignedCount}
                </Text>
              </View>
              
              <View style={[styles.chartBarContainer, { backgroundColor: colors.gray100 }]}>
                <View
                  style={[
                    styles.chartBar,
                    {
                      width: `${percentage}%`,
                      backgroundColor: getBarColor(index, colors)
                    }
                  ]}
                />
                <Text style={[styles.chartPercentage, { color: colors.gray600 }]}>
                  {user.workloadPercentage.toFixed(1)}%
                </Text>
              </View>
            </View>
          );
        })}
        
        {/* 未分配資料 */}
        {unassigned > 0 && (
          <View style={[styles.unassignedRow, { borderTopColor: colors.gray200 }]}>
            <View style={styles.chartLabel}>
              <Text style={[styles.chartUserName, { color: colors.gray500 }]}>
                未分配
              </Text>
              <Text style={[styles.chartCount, { color: colors.error }]}>
                {unassigned}
              </Text>
            </View>
            <View style={[styles.chartBarContainer, { backgroundColor: colors.gray100 }]}>
              <View
                style={[
                  styles.chartBar,
                  {
                    width: `${(unassigned / totalData) * 100}%`,
                    backgroundColor: colors.gray300
                  }
                ]}
              />
              <Text style={[styles.chartPercentage, { color: colors.gray600 }]}>
                {((unassigned / totalData) * 100).toFixed(1)}%
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  // 渲染詳細列表
  const renderDetailsList = () => {
    return (
      <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
        {preview.map(user => {
          const isExpanded = expandedUsers.has(user.userId);
          
          return (
            <View 
              key={user.userId}
              style={[styles.userCard, { backgroundColor: colors.white, borderColor: colors.gray200 }]}
            >
              {/* 用戶標題 */}
              <TouchableOpacity
                style={styles.userHeader}
                onPress={() => toggleUserExpansion(user.userId)}
                activeOpacity={0.7}
              >
                <View style={styles.userHeaderInfo}>
                  <View 
                    style={[
                      styles.userAvatar,
                      { backgroundColor: withAlpha(colors.primary, 0.125) }
                    ]}
                  >
                    <Text style={[styles.userAvatarText, { color: colors.primary }]}>
                      {user.userName[0].toUpperCase()}
                    </Text>
                  </View>
                  
                  <View style={styles.userInfo}>
                    <Text style={[styles.userName, { color: colors.text }]}>
                      {user.userName}
                    </Text>
                    <Text style={[styles.userEmail, { color: colors.gray500 }]}>
                      {user.userEmail}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.userStats}>
                  <View style={[styles.statBadge, { backgroundColor: withAlpha(colors.primary, 0.063) }]}>
                    <Text style={[styles.statNumber, { color: colors.primary }]}>
                      {user.assignedCount}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.primary }]}>
                      筆資料
                    </Text>
                  </View>
                  
                  <MaterialIcon
                    name={isExpanded ? 'expand-less' : 'expand-more'}
                    size={24}
                    color={colors.gray400}
                  />
                </View>
              </TouchableOpacity>
              
              {/* 展開的詳細資料 */}
              {isExpanded && (
                <View style={[styles.userDetails, { borderTopColor: colors.gray100 }]}>
                  <Text style={[styles.detailsTitle, { color: colors.gray700 }]}>
                    分配預覽（前 5 筆）
                  </Text>
                  
                  {user.assignedItems.slice(0, 5).map((item, index) => (
                    <View 
                      key={index}
                      style={[styles.assignedItem, { backgroundColor: colors.gray50 }]}
                    >
                      <Text style={[styles.itemIndex, { color: colors.gray500 }]}>
                        #{item.rowIndex + 1}
                      </Text>
                      
                      <View style={styles.itemData}>
                        {Object.entries(item.rowData).slice(0, 3).map(([key, value]) => (
                          <Text 
                            key={key}
                            style={[styles.itemField, { color: colors.gray600 }]}
                            numberOfLines={1}
                          >
                            {key}: {value}
                          </Text>
                        ))}
                      </View>
                      
                      {item.matchConfidence && (
                        <View 
                          style={[
                            styles.confidenceBadge,
                            { 
                              backgroundColor: getConfidenceColor(item.matchConfidence, colors) + '20'
                            }
                          ]}
                        >
                          <Text
                            style={[
                              styles.confidenceText,
                              { color: getConfidenceColor(item.matchConfidence, colors) }
                            ]}
                          >
                            {item.matchConfidence}%
                          </Text>
                        </View>
                      )}
                    </View>
                  ))}
                  
                  {user.assignedCount > 5 && (
                    <Text style={[styles.moreItems, { color: colors.gray500 }]}>
                      還有 {user.assignedCount - 5} 筆資料...
                    </Text>
                  )}
                </View>
              )}
            </View>
          );
        })}
        
        {/* 未分配資料卡片 */}
        {unassigned > 0 && (
          <View 
            style={[
              styles.unassignedCard,
              { backgroundColor: withAlpha(colors.error, 0.063), borderColor: withAlpha(colors.error, 0.188) }
            ]}
          >
            <MaterialIcon name="warning" size={20} color={colors.error} />
            <Text style={[styles.unassignedText, { color: colors.error }]}>
              有 {unassigned} 筆資料未能分配給任何用戶
            </Text>
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {/* 視圖切換 */}
      <View style={[styles.viewSelector, { backgroundColor: colors.gray100 }]}>
        <TouchableOpacity
          style={[
            styles.viewOption,
            {
              backgroundColor: selectedView === 'chart' ? colors.white : 'transparent'
            }
          ]}
          onPress={() => setSelectedView('chart')}
          activeOpacity={0.7}
        >
          <MaterialIcon 
            name="bar-chart" 
            size={18} 
            color={selectedView === 'chart' ? colors.primary : colors.gray500}
          />
          <Text
            style={[
              styles.viewOptionText,
              { color: selectedView === 'chart' ? colors.primary : colors.gray500 }
            ]}
          >
            圖表視圖
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.viewOption,
            {
              backgroundColor: selectedView === 'list' ? colors.white : 'transparent'
            }
          ]}
          onPress={() => setSelectedView('list')}
          activeOpacity={0.7}
        >
          <MaterialIcon 
            name="list" 
            size={18} 
            color={selectedView === 'list' ? colors.primary : colors.gray500}
          />
          <Text
            style={[
              styles.viewOptionText,
              { color: selectedView === 'list' ? colors.primary : colors.gray500 }
            ]}
          >
            詳細列表
          </Text>
        </TouchableOpacity>
      </View>

      {/* 內容區域 */}
      {selectedView === 'chart' ? renderWorkloadChart() : renderDetailsList()}
    </View>
  );
};

// 獲取條形圖顏色
const getBarColor = (index: number, colors: any): string => {
  const barColors = [
    colors.primary,
    colors.success,
    colors.warning,
    colors.error,
    colors.info
  ];
  return barColors[index % barColors.length];
};

// 獲取信心度顏色
const getConfidenceColor = (confidence: number, colors: any): string => {
  if (confidence >= 80) return colors.success;
  if (confidence >= 50) return colors.warning;
  return colors.error;
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  viewSelector: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 8,
    marginBottom: 16
  },
  viewOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6
  },
  viewOptionText: {
    fontSize: 14,
    fontWeight: '500'
  },
  chartContainer: {
    paddingVertical: 8
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12
  },
  chartLabel: {
    width: 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  chartUserName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1
  },
  chartCount: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8
  },
  chartBarContainer: {
    flex: 1,
    height: 32,
    borderRadius: 4,
    position: 'relative',
    justifyContent: 'center'
  },
  chartBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 4
  },
  chartPercentage: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 8
  },
  unassignedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 12
  },
  listContainer: {
    flex: 1
  },
  userCard: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden'
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12
  },
  userHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  userAvatarText: {
    fontSize: 16,
    fontWeight: '600'
  },
  userInfo: {
    flex: 1
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2
  },
  userEmail: {
    fontSize: 12
  },
  userStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  statBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center'
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '600'
  },
  statLabel: {
    fontSize: 10
  },
  userDetails: {
    padding: 12,
    borderTopWidth: 1
  },
  detailsTitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8
  },
  assignedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    marginBottom: 6,
    gap: 8
  },
  itemIndex: {
    fontSize: 12,
    fontWeight: '600',
    width: 40
  },
  itemData: {
    flex: 1
  },
  itemField: {
    fontSize: 11,
    marginBottom: 2
  },
  confidenceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: '600'
  },
  moreItems: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center'
  },
  unassignedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8
  },
  unassignedText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1
  }
});

export default AssignmentPreview;