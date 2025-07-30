/**
 * 團隊成員選擇器組件
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Icon } from '@/components/common/Icon';
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
  teamId: string;
  teamName?: string;
}

interface TeamMemberSelectorProps {
  value: string[];
  onChange: (selectedIds: string[]) => void;
  allowSelectAll?: boolean;
  allowTeamSelection?: boolean;
  placeholder?: string;
}

export const TeamMemberSelector: React.FC<TeamMemberSelectorProps> = ({
  value,
  onChange,
  allowSelectAll = true,
  allowTeamSelection = true,
  placeholder = '選擇團隊成員',
}) => {
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>(value);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [teams, setTeams] = useState<{ id: string; name: string; memberCount: number }[]>([]);
  
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();

  // 獲取團隊成員
  const fetchTeamMembers = async () => {
    if (!user || !currentOrganization) return;

    try {
      setLoading(true);
      
      // 獲取用戶權限上下文
      const permissionContext = await getUserPermissionContext(user.uid);
      
      // 獲取管理的團隊
      const managedTeamIds = permissionContext.managedTeamIds || [];
      if (managedTeamIds.length === 0) {
        showToast('error', '您沒有管理任何團隊');
        return;
      }

      // 查詢團隊信息
      const teamsMap = new Map<string, { name: string; memberCount: number }>();
      
      // 查詢團隊成員
      const usersRef = collection(db, 'users');
      const members: TeamMember[] = [];
      
      for (const teamId of managedTeamIds) {
        const q = query(
          usersRef,
          where('teamIds', 'array-contains', teamId),
          where('organizationId', '==', currentOrganization.id)
        );
        
        const snapshot = await getDocs(q);
        let teamMemberCount = 0;
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          members.push({
            id: doc.id,
            name: data.name || '未命名',
            email: data.email,
            role: data.role || 'salesperson',
            teamId: teamId,
            teamName: data.teamName || `團隊 ${teamId}`,
          });
          teamMemberCount++;
        });
        
        // 記錄團隊信息
        teamsMap.set(teamId, {
          name: `團隊 ${teamId}`,
          memberCount: teamMemberCount,
        });
      }
      
      // 去重（一個成員可能在多個團隊）
      const uniqueMembers = Array.from(
        new Map(members.map(m => [m.id, m])).values()
      );
      
      setTeamMembers(uniqueMembers);
      setTeams(
        Array.from(teamsMap.entries()).map(([id, info]) => ({
          id,
          name: info.name,
          memberCount: info.memberCount,
        }))
      );
    } catch (error) {
      console.error('獲取團隊成員失敗:', error);
      showToast('error', '無法載入團隊成員');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, [user, currentOrganization]);

  useEffect(() => {
    setSelectedMembers(value);
  }, [value]);

  // 切換全選
  const toggleSelectAll = () => {
    if (selectedMembers.length === teamMembers.length) {
      setSelectedMembers([]);
      onChange([]);
    } else {
      const allIds = teamMembers.map(m => m.id);
      setSelectedMembers(allIds);
      onChange(allIds);
    }
  };

  // 切換單個成員
  const toggleMember = (memberId: string) => {
    const newSelection = selectedMembers.includes(memberId)
      ? selectedMembers.filter(id => id !== memberId)
      : [...selectedMembers, memberId];
    
    setSelectedMembers(newSelection);
    onChange(newSelection);
  };

  // 切換團隊選擇
  const toggleTeam = (teamId: string) => {
    const teamMemberIds = teamMembers
      .filter(m => m.teamId === teamId)
      .map(m => m.id);
    
    const isTeamSelected = teamMemberIds.every(id => selectedMembers.includes(id));
    
    let newSelection: string[];
    if (isTeamSelected) {
      // 取消選擇整個團隊
      newSelection = selectedMembers.filter(id => !teamMemberIds.includes(id));
    } else {
      // 選擇整個團隊
      newSelection = [...new Set([...selectedMembers, ...teamMemberIds])];
    }
    
    setSelectedMembers(newSelection);
    onChange(newSelection);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#FF6B6B" />
        <Text style={styles.loadingText}>載入團隊成員...</Text>
      </View>
    );
  }

  if (teamMembers.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>沒有可選擇的團隊成員</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{placeholder}</Text>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 全選選項 */}
        {allowSelectAll && (
          <TouchableOpacity
            style={styles.selectAllItem}
            onPress={toggleSelectAll}
            activeOpacity={0.7}
          >
            <View style={styles.checkbox}>
              {selectedMembers.length === teamMembers.length ? (
                <Icon name="checkbox" size={24} color="#FF6B6B" />
              ) : (
                <Icon name="square-outline" size={24} color="#D1D5DB" />
              )}
            </View>
            <Text style={styles.selectAllText}>
              全選 ({teamMembers.length} 人)
            </Text>
          </TouchableOpacity>
        )}

        {/* 團隊選項 */}
        {allowTeamSelection && teams.length > 0 && (
          <View style={styles.teamSection}>
            <Text style={styles.sectionTitle}>按團隊選擇</Text>
            {teams.map(team => {
              const teamMemberIds = teamMembers
                .filter(m => m.teamId === team.id)
                .map(m => m.id);
              const isTeamSelected = teamMemberIds.every(id => selectedMembers.includes(id));
              
              return (
                <TouchableOpacity
                  key={team.id}
                  style={styles.teamItem}
                  onPress={() => toggleTeam(team.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.checkbox}>
                    {isTeamSelected ? (
                      <Icon name="checkbox" size={24} color="#FF6B6B" />
                    ) : (
                      <Icon name="square-outline" size={24} color="#D1D5DB" />
                    )}
                  </View>
                  <View style={styles.teamInfo}>
                    <Text style={styles.teamName}>{team.name}</Text>
                    <Text style={styles.teamMemberCount}>
                      {team.memberCount} 位成員
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* 個別成員選項 */}
        <View style={styles.memberSection}>
          <Text style={styles.sectionTitle}>個別成員</Text>
          {teamMembers.map(member => (
            <TouchableOpacity
              key={member.id}
              style={styles.memberItem}
              onPress={() => toggleMember(member.id)}
              activeOpacity={0.7}
            >
              <View style={styles.checkbox}>
                {selectedMembers.includes(member.id) ? (
                  <Icon name="checkbox" size={24} color="#FF6B6B" />
                ) : (
                  <Icon name="square-outline" size={24} color="#D1D5DB" />
                )}
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberEmail}>{member.email}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* 選擇摘要 */}
      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          已選擇 {selectedMembers.length} 位成員
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  scrollView: {
    flex: 1,
    maxHeight: 400,
  },
  selectAllItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 16,
  },
  selectAllText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 12,
  },
  teamSection: {
    marginBottom: 16,
  },
  memberSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  teamItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  teamInfo: {
    flex: 1,
    marginLeft: 12,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  teamMemberCount: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  checkbox: {
    width: 24,
    height: 24,
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  memberEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  summary: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  summaryText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});