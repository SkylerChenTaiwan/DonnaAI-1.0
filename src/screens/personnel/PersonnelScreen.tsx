/**
 * 人事管理頁面
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Layout } from '@/components/common/Layout';
import { SearchBar } from '@/components/common/SearchBar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { getUserPermissionContext } from '@/services/firebase/permissions-v2';
import { db } from '@/services/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { showToast } from '@/utils/toast';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  phone?: string;
  status: 'active' | 'inactive' | 'on_leave';
  joinDate?: Date;
  lastActive?: Date;
  performance?: {
    meetings: number;
    customers: number;
    deals: number;
  };
}

export const PersonnelScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const { user } = useAuth();
  const { currentTeam } = useOrganization();

  // 獲取團隊成員
  const fetchTeamMembers = async () => {
    if (!user || !currentTeam) return;

    try {
      setLoading(true);
      
      // 獲取用戶權限上下文
      const permissionContext = await getUserPermissionContext(user.uid);
      
      // 查詢團隊成員
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('teamIds', 'array-contains', currentTeam.id)
      );
      
      const snapshot = await getDocs(q);
      const members: TeamMember[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        members.push({
          id: doc.id,
          name: data.name || '未命名',
          email: data.email,
          role: data.role || 'salesperson',
          department: data.department,
          phone: data.phone,
          status: data.status || 'active',
          joinDate: data.joinDate?.toDate(),
          lastActive: data.lastActive?.toDate(),
          performance: {
            meetings: data.performance?.meetings || 0,
            customers: data.performance?.customers || 0,
            deals: data.performance?.deals || 0,
          },
        });
      });
      
      setTeamMembers(members);
    } catch (error) {
      console.error('獲取團隊成員失敗:', error);
      showToast('error', '無法載入團隊成員資料');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, [user, currentTeam]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchTeamMembers();
  }, []);

  // 過濾成員
  const filteredMembers = teamMembers.filter((member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 狀態顏色
  const getStatusColor = (status: TeamMember['status']) => {
    switch (status) {
      case 'active':
        return '#34C759';
      case 'inactive':
        return '#8E8E93';
      case 'on_leave':
        return '#FF9500';
      default:
        return '#8E8E93';
    }
  };

  // 狀態文字
  const getStatusText = (status: TeamMember['status']) => {
    switch (status) {
      case 'active':
        return '在職';
      case 'inactive':
        return '離職';
      case 'on_leave':
        return '請假';
      default:
        return '未知';
    }
  };

  // 角色文字
  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin':
        return '管理員';
      case 'manager':
        return '主管';
      case 'salesperson':
        return '業務';
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <Layout>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>載入團隊成員...</Text>
        </View>
      </Layout>
    );
  }

  return (
    <Layout>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* 搜尋欄 */}
        <View style={styles.searchContainer}>
          <SearchBar
            placeholder="搜尋成員姓名、電子郵件或角色..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* 統計資訊 */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{teamMembers.length}</Text>
            <Text style={styles.statLabel}>總人數</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#34C759' }]}>
              {teamMembers.filter(m => m.status === 'active').length}
            </Text>
            <Text style={styles.statLabel}>在職</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#FF9500' }]}>
              {teamMembers.filter(m => m.status === 'on_leave').length}
            </Text>
            <Text style={styles.statLabel}>請假</Text>
          </View>
        </View>

        {/* 成員列表 */}
        <View style={styles.membersList}>
          {filteredMembers.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>沒有找到成員</Text>
              <Text style={styles.emptyDescription}>
                {searchQuery ? '請嘗試其他搜尋條件' : '目前沒有團隊成員'}
              </Text>
            </View>
          ) : (
            filteredMembers.map((member) => (
              <TouchableOpacity
                key={member.id}
                style={styles.memberCard}
                activeOpacity={0.7}
                onPress={() => {
                  // TODO: 導航到成員詳情頁
                  console.log('查看成員詳情:', member.id);
                }}
              >
                <View style={styles.memberHeader}>
                  <View style={styles.memberInfo}>
                    <View style={styles.nameRow}>
                      <Text style={styles.memberName}>{member.name}</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(member.status) },
                        ]}
                      >
                        <Text style={styles.statusText}>
                          {getStatusText(member.status)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.memberRole}>{getRoleText(member.role)}</Text>
                    <Text style={styles.memberEmail}>{member.email}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      // TODO: 顯示快速操作選單
                      console.log('快速操作:', member.id);
                    }}
                  >
                    <Ionicons name="ellipsis-vertical" size={20} color="#8E8E93" />
                  </TouchableOpacity>
                </View>

                {/* 績效指標 */}
                <View style={styles.performanceRow}>
                  <View style={styles.performanceItem}>
                    <Ionicons name="calendar-outline" size={16} color="#8E8E93" />
                    <Text style={styles.performanceText}>
                      {member.performance?.meetings || 0} 會議
                    </Text>
                  </View>
                  <View style={styles.performanceItem}>
                    <Ionicons name="people-outline" size={16} color="#8E8E93" />
                    <Text style={styles.performanceText}>
                      {member.performance?.customers || 0} 客戶
                    </Text>
                  </View>
                  <View style={styles.performanceItem}>
                    <Ionicons name="trophy-outline" size={16} color="#8E8E93" />
                    <Text style={styles.performanceText}>
                      {member.performance?.deals || 0} 成交
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  membersList: {
    padding: 16,
  },
  memberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  memberInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  memberName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  memberRole: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 14,
    color: '#8E8E93',
  },
  actionButton: {
    padding: 8,
  },
  performanceRow: {
    flexDirection: 'row',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    gap: 16,
  },
  performanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  performanceText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});